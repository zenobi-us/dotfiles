---
id: 1ae9bcdf
title: Platform Tracker - Phase 3 - Store Update Logic
created_at: 2026-02-08T01:45:00+10:30
updated_at: 2026-02-08T01:45:00+10:30
status: completed
epic_id: fc52bd74
phase_id: null
depends_on: [task-fcc4dbe3]
assigned_to: null
tags: [platform-tracker, store, critical-bug-fix]
---

# Task: Fix Store Update Logic for Per-Model Storage

## Objective

Fix the critical bug where snapshot processing loop does nothing, and update store logic to use per-model compound keys.

## Related Research

- **Primary**: research-9056b4da-platform-usage-tracking.md (Section: "Store Implementation")
- **Bug**: knowledge-platform-tracker-flow.md (Critical Bug section)

## Prerequisites

- ✅ Task 845f3788 (Core Type Refactor) must be complete
- ✅ Task fcc4dbe3 (Provider Updates) must be complete

## Steps

### 1. Fix CRITICAL BUG: Empty Snapshot Processing Loop

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/store.ts`

**Location**: Inside `update()` method, around line 102-105

**Current Code (BROKEN)**:
```typescript
const resolved: ResolvedUsageWindow[] = [];
for (const snapshot of snapshots) {
  //TODO: update store with usage data
}
nextEntry.windows = resolved;  // Empty array!
```

**Fixed Code**:
```typescript
// Process each snapshot into per-model storage
for (const snapshot of snapshots) {
  const storageKey = makeStorageKey(providerId, snapshot.modelId);
  
  // Find matching quota definition
  const quota = provider.quotas.find(q => q.id === snapshot.id);
  if (!quota) continue;
  
  // Resolve snapshot to window
  const resolved = resolveUsageWindow(quota, snapshot);
  
  // Update or create entry
  const entry: UsageStoreEntry = {
    providerId,
    modelId: snapshot.modelId,
    windows: [resolved],
    updated: Date.now(),
    fails: 0,
    active: true
  };
  
  this.store.set(storageKey, entry);
}
```

### 2. Update Store Cleanup Logic

When provider is removed or has no auth, clean up all its entries:

```typescript
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
  
  // ... fetchUsage and process snapshots ...
}
```

### 3. Update Error Handling

When fetch fails, increment fails for all models:

```typescript
try {
  const snapshots = await provider.fetchUsage(currentCtx);
  
  // ... process snapshots as above ...
  
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
```

### 4. Update Backoff Logic

Backoff should check per-model or per-provider. Current logic checks per-provider which is correct:

```typescript
const previous = this.store.get(storageKey);  // Get specific model entry
const now = Date.now();
const failures = previous?.fails ?? 0;
const lastUpdate = previous?.updated ?? 0;
const backoffMultiplier = Math.min(
  1 + failures,
  settings.maxBackoffMultiplier
);

if (lastUpdate + settings.intervalMs * backoffMultiplier > now) {
  return;  // Throttled
}
```

However, this needs update to work per-provider:

```typescript
// Check ANY entry for this provider to determine backoff
let shouldSkip = false;
for (const [key, entry] of this.store) {
  if (key.startsWith(`${providerId}/`)) {
    const failures = entry.fails ?? 0;
    const lastUpdate = entry.updated ?? 0;
    const backoffMultiplier = Math.min(1 + failures, settings.maxBackoffMultiplier);
    
    if (lastUpdate + settings.intervalMs * backoffMultiplier > now) {
      shouldSkip = true;
      break;
    }
  }
}

if (shouldSkip) return;
```

### 5. Import makeStorageKey Helper

At top of store.ts:

```typescript
import {
  makeStorageKey,
  parseStorageKey,
  // ... other imports
} from "./types.ts";
```

### 6. Update resolveUsageWindow Return

Ensure resolveUsageWindow includes modelId:

```typescript
function resolveUsageWindow(
  quota: QuotaDefinition,
  snapshot: UsageSnapshot,
): ResolvedUsageWindow {
  // ... existing calculation logic ...
  
  return {
    id: quota.id,
    modelId: snapshot.modelId,  // Must include this
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
- ✅ Snapshot processing loop actually processes snapshots
- ✅ Store uses compound keys (`"provider/model"`)
- ✅ Entries have providerId and modelId fields
- ✅ Auth failures mark all provider models inactive
- ✅ Fetch errors increment fails for all provider models
- ✅ Backoff works per-provider (checks any model entry)
- ✅ resolveUsageWindow includes modelId

## Verification

```bash
# Run the tracker and check store structure
npm run dev  # or however you run the extension

# In extension, run usage-store command
# Should see entries like:
#   copilot/gpt-4o
#   copilot/spark
#   anthropic/default
# NOT just:
#   copilot
#   anthropic

# Check store entries have identity
# Each entry should have providerId and modelId fields
```

## Testing Strategy

1. **Test single-model provider** (Anthropic):
   - Verify one entry: `"anthropic/default"`
   - Entry has `providerId: "anthropic"`, `modelId: "default"`

2. **Test multi-model provider** (Copilot):
   - Verify 5 entries: `"copilot/gpt-4o"`, `"copilot/spark"`, etc.
   - Each entry has correct modelId
   - Different multipliers in metadata

3. **Test per-model provider** (Antigravity):
   - Verify N entries (one per API model)
   - Each entry has unique modelId
   - Independent quota tracking

4. **Test error handling**:
   - Simulate auth failure → all entries marked inactive
   - Simulate fetch failure → fails increment for all models

## Notes

- This fixes the most critical bug: empty snapshot processing
- Store structure fundamentally changes from provider-keyed to provider/model-keyed
- All query functions must be updated in next phase
- This is a **breaking change** for any code reading the store

## Lessons Learned

*To be filled after completion*
