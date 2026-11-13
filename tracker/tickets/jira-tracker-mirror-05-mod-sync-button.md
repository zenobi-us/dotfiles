---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-05-mod-sync-button"
title: "Start a Jira sync from the Herdr-app Tracker pane"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
parent: "jira-tracker-mirror"
sequence: 5
blocked_by: ["jira-tracker-mirror-03-snapshot-from-mirror"]
---

## What to build

Let the user start a mirror sync from the shared-context mod, and show how old the mirror is.

## Acceptance criteria

- [ ] The mod request handler accepts a `sync` operation for a Jira tracker. It refuses the operation for other backends.
- [ ] The Tracker header shows a Sync button only for a Jira tracker.
- [ ] The header shows the age of the newest `synced_at`.
- [ ] During a sync, the button shows progress and cannot start a second sync.
- [ ] After a sync, the pane reloads the snapshot.
- [ ] A sync error shows the `twg` error text in the pane.
- [ ] The header shows the snapshot warnings, for example "39 blockers are not in the mirror; run a sync with closure". The mod passes a `diagnostics` output to `loadExplorerSnapshot` without changing how local Markdown trackers load. Moved from ticket 03 on 2026-11-13.
- [ ] The change is verified in the running Herdr-app window.

## Comments

- 2026-11-13T03:05Z, S: Q moved the header warning display here from `jira-tracker-mirror-03-snapshot-from-mirror`. Ticket 03 reports the warnings through the `diagnostics` output of `loadExplorerSnapshot`; this ticket shows them. A `diagnostics` output also puts local Markdown loads into partial-inventory mode, so the wiring must keep local Markdown behaviour.
