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

Implemented `LoadGate` over `RouterClient` with request-time readiness checks, `POST /models/load`, polling against `/models`, and one whole-gate `requestGateMs` deadline layered over status/load operation timeouts. Errors are package-owned and distinct for unknown models, unreachable router, auth failures, load HTTP failures, load fetch failures, load timeouts, failed router model state, and gate timeouts, with secret-bearing diagnostics sanitized. Critical correction: real Pi `before_provider_request` hook exceptions are logged/swallowed by the runner and cannot block provider requests. Provider integration now registers `llamacpp` with custom API id `llamacpp-openai-completions` and a `streamSimple` wrapper that runs `LoadGate.ensureRequestReady(model.id)` before delegating to the built-in OpenAI-compatible stream. `model_select` remains optional early feedback only via `loadOnSelect`; it is not claimed as a hard request blocker. No package-level cross-process locks were added.

## Unit Tests

- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: loaded and sleeping model states pass through without load requests.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: unloaded models trigger `/models/load` and poll until loaded.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: failed Router Model state, failed `/models/load`, unknown-model, unreachable-router, auth-error, and timeout diagnostics are distinct.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: `llamacpp` provider config exposes custom `api` and `streamSimple`; stream wrapper rejects before delegate on unknown/unreachable/failed load state and delegates exactly once for loaded models.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: `requestGateMs` bounds initial `/models`, `POST /models/load`, and polling even when `loadMs`/`statusMs` are larger.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: `POST /models/load` fetch rejection and timeout are normalized distinctly and sanitized.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: failed router state wins over `loaded: true` and raw secret-bearing errors are redacted.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: providerless/non-`llamacpp` request hook contexts do not gate; `loadOnSelect: false` is a no-op.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: no `before_provider_request` hook is registered; provider `streamSimple` rejection is the enforced blocking path.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: caller `AbortSignal` composition with status/load timeouts, caller abort normalization, and bearer auth on `POST /models/load` are covered.

## Lessons Learned

- Request gating can stay package-local and deterministic by treating Router Model List as source of truth immediately before provider dispatch.
- Sleeping models need explicit ready-state handling; treating them as unloaded would add pointless load calls and false failures.
- Pi docs `docs/extensions.md` documents `before_provider_request` as payload inspection/replacement, while runner source `dist/core/extensions/runner.js` catches hook errors and returns the current payload. Therefore hook exceptions cannot enforce request blocking in real Pi execution.
- `docs/custom-provider.md` and `dist/core/model-registry.js` support provider `streamSimple`; Load Gate behavior now lives in the provider stream path where rejection propagates through provider execution.
- The stream wrapper delegates to `streamSimpleOpenAICompletions` from `@mariozechner/pi-ai/openai-completions` using a copied model with `api: "openai-completions"`, avoiding recursive dispatch through `llamacpp-openai-completions`.
- Fetch-level timeout signals must be composed with caller abort signals; replacing the timeout with the caller signal silently drops status/load bounds and leaves only user abort or the whole-gate deadline.
