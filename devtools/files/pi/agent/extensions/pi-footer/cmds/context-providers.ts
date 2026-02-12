import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { FooterInstance } from "../types.ts";

export function registerContextProvidersCommand(
  pi: ExtensionAPI,
  footer: FooterInstance,
): void {
  pi.registerCommand("context-providers", {
    description: "List registered footer context providers",
    handler: async (_args, ctx) => {
      const providers = Array.from(footer.template.providers.keys()).sort(
        (a, b) => a.localeCompare(b),
      );

      if (!ctx.hasUI) {
        console.log(providers.join("\n"));
        return;
      }

      await ctx.ui.select(
        `Registered context providers (${providers.length} total)`,
        providers,
      );
    },
  });
}
