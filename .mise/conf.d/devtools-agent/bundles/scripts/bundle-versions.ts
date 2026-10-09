#!/usr/bin/env -S mise exec -- bun run

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const bundlesRoot = ".mise/conf.d/devtools-agent/bundles";
const marketplacePath = `${bundlesRoot}/.claude-plugin/marketplace.json`;
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

type JsonObject = Record<string, unknown>;

type MarketplaceEntry = JsonObject & {
  name?: unknown;
  source?: unknown;
  version?: unknown;
};

type Marketplace = JsonObject & {
  plugins?: unknown;
};

type BundleState = {
  bundle: string;
  pluginPath: string;
  currentPlugin: JsonObject | null;
  basePlugin: JsonObject | null;
  currentEntry: MarketplaceEntry | null;
  baseEntry: MarketplaceEntry | null;
};

type VersionUpdate = {
  bundle: string;
  pluginPath: string;
  plugin: JsonObject;
  entry: MarketplaceEntry;
  version: string;
};

function fail(message: string): never {
  throw new Error(message);
}

function parseJson(text: string, source: string): JsonObject {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    fail(`${source} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${source} must contain a JSON object`);
  return value as JsonObject;
}

function readCurrentJson(repoRoot: string, relativePath: string): JsonObject | null {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) return null;
  return parseJson(readFileSync(absolutePath, "utf8"), relativePath);
}

function readHeadJson(repoRoot: string, relativePath: string): JsonObject | null {
  const result = spawnSync("git", ["show", `HEAD:${relativePath}`], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0) return null;
  return parseJson(result.stdout, `HEAD:${relativePath}`);
}

function gitPaths(repoRoot: string, args: string[]): string[] {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${result.stderr.toString("utf8").trim()}`);
  }
  return result.stdout
    .toString("utf8")
    .split("\0")
    .filter((file) => file.length > 0);
}

function selectedGitPaths(repoRoot: string, scope: "--dirty" | "--staged"): string[] {
  const staged = gitPaths(repoRoot, [
    "diff",
    "--cached",
    "--no-renames",
    "--name-only",
    "-z",
    "--",
    bundlesRoot,
  ]);
  if (scope === "--staged") return staged;

  const unstaged = gitPaths(repoRoot, ["diff", "--no-renames", "--name-only", "-z", "--", bundlesRoot]);
  const untracked = gitPaths(repoRoot, [
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    bundlesRoot,
  ]);
  return [...new Set([...staged, ...unstaged, ...untracked])];
}

function marketplaceEntries(marketplace: JsonObject | null, source: string): MarketplaceEntry[] {
  if (!marketplace) return [];
  const plugins = (marketplace as Marketplace).plugins;
  if (!Array.isArray(plugins)) fail(`${source}.plugins must be an array`);
  for (const entry of plugins) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) fail(`${source}.plugins must contain objects`);
  }
  return plugins as MarketplaceEntry[];
}

function entryKey(entry: MarketplaceEntry): string | null {
  if (typeof entry.source === "string") return `source:${entry.source}`;
  if (typeof entry.name === "string") return `name:${entry.name}`;
  return null;
}

function changedMarketplaceBundles(current: MarketplaceEntry[], base: MarketplaceEntry[]): Set<string> {
  const currentByKey = new Map(current.map((entry) => [entryKey(entry), entry]));
  const baseByKey = new Map(base.map((entry) => [entryKey(entry), entry]));
  const keys = new Set([...currentByKey.keys(), ...baseByKey.keys()]);
  keys.delete(null);

  const changed = new Set<string>();
  for (const key of keys) {
    const currentEntry = currentByKey.get(key);
    const baseEntry = baseByKey.get(key);
    if (JSON.stringify(currentEntry) === JSON.stringify(baseEntry)) continue;
    const entry = currentEntry ?? baseEntry;
    if (!entry) continue;
    if (typeof entry.source === "string" && entry.source.startsWith("./")) changed.add(entry.source.slice(2));
    else if (typeof entry.name === "string") changed.add(entry.name);
  }
  return changed;
}

function repositoryRelativePath(repoRoot: string, file: string): string {
  const absolutePath = path.isAbsolute(file) ? file : path.resolve(repoRoot, file);
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

function pluginManifestPath(bundle: string): string {
  return `${bundlesRoot}/${bundle}/.claude-plugin/plugin.json`;
}

function collectAffectedBundles(repoRoot: string, files: string[]): Set<string> {
  const currentMarketplace = readCurrentJson(repoRoot, marketplacePath);
  const baseMarketplace = readHeadJson(repoRoot, marketplacePath);
  const currentEntries = marketplaceEntries(currentMarketplace, marketplacePath);
  const baseEntries = marketplaceEntries(baseMarketplace, `HEAD:${marketplacePath}`);
  const affected = new Set<string>();

  for (const file of files) {
    const relativePath = repositoryRelativePath(repoRoot, file);
    if (relativePath === marketplacePath) {
      for (const bundle of changedMarketplaceBundles(currentEntries, baseEntries)) affected.add(bundle);
      continue;
    }

    const prefix = `${bundlesRoot}/`;
    if (!relativePath.startsWith(prefix)) continue;
    const remainder = relativePath.slice(prefix.length);
    const separator = remainder.indexOf("/");
    if (separator < 1) continue;
    const bundle = remainder.slice(0, separator);
    const manifest = pluginManifestPath(bundle);
    if (readCurrentJson(repoRoot, manifest) || readHeadJson(repoRoot, manifest)) affected.add(bundle);
  }

  return affected;
}

function findEntry(entries: MarketplaceEntry[], bundle: string, plugin: JsonObject | null): MarketplaceEntry | null {
  const source = `./${bundle}`;
  const pluginName = typeof plugin?.name === "string" ? plugin.name : bundle;
  return entries.find((entry) => entry.source === source) ?? entries.find((entry) => entry.name === pluginName) ?? null;
}

function loadBundleStates(repoRoot: string, affected: Set<string>): BundleState[] {
  const currentMarketplace = readCurrentJson(repoRoot, marketplacePath);
  const baseMarketplace = readHeadJson(repoRoot, marketplacePath);
  const currentEntries = marketplaceEntries(currentMarketplace, marketplacePath);
  const baseEntries = marketplaceEntries(baseMarketplace, `HEAD:${marketplacePath}`);

  return [...affected].sort().map((bundle) => {
    const pluginPath = pluginManifestPath(bundle);
    const currentPlugin = readCurrentJson(repoRoot, pluginPath);
    const basePlugin = readHeadJson(repoRoot, pluginPath);
    return {
      bundle,
      pluginPath,
      currentPlugin,
      basePlugin,
      currentEntry: findEntry(currentEntries, bundle, currentPlugin ?? basePlugin),
      baseEntry: findEntry(baseEntries, bundle, basePlugin ?? currentPlugin),
    };
  });
}

function versionOf(value: JsonObject, source: string): string {
  if (typeof value.version !== "string" || !semverPattern.test(value.version)) {
    fail(`${source}.version must be a valid SemVer value`);
  }
  return value.version;
}

function compareVersions(left: string, right: string): number {
  return Bun.semver.order(left, right);
}

function greaterVersion(left: string, right: string): string {
  return compareVersions(left, right) >= 0 ? left : right;
}

function incrementPatch(version: string): string {
  const match = semverPattern.exec(version);
  if (!match) fail(`${version} is not a valid SemVer value`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

function validateBundle(state: BundleState): string[] {
  const errors: string[] = [];
  const { bundle, currentPlugin, basePlugin, currentEntry, baseEntry } = state;

  if (!currentPlugin && !currentEntry) return errors;
  if (!currentPlugin) return [`${bundle}: ${state.pluginPath} is missing while its marketplace entry remains`];
  if (!currentEntry) return [`${bundle}: marketplace entry is missing while ${state.pluginPath} remains`];

  let currentPluginVersion: string;
  let currentMarketplaceVersion: string;
  try {
    currentPluginVersion = versionOf(currentPlugin, state.pluginPath);
    currentMarketplaceVersion = versionOf(currentEntry, `${marketplacePath}:${bundle}`);
  } catch (error) {
    return [`${bundle}: ${error instanceof Error ? error.message : String(error)}`];
  }

  if (currentPluginVersion !== currentMarketplaceVersion) {
    errors.push(
      `${bundle}: plugin version ${currentPluginVersion} does not match marketplace version ${currentMarketplaceVersion}`,
    );
  }

  if (!basePlugin && !baseEntry) return errors;
  if (!basePlugin || !baseEntry) {
    errors.push(`${bundle}: HEAD must contain both the plugin manifest and marketplace entry, or neither`);
    return errors;
  }

  try {
    const basePluginVersion = versionOf(basePlugin, `HEAD:${state.pluginPath}`);
    const baseMarketplaceVersion = versionOf(baseEntry, `HEAD:${marketplacePath}:${bundle}`);
    if (compareVersions(currentPluginVersion, basePluginVersion) <= 0) {
      errors.push(`${bundle}: plugin version ${currentPluginVersion} must be greater than HEAD version ${basePluginVersion}`);
    }
    if (compareVersions(currentMarketplaceVersion, baseMarketplaceVersion) <= 0) {
      errors.push(
        `${bundle}: marketplace version ${currentMarketplaceVersion} must be greater than HEAD version ${baseMarketplaceVersion}`,
      );
    }
  } catch (error) {
    errors.push(`${bundle}: ${error instanceof Error ? error.message : String(error)}`);
  }

  return errors;
}

function validateBundles(repoRoot: string, affected: Set<string>): string[] {
  return loadBundleStates(repoRoot, affected).flatMap(validateBundle);
}

function planUpdate(state: BundleState): VersionUpdate | null {
  const { bundle, currentPlugin, basePlugin, currentEntry, baseEntry } = state;
  if (!currentPlugin && !currentEntry) return null;
  if (!currentPlugin) fail(`${bundle}: cannot fix a deleted plugin while its marketplace entry remains`);
  if (!currentEntry) fail(`${bundle}: cannot fix a plugin that has no marketplace entry`);

  const currentPluginVersion = versionOf(currentPlugin, state.pluginPath);
  const currentMarketplaceVersion = versionOf(currentEntry, `${marketplacePath}:${bundle}`);

  if (!basePlugin && !baseEntry) {
    if (currentPluginVersion !== currentMarketplaceVersion) {
      fail(`${bundle}: new plugin versions differ; set the intended initial version manually`);
    }
    return null;
  }
  if (!basePlugin || !baseEntry) fail(`${bundle}: HEAD must contain both version records before an automatic bump`);

  const basePluginVersion = versionOf(basePlugin, `HEAD:${state.pluginPath}`);
  const baseMarketplaceVersion = versionOf(baseEntry, `HEAD:${marketplacePath}:${bundle}`);
  if (compareVersions(currentPluginVersion, basePluginVersion) < 0) fail(`${bundle}: plugin version is lower than HEAD`);
  if (compareVersions(currentMarketplaceVersion, baseMarketplaceVersion) < 0) {
    fail(`${bundle}: marketplace version is lower than HEAD`);
  }

  const pluginBumped = compareVersions(currentPluginVersion, basePluginVersion) > 0;
  const marketplaceBumped = compareVersions(currentMarketplaceVersion, baseMarketplaceVersion) > 0;
  let target: string;

  if (pluginBumped && marketplaceBumped) {
    if (currentPluginVersion !== currentMarketplaceVersion) {
      fail(`${bundle}: plugin and marketplace contain different manual version bumps`);
    }
    target = currentPluginVersion;
  } else if (pluginBumped) {
    target = currentPluginVersion;
  } else if (marketplaceBumped) {
    target = currentMarketplaceVersion;
  } else {
    target = incrementPatch(greaterVersion(basePluginVersion, baseMarketplaceVersion));
  }

  if (compareVersions(target, basePluginVersion) <= 0 || compareVersions(target, baseMarketplaceVersion) <= 0) {
    fail(`${bundle}: ${target} is not greater than both versions in HEAD`);
  }

  if (currentPluginVersion === target && currentMarketplaceVersion === target) return null;
  return { bundle, pluginPath: state.pluginPath, plugin: currentPlugin, entry: currentEntry, version: target };
}

function atomicWriteJson(file: string, value: JsonObject): void {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
    renameSync(temporary, file);
  } finally {
    rmSync(temporary, { force: true });
  }
}

function fixBundles(repoRoot: string, affected: Set<string>): void {
  const states = loadBundleStates(repoRoot, affected);
  const updates = states.map(planUpdate).filter((update): update is VersionUpdate => update !== null);
  if (updates.length === 0) return;

  const marketplace = readCurrentJson(repoRoot, marketplacePath);
  if (!marketplace) fail(`${marketplacePath} is missing`);

  const entries = marketplaceEntries(marketplace, marketplacePath);
  for (const update of updates) {
    update.plugin.version = update.version;
    const entry = findEntry(entries, update.bundle, update.plugin);
    if (!entry) fail(`${update.bundle}: marketplace entry disappeared during the fix`);
    entry.version = update.version;
  }
  for (const update of updates) atomicWriteJson(path.join(repoRoot, update.pluginPath), update.plugin);
  atomicWriteJson(path.join(repoRoot, marketplacePath), marketplace);

  const errors = validateBundles(repoRoot, affected);
  if (errors.length > 0) fail(`fix left invalid bundle versions:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
  for (const update of updates) console.log(`bundle-versions: set ${update.bundle} to ${update.version}`);
}

function printErrors(errors: string[]): void {
  console.error("bundle version check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  console.error("Run: hk fix --step bundle-versions --no-stage");
}

export function run(command: string, args: string[], repoRoot = process.cwd()): number {
  if (command !== "check" && command !== "fix") {
    console.error("Usage: bundle-versions.ts <check|fix> [--dirty|--staged|files...]");
    return 2;
  }

  try {
    const scope = args[0];
    const files =
      scope === "--dirty" || scope === "--staged" ? selectedGitPaths(repoRoot, scope) : args;
    const affected = collectAffectedBundles(repoRoot, files);
    if (affected.size === 0) return 0;
    if (command === "fix") fixBundles(repoRoot, affected);
    const errors = validateBundles(repoRoot, affected);
    if (errors.length === 0) return 0;
    printErrors(errors);
    return 1;
  } catch (error) {
    console.error(`bundle version ${command} failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = run(process.argv[2] ?? "", process.argv.slice(3));
