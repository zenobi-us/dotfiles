---
schema: tracker-ticket/v1
blocked_by: 
  - pi-shared-context-ux-02-initiatives
id: pi-shared-context-ux-03-mixed-items
parent: pi-shared-context-tui-ux-spec
sequence: 3
title: Browse research and tickets in the same initiative
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Extend initiative browsing to show research, tickets, and other supported records together. Show records without initiative membership in Ungrouped.

Read membership and type from canonical records. Reuse the existing tracker adapters and document-type information. Keep dependency relationships separate from initiative membership.

Provide type-specific item details and existing actions. Research can lead to specs or initiatives through established commands, not a new conversion workflow.

## Acceptance criteria

1. An initiative child list displays associated research and tickets together. Other supported types retain their canonical identity and type.
2. Every supported record without initiative membership appears in Ungrouped. An associated record does not also appear there.
3. Initiative Items counts include all associated child records. Ungrouped counts all supported unassociated records.
4. Type markers distinguish research from tickets. IDs, titles, states, and references remain separate fields.
5. Selecting research opens relevant recorded details. Research does not display invented ticket events, review counts, or worktree states.
6. Available actions reflect the selected record type and registered commands. Disabled reasons remain readable.
7. Existing research and planning actions retain their established command and fresh-chat behavior. No new conversion command is necessary.
8. Selecting a ticket retains its existing action targets, dependencies, and workflow safeguards.
9. Membership or type changes appear through live updates. The selected canonical record remains selected where its current membership permits.
10. Unreadable records and missing relationships display useful explanations. The interface does not silently fabricate membership.
11. Breadcrumbs and Esc return through the correct initiative or Ungrouped context. Workspace changes preserve the selected item.
12. Mixed lists preserve structured fields, wrapped titles, colour-independent meaning, and small-screen navigation.

## Out of scope

Do not add a Research workspace, record reassignment controls, or a new tracker backend. Do not change canonical workflow evidence rules.

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

