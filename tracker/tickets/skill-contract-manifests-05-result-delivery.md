---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-05-result-delivery
parent: skill-contract-manifests
sequence: 5
title: Adopt contracts in result delivery
triage: ready-for-agent
type: enhancement
work_status: "completed"
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


- 2026-11-21T07:55:50.575Z — SUCCESS. Reviewed commit `ffe96b173909ba6836cc2ef419d97055582df8bc`, tree `d42d9df13c95d06d05d1f13d2ca3d1e0dd762d23`. [Independent review](../../workflows/skill-contract-manifests-05-result-delivery/artifacts/reviews/review-review-0006.md).

- Completed after squash integration `fae0653e33c5d3f704fe71caf73bd6cda836b6f1` and verified publication to `origin/master`. Candidate-bound regression and six real delivery CLI commands passed. [Integration evidence](../../workflows/skill-contract-manifests-05-result-delivery/artifacts/snapshots/integration-result-0017.json).
