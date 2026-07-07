# Block bash by policy

Use a `bash` pre-tool hook when the decision should come from code instead of a user prompt.

## Hook snippet

```yaml
hooks:
  - id: block-hard-reset
    event: tool.before.bash
    actions:
      - bash: 'payload=$(cat); case "$payload" in *"git reset --hard"*) echo "Blocked git reset --hard" >&2; exit 2;; esac'
```

## What it does

Before the `bash` tool runs, the hook reads the JSON payload from stdin.

If the payload contains `git reset --hard`, the hook:

- writes a reason to stderr
- exits with code `2`
- blocks the tool call

## Quick test

1. Add the hook
2. Ask PI to run `git reset --hard`
3. Confirm the tool is blocked
4. Ask PI to run a harmless bash command
5. Confirm the harmless command still runs

## Notes

- Exit code `2` is the blocking code for `tool.before.*` bash hooks.
- Any other non-zero exit is treated as a failed hook, not a block.
- For more robust JSON inspection, replace the inline shell with a real script.
