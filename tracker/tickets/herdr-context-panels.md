---
blocked_by: []
id: herdr-context-panels
schema: tracker-ticket/v1
title: Add native Context and Tracker panels to Herdr
triage: ready-for-agent
type: task
work_status: claimed
---

## What to build

Implement the accepted Herdr-app Context and Tracker panels. Use the existing shared-context and tracker TypeScript modules through direct imports in a local Bun service. Keep the existing Files and Changes panels.

## Acceptance criteria

- Add Context and Tracker controls beside Files and Changes.
- Show explicit context onboarding and the resolved file collections.
- Show initiatives, ticket dependency trees, shared prerequisite links, queues, record details, and workflow events from canonical data.
- Provide C as a stacked bottom drawer with expand, collapse, close, keyboard dismissal, and native motion.
- Provide C2 as the same compact tree beside record details.
- Expose the C or C2 preference through mod.schema.json for Better Config.
- Preserve selection per repository. Discard stale responses.
- Keep setup and fresh-chat actions explicit. Revalidate action inputs before launch.
- Exercise the native panels and setting changes in Herdr-app.

## Comments

The user selected C and C2 after the interactive prototype. This session owns this new ticket. No earlier owner or workflow exists for this new identifier. Keep the ticket incomplete until merge and push succeed.

