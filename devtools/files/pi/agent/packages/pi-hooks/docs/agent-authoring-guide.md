# Agent authoring guide

Use this guide when a person or another agent needs to write or modify `hooks.yaml` safely.

## Default authoring rules

1. Prefer the global hook file unless the behavior is truly project-specific.
2. Give every non-trivial hook an `id`.
3. Use `bash` for deterministic automation.
4. Use `tool:` only when you intentionally want to send the current PI session a follow-up instruction.
5. Use `tool.before.*` only for checks that must happen before execution.
6. Use `file.changed` or `session.idle` for post-processing work.
7. Add `conditions` so hooks do not fire more broadly than intended.
8. Use `async: true` for slow post-processing bash hooks.
9. Assume project hooks are disabled until the project is trusted.
10. Verify with a small manual test after editing the file.

## Choosing the right event

| Goal | Preferred event |
|---|---|
| Guard a command before it runs | `tool.before.<name>` |
| React to any tool call | `tool.before.*` or `tool.after.*` |
| React only to file mutations | `file.changed` |
| Run something after the turn settles | `session.idle` |
| Initialize per-session state | `session.created` |
| Flush or clean up best-effort state | `session.deleted` |

## Choosing the right action

| Goal | Preferred action |
|---|---|
| Run a script, write a log, call another program | `bash` |
| Show a user-visible message | `notify` |
| Ask for approval before a tool runs | `confirm` |
| Show lightweight ongoing state in the UI | `setStatus` |
| Ask the agent to do something next | `tool` |

## Safe patterns

### Add ids up front

```yaml
hooks:
  - id: lint-on-idle
    event: session.idle
    actions:
      - bash: "npm run lint"
```

Without an `id`, a later file cannot cleanly replace or disable the hook.

### Keep pre-tool hooks fast

`tool.before.*` blocks the agent path. Keep these hooks short and predictable.

Good uses:

- static confirmation
- simple allow or deny policy
- fast shell checks

Bad uses:

- slow network calls
- long formatting jobs
- expensive repository scans

### Use `file.changed` for exact-ish file workflows

If the workflow depends on changed paths, `file.changed` is usually better than `tool.after.*`.

Why:

- it gives you `files` and `changes`
- it works across recognized mutation tools
- it keeps path-based logic in one place

Use path conditions on `tool.after.<name>` when you deliberately want tool-specific post-processing, such as reacting only to `tool.after.write` events under `src/**`. The condition still needs changed paths; non-mutating tools such as `read`, `grep`, `find`, and `ls` will not match path filters.

### Use `session.idle` for batching

If you want one action after a burst of edits, prefer `session.idle`.

Typical examples:

- summarize changes
- run a formatter once after several edits
- update a status file

### Use multiple conditions for intersection

If you mean "all changed files are in `src/` and all are TypeScript", do this:

```yaml
conditions:
  - matchesAllPaths: "src/**"
  - matchesAllPaths: "**/*.ts"
```

Do not put both patterns into a single `matchesAllPaths` entry if you need strict intersection semantics.

## Project override pattern

The clean pattern is:

- global file defines the default hook with `id`
- project file uses `override:` or `disable: true`

Example:

Global:

```yaml
hooks:
  - id: idle-notify
    event: session.idle
    actions:
      - notify: "Global idle"
```

Project:

```yaml
hooks:
  - override: idle-notify
    event: session.idle
    actions:
      - notify: "Project idle"
```

## What not to rely on

Avoid building important workflows around these assumptions:

- `command:` actions working on PI
- `tool:` calling a tool directly
- `session.deleted` meaning "the session was definitely closed"
- `runIn: main` switching the actual bash execution context
- untrusted project hooks loading automatically

## Debugging checklist

When a hook does not fire:

1. check that PI printed a load summary
2. confirm the hook file path is the one PI actually loaded
3. confirm the project is trusted if using a project hook file
4. confirm the event name matches a real PI tool or lifecycle event
5. if using path conditions, confirm the event actually carries changed paths
6. run with `PI_YAML_HOOKS_DEBUG=1`

## Minimal test workflow for agents

After editing `hooks.yaml`, agents should do a tiny proof test:

1. trigger the smallest event that should match
2. observe PI output or UI behavior
3. if using `bash`, inspect the side effect or logged file
4. only then claim the hook is working

## Recommended links

- [`setup.md`](./setup.md)
- [`hooks-reference.md`](./hooks-reference.md)
- [`examples/`](./examples/)
