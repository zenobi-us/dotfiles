#!/usr/bin/env -S mise exec -- bun run --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { buildDependencyForest, nonEmptyString, parseJson, record, renderDependencyGraph, run, type Ticket } from "./dep-tree-shared.ts";
import { markdownGraph } from "./dep-tree-markdown.ts";
import { getJiraIssue, queryJiraIssues, runTwgCli, type JiraIssueRecord } from "./twg-jira.ts";

const cli = new Crust("dep-tree-cli")
  .meta({ description: "Print typed ticket DAGs from Jira, GitHub, or Markdown." })
  .use(helpPlugin())
  .command("markdown", (cmd) => cmd
    .meta({ description: "Build a DAG from configured Markdown stores for a repository." })
    .flags({ ticket: { type: "string" }, initiative: { type: "string" } })
    .args([{ name: "repository-root", type: "string", required: true }] as const)
    .run(async ({ args, flags }) => runGraph(() => markdownGraph(args["repository-root"], flags.ticket, flags.initiative))))
  .command("jira", (cmd) => cmd
    .meta({ description: "Build a DAG from a Jira ticket or epic." })
    .flags({ ticket: { type: "string" }, epic: { type: "string" } })
    .run(async ({ flags }) => runGraph(() => jiraGraph(flags.ticket, flags.epic))))
  .command("github", (cmd) => cmd
    .meta({ description: "Build a DAG from a GitHub ticket or spec/map issue." })
    .flags({ ticket: { type: "string" }, spec: { type: "string" } })
    .args([{ name: "repository", type: "string", required: true }] as const)
    .run(async ({ args, flags }) => runGraph(() => githubGraph(args.repository, flags.ticket, flags.spec))));

await cli.execute();

async function runGraph(build: () => Promise<string>): Promise<void> {
  try {
    console.log(await build());
  } catch (error) {
    console.error(`dependency graph: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

async function jiraGraph(ticketKey: string | undefined, epicKey: string | undefined): Promise<string> {
  if (Boolean(ticketKey) === Boolean(epicKey)) throw new Error("Pass exactly one of --ticket or --epic.");
  const selectedEpic = epicKey ?? await discoverJiraEpic(ticketKey ?? "");
  const epic = await jiraIssue(selectedEpic);
  if (epic.type.toLowerCase() !== "epic") throw new Error(`${selectedEpic} is ${epic.type}, not an Epic.`);
  const roots = await jiraEpicChildren(selectedEpic);
  if (roots.length === 0) throw new Error(`Epic ${selectedEpic} has no child tickets.`);
  const graph = await buildDependencyForest(roots, jiraLoadTicket);
  return renderDependencyGraph(graph);
}

async function jiraLoadTicket(key: string): Promise<{ ticket: Ticket; blockedBy: string[] }> {
  const issue = await jiraIssue(key);
  return { ticket: { id: issue.key, title: issue.title, type: issue.type, status: issue.statusName }, blockedBy: issue.blockerKeys };
}

async function discoverJiraEpic(ticketKey: string | undefined): Promise<string> {
  if (!ticketKey || !/^[A-Z][A-Z0-9_]+-\d+$/i.test(ticketKey)) throw new Error("Pass a valid Jira key with --ticket.");
  const issue = await jiraIssue(ticketKey);
  if (!issue.parentKey) throw new Error(`Jira ticket ${ticketKey} has no parent Epic. Pass --epic directly.`);
  const parent = await jiraIssue(issue.parentKey);
  if (parent.type.toLowerCase() !== "epic") throw new Error(`Jira ticket ${ticketKey} parent ${parent.key} is ${parent.type}, not an Epic.`);
  return parent.key;
}

async function jiraIssue(key: string): Promise<JiraIssueRecord> {
  if (!/^[A-Z][A-Z0-9_]+-\d+$/i.test(key)) throw new Error(`Invalid Jira key: ${key}`);
  return getJiraIssue(key, runTwgCli);
}

async function jiraEpicChildren(epicKey: string): Promise<string[]> {
  const children = await queryJiraIssues(`parent = ${epicKey}`, runTwgCli);
  return children.map((child) => child.key);
}

async function githubGraph(repository: string, ticketNumber: string | undefined, specNumber: string | undefined): Promise<string> {
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) throw new Error("GitHub repository must use OWNER/REPO format.");
  if (Boolean(ticketNumber) === Boolean(specNumber)) throw new Error("Pass exactly one of --ticket or --spec.");
  const selectedSpec = specNumber ?? await discoverGitHubSpec(repository, ticketNumber ?? "");
  const spec = await githubIssue(repository, selectedSpec);
  if (!spec.isSpec) throw new Error(`GitHub issue #${selectedSpec} is not marked as a wayfinder:map spec.`);
  if (spec.subIssues.length === 0) throw new Error(`GitHub spec #${selectedSpec} has no sub-issues.`);
  const graph = await buildDependencyForest(spec.subIssues, async (number) => {
    const issue = await githubIssue(repository, number);
    return { ticket: { id: issue.number, title: issue.title, type: issue.type, status: issue.status }, blockedBy: issue.blockedBy };
  });
  return renderDependencyGraph(graph);
}

async function discoverGitHubSpec(repository: string, ticketNumber: string): Promise<string> {
  if (!/^\d+$/.test(ticketNumber)) throw new Error("Pass a numeric GitHub issue ID with --ticket.");
  let issue = await githubIssue(repository, ticketNumber);
  const visited = new Set<string>();
  while (true) {
    if (issue.isSpec) return issue.number;
    if (visited.has(issue.number)) throw new Error(`GitHub parent cycle at issue #${issue.number}`);
    visited.add(issue.number);
    if (!issue.parentNumber) throw new Error(`GitHub ticket #${ticketNumber} has no parent spec/map. Pass --spec directly.`);
    issue = await githubIssue(repository, issue.parentNumber);
  }
}

async function githubIssue(repository: string, number: string): Promise<{
  number: string; title: string; type: string; status: string; blockedBy: string[]; parentNumber?: string; subIssues: string[]; isSpec: boolean;
}> {
  if (!/^\d+$/.test(number)) throw new Error(`Invalid GitHub issue number: ${number}`);
  const result = parseJson(run("gh", ["issue", "view", number, "--repo", repository, "--json", "number,title,body,state,labels,issueType,parent,subIssues,blockedBy"]), "gh");
  const issue = record(result, `GitHub issue #${number}`);
  const actualNumber = nonEmptyString(String(issue.number ?? ""), `GitHub issue #${number} number`);
  if (actualNumber !== number) throw new Error(`gh returned issue #${actualNumber} when #${number} was requested`);
  const title = nonEmptyString(issue.title, `GitHub issue #${number} title`);
  const status = nonEmptyString(issue.state, `GitHub issue #${number} state`);
  const labels = Array.isArray(issue.labels) ? issue.labels.map((value) => nonEmptyString(record(value, `GitHub issue #${number} label`).name, `GitHub issue #${number} label name`)) : [];
  const issueType = issue.issueType && typeof issue.issueType === "object" && !Array.isArray(issue.issueType)
    ? (issue.issueType as Record<string, unknown>).name
    : undefined;
  const wayfinderType = labels.find((label) => label.startsWith("wayfinder:"))?.slice("wayfinder:".length);
  const type = typeof issueType === "string" && issueType.trim() ? issueType.trim() : wayfinderType ?? "issue";
  const parent = issue.parent && typeof issue.parent === "object" && !Array.isArray(issue.parent) ? issue.parent as Record<string, unknown> : undefined;
  const parentNumber = parent?.number === undefined ? undefined : nonEmptyString(String(parent.number), `GitHub issue #${number} parent number`);
  const subIssues = Array.isArray(issue.subIssues) ? issue.subIssues.map((value) => nonEmptyString(String(record(value, `GitHub issue #${number} sub-issue`).number ?? ""), `GitHub issue #${number} sub-issue number`)) : [];
  const blockedBy = Array.isArray(issue.blockedBy) ? issue.blockedBy.map((value) => nonEmptyString(String(record(value, `GitHub issue #${number} blocker`).number ?? ""), `GitHub issue #${number} blocker number`)) : [];
  const body = typeof issue.body === "string" ? issue.body : "";
  const bodyParent = body.match(/^Part of #([0-9]+)/m)?.[1];
  const isSpec = labels.includes("wayfinder:map") || type.toLowerCase() === "spec";
  return { number: actualNumber, title, type: isSpec ? "map" : type, status, blockedBy, ...(parentNumber ?? bodyParent ? { parentNumber: parentNumber ?? bodyParent } : {}), subIssues, isSpec };
}

