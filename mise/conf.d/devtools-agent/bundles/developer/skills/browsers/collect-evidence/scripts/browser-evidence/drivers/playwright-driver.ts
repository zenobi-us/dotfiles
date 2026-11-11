/**
 * The playwright-cli driver.
 *
 * The compiled script drives the browser AND pushes one evidence record per
 * step, so the runner never transcribes anything. Screenshots are always
 * emitted before the assertion that can throw, which is what keeps a FAIL
 * carrying images.
 */
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import type { Evidence, Plan, Precondition, Step, Test } from "../plan.ts";
import { approvedUrl, safetyCode, driverStep, humanStep, shotPath, stepNumber, videoPath } from "../plan.ts";
import { CliError, sh, type ShResult } from "../sh.ts";
import type { DriverRun } from "../verdict.ts";
import type { Driver, RunContext } from "./driver.ts";

const q = (s: string) => JSON.stringify(s);
const DEFAULT_EXPECT_MS = 5000;
const env = (session: string) => ({ PLAYWRIGHT_CLI_SESSION: session, NO_UPDATE_NOTIFIER: "1" });
const ownedSessions = new Set<string>();
async function checked(cmd: string[], session: string): Promise<string> {
 const result = await sh(cmd, env(session));
 if (result.code !== 0 || /^### Error/m.test(result.out)) throw new Error(`${cmd[1]} failed: ${result.err || result.out}`);
 return result.out;
}

/** `getByRole('link', { name: 'x' })` -> `page.getByRole(...)`; CSS -> `page.locator(...)`. */
function loc(expr: string): string {
 return /^(getBy|locator\(|frameLocator\()/.test(expr)
  ? `page.${expr}`
  : `page.locator(${q(expr)})`;
}

/** A thrown message, JSON-encoded so any quote in a locator stays inside the string. */
const fail = (step: string, detail: string) => q(`ASSERT FAIL ${step}: ${detail}`);

function playwrightStep(t: Test, s: Step, i: number, plan: Plan): string[] {
 const step = stepNumber(t.id, i);
 const shot = s.shot ? shotPath(t.id, i, s.shot) : "";
 const says = humanStep(s);
 const how = driverStep(s, plan.base).replace(/`/g, "");
 const out: string[] = says && says !== how
  ? [`  // ${step} ${says}`, `  //     ${how}`]
  : [`  // ${step} ${says ?? how}`];
 out.push(`  CURRENT = ${q(step)}; lastCapture = {}; captureFailed = false; assertionPassed = false;`);
 out.push(`  if (nativePrompt) throw new Error(nativePrompt);`);
 out.push(`  await page.evaluate(() => ${safetyCode(plan, step, s.do === "click" || (s.do === "press" && (/(?:^|[+ ])(?:Enter|Space|Spacebar)$/i.test(s.key) || s.key === " ")), s.do === "navigate" ? s.to : undefined)});`);

 const push = (action: string, target: string, resolved: string, observed: string, verdict = "", note = "") =>
  `  if (nativePrompt) throw new Error(nativePrompt); E.push({ test: ${q(t.id)}, step: ${q(step)}, action: ${q(action)}, target: ${q(target)}, ` +
  `resolved: ${resolved}, url: page.url(), screenshot: '', ...lastCapture, observed: ${observed}, ` +
  `verdict: ${q(verdict)}, note: ${q(note)}, assertionPassed: ${s.do === "expect"} });`;

 const snap = shot ? `  lastCapture = await capture(${q(shot)}, 1);` : "";

 switch (s.do) {
  case "navigate": {
   out.push(`  await page.goto(${q(approvedUrl(plan, s.to))});`);
   out.push(`  await page.evaluate(() => ${safetyCode(plan, step)});`);
   if (snap) out.push(snap);
   out.push(push("navigate", s.to, q(""), q("Page loaded.")));
   break;
  }
  case "click": {
   out.push(`  { const L = ${loc(s.locator)};`);
   out.push(`    const R = await resolve(L);`);
   out.push(`    await L.click();`);
   out.push(`    await page.evaluate(() => ${safetyCode(plan, step)});`);
   if (snap) out.push(`  ${snap.trim()}`);
   out.push(`  ${push("click", s.locator, "R", q("Clicked.")).trim()} }`);
   break;
  }
  case "fill": {
   out.push(`  { const L = ${loc(s.locator)};`);
   out.push(`    const R = await resolve(L);`);
   out.push(`    if (await L.evaluate(e => e.type === 'password' || /username|password|one-time-code/.test(e.autocomplete || ''))) throw new Error(${q(`SAFETY STOP ${step}: credential input`)});`);
   out.push(`    await L.fill(${q(s.text)});`);
   if (snap) out.push(`  ${snap.trim()}`);
   out.push(`  ${push("type", s.locator, "R", q("Typed.")).trim()} }`);
   break;
  }
  case "capture": {
   const read = s.attr
    ? `await L.getAttribute(${q(s.attr)})`
    : `(await L.textContent() || '').trim()`;
   out.push(`  { const L = ${loc(s.locator)};`);
   out.push(`    const V = ${read};`);
   out.push(`    CAP[${q(s.as)}] = V;`);
   if (snap) out.push(`  ${snap.trim()}`);
   out.push(`  ${push("read", s.locator, "String(V)", `${q("Read: ")} + String(V)`).trim()} }`);
   break;
  }
  case "expect": {
   const ms = s.timeoutMs ?? DEFAULT_EXPECT_MS;
   // A failed check still leaves an image: settle() shoots before it rethrows.
   const shotArg = q(shot);
   if (s.url) {
    out.push(`  { const U = await settle(async () => { const U = page.url();`);
    out.push(`    if (!new RegExp(${q(s.url)}).test(U)) throw new Error(${fail(step, `expected URL to match ${s.url}, got `)} + U);`);
    out.push(`    return U; }, ${ms}, ${shotArg});`);
    out.push(`  ${push("assert", `url ~ ${s.url}`, "U", `${q("URL matched: ")} + U`).trim()} }`);
   } else if (s.visible === false) {
    out.push(`  { const L = ${loc(s.locator!)};`);
    out.push(`    await settle(async () => { if (await L.count() > 0) throw new Error(${fail(step, `${s.locator} was present and should not be`)}); }, ${ms}, ${shotArg});`);
    out.push(`  ${push("assert", `absent ${s.locator}`, q(s.locator!), q("Absent, as required.")).trim()} }`);
   } else {
    out.push(`  { const L = ${loc(s.locator!)};`);
    out.push(`    const T = await settle(async () => {`);
    out.push(`      if (await L.count() === 0) throw new Error(${fail(step, `${s.locator} not found`)});`);
    out.push(`      const T = (await L.first().textContent() || '').trim();`);
    if (s.text) {
     out.push(`      if (!T.includes(${q(s.text)})) throw new Error(${fail(step, `expected "${s.text}", got "`)} + T + '"');`);
    }
    out.push(`      return T; }, ${ms}, ${shotArg});`);
    out.push(`    const R = await resolve(L.first());`);
    out.push(`  ${push("assert", s.locator!, "R", s.text ? `${q("Found text: ")} + T` : q("Present, as required.")).trim()} }`);
   }
   break;
  }
  case "wait": {
   const ms = s.timeoutMs ?? 30000;
   out.push(`  { const L = ${loc(s.locator)};`);
   if (s.gone) {
    out.push(`    await L.first().waitFor({ state: 'detached', timeout: ${ms} });`);
    if (snap) out.push(`  ${snap.trim()}`);
    out.push(`  ${push("wait", `gone ${s.locator}`, q(s.locator), q("Gone.")).trim()} }`);
   } else {
    out.push(`    await L.first().waitFor({ state: 'attached', timeout: ${ms} });`);
    out.push(`    const R = await resolve(L.first());`);
    if (snap) out.push(`  ${snap.trim()}`);
    out.push(`  ${push("wait", s.locator, "R", q("Rendered.")).trim()} }`);
   }
   break;
  }
  case "scroll": {
   out.push(`  { const L = ${loc(s.locator)}.first();`);
   out.push(`    await L.scrollIntoViewIfNeeded();`);
   out.push(`    const R = await resolve(L);`);
   if (snap) out.push(`  ${snap.trim()}`);
   out.push(`  ${push("scroll", s.locator, "R", q("Scrolled into view.")).trim()} }`);
   break;
  }
  case "press": {
   out.push(`  await page.keyboard.press(${q(s.key)});`);
   if (snap) out.push(snap);
   out.push(push("press", s.key, q(""), q(`Pressed ${s.key}.`)));
   break;
  }
  case "human": {
   if (snap) out.push(snap);
   out.push(push("assert", "human step", q(""), q("Driver cannot complete this step."), "PARTIAL", s.needs));
   out.push(`  return { records: E };`);
   break;
  }
 }
 return out;
}

export function compilePlaywright(plan: Plan, t: Test, shotsDir: string): string {
 const body = t.steps.flatMap((s, i) => playwrightStep(t, s, i, plan));
 return `// ${plan.workId}-test-${t.id}.js
// Test ${t.id} - ${t.claim}
// PASS: ${t.pass}
// FAIL: ${t.fail}
// Generated from plan.ts. Edit the plan, not this file.
// Run: playwright-cli run-code --filename=<abs path to this file>
async (page) => {
  const BASE = ${q(plan.base)};
  const SHOTS = ${q(shotsDir)};
  const E = [];
  const CAP = {};
  let CURRENT = ${q(`${t.id}.1`)};
  let lastCapture = {};
  let nativePrompt = '';
  let captureFailed = false;
  let assertionPassed = false;
  const onDialog = async (dialog) => {
    nativePrompt = 'SAFETY STOP ' + CURRENT + ': native ' + dialog.type() + ' dialog; human handling required';
    await dialog.dismiss().catch(() => {});
  };
  page.on('dialog', onDialog);
  const capture = async (shot, sequence) => {
    if (nativePrompt) throw new Error(nativePrompt);
    try { await page.screenshot({ path: SHOTS + '/' + shot.replace(/^shots\\//, '') }); }
    catch (error) { captureFailed = true; throw error; }
    const capturedAt = new Date().toISOString();
    const viewport = await page.evaluate(() => ({width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio}));
    return { screenshot: shot, capturedAt, viewport, captureSequence: sequence };
  };
  const resolve = async (L) => { try { return await L.evaluate(e => e.outerHTML.slice(0, 120)); } catch { return String(L); } };
  const until = async (check, ms) => {
    const t0 = Date.now();
    for (;;) {
      try { return await check(); }
      catch (e) { if (Date.now() - t0 > ms) throw e; await new Promise((r) => setTimeout(r, 200)); }
    }
  };
  const settle = async (check, ms, shot) => {
    if (shot) {
      lastCapture = await capture(shot, 1);
      E.push({test:${q(t.id)},step:CURRENT,action:'capture',target:'pre-assertion',resolved:'',url:page.url(),...lastCapture,observed:'Captured before expect.',verdict:'',note:''});
    }
    const value = await until(check, ms);
    assertionPassed = true;
    if (shot) lastCapture = await capture(shot.replace('--capture-001.', '--capture-002.'), 2);
    return value;
  };

  try {
${body.join("\n")}

    return { records: E };
  } catch (error) {
    const message = nativePrompt || String(error?.message || error);
    return { records: E, failure: { step: CURRENT, message, blocked: message.includes('SAFETY STOP'), captureFailed, assertionPassed } };
  }
  finally { page.off('dialog', onDialog); }
}`;
}

/** Recover the failing step id from the driver's output, or blame the last step. */
export function failureFromOutput(t: Test, output: string): NonNullable<DriverRun["failure"]> {
 const message = output.match(/(?:ASSERT FAIL|SAFETY STOP)[^\n]*/)?.[0] ?? output.trim().split("\n")[0] ?? "";
 const step = message.match(/(?:ASSERT FAIL|SAFETY STOP) ([A-Za-z0-9_-]+\.\d+)/)?.[1] ?? `${t.id}.${t.steps.length}`;
 return { step, message, blocked: message.includes("SAFETY STOP") };
}

export const playwrightDriver: Driver = {
 name: "playwright",
 attended: false,

 scriptName: (plan, testId) => `${plan.workId}-test-${testId}.js`,

 compile(plan, test, shotsDir) {
  return { [this.scriptName(plan, test.id)]: compilePlaywright(plan, test, shotsDir) };
 },

 sessionName: (plan) => plan.workId,

 async open(session) {
  const listed = await sh(["playwright-cli", "list"], { NO_UPDATE_NOTIFIER: "1" });
  if (listed.code !== 0 || /^### Error/m.test(listed.out)) throw new Error(`Cannot inspect playwright sessions: ${listed.err || listed.out}`);
  if (new RegExp(`^- ${session.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`, "m").test(listed.out)) {
   throw new CliError(`Refusing existing playwright session: ${session}`, 3);
  }
  await checked(["playwright-cli", "open", "about:blank"], session);
  ownedSessions.add(session);
 },

 async checkPrecondition(plan: Plan, p: Precondition, session: string) {
  if (!ownedSessions.has(session)) return { ok: false, detail: `Playwright session is not owned: ${session}` };
  if (!p.check.locator) return { ok: true, detail: `${p.desc} (declared, not machine-checked)` };
  try {
   await checked(["playwright-cli", "--raw", "run-code", `async page => page.evaluate(() => ${safetyCode(plan, `precondition:${p.id}`)})`], session);
   if (p.check.goto) {
    await checked(["playwright-cli", "goto", approvedUrl(plan, p.check.goto)], session);
   }
   const code = `async page => { await page.evaluate(() => ${safetyCode(plan, `precondition:${p.id}`)}); const L = page.locator(${q(p.check.locator)}); ` +
    `try { await L.first().waitFor({ state: 'attached', timeout: ${p.check.timeoutMs ?? DEFAULT_EXPECT_MS} }); } catch {} ` +
    `if (await L.count() === 0) return { ok: false, got: 'absent' }; ` +
    `const t = (await L.first().textContent() || '').trim(); ` +
    `return { ok: ${p.check.text ? `t.includes(${q(p.check.text)})` : "true"}, got: t }; }`;
   const r = await sh(["playwright-cli", "--raw", "run-code", code], env(session));
   if (r.code !== 0 || /^### Error/m.test(r.out)) return { ok: false, detail: `${p.desc} — driver check failed` };
   try {
    const v = JSON.parse(r.out.trim());
    return { ok: Boolean(v.ok), detail: `${p.desc} — found ${JSON.stringify(v.got).slice(0, 200)}` };
   } catch {
    return { ok: false, detail: `${p.desc} — check did not return a value` };
   }
  } catch (error) {
   return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
 },

 async runTest(ctx: RunContext): Promise<DriverRun> {
  if (!ownedSessions.has(ctx.session)) return { records: [], failure: { step: `${ctx.test.id}.1`, message: `Playwright session is not owned: ${ctx.session}`, blocked: true }, raw: "", attempts: 0 };
  const script = join(ctx.workflowDir, this.scriptName(ctx.plan, ctx.test.id));
  const videoFile = join(ctx.reportDir, videoPath(ctx.test.id));
  const videoResults: Array<ShResult & { phase: "start" | "stop" }> = [];
  let recording = false;
  if (ctx.plan.video) {
   const start = await sh(["playwright-cli", "video-start", videoFile], env(ctx.session));
   videoResults.push({ phase: "start", ...start });
   recording = start.code === 0 && !/^### Error/m.test(start.out);
  }
  const r = await sh(["playwright-cli", "--raw", "run-code", `--filename=${script}`], env(ctx.session));
  if (recording) videoResults.push({ phase: "stop", ...await sh(["playwright-cli", "video-stop"], env(ctx.session)) });
  for (const result of videoResults) {
   await writeFile(`${videoFile}.${result.phase}.stdout.log`, result.out, { flag: "wx" });
   await writeFile(`${videoFile}.${result.phase}.stderr.log`, result.err, { flag: "wx" });
  }
  const unavailable = videoResults.find(result => result.code !== 0 || /^### Error/m.test(result.out));
  if (unavailable) {
   await writeFile(videoFile + ".unavailable.json", JSON.stringify({
    schema: "collect-evidence/v1", kind: "error", id: `${ctx.test.id}.video-unavailable`,
    category: "capture", message: "Optional video is unavailable; native command diagnostics are preserved.",
    phase: unavailable.phase, exitCode: unavailable.code,
   }) + "\n", { flag: "wx" });
  } else if (recording) {
   await writeFile(videoFile + ".metadata.json", JSON.stringify({
    schema: "collect-evidence/v1", kind: "asset", capturedAt: new Date().toISOString(),
   }) + "\n", { flag: "wx" });
  }
  let records: Evidence[] = [];
  let failure: DriverRun["failure"];
  try {
   const value = JSON.parse(r.out.trim()) as { records: Evidence[]; failure?: DriverRun["failure"] };
   if (!Array.isArray(value.records)) throw new Error("Missing driver records");
   records = value.records;
   failure = value.failure;
  } catch {
   failure = failureFromOutput(ctx.test, r.out + r.err);
  }
  const raw = r.out + r.err;
  return {
   records,
   failure: failure ?? (r.code !== 0 || /^### Error/m.test(r.out) ? failureFromOutput(ctx.test, raw) : undefined),
   raw,
   attempts: 1,
  };
 },

 async close(session) {
  if (!ownedSessions.has(session)) return;
  await checked(["playwright-cli", "close"], session);
  ownedSessions.delete(session);
 },

 cleanupRow: (session) => ({
  item: `Driver session <code class="code">${session}</code>`,
  state: "In-memory profile, closed at the end of the run",
  action: `<strong>Nothing to undo.</strong> Confirm with <code class="code">playwright-cli list</code>.`,
 }),
};
