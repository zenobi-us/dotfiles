# Changelog

## [0.1.0] - 2026-02-16

Initial release.

### Skill
- Core workflow: Think (pick aesthetic) → Structure (read template) → Style (apply design) → Deliver (write + open)
- 11 diagram types with rendering approach routing (Mermaid, CSS Grid, HTML tables, Chart.js)
- 9 aesthetic directions (monochrome terminal, editorial, blueprint, neon, paper/ink, sketch, IDE-inspired, data-dense, gradient mesh)
- Mermaid deep theming with `theme: 'base'` + `themeVariables`, hand-drawn mode, ELK layout
- Zoom controls (buttons, scroll-to-zoom, drag-to-pan) required on all Mermaid containers
- Proactive table rendering — agent generates HTML instead of ASCII for complex tables
- Optional AI-generated illustrations via surf-cli + Gemini Nano Banana Pro
- Both light and dark themes via CSS custom properties and `prefers-color-scheme`
- Quality checks: squint test, swap test, overflow protection, zoom controls verification

### References
- `css-patterns.md` — theme setup, depth tiers, node cards, grid layouts, data tables, status badges, KPI cards, before/after panels, connectors, animations (fadeUp, fadeScale, drawIn, countUp), collapsible sections, overflow protection, generated image containers
- `libraries.md` — Mermaid (CDN, ELK, deep theming, hand-drawn mode, CSS overrides, diagram examples), Chart.js, anime.js, Google Fonts with 13 font pairings
- `responsive-nav.md` — sticky sidebar TOC on desktop, horizontal scrollable bar on mobile, scroll spy

### Templates
- `architecture.html` — CSS Grid card layout, terracotta/sage palette, depth tiers, flow arrows, pipeline with parallel branches
- `mermaid-flowchart.html` — Mermaid flowchart with ELK + handDrawn mode, teal/cyan palette, zoom controls
- `data-table.html` — HTML table with KPI cards, status badges, collapsible details, rose/cranberry palette

### Prompt Templates
- `/generate-web-diagram` — generate a diagram for any topic
- `/diff-review` — visual diff review with architecture comparison, KPI dashboard, code review, decision log
- `/plan-review` — plan vs. codebase with current/planned architecture, risk assessment, understanding gaps
- `/project-recap` — project mental model snapshot for context-switching
- `/fact-check` — verify factual accuracy of review pages and plan docs against actual code
