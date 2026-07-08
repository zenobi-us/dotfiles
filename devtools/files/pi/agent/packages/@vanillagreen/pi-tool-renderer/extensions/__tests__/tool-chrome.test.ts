import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { visibleWidth } from "@earendil-works/pi-tui";

import { stripAnsi } from "../tool-renderer/ansi.js";
import { __test } from "../tool-renderer/chrome.js";
import { recordProjectTrust } from "../tool-renderer/settings.js";

const createdDirs: string[] = [];

afterEach(() => {
	for (const dir of createdDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const theme = {
	fg(token: string, text: string) {
		if (token === "borderMuted") return `\x1b[90m${text}\x1b[39m`;
		return text;
	},
};

function tempCwd(config?: Record<string, unknown>): string {
	const dir = mkdtempSync(join(tmpdir(), "pi-tool-renderer-chrome-"));
	createdDirs.push(dir);
	if (config) {
		mkdirSync(join(dir, ".pi"), { recursive: true });
		writeFileSync(join(dir, ".pi", "settings.json"), JSON.stringify({
			vstack: { extensionManager: { config: { "@vanillagreen/pi-tool-renderer": config } } },
		}));
		recordProjectTrust({ cwd: dir, isProjectTrusted: () => true });
	}
	return dir;
}

function toolComponent(cwd: string): any {
	return {
		cwd,
		toolCallId: "call-1",
		toolName: "bash",
		ui: { theme },
	};
}

describe("tool chrome", () => {
	test("self-rendered tools regain outline rules after Pi trims empty shell rows", () => {
		const cwd = tempCwd();
		const rendered = ["", "● Bash $ echo hi", ""];
		const lines = __test.renderToolChromeLines(toolComponent(cwd), rendered, 40);

		expect(lines).toHaveLength(3);
		expect(stripAnsi(lines[0]!)).toBe("─".repeat(39));
		expect(stripAnsi(lines[1]!)).toBe("● Bash $ echo hi");
		expect(stripAnsi(lines[2]!)).toBe("─".repeat(39));
		expect(lines.every((line) => visibleWidth(line) <= 39)).toBe(true);
	});

	test("transparent chrome still trims blank self-render shell rows without rules", () => {
		const cwd = tempCwd({ toolChrome: "transparent" });
		const lines = __test.renderToolChromeLines(toolComponent(cwd), ["", "● Bash $ echo hi", ""], 40);

		expect(lines).toEqual(["● Bash $ echo hi"]);
	});

	test("off chrome leaves Pi-rendered shell rows unchanged", () => {
		const cwd = tempCwd({ toolChrome: "off" });
		const rendered = ["", "● Bash $ echo hi", ""];

		expect(__test.renderToolChromeLines(toolComponent(cwd), rendered, 40)).toEqual(rendered);
	});
});
