---
blocked_by: []
id: skill-contract-manifests-01-local-definitions
parent: skill-contract-manifests
schema: tracker-ticket/v1
sequence: 1
title: Validate manifests and resolve local definitions
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Provide public contract operations that validate contracts.json and resolve local authoritative definitions from an installed skill.

Implement this slice under the parent initiative. Preserve its contract ownership, safety boundaries, and scope limits.

## Acceptance criteria

- [ ] Accept skill-contract-manifest/v1 with required produces, accepts, contracts, and upgrades collections. Accept empty collections. Keep input support separate from output production.
- [ ] Validate record-family identifiers and resolve every produced, accepted, and upgrade-endpoint identifier to one authoritative definition. Reject invalid declarations before interpretation.
- [ ] Resolve file: references from the installed skill directory when the caller uses a different working directory. Recognise the manifest contract directly without recursive self-resolution.
- [ ] Exercise the public operation with valid, empty, malformed, and unresolved manifests. Keep one shared manifest specification and validator; leave domain validation with each owner.

## Verification

Exercise the changed behaviour through actual owning commands, not helper tests alone. Check persisted content and rejected operations. Update affected guidance and examples with the implementation.

## Comments


- 2026-11-11T06:40:51.855528+00:00 — SUCCESS. Reviewed commit `c2135fa5e78208c39e18e49eaa95ba0128f936e7`, tree `b52dae2fbcb6198342f30cc361b974d605e83b56`. [Independent review](../../workflows/skill-contract-manifests-01-local-definitions/artifacts/reviews/review-review-0008.md).
