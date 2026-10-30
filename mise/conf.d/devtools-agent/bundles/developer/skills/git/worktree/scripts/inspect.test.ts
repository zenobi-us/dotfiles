// Uses disposable Git repositories; inspection itself must not write workflow or source state.
import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectTicket } from "./inspect";
import { loadTicketWorkflow } from "./workflow";
import { recoveryDecision } from "./recovery";
import { inspectWorkflow } from "./inspection";
import type { Exec, SharedAgentContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { ExplorerTicket, TicketWorkflow } from "../../../../../agent-core/extensions/pi-shared-context/model";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const exec: Exec = async (command, args, cwd) => {
  const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout: code ? `${stdout}\n${stderr}` : stdout, code };
};
async function run(command: string, args: string[]): Promise<string> {
  const result = await exec(command, args);
  if (result.code) throw new Error(result.stdout);
  return result.stdout.trim();
}
async function put(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "worktree-inspect-"));
  directories.push(root);
  const repositoryRoot = join(root, "repo");
  await run("git", ["init", "--quiet", "-b", "main", repositoryRoot]);
  await run("git", ["-C", repositoryRoot, "config", "user.name", "Fixture"]);
  await run("git", ["-C", repositoryRoot, "config", "user.email", "fixture@example.invalid"]);
  await put(join(repositoryRoot, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
  await put(join(repositoryRoot, "tracker/tickets/T-1.md"), "---\nid: T-1\ntitle: Recover ticket\nwork_status: open\nblocked_by: []\n---\n");
  await run("git", ["-C", repositoryRoot, "add", "."]);
  await run("git", ["-C", repositoryRoot, "commit", "-m", "Initial tracker"]);
  const context: SharedAgentContext = {
    repositoryRoot, origin: "https://github.com/example/inspection-fixture.git", canonicalOrigin: "github.com/example/inspection-fixture", slug: "inspection-fixture", root: repositoryRoot, sharedRoot: repositoryRoot, candidateSharedRoot: join(root, "shared"), alignmentRoot: repositoryRoot, storage: "repository", mode: "repository",
    layout: { tracker: "tracker", tickets: "tracker/tickets", initiatives: "tracker/initiatives", sources: "sources" },
    routes: { alignment: { adapter: "markdown", store: "repository" }, tickets: { adapter: "local-markdown", store: "repository" }, initiatives: { adapter: "markdown", store: "repository" }, workflows: { adapter: "files", store: "repository" }, evidence: { adapter: "files", inherits: "workflows" }, sources: { adapter: "files", inherits: "alignment" } },
  };
  const ticket: ExplorerTicket = { id: "T-1", title: "Recover ticket", ref: "tracker/tickets/T-1.md", backend: "local-markdown", status: "open", blockedBy: [], body: "" };
  return { root, context, ticket };
}

test("canonical CLI inspection resolves the current adapter and prints real JSON without editing tracked state", async () => {
  const { context, root, ticket } = await fixture();
  await run("git", ["-C", context.repositoryRoot, "remote", "add", "origin", `https://github.com/example/${root.split("/").at(-1)}.git`]);
  const inventory: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) } : exec(command, args, cwd);
  const result = await inspectTicket(ticket.ref, inventory, context.repositoryRoot);
  expect(result.ticket.ref).toBe(ticket.ref);
  expect(result.workflow.inspection?.historyValid).toBe(true);
  expect(result.decision.action).toBe("start");
  await expect(inspectTicket("T-1", inventory, context.repositoryRoot)).rejects.toThrow("canonical reference");
  const status = await run("git", ["-C", context.repositoryRoot, "status", "--porcelain=v1"]);
  for (const script of ["inspect.ts", "router.ts"]) {
    const path = fileURLToPath(new URL(script, import.meta.url));
    const args = script === "router.ts" ? ["inspect", ticket.ref, "--json"] : [ticket.ref, "--json"];
    const child = Bun.spawn([process.execPath, path, ...args], { cwd: context.repositoryRoot, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    if (code) throw new Error(stderr || stdout);
    const json = JSON.parse(stdout);
    expect(json.ticket.ref).toBe(ticket.ref);
    expect(json.decision).toMatchObject({ action: "start" });
    expect(await run("git", ["-C", context.repositoryRoot, "status", "--porcelain=v1"])).toBe(status);
  }
}, 60_000);

test("removed source permits finish recovery only after exact squash mapping and remote reachability", async () => {
  const { context, ticket, root } = await fixture();
  const git = (...args: string[]) => run("git", ["-C", context.repositoryRoot, ...args]);
  const base = await git("rev-parse", "HEAD");
  const source = join(root, "source");
  await git("worktree", "add", "-b", "feature/T-1", source, "main");
  await put(join(source, "product.ts"), "export const product = 1;\n");
  await run("git", ["-C", source, "add", "product.ts"]);
  await run("git", ["-C", source, "commit", "-m", "T-1 implement product"]);
  const sourceCommit = await run("git", ["-C", source, "rev-parse", "HEAD"]);
  const sourceTree = await run("git", ["-C", source, "rev-parse", "HEAD^{tree}"]);
  await git("merge", "--squash", "feature/T-1");
  await git("commit", "-m", "T-1 integrate reviewed product");
  const merged = await git("rev-parse", "HEAD");
  const mergedTree = await git("rev-parse", "HEAD^{tree}");
  const remote = join(root, "remote.git");
  await run("git", ["init", "--quiet", "--bare", remote]);
  await git("remote", "add", "origin", remote);
  await git("push", "origin", "main");
  await git("worktree", "remove", source);
  ticket.status = "completed";
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, attempt: 1, repository: context.repositoryRoot, worktree: source, workspace_path: source,
    source_commit: sourceCommit, source_tree: sourceTree, source_branch: "feature/T-1", base_branch: "main", muxer: "hrdx", pane_id: "1", agent: "pi", session_id: null,
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root: context.repositoryRoot, store: "repository", ref: "workflows/T-1" }, evidence: { store: "repository", ref: "workflows/T-1/artifacts/evidence/run-1" }, inputs: [], outputs: [],
  };
  const review = { ...common, receipt_id: "review-2", parent_receipt: null, phase: "review", status: "completed", verdict: "SUCCESS", created_at: "2026-10-01T00:00:00Z", outputs: [{ kind: "review-artifact", ref: "workflows/T-1/artifacts/reviews/review-2.md" }] };
  const finish = { ...common, receipt_id: "finish-3", parent_receipt: "review-2", phase: "finish", status: "FINISHED", pane_id: null, created_at: "2026-10-02T00:00:00Z", merged_commit: merged, merged_tree: mergedTree, base_before: base, expected_merge_tree: mergedTree, reviewed_source_commit: sourceCommit, reviewed_source_tree: sourceTree, review_receipt: "review-2", remote: "origin", remote_ref: "refs/heads/main", pushed: true, ticket_completed: true, worktree_removed: true, workspace_closed: true };
  await put(join(context.repositoryRoot, "workflows/T-1/events/review.json"), JSON.stringify(review));
  await put(join(context.repositoryRoot, "workflows/T-1/events/finish.json"), JSON.stringify(finish));
  await put(join(context.repositoryRoot, "workflows/T-1/artifacts/reviews/review-2.md"), `# Review\n\nReviewed ${sourceCommit}. SUCCESS.\n`);
  const readOnly: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: context.repositoryRoot } }] }) } : exec(command, args, cwd);
  let workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.error).toBeUndefined();
  expect(workflow.sourceCommit).toBeUndefined();
  expect(workflow.inspection).toMatchObject({ historyValid: true, source: { state: "missing" }, finishIntegrated: true, finishVerified: true });
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ mode: "complete" });
  await put(join(context.repositoryRoot, "workflows/T-1/events/finish.json"), JSON.stringify({ ...finish, expected_merge_tree: "f".repeat(40) }));
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.finishVerified).not.toBe(true);
  expect(workflow.inspection?.finishError).toContain("base parent and expected merge tree");
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ action: "finish", mode: "reconcile", requiredApproval: true });
});

test("branch-only and ambiguous inventory remain explicit recovery inputs", async () => {
  const { context, ticket } = await fixture();
  for (const items of [[{ branch: "feature/T-1" }], [{ branch: "feature/T-1-a" }, { branch: "fix/T-1-b" }]]) {
    const inventory: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items }) } : exec(command, args, cwd);
    const workflow = await loadTicketWorkflow(context, ticket, inventory);
    expect(workflow.inspection?.source.candidates).toBe(items.length);
    expect(workflow.inspection?.source.error).toBeDefined();
    expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
  }
});

test("submission verification requires the exact PR head, base and non-closed publication", async () => {
  const { context, ticket } = await fixture();
  const commit = await run("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD^{tree}"]);
  const workflow: TicketWorkflow = {
    ticketId: ticket.id, receipts: [{
      id: "submit-1", ref: "workflows/T-1/events/submit-1.json", workflowId: ticket.id,
      phase: "submit", status: "completed", sourceCommit: commit, sourceTree: tree,
      sourceBranch: "main", baseBranch: "release", workspacePath: context.repositoryRoot,
      createdAt: "2026-10-01T00:00:00Z", outputs: [], fields: {}, body: "",
    }]
  };
  let pullRequest = { url: "https://github.com/example/inspection-fixture/pull/1", headRefOid: commit, headRefName: "main", baseRefName: "other", state: "OPEN" };
  const observed: Exec = async (command, args, cwd) => {
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) };
    if (command === "gh") return { code: 0, stdout: JSON.stringify([pullRequest]) };
    if (command === "git" && args.includes("ls-remote")) return { code: 0, stdout: `${commit}\trefs/heads/main\n` };
    return exec(command, args, cwd);
  };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(false);
  pullRequest = { ...pullRequest, baseRefName: "release", state: "CLOSED" };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(false);
  pullRequest = { ...pullRequest, state: "OPEN", headRefName: "other" };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(false);
  pullRequest = { ...pullRequest, headRefName: "main" };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(true);
});
