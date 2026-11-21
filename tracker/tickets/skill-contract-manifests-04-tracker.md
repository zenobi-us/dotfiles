---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-04-tracker
parent: skill-contract-manifests
sequence: 4
title: Adopt contracts in tracker operations
triage: ready-for-agent
type: enhancement
work_status: "completed"
---

## What to build

Use manifests, explicit historical readers, and safe upgrades throughout tracker-owned record and result operations.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare tracker-owned initiative, ticket, result, migration-plan, migration-event, and applicable setup contracts. Reference shared definitions for accepted foreign contracts instead of copying ownership.
- [ ] For each affected schema-to-schemaVersion wire-format change, introduce a new contract version and update producers, validators, consumers, examples, and guidance together. Do not retain permanent dual-field output.
- [ ] Exercise actual tracker read, check, authorised mutation, bulk conversion, and result validation. Preserve authored specification text, comments, unknown fields, ticket identity, child membership, and direct blockers.
- [ ] Read supported historical contracts explicitly. Preserve immutable migration plans and event chains; never stamp records during inspection or installation.
- [ ] Reject unsupported or unsafe inputs without persisted changes. Update all affected consumers, including normal tracker discovery and explorer integration, in the same cutover.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments



- **Review:** FAILURE. Reviewed commit `b062761b4a31681f4e826c4e3dad8770e8944607`; tree `c741f5a04985243460a9677166ab9d049d836e9b`. Timestamp: `2026-11-21T02:58:33.596Z`. [Independent review](../../workflows/skill-contract-manifests-04-tracker/artifacts/reviews/review-review-0005.md); [review receipt](../../workflows/skill-contract-manifests-04-tracker/events/review-0005.yaml).


- **Review:** SUCCESS. Reviewed commit `007dbbf52e4fc2da57ac10ebdafcf9e23c1adf4d`; tree `232b6a74548c15731a6fba4290a21936357c6ece`. Timestamp: `2026-11-21T03:41:40.901Z`. [Independent post-fix review](../../workflows/skill-contract-manifests-04-tracker/artifacts/reviews/review-review-0011.md); [review receipt](../../workflows/skill-contract-manifests-04-tracker/events/review-0011.yaml).
