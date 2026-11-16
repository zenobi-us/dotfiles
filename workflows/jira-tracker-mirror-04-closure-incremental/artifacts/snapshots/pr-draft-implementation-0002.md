# PR draft: Add epic children, outside blockers, and incremental sync

- **Ticket:** [jira-tracker-mirror-04-closure-incremental](../../../../tracker/tickets/jira-tracker-mirror-04-closure-incremental.md)
- **Initiative:** [jira-tracker-mirror](../../../../tracker/initiatives/jira-tracker-mirror/index.md)
- **Receipt:** [implementation-0002](../../events/implementation-0002.yaml), parent [start-0001](../../events/start-0001.yaml)
- **Source:** `feat/jira-tracker-mirror-04-closure-incremental` at `17ae33962bb15eb7aead9c0cc08986a7b5ba2983`, tree `ac0e81e19b6f2d44f294c33cee14ab472797519e`

## Problem

The mirror held only the issues that the configured queries return. Epic children and blockers outside the queries were missing, so the blocker graph was incomplete. Each sync also ran every query in full.

## Implementation

`jira-mirror.ts sync` now has three modes and an optional closure.

- **Closure.** `mirror.closure: [children, blockers]` in the tracker definition. `children` fetches the children of each mirrored epic with `parent in (...)`. `blockers` fetches each blocker that is not mirrored with `key in (...)`. The closure repeats until a round finds no new epic and no new blocker. Batches hold 100 keys. The closure makes no call for one ticket.
- **Incremental (default).** Each query gets `AND updated >= "<time>"`. `<time>` is one day before the newest `jira_updated` in the mirror, in the offset of that timestamp. The margin covers the unknown time zone that Jira uses for JQL. A query that no mirror file lists runs in full. The closure applies the filter only to keys that are already mirrored. Earlier query names stay on each file.
- **`--full`.** Runs every query and the closure without the filter, starting from the query results only. Each mirrored key that nothing returns gets `mirror_status: "stale"`. No file is deleted. A stale key that returns loses the mark.
- **`--key <KEY>`.** Syncs one issue with `jira workitem get`. It keeps the query names and runs no closure.
- `withUpdatedSince` keeps a trailing `ORDER BY` at the end of the JQL.
- `references/stores/jira.md` describes `closure` and the three modes.

## Changed files

- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/jira.md`

Commits: `a606b850` (feat), `17ae3396` (docs).

## Validation

| Command | cwd | Exit | Result |
| --- | --- | --- | --- |
| `bun test skills/reading-and-writing-tickets/scripts` | `bundles/matt-pocock` | 0 | 75 pass, 0 fail |
| `bun run typecheck` | `bundles/matt-pocock` | 0 | Base checkout `node_modules` linked for the run, then removed |
| `mise exec -- bun test` | `bundles/developer/skills/git/worktree` | 0 | 105 pass, 0 fail |
| `jira-mirror.ts sync --full` (live) | `reckonone-monorepo` | 0 | 10,199 issues; closure added 9,348 children and 140 blockers; commit `72fb5776` |
| `jira-mirror.ts sync` (live, incremental) | `reckonone-monorepo` | 0 | `since` 2026-11-12 18:35; 78 issues; nothing written; no commit |
| `loadExplorerSnapshot` with diagnostics (live) | `reckonone-monorepo` | 0 | 235 epics, 219 with tickets, 1,812 blocker edges, 27 cycle diagnostics, 0 unmirrored blockers |
| `loadExplorerSnapshot` strict (live) | `reckonone-monorepo` | 1 | `Cycle in ticket blocker graph at RM-2183` |

New unit tests cover a blocker chain outside the queries, an epic with no children, an outside blocker that is an epic, the incremental filter, `--full` stale marking and recovery, `--key`, flag conflicts, and `ORDER BY`. Two mutations (stale marking off, time filter off) each failed one test.

Live artifacts:

- [live-sync-full-implementation-0002.json](live-sync-full-implementation-0002.json)
- [live-sync-incremental-implementation-0002.json](live-sync-incremental-implementation-0002.json)
- [snapshot-summary-implementation-0002.json](snapshot-summary-implementation-0002.json)
- [snapshot-strict-implementation-0002.log](snapshot-strict-implementation-0002.log)

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| Children closure with `parent in (...)` | Done, unit and live |
| Blocker closure with `key in (...)`, repeated | Done, unit and live (0 unmirrored blockers remain) |
| No per-ticket call | Done; tests assert every closure call is `workitem query` |
| Incremental `updated >=` | Done, unit and live |
| `--full` stale marking, no delete | Done, unit; live full run marked 0 stale |
| `--key <KEY>` | Done, unit |
| Unit tests for chain, empty epic, stale key | Done |
| `collect-evidence` Tracker pane capture | **Blocked** |

### Blocked: Tracker pane capture

1. The `collect-evidence` `gui` driver captures Linux X11 windows only. The Herdr-app window is not on the WSL X11 display `:0`; that display holds only Weston windows. No Herdr-app GUI process runs in WSL. The window runs on the Windows host, which the driver does not support.
2. The pane would show an error, not a graph. The Herdr-app mod calls `loadExplorerSnapshot(context, exec)` without a diagnostics sink (`devtools-herdrapp/app/mods/shared-context/data.ts:103`, `:145`, `:159`). On the live mirror, that strict form throws `Cycle in ticket blocker graph at RM-2183`. The live Jira data holds blocker cycles that the closure now brings into the mirror.

## Side effects in the reckonone shared context

Q approved these steps.

- `docs/agents/issue-tracker.md` has a new line, `closure: [children, blockers]`. It is not committed.
- Commit `72fb5776` in `/home/zenobius/Projects/zeno` adds 9,494 mirror files. It is not pushed. The repository `pre-commit` hook also staged `context.json` into that commit; the ticket 02 sync commits `013999fc` and `9eb5476` show the same hook behaviour.

## Review history

None yet.

## Remaining findings

- The strict snapshot load fails on blocker cycles in live Jira data. This needs a decision in the snapshot or mod scope (tickets 03 and 05), not in this ticket.
- An incremental sync cannot see an issue that left a query or an epic without a change to the issue. `--full` marks it stale.

## Merge status

Not merged. Waiting for review.
