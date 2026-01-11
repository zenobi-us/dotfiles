# Architecture Overview

## Component Composition

This diagram shows how the responsive layout components compose together:

```
┌─────────────────────────────────────────────────────────────────┐
│ ResponsivePalette (Box)                                         │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Flex { mode: 'wrap', spacing: 2 }                           │ │
│ │                                                               │ │
│ │ ┌───────────────────────────────────────────────────────┐   │ │
│ │ │ Text: "🎨 Theme Palette (Responsive)"                 │   │ │
│ │ └───────────────────────────────────────────────────────┘   │ │
│ │                                                               │ │
│ │ ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │ │
│ │ │ ResponsiveGroup  │  │ ResponsiveGroup  │  │ Responsive │ │ │
│ │ │ preferredWidth:45│  │ preferredWidth:50│  │ Group   45 │ │ │
│ │ │                  │  │                  │  │            │ │ │
│ │ │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌────────┐ │ │
│ │ │ │ Grid         │ │  │ │ Grid         │ │  │ │ Grid   │ │ │
│ │ │ │ minCol: 40   │ │  │ │ minCol: 40   │ │  │ │ min:40 │ │ │
│ │ │ │              │ │  │ │              │ │  │ │        │ │ │
│ │ │ │ ┌──┐  ┌──┐  │ │  │ │ ┌──┐  ┌──┐  │ │  │ │ ┌──┐   │ │ │
│ │ │ │ │Ch│  │Ch│  │ │  │ │ │Ch│  │Ch│  │ │  │ │ │Ch│   │ │ │
│ │ │ │ └──┘  └──┘  │ │  │ │ └──┘  └──┘  │ │  │ │ └──┘   │ │ │
│ │ │ │ ┌──┐  ┌──┐  │ │  │ │ ┌──┐  ┌──┐  │ │  │ │ ┌──┐   │ │ │
│ │ │ │ │Ch│  │Ch│  │ │  │ │ │Ch│  │Ch│  │ │  │ │ │Ch│   │ │ │
│ │ │ │ └──┘  └──┘  │ │  │ │ └──┘  └──┘  │ │  │ │ └──┘   │ │ │
│ │ │ └──────────────┘ │  │ └──────────────┘ │  │ └────────┘ │ │
│ │ └──────────────────┘  └──────────────────┘  └────────────┘ │ │
│ │                                                               │ │
│ │ ┌──────────────────┐  ┌──────────────────┐                  │ │
│ │ │ ResponsiveGroup  │  │ ResponsiveGroup  │  (wraps to      │ │
│ │ │ preferredWidth:50│  │ preferredWidth:45│   next line)    │ │
│ │ └──────────────────┘  └──────────────────┘                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Extension API (pi)
    ↓
index.ts
    ↓ creates
ResponsivePalette
    ↓ creates
Flex (mode: wrap)
    ↓ contains
ResponsiveGroup[] 
    ↓ creates
Grid
    ↓ contains
Chip[]
```

## Component Responsibilities

### Extension Layer
- **index.ts**
  - Registers commands and keyboard shortcuts
  - Manages palette visibility state
  - Creates ResponsivePalette instance
  - Defines color data structure

### Layout Layer
- **ResponsivePalette**
  - Root container (Box)
  - Creates and manages Flex container
  - Handles title display
  - Manages group collection

- **ResponsiveGroup**
  - Group container (Box)
  - Creates and manages Grid container
  - Displays group title
  - Manages chip collection
  - Declares preferredWidth

### Layout Primitives
- **Flex**
  - Horizontal flow with wrapping
  - Respects preferredWidth hints
  - Two modes: wrap and fill
  - Handles spacing between items

- **Grid**
  - Equal-width column layout
  - Auto-calculates column count
  - Falls back to vertical stacking
  - Handles spacing between columns

- **Sized**
  - Wrapper to declare preferredWidth
  - Implements SizedComponent interface
  - Used by Flex for layout calculations

### Display Layer
- **Chip**
  - Displays color swatch
  - Shows color name
  - Shows description
  - Handles both fg and bg colors

## Rendering Flow

```
1. Terminal resize
        ↓
2. ResponsivePalette.render(width)
        ↓
3. Flex.render(width)
        ↓
4. For each ResponsiveGroup:
   - Calculate layout (wrap or fill)
   - Determine line breaks
        ↓
5. ResponsiveGroup.render(allocatedWidth)
        ↓
6. Grid.render(allocatedWidth)
        ↓
7. For each Chip:
   - Calculate column count
   - Distribute width
        ↓
8. Chip.render(columnWidth)
        ↓
9. Return string[] lines
```

## Type Definitions

```typescript
// Data structures
interface ChipData {
  name: string;
  description: string;
}

interface GroupData {
  title: string;
  chips: ChipData[];
  preferredWidth?: number;
}

interface PaletteData {
  title?: string;
  groups: GroupData[];
}

// Layout options
interface FlexOptions {
  mode?: 'fill' | 'wrap';
  spacing?: number;
}

interface GridOptions {
  spacing?: number;
  minColumnWidth?: number;
}

// Component interfaces
interface Component {
  render(width: number): string[];
  invalidate(): void;
}

interface SizedComponent extends Component {
  preferredWidth?: number;
}
```

## Responsive Breakpoints

The layout doesn't use explicit breakpoints but adapts continuously:

### Flex Wrapping
```typescript
// Wraps when: currentRowWidth + spacing + preferredWidth > availableWidth
if (spaceNeeded <= width) {
  // Add to current row
} else {
  // Wrap to next row
}
```

### Grid Columns
```typescript
// Columns: floor((width - spacing * (n-1)) / n)
// Falls back to vertical when: columnWidth < minColumnWidth
if (columnWidth < this.minColumnWidth) {
  return this.renderVertical(width);
}
```

## Extension Integration

```typescript
// Register extension
pi.registerCommand("theme-palette", {
  description: "Toggle theme palette",
  handler: async (_args, ctx) => {
    if (isVisible) {
      ctx.ui.setWidget("theme-palette-responsive", undefined);
    } else {
      ctx.ui.setWidget("theme-palette-responsive", (tui, theme) => {
        return new ResponsivePalette(theme, THEME_PALETTE_DATA);
      });
    }
  }
});
```

## State Management

```typescript
// Extension state
let isVisible = false;
let currentCtx: ExtensionContext | null = null;

// Component state
class ResponsivePalette {
  private groups: Group[] = [];      // Component instances
  private data: PaletteData;         // Data structure
  private flexLayout: Flex;          // Layout manager
}
```

## Performance Considerations

1. **Lazy Rendering**
   - Components only render when invalidated
   - Layout calculations happen on-demand

2. **Minimal Re-renders**
   - Only affected components re-render
   - Layout managers cache calculations

3. **Memory Efficiency**
   - Components stored as references
   - Data structures separated from display

4. **Terminal Integration**
   - Uses pi-tui's built-in optimization
   - Respects terminal capabilities

## Extension Points

Want to customize? You can:

1. **Change Layout**
   ```typescript
   palette.setLayoutMode('fill');  // Stretch groups
   ```

2. **Adjust Widths**
   ```typescript
   groups: [{ 
     title: "My Group",
     preferredWidth: 60,  // Wider
     chips: [...]
   }]
   ```

3. **Modify Grid**
   ```typescript
   new Grid({ 
     minColumnWidth: 30,  // More columns
     spacing: 1           // Tighter spacing
   })
   ```

4. **Create Custom Groups**
   ```typescript
   const group = new ResponsiveGroup(theme, {
     title: "Custom",
     chips: customChips,
     preferredWidth: 55
   });
   palette.addGroup(group);
   ```

## See Also

- **RESPONSIVE_LAYOUT.md** - Layout system details
- **SUMMARY.md** - Quick overview
- **components/example-responsive.ts** - Usage examples
- **README.md** - General extension documentation
