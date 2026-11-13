# Review review-0009: jira-tracker-mirror-03-snapshot-from-mirror

## Verdict

FAILURE. 2 blocking findings.

- Frozen source commit: `498bed919039bcaf27df3e98be67e58f0ac530d4`
- Frozen tree: `edf3774fee84a03b479d3c916dba5c820bde69cb`
- Diff: `git diff 721046aa...498bed91` (commits `458559a9`, `498bed91`)
- Worktree was clean. HEAD and tree matched the frozen target.
- Attempt 2. Parent receipt: `review-start-0008`. This is a fresh review. It does not reuse the verdict of `review-0005`.

## Scope

- Ticket: `tracker/tickets/jira-tracker-mirror-03-snapshot-from-mirror.md`, read from the base checkout (`master` at `767bdf8b`). The `collect-evidence` criterion moved to ticket 04 and is not judged here.
- Initiative: `tracker/initiatives/jira-tracker-mirror/index.md`, "Implementation Decisions", sections Snapshot and Herdr-app mod. The `sync` button and `synced_at` age belong to ticket 05. Closure and stale marking by the writer belong to ticket 04.
- Q decision after `review-0005`: a blocker that is not in the mirror is a warning, not an error, for scoped and unscoped loads.
- Changed files: `workflow.ts` and `inspect.test.ts` (worktree skill), `pi-shared-context/model.ts`, Herdr-app `mods/shared-context/tree.js`, `mods/shared-context/main.js`, `tests/tree.test.ts`.
- Standards: `AGENTS.md`, `~/.claude/CLAUDE.md`.
- ADRs: `docs/adr/0001-pi-ink-cleanup-trust-boundary.md` does not apply. All findings are `NO ADR`.

### Acceptance criteria

| Criterion | Result |
| --- | --- |
| No scope loads every mirror file; old error gone | Met. Tested (`inspect.test.ts`, "reads every mirror file without a scope"). |
| Each Epic is an initiative; members by `parent` | Met. Direct children in `rootTicketIds`, transitive members in `ticketIds`. Tested. |
| `blocked_by` gives edges; cycle and unknown-blocker validation | Cycles: met. Unknown blockers: not met against Q's decision (F1). |
| Issues without a mirrored epic go to "Ungrouped" | Met. Epics count as assigned, so an epic is not also in "Ungrouped". Tested. |
| Stale mirror records are marked in the pane | Not met for the specified field (F2). |
| Missing or empty mirror says to run a sync | Met. Tested for a missing directory, an empty directory, and a missing `mirror` block. |
| Unit tests use a mirror directory fixture | Met (`jiraFixture` writes `tracker/jira/<KEY>.md`). |

### Correctness checks that passed

- `mirror.root` path safety. `validateRelativePath` (`layout.ts:10`) rejects absolute paths, drive letters, backslashes, NUL, empty parts, `.` and `..`. The root joins the alignment root from `resolveContextRecord`. `DocumentReadSession.collect` uses the alignment root as store root; `document-cache.ts:218,226,281` reject a symlink escape. Only direct children of the mirror root are read (`workflow.ts:484`).
- Unknown `schema`, id and file-name mismatch, wrong `ref`, and parent cycles are rejected. Each has a test.
- A `parent` outside the mirror leaves the child in "Ungrouped" (`workflow.ts:516`).
- Status maps from `status` and `status_category` through `jiraStatus`. `archived` is rejected and tested.
- Scoped load: `scopedSnapshot` filters the full mirror snapshot to the selected ticket and its blocker closure. `inspect.ts` uses the same function.
- Epics list under Planning in `tree.js:53` and `model.ts:106`. Tested in `tree.test.ts`.
- Other backends keep their behaviour. `localSnapshot` and `githubSnapshot` are not changed. `return scope ? scopedSnapshot(...)` equals the old `scope && backend !== "jira"` for `local-markdown` and `github`. The "assigned" change at `workflow.ts:44` adds `jira` only.
- Standards: no new script, no Python, no tsconfig change, no `paths`. Code style matches the surrounding file.

## Findings

### Blocking

NO ADR : An unmirrored blocker is an error. Q decided it is a warning, for scoped and unscoped loads.

  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts:514] `jiraSnapshot` throws "Missing ticket blocker" for the first `blocked_by` key that is not in the mirror. The check runs on the whole mirror, before `scopedSnapshot` at `workflow.ts:54`.
  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts:41] `validateRelations(snapshot.tickets, "ticket blocker")` also throws "Missing ticket blocker" for the same case. A fix at line 514 alone is not sufficient.
  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts:213] The test asserts the rejection, so it proves the behaviour that Q rejected.
  - Live, read-only: `inspect.ts https://reckon.atlassian.net/browse/RWR-10411 --json` in `reckonone-monorepo` returns `{"error":"Missing ticket blocker: POR-6673. Jira issue RWR-12833 is blocked by POR-6673, ..."}`. RWR-10411 has no blockers. The live mirror has 219 epics, no child tickets, and 39 blocker keys outside the mirror.

  Judgement. A Jira blocker can be in another project (POR) or not readable by the user. Ticket 04 adds `closure: [blockers]`, but closure does not guarantee every key resolves. Rejecting the whole snapshot for one outside key makes the Tracker pane and every per-ticket inspection depend on the completeness of the mirror. The initiative (Herdr-app mod) requires that "Per-ticket Git inspection keeps working". Severity: major.

  Why it blocks: the code contradicts Q's recorded decision and breaks scoped inspection of every reckonone Jira ticket after merge.

  Required change: keep an unmirrored blocker on the ticket's `blockedBy` and report it as a warning, not an error. Do not drop the edge: a ticket with an unknown blocker must not look unblocked to `recoveryDecision`. Exclude unknown Jira blockers from the `validateRelations` missing-row check, but keep cycle detection. Return the warnings with the snapshot so the Tracker pane header can show them. Master's `diagnostics` parameter of `loadExplorerSnapshot` is the existing channel for this (see integration notes). Change the test to assert a warning, and add a test: a scoped load of a ticket succeeds while another mirror file has an unmirrored blocker.

NO ADR : The snapshot reads a stale field that the specified writer does not write.

  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts:509] The code reads `doc.fields.stale === true`. The initiative (Sync command, step 6) and ticket 04 (criterion "`--full` ... marks each key ... with `mirror_status: stale`") specify `mirror_status: stale`.
  - [mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts:146] The fixture writes `stale: true`, so the test proves the wrong contract.

  Why it blocks: when ticket 04 lands as specified, no row shows as stale. The criterion "Stale mirror records are marked as stale in the pane" is not met for the field the initiative defines. The parent handoff to the implementer said `stale: true`; that handoff was wrong, but the initiative is the contract. Severity: major.

  Required change: read `mirror_status`. The value `stale` marks the ticket (`fields.stale: true` for the pane is acceptable). Reject an unknown `mirror_status` value with a clear error. Change the fixture to `mirror_status: "stale"`.

### Non-blocking notes

- N1 (minor) `workflow.ts:502`: when `status_category` is missing, `state` becomes the raw status name, for example "To Do". `recoveryDecision` and the pane do not know that state. The initiative lists `status_category` as a required mirror field, and the writer always writes it. Reject a missing category instead of passing the name through.
- N2 (info) `workflow.ts:9`: the import of `MIRROR_SCHEMA` from the `matt-pocock` bundle script `jira-mirror.ts` is acceptable. `workflow.ts:8` already imports `record-schema` from the same bundle, and the bundles share one repository and typecheck. The cost: it loads the writer and its `twg` modules for one constant. Moving `MIRROR_SCHEMA` to `record-schema.ts` is cleaner.
- N3 (info) `workflow.ts:54`: a scoped load with a malformed or unknown Jira ref now returns an empty snapshot. The old code rejected a malformed ref. `inspect.ts` still reports "No ticket matches the canonical reference".
- N4 (info) `references/playbooks/tasks.md` still says not to list every Jira epic. The mirror is now a bounded listing. Ticket 06 can update it.

### Integration notes (non-blocking)

Per `references/concurrency.md`, this is a source review of the frozen commit. `master` is 27 commits past the review base.

- Review base: `721046aa`. Current `master`: `767bdf8b`.
- Changed scope that overlaps upstream: `workflow.ts`, `inspect.test.ts`, `mods/shared-context/main.js`.
- Affected contracts:
  - `loadExplorerSnapshot(context, exec, scope?, diagnostics?)`. Upstream added `diagnostics`. With `diagnostics`, `validateRelations` is skipped (`master:workflow.ts:44`) and `localSnapshot` pushes errors instead of throwing. `jiraSnapshot` must take part in that mode. The F1 fix SHOULD use this channel.
  - The Jira `cli:` adapter. This branch removes it. Upstream test `coordination.test.ts:184` ("Jira's scoped-only adapter reports incomplete cross-initiative inventory") uses that adapter and fails when this branch is merged with `master`. Rewrite it for the mirror: decide whether cross-initiative inventory is now complete for Jira.
- Integration checks the finish MUST run on the merge candidate:
  - `mise exec -- bun test` in `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree`, including `coordination.test.ts`.
  - `mise exec -- bun test tests` in `mise/conf.d/devtools-herdrapp/app`.
  - `bun run typecheck` in `mise/conf.d/devtools-agent/bundles/developer`.
  - Read-only `inspect.ts https://reckon.atlassian.net/browse/RWR-10411 --json` in `reckonone-monorepo`.

## Validation

| Command | Directory | Result |
| --- | --- | --- |
| `git rev-parse HEAD HEAD^{tree}`; `git status --porcelain` | worktree | `498bed91...`, `edf3774f...`, clean |
| `mise exec -- bun test` | `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree` | 63 pass, 0 fail |
| `mise exec -- bun test tests` | `mise/conf.d/devtools-herdrapp/app` | 38 pass, 0 fail |
| `inspect.ts https://reckon.atlassian.net/browse/RWR-10411 --json` (worktree script, read-only) | `/home/zenobius/Projects/reckonone-monorepo` | Error "Missing ticket blocker: POR-6673" (supports F1) |

- `pi-shared-context` tests were not run. The only change there is one string in `recordKind`; `tree.test.ts` covers the same mapping in `tree.js`. No `node_modules` link was made.
- No sync was run. `/home/zenobius/Projects/zeno` was not touched.
