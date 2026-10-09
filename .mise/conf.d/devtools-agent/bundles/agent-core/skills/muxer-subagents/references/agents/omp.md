# Agent contract: OMP

## Detection

OMP has no confirmed environment variable that distinguishes it from Pi. The OMP extension at `hooks/pre/muxer-session.ts` supplies `agent="omp"` directly.

Outside the OMP extension, `detect-agent` cannot identify OMP. Pass `--agent omp` explicitly when OMP is the target. `command -v omp` only proves that the executable is installed.

## Launch

```bash
omp <task or -- @handoff-file>
```

Herdr's built-in agent kind for this agent is `omp`.

## Non-interactive invocation

```bash
omp -p --no-session <prompt>
```

Use this form only for short one-shot work. Use the interactive launch for full agent work.

## Resume

`omp --continue` resumes the most recent session in the current directory.
