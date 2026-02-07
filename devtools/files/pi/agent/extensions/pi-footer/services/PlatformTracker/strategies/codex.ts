import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS, TimeFrame } from "../numbers.ts";
import type { ProviderStrategy, UsageSnapshot } from "../types.ts";

export const codexProvider: ProviderStrategy = {
  id: "codex",
  label: "Codex",
  quotas: [
    { id: "primary", duration: TimeFrame.FiveHour },
    { id: "secondary", duration: TimeFrame.SevenDay },
  ],
  hasAuthentication: () => hasAuthKey("openai-codex"),
  fetchUsage: async () => {
    const auth = readPiAuthJson();
    const codex = auth["openai-codex"] as
      | { access?: string; accountId?: string }
      | undefined;
    const token = codex?.access;
    if (!token) return [];

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (codex?.accountId) {
      headers["ChatGPT-Account-Id"] = codex.accountId;
    }

    const res = await fetch("https://chatgpt.com/backend-api/wham/usage", {
      headers,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`codex ${res.status}`);

    const data = (await res.json()) as {
      rate_limit?: {
        primary_window?: {
          limit_window_seconds?: number;
          used_percent?: number;
        };
        secondary_window?: {
          limit_window_seconds?: number;
          used_percent?: number;
        };
      };
    };

    const windows: UsageSnapshot[] = [];
    const primary = data.rate_limit?.primary_window;
    if (primary) {
      const usedRatio = Math.max(
        0,
        Math.min(1, (primary.used_percent ?? 0) / 100),
      );
      windows.push({
        id: "primary",
        usedRatio,
        remainingRatio: 1 - usedRatio,
      });
    }

    const secondary = data.rate_limit?.secondary_window;
    if (secondary) {
      const usedRatio = Math.max(
        0,
        Math.min(1, (secondary.used_percent ?? 0) / 100),
      );
      windows.push({
        id: "secondary",
        usedRatio,
        remainingRatio: 1 - usedRatio,
      });
    }

    return windows;
  },
};
