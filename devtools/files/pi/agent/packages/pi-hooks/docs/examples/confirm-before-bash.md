# Confirm before bash

Use this when every `bash` tool call should require human approval.

## Hook snippet

```yaml
hooks:
  - id: confirm-bash
    event: tool.before.bash
    actions:
      - confirm:
          title: "Run bash command?"
          message: "Approve this bash tool call before it runs."
```

## What it does

Before the PI `bash` tool executes, PI shows a confirmation dialog.

- approve: the tool runs
- reject: the tool call is blocked

## Quick test

1. Start PI with a UI surface
2. Ask the agent to run a simple bash command
3. Reject the dialog
4. Confirm the tool call does not run

## Notes

- This is a blanket approval gate for all `bash` tool calls.
- In headless PI, `confirm` denies by default.
- For command-specific policies, prefer a `bash` guard that inspects `tool_args.command` from stdin.
