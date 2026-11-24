---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-14-homeassistant
receipt_id: implementation-0002
source_commit: a67bb9fe906d6a9214b1f718961e7c81e5076924
source_tree: e2c1d6da0ce27dcd3b47ea56572c9144a8651258
---
# Home Assistant owned record contracts

## Ticket summary

Implement [skill-contract-manifests-14-homeassistant](../../../tracker/tickets/skill-contract-manifests-14-homeassistant.md). Keep its existing claim. The source is committed and clean. This is an implementation result, not review or ticket completion.

## Problem

Saved snapshots and operation records had no declared compatibility boundary. Rollback interpreted unchecked JSON before remote operations.

## Implementation summary

Declare current v2 snapshot and reference-report output, current rename-map input and explicit unversioned historical readers. Reuse the shared contract loader and validate owned content against six resolved schemas. Keep external Home Assistant data under its external owner. Add offline validation and validate rollback/map input before network access. Saved records have no mutation commands or upgrade paths. New evidence paths reject replacement. Remote approval, dry-run and cleanup apply boundaries remain unchanged.

## Changed files

- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/bun.lock`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/contracts.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/package.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-reference-report-v1.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-reference-report-v2.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-rename-map-v1.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-rename-map-v2.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-snapshot-v1.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/contracts/homeassistant-snapshot-v2.schema.json`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/references/playbook.md`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/ha_ops.ts`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/records.ts`
- `mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/tests/ha-ops.test.ts`

## Acceptance

- **passed:** Declare owned snapshot and independently consumed operation records, historical inputs and external ownership. Manifest declares snapshot and reference-report production, snapshot/report/map acceptance, six resolved schema definitions, and no upgrades. External HA payloads remain unstamped.
- **passed:** Coordinate producers, rollback readers, validators and consumers with supported upgrade policy. New snapshot and reference-report output uses v2 schemaVersion. Rollback and rename-map consumers validate current and legacy records. Saved artifacts are not mutated; no safe upgrades are required or declared.
- **passed:** Exercise actual commands against controlled fixtures. 26 real CLI invocations used a loopback Bun REST/WebSocket fixture service. Snapshot, validation, rollback planning and approved restoration passed.
- **passed:** Preserve identity, registries, requested changes, rollback meaning, evidence and approval boundaries. Fixture assertions checked registry/config payloads, original mapping keys, retained report hits, byte equality, declined approval, no dry-run mutation, exact restored entity and rollback log.
- **passed:** Read-only and rejected unknown or unsafe inputs preserve bytes and remote state; historical records unchanged. Unknown, mixed, null, malformed and wrong-family inputs rejected before fixture requests. Unsupported upgrade and overwrite attempts preserved bytes. Historical snapshot/map/report reads passed without rewriting.

## Validation

The controlled CLI smoke passed 26 invocations. The manifest validator and six public definition resolutions passed from /tmp. Scoped tests passed: 2 tests, 11 assertions. Tests and fixtures used isolated dummy credentials. No live Home Assistant call occurred.

[CLI smoke](../artifacts/evidence/implementation-0002/cli-smoke.json) retains exact argv, cwd, exit statuses, stdout/stderr, requests, mutations and restored fixture state. [Validation](../artifacts/evidence/implementation-0002/validation.json) retains manifest/definition/test commands. [Implementation context](../artifacts/evidence/implementation-0002/implementation-context.json) retains acceptance mapping, earlier harness assertion correction, unavailable language-server diagnostics and automatic version-hook recovery. The fixture service stopped. The throwaway harness was removed.

## Open questions

None. No conversion is declared because no owning command edits saved records. Acceptance does not authorize conversion.

## Review history

Latest reviewer verdict: FAILURE for source a67bb9fe906d6a9214b1f718961e7c81e5076924. Review attempt review-0005 has one open blocking finding, SPEC-001. No findings are resolved.

## Merge status

Not merged or pushed. Ticket remains claimed. Start and review are complete. Fix and a fresh review are required before integration.

## Canonical inputs

- Ticket: `tracker/tickets/skill-contract-manifests-14-homeassistant.md`.
- Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
- Completed prerequisite: `tracker/tickets/skill-contract-manifests-03-safe-upgrades.md`.
- Parent authorization: `workflows/skill-contract-manifests-14-homeassistant/events/start-0001.yaml`.

## Canonical outputs

- Source: `a67bb9fe906d6a9214b1f718961e7c81e5076924`, tree `e2c1d6da0ce27dcd3b47ea56572c9144a8651258`.
- Receipt: `workflows/skill-contract-manifests-14-homeassistant/events/implementation-0002.yaml`.
- Snapshot: `workflows/skill-contract-manifests-14-homeassistant/artifacts/snapshots/pr-draft-implementation-0002.md`.
- Projections: `workflows/skill-contract-manifests-14-homeassistant/projections/pr-draft.md`, `workflows/skill-contract-manifests-14-homeassistant/projections/implementation-log.md`, `workflows/skill-contract-manifests-14-homeassistant/projections/latest-status.yaml`.
- Workflow manifest: `workflows/skill-contract-manifests-14-homeassistant/manifest.yaml`.
- Evidence: `workflows/skill-contract-manifests-14-homeassistant/artifacts/evidence/implementation-0002`.


## Review attempt review-0005

[Independent review](../artifacts/reviews/review-review-0005.md) records FAILURE. Standards: no hard violations and one nonblocking judgement-call concern. Spec: one blocking finding, SPEC-001. See the artifact for finding details.

[Review receipt](../events/review-0005.yaml) and [parent completion](../events/review-complete-0006.yaml) bind the verdict to the unchanged source. Reviewer tests passed (2 tests, 11 assertions); controlled CLI evidence includes the unsupported cleanup-plan rejection. Parent snapshot validation passed. No live Home Assistant operations ran. Reviewer and axis processes stopped.
