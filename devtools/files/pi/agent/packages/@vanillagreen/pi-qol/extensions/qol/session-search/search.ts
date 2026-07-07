import {
	DEFAULT_SESSION_SEARCH_LIMIT,
	DEFAULT_SESSION_SEARCH_PREVIEW_SNIPPETS,
} from "../constants.js";
import { settingNumber } from "../settings.js";
import { stringifyError } from "../util.js";
import { sessionDisplayName, sessionResumeTitle, userMessagesForResult } from "./cache.js";
import type {
	QolParsedSessionQuery,
	QolSessionSearchHit,
	QolSessionSearchResult,
	QolSessionSearchSession,
	QolSessionUserMessage,
} from "./types.js";

export function sessionSearchText(session: QolSessionSearchSession): string {
	return [session.id, session.name ?? "", session.cwd, session.path, session.firstMessage, session.allMessagesText].join("\n");
}

export function normalizeSearchText(text: string): string {
	return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function parseSessionSearchQuery(query: string): QolParsedSessionQuery {
	const trimmed = query.trim();
	if (!trimmed) return { mode: "tokens", tokens: [] };
	if (trimmed.startsWith("re:")) {
		const source = trimmed.slice(3).trim();
		if (!source) return { error: "Empty regex", mode: "regex", tokens: [] };
		try {
			return { mode: "regex", regex: new RegExp(source, "i"), tokens: [] };
		} catch (error) {
			return { error: stringifyError(error), mode: "regex", tokens: [] };
		}
	}

	const tokens: QolParsedSessionQuery["tokens"] = [];
	let buffer = "";
	let inQuote = false;
	let unclosed = false;
	const flush = (kind: "fuzzy" | "phrase") => {
		const value = buffer.trim();
		buffer = "";
		if (value) tokens.push({ kind, value });
	};

	for (let i = 0; i < trimmed.length; i++) {
		const char = trimmed[i]!;
		if (char === '"') {
			if (inQuote) {
				flush("phrase");
				inQuote = false;
			} else {
				flush("fuzzy");
				inQuote = true;
			}
			continue;
		}
		if (!inQuote && /\s/.test(char)) {
			flush("fuzzy");
			continue;
		}
		buffer += char;
	}
	if (inQuote) unclosed = true;
	if (unclosed) {
		return {
			mode: "tokens",
			tokens: trimmed.split(/\s+/).filter(Boolean).map((value) => ({ kind: "fuzzy", value })),
		};
	}
	flush(inQuote ? "phrase" : "fuzzy");
	return { mode: "tokens", tokens };
}

function searchWordLengthPenalty(word: string, query: string): number {
	return Math.max(0, word.length - query.length);
}

export function searchStringScore(needle: string, haystack: string): number | undefined {
	const query = normalizeSearchText(needle);
	const text = normalizeSearchText(haystack);
	if (!query) return 0;
	let best: number | undefined;
	const record = (score: number) => {
		best = best === undefined ? score : Math.min(best, score);
	};
	if (/^[a-z0-9_]+$/i.test(query)) {
		for (const match of text.matchAll(/[a-z0-9_]+/gi)) {
			const word = match[0].toLowerCase();
			if (word === query) record(0);
			else if (word.startsWith(query)) record(10 + searchWordLengthPenalty(word, query));
			else if (word.includes(query)) record(100 + searchWordLengthPenalty(word, query));
		}
		return best;
	}
	return text.includes(query) ? 0 : undefined;
}

export function matchSessionSearch(session: QolSessionSearchSession, parsed: QolParsedSessionQuery): { matches: boolean; score: number } {
	const text = sessionSearchText(session);
	if (parsed.mode === "regex") {
		if (!parsed.regex) return { matches: false, score: 0 };
		const index = text.search(parsed.regex);
		return index < 0 ? { matches: false, score: 0 } : { matches: true, score: 0 };
	}
	if (parsed.tokens.length === 0) return { matches: true, score: 0 };
	let score = 0;
	for (const token of parsed.tokens) {
		const tokenScore = searchStringScore(token.value, text);
		if (tokenScore === undefined) return { matches: false, score: 0 };
		score += tokenScore;
	}
	return { matches: true, score };
}

function sessionSnippetSource(session: QolSessionSearchSession): string {
	return (session.allMessagesText || session.firstMessage || "").replace(/\s+/g, " ").trim();
}

function snippetAround(text: string, start: number, length: number, width: number, lead = Math.floor(width / 3)): string {
	const safeLead = Math.max(0, Math.min(width, lead));
	const safeStart = Math.max(0, start - safeLead);
	const safeEnd = Math.min(text.length, Math.max(start + length, safeStart + width));
	const prefix = safeStart > 0 ? "…" : "";
	const suffix = safeEnd < text.length ? "…" : "";
	return `${prefix}${text.slice(safeStart, safeEnd)}${suffix}`;
}

export function buildSessionSnippets(session: QolSessionSearchSession, parsed: QolParsedSessionQuery, limit: number): string[] {
	const source = sessionSnippetSource(session);
	if (!source) return [];
	if (parsed.mode === "regex" && parsed.regex) {
		parsed.regex.lastIndex = 0;
		const match = parsed.regex.exec(source);
		return match ? [snippetAround(source, match.index, match[0].length, 220)] : [];
	}
	if (parsed.tokens.length === 0) return [source.slice(0, 220)];
	const snippets: string[] = [];
	const lower = source.toLowerCase();
	const seen = new Set<string>();
	for (const token of parsed.tokens) {
		const value = normalizeSearchText(token.value);
		if (!value) continue;
		const index = lower.indexOf(value.toLowerCase());
		if (index < 0) continue;
		const snippet = snippetAround(source, index, value.length, 220);
		const key = snippet.toLowerCase();
		if (!seen.has(key)) {
			seen.add(key);
			snippets.push(snippet);
		}
		if (snippets.length >= limit) break;
	}
	return snippets.length > 0 ? snippets : [source.slice(0, 220)];
}

export function searchQolSessions(sessions: QolSessionSearchSession[], query: string, cwd: string): QolSessionSearchResult[] {
	const limit = Math.max(1, Math.floor(settingNumber("sessionSearch.resultLimit", DEFAULT_SESSION_SEARCH_LIMIT, cwd)));
	const snippetLimit = Math.max(1, Math.floor(settingNumber("sessionSearch.previewSnippets", DEFAULT_SESSION_SEARCH_PREVIEW_SNIPPETS, cwd)));
	const parsed = parseSessionSearchQuery(query);
	if (parsed.error) return [];
	if (!query.trim()) {
		return sessions
			.slice()
			.sort((a, b) => b.modified.getTime() - a.modified.getTime())
			.slice(0, limit)
			.map((session) => ({ ...session, rank: 0, snippets: buildSessionSnippets(session, { mode: "tokens", tokens: [] }, 1) }));
	}
	const results: QolSessionSearchResult[] = [];
	for (const session of sessions) {
		const match = matchSessionSearch(session, parsed);
		if (!match.matches) continue;
		results.push({ ...session, rank: match.score, snippets: buildSessionSnippets(session, parsed, snippetLimit) });
	}
	results.sort((a, b) => a.rank - b.rank || b.modified.getTime() - a.modified.getTime());
	return results.slice(0, limit);
}

export function resultFromSession(session: QolSessionSearchSession, rank = 0, snippets: string[] = []): QolSessionSearchResult {
	return { ...session, rank, snippets };
}

function matchTextSearch(text: string, parsed: QolParsedSessionQuery): { matches: boolean; score: number } {
	if (parsed.mode === "regex") {
		if (!parsed.regex) return { matches: false, score: 0 };
		const index = text.search(parsed.regex);
		return index < 0 ? { matches: false, score: 0 } : { matches: true, score: 0 };
	}
	if (parsed.tokens.length === 0) return { matches: true, score: 0 };
	let score = 0;
	for (const token of parsed.tokens) {
		const tokenScore = searchStringScore(token.value, text);
		if (tokenScore === undefined) return { matches: false, score: 0 };
		score += tokenScore;
	}
	return { matches: true, score };
}

function sessionTitleSearchText(session: QolSessionSearchSession): string {
	return [session.name ?? "", sessionResumeTitle(session), sessionDisplayName(session)].join("\n");
}

function matchPromptSearch(_session: QolSessionSearchSession, message: QolSessionUserMessage, parsed: QolParsedSessionQuery): { matches: boolean; score: number } {
	return matchTextSearch(message.text, parsed);
}

export function buildPromptSnippet(message: QolSessionUserMessage, parsed: QolParsedSessionQuery): string {
	const source = message.text.replace(/\s+/g, " ").trim();
	if (!source) return "";
	if (parsed.mode === "regex" && parsed.regex) {
		parsed.regex.lastIndex = 0;
		const match = parsed.regex.exec(source);
		return match ? snippetAround(source, match.index, match[0].length, 160, 24) : source.slice(0, 160);
	}
	if (parsed.tokens.length === 0) return source.slice(0, 160);
	const lower = source.toLowerCase();
	for (const token of parsed.tokens) {
		const value = normalizeSearchText(token.value);
		if (!value) continue;
		const index = lower.indexOf(value.toLowerCase());
		if (index >= 0) return snippetAround(source, index, value.length, 160, 24);
	}
	return source.slice(0, 160);
}

export function promptRecencyTime(hit: QolSessionSearchHit): number {
	if (typeof hit.message.timestamp === "number" && Number.isFinite(hit.message.timestamp)) return hit.message.timestamp;
	return hit.result.modified.getTime();
}

function compareSessionSearchHitsRecent(a: QolSessionSearchHit, b: QolSessionSearchHit): number {
	return promptRecencyTime(b) - promptRecencyTime(a)
		|| b.result.modified.getTime() - a.result.modified.getTime()
		|| b.message.index - a.message.index;
}

export function searchQolSessionHits(sessions: QolSessionSearchSession[], query: string, cwd: string): QolSessionSearchHit[] {
	const limit = Math.max(1, Math.floor(settingNumber("sessionSearch.resultLimit", DEFAULT_SESSION_SEARCH_LIMIT, cwd)));
	const parsed = parseSessionSearchQuery(query);
	if (parsed.error) return [];
	const hits: QolSessionSearchHit[] = [];
	if (!query.trim()) {
		for (const session of sessions) {
			const result = resultFromSession(session);
			for (const message of userMessagesForResult(result)) {
				const snippet = buildPromptSnippet(message, parsed);
				hits.push({ message, rank: 0, result: resultFromSession(session, 0, [snippet]), snippet });
			}
		}
		hits.sort(compareSessionSearchHitsRecent);
		return hits.slice(0, limit);
	}
	for (const session of sessions) {
		let addedPromptHit = false;
		for (const message of userMessagesForResult(resultFromSession(session))) {
			const match = matchPromptSearch(session, message, parsed);
			if (!match.matches) continue;
			const snippet = buildPromptSnippet(message, parsed);
			hits.push({ message, rank: match.score, result: resultFromSession(session, match.score, [snippet]), snippet });
			addedPromptHit = true;
		}
		if (!addedPromptHit) {
			const titleMatch = matchTextSearch(sessionTitleSearchText(session), parsed);
			if (!titleMatch.matches) continue;
			const messages = userMessagesForResult(resultFromSession(session));
			const message = messages[messages.length - 1];
			if (!message) continue;
			const snippet = buildPromptSnippet(message, { mode: "tokens", tokens: [] });
			hits.push({ message, rank: titleMatch.score, result: resultFromSession(session, titleMatch.score, [snippet]), snippet });
		}
	}
	hits.sort((a, b) => a.rank - b.rank || compareSessionSearchHitsRecent(a, b));
	return hits.slice(0, limit);
}

export function formatSessionSearchDate(date: Date): string {
	const now = Date.now();
	const diffMs = Math.max(0, now - date.getTime());
	const diffMins = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);
	if (diffMins < 1) return "now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
