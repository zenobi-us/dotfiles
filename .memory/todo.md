# Outstanding Tasks

## Platform Tracker Implementation

### Phase 1: Core Types ✅
- [x] **task-845f3788**: Platform Tracker - Core Type Refactor
  - Add StorageKey type and helpers
  - Add providerId/modelId to UsageStoreEntry
  - Add modelId to UsageSnapshot and ResolvedUsageWindow
  - Update ProviderStrategy interface with getMetadata()

### Phase 2: Provider Updates ✅
- [x] **task-fcc4dbe3**: Platform Tracker - Provider Strategy Updates
  - Update Anthropic/Codex/Kiro/Z.ai to return modelId="default" where applicable
  - Update Copilot to return per-model snapshots
  - Update Antigravity and Gemini to return per-model snapshots
  - Remove isMetadata usage from provider implementations

### Phase 3: Store Logic ✅
- [x] **task-1ae9bcdf**: Platform Tracker - Store Update Logic
  - **CRITICAL BUG FIX**: Implemented snapshot processing loop
  - Implemented snapshot → per-model storage conversion
  - Use compound keys (provider/model)
  - Updated cleanup/error handling for per-model entries
  - Added provider default metadata accessor wiring

### Phase 4: Query & Context ⏳
- [ ] **task-6c377cf9**: Platform Tracker - Query Functions and Context Providers
  - ✅ **CRITICAL BUG FIX**: Implemented createPlatformContextProviders()
  - ✅ Updated query functions to (providerId, modelId, windowId)
  - ✅ Added helper functions (getProviderModels, getProviderEntries)
  - ✅ Implemented dynamic provider creation per model × quota
  - ⛔ Missing: convenience factories for specific platforms (e.g. Copilot Spark, Anthropic)

## Notes

- Epic: fc52bd74 (subagent-footer-customization)
- Research: research-9056b4da-platform-usage-tracking.md
- Validation: Full workspace tsc has unrelated/pre-existing errors in non-target modules.
- Current implementation changes are complete for phases 1–4 in the target PlatformTracker area.
