# pi-fzf

A [Pi](https://github.com/badlogic/pi) extension for fuzzy finding. Define commands that list candidates from any shell command, then perform actions on the selected item—fill the editor, send to the agent, or run shell commands.

![demo](demo.gif)

## Installation

### From npm

```bash
pi install npm:pi-fzf
```

### From git

```bash
pi install github.com/kaofelix/pi-fzf
```

## Configuration

Create a config file to define your commands:

- `~/.pi/agent/fzf.json` — global commands
- `<project>/.pi/fzf.json` — project-specific (overrides global)

Each command has a `list` (shell command that outputs candidates) and an `action` (what to do with the selection):

```json
{
  "commands": {
    "file": {
      "list": "fd --type f --max-depth 4",
      "action": "Read and explain {{selected}}"
    }
  }
}
```

This registers `/fzf:file` in Pi. The `{{selected}}` placeholder is replaced with the chosen candidate.

### Keyboard Shortcuts

Add a `shortcut` field to trigger a command via a keyboard shortcut instead of typing `/fzf:<name>`:

```json
{
  "commands": {
    "file": {
      "list": "fd --type f --max-depth 4",
      "action": "Read and explain {{selected}}",
      "shortcut": "ctrl+shift+f"
    }
  }
}
```

The shortcut format follows Pi's [keybinding syntax](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/keybindings.md#key-format): `modifier+key` where modifiers are `ctrl`, `shift`, `alt` (combinable).

## Actions

### Editor (default)

Fills the Pi editor with text. You can review and edit before sending.

```json
"action": "Explain {{selected}}"
```

Or explicitly:

```json
"action": { "type": "editor", "template": "Explain {{selected}}" }
```

### Send

Sends directly to the agent, triggering a turn immediately.

```json
"action": { "type": "send", "template": "Explain {{selected}}" }
```

### Bash

Runs a shell command. By default shows the result as a notification.

```json
"action": { "type": "bash", "template": "git checkout {{selected}}" }
```

Add `output` to route the command's stdout elsewhere:

| Output | Behavior |
|--------|----------|
| `"notify"` | Show as notification (default) |
| `"editor"` | Put stdout in the editor |
| `"send"` | Send stdout to the agent |

```json
"action": {
  "type": "bash",
  "template": "cat {{selected}}",
  "output": "editor"
}
```

## Examples

### Override the `@` trigger for file selection

By default, typing `@` in Pi opens the autocomplete menu. You can override this to use pi-fzf for file selection instead:

```json
"file": {
  "list": "fd --type f",
  "action": "@{{selected}}",
  "shortcut": "@"
}
```

Now pressing `@` opens the fuzzy finder. Selecting a file inserts `@<filename>` into the editor, preserving Pi's file reference syntax.

This works for any key: use `!`, `$`, or any character as a custom trigger for your commands.

### Find files and ask the agent to explain them

```json
"file": {
  "list": "fd --type f --max-depth 4",
  "action": "Read and explain {{selected}}"
}
```

### Load a skill by name

```json
"skill": {
  "list": "fd -L 'SKILL.md' ~/.pi/agent/skills ~/.pi/agent/git 2>/dev/null | sed -E 's|.*/skills/([^/]+)/SKILL\\.md|\\1|' | grep -v '/' | sort -u",
  "action": { "type": "editor", "template": "/skill:{{selected}}" }
}
```

### Switch git branches

```json
"branch": {
  "list": "git branch --format='%(refname:short)'",
  "action": { "type": "bash", "template": "git checkout {{selected}}" }
}
```

### View git diff in editor

```json
"git-diff": {
  "list": "git diff --name-only",
  "action": {
    "type": "bash",
    "template": "git diff {{selected}}",
    "output": "editor"
  }
}
```

### Find files with TODOs

```json
"todo": {
  "list": "rg -l 'TODO|FIXME' || true",
  "action": { "type": "editor", "template": "Find and fix all TODOs in {{selected}}" }
}
```

A complete example config is available in [`examples/fzf.json`](examples/fzf.json).

## Usage

1. Type `/fzf:<name>` (e.g., `/fzf:file`) or press the configured shortcut
2. Type to filter candidates
3. Use ↑/↓ to navigate, Enter to select, Escape to cancel
