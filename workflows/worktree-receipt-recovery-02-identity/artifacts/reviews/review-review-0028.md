---
description: Independent frozen-source worktree identity review
title: Review review-0028
type: Concept
---

# Review review-0028

Verdict: **FAILURE**. One medium blocking finding, SPEC-3. Standards has one non-blocking maintenance advisory.

## Identity and scope

Ticket: [worktree-receipt-recovery-02-identity](../../../../tracker/tickets/worktree-receipt-recovery-02-identity.md).

Timestamp: 2026-11-20T02:13:50.977Z. Source branch: `feature/worktree-receipt-recovery-02-identity`. Base branch: `master`.

Reviewed commit: `05c403f8b9707d11418c07756d334335b139e32b`. Tree: `49d6b3b7ffc0c6d6478e52a0031acd9ad719a423`. Review base: `70ef86af8dcbad6fec67008873675b80629089e8`. The source remained clean and frozen.

Full diff: `git diff 70ef86af8dcbad6fec67008873675b80629089e8...05c403f8b9707d11418c07756d334335b139e32b`. All 12 changed files were in scope:

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

- **Contract:** generated receipt phase context
- **Contract:** retained worktree-receipt/v1
- **Contract:** worktree-receipt/v2
- **Contract:** result-delivery session binding

## Central validated finding

### SPEC-3 — Retained workflow-root compatibility (medium, NO ADR)

File: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts:31`.

The ticket requires: “Keep the execution directory separate from the source worktree.” The initiative requires: “Use one validation contract at publication and inspection.”

Retained history compatibility failure. The ticket requires identity from validated phase context and execution-directory separation. The initiative requires one validation contract for publication and inspection. phase-context.ts:31 requires exact parent workflow.root equality. workflow.ts:243-248 accepts a retained repository root equal to its source/repository after verifying the Git common directory. The actual inspector reports historyValid=true for this retained v1 parent; the actual generated v2 writer rejects it with "Phase parent does not match the resolved workflow" when publication runs through a separate linked context checkout. This blocks supported retained-chain continuation. This is new root-compatibility evidence, not the rejected schema-version claim.

Required change: Reuse the inspector’s verified repository-root compatibility rule when validating the parent. Keep store and ref strict, verify the Git common directory, preserve retained parent bytes, and generate the new receipt with the resolved current workflow root. Add a retained-v1-parent scenario whose workflow.root is the source checkout while publication resolves through a separate checkout.

Validation command:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts
```

The actual inspector returned exit 0 and `historyValid=true`. The generated writer returned exit 1: `Phase parent does not match the resolved workflow`. No event or transport appeared. Retained parent bytes stayed unchanged. The fixture used linked checkouts with the same Git common directory.

## Standards

Standards SUCCESS. No concrete hard repository-standard violation found. One non-blocking judgement heuristic: the five playbooks repeat the same generated-identity instructions already defined in receipts.md. Keep one authoritative contract and short phase-specific pointers. Reviewed frozen diff 70ef86af...05c403f8, including identity generation, writer compatibility checks, integration test changes, playbooks and release metadata. No relevant ADR applies. No tests, builds, lint or runtime checks ran, as instructed. The latest retained-v1 branch check is present; the rejected v1/v2 finding was not reopened.

STD-1 is a low, non-blocking judgement heuristic. The new playbook sections repeat the shared identity rules in `references/receipts.md`. Keep short pointers and phase-specific instructions. No relevant ADR applies.

Transport: file:///var/home/zenobius/.local/state/result-delivery/runs/767abfb6-7ca0-49b9-9df1-810aae95c663/result.json. SHA-256: `bba7c29ae4a9929731194074917527def9559fc22112626081c3d2b85597ec78`. The report was verified and acknowledged.

## Spec

One concrete compatibility gap remains at phase-context.ts:31. Generated publication rejects a retained parent root that the inspector explicitly accepts after Git-common-directory verification. This blocks continuation from source-local retained history through the separate context checkout required for v2. Reviewed generated source identity, frozen review checks, execution-directory separation, phase procedures, retained full/generated v1 paths, v2 parent relationships, and session/handoff binding. The latest full-v1 child branch check is present. No schema-version finding is reopened. Static review only; no tests, builds, lint, or runtime checks were run, as instructed. Reviewed commit: 05c403f8b9707d11418c07756d334335b139e32b.

Transport: file:///var/home/zenobius/.local/state/result-delivery/runs/2a7a1ede-1b0a-454e-85ba-5f700127ed94/result.json. SHA-256: `96b062a517664d9f8b538a4200dcf23e212ed72af9824f3c10dd104612ad431a`. The report was verified and acknowledged.

## Finding dispositions

The Spec axis called its new root-compatibility finding SPEC-1. Central review assigns SPEC-3 to distinguish it from the rejected historical schema-version claim. The axis report remains unchanged.

STD-1 is confirmed as an advisory only. SPEC-3 is confirmed by the actual inspector and writer. Prior SPEC-2 is resolved: retained full-v1 publication now rejects the wrong branch at the same commit before side effects.

The failing-before SPEC-2 observation remains in `events/review-0020.yaml`. This review did not rerun that old source or reopen the rejected v1/v2 claim.

## Validation

The scoped suite ran once:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts
```

Result: 130 pass, 0 fail, 739 assertions across 7 files. Bun 1.4.4; 42.75 seconds.

Actual source-writer CLI smoke checks used isolated Git fixtures. They covered retained-v1 wrong-branch rejection, matching publication, and unchanged parent bytes. Generated-context checks covered cross-directory parent start, child publication, finish publication, wrong checkout, dirty review, changed review commit, and wrong session. Rejections occurred before event or transport writes. Parent finish preserved the child transport.

A separate actual inspector/writer fixture confirmed SPEC-3. All throwaway Git fixtures were removed. Known missing default tsc, LSP installation, and unrelated whole-bundle baseline errors were not rerun.

## Base and integration hazards

Only review coordination and parent lifecycle records changed on master after the fixed review base. No source overlap in direct base movement. Incomplete coordination inventory and concurrent muxer/workflow streams remain integration compatibility hazards; no integration performed.

Observed master: `d36c26ffa7d71513070fe65226641ceac442a20a`. Direct base movement touched only `review-coordination-0027.json`, `review-approval-0026.yaml`, and `review-start-0027.yaml` in this workflow. It does not invalidate the frozen source.

Preserve unrelated stale linked records and malformed legacy goals. The coordination inventory is incomplete. No source integration, merge, rebase, push, source edit, tracker update, projection update, or source commit occurred.

## Axis lifecycle

Both axis results were typed, hash-verified, and acknowledged. Both sessions received Ctrl+D at their completed prompts before hc kill/rm. Router resource observations confirmed process shutdown for both runs. The app listing confirmed both child tabs were removed. The source workspace remains open.

The parent owns review-result acknowledgement, reviewer closure, review-complete-0029, the tracker verdict comment, projections, and commits.

## Verdict

**FAILURE**. Standards: one low advisory, no blocking violation. Spec: one medium compatibility failure, SPEC-3.

