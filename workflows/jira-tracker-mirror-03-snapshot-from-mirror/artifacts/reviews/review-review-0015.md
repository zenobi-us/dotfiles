# Review review-0015: jira-tracker-mirror-03-snapshot-from-mirror

## Verdict

SUCCESS. No blocking findings.

- Frozen source commit: `83add9860a00038b6af663c3d9c27272f3152b7c`
- Frozen tree: `d4d6a5f81df222fbf786251629f4403617425169`
- Diff: `git diff 767bdf8b...83add986` (commits `6b83ccb2`, `f5ad7687`, `2293eb84`, `83add986`)
- Worktree was clean. HEAD and tree matched the frozen target.
- Attempt 3. Parent receipt: `review-start-0014`. This is a fresh review. It does not reuse the verdicts of `review-0005` or `review-0009`.

## Scope

- Ticket: `tracker/tickets/jira-tracker-mirror-03-snapshot-from-mirror.md`, read from the base checkout (`master` at `fa84871e`), with its comments.
- Initiative: `tracker/initiatives/jira-tracker-mirror/index.md`.
- Records: `implementation-0002.yaml`, `review-0009.yaml`, `fix-0012.yaml`, `review-review-0009.md`, `pr-draft-fix-0012.md`.
- Q decisions applied: an unmirrored blocker is a warning; the pane capture is in ticket 04; the header display of warnings is in ticket 05; the stale field is `mirror_status: stale`.
- Changed files: `workflow.ts`, `coordination.ts`, `coordination.test.ts`, `inspect.test.ts` (worktree skill); `pi-shared-context/model.ts`; Herdr-app `mods/shared-context/tree.js`, `mods/shared-context/main.js`, `tests/tree.test.ts`.
- Standards: `AGENTS.md`, `~/.claude/CLAUDE.md`.
- ADRs: `docs/adr/0001-pi-ink-cleanup-trust-boundary.md` does not apply. `NO ADR`.

### Acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| No scope loads every mirror file; old error gone | Met | `workflow.ts:568-613`; test "jira snapshot reads every mirror file without a scope" |
| Each Epic is an initiative; members by `parent` | Met | `workflow.ts:603,607-611`; direct children in `rootTicketIds`, transitive members in `ticketIds` |
| `blocked_by` gives edges; cycle and unknown-blocker validation | Met, with Q's warning rule | Cycles: `workflow.ts:49-52`, test "jira snapshot rejects blocker cycles". Unknown blocker: warning, test "warns about a blocker that is not in the mirror" |
| Issues without a mirrored epic go to "Ungrouped" | Met | `workflow.ts:74-84`; ABC-5 (parent outside mirror) and ABC-6 in Ungrouped |
| Stale mirror records are marked in the pane | Met | `workflow.ts:593-600` reads `mirror_status`; `tree.js:10`, `main.js:275,280`; `tree.test.ts` |
| Missing or empty mirror says to run a sync | Met | `workflow.ts:570,575`; test covers missing directory, empty directory, no `mirror` block |
| Unit tests use a mirror directory fixture | Met | `jiraFixture` in `inspect.test.ts` |

### Resolution of review-0009

- F1 resolved. `loadExplorerSnapshot` collects unmirrored Jira blockers (`workflow.ts:48-49`) and removes them only from the rows given to `validateRelations` (`workflow.ts:51-52`). The ticket keeps the key on `blockedBy`, so `recoveryDecision` returns `blocked` (test asserts "Unresolved prerequisites: ABC-404."). Cycle detection still runs in strict and `diagnostics` modes. Warnings go to the `diagnostics` sink, filtered to tickets in the scoped result (`workflow.ts:86-90`). `scopedSnapshot` keeps object identity (`workflow.ts:129`), so the `includes` filter is correct. The scoped-load test with an unrelated unmirrored blocker exists. The live `inspect.ts` for RWR-10411 now succeeds.
- F2 resolved. `jiraSnapshot` reads `mirror_status`; `stale` sets `fields.stale: true`; any other value is rejected (`workflow.ts:594`). Fixture uses `mirrorStatus: "stale"`. Rejection is tested.
- N1 resolved. A missing `status_category` is rejected through `text(...)` (`workflow.ts:592`). Tested.

### Correctness checks that passed

- `mirror.root` path safety: `validateRelativePath` (`workflow.ts:573`), joined to the alignment root; `session.collect` uses the alignment root as store root; only direct children are read (`dirname(file) === mirrorRoot`).
- Unknown `schema`, id and file-name mismatch, wrong `ref`, parent cycles, unknown `mirror_status`, missing `status_category`: each rejected and tested.
- Parent cycle check (`workflow.ts:606`): edges kept only when the parent itself has a parent, which is sufficient for cycle detection and avoids false "Missing" errors. The ancestor walk (`workflow.ts:610`) terminates after that check.
- Ungrouped: Jira epics count as assigned (`workflow.ts:76`), so an epic is not listed twice.
- `local-markdown` and `github`: `unmirrored` is empty for them, so `relations === snapshot.tickets` and validation is unchanged. `scope ? scopedSnapshot(...)` equals the old expression for both backends.
- Coordination (`coordination.ts:82-83`): the scoped Jira fallback is removed. The whole mirror loads unscoped with `primaryDiagnostics`. Each unmirrored blocker becomes an error line, so `inventoryComplete` is false (`coordination.ts:242`) until a sync mirrors the blocker. A proposed ticket with its own unmirrored blocker is not treated as an invalid record, because it is still in the snapshot (`coordination.ts:98`). The rewritten test proves both the complete and the partial cases. Jira cross-initiative inventory is complete for the mirror as synced.
- Standards: no new script, no Python, no tsconfig change, no `paths`. Style matches the surrounding code (one-line guards, short doc comments).

## Findings

### Blocking

None.

### Non-blocking notes

- N1 (minor) `workflow.ts:86-90`: without a `diagnostics` sink, the unmirrored-blocker warning is dropped. `inspect.ts:14` and the Herdr-app pane call the strict form, so today no surface shows the warning. This matches Q's decision (report through `diagnostics`; header display in ticket 05). Ticket 05 must pass a sink. `fix-0012` records that a sink also switches `local-markdown` to partial-inventory mode; ticket 05 needs a separate option or a filter for that.
- N2 (info, carried from review-0009) `workflow.ts:9`: the import of `MIRROR_SCHEMA` from `jira-mirror.ts` loads the writer and its `twg` modules for one constant. Moving it to `record-schema.ts` is cleaner.
- N3 (info, carried) a scoped load with an unknown Jira ref returns an empty snapshot. `inspect.ts` still reports "No ticket matches the canonical reference".
- N4 (info, carried) `references/playbooks/tasks.md` still says not to list every Jira epic. Ticket 06 can update it.
- N5 (info) `coordination.ts:83`: `let snapshot` keeps an explicit `ExplorerSnapshot` type after the `try` was removed. Correct, because line 124 reassigns it.

### Integration notes (non-blocking)

Per `references/concurrency.md`, this is a source review of the frozen commit. `master` (`fa84871e`) is past the review base (`767bdf8b`) by tracker and workflow record commits only. `git diff --stat 767bdf8b master -- mise` is empty. No overlap with changed source files.

Integration checks the finish MUST run on the merge candidate:

- `mise exec -- bun test` in `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree`, including `coordination.test.ts`.
- `mise exec -- bun test tests` in `mise/conf.d/devtools-herdrapp/app`.
- `bun run typecheck` in `mise/conf.d/devtools-agent/bundles/developer` (expect only the 7 known `skills/browsers/` errors) and in `mise/conf.d/devtools-agent/bundles/agent-core`.
- Read-only `inspect.ts https://reckon.atlassian.net/browse/RWR-10411 --json` in `reckonone-monorepo`.

## Validation

| Command | Directory | Result |
| --- | --- | --- |
| `git rev-parse HEAD HEAD^{tree}`; `git status --porcelain` | worktree | `83add986...`, `d4d6a5f8...`, clean |
| `mise exec -- bun test` | `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree` | 104 pass, 0 fail |
| `mise exec -- bun test tests` | `mise/conf.d/devtools-herdrapp/app` | Run 1: 40 pass, 1 fail (`panel-state.test.ts`, "native panel response ordering", known flaky, file not changed). Run 2: 41 pass, 0 fail |
| `bun run typecheck` | `mise/conf.d/devtools-agent/bundles/developer` | 7 errors, all in `skills/browsers/`; none in changed files |
| `bun run typecheck` | `mise/conf.d/devtools-agent/bundles/agent-core` | pass |
| `inspect.ts https://reckon.atlassian.net/browse/RWR-10411 --json` (worktree script, read-only) | `/home/zenobius/Projects/reckonone-monorepo` | Returns RWR-10411 (Epic, done, `blockedBy: []`) |

- The worktree had no `node_modules`. Symlinks to the base checkout's `node_modules` were added in `bundles/developer`, `bundles/agent-core`, `bundles/matt-pocock` and `devtools-herdrapp/app` for the runs, then removed. `git status --porcelain` was clean afterwards.
- `pi-shared-context` tests were not run. Its only change is one string in `recordKind`; `tree.test.ts` covers the same mapping in `tree.js`.
- No sync was run. `/home/zenobius/Projects/zeno` was not touched.
