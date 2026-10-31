---
schema: tracker-ticket/v1
id: pi-ink-bridge-07-drafts
title: "Save and recover editable drafts"
parent: pi-ink-bridge
sequence: 7
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: ["pi-ink-bridge-04-annotation-round-trip"]
---

## What to build

Save editable annotations without completing the agent request. Recover them after client restart and continue downloaded work during a temporary disconnection.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Save persists editable strokes locally before reporting success. Save never resolves the originating request or changes a draft into a sent result.
2. Restart the client and recover the correct source image and editable strokes for each saved job.
3. Disconnect the tablet and continue an already downloaded job. Save locally while disconnected and synchronize drafts through authenticated HTTPS after reconnection.
4. Persist synchronized drafts in service storage. Keep source pixels and strokes separate and preserve source-image alignment.
5. Show local-save status, server acceptance, and agent delivery as distinct outcomes. Label Save separately from Send.
6. Exercise Save and Send through the real service integration seam. Observe client restart recovery and disconnected drawing on the real tablet.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
