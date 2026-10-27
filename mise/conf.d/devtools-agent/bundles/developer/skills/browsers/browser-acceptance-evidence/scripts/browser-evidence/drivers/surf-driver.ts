/**
 * The surf driver: a real, visible Chrome through the surf extension.
 *
 * A surf workflow cannot build evidence records the way a playwright script
 * does. It returns only a status per workflow step and the values its `as`
 * steps captured. So `compile` writes two files per test: the workflow, and a
 * step map that says which workflow steps belong to which plan step. `runTest`
 * rebuilds the records from the map and the `--json` output, and captures
 * `location.href` after every navigate and click so each record carries the
 * page it was taken on.
 *
 * Surf has no working assertion keyword (`expect`, `when`, `retry` and
 * friends are accepted and ignored), so every assertion is a `js` step that
 * throws. Each one polls, because a list that refetches after an action is
 * not wrong for being a moment late.
 *
 * The traps behind these choices are in references/drivers/surf-cli.md.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Evidence, Plan, Precondition, Step, Test } from "../plan.ts";
import { shotPath, stepNumber } from "../plan.ts";
import { sh } from "../sh.ts";
import type { DriverRun } from "../verdict.ts";
import type { Driver, RunContext } from "./driver.ts";

const q = (s: string) => JSON.stringify(s);
const DEFAULT_EXPECT_MS = 5000;
const POLL_MS = 200;
/** A navigate that never sees a load event; surf's own trap, retried once. */
const MAX_ATTEMPTS = 2;

/** Which workflow steps (by index) one plan step compiled to. */
export type StepMapEntry = {
  step: string;
  kind: Step["do"];
  target: string;
  /** Index of the first workflow step, 0-based. */
  from: number;
  count: number;
  shot: string;
  /** The `vars` key holding this step's resolved value, if any. */
  value?: string;
  /** The `vars` key holding `location.href` after this step, if any. */
  url?: string;
  /** For an `expect`: which kind of check, so the caption matches the playwright driver. */
  check?: "url" | "absent" | "text" | "present";
  needs?: string;
};

export type SurfRunJson = {
  status: string;
  completedSteps?: number;
  totalSteps?: number;
  results: Array<{ step: number; cmd: string; status: string; error?: string }>;
  error?: string;
  vars?: Record<string, unknown>;
};

type WorkflowStep = { tool: string; args: Record<string, unknown>; as?: string };

const varKey = (prefix: string, step: string) => `${prefix}_${step.replace(/\./g, "_")}`;

/** `ASSERT FAIL <step>: <detail>` as a JS string literal, safe for any locator. */
const fail = (step: string, detail: string) => q(`ASSERT FAIL ${step}: ${detail}`);

/**
 * A js step that retries `body` until it returns or `ms` runs out. `body` is a
 * function body that throws on failure and returns the value to keep.
 */
function poll(body: string, ms: number): string {
  return `new Promise(function(res,rej){var t0=Date.now();(function tick(){` +
    `try{res((function(){${body}})());}catch(e){if(Date.now()-t0>${ms})rej(e);else setTimeout(tick,${POLL_MS});}` +
    `})();})`;
}

const once = (body: string) => `(function(){${body}})()`;
const find = (locator: string, step: string) =>
  `var e=document.querySelector(${q(locator)});if(!e)throw new Error(${fail(step, `${locator} not found`)});`;

function expectBody(s: Extract<Step, { do: "expect" }>, step: string): string {
  if (s.url) {
    return `var u=location.href;if(!new RegExp(${q(s.url)}).test(u))throw new Error(${fail(step, `expected URL to match ${s.url}, got `)}+u);return u;`;
  }
  if (s.visible === false) {
    return `if(document.querySelector(${q(s.locator!)}))throw new Error(${fail(step, `${s.locator} was present and should not be`)});return 'absent';`;
  }
  if (s.text) {
    return `${find(s.locator!, step)}var t=e.innerText.trim();if(t.indexOf(${q(s.text)})<0)throw new Error(${fail(step, `expected ${s.text}, got `)}+t);return t;`;
  }
  return `${find(s.locator!, step)}return e.outerHTML.slice(0,120);`;
}

export function compileSurf(plan: Plan, t: Test, shotsDir: string): { workflow: string; map: StepMapEntry[] } {
  void shotsDir;
  const steps: WorkflowStep[] = [];
  const map: StepMapEntry[] = [];

  t.steps.forEach((s, i) => {
    const step = stepNumber(t.id, i);
    const shot = s.shot ? shotPath(t.id, i, s.shot) : "";
    const from = steps.length;
    const entry: StepMapEntry = { step, kind: s.do, target: "", from, count: 0, shot };
    const snap = () => {
      if (shot) steps.push({ tool: "screenshot", args: { output: `%{shots}/${shot.replace(/^shots\//, "")}` } });
    };
    const captureUrl = () => {
      entry.url = varKey("url", step);
      steps.push({ tool: "js", args: { code: "location.href" }, as: entry.url });
    };

    switch (s.do) {
      case "navigate":
        entry.target = s.to;
        steps.push({ tool: "navigate", args: { url: s.to.startsWith("http") ? s.to : `%{base}${s.to}` } });
        steps.push({ tool: "wait.load", args: {} });
        captureUrl();
        snap();
        break;
      case "click":
        entry.target = s.locator;
        if (s.dom) {
          steps.push({ tool: "js", args: { code: once(`${find(s.locator, step)}e.click();return 'clicked';`) } });
        } else {
          steps.push({ tool: "click", args: { selector: s.locator } });
        }
        steps.push({ tool: "wait.load", args: {} });
        captureUrl();
        snap();
        break;
      case "fill":
        entry.target = s.locator;
        steps.push({ tool: "type", args: { text: s.text, into: s.locator, clear: true } });
        snap();
        break;
      case "capture": {
        entry.target = s.locator;
        entry.value = s.as;
        const read = s.attr ? `e.getAttribute(${q(s.attr)})` : `e.innerText.trim()`;
        steps.push({ tool: "js", args: { code: once(`${find(s.locator, step)}return ${read};`) }, as: s.as });
        snap();
        break;
      }
      case "expect":
        entry.target = s.locator ?? `url ~ ${s.url}`;
        entry.value = varKey("assert", step);
        entry.check = s.url ? "url" : s.visible === false ? "absent" : s.text ? "text" : "present";
        // A throw halts the workflow, so shoot first to keep an image of a
        // failure, then shoot again to show the settled page on a pass.
        snap();
        steps.push({ tool: "js", args: { code: poll(expectBody(s, step), s.timeoutMs ?? DEFAULT_EXPECT_MS) }, as: entry.value });
        snap();
        break;
      case "wait":
        entry.target = s.gone ? `gone ${s.locator}` : s.locator;
        if (s.gone) {
          entry.value = varKey("wait", step);
          steps.push({
            tool: "js",
            args: {
              code: poll(
                `if(document.querySelector(${q(s.locator)}))throw new Error(${fail(step, `${s.locator} still present`)});return 'gone';`,
                s.timeoutMs ?? 30000,
              ),
            },
            as: entry.value,
          });
        } else {
          steps.push({ tool: "wait.element", args: { selector: s.locator, timeout: s.timeoutMs ?? 30000 } });
        }
        snap();
        break;
      case "scroll":
        entry.target = s.locator;
        entry.value = varKey("scroll", step);
        steps.push({
          tool: "js",
          args: { code: once(`${find(s.locator, step)}e.scrollIntoView({block:'center'});return e.outerHTML.slice(0,120);`) },
          as: entry.value,
        });
        snap();
        break;
      case "human":
        entry.target = "human step";
        entry.needs = s.needs;
        snap();
        break;
    }
    entry.count = steps.length - from;
    map.push(entry);
  });

  const workflow = JSON.stringify(
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
  return { workflow, map };
}

/** The JSON object in surf's output, which may be preceded by a session banner. */
export function parseSurfJson(output: string): SurfRunJson | null {
  const at = output.indexOf("{");
  if (at < 0) return null;
  try {
    return JSON.parse(output.slice(at)) as SurfRunJson;
  } catch {
    return null;
  }
}

/** A run that stopped on its very first navigate without a load event. */
export function isNavigateStall(run: SurfRunJson | null): boolean {
  if (!run || run.status === "completed") return false;
  const first = run.results[0];
  return (run.completedSteps ?? 0) === 0 && first?.cmd === "navigate" && /timed out/i.test(first.error ?? run.error ?? "");
}

/** The same captions the playwright driver writes, so a report reads alike for both. */
const EXPECT_OBSERVED: Record<NonNullable<StepMapEntry["check"]>, (value: string) => string> = {
  url: (v) => `URL matched: ${v}`,
  absent: () => "Absent, as required.",
  text: (v) => `Found text: ${v}`,
  present: () => "Present, as required.",
};

const OBSERVED: Partial<Record<Step["do"], string>> = {
  navigate: "Page loaded.",
  click: "Clicked.",
  fill: "Typed.",
  wait: "Rendered.",
  scroll: "Scrolled into view.",
};

/**
 * Plan-ordered evidence records from one surf run. Pure: everything comes from
 * the step map, the run's `--json` and the files on disk.
 */
export function recordsFromSurfRun(
  plan: Plan,
  t: Test,
  map: StepMapEntry[],
  run: SurfRunJson,
  reportDir: string,
): Pick<DriverRun, "records" | "failure"> {
  const vars = run.vars ?? {};
  const records: Evidence[] = [];
  let url = "";

  for (const entry of map) {
    const results = run.results.slice(entry.from, entry.from + entry.count);
    const failed = results.find((r) => r.status !== "ok");
    const complete = results.length === entry.count && !failed;
    if (!complete && !failed) {
      // Every earlier failure has already returned, so the run stopped here.
      if (run.status !== "completed") {
        return { records, failure: { step: entry.step, message: run.error ?? "The run stopped without a message." } };
      }
      break;
    }

    if (entry.kind === "navigate") {
      const to = entry.target;
      url = to.startsWith("http") ? to : `${plan.base}${to}`;
    }
    if (entry.url && typeof vars[entry.url] === "string") url = vars[entry.url] as string;
    const value = entry.value !== undefined ? vars[entry.value] : undefined;
    const resolved = value === undefined || value === null ? "" : String(value);

    const record: Evidence = {
      test: t.id,
      step: entry.step,
      action: entry.kind === "expect" ? "assert" : entry.kind === "fill" ? "type" : entry.kind === "capture" ? "read" : entry.kind === "human" ? "assert" : entry.kind,
      target: entry.target,
      resolved,
      url,
      screenshot: entry.shot && existsSync(join(reportDir, entry.shot)) ? entry.shot : "",
      observed: failed
        ? String(failed.error ?? run.error ?? "The step failed without a message.")
        : entry.kind === "expect"
          ? EXPECT_OBSERVED[entry.check ?? "present"](resolved)
          : entry.kind === "capture"
            ? `Read: ${resolved}`
            : entry.kind === "wait" && resolved === "gone"
              ? "Gone."
              : entry.kind === "human"
                ? "Driver cannot complete this step."
                : OBSERVED[entry.kind] ?? "Done.",
      verdict: entry.kind === "human" ? "PARTIAL" : "",
      note: entry.kind === "human" ? (entry.needs ?? "") : "",
    };
    records.push(record);

    if (failed) {
      return { records, failure: { step: entry.step, message: record.observed } };
    }
  }

  if (run.status !== "completed") {
    return { records, failure: { step: records.at(-1)?.step ?? `${t.id}.1`, message: run.error ?? "The run stopped without a message." } };
  }
  return { records };
}

const surfEnv = (session: string) => ({ SURF_SESSION: session });

export const surfDriver: Driver = {
  name: "surf",
  attended: true,

  scriptName: (plan, testId) => `${plan.workId}-test-${testId}.json`,

  compile(plan, test, shotsDir) {
    const { workflow, map } = compileSurf(plan, test, shotsDir);
    const name = this.scriptName(plan, test.id);
    return { [name]: workflow, [name.replace(/\.json$/, ".map.json")]: JSON.stringify(map, null, 2) };
  },

  // surf session names allow letters, digits, dot, underscore and hyphen, up to 64.
  sessionName: (plan) => plan.workId.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 64),

  async open(session) {
    const r = await sh(["surf", "session.ensure", session, "about:blank"]);
    const tab = (r.out + r.err).match(/tab=(\d+)/)?.[1];
    if (!tab) throw new Error(`surf session.ensure ${session} printed no tab id:\n${(r.out + r.err).trim()}`);
    // A fresh session window is unfocused, and every screenshot in it fails.
    await sh(["surf", "tab.switch", tab], surfEnv(session));
  },

  async checkPrecondition(plan: Plan, p: Precondition, session: string) {
    if (!p.check.locator) return { ok: true, detail: `${p.desc} (declared, not machine-checked)` };
    if (p.check.goto) {
      await sh(["surf", "navigate", "about:blank"], surfEnv(session));
      await sh(["surf", "navigate", p.check.goto.startsWith("http") ? p.check.goto : plan.base + p.check.goto], surfEnv(session));
    }
    const body = `var e=document.querySelector(${q(p.check.locator)});if(!e)throw new Error('absent');` +
      `var t=e.innerText.trim();` +
      (p.check.text ? `if(t.indexOf(${q(p.check.text)})<0)throw new Error('text missing');` : "") +
      `return JSON.stringify({ok:true,got:t.slice(0,200)});`;
    const r = await sh(["surf", "js", poll(body, DEFAULT_EXPECT_MS)], surfEnv(session));
    const line = (r.out.trim().split("\n").pop() ?? "").trim();
    try {
      let v: unknown = JSON.parse(line);
      if (typeof v === "string") v = JSON.parse(v);
      const got = (v as { got?: string }).got ?? "";
      return { ok: Boolean((v as { ok?: boolean }).ok), detail: `${p.desc} — found ${JSON.stringify(got).slice(0, 200)}` };
    } catch {
      const reason = (r.out + r.err).match(/Error: ([^\n]+)/)?.[1] ?? "no output";
      return { ok: false, detail: `${p.desc} — not met (${reason.slice(0, 160)})` };
    }
  },

  async runTest(ctx: RunContext): Promise<DriverRun> {
    const name = this.scriptName(ctx.plan, ctx.test.id);
    const workflow = join(ctx.workflowDir, name);
    const map = JSON.parse(await readFile(workflow.replace(/\.json$/, ".map.json"), "utf8")) as StepMapEntry[];
    const shots = join(ctx.reportDir, "shots");

    let raw = "";
    let json: SurfRunJson | null = null;
    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
      attempts += 1;
      // A same-document navigate fires no load event, so start every run from a blank page.
      await sh(["surf", "navigate", "about:blank"], surfEnv(ctx.session));
      const r = await sh(
        ["surf", "do", workflow, "--base", ctx.plan.base, "--shots", shots, "--json"],
        surfEnv(ctx.session),
      );
      raw += `--- attempt ${attempts} ---\n${r.out}${r.err}\n`;
      json = parseSurfJson(r.out);
      if (!isNavigateStall(json)) break;
    }

    if (!json) {
      return {
        records: [],
        failure: { step: `${ctx.test.id}.1`, message: `surf printed no JSON: ${raw.trim().split("\n").slice(-1)[0] ?? ""}` },
        raw,
        attempts,
      };
    }
    return { ...recordsFromSurfRun(ctx.plan, ctx.test, map, json, ctx.reportDir), raw, attempts };
  },

  async close(session) {
    await sh(["surf", "session.close", session]);
  },

  cleanupRow: (session) => ({
    item: `surf session <code class="code">${session}</code>`,
    state: "A window in the developer's own Chrome, closed at the end of the run",
    action: `<strong>Nothing to undo.</strong> Confirm with <code class="code">surf session.list</code>.`,
  }),
};
