import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DEFAULT_SETTINGS, loadSettings, recordProjectTrust, settingsDiagnostics } from "../src/settings.js";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "pi-codex-minimal-tools-"));
}

test("package settings defaults match runtime defaults", () => {
	const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
	const settings = manifest.vstack.extensionManager.settings as Array<{ key: keyof typeof DEFAULT_SETTINGS; default: unknown }>;
	const manifestDefaults = Object.fromEntries(settings.map((item) => [item.key, item.default]));
	assert.deepEqual(manifestDefaults, DEFAULT_SETTINGS);
});

test("settingsDiagnostics reports malformed JSON settings", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeFileSync(join(user, "settings.json"), "{");
	const previous = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = user;
	try {
		const diagnostics = settingsDiagnostics(project);
		assert.equal(diagnostics.length, 1);
		assert.match(diagnostics[0]!, /settings\.json/);
	} finally {
		if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previous;
	}
});

test("loadSettings merges user settings then project settings", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeFileSync(join(user, "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-codex-minimal-tools": { autoEnable: false, imageOutputDir: "user-images", imageModel: "gpt-image-1" } } } } }));
	writeFileSync(join(project, ".pi", "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-codex-minimal-tools": { autoEnable: true, imageOutputDir: "project-images", imageModel: "bad-model", directImageApiFallback: true } } } } }));
	const previous = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = user;
	try {
		recordProjectTrust({ cwd: project, isProjectTrusted: () => true });
		const settings = loadSettings(project);
		assert.equal(settings.autoEnable, true);
		assert.equal(settings.imageOutputDir, "project-images");
		assert.equal(settings.imageModel, "gpt-image-2");
		assert.equal(settings.directImageApiFallback, true);
		assert.equal(settings.applyPatchEnabled, true);
	} finally {
		if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previous;
	}
});

test("loadSettings skips project settings until project trust is recorded", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeFileSync(join(user, "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-codex-minimal-tools": { autoEnable: false } } } } }));
	writeFileSync(join(project, ".pi", "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-codex-minimal-tools": { autoEnable: true } } } } }));
	const previous = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = user;
	try {
		recordProjectTrust({ cwd: project, isProjectTrusted: () => false });
		assert.equal(loadSettings(project).autoEnable, false);
		recordProjectTrust({ cwd: project, isProjectTrusted: () => true });
		assert.equal(loadSettings(project).autoEnable, true);
	} finally {
		if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previous;
	}
});
