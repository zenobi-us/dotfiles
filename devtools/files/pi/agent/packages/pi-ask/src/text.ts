import { visibleWidth } from "@earendil-works/pi-tui";

const LEADING_WHITESPACE_PATTERN = /^\s*/;
const WORD_SPLIT_PATTERN = /\s+/;

export function wrapText(text: string, width: number): string[] {
	const effectiveWidth = Math.max(1, width);
	const lines = text
		.split("\n")
		.flatMap((paragraph) =>
			wrapParagraphWithIndentation(paragraph, effectiveWidth)
		);

	return lines.length > 0 ? lines : [""];
}

function wrapParagraphWithIndentation(
	paragraph: string,
	width: number
): string[] {
	if (paragraph.length === 0) {
		return [""];
	}

	const leadingWhitespace =
		paragraph.match(LEADING_WHITESPACE_PATTERN)?.[0] ?? "";
	const body = paragraph.slice(leadingWhitespace.length).trim();
	if (!body) {
		return [leadingWhitespace];
	}

	const wrapped = wrapParagraph(body, width - visibleWidth(leadingWhitespace));
	if (wrapped.length === 0) {
		return [leadingWhitespace];
	}

	return wrapped.map((part) => `${leadingWhitespace}${part}`);
}

function wrapParagraph(text: string, width: number): string[] {
	const effectiveWidth = Math.max(1, width);
	const words = text.split(WORD_SPLIT_PATTERN).filter(Boolean);
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		if (!current) {
			if (visibleWidth(word) <= effectiveWidth) {
				current = word;
			} else {
				lines.push(...breakLongWord(word, effectiveWidth));
			}
			continue;
		}

		const candidate = `${current} ${word}`;
		if (visibleWidth(candidate) <= effectiveWidth) {
			current = candidate;
			continue;
		}

		lines.push(current);
		if (visibleWidth(word) <= effectiveWidth) {
			current = word;
		} else {
			lines.push(...breakLongWord(word, effectiveWidth));
			current = "";
		}
	}

	if (current) {
		lines.push(current);
	}

	return lines;
}

function breakLongWord(word: string, width: number): string[] {
	const effectiveWidth = Math.max(1, width);
	const chunks: string[] = [];
	let current = "";

	for (const char of Array.from(word)) {
		const candidate = `${current}${char}`;
		if (visibleWidth(candidate) > effectiveWidth && current) {
			chunks.push(current);
			current = char;
			continue;
		}
		current = candidate;
	}

	if (current) {
		chunks.push(current);
	}

	return chunks;
}
