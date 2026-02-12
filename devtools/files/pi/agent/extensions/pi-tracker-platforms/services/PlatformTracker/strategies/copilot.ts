import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

// Copilot-specific metadata type
type CopilotMeta = {
  entitlement: number; // Total quota allocated
  resetTime: number; // Unix timestamp of next reset (1st of month)
  resetType: "calendar"; // Fixed calendar reset
  modelMultiplier: number; // Cost for this specific model
};

usageTracker.registerProvider<CopilotMeta>({
  id: "copilot",
  label: "Copilot",
  models: ["gpt-4o", "gpt-4.1", "gpt-5-mini", "standard", "spark"], // Multiple models
  quotas: [{ id: "30_day", amount: 300 }], // Amount-based quota
  hasAuthentication: () => hasAuthKey("github-copilot"),
  fetchUsage: async (): Promise<UsageSnapshot<CopilotMeta>[]> => {
    const auth = readPiAuthJson();
    const token = (auth["github-copilot"] as { refresh?: string } | undefined)
      ?.refresh;
    if (!token) return [];

    const res = await fetch("https://api.github.com/copilot_internal/user", {
      headers: {
        "Editor-Version": "vscode/1.96.2",
        "User-Agent": "GitHubCopilotChat/0.26.7",
        "X-Github-Api-Version": "2025-04-01",
        Accept: "application/json",
        Authorization: `token ${token}`,
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`copilot ${res.status}`);

    const data = (await res.json()) as {
      quota_snapshots?: {
        premium_interactions?: {
          percent_remaining?: number;
          remaining?: number;
          entitlement?: number;
        };
      };
    };

    const premium = data.quota_snapshots?.premium_interactions;
    if (!premium) return [];

    const entitlement = Math.max(1, premium.entitlement ?? 0);
    const remaining = Math.max(
      0,
      premium.remaining ??
        (entitlement * (premium.percent_remaining ?? 0)) / 100,
    );
    const used = entitlement - remaining;

    // Calculate next reset (1st of next month at midnight UTC)
    const now = new Date();
    const nextMonth = new Date(
      Date.UTC(
        now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(),
        now.getUTCMonth() === 11 ? 0 : now.getUTCMonth() + 1,
        1,
        0,
        0,
        0
      )
    );
    const resetTime = Math.floor(nextMonth.getTime() / 1000);

    // Model multipliers (0 = unlimited, >0 = cost multiplier)
    const multipliers: Record<string, number> = {
      "gpt-4o": 0,
      "gpt-4.1": 0,
      "gpt-5-mini": 0,
      "standard": 1,
      "spark": 4,
    };

    // Return snapshot per model (shared quota, different multipliers)
    const snapshots: UsageSnapshot<CopilotMeta>[] = [];

    for (const [modelId, multiplier] of Object.entries(multipliers)) {
      // Calculate effective quota for this model
      const effectiveRemaining =
        multiplier === 0 ? entitlement : remaining;
      const effectiveUsed =
        multiplier === 0 ? 0 : used;

      snapshots.push({
        id: "30_day",
        modelId,
        remaining: effectiveRemaining,
        used: effectiveUsed,
        remainingRatio: remaining / entitlement,
        usedRatio: used / entitlement,
        meta: {
          entitlement,
          resetTime,
          resetType: "calendar",
          modelMultiplier: multiplier,
        },
      });
    }

    return snapshots;
  },
});
