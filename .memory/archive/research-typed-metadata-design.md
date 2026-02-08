---
id: typed-metadata-design
title: Strongly-Typed Metadata Design via Generics
created_at: 2026-02-07T23:58:00+10:30
updated_at: 2026-02-07T23:58:00+10:30
status: proposed
epic_id: fc52bd74
phase_id: null
tags: [typescript, type-safety, generics, metadata, architecture]
---

# Strongly-Typed Metadata Design via Generics

## Problem Statement

Current design uses `meta?: Record<string, unknown>` which loses type safety. We want:
1. Internal storage to remain flexible (`Record<string, unknown>`)
2. Provider strategies to have strongly-typed metadata access
3. Type safety when creating and consuming metadata

## Solution: Generic Provider Strategy

### Core Insight

Each provider knows its own metadata structure. Use generics to parameterize the `ProviderStrategy` interface so each provider can declare its metadata type.

### Type Definitions

```typescript
// Base types remain flexible for storage
export type QuotaDefinition = QuotaDurationDefinition | QuotaAmountDefinition | ...;

export type UsageSnapshot<TMeta = Record<string, unknown>> = {
  id: string;
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  duration?: number;
  amountTotal?: number;
  meta?: TMeta;  // Generic metadata type
};

export type ResolvedUsageWindow<TMeta = Record<string, unknown>> = {
  id: string;
  duration?: number;
  amount?: number;
  remaining: number;
  used: number;
  remainingRatio: number;
  usedRatio: number;
  meta?: TMeta;  // Generic metadata type
  timeRemaining?: number;
  amountRemaining?: number;
};

// Provider strategy is generic over metadata type
export interface ProviderStrategy<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  quotas: QuotaDefinition[];
  hasAuthentication: (ctx: ExtensionContext) => Promise<boolean> | boolean;
  fetchUsage: (ctx: ExtensionContext) => Promise<UsageSnapshot<TMeta>[]>;
}

// Storage types remain untyped (flexibility)
export type UsageStoreEntry = {
  windows: ResolvedUsageWindow<Record<string, unknown>>[];
  updated?: number;
  fails?: number;
  active: boolean;
};

export type UsageStore = Map<string, UsageStoreEntry>;

// Tracker remains untyped at storage level
export interface UsageTracker {
  store: UsageStore;
  providers: Map<string, ProviderStrategy<any>>;  // Allow any metadata type
  registerProvider<TMeta>(provider: ProviderStrategy<TMeta>): void;
  update: (providerId: string) => Promise<void>;
  updateAll: () => Promise<void>;
}
```

### Provider-Specific Metadata Types

Each provider defines its own metadata structure:

```typescript
// copilot.ts
type CopilotMeta = {
  entitlement: number;        // Total quota allocated
  resetTime: number;          // Unix timestamp of next reset
  resetType: "calendar";      // Fixed calendar reset
  modelMultipliers?: {
    [modelId: string]: number;  // Model-specific cost multipliers
  };
};

// Register with strong typing
usageTracker.registerProvider<CopilotMeta>({
  id: "copilot",
  label: "Copilot",
  quotas: [{ id: "30_day", amount: 300 }],
  hasAuthentication: () => hasAuthKey("github-copilot"),
  
  fetchUsage: async (): Promise<UsageSnapshot<CopilotMeta>[]> => {
    const auth = readPiAuthJson();
    const token = auth["github-copilot"]?.refresh;
    if (!token) return [];

    const res = await fetch("https://api.github.com/copilot_internal/user", {
      headers: { /* ... */ },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    
    const data = await res.json();
    const premium = data.quota_snapshots?.premium_interactions;
    if (!premium) return [];

    const entitlement = Math.max(1, premium.entitlement ?? 0);
    const remaining = Math.max(0, premium.remaining ?? 0);

    // Calculate next reset (1st of next month at midnight UTC)
    const now = new Date();
    const nextMonth = new Date(Date.UTC(
      now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(),
      now.getUTCMonth() === 11 ? 0 : now.getUTCMonth() + 1,
      1, 0, 0, 0
    ));

    return [{
      id: "30_day",
      remaining,
      used: entitlement - remaining,
      remainingRatio: remaining / entitlement,
      usedRatio: (entitlement - remaining) / entitlement,
      meta: {
        entitlement,
        resetTime: nextMonth.getTime() / 1000,
        resetType: "calendar",
        modelMultipliers: {
          "gpt-4o": 0,
          "gpt-4.1": 0,
          "gpt-5-mini": 0,
          "standard": 1,
          "spark": 4
        }
      }
    }];
  }
});
```

```typescript
// anthropic.ts
type AnthropicMeta = {
  sessionStart?: number;      // When current session began
  windowType: "rolling" | "session";
  utilizationSource: "five_hour" | "five_day" | "seven_day";
};

usageTracker.registerProvider<AnthropicMeta>({
  id: "anthropic",
  label: "Anthropic",
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
      headers: { /* ... */ },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const data = await res.json();
    const windows: UsageSnapshot<AnthropicMeta>[] = [];

    if (data.five_hour?.utilization !== undefined) {
      windows.push({
        id: "5_hour",
        usedRatio: data.five_hour.utilization / 100,
        remainingRatio: 1 - (data.five_hour.utilization / 100),
        meta: {
          windowType: "session",
          utilizationSource: "five_hour"
        }
      });
    }

    const dayUtilization = data.five_day?.utilization ?? data.seven_day?.utilization;
    if (dayUtilization !== undefined) {
      windows.push({
        id: "5_day",
        usedRatio: dayUtilization / 100,
        remainingRatio: 1 - (dayUtilization / 100),
        meta: {
          windowType: "rolling",
          utilizationSource: data.five_day ? "five_day" : "seven_day"
        }
      });
    }

    return windows;
  }
});
```

```typescript
// antigravity.ts
type AntigravityMeta = {
  modelQuotas: {
    [modelId: string]: {
      remainingFraction: number;
      limit?: string;  // API sometimes returns limit descriptors like "high"
    };
  };
  aggregationStrategy: "min";  // Takes minimum across all models
};

usageTracker.registerProvider<AntigravityMeta>({
  id: "antigravity",
  label: "Google Antigravity",
  quotas: [
    { id: "pro", perModel: { "gemini-3-pro": { amount: 100 } } },
    { id: "flash", perModel: { "gemini-3-flash": { amount: 100 } } }
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
        headers: { /* ... */ },
        body: "{}",
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      }
    );

    const data = await res.json();
    const proFractions: number[] = [];
    const flashFractions: number[] = [];
    const modelQuotas: Record<string, any> = {};

    for (const [modelId, model] of Object.entries(data.models ?? {})) {
      const name = modelId.toLowerCase();
      const fraction = Math.max(0, Math.min(1, model.quotaInfo?.remainingFraction ?? 1));
      
      modelQuotas[modelId] = {
        remainingFraction: fraction,
        limit: model.quotaInfo?.limit
      };

      if (name.includes("pro")) proFractions.push(fraction);
      if (name.includes("flash")) flashFractions.push(fraction);
    }

    const windows: UsageSnapshot<AntigravityMeta>[] = [];
    
    if (proFractions.length > 0) {
      windows.push({
        id: "pro",
        remainingRatio: Math.min(...proFractions),
        meta: {
          modelQuotas,
          aggregationStrategy: "min"
        }
      });
    }

    if (flashFractions.length > 0) {
      windows.push({
        id: "flash",
        remainingRatio: Math.min(...flashFractions),
        meta: {
          modelQuotas,
          aggregationStrategy: "min"
        }
      });
    }

    return windows;
  }
});
```

### Type-Safe Metadata Access

When consuming metadata, use type guards or assertions:

```typescript
// Type guard for specific provider
function isCopilotMeta(meta: unknown): meta is CopilotMeta {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "resetType" in meta &&
    meta.resetType === "calendar"
  );
}

// Context provider that accesses typed metadata
function createCopilotResetTimeProvider(): FooterContextProvider {
  return () => {
    const entry = usageTracker.store.get("copilot");
    if (!entry?.windows?.length) return undefined;
    
    const window = entry.windows[0];
    if (!window.meta) return undefined;
    
    // Type guard ensures type safety
    if (isCopilotMeta(window.meta)) {
      return window.meta.resetTime;  // Fully typed!
    }
    
    return undefined;
  };
}

// Or use typed helper on provider
class CopilotProvider implements ProviderStrategy<CopilotMeta> {
  id = "copilot";
  label = "Copilot";
  quotas = [{ id: "30_day", amount: 300 }];
  
  hasAuthentication = () => hasAuthKey("github-copilot");
  fetchUsage = async (): Promise<UsageSnapshot<CopilotMeta>[]> => { /* ... */ };
  
  // Type-safe metadata accessor
  getResetTime(): number | undefined {
    const entry = usageTracker.store.get(this.id);
    const window = entry?.windows?.[0];
    return window?.meta?.resetTime;  // Fully typed!
  }
  
  getModelMultiplier(modelId: string): number {
    const entry = usageTracker.store.get(this.id);
    const window = entry?.windows?.[0];
    return window?.meta?.modelMultipliers?.[modelId] ?? 1;
  }
}
```

### Benefits

1. **Type Safety**: Each provider's metadata is strongly typed
2. **Flexibility**: Internal storage remains `Record<string, unknown>`
3. **Discoverability**: IDE autocomplete for metadata fields
4. **Validation**: Type guards ensure safe access
5. **Documentation**: Metadata types serve as documentation

### Migration Path

1. Add generic parameter to `ProviderStrategy<TMeta>`
2. Update each strategy file to define its metadata type
3. Update `fetchUsage` return type to use the metadata type
4. Create type guards for runtime metadata access
5. Update context providers to use type guards

### Example: Full Type Flow

```typescript
// 1. Define metadata type
type CopilotMeta = {
  entitlement: number;
  resetTime: number;
  resetType: "calendar";
};

// 2. Provider returns strongly-typed snapshots
const provider: ProviderStrategy<CopilotMeta> = {
  fetchUsage: async () => {
    return [{
      id: "30_day",
      remaining: 173,
      meta: {
        entitlement: 300,
        resetTime: 1709251200,
        resetType: "calendar"  // Type-checked!
      }
    }];
  }
};

// 3. Storage converts to untyped (flexibility)
const stored: UsageStoreEntry = {
  windows: [{
    id: "30_day",
    remaining: 173,
    meta: { /* now Record<string, unknown> */ }
  }]
};

// 4. Consumer uses type guard for safety
function getResetTime(providerId: string): number | undefined {
  const entry = usageTracker.store.get(providerId);
  const meta = entry?.windows?.[0]?.meta;
  
  if (isCopilotMeta(meta)) {
    return meta.resetTime;  // Type-safe!
  }
  
  return undefined;
}
```

## Implementation Notes

- Generic parameter defaults to `Record<string, unknown>` for backwards compatibility
- Internal storage intentionally loses type information for flexibility
- Type safety recovered through type guards at consumption points
- Each provider defines its own metadata contract
- Metadata types are co-located with provider implementation

## Related Files

- `types.ts` - Add generic parameter to `ProviderStrategy` and `UsageSnapshot`
- `strategies/*.ts` - Define provider-specific metadata types
- `context/platforms.ts` - Use type guards when accessing metadata
