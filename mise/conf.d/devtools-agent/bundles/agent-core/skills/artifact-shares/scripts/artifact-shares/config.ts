/*!
 * Where the share repositories are recorded, and where their clones live.
 *
 * ~/.config/artifact-shares.json
 *
 *   {
 *     "schemaVersion": "artifact-share-config/v2",
 *     "clone_root": "~/.local/share/artifact-shares",
 *     "shares": {
 *       "<name>": {
 *         "repo": "owner/repo",
 *         "branch": "main",
 *         "pages_url": "https://owner.github.io/repo/"
 *       }
 *     }
 *   }
 *
 * The config is the list `list` reads. A clone that is missing from it is
 * invisible, and a clone that is missing from disk is reported, not recreated.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContracts } from "../../../skill-contracts/scripts/contracts.ts";
import { safeUpgrade } from "../../../skill-contracts/scripts/upgrades.ts";
import owner, { CONFIG_V1, CONFIG_V2, configMeaning, parseConfig, DEFAULT_CLONE_ROOT } from "./config-owner.ts";

/** ARTIFACT_SHARES_CONFIG points the CLI at another config file. The tests use
 *  it. A person has no reason to. */
export const CONFIG_FILE =
  process.env.ARTIFACT_SHARES_CONFIG ??
  path.join(os.homedir(), ".config", "artifact-shares.json");

export { DEFAULT_CLONE_ROOT } from "./config-owner.ts";
const skillRoot = fileURLToPath(new URL("../../", import.meta.url));
const snapshots = new WeakMap<ArtifactSharesConfig, Record<string, unknown>>();

export type ShareRepo = {
  repo: string;
  branch: string;
  pages_url: string | null;
  [key: string]: unknown;
};
export type ArtifactSharesConfig = {
  clone_root: string;
  shares: Record<string, ShareRepo>;
  schemaVersion?: string;
  [key: string]: unknown;
};

export function expandHome(value: string): string {
  return value === "~" || value.startsWith("~/")
    ? path.join(os.homedir(), value.slice(1))
    : value;
}

export async function loadConfig(): Promise<ArtifactSharesConfig> {
  const contracts = await loadContracts(skillRoot);
  let raw: string;
  try {
    raw = await fs.readFile(CONFIG_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const empty = { clone_root: DEFAULT_CLONE_ROOT, shares: {} };
    snapshots.set(empty, structuredClone(configMeaning(empty)));
    return empty;
  }
  const explicit = await owner.identify(raw);
  const detected = explicit === null ? await owner.detectLegacy(raw) : [explicit];
  if (detected.length !== 1 || !contracts.manifest.accepts.includes(detected[0]!) ||
    ![CONFIG_V1, CONFIG_V2].includes(detected[0]!) || !await owner.validate(detected[0]!, raw)) {
    throw new Error("Unsupported or invalid artifact-share configuration; input was not changed.");
  }
  const parsed = parseConfig(raw);
  const config = { ...parsed, clone_root: parsed.clone_root ?? DEFAULT_CLONE_ROOT, shares: parsed.shares ?? {} } as ArtifactSharesConfig;
  snapshots.set(config, structuredClone(configMeaning(config)));
  return config;
}

/** Upgrade and save only the configuration that this caller actually read. */
export async function saveConfig(config: ArtifactSharesConfig): Promise<void> {
  const before = snapshots.get(config);
  if (!before) throw new Error("Save requires a configuration returned by loadConfig.");
  const output = `${JSON.stringify({ ...config, schemaVersion: CONFIG_V2 }, null, 2)}\n`;
  if (!await owner.validate(CONFIG_V2, output) || !await owner.mutable(CONFIG_FILE, output)) {
    throw new Error("Invalid or immutable configuration; no update was written.");
  }
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  // First creation uses exclusive open and the same shared-writer lock protocol.
  const lock = await fs.open(`${CONFIG_FILE}.contract-upgrade.lock`, "wx", 0o600);
  try {
    try {
      const initial = output;
      const file = await fs.open(CONFIG_FILE, "wx", 0o600);
      try { await file.writeFile(initial); } finally { await file.close(); }
      snapshots.set(config, structuredClone(configMeaning(config)));
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  } finally {
    await lock.close();
    await fs.unlink(`${CONFIG_FILE}.contract-upgrade.lock`);
  }
  const result = await safeUpgrade({
    skill: skillRoot, owner: "file:scripts/artifact-shares/config-owner.ts",
    artifact: CONFIG_FILE, operation: "save", request: { before, after: config },
  });
  if (result.status !== "completed") throw new Error("Configuration saved, but upgrade lock cleanup failed.");
  snapshots.set(config, structuredClone(configMeaning(config)));
}

export async function updateConfig(operation: "upgrade" | "clone-root", request?: string): Promise<void> {
  const result = await safeUpgrade({
    skill: skillRoot, owner: "file:scripts/artifact-shares/config-owner.ts",
    artifact: CONFIG_FILE, operation, request,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "completed") process.exitCode = 1;
}

export function clonePathFor(config: ArtifactSharesConfig, name: string): string {
  return path.join(expandHome(config.clone_root), name);
}
