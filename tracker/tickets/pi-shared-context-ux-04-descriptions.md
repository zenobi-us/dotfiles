---
schema: tracker-ticket/v1
blocked_by: 
  - pi-shared-context-ux-03-mixed-items
id: pi-shared-context-ux-04-descriptions
parent: pi-shared-context-tui-ux-spec
sequence: 4
title: Read complete initiative and item descriptions
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Add dedicated description readers for initiative and item summaries. Support research and tickets through their type-specific overview screens.

Users open the complete description through a visible control. Keyboard input and mouse clicks reach the same reader. The reader replaces the content view without another stacked modal.

## Acceptance criteria

1. Initiative and item summaries expose a clearly labelled description control. The control supports keyboard focus, activation, and mouse clicks.
2. Opening a description displays the full recorded body with the selected record heading. It does not substitute a shortened excerpt.
3. Arrow keys and page controls scroll the reader. Long lines and Unicode text remain inside terminal bounds.
4. Esc or the visible return control restores the originating screen, selected child or event, and scroll position.
5. Returning through a breadcrumb follows the shared ancestor navigation contract. It does not leave an orphaned reader state.
6. Each project and workspace retains its reader context during navigation. A project change does not display the previous project body.
7. Live body updates retain a valid scroll position. Record removal displays an explanation and returns to a valid parent.
8. Empty descriptions and unreadable bodies display distinct explanations. They do not resemble a loading state.
9. Short terminals keep the heading, readable body space, and return controls available. Colour is not necessary to identify focus.
10. Existing action and copy behavior remains unchanged. The reader adds no Files cross-links.

## Out of scope

Do not add record editing, another overlay stack, or new copy semantics.

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

