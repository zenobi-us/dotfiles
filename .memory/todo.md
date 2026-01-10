# Tasks

## Epic Status

Two self-contained, unrelated epics exist:

1. **[Subagent Extension Enhancement](epic-a7d3e9f1-subagent-extension-enhancement.md)** ✅ - Functionally Complete
2. **[Theme Development Tools](epic-c2b8f4e6-theme-development-tools.md)** ⏳ - Not Started

**Per miniproject guidelines:** Only ONE epic should be active at a time unless explicitly approved by human.

---

## Epic 1: Subagent Extension Enhancement ✅

**Status:** Functionally Complete (Documentation polish remaining)

### Remaining Work

1. [Add tests and documentation](task-82937436-tests-and-docs.md)
   - Update README.md with management commands
   - Add code comments and JSDoc
   - Complete manual testing checklist
   - **Priority:** Low - Polish/quality assurance
   - **Status:** Ready for work

### Completed ✅

- ✅ [Design command specifications](task-39282875-design-command-specs.md)
- ✅ [Implement list command](task-8c7d3d20-implement-list-command.md)
- ✅ [Implement add command](task-b75d4e5c-implement-add-command.md)
- ✅ [Implement edit command](task-ccc03ceb-implement-edit-command.md)

**Epic Outcome:** Three functional slash commands delivered (`/subagent list`, `/subagent add`, `/subagent edit`) that integrate with Pi's agent discovery mechanisms.

---

## Epic 2: Theme Development Tools ⏳

**Status:** Not Started (Awaiting activation)

### Critical Path - Research First

1. **[NEXT IF EPIC ACTIVATED]** Research Pi Theme API
   - Determine actual method to access theme colors
   - Verify Theme type structure
   - Document findings in new research file
   - **Priority:** CRITICAL - Blocks all implementation
   - **Status:** Not started
   - **Note:** Create task file when epic is activated

### Implementation Tasks (After Research)

2. [Implement theme palette MVP](task-e5466d3f-theme-palette-extension-spec.md#phase-1-mvp-minimum-viable-product)
   - Create extension structure
   - Implement basic widget rendering
   - Add command registration
   - Test with default themes
   - **Priority:** High
   - **Depends on:** Theme API research

3. [Enhance palette display](task-e5466d3f-theme-palette-extension-spec.md#phase-2-enhanced-display)
   - Add color grid at top
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
   - Document color categories
   - **Priority:** Medium
   - **Depends on:** MVP implementation

6. Distill theme learnings
   - Document theme API patterns
   - Capture widget rendering learnings
   - Create theme integration guide
   - **Priority:** Medium
   - **Depends on:** Implementation complete

---

## [NEEDS-HUMAN] Items

### Epic Activation Decision

**Action Required:** Determine which epic should be active.

**Options:**
1. **Close Epic 1:** Mark as fully complete (accepting documentation remains as future polish)
2. **Activate Epic 2:** Begin theme development tools work
3. **Finish Epic 1 polish:** Complete documentation task before starting Epic 2

**Current State:** Epic 1 is functionally complete but has minor documentation work remaining. Epic 2 is fully specified and ready to begin.

**Recommendation:** Either:
- Complete Epic 1 documentation (low-priority polish), then activate Epic 2
- Accept Epic 1 as complete, activate Epic 2 immediately

---

## Quick Actions

**To finish Epic 1 documentation:**
```bash
cat .memory/task-82937436-tests-and-docs.md
```

**To activate Epic 2:**
```bash
# 1. Create theme API research task
# 2. Begin research into Pi theme system
# 3. Update team.md with Epic 2 activation
```

**To view epic details:**
```bash
cat .memory/epic-a7d3e9f1-subagent-extension-enhancement.md  # Epic 1
cat .memory/epic-c2b8f4e6-theme-development-tools.md         # Epic 2
```
