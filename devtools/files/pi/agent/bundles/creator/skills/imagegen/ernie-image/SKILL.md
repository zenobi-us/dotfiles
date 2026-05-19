---
name: ernie-image
description: Guides ERNIE Image prompt writing with reference-backed structure and examples, when generating posters, portraits, infographics, comics, or bilingual text layouts, resulting in clearer prompts and more predictable image outputs.
---

# ernie-image

## Overview
This is a **reference + guidance** skill for ERNIE Image prompt engineering.

Use it to turn vague ideas into structured prompts using:
- the ERNIE Image guide (`https://ernieimage.ai/blog/ernie-image-prompt-engineering-guide`)
- local paired prompt+image references in `references/example-prompts/`

If output quality is unstable, fix prompt structure first before changing model settings.

## When to Use
Use this skill when you need:
- photoreal portraits with controlled lighting and composition
- infographic/poster/comic layouts with readable text
- bilingual text rendering (Chinese + English)
- consistent style transfer across multiple generations
- systematic prompt iteration instead of random retries

Avoid this skill when the request is only model deployment/infrastructure (no prompting work).

## Prompt Blueprint (Default)
Write prompts in this order:
1. **Subject** — who/what is primary
2. **Details** — pose, attributes, environment, spatial relationships
3. **Style/Medium** — photo, vector, watercolor, manga, storyboard, etc.
4. **Technical intent** — aspect ratio, resolution intent, sharpness/detail targets
5. **Text constraints** (if needed) — exact quoted text and placement

### Minimal Template
```text
[Subject], [specific visual details and scene], [style/medium], [lighting + mood], [layout/composition], [quoted on-image text + placement], [aspect ratio/resolution intent].
```

## Prompt Enhancer Guidance
From ERNIE guidance:
- Enable enhancer when the prompt is short or exploratory.
- Disable enhancer when you already wrote a precise long prompt and need exact control.

Practical rule:
- **Drafting:** enhancer on
- **Final lock:** enhancer off

## Layout & Text Rules
For posters/infographics/comics/sticker sheets:
- Specify grid explicitly (`3x5`, `4x6`, `three stacked panels`, etc.)
- Name reading order (`left-to-right`, `top-to-bottom`)
- Quote each required text string exactly
- Keep each text element short when possible
- State typography style (e.g., pixel font, retro serif, handwritten Chinese)

## Example-Driven Patterns (Local References)
Use these files as canonical patterns:
- `references/example-prompts/casual-street-photo.md` + `.png` → photoreal portrait with concrete identity/background cues
- `references/example-prompts/flowchart.md` + `.png` → dense structured diagram with many labeled nodes
- `references/example-prompts/16bit-pixelart-info-poster.md` + `.png` → strict grid + repeated labeled entities
- `references/example-prompts/line-chat-sticker-sheet.md` + `.png` → multi-cell character consistency + per-cell text
- `references/example-prompts/echo-city-horizon.md` + `.png` → slide/poster composition with heading/subheading/body hierarchy
- `references/example-prompts/isometric-illustration.md` + `.png` → isometric architectural detail and prop inventory
- `references/example-prompts/professional-interior-design-photograph.md` + `.png` → premium interior photography art direction
- `references/example-prompts/storyboard-sketch.md` + `.png` → multi-frame cinematic storyboard continuity

## Failure Patterns (Fix Fast)
- Vague subject (“a nice scene”) → replace with concrete subject nouns and attributes.
- Contradictory styles (“photoreal watercolor 3D anime”) → pick one primary style + one secondary influence.
- Missing spatial logic (“objects arranged nicely”) → give count, order, and placement.
- Missing aspect ratio intent → specify portrait/landscape/square and purpose.
- Long unstructured prompt blob → rewrite using the blueprint order.

## Iteration Workflow
1. Write v1 prompt using the blueprint.
2. Generate draft.
3. Compare against a matching local reference pair.
4. Patch only failed dimensions (subject, style, text, layout, lighting).
5. Re-run with enhancer state chosen intentionally (on for exploration, off for precision).

## Quick Copy Templates

### Portrait
```text
A [age]-year-old [subject] with [distinct features], wearing [clothing], [pose/expression], in [location], [time-of-day lighting direction/quality], [camera/lens style], [mood], [aspect ratio].
```

### Poster / Infographic
```text
A [style] poster about [topic], layout [grid/section structure], title "[TITLE]" at [position], section text "[...]" at [position], [color palette], [icon/illustration style], clear hierarchy, [aspect ratio].
```

### Sticker Sheet / Multi-cell Character
```text
A [rows]x[columns] sticker sheet, same character identity across all cells: [identity anchors]. Each cell has unique pose/emotion/action and quoted label text. Keep headwear/outfit proportions consistent. White background, clean cell separation, [aspect ratio].
```

### Storyboard
```text
A vertical storyboard page with [N] stacked frames, same scene continuity: frame 1 [wide establishing], frame 2 [mid progression], frame 3 [low/close action], handwritten scene labels, [drawing medium/style], [paper texture], [lighting logic].
```