import assert from "node:assert/strict";
import test from "node:test";
import { rewriteNativeOpenAiTools } from "../src/provider-native-tools.js";

test("rewriteNativeOpenAiTools rewrites image_generation function tools to native Responses tools", () => {
	const payload = {
		tools: [
			{ type: "function", name: "image_generation", parameters: { output_format: "webp" } },
			{ type: "function", function: { name: "web_search", parameters: {} } },
			{ type: "function", name: "read" },
		],
	};
	const result = rewriteNativeOpenAiTools(payload, { imageModel: "gpt-image-2" });
	assert.deepEqual(result.rewritten, ["image_generation"]);
	assert.deepEqual(result.payload.tools[0], { type: "image_generation", model: "gpt-image-2", output_format: "webp", action: "auto" });
	assert.deepEqual(result.payload.tools[1], { type: "function", function: { name: "web_search", parameters: {} } });
	assert.equal((result.payload.tools[2] as any).name, "read");
});
