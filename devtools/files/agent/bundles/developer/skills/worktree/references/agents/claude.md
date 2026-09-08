# Agent contract: claude

## Detection

`CLAUDECODE=1` is set by Claude Code itself. Confirmed in `worktrunk/reference/llm-commits.md` and `vanilla-green/skills/orch/scripts/open-terminal`.

To run a nested, non-interactive `claude` from inside an existing Claude Code session, unset the guard: `CLAUDECODE=`. Without this, `claude -p` refuses to nest.

## Launch

```bash
claude <task or -- @handoff-file>
```

hrdx's built-in harness kind for this agent is `claude`.

## Non-interactive / one-shot invocation

```bash
CLAUDECODE= claude -p --no-session-persistence --model=haiku --tools='' --disable-slash-commands --setting-sources='' --system-prompt='' <prompt>
```

`--no-session-persistence` keeps this call out of `claude --continue`. Use this form only for short, tool-free text generation (for example commit messages), not for full agent work.

## Resume

`claude --continue` resumes the most recent session in the current directory.
