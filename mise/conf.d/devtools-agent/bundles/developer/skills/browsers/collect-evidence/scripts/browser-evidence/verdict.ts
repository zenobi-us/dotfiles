/**
 * The verdict is a table, not a judgement, and it is the same for every driver:
 *
 *   precondition failed             -> BLOCKED  (note names the precondition)
 *   step marked `human`             -> PARTIAL  (note says what is still owed)
 *   driver reported a failure       -> FAIL     (observed is the ASSERT FAIL message)
 *   successful expect and image     -> PASS
 *   no successful expect or image   -> PARTIAL
 *
 * A driver only reports what happened. It never sets a verdict except on a
 * `human` step, which it cannot finish.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { stepNumber, type Evidence, type Test, type Verdict } from "./plan.ts";

export type DriverFailure = { step: string; message: string; blocked?: boolean; captureFailed?: boolean; assertionPassed?: boolean };

export type DriverRun = {
 /** Executed steps and captures in plan order, verdicts left empty. */
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
  const verdict = run.failure.blocked ? "BLOCKED" : "FAIL";
  const failed = records.at(-1);
  if (failed && failed.step === run.failure.step &&
   ((failed.action === "assert" && failed.assertionPassed !== true) ||
    (run.failure.captureFailed && failed.captureStatus === "failed"))) {
   failed.verdict = verdict;
   failed.observed = run.failure.message || failed.observed;
   if (run.failure.captureFailed) failed.captureStatus = "failed";
   failed.note = run.failure.blocked ? "Stopped before an unapproved action; human handling required." : `FAIL line: ${t.fail}`;
  } else {
   records.push({
    test: t.id,
    step: run.failure.step,
    action: run.failure.captureFailed && !run.failure.assertionPassed ? "capture" : "assert",
    target: t.pass,
    resolved: "",
    url: records.at(-1)?.url ?? "",
    // Prior captures keep their own step identity and capture metadata.
    screenshot: "",
    observed: run.failure.message || "The run failed without a message.",
    captureStatus: run.failure.captureFailed ? "failed" : "not-requested",
    assertionPassed: run.failure.assertionPassed,
    verdict,
    note: run.failure.blocked ? "Stopped before an unapproved action; human handling required." : `FAIL line: ${t.fail}`,
   });
  }
  return { verdict, records };
 }

 // A human step caps the test at PARTIAL however well the rest went.
 if (records.some((r) => r.verdict === "PARTIAL")) return { verdict: "PARTIAL", records };

 const last = records.at(-1);
 if (!last) return { verdict: "PARTIAL", records };
 const hasShot = records.some((r) => r.screenshot && existsSync(join(reportDir, r.screenshot)));
 const hasAssertion = records.some((r) => r.action === "assert" && r.assertionPassed === true);
 const complete = t.steps.every((step, index) => records.some(r =>
  r.step === stepNumber(t.id, index) && (step.do !== "expect" || r.assertionPassed === true)));
 last.verdict = hasShot && hasAssertion && complete ? "PASS" : "PARTIAL";
 if (!hasShot) last.note = "No screenshot was captured, so this is not proof.";
 else if (!hasAssertion) last.note = "No expect completed successfully; a capture alone is not proof.";
 else if (!complete) last.note = "The driver did not complete every planned step and assertion.";
 return { verdict: last.verdict, records };
}
