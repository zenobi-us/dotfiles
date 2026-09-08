# Troubleshooting: wt hook needs approval

## Symptom

A `wt` command (`merge`, `switch`, or any command that triggers a project hook) fails with:

```
▲ <hook> needs approval to execute N commands
✗ Cannot prompt for approval in non-interactive environment
```

## Cause

Project hooks and aliases (`.config/wt.toml`) prompt for approval on first run, so an untrusted config cannot silently execute arbitrary commands. An agent session is non-interactive, so the prompt cannot be answered inline.

## Fix

Stop and escalate to the user — approving hook execution is a trust decision about running arbitrary commands on their machine, not something the agent decides on their behalf.

- Tell the user to run `wt config approvals add` (persists per project until the hook template changes).
- Or, only for CI/CD-style pipelines where hook contents are pipeline-controlled: `--yes` / `-y` for a single invocation.

Full detail: `worktrunk` skill, "Hook Approvals in Non-Interactive Sessions".
