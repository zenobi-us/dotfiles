---
blocked_by: []
id: herdr-context-header-filters
schema: tracker-ticket/v1
title: Use shared-context navigation and counted checkbox filters
triage: ready-for-agent
type: task
work_status: claimed
---

## What to build

Implement accepted UX option 2 for Herdr shared context.

## Acceptance criteria

- Use logo, Files/Tracker navigation, spacer, current store ID, Config and Refresh in the shared-context header.
- Replace separate Context and Tracker title-bar controls with one shared-context entry. Keep workspace Files and Changes.
- Replace footer filters with a borderless vertical-ellipsis dropdown at the top right of the tracker tree. Use checkboxes and an active-restriction count.
- Preserve repository selection, dependency context, file navigation and refresh behavior.
- Follow DESIGN.md palette, local JetBrains Mono, square geometry, compact spacing and thin borders.
- Verify filtering, keyboard dismissal and the running native surface.

## Comments

The user selected option 2 from the interactive preview, then requested DESIGN.md styling and a borderless vertical-ellipsis trigger. This session owns the new implementation. The prototype semantics use an independent Initiatives toggle and OR-combined Ready, Review and Blocked choices. All restores the unfiltered tree.

