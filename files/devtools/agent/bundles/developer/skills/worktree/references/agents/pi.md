# Agent contract: pi

## Detection

`PI_CODING_AGENT=true` is set by pi on its own child processes (confirmed in pi's own docs, `packages/coding-agent/docs/environment-variables.md`). `AI_AGENT=pi` is a second, more generic marker pi also sets.

Caveat: pi only sets these for CLI-launched sessions, not when pi runs embedded via its SDK. A pi session started that way will not self-identify.

Other pi env vars (`PI_SESSION_ID`, `PI_SESSION_FILE`, `PI_PROVIDER`, `PI_MODEL`, `PI_REASONING_LEVEL`) describe the current session, not detection — do not use them to detect pi.

## Launch

```bash
pi <task or -- @handoff-file>
```

hrdx's built-in harness kind for this agent is `pi`.

## Resume

hrdx: `hrdx --continue` resumes previous sessions, including pi ones.
