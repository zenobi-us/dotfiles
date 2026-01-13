# Flex Alignment Feature

## Overview
The Flex component now supports horizontal alignment of children within the available width. This allows you to position content to the left, center, or right of the container.

## Alignment Options

### `align: "left"` (default)
Content is aligned to the left edge of the container. This is the default behavior.

```typescript
const flex = new Flex({ mode: "wrap", align: "left" });
flex.addChild(sized(new Text("Item 1"), 10));
flex.addChild(sized(new Text("Item 2"), 10));
```

**Output (60 chars width):**
```
|Item 1      Item 2      |
```

### `align: "center"`
Content is centered within the available width.

```typescript
const flex = new Flex({ mode: "wrap", align: "center" });
flex.addChild(sized(new Text("Item 1"), 10));
flex.addChild(sized(new Text("Item 2"), 10));
```

**Output (60 chars width):**
```
|              Item 1      Item 2              |
```

### `align: "right"`
Content is aligned to the right edge of the container.

```typescript
const flex = new Flex({ mode: "wrap", align: "right" });
flex.addChild(sized(new Text("Item 1"), 10));
flex.addChild(sized(new Text("Item 2"), 10));
```

**Output (60 chars width):**
```
|                          Item 1      Item 2  |
```

## Behavior with Different Modes

### Fill Mode
In fill mode, children already distribute space across the entire width. Alignment affects the positioning of the entire row as a unit when combined with fixed-width children.

```typescript
const flex = new Flex({ mode: "fill", align: "center" });
flex.addChild(fixed(new Text("⚠"), 5));
flex.addChild(new Text("Message"));
```

**Result:** The icon + message group is centered as a unit.

### Wrap Mode
In wrap mode, each row is independently aligned. This means different rows can have different amounts of content, and each will be aligned according to the `align` setting.

```typescript
const flex = new Flex({ mode: "wrap", align: "center" });
// First row: 3 items
flex.addChild(sized(new Text("A"), 5));
flex.addChild(sized(new Text("B"), 5));
flex.addChild(sized(new Text("C"), 5));
// Second row: 2 items (wraps)
flex.addChild(sized(new Text("D"), 5));
flex.addChild(sized(new Text("E"), 5));
```

**Result:**
```
     A    B    C          <- Row 1 centered
        D    E            <- Row 2 centered
```

## Use Cases

### 1. Centered Dialog Buttons
```typescript
const buttonRow = new Flex({ mode: "wrap", spacing: 2, align: "center" });
buttonRow.addChild(sized(new Text("OK"), 10));
buttonRow.addChild(sized(new Text("Cancel"), 10));
```

Perfect for dialog footers where you want buttons centered.

### 2. Right-Aligned Status Indicators
```typescript
const statusBar = new Flex({ mode: "wrap", spacing: 1, align: "right" });
statusBar.addChild(new Text("✓ Ready"));
statusBar.addChild(new Text("● Online"));
```

Great for status bars where indicators should be right-aligned.

### 3. Centered Navigation
```typescript
const nav = new Flex({ mode: "wrap", spacing: 3, align: "center" });
nav.addChild(sized(new Text("Home"), 8));
nav.addChild(sized(new Text("About"), 8));
nav.addChild(sized(new Text("Contact"), 8));
```

Perfect for centered navigation menus.

### 4. Alert with Centered Content
```typescript
const alert = new Alert(theme, "info", "Important message", {
  // Alert internally uses Flex, can be extended to support alignment
});

// Or create a wrapper:
const centeredAlert = new Flex({ mode: "wrap", align: "center" });
centeredAlert.addChild(alert);
```

## API

### Constructor Options
```typescript
interface FlexOptions {
  mode?: 'fill' | 'wrap';     // Layout mode
  spacing?: number;            // Space between children
  align?: 'left' | 'center' | 'right';  // Horizontal alignment
}
```

### Methods
```typescript
// Get current alignment
flex.getAlign(): FlexAlign

// Change alignment dynamically
flex.setAlign('center')
```

## Implementation Details

### How It Works
1. Children are rendered at their calculated widths
2. The total width of all children (including spacing) is calculated
3. The alignment is applied by adding padding:
   - **left**: No padding (default)
   - **center**: Equal padding on left and right (left padding = availableSpace / 2)
   - **right**: All padding on the left

### Performance
The alignment feature adds minimal overhead:
- O(1) per line - simple padding calculation
- No additional rendering passes required
- Works seamlessly with existing Flex logic

### Compatibility
- Works with both `sized()` and `fixed()` components
- Compatible with all existing Flex features
- Does not affect internal child rendering

## Examples in Practice

### Complete Alert Example
```typescript
// Create centered alert
const flex = new Flex({ mode: "wrap", align: "center", spacing: 2 });
const alert = new Alert(theme, "success", "Operation completed");
flex.addChild(alert);

// Result: Alert centered in available width
```

### Form with Right-Aligned Buttons
```typescript
const form = new Container();

// Form fields...
// ...

// Button row at bottom, right-aligned
const buttons = new Flex({ mode: "wrap", align: "right", spacing: 2 });
buttons.addChild(sized(new Text("Save"), 12));
buttons.addChild(sized(new Text("Cancel"), 12));
form.addChild(buttons);
```

### Responsive Tag List with Center Alignment
```typescript
const tagList = new Flex({ mode: "wrap", align: "center", spacing: 1 });
const tags = ["React", "TypeScript", "Node.js", "Python", "Docker"];

for (const tag of tags) {
  tagList.addChild(sized(new Text(`[${tag}]`), tag.length + 2));
}

// Tags wrap naturally and each row is centered
```

## Testing
All alignment features have been tested with:
- ✅ Left alignment (default behavior)
- ✅ Center alignment with various content widths
- ✅ Right alignment with various content widths
- ✅ Fill mode with fixed and flexible children
- ✅ Wrap mode with multiple rows
- ✅ Dynamic alignment changes via setAlign()

## Future Enhancements
Potential future additions:
- Vertical alignment (top, middle, bottom) for multi-line content
- Justify alignment (space-between, space-around)
- Per-child alignment overrides
- Alignment transitions/animations (if TUI supports it)
