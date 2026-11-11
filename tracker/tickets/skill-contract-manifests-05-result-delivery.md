---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-05-result-delivery
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 5
title: Adopt contracts in result delivery
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Use explicit contracts throughout result routing, immutable delivery, acknowledgement, and recovery.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare delivery-owned context, envelope, reference, acknowledgement, and applicable result contracts, with authoritative definitions and accepted historical versions.
- [ ] Introduce new versions for affected schemaVersion field changes. Update all producers, validators, consumers, examples, and guidance together without permanent dual-field output.
- [ ] Exercise actual delivery, acknowledgement, and recovery for human, machine, and required child handoffs. Validate transport independently from the owning domain result.
- [ ] Preserve historical immutable envelopes and references through explicit readers. Recover existing results rather than repeating a domain mutation.
- [ ] Exercise rejected contract identities and unsafe conversions. Keep source content and stored immutable artifacts unchanged on rejection or read-only access.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

