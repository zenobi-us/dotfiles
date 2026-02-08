# Outstanding Tasks

## Platform Tracker Implementation

### Phase 1: Core Types ⏳
- [ ] **task-845f3788**: Platform Tracker - Core Type Refactor
  - Add StorageKey type and helpers
  - Add providerId/modelId to UsageStoreEntry
  - Add modelId to UsageSnapshot and ResolvedUsageWindow
  - Update ProviderStrategy interface with getMetadata()
  - **Blocks**: Phase 2, 3, 4

### Phase 2: Provider Updates ⏳
- [ ] **task-fcc4dbe3**: Platform Tracker - Provider Strategy Updates
  - Update Anthropic to return modelId
  - Update Codex to return modelId
  - Update Copilot to return per-model snapshots
  - Update Antigravity to return per-model snapshots
  - Update Gemini to return per-model snapshots
  - Remove isMetadata methods
  - **Depends on**: task-845f3788
  - **Blocks**: Phase 3

### Phase 3: Store Logic ⏳
- [ ] **task-1ae9bcdf**: Platform Tracker - Store Update Logic
  - **CRITICAL BUG FIX**: Implement empty snapshot processing loop
  - Use compound keys for storage
  - Update auth failure handling
  - Update error handling for per-model entries
  - **Depends on**: task-fcc4dbe3
  - **Blocks**: Phase 4

### Phase 4: Query & Context ⏳
- [ ] **task-6c377cf9**: Platform Tracker - Query Functions and Context Providers
  - **CRITICAL BUG FIX**: Implement empty createPlatformContextProviders()
  - Update all query functions to use (providerId, modelId, windowId)
  - Add helper query functions
  - Create convenience provider factories
  - **Depends on**: task-1ae9bcdf

## Notes

- Epic: fc52bd74 (subagent-footer-customization)
- Research: research-9056b4da-platform-usage-tracking.md
- All tasks created from research implementation checklist
- Two critical bugs will be fixed: snapshot processing (Phase 3) and context providers (Phase 4)
