import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scripts = join(import.meta.dir, "..", "scripts");
async function execute(name: string, args: string[], cwd = process.cwd()) {
  const proc = Bun.spawn([join(scripts, name), ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  return { code: await proc.exited, stdout: await new Response(proc.stdout).text(), stderr: await new Response(proc.stderr).text() };
}

describe("orch Bun scripts", () => {
  test("reports tracker from normalized issue ids", async () => {
    expect((await execute("tracker-for-issue", ["issue-12"])).stdout.trim()).toBe("github");
    expect((await execute("tracker-for-issue", ["PROJ-12"])).stdout.trim()).toBe("linear");
  });
  test("writes and reads round-scoped state with spaces in paths", async () => {
    const root = mkdtempSync(join(tmpdir(), "orch test ")); const state = join(root, "state dir");
    const init = await execute("workflow-state", ["--state-dir", state, "init", "issue-12", "--agent", "test", "--worktree", root]);
    expect(init.code).toBe(0);
    expect((await execute("workflow-state", ["--state-dir", state, "set", "issue-12", "cycles", "2"])).code).toBe(0);
    expect((await execute("workflow-state", ["--state-dir", state, "get", "issue-12", ".cycles"])).stdout.trim()).toBe("2");
    expect(JSON.parse(readFileSync(join(state, "workflow-state-issue-12.json"), "utf8")).worktree).toBe(root);
    rmSync(root, { recursive: true, force: true });
  });
  test("writes and validates completion artifacts", async () => {
    const root = mkdtempSync(join(tmpdir(), "orch artifact "));
    const write = await execute("dev-return-write", ["--worktree", root, "--kind", "fix", "--issue", "issue-12", "--round-id", "r1", "--branch", "issue-12", "--commit", "abc", "--validate", "pass", "--item", "1", "Applied", "fixed it"]);
    expect(write.code).toBe(0);
    const check = await execute("dev-artifact-check", ["--file", write.stdout.trim(), "--round-id", "r1", "--expect-items", "1"]);
    expect(check.code).toBe(0); expect(JSON.parse(check.stdout).reason).toBe("valid");
    rmSync(root, { recursive: true, force: true });
  });
});
