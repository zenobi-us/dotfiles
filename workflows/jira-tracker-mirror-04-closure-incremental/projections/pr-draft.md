# PR draft: Add parents, epic children, outside blockers, and incremental sync

- **Ticket:** [jira-tracker-mirror-04-closure-incremental](../../../tracker/tickets/jira-tracker-mirror-04-closure-incremental.md)
- **Initiative:** [jira-tracker-mirror](../../../tracker/initiatives/jira-tracker-mirror/index.md)
- **Receipt:** [fix-0008](../events/fix-0008.yaml), parent [fix-start-0007](../events/fix-start-0007.yaml)
- **Source:** `feat/jira-tracker-mirror-04-closure-incremental` at `f140779ab071df0efc40c314431eb901d71ed20a`, tree `9c2d44f3eecda84b65e146f73c893710d5ec9eaf`

## Problem

The mirror held only the issues that the configured queries return. Epic children and blockers outside the queries were missing, so the blocker graph was incomplete. Each sync also ran every query in full.

## Implementation

`jira-mirror.ts sync` now has three modes and an optional closure.

- **Closure.** `mirror.closure: [parents, children, blockers]` in the tracker definition. `parents` fetches the parent of each mirrored issue with `key in (...) AND statusCategory != Done`, so a done parent is not mirrored; the children closure then runs on those epics. `children` fetches the children of each mirrored epic with `parent in (...)`. `blockers` fetches each blocker that is not mirrored with `key in (...)`. The closure repeats until a round finds no new parent, epic, or blocker. Batches hold 100 keys. The closure makes no call for one ticket.
- **Incremental (default).** Each query gets `AND updated >= "<time>"`. `<time>` is one day before the newest `jira_updated` in the mirror, in the offset of that timestamp. The margin covers the unknown time zone that Jira uses for JQL. A query that no mirror file lists runs in full. The closure applies the filter only to keys that are already mirrored. Earlier query names stay on each file.
- **`--full`.** Runs every query and the closure without the filter, starting from the query results only. Each mirrored key that nothing returns gets `mirror_status: "stale"`. No file is deleted. A stale key that returns loses the mark.
- **`--key <KEY>`.** Syncs one issue with `jira workitem get`. It keeps the query names and runs no closure.
- `withUpdatedSince` keeps a trailing `ORDER BY` at the end of the JQL.
- `references/stores/jira.md` describes `closure` and the three modes. It and the help text say to run `--full` once after a change to `mirror.closure` (review note N2).
- The tracker commit counts changed files with `git diff --cached --shortstat`. A name list of 12,000 mirror paths exceeded the 1 MB `execFileSync` buffer.
- **Herdr-app Tracker pane.** `data.ts` loads the snapshot with a diagnostics sink in `tracker`, `detail`, and `prepare`. `tracker` returns `warnings`. `main.js` shows a warning summary above the tree. `graph.js` leaves out the edge that closes a blocker loop, draws every ticket, and returns the loop as a warning; `graph-view.js` shows it above the graph.

## Changed files

- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/jira.md`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.ts`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/graph.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/graph-view.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/ui.js`
- `mise/conf.d/devtools-herdrapp/app/tests/panel-state.fixture.mjs`
- `mise/conf.d/devtools-herdrapp/app/tests/request.test.ts`
- `mise/conf.d/devtools-herdrapp/app/tests/tree.test.ts`

Commits: `a606b850` (feat), `17ae3396` (docs), `e3b29197` (parents closure), `5fe717c6` (loop warnings), `f140779a` (commit count fix).

## Validation

Fix run fix-0008, at `f140779a`:

| Command | cwd | Exit | Result |
| --- | --- | --- | --- |
| `bun test skills/reading-and-writing-tickets/scripts` | `bundles/matt-pocock` | 0 | 77 pass, 0 fail |
| `bun run typecheck` | `bundles/matt-pocock` | 0 | Base checkout `node_modules` linked for the run, then removed |
| `mise exec -- bun test tests` | `devtools-herdrapp/app` | 0 | 45 pass, 0 fail. `panel-state.test.ts` is flaky at `17ae3396` too |
| `bun test` | `bundles/developer/skills/git/worktree` | 0 | 105 pass, 0 fail |
| `jira-mirror.ts sync --full` (live, new definition) | `reckonone-monorepo` | 0 | 3,798 issues; parents 21, children 3,049, blockers 179; 8,779 stale; commit `18c1eece` |
| `request.ts` `tracker` (live, fixed mod) | `reckonone-monorepo` | 0 | 3,798 tickets, 20 epics, 30 loop warnings; 848 s |

Implementation run implementation-0002, at `17ae3396`:

| Command | cwd | Exit | Result |
| --- | --- | --- | --- |
| `bun test skills/reading-and-writing-tickets/scripts` | `bundles/matt-pocock` | 0 | 75 pass, 0 fail |
| `jira-mirror.ts sync --full` (live, old definition) | `reckonone-monorepo` | 0 | 10,199 issues; commit `72fb5776` |
| `loadExplorerSnapshot` strict (live) | `reckonone-monorepo` | 1 | `Cycle in ticket blocker graph at RM-2183` |

New unit tests cover a blocker chain outside the queries, an epic with no children, an outside blocker that is an epic, the incremental filter, `--full` stale marking and recovery, `--key`, flag conflicts, and `ORDER BY`. Two mutations (stale marking off, time filter off) each failed one test.

Live artifacts:

- [live-sync-full-implementation-0002.json](../artifacts/snapshots/live-sync-full-implementation-0002.json)
- [live-sync-incremental-implementation-0002.json](../artifacts/snapshots/live-sync-incremental-implementation-0002.json)
- [snapshot-summary-implementation-0002.json](../artifacts/snapshots/snapshot-summary-implementation-0002.json)
- [snapshot-strict-implementation-0002.log](../artifacts/snapshots/snapshot-strict-implementation-0002.log)

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| Children closure with `parent in (...)` | Done |
| Blocker closure with `key in (...)`, repeated | Done |
| No per-ticket call | Done |
| Incremental `updated >=` | Done |
| `--full` stale marking, no delete | Done |
| `--key <KEY>` | Done |
| Unit tests for chain, empty epic, stale key | Done |
| `closure: [parents]` (F1) | Done, `e3b29197` |
| reckonone definition (F2) | Done, zeno `1248308d` |
| `--full` and stale delete commit (F3) | Done, zeno `18c1eece` and `5909f930` |
| Blocker loop as a warning (F4) | Done, `5fe717c6` |
| `herdr-app shot` of the Tracker pane (F5) | **Blocked** |

### Blocked: Tracker pane capture (F5)

With the fixed mod linked into the live app (Q approved; links restored after), the reckonone Tracker request takes 848 s. The mod client stops a request after 600 s (`client.js`, `timeout: 600000`). The pane shows only "Read tracker records and workflow state…". The backend result has the epics and the loop warnings, so the pane code is not the blocker; the load time is. See [evidence fix-0008](../artifacts/evidence/fix-0008/README.md).

## Side effects in the reckonone shared context

Commits in `/home/zenobius/Projects/zeno`. None is pushed. The `pre-commit` hook added `context.json` to each.

- `1248308d`: the definition holds one query, `my-issues`, and `closure: [parents, children, blockers]`.
- `18c1eece`: full sync, 11,980 mirror files.
- `5909f930`: deletes the 8,779 files with `mirror_status: stale`.
- Earlier: `72fb5776` (implementation-0002), pushed with `94ff836d`.

## Review history

- [review-0005](../artifacts/reviews/review-review-0005.md): FAILURE for `17ae3396`. Criteria 1-7 met. Criteria added on 2026-11-16 are not met.

## Latest reviewer verdict

FAILURE (review-0005). Fix fix-0008 is not reviewed.

## Remaining findings

- F5: no capture shows the Tracker tree for reckonone, because the request takes longer than the client timeout.
- Non-blocking: N1, N3, N4, N5 in the review artifact.

## Merge status

Not merged. Waiting for a decision on F5 and a new review.

## Supporting records

- [start-0001](../events/start-0001.yaml)
- [implementation-0002](../events/implementation-0002.yaml)
- [pr-draft-implementation-0002](../artifacts/snapshots/pr-draft-implementation-0002.md)
- [start-complete-0003](../events/start-complete-0003.yaml)
- [review-start-0004](../events/review-start-0004.yaml)
- [review-0005](../events/review-0005.yaml)
- [review-complete-0006](../events/review-complete-0006.yaml)
- [review-review-0005](../artifacts/reviews/review-review-0005.md)
- [fix-start-0007](../events/fix-start-0007.yaml)
- [fix-0008](../events/fix-0008.yaml)
- [pr-draft-fix-0008](../artifacts/snapshots/pr-draft-fix-0008.md)
- [evidence fix-0008](../artifacts/evidence/fix-0008/README.md)
