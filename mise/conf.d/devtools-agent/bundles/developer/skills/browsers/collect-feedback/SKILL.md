---
schema: collect-feedback/v1
name: collect-feedback
description: Imports a sealed evidence run and opens a local read-only viewer. Use to inspect original screenshots, case results and capture provenance in a persistent feedback session. Produces validated immutable media copies and a loopback viewer URL; annotation editing and export are not supported.
user-invocable: true
---
# collect-feedback

Browse a sealed `collect-evidence/v1` run. Keep source identities, capture times and image bytes unchanged. This skill supports the read-only viewer only.

## Procedure

1. Select an explicit sealed evidence run. If new evidence is needed, use `collect-evidence` and its selected driver playbook first. This viewer has no capture driver.
2. Resolve the installed directory containing this `SKILL.md` as `FEEDBACK_SKILL_ROOT`. All script and viewer paths are relative to that directory, not the repository. Invoke the absolute `scripts/collect-feedback.ts` path from any directory. Complete first-run Bun dependency downloads before serving.
3. Read [the record and service contract](references/viewer-contract.md). Run `validate <sealed-run>` through the installed `collect-evidence/scripts/collect-evidence.ts` command. Do not import unsupported schemas or alter earlier evidence.
4. Run `init <sealed-run> --repository <repository-in-scope> --workflow <workflow-id> --session <new-session-id> --json`. The CLI resolves the existing shared-context evidence route. Keep its returned `destination.path`. `COLLECT_FEEDBACK_REPOSITORY` supplies the repository default; the flag takes precedence.
5. Run `validate <destination.path> --json`. It validates the copied sealed run, feedback records and registered media. If validation fails, stop. Correct the source and import a new session identity.
6. Run `serve <destination.path> --port <explicit-port> --json`. Open the exact returned `http://127.0.0.1:<port>` URL. The direct `scripts/collect-feedback/serve.ts <session> --port <port>` entrypoint uses the same command and server.
7. Select a case, then an asset. Inspect the actual image, capture time, SHA-256, dimensions and recorded results. Arrow keys move through case and asset lists. Narrow screens retain horizontal columns.
8. Send SIGINT or SIGTERM to the server this operation created. Confirm that it releases its port and `.writer.lock`. Keep all session data. Never close a user's browser or unrelated process.

## Commands

| Command | Result |
|---|---|
| `init <sealed-run> --repository <repo> --workflow <id> --session <id>` | Create a new session through the existing evidence route. Never replace a session. |
| `validate <session>` | Check supported schemas, source snapshot, case references and immutable asset hashes. |
| `serve <session> --port <port>` | Start the bundled read-only loopback viewer. Never choose a fallback port. |

Use `--help`, `--version`, `--json`, `--plain`, `--quiet`, `--no-color` and `--no-input`. Output is uncoloured and commands never prompt. JSON results use `collect-feedback/v1` with `kind` and `success`; diagnostics go to stderr. `--dry-run` validates without writes or server startup. Exit codes: 0 completed, 1 operation failure, 2 invalid input or schema, 3 blocked store resolution or unavailable writer lock.

## Safety and limits

- **Keep serving local.** The service binds only to `127.0.0.1`, checks Host and Origin, rejects cross-site requests and accepts GET only. Do not use a public proxy or remote host.
- **Keep originals unchanged.** Imports preserve a sealed source snapshot and separate read-only case media copies. Unknown capture times stay unknown. Import time never replaces capture time.
- **Respect ownership.** A second writer fails. If a crash leaves `.writer.lock`, establish that its process has stopped before an operator removes that exact lock. The CLI never steals locks.
- **Keep publication separate.** Do not run remote Git commands, commit, push, publish evidence or enter credentials during import or serving. Local serving does not approve sharing.
- **Avoid unsupported controls.** Annotation creation, saving, editing, draft recovery, export and historical-evidence labelling belong to later tickets. No write token or fake write handler exists in this read-only service. Native video playback can display already registered WebM assets, but this slice does not verify new recording or timestamped comments.

## Completion

Report the session path, selected source run, viewer URL, observed image and cleanup. Keep test results separate from visual proof. Use [the human guide](how-to-browse-evidence.md) for manual invocation.

