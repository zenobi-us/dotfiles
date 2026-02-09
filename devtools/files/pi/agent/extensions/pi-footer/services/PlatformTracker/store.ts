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

type RuntimeState = {
  inFlight: boolean;
  queued: boolean;
  nextEligibleAt: number;
  backoffLevel: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function resolveUsageWindow(
  quota: QuotaDefinition,
  snapshot: UsageSnapshot,
): ResolvedUsageWindow {
  let total = 100;
  if ("duration" in quota && quota.duration) {
    total = quota.duration;
  } else if ("amount" in quota && quota.amount) {
    total = quota.amount;
  } else if ("baseAmount" in quota && quota.baseAmount) {
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

  const used = Math.max(0, snapshot.used ?? usedFromNumbers ?? usedRatio * total);

  return {
    id: quota.id,
    modelId: snapshot.modelId,
    duration: "duration" in quota ? quota.duration : undefined,
    amount: "amount" in quota ? quota.amount : undefined,
    remaining,
    used,
    remainingRatio,
    usedRatio,
    meta: snapshot.meta,
  };
}

function createRuntimeState(): RuntimeState {
  return {
    inFlight: false,
    queued: false,
    nextEligibleAt: 0,
    backoffLevel: 0,
  };
}

export function createUsageTracker(initialStore?: UsageStore): UsageTrackerInternal {
  const listeners = new Set<Listener>();

  let settings: UsageTrackerSettings = { ...DEFAULT_SETTINGS };
  let currentCtx: ExtensionContext | undefined;

  const providerRuntime = new Map<string, RuntimeState>();
  const modelRuntime = new Map<string, RuntimeState>(); // key: provider/model

  const getProviderState = (providerId: string): RuntimeState => {
    const state = providerRuntime.get(providerId);
    if (state) return state;
    const created = createRuntimeState();
    providerRuntime.set(providerId, created);
    return created;
  };

  const getModelState = (providerId: string, modelId: string): RuntimeState => {
    const key = makeStorageKey(providerId, modelId);
    const state = modelRuntime.get(key);
    if (state) return state;
    const created = createRuntimeState();
    modelRuntime.set(key, created);
    return created;
  };

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const markProviderFailure = (providerId: string, now: number) => {
    const p = getProviderState(providerId);
    p.backoffLevel = Math.min(p.backoffLevel + 1, settings.maxBackoffMultiplier);
    p.nextEligibleAt = now + settings.intervalMs * Math.max(1, p.backoffLevel);

    for (const [key, entry] of tracker.store) {
      if (!key.startsWith(`${providerId}/`)) continue;
      const m = getModelState(providerId, entry.modelId);
      m.backoffLevel = p.backoffLevel;
      m.nextEligibleAt = p.nextEligibleAt;
      m.queued = false;
      tracker.store.set(key, {
        ...entry,
        fails: (entry.fails ?? 0) + 1,
      });
    }
  };

  const markProviderSuccess = (providerId: string, modelIds: string[], now: number) => {
    const p = getProviderState(providerId);
    p.backoffLevel = 0;
    p.nextEligibleAt = now + settings.intervalMs;

    for (const modelId of modelIds) {
      const m = getModelState(providerId, modelId);
      m.backoffLevel = 0;
      m.nextEligibleAt = now + settings.intervalMs;
      m.queued = false;
    }
  };

  const runProviderUpdate = async (providerId: string): Promise<void> => {
    if (!currentCtx) return;

    const provider = tracker.providers.get(providerId);
    if (!provider) {
      providerRuntime.delete(providerId);
      for (const [key] of tracker.store) {
        if (key.startsWith(`${providerId}/`)) tracker.store.delete(key);
      }
      notify();
      return;
    }

    const now = Date.now();

    try {
      const hasAuth = await provider.hasAuthentication(currentCtx);

      if (!hasAuth) {
        const p = getProviderState(providerId);
        p.backoffLevel = 0;
        p.nextEligibleAt = now + settings.intervalMs;

        for (const [key, entry] of tracker.store) {
          if (!key.startsWith(`${providerId}/`)) continue;

          const m = getModelState(providerId, entry.modelId);
          m.backoffLevel = 0;
          m.nextEligibleAt = now + settings.intervalMs;
          m.queued = false;

          tracker.store.set(key, {
            ...entry,
            active: false,
            windows: [],
            fails: 0,
          });
        }

        notify();
        return;
      }

      const snapshots = await provider.fetchUsage(currentCtx);
      const touchedModelIds = new Set<string>();

      for (const snapshot of snapshots) {
        const quota = provider.quotas.find((q) => q.id === snapshot.id);
        if (!quota) continue;

        const entry: UsageStoreEntry = {
          providerId,
          modelId: snapshot.modelId,
          windows: [resolveUsageWindow(quota, snapshot)],
          updated: now,
          fails: 0,
          active: true,
        };

        tracker.store.set(makeStorageKey(providerId, snapshot.modelId), entry);
        touchedModelIds.add(snapshot.modelId);
      }

      markProviderSuccess(providerId, [...touchedModelIds], now);
      notify();
    } catch {
      markProviderFailure(providerId, now);
      notify();
    }
  };

  const processProvider = async (providerId: string): Promise<void> => {
    const p = getProviderState(providerId);
    if (p.inFlight) return;

    p.inFlight = true;
    try {
      while (p.queued) {
        if (Date.now() < p.nextEligibleAt) break;
        p.queued = false;
        await runProviderUpdate(providerId);
      }
    } finally {
      p.inFlight = false;
    }
  };

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
      getProviderState(provider.id);
    },

    async updateAll() {
      this.trigger("updateAll");
    },

    async update(providerId) {
      if (!providerId) return;
      const p = getProviderState(providerId);
      p.queued = true;
      void processProvider(providerId);
    },

    trigger(_reason) {
      if (!currentCtx) return;

      for (const providerId of this.providers.keys()) {
        const p = getProviderState(providerId);
        p.queued = true;

        for (const [key, entry] of this.store) {
          if (!key.startsWith(`${providerId}/`)) continue;
          getModelState(providerId, entry.modelId).queued = true;
        }

        void processProvider(providerId);
      }
    },

    start(ctx, nextSettings) {
      currentCtx = ctx;
      if (nextSettings) this.setSettings(nextSettings);
      this.trigger("start");
    },

    stop() {
      currentCtx = undefined;
      providerRuntime.clear();
      modelRuntime.clear();
      listeners.clear();
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
