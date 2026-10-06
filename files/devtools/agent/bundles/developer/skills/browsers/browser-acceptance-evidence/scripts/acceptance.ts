#!/usr/bin/env -S mise exec -- bun run --install=fallback
/**
 * browser-acceptance-evidence: plan -> scripts -> evidence -> report.
 *
 *   acceptance.ts init     <dir>          scaffold a plan and the directories
 *   acceptance.ts render   <dir>          plan.ts -> test-plan.md
 *   acceptance.ts compile  <dir>          plan.ts -> workflows/<work-id>-test-N.{js,json}
 *   acceptance.ts run      <dir> [--test N]  execute, write shots and evidence.jsonl
 *   acceptance.ts verdicts <dir>          summarise evidence.jsonl
 *
 * <dir> is the manual-tests directory under the shared-context root. Resolve
 * that root with the `shared-context` skill; never build the path by hand.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import type { Evidence, Plan, Verdict } from "./plan.ts";
import { renderPlan } from "./render-plan.ts";
import { compilePlaywright, compileSurf } from "./compile.ts";
import { checkPrecondition, openSession, runPlaywright, writeEvidence } from "./run.ts";

const USAGE = `usage: acceptance.ts <command> <manual-tests-dir> [options]

commands:
  init      <dir>               scaffold plan.ts, shots/, workflows/
  render    <dir>               plan.ts -> test-plan.md
  compile   <dir>               plan.ts -> workflows/
  run       <dir> [--test N]    execute and write evidence.jsonl
  verdicts  <dir>               summarise evidence.jsonl

<dir> is <shared-context-root>/<work-id>/manual-tests. Resolve the root with
the shared-context skill. Do not write into the repository under test.`;

const SCAFFOLD = `import type { Plan } from "<SCRIPTS>/plan.ts";

export const plan: Plan = {
  workId: "<WORK-ID>",
  driver: "playwright",
  base: "http://localhost:8090",
  environment: { account: "", branch: "" },

  preconditions: [
    // { id: "flag-x", desc: "feature_x is on",
    //   check: { goto: "/admin/flags", locator: "[data-testid=feature_x]", text: "on" } },
  ],

  tests: [
    {
      id: "1",
      claim: "short claim the reader can check",
      pass: "what success looks like",
      fail: "what failure looks like",
      requires: [],
      steps: [
        { do: "navigate", to: "/", shot: "landing" },
        // { do: "capture", locator: "a[data-testid=upgrade]", attr: "href", as: "upgradeHref" },
        // { do: "click", locator: "getByRole('link', { name: 'Upgrade now' })" },
        // { do: "expect", url: "portal\\\\.", shot: "portal" },
      ],
    },
  ],
};
`;

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

async function loadPlan(dir: string): Promise<Plan> {
  const file = join(dir, "plan.ts");
  if (!existsSync(file)) die(`no plan at ${file}\nRun: acceptance.ts init ${dir}`);
  const mod = (await import(file)) as { plan?: Plan };
  if (!mod.plan) die(`${file} must export a const named 'plan'`);
  return mod.plan;
}

function scriptName(plan: Plan, testId: string): string {
  return `${plan.workId}-test-${testId}.${plan.driver === "surf" ? "json" : "js"}`;
}

async function cmdInit(dir: string) {
  await mkdir(join(dir, "shots"), { recursive: true });
  await mkdir(join(dir, "workflows"), { recursive: true });
  const file = join(dir, "plan.ts");
  if (existsSync(file)) die(`${file} already exists; refusing to overwrite a plan`);
  const scripts = import.meta.dir;
  const workId = basename(resolve(dir, ".."));
  await writeFile(file, SCAFFOLD.replace("<SCRIPTS>", scripts).replace("<WORK-ID>", workId));
  console.log(`created ${file}`);
  console.log(`created ${join(dir, "shots")}/ and ${join(dir, "workflows")}/`);
}

async function cmdRender(dir: string) {
  const plan = await loadPlan(dir);
  const out = join(dir, "test-plan.md");
  await writeFile(out, renderPlan(plan));
  console.log(`wrote ${out} (${plan.tests.length} tests)`);
}

async function cmdCompile(dir: string) {
  const plan = await loadPlan(dir);
  const shots = resolve(dir, "report", "shots");
  await mkdir(join(dir, "workflows"), { recursive: true });
  for (const t of plan.tests) {
    const src = plan.driver === "surf"
      ? compileSurf(plan, t, shots)
      : compilePlaywright(plan, t, shots);
    const out = join(dir, "workflows", scriptName(plan, t.id));
    await writeFile(out, src);
    console.log(`wrote ${out}`);
  }
}

async function cmdRun(dir: string, only?: string) {
  const plan = await loadPlan(dir);
  if (plan.driver === "surf") {
    die("surf runs are driven by `surf do` per test; see references/drivers/surf-cli.md.\n" +
        "Compile emits the workflow JSON, and the surf driver reference says how to run it and read --json.");
  }
  const session = plan.workId;
  const reportDir = resolve(dir, "report");
  await mkdir(join(reportDir, "shots"), { recursive: true });
  const evidence = join(dir, "evidence.jsonl");
  await rm(evidence, { force: true });

  await openSession(session);
  console.log(`session ${session} open`);

  const tests = only ? plan.tests.filter((t) => t.id === only) : plan.tests;
  if (!tests.length) die(`no test with id ${only}`);

  const blockedBy = new Map<string, string>();
  for (const id of new Set(tests.flatMap((t) => t.requires ?? []))) {
    const r = await checkPrecondition(plan, id, session);
    console.log(`precondition ${id}: ${r.ok ? "met" : "NOT MET"} — ${r.detail}`);
    if (!r.ok) blockedBy.set(id, r.detail);
  }

  const summary: Array<[string, Verdict]> = [];
  for (const t of tests) {
    const blocker = (t.requires ?? []).map((r) => blockedBy.get(r)).find(Boolean);
    const script = resolve(dir, "workflows", scriptName(plan, t.id));
    if (!blocker && !existsSync(script)) die(`missing ${script}\nRun: acceptance.ts compile ${dir}`);
    const res = await runPlaywright(plan, t, script, reportDir, session, blocker);
    await writeEvidence(evidence, res.records);
    summary.push([t.id, res.verdict]);
    console.log(`test ${t.id}: ${res.verdict}${blocker ? ` — ${blocker}` : ""}`);
  }

  console.log(`\nwrote ${evidence}`);
  for (const [id, v] of summary) console.log(`  test ${id}: ${v}`);
  if (summary.some(([, v]) => v === "FAIL")) process.exit(2);
}

async function cmdVerdicts(dir: string) {
  const file = join(dir, "evidence.jsonl");
  if (!existsSync(file)) die(`no evidence at ${file}`);
  const lines = (await readFile(file, "utf8")).trim().split("\n").filter(Boolean);
  const records = lines.map((l) => JSON.parse(l) as Evidence);
  const byTest = new Map<string, Evidence[]>();
  for (const r of records) byTest.set(r.test, [...(byTest.get(r.test) ?? []), r]);
  for (const [test, rs] of byTest) {
    const v = rs.map((r) => r.verdict).filter(Boolean).pop() ?? "(none)";
    const shots = rs.filter((r) => r.screenshot).length;
    console.log(`test ${test}: ${v}  (${rs.length} steps, ${shots} shots)`);
    for (const r of rs.filter((x) => x.note)) console.log(`    ${r.step} ${r.verdict}: ${r.note}`);
  }
}

const [cmd, dirArg, ...rest] = process.argv.slice(2);
if (!cmd || !dirArg || cmd === "--help" || cmd === "-h") die(USAGE);
const dir = isAbsolute(dirArg) ? dirArg : resolve(process.cwd(), dirArg);
const onlyFlag = rest.indexOf("--test");
const only = onlyFlag >= 0 ? rest[onlyFlag + 1] : undefined;

switch (cmd) {
  case "init": await cmdInit(dir); break;
  case "render": await cmdRender(dir); break;
  case "compile": await cmdCompile(dir); break;
  case "run": await cmdRun(dir, only); break;
  case "verdicts": await cmdVerdicts(dir); break;
  default: die(USAGE);
}
