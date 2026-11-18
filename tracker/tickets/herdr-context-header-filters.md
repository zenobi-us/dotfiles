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
- Use the active Herdr theme palette, locally provisioned JetBrains Mono, square geometry, compact spacing and thin borders.
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


### Approved verification follow-up

The user approved the proposed changes on 2026-11-18. Retain the active Herdr theme instead of a fixed violet palette. Provision pinned JetBrains Mono fonts, add focused filter and persistence regressions, and verify native keyboard, navigation, refresh, and layout-reload behavior in an isolated session. Keep unrelated typing diagnostics outside this ticket. Retain work_status: implemented; this follow-up does not claim completion or restart implementation ownership.

### Verification follow-up — 2026-11-18

Source commit: `1698d99e` (`fix(herdr): pin fonts for herdr-context-header-filters`). The approved acceptance change is in `16f5639e`.

Changes:

- Provisioned pinned regular and italic JetBrains Mono files in `mise/conf.d/devtools-herdrapp/app/mods/shared-context/fonts/`, with the upstream SIL Open Font License. The existing managed font manifest records their immutable source URLs and SHA-256 checksums.
- Retained the active Herdr theme. No fixed violet palette or unrelated typing changes were added.
- Added five behavior regressions for OR status queues, independent initiative visibility, completed and unclassified records, restriction counts, and repository-specific filter and selection persistence across reload.

Font correction: the earlier system `fc-match` result did not describe Herdr's font choice. Herdr already bundles JetBrains Mono and loads additional files from a mod's `fonts/` directory, not `fonts.json`. A probe in the running isolated application returned the exact `JetBrains Mono` family through `herdr.fonts()`. The local files match the recorded upstream checksums.

Observed checks:

- `mise exec -- node --experimental-vm-modules --test tests/ui-model.test.mjs`: 33 passed, 0 failed.
- `mise exec -- bun run test`: 65 Node tests and 17 Bun tests passed, 0 failed and 0 skipped.
- `herdr-app check` passed for `shared-context` and `shared-context-tabs`.
- Native acceptance used Herdr 0.1.16 on an owned 1280 × 720 headless Cage Wayland display and a private Core session. Real Local Markdown fixture repositories supplied READY, BLOCKED, and completed tickets.
- Native pointer and Enter/Space activation opened the checkbox menu. Keyboard status changes hid completed records and displayed one active restriction. Escape, Tab, and outside-click dismissal passed. These assertions used actual native frames, not mocked GPUI dispatch.
- Opening a blocking ticket and its prerequisite preserved navigation. The Blocking lineage view rendered both nodes and their dependency edge.
- Files navigation opened a real text preview. The Refresh control displayed changed file contents. Returning to Tracker retained the selected ticket and filter.
- Switching to a second repository showed its independent unfiltered records. Switching back and reloading the layout restored the first repository's filter, selected ticket, expanded file tree, and selected file preview.
- The installed application completed a `terminals` → `zenobius` refresh round-trip. Its original space, tab, and focused pane remained unchanged, and `herdr-app status` reported no errors.
- The owned private window closed normally and its private Core returned `stopped: true`. No pointer or keyboard automation touched the person's display.

Native originals and hashes: [capture provenance](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/captures.json). These are raw `herdr-app shot` captures, not a sealed collect-evidence run.

- [Checkbox menu and restriction count](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/filter-menu.png)
- [Dependency graph](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/dependency-graph.png)
- [Refreshed file preview](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/file-refreshed.png)
- [Repository state restored](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/repository-a-restored.png)

Review: direct review of the source follow-up against this ticket found no unresolved standards or specification findings. Font assets retain their license and immutable provenance; tests cover visible filtering and state isolation. This was not an independent subagent review.

Limits: native interaction coverage used the C2 layout and local fixture trackers, not Jira or remote machines. Existing editor typing diagnostics remain outside this follow-up; no TypeScript-clean claim is made.

Status remains `implemented`. The changes and verification are committed locally; no merge or push was performed.

### Native per-space destination check — 2026-11-18

A second owned native session used two real private Core spaces without explicit repository props. Space A selected Tracker; space B selected Files. Switching spaces restored each destination. An `empty` → `acceptance` layout reload preserved both destinations. The native app reported no errors. Both private spaces and their terminals were closed, the private window exited, and the private Core returned `stopped: true`. Temporary runtime files were removed.

Evidence: [space A Tracker](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/space-a-tracker-restored.png), [space B Files](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/space-b-files-restored.png), and [capture hashes](../../workflows/herdr-context-header-filters/artifacts/evidence/verification-2026-11-18/spaces-captures.json).
