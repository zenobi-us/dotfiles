import type { FooterContextProvider } from "@zenobius/pi-footer";
import { usageTracker } from "../services/PlatformTracker/store.ts";
import type {
  ProviderStrategy,
  ResolvedUsageWindow,
  UsageStoreEntry,
} from "../services/PlatformTracker/types.ts";
import { makeStorageKey } from "../services/PlatformTracker/types.ts";

function getWindowByProviderModel(
  providerId: string,
  modelId: string,
  windowId: string,
): ResolvedUsageWindow | undefined {
  const key = makeStorageKey(providerId, modelId);
  const entry = usageTracker.store.get(key);
  if (!entry?.windows?.length) return undefined;
  return entry.windows.find((window) => window.id === windowId);
}

function getProviderModels(providerId: string): string[] {
  const models = new Set<string>();
  for (const [key, entry] of usageTracker.store) {
    if (key.startsWith(`${providerId}/`)) {
      models.add(entry.modelId);
    }
  }
  return Array.from(models);
}

function getProviderEntries(providerId: string): UsageStoreEntry[] {
  const entries: UsageStoreEntry[] = [];
  for (const [key, entry] of usageTracker.store) {
    if (key.startsWith(`${providerId}/`)) {
      entries.push(entry);
    }
  }
  return entries;
}

function getProviderMetadata<TMeta>(
  provider: ProviderStrategy<TMeta>,
  providerId: string,
  modelId: string,
): TMeta | undefined {
  const key = makeStorageKey(providerId, modelId);
  const entry = usageTracker.store.get(key);
  if (!entry) return undefined;
  return provider.getMetadata?.(entry);
}

function createWindowProgressPercentageProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window) return undefined;
    return window.usedRatio;
  };
}

function createWindowRemainingTimeProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.remaining);
  };
}

function createWindowUsedTimeProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.used);
  };
}

function createWindowTotalTimeProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.duration);
  };
}

function createWindowRemainingAmountProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.remaining);
  };
}

function createWindowUsedAmountProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.used);
  };
}

function createWindowTotalAmountProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.amount);
  };
}

function createWindowQuotaUsedPercentageProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window) return undefined;
    return window.usedRatio;
  };
}

function createWindowQuotaRemainingPercentageProvider(
  providerId: string,
  modelId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window) return undefined;
    return window.remainingRatio;
  };
}

/**
 * Creates numeric platform usage providers per quota configured by provider strategy.
 *
 * Provider IDs use `${platformId}-${modelId}-${quotaId}-${metric}`.
 * Each provider returns `number | undefined`.
 */
export function createPlatformContextProviders(
  platformId: string,
): Array<{ name: string; provider: FooterContextProvider }> {
  const providers: Array<{ name: string; provider: FooterContextProvider }> =
    [];

  const provider = usageTracker.providers.get(platformId);
  if (!provider) return providers;

  // Prefer currently-known models from store, then fall back to provider-declared models.
  const discoveredModels = getProviderModels(platformId);
  const models = discoveredModels.length
    ? discoveredModels
    : provider.models?.length
      ? provider.models
      : ["default"];

  for (const modelId of models) {
    for (const quota of provider.quotas) {
      const prefix = `${platformId}-${modelId}-${quota.id}`;

      providers.push({
        name: `${prefix}-progress`,
        provider: createWindowProgressPercentageProvider(
          platformId,
          modelId,
          quota.id,
        ),
      });

      providers.push({
        name: `${prefix}-used-percent`,
        provider: createWindowQuotaUsedPercentageProvider(
          platformId,
          modelId,
          quota.id,
        ),
      });

      providers.push({
        name: `${prefix}-remaining-percent`,
        provider: createWindowQuotaRemainingPercentageProvider(
          platformId,
          modelId,
          quota.id,
        ),
      });

      if ("duration" in quota && quota.duration) {
        providers.push({
          name: `${prefix}-remaining-time`,
          provider: createWindowRemainingTimeProvider(
            platformId,
            modelId,
            quota.id,
          ),
        });
        providers.push({
          name: `${prefix}-used-time`,
          provider: createWindowUsedTimeProvider(platformId, modelId, quota.id),
        });
        providers.push({
          name: `${prefix}-total-time`,
          provider: createWindowTotalTimeProvider(
            platformId,
            modelId,
            quota.id,
          ),
        });
      }

      if ("amount" in quota && quota.amount) {
        providers.push({
          name: `${prefix}-remaining-amount`,
          provider: createWindowRemainingAmountProvider(
            platformId,
            modelId,
            quota.id,
          ),
        });
        providers.push({
          name: `${prefix}-used-amount`,
          provider: createWindowUsedAmountProvider(
            platformId,
            modelId,
            quota.id,
          ),
        });
        providers.push({
          name: `${prefix}-total-amount`,
          provider: createWindowTotalAmountProvider(
            platformId,
            modelId,
            quota.id,
          ),
        });
      }
    }

    // Generic metadata channel (if used by footer templates)
    providers.push({
      name: `${platformId}-${modelId}-meta-present`,
      provider: () => {
        const meta = getProviderMetadata(provider, platformId, modelId);
        return meta ? 1 : 0;
      },
    });
  }

  // Keep helper reachable for future expansion / debug in this module
  void getProviderEntries;

  return providers;
}
