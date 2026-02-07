import type { FooterContextProvider } from "../types.ts";
import { usageTracker } from "../services/PlatformTracker/store.ts";
import type { ResolvedUsageWindow } from "../services/PlatformTracker/types.ts";

function getWindowById(
  platformId: string,
  windowId: string,
): ResolvedUsageWindow | undefined {
  const entry = usageTracker.store.get(platformId);
  if (!entry?.windows?.length) return undefined;

  return entry.windows.find((window) => window.id === windowId);
}

function createWindowProgressPercentageProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    return window.usedRatio;
  };
}

function createWindowRemainingTimeProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.remaining);
  };
}

function createWindowUsedTimeProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.used);
  };
}

function createWindowTotalTimeProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.duration);
  };
}

function createWindowRemainingAmountProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.remaining);
  };
}

function createWindowUsedAmountProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.used);
  };
}

function createWindowTotalAmountProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.amount);
  };
}

function createWindowQuotaUsedPercentageProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    return window.usedRatio;
  };
}

function createWindowQuotaRemainingPercentageProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    return window.remainingRatio;
  };
}

/**
 * Creates numeric platform usage providers per quota configured by provider strategy.
 *
 * Provider IDs use `${platformId}-${quotaId}-${metric}`.
 * Each provider returns `number | undefined`.
 */
export function createPlatformContextProviders(
  platformId: string,
): Array<{ name: string; provider: FooterContextProvider }> {
  const providers: Array<{ name: string; provider: FooterContextProvider }> =
    [];

  return providers;
}
