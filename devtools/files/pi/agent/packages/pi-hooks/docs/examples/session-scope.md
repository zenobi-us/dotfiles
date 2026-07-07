# Session scope

Use `scope` to control whether a hook runs in the main session, child sessions, or both.

## Main session only

```yaml
hooks:
  - id: main-idle-status
    event: session.idle
    scope: main
    actions:
      - setStatus: "Main session idle"
```

## Child sessions only

```yaml
hooks:
  - id: child-created-notify
    event: session.created
    scope: child
    actions:
      - notify: "Child session created"
```

## All sessions

```yaml
hooks:
  - id: every-session-created
    event: session.created
    scope: all
    actions:
      - notify: "A session started"
```

## What to remember

- `scope` filters where the hook itself is allowed to run.
- `scope: main` means only the root session in the current lineage.
- `scope: child` means only non-root sessions.
- This is different from `runIn`, which is about action targeting compatibility.
