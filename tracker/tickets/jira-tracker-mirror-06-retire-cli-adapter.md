---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-06-retire-cli-adapter"
title: "Remove the Jira get-issue adapter and document the mirror"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
parent: "jira-tracker-mirror"
sequence: 6
blocked_by: ["jira-tracker-mirror-03-snapshot-from-mirror", "jira-tracker-mirror-04-closure-incremental"]
---

## What to build

The tracker snapshot reads the mirror, so the repository-local `get-issue` adapter and the `cli` key are no longer necessary. Remove them, and document the mirror for Jira trackers.

## Acceptance criteria

- [ ] No code reads the `cli` key of a Jira tracker definition.
- [ ] The reckonone tracker definition has a `mirror` block and no `cli` key. Its adapter script is removed.
- [ ] The Jira store reference of the ticket skill describes the `mirror` block, the sync command, `--full`, `--key`, and the rule to sync a key after a write.
- [ ] The scoped Jira snapshot for one ticket still works for the worktree inspector.
- [ ] A search finds no remaining reference to the removed adapter.

## Comments
