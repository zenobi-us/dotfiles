---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-01-validation"
title: "Reject inconsistent receipts before publication"
type: "bug"
triage: "ready-for-agent"
work_status: "claimed"
parent: "worktree-receipt-recovery"
sequence: 1
blocked_by: []
---

## What to build

The receipt writer and inspector must use the same validation rules. Reject inconsistent source paths before authoritative publication or result delivery.

## Acceptance criteria

- [ ] Reject different worktree and workspace_path values before writing an event or delivering a successful result.
- [ ] Use the same receipt validation rules for publication and inspection. Accept a valid receipt through both paths.
- [ ] Require absolute source-worktree paths. Verify that the recorded path identifies the source worktree root.
- [ ] Preserve existing receipt files when validation fails. Report the failed condition without recording phase success.
- [ ] Exercise valid publication and invalid-path rejection through the actual writer and inspector. Include regression coverage for mismatched paths.

## Comments



- Review SUCCESS at 2026-11-11T06:46:37.468Z. Reviewed commit `b2764c46af75893c000cae3d2ea62b26062b7848`, tree `9322e9541dfcdfb3a158665d368ce74d9cd80202`. [Independent review artifact](../../workflows/worktree-receipt-recovery-01-validation/artifacts/reviews/review-review-0005.md).
