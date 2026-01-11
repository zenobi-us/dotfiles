# Theme Palette Extension

Visual explorer for Pi theme colors to help extension developers understand the Pi theme system.

## Features

- **Visual Color Swatches**: See all theme colors rendered with actual ANSI codes
- **Categorized Display**: Colors organized by purpose (UI, semantic, markdown, syntax, etc.)
- **Descriptions**: Each color includes usage context
- **Toggle Command**: Easy show/hide with `/theme-palette`

## Installation

This extension is included in the Pi extensions package. It's automatically loaded when Pi starts.

## Usage

### Toggle the palette display

**Command:**
```bash
/theme-palette
```

**Keyboard Shortcut:**
- `Ctrl+Shift+T` - Toggle palette visibility

This will show/hide the palette widget in the sidebar.

## Color Categories

The palette displays colors in these categories:

1. **UI Colors** (7 colors) - Border variants, text, accents
2. **Semantic Colors** (3 colors) - Success, error, warning states
3. **Message Colors** (4 colors) - Different message types
4. **Tool Colors** (5 colors) - Tool UI and diffs
5. **Markdown Colors** (10 colors) - Markdown syntax highlighting
6. **Syntax Colors** (9 colors) - Programming language syntax
7. **Thinking Level Colors** (6 colors) - AI thinking visualization levels
8. **Background Colors** (6 colors) - All background colors
9. **Special Colors** (1 color) - Bash mode indicator

## Total Colors

- **41** foreground colors (ThemeColor)
- **6** background colors (ThemeBg)
- **47** total colors

## For Extension Developers

This palette is a reference tool for building your own extensions. When you need to style UI components, you can:

1. Open the palette with `/theme-palette`
2. Find the color that matches your use case
3. Use `theme.fg(colorName, text)` or `theme.bg(colorName, text)` in your extension

### Example

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    const theme = ctx.ui.theme;
    
    // Use colors from the palette
    const header = theme.fg("accent", "═══ My Widget ═══");
    const success = theme.fg("success", "✓ All good!");
    const warning = theme.fg("warning", "⚠ Be careful");
    
    ctx.ui.setWidget("my-widget", [header, success, warning]);
  });
}
```

## Implementation Details

- Uses `ctx.ui.setWidget()` to render the palette
- Implements the `Component` interface from `@mariozechner/pi-tui`
- Persists visibility state across sessions
- No external dependencies

## Related Documentation

- [Pi Extensions Guide](https://github.com/mariozechner/pi-coding-agent/blob/main/docs/extensions.md)
- [Pi TUI Documentation](https://github.com/mariozechner/pi-coding-agent/blob/main/docs/tui.md)
- Theme API: `@mariozechner/pi-coding-agent/dist/modes/interactive/theme/theme.d.ts`
