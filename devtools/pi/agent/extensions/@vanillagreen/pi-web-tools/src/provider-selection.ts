import type { ResolvedWebProvider, WebProvider, WebToolsSettings } from "./settings.js";

export interface ModelLike {
	provider?: string;
	id?: string;
	name?: string;
}

export interface ProviderAvailability {
	exaDirect: boolean;
	exaMcp: boolean;
	duckduckgo: boolean;
	openAiNative: boolean;
	perplexity: boolean;
	geminiApi: boolean;
	geminiWeb: boolean;
}

export interface ProviderResolution {
	provider?: ResolvedWebProvider;
	reason: string;
}

export function isOpenAiNativeModel(model: ModelLike | undefined): boolean {
	const provider = (model?.provider ?? "").toLowerCase();
	return provider === "openai-codex" || provider === "openai" || provider.startsWith("openai-");
}

export function providerAvailability(settings: WebToolsSettings, model?: ModelLike): ProviderAvailability {
	return {
		exaDirect: Boolean(settings.apiKeys.exa),
		exaMcp: true,
		duckduckgo: true,
		openAiNative: settings.nativeOpenAiWebSearch && isOpenAiNativeModel(model),
		perplexity: Boolean(settings.apiKeys.perplexity),
		geminiApi: Boolean(settings.apiKeys.gemini),
		geminiWeb: settings.browserCookieAccess,
	};
}

export function providerIsAvailable(provider: ResolvedWebProvider, settings: WebToolsSettings, model?: ModelLike): boolean {
	const enabled = new Set(settings.enabledProviders);
	if (!enabled.has(provider)) return false;
	const availability = providerAvailability(settings, model);
	if (provider === "exa") return availability.exaDirect;
	if (provider === "exa-mcp") return availability.exaMcp;
	if (provider === "duckduckgo") return availability.duckduckgo;
	if (provider === "openai-native") return availability.openAiNative;
	if (provider === "perplexity") return availability.perplexity;
	if (provider === "gemini") return availability.geminiApi || availability.geminiWeb;
	return false;
}

export function resolveWebProviderCandidates(requested: WebProvider | undefined, settings: WebToolsSettings, model?: ModelLike): ResolvedWebProvider[] {
	const desired = requested ?? settings.defaultProvider;
	if (desired !== "auto") return providerIsAvailable(desired, settings, model) ? [desired] : [];
	const enabled = new Set(settings.enabledProviders);
	const availability = providerAvailability(settings, model);
	const candidates: ResolvedWebProvider[] = [];
	if (enabled.has("exa") && availability.exaDirect) candidates.push("exa");
	if (enabled.has("perplexity") && availability.perplexity) candidates.push("perplexity");
	if (enabled.has("gemini") && availability.geminiApi) candidates.push("gemini");
	if (enabled.has("exa-mcp") && availability.exaMcp) candidates.push("exa-mcp");
	if (enabled.has("duckduckgo") && availability.duckduckgo) candidates.push("duckduckgo");
	if (enabled.has("gemini") && !availability.geminiApi && availability.geminiWeb) candidates.push("gemini");
	if (enabled.has("openai-native") && availability.openAiNative) candidates.push("openai-native");
	return candidates;
}

export function resolveWebProvider(requested: WebProvider | undefined, settings: WebToolsSettings, model?: ModelLike): ProviderResolution {
	const candidates = resolveWebProviderCandidates(requested, settings, model);
	if (candidates[0]) return { provider: candidates[0], reason: `${requested ?? settings.defaultProvider} selected ${candidates[0]}` };
	return { reason: `${requested ?? settings.defaultProvider} unavailable or disabled` };
}

export function exaDeepResearchAvailable(settings: WebToolsSettings): boolean {
	return settings.enabled && settings.exaDeepResearchEnabled && settings.enabledProviders.includes("exa") && Boolean(settings.apiKeys.exa);
}
