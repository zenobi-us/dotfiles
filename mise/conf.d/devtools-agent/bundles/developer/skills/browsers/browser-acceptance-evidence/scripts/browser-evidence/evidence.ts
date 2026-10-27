/**
 * Evidence records: the one format every driver produces and every later
 * command reads. The contract is in references/evidence-schema.md.
 */
import { appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Evidence, Test } from "./plan.ts";
import { shotsFor } from "./plan.ts";

export async function writeEvidence(path: string, records: Evidence[]): Promise<void> {
  if (!records.length) return;
  await appendFile(path, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
}

export async function readEvidence(path: string): Promise<Evidence[]> {
  return (await readFile(path, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Evidence);
}

/** The single record a test gets when a precondition kept it from running. */
export function blockedRecord(t: Test, why: string): Evidence {
  return {
    test: t.id,
    step: `${t.id}.1`,
    action: "assert",
    target: "precondition",
    resolved: "",
    url: "",
    screenshot: "",
    observed: "The test did not run.",
    verdict: "BLOCKED",
    note: why,
  };
}

/** The last screenshot a record names that is really on disk. */
export function lastShot(records: Evidence[], reportDir: string): string {
  for (let i = records.length - 1; i >= 0; i--) {
    const s = records[i]!.screenshot;
    if (s && existsSync(join(reportDir, s))) return s;
  }
  return "";
}

/** When a run returns no records, recover the last screenshot from the plan. */
export function lastPlannedShot(t: Test, reportDir: string): string {
  const shots = [...shotsFor(t).values()];
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]!;
    if (existsSync(join(reportDir, s))) return s;
  }
  return "";
}
