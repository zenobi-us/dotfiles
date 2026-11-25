---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-14-homeassistant
receipt_id: fix-0008
source_commit: 6bee44cc99483bd230e584e36217b86223ad4d6b
source_tree: 2814374a162ed9e0d3f7cf5ada54bfd0689bcdc5
---
# Home Assistant cleanup plan contracts

## Ticket summary

Fix only SPEC-001 for `tracker/tickets/skill-contract-manifests-14-homeassistant.md`. Keep the existing claim. This result does not complete, review or merge the ticket.

## Problem

The cleanup JSON plan had no declared contract. The captured historical plan failed owner validation. Nonempty plans also wrote progress to JSON stdout.

## Implementation summary

Declare historical `homeassistant-cleanup-plan/v1` and current `homeassistant-cleanup-plan/v2`. Reuse the existing manifest-driven owner validator. Emit and validate v2 plans. Send JSON-mode cleanup progress to stderr. Preserve dry-run, requested steps, entity identity, old/new names, categories, group changes and warnings. Keep external payload ownership and remote approval boundaries unchanged. No saved-artifact mutation or upgrade is declared.

## Changed files

- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/contracts.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-cleanup-plan-v1.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-cleanup-plan-v2.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/playbook.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/ha_ops.ts`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/tests/cleanup-plan.test.ts`

## Validation results

- **Historical input:** The exact finding command accepts the immutable review cleanup plan as v1. SHA-256 and byte comparisons confirm no rewrite or stamp.
- **Owning commands:** 15 fixture-backed CLI invocations pass expected success or rejection statuses. Nonempty rename and group plans preserve all requested fields and warnings. Generic planning preserves an explicitly permitted empty category.
- **Safety:** Unknown, stamped historical, mixed, wrong-family, malformed and non-dry plans reject without file changes or remote calls. Rollback and rename-map consumers reject cleanup plans. JSON plus apply rejects before network access. Zero fixture mutations.
- **Scoped tests:** Five Bun tests pass, zero fail, 39 assertions. The suite ran once. Final category compatibility also has a separate owning-command smoke.
- **Manifest:** The shared validator resolves all eight owner definitions.
- **Limits:** No live Home Assistant. No typecheck claim. All fixture services stopped. The throwaway smoke script was removed.

Exact argv, cwd, exit statuses, stdout, stderr, requests and saved records are under `workflows/skill-contract-manifests-14-homeassistant/artifacts/evidence/fix-0008`. See `cli-smoke.json`, `generic-category-smoke.json`, `validation.json` and `source-identity.json`.

## Review history

Implementation: `workflows/skill-contract-manifests-14-homeassistant/events/implementation-0002.yaml`; original draft: `workflows/skill-contract-manifests-14-homeassistant/artifacts/snapshots/pr-draft-implementation-0002.md`.

Independent review `review-0005` returned FAILURE for `a67bb9fe906d6a9214b1f718961e7c81e5076924`. Preserve `workflows/skill-contract-manifests-14-homeassistant/artifacts/reviews/review-review-0005.md` and `workflows/skill-contract-manifests-14-homeassistant/events/review-complete-0006.yaml` unchanged. That verdict is stale for the new source. A fresh independent review is required. This fix is not review success.

## Resolved findings

SPEC-001 is addressed by this source change and its fixture evidence. Independent confirmation remains pending.

## Remaining findings

No selected blocking finding remains unresolved. The nonblocking P3 duplication concern is intentionally unchanged.

## Open questions

None. No owning command mutates saved cleanup plans, so no upgrade is needed.

## Merge status

Not merged, pushed or rebased. Ticket remains claimed. The parent owns fix completion and the fresh review.

## Canonical references

- **Inputs:** `tracker/tickets/skill-contract-manifests-14-homeassistant.md`, `tracker/initiatives/skill-contract-manifests/index.md`, `workflows/skill-contract-manifests-14-homeassistant/events/fix-start-0007.yaml`, `workflows/skill-contract-manifests-14-homeassistant/events/review-0005.yaml`, `workflows/skill-contract-manifests-14-homeassistant/artifacts/evidence/review-0005/cleanup-plan.json`.
- **Source:** `6bee44cc99483bd230e584e36217b86223ad4d6b`; tree `2814374a162ed9e0d3f7cf5ada54bfd0689bcdc5`. Source is committed and clean. Bundle/plugin versions remain unchanged. The automatic version hook was bypassed only to remove its out-of-scope bumps from the amended commit.
- **Outputs:** `workflows/skill-contract-manifests-14-homeassistant/events/fix-0008.yaml`, `workflows/skill-contract-manifests-14-homeassistant/artifacts/snapshots/pr-draft-fix-0008.md`, `workflows/skill-contract-manifests-14-homeassistant/manifest.yaml`, `workflows/skill-contract-manifests-14-homeassistant/projections/pr-draft.md`, `workflows/skill-contract-manifests-14-homeassistant/projections/implementation-log.md`, `workflows/skill-contract-manifests-14-homeassistant/projections/latest-status.yaml`.


## Parent validation

[Fix completion](../events/fix-complete-0009.yaml) records final-source tests (5 passed, 39 assertions), offline historical-plan acceptance, verified typed delivery, closed fixer tab and confirmed owned-process shutdown after scoped approval. Source is clean; prior review remains historical. Next phase is fresh independent review.
