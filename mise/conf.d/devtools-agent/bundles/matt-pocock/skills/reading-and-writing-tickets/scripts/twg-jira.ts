import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adfToMarkdown } from "./adf-markdown.ts";
import { nonEmptyString, parseJson, record, run } from "./dep-tree-shared.ts";

// Reads `twg` Jira output into issue records. The shapes below were checked against live `twg` on 2026-11-12;
// see tracker/initiatives/jira-tracker-mirror/index.md, section "Verified `twg` behaviour".

export interface JiraIssueRecord {
  key: string;
  title: string;
  type: string;
  statusName: string;
  statusCategory: string;
  parentKey?: string;
  blockerKeys: string[];
  /** Plain text converted from the Atlassian Document Format description. Empty when the issue has no description. */
  description: string;
  /** The description converted to Markdown. Empty when the issue has no description. */
  descriptionMarkdown: string;
  /** Jira `updated` timestamp, as `twg` returns it. */
  updated?: string;
}

/** Runs `twg` with the given arguments and returns the parsed JSON output. */
export type RunTwg = (args: string[]) => Promise<unknown>;

/** Every parser field. The `twg` default field set leaves out parent, issuelinks, and description, so always pass this. */
export const JIRA_ISSUE_FIELDS = "summary,status,issuetype,parent,issuelinks,description,updated";

const QUERY_PAGE_SIZE = "100";

/** Returns every issue that matches the JQL. Follows `pageInfo.nextCursor` until the last page. */
export async function queryJiraIssues(jql: string, runTwg: RunTwg): Promise<JiraIssueRecord[]> {
  const issues: JiraIssueRecord[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  for (let page = 1; ; page += 1) {
    const args = ["jira", "workitem", "query", "--jql", jql, "--fields", JIRA_ISSUE_FIELDS, "--limit", QUERY_PAGE_SIZE];
    if (cursor !== undefined) args.push("--after", cursor);
    const result = parseWorkitemQueryPage(await runTwg(args), `twg query page ${page}`);
    issues.push(...result.issues);
    if (result.nextCursor === undefined) return issues;
    // A repeated cursor would loop forever.
    if (seenCursors.has(result.nextCursor)) throw new Error(`twg query page ${page} repeated an earlier pageInfo.nextCursor`);
    seenCursors.add(result.nextCursor);
    cursor = result.nextCursor;
  }
}

/** Returns one issue. Throws when `twg` returns a different key. */
export async function getJiraIssue(key: string, runTwg: RunTwg): Promise<JiraIssueRecord> {
  return parseWorkitemGet(await runTwg(["jira", "workitem", "get", key, "--fields", JIRA_ISSUE_FIELDS]), key);
}

/**
 * Parses one `workitem query` response. `nextCursor` is absent on the last page.
 * `twg` leaves out `pageInfo` when all results fit in one page, so a missing `pageInfo` means the last page.
 */
export function parseWorkitemQueryPage(output: unknown, label = "twg query"): { issues: JiraIssueRecord[]; nextCursor?: string } {
  const envelope = record(output, `${label} output`);
  const data = record(envelope.data, `${label} data`);
  if (!Array.isArray(data.issues)) throw new Error(`${label} has no data.issues array`);
  const issues = data.issues.map((value, index) => parseJiraIssue(value, `${label} issue ${index + 1}`));
  if (envelope.pageInfo === undefined || envelope.pageInfo === null) return { issues };
  const pageInfo = record(envelope.pageInfo, `${label} pageInfo`);
  if (pageInfo.hasNextPage !== true) {
    if (pageInfo.hasNextPage !== false) throw new Error(`${label} pageInfo.hasNextPage must be true or false`);
    return { issues };
  }
  return { issues, nextCursor: nonEmptyString(pageInfo.nextCursor, `${label} pageInfo.nextCursor`) };
}

/** Parses one `workitem get` response. `twg` returns `data` as an array, even for one key. */
export function parseWorkitemGet(output: unknown, requestedKey: string): JiraIssueRecord {
  const label = `twg get ${requestedKey}`;
  const envelope = record(output, `${label} output`);
  if (!Array.isArray(envelope.data)) throw new Error(`${label} data must be an array of issues`);
  if (envelope.data.length !== 1) throw new Error(`${label} returned ${envelope.data.length} issues; expected 1`);
  const issue = parseJiraIssue(envelope.data[0], label);
  if (issue.key !== requestedKey) throw new Error(`${label} returned ${issue.key} instead`);
  return issue;
}

/** Parses one issue. Fields sit directly on the issue, with no `fields` wrapper. */
export function parseJiraIssue(value: unknown, label: string): JiraIssueRecord {
  const issue = record(value, label);
  const key = nonEmptyString(issue.key, `${label} key`);
  const at = `${label} (${key})`;
  if ("fields" in issue) throw new Error(`${at} has a fields wrapper; expected flattened twg fields`);
  const status = record(issue.status, `${at} status`);
  const parent = issue.parent === undefined || issue.parent === null ? undefined : record(issue.parent, `${at} parent`);
  if (!Array.isArray(issue.issuelinks)) throw new Error(`${at} has no issuelinks array; pass --fields ${JIRA_ISSUE_FIELDS}`);
  return {
    key,
    title: nonEmptyString(issue.summary, `${at} summary`),
    type: nonEmptyString(record(issue.issuetype, `${at} issuetype`).name, `${at} issuetype.name`),
    statusName: nonEmptyString(status.name, `${at} status.name`),
    statusCategory: nonEmptyString(record(status.statusCategory, `${at} status.statusCategory`).key, `${at} status.statusCategory.key`),
    ...(parent ? { parentKey: nonEmptyString(parent.key, `${at} parent.key`) } : {}),
    blockerKeys: blockerKeys(issue.issuelinks, at),
    description: descriptionText(issue.description, at),
    descriptionMarkdown: adfToMarkdown(issue.description, `${at} description`),
    ...(issue.updated === undefined || issue.updated === null ? {} : { updated: nonEmptyString(issue.updated, `${at} updated`) }),
  };
}

/**
 * Returns the keys of issues that block this one. Each link has one endpoint only.
 * A link of type "is blocked by" with `inwardIssue` names a blocker. With `outwardIssue`, this issue blocks the other one.
 */
function blockerKeys(links: unknown[], at: string): string[] {
  const keys: string[] = [];
  for (const [index, value] of links.entries()) {
    const linkLabel = `${at} issuelinks[${index}]`;
    const link = record(value, linkLabel);
    const inward = nonEmptyString(record(link.type, `${linkLabel}.type`).inward, `${linkLabel}.type.inward`);
    const hasInward = link.inwardIssue !== undefined && link.inwardIssue !== null;
    const hasOutward = link.outwardIssue !== undefined && link.outwardIssue !== null;
    if (hasInward === hasOutward) throw new Error(`${linkLabel} must have exactly one of inwardIssue or outwardIssue`);
    if (inward.toLowerCase() !== "is blocked by" || !hasInward) continue;
    keys.push(nonEmptyString(record(link.inwardIssue, `${linkLabel}.inwardIssue`).key, `${linkLabel}.inwardIssue.key`));
  }
  return keys;
}

function descriptionText(value: unknown, at: string): string {
  if (value === undefined || value === null) return "";
  const document = record(value, `${at} description`);
  if (document.type !== "doc") throw new Error(`${at} description must be an Atlassian Document Format doc`);
  return adfText(document).trim();
}

// Joins text nodes. Block nodes end with a line break, so paragraphs and list items stay on their own lines.
function adfText(node: Record<string, unknown>): string {
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  if (node.type === "hardBreak") return "\n";
  const children = Array.isArray(node.content) ? node.content : [];
  const text = children.map((child) => adfText(record(child, "description node"))).join("");
  const isBlock = ["paragraph", "heading", "codeBlock", "blockquote", "listItem", "rule"].includes(String(node.type));
  return isBlock ? `${text.trimEnd()}\n` : text;
}

/** Runs the real `twg` CLI in agent mode and reads its JSON output file. */
export const runTwgCli: RunTwg = async (args) => {
  const directory = await mkdtemp(join(tmpdir(), "twg-jira-"));
  try {
    const outputPath = join(directory, "output.json");
    run("twg", ["--mode", "agent", "--output", "json", ...args, "--output-file", outputPath]);
    return parseJson(await readFile(outputPath, "utf8"), `twg ${args.slice(0, 3).join(" ")}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};
