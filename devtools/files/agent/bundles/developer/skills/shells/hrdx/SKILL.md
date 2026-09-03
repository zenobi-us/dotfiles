---
name: hrdx
description: Reference for hrdx (https://github.com/patriceckhart/hrdx), a terminal multiplexer for AI coding agents (Codex, Claude Code, pi, zot). Use when adding or editing hrdx themes, remapping keys (keys.json), registering a custom agent CLI (harness.json), custom sounds (sounds.json), wiring hrdx config into this repo's mise symlinks, or answering hrdx CLI flag / socket API questions. Covers exact config file schemas, default keymap actions, and where files live in this dotfiles repo.
---

# hrdx

## Overview

hrdx is a terminal multiplexer built for AI agent workflows — like tmux, but each pane knows if it holds a real PTY session for Codex CLI, Claude Code, pi, zot, a custom harness, or a plain shell. This repo manages hrdx config under `shells/files/hrdx/` and symlinks pieces of it into the real hrdx config directory via mise.

## Where Things Live

- Tool install: `mise.toml` has `"github:patriceckhart/hrdx" = "latest"`.
- Real hrdx config directory (holds `state.json` and every file below): Linux `~/.config/hrdx/`, Windows `%AppData%\hrdx\`, macOS `~/Library/Application Support/hrdx/`.
- This repo's managed files: `shells/files/hrdx/themes/*.json`, `shells/files/hrdx/keys.json`, and `shells/files/hrdx/harness.json`, each symlinked from `mise.unix.toml` (`~/.config/hrdx/...`) and `mise.windows.toml` (`%AppData%\hrdx\...`). Examples in this repo: `shells/files/hrdx/themes/rose-pine-moon.json`, `shells/files/hrdx/harness.json` (registers `lazygit` and `nvim` as quick-launch harnesses, no `busy` detection needed for either).
- `sounds.json` is managed by mise. It is symlinked from `shells/files/hrdx/sounds.json` in `mise.unix.toml` and `mise.windows.toml`.

## Config Files

All of the following live directly in the hrdx config directory (not a subfolder, except `themes/`).

### themes/*.json — one file per theme

```json
{
  "name": "my-theme",
  "description": "One-line description.",
  "colors": {
    "accent": "#c4a7e7",
    "alt": "#3e8fb0",
    "muted": "#908caa",
    "faint": "#393552",
    "good": "#9ccfd8",
    "busy": "#f6c177",
    "bad": "#eb6f92",
    "bar_bg": "#2a273f",
    "bar_fg": "#e0def4",
    "ink": "#232136"
  }
}
```

- `name` is required. The name `"default"` is reserved — do not use it.
- Every color is optional. An unset color inherits the built-in theme.
- A color value is either an ANSI 256 number (`201`) or a `"#rrggbb"` hex string.

### keys.json — action-to-key overrides

Flat map of `{"action": "key"}`. An override replaces ALL default keys for that action.

```json
{
  "quit": "ctrl+q",
  "find": "ctrl+f"
}
```

Key strings follow the `ctrl+x` / `shift+x` / `alt+x` pattern (`ctrl+q`, `shift+tab`, `pgup`).

Valid action names, with their default key(s):

| Action | Default keys |
|---|---|
| `prefix` (fixed, cannot override) | `ctrl+b` |
| `literal` | `ctrl+b` |
| `quit` | `q` |
| `picker-right` / `picker-down` | `c` / `C` |
| `agent-right` / `agent-down` / `agent-cycle` | `a` / `A` / (none) |
| `shell-right` / `shell-down` | `s`, `%`, `\|` / `S`, `"`, `-` |
| `workspace` | `w` |
| `tab-new` / `tab-next` / `tab-prev` | `t` / `n` / `p` |
| `space-next` / `space-prev` | `]` / `[` |
| `pane-next` / `pane-prev` | `tab` / `shift+tab` |
| `find` | `/` |
| `close-pane` / `close-space` | `x` / `X` |
| `equalize` | `=` |
| `rename` | `r` |
| `menu` | `m` |
| `settings` | `,` |
| `scroll-up` / `scroll-down` | `u`, `pgup` / `d`, `pgdown` |
| `live` | `esc`, `G` |

An unknown action name is dropped and reported at startup — it is not a hard error.

### harness.json — register a custom agent CLI

A JSON **array** of objects, even for a single entry:

```json
[
  {
    "kind": "aider",
    "binary": "aider",
    "args": ["--no-auto-commits"],
    "resume": ["--restore-chat-history"],
    "resume_first": false,
    "busy": "esc to interrupt",
    "idle_title": "",
    "attention_title": ""
  }
]
```

- `kind` is required and must not collide with a built-in (`shell`, `zot`, `pi`, `claude`, `codex`) or another custom entry.
- `binary` defaults to `kind` when omitted.
- `busy` is a substring hrdx watches for in the pane's screen output to know the agent is working. Leave it empty to fall back to spinner detection.
- Re-registering the same `kind` on reload replaces the earlier entry.

### sounds.json — custom notification sounds

Array of `{"name": "...", "file": "path"}`. `file` may start with `~/`. Built-in sounds are `ding` and `chime` — a custom entry cannot reuse those names.

## Key Commands

```bash
hrdx --cwd ~/Developer/api --agent claude   # open a workspace with a default agent
hrdx --continue                             # resume previous sessions
hrdx --fresh                                # ignore saved state, start clean
hrdx --agent aider                          # default agent can be a registered harness kind
```

Full flag list: `hrdx --help` — includes the state file path, per-binary overrides (`-claude-bin`, `-codex-bin`, `-pi-bin`, `-zot-bin`), repeatable `-cwd`, `-persist`, and `-api`.

## Default Keyboard Shortcuts

All bindings use the `ctrl+b` prefix (tmux-style), then one key from the action table above — for example `ctrl+b` then `c` splits right with an agent picker, `ctrl+b` then `/` opens the fuzzy finder.

## Socket API

hrdx serves JSON-RPC over a unix socket (`hrdx.sock`, next to `state.json`) for external scripts and editors. Supported requests: `status`, `workspace.create`, `workspace.close`, `pane.create`, `pane.send_text`, `pane.read`, `pane.close`, `pane.busy`. Reach for this when driving hrdx from outside the TUI, such as an editor plugin.

## Verifying Changes

After editing a theme, key, harness, or sound file, restart hrdx (or reopen its settings window with `ctrl+b` then `,`) to reload. A malformed file is reported non-fatally at startup — hrdx keeps running on the last-good config.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Naming a theme `"default"` | Reserved name. Pick anything else. |
| Writing `harness.json` as a single object | It must be a JSON array, even for one harness. |
| Mapping `keys.json` as `{"key": "action"}` | Wrong direction. It is `{"action": "key"}`. |
| Registering a harness `kind` of `shell`, `zot`, `pi`, `claude`, or `codex` | These are built in and reserved. Pick a different `kind`. |
| Assuming an hrdx config file is repo-managed | Check `mise.unix.toml` or `mise.windows.toml` before editing the live config. |
