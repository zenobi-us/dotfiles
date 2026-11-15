---
blocked_by: []
id: herdr-query-cache-01-selective-refresh
parent: herdr-query-cache
schema: tracker-ticket/v1
sequence: 1
title: Cache shared-context query results and refresh only changed data
triage: ready-for-agent
type: enhancement
work_status: claimed
---

# Cache shared-context query results and refresh only changed data

## What to build

Add persistent local caching and batched validation for shared-context read queries. Cover context resolution, directory listings, file content, tracker trees, and record details through the existing helper request/response transport.

The panel must show useful cached data promptly and distinguish stale data from current data. One validation request must identify which cached results need refresh. The panel must fetch only affected result bodies and their required dependencies.

## Required behavior

### Cache identity and storage

Keep bounded memory and disk caches. Identify results by stable machine identity, remote user, canonical repository path, resolved context routes, operation, arguments, cache schema, and loader version. Separate worktrees and machines even when they share a repository origin.

Store each result with its opaque version and enough dependency information for validation. Write disk entries atomically. Treat missing, corrupt, or incompatible entries as misses. Preserve shared in-flight reads, cancellation, generation checks, and bounded eviction.

### Batched helper validation

The panel sends cache identities and versions in one batched request. The helper returns one classification for each requested entry: unchanged, changed, removed, or unknown. Unknown requires refresh and never means unchanged.

The helper owns dependency discovery and validation. Do not accept arbitrary dependency paths from the panel. Validate file content and identity, collection membership, relevant Git state, and dependent-result versions through canonical rules. Cache identity includes the route context for external shared stores.

Metadata checks can identify likely changes. Do not replace canonical byte or membership validation with metadata-only assumptions. A helper restart must not make unvalidated cached entries appear current. If validation information is unavailable, return unknown.

### Selective refresh and presentation

On connection or refresh, show cached data as stale until validation succeeds. Validate the current tree before background detail refresh. Keep the panel usable while detail refresh runs. Show collection progress in the footer based on current details applied to the cache.

Refresh changed and unknown results plus their affected dependent results. Preserve unrelated current results. Apply additions and removals to collection membership. Prevent late reads or validation responses from restoring deleted records or replacing a newer generation.

### Fresh action checks

Do not cache or replay action preparation, setup, writes, or agent launch authorization. Revalidate action inputs through the existing canonical path before execution. Cached display data never authorizes an action.

## Acceptance criteria

- **Unchanged refresh:** One validation request for the active cache set returns current classifications without transferring unchanged result bodies.
- **Changed input:** A file change refreshes affected results and their dependent results. Unrelated result bodies remain cached.
- **Membership changes:** Additions, renames, and deletions update the tree and affected details. Late responses cannot restore removed records.
- **Git dependencies:** Relevant Git changes invalidate workflow and Git-derived results even when tracker content does not change.
- **Identity isolation:** Machines, users, worktrees, query arguments, route configurations, schemas, and loader versions cannot reuse incompatible cached results.
- **Recovery:** Helper restart, missing dependency information, and corrupt or missing disk entries cause validation or refresh, never false cache hits.
- **Panel behavior:** The current tree becomes usable before all details complete. Stale state and footer progress reflect cache state accurately.
- **Response races:** A result or validation response from an old target or generation cannot replace current state. Cancellation and view cleanup release pending work.
- **Action safety:** Preparation and mutation paths perform fresh canonical validation and bypass the result cache.
- **Resource limits:** Memory and disk caches remain bounded. Interrupted disk writes cannot publish partial valid entries.

## Verification

Use a scratch repository and the real helper and panel. Observe cold load, warm load, unchanged refresh, one-record edits, shared dependencies, Git changes, additions, deletions, route changes, helper restart, corrupt disk cache, and delayed responses.

Compare the final cache with a fresh canonical read. Record helper invocation counts and result-body transfer to demonstrate selective refresh. Add focused behavioral regression coverage for cache identity, dependency invalidation, deletion, and stale-response rejection. Do not rely on screenshots alone for cache correctness.

## Out of scope

Persistent helper watchers, resident helper lifecycle, new SSH or WebSocket transport, and upstream streaming API changes are excluded. No upstream feature request blocks this ticket. Do not split the work into separate storage, helper, and UI tickets.

## Comments

The user approved this single vertical slice and its empty blocker list. The ticket remains unclaimed. No implementation started during ticket publication.



### Review — 2026-11-15T07:39:54.746Z

Verdict: FAILURE. Reviewed commit: `8ff5def35291d6271aa1ac3768386dff48dad26c`. Reviewed tree: `a1e58164be06dd02fb6ef73fb8d131db4498fe1e`. [Independent review](../../workflows/herdr-query-cache-01-selective-refresh/artifacts/reviews/review-review-0005.md).


### Review — 2026-11-15T09:25:29.388Z

Verdict: FAILURE. Reviewed commit: `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`. Reviewed tree: `c9b7a555c581397c1a06fcbe5d01d24947df0e03`. [Independent review after fixes](../../workflows/herdr-query-cache-01-selective-refresh/artifacts/reviews/review-review-0011.md).


### Review — 2026-11-15T11:31:36.954Z

Verdict: FAILURE. Reviewed commit: `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`. Reviewed tree: `6135e1c1d522af9f050a18eab21bb06961a3d272`. [Independent selected-detail review](../../workflows/herdr-query-cache-01-selective-refresh/artifacts/reviews/review-review-0017.md).
