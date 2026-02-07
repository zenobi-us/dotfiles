import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { defaultFooterProviders } from "./context/index.ts";
import { createFooterSingleton } from "./footer.ts";
import { usageTracker } from "./services/PlatformTracker/store.ts";
import { Config } from "./services/config";

export const Footer = createFooterSingleton();

for (const { name, provider } of defaultFooterProviders) {
  Footer.registerContextProvider(name, provider);
}

export default function piFooterExtension(pi: ExtensionAPI) {
  const attach = (ctx: ExtensionContext) => {
    usageTracker.start(ctx);

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
    attach(ctx);
  });

  pi.on("session_switch", async (_event, ctx) => {
    attach(ctx);
  });

  pi.on("session_shutdown", async () => {
    usageTracker.stop();
  });
}
