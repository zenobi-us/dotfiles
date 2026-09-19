/*!
 * Where the share repositories are recorded, and where their clones live.
 *
 * ~/.config/artifact-shares.json
 *
 *   {
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

/** ARTIFACT_SHARES_CONFIG points the CLI at another config file. The tests use
 *  it. A person has no reason to. */
export const CONFIG_FILE =
  process.env.ARTIFACT_SHARES_CONFIG ??
  path.join(os.homedir(), ".config", "artifact-shares.json");

export const DEFAULT_CLONE_ROOT = "~/.local/share/artifact-shares";

export type ShareRepo = {
  repo: string;
  branch: string;
  pages_url: string;
};

export type ArtifactSharesConfig = {
  clone_root: string;
  shares: Record<string, ShareRepo>;
};

export function expandHome(value: string): string {
  return value === "~" || value.startsWith("~/")
    ? path.join(os.homedir(), value.slice(1))
    : value;
}

export async function loadConfig(): Promise<ArtifactSharesConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<ArtifactSharesConfig>;
    return {
      clone_root: parsed.clone_root ?? DEFAULT_CLONE_ROOT,
      shares: parsed.shares ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { clone_root: DEFAULT_CLONE_ROOT, shares: {} };
  }
}

/** Write through a temporary file, so an interrupted write leaves the old
 *  config in place rather than half of the new one. */
export async function saveConfig(config: ArtifactSharesConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  const temporary = `${CONFIG_FILE}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(config, null, 2)}\n`);
  await fs.rename(temporary, CONFIG_FILE);
}

export function clonePathFor(config: ArtifactSharesConfig, name: string): string {
  return path.join(expandHome(config.clone_root), name);
}
