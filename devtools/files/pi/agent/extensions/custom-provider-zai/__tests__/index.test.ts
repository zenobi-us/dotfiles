import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
	CEREBRAS_BASE_URL,
	DEFAULT_CLEAR_THINKING,
	DEFAULT_TEMPERATURE,
	DEFAULT_TOP_P,
	ZAI_BASE_URL,
	applyZaiPayloadKnobs,
	buildZaiProviderConfig,
	createZaiStreamSimple,
	type ZaiRuntimeSettings,
} from "../config";

const indexPath = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"index.ts",
);

const providerInput = {
	streamSimple: (() => ({}) as never) as never,
};

function buildConfig(
	env: Record<string, string | undefined> = {},
): ReturnType<typeof buildZaiProviderConfig> {
	return buildZaiProviderConfig(providerInput, env);
}

function createTestModel(id = "zai-glm-4.7") {
	return {
		id,
		provider: "zai-custom",
		api: "openai-completions",
		baseUrl: "https://example.invalid/v1",
		apiKey: "placeholder-key",
		reasoning: false,
		input: ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 1,
		maxTokens: 1,
	};
}

function createCapturedInvocationRecorder() {
	let capturedOptions: Record<string, unknown> | undefined;
	let capturedModel: Record<string, unknown> | undefined;
	const baseStream = (
		model: unknown,
		_context: unknown,
		options?: Record<string, unknown>,
	) => {
		capturedModel = model as Record<string, unknown>;
		capturedOptions = options;
		return {
			push() {},
			end() {},
		} as never;
	};
	return {
		baseStream,
		getCapturedOptions: () => capturedOptions,
		getCapturedModel: () => capturedModel,
	};
}

function assertPayloadKnobs(
	payload: Record<string, unknown>,
	temperature = DEFAULT_TEMPERATURE,
	topP = DEFAULT_TOP_P,
	clearThinking = DEFAULT_CLEAR_THINKING,
): void {
	assert.equal(payload.temperature, temperature);
	assert.equal(payload.top_p, topP);
	assert.equal(payload.clear_thinking, clearThinking);
}

function buildRuntimeSettings(
	overrides: Partial<ZaiRuntimeSettings> = {},
): ZaiRuntimeSettings {
	return {
		temperature: DEFAULT_TEMPERATURE,
		topP: DEFAULT_TOP_P,
		clearThinking: DEFAULT_CLEAR_THINKING,
		...overrides,
	};
}

function applyKnobsWithRuntime(
	overrides: Partial<ZaiRuntimeSettings> = {},
): Record<string, unknown> {
	const payload: Record<string, unknown> = {};
	applyZaiPayloadKnobs(payload, buildRuntimeSettings(overrides));
	return payload;
}

test("index extension registers zai-custom provider", () => {
	const source = readFileSync(indexPath, "utf-8");
	assert.match(source, /registerProvider\([\s\S]*"zai-custom"/);
});

test("buildZaiProviderConfig returns no models when no provider keys are configured", () => {
	const config = buildConfig();

	assert.equal(config.api, "openai-completions");
	assert.equal(config.baseUrl, CEREBRAS_BASE_URL);
	assert.equal(config.models.length, 0);
});

test("buildZaiProviderConfig registers Cerebras models when CEREBRAS_API_KEY is set", () => {
	const config = buildConfig({
		CEREBRAS_API_KEY: "cerebras-key",
	});

	assert.equal(config.models.length, 1);
	assert.equal(config.models[0].id, "zai-glm-4.7");
	assert.equal(config.models[0].name, "GLM-4.7 Cerebras");
	assert.equal(config.models[0].reasoning, false);
	assert.equal(config.models[0].baseUrl, CEREBRAS_BASE_URL);
	assert.equal(config.models[0].apiKey, "cerebras-key");
	assert.deepEqual(config.models[0].cost, {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
	});
	assert.equal(config.models[0].contextWindow, 131072);
	assert.equal(config.models[0].maxTokens, 40000);
	assert.equal(
		config.models.some((model) => model.id === "glm-5"),
		false,
	);
});

test("buildZaiProviderConfig registers ZAI models when ZAI_API_KEY is set", () => {
	const config = buildConfig({
		ZAI_API_KEY: "zai-key",
	});

	assert.equal(config.models.length, 2);
	assert.equal(config.models[0].id, "glm-4.7");
	assert.equal(config.models[0].name, "GLM 4.7 ZAI");
	assert.equal(config.models[0].reasoning, true);
	assert.equal(config.models[0].baseUrl, ZAI_BASE_URL);
	assert.equal(config.models[0].apiKey, "zai-key");
	assert.deepEqual(config.models[0].cost, {
		input: 0.6,
		output: 2.2,
		cacheRead: 0.11,
		cacheWrite: 0,
	});
	assert.equal(config.models[0].contextWindow, 204800);
	assert.equal(config.models[0].maxTokens, 131072);
	assert.equal(config.models[1].id, "glm-5");
	assert.equal(config.models[1].name, "GLM-5 (ZAI)");
	assert.equal(config.models[1].baseUrl, ZAI_BASE_URL);
	assert.equal(config.models[1].apiKey, "zai-key");
});

test("buildZaiProviderConfig registers both model sets when both keys are set", () => {
	const config = buildConfig({
		CEREBRAS_API_KEY: "cerebras-key",
		ZAI_API_KEY: "zai-key",
	});

	assert.equal(config.models.length, 3);
	assert.equal(
		config.models.some(
			(model) =>
				model.id === "zai-glm-4.7" &&
				model.baseUrl === CEREBRAS_BASE_URL &&
				model.apiKey === "cerebras-key",
		),
		true,
	);
	assert.equal(
		config.models.some(
			(model) =>
				model.id === "glm-4.7" &&
				model.baseUrl === ZAI_BASE_URL &&
				model.apiKey === "zai-key",
		),
		true,
	);
	assert.equal(
		config.models.some(
			(model) =>
				model.id === "glm-5" &&
				model.baseUrl === ZAI_BASE_URL &&
				model.apiKey === "zai-key",
		),
		true,
	);
});

test("buildZaiProviderConfig ignores PI_ZAI_API_KEY and legacy ZAI_CUSTOM_API_KEY", () => {
	const config = buildConfig({
		PI_ZAI_API_KEY: "legacy-explicit-key",
		ZAI_CUSTOM_API_KEY: "legacy-custom-key",
	});

	assert.equal(config.models.length, 0);
});

test("buildZaiProviderConfig ignores all base-url env overrides", () => {
	const config = buildConfig({
		CEREBRAS_API_KEY: "cerebras-key",
		PI_ZAI_CUSTOM_BASE_URL: "https://api.z.ai/api/coding/paas/v4",
		PI_ZAI_BASE_URL: "https://legacy.example.invalid",
		ZAI_BASE_URL: "https://legacy.example.invalid",
	});

	assert.equal(config.baseUrl, CEREBRAS_BASE_URL);
	assert.equal(config.models[0].baseUrl, CEREBRAS_BASE_URL);
});

test("applyZaiPayloadKnobs injects temperature/top_p/clear_thinking", () => {
	const payload = applyKnobsWithRuntime();

	assertPayloadKnobs(payload);
});

test("applyZaiPayloadKnobs respects clear_thinking knob", () => {
	const payload = applyKnobsWithRuntime({ clearThinking: true });

	assertPayloadKnobs(payload, DEFAULT_TEMPERATURE, DEFAULT_TOP_P, true);
});

test("createZaiStreamSimple routes Cerebras model IDs to Cerebras endpoint and key", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		CEREBRAS_API_KEY: "cerebras-key",
		ZAI_API_KEY: "zai-key",
	});

	streamSimple(createTestModel("zai-glm-4.7"), { messages: [] }, {});

	const capturedModel = recorder.getCapturedModel();
	assert.equal(capturedModel?.baseUrl, CEREBRAS_BASE_URL);
	assert.equal(capturedModel?.apiKey, "cerebras-key");
});

test("createZaiStreamSimple routes ZAI model IDs to ZAI endpoint and key", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		CEREBRAS_API_KEY: "cerebras-key",
		ZAI_API_KEY: "zai-key",
	});

	streamSimple(createTestModel("glm-5"), { messages: [] }, {});

	const capturedModel = recorder.getCapturedModel();
	assert.equal(capturedModel?.baseUrl, ZAI_BASE_URL);
	assert.equal(capturedModel?.apiKey, "zai-key");
});

test("createZaiStreamSimple overrides caller apiKey with routed ZAI key for ZAI model IDs", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		CEREBRAS_API_KEY: "cerebras-key",
		ZAI_API_KEY: "zai-key",
	});

	streamSimple(
		createTestModel("glm-5"),
		{ messages: [] },
		{ apiKey: "cerebras-key" },
	);

	const capturedModel = recorder.getCapturedModel();
	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedModel?.apiKey, "zai-key");
	assert.equal(capturedOptions?.apiKey, "zai-key");
});

test("createZaiStreamSimple overrides caller apiKey with routed Cerebras key for Cerebras model IDs", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		CEREBRAS_API_KEY: "cerebras-key",
		ZAI_API_KEY: "zai-key",
	});

	streamSimple(
		createTestModel("zai-glm-4.7"),
		{ messages: [] },
		{ apiKey: "zai-key" },
	);

	const capturedModel = recorder.getCapturedModel();
	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedModel?.apiKey, "cerebras-key");
	assert.equal(capturedOptions?.apiKey, "cerebras-key");
});

test("createZaiStreamSimple enforces payload knobs while preserving caller onPayload", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		PI_TEMPERATURE: "0.42",
		PI_ZAI_CUSTOM_TOP_P: "0.84",
		PI_ZAI_CUSTOM_CLEAR_THINKING: "true",
		ZAI_API_KEY: "zai-key",
	});

	let callerOnPayloadSeen = false;
	streamSimple(
		createTestModel("glm-4.7"),
		{ messages: [] },
		{
			onPayload(payload) {
				callerOnPayloadSeen = true;
				(payload as Record<string, unknown>).fromCaller = true;
			},
		},
	);

	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedOptions?.temperature, 0.42);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);

	assert.equal(callerOnPayloadSeen, true);
	assert.equal(payload.fromCaller, true);
	assertPayloadKnobs(payload, 0.42, 0.84, true);
});

test("createZaiStreamSimple ignores legacy non-PI ZAI knob env formats", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		ZAI_TEMPERATURE: "0.01",
		ZAI_TOP_P: "0.02",
		ZAI_CLEAR_THINKING: "true",
		ZAI_API_KEY: "zai-key",
	});

	streamSimple(createTestModel("glm-4.7"), { messages: [] }, {});

	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedOptions?.temperature, DEFAULT_TEMPERATURE);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);
	assertPayloadKnobs(payload);
});

test("createZaiStreamSimple ignores legacy PI_ZAI_TEMPERATURE/PI_ZAI_TOP_P/PI_ZAI_CLEAR_THINKING/PI_ZAI_BASE_URL env formats", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		PI_ZAI_TEMPERATURE: "0.01",
		PI_ZAI_TOP_P: "0.02",
		PI_ZAI_CLEAR_THINKING: "true",
		PI_ZAI_BASE_URL: "https://legacy.example.invalid",
		ZAI_API_KEY: "zai-key",
	});

	streamSimple(createTestModel("glm-4.7"), { messages: [] }, {});

	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedOptions?.temperature, DEFAULT_TEMPERATURE);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);
	assertPayloadKnobs(payload);
});

test("createZaiStreamSimple env PI_TEMPERATURE overrides options temperature", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		PI_TEMPERATURE: "0.42",
		CEREBRAS_API_KEY: "cerebras-key",
	});

	streamSimple(createTestModel(), { messages: [] }, { temperature: 0.75 });

	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedOptions?.temperature, 0.42);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);
	assertPayloadKnobs(payload, 0.42, DEFAULT_TOP_P);
});

test("createZaiStreamSimple env PI_ZAI_CUSTOM_TOP_P overrides options top_p", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		PI_ZAI_CUSTOM_TOP_P: "0.84",
		CEREBRAS_API_KEY: "cerebras-key",
	});

	streamSimple(createTestModel(), { messages: [] }, { top_p: 0.5 });

	const capturedOptions = recorder.getCapturedOptions();
	// top_p in options is preserved (not overridden in wrappedOptions), but payload gets env value
	assert.equal(capturedOptions?.top_p, 0.5);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);
	// The payload gets the env value, proving env wins over options
	assertPayloadKnobs(payload, DEFAULT_TEMPERATURE, 0.84);
});

test("createZaiStreamSimple treats empty string PI_TEMPERATURE as undefined, falls back to default", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		PI_TEMPERATURE: "",
		CEREBRAS_API_KEY: "cerebras-key",
	});

	streamSimple(createTestModel(), { messages: [] }, {});

	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedOptions?.temperature, DEFAULT_TEMPERATURE);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);
	assertPayloadKnobs(payload);
});

test("createZaiStreamSimple treats empty string PI_ZAI_CUSTOM_TOP_P as undefined, falls back to default", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		PI_ZAI_CUSTOM_TOP_P: "",
		CEREBRAS_API_KEY: "cerebras-key",
	});

	streamSimple(createTestModel(), { messages: [] }, {});

	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedOptions?.temperature, DEFAULT_TEMPERATURE);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);
	assertPayloadKnobs(payload);
});

test("createZaiStreamSimple treats empty string PI_ZAI_CUSTOM_CLEAR_THINKING as undefined, falls back to default", () => {
	const recorder = createCapturedInvocationRecorder();
	const streamSimple = createZaiStreamSimple(recorder.baseStream as never, {
		PI_ZAI_CUSTOM_CLEAR_THINKING: "",
		CEREBRAS_API_KEY: "cerebras-key",
	});

	streamSimple(createTestModel(), { messages: [] }, {});

	const capturedOptions = recorder.getCapturedOptions();
	assert.equal(capturedOptions?.temperature, DEFAULT_TEMPERATURE);

	const payload: Record<string, unknown> = {};
	(capturedOptions?.onPayload as ((payload: unknown) => void) | undefined)?.(
		payload,
	);
	assertPayloadKnobs(payload);
});
