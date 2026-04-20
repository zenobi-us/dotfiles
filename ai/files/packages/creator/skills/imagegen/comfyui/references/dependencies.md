# Dependencies

External tools and packages required by this skill's workflows and pipelines.

---

## ComfyUI

**Required** — The core platform.

- Install: [https://github.com/comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI)
- Requires a machine with GPU (local) or a cloud GPU provider (remote/cloud)
- Version: any recent build; tested against 2025-2026 releases

### Ports (default)

| Service | Default URL |
|---|---|
| REST API | `http://127.0.0.1:8188` |
| WebSocket | `ws://127.0.0.1:8188/ws` |
| System stats | `http://127.0.0.1:8188/system_stats` |

Adjust host/port if running remotely or on a non-default port.

---

## Python Packages

```bash
pip install requests websocket-client pillow
```

| Package | Purpose |
|---|---|
| `requests` | REST API calls to ComfyUI |
| `websocket-client` | Real-time queue events and completion signals |
| `pillow` | Image file handling |

> On some Windows systems, `python` is not in PATH. Use `py -3` or the full path to your Python install.

---

## JoyCaption (Caption Generation)

**Required for the LLM-driven prompting pipeline only.**

JoyCaption generates natural language descriptions of images. It is a vision-to-text tool — it does **not** write prompts. Descriptions are fed to an LLM which then generates cinematic prompts.

- Type: CPU-based CLI tool
- Model: `llama-mtmd-cli` (or JoyCaption's recommended variant)
- Install: [https://github.com/jimdroberts/JoyCaption](https://github.com/jimdroberts/JoyCaption)
- Runs locally — no API key required, no internet required for captioning

### Typical Usage

```bash
llama-mtmd-cli \
  --model /path/to/joycaption/model.bin \
  --mmproj /path/to/joycaption/mmproj.bin \
  --image path/to/image.jpg \
  --caption
```

Output is raw scene description text. Save directly to `captions.txt`. **Never edit `captions.txt` after generation.**

### JoyCaption in the Pipeline

```
JoyCaption (CPU)
    ↓
captions.txt  (raw, permanent, never modified)
    ↓
LLM reads captions.txt + prompting-guides/ltx-2-3-prompting-guide.md
    ↓
ltx_video_prompts.json  (versioned, per-image prompts)
    ↓
run_ltx_video_batch.py reads JSON → queues to ComfyUI
```

---

## Optional: RTX Video Super Resolution

Available on NVIDIA RTX GPUs with the nvvfx SDK. Provides hardware-accelerated 2× video upscaling inline in the ComfyUI graph.

- If the custom node `RTXVideoSuperResolution` is present in `/object_info`, it is available
- If absent, the workflow still runs — the node is simply bypassed
- Not required for standard image or video output

---

## Optional: Custom Node Packs

The following are optional but unlock additional capability:

| Pack | Purpose | Repo |
|---|---|---|
| `rgthree` | Image Comparer nodes for UI review | [git@github.com:rgthree/rgthree-comfy](https://github.com/rgthree/rgthree-comfy) |
| `ComfyUI-Manager` | Install other custom nodes from within ComfyUI | [github.com/ltdrdata/ComfyUI-Manager](https://github.com/ltdrdata/ComfyUI-Manager) |

Check `/object_info` for the specific node class names to confirm availability before building workflows that depend on them.

---

## LLM for Prompt Generation

Any LLM capable of following the prompting guide can generate cinematic prompts from JoyCaption descriptions. No specific provider required.

Requirements:
- Reads: `prompting-guides/ltx-2-3-prompting-guide.md` + `captions.txt`
- Writes: `ltx_video_prompts.json` (one prompt per image)
- Follows the negative prompt standard: `"avoid locked-off static frame as sole camera behaviour, frozen motion, still photography, cartoonish"`

---

## Model Files (Not Included)

Model files (checkpoints, LoRAs, VAEs, encoders) are **not** included in this repo. Obtain them from:

| Model family | Source |
|---|---|
| FLUX | [HuggingFace](https://huggingface.co/black-forest-labs) |
| LTX-Video | [HuggingFace](https://huggingface.co/Lightricks) |
| Stable Diffusion / SDXL | [HuggingFace](https://huggingface.co/models), [Civitai](https://civitai.com) |
| LoRAs | [Civitai](https://civitai.com), [HuggingFace](https://huggingface.co/sdh31) |

Always confirm the exact filename on the target ComfyUI install before referencing it in a workflow.
