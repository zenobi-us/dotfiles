# Learning: Layout Systems for Pi TUI Components

**Source:** Theme Palette Extension - Grid and Flex Components  
**Created:** 2026-01-11  
**Epic:** [Theme Development Tools](epic-c2b8f4e6-theme-development-tools.md)

## Overview

This document captures patterns and insights from the Grid and Flex layout components developed for the theme-palette extension. These components demonstrate two fundamentally different approaches to horizontal layouts in terminal user interfaces.

## Layout Component Philosophy

### Core Design Question
**How should child components be sized in horizontal layouts?**

Two answers emerged:

1. **Grid**: "All children get equal width (forced)"
2. **Flex**: "Children get their preferred width (flow)"

This distinction drives all other design decisions.

## Grid Component Deep Dive

### Design Philosophy

**Grid enforces uniform columns.** Perfect for:
- Dashboard metrics (all same width)
- Table columns (aligned layout)
- Card grids (evenly spaced)
- Navigation bars (equal menu items)

### Implementation Pattern

```typescript
class Grid extends Container {
  private spacing: number;
  private minColumnWidth: number;
  
  constructor(options?: GridOptions) {
    super();
    this.spacing = options?.spacing ?? 2;
    this.minColumnWidth = options?.minColumnWidth ?? 10;
  }
  
  override render(width: number): string[] {
    const childCount = this.getChildCount();
    if (childCount === 0) return [];
    
    // Calculate available width
    const totalSpacing = this.spacing * (childCount - 1);
    const availableWidth = width - totalSpacing;
    
    // Calculate column width (equal distribution)
    const columnWidth = Math.floor(availableWidth / childCount);
    
    // Fallback to vertical if too narrow
    if (columnWidth < this.minColumnWidth) {
      return this.renderVertical(width);
    }
    
    // Render horizontally with equal widths
    return this.renderHorizontal(columnWidth, width);
  }
  
  private renderHorizontal(columnWidth: number, totalWidth: number): string[] {
    const childOutputs: string[][] = [];
    let maxHeight = 0;
    
    // Render each child at fixed width
    for (let i = 0; i < this.getChildCount(); i++) {
      const child = this.getChild(i);
      const output = child.render(columnWidth);
      childOutputs.push(output);
      maxHeight = Math.max(maxHeight, output.length);
    }
    
    // Combine outputs side-by-side with height alignment
    const lines: string[] = [];
    for (let row = 0; row < maxHeight; row++) {
      const rowParts: string[] = [];
      for (let col = 0; col < childOutputs.length; col++) {
        const childOutput = childOutputs[col];
        const line = row < childOutput.length 
          ? childOutput[row] 
          : " ".repeat(columnWidth);
        rowParts.push(line);
      }
      lines.push(rowParts.join(" ".repeat(this.spacing)));
    }
    
    return lines;
  }
}
```

### Key Algorithmic Patterns

**Width Distribution:**
```
Available = Terminal Width - (Spacing × (Count - 1))
ColumnWidth = Available ÷ Count

Example (80 chars, 3 children, spacing 2):
  Available = 80 - (2 × 2) = 76
  ColumnWidth = 76 ÷ 3 = 25.33 → 25
```

**Height Alignment:**
```typescript
// Pad shorter columns to match tallest
for (let row = 0; row < maxHeight; row++) {
  for (let col = 0; col < childCount; col++) {
    const line = row < childOutput[col].length
      ? childOutput[col][row]              // Use actual line
      : " ".repeat(columnWidth);            // Pad with spaces
  }
}
```

**Responsive Fallback:**
```typescript
if (columnWidth < minColumnWidth) {
  // Fall back to vertical layout
  return this.renderVertical(width);
}
```

### Grid Use Cases

#### 1. Dashboard Metrics
```typescript
const metrics = new Grid({ spacing: 3 });
metrics.addChild(createMetric("Users", "1,234"));
metrics.addChild(createMetric("Active", "856"));
metrics.addChild(createMetric("Errors", "12"));

// Output: Three equal-width boxes
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Users        │   │ Active       │   │ Errors       │
│ 1,234        │   │ 856          │   │ 12           │
└──────────────┘   └──────────────┘   └──────────────┘
```

#### 2. Weighted Layouts (Sidebar + Main)
```typescript
const layout = new Grid({ spacing: 2 });

// 25% sidebar (add once)
layout.addChild(sidebar);

// 75% main (add three times)
layout.addChild(main);
layout.addChild(main);
layout.addChild(main);

// Result: 1:3 ratio
```

## Flex Component Deep Dive

### Design Philosophy

**Flex respects intrinsic widths.** Perfect for:
- Tags (variable-width labels that wrap)
- Buttons (different label lengths)
- Badges (varying sizes)
- Breadcrumbs (navigation items)
- Chip lists (collections of items)

### Two Operating Modes

#### Mode 1: Fill (Default)

Children evenly fill the row, respecting minimum widths.

```typescript
const flex = new Flex({ mode: "fill" });
flex.addChild(sized(box1, 10));  // Min 10
flex.addChild(sized(box2, 20));  // Min 20
flex.addChild(sized(box3, 15));  // Min 15

// Each gets minimum + fair share of extra space
```

**Algorithm:**
```
Total Minimum = Sum of all preferred widths
Available = Terminal Width - Spacing
Extra = Available - Total Minimum
Per Child = Extra ÷ Count

Final Width[i] = PreferredWidth[i] + Per Child
```

#### Mode 2: Wrap

Children render at preferred width and wrap to next line.

```typescript
const flex = new Flex({ mode: "wrap" });
flex.addChild(sized(new Text("Short"), 7));
flex.addChild(sized(new Text("Medium text"), 13));
flex.addChild(sized(new Text("Long text here"), 16));

// Wraps when doesn't fit:
Short  Medium text  Long
text here
```

**Algorithm:**
```typescript
let currentRow: Component[] = [];
let rowWidth = 0;

for (const child of children) {
  const childWidth = getPreferredWidth(child);
  
  if (rowWidth + spacing + childWidth > totalWidth) {
    // Commit current row, start new row
    rows.push(currentRow);
    currentRow = [child];
    rowWidth = childWidth;
  } else {
    // Add to current row
    currentRow.push(child);
    rowWidth += spacing + childWidth;
  }
}
```

### Implementation Pattern

```typescript
class Flex extends Container {
  private mode: FlexMode = "fill";
  private spacing: number = 2;
  
  override render(width: number): string[] {
    return this.mode === "fill" 
      ? this.renderFill(width)
      : this.renderWrap(width);
  }
  
  private renderFill(totalWidth: number): string[] {
    const childCount = this.getChildCount();
    const totalSpacing = this.spacing * (childCount - 1);
    const availableWidth = totalWidth - totalSpacing;
    
    // Calculate minimum widths
    const preferredWidths = this.getPreferredWidths();
    const totalPreferred = preferredWidths.reduce((a, b) => a + b, 0);
    
    // Distribute extra space evenly
    const extraSpace = Math.max(0, availableWidth - totalPreferred);
    const extraPerChild = Math.floor(extraSpace / childCount);
    
    // Final widths
    const finalWidths = preferredWidths.map(w => w + extraPerChild);
    
    // Render children at final widths
    return this.renderHorizontal(finalWidths, totalWidth);
  }
  
  private renderWrap(totalWidth: number): string[] {
    const rows: Component[][] = [];
    let currentRow: Component[] = [];
    let rowWidth = 0;
    
    for (let i = 0; i < this.getChildCount(); i++) {
      const child = this.getChild(i);
      const childWidth = this.getPreferredWidth(child);
      const neededWidth = rowWidth + 
        (currentRow.length > 0 ? this.spacing : 0) + 
        childWidth;
      
      if (neededWidth > totalWidth && currentRow.length > 0) {
        // Start new row
        rows.push(currentRow);
        currentRow = [child];
        rowWidth = childWidth;
      } else {
        // Add to current row
        currentRow.push(child);
        rowWidth = neededWidth;
      }
    }
    
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    // Render each row
    return rows.flatMap(row => this.renderRow(row, totalWidth));
  }
  
  private getPreferredWidth(component: Component): number {
    if (isSizedComponent(component)) {
      return component.preferredWidth;
    }
    // Fallback: measure rendered width
    const lines = component.render(1000);
    return Math.max(...lines.map(l => l.length));
  }
}
```

### The Sized Wrapper Pattern

**Problem**: How do components declare preferred width?

**Solution**: Wrapper component with width metadata

```typescript
interface SizedComponent extends Component {
  preferredWidth: number;
}

class Sized extends Box implements SizedComponent {
  constructor(
    private component: Component,
    readonly preferredWidth: number
  ) {
    super();
    this.addChild(component);
  }
  
  override render(width: number): string[] {
    // Render wrapped component at specified width
    return this.component.render(Math.min(width, this.preferredWidth));
  }
}

// Helper function
function sized(component: Component, width: number): SizedComponent {
  return new Sized(component, width);
}
```

**Usage:**
```typescript
// Explicit width
flex.addChild(sized(new Text("Hello"), 10));

// Measured width (fallback)
flex.addChild(new Text("Hello")); // Flex measures actual width
```

### Flex Use Cases

#### 1. Tag Cloud (Wrap Mode)
```typescript
const tags = new Flex({ mode: "wrap", spacing: 1 });

const tagList = ["React", "TypeScript", "Node.js", "Python", "Docker"];
for (const tag of tagList) {
  tags.addChild(sized(new Text(`[${tag}]`), tag.length + 2));
}

// Output (wraps based on width):
[React] [TypeScript] [Node.js] [Python]
[Docker]
```

#### 2. Button Bar (Fill Mode)
```typescript
const buttons = new Flex({ mode: "fill", spacing: 2 });

buttons.addChild(sized(new Button("OK"), 10));
buttons.addChild(sized(new Button("Cancel"), 15));
buttons.addChild(sized(new Button("Help"), 12));

// Each button gets minimum + fair share of extra space
```

#### 3. Responsive Cards
```typescript
const cards = new Flex({ mode: "wrap", spacing: 2 });

for (const card of cardList) {
  cards.addChild(sized(card, 30)); // Prefer 30 chars
}

// Wide terminal: all on one line
// Narrow terminal: wraps to multiple lines
```

## Grid vs Flex Decision Matrix

| Requirement | Grid | Flex |
|------------|------|------|
| Equal-width columns | ✅ Perfect | ❌ Wrong tool |
| Variable-width content | ❌ Wastes space | ✅ Perfect |
| Uniform appearance | ✅ Yes | ❌ No |
| Content-driven sizing | ❌ No | ✅ Yes |
| Automatic wrapping | ❌ No (fallback to vertical) | ✅ Yes (wrap mode) |
| Fill available space | ✅ Always | ✅ Optional (fill mode) |
| Weighted layouts | ✅ Via repetition | ❌ Not supported |
| Simple API | ✅ Yes | ⚠️ More complex (modes) |

## Performance Characteristics

### Grid Performance

```
Width Calculation: O(1) - Simple division
Rendering: O(n × m) - n children, m lines per child
Memory: O(n × m) - Store all rendered lines
```

**Optimization:**
- Single-pass rendering
- No backtracking
- Predictable memory usage

### Flex Performance

#### Fill Mode
```
Width Calculation: O(n) - Sum preferred widths
Rendering: O(n × m) - n children, m lines per child
Memory: O(n × m) - Store all rendered lines
```

#### Wrap Mode
```
Layout Calculation: O(n) - Iterate children once
Rendering: O(n × m) - n children, m lines per child
Memory: O(n × m) - Store all rendered lines
```

**Optimization Considerations:**
- Wrap mode requires layout pass before rendering
- Measuring preferred widths can be expensive (render at large width)
- Cache measurements when possible

## Advanced Patterns

### 1. Mixed Grid and Flex

```typescript
const container = new Container();

// Header: Grid for uniform metrics
const header = new Grid({ spacing: 3 });
header.addChild(metric1);
header.addChild(metric2);
header.addChild(metric3);
container.addChild(header);

// Body: Flex for variable content
const tags = new Flex({ mode: "wrap", spacing: 1 });
for (const tag of tagList) {
  tags.addChild(sized(new Text(`[${tag}]`), tag.length + 2));
}
container.addChild(tags);
```

### 2. Nested Flex (Multi-Line Forms)

```typescript
const form = new Flex({ mode: "wrap", spacing: 2 });

// Each field is a Flex container
const nameField = new Flex({ mode: "fill" });
nameField.addChild(sized(new Text("Name:"), 10));
nameField.addChild(sized(new Input(), 30));
form.addChild(sized(nameField, 42));

const emailField = new Flex({ mode: "fill" });
emailField.addChild(sized(new Text("Email:"), 10));
emailField.addChild(sized(new Input(), 30));
form.addChild(sized(emailField, 42));

// Wraps when narrow, side-by-side when wide
```

### 3. Responsive Grid → Flex

```typescript
class ResponsiveLayout extends Container {
  private grid: Grid;
  private flex: Flex;
  private breakpoint: number = 60;
  
  override render(width: number): string[] {
    if (width >= this.breakpoint) {
      return this.grid.render(width);  // Wide: use Grid
    } else {
      return this.flex.render(width);  // Narrow: use Flex wrap
    }
  }
}
```

### 4. Dynamic Content Sizing

```typescript
// Measure content dynamically
function autoSized(component: Component): SizedComponent {
  const lines = component.render(1000); // Render at large width
  const maxWidth = Math.max(...lines.map(l => stripAnsi(l).length));
  return sized(component, maxWidth);
}

const flex = new Flex({ mode: "wrap" });
flex.addChild(autoSized(new Text("Variable content")));
```

## Testing Patterns

### Grid Testing

```typescript
describe("Grid", () => {
  it("distributes width equally", () => {
    const grid = new Grid({ spacing: 2 });
    grid.addChild(new Box()); // 3 children
    grid.addChild(new Box());
    grid.addChild(new Box());
    
    // 80 - (2 × 2 spacing) = 76
    // 76 ÷ 3 = 25.33 → 25 per column
    
    const lines = grid.render(80);
    // Verify each column is 25 chars wide
  });
  
  it("falls back to vertical when too narrow", () => {
    const grid = new Grid({ spacing: 2, minColumnWidth: 20 });
    grid.addChild(new Box());
    grid.addChild(new Box());
    
    const lines = grid.render(30); // Too narrow for 2×20 columns
    // Verify vertical stacking
  });
});
```

### Flex Testing

```typescript
describe("Flex", () => {
  it("fill mode distributes extra space", () => {
    const flex = new Flex({ mode: "fill", spacing: 2 });
    flex.addChild(sized(new Box(), 10)); // Total preferred: 45
    flex.addChild(sized(new Box(), 20)); // Spacing: 4
    flex.addChild(sized(new Box(), 15)); // Available: 80
    
    // Extra: 80 - 4 - 45 = 31
    // Per child: 31 ÷ 3 = 10.33 → 10
    // Final: [20, 30, 25]
    
    const lines = flex.render(80);
    // Verify widths
  });
  
  it("wrap mode wraps when necessary", () => {
    const flex = new Flex({ mode: "wrap", spacing: 2 });
    flex.addChild(sized(new Box(), 30));
    flex.addChild(sized(new Box(), 30));
    flex.addChild(sized(new Box(), 30)); // Won't fit on first line
    
    const lines = flex.render(70); // Only 2 can fit per line
    // Verify 2 rows
  });
});
```

## Migration from HorizontalLayout

The theme-palette project initially implemented `HorizontalLayout`, which was later renamed to `Grid` for clarity.

```typescript
// Old name (deprecated in v1.0.4)
const layout = new HorizontalLayout({ spacing: 2 });

// New name (v1.0.5+)
const layout = new Grid({ spacing: 2 });

// Or use Flex if wrapping needed
const layout = new Flex({ mode: "wrap", spacing: 2 });
```

**Reason for rename**: "Grid" better communicates equal-width behavior.

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

### 2. Always Use sized() with Flex

```typescript
// ✅ Good: Explicit preferred width
flex.addChild(sized(component, 20));

// ⚠️ Works but slower: Measures by rendering
flex.addChild(component);
```

### 3. Consider Responsive Fallback

```typescript
// Grid automatically falls back to vertical
const grid = new Grid({ minColumnWidth: 20 });

// Flex wrap adapts naturally
const flex = new Flex({ mode: "wrap" });
```

### 4. Consistent Spacing

```typescript
// Use same spacing across layouts
const spacing = 2;
const grid = new Grid({ spacing });
const flex = new Flex({ spacing });
```

### 5. Cache Measurements

```typescript
class OptimizedFlex extends Flex {
  private widthCache = new Map<Component, number>();
  
  protected getPreferredWidth(component: Component): number {
    if (this.widthCache.has(component)) {
      return this.widthCache.get(component)!;
    }
    const width = super.getPreferredWidth(component);
    this.widthCache.set(component, width);
    return width;
  }
  
  override invalidate(): void {
    super.invalidate();
    this.widthCache.clear(); // Clear on invalidation
  }
}
```

## Application to UI Primitives Library

**How Layout Systems Apply to Epic 3:**

### Blanket Component
- No layout needed (fullscreen overlay)
- Single child rendering

### Modal Component
- Internal layout for content
- Could use Flex for button bar
- Grid for form fields

### Sidebar Component
- Vertical layout (Container)
- Header/content/footer sections
- Could use Grid for header actions

### Collapsible Component
- Vertical layout when expanded
- Single line when collapsed
- Potential for nested layouts

### Toasts Component
- Stack multiple toasts (Container)
- Each toast could use Flex for content+close
- No horizontal layout needed at stack level

**Key Integration Points:**
1. Modal button bars → Flex fill mode
2. Form layouts → Grid or nested Flex
3. Toast content → Flex for icon+text+close
4. Sidebar headers → Grid for title+actions

## Future Enhancements

### 1. Auto-sizing Grid

```typescript
// Grid columns sized by content, not equally
class AutoGrid extends Grid {
  protected calculateColumnWidths(totalWidth: number): number[] {
    // Measure content, distribute based on actual needs
  }
}
```

### 2. Flex Alignment Options

```typescript
interface FlexOptions {
  mode: "fill" | "wrap";
  spacing?: number;
  align?: "start" | "center" | "end";     // Horizontal alignment
  justify?: "start" | "center" | "end";   // Vertical alignment
}
```

### 3. Gap Property (CSS-like)

```typescript
interface LayoutOptions {
  gap?: number;          // Same as spacing
  rowGap?: number;       // Vertical spacing
  columnGap?: number;    // Horizontal spacing
}
```

### 4. Flex Grow/Shrink

```typescript
interface FlexChild {
  component: Component;
  grow?: number;     // How much extra space to take
  shrink?: number;   // How much to shrink when constrained
  basis?: number;    // Starting size
}
```

## References

**Source Documents:**
- `devtools/files/pi/agent/extensions/theme-palette/components/Grid.ts` (100 lines)
- `devtools/files/pi/agent/extensions/theme-palette/components/Flex.ts` (230 lines)
- `devtools/files/pi/agent/extensions/theme-palette/components/Sized.ts` (35 lines)
- `devtools/files/pi/agent/extensions/theme-palette/components/LAYOUT.md` (250 lines)
- `devtools/files/pi/agent/extensions/theme-palette/components/flex-example.ts` (280 lines)

**Related Learning:**
- [Component Architecture Patterns](learning-62c593ff-component-architecture-patterns.md)
- [Extension Widget Rendering](learning-extension-widget-rendering.md)

## Conclusion

Grid and Flex represent two fundamentally different approaches to horizontal layouts. Grid enforces uniformity (equal widths), while Flex respects content (intrinsic widths). Understanding when to use each is key to building effective TUI layouts.

**Key Takeaway**: Choose Grid for uniform columns, Flex for content-driven layouts. Both have clear use cases and should not be used interchangeably.
