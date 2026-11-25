---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-14-homeassistant
parent: skill-contract-manifests
sequence: 14
title: Adopt contracts in Home Assistant bulk operations
triage: ready-for-agent
type: enhancement
work_status: "claimed"
---

## What to build

Define contracts for owned snapshots and operation records consumed by Home Assistant bulk operations.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare snapshot and independently consumed operation-record contracts and accepted historical formats. Keep Home Assistant API payloads under their external owners.
- [ ] Update snapshot producers, rollback readers, validators, and applicable consumers together, with declared supported upgrades and new affected wire-format versions.
- [ ] Exercise actual snapshot creation, validation, and rollback reading against controlled fixtures or an isolated service. Do not require changes to a live installation for acceptance.
- [ ] Preserve entity identity, registry data, requested changes, rollback meaning, and operation evidence. Keep remote-operation approval and plan/apply boundaries unchanged.
- [ ] Read-only access and rejected unknown or unsafe conversion leave snapshots and remote state unchanged. Preserve immutable historical operation records.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments


- 2026-11-24T21:50:58.841Z — FAILURE. Reviewed commit `a67bb9fe906d6a9214b1f718961e7c81e5076924`, tree `e2c1d6da0ce27dcd3b47ea56572c9144a8651258`. [Independent review](../../workflows/skill-contract-manifests-14-homeassistant/artifacts/reviews/review-review-0005.md).

- 2026-11-25T03:58:02.693Z — FAILURE. Reviewed commit `6bee44cc99483bd230e584e36217b86223ad4d6b`, tree `2814374a162ed9e0d3f7cf5ada54bfd0689bcdc5`. [Independent review](../../workflows/skill-contract-manifests-14-homeassistant/artifacts/reviews/review-review-0011.md).

- 2026-11-25T20:40:33.838Z — SUCCESS. Reviewed commit `b0c57a266b38c54f6a02ad1a2d4643f24c12398e`, tree `59ddce610e75c9340a56b2bbbc69ce1c39fb47e1`. [Independent review](../../workflows/skill-contract-manifests-14-homeassistant/artifacts/reviews/review-review-0017.md).
