// Owns run identity and immutable completion sequences, not domain success.
import { randomUUID } from "node:crypto";
import { watch } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Agent, Muxer } from "./types.ts";
import { assertRunPath, readRecord, validateManifest, validateRecord } from "./records.ts";

export type SignalState =
  | "starting"
  | "running"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export type SignalSource = "launcher" | "agent" | "process";

export interface RunManifest {
  schemaVersion?: "muxer-run/v2";
  runId: string;
  muxer: Exclude<Muxer, "unknown-muxer">;
  agent: Exclude<Agent, "unknown-agent">;
  target: string;
  agentName?: string;
  cwd?: string;
  operationId?: string;
  parentRunId?: string;
  createdAt: string;
}

export interface RunSignal {
  schemaVersion?: "muxer-completion/v2";
  version?: 1;
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

// Herdr starts the agent itself, so no launch script deletes the prompt when
// the agent exits. Keeping it in the run directory ties it to the run's life.
export function runPromptPath(runId: string): string {
  return join(runDirectory(runId), "prompt.md");
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  const parsed = await readRecord(path);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`Invalid JSON record: ${path}`);
  return parsed as Record<string, unknown>;
}

export async function createRun(
  muxer: RunManifest["muxer"],
  agent: RunManifest["agent"],
  ownership: Pick<RunManifest, "cwd" | "operationId" | "parentRunId"> = {},
): Promise<RunManifest> {
  await validateManifest();
  const runId = randomUUID();
  const directory = runDirectory(runId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const manifest: RunManifest = {
    schemaVersion: "muxer-run/v2",
    runId,
    muxer,
    agent,
    target: "",
    createdAt: new Date().toISOString(),
    ...ownership,
    operationId: ownership.operationId ?? runId,
  };
  validateRecord(manifest, "muxer-run", runId);
  await assertRunPath(join(directory, "run.json"));
  await writeFile(join(directory, "run.json"), `${JSON.stringify(manifest)}\n`, { mode: 0o600, flag: "wx" });
  await writeRunSignal(runId, "starting", "launcher");
  return manifest;
}

export async function updateRunTarget(runId: string, target: string, agentName?: string): Promise<RunManifest> {
  const directory = runDirectory(runId);
  const { manifest } = await readRun(runId);
  if (manifest.schemaVersion === undefined) throw new Error("Historical runs are immutable");
  const updated = { ...manifest, target, ...(agentName ? { agentName } : {}) };
  validateRecord(updated, "muxer-run", runId);
  const temporaryPath = join(directory, `run-${randomUUID()}.tmp`);
  await writeFile(temporaryPath, `${JSON.stringify(updated)}\n`, { mode: 0o600, flag: "wx" });
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
  await validateManifest();
  const manifest = await readJson(join(directory, "run.json"));
  validateRecord(manifest, "muxer-run", runId);
  let sequence = 0;
  try {
    const previous = await readJson(join(directory, "signal.json"));
    validateRecord(previous, "muxer-completion", runId);
    if (terminalStates[previous.state as SignalState]) {
      if (previous.state === state && previous.source === source && previous.exitCode === options.exitCode && previous.detail === options.detail) {
        return previous as unknown as RunSignal;
      }
      throw new Error("Terminal completion evidence is immutable");
    }
    sequence = (previous.sequence as number) + 1;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }

  const signal: RunSignal = {
    schemaVersion: "muxer-completion/v2",
    runId,
    sequence,
    state,
    source,
    timestamp: new Date().toISOString(),
    ...options,
  };
  validateRecord(signal, "muxer-completion", runId);
  await assertRunPath(join(directory, "signal.json"));
  await writeFile(join(directory, `signal-${sequence}.json`), `${JSON.stringify(signal)}\n`, { mode: 0o600, flag: "wx" });
  const temporaryPath = join(directory, `signal-${randomUUID()}.tmp`);
  await writeFile(temporaryPath, `${JSON.stringify(signal)}\n`, { mode: 0o600, flag: "wx" });
  await rename(temporaryPath, join(directory, "signal.json"));
  return signal;
}

export async function readRun(runId: string, historical = false): Promise<{ manifest: RunManifest; signal: RunSignal }> {
  await validateManifest();
  const directory = runDirectory(runId);
  const manifest = await readJson(join(directory, "run.json"));
  const signal = await readJson(join(directory, "signal.json"));
  validateRecord(manifest, "muxer-run", runId, historical);
  validateRecord(signal, "muxer-completion", runId, historical);
  if ((manifest.schemaVersion === undefined) !== (signal.schemaVersion === undefined)) throw new Error("Mixed run and completion contracts");
  return { manifest: manifest as unknown as RunManifest, signal: signal as unknown as RunSignal };
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
    const watcher = watch(directory, () => resolve());
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
  await readRun(runId);
  // Cleanup never removes run identity, completion evidence or delivery artifacts.
  await rm(runPromptPath(runId), { force: true });
}

// Shell launchers use this same validator and writer; no second wire producer.
if (import.meta.main) {
  const [runId, state, code] = process.argv.slice(2);
  if (!runId || !state || !Object.hasOwn(terminalStates, state) || (code && !/^\d+$/.test(code))) {
    throw new Error("Invalid launcher completion arguments");
  }
  await writeRunSignal(runId, state as SignalState, "process", code ? { exitCode: Number(code) } : {});
}
