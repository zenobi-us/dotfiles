import { readFile } from "node:fs/promises";
import { extname, join, posix } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ChangeStatus, ReviewFile, ReviewFileComparison, ReviewFileContents, ReviewScope, ReviewSubmoduleByScope, ReviewSubmoduleInfo } from "./types.js";

export interface ChangedPath {
  status: ChangeStatus;
  oldPath: string | null;
  newPath: string | null;
}

export interface ChangeStats {
  additions: number;
  deletions: number;
}

interface ReviewFileSeed {
  path: string;
  worktreeStatus: ChangeStatus | null;
  hasWorkingTreeFile: boolean;
  inGitDiff: boolean;
  inLastCommit: boolean;
  inAllFiles: boolean;
  gitDiff: ReviewFileComparison | null;
  lastCommit: ReviewFileComparison | null;
  allFiles: ReviewFileComparison | null;
  allFilesReferenceCount: number;
  allFilesOutgoingReferences: string[];
  allFilesIncomingReferences: string[];
  submodule?: ReviewSubmoduleByScope;
}

export interface RawDiffChange extends ChangedPath {
  oldMode: string;
  newMode: string;
  oldSha: string;
  newSha: string;
}

async function runGit(pi: ExtensionAPI, repoRoot: string, args: string[]): Promise<string> {
  const result = await pi.exec("git", args, { cwd: repoRoot });
  if (result.code !== 0) {
    const message = result.stderr.trim() || result.stdout.trim() || `git ${args.join(" ")} failed`;
    throw new Error(message);
  }
  return result.stdout;
}

async function runGitAllowFailure(pi: ExtensionAPI, repoRoot: string, args: string[]): Promise<string> {
  const result = await pi.exec("git", args, { cwd: repoRoot });
  if (result.code !== 0) return "";
  return result.stdout;
}

export async function getRepoRoot(pi: ExtensionAPI, cwd: string): Promise<string> {
  const result = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd });
  if (result.code !== 0) {
    throw new Error("Not inside a git repository.");
  }
  return result.stdout.trim();
}

async function hasHead(pi: ExtensionAPI, repoRoot: string): Promise<boolean> {
  const result = await pi.exec("git", ["rev-parse", "--verify", "HEAD"], { cwd: repoRoot });
  return result.code === 0;
}

export function parseNameStatus(output: string): ChangedPath[] {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const changes: ChangedPath[] = [];

  for (const line of lines) {
    const parts = line.split("\t");
    const rawStatus = parts[0] ?? "";
    const code = rawStatus[0];

    if (code === "R") {
      const oldPath = parts[1] ?? null;
      const newPath = parts[2] ?? null;
      if (oldPath != null && newPath != null) {
        changes.push({ status: "renamed", oldPath, newPath });
      }
      continue;
    }

    if (code === "M") {
      const path = parts[1] ?? null;
      if (path != null) changes.push({ status: "modified", oldPath: path, newPath: path });
      continue;
    }

    if (code === "A") {
      const path = parts[1] ?? null;
      if (path != null) changes.push({ status: "added", oldPath: null, newPath: path });
      continue;
    }

    if (code === "D") {
      const path = parts[1] ?? null;
      if (path != null) changes.push({ status: "deleted", oldPath: path, newPath: null });
    }
  }

  return changes;
}

function parseRawStatus(rawStatus: string): ChangeStatus | null {
  const code = rawStatus[0];
  if (code === "M" || code === "T") return "modified";
  if (code === "A") return "added";
  if (code === "D") return "deleted";
  if (code === "R") return "renamed";
  return null;
}

export function parseRawDiff(output: string): RawDiffChange[] {
  const fields = output.split("\0").filter((field) => field.length > 0);
  const changes: RawDiffChange[] = [];

  for (let index = 0; index < fields.length;) {
    const header = fields[index++];
    if (header == null || !header.startsWith(":")) continue;

    const parts = header.slice(1).split(" ");
    const oldMode = parts[0] ?? "";
    const newMode = parts[1] ?? "";
    const oldSha = parts[2] ?? "";
    const newSha = parts[3] ?? "";
    const rawStatus = parts[4] ?? "";
    const status = parseRawStatus(rawStatus);
    if (status == null) continue;

    const oldPath = fields[index++] ?? null;
    const newPath = status === "renamed" ? fields[index++] ?? null : oldPath;
    if (oldPath == null) continue;

    changes.push({
      status,
      oldPath: status === "added" ? null : oldPath,
      newPath: status === "deleted" ? null : newPath,
      oldMode,
      newMode,
      oldSha,
      newSha,
    });
  }

  return changes;
}

export function parseUntrackedPaths(output: string): ChangedPath[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((path) => ({ status: "added" as const, oldPath: null, newPath: path }));
}

function parseTrackedPaths(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function mergeChangedPaths(tracked: ChangedPath[], untracked: ChangedPath[]): ChangedPath[] {
  const seen = new Set(tracked.map((change) => `${change.status}:${change.oldPath ?? ""}:${change.newPath ?? ""}`));
  const merged = [...tracked];

  for (const change of untracked) {
    const key = `${change.status}:${change.oldPath ?? ""}:${change.newPath ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(change);
  }

  return merged;
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

function parseStatCount(value: string | undefined): number {
  if (value == null || value === "-") return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeNumStatPath(path: string): string {
  if (!path.includes(" => ")) return path;
  const expanded = path.replace(/\{[^{}]* => ([^{}]*)\}/g, "$1");
  if (!expanded.includes(" => ")) return expanded;
  return expanded.split(" => ").pop() ?? expanded;
}

export function parseNumStat(output: string): Map<string, ChangeStats> {
  const stats = new Map<string, ChangeStats>();

  for (const line of output.split(/\r?\n/)) {
    if (line.trim().length === 0) continue;
    const parts = line.split("\t");
    const rawPath = parts.slice(2).join("\t");
    if (rawPath.length === 0) continue;
    stats.set(normalizeGitPath(normalizeNumStatPath(rawPath)), {
      additions: parseStatCount(parts[0]),
      deletions: parseStatCount(parts[1]),
    });
  }

  return stats;
}

function countContentLines(content: string): number {
  if (content.length === 0) return 0;
  const lines = content.split(/\r?\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines.length;
}

function toDisplayPath(change: ChangedPath): string {
  if (change.status === "renamed") {
    return `${change.oldPath ?? ""} -> ${change.newPath ?? ""}`;
  }
  return change.newPath ?? change.oldPath ?? "(unknown)";
}

function toComparison(change: ChangedPath, stats?: ChangeStats, revisions?: { originalRevision?: string | null; modifiedRevision?: string | null }): ReviewFileComparison {
  return {
    status: change.status,
    oldPath: change.oldPath,
    newPath: change.newPath,
    displayPath: toDisplayPath(change),
    hasOriginal: change.oldPath != null,
    hasModified: change.newPath != null,
    additions: stats?.additions,
    deletions: stats?.deletions,
    originalRevision: revisions?.originalRevision,
    modifiedRevision: revisions?.modifiedRevision,
  };
}

function buildReviewFileId(
  path: string,
  hasWorkingTreeFile: boolean,
  gitDiff: ReviewFileComparison | null,
  lastCommit: ReviewFileComparison | null,
  allFiles: ReviewFileComparison | null,
): string {
  return [path, hasWorkingTreeFile ? "working" : "gone", gitDiff?.displayPath ?? "", lastCommit?.displayPath ?? "", allFiles?.displayPath ?? ""].join("::");
}

function createReviewFile(seed: ReviewFileSeed): ReviewFile {
  return {
    id: buildReviewFileId(seed.path, seed.hasWorkingTreeFile, seed.gitDiff, seed.lastCommit, seed.allFiles),
    path: seed.path,
    worktreeStatus: seed.worktreeStatus,
    hasWorkingTreeFile: seed.hasWorkingTreeFile,
    inGitDiff: seed.inGitDiff,
    inLastCommit: seed.inLastCommit,
    inAllFiles: seed.inAllFiles,
    gitDiff: seed.gitDiff,
    lastCommit: seed.lastCommit,
    allFiles: seed.allFiles,
    allFilesReferenceCount: seed.allFilesReferenceCount,
    allFilesOutgoingReferences: seed.allFilesOutgoingReferences,
    allFilesIncomingReferences: seed.allFilesIncomingReferences,
    submodule: seed.submodule,
  };
}

async function getRevisionContent(pi: ExtensionAPI, repoRoot: string, revision: string, path: string): Promise<string> {
  const result = await pi.exec("git", ["show", `${revision}:${path}`], { cwd: repoRoot });
  if (result.code !== 0) return "";
  return result.stdout;
}

async function getWorkingTreeContent(repoRoot: string, path: string): Promise<string> {
  try {
    return await readFile(join(repoRoot, path), "utf8");
  } catch {
    return "";
  }
}

export function isReviewableFilePath(path: string): boolean {
  const lowerPath = path.toLowerCase();
  const fileName = lowerPath.split("/").pop() ?? lowerPath;
  const extension = extname(fileName);

  if (fileName.length === 0) return false;

  const binaryExtensions = new Set([
    ".7z",
    ".a",
    ".avi",
    ".avif",
    ".bin",
    ".bmp",
    ".class",
    ".dll",
    ".dylib",
    ".eot",
    ".exe",
    ".gif",
    ".gz",
    ".ico",
    ".jar",
    ".jpeg",
    ".jpg",
    ".lockb",
    ".map",
    ".mov",
    ".mp3",
    ".mp4",
    ".o",
    ".otf",
    ".pdf",
    ".png",
    ".pyc",
    ".so",
    ".svgz",
    ".tar",
    ".ttf",
    ".wasm",
    ".webm",
    ".webp",
    ".woff",
    ".woff2",
    ".zip",
  ]);

  if (binaryExtensions.has(extension)) return false;
  if (fileName.endsWith(".min.js") || fileName.endsWith(".min.css")) return false;

  return true;
}

function normalizeGitPath(path: string): string {
  return posix.normalize(path).replace(/^\.\//, "");
}

function normalizeDiffSha(sha: string): string | null {
  return /^0+$/.test(sha) ? null : sha;
}

function isSubmoduleRawChange(change: RawDiffChange): boolean {
  return change.oldMode === "160000" || change.newMode === "160000";
}

function rawDiffMap(changes: RawDiffChange[]): Map<string, RawDiffChange> {
  return new Map(changes.map((change) => [normalizeGitPath(getChangeKey(change)), change]));
}

async function getNestedRepoRoot(pi: ExtensionAPI, parentRepoRoot: string, submodulePath: string): Promise<{ repoRoot: string } | { unavailableReason: string }> {
  const result = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd: join(parentRepoRoot, submodulePath) });
  if (result.code !== 0) return { unavailableReason: "submodule is not initialized locally" };

  const repoRoot = result.stdout.trim();
  if (repoRoot.length === 0 || repoRoot === parentRepoRoot) {
    return { unavailableReason: "submodule path does not resolve to a nested repository" };
  }

  return { repoRoot };
}

function getSubmoduleInfo(repoRoot: string | null, raw: RawDiffChange): ReviewSubmoduleInfo {
  return {
    repoRoot: repoRoot ?? "",
    path: raw.newPath ?? raw.oldPath ?? "(unknown)",
    oldSha: normalizeDiffSha(raw.oldSha),
    newSha: normalizeDiffSha(raw.newSha),
    available: repoRoot != null,
    unavailableReason: repoRoot == null ? "submodule is not initialized locally" : undefined,
  };
}

function getChangeKey(change: ChangedPath): string {
  return change.newPath ?? change.oldPath ?? toDisplayPath(change);
}

function getImportAliases(path: string): string[] {
  const normalized = normalizeGitPath(path);
  const aliases = [normalized];
  const extension = posix.extname(normalized);

  if (extension.length > 0) {
    aliases.push(normalized.slice(0, -extension.length));
  }

  const directory = posix.dirname(normalized);
  const basename = posix.basename(normalized, extension);
  if (basename === "index" && directory !== ".") {
    aliases.push(directory);
  }

  return aliases;
}

function extractImportSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier != null) specifiers.push(specifier);
    }
  }

  return specifiers;
}

function resolveRelativeImport(sourcePath: string, specifier: string, aliases: Map<string, string>): string | null {
  if (!specifier.startsWith(".")) return null;
  const resolved = normalizeGitPath(posix.join(posix.dirname(sourcePath), specifier));
  return aliases.get(resolved) ?? null;
}

export interface ChangedFileReferenceGraph {
  counts: Map<string, number>;
  outgoing: Map<string, string[]>;
  incoming: Map<string, string[]>;
}

export function getChangedFileReferenceGraph(changes: ChangedPath[], contentsByPath: Map<string, string>): ChangedFileReferenceGraph {
  const paths = changes.map(getChangeKey).map(normalizeGitPath);
  const pathSet = new Set(paths);
  const aliases = new Map<string, string>();
  const counts = new Map<string, number>(paths.map((path) => [path, 0]));
  const outgoingSets = new Map<string, Set<string>>(paths.map((path) => [path, new Set<string>()]));
  const incomingSets = new Map<string, Set<string>>(paths.map((path) => [path, new Set<string>()]));

  for (const path of paths) {
    for (const alias of getImportAliases(path)) {
      if (!aliases.has(alias)) aliases.set(alias, path);
    }
  }

  for (const change of changes) {
    if (change.newPath == null) continue;
    const sourcePath = normalizeGitPath(change.newPath);
    const content = contentsByPath.get(sourcePath) ?? contentsByPath.get(change.newPath) ?? "";
    const referencedPaths = new Set<string>();

    for (const specifier of extractImportSpecifiers(content)) {
      const referencedPath = resolveRelativeImport(sourcePath, specifier, aliases);
      if (referencedPath == null || referencedPath === sourcePath || !pathSet.has(referencedPath)) continue;
      referencedPaths.add(referencedPath);
    }

    for (const referencedPath of referencedPaths) {
      counts.set(referencedPath, (counts.get(referencedPath) ?? 0) + 1);
      outgoingSets.get(sourcePath)?.add(referencedPath);
      incomingSets.get(referencedPath)?.add(sourcePath);
    }
  }

  const toSortedArrays = (map: Map<string, Set<string>>): Map<string, string[]> => new Map(
    [...map.entries()].map(([path, relatedPaths]) => [path, [...relatedPaths].sort((a, b) => a.localeCompare(b))]),
  );

  return {
    counts,
    outgoing: toSortedArrays(outgoingSets),
    incoming: toSortedArrays(incomingSets),
  };
}

export function getChangedFileReferenceCounts(changes: ChangedPath[], contentsByPath: Map<string, string>): Map<string, number> {
  return getChangedFileReferenceGraph(changes, contentsByPath).counts;
}

function compareReviewFiles(a: ReviewFile, b: ReviewFile): number {
  return a.path.localeCompare(b.path);
}

function upsertSeed(seeds: Map<string, ReviewFileSeed>, key: string, create: () => ReviewFileSeed): ReviewFileSeed {
  const existing = seeds.get(key);
  if (existing != null) return existing;
  const seed = create();
  seeds.set(key, seed);
  return seed;
}

function createSeed(path: string, hasWorkingTreeFile: boolean): ReviewFileSeed {
  return {
    path,
    worktreeStatus: null,
    hasWorkingTreeFile,
    inGitDiff: false,
    inLastCommit: false,
    inAllFiles: false,
    gitDiff: null,
    lastCommit: null,
    allFiles: null,
    allFilesReferenceCount: 0,
    allFilesOutgoingReferences: [],
    allFilesIncomingReferences: [],
  };
}

async function getFirstExistingRef(pi: ExtensionAPI, repoRoot: string, refs: string[]): Promise<string | null> {
  for (const ref of refs) {
    const result = await pi.exec("git", ["rev-parse", "--verify", "--quiet", ref], { cwd: repoRoot });
    if (result.code === 0) return ref;
  }
  return null;
}

export async function getDefaultBranchRef(pi: ExtensionAPI, repoRoot: string): Promise<string | null> {
  const originHead = (await runGitAllowFailure(pi, repoRoot, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"])).trim();
  if (originHead.length > 0 && originHead !== "origin/HEAD") return originHead;

  return getFirstExistingRef(pi, repoRoot, ["origin/main", "origin/master", "main", "master"]);
}

async function getBranchBaseRevision(pi: ExtensionAPI, repoRoot: string): Promise<string | null> {
  const defaultBranch = await getDefaultBranchRef(pi, repoRoot);
  if (defaultBranch == null) return null;
  const result = await pi.exec("git", ["merge-base", defaultBranch, "HEAD"], { cwd: repoRoot });
  if (result.code !== 0) return null;
  return result.stdout.trim() || null;
}

export async function getReviewWindowData(pi: ExtensionAPI, cwd: string): Promise<{ repoRoot: string; files: ReviewFile[] }> {
  const repoRoot = await getRepoRoot(pi, cwd);
  const repositoryHasHead = await hasHead(pi, repoRoot);

  const trackedDiffOutput = repositoryHasHead
    ? await runGit(pi, repoRoot, ["diff", "--find-renames", "-M", "--name-status", "HEAD", "--"])
    : "";
  const worktreeRawOutput = repositoryHasHead
    ? await runGitAllowFailure(pi, repoRoot, ["diff", "--find-renames", "-M", "--raw", "-z", "HEAD", "--"])
    : "";
  const worktreeNumStatOutput = repositoryHasHead
    ? await runGitAllowFailure(pi, repoRoot, ["diff", "--find-renames", "-M", "--numstat", "HEAD", "--"])
    : "";
  const untrackedOutput = await runGitAllowFailure(pi, repoRoot, ["ls-files", "--others", "--exclude-standard"]);
  const trackedFilesOutput = await runGitAllowFailure(pi, repoRoot, ["ls-files", "--cached"]);
  const deletedFilesOutput = await runGitAllowFailure(pi, repoRoot, ["ls-files", "--deleted"]);
  const lastCommitOutput = repositoryHasHead
    ? await runGitAllowFailure(pi, repoRoot, ["diff-tree", "--root", "--find-renames", "-M", "--name-status", "--no-commit-id", "-r", "HEAD"])
    : "";
  const lastCommitRawOutput = repositoryHasHead
    ? await runGitAllowFailure(pi, repoRoot, ["diff-tree", "--root", "--find-renames", "-M", "--raw", "-z", "--no-commit-id", "-r", "HEAD"])
    : "";
  const lastCommitNumStatOutput = repositoryHasHead
    ? await runGitAllowFailure(pi, repoRoot, ["diff-tree", "--root", "--find-renames", "-M", "--numstat", "--no-commit-id", "-r", "HEAD"])
    : "";
  const branchBaseRevision = repositoryHasHead ? await getBranchBaseRevision(pi, repoRoot) : null;
  const branchDiffOutput = branchBaseRevision == null
    ? ""
    : await runGitAllowFailure(pi, repoRoot, ["diff", "--find-renames", "-M", "--name-status", branchBaseRevision, "HEAD", "--"]);
  const branchRawOutput = branchBaseRevision == null
    ? ""
    : await runGitAllowFailure(pi, repoRoot, ["diff", "--find-renames", "-M", "--raw", "-z", branchBaseRevision, "HEAD", "--"]);
  const branchNumStatOutput = branchBaseRevision == null
    ? ""
    : await runGitAllowFailure(pi, repoRoot, ["diff", "--find-renames", "-M", "--numstat", branchBaseRevision, "HEAD", "--"]);

  const untrackedChanges = parseUntrackedPaths(untrackedOutput);
  const worktreeStats = parseNumStat(worktreeNumStatOutput);
  await Promise.all(untrackedChanges.map(async (change) => {
    if (change.newPath == null) return;
    const content = await getWorkingTreeContent(repoRoot, change.newPath);
    worktreeStats.set(normalizeGitPath(change.newPath), { additions: countContentLines(content), deletions: 0 });
  }));
  const lastCommitStats = parseNumStat(lastCommitNumStatOutput);
  const branchStats = parseNumStat(branchNumStatOutput);
  const worktreeRaw = rawDiffMap(parseRawDiff(worktreeRawOutput));
  const lastCommitRaw = rawDiffMap(parseRawDiff(lastCommitRawOutput));
  const branchRaw = rawDiffMap(parseRawDiff(branchRawOutput));
  const worktreeChanges = mergeChangedPaths(parseNameStatus(trackedDiffOutput), untrackedChanges)
    .filter((change) => isReviewableFilePath(change.newPath ?? change.oldPath ?? ""));
  const deletedPaths = new Set(parseTrackedPaths(deletedFilesOutput));
  const currentPaths = uniquePaths([...parseTrackedPaths(trackedFilesOutput), ...parseTrackedPaths(untrackedOutput)])
    .filter((path) => !deletedPaths.has(path))
    .filter(isReviewableFilePath);
  const currentPathSet = new Set(currentPaths);
  const lastCommitChanges = parseNameStatus(lastCommitOutput)
    .filter((change) => isReviewableFilePath(change.newPath ?? change.oldPath ?? ""));
  const branchChanges = parseNameStatus(branchDiffOutput)
    .filter((change) => isReviewableFilePath(change.newPath ?? change.oldPath ?? ""));
  const branchContentsByPath = new Map<string, string>();
  await Promise.all(branchChanges.map(async (change) => {
    if (change.newPath == null) return;
    branchContentsByPath.set(normalizeGitPath(change.newPath), await getWorkingTreeContent(repoRoot, change.newPath));
  }));
  const branchReferenceGraph = getChangedFileReferenceGraph(branchChanges, branchContentsByPath);

  const seeds = new Map<string, ReviewFileSeed>();

  for (const change of worktreeChanges) {
    const key = getChangeKey(change);
    const seed = upsertSeed(seeds, key, () => createSeed(key, change.newPath != null));
    seed.worktreeStatus = change.status;
    seed.hasWorkingTreeFile = change.newPath != null;
    seed.inGitDiff = true;
    seed.gitDiff = toComparison(change, worktreeStats.get(normalizeGitPath(key)));
  }

  for (const change of branchChanges) {
    const key = getChangeKey(change);
    const seed = upsertSeed(seeds, key, () => createSeed(key, change.newPath != null && currentPathSet.has(change.newPath)));
    seed.inAllFiles = true;
    seed.allFiles = toComparison(change, branchStats.get(normalizeGitPath(key)));
    seed.allFilesReferenceCount = branchReferenceGraph.counts.get(normalizeGitPath(key)) ?? 0;
    seed.allFilesOutgoingReferences = branchReferenceGraph.outgoing.get(normalizeGitPath(key)) ?? [];
    seed.allFilesIncomingReferences = branchReferenceGraph.incoming.get(normalizeGitPath(key)) ?? [];
  }

  for (const change of lastCommitChanges) {
    const key = getChangeKey(change);
    const seed = upsertSeed(seeds, key, () => createSeed(key, change.newPath != null && currentPathSet.has(change.newPath)));
    seed.inLastCommit = true;
    seed.lastCommit = toComparison(change, lastCommitStats.get(normalizeGitPath(key)));
  }

  if (seeds.size === 0) {
    for (const path of currentPaths) {
      const seed = createSeed(path, true);
      seed.inAllFiles = true;
      seeds.set(path, seed);
    }
  }

  const markSubmodule = async (scope: ReviewScope, rawMap: Map<string, RawDiffChange>, stats: Map<string, ChangeStats>): Promise<void> => {
    for (const [key, raw] of rawMap.entries()) {
      if (!isSubmoduleRawChange(raw)) continue;
      const seed = upsertSeed(seeds, key, () => createSeed(key, raw.newPath != null));
      if (scope === "git-diff") {
        seed.worktreeStatus = raw.status;
        seed.hasWorkingTreeFile = raw.newPath != null;
        seed.inGitDiff = true;
        seed.gitDiff ??= toComparison(raw, stats.get(normalizeGitPath(key)));
      } else if (scope === "last-commit") {
        seed.inLastCommit = true;
        seed.lastCommit ??= toComparison(raw, stats.get(normalizeGitPath(key)));
      } else {
        seed.inAllFiles = true;
        seed.allFiles ??= toComparison(raw, stats.get(normalizeGitPath(key)));
      }

      const submodulePath = raw.newPath ?? raw.oldPath;
      const nested = submodulePath == null || raw.newPath == null
        ? { unavailableReason: "submodule is not available in the working tree" }
        : await getNestedRepoRoot(pi, repoRoot, submodulePath);
      const info = "repoRoot" in nested
        ? getSubmoduleInfo(nested.repoRoot, raw)
        : { ...getSubmoduleInfo(null, raw), unavailableReason: nested.unavailableReason };
      seed.submodule = { ...(seed.submodule ?? {}), [scope]: info };
    }
  };

  await markSubmodule("git-diff", worktreeRaw, worktreeStats);
  await markSubmodule("last-commit", lastCommitRaw, lastCommitStats);
  await markSubmodule("all-files", branchRaw, branchStats);

  const files = [...seeds.values()].map(createReviewFile).sort(compareReviewFiles);
  return { repoRoot, files };
}

export async function getSubmoduleReviewWindowData(pi: ExtensionAPI, repoRoot: string, oldSha: string, newSha: string): Promise<{ repoRoot: string; files: ReviewFile[] }> {
  const diffOutput = await runGit(pi, repoRoot, ["diff", "--find-renames", "-M", "--name-status", oldSha, newSha, "--"]);
  const rawOutput = await runGit(pi, repoRoot, ["diff", "--find-renames", "-M", "--raw", "-z", oldSha, newSha, "--"]);
  const numStatOutput = await runGitAllowFailure(pi, repoRoot, ["diff", "--find-renames", "-M", "--numstat", oldSha, newSha, "--"]);
  const rangeStats = parseNumStat(numStatOutput);
  const rangeRaw = rawDiffMap(parseRawDiff(rawOutput));
  const rangeChanges = parseNameStatus(diffOutput)
    .filter((change) => isReviewableFilePath(change.newPath ?? change.oldPath ?? ""));
  const rangeContentsByPath = new Map<string, string>();
  await Promise.all(rangeChanges.map(async (change) => {
    if (change.newPath == null) return;
    rangeContentsByPath.set(normalizeGitPath(change.newPath), await getRevisionContent(pi, repoRoot, newSha, change.newPath));
  }));
  const referenceGraph = getChangedFileReferenceGraph(rangeChanges, rangeContentsByPath);
  const seeds = new Map<string, ReviewFileSeed>();

  for (const change of rangeChanges) {
    const key = getChangeKey(change);
    const seed = upsertSeed(seeds, key, () => createSeed(key, change.newPath != null));
    seed.inAllFiles = true;
    seed.allFiles = toComparison(change, rangeStats.get(normalizeGitPath(key)), { originalRevision: oldSha, modifiedRevision: newSha });
    seed.allFilesReferenceCount = referenceGraph.counts.get(normalizeGitPath(key)) ?? 0;
    seed.allFilesOutgoingReferences = referenceGraph.outgoing.get(normalizeGitPath(key)) ?? [];
    seed.allFilesIncomingReferences = referenceGraph.incoming.get(normalizeGitPath(key)) ?? [];
  }

  for (const [key, raw] of rangeRaw.entries()) {
    if (!isSubmoduleRawChange(raw)) continue;
    const seed = upsertSeed(seeds, key, () => createSeed(key, raw.newPath != null));
    seed.inAllFiles = true;
    seed.allFiles ??= toComparison(raw, rangeStats.get(normalizeGitPath(key)), { originalRevision: oldSha, modifiedRevision: newSha });
    const submodulePath = raw.newPath ?? raw.oldPath;
    const nested = submodulePath == null || raw.newPath == null
      ? { unavailableReason: "submodule is not available in the working tree" }
      : await getNestedRepoRoot(pi, repoRoot, submodulePath);
    const info = "repoRoot" in nested
      ? getSubmoduleInfo(nested.repoRoot, raw)
      : { ...getSubmoduleInfo(null, raw), unavailableReason: nested.unavailableReason };
    seed.submodule = { "all-files": info };
  }

  return { repoRoot, files: [...seeds.values()].map(createReviewFile).sort(compareReviewFiles) };
}

export async function loadReviewFileContents(pi: ExtensionAPI, repoRoot: string, file: ReviewFile, scope: ReviewScope): Promise<ReviewFileContents> {
  const comparison = scope === "git-diff" ? file.gitDiff : scope === "last-commit" ? file.lastCommit : file.allFiles;

  if (scope === "all-files" && comparison == null) {
    const content = file.hasWorkingTreeFile ? await getWorkingTreeContent(repoRoot, file.path) : "";
    return { originalContent: content, modifiedContent: content };
  }

  if (comparison == null) {
    return { originalContent: "", modifiedContent: "" };
  }

  const branchBaseRevision = scope === "all-files" && comparison.originalRevision === undefined ? await getBranchBaseRevision(pi, repoRoot) : null;
  const originalRevision = comparison.originalRevision !== undefined
    ? comparison.originalRevision
    : scope === "git-diff"
      ? "HEAD"
      : scope === "last-commit"
        ? "HEAD^"
        : branchBaseRevision;
  const modifiedRevision = comparison.modifiedRevision !== undefined
    ? comparison.modifiedRevision
    : scope === "git-diff"
      ? null
      : "HEAD";

  const originalContent = comparison.oldPath == null || originalRevision == null ? "" : await getRevisionContent(pi, repoRoot, originalRevision, comparison.oldPath);
  const modifiedContent = comparison.newPath == null
    ? ""
    : modifiedRevision == null
      ? await getWorkingTreeContent(repoRoot, comparison.newPath)
      : await getRevisionContent(pi, repoRoot, modifiedRevision, comparison.newPath);

  return { originalContent, modifiedContent };
}
