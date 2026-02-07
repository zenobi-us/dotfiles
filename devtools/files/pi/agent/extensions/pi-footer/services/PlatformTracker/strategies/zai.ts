import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS } from "../numbers.ts";
import type { ProviderStrategy, UsageSnapshot } from "../types.ts";

export const zaiProvider: ProviderStrategy = {
  id: "zai",
  label: "Z.ai",
  quotas: [
    { id: "limit_1", amount: 100 },
    { id: "limit_2", amount: 100 },
    { id: "limit_3", amount: 100 },
  ],
  hasAuthentication: () => hasAuthKey("z-ai") || hasAuthKey("zai"),
  fetchUsage: async () => {
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

    const windows: UsageSnapshot[] = [];
    for (const [index, limit] of (data.data?.limits ?? []).entries()) {
      const usedRatio = Math.max(0, Math.min(1, (limit.percentage ?? 0) / 100));
      windows.push({
        id: `limit_${index + 1}`,
        usedRatio,
        remainingRatio: 1 - usedRatio,
      });
    }

    return windows;
  },
};
