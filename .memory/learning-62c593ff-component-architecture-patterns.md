# Learning: Component Architecture Patterns for Pi TUI

**Source:** Theme Palette Extension Documentation Analysis  
**Created:** 2026-01-11  
**Epic:** [Theme Development Tools](epic-c2b8f4e6-theme-development-tools.md)

## Overview

This document distills architectural patterns and best practices discovered through the comprehensive documentation created for the theme-palette extension, specifically focusing on reusable component architecture, data-driven design, and production-ready component systems.

## Key Findings from Theme Palette Documentation

### 1. Component Hierarchy Pattern (3-Level Architecture)

The theme-palette extension demonstrates a clean 3-level component hierarchy:

```
Palette (Container Level)
  └── Group[] (Organizational Level)
        └── Chip[] (Leaf Level)
```

**Pattern Benefits:**
- **Composability**: Components combine naturally without coupling
- **Separation of Concerns**: Each level has single responsibility
- **Reusability**: Any component can be used standalone
- **Testability**: Each level tests independently

**Implementation Pattern:**
```typescript
// Level 3: Leaf Component (Chip)
class Chip extends Box {
  constructor(theme: Theme, data: ChipData) {
    super();
    this.updateDisplay();
  }
  
  private updateDisplay(): void {
    // Build display from data
    this.clearChildren();
    this.addChild(new Text(/* themed content */));
  }
  
  override invalidate(): void {
    super.invalidate();
    this.updateDisplay(); // Rebuild on theme change
  }
}

// Level 2: Organizational Component (Group)
class Group extends Box {
  private chips: Chip[] = [];
  
  constructor(theme: Theme, data: GroupData) {
    super();
    this.updateDisplay();
  }
  
  private updateDisplay(): void {
    this.clearChildren();
    this.addChild(new Text(/* title */));
    for (const chip of this.chips) {
      this.addChild(chip);
    }
  }
}

// Level 1: Container Component (Palette)
class Palette extends Box {
  private groups: Group[] = [];
  
  constructor(theme: Theme, data: PaletteData) {
    super();
    this.updateDisplay();
  }
}
```

### 2. Data-Driven Design Pattern

**Core Principle**: Separate data structure from rendering logic.

**Data Structure Pattern:**
```typescript
// Pure data interfaces (no logic)
interface ChipData {
  name: string;
  description: string;
}

interface GroupData {
  title: string;
  chips: ChipData[];
}

interface PaletteData {
  title?: string;
  groups: GroupData[];
}
```

**Benefits Discovered:**
- **78% Code Reduction**: V1 (inline) vs V2 (component-based)
- **Easy Serialization**: Data structures are JSON-compatible
- **Testing Simplicity**: Test data transformations separately from rendering
- **Maintainability**: Changes to display only require data updates

**Before (Inline - 70 lines):**
```typescript
render() {
  const lines: string[] = [];
  // 50+ lines of manual string building
  lines.push(theme.fg("accent", "══ Title ══"));
  for (const item of items) {
    const swatch = theme.fg(item.name, "██");
    // ... more string building
  }
  return lines;
}
```

**After (Data-Driven - 15 lines):**
```typescript
const palette = new Palette(theme, {
  groups: [{
    title: "Title",
    chips: items
  }]
});
return palette.render(width);
```

### 3. Theme Integration Pattern

**Automatic Theme Invalidation Chain:**

```
Theme Change Event
    ↓
TUI.invalidate()
    ↓
Palette.invalidate()
    ↓
├─→ super.invalidate() (Container invalidates children)
│       ↓
│   Group[].invalidate()
│       ↓
│   ├─→ super.invalidate() (Box invalidates children)
│   │       ↓
│   │   Chip[].invalidate()
│   │       ↓
│   │   └─→ updateDisplay() (rebuild with new theme)
│   │
│   └─→ updateDisplay() (rebuild with new theme)
│
└─→ updateDisplay() (rebuild with new theme)
```

**Pattern Implementation:**
```typescript
class ThemeAwareComponent extends Box {
  constructor(private theme: Theme, private data: ComponentData) {
    super();
    this.updateDisplay();
  }
  
  // Rebuild display with current theme
  private updateDisplay(): void {
    this.clearChildren();
    // Use theme.fg(), theme.bg() for all colors
    this.addChild(new Text(this.theme.fg("accent", this.data.title)));
  }
  
  // Automatically called on theme change
  override invalidate(): void {
    super.invalidate(); // Propagate to children
    this.updateDisplay(); // Rebuild with new theme
  }
  
  // Public API for data updates
  setData(data: ComponentData): void {
    this.data = data;
    this.updateDisplay();
    this.invalidate();
  }
}
```

### 4. Component State Management Pattern

**State Encapsulation Pattern:**
```typescript
class StatefulComponent {
  // Private state
  private data: ComponentData;
  private children: Component[] = [];
  
  // Controlled mutations
  setData(data: ComponentData): void {
    this.data = data;
    this.rebuild();
  }
  
  addChild(data: ChildData): void {
    const child = new Child(this.theme, data);
    this.children.push(child);
    this.rebuild();
  }
  
  removeChild(index: number): void {
    this.children.splice(index, 1);
    this.rebuild();
  }
  
  // Private rebuild ensures consistency
  private rebuild(): void {
    this.clearChildren();
    for (const child of this.children) {
      this.addChild(child);
    }
    this.invalidate();
  }
  
  // Public readonly access
  getData(): ComponentData {
    return { ...this.data }; // Return copy
  }
}
```

### 5. Component API Design Pattern

**Best Practice: Consistent API Across All Levels**

```typescript
// Every component supports these methods:
interface ComponentAPI<TData> {
  // Data management
  setData(data: TData): void;
  getData(): TData;
  
  // Lifecycle
  invalidate(): void;
  render(width: number): string[];
  
  // Component-specific methods
  // (addChild, removeChild, etc.)
}
```

**Benefits:**
- **Predictability**: Developers know what to expect
- **Composability**: Components work together naturally
- **Documentation**: API docs follow same pattern
- **Testing**: Tests follow same structure

### 6. Widget Factory Pattern

**Problem**: Theme instances change over time  
**Solution**: Factory function creates fresh instances

```typescript
// ❌ BAD: Shared instance across themes
const palette = new Palette(theme, data);
ctx.ui.setWidget("palette", () => palette);
// Problem: palette still uses old theme

// ✅ GOOD: Factory creates new instance with current theme
ctx.ui.setWidget("palette", (tui, theme) => {
  return new Palette(theme, data);
});
// Solution: new palette gets current theme
```

**Critical Pattern for Pi Extensions:**
- Always use factory function `(tui, theme) => Component`
- Never cache component instances across theme changes
- Let Pi TUI manage component lifecycle

### 7. Progressive Enhancement Pattern

**V1 → V2 Migration Strategy**

**V1 (Inline)**: Quick prototypes, simple displays
- Single render() method
- No reusability
- Fast to write
- Hard to maintain

**V2 (Components)**: Production systems, reusable libraries
- Modular architecture
- Highly reusable
- More upfront work
- Easy to maintain

**When to Use Each:**
- **V1**: One-off widgets, learning, prototypes, performance-critical
- **V2**: Reusable libraries, complex UIs, team projects, long-term code

**Migration Path:**
```typescript
// Step 1: V1 inline (prototype)
class SimpleWidget {
  render() { /* manual rendering */ }
}

// Step 2: Hybrid (gradual)
class HybridWidget {
  render() {
    return [
      ...this.renderHeader(), // V1 style
      ...this.palette.render() // V2 components
    ];
  }
}

// Step 3: Full V2 (production)
ctx.ui.setWidget("widget", (tui, theme) => {
  return new Palette(theme, data);
});
```

### 8. Documentation Pattern for Component Systems

**5-Document Structure** (from theme-palette):

1. **README.md**: Extension overview, installation, usage
2. **QUICKSTART.md**: 5-minute getting started guide
3. **ARCHITECTURE.md**: Visual diagrams and technical details
4. **COMPARISON.md**: Design decision comparisons (V1 vs V2)
5. **components/README.md**: Detailed component API reference

**Additional Artifacts:**
- **PROJECT_SUMMARY.md**: Metrics, achievements, outcomes
- **CHANGELOG.md**: Version history and breaking changes
- **TEST.md**: Testing procedures and checklists
- **components/example.ts**: 7 working examples
- **components/LAYOUT.md**: Specialized component guides

**Documentation Principles:**
- Start with quick wins (QUICKSTART)
- Provide visual aids (ARCHITECTURE)
- Explain trade-offs (COMPARISON)
- Show working code (example.ts)
- Separate concerns (components/ subdirectory)

### 9. Layout Component Patterns

**Grid vs Flex Pattern**:

**Grid (Equal Width Distribution)**:
```typescript
// Use case: Uniform columns (dashboard metrics, table columns)
const grid = new Grid({ spacing: 2 });
grid.addChild(metric1); // Gets 1/3 width
grid.addChild(metric2); // Gets 1/3 width
grid.addChild(metric3); // Gets 1/3 width
```

**Flex (Intrinsic Sizing)**:
```typescript
// Use case: Variable widths (tags, buttons, badges)
const flex = new Flex({ mode: "wrap", spacing: 1 });
flex.addChild(sized(tag1, 10)); // Preferred width
flex.addChild(sized(tag2, 15)); // Different width
// Wraps to next line when doesn't fit
```

**Sized Wrapper Pattern**:
```typescript
// Declare preferred width for components
const sized = (component: Component, width: number) => {
  return new Sized(component, width);
};

// Use in Flex layouts
flex.addChild(sized(new Text("Hello"), 10));
```

### 10. Component Testing Patterns

**Three-Level Testing Strategy:**

```typescript
// Level 1: Unit Tests (individual components)
describe("Chip", () => {
  it("renders color swatch", () => {
    const chip = new Chip(theme, { name: "accent", description: "Test" });
    const lines = chip.render(80);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain("██");
  });
});

// Level 2: Integration Tests (component composition)
describe("Group", () => {
  it("renders all chips", () => {
    const group = new Group(theme, {
      title: "Test",
      chips: [chip1Data, chip2Data]
    });
    const lines = group.render(80);
    expect(lines).toContain(/* chip1 output */);
    expect(lines).toContain(/* chip2 output */);
  });
});

// Level 3: Examples as Tests (real-world usage)
// components/example.ts contains 7 working examples
// Each example serves as integration test
```

## Architectural Principles Extracted

### 1. Composition Over Inheritance
- Components compose using Container/Box
- No deep inheritance hierarchies
- Prefer aggregation and delegation

### 2. Separation of Concerns
- Data structures separate from rendering
- Each component has single responsibility
- Clear boundaries between levels

### 3. Encapsulation
- Private state management
- Public API for controlled mutations
- Internal consistency guaranteed

### 4. Theme Awareness
- Automatic theme change handling
- No manual color management needed
- Invalidation chain propagates automatically

### 5. Type Safety
- Full TypeScript interfaces
- Compile-time error detection
- Self-documenting code

### 6. Developer Experience
- Simple, predictable API
- Clear documentation
- Working examples
- Gradual learning path

## Lessons Learned

### What Works Well

1. **Data-Driven Design**: 78% code reduction achieved
2. **Component Hierarchy**: Clear mental model, easy to understand
3. **Automatic Invalidation**: No manual refresh management
4. **Factory Pattern**: Solves theme update problems elegantly
5. **Progressive Enhancement**: V1→V2 path allows gradual adoption

### What to Avoid

1. **Deep Nesting**: Keep hierarchy to 3-4 levels maximum
2. **Shared State**: Each component manages own state
3. **Cached Instances**: Always use factory functions for widgets
4. **Manual Theme Management**: Let invalidation chain handle it
5. **Mixed Responsibilities**: Keep components focused

### Performance Considerations

1. **Caching**: Components cache render output until invalidated
2. **Granular Updates**: Invalidate specific components, not entire tree
3. **Memory**: Component tree has overhead vs inline rendering
4. **Optimization**: Start simple, optimize when needed

## Future Enhancement Patterns

From theme-palette roadmap:

1. **Interactive Components**: Selection, navigation, events
2. **Search/Filter**: Dynamic content filtering
3. **Export**: Data serialization and persistence
4. **Theming**: Custom theme overrides
5. **Responsive**: Adapt to terminal width changes
6. **Animation**: State transitions and feedback
7. **Accessibility**: Screen reader support, keyboard navigation

## Reusable Component Patterns

### Pattern: Color Detection
```typescript
// Auto-detect background colors
const isBgColor = colorName.endsWith("Bg");
const swatch = isBgColor 
  ? theme.bg(colorName, "    ") 
  : theme.fg(colorName, "██");
```

### Pattern: Padded Display
```typescript
// Consistent column alignment
const name = colorName.padEnd(20);
const nameText = theme.fg("text", name);
```

### Pattern: Grouped Content
```typescript
// Title with decorative separators
const title = theme.fg("accent", `══ ${groupTitle} ══`);
```

### Pattern: Border Rendering
```typescript
// Box component with themed border
class BorderedComponent extends Box {
  constructor(theme: Theme) {
    super();
    // Border automatically rendered by Box
    // Use theme.fg("borderAccent", ...) for border color
  }
}
```

## Application to UI Primitives Library

**How These Patterns Apply to Epic 3:**

1. **Blanket Component**: Follow Chip pattern (leaf component)
2. **Modal Component**: Follow Group pattern (container + content)
3. **Sidebar Component**: Follow Palette pattern (top-level container)
4. **Collapsible**: New pattern - stateful expansion/collapse
5. **Toasts**: New pattern - queue management, auto-dismiss

**Key Adaptations Needed:**
- Add keyboard event handling (not in theme-palette)
- Implement animation/transitions (theme-palette is static)
- Add overlay positioning (theme-palette uses widget)
- Support interactive states (hover, focus, active)
- Manage multiple instances (ToastManager queue)

## References

**Source Documents:**
- `devtools/files/pi/agent/extensions/theme-palette/README.md` (400 lines)
- `devtools/files/pi/agent/extensions/theme-palette/ARCHITECTURE.md` (500 lines)
- `devtools/files/pi/agent/extensions/theme-palette/PROJECT_SUMMARY.md` (300 lines)
- `devtools/files/pi/agent/extensions/theme-palette/COMPARISON.md` (400 lines)
- `devtools/files/pi/agent/extensions/theme-palette/QUICKSTART.md` (350 lines)
- `devtools/files/pi/agent/extensions/theme-palette/components/README.md` (350 lines)
- `devtools/files/pi/agent/extensions/theme-palette/components/LAYOUT.md` (250 lines)

**Related Learning:**
- [Extension Widget Rendering](learning-extension-widget-rendering.md)
- [Theme Widget Patterns](learning-theme-widget-patterns.md)
- [Pi Extensions Guide](learning-76e583ca-pi-extensions-guide.md)

## Conclusion

The theme-palette extension documentation represents a comprehensive case study in building production-ready component systems for Pi TUI. The patterns extracted here form the foundation for building the UI Primitives Library (Epic 3) and future component development.

**Key Takeaway**: Start with data-driven design, build composable components, document thoroughly, and provide clear migration paths.
