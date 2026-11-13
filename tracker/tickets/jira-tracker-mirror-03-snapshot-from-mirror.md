---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-03-snapshot-from-mirror"
title: "Show Jira epics, tickets, and blockers in the Tracker pane"
type: "enhancement"
triage: "ready-for-agent"
work_status: "claimed"
parent: "jira-tracker-mirror"
sequence: 3
blocked_by: ["jira-tracker-mirror-02-sync-query"]
---

## What to build

The tracker snapshot for a Jira backend reads the mirror files. It does not need a ticket scope. The Herdr-app Tracker pane then shows epics, their tickets, and the blocker graph, as it does for local Markdown.

## Acceptance criteria

- [ ] With no scope, the Jira snapshot loads every mirror file. The error "Jira backend loads one ticket at a time" no longer appears.
- [ ] Each Epic becomes an initiative. Its members are the issues whose `parent` is the epic key.
- [ ] `blocked_by` gives the ticket edges. Cycle and unknown-blocker validation work as for local Markdown.
- [ ] Issues without a mirrored epic appear under "Ungrouped".
- [ ] Stale mirror records are marked as stale in the pane.
- [ ] A missing or empty mirror shows a clear message that tells the user to run a sync.
- [ ] Unit tests use a mirror directory fixture.
- Moved to `jira-tracker-mirror-04-closure-incremental` on 2026-11-13: `collect-evidence` captures the Tracker pane for reckonone with epics and a blocker graph.

## Comments

- 2026-11-13T02:40Z, S: Review verdict **FAILURE** for commit `498bed919039bcaf27df3e98be67e58f0ac530d4` (F1 stale field, F2 unmirrored blocker breaks scoped loads, F3 no pane capture). Artifact: `workflows/jira-tracker-mirror-03-snapshot-from-mirror/artifacts/reviews/review-review-0005.md`. Q decided: an unmirrored blocker is a warning, shown in the Tracker pane header; the pane capture criterion moves to ticket 04, because the current queries mirror only epics.
