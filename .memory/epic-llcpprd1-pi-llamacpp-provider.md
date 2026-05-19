---
id: llcpprd1
type: epic
title: Pi LlamaCpp Provider PRD
created_at: 2026-05-19
updated_at: 2026-05-19
status: planning
triage: ready-for-agent
---

# Pi LlamaCpp Provider PRD

## Problem Statement

Pi users who run local GGUF models through llama.cpp need a first-class local provider that does not confuse Pi client model configuration with llama.cpp runtime Model Presets. Current package state is only a stub, so users must manually wire local OpenAI-compatible endpoints and lose Pi-side provider refresh, explicit load behavior, operational status, and safe managed-router lifecycle controls.

The core risk is bad responsibility split: if Pi treats GGUF runtime settings as Provider Model config, local model loading becomes stale, implicit, and hard to diagnose. The provider must instead treat the Llama Server Router as source of truth for model availability, use Model Presets only for runtime loading and limited Preset Metadata, and expose stable Pi Provider Models only when router state supports them.

## Solution

Build a Pi package extension that manages or adopts a single Llama Server Router, reads a Configured Preset File when selected, discovers the Router Model List, registers a `llamacpp` Provider Model set in Pi, and protects requests through an Explicit Load Gate before chat completions reach the OpenAI-compatible endpoint.

From the user's perspective:

- Install/enable the package.
- Configure Server Base URL, Provider API Key, optional server binary path, optional Configured Preset File, and timeout behavior through Pi settings.
- Run `/llamacpp start`, `/llamacpp list`, `/llamacpp reload`, `/llamacpp status`, and `/llamacpp stop` for local-router operations.
- Select `llamacpp/<model-id>` from Pi model selection only after compatible router discovery.
- Receive clear failures when preset files are missing, router models fail loading, auth fails, or timeouts expire.

## User Stories

1. As a Pi user, I want local llama.cpp models to appear in `/model`, so that I can use GGUF models without hand-editing `models.json`.
2. As a Pi user, I want Pi to distinguish Model Presets from Provider Models, so that runtime loading args do not leak into client routing config.
3. As a Pi user, I want Pi to auto-start a managed Llama Server Router when configured, so that local models are available without manual shell setup.
4. As a Pi user, I want Pi to adopt an already-running External Router, so that shared local model servers are not treated as errors.
5. As a Pi user, I want `/llamacpp stop` to stop only the package-owned process, so that other Pi instances or external tools are not killed.
6. As a Pi user, I want a missing Configured Preset File to block managed start with a clear error, so that Pi does not silently fall back to stale cached models.
7. As a Pi user, I want `/llamacpp list` to show the Router Model List, so that I can see availability and runtime status beyond registered Pi models.
8. As a Pi user, I want `/llamacpp status` to show Operational Status, so that router, preset, process, provider, timeout, and recent log issues are diagnosable.
9. As a Pi user, I want bounded stdout/stderr log tails for managed processes, so that failures are visible without flooding Pi UI.
10. As a Pi user, I want `/llamacpp reload` to refresh provider registration, so that newly added Model Presets become selectable without restarting Pi.
11. As a Pi user, I want Provider Refresh to unregister before register, so that stale Provider Models do not remain selectable.
12. As a Pi user, I want Provider Models registered only after compatible router discovery, so that dead local models do not clutter model selection.
13. As a Pi user, I want failed router models to remain visible but fail clearly through the Load Gate, so that I understand why a selected model cannot run.
14. As a Pi user, I want model selection to optionally trigger load, so that I can get earlier feedback before sending a prompt.
15. As a Pi user, I want every request to trigger Explicit Load when needed, so that chat requests do not race model residency.
16. As a Pi user, I want sleeping models treated as request-ready, so that llama.cpp sleep/offload behavior does not cause unnecessary failure.
17. As a Pi user, I want separate timeouts for start, load, polling, and request gate waits, so that slow local hardware can be tuned without masking unrelated failures.
18. As a Pi user, I want Provider Base URL derived from Server Base URL, so that router management and OpenAI-compatible requests use the correct endpoints.
19. As a Pi user, I want Provider API Key resolution to support literal values and environment variable names, so that local dummy auth and secured routers both work.
20. As a Pi user, I want router management requests to reuse Provider API Key bearer auth, so that secured llama-server management endpoints work consistently.
21. As a Pi user, I want Preset Metadata normalized from documented INI aliases only, so that Provider Model labels and limits are enriched without changing runtime behavior.
22. As a Pi user, I want context size, max prediction tokens, and reasoning metadata surfaced when available, so that Pi model details are useful.
23. As a Pi user, I want invalid metadata ignored or reported without mutating runtime args, so that Model Presets remain the source of llama.cpp behavior.
24. As a Pi user, I want Pi quit behavior controlled by `stopOnQuit`, so that managed routers can either persist for reuse or stop cleanly.
25. As a Pi user, I want extension reload to re-adopt a previous managed process as External Router, so that reload does not kill active sessions.
26. As a Pi user, I want concurrent Pi instances to rely on llama.cpp routing by model id, so that this package does not invent brittle cross-process locks.
27. As a package maintainer, I want router client logic isolated, so that HTTP behavior can be tested without Pi UI or process spawning.
28. As a package maintainer, I want process ownership isolated, so that managed vs external lifecycle rules are testable.
29. As a package maintainer, I want provider registry sync isolated, so that Provider Refresh behavior is deterministic.
30. As a package maintainer, I want Load Gate behavior isolated, so that request races and failure normalization can be tested with state-machine fixtures.
31. As a package maintainer, I want command handlers thin, so that slash-command UX does not hide business logic.
32. As a package maintainer, I want all local dependencies declared as Pi package peer/dependencies correctly, so that installed package behavior matches Pi package rules.

## Implementation Decisions

- Build a Pi package extension that exports a default factory and uses Pi's dynamic provider APIs rather than static `models.json` entries.
- Use `llamacpp` as the provider identity.
- Use an async startup path only for discovery needed before provider registration; avoid deferring initial dynamic model discovery to session events when provider availability must exist during Pi startup and `--list-models`.
- Treat the Llama Server Router as the source of truth for available model IDs.
- Treat a Model Preset as runtime configuration owned by llama.cpp, not as Pi client model config.
- Enrich Provider Models only with documented Preset Metadata aliases for context size, max prediction tokens, and reasoning capability.
- Derive Provider Base URL by appending `/v1` to Server Base URL.
- Send chat completions through a custom `llamacpp-openai-completions` provider `streamSimple` wrapper that runs the Load Gate, then delegates to the built-in OpenAI-compatible streaming implementation with a copied `api: "openai-completions"` model.
- Keep Provider API Key resolution simple: literal value or environment variable name only. Do not support shell-command secrets for this package.
- Use the same resolved Provider API Key for router management bearer auth when configured.
- Implement `PresetFileReader` as a deep module that validates Configured Preset File presence and extracts safe metadata without changing runtime args.
- Implement `RouterClient` as a deep module for `/models`, `/models/load`, reachability, auth, and normalized error handling.
- Implement `ManagedRouterProcess` as a deep module for start, stop, adoption, ownership, `stopOnQuit`, and bounded log tails.
- Implement `ProviderRegistrySync` as a deep module that unregisters `llamacpp` before re-registering current Provider Models.
- Implement `LoadGate` as a deep module that runs inside provider `streamSimple` before provider requests and blocks until the selected model is loaded, sleeping, or fails clearly; do not rely on `before_provider_request` exceptions because Pi swallows hook errors.
- Implement `LlamaCppCommands` as thin command handlers over the deep modules for `/llamacpp start`, `/llamacpp stop`, `/llamacpp reload`, `/llamacpp status`, and `/llamacpp list`.
- Failed router models may remain registered if they came from the Router Model List, but the Load Gate must block requests with package-owned error details.
- Missing Configured Preset File must block package-managed server start and report through `/llamacpp start` and `/llamacpp status`.
- External Router detection must never grant package ownership; stop behavior must not unload models from or terminate an External Router.
- Extension/session reload must not kill a running llama-server; a new extension instance should re-adopt reachability as External Router unless it can prove ownership safely.
- Shared model residency across Pi instances is mutable; request routing must rely on llama.cpp model ids rather than package-level locks.

## Testing Decisions

- Good tests must verify external behavior and state transitions, not private implementation details.
- Unit-test `PresetFileReader` for present/missing files, INI sections, documented alias normalization, invalid values, and metadata-vs-runtime separation.
- Unit-test Provider API Key resolution for literal values, environment variable names, missing env vars, and rejection of shell-command-style credentials.
- Unit-test `RouterClient` using mocked HTTP responses for reachability, `/models`, `/models/load`, auth headers, unavailable models, failed loads, sleeping models, and timeout errors.
- Unit-test `ManagedRouterProcess` with mocked process operations for managed start, external adoption, bounded log tail, `stopOnQuit`, reload behavior, and stop refusal for External Router.
- Unit-test `ProviderRegistrySync` with fake Pi API for unregister-before-register ordering, empty model lists, stale model removal, metadata mapping, and compatible-router gating.
- Unit-test `LoadGate` as a state machine for already-loaded, sleeping, loading-success, loading-failure, unknown model, router-unreachable, and timeout cases.
- Unit-test `LlamaCppCommands` with fake modules for output shape and error reporting, not actual llama-server execution.
- Integration-style tests should combine mocked router/process/provider APIs to verify startup, reload, list, status, and request-gate flows.
- Real llama-server + GGUF E2E tests are out of first implementation scope because local model files, GPU/CPU behavior, and host environment would make AFK-agent validation flaky. Add them later as opt-in/manual tests.
- Prior art: Pi docs recommend testing providers against built-in provider test categories such as streaming, abort handling, context overflow, tool calls, image limits, and cross-provider handoff; this package should adapt the relevant categories once custom streaming is needed. Initial implementation should avoid custom streaming and use OpenAI-compatible provider behavior.

## Out of Scope

- Building or installing llama.cpp itself.
- Downloading GGUF model files.
- Editing Model Presets through Pi UI.
- Cross-process locking between multiple Pi instances.
- Killing or unloading models from External Routers.
- Supporting arbitrary sidecar metadata files.
- Supporting shell-command Provider API Key resolution.
- Supporting non-OpenAI-compatible llama.cpp APIs unless later evidence shows `openai-completions` is insufficient.
- Full real-GGUF E2E automation in the first pass.

## Further Notes

Evidence used: package context and README in the pi-llamacpp package; Pi docs `packages.md`, `extensions.md`, `models.md`, and `custom-provider.md`; Pi example extensions `custom-provider-anthropic` and `provider-payload`; llama.cpp server `/models` reference linked from the package README.

Architecture state machine:

```text
[Pi startup]
   -> [read settings]
   -> [validate Configured Preset File?]
      -> missing: [status error; no managed start]
      -> present/unused: [probe Server Base URL]
          -> reachable: [External Router or adopted router]
          -> unreachable + managed enabled: [spawn Llama Server Router]
          -> unreachable + no managed start: [no Provider Models]
   -> [Router Model List]
   -> [Provider Refresh: unregister llamacpp -> register current Provider Models]
   -> [user selects model]
      -> optional loadOnSelect: [Explicit Load]
   -> [provider streamSimple wrapper]
      -> [Load Gate]
         -> loaded/sleeping: [delegate to OpenAI-compatible stream]
         -> load failed/timeout: [reject provider stream with clear package-owned error]
```

[bias: maintainability] The package should start slightly over-modular here. The bad version is a single extension file that mixes process spawning, HTTP calls, provider registration, and command rendering. That will rot fast because router lifecycle and request gating have different failure modes.
