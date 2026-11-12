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
- [ ] The change is verified in the running Herdr-app window.

## Comments
