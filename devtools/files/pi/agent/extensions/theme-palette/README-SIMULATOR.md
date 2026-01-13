# Theme Palette UI Simulator

An alternative view for the theme palette extension that shows realistic UI element simulations demonstrating how the color palette is used in practice.

## Features

### UI Element Simulations

The simulator showcases the theme palette through real-world UI examples:

1. **🎯 Interactive Elements**
   - Primary, secondary, success, and danger buttons
   - Disabled states
   - Link buttons
   - Demonstrates `accent`, `text`, `error`, `success` colors

2. **💬 Message Bubbles**
   - User messages (`userMessageBg`, `userMessageText`)
   - AI thinking state (`toolPendingBg`, `thinkingText`)
   - System/tool messages (`customMessageBg`, `customMessageText`)
   - Shows contrast hierarchy with labels

3. **💻 Code Blocks**
   - Syntax highlighting with full token palette
   - `syntaxKeyword`, `syntaxFunction`, `syntaxString`, etc.
   - Diff view showing added/removed/context lines
   - `toolDiffAdded`, `toolDiffRemoved`, `toolDiffContext`

4. **⚡ Alerts & Status**
   - Success, warning, and error alerts
   - Thinking intensity levels (off → max)
   - Icon + text combinations

5. **📝 Form Elements**
   - Text inputs with focus states
   - Disabled inputs
   - Checkboxes (checked/unchecked)
   - Validation hints
   - Surface elevation with `surface+1` and `overlay-1`

## Usage

### Load the extension:

```bash
pi -e ~/.pi/agent/extensions/theme-palette/index-simulator.ts
```

### Commands:

```bash
# Toggle UI simulator (simulator only)
/theme-simulator

# Show both palette and simulator side-by-side
/theme-simulator both

# Show just the simulator
/theme-simulator simulator

# Change mode while running
/theme-simulator-mode both
/theme-simulator-mode simulator
```

### Keyboard Shortcuts:

- `Ctrl+Shift+U` - Toggle UI simulator

## View Modes

### Simulator Mode (default)
Shows only the UI element simulations. Best for:
- Understanding color usage in context
- Seeing real-world applications
- Testing theme contrast and readability

### Both Mode
Shows compact palette on left, simulator on right. Best for:
- Comparing color tokens with their usage
- Understanding the connection between token names and applications
- Learning the design system

## Architecture

Built using the pi-tui layout components:

- **Container** - Base layout container
- **Box** - Surfaces with padding and backgrounds
- **Text** - Styled text content
- **Grid** - Equal-width column layout
- **Flex** - Responsive flow layout
- **Sized** - Preferred width hints for Flex

### Components:

- `UISimulator.ts` - Main simulator component with all UI examples
- `index-simulator.ts` - Extension entry point with view modes
- Uses existing `Palette.ts`, `Grid.ts`, `Flex.ts`, `Sized.ts`

## Customization

Edit `UISimulator.ts` to:
- Add more UI element examples
- Customize existing simulations
- Test different color combinations
- Validate contrast and hierarchy

## Benefits Over Static Palette

1. **Contextual Understanding** - See colors in actual use cases
2. **Hierarchy Validation** - Verify text contrast levels work in practice
3. **Interactive Preview** - Understand button and control styling
4. **Syntax Testing** - Validate code highlighting readability
5. **Real-world Scenarios** - Test with actual message and form layouts

## Design Philosophy

The simulator demonstrates the four-level contrast hierarchy:

1. **Primary** (`text`) - Main content, button labels
2. **Secondary** (`muted`) - Supporting text, descriptions  
3. **Tertiary** (`dim`) - Placeholder text, hints
4. **Border** (`border`, `overlay-1`) - Separators, subtle definition

And surface elevation:
- `base` - Default surface
- `surface+1` - Elevated cards/panels
- `overlay-1` - Subtle backgrounds within surfaces
