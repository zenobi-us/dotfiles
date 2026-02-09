import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { FooterContextProvider } from "../types.ts";
import { usageTracker } from "../services/PlatformTracker/store.ts";
import type { ResolvedUsageWindow, UsageStoreEntry } from "../services/PlatformTracker/types.ts";
import { makeStorageKey } from "../services/PlatformTracker/types.ts";

// Platform detection mapping: model name → provider id
const MODEL_TO_PROVIDER: Record<string, string> = {
  "claude": "anthropic",
  "anthropic": "anthropic",
  "gpt": "copilot",
  "copilot": "copilot",
  "chatgpt": "codex",
  "codex": "codex",
  "gemini": "gemini",
  "kiro": "kiro",
  "zai": "zai",
  "antigravity": "antigravity",
};

function detectProviderFromModel(ctx: ExtensionContext): string | undefined {
  const modelName = (ctx.model?.id || ctx.model?.name || "").toLowerCase();
  
  for (const [key, providerId] of Object.entries(MODEL_TO_PROVIDER)) {
    if (modelName.includes(key)) {
      return providerId;
    }
  }
  
  return undefined;
}

function getActiveProvider(ctx: ExtensionContext): string | undefined {
  // First try model detection
  const detected = detectProviderFromModel(ctx);
  if (detected) return detected;
  
  // Fallback: first provider with active data
  for (const [_key, entry] of usageTracker.store) {
    if (entry.active && entry.windows.length > 0) {
      return entry.providerId;
    }
  }
  
  return undefined;
}

function getProviderEntry(providerId: string): UsageStoreEntry | undefined {
  for (const [_key, entry] of usageTracker.store) {
    if (entry.providerId === providerId && entry.active) {
      return entry;
    }
  }
  return undefined;
}

function getPrimaryQuota(entry: UsageStoreEntry): ResolvedUsageWindow | undefined {
  return entry.windows[0];
}

function getQuotaHealth(remainingRatio: number): "good" | "warning" | "critical" {
  if (remainingRatio > 0.5) return "good";
  if (remainingRatio > 0.2) return "warning";
  return "critical";
}

function getHealthEmoji(remainingRatio: number): string {
  const health = getQuotaHealth(remainingRatio);
  switch (health) {
    case "good": return "🟢";
    case "warning": return "🟡";
    case "critical": return "🔴";
  }
}

// Auto-detected usage providers
export const usageEmojiProvider: FooterContextProvider = (ctx) => {
  const providerId = getActiveProvider(ctx);
  if (!providerId) return "--";
  
  const entry = getProviderEntry(providerId);
  if (!entry) return "--";
  
  const quota = getPrimaryQuota(entry);
  if (!quota) return "--";
  
  return getHealthEmoji(quota.remainingRatio);
};

export const usagePlatformProvider: FooterContextProvider = (ctx) => {
  const providerId = getActiveProvider(ctx);
  if (!providerId) return "--";
  
  const provider = usageTracker.providers.get(providerId);
  return provider?.label || providerId;
};

export const usageQuotaRemainingProvider: FooterContextProvider = (ctx) => {
  const providerId = getActiveProvider(ctx);
  if (!providerId) return undefined;
  
  const entry = getProviderEntry(providerId);
  if (!entry) return undefined;
  
  const quota = getPrimaryQuota(entry);
  return quota?.remaining;
};

export const usageQuotaUsedProvider: FooterContextProvider = (ctx) => {
  const providerId = getActiveProvider(ctx);
  if (!providerId) return undefined;
  
  const entry = getProviderEntry(providerId);
  if (!entry) return undefined;
  
  const quota = getPrimaryQuota(entry);
  return quota?.used;
};

export const usageQuotaTotalProvider: FooterContextProvider = (ctx) => {
  const providerId = getActiveProvider(ctx);
  if (!providerId) return undefined;
  
  const entry = getProviderEntry(providerId);
  if (!entry) return undefined;
  
  const quota = getPrimaryQuota(entry);
  return quota?.duration || quota?.amount;
};

export const usageQuotaPercentRemainingProvider: FooterContextProvider = (ctx) => {
  const providerId = getActiveProvider(ctx);
  if (!providerId) return undefined;
  
  const entry = getProviderEntry(providerId);
  if (!entry) return undefined;
  
  const quota = getPrimaryQuota(entry);
  return quota?.remainingRatio;
};

export const usageQuotaPercentUsedProvider: FooterContextProvider = (ctx) => {
  const providerId = getActiveProvider(ctx);
  if (!providerId) return undefined;
  
  const entry = getProviderEntry(providerId);
  if (!entry) return undefined;
  
  const quota = getPrimaryQuota(entry);
  return quota?.usedRatio;
};

// Per-platform quota access helpers
function getQuotaBySelector(
  providerId: string,
  selector?: string | number,
): ResolvedUsageWindow | undefined {
  const entry = getProviderEntry(providerId);
  if (!entry) return undefined;
  
  if (selector === undefined) {
    return getPrimaryQuota(entry);
  }
  
  if (typeof selector === "number") {
    return entry.windows[selector];
  }
  
  return entry.windows.find((w) => w.id === selector);
}

// Factory for per-platform providers
export function createPlatformQuotaProvider(
  providerId: string,
  metric: "remaining" | "used" | "total" | "percent_remaining" | "percent_used",
  quotaSelector?: string | number,
): FooterContextProvider {
  return () => {
    const quota = getQuotaBySelector(providerId, quotaSelector);
    if (!quota) return undefined;
    
    switch (metric) {
      case "remaining":
        return quota.remaining;
      case "used":
        return quota.used;
      case "total":
        return quota.duration || quota.amount;
      case "percent_remaining":
        return quota.remainingRatio;
      case "percent_used":
        return quota.usedRatio;
    }
  };
}

export function createPlatformEmojiProvider(
  providerId: string,
  quotaSelector?: string | number,
): FooterContextProvider {
  return () => {
    const quota = getQuotaBySelector(providerId, quotaSelector);
    if (!quota) return "--";
    return getHealthEmoji(quota.remainingRatio);
  };
}

export function createPlatformNameProvider(providerId: string): FooterContextProvider {
  return () => {
    const provider = usageTracker.providers.get(providerId);
    return provider?.label || providerId;
  };
}
