# Research: pi-subagents Overlay Modal Patterns

**Date:** 2026-02-16
**Source:** https://github.com/nicobailon/pi-subagents
**Related Epic:** epic-m0d3la1s-model-alias-manager-extension.md

## Overview

The pi-subagents project provides a clean, reusable pattern for creating overlay modals with box-drawing borders. The implementation separates rendering helpers from component logic.

## Key Files

### render-helpers.ts

Provides reusable render functions:

```typescript
import type { Theme } from "@mariozechner/pi-coding-agent";
import { visibleWidth } from "@mariozechner/pi-tui";

// Pad string to specified width
export function pad(s: string, len: number): string {
  const vis = visibleWidth(s);
  return s + " ".repeat(Math.max(0, len - vis));
}

// Create row with side borders │ content │
export function row(content: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  return theme.fg("border", "│") + pad(content, innerW) + theme.fg("border", "│");
}

// Top border with centered title ╭─ title ─╮
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

// Bottom border with centered text ╰─ help ─╯
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

// Fuzzy filter for search
export function fuzzyFilter<T extends { name: string; description: string; model?: string }>(
  items: T[], 
  query: string
): T[] {
  // ... scoring and filtering logic
}

// Scroll indicator text
export function formatScrollInfo(above: number, below: number): string {
  let info = "";
  if (above > 0) info += `↑ ${above} more`;
  if (below > 0) info += `${info ? "  " : ""}↓ ${below} more`;
  return info;
}
```

### Component Structure (agent-manager.ts)

The overlay is a class implementing `Component`:

```typescript
export class AgentManagerComponent implements Component {
  private overlayWidth = 84;
  private screen: ManagerScreen = "list";
  // ... state management

  constructor(
    private tui: TUI,
    private theme: Theme,
    private agentData: AgentData,
    private models: ModelInfo[],
    private skills: SkillInfo[],
    private done: (result: ManagerResult) => void
  ) {}

  handleInput(data: string): void {
    // Route to screen-specific handlers
    switch (this.screen) {
      case "list": /* ... */ break;
      case "detail": /* ... */ break;
      // etc.
    }
  }

  render(width: number): string[] {
    this.overlayWidth = Math.min(width, 84);
    switch (this.screen) {
      case "list": return renderList(/*...*/);
      case "detail": return renderDetail(/*...*/);
      // etc.
    }
  }

  invalidate(): void {}
  dispose(): void {}
}
```

### List Rendering Pattern (agent-manager-list.ts)

```typescript
export function renderList(
  state: ListState,
  agents: ListAgent[],
  width: number,
  theme: Theme
): string[] {
  const lines: string[] = [];
  
  // Header with counts
  lines.push(renderHeader(` Agents [user: ${userCount}] `, width, theme));
  lines.push(row("", width, theme)); // Empty line
  
  // Search input
  const cursor = theme.fg("accent", "│");
  const queryDisplay = state.filterQuery ? `${state.filterQuery}${cursor}` : cursor;
  lines.push(row(` ◎  ${queryDisplay}`, width, theme));
  lines.push(row("", width, theme));
  
  // List items with viewport scrolling
  const startIdx = state.scrollOffset;
  const endIdx = Math.min(filtered.length, startIdx + VIEWPORT_HEIGHT);
  
  for (const item of visible) {
    const cursorChar = isCursor ? theme.fg("accent", "▸") : " ";
    const nameText = isCursor ? theme.fg("accent", item.name) : item.name;
    const modelText = theme.fg("muted", item.model);
    
    lines.push(row(` ${cursorChar} ${nameText} - ${modelText}`, width, theme));
  }
  
  // Pad remaining viewport
  for (let i = visible.length; i < VIEWPORT_HEIGHT; i++) {
    lines.push(row("", width, theme));
  }
  
  // Footer with keybindings
  lines.push(renderFooter(" [enter] select  [esc] close ", width, theme));
  
  return lines;
}
```

### Overlay Invocation

```typescript
const result = await ctx.ui.custom<ManagerResult>(
  (tui, theme, kb, done) => new AgentManagerComponent(tui, theme, data, models, skills, done),
  { overlay: true, overlayOptions: { anchor: "center", width: 84, maxHeight: "80%" } }
);
```

## Adaptation for Full-Width Modal

For our model alias manager with **full-width, top/bottom borders only**:

### Modified render-helpers.ts

```typescript
// Full-width header (no side corners)
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

// Full-width footer (no side corners)
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

// Row without side borders (just padded content)
export function fullWidthRow(content: string, width: number): string {
  return pad(content, width);
}
```

### Visual Comparison

**pi-subagents style (fixed width, full box):**
```
╭─────────────────── Agents ───────────────────╮
│                                              │
│ ▸ sonnet - anthropic/claude-sonnet-4         │
│   opus - anthropic/claude-opus-4             │
│                                              │
╰──────── [enter] select  [esc] close ─────────╯
```

**Our full-width style (no side borders):**
```
──────────────────── Model Aliases ────────────────────────────────────────────
                                                                               
▸ sonnet          - anthropic/claude-sonnet-4                                  
  opus            - anthropic/claude-opus-4                                    
  local-llama     - ollama/llama3.1:8b                                         
                                                                               
──────────────────── [enter] edit  [esc] close ────────────────────────────────
```

## Key Patterns to Reuse

1. **State machine for screens** - `screen: "list" | "edit" | "picker"`
2. **Viewport scrolling** - Track `scrollOffset` and `cursor`, clamp on navigation
3. **Fuzzy filtering** - Reuse `fuzzyFilter()` for search
4. **Theme integration** - Use `theme.fg("accent", ...)`, `theme.fg("muted", ...)`, etc.
5. **Keyboard handling** - `matchesKey(data, "up")`, `matchesKey(data, "escape")`
6. **Action pattern** - Return action objects from input handlers

## Files to Create

```
extension/
├── index.ts              # Extension entry, register /model-alias command
├── render-helpers.ts     # Full-width border helpers
├── types.ts              # ModelAlias, ViewState, Action types
├── alias-list.ts         # List view rendering and input
├── alias-editor.ts       # Settings editor view
├── model-picker.ts       # Model selection view
└── component.ts          # Main component orchestrating views
```
