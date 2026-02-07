import type { FooterContextProvider } from "../types.ts";
import { usageTracker } from "../services/PlatformTracker/store.ts";

function formatWindow(window: { duration: number; remaining: number }) {
  return `${Math.max(0, Math.round(window.remaining))}/${Math.max(
    0,
    Math.round(window.duration),
  )}`;
}

// For each platform we want these context providers:
// WindowProgressPercentage: For each window, how far into the window are we 0-1? (e.g. 0.75)
// WindowRemainingTime: For each window, how much time is left (in seconds)? (e.g. 120s)
// WindowUsedTime: For each window, how much time has been used (in seconds)? (e.g. 480s)
// WindowTotalTime: For each window, what is the total time (in seconds)? (e.g. 600s)
// WindowQuotaUsedPercentage: For each window, how much of the quota has been used 0-1? (e.g. 0.8)
// WindowQuotaRemainingPercentage: For each window, how much of the quota is remaining 0-1? (e.g. 0.2)

/**
 * For window progress percentage, we want to show how far into the window we are as a percentage (e.g. "75%"). This is calculated as (duration - remaining) / duration, but we need to make sure to handle edge cases where duration might be 0 or negative, or where remaining might be greater than duration.
 */
function createWindowProgressPercentageProvider(
  id: string,
  windowId: string,
): FooterContextProvider {
  return (ctx) => {
    const stored = usageTracker.store.get(id);
    const window = stored?.windows.find((w) => w.id === windowId);
    if (!window) return undefined;

    const percentage =
      window.duration > 0
        ? Math.max(0, Math.min(1, 1 - window.remaining / window.duration))
        : 0;
    return `${Math.round(percentage * 100)}`;
  };
}

/**
 * For window remaining time, we want to show how much time is left in seconds (e.g. "120").
 */
function createWindowRemainingTimeProvider(
  id: string,
  windowId: string,
): FooterContextProvider {
  return (ctx) => {
    const stored = usageTracker.store.get(id);
    const window = stored?.windows.find((w) => w.id === windowId);
    if (!window) return "?";
    return `${Math.round(window.remaining)}`;
  };
}

/**
 * Used time is total duration minus remaining time, but we want to make sure it never goes below 0 in case of any weird edge cases with the data.
 */
function createWindowUsedTimeProvider(
  id: string,
  windowId: string,
): FooterContextProvider {
  return (ctx) => {
    const stored = usageTracker.store.get(id);
    const window = stored?.windows.find((w) => w.id === windowId);
    if (!window) return "?";
    const used = Math.max(0, window.duration - window.remaining);
    return `${Math.round(used)}`;
  };
}

/**
 * For total time, we just want to show the total duration of the window in seconds (e.g. "600").
 */
function createWindowTotalTimeProvider(
  id: string,
  windowId: string,
): FooterContextProvider {
  return (ctx) => {
    const stored = usageTracker.store.get(id);
    const window = stored?.windows.find((w) => w.id === windowId);
    if (!window) return "?";
    return `${Math.round(window.duration)}`;
  };

function createWindowQuotaUsedPercentageProvider(
  id: string,
  windowId: string,
): FooterContextProvider {
  return (ctx) => {
    const stored = usageTracker.store.get(id);
    const window = stored?.windows.find((w) => w.id === windowId);
    if (!window) return "?";
    const percentage =
      window.duration > 0
        ? Math.max(
            0,
            Math.min(1, (window.duration - window.remaining) / window.duration),
          )
        : 0;
    return Math.round(percentage * 100);
  };
}

/**
 * For quota remaining percentage, we want to show how much of
 * the quota is remaining as number betwee 0 and 100.
 */
function createWindowQuotaRemainingPercentageProvider(
  id: string,
  windowId: string,
): FooterContextProvider {
  return (ctx) => {
    const stored = usageTracker.store.get(id);
    const window = stored?.windows.find((w) => w.id === windowId);
    if (!window) return "?";
    const percentage =
      window.duration > 0
        ? Math.max(0, Math.min(1, window.remaining / window.duration))
        : 0;
    return `${Math.round(percentage * 100)}`;
  };
}

/**
 * For a given platform, create a set of context providers for each of its usage windows. The provider ids will be in the format `${platformId}-${windowId}-${metric}` (e.g. "copilot-window1-progress-percentage").
 */

function createPlatformContextProviders(
  platformId: string,
  windows: Array<{ id: string; duration: number; remaining: number }>,
): Array<{ name: string; provider: FooterContextProvider }> {
  const providers = [];
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
