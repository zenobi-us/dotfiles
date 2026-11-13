# PR draft: jira-tracker-mirror-03-snapshot-from-mirror

## Ticket

[Show Jira epics, tickets, and blockers in the Tracker pane](../../../../tracker/tickets/jira-tracker-mirror-03-snapshot-from-mirror.md). Parent initiative: `jira-tracker-mirror`.

## Problem

The Jira snapshot loaded one ticket at a time through the `cli` `get-issue` adapter. With no scope it failed with "Jira backend loads one ticket at a time". The Tracker pane could not show Jira epics or a blocker graph.

## Implementation

- `jiraSnapshot` reads the `tracker-mirror/v1` files under `mirror.root`. It needs no scope.
- Epics become initiatives. `parent` gives membership. `blocked_by` gives edges.
- `validateRelations`, "Ungrouped" and `scopedSnapshot` run as for local Markdown. Epics count as assigned.
- A blocker that is not in the mirror is a warning, not an error, for scoped and unscoped loads. The ticket keeps the blocker, so `recoveryDecision` still reports it as blocked. The warning goes to the `diagnostics` sink of `loadExplorerSnapshot`: "Blocker not in the mirror: `<KEY>`. ...". A scoped load reports only warnings for tickets in scope. Cycle detection still runs on mirrored edges.
- Clear errors: unknown schema, id and file name mismatch, wrong `ref`, missing `status_category`, unknown `mirror_status`, parent cycle, blocker cycle, missing mirror block, missing or empty mirror (run `jira-mirror.ts sync`).
- `mirror_status: stale` sets `fields.stale: true`. The Herdr-app tree shows a `stale` badge.
- Epics list under "Planning" in the tree.
- `loadCoordination` no longer falls back to a scoped Jira load. The mirror gives a complete cross-initiative inventory. Each unmirrored blocker is a diagnostic, so the report says `inventoryComplete: false` until a sync with closure mirrors it.

## Changed files

- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/model.ts`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/tree.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`
- `mise/conf.d/devtools-herdrapp/app/tests/tree.test.ts`

## Validation

| Command | Result |
| --- | --- |
| `bun test` in worktree skill | 104 pass, 0 fail (includes `coordination.test.ts`) |
| `bun test` in `pi-shared-context` | 152 pass |
| `bun test tests` in Herdr-app | 41 pass on 2 of 3 runs. One run failed `panel-state.test.ts` with `ERR_VM_MODULE_LINK_FAILURE`; that file is not changed by this ticket. |
| typecheck `bundles/developer` | 7 errors, all in `skills/browsers/` (`tui-plan.ts`, `collect-feedback` test), not from this ticket |
| typecheck `bundles/agent-core` | pass |
| Live `inspect.ts RWR-10411 --json` in reckonone | pass: returns the epic RWR-10411 |
| Live unscoped snapshot in reckonone | pass: 219 tickets, 39 warnings, 39 unique unmirrored blockers |

## Review history

- [review-0005](../../events/review-0005.yaml): FAILURE ([artifact](../reviews/review-review-0005.md)).
- [review-0009](../../events/review-0009.yaml): FAILURE, F1 and F2 ([artifact](../reviews/review-review-0009.md)). Fixed in fix-0012.

## Merge status

Not merged. Rebased onto `master` `767bdf8b`. Source commit `83add9860a00038b6af663c3d9c27272f3152b7c`.

## Receipts

- [start-0001](../../events/start-0001.yaml)
- [implementation-0002](../../events/implementation-0002.yaml)
- [review-0009](../../events/review-0009.yaml)
- [fix-start-0011](../../events/fix-start-0011.yaml)
- [fix-0012](../../events/fix-0012.yaml)

## Findings

- Resolved findings: F1, F2 (review-0009), N1.
- Remaining findings: none blocking. N2, N3, N4 not fixed.
- Latest reviewer verdict: FAILURE (review-0009). A fresh review is due.
