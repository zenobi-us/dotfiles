---
id: platform-tracker-flow
title: Platform Tracker Data Flow and State Machine
created_at: 2026-02-07T23:45:00+10:30
updated_at: 2026-02-07T23:45:00+10:30
status: active
area: platform-tracker-architecture
tags: [architecture, data-flow, state-machine, usage-tracking]
learned_from: [research-9056b4da-platform-usage-tracking, epic-fc52bd74]
---

# Platform Tracker Data Flow and State Machine

## Overview

The Platform Tracker system manages usage data from multiple AI providers (Anthropic, Copilot, Antigravity, etc.) through a periodic polling mechanism. It maintains a centralized store that can be queried by footer context providers for display.

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM TRACKER SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Extension Init  │
└────────┬─────────┘
         │
         │ registerProvider(strategy)
         ▼
┌────────────────────┐
│ Provider Registry  │◄────── Multiple strategies register
│  (Map<id, strat>)  │        (anthropic, copilot, etc.)
└────────┬───────────┘
         │
         │ Each provider defines:
         │  - id: string
         │  - quotas: QuotaDefinition[]  ◄─── TYPE DEFINITION ISSUE
         │  - hasAuthentication()
         │  - fetchUsage()
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QuotaDefinition (Union Type)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Current Types:                                                              │
│                                                                              │
│  type QuotaDurationDefinition = {                                           │
│    id: string;                                                              │
│    duration?: number;      // Seconds in time window                       │
│    modelIds?: string[];    // Models this quota applies to                 │
│  }                                                                          │
│                                                                              │
│  type QuotaAmountDefinition = {                                             │
│    id: string;                                                              │
│    amount?: number;        // Request count or abstract amount             │
│    modelIds?: string[];    // Models this quota applies to                 │
│  }                                                                          │
│                                                                              │
│  type QuotaDefinition = QuotaDurationDefinition | QuotaAmountDefinition;    │
│                                                                              │
│  ⚠️ LIMITATIONS IDENTIFIED:                                                 │
│  • Cannot distinguish between rolling vs fixed windows                      │
│  • Cannot express reset behavior (session-based vs calendar)               │
│  • Cannot represent request multipliers per model                           │
│  • Cannot indicate quota aggregation strategy (min/max/sum)                │
│  • No way to express percentage-only quotas (unknown totals)               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ tracker.start(ctx)
         ▼
┌────────────────────┐
│   Tracker Started  │
│   running = true   │
└────────┬───────────┘
         │
         │ Loop every intervalMs (default 60s)
         │
         ▼
╔════════════════════════════════════════════════════════════════╗
║                     UPDATE CYCLE (Async)                        ║
╚════════════════════════════════════════════════════════════════╝
         │
         │ For each provider in registry:
         │
         ▼
    ┌────────────────┐
    │ Get Store Entry│
    │ (previous data)│
    └────┬───────────┘
         │
         ├──► Check: lastUpdate + interval * backoffMultiplier > now?
         │         YES → Skip this provider (throttled)
         │         NO  → Continue
         │
         ▼
    ┌──────────────────┐
    │ hasAuthentication│───► NO ──┐
    │      check       │          │
    └────┬─────────────┘          │
         │ YES                    │
         │                        ▼
         │                  ┌────────────────┐
         │                  │ Mark inactive  │
         │                  │ Clear windows  │
         │                  │ Reset fails=0  │
         │                  └────────────────┘
         ▼                         │
    ┌──────────────────┐          │
    │  fetchUsage()    │          │
    │  returns         │          │
    │  UsageSnapshot[] │          │
    └────┬─────────────┘          │
         │                        │
         │ SUCCESS                │
         ▼                        │
    ┌──────────────────────────────────────────────┐
    │ ⚠️ CRITICAL BUG: resolveUsageWindow() LOOP   │
    │                                               │
    │ Current code:                                 │
    │   for (const snapshot of snapshots) {        │
    │     //TODO: update store with usage data     │
    │   }                                           │
    │                                               │
    │ The loop does NOTHING - just iterates!       │
    │ Should call: resolveUsageWindow(quota, snap) │
    └──────────────────┬───────────────────────────┘
         │             │
         │ FAILURE     │
         ▼             │
    ┌───────────────┐ │
    │ Increment     │ │
    │ fails counter │ │
    │ (backoff)     │ │
    └───────┬───────┘ │
            │         │
            └─────────┼─────────────┐
                      │             │
                      ▼             ▼
                ┌──────────────────────┐
                │ Update Store Entry:  │
                │  - windows           │
                │  - updated timestamp │
                │  - fails counter     │
                │  - active flag       │
                └──────────┬───────────┘
                           │
                           │ After ALL providers updated
                           ▼
                    ┌──────────────┐
                    │ Notify all   │
                    │ listeners    │
                    └──────┬───────┘
                           │
                           │ Loop continues...
                           │
                           ▼
                    ┌─────────────────┐
                    │ Wait intervalMs │
                    │ (60 seconds)    │
                    └─────────────────┘


╔════════════════════════════════════════════════════════════════╗
║                  RESOLUTION LOGIC (Critical Function)           ║
╚════════════════════════════════════════════════════════════════╝

function resolveUsageWindow(quota: QuotaDefinition, snapshot: UsageSnapshot)
                                     │                    │
                                     │                    │
                ┌────────────────────┴────────────────────┴─────────────┐
                │                                                        │
                │  1. Determine "total" from quota definition:         │
                │     total = quota.duration ?? quota.amount ?? 100     │
                │                                                        │
                │  2. Calculate remaining from multiple sources:        │
                │     • snapshot.remaining (direct)                     │
                │     • total - snapshot.used (calculated)              │
                │     • remainingRatio * total (from ratio)             │
                │     • 0 (fallback)                                    │
                │                                                        │
                │  3. Calculate used from multiple sources:             │
                │     • snapshot.used (direct)                          │
                │     • total - snapshot.remaining (calculated)         │
                │     • usedRatio * total (from ratio)                  │
                │     • total - remaining (derived)                     │
                │                                                        │
                │  4. Calculate ratios (clamped 0-1):                   │
                │     • usedRatio = used / total                        │
                │     • remainingRatio = 1 - usedRatio                  │
                │                                                        │
                │  5. Return ResolvedUsageWindow with:                  │
                │     • All four values: remaining, used, ratios        │
                │     • Original quota.duration or quota.amount         │
                │     • Window id                                       │
                │                                                        │
                └────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌────────────────────┐
                          │ ResolvedUsageWindow│
                          │ stored in Map      │
                          └────────┬───────────┘
                                   │
                                   │
╔══════════════════════════════════▼═══════════════════════════════╗
║                    USAGE STORE (Map-based)                        ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  Map<providerId, UsageStoreEntry>                                ║
║                                                                   ║
║  UsageStoreEntry {                                               ║
║    windows: ResolvedUsageWindow[]  ◄─── Array of quota windows  ║
║    updated: number                  ◄─── Last update timestamp   ║
║    fails: number                    ◄─── Consecutive fail count  ║
║    active: boolean                  ◄─── Has authentication?     ║
║  }                                                               ║
║                                                                   ║
║  Example state:                                                   ║
║  {                                                               ║
║    "anthropic": {                                                ║
║      windows: [                                                  ║
║        { id: "5_hour", duration: 18000, used: 13500, ... },     ║
║        { id: "5_day", duration: 432000, used: 194400, ... }     ║
║      ],                                                          ║
║      updated: 1707328500000,                                     ║
║      fails: 0,                                                   ║
║      active: true                                                ║
║    },                                                            ║
║    "copilot": {                                                  ║
║      windows: [                                                  ║
║        { id: "30_day", amount: 300, used: 127, ... }            ║
║      ],                                                          ║
║      updated: 1707328500000,                                     ║
║      fails: 0,                                                   ║
║      active: true                                                ║
║    }                                                             ║
║  }                                                               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
                                   │
                                   │ Context providers query store
                                   │
                                   ▼
╔═══════════════════════════════════════════════════════════════════╗
║              FOOTER CONTEXT PROVIDERS (Consumer Side)             ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  getWindowById(platformId, windowId) → ResolvedUsageWindow       ║
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │                                                          │    ║
║  │  createWindowProgressPercentageProvider(plat, win)      │    ║
║  │    → returns () => window.usedRatio                     │    ║
║  │                                                          │    ║
║  │  createWindowRemainingTimeProvider(plat, win)           │    ║
║  │    → returns () => window.remaining (if duration)       │    ║
║  │                                                          │    ║
║  │  createWindowUsedTimeProvider(plat, win)                │    ║
║  │    → returns () => window.used (if duration)            │    ║
║  │                                                          │    ║
║  │  createWindowTotalTimeProvider(plat, win)               │    ║
║  │    → returns () => window.duration (if duration)        │    ║
║  │                                                          │    ║
║  │  createWindowRemainingAmountProvider(plat, win)         │    ║
║  │    → returns () => window.remaining (if amount)         │    ║
║  │                                                          │    ║
║  │  createWindowUsedAmountProvider(plat, win)              │    ║
║  │    → returns () => window.used (if amount)              │    ║
║  │                                                          │    ║
║  │  createWindowTotalAmountProvider(plat, win)             │    ║
║  │    → returns () => window.amount (if amount)            │    ║
║  │                                                          │    ║
║  │  createWindowQuotaUsedPercentageProvider(plat, win)     │    ║
║  │    → returns () => window.usedRatio                     │    ║
║  │                                                          │    ║
║  │  createWindowQuotaRemainingPercentageProvider(plat,win) │    ║
║  │    → returns () => window.remainingRatio                │    ║
║  │                                                          │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
║  ⚠️ NOTE: createPlatformContextProviders() is currently empty!   ║
║  No providers are actually being created or registered.          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
                                   │
                                   │ Used by footer widgets
                                   ▼
                          ┌────────────────┐
                          │ Footer Display │
                          │ (Not shown)    │
                          └────────────────┘
```

## Critical Issues Identified

### 1. ⚠️ CRITICAL BUG: Snapshot Processing Not Implemented

**Location**: `store.ts` line ~102-105

```typescript
const resolved: ResolvedUsageWindow[] = [];
for (const snapshot of snapshots) {
  //TODO: update store with usage data
}
```

**Issue**: The loop iterates over snapshots but does NOTHING with them. The `resolveUsageWindow()` function exists but is never called.

**Fix Needed**:
```typescript
const resolved: ResolvedUsageWindow[] = [];
for (const snapshot of snapshots) {
  const quota = provider.quotas.find(q => q.id === snapshot.id);
  if (!quota) continue;
  
  resolved.push(resolveUsageWindow(quota, snapshot));
}
nextEntry.windows = resolved;
```

### 2. ⚠️ Context Providers Never Instantiated

**Location**: `context/platforms.ts` line ~101

```typescript
export function createPlatformContextProviders(
  platformId: string,
): Array<{ name: string; provider: FooterContextProvider }> {
  const providers: Array<{ name: string; provider: FooterContextProvider }> = [];
  
  return providers;  // ← Returns empty array!
}
```

**Issue**: Function has all the helper functions but never uses them. No providers are created or registered.

**Fix Needed**: Implementation that discovers quotas and creates appropriate providers.

### 3. ⚠️ QuotaDefinition Type Limitations

The union type approach works but has limitations for expressing complex quota behaviors.

## Proposed QuotaDefinition Enhancements

### Current Type Issues

```typescript
type QuotaDefinition = QuotaDurationDefinition | QuotaAmountDefinition;
```

**Problems**:
1. Cannot distinguish rolling vs fixed-boundary windows
2. No way to express reset behavior (session-based vs calendar)
3. Cannot represent model multipliers (Copilot's 0×, 1×, 4×)
4. No aggregation strategy for multi-model quotas
5. Cannot express percentage-only quotas (unknown totals like Anthropic)

### Proposed Enhanced Types

```typescript
// Base types for discrete concepts
export type QuotaWindowType = "rolling" | "fixed" | "session";
export type QuotaResetBehavior = "continuous" | "calendar" | "session-start";
export type QuotaAggregationStrategy = "min" | "max" | "sum" | "individual";

// Core quota types (keep existing)
export type QuotaDurationDefinition = {
  id: string;
  duration: number;          // Required for duration-based
  modelIds?: string[];
  windowType?: QuotaWindowType;     // NEW
  resetBehavior?: QuotaResetBehavior;  // NEW
};

export type QuotaAmountDefinition = {
  id: string;
  amount: number;            // Required for amount-based
  modelIds?: string[];
  windowType?: QuotaWindowType;     // NEW
  resetBehavior?: QuotaResetBehavior;  // NEW
};

// NEW: For percentage-only quotas where total is unknown
export type QuotaPercentageDefinition = {
  id: string;
  percentageOnly: true;      // Discriminator
  modelIds?: string[];
  windowType?: QuotaWindowType;
  resetBehavior?: QuotaResetBehavior;
};

// NEW: For request-based with model multipliers
export type QuotaMultiplierDefinition = {
  id: string;
  baseAmount: number;        // Base quota
  multipliers: Record<string, number>;  // modelId → multiplier
  windowType?: QuotaWindowType;
  resetBehavior?: QuotaResetBehavior;
};

// NEW: For per-model independent quotas
export type QuotaPerModelDefinition = {
  id: string;
  perModel: Record<string, { amount?: number; duration?: number }>;
  aggregationStrategy?: QuotaAggregationStrategy;
  windowType?: QuotaWindowType;
  resetBehavior?: QuotaResetBehavior;
};

// Enhanced union type
export type QuotaDefinition =
  | QuotaDurationDefinition
  | QuotaAmountDefinition
  | QuotaPercentageDefinition
  | QuotaMultiplierDefinition
  | QuotaPerModelDefinition;
```

### Type Guards for Discriminated Union

```typescript
export function isQuotaDuration(q: QuotaDefinition): q is QuotaDurationDefinition {
  return 'duration' in q && q.duration !== undefined;
}

export function isQuotaAmount(q: QuotaDefinition): q is QuotaAmountDefinition {
  return 'amount' in q && q.amount !== undefined && !('multipliers' in q);
}

export function isQuotaPercentage(q: QuotaDefinition): q is QuotaPercentageDefinition {
  return 'percentageOnly' in q && q.percentageOnly === true;
}

export function isQuotaMultiplier(q: QuotaDefinition): q is QuotaMultiplierDefinition {
  return 'multipliers' in q && 'baseAmount' in q;
}

export function isQuotaPerModel(q: QuotaDefinition): q is QuotaPerModelDefinition {
  return 'perModel' in q;
}
```

## Usage Examples with Enhanced Types

### Anthropic (Percentage-only, Rolling)
```typescript
quotas: [
  {
    id: "5_hour",
    percentageOnly: true,
    windowType: "session",
    resetBehavior: "session-start"
  },
  {
    id: "5_day",
    percentageOnly: true,
    windowType: "rolling",
    resetBehavior: "continuous"
  }
]
```

### Copilot (Multiplier-based, Fixed Monthly)
```typescript
quotas: [
  {
    id: "30_day",
    baseAmount: 300,
    multipliers: {
      "gpt-4o": 0,
      "gpt-4.1": 0,
      "gpt-5-mini": 0,
      "standard": 1,
      "spark": 4
    },
    windowType: "fixed",
    resetBehavior: "calendar"
  }
]
```

### Antigravity (Per-model independent)
```typescript
quotas: [
  {
    id: "google-models",
    perModel: {
      "gemini-3-pro": { amount: 100 },
      "gemini-3-flash": { amount: 100 }
    },
    aggregationStrategy: "individual",
    windowType: "rolling",
    resetBehavior: "continuous"
  }
]
```

### Codex (Duration-based, Rolling)
```typescript
quotas: [
  {
    id: "primary",
    duration: TimeFrame.FiveHour,
    windowType: "rolling",
    resetBehavior: "continuous"
  },
  {
    id: "secondary",
    duration: TimeFrame.SevenDay,
    windowType: "rolling",
    resetBehavior: "continuous"
  }
]
```

## Implementation Priority

### P0 - Critical Bugs (Must Fix)
1. ✅ Fix snapshot processing loop in `store.ts`
2. ✅ Implement `createPlatformContextProviders()` in `context/platforms.ts`

### P1 - Type System Enhancements (Important)
3. Add `QuotaPercentageDefinition` for Anthropic-style quotas
4. Add `QuotaMultiplierDefinition` for Copilot-style quotas
5. Add type guards for discriminated union
6. Update `resolveUsageWindow()` to handle new types

### P2 - Metadata Improvements (Nice to Have)
7. Add `windowType` and `resetBehavior` metadata
8. Add `QuotaPerModelDefinition` for Antigravity
9. Enhanced error handling with categorization
10. Add reset timestamp tracking for fixed windows

## Data Flow Summary

1. **Registration Phase**: Providers register with `UsageTracker`, defining quotas
2. **Polling Phase**: Timer triggers `updateAll()` every 60s
3. **Fetch Phase**: For each provider, check auth and fetch usage snapshots
4. **Resolution Phase**: ⚠️ BROKEN - should resolve snapshots to windows
5. **Storage Phase**: Store resolved windows in Map by provider ID
6. **Query Phase**: Context providers query store for specific windows
7. **Display Phase**: Footer widgets consume context providers

## Notes

- The system is **pull-based**: Footer queries the store, store doesn't push updates
- Updates are **throttled**: Failed providers back off exponentially (up to 8× interval)
- Store is **persistent**: Lives across extension lifecycle until stopped
- Listeners are **synchronous**: Notified after ALL providers update
- Resolution is **lenient**: Falls back through multiple calculation paths

## Related Files

- `types.ts` - Type definitions
- `store.ts` - Core tracker implementation
- `numbers.ts` - Helper functions and constants
- `auth.ts` - Authentication checking
- `strategies/*.ts` - Provider implementations
- `cmds/usage-store.ts` - Debug command for inspecting store
- `context/platforms.ts` - Context provider factories
