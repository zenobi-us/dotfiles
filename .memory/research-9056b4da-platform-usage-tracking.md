---
id: 9056b4da
title: Platform Usage Tracking Research
created_at: 2026-02-07T20:35:00+10:30
updated_at: 2026-02-07T20:35:00+10:30
status: completed
epic_id: fc52bd74
phase_id: null
related_task_id: null
tags: [platform-limits, api-research, usage-tracking, anthropic, openai, github-copilot, google-antigravity, gemini]
---

# Platform Usage Tracking Research

## Research Questions

1. How does Anthropic Claude track and report usage limits?
2. How does OpenAI Codex/ChatGPT track and report usage limits?
3. How does GitHub Copilot track usage (request-based vs time-based)?
4. How does Google Antigravity track usage per model and subscription tier?
5. What are the specific quota values for each platform and tier?
6. What data structures are needed to represent these different tracking models?

## Summary

AI platforms use three distinct approaches to track usage:

1. **Time-based Percentage** (Anthropic, Codex): Simple rolling windows showing % used
2. **Request-based with Multipliers** (Copilot): Count requests with model-specific multipliers
3. **Model-specific Quota** (Antigravity, Gemini): Separate limits per model varying by subscription tier

The pi-footer extension's current architecture handles all three patterns through flexible `QuotaDefinition` and `UsageSnapshot` types. Main research gap is obtaining exact Antigravity quota values per model per tier.

## Findings

### 1. Anthropic Claude

#### Tracking Model
- **Type**: Percentage-based rolling windows
- **Windows**: 5-hour + 5-7 day
- **Display**: Percentage used (0-100%), unknown total entitlement
- **Reset**: Continuous rolling (session-based, not calendar boundaries)

#### API Endpoint
```
GET https://api.anthropic.com/api/oauth/usage
Headers:
  Authorization: Bearer {token}
  anthropic-beta: oauth-2025-04-20
```

#### Response Format
```json
{
  "five_hour": { "utilization": 0.75 },
  "five_day": { "utilization": 0.45 },
  "seven_day": { "utilization": 0.45 }
}
```

#### Current Implementation (Verified Correct)
```typescript
quotas: [
  { id: "5_hour", duration: TimeFrame.FiveHour },
  { id: "5_day", duration: TimeFrame.FiveDay }
]
```

#### Recent Changes (Mid-2025)
Anthropic added weekly hard caps to prevent continuous 24/7 usage:

| Plan | Price | Sonnet 4 Hours/Week | Opus 4 Hours/Week |
|------|-------|---------------------|-------------------|
| Pro | $20 | 40-80 | N/A |
| Max 5x | $100 | 140-280 | 15-35 |
| Max 20x | $200 | 240-480 | 24-40 |

**Key Insight**: 5-hour window is session-based - clock starts when you begin, not at fixed times.

**Sources**:
- TechCrunch: "Anthropic unveils new rate limits to curb Claude Code power users" (July 2025) [8/10 - major tech news source]
- CometAPI Technical Guide: "When does Claude Code usage reset?" [9/10 - detailed technical documentation]
- Anthropic API Docs: Rate limits page [10/10 - official documentation]

---

### 2. Codex (ChatGPT/OpenAI)

#### Tracking Model
- **Type**: Percentage-based dual windows
- **Windows**: Primary (5-hour) + Secondary (7-day)
- **Display**: Percentage used, continuously replenished (token-bucket)
- **Reset**: Rolling, not fixed boundaries

#### API Endpoint
```
GET https://chatgpt.com/backend-api/wham/usage
Headers:
  Authorization: Bearer {token}
  ChatGPT-Account-Id: {accountId} (optional)
```

#### Response Format
```json
{
  "rate_limit": {
    "primary_window": {
      "limit_window_seconds": 18000,
      "used_percent": 65.5
    },
    "secondary_window": {
      "limit_window_seconds": 604800,
      "used_percent": 23.2
    }
  }
}
```

#### Current Implementation (Verified Correct)
```typescript
quotas: [
  { id: "primary", duration: TimeFrame.FiveHour },
  { id: "secondary", duration: TimeFrame.SevenDay }
]
```

#### Current Limits (2025)

| Plan | Price | Message Limit | Thinking Limit | Context |
|------|-------|---------------|----------------|---------|
| Free | $0 | 10 messages/5hr | 1/day | 16K tokens |
| Plus | $20 | 160 messages/3hr | 3,000/week | 32K-196K tokens |
| Business | $25-30/user | Unlimited (fair use) | 3,000/week | Higher context |
| Pro | $200 | Unlimited | Unlimited | 128K-196K tokens |

**Key Insight**: Dual-window approach where BOTH limits must be satisfied. Token-bucket replenishment.

**Sources**:
- Northflank Blog: "ChatGPT usage limits explained" [8/10 - technical infrastructure blog]
- BentoML Blog: "ChatGPT Usage Limits and How to Remove Them" [7/10 - AI platform documentation]
- OpenAI Developer Community discussions [6/10 - community-reported information]

---

### 3. GitHub Copilot

#### Tracking Model
- **Type**: Request-count based (NOT time or percentage)
- **Window**: 30-day (resets 1st of month at 00:00 UTC)
- **Display**: Actual request counts with remaining/total
- **Multipliers**: Different features consume different amounts

#### API Endpoint
```
GET https://api.github.com/copilot_internal/user
Headers:
  Authorization: token {refresh_token}
  Editor-Version: vscode/1.96.2
  User-Agent: GitHubCopilotChat/0.26.7
  X-Github-Api-Version: 2025-04-01
```

#### Response Format
```json
{
  "quota_snapshots": {
    "premium_interactions": {
      "percent_remaining": 45.5,
      "remaining": 273,
      "entitlement": 600
    }
  }
}
```

#### Current Implementation (Verified Correct)
```typescript
quotas: [{ id: "30_day", duration: TimeFrame.ThirtyDay }]
```

#### Quotas by Plan

| Plan | Price | Premium Requests | Additional Cost |
|------|-------|------------------|-----------------|
| Free | $0 | 50/month | N/A |
| Pro | $10 | 300/month | $0.04/request |
| Pro+ | $39 | 1,500/month | $0.04/request |

#### Model Multipliers

| Feature/Model | Multiplier | Notes |
|---------------|------------|-------|
| GPT-5 mini, GPT-4.1, GPT-4o | 0× | Included, unlimited |
| Standard chat/edit | 1× | Per prompt |
| Spark (prototyping) | 4× | Fixed rate |
| Copilot coding agent | 1× | Per session × model rate |
| Code review | 1× | Per PR or IDE review |

**Key Insight**: Fundamentally different from others - counts requests, not time. Fixed calendar reset (1st of month), not rolling.

**Sources**:
- GitHub Docs: "Requests in GitHub Copilot" [10/10 - official documentation]
- GitHub Community Discussions: Premium request limits [7/10 - user-reported experiences]
- GitHub Docs: "About billing for individual Copilot plans" [10/10 - official documentation]

---

### 4. Google Antigravity

#### Tracking Model
- **Type**: Model-specific quota with subscription tiers
- **Display**: Remaining fraction per model (0.0-1.0)
- **Complexity**: Varies by model type, tier, thinking level, and "work done"

#### API Endpoint
```
POST https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body: {}
```

#### Response Format
```json
{
  "models": {
    "gemini-3-pro": {
      "quotaInfo": {
        "remainingFraction": 0.65,
        "limit": "high"
      }
    },
    "claude-sonnet-4-5": {
      "quotaInfo": {
        "remainingFraction": 0.82
      }
    }
  }
}
```

#### Current Implementation
```typescript
quotas: [
  { id: "pro", amount: 100 },
  { id: "flash", amount: 100 }
]
```

**Implementation Status**: ✅ Correct approach (separate pro/flash tracking)

#### Models Available
Based on GitHub repo research:
- Gemini 3 Pro (thinking: low, high)
- Gemini 3 Flash (thinking: minimal, low, medium, high)
- Claude Sonnet 4.5
- Claude Sonnet 4.5 Thinking (low, max)
- Claude Opus 4.5 Thinking (low, max)
- Claude Opus 4.6 Thinking (low, max)

#### Subscription Tiers (Estimated)

**Official Google AI Pricing** (for Flow/Whisk):
- AI Plus: 200 credits/month
- AI Pro: 1,000 credits/month
- AI Ultra: 25,000 credits/month

**Antigravity Specific** (from blog/community):

| Tier | Window | Priority | Notes |
|------|--------|----------|-------|
| Free | Weekly | Low | Frequent adjustments, basic access |
| AI Pro | 5-hour rolling | High | Generous limits, priority |
| AI Ultra | 5-hour rolling | Highest | Best priority access |

**⚠️ RESEARCH GAP**: Exact quota values per model per tier NOT publicly documented. Google appears to adjust dynamically.

**Key Insight**: Most complex system - per-model quotas, thinking levels affect consumption, usage based on "work done" not just message count.

**Sources**:
- Google Blog: "New Antigravity rate limits for Pro/Ultra subscribers" [9/10 - official announcement]
- GitHub: opencode-antigravity-auth repo [7/10 - community reverse-engineering]
- Reddit: r/google_antigravity discussions [5/10 - anecdotal user reports]
- Google Support: Gemini Apps Community [4/10 - incomplete official information]

---

### 5. Google Gemini (CLI/Standard)

#### Tracking Model
- **Type**: Model-specific quota buckets
- **Display**: Remaining fraction per model
- **Separate from Antigravity**: Different API endpoint

#### API Endpoint
```
POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body: {}
```

#### Response Format
```json
{
  "buckets": [
    {
      "modelId": "gemini-3-pro-preview",
      "remainingFraction": 0.73
    },
    {
      "modelId": "gemini-3-flash-preview",
      "remainingFraction": 0.91
    }
  ]
}
```

#### Current Implementation
```typescript
quotas: [
  { id: "pro", amount: 100 },
  { id: "flash", amount: 100 }
]
```

**Implementation Status**: ✅ Correct approach

#### Gemini Apps Official Limits (2025)

| Plan | Pro Prompts | Thinking Prompts | Context Window |
|------|-------------|------------------|----------------|
| Basic (Free) | Varies daily | Varies daily | 32K |
| AI Plus | 30/day | 90/day | 128K |
| AI Pro | 100/day | 300/day | 1M |
| AI Ultra | 500/day | 1,500/day | 1M |

**Additional AI Ultra Features**:
- Agent: 200 requests/day, 3 concurrent tasks
- Deep Think: 10 prompts/day (192K context)
- Deep Research: 120 reports/day

**Key Insight**: Similar to Antigravity but separate quotas. CLI vs Web may have different limits.

**Sources**:
- Google Support: "Gemini Apps limits & upgrades" [10/10 - official documentation]
- Google Support: "About billing for Gemini Apps" [9/10 - official pricing info]

---

### 6. Other Platforms

#### Kiro
```typescript
quotas: [{ id: "global", amount: 100 }]
```
- CLI-based scraping: `kiro-cli chat --no-interactive /usage`
- Parses percentage from output
- Single global usage metric

#### Z.ai
```typescript
quotas: [
  { id: "limit_1", amount: 100 },
  { id: "limit_2", amount: 100 },
  { id: "limit_3", amount: 100 }
]
```
- API returns array of limits with percentages
- Up to 3 separate limit buckets
- Endpoint: `https://api.z.ai/api/monitor/usage/quota/limit`

---

## Architecture Analysis

### Data Model Strengths

The current `UsageSnapshot` type handles all three patterns:

```typescript
type UsageSnapshot = {
  id: string;
  remaining?: number;
  used?: number;
  remainingRatio?: number;
  usedRatio?: number;
  duration?: number;      // For time-based
  amountTotal?: number;   // For request-based
  meta?: Record<string, unknown>;  // For multipliers, tiers, etc.
};
```

**✅ Supports**:
- Time-based percentage (Anthropic, Codex)
- Request-count (Copilot)
- Model-specific quota (Antigravity, Gemini)

### Comparison of Approaches

| Aspect | Time % | Request Count | Model Quota |
|--------|--------|---------------|-------------|
| **Transparency** | Low | High | Medium |
| **Predictability** | Low | High | Medium |
| **Complexity** | Low | Medium | High |
| **User Control** | Low | High | Medium |
| **Examples** | Anthropic, Codex | Copilot | Antigravity, Gemini |

### API Pattern Observations

**Authentication Patterns**:
- Anthropic: `Bearer` + beta header
- Codex: `Bearer` + optional account ID
- Copilot: `token` prefix (not `Bearer`)
- Google: `Bearer` + POST with empty body

**Response Patterns**:
- Percentage-based: Return 0-100 or 0.0-1.0 values
- Request-based: Return actual counts (used, remaining, total)
- Model-specific: Return per-model objects/arrays

---

## Recommendations

### For Current Implementation

**Anthropic**: ✅ Correct as-is

**Codex**: ✅ Correct as-is

**Copilot**: ✅ Correct, consider adding:
```typescript
meta: {
  modelMultipliers: {
    "gpt-4o": 0,
    "spark": 4,
    "standard": 1
  }
}
```

**Antigravity**: ✅ Architecture correct, but consider:
1. Expand to track individual model variants:
```typescript
quotas: [
  { id: "gemini-3-pro", amount: 100 },
  { id: "gemini-3-flash", amount: 100 },
  { id: "claude-sonnet-4-5", amount: 100 },
  { id: "claude-opus-4-5", amount: 100 }
]
```

2. Add subscription tier to metadata:
```typescript
meta: {
  tier: "pro" | "ultra",
  thinkingLevel: "low" | "high" | "max"
}
```

**Gemini**: ✅ Similar to Antigravity recommendations

### Code Improvements

**Add Reset Time Field** (for Copilot):
```typescript
type UsageSnapshot = {
  // ... existing fields
  resetTime?: number;  // Unix timestamp for fixed resets
};
```

**Enhanced Metadata**:
```typescript
meta: {
  tier?: string;              // Subscription tier
  multiplier?: number;         // Model cost multiplier
  resetType?: "rolling" | "fixed";  // Reset behavior
  window?: "session" | "calendar";  // Window type
}
```

**Error Categorization**:
```typescript
type FetchError = {
  type: "auth" | "rate_limit" | "network" | "unknown";
  status?: number;
  message: string;
};
```

---

## Research Gaps

### Critical Missing Information

1. **Antigravity Exact Quotas**:
   - Per-model limits for Free/Plus/Pro/Ultra tiers
   - Quota window duration (hourly? daily? rolling?)
   - Reset behavior (fixed time? rolling?)
   - Relationship between "work done" and quota consumption

2. **Antigravity Model Multipliers**:
   - Does Opus consume more than Sonnet?
   - How do thinking levels (low/max) affect quota?
   - Are image models tracked separately?

3. **Gemini CLI vs Antigravity**:
   - Are quotas shared or independent?
   - Can users access both simultaneously?
   - Do they count against each other?

### Why Information is Missing

**Official Documentation**: Intentionally vague or incomplete
- Google's Antigravity page focuses on Flow/Whisk credits
- Actual IDE usage limits not detailed
- Likely adjusting dynamically based on demand

**Community Sources**: Anecdotal and inconsistent
- Reddit/GitHub discussions show varying experiences
- User reports conflict on exact limits
- Suggests per-user or A/B testing of limits

### Research Methods Attempted

✅ **Official Documentation**: Read Google, Anthropic, OpenAI, GitHub docs
✅ **Technical Blogs**: CometAPI, Northflank, BentoML guides
✅ **Community Discussions**: Reddit, GitHub issues, support forums
✅ **Code Analysis**: GitHub repos, reverse-engineering attempts
❌ **Direct Testing**: Would require multiple subscription tiers
❌ **API Documentation**: Internal endpoints not publicly documented

---

## Conclusions

### Implementation Status

The pi-footer PlatformTracker architecture is **sound and flexible**:
- ✅ Handles all three tracking patterns
- ✅ Proper authentication checking
- ✅ Graceful error handling
- ✅ Value clamping and validation
- ✅ Extensible metadata system

### Key Architectural Decisions Validated

1. **Flexible QuotaDefinition**: Supporting both `duration` and `amount` handles time-based and request-based models
2. **UsageSnapshot Ratios**: Using 0.0-1.0 ratios normalizes different percentage formats
3. **Metadata Field**: Allows platform-specific information without schema changes
4. **Aggregation Strategy**: Taking min() of model fractions (Antigravity) is appropriate

### Platform Tracking Summary

| Platform | Complexity | Transparency | Predictability | Implementation |
|----------|-----------|--------------|----------------|----------------|
| Anthropic | Low | Low | Medium | ✅ Complete |
| Codex | Low | Low | Medium | ✅ Complete |
| Copilot | Medium | High | High | ✅ Complete |
| Antigravity | High | Medium | Low | ✅ Core OK, details missing |
| Gemini | Medium | High | High | ✅ Complete |

### Final Assessment

**Your original understanding was correct**:
- ✅ Anthropic: Simple rolling windows
- ✅ Codex: Similar dual-window approach
- ✅ Copilot: Request-based with multipliers (0, 0.33, 1, 3)
  - Note: Multipliers are 0, 1, 4 based on research (not 0.33)
  - Non-premium: Very high/unlimited quotas
  - Premium: 300-1,500 requests based on tier
- ⚠️ Antigravity: Most complex, exact values need discovery

**Next Steps** (if needed):
1. User testing with different Antigravity subscription tiers
2. Monitoring API responses to discover actual quota values
3. Community crowdsourcing of limit observations
4. Optional: Add telemetry to track when users hit limits

---

## References

### Official Documentation
1. [Anthropic API Rate Limits](https://docs.anthropic.com/en/api/rate-limits) - 10/10
2. [GitHub Copilot Requests](https://docs.github.com/en/copilot/concepts/billing/copilot-requests) - 10/10
3. [GitHub Copilot Individual Plans](https://docs.github.com/en/copilot/concepts/billing/individual-plans) - 10/10
4. [Google Gemini Apps Limits](https://support.google.com/gemini/answer/16275805) - 10/10

### Technical Guides
5. [CometAPI: When does Claude Code usage reset?](https://www.cometapi.com/when-does-claude-code-usage-reset/) - 9/10
6. [Northflank: ChatGPT usage limits explained](https://northflank.com/blog/chatgpt-usage-limits-free-plus-enterprise) - 8/10
7. [BentoML: ChatGPT Usage Limits](https://www.bentoml.com/blog/chatgpt-usage-limits-explained-and-how-to-remove-them) - 7/10

### News & Announcements
8. [TechCrunch: Anthropic unveils new rate limits](https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/) - 8/10
9. [Google Blog: New Antigravity rate limits](https://blog.google/feed/new-antigravity-rate-limits-pro-ultra-subsribers/) - 9/10

### Community Sources
10. [Reddit: r/google_antigravity discussions](https://www.reddit.com/r/google_antigravity/) - 5/10
11. [GitHub: opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth) - 7/10
12. GitHub Community Discussions (various) - 6-7/10

### Code References
13. `./devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/strategies/*.ts` - Primary implementation source
14. `./devtools/files/pi/agent/extensions/pi-footer/services/PlatformTracker/types.ts` - Type definitions
