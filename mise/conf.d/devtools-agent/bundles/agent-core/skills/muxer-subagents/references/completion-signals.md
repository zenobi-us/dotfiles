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
- `blocked`: Herdr TUI or herdr-core reports that the agent is blocked. This state is not terminal.
- `completed`: the agent process exited with code `0`, or Herdr TUI/herdr-core reported `done`.
- `failed`: the agent process exited with a non-zero code.
- `cancelled`: the launcher caught an interrupt or termination signal.

For Herdr, `wait` uses Herdr's agent state. It does not read pane text. It returns `blocked` or `completed`.

For herdr-app, `wait` reads native herdr-core state through `hc wait --json`. It accepts explicit `done`, `blocked`, `error`, or a confirmed process exit. Startup idle and terminal loss without an exit code or signal do not confirm completion. Read `muxers/herdr-app.md` for message interruptions and resumption.

For hrdx, tmux, and Zellij, a shell wrapper writes `running` before it starts the agent. The wrapper writes `completed`, `failed`, or `cancelled` after the process exits. A pane becoming idle does not mean that the agent completed.

## Waiting and resuming

`wait <run-id>` blocks until it receives `blocked` or a terminal state. It prints the signal as JSON. A timeout returns exit code `124` and a record with `state: "running"` and `timedOut: true`.

If a run is blocked, resume it through its muxer or agent. Then pass the blocked signal's sequence to the next wait:

```bash
scripts/router.ts wait <run-id> --after-sequence <sequence>
```

A terminal wait removes the run record. A blocked wait keeps it for the next wait.

## Result delivery is separate

`spawn --result-schema <domain-schema>` allocates a typed result context before launch. The output includes `contextFile`, `deliveryContext`, and `resultTarget`, plus the child `runId`, optional `parentRunId`, and `operationId`. Save these values before waiting. The contracts command reports the explicit session role and identities, the assigned context, and truthful transport capabilities. No muxer provides a native structured-result channel. Artifact-reference transport requires Linux with `/proc/self/fd` available. The contracts capability reports whether this backend is available.

The child receives `RESULT_DELIVERY_CONTEXT`, `MUXER_SUBAGENT_RUN_ID`, and an explicit child role. When known, `MUXER_SUBAGENT_PARENT_RUN_ID` preserves the incoming run identity. Herdr receives the same context through tab `--env` flags; shell-launched muxers export it before starting the agent. The handoff tells the child to use the result-delivery skill through its operation CLI or shared library, not a second reporting CLI.

Default contexts and transport artifacts live under `$XDG_STATE_HOME/result-delivery/runs/<run-id>`, or `~/.local/state/result-delivery/runs/<run-id>`. Terminal muxer cleanup does not remove them. Custom `--result-target <absolute-file>` and `--result-ref <approved-reference>` must be paired. The target parent directory must already exist. `--operation-id` defaults to the child run ID.

A completed process can return a failed domain result. A published result can exist before the process completes. Neither artifact presence nor exit code zero establishes domain success. Keep the signal protocol unchanged: after completion, the parent reads and verifies the result with the saved delivery context, validates the domain result, and acknowledges the verified hash. Acknowledgement creates `<target>.ack.json`; it does not delete the result.

## Limits

The router does not parse pane output. It does not ask the child agent to run a second reporting CLI. The launcher records process exit; Herdr TUI and herdr-app supply native agent state through their separate CLIs.

If a process is killed in a way that prevents the wrapper from writing its final signal, the router cannot confirm completion. A timed-out wait reports that it has no terminal signal. It does not infer success or emit `lost`.

