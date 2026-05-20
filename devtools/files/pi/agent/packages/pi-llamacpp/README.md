# LlamaCpp Provider for Pi

## Baseline

This package exposes a loadable `llamacpp` Pi extension. It adopts a compatible External Router at the configured Server Base URL, fetches the Router Model List from `/models`, refreshes Pi `llamacpp` Provider Models, validates the Configured Preset File, enriches matching Provider Models with safe Preset Metadata, optionally starts/stops a package-owned managed Llama Server Router, and gates `llamacpp` chat requests through Explicit Load.

Real `llama-server` plus GGUF end-to-end automation is intentionally out of first-pass scope. Mocked tests cover package behavior without downloading GGUF files, requiring GPU access, or requiring a locally installed `llama-server`.

## Package manifest

`package.json` follows Pi package conventions:

- `keywords` includes `pi-package` for package discovery.
- `pi.extensions` points at `index.ts`, the extension entrypoint.
- `type` is `module` and `main` is `index.ts`.
- Pi runtime imports are declared as peer dependencies with `"*"` ranges.
- No runtime dependency installs are required for this package.

Install from a local checkout for review:

```bash
pi install /mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/pi/agent/packages/pi-llamacpp
```

Or run once without writing settings:

```bash
pi -e /mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/pi/agent/packages/pi-llamacpp/index.ts
```

## Settings and defaults

Settings follow Pi package config conventions. Project `.pi/llamacpp.config.json` overrides home `~/.pi/agent/llamacpp.config.json`, which overrides defaults.

| Setting | Default | Meaning |
| --- | --- | --- |
| `serverBaseUrl` | `http://localhost:8080` | Server Base URL for the single Llama Server Router, without `/v1`. |
| `serverBinaryPath` | `llama-server` | Binary used for managed router start. |
| `managedStart` | `false` | When `true`, `/llamacpp start` may spawn a package-owned managed router if no compatible router is reachable. |
| `configuredPresetFilePath` / `modelPresetsFile` | `~/.config/llamacpp/model-presets.ini` | Configured Preset File for managed router start and Preset Metadata enrichment. |
| `providerApiKey` | `llamacpp` | Literal Provider API Key, bare all-uppercase environment variable name, or `env:<name>`. Shell-command credentials are unsupported. |
| `loadOnSelect` | `false` | When `true`, model selection triggers Explicit Load before first request. |
| `stopOnQuit` | `false` | Whether a package-owned managed router should stop on Pi quit. |
| `timeouts.startMs` | `30000` | Managed start reachability timeout. |
| `timeouts.loadMs` | `120000` | Router model load timeout. |
| `timeouts.pollMs` | `2000` | Poll interval while waiting for router/model state. |
| `timeouts.requestGateMs` | `180000` | Total Load Gate budget for request-time readiness. |
| `timeouts.statusMs` | `3000` | Router status/list probe timeout. |

Provider Base URL is derived by appending `/v1` to `serverBaseUrl`.

Example project config:

```json
{
  "serverBaseUrl": "http://localhost:8080",
  "serverBinaryPath": "/usr/local/bin/llama-server",
  "managedStart": true,
  "configuredPresetFilePath": "/home/me/.config/llamacpp/model-presets.ini",
  "providerApiKey": "env:LLAMACPP_API_KEY",
  "loadOnSelect": false,
  "stopOnQuit": false,
  "timeouts": {
    "startMs": 30000,
    "loadMs": 120000,
    "pollMs": 2000,
    "requestGateMs": 180000,
    "statusMs": 3000
  }
}
```

## Commands

- `/llamacpp status` shows Operational Status: router reachability, ownership, managed process state, bounded recent stdout/stderr tails, Configured Preset File state, provider registration state, Router/Provider Model counts, model status counts, settings, timeout values, and sanitized last error.
- `/llamacpp list` fetches and displays the Router Model List from `/models`, including raw availability and runtime status columns plus a clear success/failure outcome.
- `/llamacpp reload` re-fetches the Router Model List and performs Provider Refresh. Refresh unregisters `llamacpp` before registering current Provider Models so stale models disappear.
- `/llamacpp start` adopts a reachable compatible router as External Router, or starts a managed router when `managedStart` is enabled and the Configured Preset File is present.
- `/llamacpp stop` stops only the package-owned managed router process. External Routers are never terminated or unloaded.

## External Router behavior

A compatible Llama Server Router already reachable at `serverBaseUrl` is an External Router. The package may use it for Router Model List discovery, Provider Refresh, Explicit Load, and OpenAI-compatible requests, but it does not own the process.

`/llamacpp stop` refuses to terminate or unload an External Router. Multiple Pi instances rely on llama.cpp routing by model id; this package does not create cross-process locks.

## Managed router behavior

When `managedStart` is `true`, `/llamacpp start` may spawn `serverBinaryPath` with host/port derived from `serverBaseUrl` and passes the Configured Preset File via `--model-presets`. Start waits up to `timeouts.startMs`, polling at `timeouts.pollMs`, for reachability.

A missing Configured Preset File blocks managed start and appears in Operational Status. Managed stdout/stderr are kept as bounded recent log tails for diagnostics.

Extension/session reload does not kill `llama-server`; a fresh package instance treats a reachable compatible router as External Router unless it can prove package ownership. Pi quit stops the managed process only when `stopOnQuit` is enabled.

## Preset Metadata

`PresetFileReader` parses INI sections as Model Presets and keeps runtime args intact. It normalizes only documented llama.cpp server aliases for context size, max prediction tokens, reasoning mode, and reasoning format. Invalid metadata is reported as warnings and ignored for Provider Models; runtime args are not changed.

The Router Model List remains source of truth. Unmatched INI sections never create dead Provider Models.

## Explicit Load Gate

Every `llamacpp` provider request runs a package-owned Load Gate inside the registered provider `streamSimple` wrapper before OpenAI-compatible chat completion dispatch. Request blocking intentionally does not depend on Pi `before_provider_request` hook exceptions.

The Load Gate treats `loaded` and `sleeping` Router Model states as request-ready, calls `POST /models/load` for unloaded selected models, then polls `/models` until loaded/sleeping or until the configured `timeouts.loadMs` / `timeouts.requestGateMs` budget expires. Failed router models may remain selectable when listed by the Router Model List, but request-time load failures report package-owned diagnostics for unknown model IDs, unreachable routers, auth failures, failed loads, and timeouts.

## Mocked test harness

AFK agents can run the first-pass validation without local models:

```bash
cd /mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/pi/agent
bun test packages/pi-llamacpp/index.test.ts
bunx tsc --noEmit --allowImportingTsExtensions --moduleResolution bundler --module ESNext --target ES2022 --types node packages/pi-llamacpp/index.ts packages/pi-llamacpp/index.test.ts
```

These tests use fake settings, fake router responses, fake process operations, and fake Pi provider APIs. They do not download GGUF files, start `llama-server`, require GPU access, or require local llama.cpp installation.

## Manual smoke test (optional)

Only run this when you already have a working `llama-server` and Model Presets. This is not part of automated validation.

1. Start or configure a Llama Server Router with at least one GGUF-backed Model Preset.
2. Set `.pi/llamacpp.config.json` with `serverBaseUrl`, `providerApiKey`, and optional `configuredPresetFilePath`.
3. Launch Pi with the package extension.
4. Run `/llamacpp status`; verify Operational Status reports router reachability and model counts.
5. Run `/llamacpp list`; verify Router Model List rows show availability/runtime status.
6. Run `/llamacpp reload`; verify Provider Refresh succeeds.
7. Select a `llamacpp/<model-id>` Provider Model and send a short prompt; verify Explicit Load succeeds or fails with package-owned diagnostics.
8. If testing managed mode, run `/llamacpp start` and `/llamacpp stop`; verify External Routers are not stopped.

## Troubleshooting

- **No Provider Models appear:** run `/llamacpp status`, then `/llamacpp list`. The router must be reachable and return a compatible Router Model List.
- **Managed start fails:** verify `managedStart`, `serverBinaryPath`, Configured Preset File existence, host/port derived from Server Base URL, and `timeouts.startMs`.
- **Auth failures:** verify Provider API Key resolution. Use `env:<name>` for explicit environment references. Resolved secret values are sanitized in diagnostics.
- **Load Gate timeout:** increase `timeouts.loadMs` or `timeouts.requestGateMs`; slow local hardware may need more time.
- **Failed model remains selectable:** failed router models may stay registered from the Router Model List, but the Load Gate blocks requests with clear failure details.
- **External Router not stopped:** expected behavior. `/llamacpp stop` only stops package-owned managed processes.
