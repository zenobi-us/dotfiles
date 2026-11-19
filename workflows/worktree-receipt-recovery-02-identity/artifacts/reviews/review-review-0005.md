---
description: Frozen source review for worktree-receipt-recovery-02-identity
reviewed_commit: 29c1f3244006803965c13655f8de9ae3b642c8fb
reviewed_tree: 96648df74d25b9edbb372b94e06248b3d8eb9794
timestamp: 2026-11-19T11:35:40.831Z
title: "Independent review: generated receipt identity"
type: Concept
verdict: FAILURE
---

# Review: worktree-receipt-recovery-02-identity

Verdict: FAILURE. Standards: SUCCESS. Spec: FAILURE.

## Identity

Ticket: `tracker/tickets/worktree-receipt-recovery-02-identity.md`.
Source branch: `feature/worktree-receipt-recovery-02-identity`. Base branch: `master`.
Reviewed commit: `29c1f3244006803965c13655f8de9ae3b642c8fb`.
Reviewed tree: `96648df74d25b9edbb372b94e06248b3d8eb9794`.
review_base_commit: `4e6557501f08719e627a93ce7ed00f008fa5c79d`.
Timestamp: 2026-11-19T11:35:40.831Z.

## Scope

Reviewed the pinned three-dot diff and exact base-to-source file list. The 12 product paths match review-start-0004. Excluded tracker/workflow metadata that is newer on the base. No source, tests, configuration, projections, or tracker records were changed.

Changed scope:
- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/concurrency.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/finish.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/fix.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/review.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/start.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/submit.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`

Affected contracts:
- **Contract:** worktree-phase-context/v1 authorization.
- **Contract:** worktree-receipt/v2 publication and retained v1 semantics.
- **Contract:** result-delivery session/run binding.
- **Contract:** frozen review/source identity.
- **Contract:** parent and child receipt producers.

## Standards

No blocking documented-standard violations or actionable heuristic smells found in the changed implementation and receipt guidance. Reviewed commit 29c1f3244006803965c13655f8de9ae3b642c8fb against 4e6557501f08719e627a93ce7ed00f008fa5c79d. Read canonical CONTEXT-MAP.md, CONTEXT.md, docs/agents/domain.md, ADR index, ticket, and initiative. The listed Pi Ink ADR does not apply. The writer preserves new v2 publication and retained v1 support. Source inspection and focused writer scenarios covered separate execution directories, implementation identity observation, frozen review rejection, and retained v1 handoffs. Excluded unrelated metadata. No full suite, lint, or formatter ran.

No blocking findings. No applicable ADR.

## Spec

Reviewed all seven ticket acceptance criteria against the frozen diff and canonical ticket/initiative. Source-root canonicalization, observed Git identity, wrong-checkout rejection, frozen review checks, execution-directory separation, and documented producer migration are present. Installed v2 was preserved. Two blocking gaps remain: unrestricted new full-envelope v1 publication bypasses context validation; failed parent completion incorrectly requires clean frozen source and cannot preserve partial implementation. Both findings use NO ADR; the ADR index contains no applicable decision. No unrelated metadata findings or scope additions.

### SPEC-01: high; NO ADR

Location: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts:36`.

Requirement: 'Obtain ticket, workflow, parent receipt, and session identity from validated phase context. Reject missing or inconsistent identity before publication.' A caller can omit --phase-context and submit any full v1 envelope. There is no retained-event, retained-handoff, or explicit-repair check. The existing isolated publication test creates a new v1 result without its parent event and publishes it successfully. This bypasses generated identity and the v1 restrictions in generateReceipt.

Required change: Require generated phase context for new publication. Gate any full-envelope legacy path on independently verified retained identity or explicit repair authorization, while preserving retained v1 support.

Validation command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts --test-name-pattern 'phase writer publishes authoritative YAML and a verifiable result in one operation'`. Add a regression for the described rejected or accepted case; current passing tests do not prove its correction.

### SPEC-02: high; NO ADR

Location: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts:41`.

Requirement: start playbook step 9 says 'append an accurate failed/blocked phase-complete receipt and keep the worktree and partial source.' Every phase-complete is now frozen, including failed implementation completion with result_missing:true. Lines 58 and 75 reject advanced partial commits; line 76 rejects dirty partial work. An isolated real-Git proof rejected a failed start completion with retained dirty source: 'Frozen source worktree has uncommitted changes'. The parent cannot record the required failed launch outcome without changing or discarding partial source.

Required change: Apply frozen identity and clean-source checks only to phases/outcomes that require reviewed or completed source. Permit failed/blocked implementation or fix closure to record observed partial source and preserve result_missing provenance.

Validation command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts --test-name-pattern 'generation observes implementation Git state'`. Add a regression for the described rejected or accepted case; current passing tests do not prove its correction.

## Acceptance coverage

| Criterion | Assessment | Evidence |
| --- | --- | --- |
| Validated ticket, workflow, parent, session | Partial | Generated path checks these fields. SPEC-01 leaves an envelope bypass. |
| One verified source root for both path fields | Implemented | Canonical root checks and actual writer smoke. |
| Observe branch, commit, tree at publication | Implemented | Git reads and scoped integration scenarios. |
| Preserve frozen review identity | Implemented | Dirty/advanced review rejection tests passed. |
| Separate execution directory and finish source | Implemented | Writer smoke ran outside both checkouts; parent finish scenario passed. |
| Migrate parent and child producers; preserve legacy semantics | Partial | Playbooks use generated context. SPEC-01 and SPEC-02 block full acceptance. Current v2 and retained v1 remain supported. |
| Alternate execution directory and wrong checkout | Implemented | Actual writer smoke and integration rejection scenarios passed. |

## Validation

| Check | Observed result |
| --- | --- |
| `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts` | 125 passed; 0 failed; 673 assertions; 7 files. |
| Independent actual writer smoke | Published v2 parent and child from a third execution directory; both source paths and commit matched. Wrong operation ID rejected before event and transport writes. Temporary fixture removed. |
| Standards focused runtime scenarios | 3 passed; 0 failed; 18 assertions. Covered observed implementation state, frozen review rejection, retained v1 handoff. |
| Spec legacy publication proof | Existing actual writer test passed while accepting new full-v1 input without phase context or an existing parent. This proves SPEC-01. |
| Spec failed closure proof | Isolated real Git plus generateReceipt rejected dirty partial source on failed start completion with result_missing:true. Temporary fixture and script removed. |

No typecheck was repeated. The parent reported missing default bundle tsc configuration and unrelated whole-bundle declaration errors. Existing passing tests do not cover both blocking requirements.

## Integration hazards

Use the source writer for generated context until this branch is integrated. The installed base writer lacks this context interface. Preserve v2 publication and retained v1 history. Later integration must reconcile concurrent receipt documentation changes without restoring envelope-copy producers.

## Result

Standards: 0 findings; no blocking issue. Spec: 2 findings; both high severity. Review execution completed, but the source verdict is FAILURE. The parent owns the tracker verdict and phase-complete receipt.

