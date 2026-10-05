import { randomUUID } from "node:crypto";
import { watch } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { Agent, Muxer } from "./types.ts";

export type SignalState =
  | "starting"
  | "running"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export type SignalSource = "launcher" | "agent" | "process";

export interface RunManifest {
  runId: string;
  muxer: Exclude<Muxer, "unknown-muxer">;
  agent: Exclude<Agent, "unknown-agent">;
  target: string;
  agentName?: string;
  createdAt: string;
}

export interface RunSignal {
  version: 1;
  runId: string;
  sequence: number;
  state: SignalState;
  source: SignalSource;
  timestamp: string;
  exitCode?: number;
  detail?: string;
}

const terminalStates: Record<SignalState, true | undefined> = {
  starting: undefined,
  running: undefined,
  blocked: undefined,
  completed: true,
  failed: true,
  cancelled: true,
};

function runsRoot(): string {
  const stateRoot = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(stateRoot, "muxer-subagents", "runs");
}

function runDirectory(runId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(runId)) {
    throw new Error("Invalid run id");
  }
  return join(runsRoot(), runId);
}
export function runSignalPath(runId: string): string {
  return join(runDirectory(runId), "signal.json");
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid JSON record: ${path}`);
  }
  return parsed as Record<string, unknown>;
}

export async function createRun(muxer: RunManifest["muxer"], agent: RunManifest["agent"]): Promise<RunManifest> {
  const runId = randomUUID();
  const directory = runDirectory(runId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const manifest: RunManifest = {
    runId,
    muxer,
    agent,
    target: "",
    createdAt: new Date().toISOString(),
  };
  await writeFile(join(directory, "run.json"), `${JSON.stringify(manifest)}\n`, { mode: 0o600 });
  await writeRunSignal(runId, "starting", "launcher");
  return manifest;
}

export async function updateRunTarget(runId: string, target: string, agentName?: string): Promise<RunManifest> {
  const directory = runDirectory(runId);
  const manifest = await readJson(join(directory, "run.json")) as unknown as RunManifest;
  const updated = { ...manifest, target, ...(agentName ? { agentName } : {}) };
  const temporaryPath = join(directory, "run.json.tmp");
  await writeFile(temporaryPath, `${JSON.stringify(updated)}\n`, { mode: 0o600 });
  await rename(temporaryPath, join(directory, "run.json"));
  return updated;
}

export async function writeRunSignal(
  runId: string,
  state: SignalState,
  source: SignalSource,
  options: { exitCode?: number; detail?: string } = {},
): Promise<RunSignal> {
  const directory = runDirectory(runId);
  let sequence = 0;
  try {
    const previous = await readJson(join(directory, "signal.json"));
    if (typeof previous.sequence === "number") sequence = previous.sequence + 1;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }

  const signal: RunSignal = {
    version: 1,
    runId,
    sequence,
    state,
    source,
    timestamp: new Date().toISOString(),
    ...options,
  };
  const temporaryPath = join(directory, "signal.json.tmp");
  await writeFile(temporaryPath, `${JSON.stringify(signal)}\n`, { mode: 0o600 });
  await rename(temporaryPath, join(directory, "signal.json"));
  return signal;
}

export async function readRun(runId: string): Promise<{ manifest: RunManifest; signal: RunSignal }> {
  const directory = runDirectory(runId);
  const manifest = await readJson(join(directory, "run.json")) as unknown as RunManifest;
  const signalRecord = await readJson(join(directory, "signal.json"));
  if (manifest.runId !== runId || signalRecord.runId !== runId || signalRecord.version !== 1) {
    throw new Error("Run manifest or signal id does not match");
  }
  return { manifest, signal: signalRecord as unknown as RunSignal };
}

export async function waitForRunSignal(
  runId: string,
  afterSequence: number,
  timeoutMs?: number,
): Promise<RunSignal | null> {
  const directory = runDirectory(runId);
  const deadline = timeoutMs === undefined ? undefined : Date.now() + timeoutMs;

  while (true) {
    const { signal } = await readRun(runId);
    if (signal.sequence > afterSequence && (terminalStates[signal.state] === true || signal.state === "blocked")) {
      return signal;
    }

    const { promise, resolve } = Promise.withResolvers<void>();
    const watcher = watch(directory, resolve);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const changed = await readRun(runId);
      if (changed.signal.sequence > afterSequence &&
          (terminalStates[changed.signal.state] === true || changed.signal.state === "blocked")) {
        return changed.signal;
      }
      const remaining = deadline === undefined ? undefined : Math.max(0, deadline - Date.now());
      if (remaining === 0) return null;
      if (remaining !== undefined) timer = setTimeout(resolve, remaining);
      await promise;
    } finally {
      clearTimeout(timer);
      watcher.close();
    }
  }
}

export async function removeRun(runId: string): Promise<void> {
  await rm(runDirectory(runId), { recursive: true, force: true });
}
