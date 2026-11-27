# Agent contract: OMP

## Detection

`OMPCODE=1` identifies OMP in its spawned shells. The OMP extension also supplies `agent="omp"` as an explicit caller identity.

When several environment markers identify different agents, `detect-agent` returns `unknown-agent`. An explicit caller identity takes precedence. Do not infer OMP from `command -v omp`; that only proves that the executable is installed.

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
