import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

// Gemini-specific metadata type
type GeminiMeta = {
  modelId: string; // Full model ID from API
  bucketIndex: number; // Which bucket this came from
};

usageTracker.registerProvider<GeminiMeta>({
  id: "gemini",
  label: "Gemini",
  models: ["pro", "flash"], // Model families
  quotas: [{ id: "quota", percentageOnly: true }], // Percentage-only quota
  hasAuthentication: () => hasAuthKey("google-gemini-cli"),
  fetchUsage: async (): Promise<UsageSnapshot<GeminiMeta>[]> => {
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

    const snapshots: UsageSnapshot<GeminiMeta>[] = [];

    // Create snapshot per bucket/model
    for (const [index, bucket] of (data.buckets ?? []).entries()) {
      const model = (bucket.modelId ?? "").toLowerCase();
      const fraction = Math.max(0, Math.min(1, bucket.remainingFraction ?? 1));

      // Normalize model ID to family
      let normalizedId = "unknown";
      if (model.includes("pro")) normalizedId = "pro";
      if (model.includes("flash")) normalizedId = "flash";

      snapshots.push({
        id: "quota",
        modelId: normalizedId, // Per-model family
        remainingRatio: fraction,
        usedRatio: 1 - fraction,
        meta: {
          modelId: bucket.modelId ?? "",
          bucketIndex: index,
        },
      });
    }

    return snapshots;
  },
});
