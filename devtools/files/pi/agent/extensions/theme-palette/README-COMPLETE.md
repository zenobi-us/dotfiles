# Theme Palette Extension - Complete Guide

## Overview

The theme-palette extension provides **two viewing modes** for exploring your theme colors:

1. **Traditional Palette** - Color swatches organized by category
2. **UI Simulator** - Realistic UI elements showing colors in context

## Quick Start

### Traditional Palette View

```bash
pi -e ~/.pi/agent/extensions/theme-palette/index.ts
/theme-palette
```

Shows color swatches with token names and descriptions.

### UI Simulator View (NEW!)

```bash
pi -e ~/.pi/agent/extensions/theme-palette/index-simulator.ts
/theme-simulator
```

Shows realistic buttons, messages, code blocks, alerts, and forms using your theme colors.

## What's New: UI Simulator

### Why?

Color swatches are great for **what** colors exist, but designers and developers need to see **how** to use them:

- ❌ `████ accent Primary action` (abstract)
- ✅ `║ Primary Action ║` (concrete button)

The UI Simulator bridges this gap by showing colors in **realistic UI contexts**.

### What You'll See

1. **🎯 Interactive Elements**
   - Buttons (primary/secondary/success/error/disabled)
   - Links and text buttons
   - Real hover and focus state styling

2. **💬 Message Bubbles**
   - User messages with `userMessageBg`
   - AI thinking states with `toolPendingBg`
   - System messages with `customMessageBg`
   - Shows elevation and depth through color

3. **💻 Code Blocks**
   - Full syntax highlighting palette
   - Git diffs (+/- lines with proper colors)
   - Comment hierarchy validation
   - Readability testing in context

4. **⚡ Alerts & Status**
   - Success/warning/error notifications
   - Thinking intensity progression (off → max)
   - Icon + text combinations
   - Status indicators

5. **📝 Form Elements**
   - Text inputs (normal/disabled/focus)
   - Checkboxes (checked/unchecked)
   - Validation hints and errors
   - Label and placeholder hierarchy

### View Modes

**Simulator Mode** (default)
```bash
/theme-simulator
```
Shows only UI simulations - best for understanding color usage.

**Both Mode** (split view)
```bash
/theme-simulator both
```
Shows compact palette on left, simulator on right - best for learning token names.

Switch between modes:
```bash
/theme-simulator-mode simulator
/theme-simulator-mode both
```

### Keyboard Shortcuts

- `Ctrl+Shift+T` - Toggle traditional palette
- `Ctrl+Shift+U` - Toggle UI simulator

## Documentation

### Getting Started
- **QUICKSTART-SIMULATOR.md** - 5-minute quick start guide
- **README-SIMULATOR.md** - Complete simulator usage documentation

### Visual Examples
- **EXAMPLE-VIEW.md** - ASCII art showing layouts and modes
- **SIMULATOR-SUMMARY.md** - Architecture and design philosophy

### Technical Details
- **ARCHITECTURE.md** - Component structure and layout system
- **DESIGN_HIERARCHY.md** - Four-level contrast hierarchy
- **RESPONSIVE_LAYOUT.md** - How Grid and Flex work

### Reference
- **QUICKREF.md** - Quick reference for all color tokens
- **SUMMARY.md** - Original palette view documentation

## File Structure

```
theme-palette/
├── index.ts                      # Traditional palette view
├── index-simulator.ts            # UI simulator view (NEW!)
│
├── components/
│   ├── Palette.ts                # Main palette container
│   ├── Group.ts                  # Color group component
│   ├── Chip.ts                   # Individual color chip
│   ├── UISimulator.ts            # UI element simulator (NEW!)
│   ├── Grid.ts                   # Equal-width columns
│   ├── Flex.ts                   # Responsive flow layout
│   ├── Sized.ts                  # Preferred width hints
│   └── Modal.ts                  # Modal container (unused)
│
└── docs/                         # All markdown documentation
```

## Benefits of UI Simulator

### 1. Contextual Understanding
See colors where they're actually used:
- Button backgrounds vs. text colors
- Message surfaces vs. message text
- Syntax tokens in real code
- Alert colors with icons

### 2. Hierarchy Validation
Test the four-level contrast system:
- **Primary** (`text`) - Main content stands out
- **Secondary** (`muted`) - Supporting text clear but subdued
- **Tertiary** (`dim`) - Hints visible but recede
- **Border** (`border`) - Subtle separation without distraction

### 3. Readability Testing
Verify actual readability:
- Code comments don't overpower code
- Form labels are clear
- Disabled states are obvious
- Links are discoverable

### 4. Design System Learning
Understand when to use each token:
- `accent` for primary actions (buttons)
- `success`/`error`/`warning` for alerts
- `dim` for disabled states
- `overlay-1` for subtle backgrounds

### 5. Elevation Through Color
See how depth is created:
- `base` - Default canvas
- `surface+1` - Elevated cards/panels
- `overlay-1` - Recessed backgrounds
- `userMessageBg` - Floating messages

## Architecture

### Built with pi-tui Components

From `@mariozechner/pi-tui`:
- **Container** - Vertical stacking layout
- **Box** - Surfaces with padding and styling
- **Text** - Styled text rendering

Custom layout components:
- **Grid** - Equal-width columns with responsive wrapping
- **Flex** - Flow layout respecting preferred widths
- **Sized** - Wrapper providing width hints

### Type Safety

Uses `as any` for custom color tokens:
```typescript
theme.bg("surface+1" as any, s)
theme.fg("accent" as any, text)
```

This allows using extended color palettes beyond the base theme types.

## Customization

### Add Your Own UI Simulations

Edit `components/UISimulator.ts` and add new sections:

```typescript
private createYourSection(): Container {
  const th = this.theme;
  const container = new Container();
  
  // Add header
  const header = new Box(1, 1, (s) => th.bg("surface+1" as any, s));
  const title = new Text(
    th.bold(th.fg("accent" as any, "🎨 Your Section")),
    0, 0
  );
  header.addChild(title);
  
  // Add your UI elements...
  
  return container;
}
```

Ideas for new sections:
- Navigation menus (active/inactive states)
- Data tables (stripes, hover, selection)
- Progress bars (fill colors by completion)
- Badges (count indicators, labels)
- Tooltips (overlay text contrast)
- Dropdowns (focus, selection, groups)
- Modals (layering, backdrop)
- Breadcrumbs (separators, current page)

### Modify the Palette Data

Edit the `COMPACT_PALETTE_DATA` in `index-simulator.ts` to change which tokens appear in "both" mode.

## Comparison: Palette vs. Simulator

| Aspect | Traditional Palette | UI Simulator |
|--------|-------------------|--------------|
| **View** | Color swatches | Real UI elements |
| **Focus** | Token catalog | Usage patterns |
| **Learning** | What colors exist | How to use them |
| **Context** | Abstract | Concrete |
| **Organization** | By category | By UI section |
| **Best For** | Reference lookup | Design validation |
| **Shows** | All tokens | Common patterns |

## Best Practices

### When to Use Traditional Palette
- Looking up a specific token name
- Browsing all available colors
- Understanding color categories
- Quick reference during coding

### When to Use UI Simulator
- Validating design hierarchy
- Testing color combinations
- Learning the design system
- Checking contrast and readability
- Understanding surface elevation
- Seeing real-world applications

### Use Both Together
1. Start with **simulator** to understand usage patterns
2. Switch to **both mode** to learn token names
3. Reference **traditional palette** for complete token list
4. Use **simulator** to validate your own UI designs

## Performance

Both views are lightweight:
- Pure text rendering (no graphics)
- Lazy component rendering
- Efficient invalidation cascade
- No heavy computations
- Terminal-native performance

## Browser Testing

Want to test in a web context? Consider:
- Export palette as CSS variables
- Create HTML preview page
- Use browser DevTools color picker
- Test with different screen settings

## Future Ideas

Possible enhancements:
- [ ] Interactive mode (click colors to copy)
- [ ] Search/filter colors by name
- [ ] Export as CSS/JSON
- [ ] Custom theme preview
- [ ] Accessibility contrast checker
- [ ] Color blindness simulation
- [ ] Animation/transition previews
- [ ] Dark/light mode toggle

## Contributing

Want to improve the simulator?

1. Add more UI section examples
2. Improve existing simulations
3. Add more view modes
4. Better mobile/narrow width handling
5. Color manipulation utilities
6. Theme comparison mode

## Support

Questions? Check:
- `QUICKSTART-SIMULATOR.md` - Quick start
- `README-SIMULATOR.md` - Full simulator docs
- `EXAMPLE-VIEW.md` - Visual examples
- `SIMULATOR-SUMMARY.md` - Architecture details

## License

Same as pi-coding-agent (check main repository).

---

**Happy theme exploring!** 🎨✨

Built with love using `@mariozechner/pi-tui` and `@mariozechner/pi-coding-agent`.
