---
source_commit: 8ff5def35291d6271aa1ac3768386dff48dad26c
source_tree: a1e58164be06dd02fb6ef73fb8d131db4498fe1e
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Selective refresh implementation draft
type: Concept
---

# Selective shared-context refresh

## Problem

Full refreshes retransferred unrelated result bodies and could not show a validated tree before workflow details completed.

## Implementation

- Added bounded, atomic helper caches with machine/user/path/route/operation/schema/loader identities and opaque versions.
- Added one metadata-only validation batch over helper-owned byte, membership, path-identity and canonical Git observations. Shared snapshots are rechecked before publication; changed writeback is bounded and unchanged bodies are not rewritten.
- Persisted stale panel reads, selectively fetched changed/unknown bodies, retained unrelated current cells, and applied tree membership before four-worker detail refresh.
- Preserved generation, shared-flight and cancellation contracts. Removed selections cannot be restored by late results. Files and Tracker merge persistent snapshots with bounded deletion markers.
- Kept setup, mutations, preparation and authorization on fresh canonical paths. No resident helper or new transport.

Validation deliberately replays canonical loaders. It saves body transfers, not all canonical computation.

## Source

- Branch: feature/herdr-query-cache-01-selective-refresh; base: master.
- Helper commit: e055cd17.
- Panel commit: 8ff5def35291d6271aa1ac3768386dff48dad26c.
- Source tree: a1e58164be06dd02fb6ef73fb8d131db4498fe1e.
- Source checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh.

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

## Verification

Build, TypeScript with isolated real peer declarations, native mod check, all 47 panel/Core tests and all 17 helper/backend tests passed. Real isolated native QA exercised cold/warm/unchanged refresh, edits and shared blockers, Git-only changes, membership, routes, restart, corrupt/missing disk data, stale displays and delayed successful responses. The retained cache matched all 128 fresh canonical values. Native cancellation removed both its worker and job files.

Details, exact checks, invocation/body measurements, native images, limitations and cleanup: [evidence](workflows/herdr-query-cache-01-selective-refresh/artifacts/evidence/implementation-0002/index.md).

## Review history

Implementation self-review findings were resolved: large-sweep eviction churn, validation worker lifetime/serialization, Files stale/deletion state and cross-client persistence. Native QA then exposed and fixed cancellation's orphaned job-directory race. Focused regressions and real-path checks passed. No formal review verdict exists yet.

## Open questions

None. Parent phase acknowledgement and independent review remain pending. No merge, push, ticket completion or source-worktree removal was performed.

## Durable references

- Ticket: tracker/tickets/herdr-query-cache-01-selective-refresh.md.
- Initiative: tracker/initiatives/herdr-query-cache/index.md.
- Start: workflows/herdr-query-cache-01-selective-refresh/events/start-0001.yaml.
- Implementation result: workflows/herdr-query-cache-01-selective-refresh/events/implementation-0002.yaml.
- Evidence: workflows/herdr-query-cache-01-selective-refresh/artifacts/evidence/implementation-0002.

