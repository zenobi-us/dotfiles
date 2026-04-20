---
name: comfyui-skill-public
description: Portable ComfyUI workflow and API guidance for any install. Use when building, validating, or troubleshooting ComfyUI image/video workflows, discovering available nodes/models via /object_info, wiring loaders/encoders/VAEs/LoRAs correctly, submitting jobs through the REST or WebSocket APIs, training LoRAs with ComfyUI, adapting a workflow to an unknown user machine without assuming specific checkpoints, paths, hardware, or custom nodes.
---

# ComfyUI Portable Skill

Use this skill when the task is to work with ComfyUI in a reusable, installation-agnostic way.

## Minimum trigger scope

Trigger on requests like:
- "Build a ComfyUI workflow"
- "Fix this ComfyUI workflow"
- "Use the ComfyUI API"
- "Why is this ComfyUI graph failing?"
- "Add a LoRA / model / node to this ComfyUI setup"
- "Train a LoRA on this dataset"
- "Run a batch on these images"
- "Generate a video with LTX"
- "Edit these photos with FLUX"
- "Run a video batch"
- "JoyCaption these images and generate prompts"

## First move: assume zero install knowledge

Before writing or editing any workflow:
1. Read [setup.md](references/setup.md) if the install is unknown.
2. Collect the missing setup fields from the user or discover them from the running ComfyUI instance via `/object_info`.
3. Prefer discovery over assumptions — confirm checkpoints, VAEs, encoders, and LoRAs from the target install.
4. Stop and report missing requirements clearly.

## Read path by task

- Setup / first run / portability questions -> [setup.md](references/setup.md)
- Prompting guide index (all families) -> [prompting-guides/readme.md](references/prompting-guides/readme.md)
- LTX 2.3 video or image-to-video generation -> [prompting-guides/ltx-2-3-prompting-guide.md](references/prompting-guides/ltx-2-3-prompting-guide.md)
- FLUX 2 image generation/edit prompting -> [prompting-guides/flux-2-prompting-guide.md](references/prompting-guides/flux-2-prompting-guide.md)
- WAN 2.2 video prompting -> [prompting-guides/wan-2-2-prompting-guide.md](references/prompting-guides/wan-2-2-prompting-guide.md)
- Batch jobs with state tracking and recovery -> [batch-operations.md](references/batch-operations.md)
- FLUX image edit nodes, LTX video nodes, api_lib reference -> [reference-implementations.md](references/reference-implementations.md)
- Demo workflow JSON files (FLUX image edit, LTX video) -> [demo-workflows/](references/demo-workflows/) — **for demonstration only; replace with your own workflows**
- External dependencies (JoyCaption, ComfyUI, Python packages) -> [dependencies.md](references/dependencies.md)
- API submission / queue / history / WebSocket -> [api.md](references/api.md)
- Programmatic graph building, compatibility checks, and debugging -> [workflow-patterns.md](references/workflow-patterns.md)
- Model-family requirements and LoRA loading/training guidance -> [models.md](references/models.md)
- Prompt construction (general) -> [prompting-guides/general-prompting-guide.md](references/prompting-guides/general-prompting-guide.md)
- Release history -> [changelog.md](references/changelog.md)

## Which guide to use (decision flow)

1. Is this first-time setup or unknown install? -> open [setup.md](references/setup.md) first.
2. Is the requested model family known?
   - Yes -> open the family guide from [prompting-guides/readme.md](references/prompting-guides/readme.md).
   - No -> confirm via `/object_info`, then choose the family guide.
3. Is it a video task?
   - LTX family -> [prompting-guides/ltx-2-3-prompting-guide.md](references/prompting-guides/ltx-2-3-prompting-guide.md)
   - WAN family -> [prompting-guides/wan-2-2-prompting-guide.md](references/prompting-guides/wan-2-2-prompting-guide.md)
4. Is it FLUX image generation/edit? -> [prompting-guides/flux-2-prompting-guide.md](references/prompting-guides/flux-2-prompting-guide.md)
5. If still unclear, use [prompting-guides/general-prompting-guide.md](references/prompting-guides/general-prompting-guide.md), then refine with the family guide.

## Global operating rules

- Treat node classes as discoverable, not guaranteed constants.
- Treat model filenames as examples until confirmed on the target install.
- Use filename-only model references in workflow JSON unless the install explicitly requires a subdirectory path.
- Use defensive parsing for `/history` and `/object_info`; schema details can vary by ComfyUI version and custom nodes.
- Fail fast when a required node class, model, or custom node is missing.
- Keep setup-specific notes out of this file; put them in a per-user config or setup reference.
- Never edit a base workflow JSON file directly — always deep copy and patch.
- Demo workflow JSON files in [demo-workflows/](references/demo-workflows/) are provided as working examples. Replace them with your own workflows adapted to your ComfyUI install.

## Cold-read test

Before publishing or packaging changes, check that a fresh reader could answer:
- What does this skill do?
- When should it trigger?
- What must be discovered first?
- Where do install-specific values go?
- Which reference file should be opened for the current task?
