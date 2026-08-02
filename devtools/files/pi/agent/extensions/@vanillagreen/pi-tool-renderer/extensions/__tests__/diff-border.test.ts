import { afterEach, describe, expect, test } from "bun:test";

import { buildStructuredDiff, renderMutationCallPreview, renderStructuredDiff } from "../tool-renderer/diff.js";

const ACCENT = "\x1b[96m";
const MUTED = "\x1b[90m";
const RESET = "\x1b[39m";

const previousColumns = process.env.COLUMNS;

afterEach(() => {
	if (previousColumns === undefined) delete process.env.COLUMNS;
	else process.env.COLUMNS = previousColumns;
});

const theme = {
	bg(_token: string, text: string) { return text; },
	bold(text: string) { return text; },
	fg(token: string, text: string) {
		if (token === "borderMuted") return `${text.length === 1 ? ACCENT : MUTED}${text}${RESET}`;
		if (token === "muted") return `${ACCENT}${text}${RESET}`;
		return text;
	},
};

describe("diff border rendering", () => {
	test("unified diff uses one sampled border style for left and right frame glyphs", () => {
		process.env.COLUMNS = "100";
		const diff = buildStructuredDiff("const a = 1;", "const a = 1;\nconst b = 2;");
		const rendered = renderStructuredDiff(diff, theme, true, process.cwd(), null, undefined);
		const lines = rendered.split(/\r?\n/);

		expect(lines[0]).not.toContain(ACCENT);
		expect(lines.at(-1)).not.toContain(ACCENT);
		expect(lines.slice(1, -1).every((line) => line.startsWith(`${MUTED}│${RESET}`))).toBe(true);
		expect(rendered).toContain(`${MUTED}┌${RESET}`);
		expect(rendered).toContain(`${MUTED}│${RESET}`);
		expect(rendered).toContain(`${MUTED}┘${RESET}`);
	});

	test("split diff uses one sampled border style for outer and divider glyphs", () => {
		process.env.COLUMNS = "180";
		const diff = buildStructuredDiff("const a = 1;\nconst c = 3;", "const a = 1;\nconst b = 2;\nconst c = 3;");
		const rendered = renderStructuredDiff(diff, theme, true, process.cwd(), null, undefined);
		const lines = rendered.split(/\r?\n/);

		expect(lines[0]).not.toContain(ACCENT);
		expect(lines.at(-1)).not.toContain(ACCENT);
		expect(lines.slice(1, -1).every((line) => line.startsWith(`${MUTED}│${RESET}`))).toBe(true);
		expect(rendered).toContain(`${MUTED}┌${RESET}`);
		expect(rendered).toContain(`${MUTED}┬${RESET}`);
		expect(rendered).toContain(`${MUTED}│${RESET}`);
		expect(rendered).toContain(`${MUTED}┴${RESET}`);
	});

	test("single mutation call preview renders diff table without tree stem prefix", () => {
		process.env.COLUMNS = "100";
		const diff = buildStructuredDiff("alpha = 1\nbeta = 2", "alpha = 1\nbeta = 22\ndelta = 4");
		const rendered = renderMutationCallPreview("Edit", "demo.ts", [diff], theme, { argsComplete: true }, process.cwd()).render(120);
		const tableLines = rendered.slice(1);

		expect(tableLines.length).toBeGreaterThan(0);
		expect(tableLines.every((line) => !line.startsWith(ACCENT))).toBe(true);
		expect(tableLines[0]).toStartWith(`${MUTED}┌${RESET}`);
	});
});
