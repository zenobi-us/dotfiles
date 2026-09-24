---
name: ux-preview
description: Use when an agent needs to preview UX options from a requested count and variation parameters before implementation; produces a locally served HTML comparison report with honest prototype flows.
---

# Preview UX Options

## Role

Use this skill to make UX decisions visible before production UI work. It is a **preview workflow**, not a production implementation skill: create a small, truthful, interactive report that lets a human compare alternatives and choose a direction.

The report MUST be served locally and its URL MUST be returned. Keep the server running until the user asks to stop it.

## Inputs

Accept these inputs from the request. Ask only for missing values that materially change the preview.

- **Option count**: integer; default `3`. Honor the requested count rather than collapsing it to a preferred number.
- **Variation parameters**: a free-form object or list, for example:
  - interaction model: popover, modal, drawer, inline, wizard, command palette
  - information density: compact, standard, spacious
  - content length: short, long, noisy, multilingual
  - states: empty, editing, validation error, loading, success, destructive confirmation
  - layout: desktop, narrow panel, mobile, responsive
  - visual direction: existing product system, restrained, expressive, high contrast
  - prototype depth: static comparison, clickable state changes, multistep flow
- **Context**: product surface, user goal, constraints, and what decision the preview must answer.
- **TUI framework**: required for terminal surfaces. Record the framework, version, host, and integration point.
- **Fidelity**: low, medium, or high. Default to medium: realistic hierarchy and states without polishing irrelevant details.

If the user gives a number but no variation parameters, use a useful baseline matrix and state the assumptions in the report. If they give variation parameters but no number, use three options. Do not invent a large option set merely to appear thorough.

## Router

1. Read `references/router.md` and choose one primary scenario: `style`, `detail`, `use-case`, `stateful-flow`, `responsive`, or `tui-display`.
2. Read the selected scenario reference before generating the report. Use a secondary scenario only as a constrained lens around a distinct risk.
3. For `tui-display`, read `references/tui-framework-compatibility.md` before generating options. Treat unknown framework capabilities as unavailable.
4. Load and apply `developer:ui-design` for accessibility, hierarchy, forms, keyboard behavior, responsive constraints, and motion restraint.
5. Load `developer:frontend-design` when the preview needs a distinctive, production-quality visual composition.
6. Load `developer:basic-design-principles` when the surface needs a disciplined product design system.
7. Load `developer:playwright` or `developer:surf` only when interaction verification or browser evidence is requested.
8. Load `developer:writing-reports` when the result needs formal evidence, screenshots, captions, or a handoff artifact.
9. Use the poster workflow for meaningful high-fidelity diagrams, flow maps, state machines, or comparison graphics. Do not add graphs or diagrams just to decorate the report.

Do not duplicate those skills' full guidance here. Use this file to select and compose them; use the playbook for the concrete execution procedure.

## Quick reference

| Need | Route |
|---|---|
| Compare static alternatives | Render all options in one report with tabs or a grid |
| Explore a risky workflow | Build the smallest clickable multistep state model that exposes the risk |
| Explain meaningful relationships | Use poster for a real flow/state/layout map, never decorative graphs |
| Share the result | Start `serve` with an explicit fixed port and return URL + PID |
| Preview a terminal UI | Keep the report as HTML and render a labelled browser simulation of the target terminal |

## Example request

> Preview 4 save flows. Vary popover, drawer, modal, and two-step wizard; include empty, validation-error, loading, success, and narrow-panel states. Use the existing product styling and serve the report locally.

Expected behavior: render exactly four options, explain which states each option covers, make the risky flows clickable, and return the local report URL only after verifying the server response.

## Required output

Produce a self-contained report HTML that:

- shows every requested option in one view or through obvious tabs
- labels options consistently and explains the meaningful difference
- includes the assumptions, decision criteria, and recommendation status
- exposes relevant states rather than showing only the happy path
- supports keyboard navigation and has visible focus states
- uses semantic controls and sufficient contrast
- contains no fake data visualizations, decorative flowcharts, or interaction claims the prototype does not implement
- for terminal surfaces, labels browser simulation separately from framework compatibility and target-runtime verification
- gives the human a clear way to say which option to implement

For a multistep scenario, include a clickable prototype with an explicit state model: entry, progression, back/cancel, validation, completion, and recovery. Put the flow map or state diagram in the report only when it clarifies the decision; use poster for a high-fidelity meaningful diagram when that improves comprehension.

## Local serving rule

Always:

1. Write the report to a temporary or requested output directory.
2. Find an available local port.
3. Start a static server with port switching disabled, for example:
   `serve -l 4273 --no-port-switching <report-directory>`
4. Verify the report URL responds and the expected file is present.
5. Return the exact URL and server PID.

If the chosen port is occupied, choose another port explicitly. Do not silently rely on a server changing ports. Keep the server alive until the user requests shutdown, and on shutdown kill only the process started for this report.

## Common mistakes

- Rendering fewer options than requested because three feels more manageable.
- Making options differ only by color or decoration instead of a real behavioral decision.
- Showing a happy-path mock for a workflow whose risk is validation, loading, cancellation, or recovery.
- Adding a chart or flow diagram that repeats the cards without clarifying a relationship.
- Starting `serve` without `--no-port-switching`, then reporting a URL different from the requested port without checking it.
- Claiming a prototype proves production usability or performance.

## Completion gate

Before returning the URL, verify:

- requested option count equals rendered option count
- each variation parameter appears in at least one meaningful comparison or is called out as not applicable
- all options are viewable from the served report
- interactive controls work without browser console errors when interaction is part of the request
- the report does not pretend that a static mock is a tested production flow
- the recommendation is justified by the stated decision criteria
- for `tui-display`, every option's required capability has evidence or is marked unverified
- for `tui-display`, the report distinguishes browser simulation from target-runtime verification

For the shared intake, option-generation rules, prototype state checklist, poster decision gate, and report contract, read `references/playbook.md` and `references/scenario-report.md`.
