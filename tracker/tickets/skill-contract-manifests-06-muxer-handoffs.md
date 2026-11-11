---
blocked_by: 
  - skill-contract-manifests-05-result-delivery
id: skill-contract-manifests-06-muxer-handoffs
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 6
title: Adopt contracts in muxer handoffs
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Use manifests and current delivery contracts across muxer-owned handoff and completion operations.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare muxer-owned structured artifacts and accepted delivery contracts. Keep one authoritative owner per contract.
- [ ] Update muxer producers and consumers together for new schemaVersion contract versions, including actual delivery-context creation. Keep run identity, process completion, transport state, and domain success separate.
- [ ] Exercise actual spawn, completion waiting, result retrieval, and cleanup with supported current contracts and explicit historical readers.
- [ ] Preserve historical handoffs and immutable completion evidence. Reject unknown or unsafe inputs without rewriting them or removing authoritative results.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

