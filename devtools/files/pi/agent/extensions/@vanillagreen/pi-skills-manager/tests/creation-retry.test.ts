import assert from "node:assert/strict";
import test from "node:test";

import { retrySkillGenerationCompat } from "../extensions/skills-manager/pi-ai-compat.ts";
import { resolveSkillDraft } from "../extensions/skills-manager/creation-fallback.ts";

test("uses Pi retry defaults for skill generation", async () => {
	let receivedPolicy: unknown;
	const response = { stopReason: "stop", content: [] };
	const result = await retrySkillGenerationCompat(
		async () => response,
		undefined,
		undefined,
		{ root: { retryAssistantCall: async (produce: () => Promise<any>, policy: unknown) => {
			receivedPolicy = policy;
			return produce();
		} } },
	);
	assert.equal(result, response);
	assert.deepEqual(receivedPolicy, { enabled: true, maxRetries: 3, baseDelayMs: 2000 });
});

test("falls back to direct generation on older Pi versions", async () => {
	let calls = 0;
	await retrySkillGenerationCompat(
		async () => {
			calls += 1;
			return { stopReason: "stop", content: [] };
		},
		undefined,
		undefined,
		{ root: {} },
	);
	assert.equal(calls, 1);
});

test("forwards retry notifications", async () => {
	const notices: string[] = [];
	await retrySkillGenerationCompat(
		async () => ({ stopReason: "stop", content: [] }),
		undefined,
		(_attempt, _max, _delay, message) => notices.push(message),
		{ root: { retryAssistantCall: async (produce: () => Promise<any>, _policy: unknown, _signal: AbortSignal | undefined, callbacks: any) => {
			await callbacks?.onRetryScheduled?.(1, 3, 2000, "temporary");
			return produce();
		} } },
	);
	assert.deepEqual(notices, ["temporary"]);
});

test("generation failures report reason before returning fallback", async () => {
	const reasons: string[] = [];
	const draft = await resolveSkillDraft(
		async () => { throw new Error("provider exhausted"); },
		() => "fallback",
		undefined,
		(error) => reasons.push(error instanceof Error ? error.message : String(error)),
	);
	assert.equal(draft, "fallback");
	assert.deepEqual(reasons, ["provider exhausted"]);
});

test("aborted generation returns null without fallback notification", async () => {
	const controller = new AbortController();
	controller.abort();
	let generated = false;
	let notified = false;
	const draft = await resolveSkillDraft(
		async () => {
			generated = true;
			return "generated";
		},
		() => "fallback",
		controller.signal,
		() => { notified = true; },
	);
	assert.equal(draft, null);
	assert.equal(generated, false);
	assert.equal(notified, false);
});

test("AbortError during generation returns null without fallback", async () => {
	let notified = false;
	const error = new Error("Generation aborted");
	error.name = "AbortError";
	const draft = await resolveSkillDraft(
		async () => { throw error; },
		() => "fallback",
		undefined,
		() => { notified = true; },
	);
	assert.equal(draft, null);
	assert.equal(notified, false);
});