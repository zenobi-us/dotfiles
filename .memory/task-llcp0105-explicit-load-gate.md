---
id: llcp0105
type: task
title: Explicit Load Gate for chat requests
created_at: 2026-05-19
updated_at: 2026-05-19
status: todo
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 5
story_id: 
assigned_to: 
---

# Explicit Load Gate for chat requests

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Protect every `llamacpp` Provider Model request with an Explicit Load Gate. Before Pi sends a chat completion to the Provider Base URL, the gate must ensure the selected model is loaded or sleeping, request a load when needed, and return clear package-owned errors for load failures.

## Acceptance criteria

- [ ] Load Gate hooks into provider request flow only for `llamacpp` Provider Models.
- [ ] Already-loaded models pass through without redundant load calls.
- [ ] Sleeping models are treated as request-ready.
- [ ] Unloaded selected models trigger `POST /models/load` before chat completion requests.
- [ ] Load polling honors configured load and gate timeout values.
- [ ] Failed router models remain selectable if present in Router Model List, but requests fail with clear package-owned error details.
- [ ] Unknown model IDs, unreachable router, auth errors, load failures, and timeouts produce distinct diagnostic errors.
- [ ] `loadOnSelect` optionally triggers Explicit Load during model selection for earlier feedback.
- [ ] Concurrent Pi instances are not coordinated by package-level locks; requests rely on router model id routing.
- [ ] Unit tests cover loaded, sleeping, unloaded-success, failed-load, unknown-model, unreachable-router, auth-error, timeout, and `loadOnSelect` state transitions.

## Blocked by

[External Router discovery and Provider Refresh](./task-llcp0102-external-router-provider-refresh.md)

## User stories covered

13, 14, 15, 16, 17, 20, 26, 30
