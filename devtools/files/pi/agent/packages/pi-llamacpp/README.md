# LLamaCpp Provider for PI

## Baseline

This package exposes a loadable `llamacpp` Pi extension that can adopt a compatible External Router at `serverBaseUrl`, fetch `/models`, and refresh Pi `llamacpp` Provider Models from the Router Model List. This slice does not start `llama-server`, parse Preset Metadata, implement managed lifecycle, or gate chat requests.

## Settings

Settings follow Pi package config conventions: project `.pi/llamacpp.config.json` overrides home `~/.pi/agent/llamacpp.config.json` and defaults.

Supported package settings:

- `serverBaseUrl`: Llama Server Router endpoint without `/v1` (default `http://localhost:8080`).
- `serverBinaryPath`: path to `llama-server` binary (default `llama-server`).
- `configuredPresetFilePath` / `modelPresetsFile`: Configured Preset File path (default `~/.config/llamacpp/model-presets.ini`).
- `providerApiKey`: literal API key, bare all-uppercase environment variable name, or explicit `env:<name>` environment variable reference. Use `env:<name>` for lowercase/mixed-case env names and for missing-env diagnostics. Shell-command values such as `$(pass show ...)` are reported as unsupported.
- `loadOnSelect`: whether future model selection should trigger Explicit Load (default `false`).
- `stopOnQuit`: whether future managed router ownership should stop on Pi quit (default `false`).
- `timeouts.startMs`, `timeouts.loadMs`, `timeouts.pollMs`, `timeouts.requestGateMs`, `timeouts.statusMs`: separate timeout values.

The Provider Base URL is derived by safely appending `/v1` to `serverBaseUrl`.

## Commands

- `/llamacpp status` - shows Operational Status: router reachability, provider registration state, Router/Provider Model counts, settings, timeout values, and last error.
- `/llamacpp list` - fetches and displays the current Router Model List from `/models`.
- `/llamacpp reload` - re-fetches the Router Model List and refreshes provider registration without a Pi restart. Refresh unregisters `llamacpp` before registering the current Provider Model set so stale models disappear.

## Planned later slices

- `/llamacpp start` - start a managed Llama Server Router.
- `/llamacpp stop` - stop only a package-owned managed router.
- Preset Metadata enrichment and Explicit Load Gate behavior.
