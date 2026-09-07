import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { fetchWithResponseHeaderTimeout, responseHeaderTimeoutMsFromOptions } from "../src/provider-shim.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("responseHeaderTimeoutMsFromOptions uses Pi HTTP timeout when provided", () => {
	assert.equal(responseHeaderTimeoutMsFromOptions({ timeoutMs: 45_000 } as any), 45_000);
	assert.equal(responseHeaderTimeoutMsFromOptions({ timeoutMs: 0 } as any), 20_000);
	assert.equal(responseHeaderTimeoutMsFromOptions(undefined), 20_000);
});

test("fetchWithResponseHeaderTimeout aborts when SSE response headers stall", async () => {
	globalThis.fetch = ((_url: RequestInfo | URL, init?: RequestInit) =>
		new Promise<Response>((_resolve, reject) => {
			const signal = init?.signal;
			if (signal?.aborted) {
				reject(new Error("aborted before fetch"));
				return;
			}
			signal?.addEventListener("abort", () => reject(new Error("aborted by test")), { once: true });
		})) as typeof fetch;

	await assert.rejects(
		() => fetchWithResponseHeaderTimeout("https://example.test/backend-api/codex/responses", { method: "POST" }, undefined, 1),
		/Codex Responses SSE response headers timed out after 1ms/,
	);
});
