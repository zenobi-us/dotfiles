---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-04-repair"
title: "Repair verified receipt path errors without changing history"
type: "enhancement"
triage: "ready-for-agent"
work_status: "claimed"
parent: "worktree-receipt-recovery"
sequence: 4
blocked_by: ["worktree-receipt-recovery-03-blockers"]
---

## What to build

An operator must be able to preview and approve a targeted path repair. Extend the existing append-only supplement mechanism instead of rewriting receipts.

## Acceptance criteria

- [ ] Produce a read-only repair plan that identifies damaged receipts, original checksums, proposed corrections, supporting evidence, and remaining blockers.
- [ ] Accept path normalization only when evidence proves the paths identify the same source worktree.
- [ ] If one path identifies the parent checkout, require retained launch records and source evidence to identify the actual source. A common Git repository alone is insufficient.
- [ ] Require approval for the exact repair plan. Before apply, recheck checksums, source evidence, and other plan preconditions. Reject stale plans without a partial repair.
- [ ] Append an immutable repair record with correction, evidence, and authorization. Preserve every original receipt and parent link.
- [ ] Let inspection consume supported repairs. Keep ambiguous source identity blocked. Do not alter recorded outcomes or invent source execution evidence.
- [ ] Exercise approved repair through inspection. Include rejection cases for ambiguous paths and changed receipt checksums.

## Comments



- **Review:** FAILURE. Reviewed commit `edf4e5585799abb093d1b8df3211fe72c72da93c`; tree `defadfc579887d577800e27302621fbbb756757d`. Timestamp: `2026-11-21T01:44:04.060Z`. [Independent review](../../workflows/worktree-receipt-recovery-04-repair/artifacts/reviews/review-review-0007.md); [review receipt](../../workflows/worktree-receipt-recovery-04-repair/events/review-0007.yaml).
