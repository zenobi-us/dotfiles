---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-16-web-design-metadata
receipt_id: fix-0020
source_commit: d50d3bb1719c03c53f9dc911a34017ca09cddfd6
source_tree: bb15b43f805dbc4946d846862e16caddd485621a
---
# Web-design source metadata contracts

This draft records the prose repair for the parent coordinator. Date: 2026-11-26. Fresh source review is pending.

## Overview

Four review17 prose findings are resolved. Runtime bytes remain unchanged. The native runner passed 56 expected outcomes after final prose edits and before commit.

The new source has no independent verdict. Source is not accepted, merged or pushed. Parent owns review and integration.

## Contents

- **Ticket scope:** [Problem and implementation](#problem-and-implementation).
- **Source identity:** [Committed source](#committed-source).
- **Changed files:** [Prose and generated metadata](#changed-files).
- **Observed checks:** [Validation and preservation](#validation-and-preservation).
- **Finding status:** [Resolved findings](#resolved-findings).
- **Retained history:** [Review and receipt history](#review-and-receipt-history).
- **Canonical records:** [Consumed and produced references](#consumed-and-produced-references).
- **Remaining decisions:** [Open questions and merge status](#open-questions-and-merge-status).

## Problem and implementation

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

The implementation declares current `design-source-metadata/v2` and historical numeric-1 `design-source-metadata/v1`. Actual consumers validate metadata and select verified bundled assets. Explicit shared upgrades preserve authored bytes except the identity token. Provenance locations are not runtime asset locations.

Fix11 rejects malformed UTF-8 before JSON parsing and preserves valid Unicode. Its blocked publication result remains blocked.

Fix20 changes only prose. Short sentences and labelled vertical lists replace the reported prose violations. Authority and integrity boundaries remain unchanged. Commands and code blocks remain exact.

## Committed source

Branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base: `master`.

Commit: `d50d3bb1719c03c53f9dc911a34017ca09cddfd6`. Tree: `bb15b43f805dbc4946d846862e16caddd485621a`.

Previous source: `fb4104c7ea2e27f215fab95ec69682b71b101c1b`. Previous tree: `c7ecc92e759b7720f1ffadc4d2377473ff481403`.

## Changed files

- **Changed file:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/style-selection.md`.

The three authorised references contain the prose repair. Normal hooks changed only the two authorised generated metadata files. Creator version is `0.1.6`.

## Validation and preservation

The owning native executable ran once from `/tmp` after all final prose edits. Exit status was 0. All 56 command rows matched expected outcomes. Stderr was empty.

Execution began at `2026-11-26T21:28:20.408348+00:00` and took 7.675461 seconds. This is precommit execution, not a postcommit run.

Postcommit object equality binds the three executed runtime blobs and final authored documents to the committed tree. Hook-generated metadata is bound separately after commit.

Manual MQ inspection resolves all four exact prose findings. The full short definitions were read. Only the requested checksum punctuation changed in style-selection.

Protected runtime, runner, contract and catalog bytes match `fb4104c7ea2e27f215fab95ec69682b71b101c1b`. All five asset bytes and checksums match both source and parent baselines. Catalog bytes differ from the parent numeric catalog only at the identity token. Capture time remains `2026-10-22T10:12:43.516Z`.

All original events, reviews, snapshots and failed captures remain unchanged. No permanent wording tests were added.

- **Native capture:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0020/native-smoke.json`.
- **Complete stdout:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0020/native-stdout.txt`.
- **Complete stderr:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0020/native-stderr.txt`.
- **Manual prose inspection:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0020/manual-prose-validation.json`.
- **Preservation evidence:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0020/preservation.json`.
- **Commit binding:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0020/commit-binding.json`.

## Resolved findings

- **standards-002:** Short coverage bullets replace the long sentence. Inventory and identity prose semicolons are removed.
- **standards-003:** Separate sentences preserve conversion authority and the consumption integrity boundary.
- **standards-004:** The checksum stop and no-repair instruction use the requested two sentences.
- **standards-005:** Field bullets have bold labels. Added prose series use labelled vertical lists.

No assigned finding remains unresolved. This fixer result is not an independent review verdict.

## Review and receipt history

Review1 (`review-0005`) was blocked without a verdict. Review2 (`review-0008`) returned FAILURE for the previous implementation's UTF-8 behavior.

Fix11 committed the UTF-8 repair, but draft publication failed. Its invalid snapshot remains immutable. Approved recovery produced the valid source-bound review-start13 snapshot.

Review14 was blocked. Review17 returned a usable FAILURE with four low hard prose findings. Its 56 native outcomes passed. Spec reported no findings.

The prior verdict applies only to `fb4104c7ea2e27f215fab95ec69682b71b101c1b`. Latest review status for `d50d3bb1719c03c53f9dc911a34017ca09cddfd6` is pending. No stale verdict carries forward.

- **Invalid historical snapshot:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-fix-0011.md` remains unchanged.
- **Valid historical snapshot:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-review-start-0013.md` remains unchanged.
- **Current review body:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0017.md`.
- **Earlier review body:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0008.md`.
- **Blocked review body:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0014.md`.
- **Initial blocked review:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0005.md`.

- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-0011.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-complete-0012.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-start-0010.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-start-0019.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/implementation-0002.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-0005.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-0008.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-0014.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-0017.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-complete-0006.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-complete-0009.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-complete-0015.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-complete-0018.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-start-0004.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-start-0007.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-start-0013.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-start-0016.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/start-0001.yaml`.
- **Receipt history:** `workflows/skill-contract-manifests-16-web-design-metadata/events/start-complete-0003.yaml`.

## Consumed and produced references

- **Consumed review:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-0017.yaml`.
- **Consumed completion:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-complete-0018.yaml`.
- **Phase authorization:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-start-0019.yaml`.
- **Goal reservation:** `workflows/goal-skill-contract-manifests/events/dispatch-reserved-0097.yaml`.
- **Goal run:** `skill-contract-manifests-20261125-t2dv`.
- **Produced receipt:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-0020.yaml` is the assigned final result publication.
- **Produced snapshot:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-fix-0020.md`.
- **Current draft:** `workflows/skill-contract-manifests-16-web-design-metadata/projections/pr-draft.md`.
- **Implementation log:** `workflows/skill-contract-manifests-16-web-design-metadata/projections/implementation-log.md`.

## Open questions and merge status

No implementation question remains for this prose repair. Fresh independent review is required before acceptance.

Relocation remains escalation-only. No relocation, infrastructure or serverfiles work occurred. No extra agents, services, dependency installation or configuration changes occurred.

Source remains clean and local. Parent owns publication-checkout commits, tracker changes, integration and normal primary-session closure.
