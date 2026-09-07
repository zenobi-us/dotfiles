/**
 * Keeps the current Worktrunk branch marker aligned with Pi's lifecycle.
 *
 * The marker makes each worktree's agent state visible from `wt list`, including
 * when Pi runs in another terminal or pane. Worktrunk owns the shared state so
 * this extension does not need its own process, file, or UI synchronization.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Short symbols keep Worktrunk's shared status column readable across many branches. */
export const MARKERS = {
  working: "🤖",
  waiting: "💬",
} as const;

/**
 * Builds argv instead of a shell command so marker text never needs quoting or
 * escaping. An omitted marker means removal, which prevents stale status after
 * Pi shuts down.
 */
export function markerArgs(marker?: string): string[] {
  return marker === undefined
    ? ["config", "state", "marker", "clear"]
    : ["config", "state", "marker", "set", marker];
}

type WtResult = {
  code: number;
};

type RunWt = (args: string[]) => Promise<WtResult>;

/**
 * Creates a best-effort updater that stops invoking Worktrunk after its first
 * failure. Markers are informational; a missing or incompatible `wt` binary
 * must not break Pi or repeatedly add failing subprocesses to every turn.
 */
export function createMarkerUpdater(runWt: RunWt) {
  let enabled = true;

  async function update(marker?: string): Promise<void> {
    if (!enabled) return;

    try {
      const result = await runWt(markerArgs(marker));
      if (result.code !== 0) enabled = false;
    } catch {
      enabled = false;
    }
  }

  return {
    async markWorking(): Promise<void> {
      await update(MARKERS.working);
    },
    async markWaiting(): Promise<void> {
      await update(MARKERS.waiting);
    },
    async clear(): Promise<void> {
      await update();
    },
  };
}

/**
 * Maps Pi lifecycle events to coarse Worktrunk states. Start/end hooks avoid
 * polling Pi's internal state; a later retry or follow-up naturally switches
 * the marker back to working when the next agent run starts.
 */
export default function (pi: ExtensionAPI) {
  const tracker = createMarkerUpdater((args) => pi.exec("wt", args));

  pi.on("session_start", async () => {
    await tracker.markWaiting();
  });

  pi.on("agent_start", async () => {
    await tracker.markWorking();
  });

  pi.on("agent_end", async () => {
    await tracker.markWaiting();
  });

  pi.on("session_shutdown", async () => {
    await tracker.clear();
  });
}
