---
source_commit: e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce
source_tree: 6135e1c1d522af9f050a18eab21bb06961a3d272
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: SPEC-02 fix draft
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

[Evidence and limits](../evidence/fix-0014/index.md). Native drawing/resource adapters were substituted in the smoke. The private native app accepted layout commands but retained its welcome frame; no new Tracker visual proof is claimed. The live user app and installed mod links were not changed. Owned private app and Core stopped.

## Review history and findings

- **Original implementation:** [implementation-0002](../../events/implementation-0002.yaml), source `8ff5def35291d6271aa1ac3768386dff48dad26c`.
- **First review:** [review-0005](../reviews/review-review-0005.md), FAILURE for the original source. STD-01 and SPEC-01 were resolved by [fix-0008](../../events/fix-0008.yaml) and confirmed by the second review.
- **Second review:** [review-0011](../reviews/review-review-0011.md), FAILURE for `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`, finding SPEC-02. This verdict is historical and stale after this source change.
- **Current fix:** [fix-start-0013](../../events/fix-start-0013.yaml) authorized SPEC-02 only. [fix-0014](../../events/fix-0014.yaml) records this result. SPEC-02 is resolved by regression and runtime proof. No unresolved selected finding remains.

## Merge status

No merge, rebase, push, ticket completion, worktree removal or source publication metadata commit occurred. Parent completion and a fresh independent review remain required. This fix is not a review verdict.

