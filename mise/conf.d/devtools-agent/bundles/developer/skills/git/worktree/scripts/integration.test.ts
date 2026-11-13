import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyIntegration, prepareIntegration, publishIntegration, verifyIntegration, withIntegrationReservation } from "./integration";
import { validateReceiptContract } from "./receipt-contract";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
const exec: Exec = async (command, argv, cwd) => {
  const child = Bun.spawn([command, ...argv], { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" } });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { code, stdout: code ? `${stdout}\n${stderr}` : stdout };
};
async function git(repo: string, ...args: string[]): Promise<string> {
  const result = await exec("git", ["-C", repo, ...args]);
  if (result.code) throw new Error(result.stdout);
  return result.stdout.trim();
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "worktree-integration-")); roots.push(root);
  const repo = join(root, "repo"); await mkdir(repo);
  await git(repo, "init", "--quiet", "-b", "main");
  await git(repo, "config", "user.name", "Integration Tests");
  await git(repo, "config", "user.email", "integration@example.invalid");
  await git(repo, "config", "commit.gpgsign", "false");
  await git(repo, "config", "core.hooksPath", "/dev/null");
  await writeFile(join(repo, "first.txt"), "original\n");
  await writeFile(join(repo, "second.txt"), "original\n");
  await git(repo, "add", "."); await git(repo, "commit", "--quiet", "-m", "initial");
  const initial = await git(repo, "rev-parse", "HEAD");
  await git(repo, "switch", "-c", "feature/A");
  await writeFile(join(repo, "first.txt"), "reviewed A\n");
  await git(repo, "add", "."); await git(repo, "commit", "--quiet", "-m", "A");
  const source = await git(repo, "rev-parse", "HEAD");
  await git(repo, "switch", "main");
  return { root, repo, initial, source };
}

test("base advancement preserves the reviewed source and combines independent initiative changes", async () => {
  const { repo, source } = await fixture();
  await writeFile(join(repo, "second.txt"), "accepted B\n");
  await git(repo, "add", "."); await git(repo, "commit", "--quiet", "-m", "B");
  for (const method of ["merge", "squash"] as const) {
    const plan = await prepareIntegration(repo, source, "main", method, exec);
    const parents = ["-p", plan.base_before, ...(method === "merge" ? ["-p", source] : [])];
    const commit = await git(repo, "commit-tree", plan.expected_merge_tree, ...parents, "-m", "integrate A");
    await verifyIntegration(repo, plan, commit, exec);
    expect(await git(repo, "show", `${commit}:first.txt`)).toBe("reviewed A");
    expect(await git(repo, "show", `${commit}:second.txt`)).toBe("accepted B");
    expect(await git(repo, "rev-parse", "feature/A")).toBe(source);
    await expect(verifyIntegration(repo, { ...plan, expected_merge_tree: plan.reviewed_source_tree }, commit, exec)).rejects.toThrow("Integration does not match");
  }
});

test("product conflicts stop candidate preparation before base mutation", async () => {
  const { repo, source } = await fixture();
  await writeFile(join(repo, "first.txt"), "incompatible B\n");
  await git(repo, "add", "."); await git(repo, "commit", "--quiet", "-m", "conflicting B");
  const before = await git(repo, "rev-parse", "main");
  await expect(prepareIntegration(repo, source, "main", "merge", exec)).rejects.toThrow("merge-tree failed");
  expect(await git(repo, "rev-parse", "main")).toBe(before);
  expect(await git(repo, "rev-parse", "feature/A")).toBe(source);
});

test("target reservations exclude competing integration but release after failure", async () => {
  const { repo } = await fixture();
  await withIntegrationReservation(repo, "main", exec, async () => {
    await expect(withIntegrationReservation(repo, "main", exec, async () => 2)).rejects.toThrow("Integration is reserved");
    expect(await withIntegrationReservation(repo, "release", exec, async () => 3)).toBe(3);
  });
  await expect(withIntegrationReservation(repo, "main", exec, async () => { throw new Error("validation failed"); })).rejects.toThrow("validation failed");
  expect(await withIntegrationReservation(repo, "main", exec, async () => 4)).toBe(4);
});

test("v2 published receipts require checks bound to the actual integration and preserve v1", () => {
  const source = "1".repeat(40), base = "2".repeat(40), merged = "3".repeat(40), tree = "4".repeat(40);
  const receipt = { schema: "worktree-receipt/v2", phase: "finish", status: "FINISHED", source_commit: source, source_tree: tree, reviewed_source_commit: source, reviewed_source_tree: tree, review_receipt: "review-1", base_before: base, expected_merge_tree: tree, integration_method: "merge", merged_commit: merged, merged_tree: tree, merged_parents: [base, source], candidate_branch: "integration/test", candidate_workspace: "/candidate", remote: "origin", remote_ref: "refs/heads/main", pushed: true, ticket_completed: true, worktree_removed: true, workspace_closed: true, validation_results: [{ argv: ["bun", "test"], cwd: "/candidate", exit_code: 0, source_commit: merged, source_tree: tree }] };
  validateReceiptContract(receipt);
  expect(() => validateReceiptContract({ ...receipt, validation_results: [{ ...receipt.validation_results[0], source_commit: source }] })).toThrow("exact integration");
  expect(() => validateReceiptContract({ ...receipt, integration_method: "squash" })).toThrow("parents");
  expect(() => validateReceiptContract({ ...receipt, workspace_closed: undefined })).toThrow("workspace_closed");
  expect(() => validateReceiptContract({ ...receipt, merged_commit: undefined })).toThrow("merged_commit");
  validateReceiptContract({ schema: "worktree-receipt/v1" });
});

test.each(["merge", "squash"] as const)("actual Worktrunk %s integration preserves reviewed source on a moving base", async (method) => {
  const { root, repo, source } = await fixture();
  const config = join(root, "wt.toml"); await writeFile(config, 'pre-merge = "test {{ args | length }} -eq 0"\n[merge]\nff = false\n');
  const isolatedExec: Exec = (command, argv, cwd) => exec(command, command === "wt" ? ["--config", config, ...argv] : argv, cwd);
  const checked = await isolatedExec("wt", ["-C", repo, "switch", "feature/A", "--no-cd", "--no-hooks"]);
  if (checked.code) throw new Error(checked.stdout);
  const list = await isolatedExec("wt", ["-C", repo, "list", "--format=json"]);
  const inventory = JSON.parse(list.stdout); const rows = Array.isArray(inventory) ? inventory : inventory.items;
  const row = rows.find((item: { branch: string }) => item.branch === "feature/A");
  const sourceWorkspace = row.worktree?.path ?? row.path;
  await writeFile(join(repo, "second.txt"), "accepted B\n"); await git(repo, "add", "."); await git(repo, "commit", "--quiet", "-m", "B");
  const plan = await prepareIntegration(repo, source, "main", method, isolatedExec);
  const incompatibleConsumer = [{ argv: [process.execPath, "-e", 'const producer=await Bun.file("first.txt").text(); const consumer=await Bun.file("second.txt").text(); if(producer!==consumer)process.exit(1);'] }];
  await expect(applyIntegration(repo, sourceWorkspace, plan, incompatibleConsumer, "test: reject incompatible T-A consumer", isolatedExec)).rejects.toThrow("Integration validation failed");
  expect(await git(repo, "rev-parse", "main")).toBe(plan.base_before);
  expect(await git(repo, "rev-parse", "feature/A")).toBe(source);
  await expect(applyIntegration(repo, sourceWorkspace, plan, [{ argv: ["git", "commit", "--allow-empty", "-m", "unexpected validation commit"] }], "test: reject changed T-A candidate", isolatedExec)).rejects.toThrow("Validation changed the candidate HEAD");
  expect(await git(repo, "rev-parse", "main")).toBe(plan.base_before);
  expect(await git(repo, "rev-parse", "feature/A")).toBe(source);
  const result = await applyIntegration(repo, sourceWorkspace, plan, [{ argv: [process.execPath, "-e", 'const a=await Bun.file("first.txt").text(); const b=await Bun.file("second.txt").text(); if(a!=="reviewed A\\n"||b!=="accepted B\\n")process.exit(1);'] }], "feat: integrate T-A reviewed change", isolatedExec);
  expect(await git(repo, "rev-parse", "main")).toBe(String(result.merged_commit));
  expect(await git(repo, "rev-parse", "feature/A")).toBe(source);
  expect(await readFile(join(repo, "first.txt"), "utf8")).toBe("reviewed A\n");
  await verifyIntegration(repo, plan, String(result.merged_commit), isolatedExec);
  const remote = join(root, "remote.git");
  const initialized = await exec("git", ["init", "--bare", "--quiet", "-b", "main", remote]);
  if (initialized.code) throw new Error(initialized.stdout);
  await git(repo, "remote", "add", "origin", remote);
  await git(repo, "push", "origin", `${plan.base_before}:refs/heads/main`);
  const publication = await publishIntegration(repo, plan, String(result.merged_commit), { remote: "origin", ref: "refs/heads/main" }, isolatedExec);
  expect(publication).toMatchObject({ pushed: true, already_published: false, integration_reachable: true });
  const recovered = await publishIntegration(repo, plan, String(result.merged_commit), { remote: "origin", ref: "refs/heads/main" }, isolatedExec);
  expect(recovered).toMatchObject({ pushed: true, already_published: true, integration_reachable: true });
  expect(await git(repo, "rev-parse", "main")).toBe(String(result.merged_commit));
  if (method === "squash") {
    const sharedReview = await exec("git", ["-C", sourceWorkspace, "rev-parse", "--verify", String(result.reviewed_source_ref)]);
    if (sharedReview.code !== 0) throw new Error(sharedReview.stdout);
    expect(sharedReview.stdout.trim()).toBe(source);
    const removed = await isolatedExec("wt", ["-C", repo, "remove", "feature/A", "--foreground", "--no-hooks"]);
    if (removed.code !== 0) throw new Error(removed.stdout);
    await git(repo, "reflog", "expire", "--expire=now", "--all");
    await git(repo, "gc", "--prune=now");
    expect(await git(repo, "rev-parse", `${source}^{tree}`)).toBe(plan.reviewed_source_tree);
    await verifyIntegration(repo, plan, String(result.merged_commit), isolatedExec);
  }
}, 60_000);
