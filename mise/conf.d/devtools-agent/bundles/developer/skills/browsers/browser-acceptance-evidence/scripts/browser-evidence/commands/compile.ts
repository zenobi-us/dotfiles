import { Crust } from "@crustjs/core@^0.0.19";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { getDriver } from "../drivers/driver.ts";
import { loadPlan, manualTestsDir } from "../load-plan.ts";
import { guard } from "../sh.ts";

export async function compile(dir: string): Promise<void> {
  const plan = await loadPlan(dir);
  const driver = getDriver(plan.driver);
  const shots = resolve(dir, "report", "shots");
  await mkdir(join(dir, "workflows"), { recursive: true });
  for (const t of plan.tests) {
    for (const [name, contents] of Object.entries(driver.compile(plan, t, shots))) {
      const out = join(dir, "workflows", name);
      await writeFile(out, contents);
      console.log(`wrote ${out}`);
    }
  }
}

export const compileCmd = new Crust("compile")
  .meta({ description: "plan.ts -> one driver script per test under workflows/" })
  .args([{ name: "dir", type: "string", required: true, description: "manual-tests directory" }])
  .run(({ args }) => guard(() => compile(manualTestsDir(args.dir))));
