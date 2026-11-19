---
schema: "tracker-ticket/v1"
id: "worktree-receipt-recovery-03-blockers"
title: "Report blockers with supported recovery actions"
type: "enhancement"
triage: "ready-for-agent"
work_status: "claimed"
parent: "worktree-receipt-recovery"
sequence: 3
blocked_by: ["worktree-receipt-recovery-01-validation"]
---

## What to build

Inspection must return stable blocker codes and evidence. Give operators supported recovery actions from the existing recovery decision, without changing workflow state.

## Acceptance criteria

- [ ] Report a stable blocker code, affected receipt references, observed evidence, approval requirements, and supported recovery actions for each supported blocker.
- [ ] Cover path inconsistency, unavailable source, missing parent completion, unusable review evidence, and unknown ownership.
- [ ] Use the same recovery decision for machine output and human output. Do not create a second phase-selection rule.
- [ ] If recovery is unsafe or unsupported, report the missing evidence and retain the blocked decision.
- [ ] Keep inspection read-only. Exercise representative blocked workflows and verify that inspection creates no receipts or phase launches.

## Comments


- Review SUCCESS at 2026-11-19T11:36:08.823Z. Reviewed commit `3f6bd3017b6820f64d3b7bf480165e6dbc83c129`, tree `8aa9bcb8cdbd76d77688269437295bd451c14b80`. [Independent review artifact](../../workflows/worktree-receipt-recovery-03-blockers/artifacts/reviews/review-review-0005.md).
