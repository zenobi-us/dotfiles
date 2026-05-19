# LLamaCpp Provider for PI

## Baseline

This package exposes a loadable `llamacpp` Pi extension and a baseline `/llamacpp status` command. This slice does not discover an external router, start `llama-server`, parse Preset Metadata, or register Provider Models.

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

- `/llamacpp status` - shows baseline Operational Status: router reachability, provider registration state, Provider Model count, settings, timeout values, and last error.

## Planned later slices

- `/llamacpp reload` - reload model presets and update Provider Models after compatible router discovery.
- `/llamacpp start` - start a managed Llama Server Router.
- `/llamacpp stop` - stop only a package-owned managed router.
- `/llamacpp list` - list Router Model List entries from llama-server.
