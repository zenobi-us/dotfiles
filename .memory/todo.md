# Tasks

## Active Epic: [Pi Extensions Development](epic-f4a8b2c6-pi-extensions-development.md)

## Phase 1: Subagent Management Commands (Complete) ✅

### Remaining Work

1. [Add tests and documentation](task-82937436-tests-and-docs.md)
   - Update README.md with management commands
   - Add code comments and JSDoc
   - Complete manual testing checklist
   - **Priority:** Medium - Quality assurance
   - **Status:** Ready for work

### Completed ✅

- ✅ [Design command specifications](task-39282875-design-command-specs.md)
- ✅ [Implement list command](task-8c7d3d20-implement-list-command.md)
- ✅ [Implement add command](task-b75d4e5c-implement-add-command.md)
- ✅ [Implement edit command](task-ccc03ceb-implement-edit-command.md)

## Phase 2: Theme Palette Extension (Not Started) ⏳

### Critical Path - Research First

1. **[NEXT]** Research Pi Theme API
   - Determine actual method to access theme colours
   - Verify Theme type structure
   - Document findings in new research file
   - **Priority:** CRITICAL - Blocks all implementation
   - **Status:** Not started

### Implementation Tasks (After Research)

2. [Implement theme palette MVP](task-e5466d3f-theme-palette-extension-spec.md#phase-1-mvp-minimum-viable-product)
   - Create extension structure
   - Implement basic widget rendering
   - Add command registration
   - Test with default themes
   - **Priority:** High
   - **Depends on:** Theme API research

3. [Enhance palette display](task-e5466d3f-theme-palette-extension-spec.md#phase-2-enhanced-display)
   - Add colour grid at top
   - Implement category grouping
   - Add verbose mode
   - Improve visual layout
   - **Priority:** Medium
   - **Depends on:** MVP implementation

4. [Add palette interactivity](task-e5466d3f-theme-palette-extension-spec.md#phase-3-interactivity)
   - Implement keyboard shortcut
   - Add category filtering
   - Add clipboard support (if possible)
   - **Priority:** Low - Nice to have
   - **Depends on:** Enhanced display

### Documentation Tasks

5. Write extension documentation
   - Create README for theme-palette extension
   - Add usage examples
   - Document colour categories
   - **Priority:** Medium
   - **Depends on:** MVP implementation

## Phase 3: Learning & Documentation (Ongoing) 🔄

### Completed ✅

- ✅ Pi extensions comprehensive guide ([learning-76e583ca-pi-extensions-guide.md](learning-76e583ca-pi-extensions-guide.md))
- ✅ Extension command patterns ([learning-d8d1c166-extension-command-patterns.md](learning-d8d1c166-extension-command-patterns.md))

### Future

- [ ] Distill theme palette learnings after Phase 2 complete
- [ ] Create consolidated extension development guide

## [NEEDS-HUMAN] Items

_(none currently)_

## Quick Actions

**To start next work:**
```bash
# Option 1: Complete Phase 1 documentation
cat .memory/task-82937436-tests-and-docs.md

# Option 2: Begin Phase 2 research
# Create new research task file for theme API investigation
```
