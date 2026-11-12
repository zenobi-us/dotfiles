// The desktop app owns placement; hc owns native terminal state.
import { spawn, spawnSync } from "node:child_process";
import { basename, isAbsolute, resolve } from "node:path";
import { writeRunSignal, type RunSignal } from "../signals.ts";
import type { AgentInvocation, MuxerModule } from "./types.ts";

export const muxer = {
  id: "herdr-app",
  contract: "references/muxers/herdr-app.md",
  promptLifetime: "turn",
  detect: (environment) => Boolean(environment.HC_TERMINAL_ID),
  supports: () => true,
  async launch(request) {
    const target = spawnHerdrApp(request.agent, request.cwd, request.depth, request.environment, request.runId);
    await writeRunSignal(request.runId, "running", "launcher");
    return { target };
  },
  wait: ({ manifest, timeoutMs }) => waitForHerdrApp(manifest.runId, manifest.target, timeoutMs),
} satisfies MuxerModule;

// WSL reaches the Windows app through interop; its Programs folder is not on the WSL PATH.
function appCommand(): string {
  // Bun's default lookup keeps the process-start PATH.
  const PATH = process.env.PATH;
  const command = process.env.HERDR_APP_BIN || Bun.which("herdr-app", { PATH }) || Bun.which("herdr-app.exe", { PATH });
  if (!command) throw new Error("herdr-app is not on PATH. Set HERDR_APP_BIN to the app executable, for example the Windows herdr-app.exe when the parent runs in WSL.");
  return command;
}

function call(command: string, args: string[]): Record<string, unknown> {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || `${command} exited ${result.status}`);
  return JSON.parse(result.stdout);
}

function spawnHerdrApp(
  agent: AgentInvocation,
  cwd: string,
  depth: number,
  environment: Record<string, string>,
  runId: string,
): string {
  const parent = process.env.HC_TERMINAL_ID;
  if (!parent) throw new Error("herdr-app requires HC_TERMINAL_ID to locate the parent space.");
  const app = appCommand();
  const listing = call(app, ["ls"]);
  const spaces = listing.spaces as Array<{
    id: string;
    folder?: string | null;
    machine?: string | null;
    tabs: Array<{ terminals: Array<{ terminal: string }> }>;
  }>;
  // The app prefixes a terminal on another machine with that machine's name, such as "wsl/t7".
  const parentSpaces = spaces.filter((entry) => entry.tabs.some((tab) => tab.terminals.some((terminal) =>
    terminal.terminal === (entry.machine ? `${entry.machine}/${parent}` : parent))));
  if (parentSpaces.length === 0) throw new Error(`herdr-app did not report a space containing ${parent}.`);
  if (parentSpaces.length > 1) throw new Error(`herdr-app reported ${parent} on more than one machine: ${parentSpaces.map((entry) => entry.id).join(", ")}.`);
  // This router runs in the parent terminal, so delivery files are local to the parent's machine.
  const machine = parentSpaces[0]!.machine || null;
  const folder = resolve(cwd);
  const matches = spaces.filter((entry) =>
    (entry.machine || null) === machine && typeof entry.folder === "string" && isAbsolute(entry.folder) && resolve(entry.folder) === folder);
  if (matches.length > 1) {
    throw new Error(`herdr-app reported multiple local spaces for the target directory: ${matches.map((entry) => entry.id).join(", ")}. Keep one target space before launching.`);
  }
  const argv = [
    "env", `MUXER_SUBAGENT_DEPTH=${depth}`,
    ...Object.entries(environment).map(([key, value]) => `${key}=${value}`),
    ...agent.argv,
  ];
  const space = matches[0];
  const name = `agent-${runId.slice(0, 8)}`;
  const opened = space
    ? call(app, ["do", "tab.new", JSON.stringify({ space: space.id, name, folder, argv })])
    : call(app, ["do", "space.new", JSON.stringify({
      name: basename(folder), tab: name, folder, argv, machine: machine ?? "",
    })]);
  if (typeof opened.terminal !== "string") throw new Error("herdr-app did not return the created terminal address.");
  // hc on the parent's machine knows the terminal by its local address.
  return machine && opened.terminal.startsWith(`${machine}/`) ? opened.terminal.slice(machine.length + 1) : opened.terminal;
}

async function waitForHerdrApp(runId: string, target: string, timeoutMs?: number): Promise<RunSignal | null> {
  const args = ["wait", target, "--json"];
  if (timeoutMs !== undefined) args.push("--timeout", String(Math.max(1, Math.ceil(timeoutMs / 1000))));
  const child = spawn("hc", args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const { promise, resolve, reject } = Promise.withResolvers<number | null>();
  child.once("error", reject);
  child.once("close", resolve);
  const code = await promise;
  if (code !== 0) throw new Error(stderr.trim() || `hc wait exited ${code}`);
  const result = JSON.parse(stdout);
  if (result.reason === "timeout" || result.reason === "message") return null;
  if (result.reason === "exit") {
    if (typeof result.exit_code !== "number" && typeof result.signal !== "number") {
      throw new Error("hc reported terminal loss without an exit code or signal; completion is unconfirmed.");
    }
    const exitCode = result.exit_code ?? 128 + result.signal;
    return writeRunSignal(runId, exitCode === 0 ? "completed" : "failed", "process", { exitCode });
  }
  if (result.status === "done") return writeRunSignal(runId, "completed", "agent");
  if (result.status === "blocked") return writeRunSignal(runId, "blocked", "agent");
  if (result.status === "error") return writeRunSignal(runId, "failed", "agent");
  throw new Error(`hc did not confirm completion (${result.reason}: ${result.status}); read ${target} before waiting again.`);
}