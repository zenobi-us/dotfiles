import { Crust } from "@crustjs/core@^0.0.19";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadPlan, manualTestsDir } from "../load-plan.ts";
import { renderPlan } from "../render-plan.ts";
import { guard } from "../sh.ts";

export async function render(dir: string): Promise<void> {
  const plan = await loadPlan(dir);
  const out = join(dir, "test-plan.md");
  await writeFile(out, renderPlan(plan));
  console.log(`wrote ${out} (${plan.tests.length} tests)`);
}

export const renderCmd = new Crust("render")
  .meta({ description: "plan.ts -> test-plan.md, the manual steps a person follows" })
  .args([{ name: "dir", type: "string", required: true, description: "manual-tests directory" }])
  .run(({ args }) => guard(() => render(manualTestsDir(args.dir))));
