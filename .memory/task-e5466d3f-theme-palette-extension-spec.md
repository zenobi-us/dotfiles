# Task: Theme Colour Palette Extension Specification

**Created:** 2026-01-11  
**Type:** Specification  
**Priority:** Medium  
**Status:** Ready for Implementation

## Objective

Create a comprehensive specification for a Pi extension that displays a sidebar widget containing:
1. A colour palette grid at the top showing all theme colours
2. A stack of widgets below showcasing each theme colour in context

This extension helps extension developers understand available theme colours and how they render in the TUI.

## Requirements

### Functional Requirements

1. **Sidebar Widget Display**
   - Show a persistent sidebar on the right side of the TUI
   - Display theme colours in an organized, scannable format
   - Update automatically when theme changes

2. **Colour Palette Grid**
   - Display all theme colours in a compact grid layout
   - Show colour names and visual samples
   - Group colours by category (UI, semantic, syntax)

3. **Colour Widget Stack**
   - Show individual widgets demonstrating each colour
   - Include hex/RGB values
   - Show colour in context (borders, backgrounds, text)

4. **User Interaction**
   - Toggle sidebar visibility with a command or shortcut
   - Copy colour values to clipboard
   - Optional: Filter colours by category

### Non-Functional Requirements

1. **Performance** - Minimal impact on TUI rendering
2. **Accessibility** - Clear visual hierarchy and readable labels
3. **Maintainability** - Well-structured code following Pi extension patterns
4. **Compatibility** - Work with all Pi themes

## Extension Structure

### File Organization

```
~/.pi/agent/extensions/theme-palette/
├── index.ts              # Main extension entry point
├── types.ts              # TypeScript types and interfaces
├── widgets.ts            # Widget components
├── utils.ts              # Colour utilities
└── README.md             # Extension documentation
```

### Dependencies

```json
{
  "name": "theme-palette",
  "version": "1.0.0",
  "dependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*",
    "@sinclair/typebox": "*"
  }
}
```

## Technical Design

### 1. Extension Entry Point (`index.ts`)

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { PaletteWidget } from "./widgets";

export default function (pi: ExtensionAPI) {
  let sidebarVisible = false;

  // Register command to toggle sidebar
  pi.registerCommand("theme-palette", {
    description: "Toggle theme colour palette sidebar",
    async execute(args, ctx) {
      if (!ctx.hasUI) {
        ctx.ui.notify("Theme palette requires interactive mode", "warning");
        return;
      }

      sidebarVisible = !sidebarVisible;
      
      if (sidebarVisible) {
        const theme = ctx.ui.getTheme(); // Need to determine correct method
        ctx.ui.setWidget("theme-palette", new PaletteWidget(theme));
        ctx.ui.notify("Theme palette visible", "info");
      } else {
        ctx.ui.removeWidget("theme-palette");
        ctx.ui.notify("Theme palette hidden", "info");
      }
    }
  });

  // Register keyboard shortcut
  pi.registerShortcut("ctrl+t p", {
    description: "Toggle theme palette",
    async execute(ctx) {
      // Delegate to command
      await pi.executeCommand("theme-palette", [], ctx);
    }
  });

  // Auto-show on startup (optional)
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.hasUI) {
      // Auto-show palette on startup
      sidebarVisible = true;
      const theme = ctx.ui.getTheme();
      ctx.ui.setWidget("theme-palette", new PaletteWidget(theme));
    }
  });
}
```

### 2. Type Definitions (`types.ts`)

```typescript
/**
 * Theme color information extracted from Pi's theme system
 */
export interface ThemeColor {
  /** Color name/key in theme */
  name: string;
  
  /** Display label for users */
  label: string;
  
  /** Color value (hex, rgb, or ANSI code) */
  value: string;
  
  /** Color category for grouping */
  category: "ui" | "semantic" | "syntax" | "other";
  
  /** Optional description of usage */
  description?: string;
}

/**
 * Grouped theme colors by category
 */
export interface ThemeColorGroups {
  ui: ThemeColor[];
  semantic: ThemeColor[];
  syntax: ThemeColor[];
  other: ThemeColor[];
}

/**
 * Widget rendering options
 */
export interface PaletteWidgetOptions {
  /** Show detailed color information */
  verbose?: boolean;
  
  /** Filter to specific category */
  filterCategory?: ThemeColor["category"];
  
  /** Maximum width for widget */
  maxWidth?: number;
}
```

### 3. Widget Components (`widgets.ts`)

```typescript
import type { Theme } from "@mariozechner/pi-tui";
import type { ThemeColor, ThemeColorGroups, PaletteWidgetOptions } from "./types";
import { extractThemeColors, groupColorsByCategory, formatColorValue } from "./utils";

/**
 * Main palette widget that displays color grid and individual color samples
 */
export class PaletteWidget {
  private theme: Theme;
  private colors: ThemeColorGroups;
  private options: PaletteWidgetOptions;

  constructor(theme: Theme, options: PaletteWidgetOptions = {}) {
    this.theme = theme;
    this.colors = groupColorsByCategory(extractThemeColors(theme));
    this.options = options;
  }

  /**
   * Render the complete widget
   */
  render(): string[] {
    const lines: string[] = [];
    
    // Header
    lines.push("╭─ Theme Color Palette ─────────╮");
    lines.push("│");
    
    // Color grid at top
    lines.push(...this.renderColorGrid());
    lines.push("│");
    lines.push("├───────────────────────────────┤");
    lines.push("│");
    
    // Individual color widgets
    if (this.options.filterCategory) {
      lines.push(...this.renderCategory(this.options.filterCategory));
    } else {
      lines.push(...this.renderCategory("ui"));
      lines.push(...this.renderCategory("semantic"));
      lines.push(...this.renderCategory("syntax"));
    }
    
    // Footer
    lines.push("│");
    lines.push("╰───────────────────────────────╯");
    
    return lines;
  }

  /**
   * Render compact color grid showing all colors
   */
  private renderColorGrid(): string[] {
    const lines: string[] = [];
    const gridWidth = 28; // Characters available inside box
    const colorBlockWidth = 4; // "█ " = 2 chars per color
    const colorsPerRow = Math.floor(gridWidth / colorBlockWidth);

    lines.push("│ Color Grid:");
    
    // Flatten all colors
    const allColors = [
      ...this.colors.ui,
      ...this.colors.semantic,
      ...this.colors.syntax,
      ...this.colors.other
    ];

    // Render in rows
    for (let i = 0; i < allColors.length; i += colorsPerRow) {
      const rowColors = allColors.slice(i, i + colorsPerRow);
      const colorBlocks = rowColors
        .map(c => this.applyColor("██", c.value))
        .join(" ");
      lines.push(`│  ${colorBlocks}`);
    }

    return lines;
  }

  /**
   * Render a specific category of colors
   */
  private renderCategory(category: ThemeColor["category"]): string[] {
    const lines: string[] = [];
    const colors = this.colors[category];
    
    if (colors.length === 0) return lines;

    // Category header
    const categoryLabel = category.toUpperCase();
    lines.push(`│ ${categoryLabel} Colors:`);
    lines.push("│");

    // Render each color
    for (const color of colors) {
      lines.push(...this.renderColorWidget(color));
    }

    lines.push("│");
    return lines;
  }

  /**
   * Render a single color widget
   */
  private renderColorWidget(color: ThemeColor): string[] {
    const lines: string[] = [];
    
    // Color name and sample
    const colorSample = this.applyColor("████", color.value);
    lines.push(`│  ${colorSample} ${color.label}`);
    
    // Color value
    if (this.options.verbose) {
      const formattedValue = formatColorValue(color.value);
      lines.push(`│    Value: ${formattedValue}`);
      
      if (color.description) {
        lines.push(`│    Use: ${color.description}`);
      }
    }

    return lines;
  }

  /**
   * Apply color to text using ANSI codes
   */
  private applyColor(text: string, colorValue: string): string {
    // This will need to integrate with Pi's theme system
    // For now, placeholder that shows the concept
    // Real implementation would use theme.colors[key] or similar
    return `\x1b[38;2;${this.hexToRgb(colorValue)}m${text}\x1b[0m`;
  }

  /**
   * Convert hex color to RGB values for ANSI
   */
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "255;255;255";
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r};${g};${b}`;
  }
}
```

### 4. Utility Functions (`utils.ts`)

```typescript
import type { Theme } from "@mariozechner/pi-tui";
import type { ThemeColor, ThemeColorGroups } from "./types";

/**
 * Extract all colors from a theme object
 * 
 * Note: This function needs to be implemented based on actual Theme structure
 * The exact properties will depend on how Pi exposes theme data
 */
export function extractThemeColors(theme: Theme): ThemeColor[] {
  const colors: ThemeColor[] = [];
  
  // This is a placeholder - actual implementation will need to:
  // 1. Access theme.colors or equivalent property
  // 2. Iterate through all color definitions
  // 3. Extract name, value, and categorize
  
  // Example structure (to be verified against actual Theme type):
  /*
  if (theme.colors) {
    for (const [key, value] of Object.entries(theme.colors)) {
      colors.push({
        name: key,
        label: formatLabel(key),
        value: value,
        category: categorizeColor(key),
        description: getColorDescription(key)
      });
    }
  }
  */
  
  return colors;
}

/**
 * Group colors by category
 */
export function groupColorsByCategory(colors: ThemeColor[]): ThemeColorGroups {
  return {
    ui: colors.filter(c => c.category === "ui"),
    semantic: colors.filter(c => c.category === "semantic"),
    syntax: colors.filter(c => c.category === "syntax"),
    other: colors.filter(c => c.category === "other")
  };
}

/**
 * Categorize a color based on its name
 */
function categorizeColor(colorName: string): ThemeColor["category"] {
  const name = colorName.toLowerCase();
  
  // UI colors
  if (name.includes("border") || 
      name.includes("background") || 
      name.includes("foreground") ||
      name.includes("panel") ||
      name.includes("sidebar")) {
    return "ui";
  }
  
  // Semantic colors
  if (name.includes("error") || 
      name.includes("warning") || 
      name.includes("info") ||
      name.includes("success") ||
      name.includes("danger")) {
    return "semantic";
  }
  
  // Syntax colors
  if (name.includes("keyword") || 
      name.includes("string") || 
      name.includes("comment") ||
      name.includes("function") ||
      name.includes("variable")) {
    return "syntax";
  }
  
  return "other";
}

/**
 * Format color name into readable label
 */
function formatLabel(colorName: string): string {
  return colorName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Get description for common color names
 */
function getColorDescription(colorName: string): string | undefined {
  const descriptions: Record<string, string> = {
    primaryBackground: "Main editor background",
    primaryForeground: "Main text color",
    accentColor: "Interactive elements",
    errorColor: "Error messages and indicators",
    warningColor: "Warning messages",
    successColor: "Success indicators",
    borderColor: "Panel and widget borders",
    // Add more as needed
  };
  
  return descriptions[colorName];
}

/**
 * Format color value for display
 */
export function formatColorValue(value: string): string {
  // Handle hex colors
  if (value.startsWith("#")) {
    const rgb = hexToRgb(value);
    return `${value} (RGB: ${rgb})`;
  }
  
  // Handle RGB colors
  if (value.startsWith("rgb")) {
    return value;
  }
  
  // Handle ANSI codes
  if (typeof value === "number") {
    return `ANSI ${value}`;
  }
  
  return value.toString();
}

/**
 * Convert hex to RGB string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "unknown";
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `${r}, ${g}, ${b}`;
}
```

## Implementation Details

### Accessing Theme Information

**Investigation Required:** The specification assumes theme information is accessible via:
- `ctx.ui.getTheme()` or similar method
- A `Theme` type from `@mariozechner/pi-tui` with a `colors` property

**Action Items:**
1. Examine Pi's TUI source code to determine actual theme access method
2. Review `tui.md` documentation for theme API details
3. Update implementation based on findings

### Widget Rendering Approach

Two possible approaches for sidebar rendering:

**Approach 1: Using `ctx.ui.setWidget()`**
```typescript
ctx.ui.setWidget("theme-palette", paletteLines);
```
- Simpler API
- Widget rendered as text lines
- May have limited positioning control

**Approach 2: Using `ctx.ui.custom()`**
```typescript
const result = await ctx.ui.custom((tui, theme, keybindings, done) => {
  return new PaletteSidebarComponent(theme);
});
```
- Full control over rendering
- Can handle keyboard input
- More complex implementation

**Recommendation:** Start with Approach 1 for MVP, migrate to Approach 2 if more control needed.

### Color Application

Colors need to be applied using ANSI escape codes. The extension should:

1. Extract theme color values (likely hex or RGB)
2. Convert to ANSI 24-bit color codes: `\x1b[38;2;R;G;Bm` (foreground) or `\x1b[48;2;R;G;Bm` (background)
3. Reset with `\x1b[0m` after colored text

Example:
```typescript
const red = "\x1b[38;2;255;0;0m";
const reset = "\x1b[0m";
const coloredText = `${red}ERROR${reset}`;
```

### State Management

The extension maintains minimal state:
- `sidebarVisible` - Boolean flag for sidebar visibility
- No need for session persistence (preference can be hardcoded or configured)

If future enhancements add user preferences:
```typescript
pi.on("session_start", async (_event, ctx) => {
  // Reconstruct preferences from session
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type === "custom" && entry.customType === "theme-palette-prefs") {
      sidebarVisible = entry.data.visible;
      // ... other preferences
    }
  }
});

// Save preferences
pi.appendEntry("theme-palette-prefs", { visible: sidebarVisible });
```

## User Interface Design

### Sidebar Layout

```
╭─ Theme Color Palette ─────────╮
│                                │
│ Color Grid:                    │
│  ██ ██ ██ ██ ██ ██ ██          │
│  ██ ██ ██ ██ ██ ██ ██          │
│  ██ ██ ██ ██ ██                │
│                                │
├───────────────────────────────┤
│                                │
│ UI Colors:                     │
│                                │
│  ████ Primary Background       │
│    Value: #1e1e1e (30,30,30)  │
│                                │
│  ████ Primary Foreground       │
│    Value: #d4d4d4 (212,212,212)│
│                                │
│ SEMANTIC Colors:               │
│                                │
│  ████ Error                    │
│  ████ Warning                  │
│  ████ Success                  │
│                                │
│ SYNTAX Colors:                 │
│                                │
│  ████ Keyword                  │
│  ████ String                   │
│  ████ Comment                  │
│                                │
╰───────────────────────────────╯
```

### Command Usage

```bash
# Toggle sidebar
/theme-palette

# Keyboard shortcut
Ctrl+T P
```

### Future Enhancements

1. **Copy to Clipboard**
   - Click or select a color to copy its value
   - Notify user with toast message

2. **Category Filtering**
   ```bash
   /theme-palette --category=ui
   /theme-palette --category=semantic
   ```

3. **Verbosity Control**
   ```bash
   /theme-palette --verbose    # Show detailed info
   /theme-palette --compact    # Minimal view
   ```

4. **Color Search**
   - Filter colors by name
   - Highlight matching colors

5. **Live Preview**
   - Show how colors look in different contexts
   - Sample text with each color applied

## Testing Plan

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Command `/theme-palette` toggles sidebar
- [ ] Keyboard shortcut `Ctrl+T P` works
- [ ] Sidebar displays on startup (if enabled)
- [ ] All theme colors appear in grid
- [ ] Colors are grouped correctly by category
- [ ] Color values are formatted properly
- [ ] ANSI codes render colors correctly
- [ ] Sidebar doesn't interfere with main TUI
- [ ] Works in different terminal emulators
- [ ] Works with different Pi themes
- [ ] No errors in print mode (`pi -p`)
- [ ] Graceful degradation when UI unavailable

### Theme Compatibility Testing

Test with various themes:
- [ ] Default light theme
- [ ] Default dark theme
- [ ] Custom themes (if available)
- [ ] High contrast themes

### Edge Cases

- [ ] Empty theme (no colors defined)
- [ ] Theme with non-standard color format
- [ ] Very large number of colors
- [ ] Terminal with limited color support

## Documentation

### README.md

```markdown
# Theme Colour Palette Extension

A Pi extension that displays all available theme colours in a sidebar widget.

## Features

- 📊 **Color Grid** - Compact overview of all theme colors
- 🎨 **Categorized Display** - Colors grouped by UI, Semantic, and Syntax
- 🔍 **Detailed Information** - Hex and RGB values for each color
- ⌨️ **Keyboard Shortcut** - Quick toggle with Ctrl+T P

## Installation

1. Copy the `theme-palette` directory to `~/.pi/agent/extensions/`
2. Restart Pi or run `pi` with the extension loaded

## Usage

### Toggle Sidebar

```bash
/theme-palette
```

Or use the keyboard shortcut: `Ctrl+T P`

### Options (Future)

```bash
/theme-palette --category=ui      # Show only UI colors
/theme-palette --verbose          # Show detailed information
```

## Development

### Project Structure

- `index.ts` - Main extension entry point
- `widgets.ts` - Widget rendering components
- `utils.ts` - Color extraction and formatting utilities
- `types.ts` - TypeScript type definitions

### Building

```bash
npm install
npm run build
```

## License

MIT
```

## Dependencies and Requirements

### Required Pi Features

The extension requires:
1. Access to theme information (colors, values)
2. Widget rendering API (`ctx.ui.setWidget()` or similar)
3. Command registration (`pi.registerCommand()`)
4. Keyboard shortcut registration (`pi.registerShortcut()`)
5. ANSI color support in terminal

### External Dependencies

None beyond Pi's own packages:
- `@mariozechner/pi-coding-agent`
- `@mariozechner/pi-tui`
- `@sinclair/typebox` (if command parameters needed)

## Open Questions

1. **Theme API Access** - What is the exact method to access theme information?
   - Need to examine Pi source code or ask maintainer
   
2. **Widget Positioning** - How to control sidebar position and size?
   - Default widget API may only support bottom/footer placement
   - May need custom UI component for true sidebar
   
3. **Color Format** - What format are theme colors stored in?
   - Hex strings (#RRGGBB)?
   - RGB objects ({ r, g, b })?
   - ANSI codes?
   
4. **Dynamic Updates** - Can the widget update when theme changes?
   - Need theme change event or polling mechanism
   
5. **Clipboard Access** - How to copy color values to clipboard?
   - May require external tool or OS-specific implementation

## Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
- [x] Design specification (this document)
- [ ] Research theme API access
- [ ] Implement basic widget rendering
- [ ] Add command registration
- [ ] Test with default themes

### Phase 2: Enhanced Display
- [ ] Add color grid at top
- [ ] Implement category grouping
- [ ] Add verbose mode with detailed info
- [ ] Improve visual layout

### Phase 3: Interactivity
- [ ] Add keyboard shortcut
- [ ] Implement category filtering
- [ ] Add clipboard support (if possible)
- [ ] Add color search/filter

### Phase 4: Polish
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Error handling
- [ ] Performance optimization

## Success Criteria

The extension will be considered successful when:

1. ✅ Sidebar displays all theme colors correctly
2. ✅ Colors are visually distinguishable with samples
3. ✅ Command and shortcut work reliably
4. ✅ Works with all Pi themes without errors
5. ✅ Minimal performance impact
6. ✅ Clear, helpful documentation
7. ✅ No crashes or errors in any mode

## References

- Pi Extensions Guide: `.memory/learning-76e583ca-pi-extensions-guide.md`
- Pi TUI Documentation: `tui.md` (in Pi repository)
- Extension Examples: `examples/extensions/` (in Pi repository)

## Notes

- This specification is a living document and should be updated as implementation reveals new requirements
- Theme API access is the critical unknown - implementation may need significant revision once actual API is discovered
- Consider reaching out to Pi maintainer for guidance on theme access patterns
