/** Import-free rate-limit retry decision module. */

export const RATE_LIMIT_STEER_MESSAGE =
	"API rate limit was detected. Try to continue from where you left off." as const;

export const RATE_LIMIT_DEFAULT_MAX_ATTEMPTS = 5;
export const RATE_LIMIT_DEFAULT_BACKOFF_LADDER_SEC = [60, 120, 300, 600, 1800] as const;
export const RATE_LIMIT_RESET_MARGIN_MS = 5_000;
export const RATE_LIMIT_CLOCK_RESET_PAST_TOLERANCE_MS = 10 * 60_000;

export const RATE_LIMIT_ERROR_REGEX =
	/(temporarily limiting requests|rate[\s_-]?limit(?:ed)?|429|529|too many requests|overload(?:ed|ing)?|resource exhausted|stream idle timeout|(?:you(?:['’]?ve|\s+have)\s+hit\s+your\s+(?:session|usage)\s+limit)|\b(?:session|usage)\s+limit\b|[·•]\s*resets\b|\bresets?\s+(?:at\s+)?\d{1,2}(?::\d{2}){0,2}\s*(?:am|pm)?)/i;

export interface RateLimitWatchdogInput {
	event: unknown;
	paneId: string;
	attempt: number;
	lastRetryAt: number | null;
	now: number;
	usageSnapshot?: unknown;
}

export type RateLimitResetSource = "usage-endpoint" | "cli-rpc" | "sdk-rate-limit-event" | "prose-fallback" | "backoff-only";

export interface QuotaWindow {
	id: string;
	title: string;
	usedPercent: number | null;
	resetAtMs: number | null;
	windowSeconds?: number;
	limitReached?: boolean;
}

export interface QuotaSnapshot {
	provider: "claude" | "codex" | "openai" | string;
	source: "usage-endpoint" | "cli-rpc";
	fetchedAtMs: number;
	windows: QuotaWindow[];
	rawShapeVersion?: string;
}

export type RateLimitUsageEndpointSnapshot = QuotaSnapshot;

export interface QuotaSourceFailure {
	source: "quota-source-error";
	provider: string;
	resetSource: "usage-endpoint" | "cli-rpc";
	reason: string;
	status?: number;
	endpoint?: string;
}

export type QuotaSourceResult = QuotaSnapshot | QuotaSourceFailure | null;

export type RateLimitSkipReason = "non-assistant" | "no-stopreason" | "stopreason-mismatch" | "no-prose";

export type RateLimitEventClassification =
	| { isRateLimitEvent: true }
	| { isRateLimitEvent: false; reason: RateLimitSkipReason };

export type RateLimitWatchdogDecision =
	| { kind: "not-rate-limited"; reason: RateLimitSkipReason }
	| {
		kind: "retry-at";
		at: number;
		attempt: number;
		degradedResetSource: boolean;
		hash: string;
		resetAtMs?: number;
		resetSource: RateLimitResetSource;
		steerMessage: typeof RATE_LIMIT_STEER_MESSAGE;
	}
	| { kind: "exhausted"; attempt: number; reason: string };

export interface RateLimitWatchdogEnv {
	maxAttempts?: number;
	backoffLadderSec?: readonly number[];
	enabled?: boolean;
}

type UsageResetCandidate = {
	limitReached: boolean;
	path: string;
	resetAtMs: number;
	title: string;
	utilization: number;
};

interface RateLimitScheduleBasis {
	delayMs: number;
	degradedResetSource: boolean;
	resetAtMs?: number;
	resetSource: RateLimitResetSource;
}

export function rateLimitWatchdogEnabledFromEnv(env: NodeJS.ProcessEnv = process.env): boolean {
	const raw = env.VSTACK_RATE_LIMIT_WATCHDOG?.trim();
	if (raw === undefined || raw === "") return true;
	return raw !== "0" && raw.toLowerCase() !== "false" && raw.toLowerCase() !== "off";
}

export function rateLimitMaxAttemptsFromEnv(env: NodeJS.ProcessEnv = process.env): number {
	const raw = env.VSTACK_RATE_LIMIT_MAX_ATTEMPTS?.trim();
	const parsed = raw ? Number(raw) : Number.NaN;
	if (!Number.isFinite(parsed) || parsed < 1) return RATE_LIMIT_DEFAULT_MAX_ATTEMPTS;
	return Math.floor(parsed);
}

export function rateLimitBackoffLadderFromEnv(env: NodeJS.ProcessEnv = process.env): number[] {
	const raw = env.VSTACK_RATE_LIMIT_BACKOFF_LADDER?.trim();
	if (!raw) return [...RATE_LIMIT_DEFAULT_BACKOFF_LADDER_SEC];
	const parts = raw
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => Number(part))
		.filter((value) => Number.isFinite(value) && value > 0)
		.map((value) => Math.floor(value));
	return parts.length > 0 ? parts : [...RATE_LIMIT_DEFAULT_BACKOFF_LADDER_SEC];
}

export function classifyRateLimitEvent(event: unknown): RateLimitEventClassification {
	const message = readAssistantMessage(event);
	if (!message) return { isRateLimitEvent: false, reason: "non-assistant" };
	const stopReason = readAssistantStopReason(message);
	if (!stopReason) return { isRateLimitEvent: false, reason: "no-stopreason" };
	if (stopReason !== "error") return { isRateLimitEvent: false, reason: "stopreason-mismatch" };
	const text = extractAssistantErrorText(message);
	if (!text || !RATE_LIMIT_ERROR_REGEX.test(text)) return { isRateLimitEvent: false, reason: "no-prose" };
	return { isRateLimitEvent: true };
}

export function isRateLimitEvent(event: unknown): boolean {
	return classifyRateLimitEvent(event).isRateLimitEvent;
}

export function isAssistantMessageEvent(event: unknown): boolean {
	return readAssistantMessage(event) !== null;
}

export function extractRetryAfterMs(event: unknown): number | null {
	const seen = new Set<unknown>();
	const stack: unknown[] = [event];
	while (stack.length > 0) {
		const node = stack.pop();
		if (!node || typeof node !== "object" || seen.has(node)) continue;
		seen.add(node);
		const record = node as Record<string, unknown>;
		for (const key of ["retry_after_ms", "retryAfterMs", "retryAfter", "retry_after"]) {
			const value = record[key];
			if (typeof value === "number" && Number.isFinite(value) && value > 0) {
				if (key === "retry_after_ms" || key === "retryAfterMs") return Math.floor(value);
				return Math.floor(value * 1000);
			}
			if (typeof value === "string" && value.trim()) {
				const parsed = Number(value);
				if (Number.isFinite(parsed) && parsed > 0) return key.toLowerCase().includes("ms") ? Math.floor(parsed) : Math.floor(parsed * 1000);
			}
		}
		for (const value of Object.values(record)) if (value && typeof value === "object") stack.push(value);
	}
	return null;
}

export function extractResetAtMs(event: unknown, now: number = Date.now()): number | null {
	const structured = extractStructuredResetAtMs(event);
	if (structured !== null) return structured;
	const message = readAssistantMessage(event);
	if (!message) return null;
	return extractResetAtMsFromText(extractAssistantErrorText(message), now);
}

export function extractUsageEndpointResetAtMs(snapshot: unknown, event: unknown, now: number = Date.now()): number | null {
	return selectQuotaSnapshotReset(snapshot, event, now)?.resetAtMs ?? null;
}

export function selectQuotaSnapshotReset(
	snapshot: unknown,
	event: unknown,
	now: number = Date.now(),
): { resetAtMs: number; resetSource: "usage-endpoint" | "cli-rpc" } | null {
	const quota = normalizeQuotaSnapshotFromUnknown(snapshot, now);
	if (!quota) return null;
	const candidates = quota.windows
		.filter((window) => window.resetAtMs !== null && window.resetAtMs > now)
		.map((window) => ({
			limitReached: window.limitReached === true,
			path: window.id,
			resetAtMs: window.resetAtMs!,
			title: window.title,
			utilization: window.usedPercent === null ? 0 : window.usedPercent / 100,
		}));
	if (candidates.length === 0) return null;
	const typeHint = normalizeQuotaHint(extractRateLimitType(event));
	const modelHint = normalizeQuotaHint(readAssistantMessage(event)?.model);
	const typeMatching = candidates.filter((candidate) => quotaCandidateMatchesType(candidate, typeHint));
	const modelMatching = candidates.filter((candidate) => quotaCandidateMatchesModel(candidate, modelHint));
	const matched = typeMatching.length > 0 ? typeMatching : modelMatching.length > 0 ? modelMatching : candidates;
	const eligible = isSessionOrUsageCapEvent(event) && !hasNegatedSessionOrUsageLimit(event)
		? matched
		: matched.filter((candidate) => quotaCandidateSaturated(candidate));
	if (eligible.length === 0) return null;
	const selected = chooseUsageResetCandidate(eligible);
	return selected ? { resetAtMs: selected.resetAtMs, resetSource: quota.source } : null;
}

function normalizeQuotaSnapshotFromUnknown(snapshot: unknown, now: number): QuotaSnapshot | null {
	if (!isRecord(snapshot) || !Array.isArray(snapshot.windows)) return null;
	const source = snapshot.source === "cli-rpc" ? "cli-rpc" : "usage-endpoint";
	const provider = typeof snapshot.provider === "string" && snapshot.provider ? snapshot.provider : "unknown";
	const windows = snapshot.windows.flatMap((window, index): QuotaWindow[] => {
		if (!isRecord(window)) return [];
		const id = typeof window.id === "string" && window.id ? window.id : `window_${index}`;
		const title = typeof window.title === "string" && window.title ? window.title : id;
		const resetAtMs = coerceResetTimestampMs(window.resetAtMs ?? window.reset_at_ms ?? window.resetsAtMs ?? window.resets_at_ms, true)
			?? coerceResetTimestampMs(window.resetAt ?? window.reset_at ?? window.resetsAt ?? window.resets_at, false);
		const used = coerceFiniteNumber(window.usedPercent ?? window.used_percent ?? window.utilization ?? window.percent ?? window.percentage);
		const usedPercent = used === null ? null : (used <= 1 ? used * 100 : used);
		const limitReached = window.limitReached === true || window.limit_reached === true ? true : window.limitReached === false || window.limit_reached === false ? false : undefined;
		return [{ id, title, resetAtMs, usedPercent, ...(limitReached !== undefined ? { limitReached } : {}) }];
	});
	return { fetchedAtMs: coerceFiniteNumber(snapshot.fetchedAtMs) ?? now, provider, source, windows };
}

export function chooseRateLimitScheduleBasis(input: RateLimitWatchdogInput, ladderMs: number): RateLimitScheduleBasis {
	const usageReset = selectQuotaSnapshotReset(input.usageSnapshot, input.event, input.now);
	if (usageReset) {
		return {
			delayMs: Math.max(0, usageReset.resetAtMs + RATE_LIMIT_RESET_MARGIN_MS - input.now),
			degradedResetSource: false,
			resetAtMs: usageReset.resetAtMs,
			resetSource: usageReset.resetSource,
		};
	}
	const explicitMs = extractRetryAfterMs(input.event);
	const sdkResetAtMs = extractStructuredResetAtMs(input.event);
	if (explicitMs !== null || sdkResetAtMs !== null) {
		return {
			delayMs: Math.max(ladderMs, Math.max(0, (sdkResetAtMs ?? input.now) + RATE_LIMIT_RESET_MARGIN_MS - input.now), explicitMs ?? 0),
			degradedResetSource: false,
			...(sdkResetAtMs !== null ? { resetAtMs: sdkResetAtMs } : {}),
			resetSource: "sdk-rate-limit-event",
		};
	}
	const proseResetAtMs = extractResetAtMs(input.event, input.now);
	if (proseResetAtMs !== null) {
		return {
			delayMs: Math.max(ladderMs, Math.max(0, proseResetAtMs + RATE_LIMIT_RESET_MARGIN_MS - input.now)),
			degradedResetSource: true,
			resetAtMs: proseResetAtMs,
			resetSource: "prose-fallback",
		};
	}
	return { delayMs: ladderMs, degradedResetSource: true, resetSource: "backoff-only" };
}

export function decideRateLimitRetry(
	input: RateLimitWatchdogInput,
	envOverride: RateLimitWatchdogEnv = {},
): RateLimitWatchdogDecision {
	const classification = classifyRateLimitEvent(input.event);
	if (!classification.isRateLimitEvent) return { kind: "not-rate-limited", reason: classification.reason };

	const maxAttempts = envOverride.maxAttempts ?? rateLimitMaxAttemptsFromEnv();
	if (input.attempt >= maxAttempts) {
		return {
			attempt: input.attempt,
			kind: "exhausted",
			reason: `rate-limit retries exhausted after ${input.attempt} attempt${input.attempt === 1 ? "" : "s"}`,
		};
	}

	const ladder = envOverride.backoffLadderSec ?? rateLimitBackoffLadderFromEnv();
	const ladderIndex = Math.min(input.attempt, ladder.length - 1);
	const ladderMs = Math.max(0, Math.floor(ladder[ladderIndex]! * 1000));
	const basis = chooseRateLimitScheduleBasis(input, ladderMs);
	const at = input.now + basis.delayMs;
	const nextAttempt = input.attempt + 1;
	return {
		kind: "retry-at",
		at,
		attempt: nextAttempt,
		degradedResetSource: basis.degradedResetSource,
		hash: `${input.paneId}:${nextAttempt}:${at}`,
		...(basis.resetAtMs !== undefined ? { resetAtMs: basis.resetAtMs } : {}),
		resetSource: basis.resetSource,
		steerMessage: RATE_LIMIT_STEER_MESSAGE,
	};
}

function chooseUsageResetCandidate(candidates: UsageResetCandidate[]): UsageResetCandidate | null {
	return [...candidates].sort((a, b) => {
		if (a.limitReached !== b.limitReached) return a.limitReached ? -1 : 1;
		const byUtilization = b.utilization - a.utilization;
		if (Math.abs(byUtilization) > 0.000001) return byUtilization;
		return b.resetAtMs - a.resetAtMs;
	})[0] ?? null;
}

function quotaCandidateSaturated(candidate: UsageResetCandidate): boolean {
	return candidate.limitReached || candidate.utilization >= 0.95;
}

function isSessionOrUsageCapEvent(event: unknown): boolean {
	if (hasNegatedSessionOrUsageLimit(event)) return false;
	const message = readAssistantMessage(event);
	const text = message ? extractAssistantErrorText(message).toLowerCase() : "";
	if (/\b(?:you(?:['’]?ve|\s+have)\s+hit\s+your\s+)?session\s+limit\b/.test(text)) return true;
	if (/\b(?:you(?:['’]?ve|\s+have)\s+hit\s+your\s+)?usage\s+limit\b/.test(text)) return true;
	if (/\bextra\s+usage\b|\busage\s+cap\b|\bsession\s+cap\b/.test(text)) return true;
	const typeHint = normalizeQuotaHint(extractRateLimitType(event));
	return typeHint === "session" || typeHint === "usage" || typeHint?.includes("session") === true || typeHint?.includes("usage") === true;
}

function hasNegatedSessionOrUsageLimit(event: unknown): boolean {
	const message = readAssistantMessage(event);
	const text = message ? extractAssistantErrorText(message).toLowerCase() : "";
	return /\bnot\s+(?:your\s+)?(?:session|usage)\s+limit\b/.test(text);
}

function quotaCandidateMatchesType(candidate: UsageResetCandidate, typeHint: string | null): boolean {
	const path = normalizeQuotaHint(`${candidate.path} ${candidate.title}`) ?? "";
	if (typeHint && path.includes(typeHint)) return true;
	if (typeHint === "fivehour" && (path.includes("5hour") || path.includes("5h"))) return true;
	if (typeHint === "sevenday" && (path.includes("7day") || path.includes("7d"))) return true;
	return false;
}

function quotaCandidateMatchesModel(candidate: UsageResetCandidate, modelHint: string | null): boolean {
	const path = normalizeQuotaHint(`${candidate.path} ${candidate.title}`) ?? "";
	return Boolean(modelHint && path.includes(modelHint));
}

function normalizeQuotaHint(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const normalized = value.toLowerCase().replace(/claude|anthropic|rate|limit|window|tokens/g, "").replace(/[^a-z0-9]+/g, "");
	if (!normalized) return null;
	if (normalized === "5h" || normalized === "5hour" || normalized === "5hours") return "fivehour";
	if (normalized === "7d" || normalized === "7day" || normalized === "7days") return "sevenday";
	return normalized;
}

function extractRateLimitType(event: unknown): string | null {
	const seen = new Set<unknown>();
	const stack: unknown[] = [event];
	while (stack.length > 0) {
		const node = stack.pop();
		if (!isRecord(node) || seen.has(node)) continue;
		seen.add(node);
		for (const key of ["rateLimitType", "rate_limit_type", "limitType", "limit_type", "window", "quotaWindow"]) {
			const value = node[key];
			if (typeof value === "string" && value.trim()) return value;
		}
		for (const value of Object.values(node)) if (value && typeof value === "object") stack.push(value);
	}
	return null;
}

const RESET_AT_MS_KEYS = new Set(["resetAtMs", "reset_at_ms", "resetsAtMs", "resets_at_ms"]);
const RESET_AT_KEYS = new Set(["resetAt", "reset_at", "resetsAt", "resets_at"]);

export function extractStructuredResetAtMs(event: unknown): number | null {
	const seen = new Set<unknown>();
	const stack: unknown[] = [event];
	while (stack.length > 0) {
		const node = stack.pop();
		if (!isRecord(node) || seen.has(node)) continue;
		seen.add(node);
		for (const [key, value] of Object.entries(node)) {
			if (RESET_AT_MS_KEYS.has(key)) {
				const parsed = coerceResetTimestampMs(value, true);
				if (parsed !== null) return parsed;
			} else if (RESET_AT_KEYS.has(key)) {
				const parsed = coerceResetTimestampMs(value, false);
				if (parsed !== null) return parsed;
			}
			if (value && typeof value === "object") stack.push(value);
		}
	}
	return null;
}

function coerceResetTimestampMs(value: unknown, knownMilliseconds: boolean): number | null {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		const milliseconds = knownMilliseconds || value >= 1_000_000_000_000 ? value : value * 1000;
		return Math.floor(milliseconds);
	}
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (/^[0-9]+(?:\.[0-9]+)?$/.test(trimmed)) {
		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed) || parsed <= 0) return null;
		const milliseconds = knownMilliseconds || parsed >= 1_000_000_000_000 ? parsed : parsed * 1000;
		return Math.floor(milliseconds);
	}
	const parsedDate = Date.parse(trimmed);
	return Number.isFinite(parsedDate) ? parsedDate : null;
}

function extractResetAtMsFromText(text: string, now: number): number | null {
	const resetMatch = text.match(/\bresets?\s+(?:at\s+)?([^\n]+)/i);
	if (!resetMatch) return null;
	const tail = (resetMatch[1] ?? "").trim();
	if (!tail) return null;

	const absolute = parseAbsoluteResetTail(tail);
	if (absolute !== null) return absolute;

	const clockMatch = tail.match(/^(?<clock>\d{1,2}(?::\d{2}){0,2}\s*(?:am|pm)?)(?:\s*\((?<timeZone>[^)]+)\))?/i);
	const clock = parseClockTime(clockMatch?.groups?.clock ?? "");
	if (!clock) return null;
	const timeZone = clockMatch?.groups?.timeZone?.trim();
	if (timeZone) return nextClockOccurrenceInTimeZone(clock, timeZone, now);
	return nextClockOccurrenceInLocalTime(clock, now);
}

function parseAbsoluteResetTail(tail: string): number | null {
	const withoutIanaZone = tail
		.replace(/[.;]\s*$/, "")
		.replace(/\s*\([A-Za-z_][A-Za-z0-9_+\-/.]+\)\s*$/, "")
		.trim();
	if (/(\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|[+-]\d{2}:?\d{2}\b|\b(?:UTC|GMT|[A-Z]{2,4})\b)/i.test(withoutIanaZone) === false) return null;
	const parsed = Date.parse(withoutIanaZone);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseClockTime(raw: string): { hour: number; minute: number; second: number } | null {
	const match = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/i);
	if (!match) return null;
	let hour = Number(match[1]);
	const minute = match[2] === undefined ? 0 : Number(match[2]);
	const second = match[3] === undefined ? 0 : Number(match[3]);
	const meridiem = match[4]?.toLowerCase();
	if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second)) return null;
	if (minute < 0 || minute > 59 || second < 0 || second > 59) return null;
	if (meridiem) {
		if (hour < 1 || hour > 12) return null;
		if (hour === 12) hour = 0;
		if (meridiem === "pm") hour += 12;
	} else if (hour < 0 || hour > 23) return null;
	return { hour, minute, second };
}

function nextClockOccurrenceInLocalTime(clock: { hour: number; minute: number; second: number }, now: number): number {
	const candidate = new Date(now);
	candidate.setHours(clock.hour, clock.minute, clock.second, 0);
	if (candidate.getTime() > now) {
		const previous = new Date(candidate);
		previous.setDate(previous.getDate() - 1);
		if (now - previous.getTime() <= RATE_LIMIT_CLOCK_RESET_PAST_TOLERANCE_MS) return previous.getTime();
		return candidate.getTime();
	}
	const elapsedMs = now - candidate.getTime();
	if (elapsedMs <= RATE_LIMIT_CLOCK_RESET_PAST_TOLERANCE_MS) return candidate.getTime();
	candidate.setDate(candidate.getDate() + 1);
	return candidate.getTime();
}

function nextClockOccurrenceInTimeZone(clock: { hour: number; minute: number; second: number }, timeZone: string, now: number): number | null {
	const nowParts = zonedDateParts(now, timeZone);
	if (!nowParts) return null;
	const previousDate = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day - 1));
	const previousCandidate = zonedLocalTimeToUtcMs(previousDate.getUTCFullYear(), previousDate.getUTCMonth() + 1, previousDate.getUTCDate(), clock.hour, clock.minute, clock.second, timeZone);
	if (previousCandidate !== null && previousCandidate <= now && now - previousCandidate <= RATE_LIMIT_CLOCK_RESET_PAST_TOLERANCE_MS) return previousCandidate;
	for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
		const date = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day + dayOffset));
		const candidate = zonedLocalTimeToUtcMs(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), clock.hour, clock.minute, clock.second, timeZone);
		if (candidate === null) continue;
		if (candidate > now) return candidate;
		if (now - candidate <= RATE_LIMIT_CLOCK_RESET_PAST_TOLERANCE_MS) return candidate;
	}
	return null;
}

function zonedDateParts(utcMs: number, timeZone: string): { year: number; month: number; day: number } | null {
	const parts = formatZonedParts(utcMs, timeZone);
	return parts ? { day: parts.day, month: parts.month, year: parts.year } : null;
}

function zonedLocalTimeToUtcMs(year: number, month: number, day: number, hour: number, minute: number, second: number, timeZone: string): number | null {
	const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
	const firstOffset = timeZoneOffsetMs(timeZone, localAsUtc);
	if (firstOffset === null) return null;
	let candidate = localAsUtc - firstOffset;
	const secondOffset = timeZoneOffsetMs(timeZone, candidate);
	if (secondOffset === null) return null;
	if (secondOffset !== firstOffset) candidate = localAsUtc - secondOffset;
	return candidate;
}

function timeZoneOffsetMs(timeZone: string, utcMs: number): number | null {
	const parts = formatZonedParts(utcMs, timeZone);
	if (!parts) return null;
	const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
	return zonedAsUtc - utcMs;
}

function formatZonedParts(utcMs: number, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } | null {
	try {
		const formatter = new Intl.DateTimeFormat("en-US", { day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit", month: "2-digit", second: "2-digit", timeZone, year: "numeric" });
		const values = Object.fromEntries(formatter.formatToParts(new Date(utcMs)).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])) as Record<string, number>;
		const { day, hour, minute, month, second, year } = values;
		if (![day, hour, minute, month, second, year].every((value) => Number.isFinite(value))) return null;
		return { day, hour, minute, month, second, year };
	} catch {
		return null;
	}
}

function coerceFiniteNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && /^[0-9]+(?:\.[0-9]+)?$/.test(value.trim())) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

export function quotaSourceFailureSummary(value: unknown): string | null {
	if (!isRecord(value) || value.source !== "quota-source-error") return null;
	const provider = typeof value.provider === "string" ? value.provider : "unknown";
	const resetSource = typeof value.resetSource === "string" ? value.resetSource : "unknown";
	const reason = typeof value.reason === "string" ? sanitizeQuotaFailureReason(value.reason) : "unknown";
	const status = typeof value.status === "number" ? ` status=${value.status}` : "";
	const endpoint = typeof value.endpoint === "string" ? ` endpoint=${value.endpoint}` : "";
	return `provider=${provider} source=${resetSource} reason=${reason}${status}${endpoint}`;
}

function sanitizeQuotaFailureReason(reason: string): string {
	return reason.replace(/bearer\s+[A-Za-z0-9._~+/-]+/gi, "bearer [redacted]").replace(/[A-Za-z0-9._~+/-]{24,}/g, "[redacted]");
}

function readAssistantMessage(event: unknown): Record<string, unknown> | null {
	if (!isRecord(event)) return null;
	const directMessage = event.message;
	if (isRecord(directMessage) && directMessage.role === "assistant") return directMessage;
	const data = event.data;
	if (isRecord(data)) {
		const dataMessage = data.message;
		if (isRecord(dataMessage) && dataMessage.role === "assistant") return dataMessage;
	}
	return null;
}

function extractAssistantErrorText(message: Record<string, unknown>): string {
	const parts: string[] = [];
	for (const key of ["errorMessage", "error_message"]) {
		const value = message[key];
		if (typeof value === "string" && value) parts.push(value);
	}
	const content = message.content;
	if (Array.isArray(content)) {
		for (const item of content) {
			if (!isRecord(item)) continue;
			const text = item.text;
			if (typeof text === "string" && text) parts.push(text);
		}
	}
	return parts.join("\n");
}

function readAssistantStopReason(message: Record<string, unknown>): string | null {
	const value = message.stopReason;
	return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
