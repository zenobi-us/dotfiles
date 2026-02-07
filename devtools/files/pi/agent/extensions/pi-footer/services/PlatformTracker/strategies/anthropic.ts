import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS, createUsageWindow } from "../numbers.ts";
import type { Window } from "../types.ts";
import type { ProviderStrategy } from "../types.ts";

export const anthropicProvider: ProviderStrategy = {
  id: "anthropic",
  label: "Anthropic",
  hasAuthentication: () => hasAuthKey("anthropic"),
  fetchUsage: async () => {
    const auth = readPiAuthJson();
    const token = (auth.anthropic as { access?: string } | undefined)?.access;
    if (!token) return [];

    const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
      headers: {
        Authorization: `Bearer ${token}`,
        "anthropic-beta": "oauth-2025-04-20",
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);

    const data = (await res.json()) as {
      five_hour?: { utilization?: number };
      seven_day?: { utilization?: number };
    };

    const windows: Window[] = [];
    if (data.five_hour?.utilization !== undefined) {
      windows.push(createUsageWindow(data.five_hour.utilization, 5 * 60));
    }
    if (data.seven_day?.utilization !== undefined) {
      windows.push(createUsageWindow(data.seven_day.utilization, 7 * 24 * 60));
    }
    return windows;
  },
};
