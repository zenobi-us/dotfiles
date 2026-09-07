import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { proxyForWebSocketUrl, webSocketOptionsForUrl } from "../src/provider-shim.js";

const originalEnv = {
	HTTP_PROXY: process.env.HTTP_PROXY,
	http_proxy: process.env.http_proxy,
	HTTPS_PROXY: process.env.HTTPS_PROXY,
	https_proxy: process.env.https_proxy,
	NO_PROXY: process.env.NO_PROXY,
	no_proxy: process.env.no_proxy,
};

afterEach(() => {
	for (const [key, value] of Object.entries(originalEnv)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
});

test("proxyForWebSocketUrl maps websocket transports through proxy envs", () => {
	process.env.HTTPS_PROXY = "http://proxy.example:8080";
	process.env.HTTP_PROXY = "http://plain-proxy.example:8080";
	delete process.env.NO_PROXY;
	delete process.env.no_proxy;
	assert.equal(proxyForWebSocketUrl("wss://chatgpt.com/backend-api/codex/responses"), "http://proxy.example:8080");
	assert.equal(proxyForWebSocketUrl("ws://localhost:8080/socket"), "http://plain-proxy.example:8080");
});

test("webSocketOptionsForUrl passes proxy configuration as an undici dispatcher", async () => {
	process.env.HTTPS_PROXY = "http://proxy.example:8080";
	delete process.env.NO_PROXY;
	const options = await webSocketOptionsForUrl("wss://chatgpt.com/backend-api/codex/responses", { Authorization: "Bearer token" });
	assert.equal(options.headers.Authorization, "Bearer token");
	assert.equal("proxy" in options, false);
	assert.ok(options.dispatcher);
});

test("proxyForWebSocketUrl honors NO_PROXY host entries", () => {
	process.env.HTTPS_PROXY = "http://proxy.example:8080";
	process.env.NO_PROXY = ".chatgpt.com,localhost";
	assert.equal(proxyForWebSocketUrl("wss://chatgpt.com/backend-api/codex/responses"), undefined);
	assert.equal(proxyForWebSocketUrl("wss://api.chatgpt.com/backend-api/codex/responses"), undefined);
});
