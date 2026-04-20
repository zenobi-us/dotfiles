# Reference Implementations

> Portable, proven code patterns for ComfyUI integration. These are reference implementations — adapt paths, node IDs, and configuration to the target install.
>
> **Demo workflow JSON files** are provided in [demo-workflows/](demo-workflows/) as working examples. These are tied to a specific install and are **not for production use** — export your own from your ComfyUI and adapt the patterns here. See `demo-workflows/readme.md` for details.

---

## FLUX Image Edit — Node Map

Workflow file: `flux-2-image-edit-workflow-api.json`

| Node ID | Class | Role | Action |
|---|---|---|---|
| `6` | CLIPTextEncode | **Edit prompt** | ✏️ PATCH — the instruction text |
| `163` | KSampler | Sampler seed | ✏️ PATCH — per-image variation seed |
| `164` | VAEDecode | Decode latent | fixed |
| `190` | ConditioningZeroOut | Auto-zero negative | fixed |
| `194` | UNETLoader | FLUX 2 Klein 9B KV FP8 | fixed |
| `195` | CLIPLoader | Qwen 3 8B text encoder | fixed |
| `196` | VAELoader | flux2-vae | fixed |
| `197` | EmptyFlux2LatentImage | Latent canvas | fixed |
| `198` | LoadImage | **Input image** | ✏️ PATCH — source filename (copy to ComfyUI input/ first) |
| `199` | ImageScaleToTotalPixels | Normalize to 2MP | fixed |
| `200` | GetImageSize | Read dimensions | fixed |
| `202` | Image Comparer (rgthree) | UI preview | fixed |
| `203` | SaveImage | Secondary save | fixed |
| `204` | ReferenceLatent | Positive ref | fixed |
| `205` | ReferenceLatent | Negative ref | fixed |
| `206` | VAEEncode | Encode input image | fixed |
| `212` | FluxKVCache | KV cache | fixed |
| `213` | RTXVideoSuperResolution | 2× RTX upscale | fixed |
| `214` | Image Comparer (rgthree) | RTX UI preview | fixed |
| `216` | InpaintStitchImproved | Stitch passthrough | fixed |
| `221:217` | InpaintCropImproved | Crop passthrough | fixed |
| `225` | ttN imageOutput | **Primary output** | ✏️ PATCH — `output_path`, `save_prefix`, `file_type` |

> **Rule: Override only nodes marked ✏️ PATCH. Everything else is fixed infrastructure. Never edit the base workflow JSON file.**

### Image Path Rule

ComfyUI resolves filenames relative to its own `input/` directory. Copy the source image there before queuing. Pass **filename only** — never an absolute path — to node 198.

```python
import shutil, os

def copy_to_comfyui_input(image_path: str, comfyui_input_dir: str) -> str:
    filename = os.path.basename(image_path)
    shutil.copy2(image_path, os.path.join(comfyui_input_dir, filename))
    return filename
```

---

## LTX 2.3 Video — Node Map

Workflow file: `ltx-2-3-video-i2v-t2v-zam.json`

| Node ID | Class | Title | Patch |
|---|---|---|---|
| `267:266` | PrimitiveStringMultiline | Prompt | ✏️ PATCH `inputs.value` — the text prompt |
| `269` | LoadImage | Load Image | ✏️ PATCH `inputs.image` — source filename (copy to ComfyUI input/ first) |
| `75` | SaveVideo | Save Video | ✏️ PATCH `inputs.filename_prefix` — output path + name stem |
| `267:201` | PrimitiveBoolean | Switch to Text to Video? | ✏️ PATCH `inputs.value`: `false` = I2V, `true` = T2V |

**Fixed reference values (do not patch unless asked):**

| Node | Value | Role |
|---|---|---|
| `267:257` | 1280 | Width |
| `267:258` | 720 | Height |
| `267:260` | 24 | Frame rate |
| `267:225` | 121 | Length (frames) |

### Output Path Rule

`filename_prefix` is relative to ComfyUI's `output/` directory. `video/car_reel` → `output/video/car_reel_00001.mp4`. **Always use a unique prefix per project** to avoid overwriting previous outputs.

---

## Workflow Loading and Patching Pattern

### The Golden Rule

> **Load the workflow once. Deep copy. Patch only what changes per job. Base file never touched.**

```python
import copy, json, os

def load_workflow(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def build_flux_workflow(filename: str, prompt: str, seed: int,
                        output_dir: str, save_prefix: str,
                        base_workflow_path: str) -> dict:
    """
    Returns a fully patched deep copy of the base FLUX image edit workflow.
    Overrides: image filename, edit prompt, output path/prefix, seed.
    """
    wf = copy.deepcopy(load_workflow(base_workflow_path))

    wf["198"]["inputs"]["image"]              = filename         # Override 1: LoadImage
    wf["6"]["inputs"]["text"]                 = prompt           # Override 2: CLIPTextEncode
    wf["225"]["inputs"]["output_path"]        = output_dir       # Override 3: ttN imageOutput
    wf["225"]["inputs"]["save_prefix"]        = save_prefix
    wf["225"]["inputs"]["file_type"]          = "jpg"
    wf["225"]["inputs"]["overwrite_existing"] = False
    wf["225"]["inputs"]["embed_workflow"]     = True
    wf["225"]["inputs"]["image_output"]       = "Save"
    wf["225"]["inputs"]["number_padding"]     = 5
    wf["163"]["inputs"]["seed"]               = seed             # Optional: seed variation

    return wf

def build_ltx_workflow(filename: str, prompt: str, filename_prefix: str,
                       t2v_mode: bool = False,
                       base_workflow_path: str = None) -> dict:
    """
    Returns a fully patched deep copy of the base LTX video workflow.
    Overrides: prompt text, source image, output path, I2V/T2V switch.
    """
    wf = copy.deepcopy(load_workflow(base_workflow_path))

    wf["267:266"]["inputs"]["value"]          = prompt           # Prompt text
    wf["269"]["inputs"]["image"]             = filename         # Source image filename
    wf["75"]["inputs"]["filename_prefix"]    = filename_prefix # Output path + stem
    wf["267:201"]["inputs"]["value"]          = t2v_mode        # False=I2V, True=T2V

    return wf
```

---

## API Library — Reference Implementation

This is the proven pattern for ComfyUI WebSocket interaction. Use this when a shared `api_lib.py` is not available on the target machine.

### Dependencies

```
pip install requests websocket-client
```

### Core Functions

```python
import uuid, json, requests, websocket

class ComfyUI:
    def __init__(self, host: str = "http://127.0.0.1:8188",
                 ws_host: str = "ws://127.0.0.1:8188"):
        self.host   = host
        self.ws    = ws_host

    def is_alive(self) -> bool:
        """Check if ComfyUI is reachable."""
        try:
            return requests.get(f"{self.host}/system_stats", timeout=5).status_code == 200
        except Exception:
            return False

    def object_info(self) -> dict:
        """Fetch all available node classes and their inputs."""
        return requests.get(f"{self.host}/object_info", timeout=30).json()

    def get_node_class(self, node_name: str) -> dict | None:
        """Get inputs/outputs for a specific node class."""
        info = self.object_info()
        return info.get(node_name)

    def queue_prompt(self, workflow: dict, client_id: str) -> str:
        """
        POST a workflow to the queue.
        Returns the prompt_id.
        Raises RuntimeError if ComfyUI rejects the workflow.
        """
        payload = {"prompt": workflow, "client_id": client_id}
        r = requests.post(f"{self.host}/prompt", json=payload, timeout=30)
        r.raise_for_status()
        data = r.json()
        if "error" in data:
            raise RuntimeError(f"ComfyUI rejected workflow: {data['error']}")
        return data["prompt_id"]

    def wait_for_completion(self, prompt_id: str,
                            ws: websocket.WebSocket,
                            timeout: float = None) -> dict:
        """
        Block on the WebSocket until ComfyUI signals this prompt_id is done.
        Returns the job history entry on success.
        Raises RuntimeError if the job errored.
        """
        while True:
            raw = ws.recv()
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            if (msg.get("type") == "executing"
                    and msg.get("data", {}).get("node") is None
                    and msg.get("data", {}).get("prompt_id") == prompt_id):
                break

        # Verify via /history
        resp = requests.get(f"{self.host}/history/{prompt_id}", timeout=10)
        history = resp.json()
        if prompt_id not in history:
            raise RuntimeError(f"Job {prompt_id} missing from /history after completion signal")
        job = history[prompt_id]
        if job.get("status", {}).get("status_str") == "error":
            raise RuntimeError(f"Job {prompt_id} errored — check ComfyUI console")
        return job

    def get_history(self, prompt_id: str) -> dict:
        return requests.get(f"{self.host}/history/{prompt_id}", timeout=10).json()

    def get_queue(self) -> dict:
        return requests.get(f"{self.host}/queue", timeout=10).json()

    def interrupt(self) -> None:
        requests.post(f"{self.host}/interrupt", timeout=10)

    def clear_queue(self) -> None:
        requests.post(f"{self.host}/queue", json={"clear": True}, timeout=10)
```

### Usage Pattern

```python
client = ComfyUI(host="http://127.0.0.1:8188")

# One-time setup per batch run
client_id = str(uuid.uuid4())
ws = websocket.WebSocket()
ws.connect(f"{client.ws}/ws?clientId={client_id}")

try:
    for image_path in images:
        filename = copy_to_comfyui_input(image_path, comfyui_input_dir)
        seed     = random.randint(0, 2**32 - 1)
        wf       = build_flux_workflow(filename, prompt, seed, output_dir, save_prefix, base_path)
        prompt_id = client.queue_prompt(wf, client_id)
        client.wait_for_completion(prompt_id, ws)
        print(f"OK: {image_path}")
finally:
    ws.close()
```

---

## Image Resolution Helpers

```python
from pathlib import Path

def derive_output_dir(input_folder: str, batch_index: int = None) -> str:
    """Auto-derives output directory from input folder name."""
    p = Path(input_folder)
    batch_root = p / f"{p.name} flux edit batch"
    if batch_index is not None:
        return str(batch_root / f"batch_{batch_index:02d}")
    return str(batch_root)

def derive_save_prefix(input_folder: str, batch_index: int = None) -> str:
    """Clean input folder name -> filesystem-safe save prefix."""
    import re
    name  = Path(input_folder).name
    clean = re.sub(r"[^\w\s]", "", name)
    clean = re.sub(r"\s+", "_", clean).lower().strip("_")
    if batch_index is not None:
        return f"{clean}_b{batch_index:02d}_"
    return f"{clean}_"

def derive_job_folder(input_folder: str, workflow_name: str,
                     batch_jobs_root: str) -> str:
    """Derives the job script folder in the project workspace."""
    import re
    def to_snake(s):
        s = re.sub(r"[^\w\s]", "", s)
        return re.sub(r"\s+", "_", s).lower().strip("_")
    folder_snake   = to_snake(Path(input_folder).name)
    workflow_snake = to_snake(workflow_name)
    return str(Path(batch_jobs_root) / f"{folder_snake}_batch_job_{workflow_snake}")

def resolve_images(folder: str, extensions=None) -> list[str]:
    """Recursively find all image files in a folder."""
    if extensions is None:
        extensions = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG", "WEBP"]
    p = Path(folder)
    images = []
    for ext in extensions:
        images.extend(sorted(p.glob(f"**/*.{ext}"), key=lambda x: x.name))
    # Deduplicate by lowercase name
    seen, unique = set(), []
    for img in images:
        if img.name.lower() not in seen:
            seen.add(img.name.lower())
            unique.append(str(img))
    return unique
```

---

## Prompt Versioning for LLM-Generated Prompts

When generating prompts via LLM for batch runs, follow the non-destructive pipeline:

1. **JoyCaption** → raw scene descriptions → `captions.txt` (never modified)
2. **LLM reads prompting guide** → generates unique cinematic prompts
3. **Save to JSON** with versioning block:

```json
{
  "_version": {
    "v": 1,
    "description": "Initial cinematic pass — outdoor scenes, warm lighting",
    "date": "2026-04-01",
    "negative": "avoid locked-off static frame as sole camera behaviour, frozen motion, still photography, cartoonish"
  },
  "image_001.jpg": {
    "prompt": "The camera slowly tracks right as the subject walks forward...",
    "description": "Person walking on cobblestone street at golden hour"
  }
}
```

4. **Keep old versions** — never overwrite. Generate v2, v3 as style evolves.

### Negative Prompt Standard

Keep negatives **brief and targeted**. The model responds better to direction than negation.

```
Negative: "avoid locked-off static frame as sole camera behaviour, frozen motion, still photography, cartoonish"
```

Do NOT pile on synonyms — "static, still, frozen, motionless, no movement" etc. Let the positive prompt describe what SHOULD happen.