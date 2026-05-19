# LLamaCpp Provider for PI

## Baseline

This package exposes a loadable `llamacpp` Pi extension that can adopt a compatible External Router at `serverBaseUrl`, fetch `/models`, refresh Pi `llamacpp` Provider Models from the Router Model List, validate the Configured Preset File, enrich matching Provider Models with safe Preset Metadata, optionally start/stop a package-owned managed Llama Server Router, and gate `llamacpp` chat requests through Explicit Load.

## Settings

Settings follow Pi package config conventions: project `.pi/llamacpp.config.json` overrides home `~/.pi/agent/llamacpp.config.json` and defaults.

Supported package settings:

- `serverBaseUrl`: Llama Server Router endpoint without `/v1` (default `http://localhost:8080`).
- `serverBinaryPath`: path to `llama-server` binary (default `llama-server`).
- `managedStart`: when `true`, `/llamacpp start` may spawn a package-owned managed router if no compatible router is reachable (default `false`).
- `configuredPresetFilePath` / `modelPresetsFile`: Configured Preset File path (default `~/.config/llamacpp/model-presets.ini`).
- `providerApiKey`: literal API key, bare all-uppercase environment variable name, or explicit `env:<name>` environment variable reference. Use `env:<name>` for lowercase/mixed-case env names and for missing-env diagnostics. Shell-command values such as `$(pass show ...)` are reported as unsupported.
- `loadOnSelect`: whether model selection should trigger Explicit Load for earlier feedback (default `false`).
- `stopOnQuit`: whether future managed router ownership should stop on Pi quit (default `false`).
- `timeouts.startMs`, `timeouts.loadMs`, `timeouts.pollMs`, `timeouts.requestGateMs`, `timeouts.statusMs`: separate timeout values.

The Provider Base URL is derived by safely appending `/v1` to `serverBaseUrl`.

## Commands

- `/llamacpp status` - shows Operational Status: router reachability, managed/external ownership, managed process state, bounded recent stdout/stderr tails, Configured Preset File state, provider registration state, Router/Provider Model counts, model status counts, settings, timeout values, and sanitized last error.
- `/llamacpp list` - fetches and displays the current Router Model List from `/models`, including raw availability and runtime status columns plus a clear success/failure outcome.
- `/llamacpp reload` - re-fetches the Router Model List and refreshes provider registration without a Pi restart. Refresh unregisters `llamacpp` before registering the current Provider Model set so stale models disappear.
- `/llamacpp start` - adopts a reachable compatible router as External Router, or starts a managed router when `managedStart` is enabled and the Configured Preset File is present.
- `/llamacpp stop` - stops only the package-owned managed router process; External Routers are never terminated or unloaded.

## Preset Metadata

`PresetFileReader` parses INI sections as Model Presets and keeps runtime args intact. It normalizes only the documented llama.cpp server aliases from `tools/server/README.md`: context size (`-c`, `--ctx-size`, `LLAMA_ARG_CTX_SIZE`), max prediction tokens (`-n`, `--predict`, `--n-predict`, `LLAMA_ARG_N_PREDICT`), reasoning mode (`-rea`, `--reasoning`, `LLAMA_ARG_REASONING` with `on`, `off`, or `auto`), and reasoning format (`--reasoning-format` values such as `none`, `deepseek`, or `deepseek-legacy`). Undocumented aliases such as `-r` are left as runtime args only and are not treated as Preset Metadata. Invalid metadata is reported as warnings and ignored for Provider Models; runtime args are not changed. Router Model List IDs remain the source of Provider Models, so unmatched INI sections never create dead Provider Models.

## Managed router lifecycle

Managed start invokes `serverBinaryPath` with host/port derived from `serverBaseUrl` and the Configured Preset File passed as `--model-presets`. Start waits up to `timeouts.startMs`, polling at `timeouts.pollMs`, for the router to become reachable. Managed stdout/stderr are retained as bounded recent tails for `/llamacpp status`.

Extension/session reload does not kill a running `llama-server`; a fresh package instance treats any reachable compatible router as External Router unless it can prove package ownership. Pi quit stops the managed process only when `stopOnQuit` is enabled.

## Explicit Load Gate

Every `llamacpp` provider request runs a package-owned Load Gate inside the registered provider `streamSimple` wrapper before OpenAI-compatible chat completion dispatch. Pi `before_provider_request` hook errors are logged and swallowed by the runner, so request blocking intentionally does not depend on extension hook exceptions. The gate treats `loaded` and `sleeping` Router Model states as request-ready, calls `POST /models/load` for unloaded selected models, then polls `/models` until the model is loaded/sleeping or the configured `timeouts.loadMs` / `timeouts.requestGateMs` budget expires. Failed router models remain selectable when listed by the Router Model List, but request-time load failures report package-owned diagnostics for unknown model IDs, unreachable routers, auth failures, failed loads, and timeouts.

When `loadOnSelect` is enabled, model selection uses the same Explicit Load path for earlier feedback. The package does not coordinate concurrent Pi instances with locks; llama-server routes by model id.

## Planned later slices

- End-to-end diagnostics cleanup and install validation.
