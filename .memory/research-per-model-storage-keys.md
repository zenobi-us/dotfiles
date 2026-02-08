---
id: per-model-storage
title: Per-Model Storage Keys and Type Guards
created_at: 2026-02-08T00:15:00+10:30
updated_at: 2026-02-08T00:15:00+10:30
status: proposed
epic_id: fc52bd74
phase_id: null
tags: [storage-keys, type-safety, per-model, architecture]
---

# Per-Model Storage Keys and Type Guards

## Problem Analysis

### Current Design (Incorrect)
```typescript
// Stores by provider ID only
Map<providerId, UsageStoreEntry>

// Example:
store.get("copilot") → Single entry for ALL models
store.get("antigravity") → Single entry for ALL models
```

**Issues:**
1. Can't track different models with different quotas
2. Can't distinguish between `gemini-3-pro` and `gemini-3-flash`
3. Antigravity specifically needs per-model tracking (research showed this)
4. Type guards can't target specific provider+model combinations

### Correct Design (Proposed)
```typescript
// Store by provider/model key
Map<`${providerId}/${modelId}`, UsageStoreEntry>

// Examples:
store.get("copilot/gpt-4o") → Entry for gpt-4o
store.get("copilot/spark") → Entry for spark
store.get("antigravity/gemini-3-pro") → Entry for gemini-3-pro
store.get("antigravity/gemini-3-flash") → Entry for gemini-3-flash
store.get("anthropic/claude-sonnet-4") → Entry for sonnet
```

## Revised Type System

### Core Storage Types

```typescript
// Storage key type
export type StorageKey = `${string}/${string}`;  // "provider/model"

// Helper to construct keys
export function makeStorageKey(providerId: string, modelId: string): StorageKey {
  return `${providerId}/${modelId}`;
}

// Helper to parse keys
export function parseStorageKey(key: StorageKey): { providerId: string; modelId: string } {
  const [providerId, modelId] = key.split("/", 2);
  return { providerId, modelId };
}

// Entry now knows its identity
export type UsageStoreEntry<TMeta = Record<string, unknown>> = {
  providerId: string;        // NEW: Which provider
  modelId: string;           // NEW: Which model (or "default")
  windows: ResolvedUsageWindow<TMeta>[];
  updated?: number;
  fails?: number;
  active: boolean;
};

// Store is keyed by provider/model
export type UsageStore = Map<StorageKey, UsageStoreEntry<any>>;
```

### Provider Strategy with Model Awareness

```typescript
export interface ProviderStrategy<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  quotas: QuotaDefinition[];
  
  // Optional: declare which models this provider supports
  models?: string[];  // e.g., ["gpt-4o", "gpt-4.1", "spark"]
  
  hasAuthentication: (ctx: ExtensionContext) => Promise<boolean> | boolean;
  
  // Returns snapshots with modelId per snapshot
  fetchUsage: (ctx: ExtensionContext) => Promise<UsageSnapshot<TMeta>[]>;
  
  // NEW: Type guard private to this provider
  isMetadata?: (meta: unknown) => meta is TMeta;
}

// Updated snapshot to include modelId
export type UsageSnapshot<TMeta = Record<string, unknown>> = {
  id: string;              // Quota ID (e.g., "30_day", "5_hour")
  modelId: string;         // NEW: Which model this applies to (or "default")
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  duration?: number;
  amountTotal?: number;
  meta?: TMeta;
};

// Resolved window also has identity
export type ResolvedUsageWindow<TMeta = Record<string, unknown>> = {
  id: string;              // Quota ID
  modelId: string;         // NEW: Which model
  duration?: number;
  amount?: number;
  remaining: number;
  used: number;
  remainingRatio: number;
  usedRatio: number;
  meta?: TMeta;
  timeRemaining?: number;
  amountRemaining?: number;
};
```

## Provider Implementation Examples

### Single-Model Provider (Anthropic)

```typescript
// anthropic.ts
type AnthropicMeta = {
  sessionStart?: number;
  windowType: "rolling" | "session";
  utilizationSource: "five_hour" | "five_day" | "seven_day";
};

usageTracker.registerProvider<AnthropicMeta>({
  id: "anthropic",
  label: "Anthropic",
  models: ["default"],  // Single model (or could be "claude-sonnet-4")
  quotas: [
    { id: "5_hour", percentageOnly: true },
    { id: "5_day", percentageOnly: true }
  ],
  
  hasAuthentication: () => hasAuthKey("anthropic"),
  
  fetchUsage: async (): Promise<UsageSnapshot<AnthropicMeta>[]> => {
    const auth = readPiAuthJson();
    const token = auth.anthropic?.access;
    if (!token) return [];

    const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
      headers: {
        Authorization: `Bearer ${token}`,
        "anthropic-beta": "oauth-2025-04-20"
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const data = await res.json();
    const windows: UsageSnapshot<AnthropicMeta>[] = [];

    if (data.five_hour?.utilization !== undefined) {
      windows.push({
        id: "5_hour",
        modelId: "default",  // Single model
        usedRatio: data.five_hour.utilization / 100,
        remainingRatio: 1 - (data.five_hour.utilization / 100),
        meta: {
          windowType: "session",
          utilizationSource: "five_hour"
        }
      });
    }

    if (data.five_day?.utilization !== undefined) {
      windows.push({
        id: "5_day",
        modelId: "default",
        usedRatio: data.five_day.utilization / 100,
        remainingRatio: 1 - (data.five_day.utilization / 100),
        meta: {
          windowType: "rolling",
          utilizationSource: "five_day"
        }
      });
    }

    return windows;
  },
  
  // Type guard private to provider
  isMetadata: (meta: unknown): meta is AnthropicMeta => {
    return (
      typeof meta === "object" &&
      meta !== null &&
      "windowType" in meta &&
      (meta.windowType === "rolling" || meta.windowType === "session")
    );
  }
});
```

**Storage:**
- Key: `"anthropic/default"`
- Entry: `{ providerId: "anthropic", modelId: "default", windows: [...] }`

### Multi-Model Provider (Copilot)

```typescript
// copilot.ts
type CopilotMeta = {
  entitlement: number;
  resetTime: number;
  resetType: "calendar";
  modelMultiplier: number;  // Cost for this specific model
};

usageTracker.registerProvider<CopilotMeta>({
  id: "copilot",
  label: "Copilot",
  models: ["gpt-4o", "gpt-4.1", "gpt-5-mini", "standard", "spark"],
  quotas: [{ id: "30_day", amount: 300 }],
  
  hasAuthentication: () => hasAuthKey("github-copilot"),
  
  fetchUsage: async (): Promise<UsageSnapshot<CopilotMeta>[]> => {
    const auth = readPiAuthJson();
    const token = auth["github-copilot"]?.refresh;
    if (!token) return [];

    const res = await fetch("https://api.github.com/copilot_internal/user", {
      headers: {
        "Editor-Version": "vscode/1.96.2",
        "User-Agent": "GitHubCopilotChat/0.26.7",
        "X-Github-Api-Version": "2025-04-01",
        Accept: "application/json",
        Authorization: `token ${token}`,
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const data = await res.json();
    const premium = data.quota_snapshots?.premium_interactions;
    if (!premium) return [];

    const entitlement = Math.max(1, premium.entitlement ?? 0);
    const remaining = Math.max(0, premium.remaining ?? 0);
    const used = entitlement - remaining;

    // Calculate next reset
    const now = new Date();
    const nextMonth = new Date(Date.UTC(
      now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(),
      now.getUTCMonth() === 11 ? 0 : now.getUTCMonth() + 1,
      1, 0, 0, 0
    ));
    const resetTime = Math.floor(nextMonth.getTime() / 1000);

    // Model multipliers from research
    const multipliers: Record<string, number> = {
      "gpt-4o": 0,
      "gpt-4.1": 0,
      "gpt-5-mini": 0,
      "standard": 1,
      "spark": 4
    };

    // Return snapshot per model (shared quota, different multipliers)
    const snapshots: UsageSnapshot<CopilotMeta>[] = [];
    
    for (const [modelId, multiplier] of Object.entries(multipliers)) {
      // Calculate effective quota for this model
      const effectiveRemaining = multiplier === 0 
        ? Infinity 
        : remaining / multiplier;
      
      snapshots.push({
        id: "30_day",
        modelId,
        remaining: effectiveRemaining,
        used: used / multiplier,
        remainingRatio: remaining / entitlement,
        usedRatio: used / entitlement,
        meta: {
          entitlement,
          resetTime,
          resetType: "calendar",
          modelMultiplier: multiplier
        }
      });
    }

    return snapshots;
  },
  
  isMetadata: (meta: unknown): meta is CopilotMeta => {
    return (
      typeof meta === "object" &&
      meta !== null &&
      "resetType" in meta &&
      meta.resetType === "calendar" &&
      "modelMultiplier" in meta
    );
  }
});
```

**Storage:**
- Key: `"copilot/gpt-4o"` → Entry with `modelMultiplier: 0`
- Key: `"copilot/standard"` → Entry with `modelMultiplier: 1`
- Key: `"copilot/spark"` → Entry with `modelMultiplier: 4`

### Per-Model Independent Quotas (Antigravity)

```typescript
// antigravity.ts
type AntigravityMeta = {
  modelName: string;         // Full model name from API
  limit?: string;            // API limit descriptor ("high", "medium", etc.)
  quotaFraction: number;     // This model's remaining fraction
};

usageTracker.registerProvider<AntigravityMeta>({
  id: "antigravity",
  label: "Google Antigravity",
  models: [
    "gemini-3-pro",
    "gemini-3-flash",
    "claude-sonnet-4-5",
    "claude-opus-4-5"
  ],
  quotas: [
    { id: "quota", perModel: {
      "gemini-3-pro": { amount: 100 },
      "gemini-3-flash": { amount: 100 }
    }}
  ],
  
  hasAuthentication: () => hasAuthKey("google-antigravity"),
  
  fetchUsage: async (): Promise<UsageSnapshot<AntigravityMeta>[]> => {
    const auth = readPiAuthJson();
    const token = auth["google-antigravity"]?.access;
    if (!token) return [];

    const res = await fetch(
      "https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: "{}",
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      }
    );

    const data = await res.json();
    const snapshots: UsageSnapshot<AntigravityMeta>[] = [];

    // Each model has independent quota
    for (const [modelId, model] of Object.entries(data.models ?? {})) {
      const fraction = Math.max(
        0, 
        Math.min(1, model.quotaInfo?.remainingFraction ?? 1)
      );

      // Normalize model ID (e.g., "gemini-3-pro-001" → "gemini-3-pro")
      const normalizedId = normalizeModelId(modelId);

      snapshots.push({
        id: "quota",
        modelId: normalizedId,
        remainingRatio: fraction,
        usedRatio: 1 - fraction,
        meta: {
          modelName: modelId,
          limit: model.quotaInfo?.limit,
          quotaFraction: fraction
        }
      });
    }

    return snapshots;
  },
  
  isMetadata: (meta: unknown): meta is AntigravityMeta => {
    return (
      typeof meta === "object" &&
      meta !== null &&
      "modelName" in meta &&
      "quotaFraction" in meta &&
      typeof meta.quotaFraction === "number"
    );
  }
});

function normalizeModelId(fullId: string): string {
  // "gemini-3-pro-001" → "gemini-3-pro"
  // "claude-sonnet-4-5-20250101" → "claude-sonnet-4-5"
  return fullId.toLowerCase()
    .replace(/-\d{8}$/, "")  // Remove date suffix
    .replace(/-\d{3}$/, ""); // Remove version suffix
}
```

**Storage:**
- Key: `"antigravity/gemini-3-pro"` → Independent quota
- Key: `"antigravity/gemini-3-flash"` → Independent quota
- Key: `"antigravity/claude-sonnet-4-5"` → Independent quota

## Updated Store Logic

```typescript
// store.ts
async update(providerId: string) {
  if (!currentCtx || !providerId) return;

  const provider = this.providers.get(providerId);
  if (!provider) {
    // Clean up all entries for this provider
    for (const [key] of this.store) {
      if (key.startsWith(`${providerId}/`)) {
        this.store.delete(key);
      }
    }
    return;
  }

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
          fails: 0
        });
      }
    }
    return;
  }

  try {
    const snapshots = await provider.fetchUsage(currentCtx);

    // Process each snapshot into per-model storage
    for (const snapshot of snapshots) {
      const storageKey = makeStorageKey(providerId, snapshot.modelId);
      const previous = this.store.get(storageKey);
      
      // Find matching quota definition
      const quota = provider.quotas.find(q => q.id === snapshot.id);
      if (!quota) continue;

      // Resolve snapshot to window
      const resolved = resolveUsageWindow(quota, snapshot);

      // Update or create entry
      const entry: UsageStoreEntry = {
        providerId,
        modelId: snapshot.modelId,
        windows: [resolved],  // One window per snapshot
        updated: Date.now(),
        fails: 0,
        active: true
      };

      this.store.set(storageKey, entry);
    }
  } catch (error) {
    // Increment fails for all models of this provider
    for (const [key, entry] of this.store) {
      if (key.startsWith(`${providerId}/`)) {
        this.store.set(key, {
          ...entry,
          fails: (entry.fails ?? 0) + 1
        });
      }
    }
  }
}
```

## Context Provider Access

```typescript
// context/platforms.ts

// Query by provider and model
function getWindowByProviderModel(
  providerId: string,
  modelId: string,
  windowId: string
): ResolvedUsageWindow | undefined {
  const key = makeStorageKey(providerId, modelId);
  const entry = usageTracker.store.get(key);
  if (!entry?.windows?.length) return undefined;

  return entry.windows.find((window) => window.id === windowId);
}

// Get all models for a provider
function getProviderModels(providerId: string): string[] {
  const models = new Set<string>();
  
  for (const [key, entry] of usageTracker.store) {
    if (key.startsWith(`${providerId}/`)) {
      models.add(entry.modelId);
    }
  }
  
  return Array.from(models);
}

// Type-safe accessor using provider's type guard
function getTypedMeta<TMeta>(
  providerId: string,
  modelId: string,
  typeGuard: (meta: unknown) => meta is TMeta
): TMeta | undefined {
  const key = makeStorageKey(providerId, modelId);
  const entry = usageTracker.store.get(key);
  const meta = entry?.windows?.[0]?.meta;
  
  if (typeGuard(meta)) {
    return meta;  // Fully typed!
  }
  
  return undefined;
}

// Example usage
const provider = usageTracker.providers.get("copilot");
if (provider?.isMetadata) {
  const meta = getTypedMeta("copilot", "spark", provider.isMetadata);
  if (meta) {
    console.log(meta.modelMultiplier);  // Type-safe!
  }
}
```

## Benefits

✅ **Per-Model Tracking**: Each model has its own storage entry  
✅ **Identity in Data**: Entries know their provider and model  
✅ **Targeted Type Guards**: Guards are provider-private and specific  
✅ **Flexible Queries**: Can query by provider, model, or both  
✅ **Clear Keys**: `"provider/model"` is human-readable and structured  
✅ **Multi-Model Support**: Naturally handles providers with multiple models  
✅ **Independent Quotas**: Antigravity can track per-model quotas separately  

## Migration Impact

### Breaking Changes
1. Store keys change from `providerId` to `provider/model`
2. `UsageStoreEntry` gains `providerId` and `modelId` fields
3. `UsageSnapshot` gains `modelId` field
4. `ResolvedUsageWindow` gains `modelId` field
5. Type guards move to `ProviderStrategy.isMetadata`

### Migration Path
1. Update type definitions
2. Update each provider strategy to return `modelId` in snapshots
3. Update store logic to use compound keys
4. Update context providers to query by provider+model
5. Add type guard methods to each provider

## Related Files

- `types.ts` - Core type definitions
- `store.ts` - Update logic and key management
- `strategies/*.ts` - Add modelId and type guards
- `context/platforms.ts` - Update query functions
