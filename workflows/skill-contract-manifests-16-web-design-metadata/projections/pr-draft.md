---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-16-web-design-metadata
receipt_id: fix-0044
source_commit: b0d12b0912d15b1c1add96caca33afa573f5144b
source_tree: c163046bd7dd4e1a0874a34215b523a8c13af70a
---
# Web-design source metadata contracts

Purpose: Record fix44 and its committed source evidence. Reader: Parent coordinator and independent reviewer. Date: 2026-11-27.

## Result and implementation

Fix44 resolves standards-013 and standards-014 with first-use prose definitions in two references. Fresh independent review is PENDING for this source.

The source declares current string-v2 production and historical numeric-1 acceptance. Explicit conversion preserves nonidentity authored bytes. Runtime consumers verify bundled assets independently of the current working directory.

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`.

Commit: `b0d12b0912d15b1c1add96caca33afa573f5144b`. Tree: `c163046bd7dd4e1a0874a34215b523a8c13af70a`. Previous source: `b039c503841014575faf26c16d3dfa61e9c63db6`.

## Changed files and findings

- **Authored reference:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`.
- **Authored reference:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`.
- **Normal hook:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.
- **Normal hook:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.

Normal hooks set Creator metadata to `0.1.10`. The scoped commit uses the four declared paths only.

- **standards-013:** Define command-line interface (CLI) and JavaScript Object Notation (JSON) at first prose use.
- **standards-013:** Define Coordinated Universal Time (UTC) and International Organization for Standardization (ISO) at first prose use.
- **standards-013:** Define Unicode Transformation Format with 8-bit code units (UTF-8), byte order mark (BOM), and 256-bit Secure Hash Algorithm (SHA-256).
- **standards-014:** Define UTF-8 and JSON at first prose use in the upgrade procedure.
- **Both documents:** Replace prose `cwd` with current working directory. Technical literals and commands remain exact.

No assigned finding remains unresolved. Both complete final references were read through MQ with `--no-lockfile`.

## Validation and preservation

The owning absolute executable ran once from `/tmp` after all final prose edits and before commit. This is precommit evidence, not postcommit execution.

- **Outer result:** Exit 0 and empty standard error.
- **Command outcomes:** All 56 JSON rows matched their expected exits.
- **Successful commands:** 21 returned 0.
- **Expected refusals:** 35 returned 1.
- **Final summary:** The separate non-JSON PASS line was retained.
- **Start time:** `2026-11-27T21:43:59.691617+00:00`.
- **Duration:** 7.997728261 seconds.

Seven final bindings cover three runtime files, two final references, and two hook metadata files. The source is clean.

The exact known post-hook condition occurred: two owned index blobs retained the previous release while working files equaled HEAD. Their old identities remain captured. Scoped `git add` reconciled only those two entries before the final guard. No source bytes or commit changed.

All seven other nonhook feature paths equal the previous source. All five assets match baseline bytes and catalog checksums. Catalog nonidentity bytes, capture time, provenance, and ordered associations remain unchanged.

Manual review preserves all five Inventory records and both identity records. Ownership, validator statements, unknown/missing/mixed/duplicate refusals, and separate conversion authority remain intact. Strict encoding refusal and no-normalization/no-implicit-BOM-removal rules remain intact. Valid encoded U+FFFD and checksum/no-repair guarantees remain intact.

- **Native record:** [Full execution](../artifacts/evidence/fix-0044/native-smoke.json).
- **Output:** [Complete standard output](../artifacts/evidence/fix-0044/native-stdout.txt).
- **Errors:** [Complete standard error](../artifacts/evidence/fix-0044/native-stderr.txt).
- **Outcomes:** [Row validation](../artifacts/evidence/fix-0044/native-validation.json).
- **Committed bytes:** [Seven bindings](../artifacts/evidence/fix-0044/commit-binding.json).
- **Manual inspection:** [First-use and semantics audit](../artifacts/evidence/fix-0044/manual-prose-validation.json).
- **Protected source:** [Preservation](../artifacts/evidence/fix-0044/preservation.json).
- **Owned staging:** [Old index identities](../artifacts/evidence/fix-0044/owned-index-observation.json).
- **Read-only correction:** [Retained query capture](../artifacts/evidence/fix-0044/query-input-correction.json).

## Review and receipt history

Review41 returned FAILURE for `b039c503841014575faf26c16d3dfa61e9c63db6` with two low hard first-use findings. Its specification axis had no findings. Its native56 passed. Prior findings standards-011 and standards-012 remain resolved. Parent42 validated that review and delivery.

Earlier review outcomes remain historical. Blocked reviews and failed candidates remain unchanged. Fix44 establishes no independent acceptance verdict.

- **Retained record:** [review-0005](../artifacts/reviews/review-review-0005.md).
- **Retained record:** [review-0008](../artifacts/reviews/review-review-0008.md).
- **Retained record:** [review-0014](../artifacts/reviews/review-review-0014.md).
- **Retained record:** [review-0017](../artifacts/reviews/review-review-0017.md).
- **Retained record:** [review-0023](../artifacts/reviews/review-review-0023.md).
- **Retained record:** [review-0029](../artifacts/reviews/review-review-0029.md).
- **Retained record:** [review-0035](../artifacts/reviews/review-review-0035.md).
- **Retained record:** [implementation-0002](../events/implementation-0002.yaml).
- **Retained record:** [fix-0011](../events/fix-0011.yaml).
- **Retained record:** [fix-complete-0012](../events/fix-complete-0012.yaml).
- **Retained record:** [fix-start-0010](../events/fix-start-0010.yaml).
- **Retained record:** [fix-0020](../events/fix-0020.yaml).
- **Retained record:** [fix-start-0019](../events/fix-start-0019.yaml).
- **Retained record:** [fix-complete-0021](../events/fix-complete-0021.yaml).
- **Retained record:** [fix-0026](../events/fix-0026.yaml).
- **Retained record:** [fix-complete-0027](../events/fix-complete-0027.yaml).
- **Retained record:** [review29 receipt](../events/review-0029.yaml).
- **Retained record:** [review-complete-0030](../events/review-complete-0030.yaml).
- **Retained record:** [fix-start-0031](../events/fix-start-0031.yaml).
- **Retained record:** [fix-0032](../events/fix-0032.yaml).
- **Retained record:** [fix-complete-0033](../events/fix-complete-0033.yaml).
- **Retained record:** [review35 receipt](../events/review-0035.yaml).
- **Retained record:** [review-complete-0036](../events/review-complete-0036.yaml).
- **Retained record:** [fix-start-0037](../events/fix-start-0037.yaml).
- **Retained record:** [draft11](../artifacts/snapshots/pr-draft-fix-0011.md).
- **Retained record:** [draft13](../artifacts/snapshots/pr-draft-review-start-0013.md).
- **Retained record:** [draft20](../artifacts/snapshots/pr-draft-fix-0020.md).
- **Retained record:** [draft26](../artifacts/snapshots/pr-draft-fix-0026.md).
- **Retained record:** [draft32](../artifacts/snapshots/pr-draft-fix-0032.md).
- **Consumed review:** [review41](../artifacts/reviews/review-review-0041.md).
- **Consumed receipt:** [review41 event](../events/review-0041.yaml).
- **Consumed parent:** [parent42](../events/review-complete-0042.yaml).
- **Prior fix:** [fix38](../events/fix-0038.yaml).
- **Prior completion:** [parent39](../events/fix-complete-0039.yaml).
- **Consumed snapshot:** [draft38](../artifacts/snapshots/pr-draft-fix-0038.md).
- **Phase authorization:** [start43](../events/fix-start-0043.yaml).
- **Parent validation:** [review41 validation](../artifacts/evidence/review-0041/parent-validation.json).
- **Produced receipt:** [fix44](../events/fix-0044.yaml).

## Authority and open questions

Goal run: `skill-contract-manifests-20261125-t2dv`. Consumed reservation: `workflows/goal-skill-contract-manifests/events/dispatch-reserved-0127.yaml`.

Produced snapshot: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-fix-0044.md`.

Current projections: `projections/pr-draft.md` and `projections/implementation-log.md` under this workflow.

No implementation question remains. Source is local, not merged or pushed. No extra agents, services, permanent tests, or dependency changes occurred. No source refresh or original-provenance access occurred.

The primary remains live for normal parent closure. Parent owns fresh independent review, acceptance, tracker changes, YAML views, publication commits, and integration.


## Latest review: review-0047

- **Verdict:** FAILURE for `b0d12b0912d15b1c1add96caca33afa573f5144b`, tree `c163046bd7dd4e1a0874a34215b523a8c13af70a`.
- **Independent axes:** Standards and Spec each reported no findings. Their reports remain unchanged.
- **Primary finding:** `standards-015` at `references/style-selection.md:48` requires prose `cwd` to become current working directory.
- **Prior findings:** `standards-013` and `standards-014` are resolved.
- **Validation:** All56 fresh postcommit outcomes match; all11 frozen objects, protected7 and all5assets preserved. No native or axis rerun.
- **Resources:** Both leaves and all4 primary registered processes are stopped and confirmed. Caller correction132 and exact shutdown133–135 evidence remain retained.
- **Review:** [Immutable report](../artifacts/reviews/review-review-0047.md).
- **Reconciliation:** [Validated completion](../events/review-complete-0048.yaml).
