export const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";
export const ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4";
export const DEFAULT_TEMPERATURE = 0.9;
export const DEFAULT_TOP_P = 0.95;
export const DEFAULT_CLEAR_THINKING = false;

const API_KEY_ENV_PLACEHOLDER = "CEREBRAS_API_KEY or ZAI_API_KEY";

type ZaiModelProvider = "cerebras" | "zai";

export interface ZaiRuntimeSettings {
	temperature: number;
	topP: number;
	clearThinking: boolean;
}

export interface ZaiSimpleOptions {
	temperature?: number;
	top_p?: number;
	topP?: number;
	clear_thinking?: boolean;
	clearThinking?: boolean;
	apiKey?: string;
	onPayload?: (payload: unknown) => void;
	[key: string]: unknown;
}

export type ZaiStreamSimple = (
	model: unknown,
	context: unknown,
	options?: ZaiSimpleOptions,
) => unknown;

export interface ZaiProviderConfigInput {
	streamSimple: ZaiStreamSimple;
}

export interface ZaiProviderModelConfig {
	id: string;
	name: string;
	reasoning: boolean;
	input: ["text"];
	cost: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite: number;
	};
	contextWindow: number;
	maxTokens: number;
	compat: {
		supportsDeveloperRole: false;
		thinkingFormat: "zai";
	};
	baseUrl: string;
	apiKey: string;
}

interface ZaiModelTemplate
	extends Omit<ZaiProviderModelConfig, "baseUrl" | "apiKey"> {
	provider: ZaiModelProvider;
}

export interface ZaiProviderConfig {
	baseUrl: string;
	apiKey: string;
	api: "openai-completions";
	streamSimple: ZaiStreamSimple;
	models: ZaiProviderModelConfig[];
}

const GLM_4_7_CEREBRAS_MODEL: ZaiModelTemplate = {
	provider: "cerebras",
	id: "zai-glm-4.7",
	name: "GLM-4.7 Cerebras",
	reasoning: false,
	input: ["text"],
	cost: {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
	},
	contextWindow: 131072,
	maxTokens: 40000,
	compat: {
		supportsDeveloperRole: false,
		thinkingFormat: "zai",
	},
};

const GLM_4_7_ZAI_MODEL: ZaiModelTemplate = {
	provider: "zai",
	id: "glm-4.7",
	name: "GLM 4.7 ZAI",
	reasoning: true,
	input: ["text"],
	cost: {
		input: 0.6,
		output: 2.2,
		cacheRead: 0.11,
		cacheWrite: 0,
	},
	contextWindow: 204800,
	maxTokens: 131072,
	compat: {
		supportsDeveloperRole: false,
		thinkingFormat: "zai",
	},
};

const GLM_5_ZAI_MODEL: ZaiModelTemplate = {
	provider: "zai",
	id: "glm-5",
	name: "GLM-5 (ZAI)",
	reasoning: true,
	input: ["text"],
	cost: {
		input: 0.15,
		output: 0.6,
		cacheRead: 0,
		cacheWrite: 0,
	},
	contextWindow: 200000,
	maxTokens: 128000,
	compat: {
		supportsDeveloperRole: false,
		thinkingFormat: "zai",
	},
};

interface ProviderRuntimeConfig {
	baseUrl: string;
	apiKeyEnvKey: "CEREBRAS_API_KEY" | "ZAI_API_KEY";
}

const PROVIDER_RUNTIME_CONFIG: Record<ZaiModelProvider, ProviderRuntimeConfig> =
	{
		cerebras: {
			baseUrl: CEREBRAS_BASE_URL,
			apiKeyEnvKey: "CEREBRAS_API_KEY",
		},
		zai: {
			baseUrl: ZAI_BASE_URL,
			apiKeyEnvKey: "ZAI_API_KEY",
		},
	};

const MODEL_TEMPLATES_BY_PROVIDER: Record<
	ZaiModelProvider,
	ZaiModelTemplate[]
> = {
	cerebras: [GLM_4_7_CEREBRAS_MODEL],
	zai: [GLM_4_7_ZAI_MODEL, GLM_5_ZAI_MODEL],
};

// GLM-5 is expected to be hosted on Cerebras soon under `zai-glm-5`.
const CEREBRAS_MODEL_IDS = new Set<string>([
	...MODEL_TEMPLATES_BY_PROVIDER.cerebras.map((model) => model.id),
	"zai-glm-5",
]);
const ZAI_MODEL_IDS = new Set<string>(
	MODEL_TEMPLATES_BY_PROVIDER.zai.map((model) => model.id),
);

const MODEL_PROVIDER_ORDER: ZaiModelProvider[] = ["cerebras", "zai"];

function parseOptionalNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		const parsed = Number.parseFloat(trimmed);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	return undefined;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
		if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
	}
	return undefined;
}

function parseOptionalString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function firstDefined<T>(...values: Array<T | undefined>): T | undefined {
	for (const value of values) {
		if (value !== undefined) return value;
	}
	return undefined;
}

function resolveNumberKnob(
	defaultValue: number,
	envValue: string | undefined,
	...optionValues: unknown[]
): number {
	return (
		firstDefined(
			parseOptionalNumber(envValue),
			...optionValues.map((value) => parseOptionalNumber(value)),
		) ?? defaultValue
	);
}

function resolveBooleanKnob(
	defaultValue: boolean,
	envValue: string | undefined,
	...optionValues: unknown[]
): boolean {
	return (
		firstDefined(
			parseOptionalBoolean(envValue),
			...optionValues.map((value) => parseOptionalBoolean(value)),
		) ?? defaultValue
	);
}

/**
 * [tag:zai_custom_env_knob_contract]
 * Subagent frontmatter knobs are threaded into child processes via env vars:
 * - Generic temperature: PI_TEMPERATURE
 * - ZAI-specific knobs: PI_ZAI_CUSTOM_TOP_P, PI_ZAI_CUSTOM_CLEAR_THINKING
 * These are consumed here for per-role provider behavior.
 */
export function resolveZaiRuntimeSettings(
	env: Record<string, string | undefined> = process.env,
	options?: ZaiSimpleOptions,
): ZaiRuntimeSettings {
	// [ref:generic_temperature_env_contract] - Generic temperature from subagent
	const temperature = resolveNumberKnob(
		DEFAULT_TEMPERATURE,
		env.PI_TEMPERATURE,
		options?.temperature,
	);
	// [ref:zai_custom_env_knob_contract] - ZAI-specific knobs
	const topP = resolveNumberKnob(
		DEFAULT_TOP_P,
		env.PI_ZAI_CUSTOM_TOP_P,
		options?.top_p,
		options?.topP,
	);
	const clearThinking = resolveBooleanKnob(
		DEFAULT_CLEAR_THINKING,
		env.PI_ZAI_CUSTOM_CLEAR_THINKING,
		options?.clear_thinking,
		options?.clearThinking,
	);

	return {
		temperature,
		topP,
		clearThinking,
	};
}

function providerForModelId(modelId: string): ZaiModelProvider | undefined {
	if (CEREBRAS_MODEL_IDS.has(modelId)) return "cerebras";
	if (ZAI_MODEL_IDS.has(modelId)) return "zai";
	return undefined;
}

function resolveProviderApiKey(
	env: Record<string, string | undefined>,
	provider: ZaiModelProvider,
): string | undefined {
	const runtimeConfig = PROVIDER_RUNTIME_CONFIG[provider];
	return parseOptionalString(env[runtimeConfig.apiKeyEnvKey]);
}

function resolveProviderBaseUrl(provider: ZaiModelProvider): string {
	return PROVIDER_RUNTIME_CONFIG[provider].baseUrl;
}

function materializeModel(
	template: ZaiModelTemplate,
	env: Record<string, string | undefined>,
): ZaiProviderModelConfig | undefined {
	const apiKey = resolveProviderApiKey(env, template.provider);
	if (!apiKey) return undefined;

	return {
		id: template.id,
		name: template.name,
		reasoning: template.reasoning,
		input: template.input,
		cost: template.cost,
		contextWindow: template.contextWindow,
		maxTokens: template.maxTokens,
		compat: template.compat,
		baseUrl: resolveProviderBaseUrl(template.provider),
		apiKey,
	};
}

function resolveModels(
	env: Record<string, string | undefined>,
): ZaiProviderModelConfig[] {
	const models: ZaiProviderModelConfig[] = [];

	for (const provider of MODEL_PROVIDER_ORDER) {
		const templates = MODEL_TEMPLATES_BY_PROVIDER[provider];
		for (const template of templates) {
			const model = materializeModel(template, env);
			if (model !== undefined) models.push(model);
		}
	}

	return models;
}

function routeModelToProviderEndpoint(
	model: unknown,
	env: Record<string, string | undefined>,
): unknown {
	if (!model || typeof model !== "object") return model;

	const modelRecord = model as Record<string, unknown>;
	const modelId =
		typeof modelRecord.id === "string" ? modelRecord.id.trim() : undefined;
	if (!modelId) return model;

	const provider = providerForModelId(modelId);
	if (!provider) return model;

	const apiKey = resolveProviderApiKey(env, provider);
	if (!apiKey) return model;

	return {
		...modelRecord,
		baseUrl: resolveProviderBaseUrl(provider),
		apiKey,
	};
}

/**
 * [tag:zai_custom_payload_knobs]
 * Every request must carry explicit sampling/thinking knobs so provider defaults
 * cannot silently change behavior across endpoints.
 */
export function applyZaiPayloadKnobs(
	payload: unknown,
	runtime: ZaiRuntimeSettings,
): void {
	if (!payload || typeof payload !== "object") return;
	const request = payload as Record<string, unknown>;
	request.temperature = runtime.temperature;
	request.top_p = runtime.topP;
	request.clear_thinking = runtime.clearThinking;
}

/**
 * [ref:zai_custom_env_knob_contract]
 * Subagent frontmatter knobs are threaded into child processes via env vars,
 * then consumed here for per-role provider behavior.
 *
 * [tag:zai_custom_routed_api_key_precedence]
 * `streamSimpleOpenAICompletions` prioritizes `options.apiKey` over `model.apiKey`.
 * After model-ID routing, we must mirror the routed key into options so mixed
 * provider environments (both CEREBRAS_API_KEY and ZAI_API_KEY) authenticate
 * against the endpoint selected by model ID.
 */
export function createZaiStreamSimple(
	baseStreamSimple: ZaiStreamSimple,
	env: Record<string, string | undefined> = process.env,
): ZaiStreamSimple {
	return (model, context, options) => {
		const runtime = resolveZaiRuntimeSettings(env, options);
		const callerOnPayload = options?.onPayload;
		const routedModel = routeModelToProviderEndpoint(model, env);
		const routedApiKey =
			routedModel && typeof routedModel === "object"
				? parseOptionalString((routedModel as Record<string, unknown>).apiKey)
				: undefined;
		const wrappedOptions: ZaiSimpleOptions = {
			...options,
			// [ref:zai_custom_routed_api_key_precedence]
			apiKey: routedApiKey ?? options?.apiKey,
			temperature: runtime.temperature,
			onPayload: (payload: unknown) => {
				callerOnPayload?.(payload);
				// [ref:zai_custom_payload_knobs]
				applyZaiPayloadKnobs(payload, runtime);
			},
		};
		return baseStreamSimple(routedModel, context, wrappedOptions);
	};
}

function resolveProviderFallbackApiKey(
	env: Record<string, string | undefined>,
): string {
	const cerebrasKey = resolveProviderApiKey(env, "cerebras");
	if (cerebrasKey) return cerebrasKey;

	const zaiKey = resolveProviderApiKey(env, "zai");
	if (zaiKey) return zaiKey;

	return API_KEY_ENV_PLACEHOLDER;
}

export function buildZaiProviderConfig(
	input: ZaiProviderConfigInput,
	env: Record<string, string | undefined> = process.env,
): ZaiProviderConfig {
	return {
		baseUrl: CEREBRAS_BASE_URL,
		apiKey: resolveProviderFallbackApiKey(env),
		api: "openai-completions",
		streamSimple: input.streamSimple,
		models: resolveModels(env),
	};
}
