---
id: 91c7a2bd
type: research
title: Tiny LLM/NLP Models for Transformers.js Title Generation
created_at: 2026-07-05
updated_at: 2026-07-05
status: completed
epic_id: research-command
related_task_id: null
---

# Tiny LLM/NLP Models for Transformers.js Title Generation

## Thinking

Research question: sub-200M parameter models usable with Hugging Face `@huggingface/transformers` / Transformers.js in TypeScript to summarize one paragraph into a short title.

Subquestions researched in parallel:

1. Transformers.js compatibility constraints.
2. Candidate sub-200M summarization/title models.
3. Quality tradeoffs: seq2seq vs causal tiny LMs.
4. TypeScript implementation path.

Loaded/used skills: `miniproject`, `research-analyst`, `lynx-web-search`, `llm-architect`, `nlp-engineer`.

[bias: boring ONNX-ready seq2seq beats clever tiny chat model. Less code, fewer weird outputs.]

```text
[Paragraph]
  -> [Prompt: "Write a concise 3-7 word title..."]
  -> [text2text-generation]
  -> [T5/FLAN-T5 small ONNX]
  -> [max_new_tokens 8-12, no sampling]
  -> [Title]
```

## Research

### Recommendation shortlist

| Rank | Model | Params | Transformers.js readiness | Task | Verdict | Confidence |
|---:|---|---:|---|---|---|---|
| 1 | `Xenova/flan-t5-small` | base `google/flan-t5-small`: 76,961,152 | `library_name: transformers.js`, ONNX encoder/decoder files | `text2text-generation` | Best default. Instruction-tuned, small, browser/Node friendly. | HIGH |
| 2 | `Xenova/t5-small` | base `google-t5/t5-small`: 60,506,880 | `library_name: transformers.js`, ONNX encoder/decoder files | `text2text-generation` | Smaller baseline. Less instruction-following than FLAN. | HIGH |
| 3 | `Falconsai/text_summarization` | ~60.5M T5-small family | ONNX files present, but `library_name: transformers`, not explicit `transformers.js` | `summarization` / `text2text-generation` | Likely usable; verify locally. More summary than title. | MEDIUM |
| 4 | `HuggingFaceTB/SmolLM2-135M-Instruct` | 134,515,008 | tags include `transformers.js`, ONNX q4/q8/fp16 files | `text-generation` | Works as tiny chat/generator. Worse fit for title summarization. | MEDIUM |

### Reject list

| Model family | Why reject | Confidence |
|---|---|---|
| DistilBART CNN/XSum variants | Real summarizers, but common variants are >200M params (e.g. `distilbart-cnn-6-6` model card lists 230M). | HIGH |
| Pegasus / distilled Pegasus | Usually far over 200M and not clean Transformers.js-ready. | MEDIUM |
| `tiny-random-*` models | Pass size constraint; fail usefulness. Random/test weights. | HIGH |
| `distilgpt2` | 88M and Transformers.js ONNX exists via Xenova, but causal continuation model, not summarizer/title model. | HIGH for size, LOW for fit |

### Why seq2seq wins

Paragraph → title is conditional compression. T5/FLAN-T5 encodes input paragraph then decodes short output. Tiny causal LMs continue text; they need prompt hacks, stop handling, echo cleanup, and still may ramble. Use causal only if already loading it elsewhere.

### TypeScript implementation

```ts
import { pipeline } from "@huggingface/transformers";

const titleer = await pipeline(
  "text2text-generation",
  "Xenova/flan-t5-small",
  { dtype: "q8" }
);

export async function paragraphToTitle(paragraph: string): Promise<string> {
  const prompt = `Write a concise 3-7 word title for this paragraph:\n\n${paragraph}`;

  const out = await titleer(prompt, {
    max_new_tokens: 12,
    num_beams: 4,
    do_sample: false,
    early_stopping: true,
  });

  return out[0].generated_text
    .replace(/^["“”']|["“”']$/g, "")
    .replace(/[.!?]+$/g, "")
    .trim();
}
```

Browser note: first load cost still matters. Use `q8` or `q4`, cache model files, and run in a Worker if UI matters. Node is simpler.

## Verification

Access date for all sources: 2026-07-05.

| Claim | Evidence | Source type / publisher | Confidence | Contradictions / caveats |
|---|---|---|---|---|
| Transformers.js supports `summarization`, `text2text-generation`, and `text-generation` pipelines. | https://huggingface.co/docs/transformers.js/api/pipelines | Official docs / Hugging Face | HIGH | Task support does not guarantee every Hub model works. |
| Transformers.js uses ONNX Runtime and supports browser WASM/WebGPU plus dtype quantization options. | https://huggingface.co/docs/transformers.js/index, https://huggingface.co/docs/transformers.js/guides/dtypes, https://huggingface.co/docs/transformers.js/guides/webgpu | Official docs / Hugging Face | HIGH | WebGPU support is environment-dependent. |
| `Xenova/flan-t5-small` is Transformers.js-ready with ONNX files. | https://huggingface.co/Xenova/flan-t5-small and API check `library_name: transformers.js`, tags `onnx`, `text2text-generation` | HF model repo / Xenova | HIGH | Quality for title generation still prompt-dependent. |
| `Xenova/t5-small` is Transformers.js-ready with ONNX files. | https://huggingface.co/Xenova/t5-small and API check `library_name: transformers.js`, tags `onnx`, `text2text-generation` | HF model repo / Xenova | HIGH | Plain T5 follows title instruction worse than FLAN. |
| `google-t5/t5-small` has ~60.5M params. | https://huggingface.co/api/models/google-t5/t5-small returned `safetensors.total = 60506880`; model card says T5-small is 60M. | HF API/model card / Google + HF | HIGH | API pipeline tag is `translation`, but tags/config include summarization/text2text use. |
| `google/flan-t5-small` has ~77M params. | https://huggingface.co/api/models/google/flan-t5-small returned `safetensors.total = 76961152`. | HF API/model card / Google | HIGH | Direct repo lacks obvious ONNX siblings in checked API; use Xenova ONNX repo. |
| `HuggingFaceTB/SmolLM2-135M-Instruct` is under 200M and has Transformers.js/ONNX tags. | https://huggingface.co/api/models/HuggingFaceTB/SmolLM2-135M-Instruct returned `safetensors.total = 134515008`, tags include `onnx`, `transformers.js`. | HF API/model card / Hugging FaceTB | HIGH for size/compat, MEDIUM for title quality | Causal LM, not summarization-specialized. |
| DistilBART common summarizers exceed 200M. | https://huggingface.co/sshleifer/distilbart-cnn-6-6 model card table lists 230M params. | HF model card / sshleifer | HIGH | Good summarizer, outside constraint. |
| Summarization is naturally seq2seq; causal LM is next-token continuation. | https://huggingface.co/docs/transformers/tasks/summarization, https://huggingface.co/docs/transformers/tasks/language_modeling | Official docs / Hugging Face | HIGH | Architecture fit does not equal measured title quality. |

## Insights

- Best answer: **use `Xenova/flan-t5-small` with `text2text-generation`**.
- If output must be very title-like, prompt for “3-7 word title” and cap `max_new_tokens`.
- If quality disappoints, next step is not a bigger dependency. Try a title-finetuned T5-small and export/host ONNX, or use extractive/keyphrase baseline.
- Sub-200M models will produce bland titles. Expect failures on nuanced, sarcastic, highly technical, or ambiguous paragraphs.
- `summarization` pipeline is supported, but title generation is cleaner with `text2text-generation`.

## Summary

Use this first:

```ts
pipeline("text2text-generation", "Xenova/flan-t5-small", { dtype: "q8" })
```

Fallback:

```ts
pipeline("text2text-generation", "Xenova/t5-small", { dtype: "q8" })
```

Avoid DistilBART/Pegasus under this constraint. They are too large. Avoid tiny random models. They are junk for real summaries.
