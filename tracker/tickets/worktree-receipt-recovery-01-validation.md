---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-01-validation"
title: "Reject inconsistent receipts before publication"
type: "bug"
triage: "ready-for-agent"
work_status: "unclaimed"
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

