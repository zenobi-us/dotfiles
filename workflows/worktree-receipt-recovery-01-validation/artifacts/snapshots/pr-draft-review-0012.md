---
title: Reviewed receipt validation snapshot
type: Report
---

# Receipt validation

Ticket: [worktree-receipt-recovery-01-validation](../../../tracker/tickets/worktree-receipt-recovery-01-validation.md).

## Problem

The writer could publish mismatched or nested source paths. Publication and inspection must use the same envelope rules.

## Implementation

Share receipt envelope/source-root validation. Preserve current v2 integration and lifecycle contracts and retained v1 history. Resolve conflicts in a separate source candidate; original reviewed source remains preserved.

## Changed files

- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-validation.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`

## Validation

120 tests passed, 621 assertions. Actual writer rejected invalid paths without an event; valid publication passed. Actual inspector accepted the durable receipt chain. Focused parent acceptance: 4 tests, 34 assertions. Static checks lack Node type declarations.

## Findings

No blocking findings; latest independent verdict SUCCESS. No unresolved implementation questions.

## Merge status

REVIEW_PASSED. {}

Historical source cleanup remains separate from acceptance; historical run manifest is unavailable.


## Review history

- review-0005: SUCCESS for `b2764c46af75893c000cae3d2ea62b26062b7848`; [receipt](../events/review-0005.yaml), [artifact](../artifacts/reviews/review-review-0005.md).
- review-0011: SUCCESS for `ee446c94a7a8996cc6654688dbda5da46c512165`; [receipt](../events/review-0011.yaml), [artifact](../artifacts/reviews/review-review-0011.md).

## Supporting receipts

- [start-0001](../events/start-0001.yaml)
- [implementation-0002](../events/implementation-0002.yaml)
- [start-0003](../events/start-0003.yaml)
- [review-start-0004](../events/review-start-0004.yaml)
- [review-0005](../events/review-0005.yaml)
- [review-complete-0006](../events/review-complete-0006.yaml)
- [finish-failed-0007](../events/finish-failed-0007.yaml)
- [operator-approval-0008](../events/operator-approval-0008.yaml)
- [resolution-0009](../events/resolution-0009.yaml)
- [review-start-0010](../events/review-start-0010.yaml)
- [review-0011](../events/review-0011.yaml)
- [review-complete-0012](../events/review-complete-0012.yaml)

