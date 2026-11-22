---
title: Muxer handoff contract implementation
type: Report
---

# Muxer handoff contracts

## Source

Ticket: `tracker/tickets/skill-contract-manifests-06-muxer-handoffs.md`.

Branch: `feature/skill-contract-manifests-06-muxer-handoffs`. Base: `master`.

Commit: `e8d4f1d2b5a1ea6d16248ba79426e80558a9f357`. Tree: `a52fb75b3f43306ade529d963e1351223ed1bfc5`.

## Implementation

- Declare current and historical muxer records through one contract manifest. Reference result-delivery definitions from their owner.
- Produce schemaVersion-based run, completion, resource, spawn, wait, and lifecycle-view contracts. Preserve separate run, operation, process, transport, domain, and shutdown states.
- Use one completion writer for native and shell launchers. Retain immutable sequence and process records during cleanup.
- Add explicit historical reads and waits. Reject unsupported contracts, malformed records, mismatched identities, and symlinked evidence without conversion.
- Update owning guidance, examples, changelog, and consumer regression tests. The commit hook updated agent-core plugin and marketplace metadata to 0.1.36.

## Verification

- `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts`: 54 passed, zero failed, 153 assertions. Temporary test dependency links were removed.
- Shared manifest validation resolved 15 definitions, including both result-delivery versions from the sole transport owner.
- Real desktop spawn `7163c67f-61ca-4ed9-81e7-e63f941d32fb` completed. Its domain result intentionally failed. The result was retrieved, verified, and acknowledged. Only its terminal was closed. Process shutdown was confirmed. App selection stayed unchanged.
- Real retained legacy run `aa52253e-c682-4444-8842-9ca6e2aa51b9` passed explicit historical reads and waits. Checksums stayed unchanged. The default reader rejected it.
- Historical transport fixtures passed the result-delivery reader and muxer context consumer without writes. Unknown versions and unsafe symlink inputs failed without changing evidence or transport results.

[Validation snapshot](../artifacts/snapshots/validation-implementation-0002.json) retains command outcomes, identities, and checksums. No evidence run was invented.

## Receipt and review history

- [Authorized start](../events/start-0001.yaml).
- [Implementation result](../events/implementation-0002.yaml) was published and delivered.
- Parent validation and acknowledgement passed. [Parent completion](../events/start-complete-0003.yaml) records the clean source and confirmed process shutdown. Independent review, merge, and ticket completion remain pending. No review verdict is claimed.

## Limits

The TypeScript LSP could not initialize because its TypeScript installation was unavailable. No typecheck result is claimed. The parent closed the implementation terminal and confirmed owned-process shutdown. The source worktree remains available for review.



## Review — review-0006

Latest verdict: SUCCESS. No findings. Frozen commit `e8d4f1d2b5a1ea6d16248ba79426e80558a9f357`; tree `a52fb75b3f43306ade529d963e1351223ed1bfc5`.

- [Review ownership approval](../events/review-approval-0004.yaml).
- [Fresh review start](../events/review-start-0005.yaml).
- [Review result](../events/review-0006.yaml).
- [Immutable review artifact](../artifacts/reviews/review-review-0006.md).
- [Parent review completion](../events/review-complete-0007.yaml).

Reviewer validation: 54 tests passed; actual spawn, wait, retrieval, acknowledgement, historical reads, rejection preservation, and owned shutdown passed. Parent verified the exact clean source, transport/event equality, and all six retained evidence checksums. Reviewer pane removed; process shutdown confirmed. No resolved or remaining findings. No source changes, integration, push, or ticket completion. Earlier pending-review statements record implementation-time state; this section is current.
