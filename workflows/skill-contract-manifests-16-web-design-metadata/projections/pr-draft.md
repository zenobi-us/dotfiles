---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-16-web-design-metadata
receipt_id: implementation-0002
source_commit: 9689169146996ad84d19430cd19aa2a386c733b2
source_tree: 67e2145f36f92662554a7bc7c9d2a0032c5a3bb7
---
# Web-design source metadata contracts

## Ticket and problem

Ticket: `tracker/tickets/skill-contract-manifests-16-web-design-metadata.md`. The catalog had a known numeric identity but no record-family contract or executable metadata consumer.

## Implementation

Added the authoritative `design-source-metadata` family, exact numeric-1 historical reader, current v2 catalog, and declared shared safe conversion. The owning CLI validates metadata and checks every bundled asset before style-and-asset selection. Source repository paths remain provenance only. Equal hashes retain distinct associations. Conversion replaces only the identity token and preserves all other authored bytes.

## Changed files

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

## Validation results

- Native `mise/conf.d/devtools-agent/bundles/creator/skills/web-design/tests/source-metadata-smoke.ts`: exit 0; 52 commands matched expected outcomes. Both formats, all five associations, invalid identities, byte-preserving refusals, unknown numeric lexemes, partial bulk conversion, and isolated checksum damage passed.
- Installed public manifest validation and both definition resolutions from `/tmp`: exit 0.
- Installed shared safe upgrade converted the bundled catalog: exit 0; changed true, historical v1 to current v2.
- Parent baseline comparison: all metadata bytes except the identity token match. All five bundled asset hashes match.
- Normal source commit hooks: exit 0; generated Creator plugin and marketplace metadata.

Tests ran before commit. The nine tested authored blobs exactly match committed tree entries. This is not a final-commit test run. Evidence: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/implementation-0002/native-smoke.json` and `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/implementation-0002/commit-binding.json`.

## Review history and findings

No independent review has run. No review verdict or resolved finding exists. Parent owns the fresh review phase. No known implementation blocker remains.

## Limits and open questions

No UI changed. No browser checks or screenshots were requested. No dependencies or global settings changed. No open implementation question remains. Primary-session cleanup is pending parent normal closure; exact observed identities are in `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/implementation-0002/resources-before-parent-closure.json`.

## Merge status

Source committed locally at `9689169146996ad84d19430cd19aa2a386c733b2`; tree `67e2145f36f92662554a7bc7c9d2a0032c5a3bb7`. Not pushed or merged. Parent owns integration, publication commits, ticket completion, and cleanup.

## Canonical references

- Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.
- Start: `workflows/skill-contract-manifests-16-web-design-metadata/events/start-0001.yaml`.
- Reservation: `workflows/goal-skill-contract-manifests/events/dispatch-reserved-0064.yaml`.
- Result: `workflows/skill-contract-manifests-16-web-design-metadata/events/implementation-0002.yaml`.
- Snapshot: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/snapshots/pr-draft-implementation-0002.md`.
- Parent baseline: `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/parent-baseline-0001/sources.numeric-v1.json` and `workflows/skill-contract-manifests-16-web-design-metadata/artifacts/evidence/parent-baseline-0001/asset-checksums.txt`.

