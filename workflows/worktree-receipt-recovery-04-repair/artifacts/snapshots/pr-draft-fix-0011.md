---
description: Fix SPEC-1 and SPEC-2 with committed source and observed validation
title: "Fix draft: receipt path repair"
type: Concept
---

# Repair verified receipt path errors

## Ticket summary

Repair proven receipt path errors for `tracker/tickets/worktree-receipt-recovery-04-repair.md`. Use exact-plan approval and append-only supplements.

## Problem

The earlier implementation required a synthetic launch schema that no production launcher emitted. Its repair-only lock also allowed a normal writer to publish during final repair checks.

## Implementation summary

SPEC-1: replace synthetic launch schema with unchanged native muxer run.json plus checksum-bound retained v1/v2 phase-start source receipts. Bind pane, muxer, agent, checkout, ticket, workflow, phase, branch and source history; preserve original bytes. SPEC-2: use one publication lock for normal writer and repair; retain final inventory, tip, source and evidence checks under the lock through immutable append.

## Source

Commit: `07c1cc32fcc9d2012dd3a370236100034ad6f51f`. Tree: `183718852c78b9f84cce3deb3b514244ff67e998`. Branch: `feature/worktree-receipt-recovery-04-repair`. Base: `master`. Source commits: `3cdf8c17` and `07c1cc32`. Source is committed and clean. Commit hooks updated the source developer bundle to `0.2.62`; parent integration must preserve later base version history.

## Changed files

- **File:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/path-repair.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/publication-lock.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.test.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`

## Validation results

- **Scoped suite:** 11 tests passed, zero failed, 77 assertions on the exact committed source.
- **Actual CLI:** Disposable repair/inspect commands changed invalid fixture history to valid history. Missing evidence, changed checksums, lock contention and a competing writer's stale plan were rejected without partial repair. Original receipt, native run and retained source bytes remained unchanged.
- **Boundary regression:** An actual normal writer process attempted publication while apply held the common lock. A separate scenario published during apply before lock acquisition and invalidated the approved inventory.

See [validation results](../../artifacts/evidence/fix-0011/validation-results.json) and [CLI observations](../../artifacts/evidence/fix-0011/smoke-result.json). Earlier validation exposed a fixture variable shadow and an incidental wording assertion; both were corrected. No full-suite, typecheck, integration or independent review claim is made.

## Review history

1. [Implementation](../../events/implementation-0002.yaml) followed [start](../../events/start-0001.yaml); [parent completion](../../events/start-complete-0003.yaml) retained the original source.
2. [Review attempt 1](../../events/review-start-0004.yaml) stopped without a verdict. [Authorized takeover](../../events/review-takeover-0005.yaml) preserved that attempt.
3. [Review attempt 2](../../events/review-start-0006.yaml) produced [review-0007](../../events/review-0007.yaml) and [immutable findings](../../artifacts/reviews/review-review-0007.md). Verdict: FAILURE for `edf4e5585799abb093d1b8df3211fe72c72da93c`; Standards: no blocking findings; Spec: SPEC-1 and SPEC-2. [Review completion](../../events/review-complete-0008.yaml) remains unchanged.
4. [Ownership handoff](../../events/fix-handoff-0009.yaml) authorized [fix attempt 1](../../events/fix-start-0010.yaml). [Fix result](../../events/fix-0011.yaml) resolves both selected findings. Parent completion remains pending.

Internal implementation advisory checks were not independent review. The [original implementation draft](../../artifacts/snapshots/pr-draft-implementation-0002.md) remains unchanged.

## Resolved findings

- **SPEC-1:** Consume production-produced launch manifests and retained v1/v2 source receipts. Regression coverage includes session IDs distinct from run IDs and implementation commits after launch.
- **SPEC-2:** Serialize normal event publication and repair with one lock. Real competing processes cannot append inside the repair boundary; a winning earlier publication makes the plan stale.

## Remaining findings

No selected finding remains unresolved by this fixer. Independent review must verify both contract changes.

## Latest reviewer verdict

No current verdict covers `07c1cc32fcc9d2012dd3a370236100034ad6f51f`. The retained FAILURE verdict applies only to the old source. Fresh independent review is required.

## Merge status

Not integrated, pushed, or marked complete. No historical repair was authorized or applied. The base-only inspector correction `9f693d9b` was not cherry-picked or rebased into source. Parent integration must combine the common-lock change with the newer generated-context writer and preserve the inspector correction. Workflow artifacts remain uncommitted for the parent's metadata commit.

