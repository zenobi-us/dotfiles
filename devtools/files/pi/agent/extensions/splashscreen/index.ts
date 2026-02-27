import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { SplashScreen } from "./splash";

/**
 * Pi Splash Screen Extension
 *
 * Shows pokemon-go-colorscripts output in a centered overlay at session start.
 * Dismisses on first user message or when the agent starts.
 */
export default function piSplash(pi: ExtensionAPI) {
  let headerActive = false;

  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;

    const header = new SplashScreen();
    headerActive = true;

    ctx.ui.setHeader(() => ({
      render(width: number): string[] {
        return header.render(width);
      },
      invalidate() {
        header.invalidate();
      },
    }));
  });

  // Dismiss on first user message
  pi.on("input", async (_event, ctx) => {
    if (headerActive) {
      headerActive = false;
      ctx.ui.setHeader(undefined);
    }
  });

  // Also dismiss when agent starts
  pi.on("agent_start", async (_event, ctx) => {
    if (headerActive) {
      headerActive = false;
      ctx.ui.setHeader(undefined);
    }
  });
}
