import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type ProviderId = string;
export type ModelId = `${ProviderId}/${string}`; // e.g., "anthropic/claude-sonnet-4-7"

// Compound storage key type for per-model storage
export type StorageKey = `${string}/${string}`; // "provider/model"

// Helper to construct storage keys
export function makeStorageKey(
  providerId: string,
  modelId: string,
): StorageKey {
  return `${providerId}/${modelId}`;
}

// Helper to parse storage keys
export function parseStorageKey(key: StorageKey): {
  providerId: string;
  modelId: string;
} {
  const [providerId, modelId] = key.split("/", 2);
  return { providerId, modelId };
}

// Duration-based quota (time windows)
export type QuotaDurationDefinition = {
  id: string;
  duration: number; // Required: window size in seconds
  modelIds?: string[]; // Optional list of model IDs this quota applies to
};

// Amount-based quota (request counts)
export type QuotaAmountDefinition = {
  id: string;
  amount: number; // Required: total quota amount
  modelIds?: string[];
};

// Percentage-only quota (unknown totals like Anthropic)
export type QuotaPercentageDefinition = {
  id: string;
  percentageOnly: true; // Discriminator
  modelIds?: string[];
};

// Multiplier-based quota (like Copilot)
export type QuotaMultiplierDefinition = {
  id: string;
  baseAmount: number; // Base quota
  multipliers: Record<string, number>; // Model → cost multiplier
};

export type QuotaDefinition =
  | QuotaDurationDefinition
  | QuotaAmountDefinition
  | QuotaPercentageDefinition
  | QuotaMultiplierDefinition;

export type UsageSnapshot<TMeta = Record<string, unknown>> = {
  id: string;
  modelId: string; // NEW: Required for storage key
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  /** Override the quota duration for this specific snapshot window */
  duration?: number;
  /** Override the quota amount for this specific snapshot window */
  amountTotal?: number;
  /** Arbitrary metadata for display (e.g., model multipliers, reset dates) */
  meta?: TMeta;
};

export type ResolvedUsageWindow<TMeta = Record<string, unknown>> = {
  id: string;
  modelId: string; // NEW: Required for identity
  duration?: number;
  amount?: number;
  remaining: number;
  used: number;
  remainingRatio: number;
  usedRatio: number;
  meta?: TMeta;
  /** Explicit time remaining in seconds (if applicable) */
  timeRemaining?: number;
  /** Explicit amount remaining (if applicable) */
  amountRemaining?: number;
};

export type UsageStoreEntry<TMeta = Record<string, unknown>> = {
  providerId: string; // NEW: Which provider
  modelId: string; // NEW: Which model (or "default")
  windows: ResolvedUsageWindow<TMeta>[];
  updated?: number;
  fails?: number;
  active: boolean;
};

// Store is now keyed by compound StorageKey
export type UsageStore = Map<StorageKey, UsageStoreEntry<any>>;

export interface ProviderStrategy<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  quotas: QuotaDefinition[];
  models?: string[]; // Supported models

  hasAuthentication: (ctx: ExtensionContext) => Promise<boolean> | boolean;
  fetchUsage: (ctx: ExtensionContext) => Promise<UsageSnapshot<TMeta>[]>;

  // Type-safe metadata accessor signature only.
  // If omitted, tracker injects a default accessor in registerProvider().
  getMetadata?: (entry: UsageStoreEntry) => TMeta | undefined;

  // Optional runtime validator for debugging/corruption checks.
  validateMetadata?: (meta: unknown) => meta is TMeta;
}

// Type-safe metadata accessor helper
export function getProviderMetadata<TMeta>(
  entry: UsageStoreEntry,
): TMeta | undefined {
  return entry.windows[0]?.meta as TMeta;
}

export interface UsageTracker {
  store: UsageStore;
  providers: Map<string, ProviderStrategy<any>>;
  registerProvider<TMeta = Record<string, unknown>>(
    provider: ProviderStrategy<TMeta>,
  ): void;
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

export type RuntimeState = {
  inFlight: boolean;
  queued: boolean;
  nextEligibleAt: number;
  backoffLevel: number;
};

export type TriggerReason =
  | "start"
  | "updateAll"
  | "attach"
  | "turn_start"
  | "tool_result"
  | "turn_end";

export type UsageTrackerInternal = UsageTracker & {
  start: (
    ctx: ExtensionContext,
    settings?: Partial<UsageTrackerSettings>,
  ) => void;
  stop: () => void;
  trigger: (reason?: TriggerReason) => void;
  setSettings: (settings: Partial<UsageTrackerSettings>) => void;
  subscribe: (listener: Listener) => () => void;
};
