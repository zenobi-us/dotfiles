import { existsSync } from "node:fs";
// Canonical plans require explicit scope before either driver can execute.
import { join } from "node:path";
import type { Plan } from "./plan.ts";
import { selectorish, stepNumber } from "./plan.ts";
import { checkPlan } from "./records.ts";
import { die } from "./sh.ts";

export async function loadPlan(dir: string): Promise<Plan> {
  const file = join(dir, "plan.ts");
  if (!existsSync(file)) die(`No plan at ${file}. Run collect-evidence.ts init with a new external working directory.`, 2);
  const mod = (await import(file)) as { plan?: Plan };
  if (!mod.plan) die(`${file} must export a const named 'plan'`);
  const plan = mod.plan;
  checkPlan(plan);
  if (plan.schema !== "collect-evidence/v1" || plan.kind !== "plan") {
    die(`${file} requires schema: "collect-evidence/v1" and kind: "plan"`, 2);
  }
  if (!/^[A-Za-z0-9._-]+$/.test(plan.workId) || !["surf", "playwright", "tui", "gui"].includes(plan.driver)) {
    die(`${file} has an invalid workId or driver`, 2);
  }
  if (plan.driver !== "tui" && plan.driver !== "gui") {
    if (!Array.isArray(plan.tests) || !plan.tests.length || !plan.approval ||
        !Array.isArray(plan.approval.origins) || !plan.approval.origins.length ||
        (plan.approval.confirmations !== undefined && !Array.isArray(plan.approval.confirmations))) {
      die(`${file} requires tests and explicit approval.origins`, 2);
    }
    const origins = plan.approval.origins;
    try {
      for (const origin of origins) {
        const url = new URL(origin);
        if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin || url.username || url.password) throw new Error();
      }
      const base = new URL(plan.base);
      if (!origins.includes(base.origin) || base.username || base.password) throw new Error();
    } catch {
      die(`${file} requires HTTP(S) origins and an approved base without credentials`, 2);
    }
  }
  const ids = new Set(plan.tests.flatMap(test => test.steps.map((_, index) => stepNumber(test.id, index))));
  if (plan.approval.confirmations?.some((id) => typeof id !== "string" || !ids.has(id))) {
    die(`${file} approval.confirmations must contain stable step IDs`, 2);
  }
  for (const to of [
    ...plan.tests.flatMap((test) => test.steps.flatMap((step) => step.do === "navigate" ? [step.to] : [])),
    ...(plan.preconditions ?? []).flatMap((p) => p.check.goto ? [p.check.goto] : []),
  ]) {
    try {
      const url = new URL(to, plan.base);
      if (!plan.approval.origins.includes(url.origin) || url.username || url.password) throw new Error();
    } catch {
      die(`${file} navigation is outside approved origins or contains credentials`, 2);
    }
  }

  // Fail here, not four commands later inside the report validator, and name
  // the field the author still has to write.
  const todo = mod.plan.tests.flatMap((t) =>
    (["claim", "pass", "fail"] as const)
      .filter((k) => t[k].startsWith("TODO"))
      .map((k) => `  test ${t.id}: ${k} is still "${t[k]}"`),
  );
  if (todo.length) {
    die(`${file} still has scaffold text:\n${todo.join("\n")}\n\n` +
        `A test with no real claim, PASS line and FAIL line is not a test yet.`);
  }

  // `says` is the only part of a step a reviewer reads. A selector in there
  // turns the manual test plan back into a driver transcript, which is the
  // fault this field exists to stop.
  const bad = mod.plan.tests.flatMap((t) =>
    t.steps.flatMap((s, i) => {
      const says = s.do === "human" ? s.needs : s.says;
      const at = `  test ${t.id} step ${stepNumber(t.id, i)}`;
      if (says === undefined) return [];
      if (!says.trim()) return [`${at}: says is empty`];
      if (says.trim().startsWith("TODO")) return [`${at}: says is still "${says}"`];
      const found = selectorish(says);
      return found ? [`${at}: says carries ${found}`] : [];
    }),
  );
  if (bad.length) {
    die(`${file} has steps a person cannot follow:\n${bad.join("\n")}\n\n` +
        `A \`says\` is the manual test step. Name what is on the screen — the visible\n` +
        `label, the button text, the field name. The locator beside it is how the\n` +
        `driver finds the same thing, and no reader ever sees it.`);
  }
  return mod.plan;
}
