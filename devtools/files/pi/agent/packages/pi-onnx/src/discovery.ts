// SPDX-License-Identifier: MIT
// Copyright (C) Jarkko Sakkinen 2026

import { HF_PREFIX, type Dtype, type PipelineTag } from "./config.js";

export interface DiscoveredModel {
	id: string;
	name: string;
	dtype?: Dtype;
}

export interface DiscoveryOptions {
	limit: number;
	pipelineTags: PipelineTag[];
	signal?: AbortSignal;
}

export interface IncompatibleModel {
	id: string;
	reason: string;
}

export type HubModelInspection =
	| { compatible: true; model: DiscoveredModel }
	| { compatible: false; model: IncompatibleModel };

export interface HubSibling {
	rfilename?: string;
}

export interface HubModel {
	id?: string;
	modelId?: string;
	library_name?: string;
	pipeline_tag?: string;
	tags?: string[];
	siblings?: HubSibling[];
}

const TRANSFORMERS_JS = "transformers.js";
const SUPPORTED_PIPELINE_TAG: PipelineTag = "text-generation";

const DTYPE_SUFFIXES: Record<Dtype, string> = {
	fp32: "",
	fp16: "_fp16",
	q8: "_quantized",
	int8: "_int8",
	uint8: "_uint8",
	q4: "_q4",
	bnb4: "_bnb4",
	q4f16: "_q4f16",
};

const DISCOVERY_DTYPE_PREFERENCE: readonly Dtype[] = [
	"q4",
	"q4f16",
	"bnb4",
	"q8",
	"int8",
	"uint8",
	"fp16",
	"fp32",
];

function modelId(model: HubModel): string | undefined {
	return model.id ?? model.modelId;
}

function usesTransformersJs(model: HubModel): boolean {
	const tags = model.tags ?? [];
	return model.library_name === TRANSFORMERS_JS || tags.includes(TRANSFORMERS_JS);
}

function isTextGenerationModel(model: HubModel): boolean {
	const tags = model.tags ?? [];
	return model.pipeline_tag ? model.pipeline_tag === SUPPORTED_PIPELINE_TAG : tags.includes(SUPPORTED_PIPELINE_TAG);
}

function siblingFileSet(model: HubModel): Set<string> {
	return new Set(
		(model.siblings ?? [])
			.map((sibling) => sibling.rfilename)
			.filter((filename): filename is string => typeof filename === "string"),
	);
}

function hasModelFile(files: Set<string>, dtype: Dtype): boolean {
	return files.has(`onnx/model${DTYPE_SUFFIXES[dtype]}.onnx`);
}

function preferredDtype(model: HubModel): Dtype | undefined {
	const files = siblingFileSet(model);
	return DISCOVERY_DTYPE_PREFERENCE.find((dtype) => hasModelFile(files, dtype));
}

export function inspectHubModel(model: HubModel): HubModelInspection {
	const id = modelId(model);
	if (!id) return { compatible: false, model: { id: "(unknown)", reason: "missing model id" } };
	if (!id.startsWith(HF_PREFIX)) {
		return { compatible: false, model: { id, reason: `not an ${HF_PREFIX} repository` } };
	}
	if (!usesTransformersJs(model)) {
		const library = model.library_name ?? "unknown";
		return { compatible: false, model: { id, reason: `library ${library} is not ${TRANSFORMERS_JS}` } };
	}
	if (!isTextGenerationModel(model)) {
		const pipeline = model.pipeline_tag ?? "unknown";
		return { compatible: false, model: { id, reason: `pipeline ${pipeline} is not ${SUPPORTED_PIPELINE_TAG}` } };
	}

	const dtype = preferredDtype(model);
	if (!dtype) {
		return { compatible: false, model: { id, reason: "no supported onnx/model*.onnx file" } };
	}

	return { compatible: true, model: { id, name: id.slice(HF_PREFIX.length), dtype } };
}

function toDiscoveredModel(model: HubModel): DiscoveredModel | undefined {
	const inspection = inspectHubModel(model);
	return inspection.compatible ? inspection.model : undefined;
}

async function fetchByPipelineTag(
	tag: PipelineTag,
	limit: number,
	signal: AbortSignal,
): Promise<HubModel[]> {
	const url = new URL("https://huggingface.co/api/models");
	url.searchParams.set("author", "onnx-community");
	url.searchParams.set("pipeline_tag", tag);
	url.searchParams.set("sort", "downloads");
	url.searchParams.set("direction", "-1");
	url.searchParams.set("limit", String(limit));
	url.searchParams.set("full", "true");

	const res = await fetch(url, {
		signal,
		headers: { "User-Agent": "pi-onnx" },
	});
	if (!res.ok) throw new Error(`HF Hub ${res.status} ${res.statusText}`);
	return (await res.json()) as HubModel[];
}

function modelApiUrl(id: string): URL {
	const url = new URL("https://huggingface.co/api/models/");
	url.pathname = `/api/models/${id.split("/").map(encodeURIComponent).join("/")}`;
	url.searchParams.set("blobs", "false");
	return url;
}

export async function fetchHubModel(id: string, signal: AbortSignal): Promise<HubModel> {
	const res = await fetch(modelApiUrl(id), {
		signal,
		headers: { "User-Agent": "pi-onnx" },
	});
	if (!res.ok) throw new Error(`HF Hub ${res.status} ${res.statusText}`);
	return (await res.json()) as HubModel;
}

export async function discoverOnnxCommunityModels(opts: DiscoveryOptions): Promise<DiscoveredModel[]> {
	const signal = opts.signal ?? AbortSignal.timeout(10_000);
	const results = await Promise.all(
		opts.pipelineTags.map((tag) => fetchByPipelineTag(tag, opts.limit, signal)),
	);

	const seen = new Set<string>();
	const out: DiscoveredModel[] = [];
	for (const list of results) {
		for (const model of list) {
			const discovered = toDiscoveredModel(model);
			if (!discovered || seen.has(discovered.id)) continue;
			seen.add(discovered.id);
			out.push(discovered);
		}
	}
	return out;
}
