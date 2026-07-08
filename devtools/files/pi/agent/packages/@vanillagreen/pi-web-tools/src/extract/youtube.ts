import { GeminiApiClient } from "../providers/gemini-api.js";
import { GeminiWebClient } from "../providers/gemini-web.js";
import { readBrowserCookies, type ReadCookiesOptions } from "../utils/browser-cookies.js";

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"]);

export interface ParsedYouTubeUrl {
	videoId: string;
	canonicalUrl: string;
	kind: "watch" | "short" | "live" | "embed" | "v";
}

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | undefined {
	let url: URL;
	try { url = new URL(input); } catch { return undefined; }
	if (!YOUTUBE_HOSTS.has(url.hostname)) return undefined;
	if (url.hostname === "youtu.be") {
		const id = url.pathname.split("/").filter(Boolean)[0];
		if (id) return { videoId: id, canonicalUrl: `https://www.youtube.com/watch?v=${id}`, kind: "watch" };
	}
	const watch = url.searchParams.get("v");
	if (watch) return { videoId: watch, canonicalUrl: `https://www.youtube.com/watch?v=${watch}`, kind: "watch" };
	const parts = url.pathname.split("/").filter(Boolean);
	if (parts.length >= 2) {
		const [marker, id] = parts;
		if (marker === "shorts" && id) return { videoId: id, canonicalUrl: `https://www.youtube.com/shorts/${id}`, kind: "short" };
		if (marker === "live" && id) return { videoId: id, canonicalUrl: `https://www.youtube.com/live/${id}`, kind: "live" };
		if (marker === "embed" && id) return { videoId: id, canonicalUrl: `https://www.youtube.com/embed/${id}`, kind: "embed" };
		if (marker === "v" && id) return { videoId: id, canonicalUrl: `https://www.youtube.com/watch?v=${id}`, kind: "v" };
	}
	return undefined;
}

export interface YouTubeExtractOptions {
	prompt?: string;
	geminiApiKey?: string;
	geminiModel?: string;
	browserCookies?: ReadCookiesOptions;
	preferGeminiWeb?: boolean;
	signal?: AbortSignal;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
}

export interface YouTubeExtractResult {
	videoId: string;
	url: string;
	title: string;
	content: string;
	source: "gemini-web" | "gemini-api";
	metadata: Record<string, unknown>;
}

const DEFAULT_PROMPT = "Provide a structured summary of the video: title (if shown), key topics, important quotes, and any visual details. Include approximate timestamps for major sections.";

const TRANSCRIPT_KEYWORDS = /\b(transcri[bp]|transcription|verbatim|subtitle|caption|lyrics?\b)/i;
const TIMESTAMP_DIRECTIVE = "\n\nFormat the output as a transcript with [HH:MM:SS] timestamps at every line break (every 10-15 seconds). Include spoken dialogue, lyrics, and notable visual cues. Do not omit timestamps.";

function enhancePrompt(input: string | undefined): string {
	const base = input ?? DEFAULT_PROMPT;
	if (input && TRANSCRIPT_KEYWORDS.test(input) && !/\[hh:mm/i.test(input)) return base + TIMESTAMP_DIRECTIVE;
	return base;
}

async function tryGeminiWeb(parsed: ParsedYouTubeUrl, options: YouTubeExtractOptions): Promise<YouTubeExtractResult | undefined> {
	const cookies = await readBrowserCookies({ ...(options.browserCookies ?? {}), requiredCookies: ["__Secure-1PSID", "__Secure-1PSIDTS"] });
	if (!cookies) return undefined;
	const client = new GeminiWebClient(cookies.cookies, options.fetchImpl ?? fetch);
	const prompt = `${enhancePrompt(options.prompt)}\n\nYouTube video: ${parsed.canonicalUrl}`;
	const text = await client.query(prompt, { model: options.geminiModel, signal: options.signal, timeoutMs: options.timeoutMs });
	return {
		videoId: parsed.videoId,
		url: parsed.canonicalUrl,
		title: `YouTube ${parsed.kind} ${parsed.videoId}`,
		content: text,
		source: "gemini-web",
		metadata: { provider: "gemini-web", browser: cookies.browser, profile: cookies.profile, videoId: parsed.videoId, kind: parsed.kind },
	};
}

async function tryGeminiApi(parsed: ParsedYouTubeUrl, options: YouTubeExtractOptions): Promise<YouTubeExtractResult | undefined> {
	if (!options.geminiApiKey) return undefined;
	const client = new GeminiApiClient({ apiKey: options.geminiApiKey, fetchImpl: options.fetchImpl });
	const model = options.geminiModel ?? "gemini-2.5-flash";
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(options.geminiApiKey)}`;
	const body = {
		contents: [{ role: "user", parts: [{ fileData: { fileUri: parsed.canonicalUrl, mimeType: "video/mp4" } }, { text: enhancePrompt(options.prompt) }] }],
	};
	const fetchImpl = options.fetchImpl ?? fetch;
	const response = await fetchImpl(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: options.signal });
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`Gemini API video request failed (${response.status}): ${text || response.statusText}`);
	}
	const raw = await response.json() as any;
	const text = raw?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n").trim() ?? "";
	if (!text) throw new Error("Gemini API returned empty response for YouTube video.");
	void client;
	return {
		videoId: parsed.videoId,
		url: parsed.canonicalUrl,
		title: `YouTube ${parsed.kind} ${parsed.videoId}`,
		content: text,
		source: "gemini-api",
		metadata: { provider: "gemini-api", model, videoId: parsed.videoId, kind: parsed.kind },
	};
}

export async function extractYouTubeUrl(input: string, options: YouTubeExtractOptions = {}): Promise<YouTubeExtractResult | undefined> {
	const parsed = parseYouTubeUrl(input);
	if (!parsed) return undefined;
	const order: Array<() => Promise<YouTubeExtractResult | undefined>> = options.preferGeminiWeb === false
		? [() => tryGeminiApi(parsed, options), () => tryGeminiWeb(parsed, options)]
		: [() => tryGeminiWeb(parsed, options), () => tryGeminiApi(parsed, options)];
	const errors: string[] = [];
	for (const attempt of order) {
		try {
			const result = await attempt();
			if (result) return result;
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error));
		}
	}
	throw new Error(`YouTube extraction failed for ${parsed.canonicalUrl}: ${errors.join("; ") || "no provider available"}`);
}
