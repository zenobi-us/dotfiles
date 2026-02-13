import { API_TIMEOUT_MS, TimeFrame, percentToSnapshot } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

// Anthropic-specific metadata type
type AnthropicMeta = {
  sessionStart?: number;
  windowType: "rolling" | "session";
  utilizationSource: "five_hour" | "five_day" | "seven_day";
};

type AnthropicAuth = {
  access?: string;
};

function isAnthropicAuth(auth: unknown): auth is AnthropicAuth {
  return (
    typeof auth === "object" &&
    auth !== null &&
    ("access" in auth ? typeof (auth as any).access === "string" : true)
  );
}

usageTracker.registerProvider<AnthropicMeta>({
  id: "anthropic",
  label: "Anthropic",
  models: ["default"], // Single model provider
  quotas: [
    { id: "5_hour", percentageOnly: true }, // Percentage-only quota
    { id: "5_day", percentageOnly: true },
  ],
  fetchUsage: async (ctx): Promise<UsageSnapshot<AnthropicMeta>[]> => {
    const auth = ctx.auth;
    const token = isAnthropicAuth(auth) ? auth.access : undefined;
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

    const windows: UsageSnapshot<AnthropicMeta>[] = [];

    // Add 5-hour window with metadata
    if (data.five_hour?.utilization !== undefined) {
      windows.push({
        ...percentToSnapshot("5_hour", "default", data.five_hour.utilization),
        meta: {
          windowType: "session",
          utilizationSource: "five_hour",
        },
      });
    }

    // Add 5-day window with metadata
    const dayUtilization =
      data.five_day?.utilization ?? data.seven_day?.utilization;
    if (dayUtilization !== undefined) {
      windows.push({
        ...percentToSnapshot("5_day", "default", dayUtilization),
        meta: {
          windowType: "rolling",
          utilizationSource:
            data.five_day?.utilization !== undefined ? "five_day" : "seven_day",
        },
      });
    }

    return windows;
  },
});
