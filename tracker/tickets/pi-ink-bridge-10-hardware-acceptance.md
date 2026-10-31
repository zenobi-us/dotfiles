---
schema: tracker-ticket/v1
id: pi-ink-bridge-10-hardware-acceptance
title: "Verify the complete Paper Pro workflow"
parent: pi-ink-bridge
sequence: 10
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: ["pi-ink-bridge-05-inbox","pi-ink-bridge-06-editing-tools","pi-ink-bridge-08-delivery-recovery","pi-ink-bridge-09-discovery"]
---

## What to build

Verify the combined production workflow on a supported Paper Pro. Record evidence from installation through receipt of the annotated image in the originating Pi/OMP request.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Record device, firmware, AppLoad, XOVI, desktop dependency, and client versions. State the tested compatibility range and observed limits.
2. Run add-device, follow verified SSH installation, and observe sidebar launch after any required restart. Discover the server, compare the pairing code, and approve pairing locally.
3. Dispatch online jobs, select inbox images, draw with the pen, erase, undo, pan, and zoom. Save a draft, restart the client, and recover it. Send and observe aligned PNG receipt in the originating request.
4. Repeat installation with existing pairing and drafts. Verify that both remain available and the sidebar entry is not duplicated. Reject unsupported firmware before changes and altered downloads before execution.
5. Exercise the supported firewall configuration, blocked multicast with manual entry, disconnection, reconnection, and sleep/wake. Confirm the offline error and subsequent online dispatch.
6. Exercise simultaneous requests, conversation switching, terminal cancellation, duplicate submission, and recovery after service restart. Distinguish local save, server acceptance, and agent delivery.
7. Exercise the browser workflow without tablet setup. Preserve explicit completion, cancellation, abort, and editing without an arbitrary deadline.
8. Record actual hardware observations and integration results. Do not substitute compilation, protocol simulation, or an unobserved checklist for acceptance. Fix defects in scope before recording success.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
