# Tasks

## Epic Status

Three self-contained epics exist:

1. **[Subagent Extension Enhancement](epic-a7d3e9f1-subagent-extension-enhancement.md)** ✅ - **COMPLETE**
2. **[Theme Development Tools](epic-c2b8f4e6-theme-development-tools.md)** 🔄 - **ACTIVE**
3. **[UI Primitives Library](epic-d4e7f2a9-ui-primitives-library.md)** ⏳ - **PENDING ACTIVATION**

**Per miniproject guidelines:** Only ONE epic should be active at a time unless explicitly approved by human.

**Status:** Epic 1 completed. Epic 2 active. Epic 3 awaiting human decision.

---

## Epic 1: Subagent Extension Enhancement ✅ COMPLETE

**Status:** Fully Complete  
**Completed:** 2026-01-11

All tasks completed, documentation delivered, learning materials distilled.

---

## Epic 2: Theme Development Tools 🔄 ACTIVE

**Status:** Active (Activated 2026-01-11)

### Critical Path - Research First

1. **[NEXT]** Research Pi Theme API
   - Determine actual method to access theme colors
   - Verify Theme type structure
   - Document findings in new research file
   - **Priority:** CRITICAL - Blocks all implementation
   - **Status:** Not started

### Implementation Tasks (After Research)

2. [Implement theme palette MVP](task-e5466d3f-theme-palette-extension-spec.md#phase-1-mvp-minimum-viable-product)
3. [Enhance palette display](task-e5466d3f-theme-palette-extension-spec.md#phase-2-enhanced-display)
4. [Add palette interactivity](task-e5466d3f-theme-palette-extension-spec.md#phase-3-interactivity)
5. Write extension documentation
6. Distill theme learnings

---

## Epic 3: UI Primitives Library ⏳ PENDING

**Status:** Pending Human Decision  
**Created:** 2026-01-11

### Phase 1: Foundation Components (Week 1-2)

1. [Design Component APIs](task-a1b2c3d4-design-foundation-apis.md) ⏳
2. [Implement Blanket Component](task-e5f6g7h8-implement-blanket.md) ⏳
3. [Implement Modal Component](task-i9j0k1l2-implement-modal.md) ⏳
4. [Test Foundation Components](task-m3n4o5p6-test-foundation.md) ⏳
5. [Document Foundation Components](task-q7r8s9t0-document-foundation.md) ⏳

### Phase 2: Layout Components (Week 2-3)

6. [Design Layout APIs](task-u1v2w3x4-design-layout-apis.md) ⏳
7. [Implement Sidebar Component](task-y5z6a7b8-implement-sidebar.md) ⏳
8. [Implement Collapsible Component](task-c9d0e1f2-implement-collapsible.md) ⏳
9. [Test Layout Components](task-g3h4i5j6-test-layout.md) ⏳
10. [Document Layout Components](task-k7l8m9n0-document-layout.md) ⏳

### Phase 3: Notification System (Week 3-4)

11. [Design Toast System](task-o1p2q3r4-design-toast-system.md) ⏳
12. [Implement Toast Component](task-s5t6u7v8-implement-toast.md) ⏳
13. [Implement ToastManager](task-w9x0y1z2-implement-toast-manager.md) ⏳
14. [Add Toast Interaction](task-a3b4c5d6-toast-interaction.md) ⏳
15. [Test Toast System](task-e7f8g9h0-test-toasts.md) ⏳
16. [Document Toast System](task-i1j2k3l4-document-toasts.md) ⏳

### Phase 4: Integration & Documentation (Week 4-5)

17. [Create Example Extension](task-m5n6o7p8-example-extension.md) ⏳
18. [Write API Documentation](task-q9r0s1t2-api-documentation.md) ⏳
19. [Create Visual Test Suite](task-u3v4w5x6-visual-test-suite.md) ⏳
20. [Write Composition Guide](task-y7z8a9b0-composition-guide.md) ⏳
21. [Create Integration Guide](task-c1d2e3f4-integration-guide.md) ⏳
22. [Write Library README](task-g5h6i7j8-library-readme.md) ⏳

### Phase 5: Learning & Cleanup (Week 5)

23. [Distill Component Patterns](task-k1l2m3n4-component-patterns.md) ⏳
24. [Document Keyboard Patterns](task-o5p6q7r8-keyboard-patterns.md) ⏳
25. [Create Theme Integration Guide](task-s9t0u1v2-theme-integration.md) ⏳
26. [Compile Performance Learnings](task-w3x4y5z6-performance-learnings.md) ⏳
27. [Create Future Roadmap](task-a7b8c9d0-future-roadmap.md) ⏳
28. [Epic Cleanup and Archiving](task-e1f2g3h4-epic-cleanup.md) ⏳

---

## [NEEDS-HUMAN] Epic Prioritization Decision

**Action Required:** Decide which epic to work on next.

**Current Situation:**
- Epic 1 (Subagent) is complete ✅
- Epic 2 (Theme Tools) is active 🔄
- Epic 3 (UI Primitives) is ready to start ⏳

**Options:**

### Option A: Continue Epic 2 First
- Complete theme palette extension
- Then start Epic 3
- Sequential execution (recommended by miniproject guidelines)

### Option B: Activate Epic 3 Immediately
- Pause Epic 2 temporarily
- Start UI primitives work
- Requires human approval for parallel epics

### Option C: Run Both in Parallel
- Work on both epics simultaneously
- Requires human approval for multiple active epics
- More context switching, but faster overall

**Recommendation:** Option A - Complete Epic 2 first (theme research + MVP), then activate Epic 3. This follows miniproject guidelines and maintains focus.

---

## Quick Actions

**To continue Epic 2:**
```bash
# Start theme API research
cat .memory/epic-c2b8f4e6-theme-development-tools.md
cat .memory/phase-e8f9a1b2-theme-palette-extension.md
```

**To activate Epic 3:**
```bash
# Review UI primitives plan
cat .memory/epic-d4e7f2a9-ui-primitives-library.md
cat .memory/phase-f8a2c1d5-foundation-components.md
```

**To view all epics:**
```bash
ls -la .memory/ | grep epic
```
