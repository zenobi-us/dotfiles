---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-07-shared-context
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 7
title: Adopt contracts in shared-context operations
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Declare shared-context-owned formats and use explicit validation and safe upgrades at their operation boundaries.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Cover owned route, layout, source/index, resolution-result, and other independently consumed structured formats that apply. Do not create competing tracker or workflow contract definitions.
- [ ] Introduce new versions for affected field-name changes and update producers, validators, consumers, examples, and guidance together. Keep content upgrade separate from storage migration.
- [ ] Exercise actual resolution, read-only inspection, authorised configuration or source mutation, and explicit supported bulk conversion.
- [ ] Preserve authored configuration and historical records. Keep externally owned formats unchanged. Reject unknown, ambiguous, or unsafe conversion without persisted changes.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

