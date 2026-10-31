---
schema: tracker-ticket/v1
id: pi-ink-bridge-05-inbox
title: "Select and manage multiple inbox jobs"
parent: pi-ink-bridge
sequence: 5
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: ["pi-ink-bridge-04-annotation-round-trip"]
---

## What to build

Show assigned jobs in an annotation inbox. Select and edit one job without overwriting or revealing another job.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Show a list or grid with thumbnails, request text, project display name, and job status. Use the proposed tablet UI as a design reference.
2. Switch among several assigned jobs without mixing source images, strokes, results, or request ownership. Send each result only to its originating request.
3. Show empty, disconnected, cancelled, and error states. Keep job state consistent when a notification arrives while another job is open.
4. Enforce device assignment on inbox, thumbnail, source-image, and result access. A device cannot read or modify another device's jobs.
5. Observe real tablet job selection and completion. Exercise concurrent requests through the real service integration seam.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
