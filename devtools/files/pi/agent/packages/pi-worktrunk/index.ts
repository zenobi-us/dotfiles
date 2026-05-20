import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export const MARKERS = {
  working: "🤖",
  waiting: "💬",
} as const;

export function markerArgs(marker?: string): string[] {
  return marker === undefined
    ? ["config", "state", "marker", "clear"]
    : ["config", "state", "marker", "set", marker];
}

type WtResult = {
  code: number;
};

type RunWt = (args: string[]) => Promise<WtResult>;

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
