import assert from "node:assert/strict";
import test from "node:test";
import { PerplexityClient, perplexitySearch } from "../src/providers/perplexity.js";

function jsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

test("PerplexityClient builds chat body with model, citations, and filters", () => {
	const client = new PerplexityClient({ apiKey: "test", fetchImpl: (async () => jsonResponse({})) as typeof fetch });
	const body = client.buildChatBody({
		query: "rust async runtimes",
		numResults: 7,
		includeDomains: ["docs.rs"],
		recencyFilter: "month",
		startPublishedDate: "2026-01-01",
	});
	assert.equal(body.model, "sonar");
	assert.equal(body.return_citations, true);
	assert.equal(body.search_max_results, 7);
	assert.deepEqual(body.search_domain_filter, ["docs.rs"]);
	assert.equal(body.search_recency_filter, "month");
	assert.equal(body.search_after_date_filter, "2026-01-01");
});

test("PerplexityClient excludeDomains becomes negative domain filter when no include set", () => {
	const client = new PerplexityClient({ apiKey: "k", fetchImpl: (async () => jsonResponse({})) as typeof fetch });
	const body = client.buildChatBody({ query: "q", excludeDomains: ["spam.io"] });
	assert.deepEqual(body.search_domain_filter, ["-spam.io"]);
});

test("PerplexityClient.search normalizes Sonar response to answer + results", async () => {
	const fetchImpl = (async () => jsonResponse({
		choices: [{ message: { content: "Tokio and async-std are the main runtimes." } }],
		citations: ["https://tokio.rs", "https://async.rs", "https://tokio.rs"],
		search_results: [
			{ url: "https://tokio.rs", title: "Tokio" },
			{ url: "https://docs.rs/futures", title: "futures" },
		],
	})) as typeof fetch;
	const client = new PerplexityClient({ apiKey: "k", fetchImpl });
	const out = await client.search({ query: "rust runtimes", numResults: 5 });
	assert.match(out.answer ?? "", /Tokio/);
	const urls = out.results.map((r) => r.url);
	assert.ok(urls.includes("https://tokio.rs"));
	assert.ok(urls.includes("https://async.rs"));
	assert.ok(urls.includes("https://docs.rs/futures"));
	assert.equal(new Set(urls).size, urls.length);
	assert.equal(out.metadata.provider, "perplexity");
});

test("PerplexityClient.search throws on non-2xx with status in message", async () => {
	const fetchImpl = (async () => new Response("bad", { status: 401 })) as typeof fetch;
	const client = new PerplexityClient({ apiKey: "k", fetchImpl });
	await assert.rejects(() => client.search({ query: "q" }), /Perplexity request failed \(401\)/);
});

test("perplexitySearch helper requires API key", async () => {
	await assert.rejects(() => perplexitySearch({ query: "q" }, { apiKey: undefined as any }), /Perplexity/);
});
