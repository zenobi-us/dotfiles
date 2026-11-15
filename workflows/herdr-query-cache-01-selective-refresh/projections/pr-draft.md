---
source_commit: ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea
source_tree: c9b7a555c581397c1a06fcbe5d01d24947df0e03
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Selective refresh PR draft
type: Concept
---

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

Latest reviewer verdict remains historical FAILURE. It is **stale for the new source**, not a new verdict. This fix did not perform a formal review. Parent validation and completion succeeded. Fresh independent review is required for the changed source.

## Remaining findings, questions and merge status

No unresolved selected findings or open questions. Parent fix completion is recorded below. No merge, push, ticket completion or source-worktree removal occurred.



## Parent fix completion

[fix-complete-0009](../events/fix-complete-0009.yaml) validates and acknowledges [fix-0008](../events/fix-0008.yaml). All durable references exist and the exact source is clean. The fixer terminal is removed. [Final shutdown observation](../artifacts/snapshots/fix-shutdown-final-0009.json) confirms all owned processes stopped after scoped operator approval. Fresh independent review of `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea` is next.
