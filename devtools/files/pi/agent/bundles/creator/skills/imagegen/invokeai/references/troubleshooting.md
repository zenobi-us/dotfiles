# Troubleshoot InvokeAI

Diagnose by layer. Do not jump from a UI symptom to deleting the database, reinstalling models, or changing VRAM settings.

## Layered triage

```text
[Cannot use InvokeAI]
   |
   +-- process absent/crashed --> startup/install/config/logs
   +-- HTTP unavailable -------> bind/port/proxy/firewall/base_url
   +-- 401/403 ----------------> auth token/role/ownership/multiuser
   +-- API 422 ----------------> local OpenAPI vs payload
   +-- queue stuck ------------> processor/status/capacity/waiting child/model load
   +-- graph failed -----------> node schema/edge/model/error traceback
   +-- missing model ----------> record/path/permissions/install job
   +-- missing image ----------> DB record/output path/storage maintenance
   +-- OOM/slow ---------------> hardware/processes/model/cache/working memory
   +-- UI only ----------------> frontend build/cache/API schema/socket
```

Capture evidence before changes:
- exact version and launch method
- command line/environment/root/config
- complete relevant log/traceback
- API status/body or queue item JSON
- OS/GPU/VRAM/RAM/driver/Python/Torch information
- free disk/temp space
- minimal reproduction workflow and model key

## Startup failures

1. Run through the owning Launcher/service/container and collect logs.
2. Confirm Python/package version compatibility.
3. Confirm root/config permissions and valid YAML.
4. Check active CLI/environment overrides.
5. Check port conflicts and bind address.
6. Inspect custom-node import failures.
7. Check database migration/integrity errors.
8. Check disk/temp space and model hashing duration.

Temporarily moving a failing custom node pack out of `nodes/` can isolate it, but preserve it and report the traceback. Do not delete all packs or the DB as a first response.

## API and proxy failures

- `GET /api/v1/app/version` proves basic API routing.
- `/openapi.json` proves schema generation; a bad custom node can break startup/schema work.
- A reverse proxy subpath must agree with `base_url` and whether the proxy strips/preserves the prefix.
- Socket.IO uses `/ws/socket.io` under the public base path.
- CORS errors are browser policy, not authentication.
- `0.0.0.0` is a bind address, not a URL clients should use.

Use the actual host/IP/DNS name from the client side.

## Queue failures

Check the queue status and target item:
- `pending`: processor paused, queue ordering/capacity, another long job
- `in_progress`: model load/inference/output write
- `waiting`: parent suspended on child workflow execution in supporting releases
- `failed`: inspect all error fields and session state
- `canceled`: determine user/admin/client/restart action

A client timeout does not prove the server job failed. Reconcile by item ID/origin before retrying.

Current startup recovery and nested workflow semantics can cancel interrupted chains. Do not assume a `waiting` item survives restart.

## Graph failures

Order:
1. node type exists in local OpenAPI
2. required fields and enum values match schema
3. node IDs and edge endpoints exist
4. output/input field types are compatible
5. graph is acyclic
6. model keys exist and match loader type
7. batch substitutions target real fields
8. failure reproduces in a minimal graph

Compare with a graph emitted by the same frontend release.

## Model install/load failures

Check:
- install job state and file-level errors
- URL/Hugging Face access and tokens
- source disk and destination/cache/temp free space
- model format identification
- record path vs actual path
- read permissions for the InvokeAI process/container UID
- missing companion encoders/VAE
- unsupported model/device/precision combination
- picklescan rejection; do not disable it casually

Use model re-identification/sync APIs rather than direct DB edits.

## Database and storage failures

Stop the app before filesystem repair/migration.

```bash
sqlite3 /path/to/databases/invokeai.db 'PRAGMA integrity_check;'
```

If records exist but files are missing:
- confirm effective `outputs_dir`/`models_dir`
- inspect image subfolder strategy and storage maintenance state
- restore matching DB/files from backup
- do not bulk-delete records until recovery options are exhausted

If files exist but records are missing, use supported import/scan/maintenance operations. Direct SQL must be a last-resort, version-specific recovery with a backup and schema understanding.

## OOM and low performance

Current low-VRAM behavior uses partial model loading by default (`enable_partial_loading: true`). Diagnose before tuning.

1. Record GPU processes and actual free VRAM.
2. Confirm expected device and precision.
3. Reduce output dimensions/batch size to prove memory sensitivity.
4. Leave dynamic cache limits unset unless evidence requires overrides.
5. Increase `device_working_mem_gb` when operations need more working space.
6. Consider `keep_ram_copy_of_weights: false` only when RAM pressure is high; model switching/LoRA patching becomes slower.
7. Test `pytorch_cuda_alloc_conf: "backend:cudaMallocAsync"` experimentally on supported CUDA setups.
8. Use `max_cache_vram_gb` cautiously; an aggressive value can cause OOM by crowding working memory.
9. Use `max_cache_ram_gb` only with measured available RAM.
10. Clear model cache through the supported API/UI when testing cache behavior.

Deprecated `ram`, `vram`, and `lazy_offload` settings are not valid tuning advice for current releases.

Windows Nvidia: disable CUDA system-memory fallback when it causes catastrophic slowdown, and ensure the page file has space/system-managed sizing.

FP8 storage:
- useful primarily for full-precision supported models on CUDA
- no-op for GGUF/NF4/int8 and unsupported models/devices
- can trade small throughput/quality differences for VRAM
- verify logs and compare identical seeds

PatchMatch is CPU-bound and can be slow for large infill regions; do not misdiagnose it as GPU inference failure.

## Logging

Useful current config fields:

```yaml
log_level: debug
log_level_network: warning
log_handlers:
  - console
  # - file=/absolute/path/invokeai.log
log_memory_usage: true   # only during focused cache investigation
log_sql: true            # requires debug; extremely verbose
```

Enable one diagnostic at a time, reproduce, then revert noisy settings. Never log credentials or bearer tokens.

## Reinstall decision

Reinstall code/environment only after proving the issue is there. A reinstall does not repair:
- bad workflow graphs
- missing output files with stale DB records
- an incompatible custom node
- wrong root/env overrides
- a corrupt model
- unsupported hardware settings

Preserve root/database before reinstalling.

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [FAQ](https://invoke-ai.github.io/InvokeAI/troubleshooting/faq/)
- [Low-VRAM mode](https://invoke-ai.github.io/InvokeAI/configuration/low-vram-mode/)
- [FP8 storage](https://invoke-ai.github.io/InvokeAI/configuration/fp8-storage/)
- [PatchMatch](https://invoke-ai.github.io/InvokeAI/configuration/patchmatch/)
- [`config_default.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/services/config/config_default.py)
- [`session_queue.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/api/routers/session_queue.py)
