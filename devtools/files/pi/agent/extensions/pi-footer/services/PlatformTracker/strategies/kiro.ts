import { execFileSync } from "node:child_process";
import { API_TIMEOUT_MS, percentToSnapshot } from "../numbers.ts";
import { usageTracker } from "../store.ts";

usageTracker.registerProvider({
  id: "kiro",
  label: "Kiro",
  quotas: [{ id: "global", amount: 100 }],
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
  fetchUsage: async () => {
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
    return [percentToSnapshot("global", used)];
  },
});
