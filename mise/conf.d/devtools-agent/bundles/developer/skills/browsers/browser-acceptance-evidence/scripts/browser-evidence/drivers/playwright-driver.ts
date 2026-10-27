/**
 * The playwright-cli driver.
 *
 * The compiled script drives the browser AND pushes one evidence record per
 * step, so the runner never transcribes anything. Screenshots are always
 * emitted before the assertion that can throw, which is what keeps a FAIL
 * carrying images.
 */
import { join } from "node:path";
import type { Evidence, Plan, Precondition, Step, Test } from "../plan.ts";
import { driverStep, humanStep, shotPath, stepNumber } from "../plan.ts";
import { sh } from "../sh.ts";
import type { DriverRun } from "../verdict.ts";
import type { Driver, RunContext } from "./driver.ts";

const q = (s: string) => JSON.stringify(s);
const DEFAULT_EXPECT_MS = 5000;
const env = (session: string) => ({ PLAYWRIGHT_CLI_SESSION: session, NO_UPDATE_NOTIFIER: "1" });

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

  const push = (action: string, target: string, resolved: string, observed: string, verdict = "", note = "") =>
    `  E.push({ test: ${q(t.id)}, step: ${q(step)}, action: ${q(action)}, target: ${q(target)}, ` +
    `resolved: ${resolved}, url: page.url(), screenshot: ${q(shot)}, observed: ${observed}, ` +
    `verdict: ${q(verdict)}, note: ${q(note)} });`;

  const snap = shot ? `  await page.screenshot({ path: SHOTS + ${q("/" + shot.replace(/^shots\//, ""))} });` : "";

  switch (s.do) {
    case "navigate": {
      out.push(`  await page.goto(${s.to.startsWith("http") ? q(s.to) : "BASE + " + q(s.to)});`);
      if (snap) out.push(snap);
      out.push(push("navigate", s.to, q(""), q("Page loaded.")));
      break;
    }
    case "click": {
      out.push(`  { const L = ${loc(s.locator)};`);
      out.push(`    const R = await resolve(L);`);
      out.push(`    await L.click();`);
      if (snap) out.push(`  ${snap.trim()}`);
      out.push(`  ${push("click", s.locator, "R", q("Clicked.")).trim()} }`);
      break;
    }
    case "fill": {
      out.push(`  { const L = ${loc(s.locator)};`);
      out.push(`    const R = await resolve(L);`);
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
      const shotArg = shot ? q("/" + shot.replace(/^shots\//, "")) : "''";
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
    case "human": {
      if (snap) out.push(snap);
      out.push(push("assert", "human step", q(""), q("Driver cannot complete this step."), "PARTIAL", s.needs));
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
  const resolve = async (L) => { try { return await L.evaluate(e => e.outerHTML.slice(0, 120)); } catch { return String(L); } };
  const until = async (check, ms) => {
    const t0 = Date.now();
    for (;;) {
      try { return await check(); }
      catch (e) { if (Date.now() - t0 > ms) throw e; await new Promise((r) => setTimeout(r, 200)); }
    }
  };
  const settle = async (check, ms, shot) => {
    try {
      const v = await until(check, ms);
      if (shot) await page.screenshot({ path: SHOTS + shot });
      return v;
    } catch (e) {
      if (shot) await page.screenshot({ path: SHOTS + shot }).catch(() => {});
      throw e;
    }
  };

${body.join("\n")}

  return E;
}`;
}

/** Recover the failing step id from the driver's output, or blame the last step. */
export function failureFromOutput(t: Test, output: string): { step: string; message: string } {
  const message = output.match(/ASSERT FAIL[^\n]*/)?.[0] ?? output.trim().split("\n")[0] ?? "";
  const step = message.match(/ASSERT FAIL (\d+\.\d+)/)?.[1] ?? `${t.id}.${t.steps.length}`;
  return { step, message };
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
    const open = new RegExp(`^- ${session.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\n\\s+- status: open`, "m");
    if (open.test(listed.out)) return;
    await sh(["playwright-cli", "open", "about:blank"], env(session));
  },

  async checkPrecondition(plan: Plan, p: Precondition, session: string) {
    if (!p.check.locator) return { ok: true, detail: `${p.desc} (declared, not machine-checked)` };
    if (p.check.goto) {
      await sh(["playwright-cli", "goto", p.check.goto.startsWith("http") ? p.check.goto : plan.base + p.check.goto], env(session));
    }
    const code = `async page => { const L = page.locator(${q(p.check.locator)}); ` +
      `if (await L.count() === 0) return { ok: false, got: 'absent' }; ` +
      `const t = (await L.first().textContent() || '').trim(); ` +
      `return { ok: ${p.check.text ? `t.includes(${q(p.check.text)})` : "true"}, got: t }; }`;
    const r = await sh(["playwright-cli", "--raw", "run-code", code], env(session));
    try {
      const v = JSON.parse(r.out.trim());
      return { ok: Boolean(v.ok), detail: `${p.desc} — found ${JSON.stringify(v.got).slice(0, 200)}` };
    } catch {
      return { ok: false, detail: `${p.desc} — check did not return a value` };
    }
  },

  async runTest(ctx: RunContext): Promise<DriverRun> {
    const script = join(ctx.workflowDir, this.scriptName(ctx.plan, ctx.test.id));
    const r = await sh(["playwright-cli", "--raw", "run-code", `--filename=${script}`], env(ctx.session));
    let records: Evidence[] = [];
    try {
      records = JSON.parse(r.out.trim());
    } catch {
      // A throw prints the error instead of the array. Keep what the plan knows.
    }
    const raw = r.out + r.err;
    return {
      records,
      failure: r.code === 0 ? undefined : failureFromOutput(ctx.test, raw),
      raw,
      attempts: 1,
    };
  },

  async close(session) {
    await sh(["playwright-cli", "close"], env(session));
  },

  cleanupRow: (session) => ({
    item: `Driver session <code class="code">${session}</code>`,
    state: "In-memory profile, closed at the end of the run",
    action: `<strong>Nothing to undo.</strong> Confirm with <code class="code">playwright-cli list</code>.`,
  }),
};
