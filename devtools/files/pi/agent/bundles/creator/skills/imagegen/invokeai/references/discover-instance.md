# Discover the target InvokeAI instance

Do this before exact commands or implementation. A local instance is not defined by `localhost:9090`; it is defined by its version, launch method, root, effective config, auth mode, installed schemas, hardware, and current state.

## Minimum fact set

Collect or verify:

| Fact | Why it matters |
|---|---|
| Base URL, including reverse-proxy subpath | Changes all REST, docs, and Socket.IO URLs |
| InvokeAI version | API, graph, config, and node contracts are release-sensitive |
| Install type: launcher, manual package, source checkout, Docker, service | Determines update/start/stop and filesystem ownership |
| OS, Python, GPU, VRAM, RAM, driver/runtime | Determines install backend and performance options |
| Root and config file | Required before storage, models, DB, nodes, or backup work |
| Active CLI args and `INVOKEAI_*` environment | They override YAML |
| Single-user or multi-user mode | Determines authentication and authorization |
| Goal and acceptable downtime/destructive scope | Determines safe execution plan |

## Live server preflight

Use the bundled helper:

```bash
python scripts/invokeai-openapi.py \
  --base-url http://127.0.0.1:9090 \
  probe
```

Manual checks:

```bash
base=http://127.0.0.1:9090
curl --fail-with-body --silent --show-error "$base/api/v1/app/version" | jq .
curl --fail-with-body --silent --show-error "$base/api/v1/auth/status" | jq .
curl --fail-with-body --silent --show-error "$base/openapi.json" > /tmp/invokeai-openapi.json
```

Expected current endpoints are evidence, not promises. If one fails, open `$base/docs`, inspect `$base/openapi.json`, and account for a configured reverse-proxy `base_url`.

`/api/v1/auth/status` reports whether multi-user mode is enabled. Most protected endpoints require `Authorization: Bearer <token>` only in multi-user mode.

## Root discovery

Current root search order:

1. `invokeai-web --root <absolute-path>`
2. `INVOKEAI_ROOT`
3. Parent directory of the active virtual environment
4. `~/invokeai`

The config may be replaced with `--config <path>`.

Configuration source precedence:

```text
CLI args > INVOKEAI_* environment > invokeai.yaml > defaults
```

Therefore, finding `invokeai.yaml` is insufficient. Inspect the actual launcher, service unit, container environment, shell wrapper, or process command line.

Useful local checks:

```bash
command -v invokeai-web || true
invokeai-web --help
python -c 'import invokeai; from invokeai.version import __version__; print(__version__)'
printf 'VIRTUAL_ENV=%s\nINVOKEAI_ROOT=%s\n' "${VIRTUAL_ENV-}" "${INVOKEAI_ROOT-}"
ps -ef | grep '[i]nvokeai-web'
```

Use platform-appropriate process/service inspection on Windows, systemd, Docker, or the official Launcher.

For a YAML-oriented path inventory:

```bash
python scripts/invokeai-root-inventory.py --root /absolute/invokeai/root
```

That helper cannot see unknown CLI overrides. Compare its result with the process launch definition and, for an authenticated administrator, the runtime-config API exposed by the local OpenAPI schema.

## Discover API and node contracts

Do not copy endpoints or node payloads from a different InvokeAI release.

```bash
python scripts/invokeai-openapi.py --base-url "$base" routes
python scripts/invokeai-openapi.py --base-url "$base" routes model
python scripts/invokeai-openapi.py --base-url "$base" nodes
python scripts/invokeai-openapi.py --base-url "$base" nodes flux
python scripts/invokeai-openapi.py --base-url "$base" operation POST '/api/v1/queue/{queue_id}/enqueue_batch'
python scripts/invokeai-openapi.py --base-url "$base" schema Batch
```

InvokeAI's custom OpenAPI generator adds installed invocation and output schemas. This means `/openapi.json` is also the best machine-readable inventory of built-in and loaded custom nodes.

## Discovery state machine

```text
[Request]
   |
   v
[Live instance available?] -- no --> [Inspect install/root/help/source checkout]
   | yes
   v
[Probe version + auth + OpenAPI]
   |
   v
[Need filesystem changes?] -- yes --> [Resolve root + config + overrides + owner]
   | no
   v
[Read task reference]
   |
   v
[Plan reversible change]
   |
   v
[Execute] --> [Verify API/logs/records/files] --> [Report evidence]
                  |
                  +-- failure --> [Rollback or stop; do not improvise destructive retries]
```

## Stop conditions

Stop and ask for missing evidence when:
- the user asks to move/delete data but the root or active process is unknown
- the server version and OpenAPI disagree with copied examples
- multi-user mode is enabled but no suitable user/admin token is available
- a workflow references unknown node types or model keys
- the same installation appears to be managed by multiple launch methods
- the database is live and the requested operation is a filesystem migration

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [`config_default.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/config/config_default.py)
- [`api_app.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api_app.py)
- [`app_info.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/routers/app_info.py)
- [`custom_openapi.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/util/custom_openapi.py)
- [YAML configuration docs](https://invoke-ai.github.io/InvokeAI/configuration/invokeai-yaml/)
