# Debugging hooks

`pi-hooks` can write persistent NDJSON debug logs when you start PI with:

```bash
PI_YAML_HOOKS_DEBUG=1 pi
```

Even without debug logging, hook execution failures and adapter dispatch failures still print concise stderr errors by default. Debug mode adds persistent NDJSON traces and action-level detail.

## Structured in-session diagnostics

`pi-hooks` also emits structured PI-native diagnostics messages for:

- `/hooks-status`
- `/hooks-validate`
- hook-load validation problems detected while loading a config

These appear inline in the session when PI supports custom messages. In no-UI or other non-rendered contexts, the same message content still degrades to plain text plus the existing logs; RPC mode in Pi 0.79+ may still expose UI depending on the host.

## Log file

Default path:

```text
~/.pi/agent/logs/pi-hooks.ndjson
```

Override it with:

```bash
PI_YAML_HOOKS_LOG_FILE=/tmp/pi-hooks.ndjson PI_YAML_HOOKS_DEBUG=1 pi
```

The log file rotates automatically once it exceeds `PI_YAML_HOOKS_LOG_MAX_BYTES` (default 10 MiB). On rotation the live file is renamed to `<path>.1`, replacing any prior `.1`. Only one rotated copy is kept, so plumb the file into your own log shipper if you need more history.

## Tail the log

Raw tail:

```bash
tail -F ~/.pi/agent/logs/pi-hooks.ndjson
```

Pretty tail helper:

```bash
./scripts/tail-hook-log.sh
```

Or from inside PI, run `/hooks-tail-log` to get the current log path and a `tail -F` command you can paste into a shell.

Filter by hook:

```bash
./scripts/tail-hook-log.sh --hook load-writer-skill-when-markdown-changes
```

Filter by event and session:

```bash
./scripts/tail-hook-log.sh --event session.idle --session abc123
```

Filter by log kind:

```bash
./scripts/tail-hook-log.sh --kind action_result --level info
```

See raw NDJSON after filtering:

```bash
./scripts/tail-hook-log.sh --hook load-writer-skill-when-markdown-changes --raw
```

## What gets logged

When debug logging is enabled, `pi-hooks` logs:

- hook config load and reload events
- event dispatches such as `tool.before.*`, `tool.after.*`, and `session.idle`
- each hook considered for a matching event
- why a hook matched or was skipped
- each action start/result
- the exact prompt text queued by `tool:` actions
- bash result status, exit code, duration, stdout, and stderr
- timeout cleanup details such as process-group SIGTERM, SIGKILL escalation, and final cleanup result
- exact skip reasons such as `matchesAnyPath_failed` or `scope_mismatch`
- target session ids and prompt text for `tool:` follow-up injections
- whether `tool:`, `notify:`, and `setStatus:` actions were accepted, degraded, or failed

## Important note

These logs are written by the extension runtime, not by the PI session transcript.

That means:

- `~/.pi/agent/sessions/*.jsonl` will not contain the full hook debug trail
- the canonical hook log is `~/.pi/agent/logs/pi-hooks.ndjson`

## Common debugging workflow

For a hook like:

```yaml
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

Run:

```bash
PI_YAML_HOOKS_DEBUG=1 pi
```

Then in another terminal:

```bash
./scripts/tail-hook-log.sh --hook load-writer-skill-when-markdown-changes
```

You should be able to see:

- whether the hook was considered
- whether it matched or skipped
- the skip reason if it did not match
- the exact prompt text queued by the `tool:` action if it matched

## Useful environment variables

The full environment-variable reference lives in [`setup.md`](./setup.md#environment-variables). The variables most relevant to debugging are:

- `PI_YAML_HOOKS_DEBUG=1`: enables debug-level persistent logging
- `PI_YAML_HOOKS_LOG_FILE=/path/file.ndjson`: changes the log file location
- `PI_YAML_HOOKS_LOG_LEVEL=debug|info|warn|error`: sets the log level explicitly
- `PI_YAML_HOOKS_LOG_STDERR=1`: mirrors structured log entries to stderr
