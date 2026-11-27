# HTML and UI artifact style

Use this visual style for reports, websites, and UX previews created in this repository.
Audience: agents and contributors creating human-facing HTML or UI artifacts.
Updated: 2026-11-26.

## Overview

Use a compact, square, monospace interface with thin borders and clear reading order.
Adapt the layout to the reader's task. This style does not prescribe a product,
data model, navigation structure, or application framework.

Read [UI_FOUNDATION.md](UI_FOUNDATION.md) for implementation and verification guidance.
An explicit user-requested visual direction takes precedence over these defaults.
Keep accessibility and truthful data presentation in every direction.

## Contents

- [Overview](#overview)
- [Visual character](#visual-character)
- [Color and theme](#color-and-theme)
- [Typography and spacing](#typography-and-spacing)
- [Layout and components](#layout-and-components)
- [Interaction and responsive behavior](#interaction-and-responsive-behavior)
- [Content and data](#content-and-data)

## Visual character

- **Compact surfaces:** Allocate space to useful content, comparisons, and controls.
- **Square geometry:** Use zero-radius controls and panels with one-pixel borders.
- **Quiet hierarchy:** Separate sections with spacing, weight, and thin dividers.
- **Restrained decoration:** Keep surfaces flat, without decorative shadows, blur, glow, or gradients.
- **Purposeful composition:** Use a reading column, table, grid, or adjacent inspectors only when the task needs it.

## Color and theme

Use semantic color roles. The default palette is a muted violet dark theme.
Existing host themes may supply these roles instead. Light themes are allowed;
keep contrast, hierarchy, and state meaning consistent.

```css
:root {
  color-scheme: dark;
  --background: #191521;
  --surface: #241d33;
  --foreground: #e6e1f2;
  --primary: #c9a6ff;
  --muted: color-mix(in srgb, var(--surface) 85%, var(--foreground));
  --muted-foreground: color-mix(in srgb, var(--foreground) 70%, var(--background));
  --border: color-mix(in srgb, var(--foreground) 22%, var(--background));
  --destructive: #f58b92;
  --success: #9ccfd8;
  --focus-ring: var(--primary);
}
```

- **Accent:** Reserve the primary color for links, selection, and keyboard focus.
- **Status:** Pair state colors with explicit text. Distinguish unavailable data from failure.
- **Contrast:** Meet WCAG AA contrast: 4.5:1 for ordinary text and 3:1 for large text and required control boundaries.
- **Theme integration:** Map equivalent host tokens once. Keep palette values out of individual components.

## Typography and spacing

Use locally bundled JetBrains Mono weights 400 and 500 when available.
Use `monospace` as the fallback. Keep artifacts usable when the font is unavailable.
Do not require a remote font service.

- **Interface text:** Default to 13px at weight 400. Use a readable line height, normally 1.5.
- **Section labels:** Use 10px at weight 500, uppercase, with 0.1em tracking for short labels only.
- **Reading text:** Increase body size when sustained reading needs it. Keep headings restrained and maintain browser zoom.
- **Code and identifiers:** Inherit monospace typography. Wrap long values or provide local overflow without clipping content.
- **Spacing rhythm:** Use a 4px base, with 8px compact gaps, 12px row spacing, 16px panel padding, and 20px section spacing.

## Layout and components

- **Reports:** Put the finding or decision first. Follow with evidence, comparisons, and supporting detail.
- **Websites:** Keep navigation compact and task-focused. Use meaningful headings and a clear primary action where needed.
- **UX previews:** Label each option and its meaningful difference. Keep comparison controls separate from prototype controls.
- **Reading surfaces:** Constrain prose width. Use full width for tables and comparisons when it improves reading.
- **Panels:** Add borders where they clarify grouping. Avoid enclosing every content block in a card.
- **Controls:** Use compact square buttons and inputs with visible labels and distinct selected, disabled, and focus states.
- **Inspectors:** Use adjacent detail panels when context matters. Use a modal only when the interaction needs one.
- **Charts:** Show meaningful measurements with units and labels. Provide an accessible text or table equivalent.

## Interaction and responsive behavior

- **Keyboard access:** Keep every action operable by keyboard and give focus a visible outline.
- **Focus outline:** Default to a 2px outline with a 3px offset. Inset it when a flush container would clip it.
- **Touch targets:** Keep touch controls at least 44px in each dimension, even when the visible mark is smaller.
- **Narrow layouts:** Reflow navigation, comparisons, and reading tracks without hiding essential content or actions.
- **Local overflow:** Scroll wide tables, code, and genuinely two-dimensional workspaces within their own containers.
- **Motion:** Use motion only to explain state changes. Respect reduced-motion preferences.
- **Progressive disclosure:** Keep details available without making the initial view noisy. Essential actions must not depend on hover.

## Content and data

- **Real evidence:** Keep reported results faithful to observed data. Show missing values as unavailable, not zero.
- **Preview fixtures:** Label sample data, simulations, and unimplemented actions explicitly.
- **Useful states:** Provide relevant loading, empty, unavailable, error, and success states with an actionable explanation.
- **Plain labels:** Use short, explicit text. Preserve exact commands, identifiers, paths, and quoted errors.
- **No decorative metrics:** Use charts and numbers to answer a question, not to fill space.

