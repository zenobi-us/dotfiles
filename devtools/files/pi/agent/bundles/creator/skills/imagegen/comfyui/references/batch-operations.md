# Batch Operations Guide

> Portable patterns for running large ComfyUI batch jobs reliably — queue management, state tracking, recovery, and monitoring.

---

## Core Pattern: Queue-and-Watch

**The proven pattern: one client_id, one WebSocket, block on completion per job, verify with `/history`.**

This is why batch jobs succeed. Fire-and-forget POST calls without blocking are the primary cause of reliability failures.

### The Rule

> Load the workflow once. Override only the nodes that change per job. Block on WebSocket. Verify with `/history`. Repeat.

### Why Blocking Matters

Submitting all jobs at once (fire-and-forget) creates ambiguity about individual job fate. ComfyUI's queue is a shared buffer — jobs from other sessions can slip in. The only reliable done-signal is:

1. WebSocket receives `{"type": "executing", "data": {"node": null, "prompt_id": "<id>"}}`
2. Immediately confirmed with `GET /history/<prompt_id>`

### Recommended Pattern

```python
import uuid, json, requests, websocket

client_id = str(uuid.uuid4())
ws = websocket.WebSocket()
ws.connect(f"ws://{host}/ws?clientId={client_id}")

try:
    for job in jobs:
        workflow = build_workflow(job)           # patch only what changes
        prompt_id = queue_prompt(workflow, client_id)
        wait_for_completion(prompt_id, ws)       # block until done
        verify_with_history(prompt_id)            # confirm outputs exist
finally:
    ws.close()
```

One WebSocket connection is reused for the entire batch run. One `client_id` is reused for all jobs in that run.

---

## State File Pattern

For jobs that span sessions (long-running batches, overnight runs, or recovery scenarios), track state in a JSON file. This enables:

- Resume after interruption
- Watchdog recovery
- Progress reporting without re-querying ComfyUI

### Job State File

Save as `job_state.json` alongside the generated script:

```json
{
  "batch_name": "earth_maze_v2",
  "input_folder": "D:/images/earth_maze",
  "workflow_file": "flux-2-image-edit-workflow-api.json",
  "created_at": "2026-04-01T03:00:00Z",
  "jobs": [
    {
      "label": "earth_maze_00001.jpg",
      "image_path": "D:/images/earth_maze/earth_maze_00001.jpg",
      "batch_prompt": "enhance realism, cinematic lighting",
      "seed": 1234567890,
      "output_dir": "D:/images/earth_maze flux edit batch/batch_01",
      "save_prefix": "earth_maze_",
      "status": "success",
      "prompt_id": "abc123",
      "submitted_at": "2026-04-01T03:00:05Z",
      "completed_at": "2026-04-01T03:01:12Z",
      "error": null
    }
  ]
}
```

### Status Values

| Status | Meaning |
|---|---|
| `pending` | Not yet submitted |
| `submitted` | Queued to ComfyUI, awaiting completion |
| `success` | Completed with outputs verified |
| `failed` | Completed but outputs missing or error in history |
| `timeout` | Exceeded `JOB_TIMEOUT` seconds |

### Resume Logic

```python
# Skip jobs already marked success
for job in jobs:
    if job["status"] == "success":
        continue
    # ... submit and update status
```

---

## Watchdog / Recovery Pattern

A stateless watchdog script can recover a stalled batch without knowing anything about the workflow:

1. Read `job_state.json`
2. For each job marked `submitted`: check `GET /history/<prompt_id>`
   - If present and successful → mark `success`
   - If present and error → mark `failed`
3. For jobs stuck `submitted` beyond `JOB_TIMEOUT`: resubmit
4. If queue is dry but `submitted` jobs remain: interrupt, clear, resubmit

### Exit Codes

| Code | Meaning |
|---|---|
| `0` | Healthy — nothing to do |
| `1` | Recovered — stalled jobs restarted (announce to user) |
| `2` | ComfyUI is down |
| `3` | No batch found (no `job_state.json` in expected location) |

### Recovery Triggers

- Job in `submitted` state for more than `JOB_TIMEOUT` seconds
- Queue empty but `submitted` jobs still pending
- ComfyUI was restarted mid-batch

### NEVER Auto-Create a Cron for Batch Monitoring

Only create a monitor cron when a batch is confirmed actively running (first job returns success). Destroy it when the batch completes. Only one ComfyUI batch cron may exist at a time.

---

## Output Folder Naming Convention

Output folders are always **relative to the input folder** and self-describing:

```
{input_folder}/{input_folder_name} flux edit batch/
    batch_01/    <- batch 1 outputs
    batch_02/    <- batch 2 outputs (if multiple prompts)
```

```
# Formula
input_folder = "D:/photos/portraits"
batch_root   = "D:/photos/portraits/portraits-flux-edit-batch"
batch_01     = "D:/photos/portraits/portraits-flux-edit-batch/batch_01"
```

This keeps source images and outputs together. No hunting across the filesystem.

---

## Job Folder Structure

All generated scripts, logs, and state for a batch run live in a **job folder** inside the project workspace — never inside the input or output image folders.

```
{project_root}/batch-jobs/
    {input_folder_name}_batch_job_{workflow_name_snake_case}/
        run_batch.py          # the generated batch script
        job_state.json         # live state file (created at run time)
        batch_config.json      # snapshot of run parameters
```

**Examples:**

| Input folder | Workflow | Job folder |
|---|---|---|
| `D:/photos/portraits` | `flux-2-image-edit-workflow-api` | `batch-jobs/portraits_batch_job_flux_2_image_edit_workflow_api/` |
| `D:/renders/scifi` | `ltx-2-3-video-i2v-t2v` | `batch-jobs/scifi_batch_job_ltx_2_3_video_i2v_t2v/` |

---

## Batch Script Template

A generated batch script should contain:

1. **Config section** — `INPUT_FOLDER`, `BATCHES`, `BATCH_JOBS_ROOT` (all derived, never hardcoded in the template itself)
2. **Helpers** — `derive_output_dir`, `derive_save_prefix`, `derive_job_folder`, `resolve_images`
3. **Pre-flight checks** — ComfyUI alive, workflow file exists, images found, input dir accessible
4. **Main loop** — one client_id, one WS, block per job, verify
5. **Summary** — success/fail counts, output paths, count verification

The script is **generated per run** and **never edits the base workflow file**.

---

## Multi-Batch Runs

When running multiple batches (different prompts over the same images):

1. Each prompt gets its own `batch_NN/` subfolder
2. Each job in `job_state.json` records which batch it belongs to
3. All batches share the same `client_id` and WebSocket for the run
4. `job_state.json` is written once at start, updated after each job completes

---

## Python Invocation

On systems where `python` is not in PATH, use the appropriate launcher:

```bash
# Windows (if python not in PATH)
py -3 run_batch.py

# Linux/macOS
python3 run_batch.py
```

Always verify the ComfyUI input directory path matches the target machine before running.

---

## Assumptions You Must Never Make

- Do not assume `127.0.0.1:8188` is the only target — accept base URL as a parameter
- Do not assume `D:/ComfyUI/input` — discover or confirm input/output paths
- Do not assume the workflow file is at a specific absolute path — derive from project root
- Do not assume model filenames — always confirm from `/object_info` or user config
- Do not assume one batch cron is enough — only one may exist; destroy old before creating new
