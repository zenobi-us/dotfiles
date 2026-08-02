import assert from "node:assert/strict";
import test from "node:test";
import { rewriteNativeOpenAiWebSearch } from "../src/native-openai.js";

test("rewrites function web_search to native OpenAI Responses tool", () => {
	const payload = { tools: [{ type: "function", name: "web_search", parameters: {} }, { type: "function", name: "read" }] };
	const result = rewriteNativeOpenAiWebSearch(payload, { externalWebAccess: false });
	assert.deepEqual(result.rewritten, ["web_search"]);
	assert.deepEqual(result.payload.tools[0], { type: "web_search", external_web_access: false });
	assert.equal((result.payload.tools[1] as any).name, "read");
});
