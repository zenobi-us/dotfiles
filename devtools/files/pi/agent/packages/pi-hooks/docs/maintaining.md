# Maintaining pi-hooks

> Maintainers only. Skip this file if you are using `pi-hooks` rather than releasing it.

This guide covers the SDK compatibility matrix, the runtime PI smoke checklist, and the evidence template you keep with release notes or SDK-widening PRs.

## SDK compatibility matrix

Pi host packages are declared as `peerDependencies` with `*` per Pi package guidance and as dev dependencies for local typechecking. Keep the documented Pi 0.79 compatibility target and legacy SDK floor honest by running the compatibility matrix before merging SDK-sensitive changes:

```bash
npm run compat:sdk-matrix
```

This command is safe for normal development state. It copies the repository to a temporary directory, installs the matching `@earendil-works/pi-coding-agent` and `@earendil-works/pi-tui` pair for each SDK spec, then runs the normal verification commands in the temporary copy:

1. `npm run typecheck`
2. `npm run test:internal`

`npm test` is a consumer-facing no-op in this repo; the matrix intentionally runs the internal suite so tool-event, lifecycle, UI-action, and runtime behavior are exercised for each SDK pair.

The default matrix covers:

- `0.74.0`: legacy SDK floor retained while compatibility tests pass
- `0.79.3`: current Pi 0.79 SDK/runtime line

Use `npm run compat:sdk-matrix:dry-run` to print the exact workflow without installing temporary dependencies.

Future SDK lines (`0.80.x` and later) can be probed via `npm run compat:sdk-matrix:future` as an advisory gate. Passing that command alone does not change compatibility claims.

## Runtime PI smoke checklist

Run this checklist before widening PI SDK support or merging changes that touch session lifecycle, slash commands, UI actions, prompt injection, or tool-event routing. Unit tests cover the adapter contracts, but these checks use a real PI process for behavior the SDK does not expose cleanly in tests.

### Prepare the smoke project

From the `pi-hooks` checkout:

```bash
scripts/smoke/pi-runtime-smoke.sh
```

The script creates a temporary project, copies [`scripts/smoke/pi-runtime-smoke-hooks.yaml`](../scripts/smoke/pi-runtime-smoke-hooks.yaml) to `.pi/hook/hooks.yaml`, parses the valid and intentionally invalid smoke fixtures, and writes `.pi/hooks-smoke/evidence.md` for release notes.

Start PI with the command printed by the script. It uses:

- `PI_YAML_HOOKS_TRUST_PROJECT=1` so project hooks load without editing trust files
- `PI_YAML_HOOKS_DEBUG=1` and `PI_YAML_HOOKS_LOG_FILE=<smoke-project>/.pi/hooks-smoke/pi-hooks.ndjson` for persistent evidence
- `PI_YAML_HOOKS_ENABLE_USER_BASH=1` so human `!` / `!!` shell commands are routed through `tool.before.bash`
- `pi -e <checkout>/extensions/index.ts` so the local checkout is tested

### Run the checks

| Area | Action | Expected observation | Evidence to keep |
|---|---|---|---|
| Startup and `session.created` | Start PI in the smoke project. | Startup prints a `[pi-hooks] Loaded ...` summary. The status bar or UI status surface shows `pi-hooks smoke: session created` when available. `.pi/hooks-smoke/events.ndjson` contains `session.created`. | Startup transcript, events file, and `pi-hooks.ndjson` excerpt. |
| `/hooks-status` | Run `/hooks-status`. | Command reports active smoke hooks, project config path, trusted project state, and log path. On PI versions with custom messages, the response is structured in-session diagnostics rather than only plain text. | Command transcript or screenshot. |
| `/hooks-validate` success | Run `/hooks-validate` with the valid smoke config. | Validation succeeds and includes the active project config. | Command transcript. |
| Custom diagnostic failure path | Replace `.pi/hook/hooks.yaml` with `scripts/smoke/pi-runtime-smoke-invalid-hooks.yaml`, then run `/hooks-reload` and `/hooks-validate`. Restore the valid file afterward. | The unsupported `command:` action is rejected as a PI load error, and PI shows the validation details. Existing last-known-good hooks are not silently replaced by the invalid config. | Diagnostic message, log excerpt, and note that the valid file was restored. |
| `/hooks-reload` | Restore the valid fixture and run `/hooks-reload`, then `/hooks-status`. | Reload succeeds, active smoke hooks return, and command/autocomplete surfaces remain available. | Reload transcript. |
| `tool.before.bash` and confirm | Ask PI to run a harmless shell command, for example `echo smoke-before-bash`. | A confirmation prompt appears before the bash tool runs when the current Pi mode exposes UI (`ctx.hasUI`, including RPC UI in Pi 0.79+). Approving lets the command continue, and `events.ndjson` records `tool.before.bash`. Rejecting in a separate pass blocks the tool call. In no-UI/headless mode, confirm fails closed unless explicitly overridden for testing. | Prompt screenshot/transcript and events file. |
| `tool.after.read` and follow-up prompt | Ask PI to read `README.md`. | `events.ndjson` records `tool.after.read`. The `tool:` action sends a follow-up prompt asking PI to read `.pi/hooks-smoke/events.ndjson`; PI may ask for or perform that read in the current session. | Conversation transcript and events file. |
| `tool.after.write` and `file.changed` | Ask PI to write `.pi/hooks-smoke/write-check.txt`. | `events.ndjson` records `tool.after.write` with changed file data, then `file.changed` for the smoke path. | Events file. |
| `user_bash` opt-in | In interactive PI, run a human shell command with `! echo smoke-user-bash`. | Because `PI_YAML_HOOKS_ENABLE_USER_BASH=1` is set, the same `tool.before.bash` confirm path runs before the user command. No `tool.after.*` or `file.changed` event is expected for `user_bash`. | Prompt transcript and note that no after event was expected. |
| Idle | Let the agent finish a turn. | `.pi/hooks-smoke/events.ndjson` records `session.idle`, and status updates to `pi-hooks smoke: idle observed` when UI status is available. | Events file. |
| Session switch | Run `/new`. Optionally check `/resume` and `/fork` when available. | `/new` causes lossy `session.deleted` cleanup for the previous session and a fresh `session.created`. `/resume` and `/fork` should not double-run cleanup when PI emits both switch and shutdown lifecycle hooks. Existing-session re-entry should not re-fire `session.created`. | Events file with ordering notes. |
| `/quit` | Run `/quit`. | PI exits cleanly. If PI emits shutdown lifecycle hooks, the smoke event log may include lossy `session.deleted` cleanup for the active session. | Terminal transcript and final events file. |
| Future SDK gate | In a separate checkout or temporary matrix run, execute `npm run compat:sdk-matrix:future`, then run this same smoke procedure against the next minor (e.g. `0.80.x`) before changing compatibility docs or package metadata. | Treat failure to expose built-in tools, slash commands, custom messages, RPC/TUI UI actions, TUI autocomplete, or lifecycle hooks as a release blocker. Passing the future matrix alone is advisory and does not widen support. | Matrix output plus full smoke evidence. |

### Evidence template

Use the generated `.pi/hooks-smoke/evidence.md` as the release artifact. Fill in PI version, SDK package versions, OS, command transcripts, `events.ndjson`, and relevant `pi-hooks.ndjson` excerpts. Mark each row pass or fail. If a row is not runnable in the current PI surface, record the exact reason and whether the expected behavior remains covered by unit tests.

## Verification commands

| Command | Use |
|---|---|
| `npm run typecheck` | After any TS change |
| `npm run build` | Before running `dist/**/*.test.js` |
| `npm run test:internal` | Full dev suite (builds first); known flake: `timed out bash hooks kill descendant background processes on POSIX` |
| `npm run compat:sdk-matrix[:dry-run]` | SDK matrix check in temp clone; runs typecheck + internal tests |
| `npm run compat:sdk-matrix:future` | Advisory next-minor probe; does not change compatibility claims |
| `scripts/smoke/pi-runtime-smoke.sh` | Runtime smoke; keep evidence on SDK-widening PRs |

`npm test` is a consumer no-op; use `test:internal` for validation.
