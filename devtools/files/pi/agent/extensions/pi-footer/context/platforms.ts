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

function createWindowProgressPercentageProvider(
  id: string,
  windowId: string,
): FooterContextProvider {}

function createWindowRemainingTimeProvider(
  id: string,
  windowId: string,
): FooterContextProvider {}

function createWindowUsedTimeProvider(
  id: string,
  windowId: string,
): FooterContextProvider {}

function createWindowTotalTimeProvider(
  id: string,
  windowId: string,
): FooterContextProvider {}

function createWindowQuotaUsedPercentageProvider(
  id: string,
  windowId: string,
): FooterContextProvider {}

function createWindowQuotaRemainingPercentageProvider(
  id: string,
  windowId: string,
): FooterContextProvider {}

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
