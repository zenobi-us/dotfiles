---
created_at: 2026-11-22T09:23:50.326Z
review_base_commit: b4928a424bd5b0cc853fab18bf1a070c51894893
source_commit: 53bd338d03bed788b9a716372dffba7ad5b6719a
source_tree: ac78aa317fb940477a765233356411e7ad2f3e1f
title: skill-contract-manifests-08-worktree independent review attempt 6
type: Review
verdict: FAILURE
---

# Independent worktree review attempt 6

Verdict: FAILURE. Standards: one P2 finding, STD-1. Spec: no findings.
Timestamp: 2026-11-22T09:23:50.326Z.

## Identity and scope

Ticket: tracker/tickets/skill-contract-manifests-08-worktree.md (local-markdown).
Initiative: tracker/initiatives/skill-contract-manifests/index.md.
Publication checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.
Frozen source workspace: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/resolve-skill-contract-manifests-08-worktree-finish.
Source branch: resolve/skill-contract-manifests-08-worktree-finish. Base branch: master.
Frozen commit: 53bd338d03bed788b9a716372dffba7ad5b6719a.
Frozen tree: ac78aa317fb940477a765233356411e7ad2f3e1f.
Fixed review base: b4928a424bd5b0cc853fab18bf1a070c51894893.
Reviewer pane: t20m. Assigned session/run/operation: dac870b3-678f-4597-9d41-7e789d16eda8.
Comparison: git diff b4928a424bd5b0cc853fab18bf1a070c51894893...53bd338d03bed788b9a716372dffba7ad5b6719a.
The review covers all 51 changed files, contract adoption, bundle metadata, and source-transition repairs.
Original source feature/skill-contract-manifests-08-worktree at 8ce850b641b29d052f9549f956f93dfd655e2c6b remains untouched.
Review-start-0038 is a normal same-source start after fix-complete-0037. It requests no source transition.
Prior approvals and review-start-0026 remain historical. Prior SUCCESS does not approve this source.

## Standards

FAILURE. Fresh helper run 7dd6da5c-8b60-42b5-acbf-0c0bcab7701e reviewed documented rules and the full code-review smell baseline.
The helper found one hard permanent-test-policy violation. No additional supported consumer-visible smell or standards defect was found.
No applicable ADR adds a requirement; the indexed ADR concerns Pi Ink cleanup.

### STD-1: Remove incidental stderr wording assertions

Severity: P2. ADR: none applies.
File: mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts:670. Related lines: 213 and 217.
Hard violation of the permanent-test policy: incidental wording tests MUST be deleted, not re-pinned. The assertions `stderr.toContain("does not match its parent")` at lines 213 and 670 bind rejection coverage to obsolete prose. fix-complete-0037 records 222 passing and seven failing cases solely from these assertions. This blocks validation despite correct rejection behavior. The same incidental assertion remains at line 217.

Required change: Delete the incidental wording assertions. Keep rejection exit-code checks, no-persist checks, and historical-byte preservation checks. Do not change runtime behavior or replace the expected prose.
Validation command after the fix: mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts
The governing rule requires deletion of wording/incidental implementation assertions, never replacement expected prose.
Meaningful rejection, no-persist and historical-byte assertions must remain.

## Spec

SUCCESS. Fresh helper run 46754793-f1e7-4a2d-aac9-a8e1d67cb800 found no supported missing requirement, incorrect implementation, or scope creep.

### AC1

Implemented. Owned receipt, coordinator, inspection/result, snapshot and projection definitions are declared. Tracker, delivery and shared-context contracts reference their owners. Shared manifest validation resolved every definition and upgrade procedure.

### AC2

Implemented. Current receipts use v3 and phase contexts use v2. Historical identities remain explicit. Shared frozenSource/sourceIdentityChanged checks detect unmarked strict source substitutions; approvedSourceTransition requires the exact approved candidate, original base and fresh review start. Both publication and diagnostics use sourceTransitionAncestryIssue. Prior SPEC-1 and SPEC-2 are addressed. Implementation/fix source advancement remains permitted.

### AC3

Actual-command regression coverage includes current/historical start, result delivery, inspection and recovery. Independently ran the candidate inspector against the canonical publication checkout: exit 0, worktree-inspection/v1, historyValid true, diagnostics empty, exact frozen commit/tree. Recovery requests a fresh review and keeps the ownership approval gate. Parent validation remains blocked by the two known incidental stderr assertions.

### AC4

Implemented. The pinned feature diff changes no retained workflow events, receipts or review artifacts. Readers preserve historical wire identities; publication remains append-only. This review changed no source or formal workflow records.

### AC5

Implemented. Mutable manifest/status updates use shared safeUpgrade and an owning validator. Immutable event/artifact paths, swapped families, ambiguous initiative values and unsupported conversions are rejected. Reviewed regression coverage checks preserved bytes, comments and unknown data. No new consumer-visible defect or scope creep found.

The independent review agrees that SPEC-1 and SPEC-2 are addressed.
Shared frozenSource and sourceIdentityChanged infer strict source changes without trusting source_transition.
Shared approvedSourceTransition requires a fresh review start, exact approval, matching candidate and unchanged base.
Shared sourceTransitionAncestryIssue checks Git ancestry for both publication and readers.
Legitimate implementation/fix commit advances remain allowed. Frozen review/submit/finish identities remain exact.

## Validation

This reviewer ran the actual candidate inspect.ts against the canonical publication checkout.
Exit: 0. Contract: worktree-inspection/v1. Receipt diagnostics: [].
Observed source commit/tree matched the frozen identities above. Recovery retained the ownership approval gate and selected review retry for the outstanding start.
An earlier inspector invocation from the source checkout observed its retained local history, not canonical current state; it is not current workflow evidence.
Both helpers independently ran the candidate inspector and shared manifest validator. Their commands passed. No helper ran tests, builds, lint or formatters.
Parent evidence fix-complete-0037 records 222 pass, 7 fail. All seven failures come from the two incidental stderr.toContain("does not match its parent") assertions at delivery-integration.test.ts lines 213 and 670.
This is the remaining validation blocker. This review did not rerun the full suite, those known failures, or prior reported bypasses.
Reviewed existing actual-command regressions cover start, result publication, historical reconciliation, inspection, recovery, and mutable-view preservation/rejection.
The review captured SHA-256 values for 54 existing immutable records. All 54 remained unchanged after inspection. Source status was clean.
No source files, tracker records, projections or commit metadata were changed.

## Coordination and resources

Used scoped ownership and incomplete-inventory assessment recorded in review-start-0038 and coordination-finish-0035.json.
Did not rerun the global inventory. No service resources were used. Unrelated sessions and sources remain untouched.
Both helper results passed transport binding/schema/hash checks and were acknowledged.
Standards hash: b6d7e97a80771acff6c46a53c85dd68d90af7d4e05fd2ba6f81192ccef0e7027. Spec hash: b0f10ed98dacd2fe57898523f965e65df6feb09d2afcc43914bf697eff7f9e27.
Observed both helper resources before normal hc kill/rm closure. Both helper terminals disappeared from herdr-app ls; main reviewer pane t20m remains open.
Standards shutdown confirmed: PID 2278302, boot 1093b557-9bca-45b2-a143-4217cd820f51, startTicks 4449802, stopped.
Spec shutdown remains pending: PID 2278222, same boot, startTicks 4449800, reported running after terminal closure.
No direct signal was sent to that process. Parent must resolve the remaining owned-process shutdown uncertainty before cleanup.
Acceptance verdict and cleanup status are separate.

## Inputs and outputs

Inputs: canonical ticket and initiative, current candidate playbooks/contracts, review-start-0038, fix-0036, fix-complete-0037, review-0033, prior review artifact, and coordination-finish-0035.
Output artifact: workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0039.md.
Output receipt: workflows/skill-contract-manifests-08-worktree/events/review-0039.yaml.
This artifact is the single review body. The parent owns tracker/projection updates and the next fresh fixer.

## Exact changed scope

- **Path:** `bun.lock`
- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/contracts.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/package.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/CHANGELOG.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/SKILL.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/contracts.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/concurrency.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-error-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/integration-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/pr-draft-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v3.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-result-v1.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-upgrade.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v2.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v3.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/fix.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/review.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/start.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/context-resolution.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/context-resolution.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/contract-identity.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/goal-contract.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-contract.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/source-transition.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-view.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/types/versioned-imports.d.ts`

## Axis totals

Standards: 1 finding; worst P2 (STD-1). Spec: 0 findings.

