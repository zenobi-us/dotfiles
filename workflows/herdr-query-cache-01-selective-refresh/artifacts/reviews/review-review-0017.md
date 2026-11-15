---
created_at: 2026-11-15T11:30:52.289Z
source_commit: e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce
source_tree: 6135e1c1d522af9f050a18eab21bb06961a3d272
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Independent selective-refresh review after SPEC-02 fix
type: Concept
verdict: FAILURE
---

# Independent selective-refresh review

Verdict: FAILURE. Both axes found the same P2 stale-state failure. The normal SPEC-02 warm restoration path now works. Integration needs the failed-replacement path fixed.

Timestamp: 2026-11-15T11:29:26.932Z. Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`. Initiative: `tracker/initiatives/herdr-query-cache/index.md`. Reader: parent orchestrator and implementer. This review grants no integration authority.

## Frozen identities

Source branch: `feature/herdr-query-cache-01-selective-refresh`. Base branch: `master`.

Source commit: `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`. Source tree: `6135e1c1d522af9f050a18eab21bb06961a3d272`.

Review base commit: `cb8cc0a958e157aced8b3d28a049f54894d30cd1`.

Full comparison: `git diff cb8cc0a958e157aced8b3d28a049f54894d30cd1...e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`.

Incremental fix: `git diff ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea..e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`.

The verified source matches the assigned commit and tree. Base-only metadata additions are not product-code removals. No earlier implementation, reviewer, or fixer session was resumed.

## changed_scope

- **Reviewed path:** `README.md`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/app/bin/herdr-context.mjs`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/core.js`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/loading.js`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/cache.test.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/cache.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/cli.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/data.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/jobs.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/observations.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/protocol.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/build/read-session.ts`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/package.json`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/tests/cells.test.mjs`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/tests/core.test.mjs`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/tests/query-client.mjs`.
- **Reviewed path:** `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.

## affected_contracts

- **Contract:** helper request/response protocol and validation classifications.
- **Contract:** machine/user/repository/route/argument/schema/loader cache identities.
- **Contract:** canonical file bytes, membership and Git dependency replay.
- **Contract:** bounded atomic helper disk and panel storage caches.
- **Contract:** panel stale/current states, generation cancellation, deletion and footer progress.
- **Contract:** fresh action preparation and authorization bypass.
- **Contract:** generated helper and mod deployment compatibility.

## Standards

FAILURE. One P2 documented presentation-contract breach. No additional actionable smell finding. The indexed Pi Ink ADR does not govern this change.

### STD-02 — Failed selected-detail replacement clears stale state

Severity: P2. ADR: NO ADR. File: `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`, line 275. Related paths: lines 271, 309–311, 339–345; `loading.js`, lines 76–87.

The README contract says: “The selected detail stays stale until validation and any required replacement read finish.” A failed replacement does not establish freshness.

`choose()` and `loadDetails()` catch the failed replacement and keep the old description/activity. The sweep resolves, then line 275 unconditionally sets Tracker stale state to false. The selected QueryClient cell remains non-current. The footer uses that false state and loses the stale qualifier.

The parent reproduced this with production main.js/data.js and the checked-in helper. It changed selected A, delayed A's replacement after the valid tree arrived, removed A, then released the read. The helper returned “The selected record no longer exists. Refresh the tracker.” The view retained A's previous description/activity with `isCurrent=false` and `stale=false`.

Required change: derive Tracker stale state from retained displayed detail cells after the sweep. Preserve stale state when replacement fails. Retire a confirmed missing selection where appropriate. A successful retry must clear stale state.

Effective validation: add that failed-replacement scenario to the warm Tracker behavioral harness, then run `mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/cells.test.mjs mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`. Assert retained description/activity, non-current cell, stale footer, and successful-retry recovery.

## Spec

FAILURE. One P2 finding, SPEC-03. It is the same root cause as STD-02, not a second implementation task.

### SPEC-03 — Retained failed replacement is not marked stale

Severity: P2. ADR: NO ADR. File: `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`, line 275.

Ticket requirement: “Stale state and footer progress reflect cache state accurately.” The changed selected body remains unvalidated after its replacement fails. The unconditional Tracker reset violates this requirement. Runtime evidence, required change, and effective validation are those recorded under STD-02.

Both independent axes identified this path before the parent runtime reproduction. Their temporary IDs were STD-001 and SPEC-02. This report uses STD-02 and SPEC-03 to avoid confusing the resolved historical findings.

### Prior finding resolution

- **STD-01 resolved:** Durable scalar persistence fencing replaces unbounded retirement history. The focused suite passes old-client resurrection, later-body preservation, concurrent-target persistence, and bounded-retirement scenarios. No regression found.
- **SPEC-01 resolved:** Warm Files folders and preview restoration remains present. Focused warm unchanged/change/removal and target-switch regressions pass. This review does not claim new native Files screenshots.
- **SPEC-02 normal path resolved:** Independent real-helper smoke observed cached selected description AND workflow activity before gated validation. Unchanged validation made them current without new body transfer. Changed description/activity remained visible and stale until successful replacement. Removal retired selection/detail/activity; late target validation and selected-record races did not overwrite current state.

### Acceptance coverage

| Category | Evidence and boundary |
| --- | --- |
| Unchanged refresh | Production smoke transferred only one validate response on the warm unchanged path; no context/tree/detail replacement bodies. |
| Changed input and dependencies | Production smoke replaced A's description/activity while reusing B's body. Backend real-helper regressions passed blocker dependency invalidation. |
| Membership changes | Production smoke retired removed A and matched the final tree to an uncached canonical read. Backend addition, nested rename, and deletion regressions passed. |
| Git dependencies | Real-helper Git-only workflow invalidation regression passed. Canonical replay inspects Git-derived results. |
| Identity isolation | Reviewed machine/user/canonical path/routes/arguments/schema/loader identity construction. Scoped suite passed checkout and named Core-machine isolation; route and argument regressions passed. No additional physical host/account was provisioned. |
| Recovery | Real-helper restart, missing/corrupt disk observations, and same-metadata byte replacement regressions passed. Unknown causes refresh. |
| Panel behavior | Production smoke kept the tree usable before changed detail completion. Successful paths passed. Failed replacement violates stale-state accuracy as reported above. |
| Response races | Production selected-record and late target-validation races passed. Focused suite passed old-generation validation, in-flight invalidation, cancellation, deletion, and cleanup scenarios. |
| Action safety | Canonical preparation bypass is explicit. Production smoke attempted preparation after A's deletion and received canonical rejection. Full suite passed private-session preparation/cleanup. |
| Resource limits | Reviewed 128-cell/8-MiB panel bounds and helper memory/disk limits. Scalar-fence and real disk-pruning regressions passed. Atomic helper publication remains intact. |

Ready-to-ready route changes were inspected statically, not exercised through a new native panel run. An unready context hides prior readers behind onboarding; retained in-memory state alone is not a separate visible-content finding. No stronger requirement to avoid all canonical computation was imposed.

## integration_checks

The following commands copy the parent envelope exactly. All exited zero.

- **Passing command:** `mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/cells.test.mjs mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.
- **Passing command:** `mise exec -- bun test mise/conf.d/devtools-herdrapp/build/`.
- **Passing command:** `herdr-app check mise/conf.d/devtools-herdrapp/app/mods/shared-context`.

Focused Node run: 39 passed, zero failures. Backend run: 17 passed, zero failures. Native mod contract check passed.

Full suite: `mise exec -- bun run test`, with cwd `mise/conf.d/devtools-herdrapp`. It passed 54 Node tests and 17 Bun tests. No build that rewrites generated source ran.

## Independent runtime evidence

Command: `mise exec -- node --experimental-vm-modules /tmp/review-0017-smoke.mjs`. Final run exited zero and asserted the defect, as well as the successful paths. Earlier harness-only failures came from assuming an event ID instead of its canonical ref and from not decoding failed-helper envelopes; both were corrected outside source.

Observed failed-replacement output:

`REPRO BLOCKER: retained changed-alpha body/activity; canonical detail missing; isCurrent=false; stale=false; detailError=The selected record no longer exists. Refresh the tracker.`

Helper calls in the final run:

| Operation | Calls |
| --- | ---: |
| setup | 1 |
| context | 1 |
| tracker | 6 |
| detail | 7 |
| validate | 6 |
| prepare | 1 |

Total serialized helper response bytes: 33144, including failure envelopes. This is not a native transport benchmark. The unchanged warm refresh transferred classifications only.

The smoke used a new scratch Git repository and real checked-in helper processes. It ran production QueryClient and SharedContext methods. Native drawing/resource adapters followed the existing harness convention. Workflow activity came from scratch receipt files; deliberately incomplete envelopes remained invalid activity, not fabricated successful workflows. Scratch data and the temporary smoke were removed after proof.

## Evidence limits and hazards

The recorded fix-0014 evidence was inspected critically. Its private native app stayed on the welcome screen. It proves no Tracker visual result. This review adds runtime model/helper proof, not a new desktop screenshot or native Tracker visual acceptance. The real native mod check verifies its contract only.

Deploy helper and mod together. Preserve cache-schema isolation and canonical action preparation. The scalar persistence fence can cause conservative misses across concurrent views; this is safe and not a blocker. No daemon, watcher service, or new transport was added by this review.

Preserve unrelated base dirty workflow tooling, mod defaults/layout wiring, research, old panel tickets, and `/tmp/herdr-remote-cache-prototype`. Historical tracker/goal inventory remains incomplete. No inspected record reserves this ticket. Source, tests, config, generated files, tracker, projections, and live app configuration remain unchanged. Parent owns tracker comments, projections, commits, acknowledgement, review completion, and this review terminal.

## Review session shutdown

Standards and Spec ran in fresh parallel read-only muxer children. Their delivered results passed schema/identity/hash verification and were acknowledged. Child terminals t172 and t173 were closed and removed. Final resource observations: confirmed for both children at 2026-11-15T11:30:19Z. The Spec child remained stopped after terminal removal; closure used its verified PID, start ticks, and assigned run tag before final confirmation. No review-owned long-lived helper service was started.

Standards: 1 finding, worst P2. Spec: 1 finding, worst P2. One unique blocking cause. Verdict applies only to `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`.

