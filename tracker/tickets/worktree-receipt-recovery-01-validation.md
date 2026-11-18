---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-01-validation"
title: "Reject inconsistent receipts before publication"
type: "bug"
triage: "ready-for-agent"
work_status: "completed"
parent: "worktree-receipt-recovery"
sequence: 1
blocked_by: []
---

## What to build

The receipt writer and inspector must use the same validation rules. Reject inconsistent source paths before authoritative publication or result delivery.

## Acceptance criteria

- [x] Reject different worktree and workspace_path values before writing an event or delivering a successful result.
- [x] Use the same receipt validation rules for publication and inspection. Accept a valid receipt through both paths.
- [x] Require absolute source-worktree paths. Verify that the recorded path identifies the source worktree root.
- [x] Preserve existing receipt files when validation fails. Report the failed condition without recording phase success.
- [x] Exercise valid publication and invalid-path rejection through the actual writer and inspector. Include regression coverage for mismatched paths.

## Comments



- Review SUCCESS at 2026-11-11T06:46:37.468Z. Reviewed commit `b2764c46af75893c000cae3d2ea62b26062b7848`, tree `9322e9541dfcdfb3a158665d368ce74d9cd80202`. [Independent review artifact](../../workflows/worktree-receipt-recovery-01-validation/artifacts/reviews/review-review-0005.md).

- Review SUCCESS at 2026-11-18T22:02:10.904Z. Reviewed conflict-resolution commit `ee446c94a7a8996cc6654688dbda5da46c512165`, tree `5d7d3ad8dc395803101d7036f03247026e0d9189`. [Independent review artifact](../../workflows/worktree-receipt-recovery-01-validation/artifacts/reviews/review-review-0011.md).



- Completed after independently reviewed source `ee446c94a7a8996cc6654688dbda5da46c512165` was integrated by squash as `3be33fca691eeecfa113c9c1efbd7918b29e5078` and published to `origin/master`. Candidate-bound tests and actual inspector smoke passed. [Publication checkpoint](../../workflows/worktree-receipt-recovery-01-validation/events/finish-pushed-0015.yaml). Historical source resource cleanup remains pending and does not revoke published acceptance.

