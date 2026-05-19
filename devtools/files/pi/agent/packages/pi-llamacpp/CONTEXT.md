# Pi LlamaCpp Provider

This context defines language for exposing local llama.cpp router models to Pi while keeping runtime model loading separate from Pi client configuration.

## Language

**Model Preset**:
A llama-server router INI section that describes how a GGUF model is loaded and run.
_Avoid_: Pi model config, client model config

**Preset Metadata**:
Pi-facing descriptive values derived from a limited, documented set of llama-server INI argument aliases to enrich Provider Model registration without changing llama-server runtime behavior.
_Avoid_: sidecar metadata, arbitrary runtime flag

**Configured Preset File**:
The explicit model preset file path selected in Pi settings for the managed Llama Server Router.
_Avoid_: optional model source, cache fallback

**Provider Model**:
A Pi model entry registered through `registerProvider` only when a compatible Llama Server Router is available.
_Avoid_: GGUF preset, runtime preset, dead provider

**Provider Refresh**:
The replacement of Pi's llamacpp provider registration after router model list changes.
_Avoid_: additive re-register, stale model merge

**Router Model List**:
The raw `/models` view from llama-server, including availability and runtime status for each model.
_Avoid_: Pi-registered model list

**Operational Status**:
A diagnostic snapshot of router reachability, ownership, preset file state, provider registration, model status counts, last error, timeout settings, and recent managed process logs when relevant.
_Avoid_: minimal health check

**Llama Server Router**:
The single running llama-server process that lists, loads, and unloads configured local models.
_Avoid_: Pi provider, model registry, server profile

**Server Base URL**:
The Pi-side HTTP endpoint used to contact the single Llama Server Router, excluding the OpenAI `/v1` suffix.
_Avoid_: provider base URL, model preset URL, GGUF path

**Provider Base URL**:
The Pi provider HTTP endpoint derived by appending `/v1` to the Server Base URL.
_Avoid_: router base URL

**Provider API Key**:
The configurable literal or environment-resolved credential Pi sends to llama-server's OpenAI-compatible API, defaulting to a local dummy value when the server does not enforce auth.
_Avoid_: Hugging Face token, preset secret, shell command credential

**Explicit Load**:
A deliberate `POST /models/load` issued by the Load Gate before Pi sends chat requests, or optionally during model selection when configured.
_Avoid_: router autoload, accidental model browse load

**Load Gate**:
A request-time guard that blocks Pi requests until the selected Provider Model is loaded, sleeping, or returns a clear load failure.
_Avoid_: best-effort send, raw router error

**External Router**:
A compatible Llama Server Router already running at the Server Base URL that this package may use but does not own.
_Avoid_: managed process, spawned server

## Relationships

- A **Model Preset** produces one **Provider Model** when a compatible **Llama Server Router** is available.
- **Provider Refresh** unregisters the existing llamacpp provider before registering the current Provider Model list.
- `/llamacpp list` displays the **Router Model List**, not only the currently registered Pi models.
- `/llamacpp status` displays **Operational Status** with enough detail to diagnose external and managed router failures.
- Managed process stdout and stderr are captured as a bounded recent log tail, not streamed continuously into Pi UI.
- Server start, model load, polling, and request gate waits use separate configurable timeouts.
- **Preset Metadata** enriches a **Provider Model** but does not affect how the **Llama Server Router** loads GGUF files.
- The **Router Model List** is the source of truth for which model IDs become **Provider Models**; INI sections only enrich matching IDs.
- **Preset Metadata** normalization supports documented short, long, and environment-form keys for context size, max prediction tokens, and reasoning.
- A **Configured Preset File** is required when defined; the **Llama Server Router** must not start if that file is missing.
- A **Provider Model** sends OpenAI-compatible requests through the **Provider Base URL** using the **Provider API Key**.
- Router management requests use the same **Provider API Key** for Bearer authentication when configured.
- **Provider API Key** resolution supports literal values and environment variable names only.
- Router management requests use the **Server Base URL** directly.
- A **Llama Server Router** loads zero or more **Model Presets** depending on explicit selection and router limits.
- An **External Router** may serve multiple Pi instances and must not be stopped by this package.
- Concurrent Pi instances rely on **Llama Server Router** request routing; this package does not coordinate cross-process locks.
- **Explicit Load** always happens before chat completion requests when needed, and may happen on model selection only when `loadOnSelect` is enabled.
- A **Load Gate** protects every request for a **Provider Model** from racing model load state while treating sleeping models as request-ready.

## Example dialogue

> **Dev:** "Should this go in Pi `models.json`?"
> **Domain expert:** "No — if it changes GGUF loading or runtime arguments, it belongs in a **Model Preset**. Pi only receives a **Provider Model** for client routing."

## Flagged ambiguities

- "model config" can mean GGUF runtime settings or Pi client connection settings — resolved: use **Model Preset** for GGUF runtime settings and **Provider Model** for Pi-facing entries.
- "server" can mean a process profile or a reachable endpoint — resolved: this package manages one **Llama Server Router** and exposes one **Server Base URL**.
- "autoload" hides model-load failures inside the first chat request — resolved: use **Explicit Load** through the **Load Gate**, with optional `loadOnSelect` for earlier feedback.
- Failed loads should not be delegated to llama-server chat errors — resolved: the **Load Gate** blocks with a clear package-owned error.
- Missing preset files should not silently fall back to cache models — resolved: a missing **Configured Preset File** blocks package-managed server start and `/llamacpp start` reports the reason.
- Dead local models should not appear in Pi model selection — resolved: register **Provider Models** only after a compatible router is available.
- Failed router models remain registered as **Provider Models**, but the **Load Gate** blocks requests with clear failure details.
- Re-registering without removal risks stale model state — resolved: **Provider Refresh** uses `unregisterProvider("llamacpp")` before `registerProvider("llamacpp", ...)`.
- A compatible already-running router is not an error — resolved: treat it as an **External Router** and never kill it from `/llamacpp stop`.
- Pi extension/session reload leaves any previously managed llama-server process running; the new extension instance re-adopts it as an **External Router**.
- Pi quit stops the managed llama-server process only when `stopOnQuit` is enabled; default behavior leaves it running for reuse or sharing.
- `/llamacpp stop` means stop the package-owned process only; it must not unload models from or stop an **External Router**.
- Shared router model residency is mutable across Pi instances — resolved: let **Llama Server Router** route by request model id rather than adding package-level locks.
