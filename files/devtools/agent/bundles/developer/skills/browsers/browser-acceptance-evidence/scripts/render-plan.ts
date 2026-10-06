/**
 * Plan -> `test-plan.md`.
 *
 * The same step text feeds the markdown, the driver script and both report
 * sections, so the plan a reviewer reads is the plan that ran.
 */
import type { Plan, Test } from "./plan.ts";
import { stepNumber, stepText } from "./plan.ts";

function preconditions(plan: Plan): string {
  if (!plan.preconditions?.length) {
    return "## Preconditions\n\nNone declared.\n";
  }
  const rows = plan.preconditions
    .map((p) => `- **${p.id}** — ${p.desc}`)
    .join("\n");
  return `## Preconditions\n\nEach one is checked before the tests that need it, not assumed.\n\n${rows}\n`;
}

function test(t: Test, plan: Plan): string {
  const steps = t.steps
    .map((s, i) => `${i + 1}. ${stepText(s, plan.base)}`)
    .join("\n");
  const req = t.requires?.length
    ? `\nRequires: ${t.requires.map((r) => `\`${r}\``).join(", ")}\n`
    : "";
  return [
    `## Test ${t.id} — ${t.claim}`,
    req,
    steps,
    "",
    `**PASS:** ${t.pass}`,
    `**FAIL:** ${t.fail}`,
    "",
  ].join("\n");
}

export function renderPlan(plan: Plan): string {
  const env = plan.environment ?? {};
  const envLines = [
    `- URL: \`${plan.base}\``,
    `- Driver: \`${plan.driver}\``,
    env.account ? `- Account: ${env.account}` : "",
    env.branch ? `- Branch: \`${env.branch}\`` : "",
    env.notes ? `- Notes: ${env.notes}` : "",
  ].filter(Boolean).join("\n");

  return [
    `# Manual test plan — ${plan.workId}`,
    "",
    "Written before the browser opened. Generated from `plan.ts`; edit the plan, not this file.",
    "",
    "## Environment",
    "",
    envLines,
    "",
    preconditions(plan),
    plan.tests.map((t) => test(t, plan)).join("\n"),
  ].join("\n");
}

/** Every step number the plan declares. The runner checks its records against this. */
export function stepIndex(plan: Plan): string[] {
  return plan.tests.flatMap((t) => t.steps.map((_, i) => stepNumber(t.id, i)));
}
