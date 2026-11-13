---
schema: collect-feedback/v1
name: collect-feedback
description: Imports sealed evidence, opens a local screenshot annotation viewer and exports saved feedback with verified source identities.
user-invocable: true
---
# collect-feedback

Browse a sealed `collect-evidence/v1` run. Keep source identities, capture times and image bytes unchanged. Create point or box annotations without changing source media.

## Procedure

1. Select an explicit sealed evidence run. If new evidence is needed, use `collect-evidence` and its selected driver playbook first. This viewer has no capture driver.
2. Resolve the installed directory containing this `SKILL.md` as `FEEDBACK_SKILL_ROOT`. All script and viewer paths are relative to that directory, not the repository. Invoke the absolute `scripts/collect-feedback.ts` path from any directory. Complete first-run Bun dependency downloads before serving.
3. Read [the record and service contract](references/viewer-contract.md). Run `validate <sealed-run>` through the installed `collect-evidence/scripts/collect-evidence.ts` command. Do not import unsupported schemas or alter earlier evidence.
4. Run `init <sealed-run> --repository <repository-in-scope> --workflow <workflow-id> --session <new-session-id> --json`. The CLI resolves the existing shared-context evidence route. Keep its returned `destination.path`. `COLLECT_FEEDBACK_REPOSITORY` supplies the repository default; the flag takes precedence.
5. Run `validate <destination.path> --json`. It validates the copied sealed run, feedback records and registered media. If validation fails, stop. Correct the source and import a new session identity.
6. Run `serve <destination.path> --port <explicit-port> --json`. Open the exact returned `http://127.0.0.1:<port>` URL. The direct `scripts/collect-feedback/serve.ts <session> --port <port>` entrypoint uses the same command and server.
7. Select a case, then an image. Click for a point or drag a box. Use Point or Box for keyboard creation. Move with arrows; resize boxes with Shift plus arrows. Write a comment, select a labelled priority badge, then save with Ctrl or Meta plus Enter. Escape cancels. Saved appears only after durable acknowledgement. Zoom and scroll to inspect details. Narrow screens retain horizontal columns.
8. Run `export <session> --json` or open `GET /api/v1/export` to read saved feedback and source references. Resolve unfinished in-memory notes before leaving the page.
9. Send SIGINT or SIGTERM to the server this operation created. Confirm that it releases its port and `.writer.lock`. Keep all session data. Never close a user's browser or unrelated process.

## Commands

| Command | Result |
|---|---|
| `init <sealed-run> --repository <repo> --workflow <id> --session <id>` | Create a new session through the existing evidence route. Never replace a session. |
| `validate <session>` | Check supported schemas, source snapshot, case references and immutable asset hashes. |
| `serve <session> --port <port>` | Start the bundled loopback annotation viewer. Never choose a fallback port. |
| `export <session>` | Read saved annotations and verified source references without changing the session. |

Use `--help`, `--version`, `--json`, `--plain`, `--quiet`, `--no-color` and `--no-input`. Output is uncoloured and commands never prompt. JSON results use `collect-feedback/v1` with `kind` and `success`; diagnostics go to stderr. `--dry-run` validates without writes or server startup. Exit codes: 0 completed, 1 operation failure, 2 invalid input or schema, 3 blocked store resolution or unavailable writer lock.

## Safety and limits

- **Keep serving local.** The service binds only to `127.0.0.1`, checks Host and Origin, rejects cross-site requests and requires an in-memory token plus matching Origin for writes. Do not use a public proxy or remote host.
- **Keep originals unchanged.** Imports preserve a sealed source snapshot and separate read-only case media copies. Unknown capture times stay unknown. Import time never replaces capture time.
- **Respect ownership.** A second writer fails. If a crash leaves `.writer.lock`, establish that its process has stopped before an operator removes that exact lock. The CLI never steals locks.
- **Keep publication separate.** Do not run remote Git commands, commit, push, publish evidence or enter credentials during import or serving. Local serving does not approve sharing.
- **Keep scope explicit.** Saved notes are read-only after creation. Editing, deletion, persistent draft recovery and video comments are not supported. Failed saves retain the in-memory note and stable retry ID. Signals drain pending saves before releasing the writer lock. Native video playback does not create timestamped comments.

## Completion

Report the session path, selected source run, viewer URL, observed image and cleanup. Keep test results separate from visual proof. Use [the human guide](how-to-browse-evidence.md) for manual invocation.

