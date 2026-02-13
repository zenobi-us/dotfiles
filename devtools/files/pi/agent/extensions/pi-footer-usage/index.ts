import type { ExtensionFactory } from "@mariozechner/pi-coding-agent";
import { Footer } from "@zenobius/pi-footer";

import "./services/PlatformTracker/strategies/anthropic.ts";
import "./services/PlatformTracker/strategies/antigravity.ts";
import "./services/PlatformTracker/strategies/codex.ts";
import "./services/PlatformTracker/strategies/copilot.ts";
import "./services/PlatformTracker/strategies/gemini.ts";

import { usageTracker } from "./services/PlatformTracker/store.ts";

const PiFooterUsageExtension: ExtensionFactory = (pi) => {
  usageTracker.start();

  pi.events.on("session_start", () => {
    usageTracker.trigger("start");
  });

  pi.events.on("session_end", () => {
    usageTracker.stop();
  });
};

export default PiFooterUsageExtension;
