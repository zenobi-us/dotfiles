#!/usr/bin/env -S mise x -- bun --install=fallback
// Keeps the reviewed source immutable while integrating it onto the current base.
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";

export interface IntegrationPlan {
  schema: "worktree-integration/v2";
  integration_method: "merge" | "squash";
  reviewed_source_commit: string;
  reviewed_source_tree: string;
  base_branch: string;
  base_before: string;
  expected_merge_tree: string;
}
export interface IntegrationCheck { argv: string[] }
const oid = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

async function run(exec: Exec, repository: string, args: string[]): Promise<string> {
  const result = await exec("git", ["-C", repository, ...args]);
  if (result.code !== 0) throw new Error(`git ${args[0]} failed (${result.code}): ${result.stdout}`);
  return result.stdout.trim();
}
function validatePlan(plan: IntegrationPlan): void {
  if (plan.schema !== "worktree-integration/v2" || !["merge", "squash"].includes(plan.integration_method)) throw new Error("Expected a worktree-integration/v2 merge or squash plan.");
  for (const key of ["reviewed_source_commit", "reviewed_source_tree", "base_before", "expected_merge_tree"] as const) {
    if (!oid.test(plan[key])) throw new Error(`Invalid integration ${key}.`);
  }
  if (!plan.base_branch || plan.base_branch.startsWith("-")) throw new Error("An exact base branch is required.");
}

export async function prepareIntegration(repository: string, source: string, baseBranch: string, method: "merge" | "squash", exec: Exec): Promise<IntegrationPlan> {
  if (!oid.test(source)) throw new Error("Use the exact reviewed source commit, not a moving ref.");
  if (!baseBranch || baseBranch.startsWith("-")) throw new Error("An exact base branch is required.");
  await run(exec, repository, ["check-ref-format", "--branch", baseBranch]);
  const base = await run(exec, repository, ["rev-parse", "--verify", `refs/heads/${baseBranch}^{commit}`]);
  const tree = await run(exec, repository, ["rev-parse", "--verify", `${source}^{tree}`]);
  const expected = (await run(exec, repository, ["merge-tree", "--write-tree", base, source])).split("\n")[0]!;
  const plan: IntegrationPlan = { schema: "worktree-integration/v2", integration_method: method, reviewed_source_commit: source, reviewed_source_tree: tree, base_branch: baseBranch, base_before: base, expected_merge_tree: expected };
  validatePlan(plan);
  return plan;
}

export async function verifyIntegration(repository: string, plan: IntegrationPlan, commit: string, exec: Exec): Promise<void> {
  validatePlan(plan);
  if (!oid.test(commit)) throw new Error("An exact integration commit is required.");
  const sourceTree = await run(exec, repository, ["rev-parse", "--verify", `${plan.reviewed_source_commit}^{tree}`]);
  const expected = (await run(exec, repository, ["merge-tree", "--write-tree", plan.base_before, plan.reviewed_source_commit])).split("\n")[0];
  const tree = await run(exec, repository, ["rev-parse", "--verify", `${commit}^{tree}`]);
  const parents = (await run(exec, repository, ["show", "-s", "--format=%P", commit])).split(/\s+/);
  const wanted = plan.integration_method === "merge" ? [plan.base_before, plan.reviewed_source_commit] : [plan.base_before];
  if (sourceTree !== plan.reviewed_source_tree || expected !== plan.expected_merge_tree || tree !== expected || parents.length !== wanted.length || parents.some((parent, index) => parent !== wanted[index])) throw new Error("Integration does not match the reviewed source, current base, expected tree and selected parent shape.");
}

/** The shared Git directory coordinates all local checkouts, not just one initiative. */
export async function withIntegrationReservation<T>(repository: string, baseBranch: string, exec: Exec, operation: () => Promise<T>): Promise<T> {
  const common = await run(exec, repository, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  const directory = join(common, "worktree-integration");
  await mkdir(directory, { recursive: true });
  const lock = join(directory, createHash("sha256").update(baseBranch).digest("hex") + ".lock");
  try { await mkdir(lock); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    throw new Error(`Integration is reserved for ${baseBranch}. Inspect ${join(lock, "owner.json")} and owner liveness; do not remove or take over a live reservation.`);
  }
  try {
    await writeFile(join(lock, "owner.json"), JSON.stringify({ pid: process.pid, created_at: new Date().toISOString(), repository, base_branch: baseBranch }));
    return await operation();
  } finally { await rm(lock, { recursive: true }); }
}

export async function applyIntegration(repository: string, sourceWorkspace: string, plan: IntegrationPlan, checks: IntegrationCheck[], message: string, exec: Exec, publication?: { remote: string; ref: string }): Promise<Record<string, unknown>> {
  validatePlan(plan);
  if (!message.trim() || !Array.isArray(checks) || checks.length === 0 || checks.some(check => !check || !Array.isArray(check.argv) || check.argv.length === 0 || check.argv.some(arg => typeof arg !== "string" || arg.includes("\0")))) throw new Error("A reviewed commit message and at least one explicit argv validation command are required.");
  if (publication && (!publication.remote || publication.remote.startsWith("-") || !publication.ref.startsWith("refs/heads/"))) throw new Error("Publication requires an exact remote and branch ref.");
  return withIntegrationReservation(repository, plan.base_branch, exec, async () => {
    const ensureInputs = async () => {
      const [base, source, dirty, sourceCommon, baseCommon] = await Promise.all([
        run(exec, repository, ["rev-parse", `refs/heads/${plan.base_branch}`]),
        run(exec, sourceWorkspace, ["rev-parse", "HEAD"]),
        run(exec, sourceWorkspace, ["status", "--porcelain=v1"]),
        run(exec, sourceWorkspace, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
        run(exec, repository, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
      ]);
      if (await realpath(sourceCommon) !== await realpath(baseCommon) || source !== plan.reviewed_source_commit || dirty) throw new Error("The reviewed source changed, is dirty, or belongs to another repository. Review changed source before integration.");
      if (base !== plan.base_before) throw new Error("Base advanced. Prepare and validate a new integration candidate; the unchanged source review remains valid.");
    };
    await ensureInputs();
    const recomputed = await prepareIntegration(repository, plan.reviewed_source_commit, plan.base_branch, plan.integration_method, exec);
    for (const key of Object.keys(recomputed) as (keyof IntegrationPlan)[]) if (recomputed[key] !== plan[key]) throw new Error("Prepared integration inputs or expected tree changed.");
    // Squash does not retain source ancestry; keep its review objects through local GC.
    const reviewedSourceRef = plan.integration_method === "squash" ? `refs/worktree-reviews/${plan.reviewed_source_commit}` : undefined;
    if (reviewedSourceRef) {
      const retained = await exec("git", ["-C", repository, "show-ref", "--verify", "--quiet", reviewedSourceRef]);
      if (retained.code === 1) await run(exec, repository, ["update-ref", reviewedSourceRef, plan.reviewed_source_commit, "0".repeat(plan.reviewed_source_commit.length)]);
      else if (retained.code !== 0 || await run(exec, repository, ["rev-parse", reviewedSourceRef]) !== plan.reviewed_source_commit) throw new Error("The retained reviewed-source ref is inconsistent. Preserve it and reconcile before integration.");
    }
    const parents = ["-p", plan.base_before, ...(plan.integration_method === "merge" ? ["-p", plan.reviewed_source_commit] : [])];
    const candidate = await run(exec, repository, ["commit-tree", plan.expected_merge_tree, ...parents, "-m", message]);
    const branch = `integration/${randomUUID()}`;
    const created = await exec("wt", ["-C", repository, "switch", "--create", branch, "--base", candidate, "--no-cd", "--no-hooks"]);
    if (created.code !== 0) throw new Error(`Candidate creation failed; preserve ${candidate}: ${created.stdout}`);
    const listing = await exec("wt", ["-C", repository, "--config-set", "list.full=false", "--config-set", "list.summary=false", "list", "--format=json"]);
    if (listing.code !== 0) throw new Error(`Cannot inventory candidate ${branch}: ${listing.stdout}`);
    const inventory = JSON.parse(listing.stdout);
    const rows = Array.isArray(inventory) ? inventory : inventory.schema === 2 ? inventory.items : undefined;
    if (!Array.isArray(rows)) throw new Error("Worktrunk returned an unsupported candidate inventory.");
    const row = rows.find(item => item.branch === branch);
    const workspace = row?.worktree?.path ?? row?.path;
    if (typeof workspace !== "string" || !workspace) throw new Error(`Cannot locate candidate ${branch}; preserve it for recovery.`);
    const validation: Record<string, unknown>[] = [];
    try {
      const target = rows.find(item => item.branch === plan.base_branch);
      const targetPath = target?.worktree?.path ?? target?.path;
      // Forced bindings stay out of {{ args }} even when a hook does not use target.
      const hookArgs = ["-C", workspace, "hook", "pre-merge", "--var", `target=${plan.base_branch}`, ...(typeof targetPath === "string" ? ["--var", `target_worktree_path=${targetPath}`] : [])];
      const hooks = await exec("wt", hookArgs, workspace);
      validation.push({ argv: ["wt", ...hookArgs], cwd: workspace, exit_code: hooks.code, output: hooks.stdout, source_commit: candidate, source_tree: plan.expected_merge_tree });
      if (hooks.code !== 0) throw new Error(`Pre-merge hooks failed or require approval: ${hooks.stdout}`);
      for (const check of checks) {
        const result = await exec(check.argv[0]!, check.argv.slice(1), workspace);
        validation.push({ argv: check.argv, cwd: workspace, exit_code: result.code, output: result.stdout, source_commit: candidate, source_tree: plan.expected_merge_tree });
        if (result.code !== 0) throw new Error(`Integration validation failed: ${check.argv.join(" ")}`);
      }
      if (await run(exec, workspace, ["status", "--porcelain=v1"])) throw new Error("Validation changed the candidate workspace. Preserve it and inspect the changes.");
      const [candidateHead, candidateTree, candidateBranch, candidateCommon, repositoryCommon] = await Promise.all([
        run(exec, workspace, ["rev-parse", "HEAD"]), run(exec, workspace, ["rev-parse", "HEAD^{tree}"]),
        run(exec, workspace, ["symbolic-ref", "--short", "HEAD"]),
        run(exec, workspace, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
        run(exec, repository, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
      ]);
      if (candidateHead !== candidate || candidateTree !== plan.expected_merge_tree || candidateBranch !== branch || await realpath(candidateCommon) !== await realpath(repositoryCommon)) throw new Error("Validation changed the candidate HEAD, tree, branch or repository. Preserve it; base was not integrated.");
      await ensureInputs();
      await verifyIntegration(repository, plan, candidate, exec);
      const merged = await exec("wt", ["-C", workspace, "--config-set", "merge.ff=true", "merge", plan.base_branch, "--no-commit", "--no-rebase", "--no-remove", "--no-hooks", "--format=json"]);
      if (merged.code !== 0) throw new Error(`Worktrunk integration stopped: ${merged.stdout}. Inspect the actual base before retrying.`);
      if (await run(exec, repository, ["rev-parse", `refs/heads/${plan.base_branch}`]) !== candidate) throw new Error("Worktrunk did not install the exact validated candidate. Inspect actual integration before retrying.");
      await verifyIntegration(repository, plan, candidate, exec);
      const publicationResult = publication ? await publishVerifiedIntegration(repository, candidate, publication, exec) : undefined;
      return { ...plan, merged_commit: candidate, merged_tree: plan.expected_merge_tree, merged_parents: plan.integration_method === "merge" ? [plan.base_before, plan.reviewed_source_commit] : [plan.base_before], validation_results: validation, candidate_branch: branch, candidate_workspace: workspace, pushed: Boolean(publication), ...(reviewedSourceRef ? { reviewed_source_ref: reviewedSourceRef } : {}), ...publicationResult };
    } catch (error) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}\nRetained candidate ${candidate}, branch ${branch}, workspace ${workspace}. Validation: ${JSON.stringify(validation)}`);
    }
  });
}

export async function publishIntegration(repository: string, plan: IntegrationPlan, commit: string, publication: { remote: string; ref: string }, exec: Exec): Promise<Record<string, unknown>> {
  return withIntegrationReservation(repository, plan.base_branch, exec, async () => {
    await verifyIntegration(repository, plan, commit, exec);
    await run(exec, repository, ["merge-base", "--is-ancestor", commit, `refs/heads/${plan.base_branch}`]);
    return publishVerifiedIntegration(repository, commit, publication, exec);
  });
}

async function publishVerifiedIntegration(repository: string, commit: string, publication: { remote: string; ref: string }, exec: Exec): Promise<Record<string, unknown>> {
  if (!publication.remote || publication.remote.startsWith("-") || !publication.ref.startsWith("refs/heads/")) throw new Error("Publication requires an exact remote and branch ref.");
  await run(exec, repository, ["check-ref-format", publication.ref]);
  const observe = async (): Promise<string | undefined> => {
    const observed = (await run(exec, repository, ["ls-remote", "--heads", publication.remote, publication.ref])).split(/\s+/)[0];
    if (!observed) return undefined;
    if (!oid.test(observed)) throw new Error("The remote branch tip could not be verified; reconcile without merging again.");
    const object = await exec("git", ["-C", repository, "cat-file", "-e", `${observed}^{commit}`]);
    if (object.code !== 0) await run(exec, repository, ["fetch", "--no-tags", publication.remote, publication.ref]);
    return observed;
  };
  let observed = await observe();
  if (observed) {
    const reachable = await exec("git", ["-C", repository, "merge-base", "--is-ancestor", commit, observed]);
    if (reachable.code === 0) return { pushed: true, already_published: true, remote_observed_commit: observed, integration_reachable: true };
    if (reachable.code !== 1) throw new Error(`Remote ancestry verification failed: ${reachable.stdout}`);
  }
  const pushed = await exec("git", ["-C", repository, "push", publication.remote, `${commit}:${publication.ref}`]);
  if (pushed.code !== 0) throw new Error(`Integration exists locally; publication failed. Preserve ${commit} and reconcile without merging again: ${pushed.stdout}`);
  observed = await observe();
  if (!observed) throw new Error("Publication succeeded but its remote branch is unavailable; reconcile without merging again.");
  await run(exec, repository, ["merge-base", "--is-ancestor", commit, observed]);
  return { pushed: true, already_published: false, remote_observed_commit: observed, integration_reachable: true };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (name: string): string => { const index = args.indexOf(name); if (index < 0 || !args[index + 1] || args[index + 1]!.startsWith("--")) throw new Error(`Missing ${name}.`); return args[index + 1]!; };
  try {
    if (args.includes("--help") || args.length === 0) {
      console.log("integration.ts prepare --source <reviewed-sha> --base <branch> [--method merge|squash]\nintegration.ts apply --input <plan.json> --source-workspace <path> --checks <argv-checks.json> --message <message-file> [--remote <remote> --remote-ref refs/heads/<branch>]\nintegration.ts publish --input <plan.json> --commit <sha> --remote <remote> --remote-ref refs/heads/<branch>\nintegration.ts verify --input <plan.json> --commit <sha>\nRun from the repository. The caller validates review, ownership and receipt authorization before apply or publish. Candidate workspaces remain for scoped cleanup.");
    } else {
      const exec: Exec = async (command, argv, cwd) => {
        const child = Bun.spawn([command, ...argv], { cwd, stdout: "pipe", stderr: "pipe" });
        const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
        return { code, stdout: code ? `${stdout}\n${stderr}` : stdout };
      };
      const repository = process.cwd();
      if (args[0] === "prepare") {
        const method = args.includes("--method") ? flag("--method") : "merge";
        if (method !== "merge" && method !== "squash") throw new Error("--method must be merge or squash.");
        console.log(JSON.stringify(await prepareIntegration(repository, flag("--source"), flag("--base"), method, exec), null, 2));
      } else {
        const plan = JSON.parse(await readFile(flag("--input"), "utf8")) as IntegrationPlan;
        if (args[0] === "verify") { await verifyIntegration(repository, plan, flag("--commit"), exec); console.log(JSON.stringify({ valid: true })); }
        else if (args[0] === "publish") console.log(JSON.stringify(await publishIntegration(repository, plan, flag("--commit"), { remote: flag("--remote"), ref: flag("--remote-ref") }, exec), null, 2));
        else if (args[0] === "apply") console.log(JSON.stringify(await applyIntegration(repository, flag("--source-workspace"), plan, JSON.parse(await readFile(flag("--checks"), "utf8")), await readFile(flag("--message"), "utf8"), exec, args.includes("--remote") ? { remote: flag("--remote"), ref: flag("--remote-ref") } : undefined), null, 2));
        else throw new Error("Expected prepare, apply, publish or verify.");
      }
    }
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
