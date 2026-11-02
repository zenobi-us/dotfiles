/**
 * Plan (+ evidence) -> the JSON and Markdown forms a tracker or another agent reads.
 *
 *   plan.json     the test plan, reader steps only, written by `render`
 *   results.json  plan.json plus each test's verdict, screenshots and video, written by `report`
 *   evidence.md   results.json as Markdown with the images inline, written by `report`
 *   comment.md    the steps without evidence and a footnote link to evidence.md, written by `comment`
 *
 * Every form is built from `readerSteps`, so no locator reaches a reader and
 * the steps in a tracker comment are the steps that ran.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Evidence, Plan, Verdict } from "./plan.ts";
import { humanStep, readerNumber, readerSteps, videoPath } from "./plan.ts";
import { verdictOf } from "./report.ts";

export type PlanTestJson = {
  id: string;
  claim: string;
  pass: string;
  fail: string;
  requires: string[];
  steps: string[];
};

export type PlanJson = {
  workId: string;
  driver: Plan["driver"];
  base: string;
  environment: NonNullable<Plan["environment"]>;
  video: boolean;
  preconditions: Array<{ id: string; desc: string }>;
  tests: PlanTestJson[];
};

export type ShotJson = { step: number; path: string; caption: string };

export type ResultTestJson = PlanTestJson & {
  verdict: Verdict;
  shots: ShotJson[];
  video: string | null;
  failure: string | null;
  notes: string[];
};

export type ResultsJson = Omit<PlanJson, "tests"> & { tests: ResultTestJson[] };

export function planJson(plan: Plan): PlanJson {
  return {
    workId: plan.workId,
    driver: plan.driver,
    base: plan.base,
    environment: plan.environment ?? {},
    video: Boolean(plan.video),
    preconditions: (plan.preconditions ?? []).map((p) => ({ id: p.id, desc: p.desc })),
    tests: plan.tests.map((t) => ({
      id: t.id,
      claim: t.claim,
      pass: t.pass,
      fail: t.fail,
      requires: t.requires ?? [],
      steps: readerSteps(t).map((s) => s.text),
    })),
  };
}

/** Paths in the result are relative to the report directory, like every evidence record. */
export function resultsJson(plan: Plan, records: Evidence[], reportDir: string): ResultsJson {
  const base = planJson(plan);
  return {
    ...base,
    tests: plan.tests.map((t, i) => {
      const mine = records.filter((r) => r.test === t.id);
      const readable = readerNumber(t);
      const seen = new Set<string>();
      const shots: ShotJson[] = [];
      for (const r of mine) {
        if (!r.screenshot || seen.has(r.screenshot) || !existsSync(join(reportDir, r.screenshot))) continue;
        seen.add(r.screenshot);
        const idx = Number(r.step.split(".").pop()) - 1;
        shots.push({
          step: readable.get(r.step) ?? 1,
          path: r.screenshot,
          caption: r.observed || (humanStep(t.steps[idx] ?? t.steps[0]!) ?? ""),
        });
      }
      const video = videoPath(t.id);
      return {
        ...base.tests[i]!,
        verdict: verdictOf(records, t.id),
        shots,
        video: existsSync(join(reportDir, video)) ? video : null,
        failure: mine.find((r) => r.verdict === "FAIL")?.observed ?? null,
        notes: mine.filter((r) => r.note && r.verdict).map((r) => `${r.verdict} at step ${r.step}: ${r.note}`),
      };
    }),
  };
}

function environmentLines(p: PlanJson | ResultsJson): string[] {
  const env = p.environment;
  return [
    `- URL: \`${p.base}\``,
    `- Driver: \`${p.driver}\``,
    env.account ? `- Account: ${env.account}` : "",
    env.branch ? `- Branch: \`${env.branch}\`` : "",
    env.notes ? `- Notes: ${env.notes}` : "",
  ].filter(Boolean);
}

/**
 * evidence.md sits beside the report directory, so every relative path in the
 * results gets `reportPrefix` in front of it.
 */
export function renderEvidenceMd(results: ResultsJson, reportPrefix = "report/"): string {
  const summary = results.tests.map((t) => `| [${t.id}](#test-${t.id}) | ${t.claim} | **${t.verdict}** |`);
  const sections = results.tests.flatMap((t) => [
    `## Test ${t.id}`,
    "",
    `${t.claim}. Verdict: **${t.verdict}**.`,
    "",
    ...t.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `**PASS:** ${t.pass}`,
    "",
    `**FAIL:** ${t.fail}`,
    "",
    ...(t.failure ? ["```text", t.failure, "```", ""] : []),
    ...t.shots.flatMap((s) => [`![Step ${s.step} of test ${t.id}](${reportPrefix}${s.path})`, "", `*Step ${s.step}.* ${s.caption}`, ""]),
    ...(t.video ? [`Video: [test ${t.id}](${reportPrefix}${t.video})`, ""] : []),
    ...t.notes.map((n) => `> ${n}`),
    ...(t.notes.length ? [""] : []),
  ]);

  return [
    `# Acceptance evidence — ${results.workId}`,
    "",
    "Generated from `plan.ts` and the run's `evidence.jsonl`. The steps are the manual test steps; each test then shows what the browser showed.",
    "",
    "## Environment",
    "",
    ...environmentLines(results),
    "",
    "## Summary",
    "",
    "| Test | Claim | Verdict |",
    "|---|---|---|",
    ...summary,
    "",
    ...sections,
  ].join("\n");
}

/**
 * The tracker comment: the manual test steps with no evidence, and one
 * footnote that links to the full evidence. A reviewer reads the steps in the
 * ticket and follows the link for the screenshots.
 */
export function renderComment(plan: PlanJson, evidenceUrl: string, title = "Manual test steps"): string {
  const tests = plan.tests.flatMap((t) => [
    `**Test ${t.id}: ${t.claim}**`,
    "",
    ...t.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `Pass: ${t.pass}`,
    "",
  ]);
  return [
    `**${title}: ${plan.workId}** [1]`,
    "",
    ...(plan.environment.account ? [`Account: ${plan.environment.account}`, ""] : []),
    ...tests,
    "---",
    "",
    `[1] Steps and evidence (screenshots, verdicts${plan.video ? ", video" : ""}): ${evidenceUrl}`,
    "",
  ].join("\n");
}
