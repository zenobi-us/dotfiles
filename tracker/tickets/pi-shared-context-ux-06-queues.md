---
schema: tracker-ticket/v1
blocked_by: 
  - pi-shared-context-ux-02-initiatives
id: pi-shared-context-ux-06-queues
parent: pi-shared-context-tui-ux-spec
sequence: 6
title: Find actionable tickets through clear work queues
triage: ready-for-agent
type: enhancement
work_status: claimed
---

## What to build

Display Ready, Review, Blocked, and All in a distinct ticket queue mode or view. Keep these queues separate from initiative navigation.

Separate canonical ticket status, recorded workflow activity, and the next available action. A Review action means ready for review, not that a review currently runs.

## Acceptance criteria

1. Users can select Ready, Review, Blocked, and All without losing initiative navigation state.
2. Queue headings and active controls identify the selected queue. Initiative rows do not mix into the filtered ticket list.
3. Queue rows separate type, ID, title, ticket status, and next action. Blocking information remains subordinate but readable.
4. The interface displays active workflow activity only when recorded data supports that activity. Readiness alone does not imply active execution.
5. Opening a queue ticket reaches the correct canonical ticket and initiative or Ungrouped context. Return navigation restores queue selection and scroll position.
6. Existing queue membership and workflow safety rules remain authoritative. Display changes do not weaken action restrictions.
7. Empty queues display accurate recovery controls. The All shortcut matches its actual input behavior.
8. No selection means no empty action menu. Available actions display their target and disabled reasons.
9. Uppercase R refreshes. Lowercase r retains the existing Review action. Workspace shortcuts remain unchanged.
10. Live updates preserve the selected ticket by identity. If the ticket leaves the queue, the interface explains the change and selects a valid row.
11. A refresh failure retains readable content and blocks unsafe transitions. Loading and empty states remain distinct.
12. Structured fields remain readable at small terminal sizes and without colour. Existing action, copy, and Files behavior remains unchanged.

## Out of scope

Do not add search, new queue semantics, a new tracker backend, or new workflow transitions.

## Specification

The parent specification defines the complete product intent. This ticket implements only the approved slice.


## Testing decisions

Use the complete modal as the main automated test boundary. Send input through its public interface. Assert visible behavior and canonical targets.

Use the existing modal, explorer, and live-update test patterns. Use temporary stores for record and watcher behavior. Avoid assertions about private arrays or incidental text formatting.

Run the actual Pi modal for terminal acceptance. Inspect 40 by 12, 80 by 24, and 120 by 40 terminals. Inspect colour and monochrome presentation.

Keep existing action, copy, workspace shortcut, and workflow safety behavior intact. Preserve terminal-control sanitization and Unicode display widths.

## Completion evidence

Record the focused behavior checks and terminal observations. Include evidence for the changed screens and relevant failure states.

## Comments

The user approved this slice and its direct blockers during ticket decomposition.



- Claimed 2026-10-29T06:53:47.924Z by the authorized initiative coordinator for fresh bounded implementation cycle1 (maximum250000 complete-session work tokens;10sessions maximum for this ticket). Direct blocker ticket02 is completed. Ticket05 terminal finish is published; no dependency field was added.

- Standards review: **SUCCESS**. Reviewed commit `20968ee4f907c6f74bc77702fcef09578b41c6b8`. Timestamp `2026-10-29T22:18:39.652Z`. [Review artifact](../../workflows/pi-shared-context-ux-06-queues/artifacts/reviews/review-review-standards-0070.md).

- Spec review: **SUCCESS**. Reviewed commit `20968ee4f907c6f74bc77702fcef09578b41c6b8`. Timestamp `2026-10-30T02:36:01.831Z`. [Review artifact](../../workflows/pi-shared-context-ux-06-queues/artifacts/reviews/review-review-spec-0085.md).
