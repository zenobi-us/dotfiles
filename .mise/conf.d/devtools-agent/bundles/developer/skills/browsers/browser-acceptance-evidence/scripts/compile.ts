/**
 * Plan -> driver script.
 *
 * The emitted script drives the browser AND pushes one evidence record per
 * step, so the runner never transcribes anything. Screenshots are always
 * emitted before the assertion that can throw, which is what keeps a FAIL
 * carrying images.
 */
import type { Plan, Step, Test } from "./plan.ts";
import { shotPath, stepNumber, stepText } from "./plan.ts";

const q = (s: string) => JSON.stringify(s);

/** `getByRole('link', { name: 'x' })` -> `page.getByRole(...)`; CSS -> `page.locator(...)`. */
function loc(expr: string): string {
  return /^(getBy|locator\(|frameLocator\()/.test(expr)
    ? `page.${expr}`
    : `page.locator(${q(expr)})`;
}

function playwrightStep(t: Test, s: Step, i: number, plan: Plan): string[] {
  const step = stepNumber(t.id, i);
  const shot = s.shot ? shotPath(t.id, i, s.shot) : "";
  const text = stepText(s, plan.base);
  const out: string[] = [`  // ${step} ${text}`];

  const push = (action: string, target: string, resolved: string, observed: string, verdict = "", note = "") =>
    `  E.push({ test: ${q(t.id)}, step: ${q(step)}, action: ${q(action)}, target: ${q(target)}, ` +
    `resolved: ${resolved}, url: page.url(), screenshot: ${q(shot)}, observed: ${observed}, ` +
    `verdict: ${q(verdict)}, note: ${q(note)} });`;

  const snap = shot ? `  await page.screenshot({ path: SHOTS + ${q("/" + shot.replace(/^shots\//, ""))} });` : "";

  switch (s.do) {
    case "navigate": {
      const url = s.to.startsWith("http") ? s.to : "BASE + " + q(s.to);
      out.push(`  await page.goto(${s.to.startsWith("http") ? q(s.to) : url});`);
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
      // The shot comes first: a throw below must still leave an image behind.
      if (snap) out.push(snap);
      if (s.url) {
        out.push(`  { const U = page.url();`);
        out.push(`    if (!new RegExp(${q(s.url)}).test(U)) throw new Error('ASSERT FAIL ' + ${q(step)} + ': expected URL to match ${s.url}, got ' + U);`);
        out.push(`  ${push("assert", `url ~ ${s.url}`, "U", `${q("URL matched: ")} + U`).trim()} }`);
      } else if (s.visible === false) {
        out.push(`  { const L = ${loc(s.locator!)};`);
        out.push(`    if (await L.count() > 0) throw new Error('ASSERT FAIL ' + ${q(step)} + ': ${s.locator} was present and should not be');`);
        out.push(`  ${push("assert", `absent ${s.locator}`, q(s.locator!), q("Absent, as required.")).trim()} }`);
      } else {
        out.push(`  { const L = ${loc(s.locator!)};`);
        out.push(`    const R = await resolve(L);`);
        out.push(`    if (await L.count() === 0) throw new Error('ASSERT FAIL ' + ${q(step)} + ': ${s.locator} not found');`);
        if (s.text) {
          out.push(`    const T = (await L.textContent() || '').trim();`);
          out.push(`    if (!T.includes(${q(s.text)})) throw new Error('ASSERT FAIL ' + ${q(step)} + ': expected "${s.text}", got "' + T + '"');`);
          out.push(`  ${push("assert", s.locator!, "R", `${q("Found text: ")} + T`).trim()} }`);
        } else {
          out.push(`  ${push("assert", s.locator!, "R", q("Present, as required.")).trim()} }`);
        }
      }
      break;
    }
    case "wait": {
      out.push(`  { const L = ${loc(s.locator)};`);
      out.push(`    await L.first().waitFor({ state: 'attached', timeout: ${s.timeoutMs ?? 30000} });`);
      out.push(`    const R = await resolve(L.first());`);
      if (snap) out.push(`  ${snap.trim()}`);
      out.push(`  ${push("wait", s.locator, "R", q("Rendered.")).trim()} }`);
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

${body.join("\n")}

  return E;
}`;
}

export function compileSurf(plan: Plan, t: Test, shotsDir: string): string {
  const steps: unknown[] = [];
  t.steps.forEach((s, i) => {
    const step = stepNumber(t.id, i);
    const shot = s.shot ? shotPath(t.id, i, s.shot) : "";
    const snap = () => {
      if (shot) steps.push({ tool: "screenshot", args: { output: `%{shots}/${shot.replace(/^shots\//, "")}` } });
    };
    switch (s.do) {
      case "navigate":
        steps.push({ tool: "navigate", args: { url: s.to.startsWith("http") ? s.to : `%{base}${s.to}` } });
        steps.push({ tool: "wait.load", args: {} });
        snap();
        break;
      case "click":
        steps.push({ tool: "click", args: { selector: s.locator } });
        steps.push({ tool: "wait.load", args: {} });
        snap();
        break;
      case "fill":
        steps.push({ tool: "type", args: { text: s.text, into: s.locator, clear: true } });
        snap();
        break;
      case "capture":
        steps.push({
          tool: "js",
          args: { code: surfRead(s.locator, s.attr, step) },
          as: s.as,
        });
        snap();
        break;
      case "expect":
        // Shot first: a throw below must still leave an image behind.
        snap();
        steps.push({ tool: "js", args: { code: surfAssert(s, step) }, as: `assert_${step.replace(".", "_")}` });
        break;
      case "wait":
        steps.push({
          tool: "wait.element",
          args: { selector: s.locator, timeout: s.timeoutMs ?? 30000 },
        });
        snap();
        break;
      case "scroll":
        steps.push({
          tool: "js",
          args: { code: surfScroll(s.locator, step) },
          as: `scroll_${step.replace(".", "_")}`,
        });
        snap();
        break;
      case "human":
        snap();
        break;
    }
  });
  return JSON.stringify(
    {
      name: `${plan.workId}-test-${t.id}`,
      description: `Test ${t.id} - ${t.claim}`,
      args: {
        base: { required: true, desc: "App base URL" },
        shots: { required: true, desc: "Absolute directory for evidence screenshots" },
      },
      steps,
    },
    null,
    2,
  );
}

function surfScroll(locator: string, step: string): string {
  return `(function(){var e=document.querySelector(${q(locator)});if(!e)throw new Error('ASSERT FAIL ${step}: ${locator} not found');e.scrollIntoView({block:'center'});return 'scrolled';})()`;
}

function surfRead(locator: string, attr: string | undefined, step: string): string {
  const read = attr ? `e.getAttribute(${q(attr)})` : `e.innerText.trim()`;
  return `(function(){var e=document.querySelector(${q(locator)});if(!e)throw new Error('ASSERT FAIL ${step}: ${locator} not found');return ${read};})()`;
}

function surfAssert(s: Extract<Step, { do: "expect" }>, step: string): string {
  if (s.url) {
    return `(function(){var u=location.href;if(!new RegExp(${q(s.url)}).test(u))throw new Error('ASSERT FAIL ${step}: expected URL to match ${s.url}, got '+u);return u;})()`;
  }
  if (s.visible === false) {
    return `(function(){if(document.querySelector(${q(s.locator!)}))throw new Error('ASSERT FAIL ${step}: ${s.locator} was present and should not be');return 'absent';})()`;
  }
  if (s.text) {
    return `(function(){var e=document.querySelector(${q(s.locator!)});if(!e)throw new Error('ASSERT FAIL ${step}: ${s.locator} not found');var t=e.innerText.trim();if(t.indexOf(${q(s.text)})<0)throw new Error('ASSERT FAIL ${step}: expected ${s.text}, got '+t);return t;})()`;
  }
  return `(function(){var e=document.querySelector(${q(s.locator!)});if(!e)throw new Error('ASSERT FAIL ${step}: ${s.locator} not found');return 'present';})()`;
}
