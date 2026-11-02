import { rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { die, sh } from "./sh.ts";

/**
 * `writing-reports` owns the report directory. It is created with that skill's
 * own script rather than a copy of its template, so a change there reaches this
 * skill without an edit here.
 */
export const REPORTS = resolve(import.meta.dir, "..", "..", "..", "..", "devtools", "writing-reports", "scripts");

export async function ensureReportDir(reportDir: string, title: string): Promise<void> {
  if (existsSync(join(reportDir, "index.html"))) return;
  // new-report.ts refuses to overwrite, and `run` may already have made shots/ and videos/.
  const kept = RUN_OUTPUT.filter((name) => existsSync(join(reportDir, name)));
  for (const name of kept) await rename(join(reportDir, name), `${reportDir}.${name}-stash`);
  if (existsSync(reportDir)) await rm(reportDir, { recursive: true, force: true });
  const r = await sh([join(REPORTS, "new-report.ts"), reportDir, title]);
  if (r.code !== 0) die(`new-report.ts failed:\n${r.err}`);
  for (const name of kept) {
    await rm(join(reportDir, name), { recursive: true, force: true });
    await rename(`${reportDir}.${name}-stash`, join(reportDir, name));
  }
}

const RUN_OUTPUT = ["shots", "videos"];

export async function validateReport(page: string): Promise<boolean> {
  const r = await sh([join(REPORTS, "validate-report.ts"), page]);
  console.log((r.out + r.err).trim());
  return r.code === 0;
}
