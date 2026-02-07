import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS, TimeFrame, percentToSnapshot } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

usageTracker.registerProvider("anthropic", {
  id: "anthropic",
  label: "Anthropic",
  quotas: [
    { id: "5_hour", duration: TimeFrame.FiveHour },
    { id: "5_day", duration: TimeFrame.FiveDay },
  ],
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
      five_day?: { utilization?: number };
      seven_day?: { utilization?: number };
    };

    const windows: UsageSnapshot[] = [];
    if (data.five_hour?.utilization !== undefined) {
      windows.push(percentToSnapshot("5_hour", data.five_hour.utilization));
    }

    const dayUtilization =
      data.five_day?.utilization ?? data.seven_day?.utilization;
    if (dayUtilization !== undefined) {
      windows.push(percentToSnapshot("5_day", dayUtilization));
    }

    return windows;
  },
});
