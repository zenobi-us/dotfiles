// Launches Zellij tabs and panes; process signals determine completion.
import { run, shellLaunch } from "../shell-launch.ts";
import { waitForRunSignal } from "../signals.ts";
import type { MuxerModule } from "./types.ts";

export const muxer = {
  id: "zellij",
  contract: "references/muxers/zellij.md",
  promptLifetime: "process",
  detect: (environment) => Boolean(environment.ZELLIJ),
  supports: () => true,
  async launch(request) {
    const name = `agent-${Date.now()}`;
    run("zellij", ["action", "new-tab", "--name", name, "--cwd", request.cwd]);
    run("zellij", ["action", "new-pane", "--cwd", request.cwd, "--", "sh", "-lc", shellLaunch(request)]);
    return { target: name };
  },
  wait: ({ manifest, afterSequence, timeoutMs }) => waitForRunSignal(manifest.runId, afterSequence, timeoutMs),
} satisfies MuxerModule;
