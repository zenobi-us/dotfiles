/**
 * plan.ts + evidence.jsonl -> the `writing-reports` page.
 *
 * The steps appear twice in the report on purpose: the whole plan under
 * `#steps`, and each test's own steps again inside its outcome section. Both
 * are rendered from the same Plan, so they cannot disagree with each other or
 * with the run.
 *
 * Presentation belongs to `writing-reports`. This module only fills its
 * template, and never invents a class or a colour.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Evidence, Plan, Test, Verdict } from "./plan.ts";
import { stepText } from "./plan.ts";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * `stepText` returns markdown, because the same string also feeds test-plan.md.
 * In HTML a backtick pair becomes the template's own code class. Run this
 * after `esc`, which leaves backticks alone.
 */
const mdCode = (s: string) => s.replace(/`([^`]+)`/g, '<code class="code">$1</code>');

const BADGE: Record<Verdict, [string, string]> = {
  PASS: ["badge--pass", "Pass"],
  FAIL: ["badge--fail", "Fail"],
  PARTIAL: ["badge--info", "Partial"],
  BLOCKED: ["badge--info", "Blocked"],
  WARN: ["badge--warn", "Warn"],
};

/** PNG dimensions from the IHDR header. The validator checks these against the file. */
export async function pngSize(file: string): Promise<{ width: number; height: number } | null> {
  try {
    const b = new DataView((await readFile(file)).buffer as ArrayBuffer);
    if (b.getUint32(0) !== 0x89504e47) return null;
    return { width: b.getUint32(16), height: b.getUint32(20) };
  } catch {
    return null;
  }
}

function verdictOf(records: Evidence[], testId: string): Verdict {
  const mine = records.filter((r) => r.test === testId && r.verdict);
  if (mine.some((r) => r.verdict === "FAIL")) return "FAIL";
  if (mine.some((r) => r.verdict === "BLOCKED")) return "BLOCKED";
  if (mine.some((r) => r.verdict === "PARTIAL")) return "PARTIAL";
  return (mine[mine.length - 1]?.verdict as Verdict) ?? "PARTIAL";
}

function stepList(t: Test, plan: Plan): string {
  return (
    `<ol class="report__list">\n` +
    t.steps
      .map((s) => `  <li class="report__item">${mdCode(esc(stepText(s, plan.base)))}</li>`)
      .join("\n") +
    `\n</ol>`
  );
}

/** Section 6: the whole plan, before the reader meets a single verdict. */
function stepsSection(plan: Plan, records: Evidence[]): string {
  const env = plan.environment ?? {};
  const pre = (plan.preconditions ?? []).map((p) => {
    const rec = records.find((r) => r.note.includes(p.desc));
    const state = rec ? ` &mdash; ${esc(rec.note)}` : " &mdash; checked before the tests that need it.";
    return `  <li class="report__item"><code class="code">${esc(p.id)}</code> ${esc(p.desc)}.${state}</li>`;
  });

  return [
    `<h2 class="report__section" id="steps">Manual test steps</h2>`,
    ``,
    `<p class="report__text">Every step below was run in a real browser from <code class="code">plan.ts</code>. The outcomes follow, each one repeating its own steps.</p>`,
    ``,
    `<h3 class="report__subsection" id="steps-env">Environment</h3>`,
    ``,
    `<ul class="report__list">`,
    `  <li class="report__item">URL <code class="code">${esc(plan.base)}</code></li>`,
    `  <li class="report__item">Driver <code class="code">${esc(plan.driver)}</code></li>`,
    env.account ? `  <li class="report__item">Account ${esc(env.account)}</li>` : "",
    env.branch ? `  <li class="report__item">Branch <code class="code">${esc(env.branch)}</code></li>` : "",
    env.notes ? `  <li class="report__item">${esc(env.notes)}</li>` : "",
    `</ul>`,
    ``,
    `<h3 class="report__subsection" id="steps-pre">Preconditions</h3>`,
    ``,
    pre.length ? `<ul class="report__list">\n${pre.join("\n")}\n</ul>` : `<p class="report__text">None declared.</p>`,
    ``,
    ...plan.tests.flatMap((t) => [
      `<h3 class="report__subsection" id="steps-${t.id}">Test ${t.id} &mdash; ${esc(t.claim)}</h3>`,
      ``,
      stepList(t, plan),
      ``,
    ]),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** Section 7: one outcome section per test, opening with that test's steps. */
async function testSection(
  t: Test,
  plan: Plan,
  records: Evidence[],
  reportDir: string,
): Promise<string> {
  const v = verdictOf(records, t.id);
  const [cls, label] = BADGE[v];
  const mine = records.filter((r) => r.test === t.id);

  const figures: string[] = [];
  const seen = new Set<string>();
  for (const r of mine) {
    if (!r.screenshot || seen.has(r.screenshot)) continue;
    seen.add(r.screenshot);
    const file = join(reportDir, r.screenshot);
    if (!existsSync(file)) continue;
    const size = await pngSize(file);
    if (!size) continue;
    const caption = r.observed || stepText(t.steps[0]!, plan.base);
    figures.push(
      [
        `<figure class="figure">`,
        `  <img class="figure__image" src="${esc(r.screenshot)}" alt="Step ${esc(r.step)} of test ${esc(t.id)}" width="${size.width}" height="${size.height}">`,
        `  <figcaption class="figure__caption"><strong class="figure__label">Step ${esc(r.step)}.</strong> ${esc(caption)}</figcaption>`,
        `</figure>`,
      ].join("\n"),
    );
  }

  const notes = mine.filter((r) => r.note && r.verdict);
  const noteBlock = notes.length
    ? [
        `<div class="note">`,
        ...notes.map(
          (r) =>
            `  <p class="note__text"><strong class="note__label">${esc(r.verdict)} at step ${esc(r.step)}.</strong> ${esc(r.note)}</p>`,
        ),
        `</div>`,
      ].join("\n")
    : "";

  const failed = mine.find((r) => r.verdict === "FAIL");
  const failBlock = failed
    ? `<pre class="code-block"><code class="code-block__text">${esc(failed.observed)}</code></pre>`
    : "";

  return [
    `<h2 class="report__section" id="check${t.id}">Test ${t.id} &mdash; ${esc(t.claim)} <span class="badge ${cls}">${label}</span></h2>`,
    ``,
    `<div class="card">`,
    `  <h3 class="card__title">Steps run</h3>`,
    stepList(t, plan)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n"),
    `  <p class="card__meta">PASS: ${esc(t.pass)}. FAIL: ${esc(t.fail)}.</p>`,
    `</div>`,
    ``,
    failBlock,
    figures.join("\n"),
    noteBlock,
    ``,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function summary(plan: Plan, records: Evidence[]): string {
  const rows = plan.tests.map((t) => {
    const [cls, label] = BADGE[verdictOf(records, t.id)];
    const href = `#check${t.id}`;
    return [
      `    <tr class="summary__row">`,
      `      <td class="summary__cell"><a class="summary__link" href="${href}">${esc(t.id)}</a></td>`,
      `      <td class="summary__cell"><a class="summary__link" href="${href}">${esc(t.claim)}</a></td>`,
      `      <td class="summary__cell"><a class="summary__link" href="${href}"><span class="badge ${cls}">${label}</span></a></td>`,
      `    </tr>`,
    ].join("\n");
  });

  const counts = plan.tests.reduce<Record<string, number>>((a, t) => {
    const v = verdictOf(records, t.id);
    a[v] = (a[v] ?? 0) + 1;
    return a;
  }, {});
  const line = Object.entries(counts)
    .map(([v, n]) => `${n} ${v.toLowerCase()}`)
    .join(", ");

  return [
    `<div class="card">`,
    `  <h3 class="card__title">Result summary</h3>`,
    `  <div class="summary"><table class="summary__grid">`,
    `    <tr class="summary__row">`,
    `      <th class="summary__head">#</th>`,
    `      <th class="summary__head">Check</th>`,
    `      <th class="summary__head">Result</th>`,
    `    </tr>`,
    rows.join("\n"),
    `  </table></div>`,
    `  <p class="card__meta">${esc(line)}. Every verdict below was decided by the runner, not by hand.</p>`,
    `</div>`,
  ].join("\n");
}

function notCovered(plan: Plan, records: Evidence[]): string {
  const gaps = plan.tests
    .map((t) => [t, verdictOf(records, t.id)] as const)
    .filter(([, v]) => v === "BLOCKED" || v === "PARTIAL");

  const rows = gaps.length
    ? gaps.map(([t, v]) => {
        const note = records.find((r) => r.test === t.id && r.note)?.note ?? "";
        return [
          `  <tr class="table__row">`,
          `    <td class="table__cell"><strong>${esc(t.id)}.</strong> ${esc(t.claim)}</td>`,
          `    <td class="table__cell">${esc(v)}. ${esc(note)}</td>`,
          `  </tr>`,
        ].join("\n");
      })
    : [
        `  <tr class="table__row">`,
        `    <td class="table__cell">None</td>`,
        `    <td class="table__cell">Every test in the plan ran to a verdict.</td>`,
        `  </tr>`,
      ];

  return [
    `<h2 class="report__section" id="notdone">Not covered</h2>`,
    ``,
    `<p class="report__text">Each row is a test the run could not finish, and the risk that leaves.</p>`,
    ``,
    `<div class="table"><table class="table__grid">`,
    `  <tr class="table__row">`,
    `    <th class="table__head">Check</th>`,
    `    <th class="table__head">Why</th>`,
    `  </tr>`,
    rows.join("\n"),
    `</table></div>`,
  ].join("\n");
}

function relatedFiles(plan: Plan, files: string[]): string {
  const what: Record<string, string> = {
    "plan.ts": "The typed plan every other artifact is generated from",
    "test-plan.md": "The steps, written before the browser opened",
    "evidence.jsonl": "One record per step, written by the run",
  };
  const rows = files.map((f) => {
    const desc = what[f] ?? `Driver script for ${f.replace(`${plan.workId}-`, "").replace(/\.\w+$/, "")}, re-runnable`;
    return [
      `  <tr class="table__row">`,
      `    <td class="table__cell"><a class="link" href="files/${esc(f)}">${esc(f)}</a></td>`,
      `    <td class="table__cell">${esc(desc)}</td>`,
      `  </tr>`,
    ].join("\n");
  });

  return [
    `<h2 class="report__section" id="files">Related files</h2>`,
    ``,
    `<p class="report__text">A copy of each one travels inside this report, so the links keep working wherever it is moved.</p>`,
    ``,
    `<div class="table"><table class="table__grid">`,
    `  <tr class="table__row">`,
    `    <th class="table__head">File</th>`,
    `    <th class="table__head">What it is</th>`,
    `  </tr>`,
    rows.join("\n"),
    `</table></div>`,
  ].join("\n");
}

export async function buildReport(
  plan: Plan,
  records: Evidence[],
  reportDir: string,
  files: string[],
  date: string,
): Promise<string> {
  const title = `${plan.workId} &mdash; acceptance evidence`;
  const sections = await Promise.all(plan.tests.map((t) => testSection(t, plan, records, reportDir)));

  return [
    `<!doctype html>`,
    `<html lang="en">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${title}</title>`,
    `<link rel="stylesheet" href="assets/theme/v1/tokens.css">`,
    `<link rel="stylesheet" href="assets/theme/v1/base.css">`,
    `<link rel="stylesheet" href="assets/report/v1/report.css">`,
    `<script src="assets/lightbox/v1/lightbox.js"`,
    `        data-figures=".figure"`,
    `        data-caption=".figure__caption"`,
    `        data-hint="Click image to zoom &middot; Esc to close"`,
    `        data-label="Screenshot viewer"`,
    `        defer></script>`,
    `</head>`,
    `<body>`,
    ``,
    `<div class="report">`,
    ``,
    `<h1 class="report__title">${title}</h1>`,
    `<p class="report__subtitle">`,
    `  What this proves: ${esc(plan.tests.map((t) => t.claim).join("; "))}.<br>`,
    plan.environment?.branch
      ? `  Branch <code class="code">${esc(plan.environment.branch)}</code> &middot; ${esc(date)} &middot; driven with <code class="code">${esc(plan.driver)}</code>`
      : `  ${esc(date)} &middot; driven with <code class="code">${esc(plan.driver)}</code>`,
    `</p>`,
    ``,
    summary(plan, records),
    ``,
    stepsSection(plan, records),
    ``,
    sections.join("\n"),
    notCovered(plan, records),
    ``,
    `<h2 class="report__section" id="cleanup">Test data left behind</h2>`,
    ``,
    `<div class="table"><table class="table__grid">`,
    `  <tr class="table__row">`,
    `    <th class="table__head">Item</th>`,
    `    <th class="table__head">State</th>`,
    `    <th class="table__head">Action</th>`,
    `  </tr>`,
    `  <tr class="table__row">`,
    `    <td class="table__cell">Driver session <code class="code">${esc(plan.workId)}</code></td>`,
    `    <td class="table__cell">In-memory profile, closed at the end of the run</td>`,
    `    <td class="table__cell"><strong>Nothing to undo.</strong> Confirm with <code class="code">playwright-cli list</code>.</td>`,
    `  </tr>`,
    `</table></div>`,
    ``,
    `<p class="report__text">Any config override or seed record the run needed must be added to the table above, with its undo. The runner cannot see those.</p>`,
    ``,
    relatedFiles(plan, files),
    ``,
    `</div>`,
    ``,
    `</body>`,
    `</html>`,
  ].join("\n");
}
