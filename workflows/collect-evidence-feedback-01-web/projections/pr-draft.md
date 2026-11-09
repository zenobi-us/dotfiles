---
title: pr-draft
type: Report
---

# Web evidence draft

## Ticket summary

Preserve both real browser drivers in canonical collect-evidence. Ticket: [tracker/tickets/collect-evidence-feedback-01-web.md](../../../tracker/tickets/collect-evidence-feedback-01-web.md).

## Problem statement

Both real drivers must pass controlled-page workflows before cutover. Surf cannot reach /tmp/surf.sock.

## Implementation summary

No source changes. Required-driver preflight blocked this attempt. The existing skill and active callers remain intact.

## Changed files

No source files. This workflow contains a blocked-result event, draft, preflight output, recovery JSON, manifest, and generated projections.

## Validation results

Surf doctor and tab.list failed from /tmp. Unsetting SURF_SOCKET did not restore the connection. Native messaging manifest and wrapper checks passed. Playwright CLI reports 0.1.22; browser execution remains unverified. Neither real controlled-page workflow or existing suite ran. No captures or evidence run exist.

## Review history

No review occurred.

## Resolved findings

None.

## Remaining findings

Required Surf native-host connection unavailable. Source implementation and acceptance checks remain outstanding. The result writer created the event, then transport failed with ENOTDIR under /proc/self/fd/8/home. The writer was not rerun. The parent recovered delivery through the canonical physical path, verified the unchanged result and acknowledged it. Surf remains the implementation blocker.

## Latest reviewer verdict

None.

## Merge status

Not merged, pushed, submitted, or completed. Ticket remains claimed. Source HEAD: 859341b01ef7be474a3128b7f94772aab731c2f7.

## Supporting records

- **Start receipt:** [start-0001](../events/start-0001.yaml).
- **Blocked result:** [implementation-0002](../events/implementation-0002.yaml).
- **Immutable draft:** [pr-draft-implementation-0002](../artifacts/snapshots/pr-draft-implementation-0002.md).
- **Preflight output:** [Surf output](../artifacts/snapshots/surf-preflight-implementation-0002.txt).
- **Recovery object:** [Exact result payload](../artifacts/snapshots/result-recovery-implementation-0002.json).
- **Inspection input:** [Start inspection](../artifacts/snapshots/inspection-start-0001.json).
- **Launch input:** [Child identity](../artifacts/snapshots/launch-start-0001.json).


- **Parent completion:** [start-complete-0003](../events/start-complete-0003.yaml).


## Resumed implementation

The operator opened Chrome. Surf returned a live tab. [start-0004](../events/start-0004.yaml) starts attempt 2 in the same worktree. The prior blocked receipts remain unchanged. A fresh agent will run both real driver workflows before any cutover.
