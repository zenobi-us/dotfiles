# Learning: Theme Widget Development Patterns

**Created:** 2026-01-11  
**Source:** Theme Palette Extension Development  
**Related Epic:** [epic-c2b8f4e6-theme-development-tools.md](epic-c2b8f4e6-theme-development-tools.md)

## Overview

This learning document captures patterns and best practices for building Pi extensions that use the theme system to create visual widgets. Extracted from building the theme-palette extension.

## Pattern 1: Accessing Theme in Extensions

### Basic Access Pattern

```typescript
import type { ExtensionAPI, Theme } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    // Access current theme
    const theme = ctx.ui.theme;
    
    // Use theme methods
    const styledText = theme.fg("accent", "Hello!");
  });
}
```

### Widget Factory Pattern

```typescript
// Widget factory receives theme automatically
ctx.ui.setWidget("my-widget", (tui: TUI, theme: Theme) => {
  return new MyWidget(tui, theme);
});
```

**Key Points:**
- Theme is always available via `ctx.ui.theme` in event handlers
- Widget factories receive theme as second parameter
- Theme is automatically updated when user switches themes
- No need to manually track theme changes

## Pattern 2: Component Implementation

### Minimal Component Interface

```typescript
import type { Component } from "@mariozechner/pi-tui";

class MyWidget implements Component {
  constructor(private tui: TUI, private theme: Theme) {}

  render(width: number): string[] {
    const lines: string[] = [];
    // Render logic here
    return lines;
  }

  invalidate(): void {
    // Called when component needs re-render
    // Often no-op for static widgets
  }

  dispose?(): void {
    // Optional: cleanup resources
  }
}
```

**Key Points:**
- `render(width)` must return array of strings
- Width is terminal width, use for responsive layout
- `invalidate()` required but can be no-op for static content
- `dispose()` optional, use for cleanup (timers, subscriptions, etc.)

## Pattern 3: Color Swatch Rendering

### Foreground Color Swatches

```typescript
// Simple block swatch
const swatch = theme.fg("accent", "██");

// Larger swatch
const swatch = theme.fg("success", "████");

// With border
const swatch = theme.fg("border", "│") + theme.fg("accent", "██") + theme.fg("border", "│");
```

### Background Color Swatches

```typescript
// Background color block
const swatch = theme.bg("selectedBg", "    ");  // 4 spaces

// Combined with text
const swatch = theme.bg("toolSuccessBg", " OK ");
```

**Key Points:**
- Use `██` (block characters) for solid color display
- Background swatches need spaces to show color
- Can combine fg and bg for complex rendering
- Unicode box drawing characters work well with theme colors

## Pattern 4: Categorized Display Layout

### Section Headers

```typescript
// Simple header
lines.push(theme.fg("accent", "══ Category Name ══"));

// With separator
lines.push(theme.fg("accent", "═══ Category Name ═══"));
lines.push("");  // Blank line for spacing

// Boxed header
lines.push(theme.fg("border", "╭" + "─".repeat(width - 2) + "╮"));
lines.push(theme.fg("border", "│") + " " + theme.fg("accent", "Category") + " ".repeat(width - 12) + theme.fg("border", "│"));
lines.push(theme.fg("border", "╰" + "─".repeat(width - 2) + "╯"));
```

### Color Entry Layout

```typescript
// Three-column layout: swatch + name + description
const swatch = theme.fg(colorName, "██");
const name = theme.fg("text", colorName.padEnd(20));
const description = theme.fg("dim", colorDescription);
lines.push(`  ${swatch} ${name} ${description}`);
```

**Key Points:**
- Use `padEnd()` for consistent column alignment
- Accent color for headers draws attention
- Border/dim colors for secondary elements
- Blank lines between sections improve readability

## Pattern 5: Widget State Management

### Persistent Visibility Pattern

```typescript
export default function (pi: ExtensionAPI) {
  let isVisible = false;
  let currentCtx: ExtensionContext | null = null;

  function showWidget(ctx: ExtensionContext) {
    if (!ctx.hasUI) return;
    ctx.ui.setWidget("my-widget", factory);
  }

  function hideWidget(ctx: ExtensionContext) {
    if (!ctx.hasUI) return;
    ctx.ui.setWidget("my-widget", undefined);
  }

  // Restore state on session start
  pi.on("session_start", async (_event, ctx) => {
    currentCtx = ctx;
    if (isVisible && ctx.hasUI) {
      showWidget(ctx);
    }
  });

  // Cleanup on shutdown
  pi.on("session_shutdown", async () => {
    if (currentCtx) {
      hideWidget(currentCtx);
    }
    isVisible = false;
    currentCtx = null;
  });
}
```

**Key Points:**
- Store visibility state at extension scope
- Check `ctx.hasUI` before showing widgets
- Restore state on session_start if needed
- Clean up on session_shutdown
- Store context reference for later use

## Pattern 6: Command + Keyboard Shortcut

### Dual Access Pattern

```typescript
// Toggle function (DRY)
function toggle(ctx: ExtensionContext) {
  if (!ctx.hasUI) return;
  
  isVisible = !isVisible;
  
  if (isVisible) {
    showWidget(ctx);
    ctx.ui.notify("Widget enabled", "info");
  } else {
    hideWidget(ctx);
    ctx.ui.notify("Widget disabled", "info");
  }
}

// Command
pi.registerCommand("my-widget", {
  description: "Toggle my widget display",
  handler: async (_args, ctx) => toggle(ctx),
});

// Keyboard shortcut
pi.registerShortcut("ctrl+shift+w", {
  description: "Toggle my widget",
  handler: async (ctx) => toggle(ctx),
});
```

**Key Points:**
- Extract toggle logic to separate function
- Both command and shortcut call same function
- Always check UI availability
- Provide user feedback via notifications
- Use descriptive keyboard shortcuts (avoid conflicts)

## Pattern 7: Error Handling

### Defensive UI Checks

```typescript
// Check UI availability
if (!ctx.hasUI) {
  ctx.ui.notify("This feature requires UI mode", "warning");
  return;
}

// Safe widget removal
function hideWidget(ctx: ExtensionContext) {
  if (!ctx.hasUI) return;
  try {
    ctx.ui.setWidget("my-widget", undefined);
  } catch (err) {
    console.error("Failed to hide widget:", err);
  }
}
```

**Key Points:**
- Always check `ctx.hasUI` before UI operations
- Use try-catch for widget operations
- Provide helpful error messages
- Fail gracefully in non-UI modes

## Complete Example: Theme Palette Widget

See the full implementation at:
- `~/.pi/agent/extensions/theme-palette/index.ts`

Key features demonstrated:
- Component-based widget rendering
- Categorized color display
- State persistence across sessions
- Command and keyboard shortcut
- Proper cleanup on shutdown
- Error handling for non-UI modes

## Color Usage Guidelines

### When to Use Each Color

**UI Colors:**
- `accent` - Headers, important elements, highlights
- `border` - Box borders, separators
- `text` - Primary readable content
- `muted` - Secondary text
- `dim` - Tertiary text, hints

**Semantic Colors:**
- `success` - Positive feedback, confirmations
- `error` - Error messages, warnings that need attention
- `warning` - Caution, non-critical warnings

**Tool Colors:**
- `toolTitle` - Section headers in tool output
- `toolOutput` - Tool result text
- `toolDiff*` - When showing code changes

**Special:**
- Use markdown colors (`md*`) for markdown-like formatting
- Use syntax colors (`syntax*`) for code highlighting
- Use thinking colors for AI-related UI elements

## Best Practices

1. **Responsive Width**: Use the `width` parameter in `render()` to adapt layout
2. **Consistent Spacing**: Use blank lines between sections
3. **Color Harmony**: Stick to theme colors; don't hardcode ANSI
4. **Alignment**: Use `padEnd()` for column alignment
5. **Unicode**: Box drawing characters (╭─╮│╰╯) work well
6. **Performance**: Static content = simple render, no invalidation needed
7. **Cleanup**: Always implement shutdown handler
8. **Feedback**: Notify users of state changes
9. **Accessibility**: Use descriptive text, not just colors
10. **Testing**: Test with different terminal widths

## Common Pitfalls

❌ **Don't:** Hardcode ANSI escape codes
✅ **Do:** Use theme methods

❌ **Don't:** Forget to check `ctx.hasUI`
✅ **Do:** Guard all UI operations

❌ **Don't:** Skip shutdown cleanup
✅ **Do:** Remove widgets and clear state

❌ **Don't:** Ignore terminal width
✅ **Do:** Use width parameter for layout

❌ **Don't:** Try to access raw hex/RGB values
✅ **Do:** Use visual swatches instead

## Related Documentation

- [Pi Extensions Guide](https://github.com/mariozechner/pi-coding-agent/blob/main/docs/extensions.md)
- [Pi TUI Documentation](https://github.com/mariozechner/pi-coding-agent/blob/main/docs/tui.md)
- Theme API: `dist/modes/interactive/theme/theme.d.ts`
- Extension API: `dist/core/extensions/types.d.ts`

## Next Steps

After building a theme widget, consider:
1. Adding keyboard navigation
2. Supporting theme switching
3. Adding filtering/search
4. Creating interactive components
5. Persisting user preferences
