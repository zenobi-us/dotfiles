# TUI: Overlay Basics

## Overlay Invocation

```typescript
const result = await ctx.ui.custom<ResultType | null>(
  (tui, theme, keybindings, done) => {
    // Return component interface
    return {
      render: (width: number) => string[],
      handleInput: (data: string) => void,
      invalidate: () => void,
    };
  },
  {
    overlay: true,
    overlayOptions: {
      anchor: "center",        // "center" | "top" | "bottom"
      width: 80,               // Fixed width or percentage
      maxHeight: "80%",        // Max height constraint
    },
  }
);
```

## Component Interface

```typescript
interface Component {
  render(width: number): string[];
  handleInput(data: string): void;
  invalidate(): void;
  dispose?(): void;
}
```

## Basic Overlay Structure

```typescript
import type { Theme } from "@mariozechner/pi-coding-agent";
import { matchesKey, visibleWidth } from "@mariozechner/pi-tui";

class SimpleOverlay {
  constructor(
    private theme: Theme,
    private done: (result: string | null) => void
  ) {}

  handleInput(data: string): void {
    if (matchesKey(data, "escape")) {
      this.done(null);
      return;
    }
    if (matchesKey(data, "return")) {
      this.done("confirmed");
      return;
    }
  }

  render(width: number): string[] {
    const th = this.theme;
    const w = Math.min(width - 4, 60);
    const innerW = w - 2;
    const lines: string[] = [];

    // Helper: pad string to width
    const pad = (s: string, len: number) => {
      const vis = visibleWidth(s);
      return s + " ".repeat(Math.max(0, len - vis));
    };

    // Helper: create bordered row
    const row = (content: string) => 
      th.fg("border", "│") + pad(content, innerW) + th.fg("border", "│");

    // Header
    lines.push(th.fg("border", "╭" + "─".repeat(innerW) + "╮"));
    lines.push(row(" " + th.fg("accent", "Title")));
    lines.push(row(""));

    // Content
    lines.push(row(" Some content here"));
    lines.push(row(""));

    // Footer
    lines.push(row(" " + th.fg("dim", "Enter confirm • Esc cancel")));
    lines.push(th.fg("border", "╰" + "─".repeat(innerW) + "╯"));

    return lines;
  }

  invalidate(): void {}
}
```

## Box Drawing Characters

```
╭──────────╮   Top corners + horizontal line
│  content │   Vertical sides
│          │
╰──────────╯   Bottom corners + horizontal line
```

Characters:
- `╭` top-left corner
- `╮` top-right corner
- `╰` bottom-left corner
- `╯` bottom-right corner
- `│` vertical line
- `─` horizontal line

## Theme Colors

```typescript
const th = this.theme;

// Semantic colors
th.fg("accent", "highlighted text")   // Bright, attention
th.fg("border", "│")                  // Box borders
th.fg("dim", "help text")             // De-emphasized
th.fg("muted", "secondary info")      // Less important
th.fg("warning", "warning message")   // Yellow/orange
th.fg("error", "error message")       // Red

// Backgrounds (for selection)
th.bg("accent", "selected item")      // Highlighted background
```

## Centered Header/Footer

```typescript
function renderHeader(text: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  const textWidth = visibleWidth(text);
  const padLen = Math.max(0, innerW - textWidth);
  const padLeft = Math.floor(padLen / 2);
  const padRight = padLen - padLeft;
  
  return (
    theme.fg("border", "╭" + "─".repeat(padLeft)) +
    theme.fg("accent", text) +
    theme.fg("border", "─".repeat(padRight) + "╮")
  );
}

// Usage: renderHeader(" My Title ", 80, theme)
// Result: ╭──────────────── My Title ────────────────╮
```

## Keyboard Input Handling

```typescript
import { matchesKey } from "@mariozechner/pi-tui";

handleInput(data: string): void {
  // Navigation
  if (matchesKey(data, "up")) { /* ... */ }
  if (matchesKey(data, "down")) { /* ... */ }
  if (matchesKey(data, "left")) { /* ... */ }
  if (matchesKey(data, "right")) { /* ... */ }
  
  // Actions
  if (matchesKey(data, "return") || matchesKey(data, "enter")) { /* ... */ }
  if (matchesKey(data, "escape")) { /* ... */ }
  if (matchesKey(data, "tab")) { /* ... */ }
  if (matchesKey(data, "backspace")) { /* ... */ }
  
  // Modifiers
  if (matchesKey(data, "ctrl+c")) { /* ... */ }
  if (matchesKey(data, "ctrl+s")) { /* ... */ }
  
  // Single character input
  if (data.length === 1 && data.charCodeAt(0) >= 32) {
    // Printable character
  }
}
```

## Width Calculation

Always use `visibleWidth()` for strings that may contain ANSI escape codes:

```typescript
import { visibleWidth } from "@mariozechner/pi-tui";

const text = theme.fg("accent", "colored text");
const actualWidth = visibleWidth(text);  // Returns 12, not 20+
```
