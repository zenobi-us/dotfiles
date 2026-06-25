import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { AskConfig } from "../config/schema.ts";
import {
	type FooterKeymapContext,
	renderFooterKeymaps,
} from "../constants/keymaps.ts";
import { NO_PREVIEW_TEXT } from "../constants/text.ts";
import { UI_DIMENSIONS, UI_TEXT } from "../constants/ui.ts";
import { clamp } from "../math.ts";
import { wrapText } from "../text.ts";

type Theme = ExtensionContext["ui"]["theme"];
type ThemeColor =
	| "accent"
	| "muted"
	| "text"
	| "dim"
	| "success"
	| "warning"
	| "syntaxString";

const EDITOR_BORDER_PATTERN = /^[┌┐└┘─]+$/;
const EDITOR_SCROLL_BORDER_PATTERN = /^─── [↑↓] \d+ more ─*$/;
const ANSI_CONTROL_SEQUENCE = "\u001b[";
const ANSI_TERMINATOR = "m";

export function pushWrappedText(
	lines: string[],
	text: string,
	width: number,
	theme: Theme,
	color: ThemeColor,
	prefix = "",
	continuationPrefix = prefix
) {
	const availableWidth = Math.max(1, width - visibleWidth(prefix));
	const wrapped = wrapText(text, availableWidth);
	for (let index = 0; index < wrapped.length; index++) {
		const line = wrapped[index];
		const currentPrefix = index === 0 ? prefix : continuationPrefix;
		lines.push(
			truncateToWidth(`${currentPrefix}${theme.fg(color, line)}`, width)
		);
	}
	if (wrapped.length === 0) {
		lines.push(truncateToWidth(prefix, width));
	}
}

export function renderInputLine(
	line: string,
	availableWidth: number,
	theme: Theme,
	color: ThemeColor = "text"
): string {
	const innerWidth = Math.max(4, availableWidth - 2);
	const truncated = truncateToWidth(line, innerWidth);
	const padding = " ".repeat(Math.max(0, innerWidth - visibleWidth(truncated)));
	return theme.bg("selectedBg", ` ${theme.fg(color, truncated)}${padding} `);
}

export function renderEditorBlock(args: {
	lines: string[];
	editorLines: string[];
	width: number;
	theme: Theme;
	indent: string;
	availableWidth: number;
	placeholder?: string;
	placeholderColor?: ThemeColor;
	contentColor?: ThemeColor;
	isEmpty?: boolean;
}) {
	const {
		lines,
		editorLines,
		width,
		theme,
		indent,
		availableWidth,
		placeholder,
		placeholderColor = "muted",
		isEmpty = false,
	} = args;
	const innerLines = getEditorContentLines(editorLines);

	if (isEmpty && placeholder) {
		lines.push(
			truncateToWidth(
				`${indent}${renderInputLine(
					placeholder,
					availableWidth,
					theme,
					placeholderColor
				)}`,
				width
			)
		);
		return;
	}

	for (const editorLine of innerLines) {
		lines.push(
			truncateToWidth(
				`${indent}${renderEditorLine(editorLine, availableWidth, theme)}`,
				width
			)
		);
	}
}

export function renderLabeledEditorBlock(args: {
	lines: string[];
	label: string;
	editorLines: string[];
	width: number;
	theme: Theme;
	indent: string;
	availableWidth: number;
	placeholder?: string;
	placeholderColor?: ThemeColor;
	isEmpty?: boolean;
}) {
	const {
		lines,
		label,
		editorLines,
		width,
		theme,
		indent,
		availableWidth,
		placeholder,
		placeholderColor = "muted",
		isEmpty = false,
	} = args;
	const contentLines = getEditorContentLines(editorLines);
	const labelText = theme.fg("accent", label);
	const contentIndent = `${indent}${" ".repeat(visibleWidth(label) + 1)}`;
	const editorWidth = Math.max(4, availableWidth - visibleWidth(label) - 1);
	const firstLine =
		isEmpty && placeholder
			? renderInputLine(placeholder, editorWidth, theme, placeholderColor)
			: renderEditorLine(contentLines[0] ?? "", editorWidth, theme);

	lines.push(truncateToWidth(`${indent}${labelText} ${firstLine}`, width));

	for (const editorLine of contentLines.slice(1)) {
		lines.push(
			truncateToWidth(
				`${contentIndent}${renderEditorLine(editorLine, availableWidth, theme)}`,
				width
			)
		);
	}
}

function getEditorContentLines(editorLines: string[]): string[] {
	if (editorLines.length <= 2) {
		return editorLines;
	}

	const contentLines = editorLines.slice(1);
	const trailingBorderIndex = contentLines.findIndex(isEditorBorderLine);
	if (trailingBorderIndex === -1) {
		return contentLines;
	}

	return contentLines.filter((_, index) => index !== trailingBorderIndex);
}

function isEditorBorderLine(line: string): boolean {
	const plainText = stripAnsiColorCodes(line).trim();
	if (plainText.length === 0) {
		return false;
	}

	return (
		EDITOR_BORDER_PATTERN.test(plainText) ||
		EDITOR_SCROLL_BORDER_PATTERN.test(plainText)
	);
}

function stripAnsiColorCodes(text: string): string {
	let result = text;
	while (true) {
		const start = result.indexOf(ANSI_CONTROL_SEQUENCE);
		if (start === -1) {
			return result;
		}

		const end = result.indexOf(
			ANSI_TERMINATOR,
			start + ANSI_CONTROL_SEQUENCE.length
		);
		if (end === -1) {
			return result;
		}

		result =
			result.slice(0, start) + result.slice(end + ANSI_TERMINATOR.length);
	}
}

function renderEditorLine(
	line: string,
	availableWidth: number,
	theme: Theme
): string {
	const innerWidth = Math.max(4, availableWidth - 2);
	const truncated = truncateToWidth(line, innerWidth);
	const padding = " ".repeat(Math.max(0, innerWidth - visibleWidth(truncated)));
	return renderPersistentBackground(
		`${truncated}${padding}`,
		theme,
		"selectedBg"
	);
}

function renderPersistentBackground(
	text: string,
	theme: Theme,
	background: "selectedBg"
): string {
	const marker = "__PI_BG_MARKER__";
	const wrappedMarker = theme.bg(background, marker);
	const markerIndex = wrappedMarker.indexOf(marker);
	if (markerIndex === -1) {
		return theme.bg(background, ` ${text} `);
	}

	const prefix = wrappedMarker.slice(0, markerIndex);
	const suffix = wrappedMarker.slice(markerIndex + marker.length);
	const ansiReset = "\u001b[0m";
	const reopenedText = text.split(ansiReset).join(`${ansiReset}${prefix}`);
	return `${prefix} ${reopenedText} ${suffix}`;
}

export function renderBox(
	content: Array<{ text: string; color: ThemeColor }>,
	width: number,
	theme: Theme
): string[] {
	const boxWidth = Math.max(UI_DIMENSIONS.boxMinWidth, width);
	const innerWidth = Math.max(4, boxWidth - 2);
	const top = theme.fg("accent", `┌${"─".repeat(innerWidth)}┐`);
	const bottom = theme.fg("accent", `└${"─".repeat(innerWidth)}┘`);
	const lines = [top];
	for (const item of content) {
		for (const rawLine of wrapText(item.text, innerWidth)) {
			const line = theme.fg(item.color, rawLine);
			const padding = " ".repeat(Math.max(0, innerWidth - visibleWidth(line)));
			lines.push(
				theme.fg("accent", "│") + line + padding + theme.fg("accent", "│")
			);
		}
	}
	lines.push(bottom);
	return lines;
}

export function renderPreviewPaneContent(
	selectedOption:
		| {
				label: string;
				description?: string;
				preview?: string;
		  }
		| undefined,
	theme: Theme,
	width: number
): string[] {
	if (!selectedOption) {
		return renderBox([{ text: NO_PREVIEW_TEXT, color: "dim" }], width, theme);
	}

	const content: Array<{ text: string; color: ThemeColor }> = [
		{ text: selectedOption.label, color: "accent" },
	];
	if (selectedOption.description) {
		content.push({ text: selectedOption.description, color: "muted" });
	}
	content.push({ text: "", color: "dim" });

	for (const previewLine of (selectedOption.preview ?? NO_PREVIEW_TEXT).split(
		"\n"
	)) {
		content.push({
			text: previewLine,
			color: selectedOption.preview ? "text" : "dim",
		});
	}
	return renderBox(content, width, theme);
}

export function mergeColumns(
	left: string[],
	right: string[],
	leftWidth: number,
	width: number
): string[] {
	const lines: string[] = [];
	const rowCount = Math.max(left.length, right.length);
	for (let index = 0; index < rowCount; index++) {
		const leftLine = left[index] ?? "";
		const rightLine = right[index] ?? "";
		const paddedLeft = padToVisibleWidth(leftLine, leftWidth);
		lines.push(truncateToWidth(`${paddedLeft}  ${rightLine}`, width));
	}
	return lines;
}

export function measurePreviewLeftWidth(
	options: Array<{ label: string; description?: string }>,
	width: number
): number {
	let widest = 0;
	for (let index = 0; index < options.length; index++) {
		const option = options[index];
		widest = Math.max(
			widest,
			visibleWidth(`${index + 1}. ${option.label}`),
			option.description ? visibleWidth(option.description) : 0
		);
	}

	const preferred = widest + 4;
	const maxWidth = Math.min(
		UI_DIMENSIONS.previewLeftMaxWidth,
		Math.floor(width * UI_DIMENSIONS.previewLeftRatio)
	);
	return clamp(
		preferred,
		UI_DIMENSIONS.previewLeftMinWidth,
		Math.max(UI_DIMENSIONS.previewLeftMinWidth, maxWidth)
	);
}

export function getSavedNotePrefixes(
	theme: Theme,
	args: { indent: string; label?: string }
) {
	const title = args.label
		? `${args.label} ${UI_TEXT.questionNoteTitle}`
		: UI_TEXT.questionNoteTitle;
	return {
		prefix: `${args.indent}${theme.fg("syntaxString", title)} `,
		continuationPrefix: `${args.indent}${" ".repeat(visibleWidth(title) + 1)}`,
	};
}

export function pushSavedNote(args: {
	lines: string[];
	note: string;
	width: number;
	theme: Theme;
	indent: string;
	label?: string;
}) {
	const { lines, note, width, theme, indent, label } = args;
	const { prefix, continuationPrefix } = getSavedNotePrefixes(theme, {
		indent,
		label,
	});
	pushWrappedText(
		lines,
		note,
		width,
		theme,
		"muted",
		prefix,
		continuationPrefix
	);
}

export function renderFooterText(
	config: AskConfig,
	mode: FooterKeymapContext
): string {
	return renderFooterKeymaps(config, mode);
}

function padToVisibleWidth(text: string, width: number): string {
	return text + " ".repeat(Math.max(0, width - visibleWidth(text)));
}
