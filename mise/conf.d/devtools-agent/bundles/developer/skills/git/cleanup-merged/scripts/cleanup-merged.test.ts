// Uses disposable Git repositories built by fixture.ts. Requires git and wt on PATH.
import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findCandidates, removeBranches, sessionStart } from "./cleanup-merged.ts";
import { makeFixture } from "./fixture.ts";

const directories: string[] = [];
const children: Bun.Subprocess[] = [];
afterEach(async () => {
  for (const child of children.splice(0)) child.kill();
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

async function scratch(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "cleanup-merged-"));
  directories.push(path);
  return path;
}

async function branches(repo: string): Promise<string[]> {
  const out = await new Response(Bun.spawn(["git", "-C", repo, "branch", "--format=%(refname:short)"], { stdout: "pipe" }).stdout).text();
  return out.trim().split("\n").sort();
}

test("lists only integrated branches and keeps the age guard by default", async () => {
  const { repo } = await makeFixture(await scratch());
  const result = await findCandidates(repo);
  expect(result.removable.map(item => item.branch)).toEqual(["feat/branch-only"]);
  expect(result.target).toBe("main");
});

test("keeps an integrated worktree while a process runs inside it", async () => {
  const { repo, worktrees } = await makeFixture(await scratch());
  const child = Bun.spawn(["sleep", "30"], { cwd: join(worktrees, "squash-done") });
  children.push(child);
  const result = await findCandidates(repo, { minAge: "0s" });
  expect(result.removable.map(item => item.branch)).not.toContain("feat/squash-done");
  expect(result.kept).toContainEqual(expect.objectContaining({ branch: "feat/squash-done", reason: expect.stringContaining("process") }));
  const kept = result.kept.find(item => item.branch === "feat/squash-done")!;
  expect(kept.reason).toContain(`PID ${child.pid}`);
  expect(kept.processes).toContainEqual(expect.objectContaining({
    pid: child.pid, command: "sleep", cwd: join(worktrees, "squash-done"),
    startTicks: expect.stringMatching(/^\d+$/), bootId: expect.any(String),
  }));
  const removal = await removeBranches(repo, ["feat/squash-done"], { minAge: "0s" });
  expect(removal.removed).toEqual([]);
  expect(removal.refused).toContainEqual(expect.objectContaining({ branch: "feat/squash-done", processes: expect.arrayContaining([expect.objectContaining({ pid: child.pid })]) }));
  expect(() => process.kill(child.pid, 0)).not.toThrow();
});

test("removes only branches that are still candidates", async () => {
  const { repo } = await makeFixture(await scratch());
  const outcome = await removeBranches(repo, ["feat/branch-only", "feat/unmerged"]);
  expect(outcome.removed).toEqual(["feat/branch-only"]);
  expect(outcome.refused).toContainEqual(expect.objectContaining({ branch: "feat/unmerged" }));
  expect(await branches(repo)).toEqual(["feat/fresh", "feat/merged-dirty", "feat/squash-done", "feat/unmerged", "main"]);
});

test("CLI age overrides remove only the named young integrated branch", async () => {
  const { repo } = await makeFixture(await scratch());
  const script = join(import.meta.dir, "cleanup-merged.ts");
  const preview = Bun.spawn([process.execPath, script, "list", "--json", "--min-age", "0s"], { cwd: repo, stdout: "pipe", stderr: "pipe" });
  const [previewOut, previewErr, previewCode] = await Promise.all([new Response(preview.stdout).text(), new Response(preview.stderr).text(), preview.exited]);
  expect(previewCode, previewErr).toBe(0);
  expect(JSON.parse(previewOut).removable.map((item: { branch: string }) => item.branch)).toContain("feat/fresh");

  const removal = Bun.spawn([process.execPath, script, "remove", "feat/fresh", "--min-age=0s"], { cwd: repo, stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([new Response(removal.stdout).text(), new Response(removal.stderr).text(), removal.exited]);
  expect(code, err).toBe(0);
  expect(JSON.parse(out)).toEqual({ removed: ["feat/fresh"], refused: [] });
  expect(await branches(repo)).toEqual(["feat/branch-only", "feat/merged-dirty", "feat/squash-done", "feat/unmerged", "main"]);
});

test("dirty worktrees stay excluded even with a named age override", async () => {
  const { repo } = await makeFixture(await scratch());
  const result = await removeBranches(repo, ["feat/merged-dirty"], { minAge: "0s" });
  expect(result.removed).toEqual([]);
  expect(result.refused).toEqual([{ branch: "feat/merged-dirty", path: null, reason: expect.stringContaining("dirty") }]);
  expect(await branches(repo)).toContain("feat/merged-dirty");
});

test("session start asks once per 24 hours and stays silent for child agents", async () => {
  const { repo } = await makeFixture(await scratch());
  const stateDir = await scratch();
  const first = await sessionStart({ cwd: repo, stateDir, env: {} });
  expect(first?.hookSpecificOutput.additionalContext).toContain("feat/branch-only");
  expect(first?.systemMessage).toContain("1");
  expect(await sessionStart({ cwd: repo, stateDir, env: {} })).toBeUndefined();

  const otherState = await scratch();
  expect(await sessionStart({ cwd: repo, stateDir: otherState, env: { MUXER_SUBAGENT_DEPTH: "1" } })).toBeUndefined();
});

// The real muxer-subagents router, so the test follows its detection order.
const router = join(import.meta.dir, "../../../../../agent-core/skills/muxer-subagents/scripts/router.ts");

test("session start reminds an OMP agent that the hook is not verified in OMP", async () => {
  const { repo } = await makeFixture(await scratch());
  const output = await sessionStart({ cwd: repo, stateDir: await scratch(), env: { OMPCODE: "1" }, agentCommand: router });
  expect(output?.hookSpecificOutput.additionalContext).toContain("UNVERIFIED IN OMP");
});

test("session start gives no OMP reminder to Claude or when detection is missing", async () => {
  const { repo } = await makeFixture(await scratch());
  const claude = await sessionStart({ cwd: repo, stateDir: await scratch(), env: { CLAUDECODE: "1", OMPCODE: "" }, agentCommand: router });
  expect(claude?.hookSpecificOutput.additionalContext).not.toContain("UNVERIFIED IN OMP");
  const missing = await sessionStart({ cwd: repo, stateDir: await scratch(), env: { OMPCODE: "1" }, agentCommand: "muxer-subagents-missing" });
  expect(missing?.hookSpecificOutput.additionalContext).toContain("feat/branch-only");
  expect(missing?.hookSpecificOutput.additionalContext).not.toContain("UNVERIFIED IN OMP");
});

test("session start stays silent outside a git repository", async () => {
  expect(await sessionStart({ cwd: await scratch(), stateDir: await scratch(), env: {} })).toBeUndefined();
});

// Keep the command protocol deterministic while real filesystem probes decide
// whether the candidate path remains. Real repository tests above cover wt itself.
async function removalObservation(options: {
  outcome?: string;
  branchRemaining?: boolean;
  registered?: boolean;
  pathExists?: boolean;
  listingCode?: number;
  incompleteListing?: boolean;
  inventorySchema?: 1 | 2;
  malformedInventory?: "unknown-schema" | "missing-branch" | "null-worktree";
  removalMatches?: "missing" | "duplicate" | "other-first" | "object";
}): Promise<{ code: number; result: { removed: string[]; refused: Array<{ reason: string }> } }> {
  const root = await scratch();
  const bin = join(root, "bin");
  const path = join(root, "owned-worktree");
  await mkdir(bin);
  if (options.pathExists) await mkdir(path);
  const candidate = { branch: "feat/done", kind: "worktree", path, reason: "ancestor", target: "main" };
  const outcome = { kind: "worktree", branch: candidate.branch, path, branch_outcome: options.outcome };
  const other = { ...outcome, branch: "feat/other" };
  const outcomes = options.removalMatches === "missing" ? [other]
    : options.removalMatches === "duplicate" ? [outcome, outcome]
    : options.removalMatches === "other-first" ? [other, outcome]
    : options.removalMatches === "object" ? outcome : [outcome];
  const rows: Array<{ kind: string; branch: string; path: string | null }> = [
    { kind: "worktree", branch: "main", path: root },
  ];
  if (options.registered) rows.push({ kind: "worktree", branch: "feat/other", path });
  if (options.branchRemaining) rows.push({ kind: "branch", branch: candidate.branch, path: null });
  let inventory: unknown = options.inventorySchema === 1 ? rows : {
    schema: 2, items: rows.map(row => ({ branch: row.branch, ...(row.path ? { worktree: { path: row.path } } : {}) })),
  };
  if (options.incompleteListing) inventory = { schema: 2, items: [] };
  if (options.malformedInventory === "unknown-schema") inventory = { schema: 3, items: rows };
  if (options.malformedInventory === "missing-branch") inventory = { schema: 2, items: [{ worktree: { path: root } }] };
  if (options.malformedInventory === "null-worktree") inventory = { schema: 2, items: [{ branch: "main", worktree: null }] };
  const wt = join(bin, "wt");
  await writeFile(wt, `#!${process.execPath}
const args = process.argv.slice(2);
if (args.includes("step")) console.log(${JSON.stringify(JSON.stringify([candidate]))});
else if (args.includes("remove") && args.includes("--foreground") && args.includes("--format=json")) {
  console.log(${JSON.stringify(JSON.stringify(outcomes))});
} else if (args.includes("list") && args.includes("--branches") && args.includes("list.full=false") && args.includes("list.summary=false")) {
  console.log(${JSON.stringify(JSON.stringify(inventory))});
  process.exit(${options.listingCode ?? 0});
} else process.exit(2);
`);
  await chmod(wt, 0o700);
  const child = Bun.spawn([process.execPath, join(import.meta.dir, "cleanup-merged.ts"), "remove", candidate.branch], {
    cwd: root, stdout: "pipe", stderr: "pipe", env: { ...process.env, PATH: bin },
  });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  expect(stderr).toBe("");
  return { code, result: JSON.parse(stdout) };
}

for (const outcome of ["retained_raced", "retained_unmerged", "retained_failed", "retained_checked_out", "not_attempted", "deferred"]) {
  test(`exit zero with ${outcome} remains cleanup pending`, async () => {
    const { code, result } = await removalObservation({ outcome });
    expect(code).toBe(1);
    expect(result.removed).toEqual([]);
    expect(result.refused[0]?.reason).toContain(`branch_outcome=${outcome}`);
  });
}

test("exit zero without a branch outcome is an incomplete observation", async () => {
  const { code, result } = await removalObservation({});
  expect(code).toBe(1);
  expect(result.removed).toEqual([]);
  expect(result.refused[0]?.reason).toContain("incomplete removal observation");
});

for (const [observation, reason] of [
  [{ branchRemaining: true }, "exact branch remains"],
  [{ registered: true }, "remains registered"],
  [{ pathExists: true }, "workspace path still exists"],
  [{ listingCode: 1 }, "workspaces could not be checked"],
  [{ incompleteListing: true }, "workspace listing was incomplete"],
  [{ malformedInventory: "unknown-schema" }, "workspace listing was incomplete or unsupported"],
  [{ malformedInventory: "missing-branch" }, "workspace listing was incomplete or unsupported"],
  [{ malformedInventory: "null-worktree" }, "workspace listing was incomplete or unsupported"],
] as const) {
  test(`a deleted outcome stays pending when ${reason}`, async () => {
    const { code, result } = await removalObservation({ outcome: "deleted", ...observation });
    expect(code).toBe(1);
    expect(result.removed).toEqual([]);
    expect(result.refused[0]?.reason).toContain(reason);
  });
}

for (const inventorySchema of [1, 2] as const) {
  test(`array removal needs absence of the exact branch and workspace in schema ${inventorySchema}`, async () => {
    const { code, result } = await removalObservation({ outcome: "deleted", inventorySchema });
    expect(code).toBe(0);
    expect(result).toEqual({ removed: ["feat/done"], refused: [] });
  });
}

for (const removalMatches of ["missing", "duplicate", "object"] as const) {
  test(`${removalMatches} removal matches cannot prove deletion`, async () => {
    const { code, result } = await removalObservation({ outcome: "deleted", removalMatches });
    expect(code).toBe(1);
    expect(result.removed).toEqual([]);
    expect(result.refused[0]?.reason).toContain("incomplete removal observation");
  });
}

test("array removal selects the exact branch rather than the first outcome", async () => {
  const { code, result } = await removalObservation({ outcome: "deleted", removalMatches: "other-first" });
  expect(code).toBe(0);
  expect(result).toEqual({ removed: ["feat/done"], refused: [] });
});
