import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type Window = { id: string; duration: number; remaining: number };

export type UsageStoreEntry = {
  windows: Window[];
  updated?: number;
  fails?: number;
  active: boolean;
};

export type UsageStore = Map<string, UsageStoreEntry>;

export interface ProviderStrategy {
  id: string;
  label: string;
  hasAuthentication: (ctx: ExtensionContext) => Promise<boolean> | boolean;
  fetchUsage: (ctx: ExtensionContext) => Promise<Window[]>;
}

export interface UsageTracker {
  store: UsageStore;
  providers: Map<string, ProviderStrategy>;
  registerProvider(name: string, provider: ProviderStrategy): void;
  update: (providerId: string) => Promise<void>;
  updateAll: () => Promise<void>;
}

export type Listener = () => void;

export type UsageTrackerSettings = {
  intervalMs: number;
  maxBackoffMultiplier: number;
};

export type RegisteredProvider = {
  name: string;
  provider: ProviderStrategy;
};

export type UsageTrackerInternal = UsageTracker & {
  start: (
    ctx: ExtensionContext,
    settings?: Partial<UsageTrackerSettings>,
  ) => void;
  stop: () => void;
  setSettings: (settings: Partial<UsageTrackerSettings>) => void;
  subscribe: (listener: Listener) => () => void;
};
