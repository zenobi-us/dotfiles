---
blocked_by: []
id: pi-shared-context-tui-ux-spec
title: Improve shared-context project navigation and tracker readability
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## Problem Statement

The shared-context terminal user interface makes records difficult to read. Titles, types, states, counts, and references appear as similar text. Users cannot quickly identify the meaning of each field.

The current tracker starts with work queues and uses several dependency and evidence panes. Users need a clear project, initiative, item, and event hierarchy. Research needs a place beside tickets, not a separate workspace.

Users also need direct navigation through interactive breadcrumbs. They need a project list for shared context. The interface must preserve existing actions, copy behavior, workflow safeguards, and live updates.

## Solution

Display a project tracker with initiatives and an always-visible Ungrouped collection. Display research, tickets, and other supported records together within each initiative. Display unassociated records in Ungrouped.

Separate record types, titles, states, counts, and secondary information with alignment, spacing, and theme colours. Use short summaries and dedicated description readers. Keep detailed workflow evidence available without letting it dominate each screen.

Provide focusable and clickable breadcrumbs. The Projects breadcrumb opens the shared-context project list. Keep Files independent from the tracker. Do not add a Research tab.

## User Stories

1. As a user, I want a Projects view, so that I can select a project from shared context.
2. As a user, I want distinct project identities, so that I can distinguish repositories with the same name.
3. As a user, I want the current project in the project list, so that I can return to its tracker.
4. As a user, I want an interactive Projects breadcrumb, so that I can return directly to the project list.
5. As a keyboard user, I want focusable breadcrumbs, so that I can select an ancestor without a mouse.
6. As a mouse user, I want clickable breadcrumbs, so that I can select an ancestor directly.
7. As a user, I want readable breadcrumb labels, so that I can identify my location.
8. As a user, I want Esc to return one level, so that I can recover my previous context.
9. As a user, I want my previous selection and scroll position, so that return navigation does not lose my place.
10. As a user, I want a visible Shared or Repo indicator, so that I know the context storage location.
11. As a user, I want an initiative-first tracker, so that I can understand how work belongs together.
12. As a user, I want separate initiative titles, phases, and counts, so that I can read each field correctly.
13. As a user, I want an always-visible Ungrouped collection, so that I can find records without an initiative.
14. As a user, I want research and tickets in Ungrouped, so that no unassociated record disappears.
15. As a user, I want an initiative summary above its child list, so that I can understand the initiative before I select work.
16. As a user, I want a full initiative description reader, so that I can read the complete context.
17. As a user, I want research beside tickets, so that I can browse all initiative records in one list.
18. As a user, I want record type markers, so that I can distinguish research from tickets.
19. As a user, I want stable record IDs, so that I can identify records with similar titles.
20. As a user, I want wrapped titles, so that long titles remain readable.
21. As a user, I want separate status fields, so that status does not look like part of a title.
22. As a user, I want muted secondary information, so that titles remain easy to find.
23. As a user, I want visible child counts, so that I can understand the size of an initiative.
24. As a user, I want recorded review and fix counts, so that I can understand ticket history.
25. As a user, I want research-specific details, so that research does not inherit unrelated ticket controls.
26. As a user, I want existing research actions, so that research can lead to specs or initiatives.
27. As a user, I want a ticket summary above its event list, so that I can understand the selected ticket.
28. As a user, I want a full item description reader, so that I can read the complete record.
29. As a user, I want a description reader to restore my selection, so that I can continue from the same child or event.
30. As a user, I want distinct event types and outcomes, so that I can understand implementation, review, and fix history.
31. As a user, I want an event detail reader, so that I can inspect the selected evidence.
32. As a user, I want commit references separate from outcomes, so that I do not confuse source identity with success.
33. As a user, I want explicit evidence warnings, so that invalid or stale evidence does not appear current.
34. As a user, I want ticket status separate from the next action, so that readiness does not imply active execution.
35. As a user, I want dependency information, so that I can understand blocked work.
36. As a user, I want Ready, Review, Blocked, and All queues, so that I can find actionable tickets.
37. As a user, I want queues separate from initiative navigation, so that I can understand the current list scope.
38. As a user, I want the existing action menu, so that I can continue the established agent workflows.
39. As a user, I want action targets and disabled reasons, so that I know what each action affects.
40. As a user, I want existing copy behavior, so that the redesign does not change an established operation.
41. As a user, I want an independent Files workspace, so that file navigation remains separate from tracker navigation.
42. As a user, I want each workspace to retain its state, so that tab changes do not lose my place.
43. As a user, I want visible focus and selection, so that I know which control receives input.
44. As a user, I want complete keyboard navigation, so that mouse support remains optional.
45. As a user, I want readable small-screen layouts, so that essential fields and controls remain available.
46. As a user, I want meaning without colour, so that the interface works with limited terminal colours.
47. As a user, I want live updates without selection jumps, so that I can continue to read the same record.
48. As a user, I want distinct empty, loading, and error states, so that I know why records are absent.
49. As a user, I want an explanation after record removal, so that a refresh does not silently change my context.
50. As a user, I want accurate keyboard hints, so that the displayed recovery instructions work.

## Implementation Decisions

### Navigation and screens

- The modal remains the main interface boundary. The modal coordinates project selection, breadcrumbs, workspace tabs, tracker content, and focus.
- The normal command opens the current project tracker. The Projects breadcrumb opens the project list. The existing Files command continues to open Files.
- The tracker hierarchy is Projects, project initiatives, initiative child items, item overview, and event detail. A description reader returns to its originating screen.
- Ancestor breadcrumbs accept keyboard focus and mouse clicks. Enter activates a focused ancestor. The current breadcrumb identifies the current location.
- Esc returns one logical level. At the project tracker, Esc returns to Projects. At Projects, Esc closes the modal. Existing Files escape behavior remains unchanged.
- The modal does not create stacked navigation overlays. Each view retains selection and scroll position by stable record identity.
- Mouse support must cover breadcrumbs. Keyboard navigation must reach every breadcrumb, tab, list, reader, and existing action control.
- Use Tab and Shift+Tab for forward and reverse focus. Keep the existing Tracker and Files number shortcuts. Do not add a Research shortcut.
- Preserve existing action shortcuts. Keep uppercase R for refresh. Lowercase r must not replace the existing Review shortcut.

### Project discovery and context

- Reuse the shared-context enumeration and route resolver. Do not scan unrelated repositories or introduce a second project registry.
- Include available shared-context projects and the current project. Deduplicate entries by canonical project identity, not display name.
- Display the project name and a secondary origin or stable context identity. This information distinguishes equal repository names.
- Selecting a project changes the modal context. It does not change the active Pi session directory or its system instructions.
- Resolve the selected project routes before record access. Replace old watchers when the selected project changes. Restore per-project navigation on return.
- If a project lacks a usable repository checkout, keep its readable context available. Disable checkout-dependent actions with an explicit reason.
- Display Shared or Repo from the selected context alignment route. The indicator describes context storage, not every independent record route.
- The storage indicator is read-only. It does not migrate records or change routes.

### Initiatives and mixed child items

- The project tracker displays initiatives before the always-visible Ungrouped collection. Ungrouped remains visible with zero items.
- Ungrouped is a synthetic collection. It does not require an authored initiative record or expose initiative planning actions.
- Initiative membership uses canonical record relationships. Records without initiative membership appear in Ungrouped. Preserve direct dependency relationships separately.
- Display supported research, ticket, and other child record types in the same initiative list. Preserve their canonical type and reference.
- Reuse current tracker adapters and document-type information. Extend the explorer snapshot only where mixed records require additional data.
- Each child item has a stable identity, canonical reference, type, title, available status, body, and applicable relationships.
- Item details and available actions depend on the record type. Research does not inherit ticket-only workflow states, review counts, or worktree actions.
- Existing research and planning commands can lead to specs or initiatives. This feature does not define a new conversion workflow.
- An initiative summary displays its recorded phase only if authoritative data provides that phase. Otherwise, the interface displays an unavailable value.
- The interface must not infer an initiative phase from an action such as To tickets.
- An initiative count represents its associated child items. A column heading identifies the count as Items.
- Review and fix totals count validated receipts for their respective phases. They describe recorded attempts, not quality or completion.
- Ready, Review, Blocked, and All remain a distinct ticket queue view or mode within Tracker. Initiative navigation remains separate from queue rows.

### Row structure and visual presentation

- Render row fields separately. Do not create one title-like string from a type, title, state, count, and reference.
- Initiative rows separate the title, phase, and item count. Child rows separate the type, ID, title, and status.
- Event rows separate the event identity, outcome, and source reference. Keep each field role stable across event types.
- Titles use primary text. Secondary descriptions, counts, timestamps, and references use muted text.
- Theme colours distinguish navigation, success, warning, and error states. Use existing theme tokens instead of fixed terminal colours.
- A selected row uses a marker and a background. A focused control remains distinguishable from an inactive selection.
- Status words and type markers carry meaning without colour. Alignment and spacing preserve the same distinction in monochrome output.
- Long titles wrap under the title field. Wrapped titles do not enter the status or count fields.
- At narrow widths, move secondary fields to another line. Preserve the title, identity, and status without a concatenated fallback.
- At short heights, reduce decorative space and help text. Keep the selected row and essential navigation controls visible.
- Preserve terminal-control sanitization and display-width handling for all record text.

### Descriptions, events, and workflow safety

- Initiative and item overviews display short description summaries. A keyboard-accessible and clickable control opens the full description.
- Full descriptions use a scrollable reader with a persistent record heading. Esc or the return control restores the previous screen state.
- Ticket overviews display a summary above event history. Research overviews display relevant recorded details without fabricated ticket events.
- Event detail displays the outcome and readable body before extended evidence metadata. Full evidence remains reachable.
- Preserve source commit and tree comparisons, invalid-event details, dependency blockers, and transition restrictions.
- Distinguish tracker status, recorded workflow activity, next available action, review verdict, and evidence validity.
- An available Review action means ready for review. It does not mean that a review currently runs.
- Display changed-file counts only when durable evidence supplies them. Do not infer counts from prose.
- Retain the current action menu, prompt collection, fresh-chat confirmation, record revalidation, and unsent command behavior.
- Preserve existing copy and editor-insertion behavior. Do not create a tracker clipboard contract from the sketch alone.
- Files remains independent. Do not add tracker-to-file links or file-to-tracker links.

### Live updates and exceptional states

- Preserve live updates for the selected project. Retain selection by record identity across updates and tab changes.
- Distinguish loading, empty collections, empty queues, unreadable records, and refresh failures.
- If a refresh fails, retain the last readable content and display the failure. Do not enable unsafe workflow transitions.
- If the selected record disappears, display an explanation and select the nearest available record or its parent.
- If no actionable record exists, do not open an empty action menu.
- All visible keyboard hints must match actual input behavior. Correct the existing empty-queue hint for the All shortcut.

## Testing Decisions

- The user approved modal behavior tests and terminal checks. The complete shared-context modal is the primary automated test boundary.
- Send keyboard and mouse input through the public modal interface. Assert visible records, navigation results, action targets, and externally visible state.
- Prefer existing loader injection and temporary-store fixtures. Do not introduce another navigation-only test interface.
- Existing modal tests provide precedent for workspace activation and retained state. Existing explorer tests provide precedent for navigation, width limits, and evidence access.
- Existing live tests provide precedent for temporary repositories, real record loaders, watchers, and visible updates through the complete modal.
- Use representative projects with duplicate display names, initiatives with mixed child types, and an empty Ungrouped collection.
- Cover project changes, breadcrumb activation, Esc return paths, description return paths, per-project state, and independent Files state.
- Cover associated and unassociated research and tickets. Assert that each record appears in the correct collection with its canonical identity.
- Cover type-specific actions and the distinction between next action and active execution. Preserve consumer-visible workflow safety tests.
- Cover long titles, Unicode widths, terminal controls, monochrome meaning, and fields that move between lines.
- Cover live record updates, selected-record removal, refresh failure, and watcher replacement after project selection.
- Assert that unavailable repository-dependent actions explain their restriction. Do not execute an action against the original project after a project change.
- Avoid tests that compare implementation strings, internal row arrays, incidental whitespace, or forwarded mock values.
- Run the actual Pi modal for terminal acceptance. Exercise keyboard focus, clickable breadcrumbs, selection, description readers, and tab changes.
- Inspect representative terminal sizes of 40 by 12, 80 by 24, and 120 by 40. Inspect both colour and monochrome presentation.
- Keep visual evidence for title wrapping, separate status fields, counts, focus, and small-screen navigation. Renderer tests alone do not prove these visual requirements.
- Check the existing action and copy paths without changing their established semantics.

## Out of Scope

- A Research workspace or Research tab.
- Cross-links between Files and Tracker.
- A new clipboard or editor-insertion contract.
- New agent commands, research conversion commands, or workflow transition rules.
- Changes to receipt authority, evidence validity rules, or immutable workflow records.
- Storage migration, route changes, or a storage toggle.
- A global repository scan, a new project registry, or automatic repository cloning.
- Changes to the active Pi session directory or system instructions after project selection.
- New record editing, deletion, or reassignment controls.
- A separate search feature, new tracker backend, or unrelated extension cleanup.

## Further Notes

The user sketch and later corrections define the product intent. The later corrections remove the Research tab and require mixed initiative child lists.

The main visual requirement is field separation. Identity comes first. State occupies a separate field. Supporting information occupies a subordinate line.

The specification preserves current Tracker and Files number shortcuts. The sketch does not require a shortcut migration.

The prior inspection exercised real render and input handlers at 100-column and 60-column widths. The repository-backed snapshot returned no records. Populated navigation used fixtures.

Those checks did not constitute a complete Pi terminal acceptance run. Implementation must supply that run before delivery.

This record is the specification, not an implementation claim. Its triage is ready-for-agent and its work status remains unclaimed.

## Comments

The user approved the test boundary: modal behavior tests and terminal checks.

