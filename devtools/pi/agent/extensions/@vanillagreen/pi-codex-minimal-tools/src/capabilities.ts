import type { CodexMinimalToolsSettings } from "./settings.js";

export const PACKAGE_TOOL_NAMES = ["image_generation", "view_image", "apply_patch"] as const;
export type PackageToolName = (typeof PACKAGE_TOOL_NAMES)[number];

export interface ModelLike {
	provider?: string;
	id?: string;
	name?: string;
	input?: string[];
	capabilities?: {
		input?: string[];
		inputModalities?: string[];
	};
}

export interface ToolCapability {
	enabled: boolean;
	reason: string;
}

export type ToolCapabilityMap = Record<PackageToolName, ToolCapability>;

export function modelKey(model: ModelLike | undefined): string {
	if (!model) return "no model";
	return `${model.provider ?? "unknown"}/${model.id ?? model.name ?? "unknown"}`;
}

export function isOpenAiCodexModel(model: ModelLike | undefined): boolean {
	return model?.provider === "openai-codex";
}

export function isOpenAiLikeModel(model: ModelLike | undefined): boolean {
	const provider = (model?.provider ?? "").toLowerCase();
	const id = (model?.id ?? model?.name ?? "").toLowerCase();
	const openAiProvider = provider === "openai" || provider === "openai-codex" || provider === "opencode" || provider.startsWith("openai-") || provider.endsWith("-openai") || provider.endsWith("-codex");
	return openAiProvider || /^gpt[-_\d]/.test(id) || /^o\d/.test(id) || id.includes("codex");
}

export function supportsImageInput(model: ModelLike | undefined): boolean {
	const inputs = [
		...(model?.input ?? []),
		...(model?.capabilities?.input ?? []),
		...(model?.capabilities?.inputModalities ?? []),
	].map((value) => value.toLowerCase());
	return inputs.includes("image") || inputs.includes("images") || inputs.includes("vision");
}

export function computeToolCapabilities(model: ModelLike | undefined, settings: CodexMinimalToolsSettings): ToolCapabilityMap {
	if (!settings.enabled) {
		return {
			image_generation: { enabled: false, reason: "package disabled" },
			view_image: { enabled: false, reason: "package disabled" },
			apply_patch: { enabled: false, reason: "package disabled" },
		};
	}

	const imageInput = supportsImageInput(model);
	const openAiLike = isOpenAiLikeModel(model);
	const codex = isOpenAiCodexModel(model);
	if (!openAiLike) {
		return {
			image_generation: { enabled: false, reason: "model is not OpenAI/Codex-like" },
			view_image: { enabled: false, reason: "model is not OpenAI/Codex-like" },
			apply_patch: { enabled: false, reason: "model is not OpenAI/Codex-like" },
		};
	}

	return {
		image_generation: settings.imageGeneration && settings.nativeProviderTools && codex && imageInput
			? { enabled: true, reason: "OpenAI Codex image-capable model with native tools enabled" }
			: settings.imageGeneration && settings.directImageApiFallback
				? { enabled: true, reason: "direct Images API fallback enabled" }
				: { enabled: false, reason: !settings.imageGeneration ? "image_generation disabled by setting" : !settings.nativeProviderTools ? "native provider tools disabled" : !codex ? "requires openai-codex provider" : "model does not advertise image input" },
		view_image: settings.viewImage && imageInput
			? { enabled: true, reason: "model accepts image input" }
			: { enabled: false, reason: !settings.viewImage ? "view_image disabled by setting" : "model does not advertise image input" },
		apply_patch: settings.applyPatchEnabled && openAiLike
			? { enabled: true, reason: "OpenAI/Codex-like model" }
			: { enabled: false, reason: !settings.applyPatchEnabled ? "apply_patch disabled by setting" : "model is not OpenAI/Codex-like" },
	};
}

export function desiredPackageTools(model: ModelLike | undefined, settings: CodexMinimalToolsSettings): PackageToolName[] {
	const capabilities = computeToolCapabilities(model, settings);
	return PACKAGE_TOOL_NAMES.filter((name) => capabilities[name].enabled);
}

export interface ActiveToolSyncResult {
	activeTools: string[];
	added: string[];
	removed: string[];
	preserved: string[];
}

export function computeNextActiveTools(currentActive: readonly string[], model: ModelLike | undefined, settings: CodexMinimalToolsSettings): ActiveToolSyncResult {
	const current = new Set(currentActive);
	const desired = new Set(desiredPackageTools(model, settings));
	const added: string[] = [];
	const removed: string[] = [];

	for (const tool of PACKAGE_TOOL_NAMES) {
		if (!desired.has(tool) && current.delete(tool)) removed.push(tool);
	}

	if (settings.enabled && settings.autoEnable) {
		for (const tool of desired) {
			if (!current.has(tool)) {
				current.add(tool);
				added.push(tool);
			}
		}
	}

	if (settings.strictPatchMode && desired.has("apply_patch")) {
		for (const nativeMutationTool of ["edit", "write"]) {
			if (current.delete(nativeMutationTool)) removed.push(nativeMutationTool);
		}
	}

	const activeTools = currentActive.filter((name) => current.has(name));
	for (const name of current) if (!activeTools.includes(name)) activeTools.push(name);
	return {
		activeTools,
		added,
		removed,
		preserved: currentActive.filter((name) => !PACKAGE_TOOL_NAMES.includes(name as PackageToolName) && activeTools.includes(name)),
	};
}
