---
description: Frozen source formal review
reviewed_commit: 542aeda624bf79ca1df866e939402f9e68d69955
reviewed_tree: d0bbad25b4c5af2e76bd8d41de8bc1098bf38820
timestamp: 2026-11-19T21:09:42.792Z
title: "Independent review: generated receipt identity"
type: Concept
verdict: FAILURE
---

# Independent review: generated receipt identity

Review frozen receipt publication behavior for the parent coordinator.
Reader: workflow coordinator and fixer. Date: 2026-11-19T21:09:42.792Z.

## Overview

Verdict: FAILURE. Standards: SUCCESS. Spec: FAILURE. SPEC-03 blocks acceptance because generated v1 publishes a child result against the wrong phase-start. Fix the parent-phase check before another review. This review does not authorize integration.

Contents: [Identity and scope](#identity-and-scope), [Standards](#standards), [Spec](#spec), [Validation](#validation), [Session closure](#session-closure).

## Identity and scope

Ticket: tracker/tickets/worktree-receipt-recovery-02-identity.md. Initiative: tracker/initiatives/worktree-receipt-recovery/index.md.
Source branch: feature/worktree-receipt-recovery-02-identity. Base branch: master.
Reviewed commit: 542aeda624bf79ca1df866e939402f9e68d69955. Reviewed tree: d0bbad25b4c5af2e76bd8d41de8bc1098bf38820.
Review base: ad767be42a5d34593b45a5e0455b953145bda559. Attempt: 2. Parent: review-start-0011.
Exact diff: git diff ad767be42a5d34593b45a5e0455b953145bda559...542aeda624bf79ca1df866e939402f9e68d69955.

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

Affected producer/consumer contracts:
- **Phase authorization:** worktree-phase-context/v1 feeds generated identity through phase-context.ts to write-result.ts.
- **Retained history:** worktree-receipt/v1 retained phase-starts feed generated or full-envelope child results and inspector recovery.
- **New publication:** worktree-receipt/v2 parent and implementation, review, fix, submit, finish producers use the generated writer.
- **Delivery binding:** assigned result-delivery run/operation identity binds generated child publication to immutable transport.

Coordination: no target reservations or hard blockers. Cross-initiative inventory is incomplete because linked copies are stale, historical goal kinds differ, and an unrelated worktree is absent. These checks prove isolated source behavior, not integration compatibility. No applicable ADR.

## Standards
Verdict: SUCCESS. No blocking documented-standard violations or actionable heuristic findings. NO ADR applies.

Reviewed the exact three-dot diff from ad767be42a5d34593b45a5e0455b953145bda559 to 542aeda624bf79ca1df866e939402f9e68d69955, including generated identity, retained v1 gating, partial-source closure, publication, integration scenarios, playbooks and plugin versions.

Standards sources: injected AGENTS.md; CONTEXT-MAP.md; CONTEXT.md; docs/agents/domain.md; docs/adr/index.md; worktree references/receipts.md and references/concurrency.md. The implementation keeps authoritative events separate from transport, retains exclusive publication, resolves workflow identity independently, and uses the existing receipt validation and parent-diagnostic boundaries.

The smell baseline produced no actionable findings. Repeated playbook instructions point to the common receipt contract; they do not introduce separate implementations.

Validation: static diff and contract inspection only. No build, lint, test or formatter ran, as instructed. No source, tracker, configuration or workflow records changed. Runtime correctness remains outside this axis evidence.

## Spec

Spec verdict: FAILURE. One medium finding; NO ADR. Reviewed commit 542aeda624bf79ca1df866e939402f9e68d69955 and tree d0bbad25b4c5af2e76bd8d41de8bc1098bf38820 against ad767be42a5d34593b45a5e0455b953145bda559. Compared the complete canonical ticket and initiative. The initiative exists at tracker/initiatives/worktree-receipt-recovery/index.md, not the supplied flat filename. SPEC-01 is substantially fixed: new full envelopes require generated context, and retained full-v1 input requires matching identity or checksum-bound approval. SPEC-03 identifies the remaining inconsistent-parent gap in generated v1. SPEC-02 is fixed in source: failed/blocked missing-result closure observes partial commit/tree and dirty state; successful completion and retained-result closure remain frozen. Frozen review identity, alternate execution directory, observed Git identity, wrong-checkout rejection and migrated producer guidance are present. New v2 execution is the approved prerequisite contract, not a finding. Validation: static inspection only. No build, lint, test or formatter ran, as instructed. Source, tracker and workflow artifacts remain unchanged.

### SPEC-03: medium; NO ADR

Location: [phase-context.ts:14](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-02-identity/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts#L14), and [write-result.ts:115-119](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-02-identity/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts#L115-L119).

Requirement: "Obtain ticket, workflow, parent receipt, and session identity from validated phase context. Reject missing or inconsistent identity before publication." Generated v1 accepts any retained v1 phase-start, without checking that its phase matches the requested child phase. A fix result can therefore name an implementation start. The generated path checks the attempt, ticket, workflow and source, but writer relationship validation runs only for v2. Unlike the full-v1 gate, this path publishes and delivers the inconsistent result.

Required change: For generated v1 child publication, require parent.phase to equal context.phase, with implementation mapped to start. Reject mismatches before receipt and transport writes. Preserve historical v1 bytes.

Validation command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts --test-name-pattern "generated v1 identity"; extend this scenario with a fix result against a retained start-phase parent and assert rejection before both writes.`

Parent runtime confirmation: actual writer exited zero and wrote both an authoritative fix phase-result and its v1 transport result against a retained start-phase phase-start. This violates validated parent identity and blocks acceptance.

Prior findings: SPEC-01's unrestricted full-envelope path is gated. SPEC-02's failed/blocked partial-source closure now observes current source and dirty state. Passing scenarios cover both repairs; SPEC-03 remains a separate generated-v1 gap.

## Validation

- **Integration command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts`. Result: 130 passed, 0 failed, 725 assertions, 7 files. Ran once after both independent reports returned.
- **Actual CLI smoke:** `mise exec -- bun /tmp/review-0012-smoke.ts`, cwd /tmp. Isolated Git repositories and a Worktrunk source checkout published v2 parent and child from a third directory. Both source paths and observed commit/tree matched.
- **Wrong checkout:** alternate cloned checkout rejected before publication: 'Phase source checkout, branch or base does not match its parent'. No rejected child event existed.
- **Finding reproduction:** same actual CLI smoke confirmed SPEC-03: retained parent phase=start, generated result phase=fix, authoritative event written, transport result written, exit_code=0.
- **Verification limit:** default typecheck is unavailable; known whole-bundle declaration errors were not repeated. No integration candidate or merge was tested. No manual evidence run exists.
- **Preserved source:** no source, test, config, tracker, projection or manifest edits. Temporary fixtures and smoke scripts were removed after checks.

## Session closure

Standards run c885c174-d15a-4de3-8966-aa69e192447e and Spec run db51be94-3ef9-44d6-9558-bb3cd23b2321 ran in fresh parallel desktop tabs. Both delivered code-review-axis/v1 results. Parent verified each schema, axis, run/operation context and payload hash, then acknowledged them.

Both owned terminals and tabs were removed. Owned OMP processes remained after terminal closure and SIGTERM. Fresh PID/start-tick/run checks preceded SIGKILL for only those owned processes. Final resource observations confirmed shutdown for both; unrelated sessions and the source workspace remained open.

Standards: 0 findings, no worst issue. Spec: 1 finding, worst severity medium (SPEC-03).

