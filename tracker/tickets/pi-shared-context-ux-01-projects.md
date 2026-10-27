---
blocked_by: []
id: pi-shared-context-ux-01-projects
parent: pi-shared-context-tui-ux-spec
sequence: 1
title: Select shared-context projects through interactive breadcrumbs
triage: ready-for-agent
type: enhancement
work_status: implemented
---

## What to build

Add the Projects view to the shared-context modal. Users open this view through a focusable, clickable Projects breadcrumb. Users select a project and browse its existing tracker and Files workspace.

Reuse shared-context enumeration and route resolution. Include the current project. Deduplicate entries by canonical identity. Do not scan unrelated repositories or add another project registry.

Establish the breadcrumb and focus contract for later tracker screens. The current command still opens the current project. Selecting another project changes only the modal context.

## Acceptance criteria

1. The project list displays a name and origin or stable identity for each project. Equal repository names remain distinguishable.
2. Keyboard focus reaches the Projects breadcrumb. Enter activates it. A mouse click activates the same control.
3. Selecting a project resolves its routes before record access. The selected project owns tracker reads, Files reads, and action targets.
4. The header displays Shared or Repo from the selected alignment route. The indicator is read-only.
5. Project selection does not change the active Pi session directory or system instructions.
6. Returning to a project restores its navigation, selection, and scroll position. Each workspace retains independent state.
7. Project changes dispose of old watchers and attach the correct new watchers. Old project updates do not change the selected project view.
8. A project without a usable checkout retains readable context. Checkout-dependent actions display a clear disabled reason.
9. No action runs against the previous project after selection changes. Existing action revalidation and fresh-chat behavior remain intact.
10. Tab and Shift+Tab move focus forward and backward. Existing workspace number shortcuts remain unchanged.
11. Esc from the tracker root opens Projects. Esc from Projects closes the modal. Existing Files escape behavior remains unchanged.
12. Empty, unreadable, and unavailable project states display distinct explanations. The current project remains reachable.

## Out of scope

Do not change tracker hierarchy in this ticket. Do not clone repositories, migrate storage, or change session instructions.

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

Review verdict: FAILURE. Reviewed commit: `afb6b874f70afb2035ed76288140daf1ff589691`. Timestamp: `2026-10-27T00:35:37.308396Z`. [Review artifact](../../workflows/pi-shared-context-ux-01-projects/artifacts/reviews/review-review-0005.md).


Review verdict: FAILURE. Reviewed commit: `f4dffcaebf159cb857eb6008fad80dfb03e214fc`. Timestamp: `2026-10-27T03:58:07.535376Z`. [Review artifact](../../workflows/pi-shared-context-ux-01-projects/artifacts/reviews/review-review-0011.md).

Review verdict: FAILURE. Reviewed commit: `34e28395c83826cdf46e1f09b8ad7761df2be219`. Timestamp: `2026-10-27T04:39:25.224307Z`. [Review artifact](../../workflows/pi-shared-context-ux-01-projects/artifacts/reviews/review-review-0017.md).
