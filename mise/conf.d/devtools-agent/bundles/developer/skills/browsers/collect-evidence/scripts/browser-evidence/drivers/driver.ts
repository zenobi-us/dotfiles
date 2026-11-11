/**
 * The contract every browser driver meets. Commands talk to this interface
 * only, so adding a driver is one new module and one line in `DRIVERS`.
 *
 * A driver reports what happened; it never decides a verdict. `verdict.ts`
 * owns that table for every driver alike.
 */
import type { Plan, Precondition, Test } from "../plan.ts";
import type { DriverRun } from "../verdict.ts";
import { playwrightDriver } from "./playwright-driver.ts";
import { surfDriver } from "./surf-driver.ts";

export type DriverName = Plan["driver"];

/** Generated files for one test, as file name -> contents. */
export type CompiledTest = Record<string, string>;

export type RunContext = {
  plan: Plan;
  test: Test;
  /** Where `compile` wrote this test's files. */
  workflowDir: string;
  /** Screenshots land in `<reportDir>/shots`; evidence paths are relative to it. */
  reportDir: string;
  session: string;
};

/** One row of the report's cleanup table. Each cell is HTML, already escaped. */
export type CleanupRow = { item: string; state: string; action: string };

export interface Driver {
  readonly name: DriverName;
  /** True when the driver needs a person at a visible browser. */
  readonly attended: boolean;
  /** The file `runTest` executes, under the workflow directory. */
  scriptName(plan: Plan, testId: string): string;
  compile(plan: Plan, test: Test, shotsDir: string): CompiledTest;
  /** A driver-safe session name derived from the plan. */
  sessionName(plan: Plan): string;
  open(session: string): Promise<void>;
  checkPrecondition(plan: Plan, p: Precondition, session: string): Promise<{ ok: boolean; detail: string }>;
  runTest(ctx: RunContext): Promise<DriverRun>;
  close(session: string): Promise<void>;
  /** The report's "Test data left behind" row for the driver session. */
  cleanupRow(session: string): CleanupRow;
}

const DRIVERS: Record<DriverName, Driver> = {
  playwright: playwrightDriver,
  surf: surfDriver,
};

export function getDriver(name: DriverName): Driver {
  return DRIVERS[name];
}
