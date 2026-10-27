import { Crust } from "@crustjs/core@^0.0.19";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readEvidence } from "../evidence.ts";
import { manualTestsDir } from "../load-plan.ts";
import type { Evidence } from "../plan.ts";
import { die, guard } from "../sh.ts";

export async function verdicts(dir: string): Promise<void> {
  const file = join(dir, "evidence.jsonl");
  if (!existsSync(file)) die(`no evidence at ${file}`);
  const byTest = new Map<string, Evidence[]>();
  for (const r of await readEvidence(file)) byTest.set(r.test, [...(byTest.get(r.test) ?? []), r]);
  for (const [test, rs] of byTest) {
    const v = rs.map((r) => r.verdict).filter(Boolean).pop() ?? "(none)";
    const shots = rs.filter((r) => r.screenshot).length;
    console.log(`test ${test}: ${v}  (${rs.length} steps, ${shots} shots)`);
    for (const r of rs.filter((x) => x.note)) console.log(`    ${r.step} ${r.verdict}: ${r.note}`);
  }
}

export const verdictsCmd = new Crust("verdicts")
  .meta({ description: "Summarise evidence.jsonl, one line per test, with every note" })
  .args([{ name: "dir", type: "string", required: true, description: "manual-tests directory" }])
  .run(({ args }) => guard(() => verdicts(manualTestsDir(args.dir))));
