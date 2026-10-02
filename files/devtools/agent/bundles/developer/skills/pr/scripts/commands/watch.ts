/**
 * Watch one PR until its checks, its Copilot review and its reviewer comments settle, then
 * return one JSON event. `pr.ts watch` is the entry point.
 */
import { setTimeout as sleep } from "node:timers/promises";
import { captureResult, repoRoot } from "../core.ts";
import { COPILOT_LOGIN, fetchReviewState, ghJson, ghPath, parsePrRef, resolvePr } from "./threads.ts";
import type { CommentItem, PrRef, ReviewState, Target } from "./threads.ts";

const REPO_ROOT = repoRoot();

export { COPILOT_LOGIN };

/**
 * Branches a repository usually reviews with Copilot. GitHub exposes no API for the rule that
 * decides this, so it is a guess that `--copilot-bases` overrides. Copilot reviews such a PR
 * once, when it opens, never a draft and never on a push.
 */
export const COPILOT_REVIEWED_BASES = ["main", "master", "develop", "development"];
export const DEFAULTS = { maxWait: 8, interval: 30, copilotWait: 15 };
export const EXIT_CODES: Record<string, number> = { done: 0, "action-needed": 10, timeout: 11, closed: 12 };
export const MAX_CONSECUTIVE_ERRORS = 3;

export interface WatchOptions {
  pr?: PrRef;
  maxWait: number;
  interval: number;
  copilotWait: number;
  copilotBases: string[];
  ignoreAuthors: string[];
  since?: string;
}

const parseJsonOrUndefined = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

export interface Check {
  name: string;
  bucket: string;
  workflow: string;
  link: string;
}

export function parseChecks({ code, stdout, stderr }: { code: number | null; stdout: string; stderr: string }): Check[] {
  if (/no checks reported/i.test(stderr)) return [];
  const parsed = parseJsonOrUndefined(stdout);
  if (Array.isArray(parsed)) return parsed as Check[];
  throw new Error(`gh pr checks failed (exit ${code}): ${stderr.trim() || stdout.trim()}`);
}

export function summariseChecks(checks: Check[]) {
  return {
    total: checks.length,
    passed: checks.filter((check) => check.bucket === "pass").length,
    pending: checks.filter((check) => check.bucket === "pending").map((check) => check.name),
    failed: checks
      .filter((check) => check.bucket === "fail" || check.bucket === "cancel")
      .map(({ name, bucket, workflow, link }) => ({ name, bucket, workflow, link })),
  };
}

export interface PrView {
  number: number;
  url: string;
  state: string;
  isDraft: boolean;
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
  createdAt: string;
  reviews?: { author?: { login: string } | null }[];
}

export function copilotStatus(pr: PrView, nowMs: number, copilotWaitMinutes: number, bases: string[] = COPILOT_REVIEWED_BASES) {
  const expected = !pr.isDraft && bases.includes(pr.baseRefName);
  const reviewed = (pr.reviews ?? []).some((review) => review.author?.login === COPILOT_LOGIN);
  const waitedOut = expected && !reviewed && nowMs - Date.parse(pr.createdAt) >= copilotWaitMinutes * 60_000;
  return { expected, reviewed, waitedOut };
}

export function newComments(comments: CommentItem[], since: string) {
  const sinceMs = Date.parse(since);
  const items = comments.filter((item) => Date.parse(item.createdAt) > sinceMs);
  const latestAt = items.reduce((latest, item) => (Date.parse(item.createdAt) > Date.parse(latest) ? item.createdAt : latest), since);
  return {
    since,
    latestAt,
    items: items.map(({ id, kind, state, author, url, createdAt }) => ({ id, kind, state, author, url, createdAt })),
  };
}

export interface Snapshot {
  pr: PrView;
  checks: Check[];
  threads: ReviewState;
  localHead: string | null;
  headCommittedAt: string | null;
}

export function assess(
  { pr, checks, threads, localHead, headCommittedAt }: Snapshot,
  nowMs: number,
  options: Pick<WatchOptions, "copilotWait" | "copilotBases" | "since">,
) {
  const checkSummary = summariseChecks(checks);
  const copilot = copilotStatus(pr, nowMs, options.copilotWait, options.copilotBases);
  const unresolved = threads.threads.filter((thread) => !thread.isResolved);
  const comments = newComments(threads.comments ?? [], options.since ?? headCommittedAt ?? pr.createdAt);
  const localHeadMatches = localHead === null ? null : localHead === pr.headRefOid;
  const summary = {
    prNumber: pr.number,
    url: pr.url,
    state: pr.state,
    baseRefName: pr.baseRefName,
    headRefOid: pr.headRefOid,
    localHeadMatches,
    checks: checkSummary,
    copilot,
    threads: {
      unresolved: unresolved.length,
      items: unresolved.map((thread) => ({
        id: thread.id,
        path: thread.path,
        line: thread.line,
        isOutdated: thread.isOutdated,
        author: thread.comments[0]?.author ?? null,
      })),
    },
    comments,
  };

  if (pr.state !== "OPEN") return { verdict: "closed" as const, summary, key: null };
  const settled =
    localHeadMatches !== false &&
    checkSummary.total > 0 &&
    checkSummary.pending.length === 0 &&
    (!copilot.expected || copilot.reviewed || copilot.waitedOut);
  if (!settled) return { verdict: null, summary, key: null };
  const actionNeeded = checkSummary.failed.length > 0 || unresolved.length > 0 || comments.items.length > 0;
  const verdict = actionNeeded ? ("action-needed" as const) : ("done" as const);
  return { verdict, summary, key: settledKey(verdict, pr.headRefOid, checks, copilot, unresolved, comments.items) };
}

export function settledKey(
  verdict: string,
  headRefOid: string,
  checks: Check[],
  copilot: unknown,
  unresolved: { id: string }[],
  comments: { id: string }[],
): string {
  return JSON.stringify({
    verdict,
    headRefOid,
    checks: checks.map((check) => `${check.workflow}/${check.name}/${check.bucket}`).sort(),
    copilot,
    threads: unresolved.map((thread) => thread.id).sort(),
    comments: comments.map((comment) => comment.id).sort(),
  });
}

export function formatProgress(summary: ReturnType<typeof assess>["summary"]): string {
  const { checks, copilot, threads, comments } = summary;
  const copilotText = !copilot.expected ? "not expected" : copilot.reviewed ? "reviewed" : copilot.waitedOut ? "did not review" : "waiting";
  const head = summary.localHeadMatches === false ? "; the PR head is not the local HEAD yet" : "";
  return `checks ${checks.passed} pass, ${checks.pending.length} pending, ${checks.failed.length} failed; Copilot ${copilotText}; ${threads.unresolved} unresolved threads; ${comments.items.length} new reviewer comments${head}`;
}

export interface WatchDeps {
  fetchSnapshot: () => Promise<Snapshot>;
  now?: () => number;
  wait?: (ms: number) => Promise<unknown>;
  log?: (line: string) => void;
}

export async function watch(options: WatchOptions, deps: WatchDeps) {
  const { fetchSnapshot, now = Date.now, wait = sleep, log = (line: string) => console.error(line) } = deps;
  const deadline = now() + options.maxWait * 60_000;
  const intervalMs = options.interval * 1000;
  let previousKey: string | null = null;
  let lastSummary: ReturnType<typeof assess>["summary"] | null = null;
  let lastLine = "";
  let errors = 0;

  for (;;) {
    let snapshot: Snapshot | null = null;
    try {
      snapshot = await fetchSnapshot();
      errors = 0;
    } catch (error) {
      errors += 1;
      if (errors >= MAX_CONSECUTIVE_ERRORS) throw error;
      log(`warning: ${(error as Error).message} (attempt ${errors} of ${MAX_CONSECUTIVE_ERRORS})`);
    }

    if (snapshot) {
      const { verdict, summary, key } = assess(snapshot, now(), options);
      lastSummary = summary;
      if (verdict === "closed") return { event: "closed", ...summary };
      if (key !== null && key === previousKey) return { event: verdict as string, ...summary };
      previousKey = key;
      const line = formatProgress(summary);
      if (line !== lastLine) log(`[${new Date(now()).toISOString()}] PR #${summary.prNumber}: ${line}`);
      lastLine = line;
    }

    if (now() + intervalMs > deadline) {
      if (!lastSummary) throw new Error("no snapshot of the PR could be read before --max-wait");
      return { event: "timeout", ...lastSummary };
    }
    await wait(intervalMs);
  }
}

async function localHeadFor(headRefName: string): Promise<string | null> {
  const branch = await captureResult("git", ["branch", "--show-current"], { cwd: REPO_ROOT });
  if (branch.code !== 0 || branch.stdout.trim() !== headRefName) return null;
  const head = await captureResult("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT });
  return head.code === 0 ? head.stdout.trim() : null;
}

async function commitTime(gh: string, { owner, repo }: Target, sha: string): Promise<string | null> {
  const commit = await ghJson(gh, ["api", `repos/${owner}/${repo}/git/commits/${sha}`]);
  return commit?.committer?.date ?? null;
}

export function snapshotReader(gh: string, target: Target, ignoreAuthors: string[]): () => Promise<Snapshot> {
  const prNumber = String(target.prNumber);
  const committedAt = new Map<string, string | null>();
  return async () => {
    const pr: PrView = await ghJson(gh, [
      "pr",
      "view",
      prNumber,
      "--json",
      "number,url,state,isDraft,baseRefName,headRefName,headRefOid,createdAt,reviews",
    ]);
    const checks = parseChecks(await captureResult(gh, ["pr", "checks", prNumber, "--json", "name,bucket,workflow,link"], { cwd: REPO_ROOT }));
    const threads = await fetchReviewState(gh, target, ignoreAuthors);
    if (!committedAt.has(pr.headRefOid)) committedAt.set(pr.headRefOid, await commitTime(gh, target, pr.headRefOid));
    return { pr, checks, threads, localHead: await localHeadFor(pr.headRefName), headCommittedAt: committedAt.get(pr.headRefOid) ?? null };
  };
}
