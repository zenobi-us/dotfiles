import { hasAuthKey, readPiAuthJson } from "../auth";
import { API_TIMEOUT_MS, percentToWindow } from "../numbers";
import { ProviderStrategy } from "../types";

export const codexProvider: ProviderStrategy = {
  id: "codex",
  label: "Codex",
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

    const windows = [];
    const primary = data.rate_limit?.primary_window;
    if (primary) {
      windows.push(
        percentToWindow(
          primary.used_percent ?? 0,
          Math.max(
            1,
            Math.round((primary.limit_window_seconds ?? 10_800) / 60),
          ),
        ),
      );
    }

    const secondary = data.rate_limit?.secondary_window;
    if (secondary) {
      windows.push(
        percentToWindow(
          secondary.used_percent ?? 0,
          Math.max(
            1,
            Math.round((secondary.limit_window_seconds ?? 86_400) / 60),
          ),
        ),
      );
    }

    return windows;
  },
};
