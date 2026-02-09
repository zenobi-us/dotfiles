import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { registerUsageStoreCommand } from "./cmds/usage-store.ts";
import { registerContextProvidersCommand } from "./cmds/context-providers.ts";
import { Footer } from "./footer.ts";
import { usageTracker } from "./services/PlatformTracker/store.ts";
import { Config } from "./services/config";
import "./context/cwd.ts";
import "./context/git.ts";
import "./context/model.ts";
import "./context/numbers.ts";
import "./context/time.ts";
import "./context/usage.ts";
import "./services/PlatformTracker/strategies/anthropic.ts";
import "./services/PlatformTracker/strategies/antigravity.ts";
import "./services/PlatformTracker/strategies/codex.ts";
import "./services/PlatformTracker/strategies/copilot.ts";
import "./services/PlatformTracker/strategies/gemini.ts";
import "./services/PlatformTracker/strategies/kiro.ts";
import "./services/PlatformTracker/strategies/zai.ts";

export default function piFooterExtension(pi: ExtensionAPI) {
  registerUsageStoreCommand(pi);
  registerContextProvidersCommand(pi, Footer);

  const attach = (ctx: ExtensionContext) => {
    usageTracker.start(ctx);
    usageTracker.trigger("attach");

    ctx.ui.setFooter((tui, theme, footerData) => {
      const unsubscribeBranch = footerData.onBranchChange(() =>
        tui.requestRender(),
      );
      const unsubscribeTracker = usageTracker.subscribe(() =>
        tui.requestRender(),
      );

      return {
        dispose() {
          unsubscribeBranch();
          unsubscribeTracker();
        },
        invalidate() {
          tui.requestRender();
        },
        render(width: number) {
          return Footer.render(ctx, theme, width, {
            template: Config.template,
          });
        },
      };
    });
  };

  pi.on("session_start", async (_event, ctx) => {
    usageTracker.stop();
    attach(ctx);
  });

  pi.on("session_switch", async (_event, ctx) => {
    usageTracker.stop();
    attach(ctx);
  });

  pi.on("turn_start", async () => {
    usageTracker.trigger("turn_start");
  });

  pi.on("tool_result", async () => {
    usageTracker.trigger("tool_result");
  });

  pi.on("turn_end", async () => {
    usageTracker.trigger("turn_end");
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setFooter(undefined);
    usageTracker.stop();
  });
}
