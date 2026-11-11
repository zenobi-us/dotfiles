/**
 * The acceptance plan: one typed source of truth for a browser evidence run.
 *
 * Everything else is generated from a Plan — the human-readable `test-plan.md`,
 * the driver script, the screenshot names, the evidence records and the report
 * sections. Nothing in this pipeline is transcribed by hand, so the plan and
 * the evidence cannot drift apart.
 *
 * Every step carries two layers. `says` is the manual test step: one sentence a
 * person follows with no developer tools open. The locator is how the driver
 * finds the same thing. Readers only ever meet `says`; the locator stays inside
 * the generated script and the evidence record. Both live in one record, so the
 * steps a reviewer reads and the steps that ran cannot disagree.
 */

/** A step's screenshot slug. An empty slug means the step takes no shot. */
export type Slug = string;

/**
 * The manual test step. Name what is on screen — the visible label, the button
 * text, the field name — never how the driver finds it. If you cannot write the
 * step in plain words, you do not understand it well enough to test it.
 */
export type Says = string;

export type Step =
 /** Go to a URL. `to` is appended to the plan's `base` unless it is absolute. */
 | { do: "navigate"; says: Says; to: string; shot?: Slug }
 /**
  * Click a locator. `dom: true` makes the surf driver call the element's own
  * `.click()` instead of a synthesized pointer click, for controls such as a
  * client-routed nav link that ignore surf's input events.
  */
 | { do: "click"; says: Says; locator: string; dom?: boolean; shot?: Slug }
 /** Type into a locator. `text` is a literal; never put a secret here. */
 | { do: "fill"; says: Says; locator: string; text: string; screen?: string; shot?: Slug }
 /**
  * Read something and keep it. The captured value lands in the evidence
  * record's `resolved` field, so capture the thing that identifies the
  * element: an href, a test id, a rendered value.
  */
 | { do: "capture"; says: Says; locator: string; attr?: string; as: string; shot?: Slug }
 /**
  * Assert. A failed expect throws, which fails the run and makes the verdict
  * FAIL. At least one of `text`, `visible` or `url` must be given.
  */
 | {
  do: "expect";
  says: Says;
  locator?: string;
  /** Substring the locator's text must contain. */
  text?: string;
  /** Whether the locator must be present. */
  visible?: boolean;
  /** Regular expression source the page URL must match. */
  url?: string;
  /**
   * How long the assertion keeps retrying before it fails, in ms. A page
   * that renders after a refetch is not wrong for being a moment late.
   * Default 5000.
   */
  timeoutMs?: number;
  shot?: Slug;
  image?: {
   width: number; height: number;
   pixels: Array<{ x: number; y: number; rgb: [number, number, number]; tolerance?: number }>;
   lines: Array<{ text: string; top: number; tolerance?: number }>;
  };
 }
 /**
  * Wait for a locator to appear before going on. A single-page app renders
  * after its navigation settles, so a bare `navigate` leaves the next step
  * racing the first paint. The wait fails the run if the locator never
  * arrives, so it is a gate, not a sleep.
  *
  * Plumbing: `says` is optional and usually absent, because a person does not
  * wait for a locator, they look at the page. A step with no `says` is left
  * out of the manual test steps and out of the report.
  */
 | {
  do: "wait";
  says?: Says;
  locator: string;
  text?: string;
  /**
   * Wait for the locator to be gone instead. This is the gate after a
   * delete or a dismiss: the next check only means something once the
   * old element has left the page.
   */
  gone?: boolean;
  timeoutMs?: number;
  shot?: Slug;
 }
 /**
  * Bring a locator into the viewport. A driver that dispatches a click at an
  * element's coordinates cannot reach one below the fold, and surf's
  * `click --selector` does not scroll on its own, so a control at the foot of
  * a long page is clicked into empty space and the step still reports ok.
  *
  * Plumbing, like `wait`. Give it a `says` only when scrolling is itself
  * something the reader must do, such as reaching a footer.
  */
 | { do: "scroll"; says?: Says; locator: string; shot?: Slug }
 /**
  * Press a key on whatever has focus, such as Enter on a focused grid cell.
  * A click focuses some controls without opening them; an AG Grid cell editor
  * opens only from the keyboard. Both drivers accept a single key name such
  * as `Enter`, `Escape`, `Tab` or `ArrowDown`; they spell combinations
  * differently (surf `ctrl+a`, playwright `Control+a`).
  */
 | { do: "press"; says: Says; key: string; screen?: string; shot?: Slug }
 /**
  * Something only a human can finish — a popup the driver suppresses, a
  * payment, a second factor. The run records PARTIAL and `needs` says what
  * is still owed. It never fails the run. `needs` is already written for a
  * person, so this step needs no `says`.
  */
 | { do: "human"; needs: string; shot?: Slug };

export type Precondition = {
 id: string;
 /** Stated as a fact to be checked, not assumed. */
 desc: string;
 /**
  * Checked before any test that lists this id in `requires`. `timeoutMs` is
  * how long the locator may take to appear after `goto`; default 5000.
  */
 check: { goto?: string; locator?: string; text?: string; timeoutMs?: number };
};

export type Test = {
 id: string;
 /** One line. Becomes the report section heading. */
 claim: string;
 /** What success looks like. Printed next to the badge. */
 pass: string;
 /** What failure looks like. If you cannot write it, the test is not ready. */
 fail: string;
 /** Precondition ids. A test whose precondition fails is BLOCKED, not FAIL. */
 requires?: string[];
 steps: Step[];
};

export type Plan = {
 schema: "collect-evidence/v1";
 kind: "plan";
 /** Origins and stable step IDs approved before collection starts. */
 approval: { origins: string[]; confirmations?: string[]; terminal?: { command: string[]; cwd: string } };
 workId: string;
 driver: "playwright" | "surf" | "tui";
 terminal?: { command: string[]; cwd: string; columns: number; rows: number; font: string; lineHeight: number };
 /** Base URL. Every relative `navigate` hangs off this. */
 base: string;
 /** Printed in the report's environment line. */
 environment?: { account?: string; branch?: string; notes?: string };
 /** Optional recording. Playwright records real WebM; Surf reports a limit.
  * Confirm the recording scope before collection. */
 video?: boolean;
 preconditions?: Precondition[];
 tests: Test[];
};

/** Shared browser-side inspection. It reads the live screen, not plan labels. */
export function safetyCode(plan: Plan, step: string, confirmation = false, destination?: string): string {
 const origins = plan.approval?.origins ?? [];
 const approved = !confirmation || Boolean(plan.approval?.confirmations?.includes(step));
 return `(function(){
    var origins=${JSON.stringify(origins)};
    var visible=function(e){var r=e.getBoundingClientRect();var s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var inspect=function(root){
      var nodes=Array.from(root.querySelectorAll('input,form,dialog,[role="dialog"],h1,h2,h3,[role="heading"],iframe'));
      if(nodes.some(function(e){
        if(!visible(e))return false;
        if(e.tagName==='IFRAME') { try { return !e.contentDocument||inspect(e.contentDocument); } catch { return true; } }
        if(e.tagName==='INPUT')return e.type==='password'||/^(username|current-password|new-password|one-time-code)$/.test(e.autocomplete);
        return /\\b(sign\\s*in|log\\s*in|username|password|passcode|verification code|two.factor|authenticate|credentials?)\\b/i.test(e.innerText||'');
      }))return true;
      return Array.from(root.querySelectorAll('*')).some(function(e){return visible(e)&&e.shadowRoot&&inspect(e.shadowRoot);});
    };
    if(inspect(document))throw new Error(${JSON.stringify(`SAFETY STOP ${step}: credential prompt or uninspectable frame; human handling required`)});
    if(location.href!=='about:blank'&&!origins.includes(location.origin))throw new Error(${JSON.stringify(`SAFETY STOP ${step}: current origin is not approved`)});
    ${destination === undefined ? "" : `if(!origins.includes(new URL(${JSON.stringify(destination)},${JSON.stringify(plan.base)}).origin))throw new Error(${JSON.stringify(`SAFETY STOP ${step}: navigation origin is not approved`)});`}
    if(!${approved})throw new Error(${JSON.stringify(`SAFETY STOP ${step}: confirmation step is not explicitly approved`)});
    return 'safe';
  })()`;
}

export function approvedUrl(plan: Plan, destination: string): string {
 const url = new URL(destination, plan.base);
 if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || !plan.approval?.origins.includes(url.origin)) {
  throw new Error(`Navigation origin is not approved: ${url.origin}`);
 }
 return url.href;
}

export type Verdict = "PASS" | "FAIL" | "PARTIAL" | "BLOCKED" | "WARN";

/** One line of evidence.jsonl. Produced by the runner, never hand-written. */
export type Evidence = {
 test: string;
 step: string;
 action: string;
 target: string;
 resolved: string;
 url: string;
 screenshot: string;
 observed: string;
 verdict: Verdict | "";
 note: string;
 /** True only after this step's expect completed successfully. */
 assertionPassed?: boolean;
 capturedAt?: string;
 viewport?: { width: number; height: number; deviceScaleFactor: number };
 captureSequence?: number;
 captureStatus?: "captured" | "failed" | "not-requested";
 toolVersion?: string;
 terminal?: {
  session: string; socket: string; pane: string; tty: string;
  display: string; runtime: string; cagePid: number; footPid: number;
  columns: number; rows: number; font: string; lineHeight: number;
  cleanup: "pending" | "released";
 };
};

/** `1.4` — the plan position of a step, used everywhere as its identity. */
export function stepNumber(testId: string, index: number): string {
 return `${testId}.${index + 1}`;
}

/**
 * Capture sequences are local to a step. Distinct assertion images must never
 * replace one another, even when the settled image follows a pre-check image.
 */
export function shotPath(testId: string, index: number, slug: Slug, captureSequence = 1): string {
 return `shots/step-${testId}-${String(index + 1).padStart(3, "0")}-${slug}--capture-${String(captureSequence).padStart(3, "0")}.png`;
}

/**
 * The manual test step, or `null` when the step is driver plumbing. Everything
 * a reader meets — `test-plan.md`, both report step lists, every figure caption
 * — comes from here, so a locator can never reach a reviewer.
 */
export function humanStep(step: Step): string | null {
 if (step.do === "human") return `By hand: ${step.needs}`;
 const says = step.says?.trim();
 return says ? says : null;
}

/**
 * The mechanical description of a step, locator and all. Used only in the
 * generated driver script's comments, where the reader is debugging the script
 * and needs the selector.
 */
export function driverStep(step: Step, base: string): string {
 switch (step.do) {
  case "navigate":
   return `Open \`${step.to.startsWith("http") ? step.to : base + step.to}\`.`;
  case "click":
   return `Click \`${step.locator}\`.`;
  case "fill":
   return `Type \`${step.text}\` into \`${step.locator}\`.`;
  case "capture":
   return `Read ${step.attr ? `the \`${step.attr}\` of ` : ""}\`${step.locator}\`.`;
  case "expect": {
   if (step.url) return `Confirm the URL matches \`${step.url}\`.`;
   if (step.text) return `Confirm \`${step.locator}\` contains "${step.text}".`;
   if (step.visible === false) return `Confirm \`${step.locator}\` is absent.`;
   return `Confirm \`${step.locator}\` is present.`;
  }
  case "wait":
   return step.gone
    ? `Wait for \`${step.locator}\` to disappear.`
    : `Wait for \`${step.locator}\` to render.`;
  case "scroll":
   return `Scroll \`${step.locator}\` into view.`;
  case "press":
   return `Press \`${step.key}\`.`;
  case "human":
   return `By hand: ${step.needs}`;
 }
}

/**
 * The steps a person follows, numbered as they will be read. Plumbing is gone,
 * so the numbers here run 1..n and do not match the plan step ids. The plan id
 * stays the identity of the evidence record and the screenshot; this number is
 * what the reader sees.
 */
export function readerSteps(t: Test): Array<{ n: number; text: string }> {
 const out: Array<{ n: number; text: string }> = [];
 for (const s of t.steps) {
  const text = humanStep(s);
  if (text) out.push({ n: out.length + 1, text });
 }
 return out;
}

/**
 * Selector syntax that has no place in a manual test step, or `null` when the
 * sentence is clean. Enforced at load, because a `says` that names an element
 * the way the driver does is the whole fault this field exists to stop.
 */
export function selectorish(says: string): string | null {
 const banned: Array<[RegExp, string]> = [
  [/:has\(|:not\(|::/, "a CSS pseudo-class"],
  [/nth-(of-type|child)/, "an nth-of-type selector"],
  [/\[[a-zA-Z-]+[=\]]/, "an attribute selector"],
  [/\b(css|xpath|role|aria-label)=/, "a selector engine prefix"],
  [/querySelector|getBy[A-Z]|frameLocator|locator\(/, "a driver locator call"],
  [/data-test(id)?\b/, "a test id"],
 ];
 for (const [re, what] of banned) {
  const m = re.exec(says);
  if (m) return `${what} (\`${m[0]}\`)`;
 }
 return null;
}

/** `videos/test-2.webm`, relative to the report directory like a screenshot. */
export function videoPath(testId: string): string {
 return `videos/test-${testId}.webm`;
}

