/**
 * Runtime metadata for the PR workflow, in one call. `pr.ts meta` is the entry point.
 *
 * Everything goes to stdout: nothing here writes a file or creates a directory.
 */
import { captureResult, repoRoot, resolveCommand } from "../core.ts";

const REPO_ROOT = repoRoot();
export const NO_UPSTREAM = "NO_UPSTREAM";

const lines = (text: string): string[] => text.split(/\r?\n/).filter(Boolean);

export const parseLsRemote = (text: string): string | null => /^([0-9a-f]{40})\s/m.exec(text)?.[1] ?? null;

export interface Meta {
  currentBranch: string;
  defaultBranch: string;
  targetBranch: string;
  workingTreeShort: string;
  upstreamRef: string;
  fetchOk: boolean;
  branchOk: boolean;
  upstreamOk: boolean;
  changedFilesCount: number;
  changedFiles: string[];
  shortstat: string;
  commitsOneline: string[];
  hasExistingPr: boolean;
  prNumber: number | null;
  prTitle: string | null;
  prUrl: string | null;
  remoteHeadSha: string | null;
  remoteOnlyCommits: string[];
}

export function formatHuman(meta: Meta): string {
  const scalar: [string, string | number | boolean][] = [
    ["currentBranch", meta.currentBranch],
    ["defaultBranch", meta.defaultBranch],
    ["targetBranch", meta.targetBranch],
    ["workingTreeShort", meta.workingTreeShort.replace(/\r?\n/g, "\\n")],
    ["upstreamRef", meta.upstreamRef],
    ["fetchOk", meta.fetchOk],
    ["branchOk", meta.branchOk],
    ["upstreamOk", meta.upstreamOk],
    ["changedFilesCount", meta.changedFilesCount],
    ["shortstat", meta.shortstat],
    ["hasExistingPr", meta.hasExistingPr],
    ["prNumber", meta.prNumber ?? ""],
    ["prTitle", meta.prTitle ?? ""],
    ["prUrl", meta.prUrl ?? ""],
    ["remoteHeadSha", meta.remoteHeadSha ?? ""],
  ];
  return [
    ...scalar.map(([key, value]) => `${key}=${value}`),
    "",
    "changedFiles:",
    ...meta.changedFiles,
    "",
    "commitsOneline:",
    ...meta.commitsOneline,
    "",
    "remoteOnlyCommits:",
    ...meta.remoteOnlyCommits,
  ].join("\n");
}

const git = (args: string[]) => captureResult("git", args, { cwd: REPO_ROOT });
const gitOut = async (args: string[]): Promise<string | null> => {
  const result = await git(args);
  return result.code === 0 ? result.stdout.replace(/\r?\n$/, "") : null;
};

async function defaultBranch(gh: string | null): Promise<string> {
  if (gh) {
    const result = await captureResult(gh, ["repo", "view", "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"], { cwd: REPO_ROOT });
    if (result.code === 0 && result.stdout.trim()) return result.stdout.trim();
    console.error("Warning: unable to determine the default branch with gh; falling back to git remote metadata.");
  }
  const remote = await gitOut(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
  if (remote) return remote.replace(/^origin\//, "");
  const show = await gitOut(["remote", "show", "origin"]);
  const match = show && /HEAD branch:\s*(\S+)/.exec(show);
  if (match) return match[1] as string;
  throw new Error("unable to determine the default branch (gh unavailable/unauthenticated and the git fallback failed).");
}

interface ExistingPr {
  number: number;
  title: string;
  url: string;
}

async function existingPr(gh: string | null, branch: string): Promise<ExistingPr | null> {
  if (!gh) return null;
  const result = await captureResult(gh, ["pr", "list", "--head", branch, "--json", "number,title,url"], { cwd: REPO_ROOT });
  if (result.code !== 0) return null;
  try {
    return (JSON.parse(result.stdout) as ExistingPr[])[0] ?? null;
  } catch {
    return null;
  }
}

async function remoteBranchState(branch: string, targetRef: string, haveTarget: boolean) {
  const remoteHeadSha = parseLsRemote((await gitOut(["ls-remote", "origin", `refs/heads/${branch}`])) ?? "");
  if (!remoteHeadSha) return { remoteHeadSha: null, remoteOnlyCommits: [] };
  if ((await git(["cat-file", "-e", `${remoteHeadSha}^{commit}`])).code !== 0) await git(["fetch", "origin", branch]);
  const range = ["log", "--cherry-pick", "--right-only", "--no-merges", "--oneline", `HEAD...${remoteHeadSha}`];
  if (haveTarget) range.push(`^${targetRef}`);
  const only = await gitOut(range);
  return { remoteHeadSha, remoteOnlyCommits: only === null ? [`${remoteHeadSha} (could not be read)`] : lines(only) };
}

export async function collectMeta(targetOverride?: string): Promise<Meta> {
  const gh = resolveCommand("gh");
  const currentBranch = (await gitOut(["branch", "--show-current"])) ?? "";
  const defaultBranchName = await defaultBranch(gh);
  const targetBranch = targetOverride || defaultBranchName;
  const workingTreeShort = (await gitOut(["status", "--short"])) ?? "";
  const upstreamRef = (await gitOut(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])) ?? NO_UPSTREAM;
  const fetchOk = (await git(["fetch", "origin", targetBranch])).code === 0;
  const targetRef = `origin/${targetBranch}`;
  const haveTarget = fetchOk && (await git(["rev-parse", "--verify", "--quiet", targetRef])).code === 0;

  const changedFiles = haveTarget ? lines((await gitOut(["diff", "--name-only", `${targetRef}...HEAD`])) ?? "") : [];
  const shortstat = haveTarget ? ((await gitOut(["diff", "--shortstat", `${targetRef}...HEAD`])) ?? "").trim() : "";
  const commitsOneline = haveTarget ? lines((await gitOut(["log", `${targetRef}..HEAD`, "--oneline"])) ?? "") : [];

  const remote = await remoteBranchState(currentBranch, targetRef, haveTarget);
  const pr = await existingPr(gh, currentBranch);

  return {
    currentBranch,
    defaultBranch: defaultBranchName,
    targetBranch,
    workingTreeShort,
    upstreamRef,
    fetchOk,
    branchOk: currentBranch !== targetBranch,
    upstreamOk: upstreamRef !== NO_UPSTREAM,
    changedFilesCount: changedFiles.length,
    changedFiles,
    shortstat,
    commitsOneline,
    hasExistingPr: pr !== null,
    prNumber: pr?.number ?? null,
    prTitle: pr?.title ?? null,
    prUrl: pr?.url ?? null,
    ...remote,
  };
}
