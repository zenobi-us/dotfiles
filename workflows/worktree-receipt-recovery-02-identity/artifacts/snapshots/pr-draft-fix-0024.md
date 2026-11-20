---
description: Fix attempt 3 for worktree-receipt-recovery-02-identity
source_commit: 05c403f8b9707d11418c07756d334335b139e32b
source_tree: 49d6b3b7ffc0c6d6478e52a0031acd9ad719a423
title: SPEC-2 retained branch fix
type: Concept
---

# Fix attempt 3: SPEC-2

## Scope

Consumed review: [review-0020](../../events/review-0020.yaml), [immutable review](../reviews/review-review-0020.md). Resolved: SPEC-2. Unresolved: none. SPEC-1 remains not adopted. NO ADR.

Resolve SPEC-2 by checking the observed source branch before retained full-v1 child publication. Reject mismatches before event or transport writes. Preserve parent-event Git-object repair semantics and original retained bytes.

## Source

Branch: feature/worktree-receipt-recovery-02-identity. Base: master. Commit: 05c403f8b9707d11418c07756d334335b139e32b. Tree: 49d6b3b7ffc0c6d6478e52a0031acd9ad719a423. Source is committed and clean. No rebase, merge, push, tracker change, or source workflow write occurred.

## Changed files

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`

Commit hooks updated developer plugin and marketplace version metadata.

## Validation

- **Scoped suite:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts — 130 pass, 0 fail, 739 assertions, 7 files; 44.00s.
- **Actual writer CLI:** /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-02-identity/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts --repository /tmp/spec2-writer-smoke-o1Vv77/repo --input /tmp/spec2-writer-smoke-o1Vv77/input.json. Wrong branch at the same commit/tree: exit 1, no authoritative event or assigned transport. Matching branch: exit 0, both published. Retained parent bytes unchanged. Isolated fixture removed.
- **Known baseline:** Missing TypeScript/LSP and unrelated whole-bundle errors were not rerun. No exported API changed. The review supplied the failing observation; this fix did not rerun it merely to confirm failure.

## History and next action

Earlier review and fix events remain immutable. See [previous fix snapshot](pr-draft-fix-0016.md), [implementation](../../events/implementation-0002.yaml), [previous fix completion](../../events/fix-complete-0017.yaml), and [review completion](../../events/review-complete-0021.yaml).

Latest historical verdict remains FAILURE on c54b293d8e3079803babe8e4a5dbb075f95d749b. That review is stale for the new source. A fresh formal review is required. No new verdict is claimed. Parent owns fix-complete-0025, workflow commits, acknowledgement, terminal closure, and shutdown verification. No services or child agents were created.

