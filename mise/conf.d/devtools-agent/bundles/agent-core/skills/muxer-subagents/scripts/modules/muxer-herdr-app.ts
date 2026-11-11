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
  const listing = call("herdr-app", ["ls"]);
  const spaces = listing.spaces as Array<{
    id: string;
    folder?: string | null;
    machine?: string | null;
    tabs: Array<{ terminals: Array<{ terminal: string }> }>;
  }>;
  const parentSpace = spaces.find((entry) => entry.tabs.some((tab) => tab.terminals.some((terminal) => terminal.terminal === parent)));
  if (!parentSpace) throw new Error(`herdr-app did not report a space containing ${parent}.`);
  if (parentSpace.machine) throw new Error("herdr-app router requires a local space: delivery files are local.");
  const folder = resolve(cwd);
  const matches = spaces.filter((entry) =>
    !entry.machine && typeof entry.folder === "string" && isAbsolute(entry.folder) && resolve(entry.folder) === folder);
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
    ? call("herdr-app", ["do", "tab.new", JSON.stringify({ space: space.id, name, folder, argv })])
    : call("herdr-app", ["do", "space.new", JSON.stringify({
      name: basename(folder), tab: name, folder, argv, machine: "",
    })]);
  if (typeof opened.terminal !== "string") throw new Error("herdr-app did not return the created terminal address.");
  return opened.terminal;
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