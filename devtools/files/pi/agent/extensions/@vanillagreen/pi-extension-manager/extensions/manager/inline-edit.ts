import { matchesKey } from "@earendil-works/pi-tui";
import { isPlainSearchInput } from "./format.js";
import type { InlineEditChar, InlineEditState } from "./types.js";

function inlineEditChars(text: string): InlineEditChar[] {
	const out: InlineEditChar[] = [];
	let offset = 0;
	for (const ch of text) {
		const start = offset;
		offset += ch.length;
		out.push({ ch, start, end: offset });
	}
	return out;
}

function clampInlineCursor(editing: InlineEditState): void {
	editing.cursor = Math.max(0, Math.min(editing.cursor, editing.buffer.length));
}

function codeUnitToCharIndex(chars: InlineEditChar[], cursor: number): number {
	let index = 0;
	while (index < chars.length && chars[index]!.end <= cursor) index += 1;
	return index;
}

function charIndexToCodeUnit(chars: InlineEditChar[], index: number, textLength: number): number {
	if (index <= 0) return 0;
	if (index >= chars.length) return textLength;
	return chars[index]!.start;
}

function inlineCharKind(ch: string): "space" | "word" | "punct" {
	if (/\s/u.test(ch)) return "space";
	if (/[A-Za-z0-9_]/.test(ch)) return "word";
	return "punct";
}

function moveInlineCursorByChars(editing: InlineEditState, delta: number): void {
	const chars = inlineEditChars(editing.buffer);
	const index = codeUnitToCharIndex(chars, editing.cursor);
	editing.cursor = charIndexToCodeUnit(chars, index + delta, editing.buffer.length);
}

function moveInlineCursorWordLeft(editing: InlineEditState): void {
	const chars = inlineEditChars(editing.buffer);
	let index = codeUnitToCharIndex(chars, editing.cursor);
	while (index > 0 && inlineCharKind(chars[index - 1]!.ch) === "space") index -= 1;
	if (index <= 0) {
		editing.cursor = 0;
		return;
	}
	const kind = inlineCharKind(chars[index - 1]!.ch);
	while (index > 0 && inlineCharKind(chars[index - 1]!.ch) === kind) index -= 1;
	editing.cursor = charIndexToCodeUnit(chars, index, editing.buffer.length);
}

function moveInlineCursorWordRight(editing: InlineEditState): void {
	const chars = inlineEditChars(editing.buffer);
	let index = codeUnitToCharIndex(chars, editing.cursor);
	while (index < chars.length && inlineCharKind(chars[index]!.ch) === "space") index += 1;
	if (index >= chars.length) {
		editing.cursor = editing.buffer.length;
		return;
	}
	const kind = inlineCharKind(chars[index]!.ch);
	while (index < chars.length && inlineCharKind(chars[index]!.ch) === kind) index += 1;
	editing.cursor = charIndexToCodeUnit(chars, index, editing.buffer.length);
}

function insertInlineText(editing: InlineEditState, text: string): void {
	clampInlineCursor(editing);
	editing.buffer = `${editing.buffer.slice(0, editing.cursor)}${text}${editing.buffer.slice(editing.cursor)}`;
	editing.cursor += text.length;
}

function deleteInlineRange(editing: InlineEditState, start: number, end: number): void {
	const safeStart = Math.max(0, Math.min(start, editing.buffer.length));
	const safeEnd = Math.max(safeStart, Math.min(end, editing.buffer.length));
	editing.buffer = `${editing.buffer.slice(0, safeStart)}${editing.buffer.slice(safeEnd)}`;
	editing.cursor = safeStart;
}

export function handleInlineEditInput(editing: InlineEditState, data: string): boolean {
	clampInlineCursor(editing);
	if (matchesKey(data, "left") || matchesKey(data, "ctrl+b")) {
		moveInlineCursorByChars(editing, -1);
		return true;
	}
	if (matchesKey(data, "right") || matchesKey(data, "ctrl+f")) {
		moveInlineCursorByChars(editing, 1);
		return true;
	}
	if (matchesKey(data, "alt+left") || matchesKey(data, "ctrl+left") || matchesKey(data, "alt+b")) {
		moveInlineCursorWordLeft(editing);
		return true;
	}
	if (matchesKey(data, "alt+right") || matchesKey(data, "ctrl+right") || matchesKey(data, "alt+f")) {
		moveInlineCursorWordRight(editing);
		return true;
	}
	if (matchesKey(data, "home") || matchesKey(data, "ctrl+a")) {
		editing.cursor = 0;
		return true;
	}
	if (matchesKey(data, "end") || matchesKey(data, "ctrl+e")) {
		editing.cursor = editing.buffer.length;
		return true;
	}
	if (matchesKey(data, "backspace")) {
		const before = editing.cursor;
		moveInlineCursorByChars(editing, -1);
		deleteInlineRange(editing, editing.cursor, before);
		return true;
	}
	if (matchesKey(data, "delete") || matchesKey(data, "ctrl+d")) {
		const start = editing.cursor;
		moveInlineCursorByChars(editing, 1);
		deleteInlineRange(editing, start, editing.cursor);
		return true;
	}
	if (matchesKey(data, "ctrl+u")) {
		editing.buffer = "";
		editing.cursor = 0;
		return true;
	}
	if (isPlainSearchInput(data)) {
		insertInlineText(editing, data);
		return true;
	}
	return false;
}

export function renderInlineEditValue(editing: InlineEditState): string {
	clampInlineCursor(editing);
	return `${editing.buffer.slice(0, editing.cursor)}█${editing.buffer.slice(editing.cursor)}`;
}
