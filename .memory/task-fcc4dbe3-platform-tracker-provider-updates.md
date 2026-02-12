---
id: fcc4dbe3
title: Platform Tracker - Phase 2 - Provider Strategy Updates
created_at: 2026-02-08T01:45:00+10:30
updated_at: 2026-02-08T01:45:00+10:30
status: completed
epic_id: fc52bd74
phase_id: null
depends_on: [task-845f3788]
assigned_to: null
tags: [platform-tracker, providers, per-model-storage]
---

# Task: Update Provider Strategies for Per-Model Storage

## Objective

Update all provider strategy implementations to return `modelId` in snapshots and remove runtime type guards (now handled by interface default).

## Related Research

- **Primary**: research-9056b4da-platform-usage-tracking.md (Section: "Provider Implementation Patterns")
- **Examples**: Patterns 1-3 for single-model, multi-model, per-model independent

## Prerequisites

- ✅ Task 845f3788 (Core Type Refactor) must be complete

## Steps

### 1. Update Anthropic Provider

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/strategies/anthropic.ts`

**Changes**:
- Add `modelId: "default"` to all snapshots
- Remove `isMetadata` if present
- Update type definition

```typescript
type AnthropicMeta = {
  sessionStart?: number;
  windowType: "rolling" | "session";
  utilizationSource: "five_hour" | "five_day" | "seven_day";
};

usageTracker.registerProvider<AnthropicMeta>({
  id: "anthropic",
  label: "Anthropic",
  models: ["default"],
  quotas: [
    { id: "5_hour", percentageOnly: true },
    { id: "5_day", percentageOnly: true }
  ],
  // ...
  fetchUsage: async () => {
    // ... fetch logic ...
    
    windows.push({
      id: "5_hour",
      modelId: "default",  // ADD THIS
      usedRatio: data.five_hour.utilization / 100,
      remainingRatio: 1 - (data.five_hour.utilization / 100),
      meta: {
        windowType: "session",
        utilizationSource: "five_hour"
      }
    });
    // Repeat for all windows
  }
  // getMetadata() comes from interface default
  // Remove any isMetadata method
});
```

### 2. Update Codex Provider

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/strategies/codex.ts`

**Changes**:
- Add `modelId: "default"` to all snapshots
- Remove `isMetadata` if present

```typescript
type CodexMeta = {
  windowType: "rolling";
  windowSeconds: number;
};

// In fetchUsage:
windows.push({
  id: "primary",
  modelId: "default",  // ADD THIS
  usedRatio,
  remainingRatio: 1 - usedRatio,
  meta: {
    windowType: "rolling",
    windowSeconds: primary.limit_window_seconds ?? 18000
  }
});
```

### 3. Update Copilot Provider

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/strategies/copilot.ts`

**Changes**:
- Return **multiple snapshots** (one per model)
- Include model multiplier in metadata
- Remove `isMetadata` if present

```typescript
type CopilotMeta = {
  entitlement: number;
  resetTime: number;
  resetType: "calendar";
  modelMultiplier: number;
};

usageTracker.registerProvider<CopilotMeta>({
  id: "copilot",
  label: "Copilot",
  models: ["gpt-4o", "gpt-4.1", "gpt-5-mini", "standard", "spark"],
  quotas: [{ id: "30_day", amount: 300 }],
  
  fetchUsage: async () => {
    // ... fetch entitlement and remaining ...
    
    const multipliers: Record<string, number> = {
      "gpt-4o": 0,
      "gpt-4.1": 0,
      "gpt-5-mini": 0,
      "standard": 1,
      "spark": 4
    };
    
    const snapshots: UsageSnapshot<CopilotMeta>[] = [];
    
    for (const [modelId, multiplier] of Object.entries(multipliers)) {
      const effectiveRemaining = multiplier === 0 
        ? Infinity 
        : remaining / multiplier;
      
      snapshots.push({
        id: "30_day",
        modelId,  // One snapshot per model
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
  }
});
```

### 4. Update Antigravity Provider

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/strategies/antigravity.ts`

**Changes**:
- Return snapshots per model from API
- Normalize model IDs
- Include per-model metadata
- Remove `isMetadata` if present

```typescript
type AntigravityMeta = {
  modelName: string;
  limit?: string;
  quotaFraction: number;
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
  
  fetchUsage: async () => {
    // ... fetch models ...
    
    const snapshots: UsageSnapshot<AntigravityMeta>[] = [];
    
    for (const [modelId, model] of Object.entries(data.models ?? {})) {
      const fraction = Math.max(0, Math.min(1, 
        model.quotaInfo?.remainingFraction ?? 1
      ));
      
      const normalizedId = normalizeModelId(modelId);
      
      snapshots.push({
        id: "quota",
        modelId: normalizedId,  // Per-model snapshots
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
  }
});

function normalizeModelId(fullId: string): string {
  return fullId.toLowerCase()
    .replace(/-\d{8}$/, "")
    .replace(/-\d{3}$/, "");
}
```

### 5. Update Gemini Provider

**File**: `devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/strategies/gemini.ts`

**Changes**:
- Similar to Antigravity, per-model snapshots
- Remove `isMetadata` if present

```typescript
type GeminiMeta = {
  modelId: string;
  bucketIndex: number;
};

// In fetchUsage:
for (const [index, bucket] of (data.buckets ?? []).entries()) {
  const model = (bucket.modelId ?? "").toLowerCase();
  const fraction = Math.max(0, Math.min(1, bucket.remainingFraction ?? 1));
  
  let normalizedId = "unknown";
  if (model.includes("pro")) normalizedId = "pro";
  if (model.includes("flash")) normalizedId = "flash";
  
  windows.push({
    id: normalizedId,
    modelId: normalizedId,  // ADD THIS
    remainingRatio: fraction,
    meta: {
      modelId: bucket.modelId ?? "",
      bucketIndex: index
    }
  });
}
```

### 6. Update Kiro and Z.ai Providers (if present)

Apply similar pattern:
- Add `modelId: "default"` for single-model providers
- Remove any `isMetadata` methods

## Expected Outcome

After completion:
- ✅ All providers return `modelId` in snapshots
- ✅ Copilot returns 5 snapshots (one per model)
- ✅ Antigravity returns N snapshots (one per API model)
- ✅ No providers have `isMetadata` methods
- ✅ All providers define their metadata type
- ✅ All providers use `getMetadata()` from interface default

## Verification

```bash
# Check all strategies return modelId
cd devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/strategies
grep -r "modelId:" *.ts

# Should find modelId in all snapshots

# Check no isMetadata methods remain
grep -r "isMetadata" *.ts
# Should find nothing (or only validateMetadata if debugging)

# Verify types compile
npx tsc --noEmit strategies/*.ts
```

## Notes

- Copilot is the most complex: one API call → multiple snapshots
- Antigravity: multiple API models → multiple snapshots
- Anthropic/Codex: single model → single snapshot with "default"
- Test each provider individually before moving to next

## Lessons Learned

*To be filled after completion*
