import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type QuotaDefinition = {
  id: string;
  duration?: number;
  amount?: number;
};

export type UsageSnapshot = {
  id: string;
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  /** Override the quota duration for this specific snapshot window */
  duration?: number;
  /** Override the quota amount for this specific snapshot window */
  amountTotal?: number;
  /** Arbitrary metadata for display (e.g., model multipliers, reset dates) */
  meta?: Record<string, unknown>;
};

export type ResolvedUsageWindow = {
  id: string;
  duration?: number;
  amount?: number;
  remaining: number;
  used: number;
  remainingRatio: number;
  usedRatio: number;
  meta?: Record<string, unknown>;
  /** Explicit time remaining in seconds (if applicable) */
  timeRemaining?: number;
  /** Explicit amount remaining (if applicable) */
  amountRemaining?: number;
};

export type UsageStoreEntry = {
  windows: ResolvedUsageWindow[];
  updated?: number;
  fails?: number;
  active: boolean;
};

export type UsageStore = Map<string, UsageStoreEntry>;

export interface ProviderStrategy {
  id: string;
  label: string;
  quotas: QuotaDefinition[];
  hasAuthentication: (ctx: ExtensionContext) => Promise<boolean> | boolean;
  fetchUsage: (ctx: ExtensionContext) => Promise<UsageSnapshot[]>;
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
