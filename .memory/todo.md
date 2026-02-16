# TODO - Dotfiles Project

## Active Work

### Model Alias Manager Extension ❌ CANCELLED

**Epic**: `.memory/epic-m0d3la1s-model-alias-manager-extension.md`

**Status**: Cancelled

**Reason**: Discovered that thinking level configuration belongs in agent configs (pi-subagents), not model aliases. The `models.json` format only supports `reasoning: boolean` to indicate capability, not runtime thinking level. User determined the extension was not needed.

**Learning**: Model aliases define model *capabilities* (reasoning support, context window, etc.). Thinking *level* is a runtime/session setting managed by pi-subagents or `setThinkingLevel()`.

---



### Zellij Extension Development

**Epic**: `.memory/epic-ze11ij01-preset-based-tab-management.md`

**Priority**: High
**Status**: Planning Complete → Ready for Implementation

#### Phase 1: Core Infrastructure (ze11ph01) ✅ COMPLETED
- [x] `.memory/task-ze11ts01-preset-storage.md` - Implement preset JSON storage
- [x] `.memory/task-ze11ts02-cli-wrapper.md` - Create Zellij CLI wrapper utilities
- [x] `.memory/task-ze11ts03-validation.md` - Add preset validation logic

#### Phase 2: Preset Management (ze11ph02)
- [ ] `.memory/task-ze11ts04-preset-create.md` - Implement preset creation command
- [ ] `.memory/task-ze11ts05-preset-list.md` - Implement preset listing
- [ ] `.memory/task-ze11ts06-preset-delete.md` - Implement preset deletion

#### Phase 3: Tab Creation (ze11ph03)
- [ ] `.memory/task-ze11ts07-tab-creation.md` - Implement basic tab creation
- [ ] `.memory/task-ze11ts08-preset-application.md` - Apply presets to tabs
- [ ] `.memory/task-ze11ts09-pane-focusing.md` - Pane focusing and command execution
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

### Phase 4: Query & Context ✅
- [x] **task-6c377cf9**: Platform Tracker - Query Functions and Context Providers
  - ✅ **CRITICAL BUG FIX**: Implemented createPlatformContextProviders()
  - ✅ Updated query functions to (providerId, modelId, windowId)
  - ✅ Added helper functions (getProviderModels, getProviderEntries)
  - ✅ Implemented dynamic provider creation per model × quota
  - ✅ Added convenience factories for specific platforms (Copilot Spark, Anthropic)

## Incoming Tasks
- [ ] [task-c7f1a2de-write-user-request-to-task-file.md](task-c7f1a2de-write-user-request-to-task-file.md)

## Notes

- Epic: fc52bd74 (subagent-footer-customization)
- Research: research-9056b4da-platform-usage-tracking.md
- Validation: Full workspace tsc has unrelated/pre-existing errors in non-target modules.
- Current implementation changes are complete for phases 1–4 in the target PlatformTracker area.
