import assert from "node:assert/strict";
import test from "node:test";
import { DuckDuckGoClient, parseDuckDuckGoHtml } from "../src/providers/duckduckgo.js";
import { ExaMcpClient, parseExaMcpText } from "../src/providers/exa-mcp.js";
import { createWebSearchToolDefinition } from "../src/tools/web-search.js";
import { DEFAULT_SETTINGS, type WebToolsSettings } from "../src/settings.js";

function settings(overrides: Partial<WebToolsSettings> = {}): WebToolsSettings {
	return { ...DEFAULT_SETTINGS, apiKeys: {}, warnings: [], ...overrides } as WebToolsSettings;
}

function textOf(result: any): string {
	return result.content?.[0]?.type === "text" ? result.content[0].text : "";
}

test("parseDuckDuckGoHtml extracts titles, redirect URLs, and snippets", () => {
	const html = `
		<div class="result">
			<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fdocs&amp;rut=abc">Example &amp; Docs</a>
			<a class="result__snippet">Useful &lt;b&gt;snippet&lt;/b&gt; here.</a>
		</div>`;
	const results = parseDuckDuckGoHtml(html, 5);
	assert.deepEqual(results, [{ title: "Example & Docs", url: "https://example.com/docs", summary: "Useful <b>snippet</b> here." }]);
});

test("DuckDuckGoClient requests html endpoint and parses response", async () => {
	const seen: string[] = [];
	const fetchImpl = (async (url: any) => {
		seen.push(String(url));
		return new Response(`<div class="result"><a class="result__a" href="https://example.com/a">A</a><div class="result__snippet">Alpha</div></div>`, { status: 200 });
	}) as typeof fetch;
	const result = await new DuckDuckGoClient({ fetchImpl }).search({ query: "hello", numResults: 3, includeDomains: ["example.com"] });
	assert.match(seen[0]!, /^https:\/\/html\.duckduckgo\.com\/html\/\?q=hello\+site%3Aexample\.com/);
	assert.equal(result.results[0]?.url, "https://example.com/a");
	assert.equal(result.metadata.provider, "duckduckgo");
});

test("parseExaMcpText extracts title/url/text blocks", () => {
	const text = `Title: Qwen3.6-27B\nURL: https://huggingface.co/Qwen/Qwen3.6-27B\nPublished: 2026-04-22\nHighlights:\nReleased model details.\n---\nTitle: Qwen GitHub\nURL: https://github.com/QwenLM/Qwen3.6\nText: Repo content.`;
	const results = parseExaMcpText(text);
	assert.equal(results.length, 2);
	assert.equal(results[0]?.title, "Qwen3.6-27B");
	assert.equal(results[0]?.publishedDate, "2026-04-22");
	assert.match(results[1]?.text ?? "", /Repo content/);
});

test("ExaMcpClient calls JSON-RPC MCP endpoint and parses SSE response", async () => {
	let body: any;
	const fetchImpl = (async (_url: any, init: any) => {
		body = JSON.parse(String(init?.body ?? "{}"));
		const payload = { result: { content: [{ type: "text", text: "Title: Source\nURL: https://example.com\nHighlights:\nSnippet" }] } };
		return new Response(`event: message\ndata: ${JSON.stringify(payload)}\n\n`, { status: 200 });
	}) as typeof fetch;
	const result = await new ExaMcpClient({ fetchImpl }).search({ query: "latest qwen", numResults: 2 });
	assert.equal(body.params.name, "web_search_exa");
	assert.equal(body.params.arguments.numResults, 2);
	assert.equal(result.results[0]?.url, "https://example.com");
	assert.equal(result.metadata.provider, "exa-mcp");
});

test("web_search defaults simple searches to five results", async () => {
	const originalFetch = globalThis.fetch;
	(globalThis as any).fetch = (async () => new Response(Array.from({ length: 8 }, (_v, i) => `<div class="result"><a class="result__a" href="https://example.com/${i}">Result ${i}</a><div class="result__snippet">Snippet ${i}</div></div>`).join("\n"), { status: 200 })) as typeof fetch;
	try {
		const tool = createWebSearchToolDefinition({ appendEntry() {} } as any, () => settings({ enabledProviders: ["duckduckgo"] }));
		const result = await tool.execute("call", { query: "q", provider: "duckduckgo" }, undefined, undefined, { cwd: process.cwd(), model: { provider: "openai-codex" } } as any);
		assert.equal(result.details.results.length, 5);
		assert.match(textOf(result), /Results: 5/);
	} finally {
		(globalThis as any).fetch = originalFetch;
	}
});

test("web_search non-storing provider tells models to fetch URLs instead of using result numbers as content ids", async () => {
	const originalFetch = globalThis.fetch;
	(globalThis as any).fetch = (async () => new Response(`<div class="result"><a class="result__a" href="https://example.com/a">A</a><div class="result__snippet">Alpha</div></div>`, { status: 200 })) as typeof fetch;
	try {
		const tool = createWebSearchToolDefinition({ appendEntry() {} } as any, () => settings({ enabledProviders: ["duckduckgo"] }));
		const result = await tool.execute("call", { query: "q", provider: "duckduckgo" }, undefined, undefined, { cwd: process.cwd(), model: { provider: "openai-codex" } } as any);
		assert.match(textOf(result), /Result numbers above are not content ids/);
		assert.match(textOf(result), /call web_fetch with its URL/);
		assert.doesNotMatch(textOf(result), /Use get_web_content only with shown content id values/);
	} finally {
		(globalThis as any).fetch = originalFetch;
	}
});

test("web_search auto falls back from failing keyed provider to Exa MCP", async () => {
	const appended: any[] = [];
	const originalFetch = globalThis.fetch;
	(globalThis as any).fetch = (async (url: any, init: any) => {
		if (String(url).includes("api.perplexity.ai")) return new Response("rate limited", { status: 429 });
		if (String(url).includes("mcp.exa.ai")) {
			const payload = { result: { content: [{ type: "text", text: "Title: Fallback\nURL: https://example.com/fallback\nHighlights:\nFallback snippet" }] } };
			return new Response(`data: ${JSON.stringify(payload)}\n\n`, { status: 200 });
		}
		throw new Error(`unexpected fetch ${url}`);
	}) as typeof fetch;
	try {
		const tool = createWebSearchToolDefinition({ appendEntry(type: string, data: unknown) { appended.push({ type, data }); } } as any, () => settings({ apiKeys: { perplexity: "pplx" } }));
		const result = await tool.execute("call", { query: "q" }, undefined, undefined, { cwd: process.cwd(), model: { provider: "openai-codex" } } as any);
		assert.equal(result.details.provider, "exa-mcp");
		assert.match(textOf(result), /Provider: exa-mcp/);
		assert.match(textOf(result), /https:\/\/example.com\/fallback/);
		assert.match(textOf(result), /Use get_web_content only with shown content id values/);
		assert.doesNotMatch(textOf(result), /Result numbers above are not content ids/);
		assert.match(result.details.warnings[0], /perplexity/);
		assert.equal(appended.length, 1);
		assert.equal(appended[0].data.metadata.provider, "exa-mcp");
	} finally {
		(globalThis as any).fetch = originalFetch;
	}
});
