/**
 * The verdict is a table, not a judgement, and it is the same for every driver:
 *
 *   precondition failed             -> BLOCKED  (note names the precondition)
 *   step marked `human`             -> PARTIAL  (note says what is still owed)
 *   driver reported a failure       -> FAIL     (observed is the ASSERT FAIL message)
 *   driver passed, shot exists      -> PASS
 *   driver passed, no shot          -> PARTIAL  (a PASS requires an image)
 *
 * A driver only reports what happened. It never sets a verdict except on a
 * `human` step, which it cannot finish.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Evidence, Test, Verdict } from "./plan.ts";
import { lastPlannedShot, lastShot } from "./evidence.ts";

export type DriverFailure = { step: string; message: string };

export type DriverRun = {
  /** One record per step that ran, in plan order, verdicts left empty. */
  records: Evidence[];
  /** Set when the driver stopped on an error. */
  failure?: DriverFailure;
  /** What the driver printed, kept for the run log. */
  raw: string;
  /** How many times the driver started this test. */
  attempts: number;
};

export function decideVerdict(
  t: Test,
  run: DriverRun,
  reportDir: string,
): { verdict: Verdict; records: Evidence[] } {
  const records = run.records.map((r) => ({ ...r }));

  if (run.failure) {
    const shot = lastShot(records, reportDir) || lastPlannedShot(t, reportDir);
    const failed = records.at(-1);
    if (failed && failed.step === run.failure.step) {
      failed.verdict = "FAIL";
      failed.observed = run.failure.message || failed.observed;
      failed.screenshot = failed.screenshot || shot;
      failed.note = `FAIL line: ${t.fail}`;
    } else {
      records.push({
        test: t.id,
        step: run.failure.step,
        action: "assert",
        target: t.pass,
        resolved: "",
        url: records.at(-1)?.url ?? "",
        screenshot: shot,
        observed: run.failure.message || "The run failed without a message.",
        verdict: "FAIL",
        note: `FAIL line: ${t.fail}`,
      });
    }
    return { verdict: "FAIL", records };
  }

  // A human step caps the test at PARTIAL however well the rest went.
  if (records.some((r) => r.verdict === "PARTIAL")) return { verdict: "PARTIAL", records };

  const last = records.at(-1);
  if (!last) return { verdict: "PARTIAL", records };
  const hasShot = records.some((r) => r.screenshot && existsSync(join(reportDir, r.screenshot)));
  last.verdict = hasShot ? "PASS" : "PARTIAL";
  if (!hasShot) last.note = "No screenshot was captured, so this is not proof.";
  return { verdict: last.verdict, records };
}
