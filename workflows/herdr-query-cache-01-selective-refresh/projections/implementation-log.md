---
source_commit: 8ff5def35291d6271aa1ac3768386dff48dad26c
source_tree: a1e58164be06dd02fb6ef73fb8d131db4498fe1e
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Selective refresh implementation log
type: Concept
---

# Implementation history

Generated from authoritative events.

| Receipt | Event | Status | Source commit |
| --- | --- | --- | --- |
| start-0001 | start/phase-start | started | `9345684e7b4a20db7ed5a0059376c5e40e1e29ed` |
| implementation-0002 | implementation/phase-result | completed | `8ff5def35291d6271aa1ac3768386dff48dad26c` |

## Implementation result

Implemented bounded read caches, helper-owned batch validation and selective native-panel refresh with fresh action checks.

- Versioned machine/user/path/route/operation/schema/loader identities; private atomic bounded disk storage and bounded validation staging.
- Canonical byte, membership, path and Git replay; one metadata-only batch, four validation workers and shared rechecked snapshots.
- Persistent stale display, selective refresh, tree-before-details progress, current-first eviction handling and cross-client tombstones.
- Late-generation/deletion safety and cancellable worker plus job-file cleanup. Setup, mutations, preparation and authorization remain uncached.

Source tree: `a1e58164be06dd02fb6ef73fb8d131db4498fe1e`. Changed files and exact checks are in the [PR draft](pr-draft.md) and [evidence](../artifacts/evidence/implementation-0002/index.md). All 19 changed source files are committed.

## Verification and cleanup

47 panel/Core tests and 17 helper/backend tests passed, plus build, TypeScript and native mod checks. Real native scenarios covered all ticket categories. Final retained values matched 128 canonical reads. Owned app/Core/query resources were stopped and scratch fixtures removed. The source checkout remains clean and available. Parent removed the child pane and confirmed shutdown of all recorded owned processes after explicit operator approval.

## Open questions and next action

No open questions. Independent review. Parent completion and approved child-process shutdown are confirmed in `workflows/herdr-query-cache-01-selective-refresh/events/start-complete-0003.yaml`. No formal verdict, merge, push or ticket completion is recorded.

