---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-11-artifact-sharing
receipt_id: review-complete-0045
source_commit: 7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8
source_tree: b70d4a21bb53f54c5c41a47e036842d192add4ca
title: Artifact-share contracts review status
type: Concept
---

# Artifact-share contracts — REVIEW_FAILED

## Problem

Define owned configuration and publication metadata contracts. Preserve historical content, access boundaries, and authored bytes. [Ticket](../../../tracker/tickets/skill-contract-manifests-11-artifact-sharing.md).

## Implementation

Configuration v2 and metadata v2 producers and consumers retain explicit historical readers. Consumer upgrades preserve repository settings and owned metadata. Complete MDX ingestion and versioned consumer-history validation were fixed in [fix-result-0040](../events/fix-result-0040.yaml). [Implementation draft](../artifacts/snapshots/pr-draft-fix-0040.md).

## Current review

Verdict: FAILURE at commit 7eeefdfed44d18bc6bea9c482b438bf4e43f6ef8, tree b70d4a21bb53f54c5c41a47e036842d192add4ca. Base: ea330e4818c97d11a57db1a28b385b7ab7907f95. [Review result](../events/review-result-0044.yaml), [review artifact](../artifacts/reviews/review-review-result-0044.md), [parent completion](../events/review-complete-0045.yaml). Standards and Spec static axes have no findings. VALIDATION-001 remains open: the historical retrieval regression exceeded its default deadline and fixture cleanup raced unfinished work.

## Validation

Affected suite: 36 pass, 1 fail, 1 error. The independent actual-command and MDX-build smoke passed. Parent configuration read/change/rejection smoke passed. [Parent command evidence](../artifacts/snapshots/validation-parent-review-0045.json). No rerun masked the required-suite failure.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/consumer-history.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/.mise/tasks/checks/types.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/README.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/press.config.tsx`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template/src/share-metadata.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-upgrade.txt`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-v1.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/config-v2.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/consumer-history-v1.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/index-v1.txt`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v1.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/contracts/metadata-v2.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/list.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/template.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/config-owner.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/config.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/consumers.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/lib.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/artifact-shares.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/consumers.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/site.test.ts`

## Review and fix history

- [Review 0006](../events/review-result-0006.yaml): FAILURE. [Artifact](../artifacts/reviews/review-review-result-0006.md).
- [Review 0014](../events/review-result-0014.yaml): FAILURE. [Artifact](../artifacts/reviews/review-review-result-0014.md).
- [Review 0022](../events/review-result-0022.yaml): FAILURE. [Artifact](../artifacts/reviews/review-review-result-0022.md).
- [Review 0032](../events/review-result-0032.yaml): FAILURE. [Artifact](../artifacts/reviews/review-review-result-0032.md).
- [Review 0044](../events/review-result-0044.yaml): FAILURE. [Artifact](../artifacts/reviews/review-review-result-0044.md).

Implementation: [0002](../events/implementation-0002.yaml). Fixes: [0010](../events/fix-result-0010.yaml), [0018](../events/fix-result-0018.yaml), [0026](../events/fix-result-0026.yaml), [0040](../events/fix-result-0040.yaml). Earlier defects SPEC-001, STANDARDS-001, STANDARDS-002, SPEC-002, SPEC-003, SPEC-004, STANDARDS-003 and SPEC-005 are resolved. VALIDATION-001 remains open.

## Merge and resources

Unmerged; not pushed. Ticket remains claimed. [Cleanup evidence](../artifacts/snapshots/resources-review-complete-0045.json) confirms all reviewer and axis processes stopped. Source unchanged and clean. Fixing requires separate authorization and a fresh review.
