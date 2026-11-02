import { Crust } from "@crustjs/core@^0.0.19";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadPlan, manualTestsDir } from "../load-plan.ts";
import { renderPlan } from "../render-plan.ts";
import { planJson } from "../results.ts";
import { guard } from "../sh.ts";

export async function render(dir: string): Promise<void> {
  const plan = await loadPlan(dir);
  const out = join(dir, "test-plan.md");
  await writeFile(out, renderPlan(plan));
  console.log(`wrote ${out} (${plan.tests.length} tests)`);
  const json = join(dir, "plan.json");
  await writeFile(json, JSON.stringify(planJson(plan), null, 2) + "\n");
  console.log(`wrote ${json}`);
}

export const renderCmd = new Crust("render")
  .meta({ description: "plan.ts -> test-plan.md and plan.json, the manual steps with no evidence" })
  .args([{ name: "dir", type: "string", required: true, description: "manual-tests directory" }])
  .run(({ args }) => guard(() => render(manualTestsDir(args.dir))));
