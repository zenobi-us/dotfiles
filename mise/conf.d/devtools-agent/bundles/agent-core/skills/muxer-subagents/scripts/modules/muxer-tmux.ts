// Launches tmux panes; process signals determine completion.
import { run, shellLaunch } from "../shell-launch.ts";
import { waitForRunSignal } from "../signals.ts";
import type { MuxerModule } from "./types.ts";

export const muxer = {
  id: "tmux",
  contract: "references/muxers/tmux.md",
  promptLifetime: "process",
  detect: (environment) => Boolean(environment.TMUX),
  supports: () => true,
  async launch(request) {
    const target = run("tmux", [
      "split-window", "-d", "-P", "-F", "#{pane_id}", "-c", request.cwd,
      "-e", `MUXER_SUBAGENT_DEPTH=${request.depth}`,
      "sh", "-lc", shellLaunch(request),
    ]);
    return { target };
  },
  wait: ({ manifest, afterSequence, timeoutMs }) => waitForRunSignal(manifest.runId, afterSequence, timeoutMs),
} satisfies MuxerModule;
