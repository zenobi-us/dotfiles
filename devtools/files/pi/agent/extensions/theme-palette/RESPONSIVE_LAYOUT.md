# Theme Palette - Responsive Layout

This document describes the responsive layout system used in the theme-palette extension.

## Overview

The responsive layout uses three key components:

1. **Flex** - Flow layout with wrap or fill modes
2. **Grid** - Equal-width column layout with automatic fallback
3. **Sized** - Wrapper to declare preferred width for components

## Component Hierarchy

```
ResponsivePalette (Box)
└── Flex { mode: 'wrap' }
    ├── Text (Title)
    ├── ResponsiveGroup (Box) - preferredWidth: 45
    │   └── Grid { minColumnWidth: 40 }
    │       ├── Chip
    │       ├── Chip
    │       └── ...
    └── ResponsiveGroup (Box) - preferredWidth: 50
        └── Grid { minColumnWidth: 40 }
            └── ...
```

## Flex Component

**Purpose**: Arrange children horizontally with wrap or fill behavior.

**Modes**:
- `wrap`: Children flow horizontally and wrap to the next line when they exceed available width
- `fill`: Children evenly distribute to fill the entire row width

**Options**:
```typescript
{
  mode?: 'fill' | 'wrap',  // default: 'fill'
  spacing?: number          // default: 2
}
```

**When to use**:
- Use `wrap` when you want components to flow naturally and wrap
- Use `fill` when you want components to stretch and fill available space

**Example**:
```typescript
const flex = new Flex({ mode: 'wrap', spacing: 2 });
flex.addChild(component1);
flex.addChild(component2);
```

## Grid Component

**Purpose**: Arrange children in equal-width columns that adjust to available width.

**Options**:
```typescript
{
  spacing?: number,        // default: 2
  minColumnWidth?: number  // default: 10
}
```

**Behavior**:
- Calculates how many equal-width columns fit in available width
- Each column gets: `floor((width - totalSpacing) / numChildren)`
- Falls back to vertical stacking if columns would be narrower than `minColumnWidth`

**When to use**:
- Use when you want items to be displayed in columns
- Works well for lists of similar items (like color chips)

**Example**:
```typescript
const grid = new Grid({ minColumnWidth: 40, spacing: 2 });
grid.addChild(chip1);
grid.addChild(chip2);
grid.addChild(chip3);
```

## Sized Component

**Purpose**: Declare a preferred width for a component in Flex layout.

**Constructor**:
```typescript
new Sized(component: Component, preferredWidth: number)
```

**Helper function**:
```typescript
sized(component: Component, width: number): SizedComponent
```

**When to use**:
- Wrap components that you add to a Flex container
- Helps Flex calculate optimal layout in both modes
- In `wrap` mode: component tries to render at this width
- In `fill` mode: used as minimum width, with extra space distributed

**Example**:
```typescript
const flex = new Flex({ mode: 'wrap' });
flex.addChild(sized(group1, 45));
flex.addChild(sized(group2, 50));
```

## Responsive Behavior

### Wide Terminal (120+ columns)

```
┌─────────────────────────────────────────────────────────────┐
│ [Group 1 - 45ch]  [Group 2 - 50ch]  [Group 3 - 45ch]       │
│   [Chip] [Chip]     [Chip] [Chip]     [Chip] [Chip]        │
│   [Chip] [Chip]     [Chip] [Chip]     [Chip] [Chip]        │
└─────────────────────────────────────────────────────────────┘
```

### Medium Terminal (80 columns)

```
┌──────────────────────────────────────┐
│ [Group 1 - 45ch]  [Group 2 - 50ch]  │
│   [Chip] [Chip]     [Chip]           │
│   [Chip] [Chip]     [Chip]           │
│                                       │
│ [Group 3 - 45ch]                     │
│   [Chip] [Chip]                      │
│   [Chip] [Chip]                      │
└──────────────────────────────────────┘
```

### Narrow Terminal (50 columns)

```
┌────────────────────┐
│ [Group 1]          │
│   [Chip]           │
│   [Chip]           │
│   [Chip]           │
│                    │
│ [Group 2]          │
│   [Chip]           │
│   [Chip]           │
│                    │
│ [Group 3]          │
│   [Chip]           │
│   [Chip]           │
└────────────────────┘
```

## Implementation Example

### Basic Usage

```typescript
import { ResponsivePalette } from './components/Palette-responsive.js';
import type { PaletteData } from './components/Palette-responsive.js';

const data: PaletteData = {
  title: "My Palette",
  groups: [
    {
      title: "UI Colors",
      preferredWidth: 45,
      chips: [
        { name: "accent", description: "Primary accent" },
        { name: "border", description: "Default border" },
      ]
    },
    {
      title: "Semantic",
      preferredWidth: 50,
      chips: [
        { name: "success", description: "Success state" },
        { name: "error", description: "Error state" },
      ]
    }
  ]
};

const palette = new ResponsivePalette(theme, data);
```

### Custom Layout

```typescript
import { Flex, Grid, sized } from './components/index.js';

// Create flex container
const flex = new Flex({ mode: 'wrap', spacing: 2 });

// Create groups with grids
const group1 = new Box();
const grid1 = new Grid({ minColumnWidth: 40, spacing: 2 });

// Add items to grid
grid1.addChild(chip1);
grid1.addChild(chip2);
group1.addChild(grid1);

// Add sized group to flex
flex.addChild(sized(group1, 45));
```

## Design Decisions

### Why Grid for Groups?

- Chips have consistent width requirements (swatch + name + description)
- Equal-width columns look cleaner than variable-width
- Automatic fallback to vertical stacking on narrow terminals

### Why Flex for Palette?

- Groups have different content densities (different number of chips)
- Wrapping behavior allows natural flow
- `preferredWidth` gives control over group sizing

### Why Sized Wrapper?

- Allows components to declare their natural width
- Flex can make better layout decisions
- Doesn't force all components to implement `preferredWidth` property

## Configuration Tips

### Adjusting Group Width

```typescript
{
  title: "My Group",
  preferredWidth: 60,  // Wider group for more chips per row
  chips: [...]
}
```

### Adjusting Grid Columns

```typescript
// Allow more columns by reducing minimum width
const grid = new Grid({ minColumnWidth: 30, spacing: 1 });

// Force wider columns
const grid = new Grid({ minColumnWidth: 50, spacing: 3 });
```

### Switching Flex Modes

```typescript
// Let groups wrap naturally
const palette = new ResponsivePalette(theme, data);
palette.setLayoutMode('wrap');

// Force groups to fill row
palette.setLayoutMode('fill');
```

## Testing Responsiveness

To test the responsive layout at different widths:

```bash
# Narrow terminal (50 columns)
pi --width 50

# Medium terminal (80 columns)  
pi --width 80

# Wide terminal (120 columns)
pi --width 120
```

Or resize your terminal window while the palette is visible.

## See Also

- `components/Flex.ts` - Flex component implementation
- `components/Grid.ts` - Grid component implementation
- `components/Sized.ts` - Sized component implementation
- `components/example-responsive.ts` - Full example usage
