---
blocked_by: []
id: skill-contract-manifests-21-campaign-persistence
parent: skill-contract-manifests
schemaVersion: tracker-ticket/v2
sequence: 21
title: Adopt contracts in campaign persistence
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

ttrpg-gm owns the structured campaign record and its readers.

Implement this owner-specific slice under the existing initiative. Preserve its scope limits and contract ownership.

## Acceptance criteria

- [ ] Identify the independently consumed campaign structure, hidden-state and comment delimiters, reader expectations, and authoritative owner definition.
- [ ] Update actual campaign creation, reading, and authorised update operations with compatible declarations and historical readers.
- [ ] Preserve authored narrative, hidden information, safety settings, and unrelated fields during supported updates. Reject uncertain or lossy conversions.
- [ ] Exercise campaign save and reload through the real owning commands. Verify hidden state is not leaked and rejected operations preserve bytes.
- [ ] Declare actual produced and accepted contracts independently. Resolve every declaration through the public manifest validator. Do not invent a competing shared or external definition.
- [ ] Update the owning guidance and examples with the delivered behaviour. Keep ordinary prose and opaque assets exempt unless actual consumers rely on their structure.

## Scope boundaries

Keep this slice within the named owner. Establish actual consumer requirements before adding identifiers. Historical acceptance does not imply an upgrade path. Use only declared lossless upgrades before an otherwise authorised mutation. Preserve immutable records and external formats.

## Verification

Use actual owning commands, not helper tests alone. Exercise current records, each explicitly supported historical input, authorised mutation where applicable, and rejected unsupported or unsafe operations. Check persisted content and byte preservation. Use isolated fixtures; do not mutate personal data, production services, or historical evidence for validation.

## Evidence

Derived from approved group `owner-request-4` in the [recovery owner assessment](../../workflows/skill-contract-manifests-18-manifest-coverage/artifacts/evidence/manifest-coverage-recovery-0006/owner-requests.json). This assessment is bound to source commit `32f03b1de98d9a5de018ab21106e22fbc6395c65`. Verify the cited producer and consumer evidence before implementation.

Keep Cyberpunk/Cyberwise requests retired. Do not recreate their deleted skills.

## Comments

