---
kind: procedure
---
# Collect feedback from one request

Use the [human guide](../howto.md) to request and review evidence through a coding agent.
Use the [CLI reference](cli.md) for flags and exit codes, or the [system explanation](system.md) for record ownership.

## Select the approved surface

Resolve the installed directory containing collect-feedback/SKILL.md as FEEDBACK_SKILL_ROOT. Its sibling collect-evidence directory is COLLECT_EVIDENCE_SKILL_ROOT. Invoke absolute script paths from any directory. Complete dependency setup separately before capture or serving.

| Requested surface | Driver and required playbook | Scope |
|---|---|---|
| Web | surf or playwright; collect-evidence/references/web.md | Approved origins, actions and confirmation step IDs. Surf requires its attended browser connection. |
| TUI | tui; collect-evidence/references/tui.md | Exact command, directory, grid and approved input steps in a private native terminal. |
| GUI | gui; collect-evidence/references/gui.md | Exact approved X11 display, window and title. Read-only capture; no automated input. |

Use the collector doctor for the selected driver. For GUI doctor, pass the exact display, window and title. If required tools, display access or browser access are missing, stop the affected request. Do not install tools, change access permissions or substitute a different capture surface. Optional video failure is a recorded limit, not image failure. Native TUI and GUI video remain unavailable.

## Prepare one authored plan

Use the installed collector init command with an external working directory, repository, workflow, new run ID and selected driver. Author only plan.ts. Record each case purpose, preconditions, procedure, expected result, source scope and limits through the existing Plan fields. Render the procedure, confirm its scope, then compile. Approval fields record permission already given; they cannot grant it.

Before Enter or another confirmation, the collector checks the current screen and approved scope. Credentials and unapproved confirmations stop collection. GUI capture sends no input. Keep all originals unchanged.

## Collect and open feedback

Run the feedback command instead of a separate collector run:

```sh
"$FEEDBACK_SKILL_ROOT/scripts/collect-feedback.ts" request /tmp/approved-workspace \
  --repository /absolute/repository --workflow workflow-id \
  --session new-feedback-id --port 8091 --json
```

The workspace repository and workflow must match these flags. The command invokes the installed collector run command, which owns capture, native cleanup, validation and sealing. The existing importer verifies the sealed source and immutable copies before creating the session. Case records retain purposes, preconditions, ordered actions, expected and observed results, errors, limits, asset hashes and source references. The existing server validates again and acquires its normal writer lock.

Use the returned url, not an assumed URL. The readiness record also returns destination.path, destination.ref and records.session, records.index and records.cases. Readiness means the server bound that explicit loopback port. A port conflict stops without a fallback. A completed import remains available through serve if binding fails.

A sealed assertion FAIL can open for review only when no case is BLOCKED. Any BLOCKED verdict takes precedence, including mixed FAIL/BLOCKED runs: return exit 3, retain the sealed diagnostic source, and do not import or serve a session. Its collection.verdicts still reports FAIL; server readiness does not change case results. A blocked collector or operation without a sealed result stops before import and returns exit 3 or 1. When a stopped capture sealed diagnostic records, a capture-stopped event reports their source reference. Retry with a new run identity. Never silently reuse that run as a fresh capture.

Use --dry-run to check the compiled workspace and route without capture, import or server startup. Historical dry-run validates the selected source and resolves its destination without writing. It does not reserve a port or prove driver availability.

## Explicit historical branch

Pass an explicitly selected sealed run and --historical to request, with a new feedback session ID. This uses the existing historical import path. The viewer and export label it historical. Original capture times and hashes stay unchanged; unknown times remain unknown. Import time is not capture time. Do not relabel an existing session or rewrite its feedback.

## Save and hand off

Open the actual returned URL. Select a case and asset, create a point or box, enter a comment and save. Check Saved only after server acknowledgement. Export through the existing export command or viewer. Return saved session and export references with the source identity and explicit limits.

Keep the foreground request process alive while feedback is needed. Preserve its resource ownership identity. Register live owned resources through the caller's muxer resource contract. On SIGINT or SIGTERM, capture finishes owned cleanup before the request stops; serving drains pending writes and releases its writer lock and port. Confirm shutdown. Keep saved data and user-owned windows, tabs and terminals.

Local collection and serving perform no remote Git operation, commit, push, credential entry or automatic publication. Sharing is a separate explicit operation with an access-boundary check.
