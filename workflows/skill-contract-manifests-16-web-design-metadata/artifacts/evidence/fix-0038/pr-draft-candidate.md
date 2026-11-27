---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-16-web-design-metadata
receipt_id: fix-0038
source_commit: b039c503841014575faf26c16d3dfa61e9c63db6
source_tree: 29ef53bfe84e272f0ea7e965bc554f33f21f194c
---
# Web-design source metadata contracts

- **Draft purpose:** Record fix-0038 and its source-bound evidence.
- **Intended reader:** The parent coordinator and independent reviewer.
- **Document date:** 2026-11-27.

## Overview

Fix38 resolves standards-011 and standards-012. Both comparison tables now use repeated labeled records. The conversion referral uses American spelling. Fresh independent review is PENDING for this source. This repair does not establish source acceptance.

The implementation declares current `design-source-metadata/v2` and historical numeric-1 `design-source-metadata/v1`. Consumers validate metadata and select verified bundled assets. Explicit shared conversion preserves nonidentity authored bytes. Provenance locations remain separate from runtime asset locations.

## Contents

- **Source identity:** [Committed source](#committed-source).
- **Source changes:** [Changed files](#changed-files).
- **Actual checks:** [Validation and preservation](#validation-and-preservation).
- **Assigned findings:** [Resolved findings](#resolved-findings).
- **Historical context:** [Review and receipt history](#review-and-receipt-history).
- **Canonical records:** [Consumed and produced references](#consumed-and-produced-references).
- **Acceptance boundary:** [Open questions and merge status](#open-questions-and-merge-status).

## Committed source

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base: `master`.

Commit: `b039c503841014575faf26c16d3dfa61e9c63db6`. Tree: `29ef53bfe84e272f0ea7e965bc554f33f21f194c`.

Previous commit: `14705f57e663196bc211fbf394a8829820dcf9fc`. Previous tree: `77df53d39098775775469a221d525467d1c3e35a`.

## Changed files

- **Authored reference:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`.
- **Normal hook:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.
- **Normal hook:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.

Only the two table replacements and the referral spelling were authored. Normal hooks set Creator plugin and marketplace metadata to `0.1.9`. The explicit path-only commit preserved unrelated staging.

## Validation and preservation

The absolute owning executable ran once from `/tmp` after final document edits and before commit. Outer exit was 0. Stderr was empty. All 56 actual JSON outcomes matched expected exits. The final non-JSON PASS line was parsed separately.

- **Successful commands:** 21 returned 0.
- **Expected refusals:** 35 returned 1.
- **Run start:** `2026-11-27T01:58:21.865578+00:00`.
- **Run duration:** 8.352266530 seconds.

This is precommit evidence, not a postcommit execution claim. The three executed runtime blobs and final reference equal their committed objects. Both final hook metadata blobs bind separately. There are six bindings.

The full final reference was read through MQ. Manual inspection covered all 20 Inventory cells and all six identity cells. Existing field labels remain exact. The document keeps its five sections and at most two list levels. Each bullet contains one paragraph and one idea. All other passages and technical literals remain unchanged.

All eight protected nonhook feature paths equal `14705f57e663196bc211fbf394a8829820dcf9fc`. All five assets match frozen source and catalog checksums. Catalog nonidentity bytes equal the parent numeric baseline. Capture time and ordered style/asset/checksum associations remain unchanged. No source refresh or original-provenance access occurred.

- **Native execution:** [Full execution record](../artifacts/evidence/fix-0038/native-smoke.json).
- **Complete stdout:** [Original stdout](../artifacts/evidence/fix-0038/native-stdout.txt).
- **Complete stderr:** [Original stderr](../artifacts/evidence/fix-0038/native-stderr.txt).
- **Actual outcomes:** [All row comparisons](../artifacts/evidence/fix-0038/native-validation.json).
- **Prose inspection:** [Row-to-record audit](../artifacts/evidence/fix-0038/manual-prose-validation.json).
- **Source preservation:** [Protected bytes and baseline checks](../artifacts/evidence/fix-0038/preservation.json).
- **Committed objects:** [Six final bindings](../artifacts/evidence/fix-0038/commit-binding.json).

## Resolved findings

- **standards-011:** Five Inventory records and two Exact identities records replace both tables. No minimum presentation width was invented.
- **standards-012:** The conversion referral uses `authorized`. Its link and separate conversion authority remain unchanged.

No assigned finding remains unresolved. No contract identifier was added to ordinary prose. Ownership and validator statements remain exact. Wire identities and support restrictions remain exact. No permanent wording tests were added.

## Review and receipt history

Review1 was blocked without a verdict. Review2 returned FAILURE for the initial UTF-8 behavior. Fix11 repaired that behavior, but its publication remained blocked. Its invalid snapshot remains unchanged.

Approved recovery produced valid draft13. Review14 was blocked. Review17 returned FAILURE with four low hard prose findings. Fix20 repaired those findings and produced valid draft20.

Review23 returned FAILURE with three low hard prose findings. Fix26 repaired those findings and produced valid draft26. Review29 returned FAILURE with two low hard opening-block findings. Fix32 repaired those findings and produced valid draft32.

Review35 returned FAILURE for `14705f57e663196bc211fbf394a8829820dcf9fc`. Its two low hard findings concern table presentation and American spelling. Its Spec axis had no findings. Its native56 passed. Parent36 validated its source bindings and receipt delivery.

Fix38 resolves only the two assigned findings. Review35 remains historical FAILURE for its frozen source. Fresh review is PENDING for `b039c503841014575faf26c16d3dfa61e9c63db6`. Neither stale SUCCESS nor stale FAILURE establishes the new source verdict.

- **Historical review:** [review-0005](../artifacts/reviews/review-review-0005.md).
- **Historical review:** [review-0008](../artifacts/reviews/review-review-0008.md).
- **Historical review:** [review-0014](../artifacts/reviews/review-review-0014.md).
- **Historical review:** [review-0017](../artifacts/reviews/review-review-0017.md).
- **Historical review:** [review-0023](../artifacts/reviews/review-review-0023.md).
- **Historical review:** [review-0029](../artifacts/reviews/review-review-0029.md).
- **Consumed review:** [review-0035](../artifacts/reviews/review-review-0035.md).
- **Initial implementation:** [implementation-0002](../events/implementation-0002.yaml).
- **Blocked fix:** [fix-0011](../events/fix-0011.yaml).
- **Retained completion:** [fix-complete-0012](../events/fix-complete-0012.yaml).
- **Retained authorization:** [fix-start-0010](../events/fix-start-0010.yaml).
- **Prior prose repair:** [fix-0020](../events/fix-0020.yaml).
- **Prior phase start:** [fix-start-0019](../events/fix-start-0019.yaml).
- **Prior completion:** [fix-complete-0021](../events/fix-complete-0021.yaml).
- **Prior list repair:** [fix-0026](../events/fix-0026.yaml).
- **Prior completion:** [fix-complete-0027](../events/fix-complete-0027.yaml).
- **Historical review event:** [review29 receipt](../events/review-0029.yaml).
- **Historical completion:** [review-complete-0030](../events/review-complete-0030.yaml).
- **Historical authorization:** [fix-start-0031](../events/fix-start-0031.yaml).
- **Prior opening repair:** [fix-0032](../events/fix-0032.yaml).
- **Prior completion:** [fix-complete-0033](../events/fix-complete-0033.yaml).
- **Consumed review event:** [review35 receipt](../events/review-0035.yaml).
- **Consumed parent:** [review-complete-0036](../events/review-complete-0036.yaml).
- **Phase authorization:** [fix-start-0037](../events/fix-start-0037.yaml).
- **Invalid historical snapshot:** [draft11](../artifacts/snapshots/pr-draft-fix-0011.md) remains unchanged.
- **Valid recovery snapshot:** [draft13](../artifacts/snapshots/pr-draft-review-start-0013.md) remains unchanged.
- **Valid historical snapshot:** [draft20](../artifacts/snapshots/pr-draft-fix-0020.md) remains unchanged.
- **Valid historical snapshot:** [draft26](../artifacts/snapshots/pr-draft-fix-0026.md) remains unchanged.
- **Consumed snapshot:** [draft32](../artifacts/snapshots/pr-draft-fix-0032.md) remains unchanged.

## Consumed and produced references

- **Consumed review:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-0035.yaml`.
- **Consumed completion:** `workflows/skill-contract-manifests-16-web-design-metadata/events/review-complete-0036.yaml`.
- **Phase authorization:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-start-0037.yaml`.
- **Parent validation:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/review-0035/parent-validation.json`.
- **Goal reservation:** `workflows/goal-skill-contract-manifests/events/dispatch-reserved-0118.yaml`.
- **Historical coordination:** `workflows/goal-skill-contract-manifests/events/checkpoint-0116.yaml` preserves the user-approved mixed commit.
- **Goal run:** `skill-contract-manifests-20261125-t2dv`.
- **Produced receipt:** `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-0038.yaml` is the assigned final publication.
- **Produced snapshot:** `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-fix-0038.md`.
- **Current draft:** `workflows/skill-contract-manifests-16-web-design-metadata/projections/pr-draft.md`.
- **Implementation log:** `workflows/skill-contract-manifests-16-web-design-metadata/projections/implementation-log.md`.

## Open questions and merge status

No implementation question remains for this repair. Fresh independent review is required before acceptance. Source remains local, not merged or pushed.

No extra agents or services were started. No code, tests, dependencies or configuration changed. No relocation, serverfiles or infrastructure work occurred. All prior immutable records and failed captures remain unchanged.

The primary remains live for normal parent closure. Parent owns publication-checkout commits and YAML views. Parent also owns tracker changes, fresh independent review and integration.

