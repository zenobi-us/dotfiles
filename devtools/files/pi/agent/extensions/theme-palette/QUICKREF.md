# Quick Reference Guide

## Installation

```bash
# Load the extension
pi -e /mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/pi/agent/extensions/theme-palette/index.ts
```

## Usage

### Commands
- `/theme-palette` - Toggle palette display

### Keyboard Shortcuts
- `Ctrl+Shift+T` - Toggle palette display

## Layout Components

### Flex
```typescript
import { Flex } from './components/index.js';

const flex = new Flex({ 
  mode: 'wrap',    // 'wrap' or 'fill'
  spacing: 2       // spacing between children
});

flex.addChild(component1);
flex.addChild(component2);
```

### Grid
```typescript
import { Grid } from './components/index.js';

const grid = new Grid({ 
  minColumnWidth: 40,  // minimum width per column
  spacing: 2           // spacing between columns
});

grid.addChild(chip1);
grid.addChild(chip2);
```

### Sized
```typescript
import { sized } from './components/index.js';

// Wrap a component to declare preferred width
const wrappedComponent = sized(myComponent, 45);

flex.addChild(wrappedComponent);
```

## Creating a Custom Palette

```typescript
import { ResponsivePalette } from './components/Palette-responsive.js';

const palette = new ResponsivePalette(theme, {
  title: "My Custom Palette",
  groups: [
    {
      title: "My Colors",
      preferredWidth: 50,
      chips: [
        { name: "accent", description: "Primary accent color" },
        { name: "success", description: "Success state" },
        { name: "error", description: "Error state" }
      ]
    }
  ]
});
```

## Customizing Groups

```typescript
// Add a new group
palette.addGroup({
  title: "New Group",
  preferredWidth: 45,
  chips: [
    { name: "custom", description: "Custom color" }
  ]
});

// Remove a group
palette.removeGroup(0);

// Clear all groups
palette.clearGroups();

// Get a specific group
const group = palette.getGroup(0);
```

## Customizing Chips

```typescript
const group = palette.getGroup(0);

// Add a chip
group.addChip({ 
  name: "newColor", 
  description: "New color description" 
});

// Remove a chip
group.removeChip(0);

// Clear all chips
group.clearChips();
```

## Layout Modes

```typescript
// Switch between wrap and fill modes
palette.setLayoutMode('wrap');  // Children wrap naturally
palette.setLayoutMode('fill');  // Children stretch to fill

// Get current mode
const mode = palette.getLayoutMode();
```

## Configuration Examples

### Wide Groups with Many Chips
```typescript
{
  title: "Wide Group",
  preferredWidth: 80,  // Wider to fit more content
  chips: [
    // Many chips will flow into multiple columns
  ]
}
```

### Narrow Groups with Few Chips
```typescript
{
  title: "Narrow Group",
  preferredWidth: 40,  // Just enough for content
  chips: [
    // Few chips in single column
  ]
}
```

### Adjust Grid Spacing
```typescript
// In Group-responsive.ts, modify:
this.gridLayout = new Grid({ 
  spacing: 1,          // Tighter spacing
  minColumnWidth: 30   // Allow more columns
});
```

## Testing Different Terminal Widths

```bash
# Test narrow
pi --width 50

# Test medium
pi --width 80

# Test wide
pi --width 120
```

## Common Patterns

### Single Column Layout
```typescript
// Force vertical stacking by using high minColumnWidth
const grid = new Grid({ minColumnWidth: 999 });
```

### Fixed Number of Columns
```typescript
// Not directly supported, but can calculate:
const desiredColumns = 3;
const spacing = 2;
const availableWidth = 120;
const minColWidth = Math.floor(
  (availableWidth - spacing * (desiredColumns - 1)) / desiredColumns
);
const grid = new Grid({ minColumnWidth: minColWidth });
```

### Full Width Components
```typescript
// Add component directly to flex (not sized)
flex.addChild(fullWidthComponent);
```

### Side-by-Side Groups
```typescript
// Use smaller preferredWidth values
groups: [
  { title: "Left", preferredWidth: 40, ... },
  { title: "Right", preferredWidth: 40, ... }
]
```

## Available Theme Colors

All colors from `@mariozechner/pi-coding-agent` Theme:

**UI Colors**: accent, border, borderAccent, borderMuted, text, muted, dim

**Semantic**: success, error, warning

**Messages**: thinkingText, userMessageText, customMessageText, customMessageLabel

**Tools**: toolTitle, toolOutput, toolDiffAdded, toolDiffRemoved, toolDiffContext

**Markdown**: mdHeading, mdLink, mdLinkUrl, mdCode, mdCodeBlock, mdCodeBlockBorder, mdQuote, mdQuoteBorder, mdHr, mdListBullet

**Syntax**: syntaxComment, syntaxKeyword, syntaxFunction, syntaxVariable, syntaxString, syntaxNumber, syntaxType, syntaxOperator, syntaxPunctuation

**Thinking**: thinkingOff, thinkingMinimal, thinkingLow, thinkingMedium, thinkingHigh, thinkingXhigh

**Backgrounds**: selectedBg, userMessageBg, customMessageBg, toolPendingBg, toolSuccessBg, toolErrorBg

**Special**: bashMode

## Troubleshooting

### Groups not wrapping
- Check `preferredWidth` - sum should exceed terminal width
- Verify Flex `mode` is set to `'wrap'`

### Chips stacking vertically
- Increase terminal width
- Decrease `minColumnWidth` in Grid
- Reduce number of chips per group

### Layout not updating
- Call `palette.invalidate()` after changes
- Ensure theme is properly passed to components

## File Structure

```
theme-palette/
├── index.ts                    # Main entry (responsive)
├── index-old.ts               # Original version
│
├── components/
│   ├── Flex.ts                # Flex layout
│   ├── Grid.ts                # Grid layout
│   ├── Sized.ts               # Width wrapper
│   ├── Group-responsive.ts    # Responsive group
│   ├── Palette-responsive.ts  # Responsive palette
│   └── Chip.ts                # Color chip display
│
└── docs/
    ├── ARCHITECTURE.md        # Architecture details
    ├── RESPONSIVE_LAYOUT.md   # Layout system docs
    ├── SUMMARY.md             # Overview
    └── QUICKREF.md            # This file
```

## Resources

- **ARCHITECTURE.md** - Complete architecture overview
- **RESPONSIVE_LAYOUT.md** - Detailed layout documentation
- **SUMMARY.md** - Project summary
- **example-responsive.ts** - Code examples
