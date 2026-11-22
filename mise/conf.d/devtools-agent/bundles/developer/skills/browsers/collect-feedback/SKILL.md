---
name: collect-feedback
description: Collects approved web, TUI or GUI workflows through collect-evidence, opens local feedback, and exports saved annotations with verified source identities. Use for fresh workflow requests or explicit historical review.
user-invocable: true
---
# collect-feedback

`contracts.json` declares v2 production and v1 historical acceptance. Read the [feedback contract](references/viewer-contract.md) before interpreting stored records. Historical v1 sessions and annotations are read-only; import their sealed source under a new session identity to add notes.

Collect fresh evidence through the installed `collect-evidence` driver, or explicitly select historical evidence. Keep source identities, capture times and image bytes unchanged. Create point or box annotations without changing source media.

## Documentation

Use [howto.md](howto.md) for collection, historical review, annotations, validation, export, and shutdown.
Use the [CLI reference](references/cli.md) for commands, output, exit codes, and driver limits.
Use the [system explanation](references/system.md) for routes, record authority, immutable assets, and publication.

## One workflow request

For fresh web, TUI or GUI work, follow [the request procedure](references/request.md). Select the driver playbook from the requested surface and approved scope. Author, render and compile one collector plan. Then run `request <workspace> --repository <repo> --workflow <id> --session <new-id> --port <explicit-port> --json`. This command runs the installed collector, validates and imports its sealed result, validates the session, and serves it through the existing server. Return its actual `url`, `destination` and `records`.

For explicit earlier evidence, use the same command with `--historical` and the selected sealed run instead of a workspace. Never infer historical reuse after a fresh capture stops.

The request owns its foreground server until SIGINT or SIGTERM. Register live owned resources and verify shutdown before handoff. Local serving does not authorize publication.

## Procedure

1. For the separate import and serve commands, select an explicit sealed evidence run. For a fresh end-to-end request, use the request procedure above. This viewer has no capture driver.
2. Resolve the installed directory containing this `SKILL.md` as `FEEDBACK_SKILL_ROOT`. All script and viewer paths are relative to that directory, not the repository. Invoke the absolute `scripts/collect-feedback.ts` path from any directory. Complete first-run Bun dependency downloads before serving.
3. Read [the record and service contract](references/viewer-contract.md). Run `validate <sealed-run>` through the installed `collect-evidence/scripts/collect-evidence.ts` command. Do not import unsupported schemas or alter earlier evidence.
4. Run `init <sealed-run> --repository <repository-in-scope> --workflow <workflow-id> --session <new-session-id> --json`. The CLI resolves the existing shared-context evidence route. Keep its returned `destination.path`. `COLLECT_FEEDBACK_REPOSITORY` supplies the repository default; the flag takes precedence.
5. Run `validate <destination.path> --json`. It validates the copied sealed run, feedback records and registered media. If validation fails, stop. Correct the source and import a new session identity.
6. Run `serve <destination.path> --port <explicit-port> --json`. Open the exact returned `http://127.0.0.1:<port>` URL. The direct `scripts/collect-feedback/serve.ts <session> --port <port>` entrypoint uses the same command and server.
7. Select a case, then an image or registered WebM recording. Click for a point or drag a box. Use Point or Box for keyboard creation. Move with arrows; resize boxes with Shift plus arrows. Write a comment, select a labelled priority badge, then save with Ctrl or Meta plus Enter. Escape cancels. Saved appears only after durable acknowledgement. Select a saved pin to inspect it without creating a draft. Use Edit note to change it, Delete note to remove it, or Undo deletion to restore it, including after reload. If another editor changes it, compare the saved version with the retained draft. Choose Use saved revision for next save only when you intend to replace that version. Retry an uncertain save without changing its payload. Zoom and scroll to inspect details. Narrow screens retain horizontal columns.
8. Run `export <session> --json` or open `GET /api/v1/export` to read saved feedback and source references. Use the viewer export control for a complete review. It requires you to save or explicitly discard every unfinished draft. CLI and direct API exports contain saved server records only.
9. Send SIGINT or SIGTERM to the server this operation created. Confirm that it releases its port and `.writer.lock`. Keep all session data. Never close a user's browser or unrelated process.

## Commands

| Command | Result |
|---|---|
| `request <workspace-or-historical-run> --repository <repo> --workflow <id> --session <id> --port <port> [--historical]` | Collect or explicitly reuse, validate, import and serve. Return actual URL and saved-record paths. |
| `init <sealed-run> --repository <repo> --workflow <id> --session <id>` | Create a new session through the existing evidence route. Never replace a session. |
| `validate <session>` | Check supported schemas, source snapshot, case references and immutable asset hashes. |
| `serve <session> --port <port>` | Start the bundled loopback annotation viewer. Never choose a fallback port. |
| `export <session>` | Read saved annotations and verified source references without changing the session. |

Use `--help`, `--version`, `--json`, `--plain`, `--quiet`, `--no-color` and `--no-input`. Output is uncoloured and commands never prompt. JSON results use `collect-feedback/v2` with `kind` and `success`; diagnostics go to stderr. `--dry-run` validates without writes or server startup. Exit codes: 0 completed, 1 operation failure, 2 invalid input or schemaVersion, 3 blocked store resolution or unavailable writer lock.

## Safety and limits

- **Keep serving local.** The service binds only to `127.0.0.1`, checks Host and Origin, rejects cross-site requests and requires an in-memory token plus matching Origin for writes. Do not use a public proxy or remote host.
- **Keep originals unchanged.** Imports preserve a sealed source snapshot and separate read-only case media copies. Unknown capture times stay unknown. Import time never replaces capture time.
- **Respect ownership.** A second writer fails. If a crash leaves `.writer.lock`, establish that its process has stopped before an operator removes that exact lock. The CLI never steals locks.
- **Keep publication separate.** Do not run remote Git commands, commit, push, publish evidence or enter credentials during import or serving. Local serving does not approve sharing.
- **Keep scope explicit.** Saved notes support revision-checked editing, deletion and undo. Browser drafts recover across navigation and reload in the same tab and origin. Keep the same port. Storage failures retain memory-only drafts and show a warning. For video, pause playback before creating a note. Save or cancel the draft before seeking. Failed saves retain the draft, starting revision and stable retry payload. Signals drain pending saves before releasing the writer lock. Video notes retain their playback timestamp and displayed frame dimensions. They do not track objects or promise exact frame accuracy.

## Completion

Report the session path, selected source run, viewer URL, observed image and cleanup. Keep test results separate from visual proof. Use [the human guide](howto.md) for manual invocation.


## Historical review

For an earlier run, use `init <explicit-sealed-run> --historical` with a new session identity. Read [the historical import procedure](howto.md#reopen-a-session-or-review-earlier-evidence). The viewer and exports retain the historical label. Unknown capture dates stay unknown. Unsupported formats fail before writes. Never silently relabel an existing session or migrate earlier feedback.
