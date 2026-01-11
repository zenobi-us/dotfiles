# Phase 2: Layout Components

**Epic:** [UI Primitives Library](epic-d4e7f2a9-ui-primitives-library.md)  
**Status:** Pending  
**Timeline:** Week 2-3 of Q1 2026  
**Owner:** Development Team

## Goals

Build layout-oriented UI primitives (Sidebar and Collapsible) that provide flexible positioning and expandable/collapsible containers. These components extend the foundation patterns while introducing new layout capabilities.

## Success Criteria

- [ ] Sidebar component attaches to screen edges (left/right/top/bottom)
- [ ] Sidebar supports slide-in/slide-out patterns
- [ ] Collapsible component toggles between collapsed and expanded states
- [ ] Both components handle keyboard navigation (arrow keys, enter, space)
- [ ] Components integrate seamlessly with Modal patterns
- [ ] API documented with usage examples

## Tasks

### 1. Design Layout Component APIs
[task-u1v2w3x4-design-layout-apis.md](task-u1v2w3x4-design-layout-apis.md) ⏳

**Objective:** Define TypeScript interfaces for Sidebar and Collapsible

**Deliverables:**
- Sidebar interface with edge positioning
- Collapsible interface with state management
- Type definitions
- Usage examples

**Dependencies:** Phase 1 complete (Modal patterns established)  
**Timeline:** 1 day

---

### 2. Implement Sidebar Component
[task-y5z6a7b8-implement-sidebar.md](task-y5z6a7b8-implement-sidebar.md) ⏳

**Objective:** Create edge-attached modal variant

**Deliverables:**
- Sidebar class extending Modal patterns
- Edge positioning (left/right/top/bottom)
- Width/height constraints per edge
- Slide-in animation (if feasible)
- ESC to dismiss

**Dependencies:** Task 1, Phase 1 (Modal complete)  
**Timeline:** 3 days

---

### 3. Implement Collapsible Component
[task-c9d0e1f2-implement-collapsible.md](task-c9d0e1f2-implement-collapsible.md) ⏳

**Objective:** Create expandable/collapsible container

**Deliverables:**
- Collapsible class implementing Component
- Toggle state (collapsed/expanded)
- Keyboard controls (enter/space to toggle)
- Visual indicators (arrows/icons)
- Smooth state transitions

**Dependencies:** Task 1  
**Timeline:** 2 days

---

### 4. Test Layout Components
[task-g3h4i5j6-test-layout.md](task-g3h4i5j6-test-layout.md) ⏳

**Objective:** Visual testing for all edges and states

**Deliverables:**
- Test extension with all edge positions
- Collapsible state testing
- Nested collapsibles testing
- Edge case testing
- Documentation of findings

**Dependencies:** Tasks 2-3  
**Timeline:** 2 days

---

### 5. Document Layout Components
[task-k7l8m9n0-document-layout.md](task-k7l8m9n0-document-layout.md) ⏳

**Objective:** Create API docs and usage examples

**Deliverables:**
- Sidebar API reference
- Collapsible API reference
- Layout pattern examples
- Integration guide

**Dependencies:** Tasks 2-3  
**Timeline:** 1 day

## Technical Details

### Sidebar Component Design

```typescript
type SidebarEdge = 'left' | 'right' | 'top' | 'bottom';

interface SidebarOptions extends Omit<ModalOptions, 'width' | 'height'> {
  edge: SidebarEdge;
  size?: number;           // Width for left/right, height for top/bottom
  pushContent?: boolean;   // Push main content vs overlay (default: false)
  onDismiss?: () => void;
}

class Sidebar implements Component {
  constructor(options: SidebarOptions);
  
  render(width: number): string[];
  handleInput(data: string): void;
  invalidate(): void;
  
  // Public API
  setContent(component: Component): void;
  setEdge(edge: SidebarEdge): void;
  show(): void;
  hide(): void;
  toggle(): void;
}
```

**Key Challenges:**
- Positioning at edges requires different rendering strategy
- Top/bottom sidebars may need horizontal scrolling
- Overlay compositing positions need calculation
- Animation/slide effects may be terminal-limited

**Layout Strategy:**

```
Left Sidebar (width=30):
╭────────────────────────────╮
│ Sidebar Content            │
│                            │
│                            │
╰────────────────────────────╯
   Main content continues here...

Right Sidebar (width=30):
                  ╭────────────────────────────╮
Main content here │ Sidebar Content            │
                  │                            │
                  │                            │
                  ╰────────────────────────────╯
```

### Collapsible Component Design

```typescript
interface CollapsibleOptions {
  title: string;
  collapsed?: boolean;      // Initial state (default: false)
  icon?: {
    collapsed: string;      // e.g., "▶"
    expanded: string;       // e.g., "▼"
  };
  onToggle?: (expanded: boolean) => void;
}

class Collapsible implements Component {
  constructor(content: Component, options: CollapsibleOptions);
  
  render(width: number): string[];
  handleInput(data: string): void;
  invalidate(): void;
  
  // Public API
  setContent(component: Component): void;
  setTitle(title: string): void;
  toggle(): void;
  expand(): void;
  collapse(): void;
  isExpanded(): boolean;
}
```

**Key Challenges:**
- State management across invalidations
- Content height calculation
- Visual feedback for interactive title
- Nested collapsibles (tree-like structures)

**Rendering Strategy:**

```
Collapsed:
▶ Section Title

Expanded:
▼ Section Title
  Content line 1
  Content line 2
  Content line 3
```

### Component Relationships

```
Sidebar extends Modal patterns:
- Uses same Blanket background (optional)
- Uses same border patterns
- Different positioning logic

Collapsible is standalone:
- Container-like behavior
- State management for toggle
- Visual decoration for title
```

## Integration Points

### With Phase 1 Components
- Sidebar reuses Modal's blanket and border components
- Both can contain Collapsible components
- Collapsible can be used in Modal/Sidebar content

### With Phase 3 Components
- Toasts system may use Sidebar patterns for positioning
- Corner positioning logic shared

## Testing Strategy

### Test Cases

1. **Sidebar Tests**
   - All 4 edge positions
   - Various sizes (small to large)
   - With/without blanket
   - Content overflow handling
   - ESC dismissal
   - Theme changes

2. **Collapsible Tests**
   - Toggle state changes
   - Keyboard controls (enter, space)
   - Arrow icon rendering
   - Nested collapsibles (2-3 levels)
   - With various content types
   - Theme changes

3. **Integration Tests**
   - Collapsible inside Modal
   - Collapsible inside Sidebar
   - Multiple sidebars (stacking)
   - Sidebar + Modal simultaneously

## Dependencies

- ✅ Phase 1 complete (Blanket, Modal)
- ✅ Research on overlay positioning
- ✅ Container component
- ✅ Theme system

## Next Phase

Phase 3 will build the notification system:
- Toasts component with corner positioning
- Queue management for multiple notifications
- Auto-dismiss patterns

---

**Created:** 2026-01-11  
**Last Updated:** 2026-01-11
