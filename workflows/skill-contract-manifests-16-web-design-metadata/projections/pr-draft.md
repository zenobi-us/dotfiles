---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-16-web-design-metadata
receipt_id: review-start-0013
source_commit: fb4104c7ea2e27f215fab95ec69682b71b101c1b
source_tree: c7ecc92e759b7720f1ffadc4d2377473ff481403
---
# Web-design source metadata contracts

## Ticket and implementation

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. The owner declares current `design-source-metadata/v2` and historical numeric-1 `design-source-metadata/v1`, validates actual metadata, selects verified bundled assets, and delegates explicit byte-preserving conversion to shared upgrades. Provenance locations are not opened.

The UTF-8 repair reads raw catalog bytes and rejects lossy decoding before JSON parsing. Valid Unicode, including intentionally encoded U+FFFD, remains supported. The catalog and five bundled asset snapshots are unchanged by the fix. Capture time remains `2026-10-22T10:12:43.516Z`.

## Frozen source and changed scope

Branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base: `master`. Source commit: `fb4104c7ea2e27f215fab95ec69682b71b101c1b`; tree: `c7ecc92e759b7720f1ffadc4d2377473ff481403`.

- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/assets/sources.json`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/contracts.json`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/style-selection.md`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata.md`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/references/source-metadata-upgrade.md`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/source-metadata.ts`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/sources.ts`
- `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`
- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`

## Observed validation

- Fixer native runner: exit0,56 expected native outcomes. Execution preceded commit and guidance update; three executed runtime/runner blobs match the final committed tree. This is not a post-commit suite claim. Evidence: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0011/native-smoke.json` and `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0011/commit-binding.json`.
- Parent fixed-commit verification: six expected native outcomes. Exact retained malformed bytes now fail validate/select with exit1; valid historical/current Unicode metadata validates and selects correctly, including literal U+FFFD. All fixture bytes remain unchanged. Committed runtime bytes, full catalog bytes and five asset hashes were checked. Evidence: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/parent-verification-0002/encoding-native-probes.json`.
- Catalog/provenance/capture/asset preservation: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0011/preservation.json`.

## Review history and current limits

Review1 was blocked without a verdict. Review2 completed FAILURE for earlier source `9689169146996ad84d19430cd19aa2a386c733b2`, with one UTF-8 finding per independent axis. Its artifact is `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/reviews/review-review-0008.md`. The fix addresses those reported boundaries, but this changed source has no current independent verdict or integration approval. A fresh review is pending.

The fix source is committed and clean; its phase result remains BLOCKED because draft publication failed. Do not reinterpret it as completed source acceptance. All five registered fixer processes stopped after normal closure and signal-free observation; no extra signals were sent. No UI, dependency, global-setting, relocation-defect or serverfiles changes occurred.

## Publication recovery

User approval: `workflows/goal-skill-contract-manifests/events/checkpoint-0086.yaml`. Preparation receipt: `workflows/skill-contract-manifests-16-web-design-metadata/events/review-start-0013.yaml`.

This is a NEW immutable draft for the exact fixed source. The invalid immutable `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-fix-0011.md` and all prior receipts remain preserved. Its failed output is not a usable draft. Mutable current draft/log views may be repaired from retained valid history to reference this snapshot. No source or receipt-guard changes are authorized by this recovery.

## Merge status

Source is not pushed or merged. Parent owns independent review, integration, tracker completion and final cleanup. Relocation defect remains escalation-only with no implementation owner.

## Canonical references

- Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
- Source fix: `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-0011.yaml`.
- Parent reconciliation: `workflows/skill-contract-manifests-16-web-design-metadata/events/fix-complete-0012.yaml`.
- Publication failure evidence: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/fix-0011/publication-failure.json`.
- Snapshot: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-review-start-0013.md`.


## Latest review: review-0017

- **Verdict:** FAILURE for `fb4104c7ea2e27f215fab95ec69682b71b101c1b`, tree `c7ecc92e759b7720f1ffadc4d2377473ff481403`.
- **Standards:** Four low-severity hard prose-rule findings remain: `standards-002` through `standards-005`.
- **Spec:** No findings.
- **Validation:** All 56 native command outcomes match. All eleven source blobs and all five assets remain preserved.
- **Next action:** A fresh fixer must address the prose findings. Source acceptance and integration remain blocked.
- **Review:** [Immutable report](../artifacts/reviews/review-review-0017.md).
- **Result:** [Completed review receipt](../events/review-0017.yaml).
- **Reconciliation:** [Validated parent completion](../events/review-complete-0018.yaml).

