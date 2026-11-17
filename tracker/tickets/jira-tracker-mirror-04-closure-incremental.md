---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-04-closure-incremental"
title: "Add epic children, outside blockers, and incremental sync"
type: "enhancement"
triage: "ready-for-agent"
work_status: "claimed"
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
- [ ] With `closure: [parents]`, the sync fetches the parent of each mirrored ticket in batches with `key in (...)`. It keeps only parents that are not done (`statusCategory != Done`). The children closure then runs on those epics.
- [ ] The reckonone tracker definition mirrors only open epics that hold a ticket assigned to Q. Its query is `project = RWR AND assignee = currentUser() AND parent is not EMPTY`, with `closure: [parents, children, blockers]`. The old `payroll-epics` and `payroll-open-issues` queries are removed.
- [ ] One `--full` sync with the new definition marks every file outside the new scope as stale. One commit in the reckonone shared context then deletes every stale file. No other file is deleted.
- [ ] The Herdr-app Tracker pane shows a blocker loop as a warning and still draws the graph. A loop no longer stops the snapshot load.
- [ ] `herdr-app shot` captures the Tracker pane for reckonone with epics, a blocker graph, and any loop warning. Moved from ticket 03 on 2026-11-13.

## Comments

- 2026-11-13T02:40Z, S: Q moved the Tracker pane capture criterion here from `jira-tracker-mirror-03-snapshot-from-mirror`. A real blocker graph needs the children and blocker closure that this ticket adds.
- 2026-11-16, S: Q decided after the first live sync. That sync mirrored 10199 issues, mostly children of closed epics, in commit `72fb5776` of the zeno shared-context repo, which is already pushed. Live Jira also has 27 blocker loops, for example RM-2183 and RWR-5450.
  1. Mirror only open epics that hold a ticket assigned to Q. This Jira site has no JQL function for the parents of a ticket set (`issueFunction in parentsOf` and `parentIssuesOf` return nothing), so the sync gets a `parents` closure.
  2. Remove the extra files: run one `--full` sync with the new definition, then delete the stale files in one new commit.
  3. Show blocker loops as warnings in the Tracker pane. This ticket now includes that Herdr-app mod change.
  4. Capture the pane with `herdr-app shot`, not `collect-evidence`. `collect-evidence` captures only Linux X11 windows, and the app runs on Windows.
  5. Run `--full` on a schedule. Ticket `jira-tracker-mirror-07-scheduled-full-sync` holds that work.
- 2026-11-16, S: A separate session changed the worktree skill inspector so that a scoped load checks loops only in the requested ticket's blocker chain. Those changes are uncommitted on `master` and have no ticket. They do not touch this ticket's files.
- 2026-11-16, S: Review `review-0005`: FAILURE for source commit `17ae33962bb15eb7aead9c0cc08986a7b5ba2983`. Artifact: `workflows/jira-tracker-mirror-04-closure-incremental/artifacts/reviews/review-review-0005.md`.
- 2026-11-17T05:39Z, S: Review `review-0011`: FAILURE for source commit `0b4ede0451accb74759e7b974f44500813a4f08d`. Artifact: `workflows/jira-tracker-mirror-04-closure-incremental/artifacts/reviews/review-review-0011.md`.
