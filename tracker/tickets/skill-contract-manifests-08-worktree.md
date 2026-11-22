---
schemaVersion: tracker-ticket/v2
blocked_by: 
  - skill-contract-manifests-03-safe-upgrades
id: skill-contract-manifests-08-worktree
parent: skill-contract-manifests
sequence: 8
title: Adopt contracts in worktree operations
triage: ready-for-agent
type: enhancement
work_status: "claimed"
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


- 2026-11-22T04:09:07.705Z — FAILURE. Reviewed commit `a20008e3e548e98ecf568b06d1c762898337bcb3`, tree `aacf1e028ca5c8c221138b2deeb96d4f00467909`. [Independent review](../../workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0006.md).

- 2026-11-22T05:19:38.301Z — FAILURE. Reviewed commit `4a0df18caa4d1ee1c1aaca2729291e0e66c59823`, tree `efbb160b9d23b9088416d8bd239c2d9ce011882f`. [Independent review attempt 2](../../workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0012.md).

- 2026-11-22T06:33:59.090Z — SUCCESS. Reviewed commit `8ce850b641b29d052f9549f956f93dfd655e2c6b`, tree `02afddcab23399930e7d9ce14c461b1c4e9684c2`. [Independent review attempt 3](../../workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0018.md).
