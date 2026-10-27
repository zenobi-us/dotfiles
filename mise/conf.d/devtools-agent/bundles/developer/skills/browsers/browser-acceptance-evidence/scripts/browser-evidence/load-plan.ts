import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import type { Plan } from "./plan.ts";
import { selectorish, stepNumber } from "./plan.ts";
import { die } from "./sh.ts";

/** The manual-tests directory as an absolute path. */
export function manualTestsDir(arg: string): string {
  return isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
}

export async function loadPlan(dir: string): Promise<Plan> {
  const file = join(dir, "plan.ts");
  if (!existsSync(file)) die(`no plan at ${file}\nRun: browser-evidence.ts init ${dir}`);
  const mod = (await import(file)) as { plan?: Plan };
  if (!mod.plan) die(`${file} must export a const named 'plan'`);

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
