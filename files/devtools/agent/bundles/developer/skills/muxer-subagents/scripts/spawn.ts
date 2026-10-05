import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import * as net from "node:net";
import type { Agent, Muxer } from "./types.ts";
import {
  createRun,
  removeRun,
  runSignalPath,
  updateRunTarget,
  writeRunSignal,
} from "./signals.ts";

export type SpawnMuxer = Exclude<Muxer, "unknown-muxer">;
export type SpawnAgent = Exclude<Agent, "unknown-agent">;

export interface SpawnOptions {
  muxer: SpawnMuxer;
  agent: SpawnAgent;
  prompt: string;
  cwd: string;
  depth: number;
}

export interface SpawnResult {
  runId: string;
  target: string;
}

function run(command: string, args: string[], cwd?: string): string {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `${command} exited with status ${result.status}`);
  }
  return result.stdout.trim();
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function agentCommand(agent: SpawnAgent, handoffFile: string): string {
  return [agent, "--", `@${handoffFile}`].map(shellQuote).join(" ");
}

function shellLaunch(
  agent: SpawnAgent,
  cwd: string,
  handoffFile: string,
  depth: number,
  runId: string,
  signalFile: string,
): string {
  const command = agentCommand(agent, handoffFile);
  const signalPath = shellQuote(signalFile);
  const runIdValue = shellQuote(runId);
  return [
    `cd ${shellQuote(cwd)} || exit $?`,
    "umask 077",
    `signal_file=${signalPath}`,
    `run_id=${runIdValue}`,
    "emit_signal() {",
    "  state=\"$1\"; code=\"${2-}\"; timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "  if [ \"$state\" = running ]; then",
    `    printf '{"version":1,"runId":"%s","sequence":1,"state":"running","source":"process","timestamp":"%s"}\\n' "$run_id" "$timestamp" > "$signal_file.tmp"`,
    "  else",
    `    printf '{"version":1,"runId":"%s","sequence":2,"state":"%s","source":"process","timestamp":"%s","exitCode":%s}\\n' "$run_id" "$state" "$timestamp" "$code" > "$signal_file.tmp"`,
    "  fi",
    "  mv \"$signal_file.tmp\" \"$signal_file\"",
    "}",
    `cleanup() { rm -f ${shellQuote(handoffFile)}; rmdir ${shellQuote(dirname(handoffFile))} 2>/dev/null; }`,
    "trap 'emit_signal cancelled 130; cleanup; exit 130' INT",
    "trap 'emit_signal cancelled 143; cleanup; exit 143' TERM",
    "trap 'emit_signal cancelled 129; cleanup; exit 129' HUP",
    "trap 'emit_signal cancelled 131; cleanup; exit 131' QUIT",
    `export MUXER_SUBAGENT_DEPTH=${depth}`,
    "emit_signal running",
    `${command}`,
    "status=$?",
    "if [ \"$status\" -eq 0 ]; then emit_signal completed 0; else emit_signal failed \"$status\"; fi",
    "cleanup",
    "exit \"$status\"",
  ].join("\n");
}

function resultValue(output: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(output);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Muxer returned an invalid JSON object");
  }
  const response = parsed as Record<string, unknown>;
  const result = response.result;
  return result && typeof result === "object" && !Array.isArray(result)
    ? result as Record<string, unknown>
    : response;
}

function nestedRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function spawnHerdr(agent: SpawnAgent, cwd: string, handoffFile: string, depth: number): { target: string; agentName: string } {
  if (agent === "zot") throw new Error("Herdr agent start does not support zot.");
  const worktrees = resultValue(run("herdr", ["worktree", "list", "--cwd", cwd, "--json"]));
  const workspace = nestedRecord(worktrees, "source")?.source_workspace_id;
  if (!workspace) throw new Error("Herdr did not report a workspace for the current worktree");
  const agentName = `agent-${Date.now()}`;
  const tab = resultValue(run("herdr", [
    "tab", "create", "--workspace", String(workspace), "--cwd", cwd,
    "--label", agentName, "--no-focus", "--env", `MUXER_SUBAGENT_DEPTH=${depth}`,
  ]));
  const paneId = tab.pane_id ?? tab.root_pane_id ?? nestedRecord(tab, "pane")?.id;
  if (paneId === undefined) throw new Error("Herdr did not report the new tab's root pane id");
  run("herdr", [
    "agent", "start", agentName, "--kind", agent, "--pane", String(paneId), "--", `@${handoffFile}`,
  ]);
  return { target: String(paneId), agentName };
}

function spawnTmux(
  agent: SpawnAgent,
  cwd: string,
  handoffFile: string,
  depth: number,
  runId: string,
  signalFile: string,
): string {
  return run("tmux", [
    "split-window", "-d", "-P", "-F", "#{pane_id}", "-c", cwd,
    "-e", `MUXER_SUBAGENT_DEPTH=${depth}`,
    "sh", "-lc", shellLaunch(agent, cwd, handoffFile, depth, runId, signalFile),
  ]);
}

function spawnZellij(
  agent: SpawnAgent,
  cwd: string,
  handoffFile: string,
  depth: number,
  runId: string,
  signalFile: string,
): string {
  const name = `agent-${Date.now()}`;
  run("zellij", ["action", "new-tab", "--name", name, "--cwd", cwd]);
  run("zellij", [
    "action", "new-pane", "--cwd", cwd, "--", "sh", "-lc",
    shellLaunch(agent, cwd, handoffFile, depth, runId, signalFile),
  ]);
  return name;
}

function hrdxSocketPath(): string {
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "hrdx", "hrdx.sock");
}

async function hrdxRequest(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const socket = net.createConnection(hrdxSocketPath());
  const { promise, resolve, reject } = Promise.withResolvers<Record<string, unknown>>();
  let buffer = "";
  socket.setTimeout(5000, () => {
    socket.destroy();
    reject(new Error("Timed out waiting for hrdx"));
  });
  socket.on("error", reject);
  socket.on("connect", () => socket.write(`${JSON.stringify({ id: "muxer-subagents-spawn", method, params })}\n`));
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    const newline = buffer.indexOf("\n");
    if (newline < 0) return;
    let response: unknown;
    try {
      response = JSON.parse(buffer.slice(0, newline));
    } catch (error) {
      socket.destroy();
      reject(error);
      return;
    }
    socket.end();
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      reject(new Error("hrdx returned an invalid response"));
      return;
    }
    const result = response as Record<string, unknown>;
    const error = result.error;
    if (error) {
      const message = typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error);
      reject(new Error(message));
    } else {
      const payload = result.result;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        reject(new Error("hrdx returned an invalid result"));
      } else resolve(payload as Record<string, unknown>);
    }
  });
  return promise;
}

async function spawnHrdx(
  agent: SpawnAgent,
  cwd: string,
  handoffFile: string,
  depth: number,
  runId: string,
  signalFile: string,
): Promise<string> {
  const pane = await hrdxRequest("pane.create", { workspace: cwd, kind: "shell", split: "tab" });
  const paneId = pane.pane_id;
  if (typeof paneId !== "number") throw new Error("hrdx did not report the new pane id");
  await hrdxRequest("pane.wait", { pane_id: paneId, until: "idle", timeout_ms: 30000 });
  const text = `sh -lc ${shellQuote(shellLaunch(agent, cwd, handoffFile, depth, runId, signalFile))}`;
  await hrdxRequest("pane.send_text", { pane_id: paneId, text, enter: true });
  return String(paneId);
}

export async function spawnAgent(options: SpawnOptions): Promise<SpawnResult> {
  const run = await createRun(options.muxer, options.agent);
  const signalFile = runSignalPath(run.runId);
  let directory: string | undefined;
  try {
    directory = mkdtempSync(join(tmpdir(), "muxer-subagents-"));
    const handoffFile = join(directory, "prompt.md");
    writeFileSync(handoffFile, options.prompt, "utf8");
    let target: string;
    let agentName: string | undefined;
    if (options.muxer === "herdr") {
      const herdrTarget = spawnHerdr(options.agent, options.cwd, handoffFile, options.depth);
      target = herdrTarget.target;
      agentName = herdrTarget.agentName;
      await writeRunSignal(run.runId, "running", "launcher");
      rmSync(directory, { recursive: true, force: true });
    } else if (options.muxer === "tmux") {
      target = spawnTmux(options.agent, options.cwd, handoffFile, options.depth, run.runId, signalFile);
    } else if (options.muxer === "zellij") {
      target = spawnZellij(options.agent, options.cwd, handoffFile, options.depth, run.runId, signalFile);
    } else {
      target = await spawnHrdx(options.agent, options.cwd, handoffFile, options.depth, run.runId, signalFile);
    }
    await updateRunTarget(run.runId, target, agentName);
    return { runId: run.runId, target };
  } catch (error) {
    if (directory) rmSync(directory, { recursive: true, force: true });
    await removeRun(run.runId);
    throw error;
  }
}
