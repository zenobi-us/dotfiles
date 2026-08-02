import assert from "node:assert/strict";
import test from "node:test";

import { retryAssistantCallCompat } from "../extensions/qol/pi-ai-compat.ts";

function assistant(stopReason: "stop" | "error" | "aborted", errorMessage?: string): any {
	return {
		api: "test",
		provider: "test",
		model: "test",
		role: "assistant",
		content: [],
		stopReason,
		errorMessage,
		usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
		timestamp: Date.now(),
	};
}

test("uses Pi retry helper with standard retry defaults", async () => {
	let policy: unknown;
	let calls = 0;
	const result = await retryAssistantCallCompat(
		async () => {
			calls += 1;
			return assistant("stop");
		},
		undefined,
		undefined,
		{ root: { retryAssistantCall: async (produce: () => Promise<any>, nextPolicy: unknown) => {
			policy = nextPolicy;
			return produce();
		} } },
	);
	assert.equal(result.stopReason, "stop");
	assert.equal(calls, 1);
	assert.deepEqual(policy, { enabled: true, maxRetries: 3, baseDelayMs: 2000 });
});

test("falls back to one direct call when running on older Pi versions", async () => {
	let calls = 0;
	const result = await retryAssistantCallCompat(
		async () => {
			calls += 1;
			return assistant("stop");
		},
		undefined,
		undefined,
		{ root: {} },
	);
	assert.equal(result.stopReason, "stop");
	assert.equal(calls, 1);
});

test("forwards abort signal and retry callbacks", async () => {
	const controller = new AbortController();
	const scheduled: string[] = [];
	await retryAssistantCallCompat(
		async () => assistant("error", "temporary"),
		controller.signal,
		{ onRetryScheduled: (_attempt, _max, _delay, message) => scheduled.push(message) },
		{ root: { retryAssistantCall: async (_produce: () => Promise<any>, _policy: unknown, signal: AbortSignal, callbacks: any) => {
			assert.equal(signal, controller.signal);
			await callbacks?.onRetryScheduled?.(1, 3, 2000, "temporary");
			return assistant("error", "temporary");
		} } },
	);
	assert.deepEqual(scheduled, ["temporary"]);
});

test("returns a successful retry outcome", async () => {
	let calls = 0;
	const result = await retryAssistantCallCompat(
		async () => {
			calls += 1;
			return calls === 1 ? assistant("error", "temporary") : assistant("stop");
		},
		undefined,
		undefined,
		{ root: { retryAssistantCall: async (produce: () => Promise<any>, _policy: unknown) => {
			const first = await produce();
			return first.stopReason === "error" ? produce() : first;
		} } },
	);
	assert.equal(result.stopReason, "stop");
	assert.equal(calls, 2);
});

test("preserves aborted retry outcomes", async () => {
	const result = await retryAssistantCallCompat(
		async () => assistant("error", "temporary"),
		new AbortController().signal,
		undefined,
		{ root: { retryAssistantCall: async () => assistant("aborted") } },
	);
	assert.equal(result.stopReason, "aborted");
	assert.equal(result.errorMessage, undefined);
});