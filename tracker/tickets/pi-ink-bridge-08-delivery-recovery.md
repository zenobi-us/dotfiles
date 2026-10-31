---
schema: tracker-ticket/v1
id: pi-ink-bridge-08-delivery-recovery
title: "Recover interrupted delivery without losing work"
parent: pi-ink-bridge
sequence: 8
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: ["pi-ink-bridge-07-drafts"]
---

## What to build

Recover jobs, synchronized drafts, and accepted results after interrupted connections or service restarts. Reconcile uncertain delivery without duplicate jobs or wrong-request images.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Disconnect before the tablet delivery acknowledgement. Reconcile the stable job ID before redispatch. Do not create a second inbox item or report an unconfirmed job as delivered.
2. Restart the service and recover device records, jobs, synchronized drafts, and accepted results from persistent storage.
3. Restart after result acceptance but before extension delivery. Reconnect the matching request and deliver exactly one image after its acknowledgement.
4. Repeat an upload and completion notification. Return the stored submission acknowledgement and do not add another agent image.
5. If the originating request is unavailable, retain the accepted result and report agent delivery as pending or unavailable. Do not send to the active conversation or claim delivery without acknowledgement.
6. Cancel before editing and while disconnected. A late upload or reconnection cannot revive the cancelled request.
7. Show pending delivery, delivered, editing, draft saved, result accepted, result delivered, and cancelled states accurately.
8. Prove recovery, persistence, isolation, and cancellation with the real service and actual HTTPS and WebSocket connections. Keep each run isolated in temporary storage.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
