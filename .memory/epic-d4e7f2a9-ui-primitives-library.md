# Epic: UI Primitives Library for Pi-Mono

**Status:** Pending Activation  
**Timeline:** Q1 2026  
**Owner:** Development Team  
**Created:** 2026-01-11

## Vision

Build a comprehensive library of reusable UI primitives for pi-mono that enable developers to create rich, consistent TUI experiences. The library will provide five essential components (Blanket, Modal, Sidebar, Collapsible, Toasts) that leverage the existing overlay system and component interface while establishing patterns for future component development.

## Success Criteria

- [ ] **Blanket Component** - Fullscreen overlay with configurable dimming/transparency
- [ ] **Modal Component** - Centered dialog container with blanket background
- [ ] **Sidebar Component** - Edge-attached modal variant (left/right/top/bottom)
- [ ] **Collapsible Component** - Expandable/collapsible container with title
- [ ] **Toasts Component** - Corner-positioned notification system
- [ ] **Documentation** - Usage examples and API reference for each component
- [ ] **Examples** - Working extension demonstrating all components
- [ ] **Tests** - Visual test suite for edge cases and themes
- [ ] **Learning** - Distilled patterns for component development

## Context from Research

**Key Findings from research-5231cb8a:**
- Pi-mono uses overlay system for modal-like behavior
- All interaction is keyboard-based (no mouse support)
- Components implement: `render()`, `handleInput()`, `invalidate()`
- Theme integration requires proper invalidation handling
- Multiple overlays can stack (later on top)
- Compositing handles ANSI codes, wide chars, emoji correctly

**Existing Patterns:**
- SelectList for selection dialogs
- BorderedLoader for async operations
- SettingsList for toggles
- DynamicBorder for themed borders
- Container for component composition

## Phases

### Phase 1: Foundation Components
[phase-f8a2c1d5-foundation-components.md](phase-f8a2c1d5-foundation-components.md) ⏳

**Goal:** Build core primitives (Blanket, Modal) that other components depend on

**Deliverables:**
- Blanket component with configurable dimming
- Modal component using Blanket + Container
- Base patterns for component composition

**Timeline:** Week 1-2

---

### Phase 2: Layout Components
[phase-b3e9d7f4-layout-components.md](phase-b3e9d7f4-layout-components.md) ⏳

**Goal:** Build positioning and layout primitives

**Deliverables:**
- Sidebar component (edge-attached modals)
- Collapsible component (expandable containers)
- Layout positioning utilities

**Timeline:** Week 2-3

---

### Phase 3: Notification System
[phase-c6f1a8b2-notification-system.md](phase-c6f1a8b2-notification-system.md) ⏳

**Goal:** Build corner-positioned toast notification system

**Deliverables:**
- Toasts component with queue management
- Corner positioning (4 corners + center)
- Auto-dismiss and manual dismiss patterns
- Animation/transition support (if feasible)

**Timeline:** Week 3-4

---

### Phase 4: Integration & Documentation
[phase-e9d4c7a1-integration-documentation.md](phase-e9d4c7a1-integration-documentation.md) ⏳

**Goal:** Complete the library with documentation, examples, and tests

**Deliverables:**
- Comprehensive example extension
- API documentation for each component
- Visual test suite
- Component composition patterns guide

**Timeline:** Week 4-5

---

### Phase 5: Learning & Cleanup
[phase-a5f8b3d2-learning-cleanup.md](phase-a5f8b3d2-learning-cleanup.md) ⏳

**Goal:** Distill learnings and prepare for future components

**Deliverables:**
- Component development patterns learning doc
- Keyboard interaction patterns
- Theme integration best practices
- Future component roadmap

**Timeline:** Week 5

## Dependencies

### External Dependencies
- Pi-mono TUI framework (stable)
- Component interface API (stable)
- Overlay system (stable)
- Theme system (stable)

### Internal Dependencies
- Phase 2 depends on Phase 1 (Sidebar uses Modal patterns)
- Phase 3 depends on Phase 1 (Toasts may use Blanket)
- Phase 4 depends on Phases 1-3 (all components complete)
- Phase 5 depends on Phase 4 (implementation complete)

### Knowledge Dependencies
- ✅ Component interface understanding (research-5231cb8a)
- ✅ Overlay system knowledge (research-5231cb8a)
- ✅ Keyboard interaction patterns (research-5231cb8a)
- ✅ Theme integration requirements (research-5231cb8a)

## Technical Approach

### Component Architecture

All components will follow this structure:

```typescript
interface ComponentOptions {
  theme?: Theme;
  // Component-specific options
}

class ComponentName implements Component {
  constructor(options: ComponentOptions) { }
  
  render(width: number): string[] { }
  handleInput?(data: string): void { }
  invalidate(): void { }
  
  // Public API methods
  show(): void { }
  hide(): void { }
  update(newData: any): void { }
}
```

### Key Design Principles

1. **Composition over inheritance** - Build complex UIs by composing simple components
2. **Theme-aware** - All components respect theme changes via invalidate()
3. **Keyboard-first** - Clear keyboard shortcuts and navigation
4. **Responsive** - Handle varying terminal widths gracefully
5. **Reusable** - Generic implementations with options for customization
6. **Documented** - Clear API docs and usage examples

### Testing Strategy

1. **Visual tests** - Extension that renders all components with edge cases
2. **Theme tests** - Verify all components update on theme change
3. **Interaction tests** - Verify keyboard input handling
4. **Edge cases** - Wide chars, emoji, ANSI codes, terminal width changes

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Overlay compositing bugs | High | Test extensively with overlay-test patterns |
| Theme invalidation issues | Medium | Follow documented invalidation patterns |
| Keyboard navigation conflicts | Medium | Clear documentation of key bindings |
| Terminal compatibility | Low | Graceful degradation, feature detection |
| Performance with many toasts | Low | Queue management, auto-dismiss |

## Out of Scope

- Mouse interaction (not supported by pi-mono)
- Touch gesture support
- Animation effects (terminal limitations)
- Sound/audio feedback
- Persistent notification history
- Component state persistence between sessions

## Future Considerations

**Potential Future Components:**
- Tabs/TabView for multi-panel UIs
- ProgressBar for operations with known duration
- Table component for structured data
- Tree component for hierarchical data
- Form component with validation
- Chart/graph components for data visualization

**Integration Opportunities:**
- Package as reusable npm module
- Integration with pi-mono core
- Contribution back to pi-mono project

## Notes

### Epic Activation Decision Required

**Current State:** Epic 2 (Theme Development Tools) is currently active.

**Per miniproject guidelines:** Only ONE epic should be active at a time unless explicitly approved by human.

**Options:**
1. Complete Epic 2 first, then activate this epic
2. Pause Epic 2, activate this epic (requires human approval)
3. Run both in parallel (requires human approval)

**Recommendation:** Request human decision on epic prioritization.

---

**Created:** 2026-01-11  
**Last Updated:** 2026-01-11
