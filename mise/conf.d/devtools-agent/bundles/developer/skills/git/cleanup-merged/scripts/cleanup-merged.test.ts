// Uses disposable Git repositories built by fixture.ts. Requires git and wt on PATH.
import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
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
  children.push(Bun.spawn(["sleep", "30"], { cwd: join(worktrees, "squash-done") }));
  const result = await findCandidates(repo, { minAge: "0s" });
  expect(result.removable.map(item => item.branch)).not.toContain("feat/squash-done");
  expect(result.kept).toContainEqual(expect.objectContaining({ branch: "feat/squash-done", reason: expect.stringContaining("process") }));
});

test("removes only branches that are still candidates", async () => {
  const { repo } = await makeFixture(await scratch());
  const outcome = await removeBranches(repo, ["feat/branch-only", "feat/unmerged"]);
  expect(outcome.removed).toEqual(["feat/branch-only"]);
  expect(outcome.refused).toContainEqual(expect.objectContaining({ branch: "feat/unmerged" }));
  expect(await branches(repo)).toEqual(["feat/fresh", "feat/merged-dirty", "feat/squash-done", "feat/unmerged", "main"]);
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
