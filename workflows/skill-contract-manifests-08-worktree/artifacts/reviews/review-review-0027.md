---
created_at: 2026-11-22T08:42:51.204839Z
review_base_commit: b427e77ff67dc75dcf956bef64318be5b40a88c2
source_commit: a5fd7c0e4f0241d6a5a3f6ad7cb357d78b884190
source_tree: 450b99ebea5d8a58b5643e319d06e7532ae8cd3d
title: skill-contract-manifests-08-worktree independent review attempt 4
type: Review
verdict: FAILURE
---

# Independent worktree review attempt 4

Verdict: FAILURE. Standards: 0 findings. Spec: 1 finding, P2 (SPEC-1).

## Identity and scope

Ticket: `tracker/tickets/skill-contract-manifests-08-worktree.md` (local-markdown).
Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
Timestamp: 2026-11-22T08:42:51.204839Z.
Reviewer session: `01a20267-4585-723a-908e-69b0458becda`.
Run and operation: `8b2a4eb8-effb-44df-9fb0-219a55158f9c`.
Publication checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/resolve-skill-contract-manifests-08-worktree-finish`.

Original source: `feature/skill-contract-manifests-08-worktree`, commit `8ce850b641b29d052f9549f956f93dfd655e2c6b`, tree `02afddcab23399930e7d9ce14c461b1c4e9684c2`.
Reviewed candidate: `resolve/skill-contract-manifests-08-worktree-finish`, commit `a5fd7c0e4f0241d6a5a3f6ad7cb357d78b884190`, tree `450b99ebea5d8a58b5643e319d06e7532ae8cd3d`.
Base branch: `master`. Fixed review base: `b427e77ff67dc75dcf956bef64318be5b40a88c2`.

Reviewed the committed 51-file delta, including inherited contract adoption, merge/version resolutions and new candidate transition. Prior SUCCESS does not approve this resolution.

```sh
git diff b427e77ff67dc75dcf956bef64318be5b40a88c2...a5fd7c0e4f0241d6a5a3f6ad7cb357d78b884190
```

## Standards

No concrete Standards findings. Reviewed the committed runtime changes and owner contract declarations against the supplied repository rules, contract ownership boundaries, and worktree receipt rules. Source-transition publication checks bind the exact approved candidate, preserve the base branch, require original-source ancestry, verify shared Git identity, and reject a dirty frozen source. Current and historical identifier fields remain distinct. No tests, builds, lint, or formatters ran, as requested. The parent owns runtime smoke verification.

Independent helper: `33d1c98e-4dd5-4c4a-aaf7-a3cf5c6c4f81`. Verified and acknowledged SHA-256 `7baed00b1c472fc0a0720a0e63e37b1aa6b3eb4a9e75207ed29dfbaaeb1f969b`.

## Spec

P2 — receipt-diagnostics.ts:28: Recovery accepts source transitions that publication rejects. The initiative requires: ‘Validate artifact content against its declared source contract.’ The ticket requires updating ‘all consumers, including recovery and explorer readers, together.’ receipts.md also requires original-source ancestry. The writer checks ancestry and preserves the original base at phase-context.ts:89–91. The reader calls only approvedSourceTransition, which compares approval and candidate fields. Its remaining Git check verifies each commit/tree pair independently. Thus a retained approval and matching review-start for an unrelated commit can pass history validation. Add read-only transition ancestry and unchanged-base checks before recovery or explorer consumers accept the history. Preserve historical bytes. Static review only; no tests, builds, formatters, workflow writes, or source edits. The original SUCCESS does not approve the resolution candidate.

Independent helper: `7efc736f-6bba-4ffa-99ca-9f5056297d42`. Verified and acknowledged SHA-256 `0df54f1dab08cdede38f96aacf790f4a69f9378303d7dcd0dd9036d7b0376160`.

## Confirmed finding SPEC-1

Severity: P2. File: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts:28`. ADR: none applies.

The ticket requires all consumers, including recovery and explorer readers, to change together. The owner requires original-source ancestry and an unchanged base for candidate transitions.

Recovery diagnostics accept an approved source transition without checking original-source ancestry or retaining the original base. The writer rejects this history. An in-memory replay of the complete retained event graph changed both approved candidate and review-start to b427e77ff67dc75dcf956bef64318be5b40a88c2 and its correct tree. generateReceipt rejected original-source ancestry; inspectReceiptDiagnostics returned [].

The parent independently reproduced this finding. No stored receipt changed. The replay loaded every existing YAML event, replaced only candidate commit/tree in the approval and review-start in memory, then ran both owner functions. Output:

```text
writer rejected: Source candidate must preserve the original source commit as an ancestor
reader diagnostics: []
```

`phase-context.ts:89–91` checks ancestry and the original base. `source-transition.ts:12–14` compares candidate strings only. `receipt-diagnostics.ts:58–68` checks individual commit/tree pairs, not transition ancestry. Thus valid Git objects can hide invalid retained transition provenance.

Required change: Validate retained source transitions against the same ancestry and unchanged-base rules as publication. Share the checks where practical. Reject invalid or unverifiable ancestry before recovery or explorer readers declare history valid. Preserve historical bytes and add an actual inspector regression with an approved non-descendant candidate.

Validation command after adding the missing regression:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts --test-name-pattern 'source candidate|source transition'
```

## Validation

- **Actual inspector:** Candidate `scripts/inspect.ts` ran from the publication checkout. Exit 0. It found the exact frozen candidate and no receipt diagnostics. It retained the scoped unknown-ownership recovery assessment.
- **Focused CLI regression:** The existing separate-candidate test passed: 1 pass, 0 fail, 18 assertions. It verifies approval matching, rejection and immutable approval bytes. It does not cover invalid ancestry through inspection.
- **Ancestry replay:** The temporary smoke reproduced SPEC-1 against the complete event graph in memory. No source or event changed.
- **Manifest validation:** All candidate contract definitions and upgrade procedures resolved through the shared owner.
- **Prior suite evidence:** `candidate-approval-0025` records 213 passing tests and 1122 assertions. This review did not repeat the full suite. The parent owns final integration checks.
- **Immutable history:** All 34 baseline receipt/artifact hashes remain unchanged. Source identity and cleanliness were observed by the actual inspector and the result writer.

## Integration and lifecycle

Affected contracts include receipt v1/v2/v3, phase-context v1/v2, goal v1/v2, inspection, coordination, mutable views, retained integration v2 and shared-context resolution v1.
Selected integration checks are the full worktree suite and the candidate inspector from the base checkout. This FAILURE does not authorize integration.

The start receipt records incomplete global inventory and scoped ownership approval. Unrelated stale tracker copies, historical goal records and an unrelated missing prototype do not establish a competing owner. No shared service was used.

Both independent helpers ran fresh parallel sessions at depth 2. They wrote no source or formal receipts. Their results were verified and acknowledged. Owned helper terminals were closed; post-close resource observations confirmed shutdown. The main review terminal remains for the parent.
Two preliminary helper launches from the isolated evaluation environment failed before any terminal was allocated because `HC_TERMINAL_ID` was absent. Their retained records name no target. Successful launches used the actual child shell environment.

This review changes no source, tracker, projection, integration or publication commit. It publishes only this immutable artifact and review-0027 through the owning writer.

## Inputs and outputs

Inputs: canonical ticket and initiative; `events/finish-approval-0024.yaml`, `events/candidate-approval-0025.yaml`, `events/review-start-0026.yaml`, `events/fix-0015.yaml`, `events/review-0018.yaml`, `events/review-complete-0019.yaml`, and `artifacts/reviews/review-review-0018.md`, all workflow-relative.
Outputs: `workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0027.md` and `workflows/skill-contract-manifests-08-worktree/events/review-0027.yaml`.

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

