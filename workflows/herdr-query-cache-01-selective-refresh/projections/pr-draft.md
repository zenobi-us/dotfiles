---
source_commit: 8ff5def35291d6271aa1ac3768386dff48dad26c
source_tree: a1e58164be06dd02fb6ef73fb8d131db4498fe1e
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Selective refresh PR draft
type: Concept
---

# Selective shared-context refresh

Generated from `workflows/herdr-query-cache-01-selective-refresh/events/start-0001.yaml`, `workflows/herdr-query-cache-01-selective-refresh/events/implementation-0002.yaml`. Parent completion: `workflows/herdr-query-cache-01-selective-refresh/events/start-complete-0003.yaml`. Events remain authoritative.

## Status

IMPLEMENTED. Parent phase completion and child shutdown are confirmed. Formal review has no verdict. No merge, push or ticket completion occurred.

## Problem and changes

Full refreshes retransferred unrelated bodies and delayed tree usability.

- Versioned machine/user/path/route/operation/schema/loader identities; private atomic bounded disk storage and bounded validation staging.
- Canonical byte, membership, path and Git replay; one metadata-only batch, four validation workers and shared rechecked snapshots.
- Persistent stale display, selective refresh, tree-before-details progress, current-first eviction handling and cross-client tombstones.
- Late-generation/deletion safety and cancellable worker plus job-file cleanup. Setup, mutations, preparation and authorization remain uncached.

Canonical replay saves result-body transfer, not all canonical computation.

## Source

- Branch: `feature/herdr-query-cache-01-selective-refresh`. Base: `master`.
- Commit: `8ff5def35291d6271aa1ac3768386dff48dad26c`.
- Tree: `a1e58164be06dd02fb6ef73fb8d131db4498fe1e`.

## Changed files

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

## Checks

Build, 47 panel/Core tests, 17 helper/backend tests, isolated-peer TypeScript and native mod check passed. Actual helper/native scenarios and canonical comparisons are in [evidence](../artifacts/evidence/implementation-0002/index.md). [Immutable implementation draft](../artifacts/snapshots/pr-draft-implementation-0002.md).

## Review history

Implementation self-review findings resolved; formal worktree review pending.

All implementation self-review findings and the native cancellation leak were resolved and exercised. Independent formal review remains the next phase; these checks do not establish a review verdict.

## Open questions

None.

