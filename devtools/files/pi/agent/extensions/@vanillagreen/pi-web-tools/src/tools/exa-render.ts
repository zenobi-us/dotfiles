import { accent, emptyComponent, errorSummary, firstText, muted, oneLine, providerLabel, successSummary, textComponent, tree, webCallText } from "../utils/render.js";

export interface ExaRenderableResult {
	title?: string;
	url?: string;
	contentId?: string;
}

function answerPreviewLines(answer: string, theme: any, expanded: boolean, hasResults: boolean): string[] {
	const maxChars = expanded ? 2400 : 700;
	const width = 112;
	const normalized = answer.replace(/\r/g, "").trim();
	const truncated = normalized.length > maxChars;
	const clipped = truncated ? normalized.slice(0, maxChars).trimEnd() : normalized;
	const paragraphs = clipped.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean);
	const chunks: string[] = [];
	for (const paragraph of paragraphs) {
		let remaining = paragraph;
		while (remaining.length > width) {
			let split = remaining.lastIndexOf(" ", width);
			if (split < 40) split = width;
			chunks.push(remaining.slice(0, split).trim());
			remaining = remaining.slice(split).trim();
		}
		if (remaining) chunks.push(remaining);
		if (paragraphs.length > 1) chunks.push("");
	}
	while (chunks.at(-1) === "") chunks.pop();
	if (truncated) chunks.push(expanded ? "… truncated by UI cap" : "… truncated · ctrl+o to expand");
	if (chunks.length === 0) return [];
	return chunks.map((chunk, index) => {
		const last = index === chunks.length - 1;
		const branch = last && !hasResults ? "└" : index === 0 ? "├" : "│";
		const prefix = "";
		const value = chunk.startsWith("… truncated") ? muted(theme, chunk) : accent(theme, chunk || " ");
		return `${tree(theme, branch)}${muted(theme, prefix)}${value}`;
	});
}

export function renderExaCall(label: string, target: string | undefined, theme: any, context: any, meta?: string) {
	if (context?.executionStarted && !context?.isPartial) return emptyComponent();
	return textComponent(webCallText(theme, providerLabel(label, "exa"), target || "query", meta));
}

export function renderExaResultList(label: string, target: string | undefined, result: any, options: any, theme: any, context: any, resultNoun = "results") {
	if (options?.isPartial) return emptyComponent();
	if (context?.isError) return textComponent(errorSummary(theme, providerLabel(label, "exa"), firstText(result) || "failed"));
	const details = result?.details ?? {};
	const results: ExaRenderableResult[] = Array.isArray(details.results) ? details.results : [];
	const answer = typeof details.answer === "string" && details.answer.trim() ? details.answer.trim() : undefined;
	const isExaCode = details?.source === "exa-code" || details?.provider === "exa-code";
	let meta: string | undefined;
	if (isExaCode) {
		const tokenBits = typeof details?.outputTokens === "number" ? `${details.outputTokens} tokens` : undefined;
		const sourceBits = typeof details?.resultsCount === "number" ? `${details.resultsCount} sources` : undefined;
		meta = [tokenBits, sourceBits].filter(Boolean).join(" · ") || undefined;
	} else {
		meta = answer && results.length === 0 ? undefined : `${results.length} ${resultNoun}`;
	}
	const providerTag = isExaCode ? "exa-code" : "exa";
	const lines = [successSummary(theme, providerLabel(label, providerTag), target || "complete", meta)];
	if (isExaCode) {
		const expanded = Boolean(options?.expanded);
		const sources: ExaRenderableResult[] = Array.isArray(details?.results) ? details.results : [];
		const contentId = typeof details?.contentId === "string" ? details.contentId : undefined;
		const contentIdLineLast = sources.length === 0;
		if (contentId) lines.push(`${tree(theme, contentIdLineLast ? "└" : "├")}${muted(theme, "content id ")}${accent(theme, contentId)}`);
		if (!expanded && sources.length > 0) {
			lines.push(`${tree(theme, "└")}${muted(theme, `… ${sources.length} source${sources.length === 1 ? "" : "s"} · ctrl+o to expand`)}`);
		} else if (expanded && sources.length > 0) {
			const limit = 12;
			const shown = sources.slice(0, limit);
			for (let i = 0; i < shown.length; i++) {
				const item = shown[i]!;
				const title = item.title || item.url || "Untitled";
				const isLast = i === shown.length - 1 && sources.length <= shown.length;
				lines.push(`${tree(theme, isLast ? "└" : "├")}${accent(theme, oneLine(title, 72))}${item.url ? muted(theme, ` · ${oneLine(item.url, 72)}`) : ""}`);
			}
			if (sources.length > limit) lines.push(`${tree(theme, "└")}${muted(theme, `… ${sources.length - limit} more`)}`);
		}
		return textComponent(lines.join("\n"));
	}
	if (answer) lines.push(...answerPreviewLines(answer, theme, Boolean(options?.expanded), results.length > 0));
	const limit = options?.expanded ? 8 : 3;
	const shown = results.slice(0, limit);
	for (let index = 0; index < shown.length; index++) {
		const item = shown[index]!;
		const title = item.title || item.url || "Untitled";
		const bits = [item.url ? oneLine(item.url, 72) : undefined].filter(Boolean).join(" · ");
		const isLast = index === shown.length - 1 && results.length <= shown.length;
		lines.push(`${tree(theme, isLast ? "└" : "├")}${accent(theme, oneLine(title, 72))}${bits ? muted(theme, ` · ${bits}`) : ""}`);
	}
	if (results.length > limit) lines.push(`${tree(theme, "└")}${muted(theme, `… ${results.length - limit} more · ctrl+o to expand`)}`);
	return textComponent(lines.join("\n"));
}
