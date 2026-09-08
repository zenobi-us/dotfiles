# Project overrides

Loads private Pi resources from a per-project override root outside the repo.

## Default key

The default override key is:

```sh
git config --get remote.origin.url
```

slugified by lowercasing and replacing non-alphanumeric runs with `-`.

If no `remote.origin.url` exists, the extension falls back to a slug of the current working directory.

## Context links

`~/.pi/overrides/context.json` can map arbitrary directories to an override key:

```json
{
  "shared-work": [
    "/mnt/something/else"
  ],
  "other-work": []
}
```

When the current cwd is the same as a listed directory, or inside it, that key wins over the default key. Longest matching directory wins.

Run:

```text
/overrides link
```

to choose an override key from:

- the current default key
- existing `context.json` keys
- existing `~/.pi/overrides/<key>/` directories

The command adds the current cwd to `context.json`. If the selected key has no entry, it creates one.

## Layout

```text
~/.pi/overrides/
├── context.json
└── <key>/
    ├── AGENTS.md
    ├── agents/
    ├── prompts/
    └── skills/
```

Run:

```text
/overrides init
```

to create `agents/`, `prompts/`, and `skills/` for the active key.

Run:

```text
/overrides
```

to show the current key, base key, root, context file, and detected resources.

## Behavior

- `skills/` is added through Pi `resources_discover.skillPaths`.
- `prompts/` is added through Pi `resources_discover.promptPaths`.
- `AGENTS.md` is appended to the turn system prompt in `before_agent_start`.
- `agents/` is discovered by the local `pi-subagents` patch.

## Limits

- Override extensions are intentionally ignored.
- Override `settings.json` is intentionally ignored.
- Same-name skills/prompts keep Pi's existing first-wins collision behavior, so override files only reliably add new names.
- Override agents are loaded after global and project agents, so same-name override agents win.
- Injected `AGENTS.md` is not native Pi context loading and may not appear in startup headers.
