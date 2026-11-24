---
blocked_by: []
id: skill-contract-manifests-27-character-records
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 27
title: Adopt contracts in character records
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

character-designer owns independently consumed character-record and facet-storage boundaries.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Identify the consumed character record, facet-storage conventions, backstory references, and dialogue-related structures without versioning ordinary fiction prose.
- [ ] Define applicable owner contracts, validators, compatibility rules, and production and acceptance declarations. Reuse existing workspace owners.
- [ ] Update real character creation, loading, and authorised changes together while preserving voice, relationships, authored narrative, references, and unrelated fields.
- [ ] Exercise current and supported historical character records through actual operations. Refused conversions leave stored content unchanged.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-10` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

