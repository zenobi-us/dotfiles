import test from "node:test";
import assert from "node:assert/strict";
import { resolveModel } from "../resolvers.js";
import { resolveTools } from "../resolvers.js";

// resolveModel — still used per-spawn in runtime.ts

test("resolveModel parses provider/id selector", () => {
	const model = resolveModel("anthropic/claude-sonnet-4-5", {
		models: [
			{ provider: "anthropic", id: "claude-sonnet-4-5" },
			{ provider: "openai", id: "gpt-5" },
		],
	});
	assert.equal(model, "anthropic/claude-sonnet-4-5");
});

test("resolveModel throws on unknown model", () => {
	assert.throws(
		() => resolveModel("openai/gpt-99", { models: [{ provider: "anthropic", id: "claude-sonnet-4-5" }] }),
		(err: any) => err.details.code === "MODEL_NOT_FOUND",
	);
});

test("resolveModel works without registry", () => {
	const model = resolveModel("anthropic/claude-sonnet-4-5");
	assert.equal(model, "anthropic/claude-sonnet-4-5");
});

// resolveTools — still used per-spawn in runtime.ts

test("resolveTools forwards requested tools", () => {
	const tools = resolveTools(["read", "bash"], ["read"]);
	assert.deepEqual(tools, ["read", "bash"]);
});

test("resolveTools passes through MCP selectors", () => {
	const tools = resolveTools(["mcp:linear/create_issue"], ["read"]);
	assert.equal(tools[0], "mcp:linear/create_issue");
});

test("resolveTools normalizes case and functions prefix", () => {
	const tools = resolveTools(["Bash", "functions.Read"], ["bash", "read", "write"]);
	assert.deepEqual(tools, ["bash", "read"]);
});

test("resolveTools falls back to active tools", () => {
	const tools = resolveTools(undefined, ["read", "bash"]);
	assert.deepEqual(tools, ["read", "bash"]);
});

test("resolveTools deduplicates", () => {
	const tools = resolveTools(["read", "Read", "READ"], []);
	assert.deepEqual(tools, ["read"]);
});
