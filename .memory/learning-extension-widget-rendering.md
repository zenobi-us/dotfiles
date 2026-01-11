# Learning: Pi Extension Widget Rendering

**Created:** 2026-01-11  
**Source:** Theme Palette Extension Development  
**Related:** [learning-theme-widget-patterns.md](learning-theme-widget-patterns.md)

## Overview

Deep dive into the mechanics of rendering custom widgets in Pi extensions, covering the Component interface, rendering lifecycle, and advanced patterns.

## Widget Registration Methods

### Method 1: Simple String Array

```typescript
// Simplest form - static text
ctx.ui.setWidget("my-widget", [
  "Line 1",
  "Line 2",
  "Line 3"
]);

// With theme styling
ctx.ui.setWidget("my-widget", [
  theme.fg("accent", "Header"),
  theme.fg("text", "Content line 1"),
  theme.fg("dim", "Content line 2")
]);
```

**Use when:**
- Content is completely static
- No interactivity needed
- Simple text display

**Limitations:**
- No access to terminal width
- Can't update dynamically
- No lifecycle hooks

### Method 2: Component Factory

```typescript
// Component factory pattern
ctx.ui.setWidget("my-widget", (tui: TUI, theme: Theme) => {
  return new MyWidget(tui, theme);
});
```

**Use when:**
- Need responsive layout (terminal width)
- Want to update content dynamically
- Need lifecycle management
- Complex rendering logic

**Advantages:**
- Access to TUI instance
- Theme automatically provided
- Can implement dispose() for cleanup
- Width-aware rendering

## Component Interface Deep Dive

### Required Methods

```typescript
interface Component {
  // Called when widget needs to render
  render(width: number): string[];
  
  // Called when component should re-render
  invalidate(): void;
  
  // Optional: Called when widget is removed
  dispose?(): void;
}
```

### render(width: number)

**Purpose:** Generate visual output as array of strings

```typescript
render(width: number): string[] {
  const lines: string[] = [];
  
  // Width is terminal width - use it!
  const contentWidth = width - 4;  // Account for borders
  
  // Build each line
  lines.push(this.theme.fg("border", "╭" + "─".repeat(width - 2) + "╮"));
  lines.push(this.theme.fg("border", "│") + " Content ".padEnd(width - 2) + this.theme.fg("border", "│"));
  lines.push(this.theme.fg("border", "╰" + "─".repeat(width - 2) + "╯"));
  
  return lines;
}
```

**Key Points:**
- Each string is one terminal line
- Width parameter = current terminal width in characters
- Return empty array to show nothing
- ANSI codes don't count toward width
- Strings can include any valid terminal escape sequences

### invalidate()

**Purpose:** Signal that component needs re-render

```typescript
// For static widgets (no updates)
invalidate(): void {
  // No-op
}

// For dynamic widgets
invalidate(): void {
  // Trigger re-render
  // Pi handles the actual re-render
  this.needsUpdate = true;
}
```

**When it's called:**
- Terminal resize
- Theme change
- Manual invalidation request

**Common pattern for static widgets:**
```typescript
invalidate(): void {}  // Empty - static content
```

### dispose()

**Purpose:** Clean up resources when widget removed

```typescript
dispose(): void {
  // Clear timers
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
  }
  
  // Cancel pending requests
  this.abortController?.abort();
  
  // Release references
  this.cache = null;
}
```

**Use for:**
- Clearing intervals/timeouts
- Canceling async operations
- Releasing resources
- Cleanup event listeners

## Rendering Patterns

### Pattern: Responsive Width Layout

```typescript
render(width: number): string[] {
  const lines: string[] = [];
  
  // Calculate available space
  const borderWidth = 2;
  const padding = 2;
  const contentWidth = width - borderWidth - padding;
  
  // Truncate long text
  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + "...";
  };
  
  // Use content width for layout
  const title = truncate("My Widget", contentWidth);
  lines.push(this.theme.fg("accent", title));
  
  return lines;
}
```

### Pattern: Column Alignment

```typescript
render(width: number): string[] {
  const lines: string[] = [];
  
  // Fixed column widths
  const col1Width = 20;
  const col2Width = 30;
  const col3Width = width - col1Width - col2Width - 4;
  
  // Helper for column
  const col = (text: string, width: number) => {
    return text.padEnd(width).slice(0, width);
  };
  
  // Render rows
  for (const item of this.items) {
    const c1 = col(item.name, col1Width);
    const c2 = col(item.value, col2Width);
    const c3 = col(item.desc, col3Width);
    lines.push(`${c1} ${c2} ${c3}`);
  }
  
  return lines;
}
```

### Pattern: Bordered Box

```typescript
render(width: number): string[] {
  const lines: string[] = [];
  const th = this.theme;
  const innerWidth = width - 2;
  
  // Top border
  lines.push(th.fg("border", "╭" + "─".repeat(innerWidth) + "╮"));
  
  // Content with side borders
  const addRow = (content: string) => {
    const padded = content.padEnd(innerWidth).slice(0, innerWidth);
    lines.push(th.fg("border", "│") + padded + th.fg("border", "│"));
  };
  
  addRow(" " + th.fg("accent", "Title"));
  addRow("");
  addRow(" " + th.fg("text", "Content line 1"));
  addRow(" " + th.fg("text", "Content line 2"));
  
  // Bottom border
  lines.push(th.fg("border", "╰" + "─".repeat(innerWidth) + "╯"));
  
  return lines;
}
```

### Pattern: Scrollable List

```typescript
class ScrollableWidget implements Component {
  private scrollOffset = 0;
  private maxVisible = 10;
  
  render(width: number): string[] {
    const lines: string[] = [];
    
    // Calculate visible range
    const visibleItems = this.allItems.slice(
      this.scrollOffset,
      this.scrollOffset + this.maxVisible
    );
    
    // Render visible items
    for (const item of visibleItems) {
      lines.push(this.renderItem(item, width));
    }
    
    // Scroll indicator
    if (this.scrollOffset > 0) {
      lines.unshift(this.theme.fg("dim", "  ↑ More above"));
    }
    if (this.scrollOffset + this.maxVisible < this.allItems.length) {
      lines.push(this.theme.fg("dim", "  ↓ More below"));
    }
    
    return lines;
  }
  
  scrollUp(): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - 1);
    this.invalidate();
  }
  
  scrollDown(): void {
    const maxOffset = Math.max(0, this.allItems.length - this.maxVisible);
    this.scrollOffset = Math.min(maxOffset, this.scrollOffset + 1);
    this.invalidate();
  }
}
```

## Advanced Patterns

### Pattern: Dynamic Updates

```typescript
class LiveWidget implements Component {
  private data: any[] = [];
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(private tui: TUI, private theme: Theme) {
    // Start updates
    this.updateInterval = setInterval(() => {
      this.fetchData();
    }, 5000);
  }
  
  async fetchData(): Promise<void> {
    // Fetch new data
    this.data = await fetchSomething();
    // Trigger re-render
    this.invalidate();
  }
  
  render(width: number): string[] {
    // Render current data
    return this.data.map(item => 
      this.theme.fg("text", item.toString())
    );
  }
  
  invalidate(): void {
    // Signal Pi to re-render
  }
  
  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
```

### Pattern: Multi-Section Layout

```typescript
render(width: number): string[] {
  const lines: string[] = [];
  
  // Section 1
  lines.push(...this.renderHeader(width));
  lines.push("");
  
  // Section 2
  lines.push(...this.renderStats(width));
  lines.push("");
  
  // Section 3
  lines.push(...this.renderList(width));
  lines.push("");
  
  // Section 4 (footer)
  lines.push(...this.renderFooter(width));
  
  return lines;
}

private renderHeader(width: number): string[] {
  return [
    this.theme.fg("accent", "═".repeat(width)),
    this.theme.fg("accent", "  Header Title"),
    this.theme.fg("accent", "═".repeat(width))
  ];
}

private renderStats(width: number): string[] {
  return [
    this.theme.fg("text", `  Items: ${this.items.length}`),
    this.theme.fg("text", `  Updated: ${this.lastUpdate}`)
  ];
}
```

### Pattern: Conditional Rendering

```typescript
render(width: number): string[] {
  const lines: string[] = [];
  
  // Show loading state
  if (this.isLoading) {
    lines.push(this.theme.fg("dim", "  Loading..."));
    return lines;
  }
  
  // Show error state
  if (this.error) {
    lines.push(this.theme.fg("error", `  Error: ${this.error}`));
    return lines;
  }
  
  // Show empty state
  if (this.items.length === 0) {
    lines.push(this.theme.fg("muted", "  No items to display"));
    return lines;
  }
  
  // Show normal state
  for (const item of this.items) {
    lines.push(this.renderItem(item, width));
  }
  
  return lines;
}
```

## Performance Considerations

### Efficient String Building

```typescript
// ❌ Slow: many small concatenations
let line = "";
line += this.theme.fg("accent", "Part 1");
line += " ";
line += this.theme.fg("text", "Part 2");

// ✅ Fast: array join
const parts = [
  this.theme.fg("accent", "Part 1"),
  " ",
  this.theme.fg("text", "Part 2")
];
const line = parts.join("");
```

### Lazy Rendering

```typescript
render(width: number): string[] {
  // Only render visible portion
  if (!this.isVisible) {
    return [];
  }
  
  // Cache if expensive
  if (this.cachedLines && this.lastWidth === width) {
    return this.cachedLines;
  }
  
  const lines = this.generateLines(width);
  this.cachedLines = lines;
  this.lastWidth = width;
  
  return lines;
}
```

## Testing Widgets

### Manual Testing Approach

1. Load extension: `pi -e path/to/extension.ts`
2. Toggle widget: `/widget-command`
3. Resize terminal: check responsive behavior
4. Switch themes: verify colors update
5. Test cleanup: exit and restart

### Width Testing

```typescript
// Test with different widths
const testWidths = [40, 80, 120, 200];
for (const width of testWidths) {
  const lines = widget.render(width);
  console.log(`Width ${width}:`, lines);
}
```

## Common Issues & Solutions

### Issue: Content Overflow

```typescript
// Problem: content exceeds terminal width
lines.push("Very long line that overflows terminal width...");

// Solution: truncate or wrap
const maxLen = width - 4;
const truncated = line.length > maxLen 
  ? line.slice(0, maxLen - 3) + "..." 
  : line;
lines.push(truncated);
```

### Issue: ANSI Color Bleed

```typescript
// Problem: colors affect next line
lines.push(theme.fg("error", "Red text"));  // Color might bleed

// Solution: explicit reset or new color
lines.push(theme.fg("error", "Red text"));
lines.push(theme.fg("text", "Normal text"));  // Explicit color
```

### Issue: Alignment with Unicode

```typescript
// Problem: unicode characters have different widths
import { visibleWidth } from "@mariozechner/pi-tui";

// Solution: use visibleWidth for alignment
const text = "中文字";
const actualWidth = visibleWidth(text);  // Accounts for wide chars
const padding = " ".repeat(Math.max(0, targetWidth - actualWidth));
```

## Best Practices Summary

1. **Always use width parameter** - Don't hardcode layout widths
2. **Cache expensive renders** - Store results if render is slow
3. **Clean up resources** - Implement dispose() for timers/subscriptions
4. **Handle edge cases** - Empty state, error state, loading state
5. **Test at different widths** - 40, 80, 120, 200 columns
6. **Use theme colors consistently** - Don't mix hardcoded ANSI
7. **Provide visual feedback** - Loading indicators, error messages
8. **Keep render() fast** - Move expensive work to background
9. **Use helper functions** - DRY for repeated rendering patterns
10. **Document your widget** - Explain purpose and usage

## Reference Implementation

See the complete theme palette widget implementation:
- Code: `~/.pi/agent/extensions/theme-palette/index.ts`
- Documentation: `~/.pi/agent/extensions/theme-palette/README.md`

Demonstrates:
- Component-based rendering
- Responsive width handling
- Categorized multi-section layout
- Theme color usage
- State management
- Cleanup handling
