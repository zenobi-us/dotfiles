# TUI Framework Compatibility

Use before generating or evaluating a TUI preview. This reference constrains the browser simulation to the target framework and integration boundary.

## Required intake

Record:

- framework name and version
- host application
- integration point: overlay, command, full-screen, embedded panel, or other
- terminal ownership
- input ownership
- package and dependency constraints
- target terminal sizes
- color and character-set assumptions

If the user does not provide the framework, ask for it. Do not use a generic TUI model when the framework changes the decision.

## Capability profile

Create a capability profile before generating options:

```yaml
capabilities:
  layout:
    rows: supported | constrained | unsupported | unknown
    columns: supported | constrained | unsupported | unknown
    split_panes: supported | constrained | unsupported | unknown
    responsive_reflow: supported | constrained | unsupported | unknown
  interaction:
    keyboard_focus: supported | constrained | unsupported | unknown
    custom_keybindings: supported | constrained | unsupported | unknown
    mouse: supported | constrained | unsupported | unknown
    modal_overlay: supported | constrained | unsupported | unknown
  rendering:
    styled_text: supported | constrained | unsupported | unknown
    unicode: supported | constrained | unsupported | unknown
    truecolor: supported | constrained | unsupported | unknown
    ansi_fallback: supported | constrained | unsupported | unknown
  lifecycle:
    resize_events: supported | constrained | unsupported | unknown
    async_updates: supported | constrained | unsupported | unknown
    redraw: supported | constrained | unsupported | unknown
    focus_restore: supported | constrained | unsupported | unknown
  integration:
    mount_point: supported | constrained | unsupported | unknown
    host_shortcuts: supported | constrained | unsupported | unknown
    terminal_ownership: supported | constrained | unsupported | unknown
```

Record evidence for every capability that an option needs:

```yaml
evidence:
  source: local-source | official-docs | user-provided
  reference: "path, symbol, or URL"
  confidence: high | medium | low
```

Treat `unknown` as unavailable for option generation. A capability is valid only when the framework supports it and the integration boundary exposes it.

## Option validation

Every option MUST declare its required capabilities:

```yaml
option:
  name: adaptive-split-view
  requires: [split_panes, resize_events, keyboard_focus]
  fallback: single-column-stack
  status: feasible | constrained | rejected | unverified
```

Reject an option when a required capability is unsupported. Replace it with a supported fallback when the fallback answers the same decision question. Mark it as unverified when the evidence is incomplete.

Do not infer compatibility from another TUI framework. Do not treat a framework feature as available when the host owns the terminal, event loop, or keymap.

## Browser report boundary

The report MUST remain HTML. It MUST render a browser simulation of the logical screen model. The report MUST label these claims separately:

- `Simulated`: demonstrated by the browser model
- `Framework-compatible`: supported by evidence at the target boundary
- `Runtime-verified`: also run in the target TUI runtime
- `Unverified`: evidence is incomplete
- `Excluded`: outside the integration scope

A browser simulation does not prove terminal font metrics, host keymap behavior, redraw performance, or target-runtime lifecycle behavior.

## Verification

Before completion:

- inspect the target project and framework API or provided documentation
- test the actual integration point when runtime verification is requested
- test keyboard routing and host shortcut conflicts
- test resize, redraw, teardown, and focus restoration when relevant
- record unsupported and unverified behavior in the report
