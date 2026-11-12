/**
 * Plan -> `test-plan.md`.
 *
 * Only the manual test steps reach this file. A `wait` or a `scroll` with no
 * `says` is driver plumbing and is left out, so the numbers here run 1..n and
 * are not the plan step ids. The plan id stays the identity of the evidence
 * record; this document is for the person who has to follow the steps.
 *
 * The same sentences feed both report step lists, so the plan a reviewer reads
 * is the plan that ran.
 */
import type { Plan, Test } from "./plan.ts";
import { readerSteps, stepNumber } from "./plan.ts";

function preconditions(plan: Plan): string {
  if (!plan.preconditions?.length) {
    return "## Preconditions\n\nNone declared.\n";
  }
  const rows = plan.preconditions
    .map((p) => `- **${p.id}** — ${p.desc}`)
    .join("\n");
  return `## Preconditions\n\nEach one is checked before the tests that need it, not assumed.\n\n${rows}\n`;
}

function test(t: Test): string {
  const steps = readerSteps(t)
    .map((s) => `${s.n}. ${s.text}`)
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
    `- Surface: \`${plan.base}\``,
    plan.driver === "gui" ? `- Approved X11 scope: ${JSON.stringify(plan.approval.gui)}; read-only; borrowed resources preserved` : plan.driver === "tui" ? `- Command: \`${JSON.stringify(plan.terminal?.command)}\`` : `- Account: ${env.account ?? "the signed-in test account"}`,
    plan.driver === "tui" ? `- Working directory: \`${plan.terminal?.cwd}\`` : "",
    plan.driver === "tui" ? `- Terminal: ${plan.terminal?.columns} × ${plan.terminal?.rows}; ${plan.terminal?.font}; line height ${plan.terminal?.lineHeight}px` : "",
    plan.driver === "tui" ? `- Approved input steps: ${plan.approval.confirmations?.join(", ") || "None"}` : "",
    env.branch ? `- Branch: \`${env.branch}\`` : "",
    env.notes ? `- Notes: ${env.notes}` : "",
  ].filter(Boolean).join("\n");

  return [
    `# Manual test plan — ${plan.workId}`,
    "",
    `Steps for a person to follow in ${plan.driver === "gui" ? "the approved GUI window or display" : plan.driver === "tui" ? "the approved private terminal" : "a browser"}. Written before collection,`,
    "and generated from `plan.ts`; edit the plan, not this file. The same steps were",
    `driven with \`${plan.driver}\`, which is how the evidence was captured.`,
    "",
    "## Environment",
    "",
    envLines,
    "",
    preconditions(plan),
    plan.tests.map(test).join("\n"),
  ].join("\n");
}

/** Every step number the plan declares. The runner checks its records against this. */
export function stepIndex(plan: Plan): string[] {
  return plan.tests.flatMap((t) => t.steps.map((_, i) => stepNumber(t.id, i)));
}
