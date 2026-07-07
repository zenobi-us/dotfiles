# Log file changes

Use this to record every synthesized `file.changed` payload for later inspection.

## Hook snippet

```yaml
hooks:
  - id: log-file-changes
    event: file.changed
    actions:
      - bash: 'mkdir -p .pi-hook-logs && cat >> .pi-hook-logs/file-changed.ndjson'
```

## What it does

Every matching event appends the raw stdin JSON payload to:

```text
.pi-hook-logs/file-changed.ndjson
```

That gives you an append-only log you can inspect later.

## Quick test

1. Add the hook
2. Use PI to `write` or `edit` a file
3. Open `.pi-hook-logs/file-changed.ndjson`
4. Confirm a JSON line was appended

## Why this example is useful

- it has no extra dependencies
- it shows the exact payload shape your later scripts will receive
- it works well as a debugging hook while designing more complex automation

## Notes

On stock PI, `file.changed` can be synthesized from:

- `write`
- `edit`
- recognized `bash` mutation commands such as `cp`/`git cp`, `mv`/`git mv`, `rm`/`git rm`, `touch`, and `mkdir`
