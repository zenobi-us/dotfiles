# pi-onnx

Runs [Hugging Face onnx-community](https://huggingface.co/onnx-community) models locally inside the pi coding agent using [`@huggingface/transformers`](https://www.npmjs.com/package/@huggingface/transformers).

Implements a chat provider and several tool calls:

- `onnx_embed({ texts: string[] })`: array of vectors (and dimensionality).
- `onnx_classify({ text, labels? })`: top-K labels with scores; when `labels`
  is provided, runs zero-shot classification.
- `onnx_transcribe({ path, language?, task? })`: transcript text and segments.

## Install

```sh
pi install npm:pi-onnx
```

## Configure

Copy `example-config.json` from this package as a starting point:

```sh
cp example-config.json ~/.pi/agent/pi-onnx.json
```

### Top-level

| Field                 | Type                                   | Default                           | Notes                                                     |
| --------------------- | -------------------------------------- | --------------------------------- | --------------------------------------------------------- |
| `cacheDir`            | `string \| null`                       | `null` (HF default)               | Forwarded to `env.cacheDir`.                              |
| `device`              | `"cpu" \| "webgpu" \| "wasm" \| "gpu"` | `"cpu"`                           | onnxruntime execution provider hint.                      |
| `defaultDtype`        | `Dtype`                                | `"q4"`                            | Per-model `dtype` overrides this.                         |
| `preloadDefaultModel` | `boolean`                              | `false`                           | Preload the first configured model on session start.      |
| `models`              | `ModelEntry[]`                         | `[Qwen2.5-Coder-0.5B-Instruct]`   | Each entry becomes a `onnx-community/<id>` chat model.    |
| `discovery`           | object                                 | enabled, limit 50                 | Append compatible `onnx-community/*` models from the HF Hub. |
| `tools`               | object                                 | `embed` only                      | Toggles for `onnx_embed` / `_classify` / `_transcribe`.   |

`Dtype` is one of `"fp32"`, `"fp16"`, `"q8"`, `"int8"`, `"uint8"`, `"q4"`, `"bnb4"`, `"q4f16"`.

### `models[]`

| Field           | Type     | Default        | Notes                                                |
| --------------- | -------- | -------------- | ---------------------------------------------------- |
| `id`            | `string` | —              | Hugging Face repo path (`onnx-community/` prefixed). |
| `name`          | `string` | `id`           | Display name shown in the model picker.              |
| `contextWindow` | `number` | —              | Context window size in tokens.                       |
| `maxTokens`     | `number` | `1024`         | Default `max_new_tokens` for completions.            |
| `dtype`         | `Dtype`  | `defaultDtype` | Quantization for this model only.                    |

Only `id` is required; the `onnx-community/` prefix is added if missing.
Pinned models are checked against the Hugging Face Hub when possible. Repositories that are not compatible with `@huggingface/transformers` text generation, such as `onnxruntime-genai` image-text-to-text exports, are skipped instead of being offered as broken chat models.

Example:

```json
{
  "id": "onnx-community/Qwen3-0.6B-ONNX",
  "name": "Qwen3-0.6B (ONNX, q4)",
  "contextWindow": 32768,
  "maxTokens": 2048,
  "dtype": "q4"
}
```

### `discovery`

| Field          | Type            | Default                                                     | Notes                                   |
| -------------- | --------------- | ----------------------------------------------------------- | --------------------------------------- |
| `enabled`      | `boolean`       | `true`                                                      | Append discovered models to `models[]`. |
| `limit`        | `number`        | `50`                                                        | Per pipeline tag.                       |
| `pipelineTags` | `PipelineTag[]` | `["text-generation"]`                                      | Hugging Face pipeline tags to scan.     |

Discovery only registers `transformers.js` text-generation repositories that expose a supported `onnx/model*.onnx` file. It also records the matching dtype, so models such as `gpt-oss-20b-ONNX` use `q4f16` instead of the global default `q4`. If a discovered model is also pinned in `models` without an explicit `dtype`, discovery fills in that dtype automatically.

### `tools.embed`

| Field       | Type                        | Default                             | Notes                          |
| ----------- | --------------------------- | ----------------------------------- | ------------------------------ |
| `enabled`   | `boolean`                   | `true`                              | Toggles `onnx_embed`.          |
| `model`     | `string`                    | `onnx-community/all-MiniLM-L6-v2`   | Any feature-extraction model.  |
| `pooling`   | `"mean" \| "cls"`           | `"mean"`                            | Pooling strategy.              |
| `normalize` | `boolean`                   | `true`                              | L2-normalize output vectors.   |

### `tools.classify`

| Field     | Type      | Default                                                            | Notes                                |
| --------- | --------- | ------------------------------------------------------------------ | ------------------------------------ |
| `enabled` | `boolean` | `false`                                                            | Toggles `onnx_classify`.             |
| `model`   | `string`  | `onnx-community/distilbert-base-uncased-finetuned-sst-2-english`   | Classifier or NLI model (zero-shot). |
| `topK`    | `number`  | `5`                                                                | Maximum labels returned.             |

### `tools.transcribe`

| Field             | Type                            | Default                       | Notes                                             |
| ----------------- | ------------------------------- | ----------------------------- | ------------------------------------------------- |
| `enabled`         | `boolean`                       | `false`                       | Toggles `onnx_transcribe`.                        |
| `model`           | `string`                        | `onnx-community/whisper-tiny` | Any ASR model.                                    |
| `language`        | `string \| null`                | `null`                        | Default language hint (e.g. `"en"`).              |
| `task`            | `"transcribe" \| "translate"`   | `"transcribe"`                | Default ASR task.                                 |
| `maxDecodedBytes` | `number`                        | `268435456`                   | Maximum decoded f32 audio bytes to buffer in RAM. |

## Limitations

- No tool calling support for ONNX chat models.
- Tokens are approximated from the tokenizer.
- First call to a model blocks while weights download.
- `onnx_transcribe` shells out to `ffmpeg` (must be on `PATH`) to decode the
  input audio file to a `Float32Array` before inference, capped by `maxDecodedBytes`.

## License

SPDX-License-Identifier: MIT  
Copyright (C) Jarkko Sakkinen 2026

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
