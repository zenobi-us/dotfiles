---
id: 845f3788
title: Platform Tracker - Phase 1 - Core Type Refactor
created_at: 2026-02-08T01:45:00+10:30
updated_at: 2026-02-08T01:45:00+10:30
status: completed
epic_id: fc52bd74
phase_id: null
assigned_to: null
tags: [platform-tracker, types, refactor, per-model-storage]
---

# Task: Platform Tracker Core Type Refactor

## Objective

Refactor the Platform Tracker type system to support per-model storage with compound keys and compile-time type safety.

## Related Research

- **Primary**: research-9056b4da-platform-usage-tracking.md (Section: "Complete Type System")
- **Flow**: knowledge-platform-tracker-flow.md

## Steps

### 1. Update Core Storage Types

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/types.ts`

Add storage key types:
```typescript
// Compound key type
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
```

### 2. Add Identity to UsageStoreEntry

Update `UsageStoreEntry`:
```typescript
export type UsageStoreEntry<TMeta = Record<string, unknown>> = {
  providerId: string;        // NEW: Which provider
  modelId: string;           // NEW: Which model (or "default")
  windows: ResolvedUsageWindow<TMeta>[];
  updated?: number;
  fails?: number;
  active: boolean;
};
```

Update store type:
```typescript
export type UsageStore = Map<StorageKey, UsageStoreEntry<any>>;
```

### 3. Add modelId to Snapshot and Window Types

Update `UsageSnapshot`:
```typescript
export type UsageSnapshot<TMeta = Record<string, unknown>> = {
  id: string;
  modelId: string;           // NEW: Required for storage key
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  duration?: number;
  amountTotal?: number;
  meta?: TMeta;
};
```

Update `ResolvedUsageWindow`:
```typescript
export type ResolvedUsageWindow<TMeta = Record<string, unknown>> = {
  id: string;
  modelId: string;           // NEW: Required for identity
  duration?: number;
  amount?: number;
  remaining: number;
  used: number;
  remainingRatio: number;
  usedRatio: number;
  meta?: Record<string, unknown>;
  timeRemaining?: number;
  amountRemaining?: number;
};
```

### 4. Update ProviderStrategy Interface

Replace runtime type guard with compile-time accessor:
```typescript
export interface ProviderStrategy<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  quotas: QuotaDefinition[];
  models?: string[];
  
  hasAuthentication: (ctx: ExtensionContext) => Promise<boolean> | boolean;
  fetchUsage: (ctx: ExtensionContext) => Promise<UsageSnapshot<TMeta>[]>;
  
  // Type-safe metadata accessor - no runtime guard needed!
  getMetadata(entry: UsageStoreEntry): TMeta | undefined {
    return entry.windows[0]?.meta as TMeta;
  }
  
  // Optional: only for validation/debugging
  validateMetadata?: (meta: unknown) => meta is TMeta;
}
```

### 5. Verify Quota Types

Ensure these types exist (should already be in types.ts):
```typescript
export type QuotaDurationDefinition = {
  id: string;
  duration: number;
  modelIds?: string[];
};

export type QuotaAmountDefinition = {
  id: string;
  amount: number;
  modelIds?: string[];
};

export type QuotaPercentageDefinition = {
  id: string;
  percentageOnly: true;
  modelIds?: string[];
};

export type QuotaMultiplierDefinition = {
  id: string;
  baseAmount: number;
  multipliers: Record<string, number>;
};

export type QuotaDefinition =
  | QuotaDurationDefinition
  | QuotaAmountDefinition
  | QuotaPercentageDefinition
  | QuotaMultiplierDefinition;
```

### 6. Update resolveUsageWindow Function

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/store.ts`

Update to include modelId:
```typescript
function resolveUsageWindow(
  quota: QuotaDefinition,
  snapshot: UsageSnapshot,
): ResolvedUsageWindow {
  const total = quota.duration ?? quota.amount ?? 100;

  // ... existing calculation logic ...

  return {
    id: quota.id,
    modelId: snapshot.modelId,  // NEW: Include modelId
    duration: quota.duration,
    amount: quota.amount,
    remaining,
    used,
    remainingRatio,
    usedRatio,
  };
}
```

## Expected Outcome

After completion:
- ✅ StorageKey type and helpers exist
- ✅ UsageStoreEntry has providerId and modelId fields
- ✅ UsageSnapshot has modelId field
- ✅ ResolvedUsageWindow has modelId field
- ✅ ProviderStrategy has getMetadata() method
- ✅ UsageStore uses Map<StorageKey, ...>
- ✅ resolveUsageWindow includes modelId

## Verification

```bash
# Check types compile
cd devtools/files/pi/agent/extensions/pi-footer
npx tsc --noEmit services/PlatformTracker/types.ts

# Look for type errors
grep -r "isMetadata" services/PlatformTracker/
# Should only find validateMetadata (optional), not isMetadata
```

## Notes

- This is a **breaking change** for any code accessing the store
- Next tasks will update providers and store logic
- Keep metadata as `Record<string, unknown>` in storage types
- Type safety comes from provider reference, not runtime checks

## Lessons Learned

*To be filled after completion*
