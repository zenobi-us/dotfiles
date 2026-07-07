# Post-tool developer feedback

This is an opt-in example pack, not a built-in `pi-hooks` feature. Copy or adapt the snippets below into your own `hooks.yaml`.

Use this pack when you want lightweight feedback after tools mutate code or project metadata.

## Good use cases

| Hook | Use it when |
|---|---|
| `log-source-write` | You want a small audit trail for source files written by PI. |
| `log-source-edit` | You want the same audit trail for edits. |
| `mark-package-change-write` / `mark-package-change-edit` | You want the UI to show that dependency metadata changed, regardless of whether PI wrote or edited the file. |
| `suggest-package-check-write` / `suggest-package-check-edit` | You want the current PI session nudged to consider validation after package files change, for both write and edit tool calls. |

## Install

Copy `hooks.yaml` into your global hook file or a trusted project hook file.

If you keep the script in this repository, run PI from the repository root or update this path in `hooks.yaml`:

```yaml
bash: 'node ./examples/post-tool-developer-feedback/post-tool-log.mjs'
```

For another project, copy `post-tool-log.mjs` into that project and point the YAML at the copied path.

## Behavior

- `tool.after.write` and `tool.after.edit` hooks use path conditions, so they only run for selected paths.
- The logger appends NDJSON to `.pi-hook-logs/tool-events.ndjson`.
- `setStatus` updates PI UI status when a UI surface exists.
- `tool:` sends a follow-up prompt into the current PI session; it does not imperatively run the tool.

## Quick test

1. Add the hooks.
2. Ask PI to edit or write a file under `src/`.
3. Check `.pi-hook-logs/tool-events.ndjson`.
4. Ask PI to modify `package.json`.
5. Confirm the status entry updates and the session receives the follow-up prompt.
