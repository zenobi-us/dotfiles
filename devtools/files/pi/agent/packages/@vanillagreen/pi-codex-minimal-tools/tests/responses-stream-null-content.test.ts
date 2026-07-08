import assert from "node:assert/strict";
import test from "node:test";
import { processResponsesStream } from "../src/providers/openai-responses-shared.js";

async function* asAsyncIterable(events: any[]) {
	for (const event of events) yield event;
}

function createAssistantOutput() {
	return {
		role: "assistant",
		content: [],
		api: "openai-codex-responses",
		provider: "openai-codex",
		model: "gpt-5.5",
		usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
		stopReason: "stop",
		timestamp: Date.now(),
	} as any;
}

const model = {
	provider: "openai-codex",
	api: "openai-codex-responses",
	id: "gpt-5.5",
	input: ["text"],
	reasoning: true,
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
} as any;

// earendil-works/pi#5819: OpenAI-compatible streams (e.g. vLLM) can emit
// reasoning -> empty message (content: null) -> function_call. Before the null
// guard, the message branch of response.output_item.done did item.content.map()
// with no guard, threw TypeError, aborted the stream, and silently dropped the
// tool call. This asserts the tool call survives a null-content message item.
test("processResponsesStream tolerates a null-content message item before a function_call", async () => {
	const output = createAssistantOutput();

	await processResponsesStream(
		asAsyncIterable([
			{ type: "response.created", response: { id: "resp_1" } },
			{ type: "response.output_item.added", output_index: 0, item: { type: "message", id: "msg_1" } },
			{ type: "response.output_item.done", output_index: 0, item: { type: "message", id: "msg_1", content: null } },
			{ type: "response.output_item.added", output_index: 1, item: { type: "function_call", id: "fc_1", call_id: "call_1", name: "read", arguments: "" } },
			{ type: "response.function_call_arguments.done", output_index: 1, arguments: '{"path":"/tmp/x"}' },
			{ type: "response.output_item.done", output_index: 1, item: { type: "function_call", id: "fc_1", call_id: "call_1", name: "read", arguments: '{"path":"/tmp/x"}' } },
			{ type: "response.completed", response: { id: "resp_1", status: "completed", usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0, input_tokens_details: { cached_tokens: 0 } } } },
		]),
		output,
		{ push() {} } as any,
		model,
	);

	const toolCalls = output.content.filter((block: any) => block.type === "toolCall");
	assert.equal(toolCalls.length, 1, "tool call should survive a null-content message item");
	assert.equal(toolCalls[0].name, "read");
	assert.deepEqual(toolCalls[0].arguments, { path: "/tmp/x" });
	assert.equal(output.stopReason, "toolUse");

	const textBlocks = output.content.filter((block: any) => block.type === "text");
	assert.equal(textBlocks[0]?.text, "", "null message content collapses to empty text");
});

test("processResponsesStream records reasoning token usage and incomplete stop reason", async () => {
	const output = createAssistantOutput();

	await processResponsesStream(
		asAsyncIterable([
			{ type: "response.created", response: { id: "resp_2" } },
			{ type: "response.output_item.added", output_index: 0, item: { type: "reasoning", id: "rs_1" } },
			{ type: "response.reasoning_text.delta", output_index: 0, delta: "hidden chain" },
			{ type: "response.output_item.done", output_index: 0, item: { type: "reasoning", id: "rs_1", summary: [], content: [{ text: "preserved reasoning" }] } },
			{ type: "response.incomplete", response: { id: "resp_2", status: "incomplete", usage: { input_tokens: 11, output_tokens: 7, total_tokens: 18, input_tokens_details: { cached_tokens: 3 }, output_tokens_details: { reasoning_tokens: 5 } } } },
		]),
		output,
		{ push() {} } as any,
		model,
	);

	assert.equal(output.stopReason, "length");
	assert.equal(output.usage.input, 8);
	assert.equal((output.usage as any).reasoning, 5);
	const thinking = output.content.find((block: any) => block.type === "thinking") as any;
	assert.equal(thinking.thinking, "preserved reasoning");
});

test("processResponsesStream fails when stream ends before terminal response event", async () => {
	const output = createAssistantOutput();
	await assert.rejects(
		() => processResponsesStream(
			asAsyncIterable([
				{ type: "response.created", response: { id: "resp_missing_terminal" } },
				{ type: "response.output_item.added", output_index: 0, item: { type: "message", id: "msg_1" } },
				{ type: "response.output_text.delta", output_index: 0, content_index: 0, delta: "partial" },
			]),
			output,
			{ push() {} } as any,
			model,
		),
		/OpenAI Responses stream ended before a terminal response event/,
	);
});
