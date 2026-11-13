# PR draft: jira-tracker-mirror-03-snapshot-from-mirror

## Ticket

[Show Jira epics, tickets, and blockers in the Tracker pane](../../../../tracker/tickets/jira-tracker-mirror-03-snapshot-from-mirror.md). Parent initiative: `jira-tracker-mirror`.

## Problem

The Jira snapshot loaded one ticket at a time through the `cli` `get-issue` adapter. With no scope it failed with "Jira backend loads one ticket at a time". The Tracker pane could not show Jira epics or a blocker graph.

## Implementation

- `jiraSnapshot` reads the `tracker-mirror/v1` files under `mirror.root`. It needs no scope.
- Epics become initiatives. `parent` gives membership. `blocked_by` gives edges.
- `validateRelations`, "Ungrouped" and `scopedSnapshot` run as for local Markdown. Epics count as assigned.
- Clear errors: unknown schema, id and file name mismatch, wrong `ref`, parent cycle, blocker outside the mirror, missing mirror block, missing or empty mirror (run `jira-mirror.ts sync`).
- `stale: true` is kept in ticket fields. The Herdr-app tree shows a `stale` badge.
- Epics list under "Planning" in the tree.

## Changed files

- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/model.ts`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/tree.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`
- `mise/conf.d/devtools-herdrapp/app/tests/tree.test.ts`

## Validation

| Command | Result |
| --- | --- |
| `bun test` in worktree scripts | 63 pass |
| `bun test` in `pi-shared-context` | 152 pass |
| `bun test tests` in Herdr-app | 38 pass |
| typecheck `bundles/developer` | known `tui-plan.ts(25,17)` error only |
| typecheck `bundles/agent-core` | `muxer-subagents/scripts/router.ts(154,9)` error only, not from this ticket |
| typecheck `bundles/matt-pocock` | pass |
| `records.ts check` | pass |
| Live reckonone snapshot | fails: `RWR-12833` is blocked by `POR-6673`, not mirrored (closure is ticket 04) |

## Review history

None yet.

## Merge status

Not merged. Source commit `498bed919039bcaf27df3e98be67e58f0ac530d4`.

## Receipts

- [start-0001](../../events/start-0001.yaml)
- [implementation-0002](../../events/implementation-0002.yaml)
