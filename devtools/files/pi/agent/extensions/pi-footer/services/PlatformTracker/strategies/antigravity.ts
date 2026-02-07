import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS } from "../numbers.ts";
import type { ProviderStrategy, UsageSnapshot } from "../types.ts";

export const antigravityProvider: ProviderStrategy = {
  id: "antigravity",
  label: "Google Antigravity",
  quotas: [
    { id: "pro", amount: 100 },
    { id: "flash", amount: 100 },
  ],
  hasAuthentication: () => hasAuthKey("google-antigravity"),
  fetchUsage: async () => {
    const auth = readPiAuthJson();
    const token = (
      auth["google-antigravity"] as { access?: string } | undefined
    )?.access;
    if (!token) return [];

    const res = await fetch(
      "https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      },
    );
    if (!res.ok) throw new Error(`antigravity ${res.status}`);

    const data = (await res.json()) as {
      models?: Record<
        string,
        { quotaInfo?: { remainingFraction?: number; limit?: string } }
      >;
    };

    const proFractions: number[] = [];
    const flashFractions: number[] = [];

    for (const [modelId, model] of Object.entries(data.models ?? {})) {
      const name = modelId.toLowerCase();
      const fraction = Math.max(
        0,
        Math.min(1, model.quotaInfo?.remainingFraction ?? 1),
      );

      if (name.includes("pro")) proFractions.push(fraction);
      if (name.includes("flash")) flashFractions.push(fraction);
    }

    const windows: UsageSnapshot[] = [];
    if (proFractions.length > 0) {
      windows.push({ id: "pro", remainingRatio: Math.min(...proFractions) });
    }
    if (flashFractions.length > 0) {
      windows.push({ id: "flash", remainingRatio: Math.min(...flashFractions) });
    }

    return windows;
  },
};
