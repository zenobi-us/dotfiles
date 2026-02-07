import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS } from "../numbers.ts";
import type { ProviderStrategy } from "../types.ts";

export const geminiProvider: ProviderStrategy = {
  id: "gemini",
  label: "Gemini",
  hasAuthentication: () => hasAuthKey("google-gemini-cli"),
  fetchUsage: async () => {
    const auth = readPiAuthJson();
    const token = (auth["google-gemini-cli"] as { access?: string } | undefined)
      ?.access;
    if (!token) return [];

    const res = await fetch(
      "https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota",
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
    if (!res.ok) throw new Error(`gemini ${res.status}`);

    const data = (await res.json()) as {
      buckets?: Array<{ modelId?: string; remainingFraction?: number }>;
    };

    const proFractions: number[] = [];
    const flashFractions: number[] = [];

    for (const bucket of data.buckets ?? []) {
      const model = (bucket.modelId ?? "").toLowerCase();
      const fraction = Math.max(0, Math.min(1, bucket.remainingFraction ?? 1));
      if (model.includes("pro")) proFractions.push(fraction);
      if (model.includes("flash")) flashFractions.push(fraction);
    }

    const windows = [];
    if (proFractions.length > 0) {
      windows.push({
        duration: 100,
        remaining: Math.min(...proFractions) * 100,
      });
    }
    if (flashFractions.length > 0) {
      windows.push({
        duration: 100,
        remaining: Math.min(...flashFractions) * 100,
      });
    }

    return windows;
  },
};
