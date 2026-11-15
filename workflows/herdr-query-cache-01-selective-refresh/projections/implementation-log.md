# Fix-0020 implementation log

Source: `95497af730b060bc7e50522ab1128ca8231c7f78`, tree `2480b6a2ba3b4e9821decad2f119a60ce4bd8ce4`. [Receipt](../events/fix-0020.yaml). [Draft](pr-draft.md).

Changed files: `README.md`, `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`, `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.

SPEC-03/STD-02: derive stale state from displayed cells; keep retained failed replacement stale; guard late completion and selected errors. Six deterministic regressions passed. Focused suite: 45 passed. Full suite: 60 Node and 17 Bun passed. Native mod check passed. Production real-helper smoke passed. [Outcomes](../artifacts/evidence/fix-0020/files/smoke.json). Native rendering remains unverified.

All three earlier review FAILURE verdicts are historical and stale after this source change. Fresh review remains required. No unresolved selected findings or open implementation questions. No owned services started. Parent owns workflow completion/publication.

## Earlier phase history

---
source_commit: e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce
source_tree: 6135e1c1d522af9f050a18eab21bb06961a3d272
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Selective refresh implementation log
type: Concept
---

# Current fix result

[fix-0014](../events/fix-0014.yaml) resolves SPEC-02. [Phase start](../events/fix-start-0013.yaml). Source: `e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce`, tree `6135e1c1d522af9f050a18eab21bb06961a3d272`.

Changed files: `README.md`, `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`, `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.

Validation: final focused suite 22 passed; full suite 54 Node and 17 Bun passed; native mod contract passed; real-helper warm/unchanged/changed/removed/target-switch smoke passed. Native Tracker visual proof is unavailable; the private window retained its welcome frame. [Evidence](../artifacts/evidence/fix-0014/index.md).

No unresolved selected findings or source questions. Parent completion and fresh independent review remain required. Both historical FAILURE reviews are stale for the changed source.

## Historical implementation and fix log

The following state labels apply only to their historical source commits.

# Implementation and fix history

Generated from append-only events. Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`.

| Receipt | Phase/event | Status | Source |
| --- | --- | --- | --- |
| [start-0001](../events/start-0001.yaml) | start/phase-start | started | 9345684e |
| [implementation-0002](../events/implementation-0002.yaml) | implementation/phase-result | completed | 8ff5def3 |
| [start-complete-0003](../events/start-complete-0003.yaml) | start/phase-complete | completed | 8ff5def3 |
| [review-start-0004](../events/review-start-0004.yaml) | review/phase-start | started | 8ff5def3 |
| [review-0005](../events/review-0005.yaml) | review/phase-result | FAILURE | 8ff5def3 |
| [review-complete-0006](../events/review-complete-0006.yaml) | review/phase-complete | completed | 8ff5def3 |
| [fix-start-0007](../events/fix-start-0007.yaml) | fix/phase-start | started | 8ff5def3 |
| [fix-0008](../events/fix-0008.yaml) | fix/phase-result | completed | ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea |

## Original implementation

- Versioned machine/user/path/route/operation/schema/loader identities; private atomic bounded disk storage and bounded validation staging.
- Canonical byte, membership, path and Git replay; one metadata-only batch, four validation workers and shared rechecked snapshots.
- Persistent stale display, selective refresh, tree-before-details progress, current-first eviction handling and cross-client tombstones.
- Late-generation/deletion safety and cancellable worker plus job-file cleanup. Setup, mutations, preparation and authorization remain uncached.

Changed files:

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

Original checks: build, 47 Node tests, 17 Bun tests, isolated-peer TypeScript, native contract, real helper/native matrix and 128 canonical comparisons passed. [Original evidence](../artifacts/evidence/implementation-0002/index.md) and [immutable implementation draft](../artifacts/snapshots/pr-draft-implementation-0002.md) remain unchanged. Original resources stopped.

## Independent review history

[Immutable review artifact](../artifacts/reviews/review-review-0005.md). Standards: STD-01, P2, NO ADR, unbounded retirements and stale-client resurrection. Spec: SPEC-01, P2, NO ADR, missing stale-first warm Files display. Verdict FAILURE covered source 8ff5def35291d6271aa1ac3768386dff48dad26c and tree a1e58164be06dd02fb6ef73fb8d131db4498fe1e. Both findings were open at review completion. Reviewer resources stopped. Review history is preserved; the verdict is now historical/stale because source changed.

## Scoped fix

- 0c84851b97627f2c8ec02cd49a521c3070e07069 resolves STD-01: scalar durable snapshot fence, bounded transient retirements and matching-body deletion.
- ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea resolves SPEC-01: synchronous cached Files restoration and stale/current state through replacement reads.
- Changed files: `README.md`, `mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js`, `mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js`, `mise/conf.d/devtools-herdrapp/tests/cells.test.mjs`, `mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs`.
- Checks: 17 cache regressions, full 52 Node/17 Bun suite, native mod check, 141-retirement real-helper smoke and real isolated native stale/changed/removed Files presentation passed.
- [Fix evidence](../artifacts/evidence/fix-0008/index.md), [immutable fix snapshot](../artifacts/snapshots/pr-draft-fix-0008.md), [complete current PR draft](pr-draft.md).
- Native apps, launchers and private Core are stopped. Temporary scratch fixtures removed after preserving evidence. Source is clean and retained.

## Questions and next action

No unresolved selected findings or open questions. Parent fix validation and completion succeeded. The subsequent independent review is recorded below. No merge, push or ticket completion occurred.



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
