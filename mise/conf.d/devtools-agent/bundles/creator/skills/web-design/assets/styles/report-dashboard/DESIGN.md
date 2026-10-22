---
version: alpha
name: Margin-benchmark-dashboard
description: Compact, square archive for inspecting real Margin reports. An Apple Finder-style column drill-down pairs violet-dusk color inspiration from Zot docs with hrdx's minimalist terminal look: thin borders, bundled JetBrains Mono, a top-of-page daily vertical-line chart, composable harness/model/suite facets, and adjacent report/case inspectors.

colors:
  background: "#191521"
  card: "#241d33"
  foreground: "#e6e1f2"
  primary: "#c9a6ff"
  muted: "color-mix(in srgb, {colors.card} 85%, {colors.foreground})"
  muted-foreground: "color-mix(in srgb, {colors.foreground} 70%, {colors.background})"
  border: "color-mix(in srgb, {colors.foreground} 22%, {colors.background})"
  destructive: "#f58b92"
  success: "#9ccfd8"
  chart-empty-day: "color-mix(in srgb, {colors.foreground} 7%, {colors.background})"
  focus-ring: "{colors.primary}"

typography:
  interface:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: normal
  section-label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 10px
    fontWeight: 500
    lineHeight: normal
    letterSpacing: 0.1em
    textTransform: uppercase
  code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: inherit
    fontWeight: 400
    lineHeight: inherit

rounded:
  all: 0px

spacing:
  base: 4px
  compact: 8px
  row: 12px
  panel: 16px
  section: 20px

components:
  daily-chart:
    library: "shadcn Base Chart"
    marks: "thin vertical lines, one compact fixed slot per UTC day"
    empty-day: "dim placeholder line, slightly brighter than page background"
    date-selection: "filters benchmark reports for that date; chart remains visible"
    composition: "date selection preserves other active facets"
  facet-groups:
    controls: "shadcn Base Nova"
    groups: [harness, model, suite]
    combination: "OR within a facet; AND across facets"
  finder-columns:
    controls: "shadcn Base Nova"
    order: [scope-facets, reports, selected-report-inspector, selected-case-inspector]
    border: "1px solid {colors.border}"
    radius: "{rounded.all}"
  report-inspector:
    content: "report metadata, case list, real archive status"
  case-inspector:
    content: "task prompt, sample outcomes, metadata, expandable raw result JSON"
---

## Overview

The Margin benchmark dashboard is a working archive, not a marketing site. The chosen direction is an Apple Finder-style column drill-down: browse report facets and reports, inspect a selected report, then open its selected case in a new column to the right. A daily chart sits above the columns. The visual direction takes color-theme inspiration from Zot documentation and the square, minimalist terminal presentation of hrdx API.

Use a violet-dusk dark palette, thin borders, square geometry, compact spacing, and monospace text. Use shadcn components throughout, with shadcn Base Chart for the daily vertical-line chart. Avoid hero bands, pricing cards, oversized editorial display type, customer-logo strips, and other marketing patterns.

**Key Characteristics:**
- Violet-dusk page background and muted-purple card surface; lavender primary accent.
- Compact monospace interface with 13px body text and 10px uppercase section labels.
- Square corners and clear one-pixel column/panel separators; no decorative shadows.
- Daily chart above the Finder-style columns; chart date selection composes with URL-backed filters.
- Report and case inspection are progressive columns, not modal detail pages.
- Display only real archive data. Missing result files stay unavailable and are never rendered as synthetic zero scores.

## Colors

### Brand & Accent
- **Primary** (`{colors.primary}` — `#c9a6ff`): lavender accent for selected states, chart score marks, links, and visible keyboard focus.
- **Destructive** (`{colors.destructive}` — `#f58b92`): failed/error status treatment.
- **Success** (`{colors.success}` — `#9ccfd8`): succeeded/completed status treatment. Every theme defines `--success`; monochrome `#dadada` keeps that theme grayscale, monoslate `#8fae8f` is a muted sage.

### Surface
- **Background** (`{colors.background}` — `#191521`): dashboard canvas.
- **Card** (`{colors.card}` — `#241d33`): component surface, panels, and popovers.
- **Border** (`{colors.border}`): `color-mix(in srgb, foreground 22%, background)`; shared thin divider and control outline.
- **Empty-day mark** (`{colors.chart-empty-day}`): `color-mix(in srgb, foreground 7%, background)`, subtly brighter than the canvas and distinct from actual scores.

### Text
- **Foreground** (`{colors.foreground}` — `#e6e1f2`): primary labels and report content.
- **Muted** (`{colors.muted}`): `color-mix(in srgb, card 85%, foreground)`; subdued surface/control tone.
- **Muted foreground** (`{colors.muted-foreground}`): `color-mix(in srgb, foreground 70%, background)`; secondary copy and labels.
- **Focus ring** (`{colors.focus-ring}`): primary lavender, 2px outline with 3px offset.

The CSS theme maps shadcn background, foreground, card, primary, secondary/muted, accent, destructive, border, input, and ring roles to these variables. Preserve those semantic mappings rather than introducing a separate palette. The theme is dark-only (`color-scheme: dark`).

## Typography

### Font Family
The application imports local JetBrains Mono weights 400 and 500 from `@fontsource/jetbrains-mono`. Both `--font-sans` and `--font-mono` resolve to `'JetBrains Mono', monospace`; body and controls inherit the same face. Do not assume an external font service or substitute Inter.

### Hierarchy

| Token | Size | Weight | Treatment | Use |
|---|---:|---:|---|---|
| `{typography.interface}` | 13px | 400 | normal line-height | Default body, control, and archive text |
| `{typography.section-label}` | 10px | 500 | 0.1em tracking, uppercase | Column headings and compact section labels |
| `{typography.code}` | inherited | 400 | monospace | Prompts, identifiers, and raw result data |

Use hierarchy through spacing, weight, color, and borders rather than oversized headings. Long model names, prompts, and metadata must wrap instead of widening a column.

### Principles
- Keep labels short and scan-friendly; use uppercase only for small section labels.
- Keep identifiers and machine-produced values monospace and preserve readable wrapping.
- Do not add unverified font sizes, weights, line heights, or external typefaces to the token set.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Reference rhythm:** compact 8px gaps, 12px row spacing, 16px panel padding, and 20px section spacing.
- Prefer dense, practical spacing over marketing-page whitespace. Keep column boundaries and row dividers legible.

### Grid & Container
- The daily chart spans above the browsing workspace.
- Below it, the column order is scope facets → reports → selected report inspector → selected case inspector.
- Finder columns remain side-by-side and horizontally scrollable when the viewport cannot fit them; do not collapse the drill-down into stacked cards on small screens.
- Each column scrolls vertically independently. The workspace supports horizontal scrolling to reveal newly opened columns.
- Facets are harness, model, and suite. Search and selected UTC date compose with these facets. Selection is OR within one facet and AND between facets.

### Whitespace Philosophy
Keep the information density of a developer tool: compact lists, restrained panel padding, clear boundaries, and no large empty hero areas. Allocate vertical space to the chart and actual inspection content.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Canvas | `{colors.background}` | Page and workspace floor |
| Panel | `{colors.card}` with thin `{colors.border}` separator | Controls, cards, and column surfaces |
| Selected | `{colors.primary}` accent and/or foreground contrast | Active report, case, date, and keyboard focus |

Do not use drop shadows or layered marketing-card elevation. Depth comes from adjacent column surfaces, separators, and selected-state contrast.

### Decorative Depth
No decorative illustration, terminal-window chrome, or synthetic data visualization. The archive itself is the interface. Empty calendar slots use the specified dim mark; they must remain visibly different from actual zero-valued results.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---:|---|
| `{rounded.all}` | 0px | shadcn Base Nova cards, buttons, badges, inputs, and dashboard panels |

Keep controls square and bordered. Do not use pill badges or rounded cards to suggest a different design system.

## Components

### Top Navigation
Use the shared shadcn Base Nova `NavigationMenu` between the Margin identity and theme controls. Provide Reports, Suites, Cases, Harnesses, and Models links with an explicit active state. Keep the row compact, square, and keyboard accessible. At narrow widths, place navigation on its own horizontally scrollable header row. Do not add a marketing navigation bar, logo-centered hero, or CTA cluster.

The app header and navigation containers have no padding. On desktop, navigation
items extend from the top of the window to the header's bottom border. Use
shared vertical dividers with no top or bottom item borders and no gaps between
items. Keep text padding inside links; keep the brand and theme controls inset
within their own content. Place keyboard focus outlines inside the links so
the flush container does not clip them.

### Knowledge Store — Runbook

Use the selected **15 — Runbook** arrangement for suite, suite-case, harness,
and model detail pages. A compact full-width identity header precedes a numbered
reading-order rail and a single documentation track. Keep the source reference
in the rail. Numbers indicate section order, not executable steps.

Use the existing interface and section-label typography. Separate sections with
thin borders and square card surfaces. Long identifiers, prompts, and selected
manifest fields wrap within the reading track. Show related records and links
to benchmark runs without substituting run status for a score.

Keep the full title card sticky at the top of the wiki's scrolling content on
every detail page. Measure its rendered height so wrapped titles do not cover
section jump targets. At wide widths, keep the reading-order rail sticky below
the title card, with its own scrolling when needed. At narrow widths, place the
rail before the article. This reflow applies to wiki pages only; report
inspection keeps the existing horizontal Finder columns.

Catalogs provide searchable record lists and explicit empty states. Distinguish
repository records from archive-only identities. Current repository definitions
are not historical run snapshots. Keep unavailable prompts and model
specifications explicit; do not reconstruct them from names.

### Buttons
Use shadcn Base Nova buttons for actions and row selection. Preserve square edges, visible focus outline, compact sizing, and clear selected/disabled states. Date controls and Clear date actions must not clear unrelated filters.

### Cards & Containers

**`daily-chart`** — Place a chart of thin vertical daily lines above the browsing workspace. Each line represents one UTC date; keep the lines compact and fixed-slot rather than spreading them evenly to fill available width, shrinking the slots to fit the container instead of scrolling when the viewport is too narrow for the minimum day count. Show dim placeholder lines, only slightly brighter than the page background, for days with no tests. Clicking a date column filters the benchmark/report list for that date. The chart uses one keyboard focus target: arrow keys browse days with a dashed cursor on the browsed day, Home and End jump to the first and last day, and Enter or Space selects the current day. Keep the chart visible during filtering, and let date selection compose with the report facets. Do not represent days without tests as zero-score data. Use shadcn Base Chart.

**`finder-columns`** — The main workspace follows the Finder drill-down order: scope facets, report list, selected report inspector, selected case inspector. Open the case inspector as a new column to the right of the report inspector. Use thin bordered, square columns with independently scrolling bodies. When a column opens, reveal it horizontally; preserve navigable state and restore focus to the originating selection when closing/backing out.

**`facet-groups`** — Provide harness, model, and suite facets plus search and the selected date. Allow multiple values in one facet (OR); combine distinct facet groups (AND). Keep active filter state visible and provide clear actions that affect only their stated scope.

**`report-row`** — Show concise report identity and meaningful status. Distinguish unavailable result files from completed, failed, unknown, or incomplete records. Do not invent result content to fill a missing report.

**`report-inspector`** — Show selected report details and its case list within the report column. Selecting a case opens the adjacent case inspector without replacing the report context.

**`case-inspector`** — Present the task prompt, sample outcomes, metadata, and expandable raw result JSON. Preserve exact underlying values; keep long prompts and JSON readable through wrapping or local horizontal scrolling as appropriate.

### Inputs & Forms
Use Base Nova inputs for search and date-related controls. Keep labels and keyboard focus visible. Search, facets, and date selection compose; clearing one control must preserve the others.

### Tags / Badges
Use compact square Base Nova badges for report state and metadata. Status text must remain explicit, including “Results unavailable”; color alone is not a status signal.

Status badges go through the shared `StatusBadge` (`dashboard/src/components/Archive/status-badge.tsx`): a lucide icon plus the explicit label on a tinted wash — `bg {state}/10`, `border {state}/40`, `text {state}`. Succeeded/completed use `success`, failed uses `destructive`, running spins `LoaderCircle` (disabled under `prefers-reduced-motion`), and missing result files render the neutral dashed `CircleSlash` “Results unavailable” badge — never destructive.

### Tab / Filter
Facet controls expose harness, model, and suite choices. Multiple selections in one group are ORed; groups combine with AND. Date is an independent URL-backed filter. Keep the date chart/calendar available during date selection.

### CTA / Footer
No promotional CTA band or marketing footer is part of the benchmark archive. Use available page space for report browsing and inspection.

## Do's and Don'ts

### Do
- Use the Design 02 Finder-style column drill-down as the canonical archive layout.
- Place the daily chart above the columns. Keep its vertical lines thin and compact; use dim placeholder lines for days with no tests, not zero-score values.
- Filter the report list when a chart date is selected, while keeping the chart visible and other active facets intact.
- Keep facets, search, date, selected report, and selected case state composable and navigable.
- Use shadcn components throughout and Base Chart for the daily chart.
- Keep every visual claim grounded in real archive records; unavailable results remain unavailable.
- Support keyboard navigation, focus return, independent column scrolling, and mobile horizontal column scrolling.

### Don't
- Reintroduce ClickHouse yellow/black tokens, Inter typography, rounded marketing cards, hero sections, pricing, CTA bands, or logo strips.
- Reflow chart dates to fill available width or move the 30-day window when filters change.
- Represent empty days or missing result files as zero scores.
- Clear facets or search when toggling the selected date, or clear the date when removing another filter.
- Replace the inspector column with a modal or remove report context when opening a case.
- Rely on color alone for score availability, report status, or keyboard focus.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---:|---|
| Compact | ≤ 640px | Columns remain horizontal; workspace scrolls horizontally to reveal the active inspector. |
| Wide | > 640px | Show more Finder columns in the viewport; maintain the same chart and column hierarchy. |

Do not document unimplemented breakpoint values or imply the columns stack on mobile.

### Touch Targets
Use native Base Nova control sizing and retain comfortable interactive rows. Keep chart date targets operable by pointer and keyboard; do not make the 3px visual mark the only hit target.

### Collapsing Strategy
- Keep the daily chart above the workspace at every width.
- Preserve horizontal column drill-down on mobile; bring a newly opened column into view.
- Keep each column's body independently vertically scrollable.
- Allow long names and metadata to wrap within a column rather than forcing page-wide overflow.

### Chart Behavior
Keep fixed 10px day slots and 3px marks at narrow widths. The chart may use its own horizontal overflow where required, but must not compress or evenly spread date marks. Date labels and chart marks share the same selection and keyboard behavior.

## Iteration Guide

1. Treat this document and the implemented archive under `dashboard/src/components/archive/` as the dashboard design contract.
2. Keep palette values and semantic mappings aligned with `dashboard/src/styles.css`; use existing CSS variables instead of duplicating hex values.
3. Preserve the chart window, empty-day treatment, date/filter combination, and URL-backed selection behavior when changing the chart.
4. Extend the existing Base Nova and Base Chart patterns; do not create a parallel component convention.
5. When changing Finder columns, retain column order, independently scrolling bodies, horizontal reveal, selection state, and focus return.
6. Keep report and case information faithful to archive data. Data inference or publication rules belong to data implementation documentation, not visual tokens.

## Known Gaps

- The stylesheet defines semantic CSS color mixes for muted, border, and empty-day colors rather than fixed hex values; do not present these as sampled hex tokens.
- The stylesheet establishes global typography and radius behavior, not a full per-component size/spacing scale. Additional exact values should be documented only when confirmed in the implementation.
- Score colors beyond `success` and `destructive` remain component-specific; they are not global root tokens in `dashboard/src/styles.css`.
- This design document describes the visual and interaction contract. Legacy suite inference and external-source publication are data implementation constraints, not visual requirements.
