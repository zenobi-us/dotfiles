---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-16-web-design-metadata
receipt_id: fix-0056
producer: fix-0056
source_commit: 9d00fc4548d4bd8c5a79aa7d11661ad28dfd4930
source_tree: 97a55fab87da13de54a7724062a36adc4626aa70
---
# Web-design source metadata contracts

Purpose: Record fix56 for the parent coordinator and independent reviewer. Date: 2026-11-28.

## Result

Fix56 resolves standards-016 by expanding the human-facing help term to current working directory. Only the usage literal at scripts/sources.ts:9 changed. Command syntax, read-only authority, conversion authority, arguments, validation, and output formats remain unchanged.

Fresh independent review is **PENDING** for commit `9d00fc4548d4bd8c5a79aa7d11661ad28dfd4930`, tree `97a55fab87da13de54a7724062a36adc4626aa70`. Review53's FAILURE applies only to the previous source `a30ab1903988834d63abd2b997659e103112a88f`. No assigned finding or implementation question remains unresolved. Prior findings013/014/015 remain resolved.

Source branch: `feature/skill-contract-manifests-16-web-design-metadata`. Base branch: `master`. Source workspace: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-16-web-design-metadata`.

## Changed files

- **Authored help:** `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/scripts/sources.ts`.
- **Normal hook:** `mise/conf.d/devtools-agent/bundles/creator/.claude-plugin/plugin.json`.
- **Normal hook:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.

Normal hooks alone updated the two Creator metadata files. All eight other nonhook feature paths and all five assets remain exact. Catalog nonidentity bytes, capture metadata, provenance, ordered associations, and checksums remain unchanged. Existing references already use the full term and remain unchanged.

## Verification

Both absolute executables ran once from /tmp after the final edit and before commit. Neither ran again after commit.

Help started at `2026-11-28T09:47:54.567Z`, finished at `2026-11-28T09:47:54.712Z`, and took 0.14573109 seconds. It returned 0 with empty standard error. Commands and read-only authority remain unchanged.

The owning smoke runner started at `2026-11-28T09:47:54.713Z`, finished at `2026-11-28T09:48:04.946Z`, and took 10.233429404999999 seconds. It returned 0 with empty standard error. All 56 JavaScript Object Notation (JSON) rows matched expected exits: 21 successes and 35 expected refusals. The separate PASS line remains captured.

Five unique final bindings cover three runtime files, including the authored help, plus two hook files. The known two-hook stale index condition was recorded before scoped alignment. Working bytes already equaled committed HEAD. No source bytes or commit changed during alignment.

- **Help evidence:** [Complete capture](../evidence/fix-0056/help-smoke.json).
- **Native evidence:** [Complete capture](../evidence/fix-0056/native-smoke.json).
- **Native outcomes:** [56 actual rows](../evidence/fix-0056/native-validation.json).
- **Final bindings:** [Five unique files](../evidence/fix-0056/commit-binding.json).
- **Protected bytes:** [Preservation](../evidence/fix-0056/preservation.json).
- **Owned staging:** [Old index identities](../evidence/fix-0056/owned-index-observation.json).
- **Capture preparation:** [Retained pre-execution input correction](../evidence/fix-0056/capture-preparation-error.json). No owning command ran during that failed preparation.

## Review history and authority

The feature declares current string-v2 production and historical numeric-1 acceptance. Explicit conversion preserves nonidentity authored bytes. Runtime consumers verify bundled assets independently of the current working directory.

- **Complete earlier history:** [Snapshot50](pr-draft-fix-0050.md).
- **Consumed review:** [Review53](../reviews/review-review-0053.md).
- **Consumed receipt:** [Review53 event](../../events/review-0053.yaml).
- **Consumed completion:** [Parent54](../../events/review-complete-0054.yaml).
- **Parent validation:** [Validated review53](../evidence/review-0053/parent-validation.json).
- **Phase authorization:** [Start55](../../events/fix-start-0055.yaml).
- **Goal reservation:** [Reservation145](../../../goal-skill-contract-manifests/events/dispatch-reserved-0145.yaml).
- **Current reconciliation authority:** [Reconciliation144](../../../goal-skill-contract-manifests/events/dispatch-reconciled-0144.yaml).
- **Produced receipt:** [Fix56](../../events/fix-0056.yaml).

The old review body's administrative counter143 remains unchanged. Parent54 and reconciliation144 are authoritative. Historical shutdown142 and warning143 are not repair scope.

Goal run: `skill-contract-manifests-20261125-t2dv`. Parent owns completion57 and reconciliation147 unless a new checkpoint intervenes. Parent also owns tracker changes, YAML views, publication commits, fresh review, and integration.

Source remains local, not accepted, merged, or pushed. No extra agents, services, signals, source refresh, original-provenance access, or permanent wording tests occurred. All immutable history and failed captures remain unchanged. The primary remains available for normal parent closure.
