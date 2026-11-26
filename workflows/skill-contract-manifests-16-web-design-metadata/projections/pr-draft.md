---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-16-web-design-metadata
receipt_id: fix-0026
source_commit: dab2338e6be69e208c39c6c05164c0a1a066dbf7
source_tree: 85f6c82ecdf7dd5d51f6d4552ea933b7ab82a78f
---
# Web-design source metadata contracts

This draft records fix-0026 for the parent coordinator. Fresh independent source review is pending.

## Problem and implementation

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

The implementation declares current `design-source-metadata/v2` and historical numeric-1 `design-source-metadata/v1`. Consumers validate metadata and select verified bundled assets. Explicit shared conversion preserves nonidentity authored bytes. Provenance locations remain separate from runtime asset locations.

Fix26 repairs three documented prose findings. Labelled vertical lists replace inline series. Short paragraphs separate bulk outcomes from conversion and consumption integrity. Explicit companion selection and checksum refusal remain unchanged.

## Committed source

Branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base: `master`.

Commit: `dab2338e6be69e208c39c6c05164c0a1a066dbf7`. Tree: `85f6c82ecdf7dd5d51f6d4552ea933b7ab82a78f`.

Previous commit: `d50d3bb1719c03c53f9dc911a34017ca09cddfd6`. Previous tree: `bb15b43f805dbc4946d846862e16caddd485621a`.

## Changed files

- **Changed file:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/SKILL.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`.
- **Changed file:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/style-selection.md`.

Only the three authorised prose sections changed. Normal hooks changed only the two declared generated metadata paths.

## Validation and preservation

The absolute owning executable ran once from `/tmp` after all final prose edits and before commit. Outer exit status was 0. Stderr was empty. All 56 actual rows matched their expected exits.

Execution began at `2026-11-26T21:59:07.098816+00:00`. Duration was 13.031610 seconds. There were 21 successful commands and 35 expected refusals. This is precommit execution, not a postcommit run.

Committed object equality binds the three executed runtime blobs and final authored documents to the new tree. Generated metadata binds separately after normal hooks.

Manual MQ inspection covered every added prose section in the three documents. All three-item series use labelled vertical lists. All list labels are bold. Descriptive sentences contain at most 25 words. Paragraphs contain at most five sentences.

Protected runtime, runner, manifest, catalog and metadata-definition bytes equal `d50d3bb1`. All five assets match frozen source and parent baseline checksums. Ordered style and provenance associations remain exact. Catalog nonidentity bytes and capture time match the parent numeric baseline.

- **Native execution:** [Full execution record](../artifacts/evidence/fix-0026/native-smoke.json).
- **Complete stdout:** [Native stdout](../artifacts/evidence/fix-0026/native-stdout.txt).
- **Complete stderr:** [Native stderr](../artifacts/evidence/fix-0026/native-stderr.txt).
- **Actual outcomes:** [Row and exit comparisons](../artifacts/evidence/fix-0026/native-validation.json).
- **Prose audit:** [Full manual MQ audit](../artifacts/evidence/fix-0026/manual-prose-validation.json).
- **Protected bytes:** [Baseline preservation](../artifacts/evidence/fix-0026/preservation.json).
- **Committed objects:** [Execution and document bindings](../artifacts/evidence/fix-0026/commit-binding.json).

## Resolved findings

- **standards-006:** Selection actions use bold lead-ins. Printed values use a nested labelled list. Reference topics use a labelled list.
- **standards-007:** Three definition topics use bold lead-ins. The authoritative definition link and read-only boundary remain unchanged.
- **standards-008:** Three bulk-outcome sentences remain together. Four conversion and consumption sentences form a separate paragraph.

No assigned finding remains unresolved. Prior targeted corrections for standards-002 through standards-005 remain present. This fixer result is not an independent review verdict.

## Review and receipt history

Review1 was blocked without a verdict. Review2 returned FAILURE for the initial UTF-8 behavior. Fix11 repaired UTF-8 behavior, but its publication remained blocked. Its invalid snapshot remains unchanged.

Approved recovery produced the valid review-start13 draft. Review14 was blocked. Review17 returned FAILURE with four low hard prose findings. Fix20 repaired those findings and produced the valid draft20.

Review23 returned FAILURE for `d50d3bb1` with three low hard prose findings. Its native 56 outcomes passed. Its Spec axis had no findings. Parent24 validated and acknowledged that source-bound result.

The latest review for `dab2338e6be69e208c39c6c05164c0a1a066dbf7` is pending. Neither stale SUCCESS nor stale FAILURE applies to the new source. No source acceptance follows from this repair.

- **Historical review:** [review-0005](../artifacts/reviews/review-review-0005.md).
- **Historical review:** [review-0008](../artifacts/reviews/review-review-0008.md).
- **Historical review:** [review-0014](../artifacts/reviews/review-review-0014.md).
- **Historical review:** [review-0017](../artifacts/reviews/review-review-0017.md).
- **Historical review:** [review-0023](../artifacts/reviews/review-review-0023.md).

- **Blocked fix:** [fix-0011](../events/fix-0011.yaml).
- **Retained completion:** [fix-complete-0012](../events/fix-complete-0012.yaml).
- **Retained authorization:** [fix-start-0010](../events/fix-start-0010.yaml).
- **Prior prose repair:** [fix-0020](../events/fix-0020.yaml).
- **Prior phase start:** [fix-start-0019](../events/fix-start-0019.yaml).
- **Prior completion:** [fix-complete-0021](../events/fix-complete-0021.yaml).
- **Initial implementation:** [implementation-0002](../events/implementation-0002.yaml).
- **Invalid historical snapshot:** [draft11](../artifacts/snapshots/pr-draft-fix-0011.md) remains unchanged.
- **Valid recovery snapshot:** [draft13](../artifacts/snapshots/pr-draft-review-start-0013.md) remains unchanged.
- **Valid previous snapshot:** [draft20](../artifacts/snapshots/pr-draft-fix-0020.md) remains unchanged.

## Consumed and produced references

- **Consumed review:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-0023.yaml`.
- **Consumed completion:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-complete-0024.yaml`.
- **Phase authorization:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-start-0025.yaml`.
- **Goal reservation:** `workflows/goal-skill-contract-manifests/events/dispatch-reserved-0103.yaml`.
- **Goal run:** `skill-contract-manifests-20261125-t2dv`.
- **Produced receipt:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-0026.yaml` is the assigned final publication.
- **Produced snapshot:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-fix-0026.md`.
- **Current draft:** `workflows/skill-contract-manifests-16-web-design-metadata/projections/pr-draft.md`.
- **Implementation log:** `workflows/skill-contract-manifests-16-web-design-metadata/projections/implementation-log.md`.

## Open questions and merge status

No implementation question remains for this repair. Fresh independent review is required before acceptance. Source is clean and local, not merged or pushed.

No extra agents or services were created. No dependency or configuration changes occurred. Relocation remains escalation-only. No serverfiles or infrastructure work occurred.

Parent owns publication-checkout commits and YAML view refresh. Parent also owns tracker changes, independent review, integration and normal primary closure. Historical receipts and failed captures remain byte-identical.



## Latest review: review-0029

- **Verdict:** FAILURE for `dab2338e6be69e208c39c6c05164c0a1a066dbf7`, tree `85f6c82ecdf7dd5d51f6d4552ea933b7ab82a78f`.
- **Standards:** Two low hard document-opening findings remain: `standards-009` and `standards-010`.
- **Spec:** No findings.
- **Validation:** All56 fresh primary native outcomes match. Protected runtime and all five assets remain preserved.
- **Next action:** Add purpose, intended reader and a human document date to the two new references. Source acceptance remains blocked.
- **Review:** [Immutable report](../artifacts/reviews/review-review-0029.md).
- **Reconciliation:** [Validated completion](../events/review-complete-0030.yaml).
