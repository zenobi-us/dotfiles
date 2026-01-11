# Layout Components: Grid and Flex

Two layout components for horizontal layouts with different behaviors.

## Quick Comparison

| Feature | Grid | Flex |
|---------|------|------|
| **Width distribution** | Equal widths (forced) | Intrinsic widths (flow) |
| **Use case** | Uniform columns | Tags, buttons, varied content |
| **Width control** | Enforced | Preferred (via `sized()`) |
| **Wrapping** | No (falls back vertical) | Yes (wrap mode) |
| **Fill behavior** | Always fills width | Optional (fill mode) |

## Grid Component

**Enforces equal-width columns.**

### Basic Usage

```typescript
import { Grid } from "./components/index.js";

const grid = new Grid({ spacing: 2 });
grid.addChild(box1);  // Gets 1/3 of width
grid.addChild(box2);  // Gets 1/3 of width
grid.addChild(box3);  // Gets 1/3 of width
```

### Options

```typescript
interface GridOptions {
  spacing?: number;        // Space between columns (default: 2)
  minColumnWidth?: number; // Min width before vertical fallback (default: 10)
}
```

### When to Use Grid

✅ **Dashboard metrics** - Equal-width stat boxes
✅ **Table columns** - Uniform column layout
✅ **Card grids** - Evenly spaced cards
✅ **Navigation bars** - Equal menu items

### Example: Dashboard Metrics

```typescript
const metrics = new Grid({ spacing: 3 });

metrics.addChild(createMetric("Users", "1,234"));
metrics.addChild(createMetric("Active", "856"));
metrics.addChild(createMetric("Errors", "12"));

// All three metrics get equal width
```

Output:
```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Users        │   │ Active       │   │ Errors       │
│ 1,234        │   │ 856          │   │ 12           │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Flex Component

**Flow layout with intrinsic sizing and optional wrapping.**

### Two Modes

#### 1. Fill Mode (default)

Children evenly fill the row, respecting minimum widths.

```typescript
const flex = new Flex({ mode: "fill" });

flex.addChild(sized(box1, 10));  // Minimum 10 chars
flex.addChild(sized(box2, 20));  // Minimum 20 chars
flex.addChild(sized(box3, 15));  // Minimum 15 chars

// Each gets at least minimum, extra space distributed evenly
```

#### 2. Wrap Mode

Children render at preferred width and wrap to next line.

```typescript
const flex = new Flex({ mode: "wrap" });

flex.addChild(sized(new Text("Short"), 7));
flex.addChild(sized(new Text("Medium text"), 13));
flex.addChild(sized(new Text("Long text here"), 16));

// Wraps to next line when doesn't fit
```

### The `sized()` Helper

Declare preferred width for components:

```typescript
import { sized } from "./components/index.js";

// Without sized - width measured automatically
flex.addChild(new Text("Hello"));

// With sized - explicit preferred width
flex.addChild(sized(new Text("Hello"), 10));
```

### Options

```typescript
interface FlexOptions {
  mode?: "fill" | "wrap";  // Layout mode (default: "fill")
  spacing?: number;         // Space between children (default: 2)
}
```

### When to Use Flex

✅ **Tags** - Variable-width tags that wrap
✅ **Buttons** - Action buttons with different labels
✅ **Badges** - Status badges of varying sizes
✅ **Breadcrumbs** - Navigation items that flow
✅ **Chip lists** - Collections of chips

### Example: Tag Cloud

```typescript
const tags = new Flex({ mode: "wrap", spacing: 1 });

const tagList = ["React", "TypeScript", "Node.js", "Python", "Docker"];

for (const tag of tagList) {
  tags.addChild(sized(
    new Text(`[${tag}]`),
    tag.length + 2  // Brackets + text
  ));
}
```

Output (wraps based on terminal width):
```
[React] [TypeScript] [Node.js] [Python]
[Docker]
```

## Detailed Comparison

### Grid: Equal Width Distribution

```
Terminal width: 80 characters
Children: 3
Spacing: 2 chars

Calculation:
  Available: 80 - (2 × 2) = 76
  Per column: 76 ÷ 3 = 25.33 → 25

Result:
  [Col 1: 25]  [Col 2: 25]  [Col 3: 25]
             ^^            ^^
             spacing      spacing
```

### Flex Fill: Respecting Minimums

```
Terminal width: 80 characters
Children with minimums: 10, 20, 15
Total minimum: 45
Spacing: 2 chars × 2 = 4
Available: 80 - 4 = 76
Extra space: 76 - 45 = 31
Per child: 31 ÷ 3 = 10.33 → 10

Result:
  [Col 1: 20]  [Col 2: 30]  [Col 3: 25]
   (10+10)     (20+10)      (15+10)
```

### Flex Wrap: Natural Flow

```
Terminal width: 40 characters
Spacing: 2 chars

Children:
  "Short" (7)
  "Medium text" (13)
  "Long" (6)
  "Extra long text here" (22)

Layout:
  Row 1: "Short"(7) + spacing(2) + "Medium text"(13) + spacing(2) + "Long"(6) = 30 ✓
  Row 2: "Extra long text here"(22) = 22 ✓

Result:
  Short  Medium text  Long
  Extra long text here
```

## Advanced Patterns

### Mixed Grid and Flex

```typescript
const container = new Container();

// Header with Grid (equal metrics)
const header = new Grid({ spacing: 3 });
header.addChild(metric1);
header.addChild(metric2);
header.addChild(metric3);
container.addChild(header);

// Tags with Flex (wrapped tags)
const tags = new Flex({ mode: "wrap", spacing: 1 });
for (const tag of tagList) {
  tags.addChild(sized(new Text(`[${tag}]`), tag.length + 2));
}
container.addChild(tags);
```

### Weighted Grid (Sidebar + Main)

```typescript
const layout = new Grid({ spacing: 2 });

// Sidebar: 25% (add once)
layout.addChild(sidebar);

// Main: 75% (add three times)
layout.addChild(main);
layout.addChild(main);
layout.addChild(main);

// Result: 1:3 ratio
```

### Responsive Flex

```typescript
const flex = new Flex({ mode: "wrap", spacing: 2 });

// Cards that wrap on narrow terminals
const cards = [card1, card2, card3, card4];
for (const card of cards) {
  flex.addChild(sized(card, 30)); // Preferred 30 chars
}

// Wide terminal: [card1] [card2] [card3] [card4]
// Narrow terminal:
//   [card1] [card2]
//   [card3] [card4]
```

## Component API

### Grid

```typescript
// Constructor
new Grid(options?: GridOptions)

// Methods
addChild(component: Component): void
removeChild(component: Component): void
clear(): void
invalidate(): void
render(width: number): string[]
getChildCount(): number
getChild(index: number): Component | undefined
```

### Flex

```typescript
// Constructor
new Flex(options?: FlexOptions)

// Methods
addChild(component: Component): void
removeChild(component: Component): void
clear(): void
invalidate(): void
render(width: number): string[]
getChildCount(): number
getChild(index: number): Component | undefined
getMode(): FlexMode
setMode(mode: FlexMode): void
```

### Sized

```typescript
// Constructor
new Sized(component: Component, preferredWidth: number)

// Helper function
sized(component: Component, width: number): SizedComponent

// Properties
readonly preferredWidth: number
```

## Performance

Both components are O(n) where n = number of children.

| Operation | Grid | Flex Fill | Flex Wrap |
|-----------|------|-----------|-----------|
| Width calculation | O(1) | O(n) | O(n) |
| Rendering | O(n) | O(n) | O(n) |
| Height alignment | O(n) | O(n) | O(n) |

## Best Practices

### 1. Choose the Right Component

```typescript
// Equal widths needed? → Grid
const metrics = new Grid();

// Variable widths, wrapping? → Flex wrap
const tags = new Flex({ mode: "wrap" });

// Fill space, respect minimums? → Flex fill
const buttons = new Flex({ mode: "fill" });
```

### 2. Use `sized()` for Flex

```typescript
// Good - explicit width
flex.addChild(sized(component, 20));

// Works but relies on measurement
flex.addChild(component);
```

### 3. Consider Responsive Fallback

```typescript
// Grid falls back to vertical when too narrow
const grid = new Grid({ minColumnWidth: 20 });

// Flex wrap adapts naturally
const flex = new Flex({ mode: "wrap" });
```

### 4. Spacing Consistency

```typescript
// Use consistent spacing across layouts
const spacing = 2;

const grid = new Grid({ spacing });
const flex = new Flex({ spacing });
```

## Examples

See `flex-example.ts` for complete working examples:
- `/example-grid` - Grid equal widths
- `/example-flex-fill` - Flex fill mode
- `/example-flex-wrap` - Flex wrap mode
- `/example-grid-vs-flex` - Side-by-side comparison
- `/example-dashboard` - Real-world dashboard
- `/example-responsive` - Responsive behavior

## Migration from HorizontalLayout

```typescript
// Old HorizontalLayout
const layout = new HorizontalLayout({ spacing: 2 });

// New Grid (same behavior)
const layout = new Grid({ spacing: 2 });

// Or Flex if you need wrapping
const layout = new Flex({ mode: "wrap", spacing: 2 });
```

## See Also

- `Container` - Vertical stacking (built-in)
- `Box` - Padding and backgrounds
- `Group` - Titled groups
- `Palette` - Color collections
