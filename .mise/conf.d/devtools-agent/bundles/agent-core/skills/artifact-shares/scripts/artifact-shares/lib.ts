/*!
 * Helpers for the artifact-shares CLI.
 *
 * Everything here is either a pure function or one shell call. The command
 * bodies live in cli.ts.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export class CliError extends Error {}

export function fail(message: string): never {
  throw new CliError(message);
}

export type RunOptions = {
  cwd?: string;
  input?: string;
  allowFailure?: boolean;
  inherit?: boolean;
};

export type RunResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  status: number | null;
};

export function run(command: string, args: string[] = [], options: RunOptions = {}): RunResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["pipe", "pipe", "pipe"],
  });

  if (result.error) fail(`${command}: ${result.error.message}`);

  if (result.status !== 0 && !options.allowFailure) {
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    fail(`${command} ${args.join(" ")} failed${details ? `:\n${details}` : ""}`);
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    status: result.status,
  };
}

export function commandExists(command: string): boolean {
  return run("sh", ["-c", `command -v ${command}`], { allowFailure: true }).ok;
}

export function requireCommand(command: string): void {
  if (!commandExists(command)) fail(`${command} is not installed`);
}

/** owner/repo, and nothing else. */
export function repoParts(repo: string): { owner: string; name: string } {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(repo);
  if (!match) fail(`Repository must be owner/repo: ${repo}`);
  return { owner: match[1]!, name: match[2]! };
}

/** A repository name GitHub accepts and a URL does not have to escape. */
export function assertShareName(name: string): void {
  if (!/^[a-z0-9][a-z0-9._-]{0,60}$/.test(name)) {
    fail(`Share name must be lowercase letters, digits, dot, dash, or underscore: ${name}`);
  }
}

export function slugify(value: string): string {
  const slug = (value || "artifact")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return slug || "artifact";
}

/** YYYY-MM-DD in local time. UTC would read as yesterday for anyone east of
 *  Greenwich, which is not the date on their own calendar. */
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function hashFile(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12);
}

export function walkFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(root, entry.name);
    if (entry.isDirectory()) return walkFiles(child);
    return entry.isFile() ? [child] : [];
  });
}

/** The same bytes in the same layout give the same hash, so a re-share of an
 *  unchanged artifact is recognised instead of duplicated. */
export function hashDir(dir: string): string {
  const hash = createHash("sha256");
  for (const file of walkFiles(dir).sort()) {
    const relative = path.relative(dir, file).split(path.sep).join("/");
    hash.update(relative).update("\0").update(readFileSync(file)).update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

export function hashPath(target: string, isDirectory: boolean): string {
  return isDirectory ? hashDir(target) : hashFile(target);
}

export function copyTemplate(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    cpSync(path.join(from, entry.name), path.join(to, entry.name), {
      recursive: true,
      force: true,
    });
  }
}

/** Read `.types` as a map of hash to kind. Comments and blank lines are
 *  skipped, the same way the repository's own validator skips them. */
export function readTypes(repoDir: string): Map<string, string> {
  const file = path.join(repoDir, ".types");
  const types = new Map<string, string>();
  if (!existsSync(file)) return types;

  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const cut = line.indexOf("=");
    if (cut === -1) continue;
    types.set(line.slice(0, cut).trim(), line.slice(cut + 1).trim());
  }
  return types;
}

export function appendType(repoDir: string, hash: string, kind: string): void {
  const file = path.join(repoDir, ".types");
  const existing = existsSync(file) ? readFileSync(file, "utf8").replace(/\s*$/, "\n") : "";
  writeFileSync(file, `${existing}${hash}=${kind}\n`);
}

/** The kinds the site knows, read from the clone rather than from this CLI.
 *  A repository that adds a kind can take a share of that kind with no change
 *  here. */
export function readKinds(repoDir: string): string[] {
  const file = path.join(repoDir, "src", "components", "kinds.ts");
  if (!existsSync(file)) fail(`Not an artifact share repository: ${file} is missing`);

  const source = readFileSync(file, "utf8");
  const block = /export const shareKinds[^{]*\{([\s\S]*?)\n\};/.exec(source);
  if (!block) fail(`Could not read shareKinds from ${file}`);

  const kinds = new Set<string>();
  for (const match of block[1]!.matchAll(/^\s{2}(?:\[?([A-Za-z_][\w]*)\]?|"([^"]+)")\s*:\s*\{/gm)) {
    const name = match[2] ?? match[1];
    if (!name) continue;
    // `[DEFAULT_KIND]: {` names a constant, not a literal key.
    kinds.add(name === "DEFAULT_KIND" ? defaultKind(source) : name);
  }
  return [...kinds];
}

function defaultKind(source: string): string {
  return /export const DEFAULT_KIND\s*=\s*"([^"]+)"/.exec(source)?.[1] ?? "artifact";
}

/** A YAML scalar that survives any title a person types. */
export function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function gitHasChanges(worktree: string): boolean {
  return run("git", ["status", "--porcelain"], { cwd: worktree }).stdout.length > 0;
}

export function commitAndPush(worktree: string, branch: string, message: string): string | null {
  if (!gitHasChanges(worktree)) return null;
  run("git", ["add", "."], { cwd: worktree });
  run("git", ["commit", "-m", message], { cwd: worktree });
  run("git", ["push", "-u", "origin", branch], { cwd: worktree });
  return run("git", ["rev-parse", "HEAD"], { cwd: worktree }).stdout;
}

/** Remove a hash from `.types`. Returns false when no line named it, so a
 *  caller can tell "removed" from "was never there". */
export function removeType(repoDir: string, hash: string): boolean {
  const file = path.join(repoDir, ".types");
  if (!existsSync(file)) return false;

  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return true;
    return trimmed.slice(0, trimmed.indexOf("=")).trim() !== hash;
  });

  if (kept.length === lines.length) return false;
  writeFileSync(file, `${kept.join("\n").replace(/\s*$/, "")}\n`);
  return true;
}

/** Delete the three things a share is made of. `share` writes them together,
 *  so they are removed together. */
export function removeShareFiles(repoDir: string, hash: string): void {
  rmSync(path.join(repoDir, "public", "s", hash), { recursive: true, force: true });
  rmSync(path.join(repoDir, "content", "shares", `${hash}.mdx`), { force: true });
  removeType(repoDir, hash);
}

/** A directory this CLI is allowed to rewrite. Checked before anything
 *  destructive, because the path comes from a config file a person can edit. */
export function assertShareClone(clone: string): void {
  if (!existsSync(clone)) fail(`Not cloned: ${clone}`);
  if (!existsSync(path.join(clone, ".git"))) fail(`Not a git repository: ${clone}`);
  if (!existsSync(path.join(clone, "src", "components", "kinds.ts"))) {
    fail(`Not an artifact share repository: ${clone}`);
  }
}

/** A file name that sorts by time and never collides. */
export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}
