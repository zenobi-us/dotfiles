import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { deliverResult, readDeliveredResult } from "../../result-delivery/scripts/delivery.ts";
import { removeRun, runPromptPath, writeRunSignal } from "./signals.ts";
import { spawnAgent } from "./spawn.ts";
import { waitForAgent } from "./wait.ts";

// A fake herdr CLI answers the calls spawnHerdr makes and records the
// `agent start` arguments, so the test can find the prompt file it was given.
const fakeHerdr = `#!/usr/bin/env bun
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
const log = process.env.FAKE_HERDR_LOG;
if (log) appendFileSync(log, JSON.stringify(args) + "\\n");
if (args[0] === "worktree" && args[1] === "list") {
  const cwd = args[args.indexOf("--cwd") + 1];
  console.log(JSON.stringify({ result: { worktrees: [{ path: cwd, open_workspace_id: "w1" }] } }));
} else if (args[0] === "tab" && args[1] === "create") {
  const contextArgument = args.find((value) => value.startsWith("RESULT_DELIVERY_CONTEXT="));
  if (!contextArgument) throw new Error("Missing context before tab creation");
  const context = JSON.parse(readFileSync(contextArgument.slice("RESULT_DELIVERY_CONTEXT=".length), "utf8"));
  if (!context.target?.schema || context.mode !== "artifact-reference") throw new Error("Invalid assigned context");
  const environment = Object.fromEntries(args.flatMap((value, index) => {
    if (args[index - 1] !== "--env") return [];
    const separator = value.indexOf("=");
    return [[value.slice(0, separator), value.slice(separator + 1)]];
  }));
  appendFileSync(log + ".environment", JSON.stringify(environment));
  console.log(JSON.stringify({ result: { pane_id: "w1:p1" } }));
} else if (args[0] === "agent" && args[1] === "start") {
  if (process.env.FAKE_HERDR_STARTUP && !existsSync(log + ".busy")) {
    writeFileSync(log + ".busy", "rejected before dispatch");
    console.error(JSON.stringify({ error: { code: "agent_pane_busy" } }));
    process.exit(1);
  }
  if (process.env.FAKE_AGENT_CAPTURE) {
    const environment = JSON.parse(readFileSync(log + ".environment", "utf8"));
    const child = spawnSync(process.execPath, [process.env.FAKE_AGENT_EXECUTABLE, "--", args.at(-1)], {
      env: { ...process.env, ...environment }, encoding: "utf8",
    });
    if (child.status !== 0) {
      console.error(child.stderr);
      process.exit(child.status ?? 1);
    }
  }
  console.log("{}");
} else if (args[0] === "agent" && args[1] === "get") {
  process.exit(1);
} else if (args[0] === "pane" && args[1] === "process-info") {
  const foreground = process.env.FAKE_HERDR_STARTUP === "other-process" ? 200 : 100;
  console.log(JSON.stringify({ result: { process_info: { shell_pid: 100, foreground_processes: [{ pid: foreground }] } } }));
} else {
  process.exit(1);
}
`;

describe("muxer spawn", () => {
  let root: string;
  let log: string;
  const saved = { ...process.env };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "muxer-subagents-test-"));
    log = join(root, "herdr.log");
    const herdr = join(root, "herdr");
    writeFileSync(herdr, fakeHerdr);
    chmodSync(herdr, 0o755);
    process.env.PATH = `${root}:${saved.PATH}`;
    process.env.XDG_STATE_HOME = join(root, "state");
    process.env.FAKE_HERDR_LOG = log;
    delete process.env.RESULT_DELIVERY_CONTEXT;
    delete process.env.MUXER_SUBAGENT_RUN_ID;
    delete process.env.MUXER_SUBAGENT_PARENT_RUN_ID;
    delete process.env.FAKE_AGENT_CAPTURE;
    delete process.env.FAKE_AGENT_EXECUTABLE;
    delete process.env.FAKE_HERDR_STARTUP;
  });

  afterEach(() => {
    process.env.PATH = saved.PATH;
    process.env.XDG_STATE_HOME = saved.XDG_STATE_HOME;
    delete process.env.FAKE_HERDR_LOG;
    for (const key of ["RESULT_DELIVERY_CONTEXT", "MUXER_SUBAGENT_RUN_ID", "MUXER_SUBAGENT_PARENT_RUN_ID", "XDG_CONFIG_HOME", "HC_TERMINAL_ID", "FAKE_AGENT_CAPTURE", "FAKE_AGENT_EXECUTABLE", "FAKE_HERDR_STARTUP"]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
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

  function prepareFakeAgent(): string {
    const capture = join(root, "agent-observation.json");
    const executable = join(root, "claude");
    const deliveryModule = new URL("../../result-delivery/scripts/delivery.ts", import.meta.url).href;
    writeFileSync(executable, `#!${process.execPath}
import { readFileSync, writeFileSync } from "node:fs";
import { loadDeliveryContext, deliverResult } from ${JSON.stringify(deliveryModule)};
const context = await loadDeliveryContext();
const promptFile = process.argv.at(-1).slice(1);
writeFileSync(process.env.FAKE_AGENT_CAPTURE, JSON.stringify({
  context,
  argv: process.argv.slice(2),
  operationId: context.operationId,
  contextFile: process.env.RESULT_DELIVERY_CONTEXT,
  runId: process.env.MUXER_SUBAGENT_RUN_ID,
  parentRunId: process.env.MUXER_SUBAGENT_PARENT_RUN_ID,
  role: process.env.MUXER_SUBAGENT_ROLE,
  depth: process.env.MUXER_SUBAGENT_DEPTH,
  promptFile,
  prompt: readFileSync(promptFile, "utf8"),
}));
await deliverResult({ schema: context.target.schema, status: "failed", checks: ["domain failure"] }, context);
`);
    chmodSync(executable, 0o755);
    process.env.FAKE_AGENT_CAPTURE = capture;
    process.env.FAKE_AGENT_EXECUTABLE = executable;
    return capture;
  }

  test("rejects an unsupported agent before creating a terminal or run", async () => {
    await expect(spawnAgent({
      muxer: "herdr", agent: "zot", prompt: "task", cwd: root, depth: 1,
      resultSchema: "test-result/v1",
    })).rejects.toThrow("does not support zot");
    expect(existsSync(log)).toBe(false);
    expect(existsSync(join(root, "state", "muxer-subagents", "runs"))).toBe(false);
  });

  function prepareDesktop(spaces: Array<Record<string, unknown>>): () => Array<{ command: string; request: Record<string, unknown> }> {
    process.env.HC_TERMINAL_ID = "t7";
    const state = join(root, "desktop.json");
    writeFileSync(state, JSON.stringify({ spaces, calls: [] }));
    const desktop = join(root, "herdr-app");
    writeFileSync(desktop, `#!${process.execPath}
import { readFileSync, writeFileSync } from "node:fs";
const file = ${JSON.stringify(state)};
const state = JSON.parse(readFileSync(file, "utf8"));
const args = process.argv.slice(2);
if (args[0] === "ls") {
  console.log(JSON.stringify({ spaces: state.spaces }));
} else if (args[0] === "do") {
  const request = JSON.parse(args[2]);
  state.calls.push({ command: args[1], request });
  const terminal = "child-" + state.calls.length;
  if (args[1] === "space.new") {
    state.spaces.push({ id: "created", folder: request.folder, machine: request.machine, tabs: [{ terminals: [{ terminal }] }] });
  }
  writeFileSync(file, JSON.stringify(state));
  console.log(JSON.stringify({ terminal }));
} else {
  process.exit(1);
}
`);
    chmodSync(desktop, 0o755);
    return () => JSON.parse(readFileSync(state, "utf8")).calls;
  }

  function parentSpace(): Record<string, unknown> {
    return { id: "parent", folder: join(root, "orchestrator"), machine: null, tabs: [{ terminals: [{ terminal: "t7" }] }] };
  }

  test("opens a fresh tab in the target directory space rather than the parent or focused space", async () => {
    const calls = prepareDesktop([
      { id: "focused", folder: join(root, "other"), active: true, tabs: [] },
      parentSpace(),
      { id: "remote", folder: root, machine: "remote-host", tabs: [] },
      { id: "worktree", folder: root + "/nested/../", machine: null, tabs: [] },
    ]);
    const spawned = await spawnAgent({
      muxer: "herdr-app", agent: "codex", prompt: "review", cwd: root + "/./", depth: 1, resultSchema: "test-result/v1",
    });
    expect(calls()).toMatchObject([{ command: "tab.new", request: { space: "worktree", folder: root } }]);
    await removeRun(spawned.runId);
  });

  test("creates a local target space once and reuses it for later fresh sessions", async () => {
    const calls = prepareDesktop([
      parentSpace(),
      { id: "remote", folder: root, machine: "remote-host", tabs: [] },
    ]);
    const first = await spawnAgent({
      muxer: "herdr-app", agent: "omp", prompt: "implement", cwd: root, depth: 1, resultSchema: "test-result/v1",
    });
    const second = await spawnAgent({
      muxer: "herdr-app", agent: "omp", prompt: "review", cwd: root, depth: 1, resultSchema: "test-result/v1",
    });
    expect(calls()).toMatchObject([
      { command: "space.new", request: { folder: root, machine: "" } },
      { command: "tab.new", request: { space: "created", folder: root } },
    ]);
    expect(first.target).not.toBe(second.target);
    await removeRun(first.runId);
    await removeRun(second.runId);
  });

  test("rejects ambiguous local target spaces without opening a terminal", async () => {
    const calls = prepareDesktop([
      parentSpace(),
      { id: "worktree-a", folder: root, tabs: [] },
      { id: "worktree-b", folder: root + "/", tabs: [] },
    ]);
    await expect(spawnAgent({
      muxer: "herdr-app", agent: "omp", prompt: "review", cwd: root, depth: 1, resultSchema: "test-result/v1",
    })).rejects.toThrow("worktree-a, worktree-b");
    expect(calls()).toEqual([]);
  });

  test("requires a visible local parent before creating a target space", async () => {
    const calls = prepareDesktop([{ id: "unrelated", folder: root, tabs: [] }]);
    await expect(spawnAgent({
      muxer: "herdr-app", agent: "omp", prompt: "review", cwd: root, depth: 1, resultSchema: "test-result/v1",
    })).rejects.toThrow("did not report a space containing t7");
    expect(calls()).toEqual([]);
  });

  test("rejects a remote parent without opening a local target terminal", async () => {
    const calls = prepareDesktop([{ ...parentSpace(), machine: "remote-host" }]);
    await expect(spawnAgent({
      muxer: "herdr-app", agent: "omp", prompt: "review", cwd: root, depth: 1, resultSchema: "test-result/v1",
    })).rejects.toThrow("requires a local space");
    expect(calls()).toEqual([]);
  });

  test("launches once the fresh shell becomes available after an explicit rejection", async () => {
    process.env.FAKE_HERDR_STARTUP = "shell";
    prepareFakeAgent();
    const spawned = await spawnAgent({
      muxer: "herdr", agent: "claude", prompt: "produce result", cwd: root, depth: 1,
      resultSchema: "test-result/v1",
    });
    expect((await readDeliveredResult(spawned.deliveryContext)).result).toEqual({
      schema: "test-result/v1", status: "failed", checks: ["domain failure"],
    });
    await removeRun(spawned.runId);
  });

  test("does not retry a busy pane with another foreground process", async () => {
    process.env.FAKE_HERDR_STARTUP = "other-process";
    const capture = prepareFakeAgent();
    await expect(spawnAgent({
      muxer: "herdr", agent: "claude", prompt: "produce result", cwd: root, depth: 1,
      resultSchema: "test-result/v1",
    })).rejects.toThrow("agent_pane_busy");
    expect(existsSync(capture)).toBe(false);
  });

  test("keeps the prompt file after spawnAgent returns", async () => {
    const { runId } = await spawnAgent({ muxer: "herdr", agent: "claude", prompt: "do the task", cwd: root, depth: 1, resultSchema: "test-result/v1" });
    const promptFile = startedPromptFile();
    expect(existsSync(promptFile)).toBe(true);
    expect(readFileSync(promptFile, "utf8")).toStartWith("do the task\n\nResult handoff:");
    await removeRun(runId);
    expect(existsSync(promptFile)).toBe(false);
  });

  test("deletes the prompt file when wait sees a terminal state", async () => {
    const { runId } = await spawnAgent({ muxer: "herdr", agent: "claude", prompt: "do the task", cwd: root, depth: 1, resultSchema: "test-result/v1" });
    const promptFile = startedPromptFile();
    expect(promptFile).toBe(runPromptPath(runId));
    const signal = await writeRunSignal(runId, "completed", "agent");
    expect(await waitForAgent({ runId, afterSequence: signal.sequence - 1 })).toMatchObject({ state: "completed" });
    expect(existsSync(promptFile)).toBe(false);
    await removeRun(runId);
  });

  test("keeps the prompt file while the agent is blocked", async () => {
    const { runId } = await spawnAgent({ muxer: "herdr", agent: "claude", prompt: "do the task", cwd: root, depth: 1, resultSchema: "test-result/v1" });
    const signal = await writeRunSignal(runId, "blocked", "agent");
    expect(await waitForAgent({ runId, afterSequence: signal.sequence - 1 })).toMatchObject({ state: "blocked" });
    expect(existsSync(runPromptPath(runId))).toBe(true);
    await removeRun(runId);
  });

  test("allocates a typed persistent handoff before Herdr launch and retains it after cleanup", async () => {
    process.env.MUXER_SUBAGENT_RUN_ID = "parent-run";
    const capture = prepareFakeAgent();
    const spawned = await spawnAgent({
      muxer: "herdr", agent: "claude", prompt: "produce result", cwd: root, depth: 1,
      resultSchema: "test-result/v1", operationId: "ticket-123",
    });
    expect(spawned.parentRunId).toBe("parent-run");
    expect(spawned.deliveryContext).toEqual({
      schema: "result-delivery/v1", kind: "context", audience: "agent", mode: "artifact-reference",
      runId: spawned.runId, operationId: "ticket-123", target: spawned.resultTarget,
    });
    expect(JSON.parse(readFileSync(spawned.contextFile, "utf8"))).toEqual(spawned.deliveryContext);
    const observed = JSON.parse(readFileSync(capture, "utf8"));
    expect(observed).toMatchObject({
      contextFile: spawned.contextFile,
      context: spawned.deliveryContext,
      runId: spawned.runId,
      operationId: "ticket-123",
      parentRunId: "parent-run",
      role: "child",
      depth: "1",
    });
    const result = { schema: "test-result/v1", status: "failed", checks: ["domain failure"] };
    expect((await readDeliveredResult(spawned.deliveryContext)).result).toEqual(result);
    await writeRunSignal(spawned.runId, "completed", "agent");
    expect(await waitForAgent({ runId: spawned.runId, afterSequence: 0 })).toMatchObject({ state: "completed" });
    await removeRun(spawned.runId);
    expect(existsSync(spawned.contextFile)).toBe(true);
    expect((await readDeliveredResult(spawned.deliveryContext)).result).toEqual(result);
  });

  test("requires a schema and paired custom target and reference before launching", async () => {
    const options = { muxer: "herdr" as const, agent: "claude" as const, prompt: "task", cwd: root, depth: 1, resultSchema: "" };
    await expect(spawnAgent(options)).rejects.toThrow("schema");
    await expect(spawnAgent({ ...options, resultSchema: "test-result/v1", resultTarget: join(root, "result.json") })).rejects.toThrow("together");
    await expect(spawnAgent({ ...options, resultSchema: "test-result/v1", resultRef: "file:///result.json" })).rejects.toThrow("together");
    await expect(spawnAgent({ ...options, resultSchema: "test-result/v1", resultTarget: join(root, "missing", "result.json"), resultRef: "file:///result.json" })).rejects.toThrow();
    expect(existsSync(log)).toBe(false);
  });

  test("preserves caller-assigned target and reference", async () => {
    const resultTarget = join(root, "custom-result.json");
    const spawned = await spawnAgent({
      muxer: "herdr", agent: "claude", prompt: "task", cwd: root, depth: 1,
      resultSchema: "test-result/v1", resultTarget, resultRef: "artifact://caller-approved",
    });
    expect(spawned.resultTarget).toEqual({ path: resultTarget, ref: "artifact://caller-approved", schema: "test-result/v1" });
    expect(spawned.operationId).toBe(spawned.runId);
    await removeRun(spawned.runId);
  });

  for (const muxer of ["tmux", "zellij", "hrdx"] as const) {
    test(`propagates context and run identities through ${muxer} without starting an agent`, async () => {
      const commands: string[][] = [];
      const socketDirectory = join(root, "config", "hrdx");
      mkdirSync(socketDirectory, { recursive: true });
      process.env.XDG_CONFIG_HOME = join(root, "config");
      process.env.MUXER_SUBAGENT_RUN_ID = "parent-run";
      const capture = prepareFakeAgent();
      const shell = join(root, "sh");
      writeFileSync(shell, `#!/bin/sh\nshift\nexec /bin/sh -c "$1"\n`);
      chmodSync(shell, 0o755);
      const server = createServer((socket) => {
        socket.on("data", (data) => {
          const request = JSON.parse(data.toString());
          if (request.method === "pane.send_text") commands.push([request.params.text]);
          socket.end(`${JSON.stringify({ result: request.method === "pane.create" ? { pane_id: 9 } : {} })}\n`);
        });
      });
      if (muxer === "hrdx") {
        const listening = Promise.withResolvers<void>();
        server.once("error", listening.reject);
        server.listen(join(socketDirectory, "hrdx.sock"), listening.resolve);
        await listening.promise;
      } else {
        const executable = join(root, muxer);
        writeFileSync(executable, `#!/usr/bin/env bun\nimport { appendFileSync } from "node:fs";\nappendFileSync(process.env.FAKE_HERDR_LOG, JSON.stringify(process.argv.slice(2)) + "\\n");\nconsole.log("%fake-pane");\n`);
        chmodSync(executable, 0o755);
      }
      let promptFile: string | undefined;
      try {
        const spawned = await spawnAgent({
          muxer, agent: "claude", prompt: "task", cwd: root, depth: 1, resultSchema: "test-result/v1",
        });
        if (muxer !== "hrdx") commands.push(...readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line)));
        const launch = muxer === "hrdx"
          ? commands[0]?.[0]
          : commands.find((command) => muxer === "tmux"
            ? command[0] === "split-window"
            : command[0] === "action" && command[1] === "new-pane")?.at(-1);
        if (!launch) throw new Error("Fake muxer did not capture a launch command");
        await deliverResult({ schema: "test-result/v1", status: "failed", checks: ["domain failure"] }, spawned.deliveryContext);
        expect(await waitForAgent({ runId: spawned.runId, afterSequence: 0, timeoutMs: 10 })).toBeNull();
        const child = Bun.spawn([shell, "-c", launch], { env: { ...process.env }, stdout: "pipe", stderr: "pipe" });
        const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
        expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
        const observed = JSON.parse(readFileSync(capture, "utf8"));
        promptFile = observed.promptFile;
        expect(observed).toMatchObject({
          contextFile: spawned.contextFile,
          context: spawned.deliveryContext,
          runId: spawned.runId,
          operationId: spawned.operationId,
          parentRunId: "parent-run",
          role: "child",
          depth: "1",
        });
        expect(await waitForAgent({ runId: spawned.runId, afterSequence: 0 })).toMatchObject({ state: "completed", exitCode: 0 });
        expect(existsSync(observed.promptFile)).toBe(false);
        await removeRun(spawned.runId);
        expect(existsSync(spawned.contextFile)).toBe(true);
        expect((await readDeliveredResult(spawned.deliveryContext)).result).toEqual({
          schema: "test-result/v1", status: "failed", checks: ["domain failure"],
        });
      } finally {
        if (promptFile) rmSync(promptFile, { force: true });
        if (server.listening) {
          const closed = Promise.withResolvers<void>();
          server.close(() => closed.resolve());
          await closed.promise;
        }
      }
    });
  }
});
