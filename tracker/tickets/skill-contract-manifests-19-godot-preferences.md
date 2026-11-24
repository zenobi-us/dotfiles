---
blocked_by: []
id: skill-contract-manifests-19-godot-preferences
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 19
title: Adopt contracts in shared Godot mentor preferences
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

godot-mentor owns the per-developer, per-project preference JSON. godot-brainstorming and project consume the same definition.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Define canonical project-path normalisation, the path-derived storage key, collision checks, allowed values, and the meaning of project, mode, level, language, and optional section_offer.
- [ ] Update preference producers and readers together. Merge authorised changes without losing unrelated keys. Do not move personal preferences into a game repository.
- [ ] Exercise actual preference reads and authorised writes with current and supported historical fixture states. Reject unsupported identities without changing the source.
- [ ] Declare the shared owner in each affected skill manifest. Keep mentor restoration behaviour outside this ticket.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `godot-preference-contract` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

