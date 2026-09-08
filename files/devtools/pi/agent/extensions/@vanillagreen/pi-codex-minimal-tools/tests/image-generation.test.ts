import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { directImageGeneration } from "../src/tools/image-generation.js";
import { DEFAULT_SETTINGS } from "../src/settings.js";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "pi-image-generation-"));
}

test("directImageGeneration omits deprecated response_format and passes abort signal", async () => {
	const previousKey = process.env.OPENAI_API_KEY;
	const previousFetch = globalThis.fetch;
	const controller = new AbortController();
	let body: any;
	let seenSignal: AbortSignal | undefined;
	process.env.OPENAI_API_KEY = "test";
	globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
		body = JSON.parse(String(init?.body));
		seenSignal = init?.signal ?? undefined;
		return new Response(JSON.stringify({ data: [{ b64_json: Buffer.from("png").toString("base64") }] }), { status: 200, headers: { "content-type": "application/json" } });
	}) as typeof fetch;
	try {
		await directImageGeneration({ prompt: "test" }, tempDir(), { ...DEFAULT_SETTINGS, directImageApiFallback: true }, controller.signal);
		assert.equal("response_format" in body, false);
		assert.equal(seenSignal, controller.signal);
	} finally {
		if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
		else process.env.OPENAI_API_KEY = previousKey;
		globalThis.fetch = previousFetch;
	}
});
