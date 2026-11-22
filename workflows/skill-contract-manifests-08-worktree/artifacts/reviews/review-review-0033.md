---
created_at: 2026-11-22T09:03:07.885Z
review_base_commit: 70052a74b94854cf936b2cae5f6ed128a7ed6ebd
source_commit: 2c8ef45d4987cead7ba120d64e3e5c896575ebc2
source_tree: 3f61dab6d0018150e4a214b20f9e63e698d1c4c2
title: skill-contract-manifests-08-worktree independent review attempt 5
type: Review
verdict: FAILURE
---

# Independent worktree review attempt 5

This review assesses the frozen resolution for the workflow owner.
Date: 2026-11-22T09:03:07.885Z. Reader: the parent workflow owner.

## Overview

Verdict: FAILURE. Standards: 0 findings. Spec: 1 P2 finding, SPEC-2.
The marked-transition fix works. An absent marker still bypasses reader transition checks.
Fix SPEC-2 before a new independent review. This result does not authorize integration.

Navigation: [Identity and scope](#identity-and-scope), [Standards](#standards), [Spec](#spec), [Validation](#validation), [Lifecycle and coordination](#lifecycle-and-coordination), [Inputs and outputs](#inputs-and-outputs), [Exact changed scope](#exact-changed-scope).

## Identity and scope

Ticket: `tracker/tickets/skill-contract-manifests-08-worktree.md` (local-markdown).
Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.
Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/resolve-skill-contract-manifests-08-worktree-finish`.
Reviewer session: `t20c`. Run and operation: `8be7c169-532b-46e5-9afa-0c97cc8e61a9`.

Original source: `feature/skill-contract-manifests-08-worktree`.
Original commit: `8ce850b641b29d052f9549f956f93dfd655e2c6b`.
Original tree: `02afddcab23399930e7d9ce14c461b1c4e9684c2`.
Reviewed branch: `resolve/skill-contract-manifests-08-worktree-finish`.
Reviewed commit: `2c8ef45d4987cead7ba120d64e3e5c896575ebc2`.
Reviewed tree: `3f61dab6d0018150e4a214b20f9e63e698d1c4c2`.
Base branch: `master`. Fixed review base: `70052a74b94854cf936b2cae5f6ed128a7ed6ebd`.

The review covers the 51-file committed delta, inherited contract adoption, merge/version resolutions, and source-transition semantics.
The current review start is a normal same-source start after fix-complete-0031. It is not a new source transition.
The original approval and review remain historical evidence. Prior SUCCESS does not approve this resolution.

`git diff 70052a74b94854cf936b2cae5f6ed128a7ed6ebd...2c8ef45d4987cead7ba120d64e3e5c896575ebc2`

## Standards

No concrete documented-standard breach or actionable baseline smell found in 70052a74b94854cf936b2cae5f6ed128a7ed6ebd...2c8ef45d4987cead7ba120d64e3e5c896575ebc2. Reviewed AGENTS rules, owning contracts, skill-contracts, TypeScript and code-comment guidance.

AC1: The manifest declares owned receipt, coordinator, inspection/result, snapshot and projection contracts. Tracker, delivery and shared-context definitions remain owner references.
AC2: Current wire identities have new versions. Receipt validation, recovery/explorer ingestion and coordination use the compatible readers. approvedSourceTransition now retains the original base and matches the exact approved candidate. Both publication and diagnostics call sourceTransitionAncestryIssue. It rejects malformed hashes, unavailable objects and unrelated commits. Diagnostics without Git access reject unverifiable ancestry instead of treating approval as proof.
AC3: Reviewed actual-command regressions for start, result delivery, historical reconciliation, inspection and invalid candidate transitions. Independently ran the candidate inspect.ts against the canonical publication checkout: exit 0, exact frozen commit/tree, diagnostics empty. Recovery requests a fresh review and retains the unknown-ownership approval blocker. No build, lint, tests or formatter ran during this review; the supplied 218-test/1141-assertion result remains parent evidence.
AC4: Historical receipts retain their wire identities. Readers interpret history without rewriting it; current publication remains exclusive and append-only. The reviewed source diff does not change stored workflow history. Existing review-0018 does not approve this candidate.
AC5: Mutable manifest/status updates use shared safeUpgrade with an owning adapter. The adapter excludes immutable event/artifact locations, checks view families, preserves comments and unknown data, and rejects unsupported conversions. Rejection and read-only byte-preservation checks are present in the reviewed regressions; this review did not rerun them.

SPEC-1 from review-review-0027 is addressed by the shared ancestry check and unchanged-base structural gate. No source, tracker, workflow record or formal receipt was changed by this review.

Independent axis run: `b9eb2a84-9fed-4de5-8f81-13ae8a5ed9be`.
The parent verified its delivery binding and acknowledged hash `b9db7d234982a5203b7fb387d2c2bb82f09c50174d9d519fc391aded8a12fb21`.
No applicable architecture decision record imposes another rule on this change.

## Spec

FAILURE: one P2 finding. Reviewed frozen commit 2c8ef45d4987cead7ba120d64e3e5c896575ebc2 against fixed base 70052a74b94854cf936b2cae5f6ed128a7ed6ebd. AC1: Owned contracts and external owner references are declared; no competing tracker or delivery definitions found. AC2: Versioned producers/readers are coordinated, but an omitted transition marker bypasses reader authorization and ancestry validation. The latest fix closes the marked-transition case, not this case. AC3: Inspected actual owning-command regression coverage and retained repair evidence. Ran the candidate inspector from the publication checkout: exit 0, current inspection schema, historyValid true, no diagnostics, exact frozen source commit/tree. Recovery correctly requests a fresh review; review-0018 is not current approval. Replayed the complete retained graph in memory to establish the finding. Did not run tests, builds, lint or formatters. Parent reports 218 tests and 1141 assertions. An initial invocation used the base checkout binary; its historical-schema rejection is not a candidate finding. AC4: The reviewed delta does not change stored events or review artifacts. Historical readers preserve retained identities; this review changed no source or workflow file. AC5: Safe upgrades are limited to generated manifest/latest-status artifacts, with declared paths, owner validation, preservation checks and rejection boundaries. Existing command regressions cover rejected-write byte equality. No additional concrete scope or upgrade defect found.

Independent axis run: `d8d16109-d3db-42db-a34a-a79f0b3d37ff`.
The parent verified its delivery binding and acknowledged hash `6b122ac9786e2d48b2877ea822ed34b8216189d18379c5d37827d067a6b05ae1`.
The helper used local identifier SPEC-1. This artifact assigns SPEC-2 to distinguish this absence case from the prior marked-transition finding.

### SPEC-2: An absent marker bypasses reader transition checks

Severity: P2. ADR: none applies.
File: [receipt-diagnostics.ts:28–62](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/resolve-skill-contract-manifests-08-worktree-finish/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts#L28-L62).

The ticket requires: “update current producers and all consumers, including recovery and explorer readers, together.”
The initiative requires: “Validate artifact content against its declared source contract.”

Both reader checks depend on `source_transition != null`.
Without that field, the reader does not require the exact approved candidate or validate transition ancestry and the original base.
The writer still rejects a changed checkout, branch, or base at [phase-context.ts:82–94](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/resolve-skill-contract-manifests-08-worktree-finish/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts#L82-L94).
Thus retained history can pass diagnostics even though the owning writer rejects the same transition.

The Spec helper replayed the complete event graph in memory.
It removed the marker from review-start-0026 and substituted the fixed base commit and its real tree.
The approval still named the original candidate. The reader returned no diagnostics.
The writer rejected the phase source mismatch.

The reviewer independently exercised a different case against the retained graph.
It removed only the marker and changed `base_branch` to `unapproved-base`.
No stored event changed. Actual output:

```text
Unmarked changed-base retained graph diagnostics: []
Writer rejection: Phase source checkout, branch or base does not match its parent
```

Required change: Detect source checkout, branch, and base transitions from parent/child identities, independently of the marker.
For a transition, require its marker and the exact approved candidate. Then apply the shared ancestry and unchanged-base checks.
Keep legitimate implementation/fix commit changes valid. Preserve historical bytes.
Add actual inspector regressions for absent-marker and mismatched-candidate histories.

Validation command after the regression exists:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts --test-name-pattern 'source candidate|source transition'
```

## Validation

- **Actual inspector:** Candidate inspect.ts ran from the designated base checkout. Exit 0. The frozen source matched and receipt diagnostics were empty.
- **Missing-marker smoke:** The temporary Bun script exercised both owner APIs against the complete graph in memory. Exit 0 reproduced SPEC-2.
- **Manifest validation:** The shared contract owner resolved all manifest definitions and upgrade procedures. Exit 0.
- **Parent suite evidence:** fix-complete-0031 records 218 passing tests and 1141 assertions. This review did not repeat that suite.
- **Latest fix evidence:** fix-0030 records valid ancestry acceptance and non-descendant, changed-base, unavailable-object, and invalid-commit rejection. This review read the exact new regression.
- **Global inventory limit:** An additional coordination CLI observation exceeded the 60-second evaluation deadline. No report was captured. The reviewer terminated its owned orphan command.
- **Immutable history:** A pre-publication snapshot covers 45 existing receipt/artifact files. Publication must preserve each hash. No source, tracker, or projection changed.

Selected integration checks:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts
/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/resolve-skill-contract-manifests-08-worktree-finish/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts tracker/tickets/skill-contract-manifests-08-worktree.md --json
```

Affected contracts:
`worktree-receipt/v1`, `worktree-receipt/v2`, `worktree-receipt/v3`, `worktree-phase-context/v2`, `worktree-goal/v2`, `worktree-inspection/v1`, `worktree-coordination/v2`, `worktree-workflow/v3`, `worktree-latest-status/v2`, `worktree-integration/v2`, `shared-context-resolution/v1`.

## Lifecycle and coordination

review-start-0032 records the scoped ownership approval and incomplete global inventory assessment.
Unrelated stale linked tracker copies, historical goal records, and an unrelated missing prototype do not establish a competing source owner.
The live inspector retains unknown ownership as a recovery gate. This review uses the scoped authorization, not an empty-inventory assumption.
No shared service was used. The parent retains the integration decision and final checks.

Both axis reviewers ran fresh parallel sessions at depth 2. They wrote no source or formal workflow receipts.
Their results passed transport verification and acknowledgement.
The reviewer recorded resources before closure, closed only the helper terminals, and retained confirmed shutdown observations.
The app no longer lists either helper pane. The main review pane remains for the parent.

## Inputs and outputs

Inputs:
- **ticket:** `tracker/tickets/skill-contract-manifests-08-worktree.md`.
- **initiative:** `tracker/initiatives/skill-contract-manifests/index.md`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/review-start-0032.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/fix-0030.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/fix-complete-0031.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/review-0027.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/review-complete-0028.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/candidate-approval-0025.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/finish-approval-0024.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/fix-0015.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/review-0018.yaml`.
- **receipt:** `workflows/skill-contract-manifests-08-worktree/events/review-complete-0019.yaml`.
- **snapshot:** `workflows/skill-contract-manifests-08-worktree/artifacts/snapshots/pr-draft-fix-0030.md`.
- **review:** `workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0027.md`.

Outputs:
- **Review artifact:** `workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0033.md`.
- **Review receipt:** `workflows/skill-contract-manifests-08-worktree/events/review-0033.yaml`.

The candidate write-result.ts command owns the single authoritative receipt and its assigned transport result.
The parent owns tracker comments, projections, metadata commits, and integration.

## Exact changed scope

```text
bun.lock
mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/contracts.md
mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
mise/conf.d/devtools-agent/bundles/developer/package.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/CHANGELOG.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/SKILL.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/contracts.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/concurrency.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v2.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v2.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-error-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/integration-v2.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v2.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v2.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/pr-draft-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v2.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v3.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-result-v1.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-upgrade.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v2.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v3.json
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/fix.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/review.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/start.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/context-resolution.test.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/context-resolution.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/contract-identity.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.test.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/goal-contract.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-contract.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/source-transition.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts
mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-view.ts
mise/conf.d/devtools-agent/bundles/developer/types/versioned-imports.d.ts
```

