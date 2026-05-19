---
id: llcp0105
type: task
title: Explicit Load Gate for chat requests
created_at: 2026-05-19
updated_at: 2026-05-20
status: completed
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 5
story_id: 
assigned_to: general-purpose-llcp0105-20260520
---

# Explicit Load Gate for chat requests

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Protect every `llamacpp` Provider Model request with an Explicit Load Gate. Before Pi sends a chat completion to the Provider Base URL, the gate must ensure the selected model is loaded or sleeping, request a load when needed, and return clear package-owned errors for load failures.

## Acceptance criteria

- [x] Load Gate hooks into provider request flow only for `llamacpp` Provider Models.
- [x] Already-loaded models pass through without redundant load calls.
- [x] Sleeping models are treated as request-ready.
- [x] Unloaded selected models trigger `POST /models/load` before chat completion requests.
- [x] Load polling honors configured load and gate timeout values.
- [x] Failed router models remain selectable if present in Router Model List, but requests fail with clear package-owned error details.
- [x] Unknown model IDs, unreachable router, auth errors, load failures, and timeouts produce distinct diagnostic errors.
- [x] `loadOnSelect` optionally triggers Explicit Load during model selection for earlier feedback.
- [x] Concurrent Pi instances are not coordinated by package-level locks; requests rely on router model id routing.
- [x] Unit tests cover loaded, sleeping, unloaded-success, failed-load, unknown-model, unreachable-router, auth-error, timeout, and `loadOnSelect` state transitions.

## Blocked by

[External Router discovery and Provider Refresh](./task-llcp0102-external-router-provider-refresh.md)

## User stories covered

13, 14, 15, 16, 17, 20, 26, 30

## Actual Outcome

Implemented `LoadGate` over `RouterClient` with request-time readiness checks, `POST /models/load`, polling against `/models`, configured timeout budgets, and distinct package-owned errors for unknown models, unreachable router, auth failures, failed loads, and timeouts. Provider Refresh now registers `beforeRequest` and `onModelSelect` hooks for `llamacpp` Provider Models; `loadOnSelect` gates selection feedback without adding package-level cross-process locks.

## Unit Tests

- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: loaded and sleeping model states pass through without load requests.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: unloaded models trigger `/models/load` and poll until loaded.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: failed Router Model state, failed `/models/load`, unknown-model, unreachable-router, auth-error, and timeout diagnostics are distinct.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: provider request and `loadOnSelect` hooks run only for `llamacpp` flow.

## Lessons Learned

- Request gating can stay package-local and deterministic by treating Router Model List as source of truth immediately before provider dispatch.
- Sleeping models need explicit ready-state handling; treating them as unloaded would add pointless load calls and false failures.
- Pi provider hooks are kept as package-owned extension metadata in tests; future Pi core hook naming changes should stay isolated to Provider Refresh wiring.
