# Tail hook logs

Tail the persistent hook log to see exactly why a hook matched, skipped, or queued a follow-up prompt.

## Start PI with persistent hook logging

```bash
PI_YAML_HOOKS_DEBUG=1 pi
```

This writes NDJSON logs to:

```text
~/.pi/agent/logs/pi-hooks.ndjson
```

## Tail everything

```bash
./scripts/tail-hook-log.sh
```

This is the easiest way to watch hook activity in real time.

## Filter to one hook

```bash
./scripts/tail-hook-log.sh --hook load-writer-skill-when-markdown-changes
```

Use this when one hook is under suspicion and you do not want noise from the rest.

## Filter to one event

```bash
./scripts/tail-hook-log.sh --event session.idle
```

Good for debugging hooks that batch work after the turn settles.

## Filter to one session

```bash
./scripts/tail-hook-log.sh --session <session-id>
```

Useful when several PI sessions are active at the same time.

## Show only action results

```bash
./scripts/tail-hook-log.sh --kind action_result --level info
```

This shows the business end of the hook system: what actually ran.

## Show raw filtered NDJSON

```bash
./scripts/tail-hook-log.sh --hook load-writer-skill-when-markdown-changes --raw
```

Use raw mode when you want the full JSON payload for scripting or deeper inspection.

## What you should expect to see

For a hook like this:

```yaml
hooks:
  - id: load-writer-skill-when-markdown-changes
    event: session.idle
    conditions:
      - matchesAnyPath:
          - "*.md"
          - "**/*.md"
    actions:
      - tool:
          name: read
          args:
            path: /Users/me/.pi/agent/skills/writer/SKILL.md
```

A successful run should show:

- `hook_match`
- `action_start`
- `action_result`
- the exact `prompt=...` queued by the `tool:` action

A skipped run should show:

- `hook_skip`
- a reason such as `matchesAnyPath_failed` or `scope_mismatch`

## Related docs

- [`../debugging-hooks.md`](../debugging-hooks.md)
- [`./tool-follow-up-prompts.md`](./tool-follow-up-prompts.md)
