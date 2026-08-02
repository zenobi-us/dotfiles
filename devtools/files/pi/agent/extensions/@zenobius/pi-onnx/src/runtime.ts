// SPDX-License-Identifier: MIT
// Copyright (C) Jarkko Sakkinen 2026

import type { Config, Dtype } from "./config.js";

type AnyPipeline = (...args: any[]) => Promise<any>;

interface LoadedPipeline {
	pipeline: AnyPipeline & { tokenizer?: any; model?: any; processor?: any };
}

let configured = false;
let transformersPromise: Promise<typeof import("@huggingface/transformers")> | null = null;
const cache = new Map<string, Promise<LoadedPipeline>>();

async function importTransformers(): Promise<typeof import("@huggingface/transformers")> {
	if (!transformersPromise) {
		transformersPromise = import("@huggingface/transformers");
	}
	return transformersPromise;
}

export async function configureRuntime(cfg: Config): Promise<void> {
	if (configured) return;
	const t = await importTransformers();
	if (cfg.cacheDir) t.env.cacheDir = cfg.cacheDir;
	t.env.allowLocalModels = true;
	t.env.allowRemoteModels = true;
	configured = true;
}

export type PipelineTask =
	| "text-generation"
	| "feature-extraction"
	| "text-classification"
	| "zero-shot-classification"
	| "automatic-speech-recognition";

export interface LoadOptions {
	device?: Config["device"];
	dtype?: Dtype;
	onProgress?: (info: unknown) => void;
}

function cacheKey(task: PipelineTask, model: string, opts: LoadOptions): string {
	return `${task}::${model}::${opts.device ?? "cpu"}::${opts.dtype ?? "auto"}`;
}

export async function loadPipeline(
	task: PipelineTask,
	model: string,
	opts: LoadOptions = {},
): Promise<LoadedPipeline> {
	const key = cacheKey(task, model, opts);
	const existing = cache.get(key);
	if (existing) return existing;

	const promise = (async (): Promise<LoadedPipeline> => {
		const t = await importTransformers();
		const pipe = await t.pipeline(task as any, model, {
			device: opts.device as any,
			dtype: opts.dtype as any,
			progress_callback: opts.onProgress,
		});
		return { pipeline: pipe as AnyPipeline };
	})();

	cache.set(key, promise);
	try {
		return await promise;
	} catch (err) {
		cache.delete(key);
		throw err;
	}
}

export async function getTextStreamer(
	tokenizer: any,
	onText: (chunk: string) => void,
): Promise<any> {
	const t = await importTransformers();
	return new t.TextStreamer(tokenizer, {
		skip_prompt: true,
		skip_special_tokens: true,
		callback_function: onText,
	});
}
