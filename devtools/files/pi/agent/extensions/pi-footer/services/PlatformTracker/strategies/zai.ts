import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS, percentToWindow } from "../numbers.ts";
import type { ProviderStrategy } from "../types.ts";

export const zaiProvider: ProviderStrategy = {
  id: "zai",
  label: "Z.ai",
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

    const windows = [];
    for (const limit of data.data?.limits ?? []) {
      const duration = Math.max(1, limit.number ?? 100);
      windows.push(percentToWindow(limit.percentage ?? 0, duration));
    }

    return windows;
  },
};
