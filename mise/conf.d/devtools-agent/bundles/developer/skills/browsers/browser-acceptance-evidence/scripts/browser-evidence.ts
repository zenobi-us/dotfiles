#!/usr/bin/env -S mise exec -- bun run --install=fallback
/**
 * browser-evidence: plan -> scripts -> evidence -> report.
 *
 *   init     <dir> [--driver surf]   scaffold a plan and the directories
 *   render   <dir>                   plan.ts -> test-plan.md
 *   compile  <dir>                   plan.ts -> workflows/, one script per test
 *   run      <dir> [--test N]        execute with the plan's driver, write evidence.jsonl
 *   verdicts <dir>                   summarise evidence.jsonl
 *   report   <dir>                   build and validate the HTML report
 *
 * <dir> is <shared-context-root>/<work-id>/manual-tests. Resolve that root with
 * the `shared-context` skill; never build the path by hand, and never write into
 * the repository under test. Drivers live in browser-evidence/drivers/.
 */
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { compileCmd } from "./browser-evidence/commands/compile.ts";
import { initCmd } from "./browser-evidence/commands/init.ts";
import { renderCmd } from "./browser-evidence/commands/render.ts";
import { reportCmd } from "./browser-evidence/commands/report.ts";
import { runCmd } from "./browser-evidence/commands/run.ts";
import { verdictsCmd } from "./browser-evidence/commands/verdicts.ts";

await new Crust("browser-evidence")
  .meta({ description: "Typed browser acceptance evidence: plan, compile, run, report" })
  .use(helpPlugin())
  .command(initCmd)
  .command(renderCmd)
  .command(compileCmd)
  .command(runCmd)
  .command(verdictsCmd)
  .command(reportCmd)
  .execute();
