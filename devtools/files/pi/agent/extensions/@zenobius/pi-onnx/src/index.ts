// SPDX-License-Identifier: MIT
// Copyright (C) Jarkko Sakkinen 2026

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { configPath, hubPath, loadConfig, stripPrefix, type Config, type ModelEntry } from "./config.js";
import { discoverOnnxCommunityModels, fetchHubModel, inspectHubModel, type DiscoveredModel, type IncompatibleModel } from "./discovery.js";
import { createOnnxStreamFunction, ONNX_API, ONNX_PROVIDER } from "./provider.js";
import { registerAllTools } from "./tools.js";
import { configureRuntime, loadPipeline } from "./runtime.js";

function buildProviderConfig(
	models: ModelEntry[],
	streamSimple: ReturnType<typeof createOnnxStreamFunction>,
) {
	return {
		baseUrl: "local://onnx",
		apiKey: "onnx",
		api: ONNX_API,
		models: models.map((m) => {
			const short = stripPrefix(m.id);
			return {
				id: short,
				name: m.name ?? short,
				reasoning: false,
				input: ["text" as const],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: m.contextWindow ?? 4096,
				maxTokens: m.maxTokens ?? 1024,
			};
		}),
		streamSimple,
	};
}

export function mergeModels(pinned: ModelEntry[], discovered: DiscoveredModel[]): ModelEntry[] {
	const discoveredById = new Map(discovered.map((model) => [hubPath(model.id), model]));
	const seen = new Set<string>();
	const out: ModelEntry[] = pinned.map((model) => {
		const fullId = hubPath(model.id);
		seen.add(fullId);
		const discoveredModel = discoveredById.get(fullId);
		if (!discoveredModel) return model;
		return {
			...model,
			name: model.name ?? discoveredModel.name,
			dtype: model.dtype ?? discoveredModel.dtype,
		};
	});

	for (const d of discovered) {
		const fullId = hubPath(d.id);
		if (seen.has(fullId)) continue;
		seen.add(fullId);
		out.push({ id: d.id, name: d.name, dtype: d.dtype });
	}
	return out;
}

export interface PinnedModelValidation {
	discovered: DiscoveredModel[];
	skipped: IncompatibleModel[];
}

export async function validatePinnedModels(
	models: ModelEntry[],
	signal: AbortSignal = AbortSignal.timeout(10_000),
): Promise<PinnedModelValidation> {
	const results = await Promise.all(
		models.map(async (model): Promise<DiscoveredModel | IncompatibleModel | null> => {
			try {
				const hubModel = await fetchHubModel(hubPath(model.id), signal);
				const inspection = inspectHubModel(hubModel);
				return inspection.model;
			} catch {
				return null;
			}
		}),
	);

	const discovered: DiscoveredModel[] = [];
	const skipped: IncompatibleModel[] = [];
	for (const result of results) {
		if (!result) continue;
		if ("reason" in result) skipped.push(result);
		else discovered.push(result);
	}
	return { discovered, skipped };
}

const WIDGET_KEY = "onnx-preload";

async function preloadModel(config: Config, entry: ModelEntry, ctx: ExtensionContext): Promise<void> {
	const fullId = hubPath(entry.id);
	const dtype = entry.dtype ?? config.defaultDtype;
	const label = entry.name ?? stripPrefix(entry.id);

	const show = (line: string) => {
		ctx.ui.setWidget(WIDGET_KEY, [line]);
		ctx.ui.setStatus("onnx", line);
	};
	const clear = () => {
		ctx.ui.setWidget(WIDGET_KEY, undefined);
		ctx.ui.setStatus("onnx", undefined);
	};

	const seenPct = new Map<string, number>();
	let sessionHintTimer: ReturnType<typeof setTimeout> | null = null;
	let readySeen = false;
	const clearSessionHint = () => {
		if (!sessionHintTimer) return;
		clearTimeout(sessionHintTimer);
		sessionHintTimer = null;
	};
	const armSessionHint = () => {
		clearSessionHint();
		sessionHintTimer = setTimeout(() => {
			show(`ONNX │ ${label} │ constructing session\u2026`);
		}, 5000);
	};

	try {
		await configureRuntime(config);

		armSessionHint();

		await loadPipeline("text-generation", fullId, {
			device: config.device,
			dtype,
			onProgress: (info: unknown) => {
				const p = info as {
					status?: string;
					file?: string;
					name?: string;
					progress?: number;
					loaded?: number;
					total?: number;
				};
				if (!p?.status) return;

				if (p.status === "initiate") {
					armSessionHint();
				} else if (p.status === "progress_total") {
					const pct = Math.round(p.progress ?? 0);
					const totalMB = ((p.total ?? 0) / 1e6).toFixed(1);
					if (pct > 0 && pct < 100) {
						armSessionHint();
						show(`ONNX │ ${label} │ ${pct}% of ${totalMB} MB`);
					}
				} else if (p.status === "progress" && p.file) {
					// Fallback: per-file progress when progress_total is not available.
					const pct = Math.round(p.progress ?? 0);
					const fileShort = p.file.split("/").pop() ?? p.file;
					const last = seenPct.get(fileShort) ?? -1;
					if (pct - last < 10 && pct !== 100) return;
					seenPct.set(fileShort, pct);
					show(`ONNX │ ${label} │ ${fileShort}: ${pct}%`);
				} else if (p.status === "done" && p.file) {
					const fileShort = p.file.split("/").pop() ?? p.file;
					show(`ONNX │ ${label} │ ${fileShort} \u2713`);
					armSessionHint();
				} else if (p.status === "ready") {
					readySeen = true;
					clearSessionHint();
					ctx.ui.setStatus("onnx", `ONNX \u2713 ${label} ready`);
					ctx.ui.setWidget(WIDGET_KEY, undefined);
					setTimeout(clear, 4000);
				}
			},
		});

		clearSessionHint();

		if (!readySeen) {
			// Pipeline was served from memory cache — no progress events fired.
			clear();
		}
	} catch (err) {
		clearSessionHint();
		const message = err instanceof Error ? err.message : String(err);
		show(`ONNX │ ${label} │ preload failed: ${message}`);
		setTimeout(clear, 8000);
}
}

export default async function (pi: ExtensionAPI) {
	const config = loadConfig();
	let discovered: DiscoveredModel[] = [];
	let discoveryError: string | null = null;

	if (config.discovery.enabled) {
		try {
			discovered = await discoverOnnxCommunityModels({
				limit: config.discovery.limit,
				pipelineTags: config.discovery.pipelineTags,
			});
		} catch (err) {
			discoveryError = err instanceof Error ? err.message : String(err);
		}
	}

	const pinnedValidation = await validatePinnedModels(config.models);
	const skippedPinnedIds = new Set(pinnedValidation.skipped.map((model) => hubPath(model.id)));
	const pinnedModels = config.models.filter((model) => !skippedPinnedIds.has(hubPath(model.id)));
	const effectiveConfig: Config = {
		...config,
		models: mergeModels(pinnedModels, [...discovered, ...pinnedValidation.discovered]),
	};
	const streamSimple = createOnnxStreamFunction(effectiveConfig);
	pi.registerProvider(ONNX_PROVIDER, buildProviderConfig(effectiveConfig.models, streamSimple));

	registerAllTools(pi, config);

	pi.on("session_start", async (_event, ctx) => {
		if (!config.preloadDefaultModel) return;
		const defaultModel = effectiveConfig.models[0];
		if (!defaultModel) return;
		await preloadModel(effectiveConfig, defaultModel, ctx);
	});

	// Start downloading/loading as soon as the user picks an ONNX model.
	pi.on("model_select", async (event, ctx) => {
		if (event.model.provider !== ONNX_PROVIDER) return;
		const fullId = hubPath(event.model.id);
		const entry = effectiveConfig.models.find((m) => m.id === fullId) ?? ({ id: fullId } as ModelEntry);
		await preloadModel(effectiveConfig, entry, ctx);
	});

	pi.registerCommand("onnx", {
		description: "Show pi-onnx configuration",
		handler: async (_args, ctx) => {
			const lines: string[] = [];
			lines.push(`config: ${configPath()}`);
			lines.push(`cacheDir: ${config.cacheDir ?? "(HF default)"}`);
			lines.push(`device: ${config.device}   defaultDtype: ${config.defaultDtype}`);
			lines.push(`preloadDefaultModel: ${config.preloadDefaultModel}`);
			const discStatus = !config.discovery.enabled
				? "disabled"
				: discoveryError
					? `failed (${discoveryError})`
					: `enabled (limit=${config.discovery.limit}, pipelineTags=[${config.discovery.pipelineTags.join(", ")}])`;
			lines.push(`discovery: ${discStatus}`);
			lines.push(`pinned models:`);
			for (const m of config.models) {
				lines.push(`  - ${m.id}${m.name ? ` (${m.name})` : ""}  dtype=${m.dtype ?? config.defaultDtype}`);
			}
			if (pinnedValidation.skipped.length > 0) {
				lines.push(`skipped pinned models:`);
				for (const m of pinnedValidation.skipped) {
					lines.push(`  - ${m.id}: ${m.reason}`);
				}
			}
			lines.push(`discovered models: ${discovered.length}`);
			for (const m of discovered.slice(0, 20)) {
				lines.push(`  - ${m.id}  dtype=${m.dtype ?? config.defaultDtype}`);
			}
			if (discovered.length > 20) {
				lines.push(`  ... and ${discovered.length - 20} more`);
			}
			lines.push("tools:");
			lines.push(`  embed:      ${config.tools.embed.enabled ? config.tools.embed.model : "disabled"}`);
			lines.push(`  classify:   ${config.tools.classify.enabled ? config.tools.classify.model : "disabled"}`);
			lines.push(`  transcribe: ${config.tools.transcribe.enabled ? config.tools.transcribe.model : "disabled"}`);
			ctx.ui.notify(lines.join("\n"));
		},
	});
}
