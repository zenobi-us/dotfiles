import { hasAuthKey, readPiAuthJson } from "../auth.ts";
import { API_TIMEOUT_MS } from "../numbers.ts";
import type { UsageSnapshot } from "../types.ts";
import { usageTracker } from "../store.ts";

// Antigravity-specific metadata type
type AntigravityMeta = {
  modelName: string; // Full model name from API
  limit?: string; // API limit descriptor ("high", "medium", etc.)
  quotaFraction: number; // This model's remaining fraction
};

// Helper to normalize model IDs
function normalizeModelId(fullId: string): string {
  // "gemini-3-pro-001" → "gemini-3-pro"
  // "claude-sonnet-4-5-20250101" → "claude-sonnet-4-5"
  return fullId
    .toLowerCase()
    .replace(/-\d{8}$/, "") // Remove date suffix
    .replace(/-\d{3}$/, ""); // Remove version suffix
}

usageTracker.registerProvider<AntigravityMeta>({
  id: "antigravity",
  label: "Google Antigravity",
  models: [
    "gemini-3-pro",
    "gemini-3-flash",
    "claude-sonnet-4-5",
    "claude-opus-4-5",
  ],
  quotas: [{ id: "quota", percentageOnly: true }], // Percentage-only quota
  hasAuthentication: () => hasAuthKey("google-antigravity"),
  fetchUsage: async (): Promise<UsageSnapshot<AntigravityMeta>[]> => {
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

    const snapshots: UsageSnapshot<AntigravityMeta>[] = [];

    // Each model has independent quota - create snapshot per model
    for (const [modelId, model] of Object.entries(data.models ?? {})) {
      const fraction = Math.max(
        0,
        Math.min(1, model.quotaInfo?.remainingFraction ?? 1),
      );

      const normalizedId = normalizeModelId(modelId);

      snapshots.push({
        id: "quota",
        modelId: normalizedId, // Per-model snapshots
        remainingRatio: fraction,
        usedRatio: 1 - fraction,
        meta: {
          modelName: modelId,
          limit: model.quotaInfo?.limit,
          quotaFraction: fraction,
        },
      });
    }

    return snapshots;
  },
});
