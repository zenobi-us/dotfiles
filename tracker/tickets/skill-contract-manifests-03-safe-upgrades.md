---
blocked_by: 
  - skill-contract-manifests-01-local-definitions
id: skill-contract-manifests-03-safe-upgrades
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 3
title: Perform safe contract upgrades
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Provide public operations for lossless declared upgrades before an otherwise authorised mutation and for explicit bulk upgrades.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Validate source content against its supported source contract. Follow declared paths only and select exactly one operation-appropriate destination; never select by numeric version order.
- [ ] For a supported safe path, convert meaning and authored content, validate the destination, and perform the requested mutation. Read-only operations, installation, and unrelated skill updates leave artifact bytes unchanged.
- [ ] For an unversioned input, use an explicit detector that matches exactly one supported source contract. Zero or multiple matches stop conversion. An unknown explicit identifier is not a legacy candidate.
- [ ] Stop for no path, ambiguous destinations, data loss, a required user decision, or failed source or destination validation. Preserve rejected inputs and never report a partial conversion as successful.
- [ ] Provide explicit bulk conversion with results that describe actual persisted changes and failures. Keep immutable artifacts unchanged and require historical readers for them.
- [ ] Exercise public commands for successful conversion and all rejection boundaries, including unchanged meaning and authored content. Do not treat changing a label as conversion.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

