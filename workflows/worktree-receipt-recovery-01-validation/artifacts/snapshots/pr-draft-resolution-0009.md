---
title: Receipt validation conflict resolution
type: Report
---

# Conflict-resolution candidate

Ticket: tracker/tickets/worktree-receipt-recovery-01-validation.md

Original reviewed source: `b2764c46af75893c000cae3d2ea62b26062b7848` / `9322e9541dfcdfb3a158665d368ce74d9cd80202`. Preserved in `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-01-validation`.

Resolved source: `ee446c94a7a8996cc6654688dbda5da46c512165` / `5d7d3ad8dc395803101d7036f03247026e0d9189`; branch `resolve/worktree-receipt-recovery-01-validation`.

## Resolution

Preserve current v2 receipt contract, parent chronology, result-delivery boundaries and immutable storage behavior. Share envelope and source-root validation between writer and inspector. Preserve legacy lifecycle controls and permit parent finish records after source removal. Retain both sets of CLI regressions.

## Verification

120 worktree tests passed with 621 assertions. Actual candidate inspector accepted the existing workflow. Actual writer rejected mismatched source paths without publication, then published resolution-0009 with valid source identity. LSP lacks Node declarations.

## Review history

- Original SUCCESS: [review-0005](../reviews/review-review-0005.md), source `b2764c46af75893c000cae3d2ea62b26062b7848`.
- Independent resolved-source review pending: review-start-0010.

## Integration policy

Use explicit squash to follow Worktrunk merge.squash=true. Retain exact source objects through integration helper refs/worktree-reviews. Recompute candidate against current master after metadata publication.

## Recovery and resources

[Approval](../../events/operator-approval-0008.yaml) authorizes this recovery. [Resolution checkpoint](../../events/resolution-0009.yaml) records observed source and checks. Historical review run manifest is missing; original resources remain preserved with shutdown unconfirmed. Do not claim cleanup complete from absent pane evidence.

