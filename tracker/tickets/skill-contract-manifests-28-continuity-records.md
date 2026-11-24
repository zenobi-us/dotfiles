---
blocked_by: []
id: skill-contract-manifests-28-continuity-records
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 28
title: Adopt contracts in continuity review records
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

continuity-keeper owns independently consumed continuity review, promise/reveal tracking, and approved-change record boundaries.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Trace the actual continuity review outputs, promise/reveal fields, and approval records. Distinguish suggested changes from approved writes.
- [ ] Define applicable owner contracts, validation, compatibility, and manifest declarations, referencing existing story/workspace owners.
- [ ] Preserve chronology, evidence links, authored narrative, previous verdicts, and the authority required to record approved changes.
- [ ] Exercise a real continuity review and an authorised update using fixtures. Verify suggestions alone do not change story records and rejected conversion preserves bytes.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-11` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

