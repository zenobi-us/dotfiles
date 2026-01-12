# Design Hierarchy Implementation

This extension demonstrates design principles from the `basic-design-principles` skill using Rose Pine Moon theme with shade variants.

## Color Shade System

Each base color has two variants:
- **`-1`**: 20% darker (for receding elements)
- **`+1`**: 12.5% lighter (for prominence)

## Design Decisions Applied

### 1. Contrast Hierarchy (Four Levels)

Building a system where every element has proper visual weight:

```
text      → Foreground (primary content)
muted     → Secondary (supporting text)
dim       → Muted (subtle-1, recedes into background)
border    → Faint (overlay-1, defines structure)
```

**Why:** Creates clear information hierarchy. Primary content demands attention, supporting elements recede appropriately.

### 2. Surface Elevation via Color

Using background color shifts instead of heavy shadows:

```
surface+1 → Elevated surfaces (userMessageBg)
base      → Default surface level
surface-1 → Recessed areas (customMessageBg)
overlay-1 → Subtle separation (toolPendingBg)
```

**Why:** Flat approach with color shifts feels technical and precise. Borders-only depth strategy matches developer tool aesthetic.

### 3. Interactive Element Hierarchy

Accent colors use shades to create prominence levels:

```
iris+1 → Prominent interactions (headings, labels)
iris   → Standard interactive elements
iris-1 → Subtle borders and accents
```

**Why:** Lighter variants feel more "clickable" and draw attention. Darker variants provide definition without competing for attention.

### 4. Typography Hierarchy via Color

```
text   → Primary content (full brightness)
text-1 → Code blocks, tool output (slightly muted)
```

**Why:** Muting secondary text prevents visual competition with primary content. Code blocks don't need to scream.

### 5. Progressive Intensity (Thinking Levels)

```
thinkingOff     → muted-1  (darkest)
thinkingMinimal → pine-1   (dark)
thinkingLow     → foam-1   (soft)
thinkingMedium  → iris     (base)
thinkingHigh    → rose+1   (bright)
thinkingXhigh   → love     (bold)
```

**Why:** Visual progression from dark to bright creates intuitive intensity scale.

### 6. Borders - Subtle Definition

All borders use darker variants for refined, non-intrusive definition:

```
border          → overlay-1 (default border)
borderAccent    → iris-1    (accent border)
borderMuted     → overlay-1 (muted border)
mdCodeBlockBorder → overlay+1 (slightly more visible)
```

**Why:** Borders should define, not decorate. Darker variants provide structure without visual weight.

### 7. Semantic Color Brightness

Diff colors use lighter variants to soften impact:

```
toolDiffAdded   → foam+1 (softer green)
toolDiffRemoved → love+1 (softer red)
toolDiffContext → subtle-1 (recedes)
```

**Why:** Full-brightness semantic colors can be harsh. Lighter variants communicate meaning without visual aggression.

## Component Structure

### Palette Component
- **Header Box**: `surface+1` background (elevated)
- **Content Box**: `base` background (default level)
- **Title**: Bold accent color (iris)
- **Subtitle**: Dim color (subtle-1)

### Group Component
- **Outer Box**: `surface+1` background with padding
- **Title Box**: Separate container for group title
- **Content Box**: `base+1` background for chips
- **Title Text**: Bold accent (iris)

### Chip Component
- **Container Box**: `overlay-1` background (subtle)
- **Name Text**: Primary text color
- **Description**: Dim color (subtle-1)

## Grid System (4px Base)

All spacing follows 4px increments:
- Box padding: 4px (1 unit), 8px (2 units)
- Group spacing: 8px between groups
- Chip spacing: 8px between chips

## Design Philosophy Applied

**"Precision & Density"** direction:
- Borders-only depth approach (no shadows)
- Subtle color shifts for elevation
- Technical, information-forward aesthetic
- Monochrome base with semantic color accents

**"Color for Meaning Only"**:
- Gray builds structure
- Color only for status, action, state
- No decorative color usage

**"Isolated Controls"**:
- Each chip is a crafted object
- Consistent container treatment
- Clear visual hierarchy within each element

## Testing the Design

Run the extension:
```bash
/theme-palette
```

Observe:
1. **Header elevation** - lighter background than content
2. **Group separation** - subtle borders and backgrounds
3. **Text hierarchy** - primary vs. secondary vs. muted
4. **Color contrast** - each shade variant's purpose
5. **Spacing consistency** - 4px grid alignment

## Learning Points

1. **Darker shades recede** - Comments, punctuation, borders
2. **Lighter shades lift** - Headings, interactive elements
3. **Color shifts create depth** - No shadows needed
4. **Hierarchy through contrast** - Four levels minimum
5. **Consistency matters** - Same approach everywhere

This demonstrates how thoughtful shade usage creates sophisticated visual hierarchy without complexity.
