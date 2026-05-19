---
id: llcp0102
type: task
title: External Router discovery and Provider Refresh
created_at: 2026-05-19
updated_at: 2026-05-19
status: todo
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 2
story_id: 
assigned_to: 
---

# External Router discovery and Provider Refresh

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Connect the package to a compatible External Router at Server Base URL, read the Router Model List, map router models into Pi Provider Models, and refresh `llamacpp` provider registration through unregister-before-register behavior. `/llamacpp list` and `/llamacpp reload` must be useful with an external router and must not require managed process support.

## Acceptance criteria

- [ ] RouterClient can fetch and normalize the raw `/models` Router Model List from Server Base URL.
- [ ] Router management requests use Provider API Key bearer auth when configured.
- [ ] Compatible External Router reachability is reflected in Operational Status.
- [ ] Provider Models are registered only after compatible Router Model List retrieval succeeds.
- [ ] Provider Refresh calls unregister for `llamacpp` before registering current Provider Models.
- [ ] Stale Provider Models disappear after `/llamacpp reload` when the router model list changes.
- [ ] `/llamacpp list` displays the Router Model List, not just Pi-registered models.
- [ ] `/llamacpp reload` refreshes the router list and provider registration without requiring Pi restart.
- [ ] Unit tests cover router response mapping, auth header behavior, registration ordering, stale model removal, empty list behavior, and command output shape.

## Blocked by

[Package settings and status baseline](./task-llcp0101-package-settings-status-baseline.md)

## User stories covered

1, 4, 7, 10, 11, 12, 18, 20, 27, 29
