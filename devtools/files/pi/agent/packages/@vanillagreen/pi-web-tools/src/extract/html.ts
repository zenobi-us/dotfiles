export interface HtmlExtraction {
	title?: string;
	markdown: string;
}

const ENTITY_MAP: Record<string, string> = {
	"&nbsp;": " ",
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#39;": "'",
	"&apos;": "'",
	"&hellip;": "…",
	"&mdash;": "—",
	"&ndash;": "–",
	"&laquo;": "«",
	"&raquo;": "»",
	"&copy;": "©",
	"&reg;": "®",
	"&trade;": "™",
};

function decodeEntities(text: string): string {
	let out = text;
	for (const [k, v] of Object.entries(ENTITY_MAP)) out = out.split(k).join(v);
	out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
	out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
	return out;
}

const CHROME_CLASS_EXACT = [
	"navbox",
	"sidebar",
	"infobox",
	"hatnote",
	"shortdescription",
	"noprint",
	"thumb",
	"thumbcaption",
	"vertical-navbox",
	"mw-editsection",
	"mw-jump-link",
	"mw-cite-backlink",
	"reflist",
	"catlinks",
	"printfooter",
	"mw-indicator",
	"mw-empty-elt",
	"toc",
	"cookie-banner",
	"cookies-banner",
	"newsletter-signup",
	"share-buttons",
	"social-share",
	"breadcrumbs",
	"pagination",
	"site-header",
	"site-footer",
];

function stripChromeBlocks(html: string): string {
	const classRe = new RegExp(
		`<(table|div|aside|section|nav|ul|ol|figure)\\b[^>]*class=["'][^"']*(?<![\\w-])(?:${CHROME_CLASS_EXACT.join("|")})(?![\\w-])[^"']*["'][^>]*>`,
		"i",
	);
	let out = html;
	let safety = 0;
	while (safety++ < 500) {
		const match = classRe.exec(out);
		if (!match) break;
		const tag = match[1].toLowerCase();
		const start = match.index;
		const openLen = match[0].length;
		const openRe = new RegExp(`<${tag}\\b[^>]*>`, "ig");
		const closeRe = new RegExp(`</${tag}\\s*>`, "ig");
		openRe.lastIndex = start + openLen;
		closeRe.lastIndex = start + openLen;
		let depth = 1;
		let cursor = start + openLen;
		while (depth > 0) {
			openRe.lastIndex = cursor;
			closeRe.lastIndex = cursor;
			const o = openRe.exec(out);
			const c = closeRe.exec(out);
			if (!c) break;
			if (o && o.index < c.index) {
				depth++;
				cursor = o.index + o[0].length;
			} else {
				depth--;
				cursor = c.index + c[0].length;
				if (depth === 0) {
					out = out.slice(0, start) + out.slice(cursor);
					break;
				}
			}
		}
		if (depth !== 0) {
			out = out.slice(0, start) + out.slice(start + openLen);
		}
	}
	return out;
}

function stripRoleNavigation(html: string): string {
	return html.replace(/<(div|section|nav|aside)\b[^>]*role=["']navigation["'][^>]*>[\s\S]*?<\/\1>/gi, "");
}

export function htmlToMarkdown(html: string): HtmlExtraction {
	const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
	let main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
		?? html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]
		?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]
		?? html;
	main = stripRoleNavigation(main);
	main = stripChromeBlocks(main);
	let body = main
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
		.replace(/<svg[\s\S]*?<\/svg>/gi, "")
		.replace(/<(header|nav|footer|aside|menu)\b[\s\S]*?<\/\1>/gi, "")
		.replace(/<form\b[\s\S]*?<\/form>/gi, "")
		.replace(/<button\b[\s\S]*?<\/button>/gi, "")
		.replace(/<\/(h[1-6]|p|li|blockquote|pre|tr|div|section|article)>/gi, "\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<h1[^>]*>/gi, "\n# ")
		.replace(/<h2[^>]*>/gi, "\n## ")
		.replace(/<h3[^>]*>/gi, "\n### ")
		.replace(/<h4[^>]*>/gi, "\n#### ")
		.replace(/<li[^>]*>/gi, "\n- ")
		.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
			const text = label.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
			if (!text) return "";
			if (href.startsWith("#")) return text;
			return `${text} (${href})`;
		})
		.replace(/<[^>]+>/g, " ");
	body = decodeEntities(body)
		.replace(/[ \t]+/g, " ")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && line !== "-" && line !== "•")
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
	return { title: title ? decodeEntities(title) : undefined, markdown: body };
}

const BLOCKED_PATTERNS: RegExp[] = [
	/please enable javascript/i,
	/enable cookies/i,
	/are you a robot/i,
	/just a moment/i,
	/checking your browser/i,
	/access denied/i,
	/captcha/i,
	/cloudflare/i,
	/perimeterx/i,
	/this page can.t be displayed/i,
	/error 1020/i,
];

export interface QualityAssessment {
	blocked: boolean;
	lowContent: boolean;
	reasons: string[];
}

export function assessExtractionQuality(extraction: HtmlExtraction, rawHtmlLength: number): QualityAssessment {
	const reasons: string[] = [];
	const text = extraction.markdown;
	let blocked = false;
	for (const re of BLOCKED_PATTERNS) {
		if (re.test(text)) {
			blocked = true;
			reasons.push(`blocked-pattern:${re.source}`);
		}
	}
	const lowContent = !blocked && text.length < 400 && rawHtmlLength > 4000;
	if (lowContent) reasons.push(`low-content:${text.length}/${rawHtmlLength}`);
	return { blocked, lowContent, reasons };
}

export interface JinaFetchOptions {
	fetchImpl?: typeof fetch;
	signal?: AbortSignal;
	apiKey?: string;
}

export interface JinaResult {
	title?: string;
	markdown: string;
	source: "jina";
}

export async function fetchViaJina(targetUrl: string, options: JinaFetchOptions = {}): Promise<JinaResult> {
	const fetchImpl = options.fetchImpl ?? fetch;
	const headers: Record<string, string> = { accept: "text/markdown,text/plain,*/*" };
	if (options.apiKey) headers.authorization = `Bearer ${options.apiKey}`;
	const response = await fetchImpl(`https://r.jina.ai/${targetUrl}`, { headers, signal: options.signal });
	if (!response.ok) throw new Error(`Jina Reader fetch failed (${response.status}) for ${targetUrl}`);
	const text = await response.text();
	const titleMatch = text.match(/^Title:\s*(.+)$/m);
	const bodyStart = text.indexOf("Markdown Content:");
	const markdown = bodyStart >= 0 ? text.slice(bodyStart + "Markdown Content:".length).trim() : text.trim();
	return { title: titleMatch?.[1]?.trim(), markdown, source: "jina" };
}
