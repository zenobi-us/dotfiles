import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS, TimeFrame } from "../numbers.ts";
import type { ProviderStrategy } from "../types.ts";

export const copilotProvider: ProviderStrategy = {
  id: "copilot",
  label: "Copilot",
  quotas: [{ id: "30_day", duration: TimeFrame.ThirtyDay }],
  hasAuthentication: () => hasAuthKey("github-copilot"),
  fetchUsage: async () => {
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

    return [
      {
        id: "30_day",
        remainingRatio: Math.max(0, Math.min(1, remaining / entitlement)),
      },
    ];
  },
};
