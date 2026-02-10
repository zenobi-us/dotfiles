import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

// Z.ai metadata type
type ZaiMeta = {
  limitNumber: number; // Which limit this is
  limitPercentage: number; // Percentage used
};

usageTracker.registerProvider<ZaiMeta>({
  id: "zai",
  label: "Z.ai",
  models: ["default"], // Single model provider
  quotas: [
    { id: "limit_1", percentageOnly: true }, // Percentage-only quotas
    { id: "limit_2", percentageOnly: true },
    { id: "limit_3", percentageOnly: true },
  ],
  hasAuthentication: () => hasAuthKey("z-ai") || hasAuthKey("zai"),
  fetchUsage: async (): Promise<UsageSnapshot<ZaiMeta>[]> => {
    const auth = readPiAuthJson();
    const token =
      (auth["z-ai"] as { access?: string } | undefined)?.access ||
      (auth.zai as { access?: string } | undefined)?.access;

    if (!token) return [];

    const res = await fetch("https://api.z.ai/api/monitor/usage/quota/limit", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!res.ok) throw new Error(`zai ${res.status}`);

    const data = (await res.json()) as {
      data?: {
        limits?: Array<{ number?: number; percentage?: number }>;
      };
    };

    const windows: UsageSnapshot<ZaiMeta>[] = [];
    for (const [index, limit] of (data.data?.limits ?? []).entries()) {
      const usedRatio = Math.max(0, Math.min(1, (limit.percentage ?? 0) / 100));
      windows.push({
        id: `limit_${index + 1}`,
        modelId: "default", // Single model
        usedRatio,
        remainingRatio: 1 - usedRatio,
        meta: {
          limitNumber: limit.number ?? index + 1,
          limitPercentage: limit.percentage ?? 0,
        },
      });
    }

    return windows;
  },
});
