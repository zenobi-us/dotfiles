import { spawn } from "node:child_process";
import { readRun, waitForRunSignal, writeRunSignal, type RunSignal } from "./signals.ts";

export interface WaitOptions {
  runId: string;
  afterSequence: number;
  timeoutMs?: number;
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

async function waitForHerdr(options: WaitOptions, current: RunSignal): Promise<RunSignal | null> {
  const { manifest } = await readRun(options.runId);
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
    return await writeRunSignal(options.runId, result.state, "agent");
  } finally {
    clearTimeout(timer);
    for (const child of children) child.kill("SIGTERM");
  }
}

export async function waitForAgent(options: WaitOptions): Promise<RunSignal | null> {
  const { manifest, signal } = await readRun(options.runId);
  if (signal.sequence > options.afterSequence &&
      (signal.state === "blocked" || signal.state === "completed" ||
        signal.state === "failed" || signal.state === "cancelled")) {
    return signal;
  }
  if (manifest.muxer === "herdr") return waitForHerdr(options, signal);
  return waitForRunSignal(options.runId, options.afterSequence, options.timeoutMs);
}
