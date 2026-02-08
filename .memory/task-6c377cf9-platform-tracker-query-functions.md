---
id: 6c377cf9
title: Platform Tracker - Phase 4 - Query Functions and Context Providers
created_at: 2026-02-08T01:45:00+10:30
updated_at: 2026-02-08T01:45:00+10:30
status: in-progress
epic_id: fc52bd74
phase_id: null
depends_on: [task-1ae9bcdf]
assigned_to: null
tags: [platform-tracker, queries, context-providers]
---

# Task: Update Query Functions and Context Providers

## Objective

Update all query functions to use compound keys and per-model access patterns. Fix the empty `createPlatformContextProviders()` function.

## Related Research

- **Primary**: research-9056b4da-platform-usage-tracking.md (Sections: "Query Functions", "Context Providers")

## Prerequisites

- ✅ Task 845f3788 (Core Type Refactor) must be complete
- ✅ Task fcc4dbe3 (Provider Updates) must be complete
- ✅ Task 1ae9bcdf (Store Logic) must be complete

## Steps

### 1. Update Query Functions in context/platforms.ts

**File**: `devtools/files/pi/agent/extensions/pi-footer/context/platforms.ts`

**Old Function (BROKEN)**:
```typescript
function getWindowById(
  platformId: string,
  windowId: string
): ResolvedUsageWindow | undefined {
  const entry = usageTracker.store.get(platformId);  // Wrong key
  if (!entry?.windows?.length) return undefined;
  return entry.windows.find((window) => window.id === windowId);
}
```

**New Function**:
```typescript
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
```

### 2. Add Helper Query Functions

Add these new helper functions:

```typescript
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

// Get all entries for a provider
function getProviderEntries(providerId: string): UsageStoreEntry[] {
  const entries: UsageStoreEntry[] = [];
  
  for (const [key, entry] of usageTracker.store) {
    if (key.startsWith(`${providerId}/`)) {
      entries.push(entry);
    }
  }
  
  return entries;
}

// Type-safe metadata accessor
function getProviderMetadata<TMeta>(
  provider: ProviderStrategy<TMeta>,
  providerId: string,
  modelId: string
): TMeta | undefined {
  const key = makeStorageKey(providerId, modelId);
  const entry = usageTracker.store.get(key);
  
  if (!entry) return undefined;
  
  return provider.getMetadata(entry);
}
```

### 3. Update All Context Provider Functions

Update signatures to accept modelId:

```typescript
function createWindowProgressPercentageProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window) return undefined;
    return window.usedRatio;
  };
}

function createWindowRemainingTimeProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.remaining);
  };
}

function createWindowUsedTimeProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.used);
  };
}

function createWindowTotalTimeProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.duration) return undefined;
    return Math.max(0, window.duration);
  };
}

function createWindowRemainingAmountProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.remaining);
  };
}

function createWindowUsedAmountProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.used);
  };
}

function createWindowTotalAmountProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window?.amount) return undefined;
    return Math.max(0, window.amount);
  };
}

function createWindowQuotaUsedPercentageProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window) return undefined;
    return window.usedRatio;
  };
}

function createWindowQuotaRemainingPercentageProvider(
  providerId: string,
  modelId: string,
  windowId: string
): FooterContextProvider {
  return () => {
    const window = getWindowByProviderModel(providerId, modelId, windowId);
    if (!window) return undefined;
    return window.remainingRatio;
  };
}
```

### 4. Fix CRITICAL BUG: Empty createPlatformContextProviders

**Current Code (BROKEN)**:
```typescript
export function createPlatformContextProviders(
  platformId: string
): Array<{ name: string; provider: FooterContextProvider }> {
  const providers = [];
  return providers;  // Empty!
}
```

**Fixed Code** (example implementation):
```typescript
export function createPlatformContextProviders(
  platformId: string
): Array<{ name: string; provider: FooterContextProvider }> {
  const providers: Array<{ name: string; provider: FooterContextProvider }> = [];
  
  // Get all models for this platform
  const models = getProviderModels(platformId);
  
  // Get provider to discover quotas
  const provider = usageTracker.providers.get(platformId);
  if (!provider) return providers;
  
  // Create providers for each model × quota combination
  for (const modelId of models) {
    for (const quota of provider.quotas) {
      const prefix = `${platformId}-${modelId}-${quota.id}`;
      
      // Progress percentage
      providers.push({
        name: `${prefix}-progress`,
        provider: createWindowProgressPercentageProvider(platformId, modelId, quota.id)
      });
      
      // Remaining percentage
      providers.push({
        name: `${prefix}-remaining-percent`,
        provider: createWindowQuotaRemainingPercentageProvider(platformId, modelId, quota.id)
      });
      
      // Time-based providers (if duration quota)
      if ('duration' in quota && quota.duration) {
        providers.push({
          name: `${prefix}-remaining-time`,
          provider: createWindowRemainingTimeProvider(platformId, modelId, quota.id)
        });
        
        providers.push({
          name: `${prefix}-used-time`,
          provider: createWindowUsedTimeProvider(platformId, modelId, quota.id)
        });
      }
      
      // Amount-based providers (if amount quota)
      if ('amount' in quota && quota.amount) {
        providers.push({
          name: `${prefix}-remaining-amount`,
          provider: createWindowRemainingAmountProvider(platformId, modelId, quota.id)
        });
        
        providers.push({
          name: `${prefix}-used-amount`,
          provider: createWindowUsedAmountProvider(platformId, modelId, quota.id)
        });
      }
    }
  }
  
  return providers;
}
```

### 5. Add Convenience Functions for Specific Platforms

Create example helper functions:

```typescript
// Example: Copilot Spark model providers
export function createCopilotSparkProviders(): Array<{
  name: string;
  provider: FooterContextProvider;
}> {
  return [
    {
      name: "copilot-spark-used-percent",
      provider: createWindowProgressPercentageProvider("copilot", "spark", "30_day")
    },
    {
      name: "copilot-spark-remaining",
      provider: createWindowRemainingAmountProvider("copilot", "spark", "30_day")
    },
    {
      name: "copilot-spark-total",
      provider: createWindowTotalAmountProvider("copilot", "spark", "30_day")
    }
  ];
}

// Example: Anthropic 5-hour window
export function createAnthropicProviders(): Array<{
  name: string;
  provider: FooterContextProvider;
}> {
  return [
    {
      name: "anthropic-5hour-progress",
      provider: createWindowProgressPercentageProvider("anthropic", "default", "5_hour")
    },
    {
      name: "anthropic-5day-progress",
      provider: createWindowProgressPercentageProvider("anthropic", "default", "5_day")
    }
  ];
}
```

### 6. Add Imports

At top of file:

```typescript
import { makeStorageKey, type ProviderStrategy, type UsageStoreEntry } from "../services/PlatformTracker/types.ts";
```

## Expected Outcome

After completion:
- ✅ All query functions accept `(providerId, modelId, windowId)`
- ✅ Helper functions exist for common query patterns
- ✅ `createPlatformContextProviders()` actually creates providers
- ✅ Convenience functions for specific platforms exist
- ✅ All functions use compound storage keys

## Verification

```bash
# Check function signatures
grep -n "getWindowBy" devtools/files/pi/agent/extensions/pi-footer/context/platforms.ts
# Should see getWindowByProviderModel with 3 parameters

# Check createPlatformContextProviders is not empty
grep -A20 "createPlatformContextProviders" devtools/files/pi/agent/extensions/pi-footer/context/platforms.ts
# Should see provider creation logic, not empty array

# Test with extension
npm run dev
# Check footer displays provider data
```

## Testing Strategy

1. **Test query functions**:
   - Call `getWindowByProviderModel("copilot", "spark", "30_day")`
   - Should return window with modelId="spark"

2. **Test helper queries**:
   - Call `getProviderModels("copilot")`
   - Should return ["gpt-4o", "gpt-4.1", "gpt-5-mini", "standard", "spark"]

3. **Test context providers**:
   - Call `createPlatformContextProviders("copilot")`
   - Should return array with ~25-30 providers (5 models × ~5-6 metrics each)

4. **Test provider invocation**:
   - Call a provider function
   - Should return number or undefined (not error)

## Notes

- This fixes the second critical bug: empty context provider creation
- All queries now require modelId parameter
- Footer widgets must be updated to pass modelId
- Consider caching `getProviderModels()` if called frequently

## Lessons Learned

*To be filled after completion*
