import { Crust } from "@crustjs/core@^0.0.19";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { getDriver } from "../drivers/driver.ts";
import { blockedRecord, writeEvidence } from "../evidence.ts";
import { loadPlan, manualTestsDir } from "../load-plan.ts";
import type { Verdict } from "../plan.ts";
import { die, guard } from "../sh.ts";
import { decideVerdict } from "../verdict.ts";

/** Run every test (or one), write evidence.jsonl, and return the exit code. */
export async function runTests(dir: string, only?: string): Promise<number> {
  const plan = await loadPlan(dir);
  const driver = getDriver(plan.driver);
  const session = driver.sessionName(plan);
  const reportDir = resolve(dir, "report");
  const workflowDir = resolve(dir, "workflows");
  const runsDir = join(dir, "runs");
  await mkdir(join(reportDir, "shots"), { recursive: true });
  await mkdir(runsDir, { recursive: true });
  const evidence = join(dir, "evidence.jsonl");

  const tests = only ? plan.tests.filter((t) => t.id === only) : plan.tests;
  if (!tests.length) die(`no test with id ${only}`);
  for (const t of tests) {
    const script = join(workflowDir, driver.scriptName(plan, t.id));
    if (!existsSync(script)) die(`missing ${script}\nRun: browser-evidence.ts compile ${dir}`);
  }
  await rm(evidence, { force: true });

  if (driver.attended) {
    console.log(`${driver.name} drives a visible browser: leave its window in front until the run ends.`);
  }
  await driver.open(session);
  console.log(`session ${session} open`);

  const summary: Array<[string, Verdict]> = [];
  try {
    const blockedBy = new Map<string, string>();
    for (const id of new Set(tests.flatMap((t) => t.requires ?? []))) {
      const p = plan.preconditions?.find((x) => x.id === id);
      const r = p
        ? await driver.checkPrecondition(plan, p, session)
        : { ok: false, detail: `precondition ${id} is not declared in the plan` };
      console.log(`precondition ${id}: ${r.ok ? "met" : "NOT MET"} — ${r.detail}`);
      if (!r.ok) blockedBy.set(id, r.detail);
    }

    for (const t of tests) {
      const blocker = (t.requires ?? []).map((r) => blockedBy.get(r)).find(Boolean);
      if (blocker) {
        await writeEvidence(evidence, [blockedRecord(t, blocker)]);
        summary.push([t.id, "BLOCKED"]);
        console.log(`test ${t.id}: BLOCKED — ${blocker}`);
        continue;
      }

      const run = await driver.runTest({ plan, test: t, workflowDir, reportDir, session });
      const log = join(runsDir, `test-${t.id}.log`);
      await writeFile(log, run.raw);
      const { verdict, records } = decideVerdict(t, run, reportDir);
      const last = records.at(-1);
      if (last && run.attempts > 1) {
        const retried = `The driver started this test ${run.attempts} times; every attempt is in runs/test-${t.id}.log.`;
        last.note = last.note ? `${last.note} ${retried}` : retried;
      }
      await writeEvidence(evidence, records);
      summary.push([t.id, verdict]);
      console.log(`test ${t.id}: ${verdict}${run.attempts > 1 ? ` (after ${run.attempts} attempts)` : ""}`);
    }
  } finally {
    await driver.close(session);
  }

  console.log(`\nwrote ${evidence}`);
  for (const [id, v] of summary) console.log(`  test ${id}: ${v}`);
  return summary.some(([, v]) => v === "FAIL") ? 2 : 0;
}

export const runCmd = new Crust("run")
  .meta({ description: "Run each compiled test with the plan's driver and write evidence.jsonl (exit 2 on any FAIL)" })
  .args([{ name: "dir", type: "string", required: true, description: "manual-tests directory" }])
  .flags({ test: { type: "string", description: "Run only the test with this id" } })
  .run(({ args, flags }) => guard(() => runTests(manualTestsDir(args.dir), flags.test)));
