# Pre-tool developer guards

This is an opt-in example pack, not a built-in `pi-hooks` feature. Copy or adapt the snippets below into your own `hooks.yaml`.

Use this pack when you want fast checks before PI runs tools that can mutate a project.

## Good use cases

| Hook | Use it when |
|---|---|
| `guard-risky-bash` | You want to block obviously dangerous shell commands before they run. |
| `guard-protected-write` | You want to stop direct writes to secrets, certificates, keys, and local environment files. |
| `guard-protected-edit` | You want the same protection for edit-based file changes. |
| `guard-package-install` | You want package installs and dependency updates to be explicit human actions. |

## Install

Copy `hooks.yaml` into your global hook file or a trusted project hook file.

If you keep the script in this repository, run PI from the repository root or update this path in `hooks.yaml`:

```yaml
bash: 'node ./examples/pre-tool-developer-guards/pre-tool-policy.mjs'
```

For another project, copy `pre-tool-policy.mjs` into that project and point the YAML at the copied path.

## Behavior

- Exit code `2` blocks the matching pre-tool call.
- These hooks inspect the tool payload before execution; they do not run on `tool.after.*`.
- The risky-bash regex matches commands following whitespace, start-of-string, or a shell separator (`;`, `&`, `|`, `` ` ``, `(`). It is a coarse heuristic, not a security boundary; quoting, env var indirection, `eval`, and aliasing can all defeat it. Use OS-level controls if you need real isolation.
- `isProtectedPath` runs a path-segment check, so `config/.env`, `app/secrets/db.yml`, and `home/.ssh/id_rsa` are all protected.

## Quick test

1. Add the hooks.
2. Ask PI to run `git reset --hard`.
3. Confirm the bash tool call is blocked.
4. Ask PI to write `.env`.
5. Confirm the write tool call is blocked.
6. Ask PI to run `npm install left-pad`.
7. Confirm the package install is blocked.
8. Ask PI to run a harmless command like `pwd`.
9. Confirm it still runs.
