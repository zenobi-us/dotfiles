import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
  Listener,
  QuotaDefinition,
  ResolvedUsageWindow,
  UsageSnapshot,
  UsageStore,
  UsageStoreEntry,
  UsageTrackerInternal,
  UsageTrackerSettings,
  makeStorageKey,
  getProviderMetadata,
} from "./types";
import { clampPositiveInt } from "./numbers";

const DEFAULT_SETTINGS: UsageTrackerSettings = {
  intervalMs: 60_000,
  maxBackoffMultiplier: 8,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function resolveUsageWindow(
  quota: QuotaDefinition,
  snapshot: UsageSnapshot,
): ResolvedUsageWindow {
  // Handle different quota types
  let total = 100; // Default for percentage-only quotas
  if ('duration' in quota && quota.duration) {
    total = quota.duration;
  } else if ('amount' in quota && quota.amount) {
    total = quota.amount;
  } else if ('baseAmount' in quota && quota.baseAmount) {
    total = quota.baseAmount;
  }

  const remainingFromNumbers =
    snapshot.remaining ??
    (snapshot.used !== undefined
      ? Math.max(0, total - snapshot.used)
      : undefined);

  const usedFromNumbers =
    snapshot.used ??
    (snapshot.remaining !== undefined
      ? Math.max(0, total - snapshot.remaining)
      : undefined);

  const remainingRatioFromNumbers =
    remainingFromNumbers !== undefined && total > 0
      ? clamp01(remainingFromNumbers / total)
      : undefined;

  const usedRatioFromNumbers =
    usedFromNumbers !== undefined && total > 0
      ? clamp01(usedFromNumbers / total)
      : undefined;

  const remainingRatio = clamp01(
    snapshot.remainingRatio ??
      remainingRatioFromNumbers ??
      (snapshot.usedRatio !== undefined ? 1 - snapshot.usedRatio : 0),
  );

  const usedRatio = clamp01(
    snapshot.usedRatio ?? usedRatioFromNumbers ?? 1 - remainingRatio,
  );

  const remaining = Math.max(
    0,
    snapshot.remaining ?? remainingFromNumbers ?? remainingRatio * total,
  );

  const used = Math.max(
    0,
    snapshot.used ?? usedFromNumbers ?? usedRatio * total,
  );

  return {
    id: quota.id,
    modelId: snapshot.modelId, // NEW: Include modelId from snapshot
    duration: 'duration' in quota ? quota.duration : undefined,
    amount: 'amount' in quota ? quota.amount : undefined,
    remaining,
    used,
    remainingRatio,
    usedRatio,
    meta: snapshot.meta, // Preserve metadata from snapshot
  };
}

export function createUsageTracker(
  initialStore?: UsageStore,
): UsageTrackerInternal {
  const listeners = new Set<Listener>();

  let settings: UsageTrackerSettings = { ...DEFAULT_SETTINGS };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let currentCtx: ExtensionContext | undefined;

  const tracker: UsageTrackerInternal = {
    store: initialStore ?? new Map(),
    providers: new Map(),

    registerProvider(provider) {
      const withDefaults = {
        ...provider,
        getMetadata:
          provider.getMetadata ??
          ((entry: UsageStoreEntry) => getProviderMetadata(entry)),
      };
      this.providers.set(provider.id, withDefaults);
    },

    async updateAll() {
      if (!currentCtx) return;

      for (const name of this.providers.keys()) {
        try {
          await this.update(name);
        } catch {
          // individual provider failures are tracked in update()
        }
      }

      for (const listener of listeners) {
        listener();
      }
    },

    async update(providerId) {
      if (!currentCtx || !providerId) return;

      const provider = this.providers.get(providerId);
      
      // Provider removed - clean up all entries
      if (!provider) {
        for (const [key] of this.store) {
          if (key.startsWith(`${providerId}/`)) {
            this.store.delete(key);
          }
        }
        return;
      }

      // Check backoff throttling - use ANY entry for this provider
      const now = Date.now();
      let shouldSkip = false;
      
      for (const [key, entry] of this.store) {
        if (key.startsWith(`${providerId}/`)) {
          const failures = entry.fails ?? 0;
          const lastUpdate = entry.updated ?? 0;
          const backoffMultiplier = Math.min(
            1 + failures,
            settings.maxBackoffMultiplier,
          );
          
          if (lastUpdate + settings.intervalMs * backoffMultiplier > now) {
            shouldSkip = true;
            break;
          }
        }
      }
      
      if (shouldSkip) return;

      try {
        // Check auth once per provider
        const hasAuth = await provider.hasAuthentication(currentCtx);
        
        if (!hasAuth) {
          // Mark all models inactive
          for (const [key, entry] of this.store) {
            if (key.startsWith(`${providerId}/`)) {
              this.store.set(key, {
                ...entry,
                active: false,
                windows: [],
                fails: 0,
              });
            }
          }
          return;
        }

        // Fetch usage data
        const snapshots = await provider.fetchUsage(currentCtx);

        // CRITICAL FIX: Process each snapshot into per-model storage
        for (const snapshot of snapshots) {
          const storageKey = makeStorageKey(providerId, snapshot.modelId);
          
          // Find matching quota definition
          const quota = provider.quotas.find(q => q.id === snapshot.id);
          if (!quota) continue;
          
          // Resolve snapshot to window
          const resolved = resolveUsageWindow(quota, snapshot);
          
          // Update or create entry
          const entry: UsageStoreEntry = {
            providerId,
            modelId: snapshot.modelId,
            windows: [resolved],
            updated: now,
            fails: 0,
            active: true,
          };
          
          this.store.set(storageKey, entry);
        }
      } catch (error) {
        // Increment fails for all models of this provider
        for (const [key, entry] of this.store) {
          if (key.startsWith(`${providerId}/`)) {
            this.store.set(key, {
              ...entry,
              fails: (entry.fails ?? 0) + 1,
            });
          }
        }
      }
    },

    start(ctx, nextSettings) {
      currentCtx = ctx;
      if (nextSettings) {
        this.setSettings(nextSettings);
      }
      if (running) return;

      running = true;

      const run = async () => {
        if (!running) return;
        await this.updateAll();
        if (!running) return;

        timer = setTimeout(run, settings.intervalMs);
        timer.unref?.();
      };

      void run();
    },

    stop() {
      running = false;
      currentCtx = undefined;
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    },

    setSettings(nextSettings) {
      if (nextSettings.intervalMs !== undefined) {
        settings.intervalMs = clampPositiveInt(
          nextSettings.intervalMs,
          DEFAULT_SETTINGS.intervalMs,
        );
      }
      if (nextSettings.maxBackoffMultiplier !== undefined) {
        settings.maxBackoffMultiplier = clampPositiveInt(
          nextSettings.maxBackoffMultiplier,
          DEFAULT_SETTINGS.maxBackoffMultiplier,
        );
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return tracker;
}

export const usageTracker = createUsageTracker();
