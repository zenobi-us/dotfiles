---
blocked_by: []
id: skill-contract-manifests-23-domain-records
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 23
title: Adopt contracts in domain records
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

domain-modeling owns the consumed context and architecture-decision record boundaries.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Inventory the context and ADR formats and identify which structure consumers rely on. Keep ordinary explanatory prose outside independent versioning.
- [ ] Define the applicable owner contracts, validators, compatibility rules, and manifest declarations. Reference external and shared owners rather than copying definitions.
- [ ] Update record creation, reading, and authorised mutation together. Preserve domain terms, authored decisions, comments, and existing links.
- [ ] Exercise actual context and ADR operations on current and supported historical fixtures. Reject unsupported or unsafe changes without rewriting artifacts.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-6` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

