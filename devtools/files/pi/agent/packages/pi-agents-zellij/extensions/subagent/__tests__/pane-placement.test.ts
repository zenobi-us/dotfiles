import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";

import type { AgentConfig } from "../agents.js";
import { ensurePersistentPane, setPaneExecCaptureForTests } from "../pane.js";

const originalAgentDir = process.env.PI_CODING_AGENT_DIR;
const originalZellij = process.env.ZELLIJ;
const tempDirs: string[] = [];

function tempDir(prefix: string): string {
	const dir = mkdtempSync(join(tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

function testAgent(): AgentConfig {
	return {
		name: "test-pane",
		description: "Test pane agent",
		pane: true,
		source: "project",
		systemPrompt: "",
		filePath: "test-pane.md",
	};
}

afterEach(() => {
	setPaneExecCaptureForTests();
	if (originalAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
	else process.env.PI_CODING_AGENT_DIR = originalAgentDir;
	if (originalZellij === undefined) delete process.env.ZELLIJ;
	else process.env.ZELLIJ = originalZellij;
	for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

test("anchors stacked and split panes near the calling pane", async () => {
	const agentDir = tempDir("pi-agents-placement-config-");
	const cwd = tempDir("pi-agents-placement-cwd-");
	process.env.PI_CODING_AGENT_DIR = agentDir;
	process.env.ZELLIJ = "0";

	const launches: string[][] = [];
	let paneId = 40;
	setPaneExecCaptureForTests(async (command, args) => {
		if (command === "zellij" && args[0] === "action" && args[1] === "list-panes") {
			return { code: 0, stdout: "[]", stderr: "" };
		}
		if (command === "zellij" && args[0] === "action" && args[1] === "new-pane") {
			launches.push(args);
			paneId += 1;
			return { code: 0, stdout: `terminal_${paneId}\n`, stderr: "" };
		}
		if (command === "bash") return { code: 0, stdout: "", stderr: "" };
		return { code: 1, stdout: "", stderr: `unexpected command: ${command} ${args.join(" ")}` };
	});

	await ensurePersistentPane(tempDir("pi-agents-placement-stacked-"), "parent", cwd, testAgent(), undefined, undefined);
	expect(launches[0]).toContain("--near-current-pane");
	expect(launches[0]).toContain("--stacked");
	expect(launches[0]).not.toContain("--direction");

	writeFileSync(
		join(agentDir, "settings.json"),
		JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-agents-zellij": { stackedPanes: false } } } } }),
	);
	await ensurePersistentPane(tempDir("pi-agents-placement-split-"), "parent", cwd, testAgent(), undefined, undefined);
	expect(launches[1]).toContain("--near-current-pane");
	expect(launches[1]).toContain("--direction");
	expect(launches[1]).toContain("down");
	expect(launches[1]).not.toContain("--stacked");
});
