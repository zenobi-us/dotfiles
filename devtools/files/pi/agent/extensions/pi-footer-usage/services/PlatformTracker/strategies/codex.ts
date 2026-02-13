import { API_TIMEOUT_MS } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

// Codex-specific metadata type
type CodexMeta = {
  windowType: "rolling";
  windowSeconds: number;
};

type CodexAuth = {
  access?: string;
  accountId?: string;
};

function isCodexAuth(auth: unknown): auth is CodexAuth {
  if (!auth || typeof auth !== "object") return false;
  if (!("access" in auth) || typeof (auth as any).access !== "string")
    return false;
  if (!("accountId" in auth) || typeof (auth as any).accountId !== "string")
    return false;

  return true;
}

usageTracker.registerProvider<CodexMeta>({
  id: "codex",
  label: "Codex",
  models: ["default"], // Single model provider
  quotas: [
    { id: "primary", percentageOnly: true }, // Percentage-only quota
    { id: "secondary", percentageOnly: true },
  ],
  fetchUsage: async (ctx): Promise<UsageSnapshot<CodexMeta>[]> => {
    const auth = ctx.auth;
    if (!isCodexAuth(auth)) return [];
    const token = auth.access;
    if (!token) return [];

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (auth.accountId) {
      headers["ChatGPT-Account-Id"] = auth.accountId;
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

    const windows: UsageSnapshot<CodexMeta>[] = [];

    // Primary window with metadata
    const primary = data.rate_limit?.primary_window;
    if (primary) {
      const usedRatio = Math.max(
        0,
        Math.min(1, (primary.used_percent ?? 0) / 100),
      );
      windows.push({
        id: "primary",
        modelId: "default", // Single model
        usedRatio,
        remainingRatio: 1 - usedRatio,
        meta: {
          windowType: "rolling",
          windowSeconds: primary.limit_window_seconds ?? 18000, // Default 5 hours
        },
      });
    }

    // Secondary window with metadata
    const secondary = data.rate_limit?.secondary_window;
    if (secondary) {
      const usedRatio = Math.max(
        0,
        Math.min(1, (secondary.used_percent ?? 0) / 100),
      );
      windows.push({
        id: "secondary",
        modelId: "default", // Single model
        usedRatio,
        remainingRatio: 1 - usedRatio,
        meta: {
          windowType: "rolling",
          windowSeconds: secondary.limit_window_seconds ?? 604800, // Default 7 days
        },
      });
    }

    return windows;
  },
});
