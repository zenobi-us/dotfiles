---
schema: tracker-ticket/v1
blocked_by: 
  - pi-shared-context-ux-01-projects
id: pi-shared-context-ux-02-initiatives
parent: pi-shared-context-tui-ux-spec
sequence: 2
title: Browse initiatives through structured tracker rows
triage: ready-for-agent
type: enhancement
work_status: completed
---

## What to build

Make the project tracker open with initiatives and an always-visible Ungrouped collection. Opening an initiative displays its summary and current child records.

Use the project context and interactive breadcrumb contract from the project-selection ticket. Replace title-like concatenated rows with distinct visible fields.

Preserve existing item details and queues. Later tickets extend mixed-item behavior and update queue presentation.

## Acceptance criteria

1. The normal tracker entry displays initiatives before Ungrouped. Ungrouped remains visible with zero items.
2. Ungrouped is a synthetic collection. It does not create an authored initiative or expose initiative planning actions.
3. Opening an initiative displays its identity, description summary, and child list. Opening a child reaches its existing detail view.
4. Initiative rows separate title, recorded phase, and Items count. Unknown phase data displays an unavailable value rather than an invented action-derived phase.
5. Child rows separate type, stable ID, title, and available state. Supporting information occupies a subordinate line.
6. Long titles wrap beneath the title field. Status and count fields remain distinct. Narrow layouts move secondary information to another line.
7. Theme colours distinguish field roles. Type markers, status words, spacing, and alignment preserve meaning without colour.
8. A selection marker and background identify the selected row. Focus remains distinct from an inactive selection.
9. Breadcrumbs accept focus and mouse clicks at each available ancestor. Esc returns one level and restores selection and scroll position.
10. Live updates preserve selection by record identity. Record removal displays an explanation and selects a nearby record or its parent.
11. Loading, empty initiatives, unreadable records, and refresh failures display distinct states. Refresh failures retain the last readable content.
12. Existing queues remain accessible in a separate mode or view. Files remains independent with no tracker cross-links.
13. Existing action and copy behavior remains available. Keyboard hints match the actual controls.

## Out of scope

Do not add a Research tab, new conversion commands, or description readers. Do not infer initiative phases from To tickets.

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


- 2026-10-27T23:57:20.073464+00:00: Review **FAILURE** for source `7c647581807920320efa191f946b8ce9183558b7`. [Immutable review](../../workflows/pi-shared-context-ux-02-initiatives/artifacts/reviews/review-review-0014.md).

- 2026-10-28T00:36:00.616232+00:00: Review **FAILURE** for source `d1ad6dbabb7131de2910334f2b750f8586a0e4ca`. [Immutable review](../../workflows/pi-shared-context-ux-02-initiatives/artifacts/reviews/review-review-0026.md).

- 2026-10-28T01:55:45.689352+00:00: Review **SUCCESS** for source `66c988a405aa7b8b95cd2cb6d207f8147036e708`. [Immutable review](../../workflows/pi-shared-context-ux-02-initiatives/artifacts/reviews/review-review-0038.md).

- 2026-10-28T02:25:11.800Z: Completed after exact-source review SUCCESS (66c988a405aa7b8b95cd2cb6d207f8147036e708), integration `55f5336dbeb72d383ce818d8d8ddcdfd127b55e7` published to origin/master, 136 integrated tests and scoped TypeScript checks passed, and live Pi compact Events/overview plus Files/Tracker return checks passed. [Review](../../workflows/pi-shared-context-ux-02-initiatives/artifacts/reviews/review-review-0038.md). [Integrated validation](../../workflows/pi-shared-context-ux-02-initiatives/artifacts/evidence/finish-0040/integrated-validation.json). [Live Pi evidence](../../workflows/pi-shared-context-ux-02-initiatives/artifacts/evidence/finish-0040/integrated-runtime-smoke.json). Finish is continuing through resource cleanup; authoritative checkpoint: [published integration](../../workflows/pi-shared-context-ux-02-initiatives/events/finish-pushed-0044.json).
