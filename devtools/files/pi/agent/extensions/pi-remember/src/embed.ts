import { EmbeddingModel, ExecutionProvider, FlagEmbedding } from "fastembed";

import { getModelDir } from "./store.js";

let embedder: FlagEmbedding | null = null;

export function encodeEmbedding(vec: number[]): Buffer {
  return Buffer.from(new Float32Array(vec).buffer);
}

export function decodeEmbedding(blob: Buffer): Float32Array {
  return new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function similarity(a: Float32Array, b: Float32Array): number {
  return cosineSimilarity(a, b);
}

async function getEmbedder(): Promise<FlagEmbedding> {
  if (embedder) return embedder;
  embedder = await FlagEmbedding.init({
    model: EmbeddingModel.AllMiniLML6V2,
    executionProviders: [ExecutionProvider.CPU],
    cacheDir: getModelDir(),
    showDownloadProgress: true,
  });
  return embedder;
}

export async function embedPassage(text: string): Promise<number[]> {
  const model = await getEmbedder();
  for await (const batch of model.passageEmbed([text], 1)) {
    if (batch[0]) return batch[0];
  }
  throw new Error("Failed to generate embedding");
}

export async function embedQuery(text: string): Promise<Float32Array> {
  const model = await getEmbedder();
  const vec = await model.queryEmbed(text);
  return new Float32Array(vec);
}
