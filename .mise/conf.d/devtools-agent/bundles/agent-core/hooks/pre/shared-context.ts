import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

import {
  renderSharedContext,
  resolveSharedContext,
} from "../../skills/shared-context/scripts/shared-context/lib";

export default function sharedContext(pi: ExtensionAPI): void {
  pi.setLabel("Shared Context");

  let contextBlock: string | undefined;

  async function refresh(cwd: string): Promise<void> {
    contextBlock = undefined;

    const context = await resolveSharedContext(
      async (command, args) => {
        const result = await pi.exec(command, args, { cwd });
        return { stdout: result.stdout, code: result.code };
      },
      cwd,
    );

    if (context) contextBlock = renderSharedContext(context);
  }

  pi.on("session_start", async (_event, ctx) => {
    await refresh(ctx.cwd);
  });

  pi.on("session_switch", async (_event, ctx) => {
    await refresh(ctx.cwd);
  });

  pi.on("before_agent_start", event => {
    if (!contextBlock) return;

    return {
      systemPrompt: [...event.systemPrompt, contextBlock],
    };
  });
}
