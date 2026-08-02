import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DEFAULT_SETTINGS, loadSettings, recordProjectTrust, settingsDiagnostics } from "../src/settings.js";

function tempDir(): string { return mkdtempSync(join(tmpdir(), "pi-web-tools-")); }

function manifestSettings(): Array<{ key: string; default: unknown }> {
	const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
	return manifest.vstack.extensionManager.settings as Array<{ key: string; default: unknown }>;
}

function valueAtPath(record: any, path: string): unknown {
	return path.split(".").reduce((current, part) => current?.[part], record);
}

test("package settings defaults match runtime defaults", () => {
	const settings = manifestSettings();
	const manifestDefaults = Object.fromEntries(settings.map((item) => [item.key, item.default]));
	assert.equal(manifestDefaults.enabled, DEFAULT_SETTINGS.enabled);
	assert.equal(manifestDefaults.defaultProvider, DEFAULT_SETTINGS.defaultProvider);
	assert.equal(manifestDefaults.enabledProviders, DEFAULT_SETTINGS.enabledProviders.join(","));
	assert.equal(manifestDefaults.nativeOpenAiWebSearch, DEFAULT_SETTINGS.nativeOpenAiWebSearch);
	assert.equal(manifestDefaults["githubClone.enabled"], DEFAULT_SETTINGS.githubClone.enabled);
});

test("package settings only expose implemented runtime settings", () => {
	const keys = manifestSettings().map((item) => item.key);
	assert.deepEqual(keys.filter((key) => /curator|activity|shortcut|summaryModel|includeContentByDefault/i.test(key)), []);
	for (const key of keys) assert.notEqual(valueAtPath(DEFAULT_SETTINGS, key), undefined, `${key} must exist in DEFAULT_SETTINGS`);
});

test("loadSettings merges user/project/private config and env wins", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	const privatePath = join(root, "private.json");
	writeFileSync(privatePath, JSON.stringify({ exaApiKey: "private-exa", perplexityApiKey: "private-pplx" }));
	writeFileSync(join(user, "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-web-tools": { autoEnable: false, enabledProviders: "exa,openai-native", webToolsConfigFile: privatePath } } } } }));
	writeFileSync(join(project, ".pi", "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-web-tools": { autoEnable: true, defaultProvider: "exa", githubClone: { maxRepoSizeMB: 100 }, exaResearchModes: { standard: { numResults: 9 } } } } } } }));
	const previousDir = process.env.PI_CODING_AGENT_DIR;
	const previousExa = process.env.EXA_API_KEY;
	process.env.PI_CODING_AGENT_DIR = user;
	process.env.EXA_API_KEY = "env-exa";
	try {
		recordProjectTrust({ cwd: project, isProjectTrusted: () => true });
		const settings = loadSettings(project);
		assert.equal(settings.autoEnable, true);
		assert.equal(settings.defaultProvider, "exa");
		assert.deepEqual(settings.enabledProviders, ["exa", "openai-native"]);
		assert.equal(settings.githubClone.maxRepoSizeMB, 100);
		assert.deepEqual(settings.exaResearchModes.standard, { numResults: 9 });
		assert.equal(settings.apiKeys.exa, "env-exa");
		assert.equal(settings.apiKeys.perplexity, "private-pplx");
	} finally {
		if (previousDir === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previousDir;
		if (previousExa === undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY = previousExa;
	}
});

test("loadSettings skips project settings until project trust is recorded", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeFileSync(join(user, "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-web-tools": { autoEnable: false } } } } }));
	writeFileSync(join(project, ".pi", "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-web-tools": { autoEnable: true } } } } }));
	const previousDir = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = user;
	try {
		recordProjectTrust({ cwd: project, isProjectTrusted: () => false });
		assert.equal(loadSettings(project).autoEnable, false);
		recordProjectTrust({ cwd: project, isProjectTrusted: () => true });
		assert.equal(loadSettings(project).autoEnable, true);
	} finally {
		if (previousDir === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previousDir;
	}
});

test("settingsDiagnostics reports malformed JSON", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeFileSync(join(user, "settings.json"), "{");
	const previous = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = user;
	try { assert.equal(settingsDiagnostics(project).length, 1); }
	finally { if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previous; }
});

test("loadSettings parses JSON string Exa research mode overrides", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeFileSync(join(user, "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-web-tools": { exaResearchModes: JSON.stringify({ lite: { numResults: 3, summaryQuery: "fast" } }) } } } } }));
	const previousDir = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = user;
	try {
		const settings = loadSettings(project);
		assert.deepEqual(settings.exaResearchModes.lite, { numResults: 3, summaryQuery: "fast" });
	} finally {
		if (previousDir === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previousDir;
	}
});

test("loadSettings reads project .env.local without overriding process env", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeFileSync(join(project, ".env.local"), 'EXA_API_KEY="env-file-exa"\nPERPLEXITY_API_KEY=env-file-pplx\n');
	const previousDir = process.env.PI_CODING_AGENT_DIR;
	const previousExa = process.env.EXA_API_KEY;
	process.env.PI_CODING_AGENT_DIR = user;
	delete process.env.EXA_API_KEY;
	try {
		recordProjectTrust({ cwd: project, isProjectTrusted: () => false });
		let settings = loadSettings(project);
		assert.equal(settings.apiKeys.exa, undefined);
		assert.equal(settings.apiKeys.perplexity, undefined);
		recordProjectTrust({ cwd: project, isProjectTrusted: () => true });
		settings = loadSettings(project);
		assert.equal(settings.apiKeys.exa, "env-file-exa");
		assert.equal(settings.apiKeys.perplexity, "env-file-pplx");
		process.env.EXA_API_KEY = "process-exa";
		settings = loadSettings(project);
		assert.equal(settings.apiKeys.exa, "process-exa");
	} finally {
		if (previousDir === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previousDir;
		if (previousExa === undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY = previousExa;
	}
});

test("loadSettings treats slow op:// API key references as unset", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	const bin = join(root, "bin");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	mkdirSync(bin, { recursive: true });
	writeFileSync(join(bin, "op"), "#!/usr/bin/env bash\n[ \"$1\" = read ] && { sleep 5; printf late-secret; exit 0; }\nexit 1\n");
	chmodSync(join(bin, "op"), 0o755);
	writeFileSync(join(user, "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-web-tools": { exaApiKey: "op://vault/exa/key" } } } } }));
	const previousDir = process.env.PI_CODING_AGENT_DIR;
	const previousPath = process.env.PATH;
	const previousExa = process.env.EXA_API_KEY;
	const previousTimeout = process.env.PI_WEB_TOOLS_OP_READ_TIMEOUT_MS;
	process.env.PI_CODING_AGENT_DIR = user;
	process.env.PATH = `${bin}:${previousPath}`;
	process.env.PI_WEB_TOOLS_OP_READ_TIMEOUT_MS = "100";
	delete process.env.EXA_API_KEY;
	try {
		const started = Date.now();
		const settings = loadSettings(project);
		assert.equal(settings.apiKeys.exa, undefined);
		assert.ok(Date.now() - started < 1500);
		assert.match(settings.warnings.join("\n"), /EXA_API_KEY.*within 100ms.*unset/);
		assert.doesNotMatch(settings.warnings.join("\n"), /op:\/\//);
	} finally {
		if (previousDir === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previousDir;
		process.env.PATH = previousPath;
		if (previousExa === undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY = previousExa;
		if (previousTimeout === undefined) delete process.env.PI_WEB_TOOLS_OP_READ_TIMEOUT_MS; else process.env.PI_WEB_TOOLS_OP_READ_TIMEOUT_MS = previousTimeout;
	}
});

test("loadSettings resolves op:// API key references with op CLI", () => {
	const root = tempDir();
	const user = join(root, "agent");
	const project = join(root, "project");
	const bin = join(root, "bin");
	mkdirSync(user, { recursive: true });
	mkdirSync(join(project, ".pi"), { recursive: true });
	mkdirSync(bin, { recursive: true });
	writeFileSync(join(bin, "op"), "#!/usr/bin/env bash\n[ \"$1\" = read ] && [ \"$2\" = 'op://vault/exa/key' ] && { printf resolved-exa; exit 0; }\nexit 1\n");
	chmodSync(join(bin, "op"), 0o755);
	writeFileSync(join(user, "settings.json"), JSON.stringify({ vstack: { extensionManager: { config: { "@vanillagreen/pi-web-tools": { exaApiKey: "op://vault/exa/key" } } } } }));
	const previousDir = process.env.PI_CODING_AGENT_DIR;
	const previousPath = process.env.PATH;
	const previousExa = process.env.EXA_API_KEY;
	process.env.PI_CODING_AGENT_DIR = user;
	process.env.PATH = `${bin}:${previousPath}`;
	delete process.env.EXA_API_KEY;
	try {
		const settings = loadSettings(project);
		assert.equal(settings.apiKeys.exa, "resolved-exa");
	} finally {
		if (previousDir === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previousDir;
		process.env.PATH = previousPath;
		if (previousExa === undefined) delete process.env.EXA_API_KEY; else process.env.EXA_API_KEY = previousExa;
	}
});
