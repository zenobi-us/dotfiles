#!/usr/bin/env -S mise exec -- bun run --install=fallback

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { buildDependencyForest, nonEmptyString, parseJson, record, renderDependencyGraph, run, type JsonValue, type Ticket } from "./dep-tree-shared.ts";
import { markdownGraph } from "./dep-tree-markdown.ts";

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
  return { ticket: { id: issue.key, title: issue.title, type: issue.type, status: issue.status }, blockedBy: issue.blockedBy };
}

async function discoverJiraEpic(ticketKey: string | undefined): Promise<string> {
  if (!ticketKey || !/^[A-Z][A-Z0-9_]+-\d+$/i.test(ticketKey)) throw new Error("Pass a valid Jira key with --ticket.");
  const issue = await jiraIssue(ticketKey);
  if (!issue.parentKey) throw new Error(`Jira ticket ${ticketKey} has no parent Epic. Pass --epic directly.`);
  const parent = await jiraIssue(issue.parentKey);
  if (parent.type.toLowerCase() !== "epic") throw new Error(`Jira ticket ${ticketKey} parent ${parent.key} is ${parent.type}, not an Epic.`);
  return parent.key;
}

async function jiraIssue(key: string): Promise<{ key: string; title: string; type: string; status: string; parentKey?: string; blockedBy: string[] }> {
  if (!/^[A-Z][A-Z0-9_]+-\d+$/i.test(key)) throw new Error(`Invalid Jira key: ${key}`);
  const envelope = record(await jiraGet(key), `TWG workitem ${key} output`);
  const data = record(envelope.data, `TWG workitem ${key} data`);
  const issue = record(data.issue ?? data, `Jira workitem ${key}`);
  const actualKey = nonEmptyString(issue.key, `Jira workitem ${key} key`);
  if (actualKey !== key) throw new Error(`TWG returned ${actualKey} when ${key} was requested`);
  const fields = record(issue.fields, `Jira workitem ${key} fields`);
  const title = nonEmptyString(fields.summary, `Jira workitem ${key} summary`);
  const status = nonEmptyString(record(fields.status, `Jira workitem ${key} status`).name, `Jira workitem ${key} status name`);
  const issueType = record(fields.issuetype, `Jira workitem ${key} issue type`);
  const type = nonEmptyString(issueType.name, `Jira workitem ${key} issue type name`);
  const parentValue = fields.parent;
  let parentKey: string | undefined;
  if (parentValue !== undefined && parentValue !== null) {
    parentKey = nonEmptyString(record(parentValue, `Jira workitem ${key} parent`).key, `Jira workitem ${key} parent key`);
  }
  if (!Array.isArray(fields.issuelinks)) throw new Error(`Jira workitem ${key} has no fields.issuelinks array`);
  const blockedBy: string[] = [];
  for (const value of fields.issuelinks) {
    const link = record(value, `Jira workitem ${key} issue link`);
    const linkType = record(link.type, `Jira workitem ${key} issue link type`);
    if (nonEmptyString(linkType.inward, "Jira inward link description").toLowerCase() !== "is blocked by" ||
        nonEmptyString(linkType.outward, "Jira outward link description").toLowerCase() !== "blocks") continue;
    const endpoint = link.inwardIssue ?? link.outwardIssue;
    if (endpoint === undefined) throw new Error(`Jira workitem ${key} blocker link has no endpoint`);
    blockedBy.push(nonEmptyString(record(endpoint, `Jira workitem ${key} blocker endpoint`).key, `Jira workitem ${key} blocker key`));
  }
  return { key: actualKey, title, type, status, ...(parentKey ? { parentKey } : {}), blockedBy };
}

async function jiraEpicChildren(epicKey: string): Promise<string[]> {
  const directory = await mkdtemp(join(tmpdir(), "dep-tree-jira-query-"));
  try {
    const outputPath = join(directory, "query.json");
    run("twg", ["--mode", "agent", "--output", "json", "jira", "workitem", "query", "--jql", `parent = ${epicKey}`, "--output-file", outputPath]);
    const envelope = record(parseJson(await readFile(outputPath, "utf8"), "TWG Jira epic query"), "TWG Jira epic query");
    const data = record(envelope.data, "TWG Jira epic query data");
    const payload = record(data.data, "TWG Jira epic query payload");
    if (!Array.isArray(payload.issues)) throw new Error("TWG Jira epic query did not return data.issues");
    return payload.issues.map((value) => nonEmptyString(record(value, "Jira epic child").key, "Jira epic child key"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function jiraGet(key: string): Promise<JsonValue> {
  const root = await mkdtemp(join(tmpdir(), "dep-tree-jira-"));
  try {
    const outputPath = join(root, "issue.json");
    run("twg", ["--mode", "agent", "--output", "json", "jira", "workitem", "get", key,
      "--fields", "summary,status,issuetype,parent,issuelinks", "--output-file", outputPath]);
    const text = await readFile(outputPath, "utf8");
    return parseJson(text, `TWG workitem ${key}`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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

