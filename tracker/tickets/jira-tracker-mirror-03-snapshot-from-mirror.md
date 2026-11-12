---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-03-snapshot-from-mirror"
title: "Show Jira epics, tickets, and blockers in the Tracker pane"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
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
- [ ] `collect-evidence` captures the Tracker pane for reckonone with epics and a blocker graph.

## Comments
