---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-04-tracker
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 4
title: Adopt contracts in tracker operations
triage: ready-for-agent
type: enhancement
work_status: unclaimed
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

