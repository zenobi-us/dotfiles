# Research: Pi Theme API Access

**Created:** 2026-01-11  
**Status:** Complete  
**Related Epic:** [epic-c2b8f4e6-theme-development-tools.md](epic-c2b8f4e6-theme-development-tools.md)

## Overview

This research document captures findings on how to access and use the Pi theme system from within extensions, specifically for building a theme palette visualization tool.

## Key Findings

### 1. Theme Access in Extensions

Extensions receive theme access through the `ExtensionUIContext` interface:

```typescript
interface ExtensionUIContext {
  // Current theme instance
  readonly theme: Theme;
  
  // Get all available themes
  getAllThemes(): { name: string; path: string | undefined }[];
  
  // Load a theme by name without switching
  getTheme(name: string): Theme | undefined;
  
  // Switch to a different theme
  setTheme(theme: string | Theme): { success: boolean; error?: string };
}
```

**Access patterns:**
- In event handlers: `ctx.ui.theme`
- Load theme by name: `ctx.ui.getTheme('dark')`
- List all themes: `ctx.ui.getAllThemes()`

### 2. Theme Type Structure

The `Theme` class provides color rendering methods:

```typescript
class Theme {
  // Foreground color methods
  fg(color: ThemeColor, text: string): string
  getFgAnsi(color: ThemeColor): string
  
  // Background color methods
  bg(color: ThemeBg, text: string): string
  getBgAnsi(color: ThemeBg): string
  
  // Text styling
  bold(text: string): string
  italic(text: string): string
  underline(text: string): string
  inverse(text: string): string
  strikethrough(text: string): string
  
  // Color mode
  getColorMode(): "truecolor" | "256color"
  
  // Special helpers
  getThinkingBorderColor(level: ThinkingLevel): (str: string) => string
  getBashModeBorderColor(): (str: string) => string
}
```

**Important:** The `Theme` class doesn't expose the raw color maps directly. Colors can only be accessed through the rendering methods (`fg()`, `bg()`, `getFgAnsi()`, `getBgAnsi()`).

### 3. Available Colors

#### ThemeColor (Foreground - 41 colors)

**UI Colors:**
- `accent`, `border`, `borderAccent`, `borderMuted`
- `text`, `muted`, `dim`

**Semantic Colors:**
- `success`, `error`, `warning`

**Message Colors:**
- `thinkingText`, `userMessageText`, `customMessageText`, `customMessageLabel`

**Tool Colors:**
- `toolTitle`, `toolOutput`
- `toolDiffAdded`, `toolDiffRemoved`, `toolDiffContext`

**Markdown Colors:**
- `mdHeading`, `mdLink`, `mdLinkUrl`
- `mdCode`, `mdCodeBlock`, `mdCodeBlockBorder`
- `mdQuote`, `mdQuoteBorder`, `mdHr`, `mdListBullet`

**Syntax Colors:**
- `syntaxComment`, `syntaxKeyword`, `syntaxFunction`
- `syntaxVariable`, `syntaxString`, `syntaxNumber`
- `syntaxType`, `syntaxOperator`, `syntaxPunctuation`

**Thinking Level Colors:**
- `thinkingOff`, `thinkingMinimal`, `thinkingLow`
- `thinkingMedium`, `thinkingHigh`, `thinkingXhigh`

**Special:**
- `bashMode`

#### ThemeBg (Background - 6 colors)

- `selectedBg`
- `userMessageBg`
- `customMessageBg`
- `toolPendingBg`
- `toolSuccessBg`
- `toolErrorBg`

### 4. Widget Rendering Patterns

Extensions can render custom UI components using `setWidget()`:

```typescript
// String array approach (simple)
ctx.ui.setWidget('my-widget', [
  'Line 1',
  'Line 2'
]);

// Component factory approach (advanced)
ctx.ui.setWidget('my-widget', (tui, theme) => {
  return {
    render(width: number): string[] {
      return [
        theme.fg('accent', '╭' + '─'.repeat(width-2) + '╮'),
        theme.fg('border', '│') + theme.fg('text', 'Content') + theme.fg('border', '│'),
        theme.fg('accent', '╰' + '─'.repeat(width-2) + '╯')
      ];
    },
    invalidate(): void {},
    dispose?(): void {}
  };
});
```

**Component interface:**
```typescript
interface Component {
  render(width: number): string[];
  invalidate(): void;
  dispose?(): void;
}
```

### 5. Color Categorization Strategy

For the theme palette, colors should be organized into logical categories:

1. **UI Elements** (7 colors)
   - Border variants, text, accents

2. **Semantic States** (3 colors)
   - Success, error, warning

3. **Messages & Roles** (4 colors)
   - Different message types

4. **Tool Display** (6 colors)
   - Tool UI and diffs

5. **Markdown Elements** (9 colors)
   - Markdown syntax highlighting

6. **Code Syntax** (9 colors)
   - Programming language syntax

7. **Thinking Levels** (6 colors)
   - AI thinking visualization

8. **Backgrounds** (6 colors)
   - All background colors

9. **Special** (1 color)
   - Bash mode

### 6. Challenges & Limitations

**Challenge:** Cannot access raw color values (hex/RGB) directly from Theme instance.

**Workaround options:**
1. Use `getFgAnsi()` and `getBgAnsi()` to get ANSI escape codes, then display colored blocks
2. Show color names with rendered samples instead of raw values
3. For true hex/RGB display, would need to access theme JSON files directly

**Recommendation:** Focus on visual color swatches using ANSI codes rather than displaying hex values. The visual representation is more useful for developers anyway.

## Implementation Approach

### Phase 1: MVP
1. Display all ThemeColor values with color swatches using `theme.fg(color, '██')`
2. Display all ThemeBg values with background swatches using `theme.bg(color, '  ')`
3. Group by category using dividers
4. Simple scrollable list widget

### Phase 2: Enhanced Display
1. Add color names beside swatches
2. Show usage context (e.g., "Used for markdown headings")
3. Add category headers with borders
4. Improve visual layout with spacing

### Phase 3: Interactivity
1. Toggle command to show/hide palette
2. Keyboard navigation between categories
3. Filter by category
4. Switch between themes to compare

## Example Code Pattern

```typescript
export default function (pi: ExtensionAPI) {
  let visible = false;

  pi.on("session_start", async (_event, ctx) => {
    if (visible) {
      showPalette(ctx);
    }
  });

  pi.registerCommand("theme-palette", {
    description: "Toggle theme palette display",
    handler: async (_args, ctx) => {
      visible = !visible;
      if (visible) {
        showPalette(ctx);
      } else {
        ctx.ui.setWidget('theme-palette', undefined);
      }
    }
  });

  function showPalette(ctx: ExtensionContext) {
    ctx.ui.setWidget('theme-palette', (tui, theme) => ({
      render(width: number): string[] {
        const lines: string[] = [];
        
        // UI Colors
        lines.push(theme.fg('accent', '═══ UI Colors ═══'));
        lines.push(theme.fg('accent', '██') + ' accent');
        lines.push(theme.fg('border', '██') + ' border');
        // ... more colors
        
        return lines;
      },
      invalidate(): void {},
      dispose(): void {}
    }));
  }
}
```

## Next Steps

1. Create extension directory structure
2. Implement basic widget with all colors listed
3. Add categorization and visual improvements
4. Add toggle command and keyboard shortcuts
5. Test with multiple themes

## References

- Type definitions: `dist/modes/interactive/theme/theme.d.ts`
- Extension API: `dist/core/extensions/types.d.ts`
- Example extensions: `examples/extensions/overlay-test.ts`
- Extension docs: `docs/extensions.md`
