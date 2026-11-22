---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-07-shared-context
parent: skill-contract-manifests
sequence: 7
title: Adopt contracts in shared-context operations
triage: ready-for-agent
type: enhancement
work_status: "claimed"
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


- 2026-11-22T04:10:19.730Z — FAILURE. Reviewed commit `2d5779034ef9f36b24356632a327070ae61daea0`, tree `dc28c302db0cd500e2ca3f11ba9771ec884b328d`. [Independent review](../../workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/review-review-0005.md).

- 2026-11-22T05:18:47.214Z — FAILURE. Reviewed commit `3a70f87bac3f44cd6ceb41cebd0887c11ebdbb59`, tree `42436c397dfe6d48d33d8c592d25283cdf94cd38`. [Independent review](../../workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/review-review-0011.md).

- 2026-11-22T08:25:29.384Z — FAILURE. Reviewed commit `fc4bf19ed4d42aae5fb246e40904f4be956d3298`, tree `7f3a38fb53fa37605d2128815c2c3d9f8041b122`. [Independent review](../../workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/review-review-0018.md).

- 2026-11-22T10:11:30.604Z — SUCCESS. Reviewed commit `79250a53fad0780ac51d40f17121b50d8d76ef6f`, tree `a4d55e717aa5beb4b31871622db5788e82519908`. [Independent review](../../workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/review-review-0024.md).
