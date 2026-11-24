---
receipt_id: fix-result-0048
schemaVersion: worktree-pr-draft/v1
source_commit: e01e451f90a426b9cf24e8432035e2ba775a04e4
source_tree: 909dd320a0fab5690f7b334d317bcdab254e9c3a
title: Artifact-share contracts fix 0048
type: Concept
workflow_id: skill-contract-manifests-11-artifact-sharing
---

# Artifact-share contracts — FIXED

## Current fix 0048

VALIDATION-001 is resolved. The historical retrieval test has a 30-second deadline. Its local fixture is removed in the asynchronous body’s finally block, not by shared afterEach cleanup. Every historical identity, rejection and byte-preservation assertion remains. Production behavior is unchanged.

Source: e01e451f90a426b9cf24e8432035e2ba775a04e4; tree: 909dd320a0fab5690f7b334d317bcdab254e9c3a. The source checkout is clean. The commit hook updated agent-core registry versions from 0.1.43 to 0.1.44.

## Changed files in this fix

- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/test/contracts.test.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/references/share.md
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json

## Validation for this fix

Required affected suite ran once: 37 pass, 0 fail, 801 assertions; historical retrieval took 4596.48 ms. Actual owning CLI smoke passed all eight historical retrieval/rejection cases. Configuration, index, page, source and asset SHA-256 values were unchanged. Fixtures and the throwaway smoke script were removed. [Exact command evidence](../artifacts/snapshots/validation-fix-0048.json).

## Current findings and review

Resolved: VALIDATION-001. Remaining findings: none. Current-source review verdict: null. The retained review-result-0044 FAILURE applies to the prior source and is stale. Fresh independent review is required. No merge, rebase, push, tracker mutation or remote publication ran. No domain services were launched. Parent owns result validation, completion, workflow commits and child-terminal shutdown. Open questions: none.

## Canonical inputs and outputs

[Review](../events/review-result-0044.yaml), [review artifact](../artifacts/reviews/review-review-result-0044.md), [approval](../events/fix-approval-0046.yaml), [start](../events/fix-start-0047.yaml), [implementation](../events/implementation-0002.yaml), [prior fix](../events/fix-result-0040.yaml), [prior draft](../artifacts/snapshots/pr-draft-fix-0040.md).

[Fix result](../events/fix-result-0048.yaml), [validation snapshot](../artifacts/snapshots/validation-fix-0048.json), [draft snapshot](../artifacts/snapshots/pr-draft-fix-0048.md), [PR projection](../projections/pr-draft.md), [implementation log](../projections/implementation-log.md).

## Retained previous projection

The following statements describe review-complete-0045 and are superseded by the current fix above. All earlier review and fix records remain unchanged.

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

