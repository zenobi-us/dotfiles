import { Crust } from "@crustjs/core@^0.0.19";
import { cp, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { getDriver } from "../drivers/driver.ts";
import { readEvidence } from "../evidence.ts";
import { loadPlan, manualTestsDir } from "../load-plan.ts";
import { buildReport } from "../report.ts";
import { ensureReportDir, validateReport } from "../report-dir.ts";
import { renderEvidenceMd, resultsJson } from "../results.ts";
import { die, guard } from "../sh.ts";

/** Copy every regular file directly in `from` into `to`, and return the names copied. */
async function copyFiles(from: string, to: string): Promise<string[]> {
  if (!existsSync(from)) return [];
  const copied: string[] = [];
  for (const name of await readdir(from)) {
    if (!(await stat(join(from, name))).isFile()) continue;
    await cp(join(from, name), join(to, name));
    copied.push(name);
  }
  return copied;
}

export async function report(dir: string): Promise<number> {
  const plan = await loadPlan(dir);
  const driver = getDriver(plan.driver);
  const evidenceFile = join(dir, "evidence.jsonl");
  if (!existsSync(evidenceFile)) die(`no evidence at ${evidenceFile}\nRun: browser-evidence.ts run ${dir}`);
  const records = await readEvidence(evidenceFile);

  const reportDir = resolve(dir, "report");
  await ensureReportDir(reportDir, `${plan.workId} — acceptance evidence`);

  // Every artifact the report links to travels inside it.
  const filesDir = join(reportDir, "files");
  await mkdir(filesDir, { recursive: true });
  const copied: string[] = [];
  for (const name of ["plan.ts", "plan.json", "test-plan.md", "evidence.jsonl"]) {
    if (existsSync(join(dir, name))) {
      await cp(join(dir, name), join(filesDir, name));
      copied.push(name);
    }
  }
  copied.push(...(await copyFiles(join(dir, "workflows"), filesDir)));
  copied.push(...(await copyFiles(join(dir, "runs"), filesDir)));

  const date = new Date().toISOString().slice(0, 10);
  const html = await buildReport(plan, records, reportDir, copied, date, [driver.cleanupRow(driver.sessionName(plan))]);
  const page = join(reportDir, "index.html");
  await writeFile(page, html);
  console.log(`wrote ${page}`);

  const results = resultsJson(plan, records, reportDir);
  const resultsFile = join(dir, "results.json");
  await writeFile(resultsFile, JSON.stringify(results, null, 2) + "\n");
  console.log(`wrote ${resultsFile}`);
  const md = join(dir, "evidence.md");
  await writeFile(md, renderEvidenceMd(results));
  console.log(`wrote ${md}`);

  return (await validateReport(page)) ? 0 : 1;
}

export const reportCmd = new Crust("report")
  .meta({ description: "Build the HTML report, results.json and evidence.md from plan.ts and evidence.jsonl, then validate the HTML" })
  .args([{ name: "dir", type: "string", required: true, description: "manual-tests directory" }])
  .run(({ args }) => guard(() => report(manualTestsDir(args.dir))));
