---
blocked_by: 
  - pi-shared-context-ux-02-initiatives
id: pi-shared-context-ux-05-events
parent: pi-shared-context-tui-ux-spec
sequence: 5
title: Inspect ticket events through readable history and evidence views
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Display a ticket summary above its event history. Opening an event displays a dedicated detail view. Lead with the outcome and readable body before extended evidence metadata.

Keep event identity, execution outcome, review verdict, source identity, and evidence validity distinct. Preserve the current evidence authority and transition restrictions.

## Acceptance criteria

1. Ticket detail displays its identity, available state, and recorded review and fix counts above the event list.
2. Review and fix totals count validated receipts for the respective phases. They describe recorded attempts, not quality or completion.
3. Event rows display distinct identity, outcome, and source fields. A commit reference does not occupy the outcome field for another event type.
4. A completed review with a failure verdict remains distinguishable from a process execution failure.
5. Opening an event displays its outcome and readable body before extended source, workspace, branch, session, and raw-field details.
6. All exact evidence remains reachable through scrolling or an explicit details control. Long source IDs remain readable.
7. Source commit and tree comparisons identify matched, stale, or unavailable evidence. Invalid events remain inspectable with explicit warnings.
8. Dependency information and unresolved blockers remain reachable. Existing workflow transition restrictions remain unchanged.
9. Changed-file counts appear only when durable evidence supplies them. The interface does not infer counts from prose.
10. Event selection survives live history updates. Esc and breadcrumb navigation restore the previous list position.
11. No events, loading history, unreadable history, and refresh failures display distinct explanations.
12. Existing action targets remain explicit. Event inspection does not redirect ticket actions to a historical record.
13. Existing copy and fresh-chat behavior remains unchanged. Colour-independent labels and narrow layouts preserve each field meaning.

## Out of scope

Do not change receipt schemas, evidence validity rules, immutable events, or workflow transition rules.

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

