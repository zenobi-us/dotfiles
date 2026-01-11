# Phase 3: Notification System

**Epic:** [UI Primitives Library](epic-d4e7f2a9-ui-primitives-library.md)  
**Status:** Pending  
**Timeline:** Week 3-4 of Q1 2026  
**Owner:** Development Team

## Goals

Build a comprehensive toast notification system that displays messages in configurable screen corners, manages multiple simultaneous toasts, and supports both auto-dismiss and manual interaction patterns.

## Success Criteria

- [ ] Toasts component displays notifications in 4 corners + center
- [ ] Queue management for multiple simultaneous toasts
- [ ] Auto-dismiss with configurable timeout
- [ ] Manual dismiss via keyboard (ESC or specific key)
- [ ] Different toast types (info, success, warning, error)
- [ ] Stacking/queueing behavior when multiple toasts active
- [ ] API documented with usage examples

## Tasks

### 1. Design Toast System Architecture
[task-o1p2q3r4-design-toast-system.md](task-o1p2q3r4-design-toast-system.md) ⏳

**Objective:** Define toast component and manager architecture

**Deliverables:**
- Toast component interface
- ToastManager for queue management
- Position and type enums
- Type definitions
- Usage examples

**Dependencies:** Phases 1-2 complete (foundation established)  
**Timeline:** 1 day

---

### 2. Implement Toast Component
[task-s5t6u7v8-implement-toast.md](task-s5t6u7v8-implement-toast.md) ⏳

**Objective:** Create individual toast notification component

**Deliverables:**
- Toast class implementing Component
- Support for different types (info/success/warning/error)
- Icon/color coding per type
- Configurable width
- Close button/indicator

**Dependencies:** Task 1  
**Timeline:** 2 days

---

### 3. Implement ToastManager
[task-w9x0y1z2-implement-toast-manager.md](task-w9x0y1z2-implement-toast-manager.md) ⏳

**Objective:** Create toast queue and positioning manager

**Deliverables:**
- ToastManager class for orchestration
- Queue management (FIFO)
- Position calculation for corners
- Auto-dismiss timers
- Max simultaneous toasts limit
- Stacking behavior

**Dependencies:** Task 2  
**Timeline:** 3 days

---

### 4. Add Toast Interaction Patterns
[task-a3b4c5d6-toast-interaction.md](task-a3b4c5d6-toast-interaction.md) ⏳

**Objective:** Implement keyboard interaction for toasts

**Deliverables:**
- ESC to dismiss topmost toast
- Number keys for quick dismiss (optional)
- Focus management when toasts present
- Action buttons in toasts (optional)

**Dependencies:** Task 3  
**Timeline:** 2 days

---

### 5. Test Toast System
[task-e7f8g9h0-test-toasts.md](task-e7f8g9h0-test-toasts.md) ⏳

**Objective:** Comprehensive testing of notification system

**Deliverables:**
- Test extension with all positions
- Multiple simultaneous toasts testing
- Auto-dismiss timing verification
- Queue overflow behavior
- Theme change testing
- Edge case testing

**Dependencies:** Tasks 2-4  
**Timeline:** 2 days

---

### 6. Document Toast System
[task-i1j2k3l4-document-toasts.md](task-i1j2k3l4-document-toasts.md) ⏳

**Objective:** Create API docs and integration guide

**Deliverables:**
- Toast API reference
- ToastManager API reference
- Usage patterns and examples
- Integration guide for extensions

**Dependencies:** Tasks 2-4  
**Timeline:** 1 day

## Technical Details

### Toast Component Design

```typescript
type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  type?: ToastType;          // Default: 'info'
  message: string;
  title?: string;
  duration?: number;         // ms, 0 for manual dismiss (default: 3000)
  icon?: string;             // Override default icon
  width?: number;            // Default: 40
  onDismiss?: () => void;
}

class Toast implements Component {
  constructor(options: ToastOptions);
  
  render(width: number): string[];
  handleInput(data: string): void;
  invalidate(): void;
  
  // Public API
  dismiss(): void;
  setMessage(message: string): void;
  getRemainingTime(): number;
}
```

**Visual Design:**

```
┌────────────────────────────────────┐
│ ℹ️  Info Toast                      │
│ This is an informational message   │
│                            [3s] [×] │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ✓ Success                          │
│ Operation completed successfully   │
│                            [2s] [×] │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ⚠ Warning                          │
│ Please review this action          │
│                            [5s] [×] │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ✗ Error                            │
│ Something went wrong               │
│                         [manual] [×]│
└────────────────────────────────────┘
```

**Type Styling:**

| Type | Icon | Color Theme |
|------|------|-------------|
| info | ℹ️ or (i) | accent |
| success | ✓ or (✓) | success/green |
| warning | ⚠ or (!) | warning/yellow |
| error | ✗ or (✗) | error/red |

### ToastManager Design

```typescript
type ToastPosition = 
  | 'top-left' | 'top-right' | 'top-center'
  | 'bottom-left' | 'bottom-right' | 'bottom-center'
  | 'center';

interface ToastManagerOptions {
  position?: ToastPosition;  // Default: 'top-right'
  maxToasts?: number;        // Default: 3
  spacing?: number;          // Lines between toasts (default: 1)
  queueMode?: 'stack' | 'replace' | 'queue';
}

class ToastManager {
  constructor(options?: ToastManagerOptions);
  
  // Public API
  show(options: ToastOptions): Toast;
  info(message: string, duration?: number): Toast;
  success(message: string, duration?: number): Toast;
  warning(message: string, duration?: number): Toast;
  error(message: string, duration?: number): Toast;
  
  dismiss(toast: Toast): void;
  dismissAll(): void;
  
  getActiveToasts(): Toast[];
  setPosition(position: ToastPosition): void;
  
  // Rendering
  render(terminalWidth: number, terminalHeight: number): {
    toasts: Component[];
    positions: { row: number; col: number }[];
  };
}
```

**Positioning Logic:**

```
Terminal (80×24):

TOP-LEFT:                                                    TOP-RIGHT:
┌─────────────┐                                       ┌─────────────┐
│ Toast 1     │                                       │ Toast 1     │
└─────────────┘                                       └─────────────┘
                            TOP-CENTER:
                         ┌─────────────┐
                         │ Toast 1     │
                         └─────────────┘


                           CENTER:
                         ┌─────────────┐
                         │ Toast 1     │
                         └─────────────┘


BOTTOM-LEFT:                                              BOTTOM-RIGHT:
┌─────────────┐                                       ┌─────────────┐
│ Toast 1     │                                       │ Toast 1     │
└─────────────┘                                       └─────────────┘
                         BOTTOM-CENTER:
                         ┌─────────────┐
                         │ Toast 1     │
                         └─────────────┘
```

**Stacking Behavior:**

When multiple toasts at same position:
- Stack vertically with spacing
- Newest on top (or bottom, configurable)
- Auto-scroll if exceeds maxToasts
- FIFO queue for pending toasts

### Integration with Pi-Mono

**Current State:**
- `ctx.ui.notify()` displays inline below chat
- New toasts would be separate/complementary

**Integration Strategy:**

```typescript
// Option 1: Extension adds toast manager to session
pi.onSessionStart(async (ctx) => {
  const toastManager = new ToastManager({ position: 'top-right' });
  ctx.session.details.toastManager = toastManager;
  
  // Render toasts as overlay
  ctx.ui.setWidget('toasts', (tui, theme) => {
    const { toasts, positions } = toastManager.render(tui.width, tui.height);
    // Return positioned components
  });
});

// Option 2: Use ctx.ui.custom() for each toast
const result = await ctx.ui.custom((tui, theme, kb, done) => {
  const toast = new Toast({ message: "Hello!", type: "info" });
  setTimeout(() => done(null), 3000);
  return toast;
}, { overlay: true });
```

## Key Challenges

### 1. Terminal Height Detection
Pi-mono overlay system may not provide terminal height. Solutions:
- Use TUI instance to get dimensions
- Assume reasonable default (24 lines)
- Test with various terminal sizes

### 2. Auto-Dismiss Timing
Need reliable timer management:
- SetTimeout for each toast
- Clear timers on manual dismiss
- Pause/resume on interaction (optional)

### 3. Multiple Overlays
Toasts compete with modals/sidebars:
- Coordinate z-index (overlay stack order)
- Toast manager aware of other overlays
- Graceful positioning when space limited

### 4. Performance
Many toasts with frequent updates:
- Efficient queue management
- Debounced rendering
- Proper cleanup of dismissed toasts

## Testing Strategy

### Test Cases

1. **Single Toast Tests**
   - Each position (7 positions)
   - Each type (4 types)
   - Auto-dismiss timing
   - Manual dismiss
   - Theme changes

2. **Multiple Toast Tests**
   - Stacking at same position
   - Different positions simultaneously
   - Queue overflow (exceed maxToasts)
   - Rapid succession (stress test)

3. **Interaction Tests**
   - ESC dismisses topmost
   - Number key selection
   - Toasts with modal/sidebar
   - Focus management

4. **Edge Cases**
   - Very long messages (truncation)
   - Very small terminal
   - Rapid theme changes
   - Timer edge cases (dismiss before timeout)

## Dependencies

- ✅ Phase 1 complete (Blanket, Modal)
- ✅ Phase 2 complete (positioning patterns)
- ✅ Overlay system
- ✅ Timer/timeout support in Node.js

## Next Phase

Phase 4 will focus on integration and documentation:
- Comprehensive example extension
- API documentation
- Visual test suite
- Component composition guide

---

**Created:** 2026-01-11  
**Last Updated:** 2026-01-11
