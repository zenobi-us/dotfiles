---
created_at: 2026-11-15T07:38:52.507Z
source_commit: 8ff5def35291d6271aa1ac3768386dff48dad26c
source_tree: a1e58164be06dd02fb6ef73fb8d131db4498fe1e
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Independent selective refresh review
type: Concept
verdict: FAILURE
---

# Selective refresh independent review

Review the frozen implementation against repository rules and the canonical ticket. Reader: parent orchestrator and implementer. Date: 2026-11-15T07:38:52.507Z.

## Overview

Verdict: FAILURE. Standards: one blocking P2 finding. Spec: one blocking P2 finding. Fix both before integration. No source changes were made.

Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`. Initiative: `tracker/initiatives/herdr-query-cache/index.md`.
Source branch: `feature/herdr-query-cache-01-selective-refresh`. Base branch: `master`.
Reviewed commit: `8ff5def35291d6271aa1ac3768386dff48dad26c`.
Reviewed tree: `a1e58164be06dd02fb6ef73fb8d131db4498fe1e`.
Fixed review base: `5c382d21eb4a776b574e22340b5a58a9c154218e`.

Contents: [Standards](#standards), [Spec](#spec), [Acceptance coverage](#acceptance-coverage), [Validation](#validation), [Limits and shutdown](#limits-and-shutdown).

The fixed three-dot diff contains 19 paths, 1,334 additions, and 102 removals. Scope covers README, helper cache/protocol/loaders/jobs, generated helper, panel cache/refresh/footer, and focused tests. The receipt preserves the exact changed_scope, affected_contracts, integration_checks, and coordination_assessment from review-start-0004. Base-only workflow records are not product removals.

Read context map, glossary, domain configuration, ADR index, ticket, initiative, start envelope, implementation receipt, and native evidence. The only indexed ADR concerns Pi Ink cleanup. It does not apply here.

## Standards

### STD-01 — P2 — Retirement bookkeeping grows without bound and loses deletion protection

ADR: NO ADR. File: [data.js lines 91–124](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js#L91-L124). Related cleanup: lines 141–163.

Requirement: “Memory and disk caches remain bounded.” Also: “Prevent late reads or validation responses from restoring deleted records or replacing newer cache state.”

Each removed key enters `this.retired`. Persistence limits only its serialized copy, not the live Map. Each distinct deletion therefore retains another in-memory key. After more than 128 retirements, storage discards older deletion timestamps. Another client can then persist its older deleted body because the merge no longer has that timestamp.

Independent reproduction used the production QueryClient and shared in-memory localStorage through the existing transport harness. Client 1 retained A. Client 2 removed A, then read and retired 140 distinct records. Client 1 then persisted its old state. A fresh client recovered A's removed body.

```json
{"retiredInMemory":141,"cells":0,"persistedTombstones":128}
{"removedBodyRestored":true,"restoredBody":{"id":"A","body":"display body"},"markedCurrent":false}
```

The restored body remains stale, not current. This is not an authorization bypass. It still violates bounded memory and deletion preservation, and can display a deleted body on reconnection.

Required change: bound retirement bookkeeping and preserve a durable generation fence for older client snapshots. Merely truncating the live Map does not fix resurrection.

Validation command, from repository root:

```sh
mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/cells.test.mjs
```

Add a regression with more than 128 distinct retirements and an older concurrent client. Assert bounded bookkeeping and no removed-body recovery. Existing tests pass but omit this case. No additional blocking smell finding was identified. Baseline smells remained judgment calls.

## Spec

### SPEC-01 — P2 — A warm Files connection hides cached bodies until validation completes

ADR: NO ADR. File: [main.js lines 126–143](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js#L126-L143) and [lines 193–216](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js#L193-L216).

Requirement: “On connection or refresh, show cached data as stale until validation succeeds.” Directory listings and file content are explicitly in scope.

`follow()` clears file entries and preview, then restores only context and tracker through `peek()`. It restores saved file folders and selection after validation and the context query. The subsequent file loaders also await their queries before applying bodies.

Independent reproduction used the production SharedContext methods, production QueryClient, existing UI-model harness, and persisted directory/file bodies. It recreated a Files connection and held validation pending. The cache contained the preview, but the view contained neither the preview nor its expanded directory. Both appeared only after validation resolved.

```json
{"stage":"warm connection while validation pending","cachedFileAvailable":true,"viewPreview":null,"viewDirectoryCount":0,"viewSelection":null,"stale":true}
{"stage":"after validation","viewPreview":{"body":"cached selected body"},"viewDirectoryCount":1}
```

This blocks acceptance because the stale-first display requirement fails for two named query types. Cached Tracker display does not cover Files.

Required change: restore saved file state from the cached context identity. Apply cached folder and preview bodies through `peek()` before validation. Mark them stale. Preserve target/generation guards and deletion handling.

Validation command, from repository root:

```sh
mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs
```

Add a warm Files reconnection regression with delayed validation, then changed and removed classifications. Assert visible stale cached bodies before validation. No unsupported scope expansion was identified.

## Acceptance coverage

| Category | Evidence and assessment |
| --- | --- |
| Unchanged refresh | Independent real-helper/client smoke: one batch, four unchanged entries, zero result-body bytes. Each helper invocation used a fresh process. |
| Changed input | Independent edit of A: context unchanged, tree and A changed, B unchanged. Only tree and A bodies transferred: 2,942 bytes. Existing tests cover shared blockers. |
| Membership changes | Independent deletion removed A's detail and tree membership; remaining tree equalled a fresh canonical read. Existing tests cover additions and nested renames. STD-01 exposes cross-client retirement failure. |
| Git dependencies | Canonical detail replay loads workflow/Git-derived state. Existing passing Git-only test changes a commit without changing tracker content. Native evidence reports the same category. |
| Identity isolation | Helper identity includes schema, loader, machine-id, username/UID, canonical cwd, routes/context, operation, and arguments: cache.ts lines 28–38 and 86–88. Passing tests cover repositories, routes, arguments, and panel machine keys. |
| Recovery | Independent disk corruption returned unknown only for the damaged detail. Existing passing tests cover missing entries, restart, same-metadata byte changes, and replacement identity. Unknown never marks a cell current. |
| Panel behavior | Inspected native tree-ready screenshot: current tree and 1/2 details applied. Source and tests cover incremental applied counts. SPEC-01 fails Files stale-first connection behavior. |
| Response races | Passing tests cover obsolete target/generation completions, removed details/files, cancellation, and worker/job cleanup. Production-client reproduction confirms STD-01's older-client persistence defect. |
| Action safety | protocol.ts lines 24–27 only cache read operations. data.ts lines 186–198 reads a fresh canonical snapshot and checks preparation choices. Existing mutation and preparation bypass tests passed. |
| Resource limits | Helper caps disk/memory at 512 entries and 32 MiB, per entry at 6 MiB; atomic rename publishes writes. Passing pruning test covers 513 entries and 33 MiB. Panel retirement memory is unbounded: STD-01. |
| Transport boundary | No new daemon, watcher, SSH, or WebSocket transport. Validation uses the existing request/job protocol. Canonical replay can save transfer while recomputing results; this conforms to the ticket. |

## Validation

The envelope's exact commands were run from repository root:

```sh
mise exec -- bun --cwd mise/conf.d/devtools-herdrapp run test
herdr-app check mise/conf.d/devtools-herdrapp/app/mods/shared-context
```

The first command printed Bun usage and the script list, with exit zero. It did not execute tests. Do not count that exit status as test proof. The native mod check passed.

The effective test command was run from `mise/conf.d/devtools-herdrapp`:

```sh
mise exec -- bun run test
```

Result: 47 Node tests and 17 Bun tests passed; zero failures. The source files and generated helper were not changed.

An in-memory `Bun.build` with the checked-in build options succeeded. From the package cwd, its complete generated content matched the checked-in helper: 200,332 characters. An initial repository-root comparison differed because generated module-path comments depend on cwd; the package-context comparison resolved this difference without writing source.

Independent smoke command: `mise exec -- node --experimental-vm-modules /tmp/review-0005-smoke.mjs`. It called the real generated helper against a new scratch Git repository and private cache through the production QueryClient. It proved unchanged transfer suppression, selective changed bodies, deletion, canonical equality, and corrupt-entry recovery. The script and fixture were removed after proof.

The two finding reproductions used temporary Node scripts with production modules and existing transport/UI harnesses. They did not open a new desktop instance. Their exact observed outputs appear above. Both scripts were removed after proof. No permanent tests or source fixes were added.

Existing evidence was read critically, not treated as a verdict. The native index reports warm 200-record eviction misses, not zero bodies for the entire collection. Retained validated entries avoided transfer; evicted entries required reads. The native tree screenshot and canonical comparison JSON support their stated narrower claims. The evidence does not cover warm Files connection hydration or retirement overflow.

## Limits and shutdown

No second physical machine or OS account was provisioned. Machine/user/schema/loader isolation was inspected, not newly exercised across real accounts. Native UI evidence came from implementation-0002; this review independently ran helper/client behavior and model-level defect reproductions. No new visual desktop matrix was run.

Standards child: `576dc520-7a1d-4528-884a-f31940cf7ec0`, terminal `t15s`, PID 2121970, boot `5cc3946f-11c5-42bb-8f61-913dffe03728`, start ticks 21298746.
Spec child: `f4149724-e804-47a2-a268-7298d5ad84dd`, terminal `t15r`, PID 2121968, same boot and start ticks.
Both independent fresh axis results were verified and acknowledged. Both owned terminals were stopped and removed. Resource observations confirmed both process identities stopped. Exact before/after observations are retained in review-0005. No owned services remain. Parent owns this reviewer's terminal and harness lifetime.

The coordination inventory remains incomplete for unrelated historical journals. No known reservation names this ticket. Source, tracker, projections, unrelated base changes, user app/Core, and `/tmp/herdr-remote-cache-prototype` were not changed.

Axis totals: Standards 1 blocking P2; Spec 1 blocking P2. Verdict: FAILURE.

