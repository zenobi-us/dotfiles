import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const cli = new URL("./bundle-versions.ts", import.meta.url).pathname;
const bundlesRoot = "files/devtools/agent/bundles";
const marketplacePath = `${bundlesRoot}/.claude-plugin/marketplace.json`;
const temporary: string[] = [];

type BundleDefinition = { name: string; version: string };

type CommandResult = { exitCode: number; stdout: string; stderr: string };

function scratch(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "bundle-versions-test-"));
  temporary.push(dir);
  return dir;
}

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop()!, { recursive: true, force: true });
});

function writeJson(root: string, relativePath: string, value: unknown): void {
  const file = path.join(root, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(root: string, relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as Record<string, unknown>;
}

function pluginPath(name: string): string {
  return `${bundlesRoot}/${name}/.claude-plugin/plugin.json`;
}

function contentPath(name: string): string {
  return `${bundlesRoot}/${name}/content.txt`;
}

function marketplace(bundles: BundleDefinition[]): Record<string, unknown> {
  return {
    name: "test-bundles",
    plugins: bundles.map(({ name, version }) => ({ name, source: `./${name}`, version })),
  };
}

function createRepository(bundles: BundleDefinition[] = [{ name: "alpha", version: "0.1.0" }]): string {
  const root = scratch();
  runGit(root, "init", "--quiet");
  for (const bundle of bundles) {
    writeJson(root, pluginPath(bundle.name), { name: bundle.name, version: bundle.version });
    writeFileSync(path.join(root, contentPath(bundle.name)), "baseline\n");
  }
  writeJson(root, marketplacePath, marketplace(bundles));
  runGit(root, "add", ".");
  runGit(root, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--quiet", "-m", "baseline");
  return root;
}

function runGit(root: string, ...args: string[]): void {
  const result = Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(new TextDecoder().decode(result.stderr));
}

function runCli(root: string, command: "check" | "fix", ...files: string[]): CommandResult {
  const result = Bun.spawnSync([process.execPath, cli, command, ...files], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout),
    stderr: new TextDecoder().decode(result.stderr),
  };
}

function setPluginVersion(root: string, name: string, version: string): void {
  const plugin = readJson(root, pluginPath(name));
  plugin.version = version;
  writeJson(root, pluginPath(name), plugin);
}

function setMarketplaceVersion(root: string, name: string, version: string): void {
  const catalog = readJson(root, marketplacePath);
  const plugins = catalog.plugins as Array<Record<string, unknown>>;
  const entry = plugins.find((plugin) => plugin.name === name);
  if (!entry) throw new Error(`missing marketplace entry for ${name}`);
  entry.version = version;
  writeJson(root, marketplacePath, catalog);
}

function versions(root: string, name: string): [string, string] {
  const plugin = readJson(root, pluginPath(name));
  const catalog = readJson(root, marketplacePath);
  const entry = (catalog.plugins as Array<Record<string, unknown>>).find((item) => item.name === name);
  return [plugin.version as string, entry?.version as string];
}

test("no selected bundle files is a no-op", () => {
  const root = createRepository();
  expect(runCli(root, "check").exitCode).toBe(0);
});

test("changed bundle content requires both version records to increase", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");

  const result = runCli(root, "check", contentPath("alpha"));

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("plugin version 0.1.0 must be greater than HEAD version 0.1.0");
  expect(result.stderr).toContain("marketplace version 0.1.0 must be greater than HEAD version 0.1.0");
});

test("staged scope ignores unstaged work and checks the index", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");

  expect(runCli(root, "check", "--staged").exitCode).toBe(0);
  runGit(root, "add", contentPath("alpha"));
  expect(runCli(root, "check", "--staged").exitCode).toBe(1);
});

test("matching manual version bumps pass", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");
  setPluginVersion(root, "alpha", "0.2.0");
  setMarketplaceVersion(root, "alpha", "0.2.0");

  expect(runCli(root, "check", contentPath("alpha"), pluginPath("alpha"), marketplacePath).exitCode).toBe(0);
});

test("fix copies a manual plugin bump to the marketplace", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");
  setPluginVersion(root, "alpha", "0.2.0");

  const result = runCli(root, "fix", contentPath("alpha"), pluginPath("alpha"));

  expect(result.exitCode).toBe(0);
  expect(versions(root, "alpha")).toEqual(["0.2.0", "0.2.0"]);
});

test("fix copies a manual marketplace bump to the plugin manifest", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");
  setMarketplaceVersion(root, "alpha", "0.3.0");

  const result = runCli(root, "fix", contentPath("alpha"), marketplacePath);

  expect(result.exitCode).toBe(0);
  expect(versions(root, "alpha")).toEqual(["0.3.0", "0.3.0"]);
});

test("fix increments the patch version when neither record was bumped", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");

  const result = runCli(root, "fix", contentPath("alpha"));

  expect(result.exitCode).toBe(0);
  expect(versions(root, "alpha")).toEqual(["0.1.1", "0.1.1"]);
});

test("fix rejects conflicting manual bumps without changing either record", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");
  setPluginVersion(root, "alpha", "0.2.0");
  setMarketplaceVersion(root, "alpha", "0.1.1");

  const result = runCli(root, "fix", contentPath("alpha"), pluginPath("alpha"), marketplacePath);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("different manual version bumps");
  expect(versions(root, "alpha")).toEqual(["0.2.0", "0.1.1"]);
});

test("fix rejects a malformed version without writing the marketplace", () => {
  const root = createRepository();
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");
  setPluginVersion(root, "alpha", "next");
  const marketplaceBefore = readFileSync(path.join(root, marketplacePath), "utf8");

  const result = runCli(root, "fix", contentPath("alpha"), pluginPath("alpha"));

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("must be a valid SemVer value");
  expect(readFileSync(path.join(root, marketplacePath), "utf8")).toBe(marketplaceBefore);
});

test("a new bundle passes when its two initial versions match", () => {
  const root = createRepository([]);
  writeJson(root, pluginPath("new-plugin"), { name: "new-plugin", version: "0.1.0" });
  writeFileSync(path.join(root, contentPath("new-plugin")), "new\n");
  writeJson(root, marketplacePath, marketplace([{ name: "new-plugin", version: "0.1.0" }]));

  expect(runCli(root, "check", contentPath("new-plugin"), pluginPath("new-plugin"), marketplacePath).exitCode).toBe(0);
});

test("a deleted plugin requires removal of its marketplace entry", () => {
  const root = createRepository();
  rmSync(path.join(root, bundlesRoot, "alpha"), { recursive: true });

  const result = runCli(root, "check", "--dirty");

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain("plugin.json is missing while its marketplace entry remains");
});

test("fix updates multiple bundles and writes the shared marketplace once", () => {
  const root = createRepository([
    { name: "alpha", version: "0.1.0" },
    { name: "beta", version: "1.4.2" },
  ]);
  writeFileSync(path.join(root, contentPath("alpha")), "changed\n");
  writeFileSync(path.join(root, contentPath("beta")), "changed\n");

  const result = runCli(root, "fix", contentPath("alpha"), contentPath("beta"));

  expect(result.exitCode).toBe(0);
  expect(versions(root, "alpha")).toEqual(["0.1.1", "0.1.1"]);
  expect(versions(root, "beta")).toEqual(["1.4.3", "1.4.3"]);
});

test("bundle names containing spaces remain one argument", () => {
  const root = createRepository([{ name: "alpha plugin", version: "0.1.0" }]);
  writeFileSync(path.join(root, contentPath("alpha plugin")), "changed\n");

  const result = runCli(root, "fix", contentPath("alpha plugin"));

  expect(result.exitCode).toBe(0);
  expect(versions(root, "alpha plugin")).toEqual(["0.1.1", "0.1.1"]);
});
