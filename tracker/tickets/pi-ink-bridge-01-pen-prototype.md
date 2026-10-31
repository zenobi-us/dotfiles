---
schema: tracker-ticket/v1
id: pi-ink-bridge-01-pen-prototype
title: "Prove Paper Pro pen input"
parent: pi-ink-bridge
sequence: 1
type: prototype
triage: ready-for-agent
work_status: unclaimed
blocked_by: []
---

## What to build

Prove one source-image-to-pen-to-PNG workflow on a real Paper Pro before production implementation. Use temporary code to answer the pen-quality and firmware-compatibility questions. This ticket records a decision, not a production client.

Follow the parent initiative specification. Keep its scope limits and approved integration seam. Hardware checks require a real Paper Pro and its owner for device-only actions.

## Acceptance criteria

1. Open the temporary client through the proposed sidebar integration on a real Paper Pro. Record the device model, firmware, AppLoad version, XOVI version, and desktop dependencies.
2. Transfer a known source image to the device, draw with the real pen, and return a flattened PNG to the originating Pi/OMP request. Compare marked pixels and source dimensions to detect alignment errors.
3. Observe pen latency and palm handling during drawing. Record whether they are usable, the observed limits, and the evidence that supports the decision. AppLoad launch alone does not pass this gate.
4. Check source-image coordinates through display scaling and orientation changes. Keep source pixels separate from editable strokes.
5. Record a tested firmware range. Do not claim support for an untested firmware version.
6. Keep the findings and required decisions. Remove temporary code. If the approach fails, record the blocker and obtain a specification decision before production implementation starts.

## Comments

The user approved this ticket and its direct blockers during initiative decomposition.
