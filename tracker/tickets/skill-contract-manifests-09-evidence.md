---
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-09-evidence
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 9
title: Adopt contracts in evidence operations
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Use explicit contracts for browser-evidence production and consumption without rewriting historical evidence.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Declare evidence-owned plans, run metadata, acceptance records, and results where independently consumed. Keep report-generation ownership separate.
- [ ] Introduce new versions for affected schemaVersion changes and update current producers, validators, consumers, examples, and guidance together.
- [ ] Exercise actual evidence planning, production, acceptance reading, and applicable publication operations with current and supported historical records.
- [ ] Preserve historical evidence, captured assets, references, and checksums. Do not treat an evidence run as a workflow receipt or proof of implementation completion.
- [ ] Read-only access and rejected unsafe conversions leave stored evidence unchanged. Do not inject version fields into opaque capture assets.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments

