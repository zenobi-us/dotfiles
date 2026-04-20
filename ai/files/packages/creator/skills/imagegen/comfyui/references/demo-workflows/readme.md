# Demo Workflows

> **These workflow JSON files are provided as working examples only.** They are tied to a specific ComfyUI install with custom nodes, model filenames, and paths that may not match your setup. Replace them with your own workflows before using in production.

---

## What's included

| Workflow | Description | Use case |
|---|---|---|
| `flux-2-image-edit-workflow-api/` | FLUX 2 image-to-image edit with RTX upscale | Batch image enhancement, style transfer, photorealism passes |
| `flux-2-image-gen/` | FLUX 2 text-to-image generation | Pure T2I image generation |
| `ltx-2-3/ltx-2-3-video-i2v-t2v-zam.json` | LTX 2.3 video — I2V and T2V | Image-to-video and text-to-video with LTX 2.3 |
| `ltx-2-3/ltx-2-3-video-i2v-t2v-quality.json` | LTX 2.3 video — quality variant | Higher quality LTX 2.3 video with adjusted settings |
| `ltx-2-3/ltx-2-3-prompting-guide.txt` | LTX 2.3 prompting reference | Camera language, scene direction, audio description |

---

## Do NOT use these workflows as-is in production

- Node class names and IDs are specific to the install they were built on
- Model filenames (checkpoint names, VAE names, encoder names) are specific to that machine
- Some workflows depend on custom nodes (`rgthree`, `ttN`, `RTXVideoSuperResolution`, etc.) that must be installed separately
- Output paths and prefixes are absolute and machine-specific

---

## How to use these files

These workflows serve as **reference architecture**, not drop-in solutions.

1. Export your own workflows from your ComfyUI install in **API format** (Menu → Info → Copy Graph as JSON)
2. Use `reference-implementations.md` to understand the node structure
3. Identify which nodes to patch per-job (the reference-implementations.md node maps show which ones)
4. Build your batch runner against your own exported workflow JSON

The FLUX image edit and LTX video node maps in `reference-implementations.md` show which nodes are the **patchable interface** — use those as a guide when inspecting your own exported graphs.

---

## Custom nodes you may need

These demo workflows depend on custom nodes not in vanilla ComfyUI:

| Node | Source |
|---|---|
| `RTXVideoSuperResolution` | nvvfx SDK — NVIDIA RTX GPU required |
| `Image Comparer` (rgthree) | [github.com/rgthree/rgthree-comfy](https://github.com/rgthree/rgthree-comfy) |
| `ttN imageOutput` | [github.com/twriGsorT/ComfyUI_tilateral_nodecustom](https://github.com/twriGsorT/ComfyUI_tilateral_nodecustom) |
| `InpaintStitchImproved`, `InpaintCropImproved` | Custom inpaint nodes |

If `/object_info` does not expose these node classes, the workflow will fail at queue time. Discover your install's actual node inventory before attempting to run any workflow.

---

## Workflow file locations

```
demo-workflows/
├── flux-2-image-edit-workflow-api/
│   └── flux-2-image-edit-workflow-api.json
├── flux-2-image-gen/
│   └── flux-2-image-gen.json
└── ltx-2-3/
    ├── ltx-2-3-video-i2v-t2v-zam.json
    ├── ltx-2-3-video-i2v-t2v-quality.json
    └── ltx-2-3-prompting-guide.txt
```

These files are the **source of truth** for the node maps documented in `reference-implementations.md`.
