import { rm } from "node:fs/promises";
import { readRun, runPromptPath, type RunSignal } from "./signals.ts";
import { muxers } from "./modules/index.ts";

export interface WaitOptions {
  runId: string;
  afterSequence: number;
  timeoutMs?: number;
}


function isTerminal(signal: RunSignal): boolean {
  return signal.state === "completed" || signal.state === "failed" || signal.state === "cancelled";
}

// The run has ended, so the agent no longer needs its prompt file.
async function removePromptWhenEnded(signal: RunSignal | null): Promise<RunSignal | null> {
  if (signal && isTerminal(signal)) await rm(runPromptPath(signal.runId), { force: true });
  return signal;
}

export async function waitForAgent(options: WaitOptions): Promise<RunSignal | null> {
  const { manifest, signal } = await readRun(options.runId);
  if (signal.sequence > options.afterSequence && (signal.state === "blocked" || isTerminal(signal))) {
    return removePromptWhenEnded(signal);
  }
  const muxer = muxers[manifest.muxer];
  return removePromptWhenEnded(await muxer.wait({
    manifest,
    current: signal,
    afterSequence: options.afterSequence,
    timeoutMs: options.timeoutMs,
  }));
}
