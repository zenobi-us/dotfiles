---
id: conflict-resolution
title: Research Conflict Resolution - Prioritizing Per-Model Storage
created_at: 2026-02-08T00:30:00+10:30
updated_at: 2026-02-08T00:30:00+10:30
status: active
epic_id: fc52bd74
phase_id: null
tags: [architecture, conflict-resolution, design-decisions]
---

# Research Conflict Resolution

## Priority Declaration

**Per-model storage (research-per-model-storage-keys.md) is the CORRECT architecture.**

All other research documents must be updated to align with this design.

## Conflicts Identified

### 1. ❌ Storage Key Structure

**Conflict Source**: All three documents

#### research-9056b4da-platform-usage-tracking.md
```typescript
// INCORRECT - Implies provider-only keys
Map<string, UsageStoreEntry>
```

#### research-typed-metadata-design.md
```typescript
// INCORRECT - No modelId in types
export type UsageStoreEntry = {
  windows: ResolvedUsageWindow<Record<string, unknown>>[];
  updated?: number;
  fails?: number;
  active: boolean;
};

// Storage by provider only
const stored: UsageStoreEntry = {
  windows: [{
    id: "30_day",
    remaining: 173,
    meta: { /* ... */ }
  }]
};
```

#### knowledge-platform-tracker-flow.md
```
║  Map<providerId, UsageStoreEntry>                                ║
║                                                                   ║
║  Example state:                                                   ║
║  {                                                               ║
║    "anthropic": {                                                ║
║      windows: [...],                                             ║
```

**CORRECT (from per-model-storage-keys):**
```typescript
// Compound keys: provider/model
export type StorageKey = `${string}/${string}`;
Map<StorageKey, UsageStoreEntry>

// Entry has identity
export type UsageStoreEntry<TMeta = Record<string, unknown>> = {
  providerId: string;        // NEW
  modelId: string;           // NEW
  windows: ResolvedUsageWindow<TMeta>[];
  updated?: number;
  fails?: number;
  active: boolean;
};

// Example state:
{
  "anthropic/default": { providerId: "anthropic", modelId: "default", ... },
  "copilot/gpt-4o": { providerId: "copilot", modelId: "gpt-4o", ... },
  "copilot/spark": { providerId: "copilot", modelId: "spark", ... }
}
```

**Action Required:**
- ✅ Update `research-9056b4da-platform-usage-tracking.md` section "Architecture Analysis"
- ✅ Update `research-typed-metadata-design.md` all type definitions
- ✅ Update `knowledge-platform-tracker-flow.md` storage diagram

---

### 2. ❌ Missing modelId Field

**Conflict Source**: research-typed-metadata-design.md, research-9056b4da-platform-usage-tracking.md

#### research-typed-metadata-design.md
```typescript
// INCORRECT - No modelId
export type UsageSnapshot<TMeta = Record<string, unknown>> = {
  id: string;
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  duration?: number;
  amountTotal?: number;
  meta?: TMeta;
};

export type ResolvedUsageWindow<TMeta = Record<string, unknown>> = {
  id: string;
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

**CORRECT (from per-model-storage-keys):**
```typescript
export type UsageSnapshot<TMeta = Record<string, unknown>> = {
  id: string;
  modelId: string;         // NEW: Required for storage key
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  duration?: number;
  amountTotal?: number;
  meta?: TMeta;
};

export type ResolvedUsageWindow<TMeta = Record<string, unknown>> = {
  id: string;
  modelId: string;         // NEW: Required for identity
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

**Action Required:**
- ✅ Add `modelId: string` to both types in research-typed-metadata-design.md
- ✅ Update all examples to include modelId
- ✅ Update research-9056b4da-platform-usage-tracking.md type definitions

---

### 3. ❌ Type Guard Location

**Conflict Source**: research-typed-metadata-design.md

#### research-typed-metadata-design.md
```typescript
// INCORRECT - Type guards are external/consumer-side
function isCopilotMeta(meta: unknown): meta is CopilotMeta {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "resetType" in meta &&
    meta.resetType === "calendar"
  );
}

// Consumer uses external guard
function getResetTime(providerId: string): number | undefined {
  const entry = usageTracker.store.get(providerId);
  const meta = entry?.windows?.[0]?.meta;
  
  if (isCopilotMeta(meta)) {
    return meta.resetTime;
  }
  
  return undefined;
}
```

**CORRECT (from per-model-storage-keys):**
```typescript
// Type guard is PROVIDER METHOD
export interface ProviderStrategy<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  quotas: QuotaDefinition[];
  hasAuthentication: (ctx: ExtensionContext) => Promise<boolean> | boolean;
  fetchUsage: (ctx: ExtensionContext) => Promise<UsageSnapshot<TMeta>[]>;
  isMetadata?: (meta: unknown) => meta is TMeta;  // PRIVATE to provider
}

// Consumer uses provider's guard
function getResetTime(providerId: string, modelId: string): number | undefined {
  const provider = usageTracker.providers.get(providerId);
  const key = makeStorageKey(providerId, modelId);
  const entry = usageTracker.store.get(key);
  const meta = entry?.windows?.[0]?.meta;
  
  if (provider?.isMetadata?.(meta)) {
    return meta.resetTime;  // Type-safe
  }
  
  return undefined;
}
```

**Rationale:**
- Type guard is specific to the provider's metadata contract
- Provider owns the metadata structure
- Keeps type guard co-located with provider implementation
- Consumer doesn't need to know metadata structure details

**Action Required:**
- ✅ Move type guard examples to provider interface in research-typed-metadata-design.md
- ✅ Update all consumer examples to use provider's isMetadata method
- ✅ Update provider examples to include isMetadata method

---

### 4. ❌ Query Functions Missing modelId Parameter

**Conflict Source**: knowledge-platform-tracker-flow.md

#### knowledge-platform-tracker-flow.md
```typescript
// INCORRECT - Only queries by provider and window
getWindowById(platformId, windowId) → ResolvedUsageWindow

createWindowProgressPercentageProvider(plat, win)
createWindowRemainingTimeProvider(plat, win)
```

**CORRECT (from per-model-storage-keys):**
```typescript
// Query by provider, model, AND window
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

// Context providers need model parameter
createWindowProgressPercentageProvider(providerId, modelId, windowId)
createWindowRemainingTimeProvider(providerId, modelId, windowId)
```

**Action Required:**
- ✅ Update all query function signatures in knowledge-platform-tracker-flow.md
- ✅ Add helper functions for multi-model queries
- ✅ Update context provider creation signatures

---

### 5. ⚠️ QuotaDefinition Enhancement Proposals

**Conflict Source**: knowledge-platform-tracker-flow.md vs per-model-storage-keys.md

#### knowledge-platform-tracker-flow.md
Proposes extensive enhancements:
```typescript
export type QuotaWindowType = "rolling" | "fixed" | "session";
export type QuotaResetBehavior = "continuous" | "calendar" | "session-start";
export type QuotaAggregationStrategy = "min" | "max" | "sum" | "individual";

type QuotaPercentageDefinition = { ... };
type QuotaMultiplierDefinition = { ... };
type QuotaPerModelDefinition = { ... };
```

#### per-model-storage-keys.md
Minimal schema approach:
```typescript
// Schema should be MINIMAL - just structure
type QuotaDurationDefinition = {
  id: string;
  duration: number;       // REQUIRED
  modelIds?: string[];
};

type QuotaAmountDefinition = {
  id: string;
  amount: number;         // REQUIRED
  modelIds?: string[];
};

type QuotaPercentageDefinition = {
  id: string;
  percentageOnly: true;
  modelIds?: string[];
};

type QuotaMultiplierDefinition = {
  id: string;
  baseAmount: number;
  multipliers: Record<string, number>;
};
```

**Resolution:**
Per-model-storage-keys.md is CORRECT - schema should describe structure, NOT behavior.

**Rationale from earlier discussion:**
- QuotaDefinition = Schema = "What shape is this quota?"
- Runtime behavior (reset times, window types) goes in metadata
- Separates concerns: definition vs runtime state

**Action Required:**
- ✅ Remove windowType, resetBehavior from QuotaDefinition in knowledge-platform-tracker-flow.md
- ✅ Move these concepts to metadata examples
- ✅ Keep only structural types: Duration, Amount, Percentage, Multiplier, PerModel

---

### 6. ❌ Store Update Logic

**Conflict Source**: knowledge-platform-tracker-flow.md

#### knowledge-platform-tracker-flow.md
```typescript
// INCORRECT - Updates by provider only
async update(name) {
  const provider = this.providers.get(name);
  // ...
  const nextEntry: UsageStoreEntry = {
    windows: previous?.windows ?? [],
    updated: now,
    fails: failures,
    active: previous?.active ?? true,
  };
  // ...
  this.store.set(name, nextEntry);  // Sets by provider ID
}
```

**CORRECT (from per-model-storage-keys):**
```typescript
async update(providerId: string) {
  const provider = this.providers.get(providerId);
  // ...
  const snapshots = await provider.fetchUsage(currentCtx);

  // Process EACH snapshot into per-model storage
  for (const snapshot of snapshots) {
    const storageKey = makeStorageKey(providerId, snapshot.modelId);
    const quota = provider.quotas.find(q => q.id === snapshot.id);
    if (!quota) continue;

    const resolved = resolveUsageWindow(quota, snapshot);

    const entry: UsageStoreEntry = {
      providerId,
      modelId: snapshot.modelId,
      windows: [resolved],
      updated: Date.now(),
      fails: 0,
      active: true
    };

    this.store.set(storageKey, entry);  // Sets by provider/model key
  }
}
```

**Action Required:**
- ✅ Update store.ts pseudo-code in knowledge-platform-tracker-flow.md
- ✅ Show per-model iteration and storage
- ✅ Update critical bug section (now becomes "missing loop body + wrong key")

---

### 7. ❌ Provider Examples Without modelId

**Conflict Source**: research-typed-metadata-design.md

All provider examples show:
```typescript
// INCORRECT
return [{
  id: "30_day",
  remaining: 173,
  meta: {
    entitlement: 300,
    resetTime: 1709251200,
    resetType: "calendar"
  }
}];
```

**CORRECT:**
```typescript
return [{
  id: "30_day",
  modelId: "gpt-4o",  // Required!
  remaining: 173,
  meta: {
    entitlement: 300,
    resetTime: 1709251200,
    resetType: "calendar",
    modelMultiplier: 0
  }
}];
```

**Action Required:**
- ✅ Add modelId to ALL snapshot examples in research-typed-metadata-design.md
- ✅ Update Copilot example to show multiple snapshots (one per model)
- ✅ Update Anthropic example with modelId: "default"
- ✅ Update Antigravity example to show per-model snapshots

---

## Summary of Required Changes

### research-9056b4da-platform-usage-tracking.md

**Section: Architecture Analysis**
- ✅ Change `Map<string, UsageStoreEntry>` to `Map<StorageKey, UsageStoreEntry>`
- ✅ Add explanation of compound keys: `"provider/model"`
- ✅ Update example state to show per-model entries
- ✅ Add `modelId` field to `UsageSnapshot` and `ResolvedUsageWindow` type examples

**Section: Code Analysis Notes**
- ✅ Update all type definitions to include `modelId`
- ✅ Update "Potential Improvements" to reflect per-model design

---

### research-typed-metadata-design.md

**Section: Core Types**
- ✅ Add `modelId: string` to `UsageSnapshot<TMeta>`
- ✅ Add `modelId: string` to `ResolvedUsageWindow<TMeta>`
- ✅ Update `UsageStoreEntry` to include `providerId` and `modelId` fields
- ✅ Change `UsageStore` to `Map<StorageKey, UsageStoreEntry<any>>`

**Section: Provider Strategy**
- ✅ Add `isMetadata?: (meta: unknown) => meta is TMeta` as provider method
- ✅ Remove standalone type guard functions
- ✅ Update all examples to use provider.isMetadata

**Section: Provider Examples**
- ✅ Add `modelId` to ALL Copilot snapshots
- ✅ Add `modelId: "default"` to Anthropic snapshots
- ✅ Add `modelId` to Antigravity snapshots
- ✅ Add `isMetadata` method to each provider implementation

**Section: Type-Safe Metadata Access**
- ✅ Update all query examples to use `(providerId, modelId)` signature
- ✅ Show usage of `provider.isMetadata` instead of standalone guards

**Section: Example: Full Type Flow**
- ✅ Update storage keys to `"copilot/gpt-4o"`
- ✅ Add modelId to snapshot example
- ✅ Update consumer to query by provider+model

---

### knowledge-platform-tracker-flow.md

**Section: QuotaDefinition ASCII Diagram**
- ✅ Remove `windowType`, `resetBehavior`, `resetSchedule` from QuotaDefinition
- ✅ Add note: "Behavioral metadata goes in UsageSnapshot.meta"
- ✅ Keep only structural types: Duration, Amount, Percentage, Multiplier

**Section: Usage Store Diagram**
- ✅ Change from `Map<providerId, UsageStoreEntry>` to `Map<StorageKey, UsageStoreEntry>`
- ✅ Update example state to show per-model keys:
  ```
  "anthropic/default": { providerId: "anthropic", modelId: "default", ... }
  "copilot/gpt-4o": { providerId: "copilot", modelId: "gpt-4o", ... }
  "copilot/spark": { providerId: "copilot", modelId: "spark", ... }
  ```

**Section: Store Update Logic**
- ✅ Update pseudo-code to show per-snapshot iteration
- ✅ Show `makeStorageKey(providerId, snapshot.modelId)`
- ✅ Show entry with `providerId` and `modelId` fields
- ✅ Update CRITICAL BUG annotation to include "wrong key structure"

**Section: Footer Context Providers**
- ✅ Update all query functions to accept `(providerId, modelId, windowId)`
- ✅ Add `getProviderModels(providerId)` helper
- ✅ Update all create*Provider functions with 3 parameters
- ✅ Show example of querying by compound key

**Section: Proposed QuotaDefinition Enhancements**
- ✅ REMOVE entire section about windowType/resetBehavior in schema
- ✅ Add section showing these belong in metadata
- ✅ Keep only minimal schema enhancements:
  - QuotaPercentageDefinition
  - QuotaMultiplierDefinition
  - QuotaPerModelDefinition (optional)

---

## Design Principles (Reinforced)

### 1. Separation of Concerns
- **QuotaDefinition**: Structure only (duration/amount/percentage/multipliers)
- **UsageSnapshot.meta**: Runtime behavior (reset times, window types, etc.)
- **UsageStoreEntry**: Has identity (providerId, modelId)

### 2. Storage Strategy
- **Keys**: Compound `"provider/model"` for granular tracking
- **Flexibility**: Storage remains `Record<string, unknown>` for meta
- **Identity**: Data knows what it represents

### 3. Type Safety
- **Provider-owned**: Type guards are provider methods
- **Generic**: `ProviderStrategy<TMeta>` parameterizes metadata
- **Recovery**: Type safety recovered at consumption via guards

### 4. Query Patterns
- By provider: `store.entries().filter(key => key.startsWith("provider/"))`
- By model: Use compound key `store.get("provider/model")`
- All models: `getProviderModels(providerId)`

---

## Migration Order

1. **Phase 1**: Update type definitions (all 3 documents)
   - Add `modelId` to UsageSnapshot, ResolvedUsageWindow, UsageStoreEntry
   - Change storage key type
   - Move type guards to provider interface

2. **Phase 2**: Update examples (all 3 documents)
   - Add modelId to all snapshot examples
   - Update storage state examples to show compound keys
   - Update query function signatures

3. **Phase 3**: Update implementation guidance
   - Remove behavioral fields from QuotaDefinition
   - Update store update logic pseudo-code
   - Update context provider creation

4. **Phase 4**: Simplify design
   - Remove redundant windowType/resetBehavior proposals
   - Consolidate to minimal schema + rich metadata approach

---

## Validation Checklist

After updates, verify:
- ✅ All type definitions include `modelId` where needed
- ✅ All storage examples use compound keys
- ✅ All query functions accept `(providerId, modelId, ...)`
- ✅ Type guards are provider methods, not standalone
- ✅ QuotaDefinition is minimal (structure only)
- ✅ Behavioral metadata is in UsageSnapshot.meta
- ✅ UsageStoreEntry has identity fields

---

## Files to Update

1. `research-9056b4da-platform-usage-tracking.md` - Architecture Analysis section
2. `research-typed-metadata-design.md` - All type definitions and examples
3. `knowledge-platform-tracker-flow.md` - Storage diagram, update logic, query functions

All updates should maintain the principle: **Per-model storage with compound keys is the canonical architecture.**
