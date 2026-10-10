# UX Preview Playbook

This playbook is the shared execution reference routed by `ux-preview/SKILL.md`. Scenario-specific rules live in the neighboring references:

- `router.md` — select the primary scenario and secondary lenses
- `scenario-style.md` — compare visual treatments
- `scenario-detail.md` — compare information density and disclosure
- `scenario-use-case.md` — compare actors, goals, and contexts
- `scenario-stateful-flow.md` — compare multistep state behavior
- `scenario-responsive.md` — compare viewport and input constraints
- `scenario-tui-display.md` — compare terminal layouts, capabilities, and keyboard interaction
- `tui-framework-compatibility.md` — constrain TUI options to a target framework and integration boundary
- `scenario-report.md` — shared report and verification contract

Read the selected scenario reference before generating the report. Use this playbook for shared intake, composition, poster, verification, and serving rules.

## 1. Intake and normalization

Normalize the request into this working brief before writing UI:

```yaml
option_count: 3
context: "..."
user_goal: "..."
decision: "..."
variations:
  interaction_model: [popover, modal, drawer]
  density: [compact, standard]
  content_length: [short, long]
  states: [empty, editing, error, success]
  layout: [desktop, narrow]
  visual_direction: existing-system
fidelity: medium
prototype_depth: auto
```

Rules:

- Treat `option_count` as exact. Render exactly that many named alternatives.
- Generate orthogonal options. Each option should change one primary design decision and hold unrelated variables stable.
- If the requested parameter list is larger than the option count, distribute parameters across options and show the coverage table. Do not pretend every option demonstrates every parameter.
- If a parameter is incompatible with the surface, say so in the assumptions rather than forcing it into a decorative variant.
- Use real constraints from the product surface: viewport, existing controls, content lengths, user permissions, latency, and failure behavior.

## 2. Select a scenario

Route the decision using `router.md`. Do not begin by choosing colors or components. Identify the uncertainty the report must resolve:

- visual expression → style
- hierarchy or disclosure → detail
- actor, goal, or context → use case
- transitions or recovery → stateful flow
- viewport or input constraints → responsive
- terminal geometry, capability fallbacks, or keyboard-first interaction → tui-display

If multiple scenarios apply, select one primary risk and use the others as constrained lenses. Do not create an unbounded mega-preview.

## 3. Choosing option axes

Use this order when deciding what varies:

1. **Interaction model**: inline, popover, modal, drawer, wizard, command palette.
2. **Information architecture**: one-step form, progressive disclosure, grouped fields, review step.
3. **State behavior**: validation timing, loading, cancellation, recovery, confirmation.
4. **Density and responsive behavior**: compact versus spacious, wide versus narrow layout.
5. **Visual treatment**: hierarchy, color, emphasis, tone.

Do not make three options that are only different colors. Visual variation is useful after the behavioral decision is visible.

For each option, record:

- primary difference
- invariant behavior
- target user or situation
- trade-offs
- risks to test in production
- what the preview does and does not prove

## 4. Report structure

Use a report shell with these sections:

1. **Decision header**: context, decision question, option count, fidelity, and assumptions.
2. **Comparison controls**: tabs or a grid that makes every option reachable without hidden navigation.
3. **Option panels**: consistent labels, a short rationale, the rendered UI, states, and trade-offs.
4. **Interaction area**: controls that actually change the preview when the option is meant to be interactive.
5. **Coverage and criteria**: a small table mapping variation parameters to options and decision criteria to evidence.
6. **Recommendation**: recommendation, confidence, unresolved questions, and the selected option affordance.

When the report is interactive, keep the comparison context visible. Do not make the user remember option 1 while exploring option 3.

## 5. Multistep prototype gate

Use a multistep prototype when any of these are true:

- the decision includes more than one user action
- a later step changes the meaning or risk of an earlier choice
- validation, loading, permissions, confirmation, or recovery matters
- the request mentions a wizard, onboarding, checkout, setup, save flow, import flow, or approval flow
- a static card would hide the main usability risk

Minimum state model:

```text
entry -> editing -> validation-error
entry -> editing -> submitting -> success
editing -> cancel -> entry
submitting -> failure -> editing
```

Implement only the states needed to answer the decision. Each transition must have a visible trigger and result. Include Back, Cancel, retry, and success behavior when they are part of the risk. Use deterministic sample data so the reviewer can reproduce each path.

If the state space is large, show a state selector in the report and include a concise state table rather than building every branch.

## 6. Poster decision gate

Use `poster` when a high-fidelity visual artifact would clarify a real relationship:

- a service or screen flow with meaningful branches
- a state machine with nontrivial transitions
- a layout comparison where spatial relationships matter
- a data-driven relationship that is hard to explain in prose

Do not use poster for:

- ornamental charts with invented metrics
- generic arrows between cards
- a graph that repeats the option cards without adding information
- a diagram that implies measured evidence when no measurement exists

Before using poster, write one sentence: “This visual helps decide ___ because ___.” If that sentence is weak, omit the graphic. If used, label it as a model or map, not as research evidence.

## 7. Visual and interaction quality

Compose the relevant UI skills rather than rewriting their rules:

- Apply semantic HTML, labels, keyboard access, focus visibility, contrast, and reduced-motion behavior from `developer:ui-design`.
- Apply product-level hierarchy and distinctive composition from `developer:frontend-design` when fidelity calls for it.
- Apply a restrained design system from `developer:basic-design-principles` when the product already has one.
- Use realistic text lengths and the requested responsive layouts. Test the longest label and the narrowest viewport in the brief.
- Keep animations short and optional. A preview should make comparison easier, not hide transitions behind spectacle.
- For `tui-display`, keep the report in HTML and render a labelled browser simulation of the logical terminal screen. Use a DOM grid or row renderer by default. Use canvas only for exact glyph metrics or dense redraw, with a parallel semantic state representation.

## 8. Verification

Verify the artifact in layers:

1. **Structural**: exact option count, required headings, coverage table, and report file.
2. **Static**: open the HTML, check responsive overflow, visible focus, labels, and contrast.
3. **Interaction**: click every report control and walk the declared prototype states. Use Playwright or surf when browser evidence is requested or the flow is complex.
4. **Honesty**: remove claims that are not demonstrated. Distinguish a prototype observation from a production measurement.
5. **TUI compatibility**: validate every option against the target framework and integration boundary. Treat unknown capabilities as unavailable. Label simulated, framework-compatible, runtime-verified, unverified, and excluded behavior.

Capture screenshots only when they help a handoff or comparison. If screenshots are included, caption the state and viewport and keep them tied to the decision criteria.

## 9. Serving and handoff

Serve the directory containing the final report, not a parent directory with unrelated files. Use a fixed port with switching disabled:

```sh
serve -l 4273 --no-port-switching ./report
```

If the port is occupied, select a different port and record it. Confirm the HTTP response and report path before handing off. Return:

- report URL
- server PID
- selected option count
- fidelity and prototype depth
- validation performed
- known gaps
- for TUI work, target framework, integration scope, renderer, and runtime verification status

Do not stop the server unless asked. When asked, terminate only the recorded PID and confirm it exited.
