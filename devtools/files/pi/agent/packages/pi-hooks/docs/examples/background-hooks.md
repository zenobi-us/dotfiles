# Background hooks

Use `async: true` when a post-processing hook is slow and should not block the agent turn.

## Hook snippet

```yaml
hooks:
  - id: async-change-log
    event: file.changed
    async: true
    actions:
      - bash: 'mkdir -p .pi-hook-logs && (sleep 2; date >> .pi-hook-logs/async.log)'
```

## What it does

After a file change event, the hook is queued and runs in the background for that session and event key.

## Named groups and bounded concurrency

```yaml
hooks:
  - id: async-upload
    event: tool.after.write
    async:
      group: uploads
      concurrency: 2
    actions:
      - bash: './scripts/upload-artifact.sh'
```

Hooks in the same session and async `group` share a queue. `concurrency: 2` allows two of them to run at once; omit it to keep the old serialized behavior.

## Quick test

1. Add the hook
2. Edit a file through PI
3. Confirm the agent turn finishes without waiting two seconds
4. Check `.pi-hook-logs/async.log`

## Rules

- async hooks must be `bash`-only
- async is not allowed on `tool.before.*`
- async is not allowed on `session.idle`
- `async: true` keeps one serialized queue per event and session
- named `group` queues can run independently from other groups in the same session

## Good uses

- enqueueing background work
- slow logging
- external integrations that should not block editing
