# Completion signal contract

## Run identity

`spawn` creates a UUID `runId` and prints it with the target information. The parent uses this ID with `wait`:

```bash
scripts/router.ts wait <run-id>
```

Run records live under `$XDG_STATE_HOME/muxer-subagents/runs/<run-id>`. If `XDG_STATE_HOME` is unset, the router uses `~/.local/state`.

## Signal record

The router stores one versioned JSON signal per run. It replaces the record atomically when the state changes.

```json
{
  "version": 1,
  "runId": "<uuid>",
  "sequence": 2,
  "state": "completed",
  "source": "process",
  "timestamp": "<iso-timestamp>",
  "exitCode": 0
}
```

`sequence` increases for each signal. The `source` field is `launcher`, `process`, or `agent`.

## States

- `starting`: the router created the run record.
- `running`: the agent launch succeeded.
- `blocked`: Herdr reports that the agent is blocked. This state is not terminal.
- `completed`: the agent process exited with code `0`, or Herdr reported `done`.
- `failed`: the agent process exited with a non-zero code.
- `cancelled`: the launcher caught an interrupt or termination signal.

For Herdr, `wait` uses Herdr's agent state. It does not read pane text. It returns `blocked` or `completed`.

For hrdx, tmux, and Zellij, a shell wrapper writes `running` before it starts the agent. The wrapper writes `completed`, `failed`, or `cancelled` after the process exits. A pane becoming idle does not mean that the agent completed.

## Waiting and resuming

`wait <run-id>` blocks until it receives `blocked` or a terminal state. It prints the signal as JSON. A timeout returns exit code `124` and a record with `state: "running"` and `timedOut: true`.

If a run is blocked, resume it through its muxer or agent. Then pass the blocked signal's sequence to the next wait:

```bash
scripts/router.ts wait <run-id> --after-sequence <sequence>
```

A terminal wait removes the run record. A blocked wait keeps it for the next wait.

## Limits

The router does not parse pane output. It does not ask the child agent to run a second reporting CLI. The launcher records process exit; Herdr supplies its native agent state.

If a process is killed in a way that prevents the wrapper from writing its final signal, the router cannot confirm completion. A timed-out wait reports that it has no terminal signal. It does not infer success or emit `lost`.
