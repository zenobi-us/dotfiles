# Model-family guidance

This file keeps reusable family-level knowledge while avoiding a machine-specific inventory.

## General rule

Confirm actual model filenames from the target install before building the graph.

## Common families

Prompting guides:
- General -> [`prompting-guides/general-prompting-guide.md`](prompting-guides/general-prompting-guide.md)
- FLUX 2 -> [`prompting-guides/flux-2-prompting-guide.md`](prompting-guides/flux-2-prompting-guide.md)
- WAN 2.2 -> [`prompting-guides/wan-2-2-prompting-guide.md`](prompting-guides/wan-2-2-prompting-guide.md)
- LTX 2.3 -> [`prompting-guides/ltx-2-3-prompting-guide.md`](prompting-guides/ltx-2-3-prompting-guide.md)

### SDXL-style checkpoint workflows
- Often use `CheckpointLoaderSimple`-style loaders.
- Usually bundle model/CLIP/VAE behavior differently from diffusion-model-only families.
- Good fit for many image workflows and older community graphs.

### FLUX-family workflows
- Frequently require separate diffusion-model, encoder, and VAE decisions.
- Check whether the install expects dual-encoder patterns and a FLUX-specific text encoding path.
- Confirm exact loader node names and text encoder files from `/object_info`.

### WAN-family workflows
- Video-capable workflows often depend on family-specific encoders, VAEs, schedulers, and sometimes multi-stage model loading.
- Confirm whether the chosen variant is text-to-video, image-to-video, animation, or another branch.
- Do not assume one WAN graph fits every WAN model family.

### LTX-family workflows
- Often depend on custom nodes or newer ComfyUI builds.
- Confirm text encoder and scheduler expectations from the target install.
- Validate whether the install uses checkpoint-style loading, dedicated LTX loaders, or both.

## LoRA loading + training pipeline

### Core LoRA rule

Treat every LoRA as family-specific until proven otherwise.

### Before loading a LoRA

Confirm:
- the LoRA filename exists on the target install
- the target base model family matches the LoRA's training family
- the graph uses the correct loader path for that family
- any text-encoder-side LoRA behavior is supported by the nodes on the install

### Portable instruction pattern

Say:
- "Confirm the available LoRAs from the install"
- "Verify this LoRA was trained for the selected base model family"
- "Apply conservative strengths first, then tune"

Do not say:
- "Use my local favorite LoRA"
- "Assume this named LoRA exists"

### Stacking

When stacking multiple LoRAs:
- add them one at a time
- keep strengths conservative initially
- test for shape/key mismatches after each addition

### LoRA training pipeline scope

The LoRA training pipeline can include JoyCaption capabilities and dynamic prompting alongside model training.

Agent role for LoRA training requests:
- helps structure the dataset folder
- configures training parameters
- uses JoyCaption capabilities to produce source descriptions when needed
- applies dynamic prompting to generate prompt variants for stronger coverage
- manages checkpoint output
- deploys trained LoRA checkpoints to ComfyUI

## Required checks for any family

For the chosen family, confirm:
- loader node class
- text encoder node class and compatible encoder files
- VAE requirements
- LoRA compatibility expectations
- sampler/scheduler constraints
- custom node requirements
