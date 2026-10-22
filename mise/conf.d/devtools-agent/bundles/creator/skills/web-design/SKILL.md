---
name: web-design
description: Creates React and HTML pages, themes, and design systems from bundled style references. Use for report-dashboard, widget-grid-dashboard, and project-info surfaces that need a consistent visual system and a verified rendered result.
---

# Web design

Select the output task and visual style independently. Apply the selected source to the requested surface, not the source application's feature set.

## Workflow

1. Identify the deliverable, target directory, audience, and requested interactions. Inspect the existing stack, components, styles, and build commands before choosing tools.
2. Read [style-selection](references/style-selection.md). Select one style and primary asset. State the source and any explicit overrides before implementation.
3. Read the task reference below. For combined tasks, read each relevant reference. A theme-only request does not imply a new page; a specification does not imply component implementation.
4. Reuse the target project's components and semantic tokens. Build only the requested content and behavior. If the request asks for a plan or explanation, return that instead of generating a page. Read the selected asset before implementing its appearance; if reading is unavailable, report the missing access instead of guessing its tokens or claiming inspection.
5. Read [verification](references/verification.md). Exercise the actual changed surface and report the output location, checks, and limits.

All paths in this skill are relative to the installed directory containing this SKILL.md, not the target repository. Resolve this directory before opening references or assets. Bundled assets are sufficient; their original repositories need not exist.

## Route by task

| Request | Read |
| --- | --- |
| A plain HTML page or static site | [html-pages](references/html-pages.md) |
| A React page or component composition | [react-pages](references/react-pages.md) |
| A new theme or styling-only change | [themes](references/themes.md) |
| Tokens, component contracts, or a design-system specification | [design-systems](references/design-systems.md) |

For alternative comparisons, use ux-preview before production changes. For a requested standalone report, use html-artifact for packaging. Use ui-design for general accessibility and usability. Load react-patterns, tailwind, or shadcn only when the selected stack needs them. Preserve this skill's selected source and explicit overrides when composing those skills.

## Completion

The deliverable uses the selected style without unrelated source features. Requested interactions and content are complete. The changed surface has been exercised, or the missing runtime prerequisite is stated. Source selection, overrides, verification, and the output path or URL are included in the handoff.
