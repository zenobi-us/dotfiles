---
schema: tracker-ticket/v1
id: pi-ink-bridge-04-annotation-round-trip
title: "Send one annotation to its originating request"
parent: pi-ink-bridge
sequence: 4
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: ["pi-ink-bridge-03-pair-device"]
---

## What to build

Select an online paired tablet from Pi/OMP, receive one image, draw with the pen, and send an aligned PNG back to the originating request. Keep the browser target available.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Distinguish paired devices from online devices. Online requires a current authenticated connection and client readiness. Reject offline dispatch with instructions to turn on the tablet and open Pi Annotations. Do not queue offline jobs or switch targets silently.
2. Use an outbound authenticated WebSocket for readiness, heartbeat, job acknowledgement, cancellation, and completion notifications. Use authenticated HTTPS for source images and result uploads. Do not add SSE or inbound tablet ports.
3. Assign a stable job ID and record extension, session, request, device, and source identities. Include request text and project display context without exposing arbitrary desktop filesystem paths.
4. The tablet acknowledges delivery only after local storage. Persist service jobs and results. Report an unconfirmed delivery when acknowledgement is uncertain.
5. Draw pen strokes over a locked source image. Send produces a flattened PNG with correct marked pixels and source dimensions. Keep editable strokes separate.
6. Acknowledge a result only after durable storage. Retain the local result until acknowledgement. Use a stable submission identity so repeated submissions and notifications cannot produce duplicate agent images.
7. Return the PNG only to the originating request. Isolate concurrent extension instances, conversations, devices, and desktop users. Enforce terminal cancellation even when a late result arrives.
8. Validate source images and exports. Preserve existing size limits. Reject malformed or oversized input without corrupting saved work.
9. Use the main integration seam from extension submission through the real service and tablet protocol to returned pixels. Exercise browser new drawings, source annotation, explicit completion, cancellation, abort, and editing without an arbitrary deadline.
10. Observe one production-client round trip on the supported Paper Pro. A protocol client alone does not establish pen quality.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
