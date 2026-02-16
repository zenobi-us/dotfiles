---
id: m0d3st01
title: Full-Width Overlay with Alias List
created_at: 2026-02-16T20:31:00+10:30
updated_at: 2026-02-16T20:45:00+10:30
status: cancelled
epic_id: m0d3la1s
phase_id: m0d3ph01
priority: high
story_points: 5
research: research-pi-subagents-overlay-patterns.md
---

# Full-Width Overlay with Alias List

## User Story

As a **pi user**, I want to **open a full-width modal overlay showing all my model aliases** so that **I can quickly see and select which alias to configure**.

## Acceptance Criteria

- [ ] Modal overlay spans full terminal width
- [ ] Top and bottom borders using `─` character (themed with `border` color)
- [ ] No side borders (clean, minimal chrome)
- [ ] Title centered in top border with `accent` color
- [ ] Each alias displays as: `<accent>{name}</accent> - <muted>{provider}/{model}</muted>`
- [ ] Additional details: reasoning mode, context window, input types (muted)
- [ ] Alias list is navigable with arrow keys (up/down)
- [ ] Current selection shown with `▸` cursor in accent color
- [ ] Pressing Enter on an alias opens its settings view
- [ ] Pressing Escape closes the overlay
- [ ] Viewport scrolling with scroll indicators when list exceeds viewport

## Implementation Pattern (from pi-subagents)

### Render Helpers

```typescript
// Full-width header (adapted from pi-subagents renderHeader)
export function renderFullWidthHeader(text: string, width: number, theme: Theme): string {
  const padLen = Math.max(0, width - visibleWidth(text));
  const padLeft = Math.floor(padLen / 2);
  const padRight = padLen - padLeft;
  return (
    theme.fg("border", "─".repeat(padLeft)) +
    theme.fg("accent", text) +
    theme.fg("border", "─".repeat(padRight))
  );
}

// Full-width footer
export function renderFullWidthFooter(text: string, width: number, theme: Theme): string {
  const padLen = Math.max(0, width - visibleWidth(text));
  const padLeft = Math.floor(padLen / 2);
  const padRight = padLen - padLeft;
  return (
    theme.fg("border", "─".repeat(padLeft)) +
    theme.fg("dim", text) +
    theme.fg("border", "─".repeat(padRight))
  );
}
```

### List State Pattern

```typescript
interface ListState {
  cursor: number;
  scrollOffset: number;
}

const VIEWPORT_HEIGHT = 12;

function clampCursor(state: ListState, itemCount: number): void {
  state.cursor = Math.max(0, Math.min(state.cursor, itemCount - 1));
  const maxOffset = Math.max(0, itemCount - VIEWPORT_HEIGHT);
  state.scrollOffset = Math.max(0, Math.min(state.scrollOffset, maxOffset));
  
  if (state.cursor < state.scrollOffset) {
    state.scrollOffset = state.cursor;
  } else if (state.cursor >= state.scrollOffset + VIEWPORT_HEIGHT) {
    state.scrollOffset = state.cursor - VIEWPORT_HEIGHT + 1;
  }
}
```

### Overlay Invocation

```typescript
// No fixed width - uses full terminal width
const result = await ctx.ui.custom<AliasAction>(
  (tui, theme, kb, done) => new ModelAliasComponent(tui, theme, aliases, done),
  { overlay: true }
);
```

## Visual Reference

```
────────────────────────── Model Aliases ──────────────────────────────────────
                                                                               
▸ sonnet          anthropic/claude-sonnet-4     reasoning  ctx:200k  [user]   
  opus            anthropic/claude-opus-4       reasoning  ctx:200k  [user]   
  local-llama     ollama/llama3.1:8b            none       ctx:128k  [user]   
  gpt-fast        openai/gpt-4o-mini            none       ctx:128k  [user]   
                                                                               
───────────────────── [enter] edit  [n] new  [esc] close ──────────────────────
```

## Edge Cases

- **Empty alias list** - Show "No aliases configured. Press [n] to create one."
- **Very long names** - Truncate with ellipsis using `truncateToWidth()`
- **Many aliases** - Viewport scrolling, show `↑ N more` / `↓ N more` indicators
- **No valid models** - Still show alias, indicate model unavailable

## Out of Scope (Future Stories)

- Creating new aliases
- Deleting aliases  
- Reordering aliases
- Search/filter within the list

## Tasks

*(To be created during task breakdown)*
