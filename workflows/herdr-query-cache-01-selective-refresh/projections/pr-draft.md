# SPEC-03 failed selected-detail replacement

## Ticket and source

Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`. Branch: `feature/herdr-query-cache-01-selective-refresh`. Base: `master`. Commit: `95497af730b060bc7e50522ab1128ca8231c7f78`. Tree: `2480b6a2ba3b4e9821decad2f119a60ce4bd8ce4`.

## Problem and implementation

The detail sweep cleared Tracker stale state after a failed selected replacement. Old description and activity remained visible, although the detail cell was non-current. Tracker now derives stale state from the displayed context, tree, and selected detail cells. The displayed detail must also match the cached value. A successful selected read clears stale state. Late sweeps cannot change a new target. A non-selected failure cannot replace the selected error.

## Changed files

- **Panel:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`.
- **Regressions:** `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.
- **Documentation:** `README.md`.

## Validation

- **Focused suite:** 45 tests passed. Command: `mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/cells.test.mjs mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.
- **Full suite:** 60 Node tests and 17 Bun tests passed. Command: `mise exec -- bun run test` from `mise/conf.d/devtools-herdrapp`.
- **Native contract:** `herdr-app check mise/conf.d/devtools-herdrapp/app/mods/shared-context` passed.
- **Real-helper smoke:** production SharedContext/QueryClient with checked-in helper and scratch repository passed transient failure/recovery, removal after valid tree, next-refresh retirement, change during replacement, selection guards and target guards. The transient EIO came from the transport boundary. The missing-record error came from the real helper.

[Smoke outcomes](../artifacts/evidence/fix-0020/files/smoke.json), [calls](../artifacts/evidence/fix-0020/files/calls.json), [replay script](../artifacts/evidence/fix-0020/files/smoke.mjs), [focused log](../artifacts/evidence/fix-0020/files/focused.log), [full log](../artifacts/evidence/fix-0020/files/full-suite.log), [limits](../artifacts/evidence/fix-0020/files/limits.json). Native rendering was not exercised. No native Tracker screenshot is claimed. No native app/Core service was started.

## Review history and findings

- **review-0005:** [artifact](../artifacts/reviews/review-review-0005.md), FAILURE for `8ff5def35291d6271aa1ac3768386dff48dad26c`; historical and stale for the new source.
- **review-0011:** [artifact](../artifacts/reviews/review-review-0011.md), FAILURE for `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`; historical and stale for the new source.
- **review-0017:** [artifact](../artifacts/reviews/review-review-0017.md), FAILURE for `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`; historical and stale for the new source.

SPEC-03 (alias STD-02) is resolved by this fix and its runtime evidence. Earlier resolved STD-01, SPEC-01 and SPEC-02 remain historical. No unresolved selected finding remains. No fresh reviewer verdict is implied.

## Workflow and merge status

[Fix start](../events/fix-start-0019.yaml), [fix result](../events/fix-0020.yaml), [original implementation](../events/implementation-0002.yaml), [previous fix](../events/fix-0014.yaml). Parent completion is recorded below. The claim stays with t14t. No rebase, merge, push, ticket completion or worktree removal occurred. The parent owns workflow commits and a fresh independent review.

## Historical projection

The following content preserves earlier phases. Its current/open labels describe their recorded source only.

---
source_commit: e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce
source_tree: 6135e1c1d522af9f050a18eab21bb06961a3d272
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Selective refresh PR draft
type: Concept
---

# SPEC-02 selected detail restoration

## Ticket and source

Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`. Branch: `feature/herdr-query-cache-01-selective-refresh`. Base: `master`. Source commit: `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`. Tree: `6135e1c1d522af9f050a18eab21bb06961a3d272`. Source is clean.

## Problem and fix

Warm Tracker restored the tree but cleared the selected cached detail. The description and workflow activity stayed empty throughout validation.

The panel now restores the selected description and activity through target-keyed peek only when cached tree membership matches. Removed detail classifications and missing tree membership clear selection, detail and activity. Target switches clear selection before restoration. Changed selected bodies stay stale until replacement completes. Existing target, generation, membership retirement, current-first tree, footer and fresh action preparation paths remain intact.

## Changed files

- **Panel:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`.
- **Regression:** `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.
- **Documentation:** `README.md`.

## Verification

- **Focused command:** `mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`: 22 passed. Includes persisted warm selection, gated validation, changed description/activity, removal and target switch.
- **Full suite:** `mise exec -- bun run test` from `mise/conf.d/devtools-herdrapp`: 54 Node and 17 Bun tests passed. The final activity-replacement assertion was added afterward; the final focused suite passed again.
- **Native contract:** `herdr-app check mise/conf.d/devtools-herdrapp/app/mods/shared-context`: passed.
- **Runtime smoke:** `mise exec -- node --experimental-vm-modules /tmp/spec02-deEPU7/smoke.mjs`: passed. Production QueryClient and SharedContext ran against the checked-in real helper in a scratch repository. Gated warm validation showed the cached description, one real workflow event and stale=true. Unchanged became current. Edited description replaced the cache. Deletion cleared selection/detail/activity. Old-target validation could not restore detail or activity.

[Evidence and limits](../artifacts/evidence/fix-0014/index.md). Native drawing/resource adapters were substituted in the smoke. The private native app accepted layout commands but retained its welcome frame; no new Tracker visual proof is claimed. The live user app and installed mod links were not changed. Owned private app and Core stopped.

## Review history and findings

- **Original implementation:** [implementation-0002](../events/implementation-0002.yaml), source `8ff5def35291d6271aa1ac3768386dff48dad26c`.
- **First review:** [review-0005](../artifacts/reviews/review-review-0005.md), FAILURE for the original source. STD-01 and SPEC-01 were resolved by [fix-0008](../events/fix-0008.yaml) and confirmed by the second review.
- **Second review:** [review-0011](../artifacts/reviews/review-review-0011.md), FAILURE for `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`, finding SPEC-02. This verdict is historical and stale after this source change.
- **Current fix:** [fix-start-0013](../events/fix-start-0013.yaml) authorized SPEC-02 only. [fix-0014](../events/fix-0014.yaml) records this result. SPEC-02 is resolved by regression and runtime proof. No unresolved selected finding remains.

## Merge status

No merge, rebase, push, ticket completion, worktree removal or source publication metadata commit occurred. Parent completion is recorded below. A fresh independent review remains required. This fix is not a review verdict.


## Historical prior-phase draft

The following section records earlier source states. Its current/open/remaining labels are historical, not current findings. The SPEC-02 result above supersedes them.

# Selective shared-context refresh — scoped fixes

## Ticket summary and problem

Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`. Initiative: `tracker/initiatives/herdr-query-cache/index.md`. Persistent query caching must remain bounded, prevent stale resurrection, and show useful cached Files bodies before validation.

## Implementation summary

The original implementation added helper-owned validation, bounded result caches, selective reads and current-tree-first progress. This fix changes only the two blocking findings from review-0005.

- **STD-01 (P2, Standards; NO ADR):** replaced the unbounded retired-key map with one durable storage snapshot generation. Reads capture that generation before dispatch. Persistence rejects older snapshots; retirement removes only the matching observed body, not a newer concurrent body. Transient retirement lists are bounded by the active cell count. v3 storage starts cold. Existing stored entries on other targets remain intact. Conservative tradeoff: unrelated concurrent older writebacks may not be cached.
- **SPEC-01 (P2, Spec; NO ADR):** restored saved view state from the matching cached context identity before validation. Expanded directory bodies and the selected preview are applied through peek immediately and marked stale. Changed bodies stay visible and stale during replacement. Removed selection, target checks and generation checks remain active. Fresh action preparation is unchanged.

## Source

Branch: `feature/herdr-query-cache-01-selective-refresh`; base: `master`.

- STD-01: `0c84851b97627f2c8ec02cd49a521c3070e07069`.
- SPEC-01: `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`.
- Final tree: `c9b7a555c581397c1a06fcbe5d01d24947df0e03`.
- Source checkout remains clean and retained. No rebase, base merge, push or ticket completion occurred.

## Changed files

- `README.md`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`
- `mise/conf.d/devtools-herdrapp/tests/cells.test.mjs`
- `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`

## Complete implementation scope

- `README.md`
- `mise/conf.d/devtools-herdrapp/app/bin/herdr-context.mjs`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/core.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/loading.js`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`
- `mise/conf.d/devtools-herdrapp/build/cache.test.ts`
- `mise/conf.d/devtools-herdrapp/build/cache.ts`
- `mise/conf.d/devtools-herdrapp/build/cli.ts`
- `mise/conf.d/devtools-herdrapp/build/data.ts`
- `mise/conf.d/devtools-herdrapp/build/jobs.ts`
- `mise/conf.d/devtools-herdrapp/build/observations.ts`
- `mise/conf.d/devtools-herdrapp/build/protocol.ts`
- `mise/conf.d/devtools-herdrapp/build/read-session.ts`
- `mise/conf.d/devtools-herdrapp/package.json`
- `mise/conf.d/devtools-herdrapp/tests/cells.test.mjs`
- `mise/conf.d/devtools-herdrapp/tests/core.test.mjs`
- `mise/conf.d/devtools-herdrapp/tests/query-client.mjs`
- `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`

## Validation results

- 17 read-cell tests passed. New coverage exercises over 128 retirements, older-client persistence, fresh same-key bodies, cross-target preservation, late reads, and newer same-target values.
- Full package suite: 52 Node tests and 17 Bun tests passed; zero failures. Run from the package cwd with `mise exec -- bun run test`.
- Native mod check passed.
- Real helper/QueryClient smoke retired 141 file bodies with zero retained retirement keys and no deleted-body recovery. One unchanged batch transferred no bodies.
- Isolated native Files proof showed cached directories and the selected preview while real validation workers waited, then changed/current bodies and removed selection.

[Evidence and limits](../artifacts/evidence/fix-0008/index.md). [Original implementation evidence](../artifacts/evidence/implementation-0002/index.md) remains unchanged. All owned native services and fixer processes stopped; parent validated and acknowledged the fix result.

## Review history

- Implementation result: [implementation-0002](../events/implementation-0002.yaml), source `8ff5def35291d6271aa1ac3768386dff48dad26c`. Parent completion: [start-complete-0003](../events/start-complete-0003.yaml).
- Independent [review-0005](../events/review-0005.yaml) returned **FAILURE** for that original source. [Review artifact](../artifacts/reviews/review-review-0005.md), [review start](../events/review-start-0004.yaml), [parent review completion](../events/review-complete-0006.yaml). STD-01 references data.js lines 91,107,117–124. SPEC-01 references main.js lines 139–140,193–216. These are the original reviewed line references.
- [fix-start-0007](../events/fix-start-0007.yaml) authorized this independent fix. Result: [fix-0008](../events/fix-0008.yaml). Both finding IDs are resolved by this fix; no unresolved selected finding remains.

Review-0005 remains historical FAILURE for the original source. Review-0011 below supplies the current FAILURE verdict after independently checking the fixes. Parent fix validation and completion succeeded. The subsequent independent review is recorded below.

## Remaining findings, questions and merge status

The selected fix findings STD-01 and SPEC-01 are resolved. Current review finding SPEC-02 remains open, as recorded below. Parent fix completion is recorded below. No merge, push, ticket completion or source-worktree removal occurred.



## Parent fix completion

[fix-complete-0009](../events/fix-complete-0009.yaml) validates and acknowledges [fix-0008](../events/fix-0008.yaml). All durable references exist and the exact source is clean. The fixer terminal is removed. [Final shutdown observation](../artifacts/snapshots/fix-shutdown-final-0009.json) confirms all owned processes stopped after scoped operator approval. Fresh independent review of `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea` is next.


## Independent review — review-0011

Current state: REVIEW_FAILED. [Second immutable review](../artifacts/reviews/review-review-0011.md) returned FAILURE for `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`. Standards passed; Spec found current P2 SPEC-02. Prior STD-01 and SPEC-01 are independently confirmed resolved. See the artifact for evidence and required changes. [Result](../events/review-0011.yaml). [Parent completion](../events/review-complete-0012.yaml).

The full suite passed 52 Node and 17 Bun tests. The reviewer independently reproduced SPEC-02 using production methods and the real helper; native drawing adapters were substituted, so no new desktop visual proof is claimed. Parent reran 20 existing panel tests successfully. Source is unchanged. Both axis children and reviewer terminal are closed; shutdown is confirmed. No merge or push occurred. Next: fix SPEC-02 in a fresh session.


## Current parent completion — fix-complete-0015

[Parent completion](../events/fix-complete-0015.yaml) validates and acknowledges [fix-0014](../events/fix-0014.yaml). Exact source `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce` is clean. SPEC-02 is resolved by the recorded production-method/helper smoke and regressions. Native visual proof remains limited to a welcome frame; no new Tracker screenshot proof is claimed. [Shutdown observation](../artifacts/snapshots/fix-shutdown-0015.json) confirms the fixer terminal is removed and all owned processes stopped. Fresh independent review is required. No merge, push, or ticket completion occurred.


## Current independent review — review-0017

State: REVIEW_FAILED. [Third immutable review](../artifacts/reviews/review-review-0017.md) returned FAILURE for `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`. One P2 finding remains: SPEC-03, alias STD-02 on the Standards axis. Both axes identified the same failed-replacement freshness defect; this is one fix task, not two. Prior normal-path findings are confirmed resolved. [Result](../events/review-0017.yaml). [Parent completion](../events/review-complete-0018.yaml).

The reviewer ran all required checks, the 54 Node/17 Bun full suite, and real-helper production-method smoke. The failed-replacement case was reproduced despite passing existing tests. Parent reran 22 panel tests successfully. No new native Tracker visual proof is claimed. Source remains unchanged. Reviewer/axis shutdown is confirmed. No merge or push occurred. Next: fix SPEC-03 in a fresh session.




## Current parent completion — fix-complete-0021

[Parent completion](../events/fix-complete-0021.yaml) validates and acknowledges [fix-0020](../events/fix-0020.yaml). Exact source `95497af730b060bc7e50522ab1128ca8231c7f78` is clean. SPEC-03 (STD-02 alias) is resolved by the recorded focused regressions and production-method/real-helper smoke. Native rendering was not exercised. [Shutdown observation](../artifacts/snapshots/fix-shutdown-0021.json) confirms terminal removal and owned process shutdown. Fresh independent review is next. No merge, push, or ticket completion occurred.


## Current independent review — review-0023

SUCCESS on `95497af730b060bc7e50522ab1128ca8231c7f78` (tree `2480b6a2ba3b4e9821decad2f119a60ce4bd8ce4`). Both fresh review axes have no open findings; earlier failures remain historical. See [immutable review](../artifacts/reviews/review-review-0023.md), [result](../events/review-0023.yaml) and [parent completion](../events/review-complete-0024.yaml).

Validation: full suite 60 Node + 17 Bun passed; generated-helper parity and fresh real-helper smoke passed. Parent panel regression suite: 28 passed. No new native visual or remote-host deployment proof. Source unchanged; delivery acknowledged; terminal removed and approved owned-process shutdown confirmed. No merge or push.


## Finish — finish-0030

FINISHED. Exact reviewed source `95497af730b060bc7e50522ab1128ca8231c7f78` integrated by squash as `27f0b55ea4b6559fe78ae0da9642388bbe09d581` (tree `49a5daedbbe120caa6e796b381dc1a5e6a79ba53`) onto master and published to origin/master. Candidate full suite, native mod contract check and real-helper cache/batched-validation smoke passed. Local Markdown ticket completed and published as `56ec508f614f1148e7c4ac6e8d43217bf946c447`. Recorded source and candidate branches/workspaces removed; no refused resources. Unrelated dirty files and workspaces preserved.

Receipts: [prepared](../events/finish-prepared-0025.yaml), [merged](../events/finish-merged-0026.yaml), [pushed](../events/finish-pushed-0027.yaml), [ticket completed](../events/finish-ticket-completed-0028.yaml), [workspaces removed](../events/finish-worktree-removed-0029.yaml), [terminal finish](../events/finish-0030.yaml). [Candidate checks and actual integration mapping](../artifacts/snapshots/finish-integration-0026.json).
