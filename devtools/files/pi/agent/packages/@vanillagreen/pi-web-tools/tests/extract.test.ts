import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseGitHubUrl, extractGitHubUrl } from "../src/extract/github.js";
import { fetchHttpContent, htmlToMarkdown } from "../src/extract/http.js";
import { assessExtractionQuality, fetchViaJina } from "../src/extract/html.js";
import { extractPdfText, fetchLocalPdfText } from "../src/extract/pdf.js";

function response(body: string, headers: Record<string, string> = {}, status = 200): Response {
	return new Response(body, { status, headers });
}

test("HTML extraction removes chrome and keeps readable links", () => {
	const extracted = htmlToMarkdown("<html><head><title>T</title><style>x</style></head><body><nav><ul><li></li><li>Nav</li></ul></nav><main><h1>Hello</h1><p>See <a href=\"https://example.com\">Example</a></p><p>-</p></main><footer>Footer</footer><script>bad()</script></body></html>");
	assert.equal(extracted.title, "T");
	assert.match(extracted.markdown, /# Hello/);
	assert.match(extracted.markdown, /Example \(https:\/\/example\.com\)/);
	assert.doesNotMatch(extracted.markdown, /bad/);
	assert.doesNotMatch(extracted.markdown, /Nav|Footer/);
	assert.doesNotMatch(extracted.markdown, /^-$/m);
});

test("HTTP fetch extracts HTML and JSON", async () => {
	const htmlFetch = (async () => response("<title>Doc</title><p>Body</p>", { "content-type": "text/html" })) as typeof fetch;
	const html = await fetchHttpContent("https://example.com", { fetchImpl: htmlFetch });
	assert.equal(html.title, "Doc");
	assert.match(html.content, /Body/);
	const jsonFetch = (async () => response('{"b":2}', { "content-type": "application/json" })) as typeof fetch;
	const json = await fetchHttpContent("https://example.com/data.json", { fetchImpl: jsonFetch });
	assert.match(json.content, /"b": 2/);
});

test("PDF extraction reads simple text-bearing PDF streams", () => {
	const pdf = "%PDF-1.4\nBT\n(Hello PDF) Tj\n[( chunk) 20 ( two)] TJ\nET";
	const extracted = extractPdfText(pdf);
	assert.match(extracted.text, /Hello PDF/);
	assert.match(extracted.text, /chunk two/);
});

test("local PDF extraction can fall back to basic parser when pdftotext is disabled", async () => {
	const dir = mkdtempSync(join(tmpdir(), "pi-web-tools-pdf-test-"));
	const path = join(dir, "sample.pdf");
	writeFileSync(path, "%PDF-1.4\nBT\n(Local PDF) Tj\nET");
	const extracted = await fetchLocalPdfText(path, { preferPdftotext: false });
	assert.match(extracted.text, /Local PDF/);
	assert.equal(extracted.metadata.extraction, "pdf-basic");
});

test("GitHub URL parser covers repo, blob, tree, and commit", () => {
	assert.equal(parseGitHubUrl("https://github.com/o/r")?.kind, "repo");
	const blob = parseGitHubUrl("https://github.com/o/r/blob/main/src/index.ts");
	assert.equal(blob?.kind, "blob");
	assert.equal(blob?.rawUrl, "https://raw.githubusercontent.com/o/r/main/src/index.ts");
	assert.equal(parseGitHubUrl("https://github.com/o/r/tree/main/src")?.kind, "tree");
	assert.equal(parseGitHubUrl("https://github.com/o/r/commit/abc")?.kind, "commit");
});

test("HTML extraction strips Wikipedia-style chrome blocks by class", () => {
	const html = `<html><body><main><table class="sidebar navbox"><tr><td>Sidebar junk lots of links</td></tr></table><h1>Real Title</h1><p>Real body content here.</p><div class="hatnote">For other meanings see other.</div></main></body></html>`;
	const out = htmlToMarkdown(html);
	assert.match(out.markdown, /# Real Title/);
	assert.match(out.markdown, /Real body content/);
	assert.doesNotMatch(out.markdown, /Sidebar junk/);
	assert.doesNotMatch(out.markdown, /For other meanings/);
});

test("assessExtractionQuality flags blocked and low-content pages", () => {
	const blocked = assessExtractionQuality({ markdown: "Just a moment. Checking your browser." }, 8000);
	assert.equal(blocked.blocked, true);
	assert.ok(blocked.reasons.some((r) => r.startsWith("blocked-pattern")));
	const low = assessExtractionQuality({ markdown: "x" }, 8000);
	assert.equal(low.lowContent, true);
	const ok = assessExtractionQuality({ markdown: "Body content. ".repeat(40) }, 8000);
	assert.equal(ok.blocked, false);
	assert.equal(ok.lowContent, false);
});

test("fetchViaJina parses Jina Reader markdown response", async () => {
	const fetchImpl = (async () => response("Title: Demo\nURL Source: https://x.example\n\nMarkdown Content:\n# Demo\n\nbody")) as typeof fetch;
	const out = await fetchViaJina("https://x.example", { fetchImpl });
	assert.equal(out.title, "Demo");
	assert.match(out.markdown, /# Demo/);
});

test("fetchHttpContent falls back to Jina on blocked HTML when enabled", async () => {
	const fetchImpl = (async (url: any) => {
		if (String(url).startsWith("https://r.jina.ai/")) return response("Title: Recovered\n\nMarkdown Content:\n# Got it\n\nclean body");
		return response("<html><body><h1>Just a moment</h1><p>Checking your browser.</p></body></html>", { "content-type": "text/html" });
	}) as typeof fetch;
	const out = await fetchHttpContent("https://blocked.example", { fetchImpl, jinaFallback: true });
	assert.equal(out.title, "Recovered");
	assert.match(out.content, /clean body/);
	assert.deepEqual(out.metadata.extractionChain, ["html-basic", "jina"]);
});

test("fetchHttpContent falls back to Jina on 403 when enabled", async () => {
	const fetchImpl = (async (url: any) => {
		if (String(url).startsWith("https://r.jina.ai/")) return response("Title: Recovered\n\nMarkdown Content:\n# After 403\n\nrescued");
		return response("denied", {}, 403);
	}) as typeof fetch;
	const out = await fetchHttpContent("https://e403.example", { fetchImpl, jinaFallback: true });
	assert.equal(out.title, "Recovered");
	assert.match(out.content, /rescued/);
	assert.deepEqual(out.metadata.extractionChain, ["http:403", "jina"]);
});

test("fetchHttpContent without jinaFallback returns blocked content as-is", async () => {
	const fetchImpl = (async () => response("<html><body><h1>Just a moment</h1></body></html>", { "content-type": "text/html" })) as typeof fetch;
	const out = await fetchHttpContent("https://blocked.example", { fetchImpl });
	assert.match(out.content, /Just a moment/);
	assert.deepEqual(out.metadata.extractionChain, ["html-basic"]);
});

test("GitHub blob extraction uses raw URL when clone is disabled", async () => {
	const seen: string[] = [];
	const fetchImpl = (async (url: any) => {
		seen.push(String(url));
		return response("file contents");
	}) as typeof fetch;
	const extracted = await extractGitHubUrl("https://github.com/o/r/blob/main/a.txt", { fetchImpl, cloneEnabled: false });
	assert.equal(extracted?.content, "file contents");
	assert.equal(seen[0], "https://raw.githubusercontent.com/o/r/main/a.txt");
});
