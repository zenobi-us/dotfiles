# Evidence: fix-0008

Run `fix-0008` of workflow `jira-tracker-mirror-04-closure-incremental`.

## Files

| File | Content |
| --- | --- |
| `full-sync-result.json` | JSON output of the `--full` sync with the new reckonone definition (F3). |
| `tracker-response-summary.json` | Summary of one `tracker` request through the fixed mod backend for reckonone (F4, F5). |
| `tracker-pane-loading.png` | `herdr-app shot` of the Tracker pane for reckonone with the fixed mod loaded. The pane still shows "Read tracker records and workflow state…". |

## F3: full sync and stale cleanup

- Command: `mise x -- <worktree>/…/jira-mirror.ts sync --repository /home/zenobius/Projects/reckonone-monorepo --full`, from `/home/zenobius/Projects/reckonone-monorepo`.
- Result: 3798 issues. Closure: 21 parents, 3049 children, 179 blockers. 3201 files written, 597 unchanged, 8779 marked stale.
- Sync commit in `/home/zenobius/Projects/zeno`: `18c1eece` (11980 mirror files, plus `context.json` from the pre-commit hook).
- Delete commit: `5909f930`. It deletes the 8779 files with `mirror_status: "stale"` in `18c1eece`, and nothing else from the mirror. The pre-commit hook also added `context.json`.
- The first run failed with `spawnSync git ENOBUFS` before its commit. Source fix: `f140779a`. The mirror folder was reset to HEAD, then the sync ran again.

## F4 and F5: Tracker pane

- The fixed backend returns 3798 tickets, 20 epics, 547 blocker edges, and 30 warnings (11 distinct loops). It does not fail.
- The request takes 848 s. The mod client stops a request after 600 s (`client.js`, `timeout: 600000`). So the pane cannot show the tree for reckonone, and the capture shows the loading state only.
- The capture does not meet F5: epics, a blocker graph, and a loop warning are not visible. The load time is the blocker.
