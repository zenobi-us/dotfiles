// SPDX-License-Identifier: MIT
// Copyright (C) Jarkko Sakkinen 2026

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Dtype = "fp32" | "fp16" | "q8" | "int8" | "uint8" | "q4" | "bnb4" | "q4f16";
export type Device = "cpu" | "webgpu" | "wasm" | "gpu";

export interface ModelEntry {
	id: string;
	name?: string;
	contextWindow?: number;
	maxTokens?: number;
	dtype?: Dtype;
}

export interface EmbedToolConfig {
	enabled: boolean;
	model: string;
	pooling: "mean" | "cls" | "none";
	normalize: boolean;
}

export interface ClassifyToolConfig {
	enabled: boolean;
	model: string;
	topK: number;
}

export interface TranscribeToolConfig {
	enabled: boolean;
	model: string;
	language: string | null;
	task: "transcribe" | "translate";
	maxDecodedBytes: number;
}

export const HF_PREFIX = "onnx-community/";

export type PipelineTag = "text-generation" | "image-text-to-text" | "any-to-any";

export interface DiscoveryConfig {
	enabled: boolean;
	limit: number;
	pipelineTags: PipelineTag[];
}

export function stripPrefix(id: string): string {
	return id.startsWith(HF_PREFIX) ? id.slice(HF_PREFIX.length) : id;
}

export function hubPath(id: string): string {
	return id.startsWith(HF_PREFIX) ? id : HF_PREFIX + id;
}

export interface Config {
	cacheDir: string | null;
	device: Device;
	defaultDtype: Dtype;
	preloadDefaultModel: boolean;
	/** Models always shown. `[]` + discovery.enabled = discovery only. */
	models: ModelEntry[];
	discovery: DiscoveryConfig;
	tools: {
		embed: EmbedToolConfig;
		classify: ClassifyToolConfig;
		transcribe: TranscribeToolConfig;
	};
}

const DTYPES: readonly Dtype[] = ["fp32", "fp16", "q8", "int8", "uint8", "q4", "bnb4", "q4f16"];
const DEVICES: readonly Device[] = ["cpu", "webgpu", "wasm", "gpu"];
const PIPELINE_TAGS: readonly PipelineTag[] = ["text-generation", "image-text-to-text", "any-to-any"];
const DEFAULT_DISCOVERY_PIPELINE_TAGS: readonly PipelineTag[] = ["text-generation"];
const POOLING_VALUES: readonly EmbedToolConfig["pooling"][] = ["mean", "cls"];
const TRANSCRIBE_TASKS: readonly TranscribeToolConfig["task"][] = ["transcribe", "translate"];
const DEFAULT_MAX_DECODED_BYTES = 256 * 1024 * 1024;

const DEFAULTS: Config = {
	cacheDir: null,
	device: "cpu",
	defaultDtype: "q4",
	preloadDefaultModel: false,
	models: [
		{
			id: "onnx-community/Qwen2.5-Coder-0.5B-Instruct",
			name: "Qwen2.5-Coder-0.5B (ONNX, q4)",
			contextWindow: 32768,
			maxTokens: 2048,
		},
	],
	discovery: {
		enabled: true,
		limit: 50,
		pipelineTags: [...DEFAULT_DISCOVERY_PIPELINE_TAGS],
	},
	tools: {
		embed: {
			enabled: true,
			model: "onnx-community/all-MiniLM-L6-v2",
			pooling: "mean",
			normalize: true,
		},
		classify: {
			enabled: false,
			model: "onnx-community/distilbert-base-uncased-finetuned-sst-2-english",
			topK: 5,
		},
		transcribe: {
			enabled: false,
			model: "onnx-community/whisper-tiny",
			language: null,
			task: "transcribe",
			maxDecodedBytes: DEFAULT_MAX_DECODED_BYTES,
		},
	},
};

function cloneConfig(config: Config): Config {
	return {
		cacheDir: config.cacheDir,
		device: config.device,
		defaultDtype: config.defaultDtype,
		preloadDefaultModel: config.preloadDefaultModel,
		models: config.models.map((model) => ({ ...model })),
		discovery: {
			...config.discovery,
			pipelineTags: [...config.discovery.pipelineTags],
		},
		tools: {
			embed: { ...config.tools.embed },
			classify: { ...config.tools.classify },
			transcribe: { ...config.tools.transcribe },
		},
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(src: Record<string, unknown>, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(src, key);
}

function describeValue(value: unknown): string {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value;
}

function invalidConfig(path: string, expected: string, value: unknown): never {
	throw new Error(`pi-onnx: invalid config ${path}: expected ${expected}, got ${describeValue(value)}`);
}

function readObject(src: Record<string, unknown>, key: string, path: string): Record<string, unknown> {
	if (!hasOwn(src, key)) return {};
	const value = src[key];
	if (isRecord(value)) return value;
	return invalidConfig(path, "object", value);
}

function readString(src: Record<string, unknown>, key: string, path: string, fallback: string): string {
	if (!hasOwn(src, key)) return fallback;
	const value = src[key];
	if (typeof value === "string") return value;
	return invalidConfig(path, "string", value);
}

function readRequiredString(src: Record<string, unknown>, key: string, path: string): string {
	const value = src[key];
	if (typeof value === "string" && value.trim().length > 0) return value;
	return invalidConfig(path, "non-empty string", value);
}

function readOptionalString(src: Record<string, unknown>, key: string, path: string): string | undefined {
	if (!hasOwn(src, key)) return undefined;
	const value = src[key];
	if (typeof value === "string") return value;
	return invalidConfig(path, "string", value);
}

function readStringOrNull(src: Record<string, unknown>, key: string, path: string, fallback: string | null): string | null {
	if (!hasOwn(src, key)) return fallback;
	const value = src[key];
	if (value === null || typeof value === "string") return value;
	return invalidConfig(path, "string or null", value);
}

function readBoolean(src: Record<string, unknown>, key: string, path: string, fallback: boolean): boolean {
	if (!hasOwn(src, key)) return fallback;
	const value = src[key];
	if (typeof value === "boolean") return value;
	return invalidConfig(path, "boolean", value);
}

function readPositiveInteger(src: Record<string, unknown>, key: string, path: string, fallback: number): number {
	if (!hasOwn(src, key)) return fallback;
	const value = src[key];
	if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
	return invalidConfig(path, "positive integer", value);
}

function readOptionalPositiveInteger(src: Record<string, unknown>, key: string, path: string): number | undefined {
	if (!hasOwn(src, key)) return undefined;
	const value = src[key];
	if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
	return invalidConfig(path, "positive integer", value);
}

function readEnum<T extends string>(
	src: Record<string, unknown>,
	key: string,
	path: string,
	allowed: readonly T[],
	fallback: T,
): T {
	if (!hasOwn(src, key)) return fallback;
	const value = src[key];
	if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T;
	return invalidConfig(path, allowed.join(" | "), value);
}

function readOptionalEnum<T extends string>(
	src: Record<string, unknown>,
	key: string,
	path: string,
	allowed: readonly T[],
): T | undefined {
	if (!hasOwn(src, key)) return undefined;
	const value = src[key];
	if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T;
	return invalidConfig(path, allowed.join(" | "), value);
}

function readPipelineTags(src: Record<string, unknown>): PipelineTag[] {
	if (!hasOwn(src, "pipelineTags")) return [...DEFAULTS.discovery.pipelineTags];
	const value = src.pipelineTags;
	if (!Array.isArray(value)) return invalidConfig("discovery.pipelineTags", "array", value);
	return value.map((tag, index) => {
		if (typeof tag === "string" && (PIPELINE_TAGS as readonly string[]).includes(tag)) return tag as PipelineTag;
		return invalidConfig(`discovery.pipelineTags[${index}]`, PIPELINE_TAGS.join(" | "), tag);
	});
}

function readModels(src: Record<string, unknown>): ModelEntry[] {
	if (!hasOwn(src, "models")) return DEFAULTS.models.map((model) => ({ ...model }));
	const value = src.models;
	if (!Array.isArray(value)) return invalidConfig("models", "array", value);
	return value.map((entry, index) => readModelEntry(entry, index));
}

function readModelEntry(input: unknown, index: number): ModelEntry {
	if (!isRecord(input)) return invalidConfig(`models[${index}]`, "object", input);
	const model: ModelEntry = { id: hubPath(readRequiredString(input, "id", `models[${index}].id`)) };
	const name = readOptionalString(input, "name", `models[${index}].name`);
	const contextWindow = readOptionalPositiveInteger(input, "contextWindow", `models[${index}].contextWindow`);
	const maxTokens = readOptionalPositiveInteger(input, "maxTokens", `models[${index}].maxTokens`);
	const dtype = readOptionalEnum(input, "dtype", `models[${index}].dtype`, DTYPES);
	if (name !== undefined) model.name = name;
	if (contextWindow !== undefined) model.contextWindow = contextWindow;
	if (maxTokens !== undefined) model.maxTokens = maxTokens;
	if (dtype !== undefined) model.dtype = dtype;
	return model;
}

function readDiscovery(src: Record<string, unknown>): DiscoveryConfig {
	const discovery = readObject(src, "discovery", "discovery");
	return {
		enabled: readBoolean(discovery, "enabled", "discovery.enabled", DEFAULTS.discovery.enabled),
		limit: readPositiveInteger(discovery, "limit", "discovery.limit", DEFAULTS.discovery.limit),
		pipelineTags: readPipelineTags(discovery),
	};
}

function readTools(src: Record<string, unknown>): Config["tools"] {
	const tools = readObject(src, "tools", "tools");
	const embed = readObject(tools, "embed", "tools.embed");
	const classify = readObject(tools, "classify", "tools.classify");
	const transcribe = readObject(tools, "transcribe", "tools.transcribe");
	return {
		embed: {
			enabled: readBoolean(embed, "enabled", "tools.embed.enabled", DEFAULTS.tools.embed.enabled),
			model: readString(embed, "model", "tools.embed.model", DEFAULTS.tools.embed.model),
			pooling: readEnum(embed, "pooling", "tools.embed.pooling", POOLING_VALUES, DEFAULTS.tools.embed.pooling),
			normalize: readBoolean(embed, "normalize", "tools.embed.normalize", DEFAULTS.tools.embed.normalize),
		},
		classify: {
			enabled: readBoolean(classify, "enabled", "tools.classify.enabled", DEFAULTS.tools.classify.enabled),
			model: readString(classify, "model", "tools.classify.model", DEFAULTS.tools.classify.model),
			topK: readPositiveInteger(classify, "topK", "tools.classify.topK", DEFAULTS.tools.classify.topK),
		},
		transcribe: {
			enabled: readBoolean(transcribe, "enabled", "tools.transcribe.enabled", DEFAULTS.tools.transcribe.enabled),
			model: readString(transcribe, "model", "tools.transcribe.model", DEFAULTS.tools.transcribe.model),
			language: readStringOrNull(
				transcribe,
				"language",
				"tools.transcribe.language",
				DEFAULTS.tools.transcribe.language,
			),
			task: readEnum(transcribe, "task", "tools.transcribe.task", TRANSCRIBE_TASKS, DEFAULTS.tools.transcribe.task),
			maxDecodedBytes: readPositiveInteger(
				transcribe,
				"maxDecodedBytes",
				"tools.transcribe.maxDecodedBytes",
				DEFAULTS.tools.transcribe.maxDecodedBytes,
			),
		},
	};
}

export function configPath(): string {
	return join(homedir(), ".pi", "agent", "pi-onnx.json");
}

export function loadConfig(): Config {
	const path = configPath();
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch {
		return cloneConfig(DEFAULTS);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new Error(`pi-onnx: failed to parse ${path}: ${msg}`);
	}

	return mergeConfig(parsed);
}

export function mergeConfig(input: unknown): Config {
	if (!isRecord(input)) return cloneConfig(DEFAULTS);
	return {
		cacheDir: readStringOrNull(input, "cacheDir", "cacheDir", DEFAULTS.cacheDir),
		device: readEnum(input, "device", "device", DEVICES, DEFAULTS.device),
		defaultDtype: readEnum(input, "defaultDtype", "defaultDtype", DTYPES, DEFAULTS.defaultDtype),
		preloadDefaultModel: readBoolean(input, "preloadDefaultModel", "preloadDefaultModel", DEFAULTS.preloadDefaultModel),
		models: readModels(input),
		discovery: readDiscovery(input),
		tools: readTools(input),
	};
}
