import * as path from "node:path";
import { realpathSync } from "node:fs";

import { canonicalizeGitRemote } from "../../../bundles/matt-pocock/extensions/shared-context.js";
import type { Skill } from "./skill-registry.js";

type GitResult = { code: number; stdout: string };
type RunGit = (args: string[], cwd: string) => Promise<GitResult>;

export type RepositoryContext = {
  root: string;
  slug?: string;
};

export function slugifyRepositoryRemote(remote: string): string {
  return canonicalizeGitRemote(remote)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function resolveRepositoryContext(
  runGit: RunGit,
  cwd: string,
): Promise<RepositoryContext | undefined> {
  const rootResult = await runGit(["rev-parse", "--show-toplevel"], cwd);
  const root = rootResult.stdout.trim();
  if (rootResult.code !== 0 || !root) return;

  const originResult = await runGit(["remote", "get-url", "origin"], root);
  const origin = originResult.stdout.trim();
  if (originResult.code !== 0 || !origin) return { root };

  try {
    return { root, slug: slugifyRepositoryRemote(origin) };
  } catch {
    return { root };
  }
}

function normalizeRelativePath(value: string): string {
  return value.split(path.sep).join("/").replace(/^\.\//, "");
}

function fallbackMatchesGlob(value: string, pattern: string): boolean {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "*" && pattern[index + 1] === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`${source}$`).test(value);
}

function matchesGlob(value: string, pattern: string): boolean {
  const native = (
    path as typeof path & {
      matchesGlob?: (path: string, pattern: string) => boolean;
    }
  ).matchesGlob;
  try {
    return native
      ? native(value, pattern)
      : fallbackMatchesGlob(value, pattern);
  } catch {
    return false;
  }
}

export function selectIndexedSkillNames(
  skills: Iterable<Skill>,
  repositoryRoot: string,
  patterns: string[],
): Set<string> {
  const selected = new Set<string>();

  for (const skill of skills) {
    if (skillMatchesPatterns(skill, repositoryRoot, patterns)) {
      selected.add(skill.qualifiedName);
    }
  }

  return selected;
}

export function skillMatchesPatterns(
  skill: Skill,
  repositoryRoot: string,
  patterns: string[],
): boolean {
  const candidates = new Set<string>();
  addRelativeCandidate(candidates, repositoryRoot, skill.baseDir);
  addRelativeCandidate(candidates, repositoryRoot, skill.filePath);
  try {
    const realRoot = realpathSync(repositoryRoot);
    addRelativeCandidate(candidates, realRoot, realpathSync(skill.baseDir));
    addRelativeCandidate(candidates, realRoot, realpathSync(skill.filePath));
  } catch {
    // Lexical paths above still support missing or broken symlink targets.
  }

  return patterns
    .map(normalizeRelativePath)
    .filter(Boolean)
    .some((pattern) =>
      Array.from(candidates).some((candidate) =>
        matchesGlob(candidate, pattern),
      ),
    );
}

function addRelativeCandidate(
  candidates: Set<string>,
  repositoryRoot: string,
  target: string,
): void {
  const relativePath = path.relative(repositoryRoot, target);
  if (
    path.isAbsolute(relativePath) ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`)
  ) {
    return;
  }
  candidates.add(normalizeRelativePath(relativePath));
}