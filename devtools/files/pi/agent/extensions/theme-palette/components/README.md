# Theme Palette Components

A set of reusable TUI components for displaying color palettes and themed content in Pi extensions.

## Architecture

The component hierarchy follows this structure:

```
Palette (Box + Container)
  └── Group[] (Box + Container)
        └── Chip[] (Box)
```

### Component Details

#### Chip
- **Purpose**: Display a single color with name and description
- **Base**: `Box` (no border or background styling)
- **Content**: Color swatch + name (padded) + description
  - Foreground colors: Shows `██` (2 blocks) in the color
  - Background colors: Shows `    ` (4 spaces) with background color
  - Auto-detects background colors by name ending in "Bg"
- **API**: 
  - `setData(chipData)` - Update chip content
  - `getData()` - Get current chip data

#### Group
- **Purpose**: Group related chips under a titled section with border
- **Base**: `Box` with `Container` for layout
- **Content**: Title + array of chips
- **Border**: Automatic border rendering via Box
- **API**:
  - `setData(groupData)` - Update entire group
  - `addChip(chipData)` - Add single chip
  - `removeChip(index)` - Remove chip by index
  - `clearChips()` - Remove all chips

#### Palette
- **Purpose**: Top-level component containing multiple groups
- **Base**: `Box` with `Container` for layout
- **Content**: Optional title + array of groups
- **Border**: Automatic border rendering via Box with accent color
- **API**:
  - `setData(paletteData)` - Update entire palette
  - `addGroup(groupData)` - Add single group
  - `removeGroup(index)` - Remove group by index
  - `clearGroups()` - Remove all groups
  - `getGroup(index)` - Get specific group
  - `getGroups()` - Get all groups

## Usage Examples

### Basic Palette

```typescript
import { Palette } from "./components/index.js";

const palette = new Palette(theme, {
  title: "My Color Palette",
  groups: [
    {
      title: "Primary Colors",
      chips: [
        { name: "accent", description: "Main accent color" },
        { name: "border", description: "Border color" },
      ]
    }
  ]
});

// Use in widget
ctx.ui.setWidget("my-palette", (tui, theme) => palette);
```

### Dynamic Updates

```typescript
// Add a new group dynamically
palette.addGroup({
  title: "Secondary Colors",
  chips: [
    { name: "muted", description: "Muted text" },
    { name: "dim", description: "Dimmed text" },
  ]
});

// Update existing group
const group = palette.getGroup(0);
if (group) {
  group.addChip({ name: "error", description: "Error state" });
}

// Clear all and start fresh
palette.clearGroups();
palette.setData(newPaletteData);
```

### Standalone Group

```typescript
import { Group } from "./components/index.js";

const group = new Group(theme, {
  title: "Semantic Colors",
  chips: [
    { name: "success", description: "Success state" },
    { name: "error", description: "Error state" },
    { name: "warning", description: "Warning state" },
  ]
});

// Render directly
const lines = group.render(80);
```

### Individual Chips

```typescript
import { Chip } from "./components/index.js";

const chip = new Chip(theme, {
  name: "accent",
  description: "Primary accent color"
});

// Update chip
chip.setData({
  name: "border",
  description: "Border color"
});
```

## Theme Integration

All components automatically respond to theme changes:

- `invalidate()` is called when theme updates
- Components rebuild their display with new theme colors
- No manual refresh needed

```typescript
// Theme change is automatic
pi.on("theme_changed", async (event, ctx) => {
  // Components will automatically invalidate and re-render
});
```

## Data Structures

### ChipData
```typescript
interface ChipData {
  name: string;        // Color name (e.g., "accent")
  description: string; // Description of purpose
}
```

### GroupData
```typescript
interface GroupData {
  title: string;       // Group title
  chips: ChipData[];   // Array of chips
}
```

### PaletteData
```typescript
interface PaletteData {
  title?: string;      // Optional palette title
  groups: GroupData[]; // Array of groups
}
```

## Styling

Components use these theme colors:

- **Group Titles**: `accent` color with `══` separators
- **Chip Names**: `text` color, padded to 20 characters
- **Chip Descriptions**: `dim` color
- **Color Swatches**: 
  - Foreground colors: `██` (2 blocks) via `theme.fg(name)`
  - Background colors: `    ` (4 spaces) via `theme.bg(name)`
  - Auto-detection: Colors ending in "Bg" use background rendering
- **Palette Header**: `accent` color with box-drawing borders (╭─╮ │ ╰─╯)

## Best Practices

### 1. Always invalidate after updates
```typescript
// Good
group.addChip(newChip);
group.invalidate(); // Handled internally

// Not needed - addChip calls invalidate
```

### 2. Use factory pattern for widgets
```typescript
// Good - new instance per render
ctx.ui.setWidget("palette", (tui, theme) => {
  return new Palette(theme, data);
});

// Bad - shared instance across themes
const palette = new Palette(theme, data);
ctx.ui.setWidget("palette", () => palette);
```

### 3. Handle theme changes
```typescript
class MyComponent {
  constructor(private theme: Theme) {
    this.updateDisplay();
  }

  private updateDisplay(): void {
    // Rebuild with current theme
    this.palette = new Palette(this.theme, this.data);
  }

  invalidate(): void {
    this.updateDisplay(); // Rebuild on theme change
  }
}
```

### 4. Pad color names consistently
```typescript
// All chips in a group should use same padding
const chips = colors.map(c => ({
  name: c.name,
  description: c.desc
}));
// Chip component handles padding internally (20 chars)
```

## Migration from Legacy Code

### Before (inline rendering)
```typescript
render(width: number): string[] {
  const lines: string[] = [];
  
  lines.push(th.fg("accent", "══ UI Colors ══"));
  for (const color of THEME_COLORS.ui) {
    const swatch = th.fg(color.name as any, "██");
    const name = th.fg("text", color.name.padEnd(20));
    const desc = th.fg("dim", color.description);
    lines.push(`  ${swatch} ${name} ${desc}`);
  }
  
  return lines;
}
```

### After (component-based)
```typescript
const palette = new Palette(theme, {
  groups: [
    {
      title: "UI Colors",
      chips: THEME_COLORS.ui.map(c => ({
        name: c.name,
        description: c.description
      }))
    }
  ]
});

return palette.render(width);
```

## Testing

Components can be tested independently:

```typescript
import { Chip, Group, Palette } from "./components/index.js";

// Test chip rendering
const chip = new Chip(mockTheme, {
  name: "accent",
  description: "Test color"
});
const lines = chip.render(80);
assert(lines.length > 0);

// Test group
const group = new Group(mockTheme, {
  title: "Test Group",
  chips: [/* ... */]
});

// Test palette
const palette = new Palette(mockTheme, {
  title: "Test Palette",
  groups: [/* ... */]
});
```

## Performance

- Components cache render output until `invalidate()` is called
- Parent containers handle child invalidation automatically
- Theme changes trigger full re-render via invalidation chain
- No manual cache management needed

## Future Enhancements

Potential improvements:

1. **Interactive chips** - Click/select to copy color name
2. **Search/filter** - Filter chips by name/description
3. **Export** - Export palette data to JSON/file
4. **Custom themes** - Allow theme color overrides
5. **Backgrounds** - Add background color chips with `theme.bg()`
6. **Compact mode** - Condensed view with less spacing
7. **Grid layout** - Alternative to vertical stack
