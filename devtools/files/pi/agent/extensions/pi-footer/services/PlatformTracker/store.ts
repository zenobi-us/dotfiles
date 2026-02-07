import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
  Listener,
  UsageStore,
  UsageStoreEntry,
  UsageTrackerInternal,
  UsageTrackerSettings,
} from "./types";
import { clampPositiveInt } from "./numbers";

const DEFAULT_SETTINGS: UsageTrackerSettings = {
  intervalMs: 60_000,
  maxBackoffMultiplier: 8,
};

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

    registerProvider(name, provider) {
      this.providers.set(name, provider);
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

    async update(name) {
      if (!currentCtx || !name) return;

      const provider = this.providers.get(name);
      if (!provider) {
        this.store.delete(name);
        return;
      }

      const previous = this.store.get(name);
      const now = Date.now();
      const failures = previous?.fails ?? 0;
      const lastUpdate = previous?.updated ?? 0;
      const backoffMultiplier = Math.min(
        1 + failures,
        settings.maxBackoffMultiplier,
      );

      if (lastUpdate + settings.intervalMs * backoffMultiplier > now) {
        return;
      }

      const nextEntry: UsageStoreEntry = {
        windows: previous?.windows ?? [],
        updated: now,
        fails: failures,
        active: previous?.active ?? true,
      };

      try {
        const hasAuth = await provider.hasAuthentication(currentCtx);
        if (!hasAuth) {
          nextEntry.active = false;
          nextEntry.windows = [];
          nextEntry.fails = 0;
          this.store.set(name, nextEntry);
          return;
        }

        nextEntry.windows = await provider.fetchUsage(currentCtx);
        nextEntry.active = true;
        nextEntry.fails = 0;
      } catch {
        nextEntry.fails = failures + 1;
      }

      this.store.set(name, nextEntry);
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
