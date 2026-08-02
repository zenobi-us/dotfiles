# pi-fzf Extension

A pi extension that brings fzf-style fuzzy finding into the coding agent. Define
commands in a config file, each with a shell command to generate candidates and
an action to perform on the selected item. Commands are exposed as `/fzf:<name>`
slash commands.

## Why inside pi?

Running bash commands from a fuzzy finder isn't that special — you can do that
from any terminal. The real value is actions that **interact with the agent**:
filling the editor with a prompt, sending a message, loading a skill, invoking a
template. That's what this extension focuses on.

## Config

Two config locations (merged, project overrides global):

```
~/.pi/agent/fzf.json        # global
<project>/.pi/fzf.json      # project-local
```

### Structure

```json
{
  "commands": {
    "<name>": {
      "list": "<bash command that outputs candidates, one per line>",
      "action": "<action>"
    }
  }
}
```

Each entry registers a `/fzf:<name>` slash command in pi.

### Actions

An action defines what happens when the user selects a candidate. The
placeholder `{{selected}}` is replaced with the selected line (trimmed).

#### Short form

If `action` is a plain string, it defaults to the `editor` type:

```json
{
  "action": "Explain the file {{selected}}"
}
```

#### Long form

```json
{
  "action": {
    "type": "editor | send | bash",
    "template": "... {{selected}} ..."
  }
}
```

#### Action types

| Type     | What it does                                   | API used                    |
|----------|------------------------------------------------|-----------------------------|
| `editor` | Fills the pi editor. User can review and send. | `ctx.ui.setEditorText()`    |
| `send`   | Sends directly to the agent. Triggers a turn.  | `pi.sendUserMessage()`      |
| `bash`   | Runs a shell command. Shows result as notification. | `pi.exec()`            |

**`editor`** is the default and the most useful type. Since editor input goes
through pi's full command routing, it works with slash commands, skill commands,
and prompt templates:

```json
{ "type": "editor", "template": "/skill:{{selected}}" }
```

**`send`** is for "pick and go" flows where you don't need to review the prompt
before sending it to the agent.

**`bash`** is for side-effects (git checkout, stash, etc.) where you don't need
agent involvement.

### Example config

```json
{
  "commands": {
    "file": {
      "list": "fd --type f --max-depth 4",
      "action": "Read and explain {{selected}}"
    },
    "skill": {
      "list": "find ~/.pi/agent/skills -name 'SKILL.md' | sed 's|.*/skills/||;s|/SKILL.md||'",
      "action": { "type": "editor", "template": "/skill:{{selected}}" }
    },
    "branch": {
      "list": "git branch --format='%(refname:short)'",
      "action": { "type": "bash", "template": "git checkout {{selected}}" }
    },
    "todo": {
      "list": "grep -rn 'TODO\\|FIXME' --include='*.ts' -l",
      "action": { "type": "editor", "template": "Find and fix all TODOs in {{selected}}" }
    },
    "commit": {
      "list": "git log --oneline -20",
      "action": { "type": "send", "template": "Explain commit {{selected}} in detail" }
    }
  }
}
```

## Architecture

### Files

```
pi-fzf/
├── package.json        # declares fzf dependency
├── node_modules/
├── PLAN.md             # this file
├── index.ts            # extension entry: load config, register commands
├── config.ts           # config loading, types, merging
├── actions.ts          # action executors (editor / send / bash)
└── selector.ts         # TUI component: Input + fzf-filtered list
```

### Dependencies

- **`fzf`** (npm) — JavaScript port of the fzf fuzzy matching algorithm. Small
  (69KB), TypeScript types built-in, faithful to real fzf scoring and ranking.
  Returns match positions for highlighting.

### Flow

1. **`session_start`** — Load config from `~/.pi/agent/fzf.json` and
   `<cwd>/.pi/fzf.json`. Merge them (project overrides global).

2. **Register commands** — For each entry in `commands`, call
   `pi.registerCommand("fzf:<name>", ...)`.

3. **On command invocation** (`/fzf:<name>`):
   a. Run the `list` command via `pi.exec("bash", ["-c", cmd])`.
   b. Split stdout by newlines to get candidates.
   c. Open `ctx.ui.custom()` with the fuzzy selector component (overlay mode).
   d. Wait for user selection or cancel.

4. **On selection** — Execute the action:
   - `editor`: call `ctx.ui.setEditorText(rendered)`.
   - `send`: call `pi.sendUserMessage(rendered)`.
   - `bash`: call `pi.exec("bash", ["-c", rendered])`, show notification.

5. **On cancel** (Escape) — Close overlay, do nothing.

### TUI Component (selector)

The selector is rendered as a pi overlay (`ctx.ui.custom` with
`{ overlay: true }`). It consists of:

- **Input field** at the top — for typing the fuzzy query. Uses pi-tui's
  `Input` component.
- **Filtered list** below — candidates ranked by the `fzf` library. Scrollable,
  with arrow key navigation. Highlights matching characters.
- **Help line** at the bottom — keybinding hints.

Keyboard:
- Type to filter (fuzzy matching via fzf algorithm)
- `↑`/`↓` to navigate
- `Enter` to select
- `Escape` to cancel

The component must implement `Focusable` for IME support since it contains an
`Input` child.

## Implementation order

1. [x] `config.ts` — Types and config loading
2. [x] `selector.ts` — The fuzzy selector TUI component
3. [x] `actions.ts` — Action executors
4. [x] `index.ts` — Wire it all together
5. [x] Test with a sample `fzf.json` config

---

## Implementation Summary

### What was built

**`config.ts`**
- Types: `FzfAction` (short string / long `{type, template}`), `FzfCommandConfig`, `FzfConfig`
- Resolved types: `ResolvedAction`, `ResolvedCommand` (normalized after parsing)
- `loadFzfConfig(cwd)` — loads and merges global + project configs
- `renderTemplate(template, selected)` — replaces `{{selected}}` placeholder

**`selector.ts`**
- `FuzzySelector` extends `Container`, implements `Focusable`
- Box UI with rounded corners (`╭╮╰╯`), side borders (`│`), separator (`├┤`)
- Uses `fzf` npm library with `forward: false` (prefers matching filenames over directories)
- `highlightMatches()` wraps matched characters with theme color
- Keyboard: type to filter, ↑/↓ navigate (wrapping), Enter select, Escape cancel

**`actions.ts`**
- `executeAction()` switches on action type:
  - `editor` → `ctx.ui.setEditorText(rendered)`
  - `send` → `pi.sendUserMessage(rendered)`
  - `bash` → `pi.exec()` + notification

**`index.ts`**
- On `session_start`: loads config, registers `/fzf:<name>` commands
- Command handler: runs list command → opens overlay → executes action on selection
- Captures `tui` reference to call `requestRender()` after action (fixes editor text visibility)

### Issues encountered & fixes

1. **No side borders** — Initial implementation only had horizontal lines. Fixed by
   rendering a proper box with `│` side borders, rounded corners, and using
   `visibleWidth()` for correct padding of ANSI-styled content.

2. **Editor text not appearing after selection** — The `setEditorText()` call was
   running in a microtask after the overlay closed, but no render was requested
   afterward. Fixed by capturing the `tui` reference from the factory callback and
   calling `tui.requestRender()` after `executeAction()`.

### Repo setup

Originally developed in dotfiles at `pi/.pi/agent/extensions/pi-fzf/`, then moved
to standalone repo at `~/Code/pi-fzf`. Config file (`fzf.json`) remains in dotfiles.

Extension is loaded via `settings.json`:
```json
{
  "extensions": ["~/Code/pi-fzf"]
}
```
