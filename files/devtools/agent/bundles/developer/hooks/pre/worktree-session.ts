import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

import {
  detectMuxer,
  renderSessionContext,
} from "../../skills/worktree/scripts/session-context.ts";

export default function worktreeSession(pi: ExtensionAPI): void {
  pi.setLabel("Worktree Session");

  let contextBlock: string | undefined;

  function refresh(): void {
    contextBlock = renderSessionContext(detectMuxer(), "pi");
  }

  pi.on("session_start", () => {
    refresh();
  });

  pi.on("session_switch", () => {
    refresh();
  });

  pi.on("before_agent_start", event => {
    if (!contextBlock) return;

    return {
      systemPrompt: [...event.systemPrompt, contextBlock],
    };
  });
}
