---
schema: tracker-ticket/v1
id: pi-ink-bridge-06-editing-tools
title: "Correct annotations and inspect image details"
parent: pi-ink-bridge
sequence: 6
type: task
triage: ready-for-agent
work_status: unclaimed
blocked_by: ["pi-ink-bridge-04-annotation-round-trip"]
---

## What to build

Correct pen annotations with erasing and undo. Pan and zoom over a locked source image without changing stroke alignment.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Use the real tablet pen to add strokes, erase strokes, and undo edits. Keep the source image locked.
2. Pan and zoom to annotate image details. Preserve source-image coordinates through scale and orientation changes.
3. Send the edited image and verify flattened PNG pixels and original source dimensions. Retain editable strokes separately.
4. Check alignment and edits through the approved main integration seam. Do not create a separate ink geometry unit-test suite.
5. Observe erasing, undo, pan, zoom, pen latency, and palm handling on the supported Paper Pro. Protocol simulation alone does not satisfy this check.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
