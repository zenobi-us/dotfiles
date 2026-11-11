// The TUI owns agent launch and native turn state, not process-exit signals.
import { spawn, spawnSync } from "node:child_process";
import { isAbsolute, relative, resolve } from "node:path";
import { run } from "../shell-launch.ts";
import { writeRunSignal, type RunSignal } from "../signals.ts";
import type { AgentId, AgentInvocation, MuxerModule, WaitRequest } from "./types.ts";

export const muxer = {
  id: "herdr",
  contract: "references/muxers/herdr.md",
  promptLifetime: "turn",
  detect: (environment) => environment.HERDR_ENV === "1",
  supports: (agent) => agent !== "zot",
  async launch(request) {
    const result = await spawnHerdr(request.agent, request.cwd, request.depth, request.environment);
    await writeRunSignal(request.runId, "running", "launcher");
    return result;
  },
  wait: waitForHerdr,
} satisfies MuxerModule;

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

function isInside(path: string, root: string): boolean {
  const relativePath = relative(root, path);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

// The worktree list "source" is the main checkout. A linked worktree has its
// own workspace, so pick the entry that holds cwd and open it when needed.
function herdrWorktreeWorkspace(cwd: string): string {
  const listing = resultValue(run("herdr", ["worktree", "list", "--cwd", cwd, "--json"]));
  const worktrees = Array.isArray(listing.worktrees) ? listing.worktrees as Record<string, unknown>[] : [];
  const worktree = worktrees
    .filter((entry) => typeof entry.path === "string" && isInside(resolve(cwd), entry.path))
    .sort((a, b) => String(b.path).length - String(a.path).length)[0];
  if (!worktree) throw new Error(`Herdr did not report a worktree that contains ${cwd}`);
  if (worktree.open_workspace_id) return String(worktree.open_workspace_id);

  const opened = resultValue(run("herdr", ["worktree", "open", "--path", String(worktree.path), "--no-focus"]));
  const workspace = opened.workspace_id
    ?? nestedRecord(opened, "workspace")?.workspace_id
    ?? nestedRecord(opened, "workspace")?.id
    ?? opened.open_workspace_id;
  if (!workspace) throw new Error(`Herdr did not report a workspace for worktree ${String(worktree.path)}`);
  return String(workspace);
}

// `herdr agent start` can time out on readiness although the agent started.
function herdrAgentInPane(paneId: string, agent: AgentId): boolean {
  const result = spawnSync("herdr", ["agent", "get", paneId], { encoding: "utf8" });
  if (result.status !== 0) return false;
  try {
    return nestedRecord(resultValue(result.stdout), "agent")?.agent === agent;
  } catch {
    return false;
  }
}

function herdrRejectedBusyShell(error: unknown, paneId: string): boolean {
  try {
    if (!(error instanceof Error) || JSON.parse(error.message)?.error?.code !== "agent_pane_busy") return false;
    const result = spawnSync("herdr", ["pane", "process-info", "--pane", paneId], { encoding: "utf8" });
    if (result.status !== 0) return false;
    const info = nestedRecord(resultValue(result.stdout), "process_info");
    const processes = info?.foreground_processes;
    return typeof info?.shell_pid === "number" && Array.isArray(processes)
      && processes.length === 1 && processes[0]?.pid === info.shell_pid;
  } catch {
    return false;
  }
}

async function spawnHerdr(agent: AgentInvocation, cwd: string, depth: number, environment: Readonly<Record<string, string>>): Promise<{ target: string; agentName: string }> {
  const workspace = herdrWorktreeWorkspace(cwd);
  const agentName = `agent-${Date.now()}`;
  const tab = resultValue(run("herdr", [
    "tab", "create", "--workspace", String(workspace), "--cwd", cwd,
    "--label", agentName, "--no-focus", "--env", `MUXER_SUBAGENT_DEPTH=${depth}`,
    ...Object.entries(environment).flatMap(([key, value]) => ["--env", `${key}=${value}`]),
  ]));
  const paneId = tab.pane_id ?? tab.root_pane_id ?? nestedRecord(tab, "root_pane")?.pane_id ?? nestedRecord(tab, "pane")?.id;
  if (paneId === undefined) throw new Error("Herdr did not report the new tab's root pane id");
  const deadline = Date.now() + 30_000;
  for (; ;) {
    try {
      run("herdr", [
        "agent", "start", agentName, "--kind", agent.id, "--pane", String(paneId), ...agent.argv.slice(1),
      ]);
      break;
    } catch (error) {
      // A readiness timeout can follow a successful launch; never dispatch it twice.
      if (herdrAgentInPane(String(paneId), agent.id)) return { target: String(paneId), agentName: String(paneId) };
      // New tabs can precede their shell prompt. Retry only a proven pre-launch rejection.
      if (Date.now() >= deadline || !herdrRejectedBusyShell(error, String(paneId))) throw error;
      await Bun.sleep(100);
    }
  }
  return { target: String(paneId), agentName };
}

interface ChildExit {
  code: number | null;
  error?: Error;
}

function waitForHerdrState(agentName: string, state: "working" | "done" | "blocked"): {
  child: ReturnType<typeof spawn>;
  result: Promise<ChildExit>;
} {
  const child = spawn("herdr", ["agent", "wait", agentName, "--until", state], { stdio: "ignore" });
  const { promise, resolve } = Promise.withResolvers<ChildExit>();
  child.once("error", (error) => resolve({ code: null, error }));
  child.once("exit", (code) => resolve({ code }));
  return { child, result: promise };
}

async function waitForHerdr(options: WaitRequest): Promise<RunSignal | null> {
  const { manifest, current } = options;
  if (!manifest.agentName) throw new Error("Herdr run has no agent name");
  const { promise: timeout, resolve: expire } = Promise.withResolvers<"timeout">();
  const timer = options.timeoutMs === undefined
    ? undefined
    : setTimeout(() => expire("timeout"), options.timeoutMs);
  const children: ReturnType<typeof spawn>[] = [];

  try {
    if (current.state === "blocked" && options.afterSequence >= current.sequence) {
      const resumed = waitForHerdrState(manifest.agentName, "working");
      children.push(resumed.child);
      const result = await Promise.race([resumed.result, timeout]);
      if (result === "timeout") return null;
      if (result.code !== 0) {
        throw result.error ?? new Error("Herdr agent did not return to working state");
      }
    }

    const done = waitForHerdrState(manifest.agentName, "done");
    const blocked = waitForHerdrState(manifest.agentName, "blocked");
    children.push(done.child, blocked.child);
    const result = await Promise.race([
      done.result.then((exit) => ({ state: "completed" as const, exit })),
      blocked.result.then((exit) => ({ state: "blocked" as const, exit })),
      timeout,
    ]);
    if (result === "timeout") return null;
    if (result.exit.code !== 0) {
      throw result.exit.error ?? new Error(`Herdr agent wait for ${result.state} failed`);
    }
    return await writeRunSignal(options.manifest.runId, result.state, "agent");
  } finally {
    clearTimeout(timer);
    for (const child of children) child.kill("SIGTERM");
  }
}
