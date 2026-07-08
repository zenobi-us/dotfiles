import assert from "node:assert/strict";
import test from "node:test";
import { ExaClient } from "../src/providers/exa.js";
import { createCodeSearchToolDefinition } from "../src/tools/code-search.js";

function jsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

test("ExaClient.codeContext POSTs to /context and parses response", async () => {
	const seen: { url: string; body: any }[] = [];
	const fetchImpl = (async (url: any, init: any) => {
		seen.push({ url: String(url), body: JSON.parse(String(init?.body ?? "{}")) });
		return jsonResponse({ requestId: "req_1", query: "react hooks", response: "## Code\n\n```ts\nconst [n,setN]=useState(0);\n```", resultsCount: 12, outputTokens: 800 });
	}) as typeof fetch;
	const client = new ExaClient({ apiKey: "k", fetchImpl });
	const out = await client.codeContext("react hooks", 5000);
	assert.equal(seen[0]!.url, "https://api.exa.ai/context");
	assert.deepEqual(seen[0]!.body, { query: "react hooks", tokensNum: 5000 });
	assert.match(out.text, /useState/);
	assert.equal(out.outputTokens, 800);
	assert.equal(out.resultsCount, 12);
});

test("code_search renderer shows Exa Code label with token count, content id, and ctrl+o hint", () => {
	const tool = createCodeSearchToolDefinition({ appendEntry() {} } as any, () => ({ apiKeys: { exa: "k" } } as any));
	const theme = { fg: (_t: string, s: string) => s, bold: (s: string) => s };
	const details = { provider: "exa-code", source: "exa-code", outputTokens: 1500, resultsCount: 8, contentId: "web-foo", results: [{ title: "React Hooks", url: "https://react.dev/reference/react/useState" }, { title: "GFG", url: "https://geeksforgeeks.org/x" }] };
	const compact = tool.renderResult({ content: [{ type: "text", text: "snippets" }], details }, {}, theme, { args: { query: "react" } }).render(200).join("\n");
	assert.match(compact, /Code Search \(Exa Code\) react/);
	assert.match(compact, /1500 tokens · 8 sources/);
	assert.match(compact, /content id web-foo/);
	assert.match(compact, /… 2 sources · ctrl\+o to expand/);
	assert.doesNotMatch(compact, /0 results/);
	const expanded = tool.renderResult({ content: [{ type: "text", text: "snippets" }], details }, { expanded: true }, theme, { args: { query: "react" } }).render(200).join("\n");
	assert.match(expanded, /React Hooks/);
	assert.match(expanded, /react\.dev\/reference\/react\/useState/);
	assert.match(expanded, /GFG/);
});

test("code_search prefers Exa Code context and stores the full text", async () => {
	const appended: any[] = [];
	const pi = { appendEntry(type: string, data: unknown) { appended.push({ type, data }); } } as any;
	const calls: string[] = [];
	const fetchImpl = (async (url: any) => {
		calls.push(String(url));
		if (String(url).endsWith("/context")) return jsonResponse({ response: "code snippet body", resultsCount: 5, outputTokens: 400 });
		throw new Error("classic search should not run when context succeeds");
	}) as typeof fetch;
	const tool = createCodeSearchToolDefinition(pi, () => ({ apiKeys: { exa: "k" } } as any));
	(globalThis as any).fetch = fetchImpl;
	const original = (await import("../src/providers/exa.js")).ExaClient;
	void original;
	const result = await tool.execute("call", { query: "react hooks" }, undefined, undefined, { cwd: process.cwd() } as any);
	assert.equal(result.details.provider, "exa-code");
	assert.match(result.content[0]!.type === "text" ? result.content[0]!.text : "", /code snippet body/);
	assert.equal(appended.length, 1);
	assert.equal(appended[0]!.data.metadata.contentKind, "code-context");
});

test("code_search falls back to classic search when context throws and mode=auto", async () => {
	const fetchImpl = (async (url: any) => {
		if (String(url).endsWith("/context")) return new Response("err", { status: 500 });
		return jsonResponse({ results: [{ title: "GitHub repo", url: "https://github.com/foo/bar", text: "code" }] });
	}) as typeof fetch;
	(globalThis as any).fetch = fetchImpl;
	const tool = createCodeSearchToolDefinition({ appendEntry() {} } as any, () => ({ apiKeys: { exa: "k" } } as any));
	const result = await tool.execute("call", { query: "anything" }, undefined, undefined, { cwd: process.cwd() } as any);
	assert.equal(result.details.provider, "exa");
	assert.equal(result.details.results.length, 1);
});
