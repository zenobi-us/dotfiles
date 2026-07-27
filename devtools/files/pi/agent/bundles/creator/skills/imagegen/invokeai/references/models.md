# Work with models

Treat model files and model records as separate but coupled resources. Use the Model Manager/API rather than writing database rows or dropping files into directories and assuming they are ready.

## Discovery first

```bash
base=http://127.0.0.1:9090
python scripts/invokeai-openapi.py --base-url "$base" routes model
python scripts/invokeai-openapi.py --base-url "$base" operation GET '/api/v2/models/'
python scripts/invokeai-openapi.py --base-url "$base" operation POST '/api/v2/models/install'
```

Then list current records through the discovered API. Capture:
- model `key` (authoritative workflow/API identifier)
- name, base model, type, format, source/source type
- path and whether it is inside `models_dir`
- hash, file size, variant, default settings, capabilities
- related VAE/encoder/LoRA/control models where relevant

Do not select a model by display name alone. Names can collide and paths can move.

## Installation sources

Current installer accepts a source that may be:
- local filesystem file or directory
- remote URL
- Hugging Face repo ID, optionally selecting precision/submodel/file

The current install route is asynchronous and returns a model-install job. Exact query/body fields and job states must come from local OpenAPI.

General flow:

```text
[source]
   |
   v
[installer probes/downloads/hashes]
   |
   v
[model config record written]
   |
   v
[verify record by key]
   |
   v
[load/use in a small workflow]
```

Rules:
- pass an empty override object when accepting probed defaults only if local schema permits it
- use `inplace` only when the external path is intentionally managed outside InvokeAI
- protect remote tokens; prefer configured token mechanisms over command history
- monitor the returned install job; HTTP 201 means accepted/started, not necessarily usable
- verify downloaded files and final model record

## Managed vs in-place models

Managed models under `models_dir` are owned by InvokeAI's installer lifecycle. In-place models may remain outside that directory.

Current delete behavior removes the database record and also deletes weights when they reside inside InvokeAI's models directory. That is destructive. Before deletion:
1. fetch the record by key
2. resolve the actual path
3. determine whether it is managed or in-place
4. confirm dependencies/workflows
5. back up or record source/hash
6. use the API and verify both record and intended file outcome

Never test delete semantics on an important model.

## Moving model storage

Preferred safe paths:
- move the entire configured `models_dir` while stopped, then update `models_dir`
- or reinstall/register models through the Model Manager

Also account for:
- `download_cache_dir`
- deprecated conversion cache still needed by migrations
- model cover images/metadata in other stores
- database records containing paths
- external in-place paths not under `models_dir`

After moving, list missing/orphaned models with the local API and fix through supported re-identification/sync/install flows. Do not mass-edit model paths directly in SQLite.

## Scanning and orphan reconciliation

Current API/source includes operations for:
- scanning a folder for candidate models
- listing missing models
- finding/deleting orphaned files
- re-identifying one or many model records

These are release-sensitive and some are admin/destructive operations. Read local OpenAPI and preview results before action.

`scan_models_on_startup` is mainly useful for ephemeral/test setups. It is not a substitute for a controlled model migration.

## Hugging Face and remote credentials

Options may include:
- Launcher/UI login support
- model install access token
- `remote_api_tokens` URL-regex bearer tokens in config
- Hugging Face login endpoints in the model API

Use the mechanism supported by the installed release. Do not print tokens, put them in committed workflow JSON, or leave them in shell history.

## Formats, conversion, and quantization

Model family, type, format, and required companion components are not interchangeable. Confirm support from:
- local model schemas and starter model API
- installed release docs
- target workflow's node schemas

Do not convert merely because an API route exists. Conversion can require additional disk space, use deprecated caches, change loading behavior, and be unsupported for some families/formats.

FP8 storage is a per-model loading/storage optimization in current releases, not a universal converter. It is a no-op for already quantized GGUF/NF4/int8 models and unsupported model/device combinations. Verify the exact model and local release.

## Model troubleshooting checklist

1. Fetch record by key.
2. Confirm file exists and permissions allow the InvokeAI process to read it.
3. Confirm format/base/type match the selected loader node.
4. Inspect install job or model-load events/logs.
5. Confirm required encoder/VAE/submodels.
6. Check disk/cache space and remote authentication.
7. Re-identify through supported API if metadata is stale.
8. Run a minimal known graph before debugging a large workflow.

## Source architecture

```text
API/UI
  -> ModelManagerService
       -> record store (SQLite model config)
       -> install service (probe/download/register/delete)
       -> load service (RAM/VRAM cache and model contexts)
            -> backend model loaders
```

Custom invocations should load models through `InvocationContext`, not by reaching into global services or loading weights ad hoc.

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [`model_manager.py` API router](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/routers/model_manager.py)
- [Model manager architecture](https://invoke-ai.github.io/InvokeAI/development/architecture/model-manager/)
- [`model_install_default.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/model_install/model_install_default.py)
- [`invocation_context.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/shared/invocation_context.py)
- [FP8 storage](https://invoke-ai.github.io/InvokeAI/configuration/fp8-storage/)
