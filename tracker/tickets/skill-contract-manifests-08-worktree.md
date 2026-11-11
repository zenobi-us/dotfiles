---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-08-worktree
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 8
title: Adopt contracts in worktree operations
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Use explicit contracts in worktree workflow operations while retaining immutable historical provenance.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare owned receipt, coordinator-event, inspection/result, snapshot, and projection contracts where independently consumed. Reference tracker, delivery, and shared-context definitions rather than duplicating them.
- [ ] For affected schemaVersion changes, introduce new versions and update current producers and all consumers, including recovery and explorer readers, together.
- [ ] Exercise actual workflow start, inspection, recovery, and applicable result operations against supported current and historical records.
- [ ] Keep existing events, receipts, review artifacts, and hash-linked history unchanged. Use explicit historical readers instead of reserialising history.
- [ ] Apply safe upgrades only to mutable owned artifacts before an authorised mutation. Verify read-only access and rejected operations preserve stored bytes and valid provenance.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

