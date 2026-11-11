---
blocked_by: []
id: skill-contract-manifests-01-local-definitions
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 1
title: Validate manifests and resolve local definitions
triage: ready-for-agent
type: enhancement
work_status: completed
---

## What to build

Provide public contract operations that validate contracts.json and resolve local authoritative definitions from an installed skill.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [x] Accept skill-contract-manifest/v1 with required produces, accepts, contracts, and upgrades collections. Accept empty collections. Keep input support separate from output production.
- [x] Validate record-family identifiers and resolve every produced, accepted, and upgrade-endpoint identifier to one authoritative definition. Reject invalid declarations before interpretation.
- [x] Resolve file: references from the installed skill directory when the caller uses a different working directory. Recognise the manifest contract directly without recursive self-resolution.
- [x] Exercise the public operation with valid, empty, malformed, and unresolved manifests. Keep one shared manifest specification and validator; leave domain validation with each owner.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments


- 2026-11-11T06:40:51.855528+00:00 — SUCCESS. Reviewed commit `c2135fa5e78208c39e18e49eaa95ba0128f936e7`, tree `b52dae2fbcb6198342f30cc361b974d605e83b56`. [Independent review](../../workflows/skill-contract-manifests-01-local-definitions/artifacts/reviews/review-review-0008.md).

- 2026-11-11T20:54:42.022Z — SUCCESS. Reviewed commit `7ff2f96ebf1c2eae3b795af011e197dae0314911`, tree `3a838d99e033537106c4cd9a7584b4d78a66d468`. [Independent reconciled-source review](../../workflows/skill-contract-manifests-01-local-definitions/artifacts/reviews/review-review-reconcile-0016.md). Historical verdict; source synchronization requires a fresh review.



- 2026-11-11T21:06:24.135Z — SUCCESS. Reviewed commit `a53c09ef6fc30a4aaf072761dc3f4e9defd7f4c1`, tree `009468ec2f7311d2d2f9a20e40bcb2a0ddb7755c`. [Final independent review](../../workflows/skill-contract-manifests-01-local-definitions/artifacts/reviews/review-review-final-0022.md).
- Completed after squash merge `26f56acbda0de958891709d4152ee9b123d96327` and verified publication to `origin/master`. Integrated validation: 122 tests, 534 assertions and public cross-directory CLI smoke passed. [Publication evidence](../../workflows/skill-contract-manifests-01-local-definitions/events/finish-pushed-0027.json).
