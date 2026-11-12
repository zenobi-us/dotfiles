---
blocked_by: []
id: herdr-context-header-filters
schema: tracker-ticket/v1
title: Use shared-context navigation and counted checkbox filters
triage: ready-for-agent
type: task
work_status: implemented
---

## What to build

Implement accepted UX option 2 for Herdr shared context.

## Acceptance criteria

- Use logo, Files/Tracker navigation, spacer, current store ID, Config and Refresh in the shared-context header.
- Replace separate Context and Tracker title-bar controls with one shared-context entry. Keep workspace Files and Changes.
- Replace footer filters with a borderless vertical-ellipsis dropdown at the top right of the tracker tree. Use checkboxes and an active-restriction count.
- Preserve repository selection, dependency context, file navigation and refresh behavior.
- Follow DESIGN.md palette, local JetBrains Mono, square geometry, compact spacing and thin borders.
- Verify filtering, keyboard dismissal and the running native surface.

## Comments

The user selected option 2 from the interactive preview, then requested DESIGN.md styling and a borderless vertical-ellipsis trigger. This session owns the new implementation. The prototype semantics use an independent Initiatives toggle and OR-combined Ready, Review and Blocked choices. All restores the unfiltered tree.


### Implementation and verification

Implemented accepted option 2 in mise/conf.d/devtools-herdrapp/app. Installed the managed frontend modules without changing mod settings. Refreshed the running CLI layout through the existing shared-context layout. Restored the CLI layout and panel width after visual inspection. The running app reports no errors.

The header has Files/Tracker navigation and one Shared context entry in both outer title bars. The tree has a borderless vertical-ellipsis popover, checkbox filters, an active-restriction count, and empty-state reset. Filters and record selection remain per repository. DESIGN.md colours, square geometry, compact typography and embedded local JetBrains Mono apply to the shared-context surface.

Validation: bun test tests passed 30 tests with 101 assertions. bun x tsc --noEmit --project tsconfig.json passed. All three installed mods passed herdr-app check. Native smoke used an isolated headless Cage compositor and the actual panel against canonical repository data. Screenshots verified pointer filtering, All/Reset and empty state, count updates, trigger and outside dismissal, Escape/Enter opening, arrow-key movement, Space checkbox activation, Tab dismissal, Files/Tracker navigation, and retained record selection. Native smoke found and corrected pointer-dismissal and keyboard-action ownership issues before installation. No input automation touched the user display.

### Review

Ticket: tracker/tickets/herdr-context-header-filters.md. Branch: master. Reviewed baseline: a16997e5 plus the uncommitted feature changes. Scope: shared-context native UI, both title bars, tree model/declarations, regression tests, typecheck configuration and README.

Standards: no unresolved source findings. The reviewer checked native component APIs, pointer ownership, scoped checkbox actions, filter composition and saved state. Earlier pointer and Space-action issues were corrected and exercised in native smoke.

Spec: no unresolved findings. The reviewer checked the accepted option, DESIGN.md, one outer entry, independent workspace panels, filter semantics and view retention. The last shared-context destination now persists independently per space. The installed guide confirms embedded JetBrains Mono.

Verdict: SUCCESS for the reviewed implementation and observed local verification. The reviewers performed read-only source review; the parent performed runtime verification. No merge or push was requested or performed. The ticket is implemented, not completed.


Source commit: 4ed542f8 (feat(herdr): add herdr-context-header-filters).


### Correction: retain the flat membership tree

The user reported that dependency nesting returned after deployment. The repository tree.js still expanded blockedBy recursively, unlike the previously installed flat version. Deploying that source restored an unrelated behavior. Removed recursive dependency expansion from the file tree. Tickets are leaves beneath their initiative or record-type group; shared initiative membership still links to a canonical membership row. Status filtering no longer injects prerequisite records. Dependency edges, cycle checks, and transitive lineage remain in the unchanged DAG model and DAG views. Updated regression cases and operating guidance.


Correction verification: all 30 scoped tests pass with 95 assertions, including flat leaf rows, shared membership, filtering, and unchanged DAG edges/cycle errors. Typechecking and the installed native mod check pass. The running native tree visibly shows member tickets at one depth with no ticket expanders. The CLI layout reports no errors.

