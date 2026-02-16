---
id: 42c8d9e1
title: Pi-Subagents UI Patterns - Complete Reference
created_at: 2026-02-17
updated_at: 2026-02-17
status: completed
tags: [best-practices, ui-patterns, typescript, pi-extensions, reusable-code]
learned_from: [research-pi-subagents-overlay-patterns.md, epic-m0d3la1s-model-alias-manager-extension.md]
---

# Learning: Pi-Subagents UI Patterns - Complete Reference

## Summary

Comprehensive research on three critical UI capabilities from the pi-subagents project:
1. **Overlay Rendering** - Box drawing with borders and text centering
2. **Filter Searching & Modal Closing** - Fuzzy search with hierarchical escape behavior
3. **Scrollable Lists** - Viewport management with auto-scrolling cursor tracking

All patterns are **directly reusable** in new projects with TypeScript/Pi extensions.

---

## 1. Overlay Rendering (Borders & Centering)

### Core Pattern

Use Unicode box-drawing characters with theme colors to create professional-looking overlays.

**Files:** `render-helpers.ts` (primary source)

### Key Functions

#### `pad()` - String Width Normalization
```typescript
export function pad(s: string, len: number): string {
  const vis = visibleWidth(s);
  return s + " ".repeat(Math.max(0, len - vis));
}
```

**Purpose:** Accounts for ANSI color codes when calculating display width.
**Dependency:** `import { visibleWidth } from "@mariozechner/pi-tui"`

#### `row()` - Content with Side Borders
```typescript
export function row(content: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  return theme.fg("border", "│") + pad(content, innerW) + theme.fg("border", "│");
}
```

**Visual output:**
```
│ content padded to fit │
```

#### `renderHeader()` - Top Border with Centered Text
```typescript
export function renderHeader(text: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  const padLen = Math.max(0, innerW - visibleWidth(text));
  const padLeft = Math.floor(padLen / 2);
  const padRight = padLen - padLeft;
  return (
    theme.fg("border", "╭" + "─".repeat(padLeft)) +
    theme.fg("accent", text) +
    theme.fg("border", "─".repeat(padRight) + "╮")
  );
}
```

**Visual output:**
```
╭──────── Title ────────╮
```

**Centering Algorithm:**
- Total padding = `innerWidth - textWidth`
- Left padding = `floor(totalPad / 2)` → extra space on right for odd padding

#### `renderFooter()` - Bottom Border with Centered Text
```typescript
export function renderFooter(text: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  const padLen = Math.max(0, innerW - visibleWidth(text));
  const padLeft = Math.floor(padLen / 2);
  const padRight = padLen - padLeft;
  return (
    theme.fg("border", "╰" + "─".repeat(padLeft)) +
    theme.fg("dim", text) +
    theme.fg("border", "─".repeat(padRight) + "╯")
  );
}
```

**Visual output:**
```
╰── [enter] close  [esc] back ─╯
```

### Theme Colors

```typescript
theme.fg("border", "╭─╮│╰╯")  // Box drawing characters
theme.fg("accent", "Title")    // Header text
theme.fg("dim", "help text")   // Footer/muted text
```

### Complete Modal Template

```typescript
const lines: string[] = [];
const width = 80;

// Header
lines.push(renderHeader(" 🔧 Settings ", width, theme));

// Empty spacer
lines.push(row("", width, theme));

// Content
lines.push(row(" • Option 1: Enabled ", width, theme));
lines.push(row(" • Option 2: Disabled ", width, theme));

// Empty spacer
lines.push(row("", width, theme));

// Footer
lines.push(renderFooter(" [↑↓] navigate  [enter] select  [esc] close ", width, theme));

return lines;
```

---

## 2. Filter Searching & Modal Closing

### Fuzzy Search Algorithm

**File:** `render-helpers.ts`

The fuzzy filter uses scoring to rank matches by quality.

#### Scoring System

```typescript
function fuzzyScore(query: string, text: string): number {
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  
  // Substring match gets big bonus (100+ points)
  if (lt.includes(lq)) return 100 + (lq.length / lt.length) * 50;
  
  // Character-by-character matching
  let score = 0;
  let qi = 0;
  let consecutive = 0;
  
  for (let i = 0; i < lt.length && qi < lq.length; i++) {
    if (lt[i] === lq[qi]) {
      score += 10 + consecutive;  // Consecutive matches get bonus
      consecutive += 5;
      qi++;
    } else {
      consecutive = 0;  // Reset on break
    }
  }
  
  return qi === lq.length ? score : 0;  // Must match ALL query chars
}
```

#### Field Weighting

```typescript
export function fuzzyFilter<T extends { name: string; description: string; model?: string }>(
  items: T[],
  query: string
): T[] {
  const q = query.trim();
  if (!q) return items;
  
  return items
    .map((item) => ({
      item,
      score: Math.max(
        fuzzyScore(q, item.name) * 1.0,        // Full weight
        fuzzyScore(q, item.description) * 0.8, // 80% weight
        fuzzyScore(q, item.model ?? "") * 0.6  // 60% weight
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
```

**Weighting Strategy:**
- Name matches: 100% weight (most important)
- Description: 80% weight
- Model/category: 60% weight

### Example Scoring

```
Query: "clau"
Item: { name: "Claude Sonnet", model: "anthropic/claude-sonnet-4" }

Score breakdown:
- name "claude sonnet": substring match "clau" → 100 + bonus = ~125
- model contains "clau" → 100 + bonus = ~125 (×0.6 = 75)
Final: 125 (max)

Item: { name: "Custom Agent", model: "local-llama" }
- name "custom agent": char match c,l,a,u → score 10+10+10+10 = 40
- description/model: no match
Final: 40

Result: Claude ranks first ✓
```

### Keyboard Input Handling

#### Character Input (Build Filter)

```typescript
if (data.length === 1 && data.charCodeAt(0) >= 32) {
  state.filterQuery += data;
  state.cursor = 0;
  state.scrollOffset = 0;  // Reset viewport on filter change
  return;
}
```

#### Backspace (Remove from Filter)

```typescript
if (matchesKey(data, "backspace")) {
  if (state.filterQuery.length > 0) {
    state.filterQuery = state.filterQuery.slice(0, -1);
    state.cursor = 0;
    state.scrollOffset = 0;  // Reset viewport
  }
  return;
}
```

### Modal Closing Pattern (Hierarchical Escape)

**Escape Priority (Press Escape multiple times):**

1. **First Escape** - Clear filter if active
2. **Second Escape** - Clear selections if active  
3. **Third Escape** - Close modal and return action

```typescript
if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
  // Priority 1: Clear filter
  if (state.filterQuery.length > 0) {
    state.filterQuery = "";
    state.cursor = 0;
    state.scrollOffset = 0;
    return;  // Don't process further
  }
  
  // Priority 2: Clear selections
  if (state.selected.length > 0) {
    state.selected.length = 0;
    return;  // Don't process further
  }
  
  // Priority 3: Close modal
  return { type: "close" };
}
```

**Benefits:**
- Accidental escape doesn't immediately close modal
- Predictable behavior: filter → selections → close
- User can recover without reopening modal

---

## 3. Scrollable Lists with Viewport Management

### Core Viewport Logic

**File:** `agent-manager-list.ts`

#### Cursor Clamping (Auto-Scroll)

```typescript
const LIST_VIEWPORT_HEIGHT = 12;  // Configurable

function clampCursor(state: ListState, filtered: ListAgent[]): void {
  // Handle empty list
  if (filtered.length === 0) {
    state.cursor = 0;
    state.scrollOffset = 0;
    return;
  }

  // Clamp cursor to valid range
  state.cursor = Math.max(0, Math.min(state.cursor, filtered.length - 1));
  
  // Clamp scroll offset to valid range
  const maxOffset = Math.max(0, filtered.length - LIST_VIEWPORT_HEIGHT);
  state.scrollOffset = Math.max(0, Math.min(state.scrollOffset, maxOffset));

  // **Auto-scroll to keep cursor visible**
  if (state.cursor < state.scrollOffset) {
    // Cursor above viewport → scroll up
    state.scrollOffset = state.cursor;
  } else if (state.cursor >= state.scrollOffset + LIST_VIEWPORT_HEIGHT) {
    // Cursor below viewport → scroll down
    state.scrollOffset = state.cursor - LIST_VIEWPORT_HEIGHT + 1;
  }
}
```

**Key Insight:** Scroll position is calculated from cursor position, not the other way around.

#### Cursor Navigation

```typescript
if (matchesKey(data, "up")) {
  state.cursor -= 1;
  clampCursor(state, filtered);
}

if (matchesKey(data, "down")) {
  state.cursor += 1;
  clampCursor(state, filtered);
}
```

#### Rendering Viewport Slice

```typescript
const startIdx = state.scrollOffset;
const endIdx = Math.min(filtered.length, startIdx + LIST_VIEWPORT_HEIGHT);
const visible = filtered.slice(startIdx, endIdx);

for (const item of visible) {
  const isCursor = item === filtered[state.cursor];
  const cursorChar = isCursor ? theme.fg("accent", "▸") : " ";
  const name = isCursor ? theme.fg("accent", item.name) : item.name;
  
  lines.push(row(` ${cursorChar} ${name} `, width, theme));
}

// Pad remaining viewport
for (let i = visible.length; i < LIST_VIEWPORT_HEIGHT; i++) {
  lines.push(row("", width, theme));
}
```

### Scroll Indicator Helper

```typescript
export function formatScrollInfo(above: number, below: number): string {
  let info = "";
  if (above > 0) info += `↑ ${above} more`;
  if (below > 0) info += `${info ? "  " : ""}↓ ${below} more`;
  return info;
}

// Usage in footer
const above = state.scrollOffset;
const below = filtered.length - (state.scrollOffset + LIST_VIEWPORT_HEIGHT);
const scrollInfo = formatScrollInfo(above, below);
lines.push(renderFooter(scrollInfo, width, theme));
```

### State Structure

```typescript
interface ListState {
  cursor: number;           // Current selection index
  scrollOffset: number;     // First visible item index
  filterQuery: string;      // Search filter text
  selected: string[];       // Multi-select (optional)
}
```

### Advanced: Text Editor Viewport

For multi-line text editing, the implementation is more complex:

```typescript
interface TextEditorState {
  lines: string[];          // Content lines
  cursorLine: number;       // Which line
  cursorCol: number;        // Which column
  scrollOffset: number;     // Top visible line
  selectedLines: Set<number>;
}

function getCursorDisplayPos(state: TextEditorState, width: number): { line: number; col: number } {
  // Position within viewport (used for rendering)
  return {
    line: state.cursorLine - state.scrollOffset,
    col: state.cursorCol,
  };
}

function ensureCursorVisible(state: TextEditorState, viewportHeight: number): void {
  // Scroll to make cursor visible
  if (state.cursorLine < state.scrollOffset) {
    state.scrollOffset = state.cursorLine;
  } else if (state.cursorLine >= state.scrollOffset + viewportHeight) {
    state.scrollOffset = state.cursorLine - viewportHeight + 1;
  }
}
```

**Features:**
- Column position is preserved when moving up/down
- Word navigation (Ctrl+Left/Right)
- Line navigation (Home/End/Ctrl+Home/Ctrl+End)

---

## Implementation Checklist

### For Overlay Modal with List

- [ ] Import `pad`, `row`, `renderHeader`, `renderFooter` from render-helpers
- [ ] Import `fuzzyFilter` for search
- [ ] Create component state: `cursor`, `scrollOffset`, `filterQuery`
- [ ] Implement `clampCursor()` function
- [ ] Add keyboard handlers: up/down, escape (3-level), char input, backspace
- [ ] Render: header → empty row → search input → list items → padding → footer
- [ ] Call `clampCursor()` after any state change
- [ ] Test filter clearing, cursor bounds, escape behavior

### For Search Filter

- [ ] Import `fuzzyFilter` from render-helpers
- [ ] Pass user's query to `fuzzyFilter(items, state.filterQuery)`
- [ ] Render filtered results (empty state if no matches)
- [ ] Reset cursor/scroll when filter changes

### For Scrollable Text Editor

- [ ] Implement `getCursorDisplayPos()` helper
- [ ] Implement `ensureCursorVisible()` for auto-scroll
- [ ] Handle line navigation (up/down preserve column)
- [ ] Handle word navigation (Ctrl+Left/Right)
- [ ] Handle selection (Shift+arrow)
- [ ] Sync display position from model position

---

## Reusable Code Locations

| Component | File | Lines | Reusability |
|-----------|------|-------|-------------|
| Border rendering | render-helpers.ts | 30-80 | ✅ Direct copy |
| Fuzzy filter | render-helpers.ts | 120-160 | ✅ Direct copy |
| List viewport | agent-manager-list.ts | 45-90 | ✅ Direct copy |
| Text editor | text-editor.ts | 100-200 | 🟡 Adapt to needs |
| Modal lifecycle | chain-clarify.ts | 150-180 | 🟡 Adapt to needs |

---

## Integration Notes

### With Pi Extensions

```typescript
// In your extension component
async render(ctx: ExtensionContext): Promise<void> {
  const result = await ctx.ui.custom<YourResult>(
    (tui, theme, kb, done) => 
      new YourModalComponent(tui, theme, data, done),
    { 
      overlay: true, 
      overlayOptions: { 
        anchor: "center", 
        width: 80,        // Adjust to content
        maxHeight: "80%"
      } 
    }
  );
}
```

### Theme Color Palette

Common color names available in Pi theme system:
- `border` - Box drawing
- `accent` - Highlights
- `dim` - Muted text
- `success`, `error`, `warning` - Status colors

---

## Performance Considerations

- **Filter updates**: O(n log n) due to sorting
- **Viewport rendering**: O(viewport height) not O(list size) ✅ Efficient
- **Cursor clamping**: O(1) operation
- **String padding**: Use `visibleWidth()` to account for ANSI codes

---

## Related Learnings

- [learning-432b51be-subagent-extension-architecture.md](learning-432b51be-subagent-extension-architecture.md) - Component lifecycle
- [learning-a9f4c2d1-subagent-management-patterns.md](learning-a9f4c2d1-subagent-management-patterns.md) - State management
- [research-pi-subagents-overlay-patterns.md](research-pi-subagents-overlay-patterns.md) - Original research

---

## Key Takeaways

1. **Overlay rendering is straightforward**: Use Unicode + theme colors for professional look
2. **Fuzzy search is smart**: Substring matches score high, fields weighted by importance
3. **Escape hierarchy is UX gold**: Filter → selections → close prevents accidents
4. **Viewport is simple math**: Clamp cursor, scroll follows cursor
5. **All patterns are reusable**: Copy render-helpers.ts and adapt viewport code directly

✅ Production-ready, tested in pi-subagents project.
