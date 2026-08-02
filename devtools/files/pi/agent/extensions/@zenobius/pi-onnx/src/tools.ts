// SPDX-License-Identifier: MIT
// Copyright (C) Jarkko Sakkinen 2026

import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import type { AgentToolUpdateCallback } from "@earendil-works/pi-agent-core";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { Config } from "./config.js";
import { configureRuntime, loadPipeline } from "./runtime.js";

function progress<T>(text: string, details: T): { content: Array<{ type: "text"; text: string }>; details: T } {
	return { content: [{ type: "text" as const, text }], details };
}

function toFloat32Array(value: unknown): Float32Array {
	if (value instanceof Float32Array) return value;
	if (Array.isArray(value)) return Float32Array.from(value as number[]);
	if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
		const data = (value as { data: unknown }).data;
		if (data instanceof Float32Array) return data;
		if (Array.isArray(data)) return Float32Array.from(data as number[]);
	}
	throw new Error("Unable to coerce pipeline output to Float32Array");
}

function head(vec: Float32Array, n = 3): number[] {
	const out: number[] = [];
	for (let i = 0; i < Math.min(n, vec.length); i++) out.push(Number(vec[i].toFixed(4)));
	return out;
}

function getAsrSamplingRate(pipeline: unknown): number {
	const rate = (pipeline as { processor?: { feature_extractor?: { config?: { sampling_rate?: unknown } } } }).processor
		?.feature_extractor?.config?.sampling_rate;
	return typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? rate : 16000;
}

function decodeAudioFile(
	path: string,
	samplingRate: number,
	signal: AbortSignal | undefined,
	maxDecodedBytes: number,
): Promise<Float32Array> {
	if (signal?.aborted) return Promise.reject(new Error("aborted"));
	if (!existsSync(path)) return Promise.reject(new Error(`Audio file not found: ${path}`));

	return new Promise((resolve, reject) => {
		const child = spawn("ffmpeg", [
			"-v",
			"error",
			"-i",
			path,
			"-ac",
			"1",
			"-ar",
			String(samplingRate),
			"-f",
			"f32le",
			"pipe:1",
		]);
		const stdout: Buffer[] = [];
		const stderr: Buffer[] = [];
		let settled = false;
		let decodedBytes = 0;

		const finish = (err: Error | null, audio?: Float32Array) => {
			if (settled) return;
			settled = true;
			signal?.removeEventListener("abort", onAbort);
			if (err) reject(err);
			else resolve(audio ?? new Float32Array());
		};
		const onAbort = () => {
			child.kill("SIGTERM");
			finish(new Error("aborted"));
		};

		signal?.addEventListener("abort", onAbort, { once: true });
		child.stdout.on("data", (chunk: Buffer) => {
			if (settled) return;
			decodedBytes += chunk.byteLength;
			if (decodedBytes > maxDecodedBytes) {
				child.kill("SIGTERM");
				finish(new Error(`Decoded audio for ${path} exceeded ${maxDecodedBytes} bytes`));
				return;
			}
			stdout.push(chunk);
		});
		child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
		child.once("error", (err) => {
			finish(new Error(`Failed to start ffmpeg for audio decoding: ${err.message}`));
		});
		child.once("close", (code) => {
			if (settled) return;
			if (code !== 0) {
				const message = Buffer.concat(stderr).toString("utf8").trim();
				finish(new Error(`ffmpeg failed to decode ${path}${message ? `: ${message}` : ""}`));
				return;
			}

			const data = Buffer.concat(stdout);
			if (data.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) {
				finish(new Error(`ffmpeg produced invalid f32le audio for ${path}`));
				return;
			}

			const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
			finish(null, new Float32Array(buffer));
		});
	});
}

export function ensureSupportedEmbedPooling(pooling: Config["tools"]["embed"]["pooling"]): void {
	if (pooling === "none") {
		throw new Error('onnx_embed does not support tools.embed.pooling="none"; use "mean" or "cls".');
	}
}

export function registerEmbedTool(pi: ExtensionAPI, config: Config): void {
	if (!config.tools.embed.enabled) return;

	pi.registerTool({
		name: "onnx_embed",
		label: "ONNX embeddings",
		description:
			"Compute sentence/token embeddings locally using a Hugging Face onnx-community feature-extraction model. Returns one vector per input string.",
		parameters: Type.Object({
			texts: Type.Array(Type.String(), { minItems: 1, description: "Strings to embed." }),
		}),
		async execute(
			_toolCallId: string,
			params: { texts: string[] },
			signal: AbortSignal | undefined,
			onUpdate?: AgentToolUpdateCallback<{ model: string; dim: number; vectors: number[][] }>,
		) {
			const initial = { model: config.tools.embed.model, dim: 0, vectors: [] as number[][] };
			ensureSupportedEmbedPooling(config.tools.embed.pooling);
			await configureRuntime(config);
			onUpdate?.(progress(`Loading ${config.tools.embed.model}…`, initial));

			const { pipeline } = await loadPipeline("feature-extraction", config.tools.embed.model, {
				device: config.device,
				dtype: config.defaultDtype,
			});

			if (signal?.aborted) throw new Error("aborted");
			onUpdate?.(progress(`Embedding ${params.texts.length} input(s)…`, initial));

			const output = (await pipeline(params.texts, {
				pooling: config.tools.embed.pooling,
				normalize: config.tools.embed.normalize,
			})) as { dims: number[]; data: Float32Array } | Array<{ data: Float32Array }>;

			const vectors: number[][] = [];
			let dim = 0;
			if (Array.isArray(output)) {
				for (const t of output) {
					const v = toFloat32Array(t);
					vectors.push(Array.from(v));
					dim = v.length;
				}
			} else if (output && typeof output === "object" && "data" in output) {
				const flat = toFloat32Array(output);
				dim = output.dims[output.dims.length - 1];
				for (let i = 0; i < params.texts.length; i++) {
					vectors.push(Array.from(flat.subarray(i * dim, (i + 1) * dim)));
				}
			}

			const summary = vectors
				.map((v, i) => `  [${i}] dim=${v.length} head=${head(Float32Array.from(v)).join(", ")}`)
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `Embedded ${vectors.length} input(s) with ${config.tools.embed.model} (dim=${dim}):\n${summary}`,
					},
				],
				details: { model: config.tools.embed.model, dim, vectors },
			};
		},
	});
}

export function registerClassifyTool(pi: ExtensionAPI, config: Config): void {
	if (!config.tools.classify.enabled) return;

	pi.registerTool({
		name: "onnx_classify",
		label: "ONNX text classification",
		description:
			"Classify text locally using a Hugging Face onnx-community classifier. If `labels` is provided, runs zero-shot classification; otherwise uses the model's native label set.",
		parameters: Type.Object({
			text: Type.String({ description: "Text to classify." }),
			labels: Type.Optional(
				Type.Array(Type.String(), {
					description: "Optional candidate labels for zero-shot classification.",
				}),
			),
		}),
		async execute(
			_toolCallId: string,
			params: { text: string; labels?: string[] },
			signal: AbortSignal | undefined,
			onUpdate?: AgentToolUpdateCallback<{ model: string; task: string; results: Array<{ label: string; score: number }> }>,
		) {
			await configureRuntime(config);
			const zeroShot = Array.isArray(params.labels) && params.labels.length > 0;
			const task = zeroShot ? "zero-shot-classification" : "text-classification";
			const initial = { model: config.tools.classify.model, task, results: [] };
			onUpdate?.(progress(`Loading ${config.tools.classify.model} (${task})…`, initial));

			const { pipeline } = await loadPipeline(task, config.tools.classify.model, {
				device: config.device,
				dtype: config.defaultDtype,
			});

			if (signal?.aborted) throw new Error("aborted");

			const result = zeroShot
				? ((await pipeline(params.text, params.labels)) as { labels: string[]; scores: number[] })
				: ((await pipeline(params.text, { top_k: config.tools.classify.topK })) as Array<{
						label: string;
						score: number;
					}>);

			const top: Array<{ label: string; score: number }> = zeroShot
				? (result as { labels: string[]; scores: number[] }).labels.map((l, i) => ({
						label: l,
						score: (result as { scores: number[] }).scores[i],
					}))
				: (result as Array<{ label: string; score: number }>);

			const lines = top.slice(0, config.tools.classify.topK).map((r) => `  ${r.score.toFixed(4)}  ${r.label}`);
			return {
				content: [
					{
						type: "text" as const,
						text: `Classified with ${config.tools.classify.model} (${task}):\n${lines.join("\n")}`,
					},
				],
				details: { model: config.tools.classify.model, task, results: top },
			};
		},
	});
}

export function registerTranscribeTool(pi: ExtensionAPI, config: Config): void {
	if (!config.tools.transcribe.enabled) return;

	pi.registerTool({
		name: "onnx_transcribe",
		label: "ONNX speech transcription",
		description:
			"Transcribe an audio file locally using a Hugging Face onnx-community ASR model (e.g. whisper-tiny). Returns the recognized text.",
		parameters: Type.Object({
			path: Type.String({ description: "Path to an audio file on disk (.wav, .mp3, .flac, .ogg)." }),
			language: Type.Optional(Type.String({ description: "Source language hint (e.g. 'en')." })),
			task: Type.Optional(
				Type.Union([
					Type.Literal("transcribe"),
					Type.Literal("translate"),
				]),
			),
		}),
		async execute(
			_toolCallId: string,
			params: { path: string; language?: string; task?: "transcribe" | "translate" },
			signal: AbortSignal | undefined,
			onUpdate?: AgentToolUpdateCallback<{
				model: string;
				chunks: Array<{ text: string; timestamp: [number, number] }>;
			}>,
		) {
			const initial = { model: config.tools.transcribe.model, chunks: [] };
			await configureRuntime(config);
			onUpdate?.(progress(`Loading ${config.tools.transcribe.model}…`, initial));

			const { pipeline } = await loadPipeline("automatic-speech-recognition", config.tools.transcribe.model, {
				device: config.device,
				dtype: config.defaultDtype,
			});

			if (signal?.aborted) throw new Error("aborted");
			onUpdate?.(progress(`Transcribing ${params.path}…`, initial));

			const language = params.language ?? config.tools.transcribe.language ?? undefined;
			const task = params.task ?? config.tools.transcribe.task;
			const maxDecodedBytes = config.tools.transcribe.maxDecodedBytes;
			const audio = await decodeAudioFile(
				params.path,
				getAsrSamplingRate(pipeline),
				signal,
				maxDecodedBytes,
			);

			const result = (await pipeline(audio, {
				language,
				task,
				return_timestamps: true,
			})) as { text: string; chunks?: Array<{ text: string; timestamp: [number, number] }> };

			const text = result.text ?? "";
			const chunkCount = result.chunks?.length ?? 0;
			return {
				content: [
					{
						type: "text" as const,
						text:
							chunkCount > 0
								? `${text}\n\n(${chunkCount} segment(s) — see details for timestamps)`
								: text || "[no speech recognized]",
					},
				],
				details: { model: config.tools.transcribe.model, chunks: result.chunks ?? [] },
			};
		},
	});
}

export function registerAllTools(pi: ExtensionAPI, config: Config): void {
	registerEmbedTool(pi, config);
	registerClassifyTool(pi, config);
	registerTranscribeTool(pi, config);
}
