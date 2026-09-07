# pi-ask configuration

This file is the source of truth for configuring `@eko24ive/pi-ask`.

When changing pi-ask settings:

1. Edit the config file.
2. Validate keymaps against the rules below.
3. Run `/reload` or restart pi so the new config is picked up.

pi-ask treats this file as user-owned config. It does not rewrite or back up the file just because it was loaded, migrated, or found invalid. Settings toggled in `/ask-settings` are saved only when the file is writable; if saving fails, pi-ask reverts the toggle and shows the config path to edit manually.

## Config file path

Default path:

`~/.pi/agent/extensions/eko24ive-pi-ask.json`

If the file does not exist yet, pi-ask attempts to create it with the current default settings the first time the ask flow is used. If the config location is read-only or managed outside pi-ask, pi-ask uses built-in defaults for the session and leaves disk unchanged.

Older pi-ask versions wrote this file at `~/.pi/agent/eko24ive-pi-ask.json`. If that legacy file exists and the extensions config does not, pi-ask reads the legacy file as a fallback and leaves disk unchanged. If both files exist, pi-ask uses the extensions config and leaves the legacy root file untouched.

## Config versions and migrations

`schemaVersion` identifies the persisted config shape. pi-ask migrates older supported schema versions forward in memory before validation. Migrations preserve existing user-provided values and add new fields from defaults when needed, but loading a config does not rewrite the file.

Unsupported future versions or invalid files are left unchanged and defaults are loaded for the current session. Fix the file, then run `/reload` or restart pi.

## Config shape

```json
{
  "schemaVersion": 5,
  "answer": {
    "extractionModels": [
      { "provider": "openai-codex", "id": "<model-id>" },
      { "provider": "github-copilot", "id": "<model-id>" },
      { "provider": "anthropic", "id": "<model-id>" }
    ],
    "extractionTimeoutMs": 30000,
    "extractionRetries": 1
  },
  "behaviour": {
    "autoSubmitWhenAnsweredWithoutNotes": false,
    "confirmDismissWhenDirty": true,
    "doublePressReviewShortcuts": true,
    "presentSingleAsMulti": false,
    "showFooterHints": true
  },
  "keymaps": {
    "global": { "dismiss": ["ctrl+c"], "settings": ["?"] },
    "main": {
      "confirm": ["enter"],
      "cancel": ["esc"],
      "toggle": ["space"],
      "changeQuestionType": ["t"],
      "nextTab": ["tab", "right"],
      "previousTab": ["shift+tab", "left"],
      "nextOption": ["down"],
      "previousOption": ["up"],
      "optionNote": ["n"],
      "questionNote": ["shift+n"]
    },
    "editor": {
      "submit": ["enter"],
      "close": ["esc"],
      "nextTabWhenEmpty": ["tab", "right"],
      "previousTabWhenEmpty": ["shift+tab", "left"],
      "nextOptionWhenEmpty": ["down"],
      "previousOptionWhenEmpty": ["up"]
    },
    "noteEditor": {
      "save": ["enter"],
      "close": ["esc"],
      "nextTabWhenEmpty": ["tab", "right"],
      "previousTabWhenEmpty": ["shift+tab", "left"],
      "nextOptionWhenEmpty": ["down"],
      "previousOptionWhenEmpty": ["up"]
    },
    "settingsModal": {
      "close": ["esc", "ctrl+c", "?"],
      "nextOption": ["down"],
      "previousOption": ["up"],
      "toggle": ["enter", "space"]
    }
  },
  "notifications": {
    "enabled": true,
    "channels": ["bell"]
  }
}
```

## Answer extraction

These settings affect only the `/answer` command. Normal `ask_user` tool calls do not use an extraction model.

### `answer.extractionModels`

- type: array of `{ "provider": string, "id": string }`
- default: lightweight OpenAI Codex, GitHub Copilot, and Anthropic models
- effect: `/answer` tries configured models in order and uses the first model with available auth
- fallback: if no configured model is usable, `/answer` tries the current chat model after validating its auth

### `answer.extractionTimeoutMs`

- type: positive number
- default: `30000`
- effect: per-attempt extraction timeout in milliseconds

### `answer.extractionRetries`

- type: integer from `0` to `3`
- default: `1`
- effect: number of retry attempts after raw JSON parsing fails; retries include the parse error and previous response as feedback

## Behaviour

### `behaviour.autoSubmitWhenAnsweredWithoutNotes`

- type: boolean
- default: `false`
- effect: when enabled, a fully answered ask flow with no notes can auto-submit from the review tab

### `behaviour.confirmDismissWhenDirty`

- type: boolean
- default: `true`
- effect: when enabled, discarding a dirty ask flow requires a second cancel/dismiss action
- the warning stays visible until the user changes tabs in the ask flow
- dirty means there are saved answers/notes or unsaved editor draft text

### `behaviour.doublePressReviewShortcuts`

- type: boolean
- default: `true`
- effect: when enabled, review-tab number shortcuts (`1`, `2`, `3`) only trigger after pressing the same key twice
- the review screen shows an inline hint and keeps the pending shortcut armed until another review shortcut is pressed or the user leaves the tab

### `behaviour.presentSingleAsMulti`

- type: boolean
- default: `false`
- effect: future ask flows render requested `single` questions as `multi` questions
- result: the question keeps `type: "single"` and adds `presentedType: "multi"`; result text uses one compact note when any answered questions were presented differently
- scope: this is a default presentation policy for new/replayed ask flows; it is not hot-applied to the current ask flow
- current-flow override: use the configurable main-flow `changeQuestionType` hotkey (default `t`) to change the active question type live: non-preview questions toggle `single <-> multi`; preview questions toggle `preview <-> multi`
- destructive confirmation: changing `multi -> single` with multiple selected answers requires pressing the type hotkey again; the pending confirmation has no timeout and clears when another navigation/action is used

### `behaviour.showFooterHints`

- type: boolean
- default: `true`
- effect: when disabled, the ask flow hides the footer keymap hints

## Notifications

Notifications are best-effort external alerts emitted once per ask session, when the ask UI opens and is waiting for input.

### `notifications.enabled`

- type: boolean
- default: `true`
- effect: enables or disables external ask notifications
- settings UI: this is the only notification field toggled individually by `/ask-settings` or `?` in the ask flow

### `notifications.channels`

- type: array
- default: `["bell"]`
- supported channels:
  - `"bell"` writes BEL (`\u0007`)
  - `"osc9"` writes an OSC 9 terminal notification
  - `"osc777"` writes an OSC 777 title/body notification
  - `{ "type": "command", "command": string }` runs a shell command
- effect: channels run in order; failures are ignored and never fail the ask flow
- invalid channels are skipped; if none are valid, pi-ask falls back to `["bell"]`

Notification text:

```txt
Question waiting: <label or prompt>
```

Command channels receive these environment variables:

```sh
ASK_NOTIFY_EVENT=question.waiting
ASK_NOTIFY_TITLE="pi ask"
ASK_NOTIFY_MESSAGE="Question waiting: <label or prompt>"
```

cmux example:

```json
{
  "type": "command",
  "command": "cmux notify --title \"$ASK_NOTIFY_TITLE\" --body \"$ASK_NOTIFY_MESSAGE\""
}
```

## Keymaps

`keymaps` is context-aware. Each action accepts either one key id string or an array of key id strings.
Arrays are aliases: any listed key triggers the same action.

### Defaults

```json
"keymaps": {
  "global": {
    "dismiss": ["ctrl+c"],
    "settings": ["?"]
  },
  "main": {
    "confirm": ["enter"],
    "cancel": ["esc"],
    "changeQuestionType": ["t"],
    "toggle": ["space"],
    "nextTab": ["tab", "right"],
    "previousTab": ["shift+tab", "left"],
    "nextOption": ["down"],
    "previousOption": ["up"],
    "optionNote": ["n"],
    "questionNote": ["shift+n"]
  },
  "editor": {
    "submit": ["enter"],
    "close": ["esc"],
    "nextTabWhenEmpty": ["tab", "right"],
    "previousTabWhenEmpty": ["shift+tab", "left"],
    "nextOptionWhenEmpty": ["down"],
    "previousOptionWhenEmpty": ["up"]
  },
  "noteEditor": {
    "save": ["enter"],
    "close": ["esc"],
    "nextTabWhenEmpty": ["tab", "right"],
    "previousTabWhenEmpty": ["shift+tab", "left"],
    "nextOptionWhenEmpty": ["down"],
    "previousOptionWhenEmpty": ["up"]
  },
  "settingsModal": {
    "close": ["esc", "ctrl+c", "?"],
    "nextOption": ["down"],
    "previousOption": ["up"],
    "toggle": ["enter", "space"]
  }
}
```

### Contexts

- `global`: active in the main ask flow and editors; duplicates with those contexts are invalid
- `main`: question and review flow
- `editor`: custom answer editor
- `noteEditor`: question/option note editor
- `settingsModal`: `/ask-settings` and `?` settings overlay

### Allowed bindings

Each action accepts any `pi-tui` key id string, as long as it is:

- supported by `pi-tui`
- not a fixed numeric shortcut (`1` through `9`)
- not duplicated within the same context
- not duplicated between `global` and `main`, `editor`, or `noteEditor`

Examples of valid bindings:

- `esc`
- `ctrl+c`
- `space`
- `enter`
- `n`
- `shift+n`
- `alt+f7`
- `ctrl+[` 
- `ctrl+shift+p`
- `super+k`

### Accepted alias normalization

Common aliases are normalized to canonical `pi-tui`-style strings.

Examples:

- `escape` -> `esc`
- `return` -> `enter`
- `control+c` -> `ctrl+c`
- `Shift+N` -> `shift+n`
- `pageup` -> `pageUp`
- `pagedown` -> `pageDown`

### Fixed bindings

These are intentionally not configurable:

- `1..9` triggers option/review shortcuts
- when `behaviour.doublePressReviewShortcuts` is enabled, review-tab shortcuts `1`, `2`, and `3` require the same key twice
- `@` remains the file-reference affordance in editors

## Invalid keymaps behavior

If configured keymaps are invalid:

- valid `behaviour`, `notifications`, and `answer` settings still load
- invalid `keymaps` fall back to default keymaps for the current session
- ask remains usable
- a warning notice is shown
- after fixing the file, run `/reload` or restart pi

Invalid keymaps include:

- missing one of the required contexts or actions
- unsupported key syntax
- duplicate bindings within one context
- duplicate bindings between `global` and `main`, `editor`, or `noteEditor`
- use of fixed numeric shortcuts (`1` through `9`)

## Example custom config

```json
{
  "schemaVersion": 5,
  "answer": {
    "extractionRetries": 1,
    "extractionTimeoutMs": 30000,
    "extractionModels": [
      { "provider": "openai-codex", "id": "<model-id>" }
    ]
  },
  "behaviour": {
    "autoSubmitWhenAnsweredWithoutNotes": true,
    "confirmDismissWhenDirty": true,
    "doublePressReviewShortcuts": true,
    "presentSingleAsMulti": false,
    "showFooterHints": false
  },
  "keymaps": {
    "global": {
      "dismiss": ["ctrl+c"],
      "settings": ["?"]
    },
    "main": {
      "confirm": ["ctrl+k"],
      "cancel": ["q"],
      "toggle": ["ctrl+t"],
      "changeQuestionType": ["t"],
      "nextTab": ["tab", "right"],
      "previousTab": ["shift+tab", "left"],
      "nextOption": ["down"],
      "previousOption": ["up"],
      "optionNote": ["x"],
      "questionNote": ["shift+x"]
    },
    "editor": {
      "submit": ["ctrl+k"],
      "close": ["q"],
      "nextTabWhenEmpty": ["tab", "right"],
      "previousTabWhenEmpty": ["shift+tab", "left"],
      "nextOptionWhenEmpty": ["down"],
      "previousOptionWhenEmpty": ["up"]
    },
    "noteEditor": {
      "save": ["ctrl+k"],
      "close": ["q"],
      "nextTabWhenEmpty": ["tab", "right"],
      "previousTabWhenEmpty": ["shift+tab", "left"],
      "nextOptionWhenEmpty": ["down"],
      "previousOptionWhenEmpty": ["up"]
    },
    "settingsModal": {
      "close": ["esc", "ctrl+c", "?"],
      "nextOption": ["j", "down"],
      "previousOption": ["k", "up"],
      "toggle": ["enter", "space"]
    }
  },
  "notifications": {
    "enabled": true,
    "channels": [
      {
        "type": "command",
        "command": "cmux notify --title \"$ASK_NOTIFY_TITLE\" --body \"$ASK_NOTIFY_MESSAGE\""
      }
    ]
  }
}
```

## Agent editing rule

When editing this config for a user:

- preserve unrelated fields
- keep `schemaVersion` at `5`
- preserve `answer.extractionModels` as explicit provider/id pairs
- keep `answer.extractionRetries` between `0` and `3`
- do not assign fixed numeric shortcuts (`1` through `9`) to configurable actions
- do not create duplicate bindings within a context or between `global` and `main`, `editor`, or `noteEditor`
- preserve existing `notifications.channels` unless the user asks to change notification targets
- only toggle `notifications.enabled` unless the user asks to configure channels
- use the settings reset action only when the user explicitly asks to restore pi-ask defaults
- use a `cmux notify` command channel when the user asks for cmux notifications
- after changing the file, tell the user to run `/reload` or restart pi
