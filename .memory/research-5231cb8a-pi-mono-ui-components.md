# Research: Pi-Mono Custom UI Components

**Status:** Complete  
**Date:** 2026-01-11  
**Researcher:** Claude (Session 2026-01-11)

## Summary

Pi-mono provides a comprehensive TUI (Terminal User Interface) component system for building rich, interactive UI experiences in extensions. The system supports:

- **Custom components** with keyboard input handling
- **Built-in components** (Text, Box, Container, Markdown, Image, SelectList, SettingsList)
- **Overlay system** for modal-like dialogs that composite over base content
- **Keyboard-only interaction** (no mouse support currently)
- **Theme integration** with automatic invalidation on theme changes
- **Differential rendering** for performance

**Key Finding:** The system is keyboard-centric and does NOT currently support mouse interaction. All interaction is through keyboard input via the `handleInput()` method.

---

## 1. Capabilities and Richness of Interaction

### 1.1 Component Interface

All components must implement this interface:

```typescript
interface Component {
  render(width: number): string[];      // Return lines (max width)
  handleInput?(data: string): void;     // Optional keyboard handler
  wantsKeyRelease?: boolean;            // Opt-in for key release events
  invalidate(): void;                   // Clear cached state
}
```

**Source:** `@mariozechner/pi-tui/dist/tui.d.ts`

### 1.2 Built-in Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Text** | Multi-line text with word wrapping | Padding, background color, dynamic updates via `setText()` |
| **Box** | Container with padding/background | `addChild()`, `setBgFn()` for themed backgrounds |
| **Container** | Vertical component grouping | `addChild()`, `removeChild()`, `clear()` |
| **Spacer** | Empty vertical space | Simple spacing control |
| **Markdown** | Markdown rendering | Syntax highlighting, theme support, `setText()` for updates |
| **Image** | Image display | Base64 images, Kitty/iTerm2/Ghostty/WezTerm support |
| **SelectList** | Interactive selection UI | Filtering, scrolling, descriptions, selection callbacks |
| **SettingsList** | Toggle settings interface | Multiple values per setting, keyboard navigation |
| **BorderedLoader** | Loading spinner with cancel | AbortSignal support, escape to cancel |

**Source:** `docs/tui.md`

### 1.3 Keyboard Input Handling

Rich keyboard support via `matchesKey()` utility:

```typescript
import { matchesKey, Key } from "@mariozechner/pi-tui";

handleInput(data: string) {
  if (matchesKey(data, Key.up)) { /* arrow up */ }
  if (matchesKey(data, Key.enter)) { /* enter */ }
  if (matchesKey(data, Key.escape)) { /* escape */ }
  if (matchesKey(data, Key.ctrl("c"))) { /* ctrl+c */ }
  if (matchesKey(data, Key.ctrlShift("p"))) { /* ctrl+shift+p */ }
}
```

**Supported keys:**
- Basic: `enter`, `escape`, `tab`, `space`, `backspace`, `delete`, `home`, `end`
- Arrows: `up`, `down`, `left`, `right`
- Modifiers: `ctrl()`, `shift()`, `alt()`, combinations like `ctrlShift()`

**Key Release Events:** Components can opt-in via `wantsKeyRelease: true` (Kitty protocol)

**Source:** `docs/tui.md` (Keyboard Input section)

### 1.4 User Interaction APIs

Extensions have access to high-level UI methods:

```typescript
// Simple dialogs
const choice = await ctx.ui.select("Pick one:", ["A", "B", "C"]);
const ok = await ctx.ui.confirm("Delete?", "This cannot be undone");
const name = await ctx.ui.input("Name:", "placeholder");
const text = await ctx.ui.editor("Edit:", "prefilled text");
ctx.ui.notify("Done!", "info");  // "info" | "warning" | "error"

// Status and widgets
ctx.ui.setStatus("my-ext", "Processing...");  // Footer status
ctx.ui.setWidget("my-widget", ["Line 1"]);    // Above editor
ctx.ui.setFooter((tui, theme) => component);  // Custom footer

// Custom components
const result = await ctx.ui.custom((tui, theme, kb, done) => {
  return {
    render: (w) => component.render(w),
    invalidate: () => component.invalidate(),
    handleInput: (data) => { /* ... */ },
  };
});

// Custom editor
ctx.ui.setEditorComponent((tui, theme, kb) => new CustomEditor(theme, kb));

// Editor text manipulation
ctx.ui.setEditorText("new content");
```

**Source:** `docs/extensions.md` (Custom UI section)

---

## 2. Overlays

### 2.1 Overlay System Architecture

**Core Mechanism:** Overlays are components that composite over the base TUI content. The TUI maintains an overlay stack and composites them in order (later = on top).

```typescript
class TUI {
  showOverlay(component: Component, options?: {
    row?: number;      // Vertical position (default: centered)
    col?: number;      // Horizontal position (default: centered)
    width?: number;    // Override component width
  }): void;
  
  hideOverlay(): void;     // Hide topmost overlay
  hasOverlay(): boolean;   // Check if overlays exist
}
```

**Source:** `@mariozechner/pi-tui/dist/tui.d.ts`

### 2.2 Overlay Usage in Extensions

```typescript
pi.registerCommand("overlay-test", {
  handler: async (_args, ctx) => {
    const result = await ctx.ui.custom<ResultType>(
      (_tui, theme, _kb, done) => new MyOverlayComponent(theme, done),
      { overlay: true }  // ← Key option for overlay mode
    );
  }
});
```

**Source:** `examples/extensions/overlay-test.ts`

### 2.3 Overlay Compositing Algorithm

**Single-pass optimized compositing:**

1. Base content is rendered normally
2. Overlays render independently to their fixed width
3. Each overlay line is spliced into base content at `(row, col)` position
4. ANSI escape codes are properly handled during compositing
5. Overlays can exceed base content height (additional lines appended)

**Key Implementation Details:**
- Uses segment-based compositing to handle ANSI codes correctly
- Preserves styling across overlay boundaries
- Supports wide characters (CJK), emoji, and styled text
- Borders should align perfectly at boundaries

**Source:** `@mariozechner/pi-tui/dist/tui.d.ts`, `examples/extensions/overlay-test.ts`

### 2.4 Overlay Best Practices

**From overlay-test.ts example:**

```typescript
class OverlayComponent {
  readonly width = 70;  // Fixed width for consistent layout
  
  render(_width: number): string[] {
    const w = this.width;
    const innerW = w - 2;  // Account for borders
    
    // Use box-drawing characters for borders
    const row = (content: string) => 
      theme.fg("border", "│") + pad(content, innerW) + theme.fg("border", "│");
    
    lines.push(theme.fg("border", `╭${"─".repeat(innerW)}╮`));
    // ... content rows ...
    lines.push(theme.fg("border", `╰${"─".repeat(innerW)}╯`));
    
    return lines;
  }
}
```

**Edge Cases Tested:**
- Wide characters (中文日本語한글テスト)
- Styled text with multiple ANSI codes
- Emoji including compound emoji (👨‍👩‍👧‍👦 🇯🇵)
- Full-width content that tests border alignment

**Source:** `examples/extensions/overlay-test.ts`

---

## 3. Modals

### 3.1 Modal Pattern Definition

**Pi-mono does not have a dedicated "Modal" component.** Instead, modals are implemented using:

1. **Overlays** (`{ overlay: true }`) for visual presentation
2. **Focus management** to capture all input
3. **`ctx.ui.custom()`** for custom interaction logic
4. **Done callback** for completion

### 3.2 Modal Implementation Patterns

#### Pattern 1: Selection Dialog (SelectList)

```typescript
const result = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
  const container = new Container();
  
  container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
  container.addChild(new Text(theme.fg("accent", theme.bold("Title")), 1, 0));
  
  const selectList = new SelectList(items, maxVisible, {
    selectedPrefix: (t) => theme.fg("accent", t),
    selectedText: (t) => theme.fg("accent", t),
    description: (t) => theme.fg("muted", t),
    scrollInfo: (t) => theme.fg("dim", t),
    noMatch: (t) => theme.fg("warning", t),
  });
  
  selectList.onSelect = (item) => done(item.value);
  selectList.onCancel = () => done(null);
  
  container.addChild(selectList);
  container.addChild(new Text(theme.fg("dim", "↑↓ navigate • esc cancel"), 1, 0));
  container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
  
  return {
    render: (w) => container.render(w),
    invalidate: () => container.invalidate(),
    handleInput: (data) => { selectList.handleInput(data); tui.requestRender(); },
  };
});
```

**Source:** `docs/tui.md` (Pattern 1), `examples/extensions/preset.ts`

#### Pattern 2: Async Operation with Cancel

```typescript
const result = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
  const loader = new BorderedLoader(tui, theme, "Processing...");
  loader.onAbort = () => done(null);
  
  performAsyncWork(loader.signal)
    .then((data) => done(data))
    .catch(() => done(null));
  
  return loader;
});
```

**Source:** `docs/tui.md` (Pattern 2), `examples/extensions/qna.ts`, `examples/extensions/handoff.ts`

#### Pattern 3: Settings/Toggles

```typescript
await ctx.ui.custom((_tui, theme, _kb, done) => {
  const container = new Container();
  const settingsList = new SettingsList(
    items,
    maxVisible,
    getSettingsListTheme(),
    (id, newValue) => { /* handle change */ },
    () => done(undefined)  // On close
  );
  container.addChild(settingsList);
  return {
    render: (w) => container.render(w),
    invalidate: () => container.invalidate(),
    handleInput: (data) => settingsList.handleInput?.(data),
  };
});
```

**Source:** `docs/tui.md` (Pattern 3), `examples/extensions/tools.ts`

### 3.3 Modal Characteristics

| Characteristic | Implementation |
|----------------|----------------|
| **Visual presentation** | Overlay with borders (centered or positioned) |
| **Input capture** | Focus set to overlay component, receives all `handleInput` calls |
| **Dismissal** | Escape key typically calls `done(null)` |
| **Confirmation** | Enter/select calls `done(result)` |
| **Background** | Base content visible beneath overlay |
| **Stacking** | Multiple overlays stack (later on top) |

---

## 4. Mouse Interaction

### 4.1 Current State

**FINDING: Pi-mono does NOT currently support mouse interaction.**

**Evidence:**
1. Component interface only defines `handleInput(data: string)` for keyboard input
2. No mouse event types in the Component interface
3. TUI class has no mouse-related methods or event handlers
4. All examples use keyboard-only interaction
5. Documentation focuses exclusively on keyboard input via `matchesKey()`

**Source:** Analysis of `@mariozechner/pi-tui/dist/tui.d.ts`, `docs/tui.md`, all extension examples

### 4.2 Input Architecture

```typescript
interface Component {
  handleInput?(data: string): void;  // Receives raw terminal input
  wantsKeyRelease?: boolean;         // Opt-in for key release events
}
```

**Input Flow:**
1. Terminal emits raw input strings (ANSI sequences for special keys)
2. TUI forwards to focused component's `handleInput()`
3. Component uses `matchesKey()` to parse keyboard input
4. Component updates state and calls `tui.requestRender()`

**No mouse events** are part of this flow.

**Source:** `@mariozechner/pi-tui/dist/tui.d.ts`

### 4.3 Interaction Mechanisms

Since mouse is not supported, all interaction uses:

**Navigation:**
- Arrow keys (`up`, `down`, `left`, `right`)
- Vi-style (`h`, `j`, `k`, `l` in custom editors like modal-editor.ts)
- Page up/down, Home/End

**Selection:**
- Enter key to confirm
- Space to toggle
- Number keys for quick selection (in some components)

**Editing:**
- Character input (printable ASCII + Unicode)
- Backspace/Delete for deletion
- Left/Right for cursor movement
- Ctrl+combinations for shortcuts

**Dismissal:**
- Escape to cancel
- Ctrl+C for abort (in some contexts)
- Ctrl+D to exit

**Source:** `docs/tui.md`, `examples/extensions/modal-editor.ts`, `examples/extensions/snake.ts`

### 4.4 Potential for Future Mouse Support

**Technical Feasibility:**

Terminal mouse support is possible via:
- SGR mouse tracking mode (`\x1b[?1006h`)
- Button events (press, release, drag)
- Scroll wheel events
- Position reporting

**Would require:**
1. Enable mouse tracking in terminal
2. Parse mouse event sequences in TUI
3. Extend Component interface with `handleMouseEvent?(event)` method
4. Coordinate transformations for overlay compositing
5. Hit testing for component boundaries

**Precedent:** Other TUI libraries support mouse (e.g., blessed, ink with mouse plugins)

**Current Status:** Not implemented, no indication of planned support in current API

---

## 5. Advanced Patterns and Best Practices

### 5.1 Theme Integration

**Critical Pattern: Rebuild on Invalidate**

Components that pre-bake theme colors must rebuild content when `invalidate()` is called:

```typescript
class GoodComponent extends Container {
  private message: string;
  private content: Text;

  constructor(message: string) {
    super();
    this.message = message;
    this.content = new Text("", 1, 0);
    this.addChild(this.content);
    this.updateDisplay();
  }

  private updateDisplay(): void {
    // Rebuild content with current theme
    this.content.setText(theme.fg("accent", this.message));
  }

  override invalidate(): void {
    super.invalidate();  // Clear child caches
    this.updateDisplay(); // Rebuild with new theme
  }
}
```

**When this matters:**
- Pre-baking theme colors with `theme.fg()` or `theme.bg()`
- Using `highlightCode()` which applies syntax colors
- Building child component trees with embedded theme colors

**Source:** `docs/tui.md` (Invalidation and Theme Changes section)

### 5.2 Performance Optimization

```typescript
class CachedComponent {
  private cachedWidth?: number;
  private cachedLines?: string[];

  render(width: number): string[] {
    if (this.cachedLines && this.cachedWidth === width) {
      return this.cachedLines;
    }
    // Compute lines...
    this.cachedWidth = width;
    this.cachedLines = lines;
    return lines;
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
  }
}
```

**Source:** `docs/tui.md` (Performance section)

### 5.3 Custom Editor Pattern

Replace the main input editor with custom implementation (e.g., vim mode):

```typescript
class VimEditor extends CustomEditor {
  private mode: "normal" | "insert" = "insert";
  
  handleInput(data: string): void {
    if (matchesKey(data, "escape")) {
      if (this.mode === "insert") {
        this.mode = "normal";
        return;
      }
      super.handleInput(data);  // Pass through for abort
      return;
    }
    
    if (this.mode === "normal") {
      // Vim commands
      switch (data) {
        case "i": this.mode = "insert"; return;
        case "h": super.handleInput("\x1b[D"); return;  // Left arrow
        // ...
      }
    } else {
      super.handleInput(data);  // Normal input in insert mode
    }
  }
}

ctx.ui.setEditorComponent((tui, theme, keybindings) =>
  new VimEditor(theme, keybindings)
);
```

**Key points:**
- Extend `CustomEditor` (not base `Editor`) to get app keybindings
- Call `super.handleInput(data)` for unhandled keys
- Factory pattern receives `tui`, `theme`, and `keybindings`

**Source:** `docs/tui.md` (Pattern 7), `examples/extensions/modal-editor.ts`

---

## 6. Common Component Examples

### 6.1 Interactive Game (Snake)

Full game implementation with:
- Custom rendering (game grid)
- Game loop with requestRender()
- Keyboard input (arrow keys)
- State persistence via session details
- High score tracking

**Source:** `examples/extensions/snake.ts`

### 6.2 Inline Text Inputs in Overlays

Overlay with editable text fields:
- Text cursor with reverse video (`\x1b[7m...\x1b[27m`)
- Per-field cursor tracking
- Navigation between fields
- Character input handling

**Source:** `examples/extensions/overlay-test.ts`

### 6.3 Custom Tool Rendering

Override how tool calls/results appear:

```typescript
pi.registerTool({
  // ...
  renderCall(args, theme) {
    return new Text(theme.fg("toolTitle", "my_tool"), 0, 0);
  },
  renderResult(result, options, theme) {
    return new Markdown(result.details.markdown, 0, 0, getMarkdownTheme());
  },
});
```

**Source:** `examples/extensions/todo.ts`, `docs/tui.md`

---

## 7. Limitations and Constraints

### 7.1 Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **No mouse support** | All interaction must be keyboard-driven | Design keyboard-first UIs with clear shortcuts |
| **Fixed width rendering** | Components must handle varying terminal widths | Use `truncateToWidth()`, responsive layouts |
| **Terminal-specific features** | Images only work in specific terminals | Feature detection, graceful degradation |
| **ANSI complexity** | Styling increases rendering complexity | Cache rendered output, use utilities |
| **Keyboard focus model** | Only one component receives input at a time | Clear focus indicators, escape to dismiss |

### 7.2 Line Width Constraint

**Critical:** Each line from `render()` must not exceed the `width` parameter.

```typescript
import { visibleWidth, truncateToWidth } from "@mariozechner/pi-tui";

render(width: number): string[] {
  return [truncateToWidth(this.text, width)];
}
```

Utilities:
- `visibleWidth(str)` - Display width (ignores ANSI codes)
- `truncateToWidth(str, width, ellipsis?)` - Truncate with optional ellipsis
- `wrapTextWithAnsi(str, width)` - Word wrap preserving ANSI codes

**Source:** `docs/tui.md` (Line Width section)

---

## 8. Available Resources

### 8.1 Documentation

| Resource | Location | Purpose |
|----------|----------|---------|
| **TUI Components** | `docs/tui.md` | Complete component system reference |
| **Extensions** | `docs/extensions.md` | Extension API and lifecycle |
| **Examples** | `examples/extensions/` | Working implementations |

### 8.2 Key Examples

| Example | Demonstrates |
|---------|-------------|
| `overlay-test.ts` | Overlay compositing, edge cases |
| `modal-editor.ts` | Custom editor implementation |
| `snake.ts` | Game loop, keyboard input, state |
| `preset.ts` | SelectList with DynamicBorder |
| `qna.ts` | BorderedLoader for async ops |
| `tools.ts` | SettingsList for toggles |
| `plan-mode.ts` | Status indicators, widgets |
| `custom-footer.ts` | Custom footer rendering |
| `question.ts` | `ctx.ui.select()` usage |

### 8.3 Package Structure

```
@mariozechner/pi-coding-agent
├── docs/
│   ├── tui.md              # Component system
│   ├── extensions.md       # Extension API
│   └── theme.md            # Theming system
├── examples/
│   └── extensions/         # Working examples
└── node_modules/
    └── @mariozechner/
        └── pi-tui/         # Component implementations
            └── dist/
                ├── tui.d.ts              # Core types
                ├── components/           # Built-in components
                │   ├── select-list.d.ts
                │   ├── settings-list.d.ts
                │   └── ...
                └── utils.d.ts            # Utilities
```

---

## 9. References and Sources

### Primary Sources

1. **TUI Documentation**  
   `/home/zenobius/.local/share/mise/installs/npm-mariozechner-pi-coding-agent/0.42.0/lib/node_modules/@mariozechner/pi-coding-agent/docs/tui.md`
   - Comprehensive component system documentation
   - Patterns and best practices
   - Credibility: 10/10 (Official documentation)

2. **TUI Type Definitions**  
   `/home/zenobius/.local/share/mise/installs/npm-mariozechner-pi-coding-agent/0.42.0/lib/node_modules/@mariozechner/pi-coding-agent/node_modules/@mariozechner/pi-tui/dist/tui.d.ts`
   - Component interface definition
   - TUI class API including overlay methods
   - Credibility: 10/10 (Source code)

3. **Extensions Documentation**  
   `/home/zenobius/.local/share/mise/installs/npm-mariozechner-pi-coding-agent/0.42.0/lib/node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
   - Extension API reference
   - User interaction methods
   - Credibility: 10/10 (Official documentation)

4. **Overlay Test Example**  
   `/home/zenobius/.local/share/mise/installs/npm-mariozechner-pi-coding-agent/0.42.0/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/overlay-test.ts`
   - Practical overlay implementation
   - Edge case testing
   - Credibility: 10/10 (Official example)

5. **Extension Examples Directory**  
   `/home/zenobius/.local/share/mise/installs/npm-mariozechner-pi-coding-agent/0.42.0/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/`
   - Multiple working implementations
   - Best practices demonstration
   - Credibility: 10/10 (Official examples)

### Analysis Methodology

1. Read official documentation (`tui.md`, `extensions.md`)
2. Examined TypeScript type definitions for Component interface
3. Analyzed multiple extension examples for practical patterns
4. Cross-referenced capabilities across documentation and code
5. Identified gaps (no mouse support) through absence in API

### Confidence Level

**Overall: 10/10**

- All findings based on official documentation and source code
- Multiple examples confirm patterns
- Type definitions provide definitive API surface
- No mouse support confirmed by comprehensive API review

---

## 10. Summary of Key Findings

### Capabilities ✅

1. **Rich keyboard interaction** with comprehensive key support
2. **Multiple built-in components** covering common UI patterns
3. **Custom component API** for any TUI use case
4. **Overlay system** for modal-like dialogs with compositing
5. **Theme integration** with automatic invalidation
6. **Performance optimization** via caching and differential rendering
7. **High-level UI APIs** (select, confirm, input, editor, notify)
8. **Custom editors** for replacing main input component

### Overlays ✅

1. **Centered or positioned** display
2. **Stacking support** (multiple overlays)
3. **Focus management** for input capture
4. **Compositing algorithm** handles ANSI, wide chars, emoji
5. **Used for modals** via `ctx.ui.custom({ overlay: true })`

### Modals ✅

1. **No dedicated Modal component** - use overlays + custom components
2. **Standard patterns** documented (SelectList, BorderedLoader, SettingsList)
3. **Completion via callbacks** (`done(result)`)
4. **Keyboard-driven** interaction

### Mouse Interaction ❌

1. **Not currently supported**
2. **All interaction is keyboard-only**
3. **No mouse events in Component interface**
4. **No terminal mouse tracking enabled**
5. **Technically feasible** but not implemented

---

## 11. Next Steps for Research

If extending this research:

1. **Performance characteristics** - Benchmark differential rendering
2. **Terminal compatibility** - Test across terminal emulators
3. **Accessibility** - Screen reader compatibility analysis
4. **Advanced patterns** - Game development, data visualization
5. **Mouse support proposal** - Design document for potential addition

---

**End of Research Document**
