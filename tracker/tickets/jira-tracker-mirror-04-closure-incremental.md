---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-04-closure-incremental"
title: "Add epic children, outside blockers, and incremental sync"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
parent: "jira-tracker-mirror"
sequence: 4
blocked_by: ["jira-tracker-mirror-02-sync-query"]
---

## What to build

Extend the sync so that the mirror holds a complete graph and later syncs stay fast.

## Acceptance criteria

- [ ] With `closure: [children]`, the sync fetches the children of each mirrored epic in batches with `parent in (...)`.
- [ ] With `closure: [blockers]`, the sync fetches each blocker that is not mirrored, in batches with `key in (...)`. It repeats until no new blocker appears.
- [ ] The sync makes no per-ticket call.
- [ ] An incremental sync adds `updated >=` the last sync time to each query.
- [ ] `--full` runs every query without the time filter. It marks each key that no query or closure returns with `mirror_status: stale`. It deletes no file.
- [ ] `--key <KEY>` syncs one issue, for use after a write through `twg`.
- [ ] Unit tests cover a blocker chain outside the queries, an epic with no children, and a stale key.

## Comments
