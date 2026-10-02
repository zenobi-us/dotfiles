/**
 * Review-thread and PR-comment operations. `pr.ts threads ...` is the entry point.
 *
 * A PR reference is a number or a URL; without one the current branch's open PR is used.
 * `list` walks every page (the API caps a page at 100) and returns the review threads plus
 * the top-level comments and review bodies from people other than the PR author.
 */
import path from "node:path";
import { captureResult, repoRoot, resolveCommand } from "../core.ts";

const REPO_ROOT = repoRoot();
const PAGE_SIZE = 100;
export const SIDES = ["RIGHT", "LEFT"] as const;

export const COPILOT_LOGIN = "copilot-pull-request-reviewer";

const QUERY_VARIABLES = "$owner: String!, $repo: String!, $prNumber: Int!, $cursor: String";

const THREADS_QUERY = `
query(${QUERY_VARIABLES}) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $prNumber) {
      reviewThreads(first: ${PAGE_SIZE}, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          comments(first: ${PAGE_SIZE}) {
            nodes { id databaseId body author { login } createdAt path line diffHunk }
          }
        }
      }
    }
  }
}`;

const COMMENTS_QUERY = `
query(${QUERY_VARIABLES}) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $prNumber) {
      author { login }
      comments(first: ${PAGE_SIZE}, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id url body createdAt isMinimized author { __typename login } }
      }
    }
  }
}`;

const REVIEWS_QUERY = `
query(${QUERY_VARIABLES}) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $prNumber) {
      author { login }
      reviews(first: ${PAGE_SIZE}, after: $cursor, states: [CHANGES_REQUESTED, COMMENTED]) {
        pageInfo { hasNextPage endCursor }
        nodes { id url body state createdAt submittedAt author { __typename login } }
      }
    }
  }
}`;

const RESOLVE_MUTATION = `
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { id isResolved }
  }
}`;

const REPLY_MUTATION = `
mutation($threadId: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: $threadId, body: $body}) {
    comment { id url }
  }
}`;

const PR_URL = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)(?:[/?#]\S*)?$/i;
const PR_NUMBER = /^#?(\d+)$/;

export interface PrRef {
  prNumber: number;
  nameWithOwner: string | null;
}

export function parsePrRef(value: string): PrRef {
  const text = String(value).trim();
  const url = PR_URL.exec(text);
  if (url) return { prNumber: Number(url[3]), nameWithOwner: `${url[1]}/${url[2]}` };
  const number = PR_NUMBER.exec(text);
  if (number) return { prNumber: Number(number[1]), nameWithOwner: null };
  throw new Error(`pr must be a PR number or URL, got: ${text}`);
}

export interface Options {
  pr?: PrRef;
  path?: string;
  line?: number;
  side?: string;
  bodyFile?: string;
}

/** `owner/repo` -> `{ owner, repo }`. */
export function splitNameWithOwner(nameWithOwner: string): { owner: string; repo: string } {
  const [owner, repo] = nameWithOwner.trim().split("/");
  if (!owner || !repo) throw new Error(`unexpected repository: ${nameWithOwner}`);
  return { owner, repo };
}

interface ThreadNode {
  id: string;
  isResolved: boolean;
  isOutdated: boolean;
  path: string | null;
  line: number | null;
  comments?: { nodes?: { author?: { login: string } | null; body: string; createdAt: string; path: string | null; line: number | null }[] };
}

export interface Thread {
  id: string;
  isResolved: boolean;
  isOutdated: boolean;
  path: string | null;
  line: number | null;
  comments: { author: string | null; body: string; createdAt: string; path: string | null; line: number | null }[];
}

/** Flatten one page's nodes into the shape the skill reads, keeping only what it uses. */
export function summariseThreads(nodes: ThreadNode[]): Thread[] {
  return nodes.map((thread) => ({
    id: thread.id,
    isResolved: thread.isResolved,
    isOutdated: thread.isOutdated,
    path: thread.path,
    line: thread.line,
    comments: (thread.comments?.nodes ?? []).map((comment) => ({
      author: comment.author?.login ?? null,
      body: comment.body,
      createdAt: comment.createdAt,
      path: comment.path,
      line: comment.line,
    })),
  }));
}

interface Authored {
  id: string;
  url: string;
  body: string;
  createdAt: string;
  submittedAt?: string;
  state?: string;
  isMinimized?: boolean;
  author: { __typename?: string; login: string } | null;
}

export interface CommentItem {
  kind: "comment" | "review";
  state: string | null;
  id: string;
  author: string;
  url: string;
  body: string;
  createdAt: string;
}

const pickComment = (node: Authored) => ({ id: node.id, author: (node.author as { login: string }).login, url: node.url, body: node.body });

export function summariseComments({
  authorLogin,
  comments,
  reviews,
  ignoreAuthors = [],
}: {
  authorLogin: string | null;
  comments: Authored[];
  reviews: Authored[];
  ignoreAuthors?: string[];
}): CommentItem[] {
  const ignored = new Set([authorLogin, COPILOT_LOGIN, ...ignoreAuthors].filter(Boolean).map((login) => (login as string).toLowerCase()));
  const byPerson = (node: Authored) => node.author && node.author.__typename !== "Bot" && !ignored.has(node.author.login.toLowerCase());
  const items: CommentItem[] = [
    ...comments
      .filter((comment) => byPerson(comment) && !comment.isMinimized && comment.body?.trim())
      .map((comment) => ({ kind: "comment" as const, state: null, ...pickComment(comment), createdAt: comment.createdAt })),
    ...reviews
      .filter((review) => byPerson(review) && review.body?.trim())
      .map((review) => ({ kind: "review" as const, state: review.state ?? null, ...pickComment(review), createdAt: review.submittedAt ?? review.createdAt })),
  ];
  return items.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export interface ReviewState {
  prNumber: number;
  total: number;
  unresolved: number;
  threads: Thread[];
  comments: CommentItem[];
}

export function formatHuman({ prNumber, threads, comments = [] }: { prNumber: number; threads: Thread[]; comments?: CommentItem[] }): string {
  const unresolved = threads.filter((thread) => !thread.isResolved);
  const rows = threads.map((thread) => {
    const state = thread.isResolved ? "resolved" : "OPEN    ";
    const where = `${thread.path ?? "(no file)"}:${thread.line ?? "-"}`;
    return `  ${state}  ${thread.id}  ${where}`;
  });
  const commentRows = comments.map((item) => `  ${item.kind.padEnd(8)}  ${item.author}  ${item.url}`);
  return [
    `PR #${prNumber}: ${unresolved.length} unresolved of ${threads.length}`,
    ...rows,
    `${comments.length} top-level comments and review bodies from reviewers`,
    ...commentRows,
  ].join("\n");
}

export const ghPath = (): string => {
  const gh = resolveCommand("gh");
  if (!gh) throw new Error("gh is not on PATH; install the GitHub CLI and run `gh auth login`.");
  return gh;
};

// The gh responses are not typed at this boundary: each caller narrows what it reads.
export async function ghJson(gh: string, args: string[]): Promise<any> {
  const result = await captureResult(gh, args, { cwd: REPO_ROOT });
  if (result.code !== 0) {
    throw new Error(`gh ${args[0]} failed (exit ${result.code}): ${result.stderr.trim() || result.stdout.trim()}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`gh ${args[0]} returned output that is not JSON: ${result.stdout.slice(0, 200)}`);
  }
}

export async function currentPrNumber(gh: string): Promise<number> {
  const pr = await ghJson(gh, ["pr", "view", "--json", "number"]);
  if (!pr?.number) throw new Error("no open PR for the current branch; pass a PR number or URL.");
  return pr.number;
}

export interface Target {
  owner: string;
  repo: string;
  prNumber: number;
}

export async function resolvePr(gh: string, prRef?: PrRef): Promise<Target> {
  const checkout: string = (await ghJson(gh, ["repo", "view", "--json", "nameWithOwner"])).nameWithOwner;
  if (prRef?.nameWithOwner && prRef.nameWithOwner.toLowerCase() !== checkout.trim().toLowerCase()) {
    throw new Error(`the PR is in ${prRef.nameWithOwner}, this checkout is ${checkout.trim()}; run it from that repository.`);
  }
  const prNumber = prRef?.prNumber ?? (await currentPrNumber(gh));
  return { ...splitNameWithOwner(checkout), prNumber };
}

async function paginate(gh: string, { owner, repo, prNumber }: Target, query: string, connection: string) {
  const nodes: any[] = [];
  let pullRequest: any = null;
  let cursor: string | null = null;
  do {
    const args = ["api", "graphql", "-f", `query=${query}`, "-f", `owner=${owner}`, "-f", `repo=${repo}`, "-F", `prNumber=${prNumber}`];
    if (cursor) args.push("-f", `cursor=${cursor}`);
    const page = await ghJson(gh, args);
    pullRequest = page?.data?.repository?.pullRequest;
    const block = pullRequest?.[connection];
    if (!block) throw new Error(`no ${connection} in the response for PR #${prNumber}`);
    nodes.push(...(block.nodes ?? []));
    cursor = block.pageInfo?.hasNextPage ? block.pageInfo.endCursor : null;
  } while (cursor);
  return { pullRequest, nodes };
}

export async function listComments(gh: string, pr: Target, ignoreAuthors: string[] = []): Promise<CommentItem[]> {
  const comments = await paginate(gh, pr, COMMENTS_QUERY, "comments");
  const reviews = await paginate(gh, pr, REVIEWS_QUERY, "reviews");
  return summariseComments({
    authorLogin: comments.pullRequest?.author?.login ?? null,
    comments: comments.nodes,
    reviews: reviews.nodes,
    ignoreAuthors,
  });
}

export async function fetchReviewState(gh: string, pr: Target, ignoreAuthors: string[] = []): Promise<ReviewState> {
  const threads = summariseThreads((await paginate(gh, pr, THREADS_QUERY, "reviewThreads")).nodes);
  return {
    prNumber: pr.prNumber,
    total: threads.length,
    unresolved: threads.filter((thread) => !thread.isResolved).length,
    threads,
    comments: await listComments(gh, pr, ignoreAuthors),
  };
}

export async function listThreads(prRef?: PrRef, ignoreAuthors: string[] = []): Promise<ReviewState> {
  const gh = ghPath();
  return fetchReviewState(gh, await resolvePr(gh, prRef), ignoreAuthors);
}

export async function resolveThread(threadId: string) {
  const gh = ghPath();
  const data = await ghJson(gh, ["api", "graphql", "-f", `query=${RESOLVE_MUTATION}`, "-f", `threadId=${threadId}`]);
  const thread = data?.data?.resolveReviewThread?.thread;
  if (!thread) throw new Error(`resolve returned no thread for ${threadId}`);
  return { threadId: thread.id, isResolved: thread.isResolved };
}

export async function replyToThread(threadId: string, bodyFile: string) {
  const gh = ghPath();
  const data = await ghJson(gh, [
    "api",
    "graphql",
    "-f",
    `query=${REPLY_MUTATION}`,
    "-f",
    `threadId=${threadId}`,
    "-F",
    `body=@${path.resolve(bodyFile)}`,
  ]);
  const comment = data?.data?.addPullRequestReviewThreadReply?.comment;
  if (!comment) throw new Error(`reply returned no comment for ${threadId}`);
  return { threadId, commentId: comment.id, url: comment.url };
}

export function lineCommentArgs(
  { owner, repo, prNumber }: Target,
  { headRefOid, path: filePath, line, side, bodyFile }: { headRefOid: string; path: string; line: number; side: string; bodyFile: string },
): string[] {
  return [
    "api",
    `repos/${owner}/${repo}/pulls/${prNumber}/comments`,
    "-X",
    "POST",
    "-f",
    `commit_id=${headRefOid}`,
    "-f",
    `path=${filePath.replace(/\\/g, "/")}`,
    "-F",
    `line=${line}`,
    "-f",
    `side=${side}`,
    "-F",
    `body=@${path.resolve(bodyFile)}`,
  ];
}

export async function commentOnLine(options: Options) {
  const gh = ghPath();
  const pr = await resolvePr(gh, options.pr);
  const { headRefOid } = await ghJson(gh, ["pr", "view", String(pr.prNumber), "--json", "headRefOid"]);
  const comment = await ghJson(
    gh,
    lineCommentArgs(pr, {
      headRefOid,
      path: options.path as string,
      line: options.line as number,
      side: options.side as string,
      bodyFile: options.bodyFile as string,
    }),
  );
  return { prNumber: pr.prNumber, commentId: comment.id, url: comment.html_url, path: comment.path, line: comment.line, side: comment.side };
}
