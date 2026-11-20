---
description: Frozen source receipt identity review
timestamp: 2026-11-20T00:14:44.820Z
title: Review review-0020
type: Concept
verdict: FAILURE
---

# Review review-0020

Review receipt identity generation for the parent workflow owner. Date: 2026-11-20T00:14:44.820Z.

## Overview

Verdict: FAILURE. One confirmed blocking finding: SPEC-2 (medium). Standards reported zero findings. Spec reported two findings; the central assessment below retains one. No architecture decision record applies (NO ADR).

Ticket: [worktree-receipt-recovery-02-identity](../../../../tracker/tickets/worktree-receipt-recovery-02-identity.md). Initiative: [worktree-receipt-recovery](../../../../tracker/initiatives/worktree-receipt-recovery/index.md).

Source branch: `feature/worktree-receipt-recovery-02-identity`. Base branch: `master`. Frozen source commit: `c54b293d8e3079803babe8e4a5dbb075f95d749b`. Frozen tree: `25ea26786dbeaf944d4bee9fcf64629f4da78a3e`. Review base: `ede2412a00f33f71cac0317ad00dfa03382181a7`. Attempt: 3. Parent: review-start-0019.

Scope is the full three-dot diff, not only the last fix. Source identity and clean status remained exact. The parent owns acknowledgement, phase-complete-0021, tracker comments, projections and commits. No source, test, configuration or tracker changes were made.

## Standards

Reviewed the full frozen diff from ede2412a00f33f71cac0317ad00dfa03382181a7 to c54b293d8e3079803babe8e4a5dbb075f95d749b. No documented-standard breaches or actionable baseline smells found. Sources: AGENTS.md, CONTEXT-MAP.md, CONTEXT.md, docs/agents/domain.md, and the worktree skill and receipt references. The changed writer separates phase context from outcomes, retains explicit v1 compatibility and repair paths, and uses existing envelope and parent validators. The playbooks document the generated-context interface. No relevant ADR applies (NO ADR). Static review only. No checks ran, as instructed; the central reviewer owns runtime verification.

Axis run: `788a7df4-d605-4f22-8be9-1ae789978078`. Its typed report was verified and acknowledged.

## Spec

FAILURE. Two requirements remain partial. Retained v1 child results have generated identity, but retained v1 parent completion and finish records do not. The retained full-envelope path also skips observed branch validation. Generated v2 publication checks the source root, parent source, frozen commit/tree, and assigned run/operation IDs. The producer playbooks now request phase context. Reviewed the full frozen diff at c54b293d8e3079803babe8e4a5dbb075f95d749b against ede2412a00f33f71cac0317ad00dfa03382181a7, the ticket, initiative, and domain index. No applicable ADR. Static review only; no checks ran, as instructed.

### SPEC-1: high

Spec: ‘Update parent, implementation, review, fix, submit, and finish receipt producers to use generated identity. Keep worktree-receipt/v1.’ The v1 guard permits only phase-result children with an assigned handoff and a phase-start parent. Parent writes deliberately omit the handoff. Therefore retained v1 parent completion, checkpoints, and finish cannot use generated v1 identity. The full-envelope fallback also rejects these records without checksum-bound repair approval. Normal retained-v1 reconciliation must change schema or become an authorized repair.

Location: [phase-context.ts:14](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-02-identity/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts#L14). ADR: NO ADR.

Required change: Support generated parent lifecycle and finish records for retained v1 phases without consuming the child handoff. Preserve retained source and parent identity. Keep the prohibition on new v1 executions separate from retained-phase completion.

Validation: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts (add retained-v1 parent completion and finish scenarios)`

### SPEC-2: medium

Spec: ‘Read the source branch, commit, and tree through Git at publication. Compare observed identity with the applicable phase expectations.’ A retained full-v1 envelope checks HEAD commit/tree and copied parent fields, but never observes the current branch. Switching the same source worktree to another branch at the same commit leaves every check satisfied. The writer can publish the old branch identity despite the changed source branch.

Location: [write-result.ts:75](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-02-identity/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts#L75). ADR: NO ADR.

Required change: Check the observed source branch for retained full-v1 publication as well as generated publication. Reject a mismatch before writing the event or transport result.

Validation: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts (add full-v1 same-commit wrong-branch rejection)`


Central assessment: SPEC-2 is confirmed and blocks acceptance. The actual source writer published a retained full-v1 child with source_branch=main while Git reported wrong-branch at the same commit/tree. Fix the retained full-envelope path before publication. SPEC-1 is not adopted as a blocking finding: the current protocol already requires new executions to use v2 and explicitly permits mixed parent chains. A new v2 parent record can close retained v1 history without rewriting it. The ticket wording does not require every newly appended parent record to remain v1. The independent report remains unchanged below.

Axis run: `bc4bb10d-511c-416d-b67f-f5955f9399db`. Its typed report was verified and acknowledged.

## Verification

The central reviewer ran the scoped suite once: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts`. Result: 130 pass, 0 fail, 734 assertions across seven files.

The actual changed writer ran in throwaway Git fixtures, not in permanent tests. It published parent and child results with real `--phase-context` from another execution directory. The child event and assigned transport existed. Wrong-checkout and frozen-review commit changes failed before event publication. Retained v1 bytes remained unchanged. A separate actual full-v1 publication reproduced SPEC-2. Both fixtures were removed. An initial fixture attempt lacked required inputs/outputs; the corrected setup supplied those fields.

Known missing-tsc and unrelated whole-bundle errors were not rerun. No integration candidate, merge, push, or deployment was performed.

Both child panes were closed and removed through hc. The app no longer lists them. Resource observations still report shutdown=pending for owned processes. Standards PID 354353 was observed in job-control state Tl after pane removal. This is a cleanup limit, not proof of source failure. The parent must resolve these retained resource identities before claiming confirmed shutdown. No broad process signals were sent. No service was launched.

## Contracts and scope

The three-dot review uses merge-base 069c400b6db7ea7eaee46bf0ffa1593deab4cf19. The direct source-to-base comparison contains 176 changed files, including base-only workflow inspection, blocker, model, and session-preparation work. These differences are not source invalidation. The base has no phase-context writer interface; use the installed full-envelope writer only to publish this review. The source writer must be deployed with its updated playbooks. No result-delivery/scripts/delivery.ts difference exists across the frozen source and base. Recheck the integrated candidate against the exact review checks before integration; this review does not authorize integration. The retained coordination snapshot reports incomplete inventory and an overlap risk for muxer work on receipts and workflow inspection. Preserve stale copies and malformed legacy goal events.

Affected contracts:
- **Contract:** generated receipt phase context
- **Contract:** retained worktree-receipt/v1
- **Contract:** worktree-receipt/v2
- **Contract:** result-delivery session binding

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

Review inputs include review-start-0019, fix-0016, fix-complete-0017, the fix-0016 draft snapshot, implementation-0002, the ticket, initiative, and domain entry points. Prior reviews remain history; they do not determine this verdict.

Axis totals: Standards 0, worst none. Spec 2 reported, worst high; central assessment confirms 1 medium blocker.

