// Manual-step comments are generated from the authored plan. Reports and
// verdicts consume records.ts instead of maintaining a second result model.
import type { Plan } from "./plan.ts";
import { readerSteps } from "./plan.ts";

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
