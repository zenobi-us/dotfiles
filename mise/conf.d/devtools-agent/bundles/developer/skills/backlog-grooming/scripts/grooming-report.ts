#!/usr/bin/env -S mise exec -- bun run --install=fallback
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { loadContracts } from "../../../../agent-core/skills/skill-contracts/scripts/contracts.ts";
import { bulkUpgrade } from "../../../../agent-core/skills/skill-contracts/scripts/upgrades.ts";
import { readActions } from "./report-owner.ts";
import { parseReport, VERDICTS, type Report } from "./reports.ts";

interface Loaded {
  reports: Report[];
  errors: string[];
}

const SKILL_ROOT = join(import.meta.dir, "..");

function loadReports(runDir: string): Loaded {
  const reportsDir = join(runDir, "reports");
  if (!existsSync(reportsDir)) return { reports: [], errors: [`no reports directory at ${reportsDir}`] };
  const errors: string[] = [];
  const files = readdirSync(reportsDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => join(reportsDir, name));
  const reports = files.flatMap((file) => parseReport(file, errors) ?? []);

  const ticketsFile = join(runDir, "tickets.txt");
  if (existsSync(ticketsFile)) {
    const expected = readFileSync(ticketsFile, "utf8").split("\n").map((line) => line.trim()).filter(Boolean);
    const found = new Set(files.map((file) => basename(file, ".md")));
    for (const key of expected) if (!found.has(key)) errors.push(`${key}: report file reports/${key}.md is missing`);
  }
  if (files.length === 0) errors.push(`no report files in ${reportsDir}`);
  return { reports, errors };
}

function summaryLine(report: Report): string {
  const key = `[${report.ticket}]`;
  switch (report.verdict) {
    case "groomed":
      return `${key}: groomed ${report.storyPoints}`;
    case "clarify":
      return `${key}: questions - ${report.questionCount}`;
    case "cancel":
      return `${key}: cancel - ${report.comment}`;
    case "action":
      return `${key}: ${report.action} - ${report.comment}`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function anchor(ticket: string): string {
  return `ticket-${ticket.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

function renderHtml(title: string, reports: Report[]): string {
  const counts = VERDICTS.map((verdict) => `${reports.filter((r) => r.verdict === verdict).length} ${verdict}`).join(" · ");
  const summary = reports
    .map(
      (r) =>
        `<li class="v-${r.verdict}"><a href="#${anchor(r.ticket)}">${escapeHtml(summaryLine(r))}</a> <span class="muted">${escapeHtml(r.title)}</span></li>`,
    )
    .join("\n");
  const sections = reports
    .map((r) => {
      const heading = r.url
        ? `<a href="${escapeHtml(r.url)}">${escapeHtml(r.ticket)}</a>`
        : escapeHtml(r.ticket);
      return `<section id="${anchor(r.ticket)}" class="report v-${r.verdict}">
<header><h2>${heading} <span class="badge">${escapeHtml(r.verdict)}</span></h2><p>${escapeHtml(r.title)}</p></header>
${Bun.markdown.html(r.body.replace(/^## /gm, "### "), { noHtmlBlocks: true, noHtmlSpans: true, autolinks: true })}
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root { --bg:#fbfbfa; --fg:#1c1c1a; --muted:#6b6b66; --line:#e3e3df; --card:#ffffff;
  --groomed:#1f7a3f; --clarify:#9a6400; --cancel:#a1302b; --action:#2a5db0; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#141413; --fg:#ecece8; --muted:#9d9d97;
  --line:#2c2c2a; --card:#1b1b1a; --groomed:#5cc98a; --clarify:#e0a84a; --cancel:#ef7a72; --action:#7ea6ec; } }
:root[data-theme="dark"] { --bg:#141413; --fg:#ecece8; --muted:#9d9d97; --line:#2c2c2a; --card:#1b1b1a;
  --groomed:#5cc98a; --clarify:#e0a84a; --cancel:#ef7a72; --action:#7ea6ec; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.55 system-ui, sans-serif; }
main { max-width: 920px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 1.6rem; margin: 0 0 4px; }
.muted { color: var(--muted); }
.tldr { list-style: none; padding: 0; margin: 16px 0 32px; border-top: 1px solid var(--line); }
.tldr li { padding: 8px 0 8px 12px; border-bottom: 1px solid var(--line); border-left: 3px solid var(--accent); }
.tldr a { color: inherit; font-family: ui-monospace, monospace; text-decoration: none; }
.v-groomed { --accent: var(--groomed); } .v-clarify { --accent: var(--clarify); }
.v-cancel { --accent: var(--cancel); } .v-action { --accent: var(--action); }
.report { background: var(--card); border: 1px solid var(--line); border-top: 3px solid var(--accent);
  border-radius: 6px; padding: 4px 20px 16px; margin: 0 0 24px; overflow-wrap: anywhere; }
.report h2 { font-size: 1.2rem; margin-bottom: 0; } .report h2 a { color: inherit; }
.report header p { margin: 4px 0 0; color: var(--muted); }
.badge { font-size: .75rem; font-weight: 600; color: var(--accent); border: 1px solid var(--accent);
  border-radius: 999px; padding: 1px 8px; vertical-align: middle; }
table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; font-size: .9rem; }
th, td { border: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
code { font-family: ui-monospace, monospace; font-size: .9em; }
a { color: var(--action); }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
<p class="muted">${reports.length} tickets · ${counts}</p>
<h2>TL;DR</h2>
<ul class="tldr">
${summary}
</ul>
${sections}
</main>
</body>
</html>
`;
}

function failOn(errors: string[]): void {
  if (errors.length === 0) return;
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

const checkCmd = new Crust("check")
  .meta({ description: "Check every report in <run-dir>/reports against the report contract" })
  .args([{ name: "runDir", type: "string", required: true, description: "grooming run directory" }])
  .run(async ({ args }) => {
    await loadContracts(SKILL_ROOT);
    const { reports, errors } = loadReports(args.runDir);
    failOn(errors);
    console.log(`ok: ${reports.length} reports pass the contract`);
  });

const renderCmd = new Crust("render")
  .meta({ description: "Write index.html, summary.md and actions.json from the reports" })
  .args([{ name: "runDir", type: "string", required: true, description: "grooming run directory" }])
  .flags({ title: { type: "string", description: "report title", default: "Backlog grooming" } })
  .run(async ({ args, flags }) => {
    await loadContracts(SKILL_ROOT);
    const { reports, errors } = loadReports(args.runDir);
    failOn(errors);
    const summary = reports.map((r) => `- ${summaryLine(r)}`).join("\n");
    const actions = reports
      .filter((r) => r.proposedActions.length > 0)
      .map((r) => ({ ticket: r.ticket, title: r.title, verdict: r.verdict, proposed_actions: r.proposedActions }));
    const actionContent = `${JSON.stringify({ schemaVersion: "grooming-actions/v2", tickets: actions }, null, 2)}\n`;
    readActions(actionContent);
    writeFileSync(join(args.runDir, "index.html"), renderHtml(flags.title, reports));
    writeFileSync(join(args.runDir, "summary.md"), `${summary}\n`);
    writeFileSync(join(args.runDir, "actions.json"), actionContent);
    console.log(summary);
    console.log(`\nwrote index.html, summary.md and actions.json (${actions.length} tickets with actions)`);
  });

const actionsCmd = new Crust("check-actions")
  .meta({ description: "Validate and read current or historical proposed action records without applying them" })
  .args([{ name: "file", type: "string", required: true }])
  .run(async ({ args }) => {
    await loadContracts(SKILL_ROOT);
    console.log(JSON.stringify(readActions(readFileSync(args.file, "utf8")), null, 2));
  });

const upgradeCmd = new Crust("upgrade")
  .meta({ description: "Explicitly upgrade selected mutable reports or actions; input is a JSON path list" })
  .args([{ name: "list", type: "string", required: true }])
  .run(async ({ args }) => {
    const result = await bulkUpgrade({
      skill: SKILL_ROOT, owner: "file:scripts/report-owner.ts",
    }, JSON.parse(readFileSync(args.list, "utf8")));
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== "completed") process.exitCode = 1;
  });

await new Crust("grooming-report")
  .meta({ description: "Check, render, read actions, or explicitly upgrade grooming artifacts" })
  .use(helpPlugin())
  .command(checkCmd)
  .command(renderCmd)
  .command(actionsCmd)
  .command(upgradeCmd)
  .execute();
