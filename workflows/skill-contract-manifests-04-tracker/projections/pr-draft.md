---
title: Tracker contract cutover
type: Report
---

# Tracker contract cutover

## Ticket and problem

`tracker/tickets/skill-contract-manifests-04-tracker.md`: coordinate declared tracker contracts, safe upgrades and explicit historical readers.

## Implementation and changed files

Declared tracker-owned record, result, migration and setup contracts, with current schemaVersion outputs and explicit retained historical readers. Reused shared manifest resolution and safe/bulk upgrade policy. Added authorized owning update/upgrade commands with canonical kind/identity and complete membership preflight, raw authored-byte preservation, independent partial outcomes and rejected-byte equality. Preserved immutable migration plan/event bytes and hash chains. Coordinated normal tracker discovery, explorer consumers and tracker result validation/delivery. Setup upgrades run through shared policy only during authorized init; plan/check remain read-only. Updated owner guidance, examples/templates and required plugin/catalogue versions. No live tracker/workflow content was converted, and no merge, push, ticket completion or formal worktree review was performed.

The [immutable implementation draft](../artifacts/snapshots/pr-draft-implementation-0002.md) contains the complete 53-file inventory and observed command results. Source commit: `b062761b4a31681f4e826c4e3dad8770e8944607`. Source tree: `c741f5a04985243460a9677166ab9d049d836e9b`.

## Validation results

- **Owner suite:** 142 tests passed across 11 files.
- **Delivery integration:** 33 tests passed.
- **Explorer compatibility:** Five changed-path tests passed.
- **Runtime proof:** Tracker mutation/bulk, setup conversion and current/historical migration command smoke passed. Strict TypeScript and staged release-version checks passed.

The initial broad run exposed two failures in unchanged explorer expectation paths: `data.test.ts:296` (recorded attempts on invalid parent history) and `data.test.ts:609` (an unrelated missing blocker in a scoped snapshot). These behaviors were outside this schema cutover. The assertions and implementation were left unchanged. A separate baseline run was not performed. The scoped owner, delivery and compatibility checks below passed.

## Review history and findings

Implementation standards and specification self-checks found three mutation gaps; all were fixed and covered by passing owning CLI regressions. Remaining scoped findings: none. Latest formal reviewer verdict: not available. Formal review remains pending; self-checks do not replace it.

## Merge status

Not merged or pushed. Ticket completion and lifecycle completion remain parent-owned. All five owned children stopped, and their panes were removed. No owned services remain.

## Supporting records

- **Start receipt:** [start-0001](../events/start-0001.yaml).
- **Implementation receipt:** [implementation-0002](../events/implementation-0002.yaml).
- **Versioned draft:** [implementation draft](../artifacts/snapshots/pr-draft-implementation-0002.md).



## Parent completion

[Parent completion](../events/start-complete-0003.yaml) validates the exact clean source and authoritative result. The parent exercised historical read/check and authorized current-format mutation through the actual CLI in a disposable fixture. All owned child processes stopped; the implementation pane closed; the source workspace remains available. Formal review, integration and push have not run.
