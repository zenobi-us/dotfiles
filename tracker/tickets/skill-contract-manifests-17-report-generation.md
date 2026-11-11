---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-17-report-generation
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 17
title: Adopt contracts in report generation
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Declare the owned structured report format that writing-reports generates and validates.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Define the independently consumed report structure and its authoritative owner. Declare produced and accepted contracts separately from browser-evidence contracts.
- [ ] Update report generation, markup guidance, validation, and consumers together. Use format-appropriate metadata without changing externally owned formats.
- [ ] Exercise actual report generation and validation for current and explicitly supported historical reports. Preserve authored content, asset links, and self-contained report behaviour.
- [ ] Keep ordinary prose and opaque images exempt from separate identifiers. Read-only validation and rejected unsafe conversion leave reports and linked assets unchanged.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

