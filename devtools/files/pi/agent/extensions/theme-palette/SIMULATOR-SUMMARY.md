# UI Simulator - Alternative Palette View

## What We Built

An alternative view for the theme-palette extension that shows **realistic UI element simulations** instead of just color swatches. This helps designers and developers understand how the color palette is actually used in practice.

## Files Created

1. **`components/UISimulator.ts`** (12KB)
   - Main simulator component with 5 sections
   - Shows buttons, messages, code blocks, alerts, forms
   - Uses Box, Container, Text, Grid, Flex from pi-tui

2. **`index-simulator.ts`** (6KB)
   - Extension entry point with dual view modes
   - Commands: `/theme-simulator`, `/theme-simulator-mode`
   - Keyboard shortcut: `Ctrl+Shift+U`
   - Supports "simulator" and "both" modes

3. **`README-SIMULATOR.md`** (4KB)
   - Complete usage documentation
   - Explains all UI sections and color usage
   - Lists benefits and customization ideas

4. **`EXAMPLE-VIEW.md`** (13KB)
   - ASCII art showing layout examples
   - Visual comparison of modes
   - Customization suggestions

## Usage

```bash
# Load the extension
pi -e ~/.pi/agent/extensions/theme-palette/index-simulator.ts

# Toggle simulator view
/theme-simulator

# Show palette + simulator side-by-side
/theme-simulator both

# Or use keyboard shortcut
Ctrl+Shift+U
```

## Architecture

### Components Used

From `pi-tui` package:
- **Container** - Base layout container
- **Box** - Surfaces with padding, borders, backgrounds
- **Text** - Styled text content

From theme-palette extension:
- **Grid** - Equal-width column layout
- **Flex** - Responsive flow layout with wrap
- **Sized** - Preferred width hints for Flex

### UI Sections

1. **🎯 Interactive Elements** (buttons, links)
   - Primary/secondary/danger/success buttons
   - Disabled states
   - Link styling

2. **💬 Message Bubbles** (chat interface)
   - User messages (`userMessageBg`)
   - AI thinking state (`toolPendingBg`)
   - System messages (`customMessageBg`)

3. **💻 Code Blocks** (syntax highlighting)
   - Full syntax token palette
   - Git diff view with +/- lines
   - Comment hierarchy

4. **⚡ Alerts & Status** (notifications)
   - Success/warning/error alerts
   - Thinking intensity levels (off → max)
   - Icon + text patterns

5. **📝 Form Elements** (inputs, validation)
   - Text inputs with focus
   - Disabled inputs
   - Checkboxes (checked/unchecked)
   - Validation hints

## Key Benefits

### 1. Context Over Swatches
Instead of:
```
████ accent  Primary action
```

You see:
```
╔═══════════════════╗
║ Primary Action    ║
╚═══════════════════╝
```

### 2. Validates Hierarchy
See the four-level text contrast in real scenarios:
- **Primary** (`text`) - Main content
- **Secondary** (`muted`) - Supporting text
- **Tertiary** (`dim`) - Hints, placeholders
- **Border** (`border`) - Separators

### 3. Tests Readability
Verify syntax highlighting is readable:
- Comments don't overpower code
- Strings stand out from identifiers
- Keywords are distinct but not jarring

### 4. Shows Elevation
Understand surface depth through color:
- `base` - Default canvas
- `surface+1` - Elevated cards
- `overlay-1` - Subtle backgrounds

### 5. Real Usage Patterns
Learn when to use each color:
- Button states (normal/hover/disabled)
- Message background colors
- Form validation colors
- Status indicators

## Design Philosophy

The simulator demonstrates the **Rose Pine Moon** design system:

### Contrast Hierarchy (4 levels)
1. `text` - Foreground content
2. `muted` - Secondary supporting
3. `dim` - Subtle receding
4. `border` - Faint definition

### Surface Elevation
- `userMessageBg` - Elevated (+1)
- `customMessageBg` - Recessed (-1)
- `toolPendingBg` - Subtle separation

### Interactive Hierarchy
- `accent` (Iris) - Primary actions
- `borderAccent` - Subtle accent borders
- `mdHeading` - Prominent headings
- `customMessageLabel` - Clear labels

### Semantic Colors
- `success` (Foam) - Positive outcomes
- `error` (Love) - Negative outcomes
- `warning` (Gold) - Caution needed

## Customization

Edit `components/UISimulator.ts` to add:

- **Navigation** - Active/inactive states
- **Tables** - Stripe patterns, hover states
- **Progress bars** - Fill colors by state
- **Badges** - Count indicators, labels
- **Tooltips** - Overlay text contrast
- **Dropdowns** - Focus and selection
- **Modals** - Layering via color depth
- **Breadcrumbs** - Separator hierarchy

Each new simulation validates another aspect of the color palette!

## Technical Details

### Type Safety
Uses `as any` for custom color names not in base `ThemeFg`/`ThemeBg`:
```typescript
th.bg("surface+1" as any, s)
th.fg("accent" as any, text)
```

### Layout System
- **Grid** - Equal columns, wraps to vertical on narrow width
- **Flex** - Respects preferred widths, wraps components
- **Box** - Padding, borders, background styling
- **Container** - Vertical stacking by default

### Performance
- Lazy rendering - only visible sections rendered
- Efficient invalidation - cascades through component tree
- No heavy computations - pure text rendering

## Comparison with Original

| Feature | Original Palette | UI Simulator |
|---------|-----------------|--------------|
| View | Color swatches | Real UI elements |
| Context | Token names | Actual usage |
| Understanding | What colors exist | How to use them |
| Learning | Abstract | Concrete |
| Validation | Visual only | Functional + visual |

## Next Steps

1. **Test with your theme** - Load and verify readability
2. **Add more simulations** - Navigation, tables, etc.
3. **Share patterns** - Document what works well
4. **Iterate** - Adjust colors based on real usage

## Example Session

```bash
# Start with simulator
$ pi -e ~/.pi/agent/extensions/theme-palette/index-simulator.ts

# In session
> /theme-simulator
✓ UI simulator enabled (simulator)

# See realistic UI elements using your theme colors
# Toggle view modes
> /theme-simulator-mode both
✓ Mode: palette + simulator

# Now see swatches AND usage side-by-side!

# Hide when done
> /theme-simulator
✓ UI simulator disabled
```

## Why This Matters

Color palette tools often show swatches with labels, but designers and developers need to see:

1. **How** colors combine (button text + background)
2. **Where** colors belong (message vs. alert vs. code)
3. **When** to use variants (muted vs. dim vs. border)
4. **Why** hierarchy matters (readability at scale)

The UI Simulator bridges the gap between palette and practice. 🎨✨
