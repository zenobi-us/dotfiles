# Setup and onboarding

Use this file first when the target ComfyUI install is new, remote, unknown, or only partially documented.

## Goal

Separate reusable ComfyUI guidance from user-specific setup facts.

## First-run checklist

Collect or confirm:
1. Base URL and whether the server is local, remote, or cloud-hosted.
2. ComfyUI version or approximate build age.
3. Installed custom node packs.
4. Available model families the user actually wants to use.
5. Whether `/object_info` is reachable.
6. Output location expectations.
7. Hardware constraints that affect model choice, resolution, frame count, or batch size.

## First-time control readiness gate

Before running a real job, verify these minimum controls:

1. `GET /system_stats` returns 200.
2. `GET /object_info` returns JSON with node classes.
3. `GET /queue` is reachable.
4. WebSocket connection to `/ws` succeeds.
5. One tiny test prompt can be queued and appears in `/history`.

If any check fails, stop and fix connectivity or install issues before workflow authoring.

## Discovery-first interview

Ask only for what cannot be discovered automatically.

Suggested order:
1. "What ComfyUI URL should I target?"
2. "Can I inspect `/object_info` on that server?"
3. "Which model family are you trying to use: SDXL, FLUX, WAN, LTX, or something else?"
4. "Do you know which custom nodes are installed, or should I discover them from the API/UI?"
5. "Any hardware limits I should optimize for?"

## Portable setup record

Keep install-specific values in a user-owned setup record. Do not hardcode them into skill defaults.

### Portable config template

```yaml
comfyui:
  base_url: http://127.0.0.1:8188
  websocket_url: ws://127.0.0.1:8188/ws
  install_type: local   # local | remote | cloud
  version_notes: ""
  custom_nodes:
    - name: ""
      purpose: ""
  model_aliases:
    image_default: ""
    video_default: ""
    flux_default: ""
    wan_default: ""
    ltx_default: ""
  output_rules:
    default_subfolder: ""
    filename_prefix: ""
  hardware:
    gpu: ""
    vram_gb: ""
    notes: ""
```

Replace example defaults with the user's real environment before relying on them.

Track at minimum:
- host/base URL
- known custom nodes
- approved model aliases
- preferred output folder naming
- hardware notes
- workflow templates the user trusts

## Setup completion criteria (first-time user clarity)

Treat setup as complete only when all are true:

- The user can state the exact ComfyUI base URL and WebSocket URL.
- The agent has confirmed available node classes/models from `/object_info`.
- A model family is selected for the task (FLUX, WAN, LTX, SDXL, etc.).
- The output location/prefix rule is agreed.
- A single smoke-test job has run end-to-end and appears in `/history`.

After completion, route to task-specific docs:
- Prompt selection -> `prompting-guides/readme.md`
- Workflow/API execution -> `api.md`, `workflow-patterns.md`, `reference-implementations.md`

## Minimum safe assumptions

You may safely assume only that:
- ComfyUI graphs are node-based JSON
- endpoint shapes can drift between versions
- dropdown model values must be confirmed on the target install

Do not assume:
- absolute paths
- the user has your preferred model files
- the user has a specific GPU
- the user has a specific custom node pack
- the user wants local execution
