import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	createRateLimitAutoResumeController,
	extractResetAtFromHeaders,
	extractResetAtFromText,
	looksLikeRateLimitText,
	parseDurationLikeMs,
	type RateLimitClock,
} from "../extensions/qol/rate-limit-auto-resume.ts";

interface FakeTimer {
	callback: () => void;
	cleared: boolean;
	delayMs: number;
	unref: () => void;
}

class FakeClock implements RateLimitClock {
	nowMs = Date.UTC(2026, 4, 23, 12, 0, 0);
	timers: FakeTimer[] = [];

	now(): number { return this.nowMs; }

	setTimeout(callback: () => void, delayMs: number): FakeTimer {
		const timer = { callback, cleared: false, delayMs, unref() {} };
		this.timers.push(timer);
		return timer;
	}

	clearTimeout(timer: FakeTimer): void { timer.cleared = true; }

	runNext(): void {
		const timer = this.timers.shift();
		if (!timer || timer.cleared) return;
		this.nowMs += timer.delayMs;
		timer.callback();
	}
}

let workdir = "";
const originalAgentDir = process.env.PI_CODING_AGENT_DIR;
const originalHome = process.env.HOME;

function writeQolConfig(values: Record<string, unknown>): void {
	writeFileSync(
		join(workdir, "settings.json"),
		`${JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-qol": values } } } }, null, 2)}\n`,
		"utf8",
	);
}

function makeHarness(clock = new FakeClock()) {
	const sent: Array<{ content: string; options: unknown }> = [];
	const notifications: Array<{ message: string; level: string }> = [];
	const pi: any = {
		sendUserMessage(content: string, options: unknown) { sent.push({ content, options }); },
	};
	const ctx: any = {
		cwd: workdir,
		hasPendingMessages: () => false,
		hasUI: true,
		isIdle: () => true,
		sessionManager: { getBranch: () => [] },
		ui: { notify: (message: string, level: string) => notifications.push({ message, level }) },
	};
	return { clock, controller: createRateLimitAutoResumeController(pi, clock), ctx, notifications, sent };
}

beforeEach(() => {
	workdir = mkdtempSync(join(tmpdir(), "pi-qol-rate-limit-"));
	mkdirSync(join(workdir, ".pi"), { recursive: true });
	process.env.PI_CODING_AGENT_DIR = workdir;
	process.env.HOME = workdir;
});

afterEach(() => {
	if (workdir) rmSync(workdir, { force: true, recursive: true });
	if (originalAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
	else process.env.PI_CODING_AGENT_DIR = originalAgentDir;
	if (originalHome === undefined) delete process.env.HOME;
	else process.env.HOME = originalHome;
});

test("parses common provider reset hints", () => {
	const now = Date.UTC(2026, 4, 23, 12, 0, 0);
	expect(parseDurationLikeMs("6m0s")).toBe(6 * 60 * 1000);
	expect(extractResetAtFromHeaders({ "retry-after": "60" }, now)).toEqual({ resetAt: now + 60_000, source: "retry-after" });
	expect(extractResetAtFromHeaders({ "retry-after-ms": "1500" }, now)).toEqual({ resetAt: now + 1500, source: "retry-after-ms" });
	expect(extractResetAtFromHeaders({ "x-ratelimit-reset-requests": "6m0s" }, now)).toEqual({ resetAt: now + 360_000, source: "x-ratelimit-reset-requests" });
	expect(extractResetAtFromHeaders({ "anthropic-ratelimit-requests-reset": "2026-05-23T12:05:00Z" }, now)).toEqual({ resetAt: now + 300_000, source: "anthropic-ratelimit-requests-reset" });
});

test("detects rate-limit text and reset times", () => {
	const now = Date.UTC(2026, 4, 23, 12, 0, 0);
	expect(looksLikeRateLimitText("Error: 429 Too Many Requests")).toBe(true);
	expect(looksLikeRateLimitText("normal tool failure")).toBe(false);
	expect(extractResetAtFromText("Rate limited. Try again in 2 minutes", now)).toEqual({ resetAt: now + 120_000, source: "text-duration" });
});

test("schedules configured resume message at reset plus buffer", async () => {
	writeQolConfig({
		"rateLimitAutoResume.bufferSeconds": 10,
		"rateLimitAutoResume.enabled": true,
		"rateLimitAutoResume.message": "resume now",
	});
	const { clock, controller, ctx, notifications, sent } = makeHarness();
	controller.noteAgentStart(ctx);
	controller.noteExternalRateLimitEvent({ resetAtMs: clock.now() + 60_000, source: "test", status: "rejected" }, ctx);
	controller.noteMessageEnd({ message: { errorMessage: "You're out of extra usage", role: "assistant", stopReason: "error" } }, ctx);
	const scheduled = controller.noteAgentEnd({ messages: [{ errorMessage: "429 rate limit", role: "assistant" }] }, ctx);

	expect(scheduled).toBe(true);
	expect(clock.timers[0]?.delayMs).toBe(70_000);
	expect(controller.renderPreviewLines(200).join("\n")).toContain("[rate-limit]");
	expect(notifications[0]?.message).toContain("Auto-resume scheduled");

	clock.runNext();
	await Promise.resolve();
	expect(sent).toEqual([{ content: "resume now", options: undefined }]);
});

test("does not schedule while disabled", () => {
	writeQolConfig({ "rateLimitAutoResume.enabled": false });
	const { clock, controller, ctx, sent } = makeHarness();
	controller.noteAgentStart(ctx);
	controller.noteExternalRateLimitEvent({ resetAtMs: clock.now() + 60_000, status: "rejected" }, ctx);
	expect(controller.noteAgentEnd({ messages: [{ errorMessage: "429 rate limit", role: "assistant" }] }, ctx)).toBe(false);
	expect(sent).toHaveLength(0);
	expect(clock.timers).toHaveLength(0);
});

test("does not schedule after a successful assistant turn even if a transient 429 hint was seen", () => {
	writeQolConfig({ "rateLimitAutoResume.enabled": true });
	const { clock, controller, ctx } = makeHarness();
	controller.noteAgentStart(ctx);
	controller.noteProviderResponse({ headers: { "retry-after": "60" }, status: 429 }, ctx);
	const scheduled = controller.noteAgentEnd({ messages: [{ content: [{ text: "done", type: "text" }], role: "assistant", stopReason: "stop" }] }, ctx);

	expect(scheduled).toBe(false);
	expect(clock.timers).toHaveLength(0);
});

test("does not send a pending auto-resume after the setting is disabled", async () => {
	writeQolConfig({ "rateLimitAutoResume.enabled": true });
	const { clock, controller, ctx, sent } = makeHarness();
	controller.noteAgentStart(ctx);
	controller.noteExternalRateLimitEvent({ resetAtMs: clock.now() + 60_000, status: "rejected" }, ctx);
	controller.noteAgentEnd({ messages: [{ errorMessage: "429 rate limit", role: "assistant" }] }, ctx);

	writeQolConfig({ "rateLimitAutoResume.enabled": false });
	clock.runNext();
	await Promise.resolve();

	expect(sent).toHaveLength(0);
	expect(controller.renderPreviewLines(200)).toEqual([]);
});

test("cancels pending auto-resume when a newer turn starts", async () => {
	writeQolConfig({ "rateLimitAutoResume.enabled": true });
	const { clock, controller, ctx, sent } = makeHarness();
	controller.noteAgentStart(ctx);
	controller.noteExternalRateLimitEvent({ resetAtMs: clock.now() + 60_000, status: "rejected" }, ctx);
	controller.noteAgentEnd({ messages: [{ errorMessage: "429 rate limit", role: "assistant" }] }, ctx);

	controller.noteAgentStart(ctx);
	clock.runNext();
	await Promise.resolve();

	expect(sent).toHaveLength(0);
	expect(controller.renderPreviewLines(200)).toEqual([]);
});
