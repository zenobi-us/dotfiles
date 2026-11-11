---
title: Herdr Context and Tracker fix draft - fix-0011
type: Report
---

# Herdr Context and Tracker - review fixes

## Scope

Ticket: `tracker/tickets/herdr-context-panels.md`. Fixes only S-001, P-001, P-002 and P-003 from [review-0008](../reviews/review-review-0008.md). No ADR applies. The parent owns independent review, integration, tracker updates and publication.

## Changes

- Reload all retained expanded Context directories during Refresh and settings restoration. Keep repository-generation guards.
- Restore expandable blockedBy paths in the compact C/C2 tree. Shared prerequisite arrows reveal the canonical path. Keep initiative/type groups, filtered prerequisite context, cycle/missing-record errors and the additional graph.
- Bind pending action preparation to generation and repository/record identity. Invalidate on repository, record and action-input changes or view closure. Ignore stale success, failure and busy-state completion. Unchanged selection launches once.
- Use a monotonically increasing file-preview generation for success and failure, including A-B-A and returning to the file tree.
- Add deterministic behavioral regressions and update the existing README operating guide.

## Exact source

- Base before synchronization: `358da5adabbc33bb14c42646fb5b82cad8f3a7f2`.
- Source: `6fac3b638ca19c670ce9df7f4d1ee20b0414d40c`.
- Tree: `c813ac0a32a4ef7103a424b7c5395a2192f39b84`.
- Commits: `66754765bfc98baa79181e80e4b64c70c54e3ca8`, `6fac3b638ca19c670ce9df7f4d1ee20b0414d40c`.
- Branch: `closeout/herdr-context-panels`. Source checkout is clean. Rebase completed without conflicts.
- [Window authorization](../../events/window-approval-0012.json). The other workflow's processes and cleanup dialog were not touched.

## Verification

- Scoped Bun suite: 35 passed, 0 failed, 114 assertions. Its native-boundary fixture contains 15 deterministic ordering cases. Scoped TypeScript passed.
- Private native checks proved nested Refresh and Better Config restoration, C/C2 dependency paths and shared-reference navigation, delayed stale preparation success/error with record/repository changes, one unchanged real fresh-session launch, and preview A-B/A-B-A failures.
- Post-rebase native checks passed for shared-context and shared-context-tabs. Real canonical context, nested-directory, file-preview and action-preparation API smoke passed.
- All 15 native-exercised JavaScript modules match the rebased source.
- [Native acceptance record](../evidence/fix-0011-native/acceptance.json), [post-rebase validation](../evidence/fix-0011-native/final-validation.json), [source identity](../evidence/fix-0011-native/final-source.json), [media](../evidence/fix-0011-native/media/).

## Limits and cleanup

Native checks used owned headless cage/Xwayland and software rendering. Explicit test-only delay injection held real canonical responses; no injection code is shipped. Initial module checks without the stopped display failed to connect to X; all checks passed with the owned display available.

The native input dropped spaces from the smoke qualifier. The real Ask Matt session made 13 read-only tool calls and returned read-only advice instead of the requested marker. The fixture ticket hashes stayed unchanged. No claim, implementation, merge or push action ran.

Owned app, core and displays are stopped. Private fixtures and injection scaffolds are removed after evidence preservation. No user window or unrelated process was changed. No historical review or new independent SUCCESS verdict is asserted.

