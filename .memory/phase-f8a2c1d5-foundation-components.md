# Phase 1: Foundation Components

**Epic:** [UI Primitives Library](epic-d4e7f2a9-ui-primitives-library.md)  
**Status:** Pending  
**Timeline:** Week 1-2 of Q1 2026  
**Owner:** Development Team

## Goals

Build the foundational UI primitives (Blanket and Modal) that will be used as building blocks for other components in the library. These components establish core patterns for overlay management, theme integration, and component composition.

## Success Criteria

- [ ] Blanket component renders fullscreen overlay with configurable dimming
- [ ] Modal component provides centered dialog with blanket background
- [ ] Both components handle theme changes correctly via invalidate()
- [ ] Keyboard navigation works (ESC to dismiss)
- [ ] Components tested with wide chars, emoji, ANSI codes
- [ ] API documented with usage examples

## Tasks

### 1. Design Component APIs
[task-a1b2c3d4-design-foundation-apis.md](task-a1b2c3d4-design-foundation-apis.md) ⏳

**Objective:** Define TypeScript interfaces and options for Blanket and Modal

**Deliverables:**
- Blanket interface with dimming options
- Modal interface with positioning/sizing
- Type definitions file
- Usage examples in comments

**Timeline:** 1 day

---

### 2. Implement Blanket Component
[task-e5f6g7h8-implement-blanket.md](task-e5f6g7h8-implement-blanket.md) ⏳

**Objective:** Create fullscreen overlay component with configurable appearance

**Deliverables:**
- Blanket class implementing Component interface
- Dimming/transparency options
- Theme integration
- Handle varying terminal sizes

**Dependencies:** Task 1 (API design)  
**Timeline:** 2 days

---

### 3. Implement Modal Component
[task-i9j0k1l2-implement-modal.md](task-i9j0k1l2-implement-modal.md) ⏳

**Objective:** Create centered dialog container using Blanket + Container

**Deliverables:**
- Modal class using composition pattern
- Automatic Blanket background
- Content container for child components
- Centered positioning with size options
- ESC key dismissal

**Dependencies:** Task 2 (Blanket complete)  
**Timeline:** 2 days

---

### 4. Test Foundation Components
[task-m3n4o5p6-test-foundation.md](task-m3n4o5p6-test-foundation.md) ⏳

**Objective:** Create visual test extension for edge cases

**Deliverables:**
- Test extension with multiple scenarios
- Theme change testing
- Edge case testing (wide chars, emoji, ANSI)
- Terminal width change testing
- Documentation of findings

**Dependencies:** Tasks 2-3 (components implemented)  
**Timeline:** 2 days

---

### 5. Document Foundation Components
[task-q7r8s9t0-document-foundation.md](task-q7r8s9t0-document-foundation.md) ⏳

**Objective:** Create API documentation and usage examples

**Deliverables:**
- API reference for Blanket
- API reference for Modal
- Code examples showing common patterns
- Integration guide for using in extensions

**Dependencies:** Tasks 2-3 (components implemented)  
**Timeline:** 1 day

## Technical Details

### Blanket Component Design

```typescript
interface BlanketOptions {
  dimColor?: string;        // Color for dimming (default: based on theme)
  dimChar?: string;         // Character to use (default: ' ')
  opacity?: number;         // 0-1 for future ANSI transparency support
  handleInput?: boolean;    // Whether to capture input (default: false)
}

class Blanket implements Component {
  constructor(options?: BlanketOptions);
  render(width: number): string[];
  handleInput?(data: string): void;
  invalidate(): void;
}
```

**Key Challenges:**
- Terminal transparency is limited (ANSI doesn't support true transparency)
- Dimming achieved via background color, not opacity
- Must handle varying terminal heights (current height detection needed)

### Modal Component Design

```typescript
interface ModalOptions {
  width?: number;           // Fixed width (default: 70)
  height?: number;          // Fixed height (default: auto)
  title?: string;           // Optional title
  useBlanket?: boolean;     // Use blanket background (default: true)
  blanketOptions?: BlanketOptions;
  onDismiss?: () => void;   // Callback when ESC pressed
}

class Modal implements Component {
  constructor(options?: ModalOptions);
  
  render(width: number): string[];
  handleInput(data: string): void;
  invalidate(): void;
  
  // Public API
  setContent(component: Component): void;
  setTitle(title: string): void;
  show(): void;
  hide(): void;
}
```

**Key Challenges:**
- Managing component tree (Blanket + border + title + content)
- Input routing to content vs modal controls
- Proper invalidation cascade to children

### Component Composition Pattern

```
Modal
├── Blanket (background)
└── Container
    ├── DynamicBorder (top)
    ├── Text (title - optional)
    ├── Component (user content)
    └── DynamicBorder (bottom)
```

## Integration Points

### With Pi-Mono
- Use `ctx.ui.custom()` with `{ overlay: true }`
- Leverage existing Container and DynamicBorder components
- Follow theme integration patterns from research-5231cb8a

### With Future Components
- Sidebar will extend Modal with edge positioning
- Toasts may use Blanket for backgrounds
- All components will use Modal for dialog patterns

## Testing Strategy

### Test Cases

1. **Blanket Tests**
   - Fullscreen rendering at various terminal sizes
   - Theme color changes
   - Wide characters in dim layer
   - Terminal resize handling

2. **Modal Tests**
   - Centered positioning at various widths
   - Content overflow handling
   - ESC key dismissal
   - With/without blanket background
   - With/without title
   - Theme changes with content

3. **Edge Cases**
   - Very small terminal (<40 cols)
   - Very large terminal (>200 cols)
   - Emoji in title and content
   - ANSI codes in content
   - Rapid theme changes

## Dependencies

- ✅ Research on component interface (research-5231cb8a)
- ✅ Research on overlay system (research-5231cb8a)
- ✅ Existing Container component
- ✅ Existing DynamicBorder component
- ✅ Theme system

## Next Phase

Phase 2 will build on these foundation components to create:
- Sidebar (modal variant with edge positioning)
- Collapsible (expandable container)

---

**Created:** 2026-01-11  
**Last Updated:** 2026-01-11
