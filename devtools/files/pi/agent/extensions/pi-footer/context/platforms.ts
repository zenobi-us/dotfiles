import type { FooterContextProvider } from "../types.ts";
import { usageTracker } from "../services/PlatformTracker/store.ts";

type UsageWindow = { duration: number; remaining: number };

function getWindowById(
  platformId: string,
  windowId: string,
): UsageWindow | undefined {
  const entry = usageTracker.store.get(platformId);
  if (!entry?.windows?.length) return undefined;

  return entry.windows.find((window) => window.id === windowId);
}

/**
 * Returns progress through the window as a fraction in [0, 1], or undefined.
 */
function createWindowProgressPercentageProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    if (window.duration <= 0) return 0;

    return Math.max(0, Math.min(1, 1 - window.remaining / window.duration));
  };
}

/**
 * Returns remaining time in seconds as a number, or undefined.
 */
function createWindowRemainingTimeProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    return Math.max(0, window.remaining);
  };
}

/**
 * Returns used time in seconds as a number, or undefined.
 */
function createWindowUsedTimeProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;

    return Math.max(0, window.duration - window.remaining);
  };
}

/**
 * Returns total window duration in seconds as a number, or undefined.
 */
function createWindowTotalTimeProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    return Math.max(0, window.duration);
  };
}

/**
 * Returns quota used as a fraction in [0, 1], or undefined.
 */
function createWindowQuotaUsedPercentageProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    if (window.duration <= 0) return 0;

    return Math.max(
      0,
      Math.min(1, (window.duration - window.remaining) / window.duration),
    );
  };
}

/**
 * Returns quota remaining as a fraction in [0, 1], or undefined.
 */
function createWindowQuotaRemainingPercentageProvider(
  platformId: string,
  windowId: string,
): FooterContextProvider {
  return () => {
    const window = getWindowById(platformId, windowId);
    if (!window) return undefined;
    if (window.duration <= 0) return 0;

    return Math.max(0, Math.min(1, window.remaining / window.duration));
  };
}

/**
 * Creates numeric platform usage providers per window.
 *
 * Provider IDs use `${platformId}-${windowId}-${metric}`.
 * Each provider returns `number | undefined`.
 */
export function createPlatformContextProviders(
  platformId: string,
  windows: Array<{ id: string; duration: number; remaining: number }>,
): Array<{ name: string; provider: FooterContextProvider }> {
  const providers: Array<{ name: string; provider: FooterContextProvider }> = [];

  for (const window of windows) {
    providers.push({
      name: `${platformId}-${window.id}-progress-percentage`,
      provider: createWindowProgressPercentageProvider(platformId, window.id),
    });
    providers.push({
      name: `${platformId}-${window.id}-remaining-time`,
      provider: createWindowRemainingTimeProvider(platformId, window.id),
    });
    providers.push({
      name: `${platformId}-${window.id}-used-time`,
      provider: createWindowUsedTimeProvider(platformId, window.id),
    });
    providers.push({
      name: `${platformId}-${window.id}-total-time`,
      provider: createWindowTotalTimeProvider(platformId, window.id),
    });
    providers.push({
      name: `${platformId}-${window.id}-quota-used-percentage`,
      provider: createWindowQuotaUsedPercentageProvider(platformId, window.id),
    });
    providers.push({
      name: `${platformId}-${window.id}-quota-remaining-percentage`,
      provider: createWindowQuotaRemainingPercentageProvider(
        platformId,
        window.id,
      ),
    });
  }

  return providers;
}
