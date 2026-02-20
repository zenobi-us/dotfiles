---
id: 6d4f2a10
title: pi-interview source and pi-tui feasibility
created_at: 2026-02-20T19:31:00+10:30
updated_at: 2026-02-20T19:31:00+10:30
status: completed
epic_id: 9c7e21ab
phase_id: 3a5f1c8d
related_task_id: 5b2d7e91
---

# Research: pi-interview source and pi-tui feasibility

## Research Questions
1. Is `pi-interview` source code present in this repository?
2. What existing pi-tui interaction patterns are available locally to model a questionnaire UI?
3. What is the minimal viable architecture for a pi-tui questionnaire version?

## Summary
`pi-interview` implementation source was **not found in this repository**. Evidence found only package reference in `devtools/files/pi/agent/settings.json` (`"npm:pi-interview"`).

Local pi-tui patterns do exist in installed code under `devtools/files/pi/agent/extensions/node_modules/@mariozechner/pi-coding-agent/dist/modes/interactive/components/` and provide concrete building blocks for selector/input/cancel-confirm flows.

## Findings

### 1) Repository source availability
- `rg -uu --files | rg 'pi-interview|interview'` returned no source files.
- `find . -type d -name '*pi-interview*' -o -type f -name '*pi-interview*'` returned no matches.
- `rg -uu -n "pi-interview|interview" .` found only one relevant entry: `devtools/files/pi/agent/settings.json` includes `"npm:pi-interview"`.

Interpretation: this repo currently references the package, but does not contain package source.

### 2) Verified local pi-tui component patterns
From `.../extension-selector.js`:
- Uses `Container`, `Text`, `Spacer`, `getEditorKeybindings`.
- Maintains list state (`selectedIndex`) and handles up/down/confirm/cancel.
- Renders key hints and dynamic list refresh (`updateList`).

From `.../extension-input.js`:
- Uses `Input` component with confirm/cancel handling.
- Routes unmatched keystrokes to input field (`this.input.handleInput(keyData)`).

From `.../oauth-selector.js`:
- Demonstrates selectable list with status text and bounded navigation.
- Uses `TruncatedText` for safe width rendering.

### 3) Feasible architecture for pi-tui questionnaire
A practical pi-tui questionnaire can be modeled as a screen state machine:
- `question-active` -> render prompt + control type (single/multi/text)
- `validation-error` -> inline error and continue same question
- `question-commit` -> store answer and advance index
- `review-submit` -> optional summary screen and submit
- `cancelled` / `completed`

Likely implementation split:
- `questionnaire-component.ts` (main state and `handleInput` routing)
- `renderers.ts` (single/multi/text/question header/help footer)
- `types.ts` (question schema + answer model)
- `index.ts` (command/tool entry + `ctx.ui.custom(..., { overlay: true })`)

## References
- Repository evidence: `devtools/files/pi/agent/settings.json`
- UI patterns:
  - `devtools/files/pi/agent/extensions/node_modules/@mariozechner/pi-coding-agent/dist/modes/interactive/components/extension-selector.js`
  - `devtools/files/pi/agent/extensions/node_modules/@mariozechner/pi-coding-agent/dist/modes/interactive/components/extension-input.js`
  - `devtools/files/pi/agent/extensions/node_modules/@mariozechner/pi-coding-agent/dist/modes/interactive/components/oauth-selector.js`
