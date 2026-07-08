import { truncateToWidth } from "@earendil-works/pi-tui";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { ansiRed } from "./ansi.js";
import { boundedSettingNumber, settingBoolean, settingString } from "./settings.js";
import { stringifyError } from "./util.js";

export const RATE_LIMIT_AUTO_RESUME_EVENT = "vstack:rate-limit";
export const DEFAULT_RATE_LIMIT_RESUME_MESSAGE = "Hit API rate limit. It has been reset. Continue";

const MAX_TIMER_DELAY_MS = 2_147_000_000;
const DEFAULT_BUFFER_SECONDS = 10;
const DEFAULT_MAX_DELAY_MINUTES = 24 * 60;
const RATE_LIMIT_TOKEN = "[rate-limit]";

interface RateLimitTimer {
	unref?: () => void;
}

export interface RateLimitClock {
	now(): number;
	setTimeout(callback: () => void, delayMs: number): RateLimitTimer;
	clearTimeout(timer: RateLimitTimer): void;
}

export interface RateLimitHint {
	message?: string;
	model?: string;
	observedAt: number;
	provider?: string;
	reason?: string;
	resetAt?: number;
	source: string;
	turnId: number;
}

interface PendingRateLimitResume {
	dueAt: number;
	message: string;
	reason?: string;
	resetAt: number;
	source: string;
	timer?: RateLimitTimer;
	turnId: number;
}

const DEFAULT_CLOCK: RateLimitClock = {
	now: () => Date.now(),
	setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
	clearTimeout: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
	const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
	return Number.isFinite(parsed) ? parsed : undefined;
}

function allHeaderValues(headers: unknown, key: string): string[] {
	const wanted = key.toLowerCase();
	if (!headers || typeof headers !== "object") return [];
	const anyHeaders = headers as any;
	try {
		if (typeof anyHeaders.get === "function") {
			const value = anyHeaders.get(key) ?? anyHeaders.get(wanted);
			if (typeof value === "string" && value.trim()) return [value.trim()];
		}
	} catch {
		// Fall through to object form.
	}
	const out: string[] = [];
	for (const [rawKey, rawValue] of Object.entries(headers as Record<string, unknown>)) {
		if (rawKey.toLowerCase() !== wanted) continue;
		if (Array.isArray(rawValue)) {
			for (const item of rawValue) if (typeof item === "string" && item.trim()) out.push(item.trim());
		} else if (typeof rawValue === "string" && rawValue.trim()) out.push(rawValue.trim());
		else if (typeof rawValue === "number" && Number.isFinite(rawValue)) out.push(String(rawValue));
	}
	return out;
}

export function looksLikeRateLimitText(text: string): boolean {
	return /\b(rate[-\s]?limit(?:ed)?|too many requests|\b429\b|quota exceeded|resource exhausted|try again later|retry[-\s]?after|out of extra usage|extra usage)\b/i.test(text);
}

function parseUnitDurationMs(amount: number, unit: string | undefined, defaultUnit: "ms" | "s" | "m" = "s"): number | undefined {
	if (!Number.isFinite(amount) || amount < 0) return undefined;
	const normalized = (unit ?? defaultUnit).toLowerCase();
	const multiplier = ["ms", "msec", "msecs", "millisecond", "milliseconds"].includes(normalized)
		? 1
		: ["s", "sec", "secs", "second", "seconds"].includes(normalized)
			? 1000
			: ["m", "min", "mins", "minute", "minutes"].includes(normalized)
				? 60 * 1000
				: ["h", "hr", "hrs", "hour", "hours"].includes(normalized)
					? 60 * 60 * 1000
					: ["d", "day", "days"].includes(normalized)
						? 24 * 60 * 60 * 1000
						: undefined;
	if (!multiplier) return undefined;
	const delay = Math.round(amount * multiplier);
	return Number.isFinite(delay) ? delay : undefined;
}

export function parseDurationLikeMs(value: string, defaultUnit: "ms" | "s" | "m" = "s"): number | undefined {
	const text = value.trim().toLowerCase();
	if (!text) return undefined;
	if (/^\d+(?:\.\d+)?$/.test(text)) return parseUnitDurationMs(Number(text), undefined, defaultUnit);
	const single = text.match(/^(\d+(?:\.\d+)?)\s*(ms|msec|msecs|milliseconds?|s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?|d|days?)$/i);
	if (single) return parseUnitDurationMs(Number(single[1]), single[2], defaultUnit);
	let total = 0;
	let matched = false;
	const re = /(\d+(?:\.\d+)?)\s*(ms|msec|msecs|milliseconds?|s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?|d|days?)/gi;
	for (const match of text.matchAll(re)) {
		const part = parseUnitDurationMs(Number(match[1]), match[2], defaultUnit);
		if (part === undefined) return undefined;
		total += part;
		matched = true;
	}
	return matched && Number.isFinite(total) ? Math.round(total) : undefined;
}

export function parseRetryAfterMs(value: string, now = Date.now(), defaultUnit: "ms" | "s" | "m" = "s"): number | undefined {
	const duration = parseDurationLikeMs(value, defaultUnit);
	if (duration !== undefined) return now + duration;
	const parsedDate = Date.parse(value);
	return Number.isFinite(parsedDate) ? parsedDate : undefined;
}

export function parseResetValueMs(value: string, now = Date.now()): number | undefined {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const numeric = Number(trimmed);
	if (Number.isFinite(numeric)) {
		if (numeric > 1_000_000_000_000) return numeric;
		if (numeric > 1_000_000_000) return numeric * 1000;
		return now + numeric * 1000;
	}
	const parsedDate = Date.parse(trimmed);
	if (Number.isFinite(parsedDate)) return parsedDate;
	const duration = parseDurationLikeMs(trimmed, "s");
	return duration !== undefined ? now + duration : undefined;
}

export function extractResetAtFromHeaders(headers: unknown, now = Date.now()): { resetAt: number; source: string } | undefined {
	for (const value of allHeaderValues(headers, "retry-after-ms")) {
		const resetAt = parseRetryAfterMs(value, now, "ms");
		if (resetAt !== undefined) return { resetAt, source: "retry-after-ms" };
	}
	for (const value of allHeaderValues(headers, "retry-after")) {
		const resetAt = parseRetryAfterMs(value, now, "s");
		if (resetAt !== undefined) return { resetAt, source: "retry-after" };
	}
	const resetHeaders = [
		"x-ratelimit-reset",
		"x-rate-limit-reset",
		"ratelimit-reset",
		"x-ratelimit-reset-requests",
		"x-ratelimit-reset-tokens",
		"anthropic-ratelimit-requests-reset",
		"anthropic-ratelimit-tokens-reset",
		"anthropic-ratelimit-input-tokens-reset",
		"anthropic-ratelimit-output-tokens-reset",
	];
	for (const header of resetHeaders) {
		for (const value of allHeaderValues(headers, header)) {
			const resetAt = parseResetValueMs(value, now);
			if (resetAt !== undefined) return { resetAt, source: header };
		}
	}
	return undefined;
}

function parseClockReset(text: string, now = Date.now()): number | undefined {
	const match = text.match(/\bresets?(?:\s+at)?\s+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?\b/i);
	if (!match) return undefined;
	let hour = Number(match[1]);
	const minute = Number(match[2] ?? "0");
	const second = Number(match[3] ?? "0");
	const meridiem = match[4]?.toLowerCase();
	if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second)) return undefined;
	if (minute > 59 || second > 59) return undefined;
	if (meridiem) {
		if (hour < 1 || hour > 12) return undefined;
		if (meridiem === "pm" && hour !== 12) hour += 12;
		if (meridiem === "am" && hour === 12) hour = 0;
	} else if (hour > 23) return undefined;
	const date = new Date(now);
	date.setHours(hour, minute, second, 0);
	if (date.getTime() <= now) date.setDate(date.getDate() + 1);
	return date.getTime();
}

export function extractResetAtFromText(text: string, now = Date.now()): { resetAt: number; source: string } | undefined {
	const iso = text.match(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})\b/);
	if (iso) {
		const resetAt = Date.parse(iso[0]);
		if (Number.isFinite(resetAt)) return { resetAt, source: "text-iso" };
	}
	const durationMatch = text.match(/\b(?:retry(?:\s+after|\s+in)?|try again in|wait)\s+(\d+(?:\.\d+)?\s*(?:ms|msec|msecs|milliseconds?|s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?|d|days?)(?:\s*\d+(?:\.\d+)?\s*(?:ms|msec|msecs|milliseconds?|s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?|d|days?))*)\b/i);
	if (durationMatch) {
		const duration = parseDurationLikeMs(durationMatch[1], "s");
		if (duration !== undefined) return { resetAt: now + duration, source: "text-duration" };
	}
	const clock = parseClockReset(text, now);
	return clock !== undefined ? { resetAt: clock, source: "text-clock" } : undefined;
}

function messageText(message: any): string {
	const parts: string[] = [];
	if (typeof message?.errorMessage === "string") parts.push(message.errorMessage);
	if (typeof message?.content === "string") parts.push(message.content);
	else if (Array.isArray(message?.content)) {
		for (const block of message.content) {
			if (typeof block === "string") parts.push(block);
			else if (block?.type === "text" && typeof block.text === "string") parts.push(block.text);
		}
	}
	return parts.filter(Boolean).join("\n");
}

function lastAssistantMessage(event: any, ctx: ExtensionContext): any | undefined {
	const eventMessages = Array.isArray(event?.messages) ? event.messages : [];
	for (let index = eventMessages.length - 1; index >= 0; index -= 1) {
		const message = eventMessages[index];
		if (message?.role === "assistant") return message;
	}
	const branch = ctx.sessionManager.getBranch?.() ?? [];
	for (let index = branch.length - 1; index >= 0; index -= 1) {
		const entry = branch[index] as any;
		if (entry?.type === "message" && entry.message?.role === "assistant") return entry.message;
	}
	return undefined;
}

function formatDueTime(timestamp: number): string {
	return new Date(timestamp).toLocaleString(undefined, {
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		month: "short",
		timeZoneName: "short",
	});
}

function previewMessage(message: string, max = 72): string {
	const singleLine = message.replace(/\s+/g, " ").trim();
	return singleLine.length <= max ? singleLine : `${singleLine.slice(0, Math.max(0, max - 1))}…`;
}

function settingsEnabled(ctx: ExtensionContext): boolean {
	return settingBoolean("rateLimitAutoResume.enabled", false, ctx.cwd);
}

function settingsNotify(ctx: ExtensionContext): boolean {
	return settingBoolean("rateLimitAutoResume.notify", true, ctx.cwd);
}

function settingsMessage(ctx: ExtensionContext): string {
	return settingString("rateLimitAutoResume.message", DEFAULT_RATE_LIMIT_RESUME_MESSAGE, ctx.cwd);
}

function settingsBufferMs(ctx: ExtensionContext): number {
	return boundedSettingNumber("rateLimitAutoResume.bufferSeconds", DEFAULT_BUFFER_SECONDS, 0, 600, ctx.cwd) * 1000;
}

function settingsMaxDelayMs(ctx: ExtensionContext): number {
	return boundedSettingNumber("rateLimitAutoResume.maxDelayMinutes", DEFAULT_MAX_DELAY_MINUTES, 1, 30 * 24 * 60, ctx.cwd) * 60 * 1000;
}

export function createRateLimitAutoResumeController(pi: ExtensionAPI, clock: RateLimitClock = DEFAULT_CLOCK) {
	let onChange: (() => void) | undefined;
	let turnId = 0;
	let latestHint: RateLimitHint | undefined;
	let pending: PendingRateLimitResume | undefined;

	const notifyChanged = (): void => {
		try { onChange?.(); }
		catch { /* UI refresh must never break recovery state. */ }
	};

	const clearPendingTimer = (): void => {
		if (!pending?.timer) return;
		clock.clearTimeout(pending.timer);
		pending.timer = undefined;
	};

	const clearPending = (): void => {
		const hadPending = Boolean(pending);
		clearPendingTimer();
		pending = undefined;
		if (hadPending) notifyChanged();
	};

	const noteHint = (hint: Omit<RateLimitHint, "observedAt" | "turnId"> & { observedAt?: number; turnId?: number }): void => {
		if (hint.resetAt !== undefined && (!Number.isFinite(hint.resetAt) || hint.resetAt <= 0)) return;
		latestHint = {
			...hint,
			observedAt: hint.observedAt ?? clock.now(),
			turnId: hint.turnId ?? turnId,
		};
	};

	const deliverPending = async (snapshot: PendingRateLimitResume, ctx: ExtensionContext): Promise<void> => {
		if (pending !== snapshot) return;
		if (snapshot.turnId !== turnId || !settingsEnabled(ctx)) {
			clearPending();
			return;
		}
		if (clock.now() < snapshot.dueAt) {
			armPending(snapshot, ctx);
			return;
		}
		clearPending();
		try {
			let idle = true;
			try { idle = ctx.isIdle?.() ?? true; }
			catch { idle = false; }
			await Promise.resolve(idle ? pi.sendUserMessage(snapshot.message) : pi.sendUserMessage(snapshot.message, { deliverAs: "followUp" }));
			if (ctx.hasUI && settingsNotify(ctx)) ctx.ui.notify(`${RATE_LIMIT_TOKEN} Auto-resume sent after rate-limit reset.`, "info");
		} catch (error) {
			if (ctx.hasUI) ctx.ui.notify(`${RATE_LIMIT_TOKEN} Auto-resume failed: ${stringifyError(error)}`, "error");
		}
	};

	function armPending(snapshot: PendingRateLimitResume, ctx: ExtensionContext): void {
		clearPendingTimer();
		const remaining = Math.max(0, snapshot.dueAt - clock.now());
		snapshot.timer = clock.setTimeout(() => { void deliverPending(snapshot, ctx); }, Math.min(remaining, MAX_TIMER_DELAY_MS));
		snapshot.timer.unref?.();
	}

	const scheduleFromHint = (hint: RateLimitHint, ctx: ExtensionContext): boolean => {
		if (!settingsEnabled(ctx)) return false;
		if (hint.turnId !== turnId) return false;
		if (ctx.hasPendingMessages?.()) return false;
		if (hint.resetAt === undefined || !Number.isFinite(hint.resetAt)) return false;
		const dueAt = Math.max(clock.now() + 1000, hint.resetAt + settingsBufferMs(ctx));
		const delay = dueAt - clock.now();
		if (delay > settingsMaxDelayMs(ctx)) return false;
		const message = settingsMessage(ctx);
		clearPendingTimer();
		pending = { dueAt, message, reason: hint.reason, resetAt: hint.resetAt, source: hint.source, turnId };
		armPending(pending, ctx);
		notifyChanged();
		if (ctx.hasUI && settingsNotify(ctx)) {
			ctx.ui.notify(`${RATE_LIMIT_TOKEN} Rate limit hit. Auto-resume scheduled for ${formatDueTime(dueAt)}.`, "warning");
		}
		return true;
	};

	return {
		enabled(ctx: ExtensionContext): boolean {
			return settingsEnabled(ctx);
		},
		clearTimers(): void {
			clearPending();
		},
		noteAgentStart(_ctx: ExtensionContext): void {
			turnId += 1;
			latestHint = undefined;
			clearPending();
		},
		noteAgentEnd(event: any, ctx: ExtensionContext): boolean {
			const assistant = lastAssistantMessage(event, ctx);
			const text = messageText(assistant);
			const textShowsRateLimit = Boolean(text && looksLikeRateLimitText(text));
			if (textShowsRateLimit) {
				const reset = extractResetAtFromText(text, clock.now());
				noteHint({
					message: text,
					model: stringValue(assistant?.model),
					provider: stringValue(assistant?.provider),
					reason: "assistant error",
					resetAt: reset?.resetAt ?? latestHint?.resetAt,
					source: reset?.source ?? latestHint?.source ?? "assistant-message",
				});
			}
			const stoppedOnHint = !assistant || assistant?.stopReason === "error" || assistant?.stopReason === "aborted";
			if (!textShowsRateLimit && !stoppedOnHint) return false;
			return latestHint ? scheduleFromHint(latestHint, ctx) : false;
		},
		noteMessageEnd(event: any, _ctx: ExtensionContext): void {
			const message = event?.message;
			if (!message || message.role !== "assistant") return;
			const text = messageText(message);
			if (!looksLikeRateLimitText(text)) return;
			const reset = extractResetAtFromText(text, clock.now());
			noteHint({
				message: text,
				model: stringValue(message.model),
				provider: stringValue(message.provider),
				reason: "assistant message",
				resetAt: reset?.resetAt ?? latestHint?.resetAt,
				source: reset?.source ?? latestHint?.source ?? "message_end",
			});
		},
		noteProviderResponse(event: any, _ctx: ExtensionContext): void {
			if (Number(event?.status) !== 429) return;
			const reset = extractResetAtFromHeaders(event?.headers, clock.now());
			noteHint({
				model: stringValue(event?.model?.id) ?? stringValue(event?.model),
				provider: stringValue(event?.provider?.id) ?? stringValue(event?.provider),
				reason: "HTTP 429",
				resetAt: reset?.resetAt ?? latestHint?.resetAt,
				source: reset?.source ?? latestHint?.source ?? "after_provider_response",
			});
		},
		noteExternalRateLimitEvent(payload: unknown, _ctx: ExtensionContext): void {
			const event = asRecord(payload);
			if (!event) return;
			const status = stringValue(event.status);
			if (status && status !== "rejected" && status !== "rate_limited" && status !== "error") return;
			const rawReset = numberValue(event.resetAtMs) ?? numberValue(event.resetAtUnixMs);
			const textReset = stringValue(event.resetAt) ?? stringValue(event.resetsAt);
			const parsedTextReset = textReset ? parseResetValueMs(textReset, clock.now()) : undefined;
			const resetAt = rawReset ?? parsedTextReset;
			noteHint({
				message: stringValue(event.message),
				model: stringValue(event.model),
				provider: stringValue(event.provider),
				reason: stringValue(event.reason) ?? stringValue(event.rateLimitType),
				resetAt: resetAt ?? latestHint?.resetAt,
				source: stringValue(event.source) ?? latestHint?.source ?? RATE_LIMIT_AUTO_RESUME_EVENT,
			});
		},
		renderPreviewLines(width: number): string[] {
			if (!pending) return [];
			const line = `| ${RATE_LIMIT_TOKEN} Auto-resume ${formatDueTime(pending.dueAt)} — ${previewMessage(pending.message)}`;
			return [truncateToWidth(ansiRed(line), width, "")];
		},
		setOnChange(callback: (() => void) | undefined): void {
			onChange = callback;
		},
		// Test helper / low-level extension bridge.
		scheduleForHint(hint: RateLimitHint, ctx: ExtensionContext): boolean {
			latestHint = hint;
			return scheduleFromHint(hint, ctx);
		},
	};
}
