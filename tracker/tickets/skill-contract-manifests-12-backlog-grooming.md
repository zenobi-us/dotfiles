---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-12-backlog-grooming
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 12
title: Adopt contracts in backlog grooming
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Version grooming reports and generated action records through their actual validation and compilation operations.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare the owned report and generated action-record contracts, with explicit accepted historical formats and safe upgrade procedures.
- [ ] Update report authorship instructions, validation, compilation, and consumers together. Preserve required sections, conditional verdict fields, and proposed action identities.
- [ ] Exercise actual report checking and compilation for supported current and historical reports. Preserve verdicts, evidence, authored findings, and proposed actions.
- [ ] Read-only checking must not rewrite reports. Reject unsupported, invalid, or unsafe inputs without applying tracker actions or claiming successful conversion.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

