import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { registerUsageStoreCommand } from "../pi-tracker-platforms/cmds/usage-store.ts";
import { registerContextProvidersCommand } from "./cmds/context-providers.ts";
import { Footer } from "./footer.ts";
import { Config } from "./services/config";
import "./context/cwd.ts";
import "./context/git.ts";
import "./context/model.ts";
import "./context/numbers.ts";
import "./context/time.ts";

export { Footer };
export default function piFooterExtension(pi: ExtensionAPI) {
  registerUsageStoreCommand(pi);
  registerContextProvidersCommand(pi, Footer);

  const attach = (ctx: ExtensionContext) => {
    ctx.ui.setFooter((tui, theme, footerData) => {
      const unsubscribeBranch = footerData.onBranchChange(() =>
        tui.requestRender(),
      );

      return {
        dispose() {
          unsubscribeBranch();
        },
        invalidate() {
          tui.requestRender();
        },
        render(width: number) {
          return Footer.render(pi, ctx, theme, width, {
            template: Config.template,
          });
        },
      };
    });
  };

  pi.on("session_start", async (_event, ctx) => {
    attach(ctx);
  });

  pi.on("session_switch", async (_event, ctx) => {
    attach(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setFooter(undefined);
  });
}
