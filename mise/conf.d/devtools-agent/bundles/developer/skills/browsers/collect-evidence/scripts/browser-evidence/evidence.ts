// A failed precondition produces a blocked observation, not a passing assertion.
import type { Evidence, Test } from "./plan.ts";

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
