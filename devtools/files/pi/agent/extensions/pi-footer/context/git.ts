import { execFileSync } from "node:child_process";
import { basename } from "node:path";
import { truncate } from "../core/strings.ts";
import { Footer } from "../footer.ts";
import type { FilterFunction, FooterContextProvider } from "../types.ts";

type GitStatus = {
  branch: string;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
};

type GitCommit = {
  hash: string;
  subject: string;
};

type GitStatusIconStyle = {
  branch: string;
  staged: string;
  unstaged: string;
  untracked: string;
  ahead: string;
  behind: string;
  clean: string;
};

const GIT_STATUS_STYLES: Record<string, GitStatusIconStyle> = {
  ascii: {
    branch: "git:",
    staged: "+",
    unstaged: "~",
    untracked: "?",
    ahead: "^",
    behind: "v",
    clean: "clean",
  },
  unicode: {
    branch: " ",
    staged: "●",
    unstaged: "✚",
    untracked: "…",
    ahead: "↑",
    behind: "↓",
    clean: "clean",
  },
};

const GIT_TIMEOUT_MS = 250;
const MAX_SUBJECT_LENGTH = 44;

function runGit(cwd: string, args: string[]): string | null {
  try {
    return execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf-8",
      timeout: GIT_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function parseBranchMeta(meta: string): { ahead: number; behind: number } {
  const aheadMatch = meta.match(/ahead (\d+)/);
  const behindMatch = meta.match(/behind (\d+)/);
  return {
    ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
    behind: behindMatch ? Number(behindMatch[1]) : 0,
  };
}

function parseStatus(output: string): GitStatus {
  const lines = output.split(/\r?\n/).filter((line) => line.length > 0);

  let branch = "detached";
  let ahead = 0;
  let behind = 0;
  let staged = 0;
  let unstaged = 0;
  let untracked = 0;

  const header = lines[0];
  if (header?.startsWith("## ")) {
    const branchMatch = header.match(/^## ([^.\s]+)(?:\.\.\.[^\s]+)?(?: \[(.+)\])?/);
    if (branchMatch?.[1]) {
      branch = branchMatch[1] === "HEAD" ? "detached" : branchMatch[1];
    }
    if (branchMatch?.[2]) {
      const parsed = parseBranchMeta(branchMatch[2]);
      ahead = parsed.ahead;
      behind = parsed.behind;
    }
  }

  for (const line of lines.slice(1)) {
    if (line.startsWith("??")) {
      untracked += 1;
      continue;
    }

    const x = line[0] ?? " ";
    const y = line[1] ?? " ";

    if (x !== " ") staged += 1;
    if (y !== " ") unstaged += 1;
  }

  return { branch, ahead, behind, staged, unstaged, untracked };
}

function getGitStatus(cwd: string): GitStatus | null {
  const output = runGit(cwd, [
    "status",
    "--porcelain=v1",
    "--branch",
    "--untracked-files=normal",
  ]);
  if (!output) return null;

  return parseStatus(output);
}

function getRecentCommits(cwd: string, limit = 2): GitCommit[] {
  const safeLimit = Math.max(1, Math.min(limit, 5));

  const output = runGit(cwd, [
    "log",
    `-${safeLimit}`,
    "--pretty=format:%h%x09%s",
    "--no-show-signature",
  ]);

  if (!output) return [];

  return output
    .split(/\r?\n/)
    .map((line) => line.split("\t"))
    .map(([hash = "", subject = ""]) => ({ hash, subject }))
    .filter((entry) => entry.hash.length > 0 && entry.subject.length > 0);
}

function getGitWorktreeName(cwd: string): string | null {
  const worktreeRoot = runGit(cwd, ["rev-parse", "--show-toplevel"]);
  if (!worktreeRoot) return null;

  return basename(worktreeRoot);
}

function isGitStatus(value: unknown): value is GitStatus {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GitStatus>;
  return (
    typeof candidate.branch === "string" &&
    typeof candidate.staged === "number" &&
    typeof candidate.unstaged === "number" &&
    typeof candidate.untracked === "number" &&
    typeof candidate.ahead === "number" &&
    typeof candidate.behind === "number"
  );
}

function resolveGitStatusStyle(styleArg: unknown): GitStatusIconStyle {
  if (typeof styleArg !== "string") return GIT_STATUS_STYLES.ascii;

  const normalized = styleArg.trim();
  if (!normalized) return GIT_STATUS_STYLES.ascii;

  if (normalized in GIT_STATUS_STYLES) {
    return GIT_STATUS_STYLES[normalized];
  }

  if (normalized.startsWith("GitStatusStyle.")) {
    const key = normalized.slice("GitStatusStyle.".length);
    if (key in GIT_STATUS_STYLES) {
      return GIT_STATUS_STYLES[key];
    }
  }

  return GIT_STATUS_STYLES.ascii;
}

const gitStatusIconsFilter: FilterFunction = (
  value: unknown,
  styleArg?: unknown,
): string => {
  if (!isGitStatus(value)) return "--";

  const style = resolveGitStatusStyle(styleArg);
  const markers: string[] = [];

  if (value.staged > 0) markers.push(`${style.staged}${value.staged}`);
  if (value.unstaged > 0) markers.push(`${style.unstaged}${value.unstaged}`);
  if (value.untracked > 0) markers.push(`${style.untracked}${value.untracked}`);
  if (value.ahead > 0) markers.push(`${style.ahead}${value.ahead}`);
  if (value.behind > 0) markers.push(`${style.behind}${value.behind}`);

  const summary = markers.length > 0 ? markers.join(" ") : style.clean;
  return `${style.branch}${value.branch} ${summary}`.trim();
};

const gitBranchNameProvider: FooterContextProvider = (ctx) => {
  const status = getGitStatus(ctx.cwd);
  return status?.branch ?? "";
};

const gitWorktreeNameProvider: FooterContextProvider = (ctx) => {
  return getGitWorktreeName(ctx.cwd) ?? "";
};

const gitStatusProvider: FooterContextProvider = (ctx) => {
  return getGitStatus(ctx.cwd);
};

const recentCommitsProvider: FooterContextProvider = (ctx) => {
  const recent = getRecentCommits(ctx.cwd, 1);
  const latest = recent[0];
  if (!latest) return null;

  return {
    hash: latest.hash,
    subject: truncate(latest.subject, MAX_SUBJECT_LENGTH),
  };
};

Footer.registerContextProvider("git_branch_name", gitBranchNameProvider);
Footer.registerContextProvider("git_worktree_name", gitWorktreeNameProvider);
Footer.registerContextProvider("git_status", gitStatusProvider);
Footer.registerContextProvider("recent_commits", recentCommitsProvider);

Footer.registerContextFilter("git_status_icons", gitStatusIconsFilter);
