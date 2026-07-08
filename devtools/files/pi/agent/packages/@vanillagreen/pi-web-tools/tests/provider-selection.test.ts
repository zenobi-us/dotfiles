import assert from "node:assert/strict";
import test from "node:test";
import { computeNextActiveTools } from "../src/active-tools.js";
import { resolveWebProvider, resolveWebProviderCandidates } from "../src/provider-selection.js";
import { DEFAULT_SETTINGS, type WebToolsSettings } from "../src/settings.js";

function settings(overrides: Partial<WebToolsSettings> = {}): WebToolsSettings {
	return { ...DEFAULT_SETTINGS, apiKeys: {}, warnings: [], ...overrides } as WebToolsSettings;
}

test("auto provider resolution prefers keyed providers then no-key providers then OpenAI native", () => {
	const model = { provider: "openai-codex", id: "gpt-5.5" };
	assert.deepEqual(resolveWebProviderCandidates("auto", settings({ apiKeys: { exa: "key" } }), model).slice(0, 3), ["exa", "exa-mcp", "duckduckgo"]);
	assert.deepEqual(resolveWebProviderCandidates("auto", settings({ apiKeys: { perplexity: "key" } }), model).slice(0, 4), ["perplexity", "exa-mcp", "duckduckgo", "openai-native"]);
	assert.deepEqual(resolveWebProviderCandidates("auto", settings(), model), ["exa-mcp", "duckduckgo", "openai-native"]);
	assert.deepEqual(resolveWebProviderCandidates("auto", settings({ apiKeys: { gemini: "key" }, browserCookieAccess: true }), model), ["gemini", "exa-mcp", "duckduckgo", "openai-native"]);
	assert.deepEqual(resolveWebProviderCandidates("auto", settings({ browserCookieAccess: true }), model), ["exa-mcp", "duckduckgo", "gemini", "openai-native"]);
	assert.equal(resolveWebProvider("gemini", settings({ browserCookieAccess: true }), model).provider, "gemini");
	assert.equal(resolveWebProvider("auto", settings(), model).provider, "exa-mcp");
	assert.equal(resolveWebProvider("auto", settings({ enabledProviders: ["openai-native"] }), model).provider, "openai-native");
	assert.equal(resolveWebProvider("auto", settings({ enabledProviders: ["openai-native"], nativeOpenAiWebSearch: false }), model).provider, undefined);
});

test("active tool sync preserves native tools and keeps web_search available for no-key fallbacks", () => {
	const current = ["read", "bash", "image_generation", "web_search"];
	const next = computeNextActiveTools(current, { provider: "openai-codex", id: "gpt-5.5" }, settings());
	assert.ok(next.includes("read"));
	assert.ok(next.includes("bash"));
	assert.ok(next.includes("image_generation"));
	assert.ok(next.includes("web_search"));
});
