# TUI Display Showcase

Use when the surface renders in a terminal or uses terminal-first interaction. Keep the delivery as an HTML report. Render a browser simulation of the target terminal surface.

## Inputs

```yaml
scenario: tui-display
option_count: 3
framework:
  name: pi-tui | zot | opentui | ratatui | custom
  version: detected-or-requested
  host: ""
  integration: ""
terminal_sizes: [120x40, 80x24, 40x12]
input_modes: [keyboard]
color_modes: [truecolor, ansi16, monochrome]
character_sets: [unicode, ascii]
states: [entry, focused, loading, error, recovery]
renderer: dom-grid | canvas | hybrid
```

Read `tui-framework-compatibility.md` before generating options.

## Rules

- Treat terminal rows and columns as hard constraints.
- Render every option at the same terminal sizes and capability modes.
- Make focus, selection, and the cursor visible without color alone.
- Provide a keyboard path for every action.
- Treat mouse input as optional unless the target integration supports it.
- Test wrapping, truncation, Unicode width, and ASCII fallback.
- Test color and no-color modes.
- Distinguish fixed chrome, scrollable content, and scrollback output.
- Show resize, redraw, loading, error, cancel, and recovery behavior when relevant.
- Generate options only from capabilities supported at the target integration boundary.
- Mark the browser simulation separately from target-runtime verification.

## Browser simulation

The report MUST remain HTML. Use a logical screen model with these fields:

- terminal columns and rows
- regions, bounds, borders, and text cells
- style and color mode
- focus, cursor, and selection
- scroll position
- key bindings
- current state and transition result

Use a DOM grid or row-based renderer by default. Use canvas only when exact glyph metrics or dense redraw make it necessary. If canvas is used, provide a parallel semantic representation for the current state.

The browser preview is a simulation. It MUST NOT claim that a design runs in the target framework unless target-runtime verification was performed.

## Option axes

Use one primary axis per option set:

- layout: fixed panes, adaptive panes, or single-column fallback
- navigation: visible key hints, command palette, or Vim-style navigation
- density: compact dashboard, balanced split view, or progressive detail
- display: in-place redraw, scrollback-first output, or hybrid
- fallback: Unicode-first, ASCII-first, or adaptive rendering

For each option, record:

- required framework capabilities
- primary difference
- invariant behavior
- target terminal sizes and modes
- fallback behavior
- trade-offs and implementation risks
- simulated behavior
- runtime behavior that remains unverified

## Report shape

Use synchronized option panels with controls for:

- terminal width and height
- color support
- Unicode support
- input mode
- content length
- current state

Include a compatibility panel with the target framework, integration scope, capability evidence, unsupported features, and unverified behavior.

Use this status vocabulary:

| Status | Meaning |
|---|---|
| Simulated | The browser model demonstrates the behavior. |
| Framework-compatible | The target framework supports it at the recorded integration boundary. |
| Runtime-verified | The design also ran in the target TUI framework. |
| Unverified | Reliable framework evidence is not available. |
| Excluded | The behavior is outside the integration scope. |

## Completion gate

Before returning the report, verify:

- every requested option renders at every requested terminal size
- keyboard-only navigation reaches every supported action
- focus and selection remain visible without color
- no-color and ASCII modes preserve alignment
- long labels and wide glyphs have an explicit behavior
- narrow terminals have an explicit fallback
- resize and redraw behavior are represented when relevant
- every option's required capability has evidence or is marked unverified
- the report distinguishes browser simulation from target-runtime verification
