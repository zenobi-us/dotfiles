import { execFileSync } from "node:child_process";
import { API_TIMEOUT_MS, percentToSnapshot } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

// Kiro metadata type (no extra metadata for now)
type KiroMeta = Record<string, unknown>;

usageTracker.registerProvider<KiroMeta>({
  id: "kiro",
  label: "Kiro",
  models: ["default"], // Single model provider
  quotas: [{ id: "global", percentageOnly: true }], // Percentage-only quota
  hasAuthentication: () => {
    try {
      execFileSync("kiro-cli", ["whoami"], {
        encoding: "utf-8",
        timeout: API_TIMEOUT_MS,
        stdio: ["ignore", "pipe", "pipe"],
      });
      return true;
    } catch {
      return false;
    }
  },
  fetchUsage: async (): Promise<UsageSnapshot<KiroMeta>[]> => {
    const output = execFileSync(
      "kiro-cli",
      ["chat", "--no-interactive", "/usage"],
      {
        encoding: "utf-8",
        timeout: API_TIMEOUT_MS,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    const percentMatch = output.match(/█+\s*(\d+)%/);
    const used = percentMatch ? Number(percentMatch[1]) : 0;
    return [percentToSnapshot("global", "default", used)];
  },
});
