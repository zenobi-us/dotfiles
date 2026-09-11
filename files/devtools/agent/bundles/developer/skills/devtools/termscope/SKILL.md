---
name: termscope
description: |
  Drive and inspect terminal applications programmatically. Use for TUI testing,
  visual regression, debugging rendering issues, and automating interactive CLI
  tools. Provides snapshot capture, keyboard/text input, text search, and a
  JSON-lines session protocol.
metadata:
  author: mwunsch
  repository: https://github.com/mwunsch/termscope
---

# termscope

Drive and inspect terminal applications — Playwright for the terminal.

## Prerequisites

termscope must be installed and on $PATH. Verify:

    termscope --version

If not installed:

    curl -fsSL https://raw.githubusercontent.com/mwunsch/termscope/main/install.sh | sh

## When to use termscope

- Inspect the visual state of a TUI application
- Debug rendering issues by capturing terminal snapshots
- Run visual regression tests in CI
- Automate interactive terminal applications (fill prompts, navigate menus)
- Verify that a CLI tool produces expected output with styling

## One-shot mode

### Snapshot

Capture the terminal state of a command:

```bash
# Plain text (default) — best for reading in context
termscope snapshot -- htop

# JSON — structured data for programmatic processing
termscope snapshot --format json -- my-app

# With custom terminal size
termscope snapshot --cols 120 --rows 40 -- btop

# Write to file
termscope snapshot --format svg -o screenshot.svg -- my-tui
```

### Exec (linear sequence)

Chain actions left-to-right:

```bash
# Wait for prompt, type, press enter, snapshot
termscope exec \
  --wait-for-text "Search:" \
  --type "hello" \
  --press RET \
  --wait-idle 200 \
  --snapshot \
  -- my-tui

# Assert text is present (exit 0/1 for CI)
termscope exec --expect "Error" -- my-app
```

Exec flags are processed in order. Each flag is a step.

## Session mode (agent driving)

Start a persistent session:

```bash
termscope session -- vim test.txt
```

Send JSON-line requests on stdin, receive JSON-line responses on stdout.
Stderr is for diagnostics only — never protocol data.

### Protocol

**Request format:** `{"id": N, "method": "name", "params": {...}}`

**Response format:** `{"id": N, "result": {...}}` or `{"id": N, "error": {"code": "...", "message": "..."}}`

### Methods

**`snapshot`** — Capture terminal state
```json
{"id":1,"method":"snapshot"}
{"id":1,"method":"snapshot","params":{"format":"json"}}
```

**`type`** — Send text characters
```json
{"id":2,"method":"type","params":{"text":"hello world"}}
```

**`press`** — Send a key using Emacs notation
```json
{"id":3,"method":"press","params":{"key":"RET"}}
{"id":3,"method":"press","params":{"key":"C-c"}}
{"id":3,"method":"press","params":{"key":"C-x C-s"}}
```

**`wait_for_text`** — Block until text appears
```json
{"id":4,"method":"wait_for_text","params":{"pattern":"Ready","timeout":5000}}
```

**`wait_for_idle`** — Wait for output to settle
```json
{"id":5,"method":"wait_for_idle","params":{"duration":200}}
```

**`query`** — Get terminal metadata
```json
{"id":6,"method":"query"}
// Returns: cols, rows, cursor, cursor_style, cursor_visible, title, alt_screen
```

**`resize`** — Change terminal dimensions
```json
{"id":7,"method":"resize","params":{"cols":120,"rows":40}}
```

**`close`** — End the session
```json
{"id":8,"method":"close"}
// Returns: exit_code
```

### Session lifecycle

- Session starts when `termscope session -- <cmd>` launches
- Session ends when: (a) agent sends `close`, (b) child exits, or (c) termscope receives SIGTERM
- If child exits: `{"event":"child_exit","exit_code":N}` then EOF
- Errors do NOT end the session — the agent decides what to do

## Key notation

Emacs-style key notation:

| Notation | Meaning |
|---|---|
| `C-c` | Ctrl+C |
| `C-x` | Ctrl+X |
| `M-x` | Alt+X |
| `C-M-a` | Ctrl+Alt+A |
| `RET` | Enter |
| `TAB` | Tab |
| `ESC` | Escape |
| `SPC` | Space |
| `DEL` | Backspace |
| `<delete>` | Forward delete |
| `<up>` `<down>` `<left>` `<right>` | Arrow keys |
| `<home>` `<end>` | Home/End |
| `<prior>` `<next>` | Page Up/Down |
| `<f1>` … `<f12>` | Function keys |

Key sequences (space-separated): `C-x C-s` means Ctrl+X then Ctrl+S.

## Output formats

- **`text`** (default) — Numbered lines with header. Best for LLM token efficiency.
- **`spans`** — Text + per-line style runs. For understanding UI structure.
- **`json`** — Structured JSON with metadata and lines array.
- **`html`** — Styled `<pre>` with `<span>` elements.
- **`svg`** — Visual screenshot as SVG.

## Common patterns

### Navigate a list
```json
{"id":1,"method":"wait_for_text","params":{"pattern":"Select:"}}
{"id":2,"method":"press","params":{"key":"<down>"}}
{"id":3,"method":"press","params":{"key":"<down>"}}
{"id":4,"method":"press","params":{"key":"RET"}}
```

### Fill a text field
```json
{"id":1,"method":"wait_for_text","params":{"pattern":"Name:"}}
{"id":2,"method":"type","params":{"text":"John Doe"}}
{"id":3,"method":"press","params":{"key":"TAB"}}
```

### Wait for a prompt then respond
```json
{"id":1,"method":"wait_for_text","params":{"pattern":"Continue? [y/n]"}}
{"id":2,"method":"type","params":{"text":"y"}}
{"id":3,"method":"press","params":{"key":"RET"}}
```

### Check for errors
```json
{"id":1,"method":"snapshot","params":{"format":"json"}}
// Check if any line contains "Error" or "fatal"
```

### Test at multiple sizes
```json
{"id":1,"method":"resize","params":{"cols":80,"rows":24}}
{"id":2,"method":"wait_for_idle","params":{"duration":200}}
{"id":3,"method":"snapshot"}
{"id":4,"method":"resize","params":{"cols":40,"rows":12}}
{"id":5,"method":"wait_for_idle","params":{"duration":200}}
{"id":6,"method":"snapshot"}
```
