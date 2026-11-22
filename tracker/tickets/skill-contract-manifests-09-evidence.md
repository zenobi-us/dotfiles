---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-09-evidence
parent: skill-contract-manifests
sequence: 9
title: Adopt contracts in evidence operations
triage: ready-for-agent
type: enhancement
work_status: "claimed"
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


- 2026-11-22T04:07:36.566Z — FAILURE. Reviewed commit `dc75b3b33ab1f81c3c312cc38510dc3254ac2c5a`, tree `4e9cb559406b7b44edff21343b39f715e90194d0`. [Independent review](../../workflows/skill-contract-manifests-09-evidence/artifacts/reviews/review-review-0005.md).

- 2026-11-22T05:52:25.836Z — SUCCESS. Reviewed commit `62f26327084f0dca065ee8ec065c0437cdc54c7d`, tree `d802a953960f01c104a02959652453b55cc37201`. [Independent review](../../workflows/skill-contract-manifests-09-evidence/artifacts/reviews/review-review-0011.md).
