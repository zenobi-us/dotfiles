---
created_at: 2026-11-15T09:25:08.666Z
source_commit: ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea
source_tree: c9b7a555c581397c1a06fcbe5d01d24947df0e03
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Independent selective refresh review after fixes
type: Concept
verdict: FAILURE
---

# Independent selective-refresh review

Review the frozen source against repository standards and the canonical ticket. Reader: parent orchestrator and implementer. Date: 2026-11-15T09:25:08.666Z.

## Overview

Verdict: FAILURE. Standards: SUCCESS, zero blocking findings. Spec: FAILURE, one P2 finding, SPEC-02. Restore warm Tracker details before integration. Prior STD-01 and SPEC-01 are resolved.

Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`. Initiative: `tracker/initiatives/herdr-query-cache/index.md`. This review does not authorize integration or tracker changes.

## Frozen source and scope

Source branch: `feature/herdr-query-cache-01-selective-refresh`. Base branch: `master`.

Reviewed commit: `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`. Reviewed tree: `c9b7a555c581397c1a06fcbe5d01d24947df0e03`.

Review base: `20ff786c4cbdf7f04753db8664367fba2cc2eead`. Full comparison: `git diff 20ff786c4cbdf7f04753db8664367fba2cc2eead...ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`. Incremental fixes: `git diff 8ff5def35291d6271aa1ac3768386dff48dad26c..ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`. Base-only metadata additions are not source removals.

Original changed_scope, unchanged from review-start-0010:

- **Source path:** `README.md`.
- **Source path:** `mise/conf.d/devtools-herdrapp/app/bin/herdr-context.mjs`.
- **Source path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/core.js`.
- **Source path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js`.
- **Source path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/loading.js`.
- **Source path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/cache.test.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/cache.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/cli.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/data.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/jobs.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/observations.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/protocol.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/build/read-session.ts`.
- **Source path:** `mise/conf.d/devtools-herdrapp/package.json`.
- **Source path:** `mise/conf.d/devtools-herdrapp/tests/cells.test.mjs`.
- **Source path:** `mise/conf.d/devtools-herdrapp/tests/core.test.mjs`.
- **Source path:** `mise/conf.d/devtools-herdrapp/tests/query-client.mjs`.
- **Source path:** `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.

Affected contracts, unchanged from review-start-0010:

- **Contract:** helper request/response protocol and validation classifications.
- **Contract:** machine/user/repository/route/argument/schema/loader cache identities.
- **Contract:** canonical file bytes, membership and Git dependency replay.
- **Contract:** bounded atomic helper disk and panel storage caches.
- **Contract:** panel stale/current states, generation cancellation, deletion and footer progress.
- **Contract:** fresh action preparation and authorization bypass.
- **Contract:** generated helper and mod deployment compatibility.

## Standards

SUCCESS. No evidence-backed documented-standard breach or actionable baseline smell was found. The domain index contains no applicable architecture decision record (NO ADR).

STD-01 is resolved. [mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js:113-133](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js#L113-L133) replaces retirement history with a durable scalar snapshot generation. Matching-body retirement preserves newer stored bodies. Publication rejects older snapshot generations.

The independent Standards agent exercised 140 removals, an old client, an in-flight read, a newer same-key body, and an unrelated target. All deletion/isolation assertions passed. Existing focused regressions also passed. The panel limits cells to 128 and snapshot payload to 8 MiB. Helper entries use atomic writes and bounded memory/disk storage.

The global generation check can reject an unrelated concurrent writeback. This documented conservative miss is allowed; it does not justify a blocker.

## Spec

FAILURE. SPEC-01 is resolved: [mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js:140-179](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js#L140-L179) restores cached Files folders and preview before validation. Independent production-path smoke confirmed stale-first display, unchanged-body reuse, changed bytes, and removal. Target-switch regressions passed.

### SPEC-02 — Restore warm Tracker details before validation

Severity: P2. ADR: NO ADR. File: [mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js:140-167](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js#L140-L167); primary line: 154.

The ticket covers record details and requires: “On connection or refresh, show cached data as stale until validation succeeds.”

`follow()` restores the cached context and tree but never reads the cached selected detail. `restoreView()` clears `this.detail`. [mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js:585-596](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js#L585-L596) consequently renders “Read the selected record…” while validation is pending. The saved description and workflow stay unavailable.

Independent reproduction used a scratch repository, the checked-in helper, production QueryClient, and production SharedContext methods. Persisted context, tree, selected A, and A detail existed. With validation gated, `peek("detail", target, {id:"A",kind:"ticket"})` returned a body, but `view.detail` was null. Releasing validation populated the detail. This is not a helper cache miss.

Required change: restore cached selected detail and workflow activity from the same target before validation. Mark them stale. Keep deletion, membership, target, and generation guards.

Effective validation: add a warm Tracker panel regression with delayed validation; assert cached description/activity first, then changed, removed, and target-switch outcomes. Run:

`mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`

## Verification and limits

Integration checks copied exactly from the parent envelope:

- **Passing command:** `mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/cells.test.mjs mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.
- **Passing command:** `mise exec -- bun test mise/conf.d/devtools-herdrapp/build/`.
- **Passing command:** `herdr-app check mise/conf.d/devtools-herdrapp/app/mods/shared-context`.

Focused Node run: 37 passed, zero failures. Backend run: 17 passed, zero failures. Native mod check passed. Full relevant suite: `mise exec -- bun run test` from `mise/conf.d/devtools-herdrapp`; 52 Node and 17 Bun tests passed, zero failures. No source-writing build ran.

Independent smoke command: `mise exec -- node --experimental-vm-modules /tmp/review-0011-smoke.mjs`. Final run exited zero. It proved the Files fix and reproduced SPEC-02 against real helper results. Helper requests: setup 1, context 2, directory 2, file 2, validate 4, tracker 1, detail 1. Unchanged refresh transferred no additional file body. The temporary script and scratch repository were removed after proof.

Native drawing/resource adapters were substituted for the smoke; no new desktop screenshot was captured. Existing fix screenshots were inspected: `artifacts/evidence/fix-0008/shots/warm-validation-pending.png`, `changed-native.png`, and `removed-native.png`. They support the Files fix, not warm Tracker detail restoration. Existing implementation/fix indexes and smoke evidence were read critically. No second host/account was provisioned, and the full desktop matrix was not repeated.

Integration hazards: deploy generated helper and mod together; preserve cache-schema isolation. Snapshot generations permit conservative cache misses. This review leaves the source, tests, config, generated helper, tracker, projections, live app, and unrelated prototype unchanged.

Standards and Spec ran in fresh parallel read-only muxer children. Both results were verified and acknowledged. Terminals t16k and t16m were closed and removed. Resource observations confirmed stopped child processes; the app listing confirmed both child panes absent. No owned service remains. Parent owns this review terminal and the completion receipt.

The prior FAILURE remains historical evidence for 8ff5def3. This review applies only to ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea. Standards: 0 findings. Spec: 1 finding; worst severity P2.

