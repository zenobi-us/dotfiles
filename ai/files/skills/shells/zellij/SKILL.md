---
name: zellij
description: Use when manipulating Zellij sessions, creating tabs or panes, or looking up Zellij CLI commands for terminal multiplexer operations
---

# Zellij Reference

## Overview

Quick reference for Zellij CLI commands to manipulate running sessions. Covers session management, tabs, and panes.

## When to Use

- Creating or attaching to Zellij sessions
- Managing tabs and panes programmatically
- Need CLI commands (not keybindings)
- Automating Zellij operations

**When NOT to use:**
- Looking for keybindings (this is CLI only)
- Layout file syntax
- Configuration options

## Quick Reference

### Sessions

| Task | Command |
|------|---------|
| Create/attach session | `zellij attach --create <name>` or `zellij -s <name>` |
| List sessions | `zellij list-sessions` |
| Kill session | `zellij kill-session <name>` |
| Delete session | `zellij delete-session <name>` |

### Tabs

| Task | Command |
|------|---------|
| New tab | `zellij action new-tab` |
| New tab with name | `zellij action new-tab --name <name>` |
| New tab with cwd | `zellij action new-tab --cwd <path>` |
| New tab with layout | `zellij action new-tab --layout <layout>` |
| Close tab | `zellij action close-tab` |
| Rename tab | `zellij action rename-tab <name>` |
| Go to tab by name | `zellij action go-to-tab-name <name>` |
| Go to tab by index | `zellij action go-to-tab <index>` |

### Panes

| Task | Command |
|------|---------|
| New pane (auto) | `zellij action new-pane` |
| Split right | `zellij action new-pane --direction right` |
| Split down | `zellij action new-pane --direction down` |
| Floating pane | `zellij action new-pane --floating` |
| Floating with size | `zellij action new-pane --floating --width 80% --height 60%` |
| Pane with command | `zellij action new-pane -- <command>` |
| Close pane | `zellij action close-pane` |
| Rename pane | `zellij action rename-pane <name>` |

### Common Patterns

**New tab for specific task:**
```bash
zellij action new-tab --name "backend" --cwd ~/api
```

**Split pane and run command:**
```bash
zellij action new-pane --direction down -- npm run dev
```

**Floating scratch terminal:**
```bash
zellij action new-pane --floating --width 90% --height 90%
```

## Common Mistakes

**❌ Using `new-pane --horizontal`**
Correct: `--direction down` (not `--horizontal`)

**❌ Confusing toggle with create**
- `toggle-floating-panes` = show/hide existing floating panes
- `new-pane --floating` = create NEW floating pane

**❌ Forgetting `action` subcommand**
Wrong: `zellij new-tab`
Right: `zellij action new-tab`

## Notes

- All `zellij action` commands work inside or outside a session
- Use `--` to separate pane command from zellij options
- Direction options: `right`, `left`, `up`, `down`
- Size units: bare integers or percentages (e.g., `80%`)
