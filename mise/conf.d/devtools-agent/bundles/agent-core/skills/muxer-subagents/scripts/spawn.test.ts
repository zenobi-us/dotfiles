import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { removeRun, runPromptPath, writeRunSignal } from "./signals.ts";
import { spawnAgent } from "./spawn.ts";
import { waitForAgent } from "./wait.ts";

// A fake herdr CLI answers the calls spawnHerdr makes and records the
// `agent start` arguments, so the test can find the prompt file it was given.
const fakeHerdr = `#!/usr/bin/env bun
import { appendFileSync } from "node:fs";
const args = process.argv.slice(2);
const log = process.env.FAKE_HERDR_LOG;
if (log) appendFileSync(log, JSON.stringify(args) + "\\n");
if (args[0] === "worktree" && args[1] === "list") {
  const cwd = args[args.indexOf("--cwd") + 1];
  console.log(JSON.stringify({ result: { worktrees: [{ path: cwd, open_workspace_id: "w1" }] } }));
} else if (args[0] === "tab" && args[1] === "create") {
  console.log(JSON.stringify({ result: { pane_id: "w1:p1" } }));
} else if (args[0] === "agent" && args[1] === "start") {
  console.log("{}");
} else {
  process.exit(1);
}
`;

describe("herdr spawn", () => {
  let root: string;
  let log: string;
  const saved = { PATH: process.env.PATH, XDG_STATE_HOME: process.env.XDG_STATE_HOME };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "muxer-subagents-test-"));
    log = join(root, "herdr.log");
    const herdr = join(root, "herdr");
    writeFileSync(herdr, fakeHerdr);
    chmodSync(herdr, 0o755);
    process.env.PATH = `${root}:${saved.PATH}`;
    process.env.XDG_STATE_HOME = join(root, "state");
    process.env.FAKE_HERDR_LOG = log;
  });

  afterEach(() => {
    process.env.PATH = saved.PATH;
    process.env.XDG_STATE_HOME = saved.XDG_STATE_HOME;
    delete process.env.FAKE_HERDR_LOG;
    rmSync(root, { recursive: true, force: true });
  });

  function startedPromptFile(): string {
    const start = readFileSync(log, "utf8").trim().split("\n")
      .map((line) => JSON.parse(line) as string[])
      .find((args) => args[0] === "agent" && args[1] === "start");
    const handoff = start?.at(-1);
    if (!handoff?.startsWith("@")) throw new Error("herdr agent start got no @prompt argument");
    return handoff.slice(1);
  }

  test("keeps the prompt file after spawnAgent returns", async () => {
    const { runId } = await spawnAgent({ muxer: "herdr", agent: "claude", prompt: "do the task", cwd: root, depth: 1 });
    const promptFile = startedPromptFile();
    expect(existsSync(promptFile)).toBe(true);
    expect(readFileSync(promptFile, "utf8")).toBe("do the task");
    await removeRun(runId);
    expect(existsSync(promptFile)).toBe(false);
  });

  test("deletes the prompt file when wait sees a terminal state", async () => {
    const { runId } = await spawnAgent({ muxer: "herdr", agent: "claude", prompt: "do the task", cwd: root, depth: 1 });
    const promptFile = startedPromptFile();
    expect(promptFile).toBe(runPromptPath(runId));
    const signal = await writeRunSignal(runId, "completed", "agent");
    expect(await waitForAgent({ runId, afterSequence: signal.sequence - 1 })).toMatchObject({ state: "completed" });
    expect(existsSync(promptFile)).toBe(false);
    await removeRun(runId);
  });

  test("keeps the prompt file while the agent is blocked", async () => {
    const { runId } = await spawnAgent({ muxer: "herdr", agent: "claude", prompt: "do the task", cwd: root, depth: 1 });
    const signal = await writeRunSignal(runId, "blocked", "agent");
    expect(await waitForAgent({ runId, afterSequence: signal.sequence - 1 })).toMatchObject({ state: "blocked" });
    expect(existsSync(runPromptPath(runId))).toBe(true);
    await removeRun(runId);
  });
});
