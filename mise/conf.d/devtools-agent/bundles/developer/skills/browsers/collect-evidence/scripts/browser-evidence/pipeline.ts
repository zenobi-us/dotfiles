// Public command workflow. Drivers collect in a private temporary directory;
// only validated records cross the shared-context finalization boundary.
import { mkdir, mkdtemp, readFile, writeFile, cp, rm, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, relative, isAbsolute, sep } from "node:path";
import { tmpdir } from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { getDriver } from "./drivers/driver.ts";
import { loadPlan } from "./load-plan.ts";
import type { Evidence, Plan } from "./plan.ts";
import { blockedRecord } from "./evidence.ts";
import { decideVerdict } from "./verdict.ts";
import { renderPlan } from "./render-plan.ts";
import { planJson, renderComment } from "./results.ts";
import { CliError, sh, cancelDriverCommands } from "./sh.ts";
import { finalizeRun, validateRun } from "./records.ts";
import { doctorTui } from "./drivers/tui-driver.ts";
import { doctorGui } from "./drivers/gui-driver.ts";

export const schema = "collect-evidence/v1";
export type Options = {
  repository?: string; workflow?: string; run?: string; driver?: string;
  dryRun?: boolean; force?: boolean; test?: string; url?: string; title?: string; display?: string; window?: string;
};
const contextCli = resolve(import.meta.dir, "../../../../../../agent-core/skills/shared-context/scripts/shared-context/cli.ts");
const json = (kind: string, fields: object) => JSON.stringify({ schema, kind, ...fields }, null, 2) + "\n";
const digest = (plan: Plan) => createHash("sha256").update(JSON.stringify(plan)).digest("hex");
function invalid(message: string): never { throw new CliError(message, 2); }

async function route(options: Options): Promise<{ path: string; ref: string; root: string; store: string }> {
  if (!options.repository || !options.workflow || !options.run) invalid("--repository, --workflow and --run are required");
  const p = Bun.spawn([contextCli, "resolve", "evidence", "--workflow", options.workflow!, "--run", options.run!, "--json"], {
    cwd: resolve(options.repository!), stdout: "pipe", stderr: "pipe",
  });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  if (await p.exited !== 0) throw new CliError(`shared-context resolution failed: ${err.trim()}`, 3);
  return JSON.parse(out);
}

async function outsideSource(dir: string, repository: string): Promise<void> {
  const source = await realpath(repository);
  // Resolve the nearest existing ancestor, so a symlink cannot redirect writes.
  let ancestor = resolve(dir);
  while (!existsSync(ancestor)) ancestor = resolve(ancestor, "..");
  const actual = resolve(await realpath(ancestor), relative(ancestor, resolve(dir)));
  const rel = relative(source, actual);
  if (!rel || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))) invalid("Use a working directory outside the watched repository; finalization uses the resolved store");
}

export async function markdown(path: string, kind: string, body: string): Promise<void> {
  const p = Bun.spawn(["mise", "exec", "--", "mq", "--allow-http-import", "--lockfile", join(tmpdir(), "collect-evidence-mq.lock"), "-I", "raw", "-F", "raw", "-o", path,
    'import "github.com/harehare/okf.mq" | .'], { stdin: "pipe", stdout: "pipe", stderr: "pipe" });
  p.stdin.write(`---\nschema: ${schema}\nkind: ${kind}\n---\n${body}`);
  p.stdin.end();
  const err = await new Response(p.stderr).text();
  if (await p.exited !== 0) throw new CliError(`Markdown generation failed: ${err}`, 3);
}

type Cancellation = { interrupted: boolean; cancellable: boolean };

function checkCancellation(state: Cancellation): void {
  if (state.interrupted) throw new CliError("Collection interrupted; the command did not complete", 1);
}

async function withCancellation<T>(work: (state: Cancellation) => Promise<T>): Promise<T> {
  const state: Cancellation = { interrupted: false, cancellable: false };
  // Acquisition must finish recording ownership before cleanup can close it.
  // Repeated signals must not kill an in-flight close command.
  const interrupt = () => {
    if (state.interrupted) return;
    state.interrupted = true;
    if (state.cancellable) cancelDriverCommands();
  };
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  try {
    const result = await work(state);
    checkCancellation(state);
    return result;
  } finally {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", interrupt);
  }
}

export async function doctor(options: Options): Promise<object> {
  return withCancellation(state => checkPrerequisites(options, state));
}

async function checkPrerequisites(options: Options, state: Cancellation): Promise<object> {
  checkCancellation(state);
  const driver = options.driver ?? "playwright";
  if (!["surf", "playwright", "tui", "gui"].includes(driver)) invalid("--driver must be surf, playwright, tui or gui");
  if (!Bun.which("mq")) throw new CliError("Collection requires installed mq; complete setup separately", 3);
  if (driver === "tui") return doctorTui();
  if (driver === "gui") return doctorGui(options.display && options.window ? { display: options.display, window: options.window, title: options.title ?? "" } : undefined);
  if (!Bun.which(driver === "surf" ? "surf" : "playwright-cli")) throw new CliError(`${driver} CLI is unavailable; install it separately before capture`, 3);
  const r = await sh(driver === "surf" ? ["surf", "doctor", "--json"] : ["playwright-cli", "--version"]);
  checkCancellation(state);
  if (r.code !== 0) throw new CliError(`${driver} prerequisite failed: ${r.err || r.out}`, 3);
  if (driver === "playwright") {
    const session = `ce-doctor-${randomUUID()}`;
    const browser = getDriver(driver);
    try {
      await browser.open(session);
    } catch (error) {
      checkCancellation(state);
      throw new CliError(`Playwright browser launch is unavailable. Configure an installed browser before capture: ${error instanceof Error ? error.message : String(error)}`, 3);
    } finally {
      await browser.close(session);
    }
    checkCancellation(state);
  }
  return { driver, available: true, attended: driver === "surf", diagnostic: r.out.trim(), video: driver === "surf" ? "unavailable" : "supported by playwright-cli" };
}

export async function initWorkspace(dir: string, options: Options): Promise<object> {
  const destination = await route(options);
  const driver = options.driver ?? "playwright";
  if (!["playwright", "surf", "tui", "gui"].includes(driver)) invalid("--driver must be surf, playwright, tui or gui");
  await outsideSource(dir, options.repository!);
  if (existsSync(dir)) invalid(`Working directory already exists: ${dir}`);
  if (options.dryRun) return { dryRun: true, directory: dir, destination };
  await mkdir(dir, { recursive: true });
  const planModule = join(import.meta.dir, "plan.ts");
  const scope = driver === "tui"
    ? `base: "terminal://private",\n  terminal: { command: [], cwd: ${JSON.stringify(resolve(options.repository!))}, columns: 80, rows: 24, font: "monospace:size=12", lineHeight: 20 },\n  approval: { origins: [], confirmations: [] },`
    : driver === "gui" ? `base: "gui://local",\n  gui: { display: "", window: "", title: "" },\n  approval: { origins: [], confirmations: [] },`
    : `base: "http://127.0.0.1:8090",\n  approval: { origins: ["http://127.0.0.1:8090"], confirmations: [] },`;
  await writeFile(join(dir, "plan.ts"), `import type { Plan } from ${JSON.stringify(planModule)};\n\nexport const plan: Plan = {\n  schema: "collect-evidence/v1", kind: "plan",\n  workId: ${JSON.stringify(options.workflow)}, driver: ${JSON.stringify(driver)},\n  ${scope}\n  tests: [],\n};\n`, { flag: "wx" });
  await writeFile(join(dir, "workspace.json"), json("event", { repository: resolve(options.repository!), workflow: options.workflow, runId: options.run, destination }));
  return { directory: dir, destination, next: "Author cases in plan.ts, then render and compile. Confirm the plan before run." };
}

async function editable(dir: string): Promise<void> {
  if (existsSync(join(dir, "run.json"))) invalid("Sealed runs are read-only; select a new run identity");
  const workspace = JSON.parse(await readFile(join(dir, "workspace.json"), "utf8"));
  if (workspace.schema !== schema || workspace.kind !== "event") invalid("Unsupported workspace schema");
  await outsideSource(dir, workspace.repository);
}

export async function renderWorkspace(dir: string, options: Options): Promise<object> {
  await editable(dir);
  const plan = await loadPlan(dir);
  if (options.dryRun) return { dryRun: true, tests: plan.tests.length };
  if (!options.force && existsSync(join(dir, "plan.json"))) invalid("Generated plan exists; use --force to replace it");
  await writeFile(join(dir, "plan.json"), json("plan", { id: plan.workId, data: plan }));
  await markdown(join(dir, "test-plan.md"), "plan", renderPlan(plan));
  return { directory: dir, tests: plan.tests.length };
}

export async function compileWorkspace(dir: string, options: Options): Promise<object> {
  await editable(dir);
  const plan = await loadPlan(dir);
  if (options.dryRun) return { dryRun: true, driver: plan.driver, tests: plan.tests.length };
  if (!options.force && existsSync(join(dir, "compiled.json"))) invalid("Generated compilation exists; use --force to replace it");
  await compileInto(dir, plan);
  await writeFile(join(dir, "compiled.json"), json("event", { planHash: digest(plan), driver: plan.driver }));
  return { directory: dir, driver: plan.driver, tests: plan.tests.length };
}

async function compileInto(dir: string, plan: Plan): Promise<void> {
  await mkdir(join(dir, "workflows"), { recursive: true });
  const driver = getDriver(plan.driver);
  for (const test of plan.tests) {
    for (const [name, content] of Object.entries(driver.compile(plan, test, join(dir, "report", "shots")))) {
      await writeFile(join(dir, "workflows", name), content);
    }
  }
}

export async function collect(dir: string, options: Options): Promise<object> {
  return withCancellation(state => collectWithCancellation(dir, options, state));
}

async function collectWithCancellation(dir: string, options: Options, state: Cancellation): Promise<object> {
  await editable(dir);
  const plan = await loadPlan(dir);
  const workspace = JSON.parse(await readFile(join(dir, "workspace.json"), "utf8"));
  const selected = { repository: workspace.repository, workflow: workspace.workflow, run: workspace.runId, ...Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)) };
  const destination = await route(selected);
  if (destination.path !== workspace.destination.path) invalid("Evidence route changed; initialize a new workspace explicitly");
  if (existsSync(destination.path)) invalid("Run identity already exists; select a new run (force cannot overwrite evidence)");
  const compiled = JSON.parse(await readFile(join(dir, "compiled.json"), "utf8"));
  if (compiled.schema !== schema || compiled.kind !== "event" || compiled.planHash !== digest(plan)) invalid("Plan changed or compilation is invalid; run compile --force");
  const tests = options.test ? plan.tests.filter(t => t.id === options.test) : plan.tests;
  if (!tests.length) invalid("No selected cases");
  if (options.dryRun) return { dryRun: true, destination, driver: plan.driver, tests: tests.map(t => t.id) };
  // GUI access failures become sealed blocked cases, with no substitute surface.
  const capability = plan.driver === "gui" ? { driver: "gui", checks: "Selected native permissions are checked per case", video: "unavailable" } : await checkPrerequisites({ driver: plan.driver }, state);
  checkCancellation(state);
  const version = plan.driver === "gui"
    ? { out: Bun.which("import") ? (await sh(["import", "-version"])).out.trim() || "unavailable" : "unavailable" }
    : await sh([plan.driver === "tui" ? "termscope" : plan.driver === "surf" ? "surf" : "playwright-cli", "--version"]);
  checkCancellation(state);
  const staging = await mkdtemp(join(tmpdir(), "collect-evidence-"));
  await outsideSource(staging, workspace.repository);
  const startedAt = new Date().toISOString();
  const driver = getDriver(plan.driver);
  // A unique session prevents cleanup from closing a borrowed browser.
  const session = driver.sessionName({ ...plan, workId: `ce-${randomUUID()}` });
  const records: Evidence[] = [];
  let opened = false;
  let published = false;
  try {
    await cp(join(dir, "plan.ts"), join(staging, "plan.ts"));
    await mkdir(join(staging, "report", "shots"), { recursive: true });
    await mkdir(join(staging, "runs"));
    if (plan.video) await mkdir(join(staging, "report", "videos"));
    await compileInto(staging, plan);
    checkCancellation(state);
    await driver.open(session, join(staging, "workflows"));
    opened = true;
    checkCancellation(state);
    state.cancellable = true;
    const blocked = new Map<string, string>();
    for (const id of new Set(tests.flatMap(t => t.requires ?? []))) {
      checkCancellation(state);
      const p = plan.preconditions?.find(p => p.id === id);
      const check = p ? await driver.checkPrecondition(plan, p, session) : { ok: false, detail: `Undeclared precondition ${id}` };
      if (!check.ok) blocked.set(id, check.detail);
    }
    for (const test of tests) {
      checkCancellation(state);
      const reason = (test.requires ?? []).map(id => blocked.get(id)).find(Boolean);
      if (reason) { records.push(blockedRecord(test, reason)); continue; }
      const run = await driver.runTest({ plan, test, workflowDir: join(staging, "workflows"), reportDir: join(staging, "report"), session });
      await writeFile(join(staging, "runs", `case-${test.id}.log`), run.raw);
      for (const record of run.records) {
        if (record.screenshot && !existsSync(join(staging, "report", record.screenshot))) invalid(`Missing expected screenshot for ${record.step}; native diagnostics are retained`);
      }
      records.push(...decideVerdict(test, run, join(staging, "report")).records);
    }
    state.cancellable = false;
    await driver.close(session);
    opened = false;
    checkCancellation(state);
    const finalized = await finalizeRun({ staging, destination: destination.path, plan: { ...plan, tests }, records, startedAt, finishedAt: new Date().toISOString(), driverVersion: version.out.trim(), runId: workspace.runId });
    published = true;
    if (state.interrupted) throw new CliError(`Collection was interrupted during finalization; sealed evidence is retained at ${destination.path}`, 1);
    return { destination, capability, finalized, verdicts: tests.map(t => ({ caseId: t.id, verdict: records.filter(r => r.test === t.id && r.verdict).at(-1)?.verdict ?? "PARTIAL" })) };
  } catch (error) {
    state.cancellable = false;
    console.error(published
      ? `Sealed evidence retained at ${destination.path}; the command did not complete`
      : `Incomplete capture retained at ${staging}`);
    if (!published) checkCancellation(state);
    throw error;
  } finally {
    state.cancellable = false;
    if (opened) await driver.close(session);
    if (published) await rm(staging, { recursive: true, force: true });
  }
}

export async function validate(dir: string): Promise<object> {
  return await validateRun(dir);
}

const escape = (text: unknown) => String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function reportRun(dir: string): Promise<{ runId: string; html: string; cases: object[]; verdicts: Array<{ caseId: string; verdict: string }> }> {
  const { run, plan, cases, records } = await validateRun(dir);
  const verdicts = cases.map(c => ({
    caseId: c.id,
    verdict: records.filter(r => r.test === c.id && r.verdict).at(-1)?.verdict || "PARTIAL",
  }));
  const sections: string[] = [];
  for (const [i, c] of cases.entries()) {
    const images: string[] = [];
    for (const asset of c.assets) {
      const bytes = await readFile(join(dir, asset.path));
      const media = asset.mediaType === "video/webm"
        ? `<video controls aria-label="Case ${escape(c.id)} recording" src="data:${asset.mediaType};base64,${bytes.toString("base64")}" width="${asset.width}" height="${asset.height}"></video>`
        : `<img alt="Step ${escape(asset.stepId)}, capture ${asset.captureSequence}" src="data:${asset.mediaType};base64,${bytes.toString("base64")}" width="${asset.width}" height="${asset.height}">`;
      images.push(`<figure>${media}<figcaption>${escape(asset.id)} · ${asset.width} × ${asset.height} · ${escape(asset.capturedAt ?? "Capture time unknown")}<br>Source: ${escape(asset.url)}${asset.terminal ? `<br>Terminal identity: <code>${escape(JSON.stringify(asset.terminal))}</code>` : ""}<br>SHA-256: <code>${asset.sha256}</code></figcaption></figure>`);
    }
    sections.push(`<section><h2>Case ${escape(c.id)}: ${escape(c.purpose)} — ${verdicts[i]!.verdict}</h2><p>Expected: ${escape(c.expected.pass)}</p><p>Failure: ${escape(c.expected.fail)}</p><ol>${c.steps.map(s => `<li>${escape(s.purpose)}<p>Observed: ${escape(s.observed.join("; ") || "Not executed")}</p><p>Assertion: ${s.assertionResult}</p></li>`).join("")}</ol>${c.errors.map(e => `<p>${escape(e.category)}: ${escape(e.message)}</p>`).join("")}${images.join("\n")}<p>Limits: ${escape(c.limits.join("; ") || "None recorded")}</p><p>Side effects: ${escape(Array.isArray(c.sideEffects) ? c.sideEffects.join("; ") : c.sideEffects)}</p></section>`);
  }
  return { runId: run.id, html: `<!doctype html><html lang="en"><meta charset="utf-8"><title>Evidence ${escape(run.id)}</title><style>body{font:16px system-ui;max-width:1000px;margin:32px auto;padding:16px}img{max-width:100%;height:auto}section{border-top:1px solid;padding-block:16px}code{overflow-wrap:anywhere}figcaption{font-size:14px}</style><body><h1>Evidence ${escape(run.id)}</h1><p>Driver: ${escape(plan.driver)} · ${escape(run.driverVersion)}</p><p>Capture status and assertions are separate. A screenshot does not prove a passing assertion.</p>${sections.join("\n")}<h2>Cleanup</h2><p>The collector closed only its owned driver session before finalization. Publication is separate.</p></body></html>`, cases, verdicts };
}

export async function generatedComment(dir: string, url: string | undefined, title?: string): Promise<object> {
  if (!url || !/^https?:\/\//.test(url)) invalid("--url must identify the explicitly published report");
  const { plan } = await validateRun(dir);
  return { markdown: `---\nschema: ${schema}\nkind: comment\n---\n${renderComment(planJson(plan), url, title)}` };
}
