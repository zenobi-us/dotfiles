---
created_at: 2026-11-15T22:26:10.624Z
review_base_commit: 0855c8260be91c65acce8c97d4cb8a6b0edb0a58
source_commit: 95497af730b060bc7e50522ab1128ca8231c7f78
source_tree: 2480b6a2ba3b4e9821decad2f119a60ce4bd8ce4
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Independent selective-refresh review after SPEC-03 fix
type: Concept
verdict: SUCCESS
---

# Independent selective-refresh review

Verdict: SUCCESS. Standards: no findings. Spec: no findings. SPEC-03 (alias STD-02) is resolved. No blocking findings remain.

Timestamp: 2026-11-15T22:26:10.624Z. Ticket: `tracker/tickets/herdr-query-cache-01-selective-refresh.md`. Initiative: `tracker/initiatives/herdr-query-cache/index.md`. Parent: review-start-0022, attempt 4. This verdict grants no integration authority.

## Frozen identities

Source branch: `feature/herdr-query-cache-01-selective-refresh`. Base branch: `master`.

Source commit: `95497af730b060bc7e50522ab1128ca8231c7f78`. Source tree: `2480b6a2ba3b4e9821decad2f119a60ce4bd8ce4`.

Review base commit: `0855c8260be91c65acce8c97d4cb8a6b0edb0a58`.

Full comparison: `git diff 0855c8260be91c65acce8c97d4cb8a6b0edb0a58...95497af730b060bc7e50522ab1128ca8231c7f78`.

Incremental comparison: `git diff e1a8cccee968e5c63ccdfec9bd48e7aff5ff41ce..95497af730b060bc7e50522ab1128ca8231c7f78`.

The frozen commit and tree resolved exactly. Base-only workflow metadata is not product removal. This review used new sessions only.

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

PASS. No documented-standard breach or actionable baseline smell. NO ADR applies. The indexed Pi Ink trust-boundary ADR does not govern this change.

The independent Standards reviewer read the full diff and latest fix. Its sources included repository instructions, canonical domain documents, README cached-read contracts, and the ticket and initiative. It applied the twelve code-smell heuristics as judgment calls, not automatic violations.

The scalar persistence fence and conditional retirement remain bounded. Warm Files and selected Tracker restoration use matching target cells. `main.js:191–196,279–284,354` derives freshness from displayed context, tree and selected-detail cells. The selected-detail check also compares the displayed value with the cached value. A failed replacement no longer makes the retained description and activity current.

Tree membership retires absent details. Selection, target and cache-generation checks guard publication. Applied-detail progress increments only after successful application. Fresh canonical action preparation remains outside the cache.

Independent axis run: `685c5a14-c78e-4c30-9e65-132e943ec019`. Its verified result contains no findings. Runtime proof below belongs to this synthesis, not the static axis review.

## Spec

PASS. No evidence-backed missing behavior, incorrect behavior or scope creep. NO ADR applies.

The independent Spec reviewer checked the ticket's Required behavior and Acceptance criteria, and the initiative's Scope and Design constraints. The requirement “On connection or refresh, show cached data as stale until validation succeeds” matches immediate warm restoration followed by helper validation. Failed replacement preserves stale selected description and activity; successful replacement clears stale state.

The requirement “Prevent late reads or validation responses from restoring deleted records or replacing a newer generation” matches cell-generation checks, tree-driven retirement and scalar persistence fencing. The next valid refresh retires a record that disappeared after the previous tree read.

Helper identities include machine, user, canonical repository, routes, operation, arguments, schema and loader. Canonical replay checks bytes, path identity, membership, dependent state and Git-derived results. Missing or corrupt validation information yields unknown and refresh. Repeated canonical computation is permitted; unchanged result bodies are not transferred.

The tree becomes usable before background details finish. The footer counts applied successes. Setup, preparation and mutation operations bypass read caching.

Independent axis run: `0d7c4dfb-74aa-46f9-8542-26a010d0af2c`. Its verified result contains no findings.

## Prior finding resolution

- **STD-01 resolved:** Scalar persistence fencing preserves bounded storage and prevents old-client resurrection. Current focused regressions cover retirement overflow, concurrent targets and later-body preservation.
- **SPEC-01 resolved:** Fresh production-method smoke restored warm Files folders and selected preview before gated validation. Both became current after validation.
- **SPEC-02 resolved:** Fresh production-method smoke restored the selected Tracker description AND workflow activity before delayed validation. Unchanged validation transferred only one validate response.
- **SPEC-03 / STD-02 resolved:** Fresh production-method smoke retained stale description and activity after transport EIO and canonical missing-record failure. Recovery cleared stale state. The next refresh removed missing selection, detail and activity. No duplicate fix task remains.

## integration_checks

Commands ran from the frozen source root unless a different cwd is specified.

| Command | Observed result |
| --- | --- |
| `mise exec -- node --experimental-vm-modules --test mise/conf.d/devtools-herdrapp/tests/cells.test.mjs mise/conf.d/devtools-herdrapp/tests/ui-model.test.mjs` | 45 tests passed; exit 0 |
| `mise exec -- bun test mise/conf.d/devtools-herdrapp/build/` | 17 tests passed; exit 0 |
| `herdr-app check mise/conf.d/devtools-herdrapp/app/mods/shared-context` | Mod check passed; exit 0 |
| `mise exec -- bun run test` | 60 Node tests and 17 Bun tests passed; exit 0; cwd `mise/conf.d/devtools-herdrapp` |
| In-memory Bun.build with build-helper.ts options, from `mise/conf.d/devtools-herdrapp` | Generated helper exactly matched checked-in helper; no generated file written |

An initial parity probe from repository root differed because generated source comments depend on build cwd. The canonical build-directory probe matched exactly. An initial throwaway warm-smoke script had an invalid multiline string; the corrected script passed. Neither issue changed source or supplied a product finding.

## Production smoke and evidence limits

The smoke loaded production `main.js` and `data.js` through Node VM modules. It called the checked-in real helper in newly created scratch repositories. Drawing, OS observation and resource adapters were substituted; cache logic and panel methods were not substituted.

| Scenario | Observed outcome |
| --- | --- |
| Transient selected replacement failure | Transport-boundary EIO retained old description, one workflow event and stale=true; applied count 0 |
| Successful recovery | Canonical replacement displayed the changed body and stale=false |
| Missing record after valid tree | Canonical helper error retained old description/activity with stale=true; applied count 0 |
| Next refresh after deletion | Selected record and detail became null; activity cleared; detail cell retired; stale=false |
| Change during replacement | Invalidated read applied the latest third body, not the obsolete replacement; stale=false |
| Selection and target guards | Late work did not replace a newer selection or restore detail/activity after target change |
| Warm Tracker before gated validation | Description and activity were present with stale=true; afterward stale=false and operations exactly [validate] |
| One-record change | Updated A; transferred zero B detail bodies; final tree matched uncached canonical tree |
| Warm Files before gated validation | Expanded folder and selected preview were present with stale=true; afterward stale=false |
| Context-route generation change during replacement | Route configuration changed while replacement waited; invalidation and next refresh applied the latest body; final detail matched uncached canonical detail |

The route scenario changed a resolved sources route within a ready repository. It did not simulate moving tracker storage to another physical host. The real-helper backend suite independently exercised shared blockers, Git-only changes, additions, nested rename, deletion, same-metadata byte changes, restart, corrupt/missing disk entries, route/argument isolation, disk pruning and validation jobs. Focused panel tests checked both replacement outcomes and applied-detail counts.

No native rendering, screenshots, remote-host deployment or OS event integration was exercised in this review. The earlier private Tracker app remained on its welcome screen; it is not visual proof. The earlier Files screenshots and latest fix evidence remain historical evidence, not newly captured proof. EIO was injected only at the transport boundary; missing-record and recovery behavior used canonical helper reads. No cache-based action authorization was introduced; preparation remains a fresh canonical path.

The new scratch scripts and repositories were removed after proof. No separate evidence envelope was created. This artifact records the observed runtime results; prior replay conventions remain at `artifacts/evidence/fix-0020/files/smoke.mjs` relative to this workflow.

## Coordination and cross-initiative hazards

Preserved review-start coordination: parent t14t owns the held claim and workflow. The previous fixer was stopped. No hard blocker or reservation was supplied. Inventory remains incomplete because unrelated historical journals and linked tracker copies are inconsistent; none reserves this ticket. Source remains frozen; prior FAILURE applies to e1a8ccce, not this source. Base advancement contains metadata, not integration.

No source, test, config, generated-helper, tracker or projection edits occurred. No merge, commit, push or integration occurred. Base dirty workflow-tool/mod defaults/layout/research/old panel work and `/tmp/herdr-remote-cache-prototype` were not touched. Helper and mod versions must still deploy together under the existing compatibility contract.

## Owned shutdown

Both independent axis results passed transport identity/hash verification and were acknowledged. Owned terminals t178 and t177 were killed and removed. Resource observations confirmed shutdown for both runs, and app inventory showed neither terminal remained. No owned service was started. Parent owns this review terminal's closure, completion receipt, tracker verdict comment, projections and publication.

## Verdict

SUCCESS for the frozen source. Standards: 0 findings. Spec: 0 findings. No required code change remains from this review.

