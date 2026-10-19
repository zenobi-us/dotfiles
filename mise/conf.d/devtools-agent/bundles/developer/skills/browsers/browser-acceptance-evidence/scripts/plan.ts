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
  | { do: "fill"; says: Says; locator: string; text: string; shot?: Slug }
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
      shot?: Slug;
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
  | { do: "wait"; says?: Says; locator: string; timeoutMs?: number; shot?: Slug }
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
  /** Checked before any test that lists this id in `requires`. */
  check: { goto?: string; locator?: string; text?: string };
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
  workId: string;
  driver: "playwright" | "surf";
  /** Base URL. Every relative `navigate` hangs off this. */
  base: string;
  /** Printed in the report's environment line. */
  environment?: { account?: string; branch?: string; notes?: string };
  preconditions?: Precondition[];
  tests: Test[];
};

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
};

/** `1.4` — the plan position of a step, used everywhere as its identity. */
export function stepNumber(testId: string, index: number): string {
  return `${testId}.${index + 1}`;
}

/**
 * `shots/14-portal.png`. The number orders the shots as a reader meets them
 * and is derived from the step, so a shot can never be filed under the wrong
 * step.
 */
export function shotPath(testId: string, index: number, slug: Slug): string {
  const n = `${testId}${index + 1}`.replace(/\./g, "");
  return `shots/${n}-${slug}.png`;
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
      return `Wait for \`${step.locator}\` to render.`;
    case "scroll":
      return `Scroll \`${step.locator}\` into view.`;
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
 * Plan step id -> the reader-facing number its evidence belongs under. A shot
 * taken at a plumbing step shows the state the next manual step is about to
 * check, so it is filed under that step; a trailing plumbing step falls back to
 * the last manual step before it.
 */
export function readerNumber(t: Test): Map<string, number> {
  const human = t.steps.map((s) => humanStep(s) !== null);
  const numbers: Array<number | null> = [];
  let n = 0;
  for (const isHuman of human) numbers.push(isHuman ? ++n : null);

  const out = new Map<string, number>();
  t.steps.forEach((_, i) => {
    let at = numbers[i] ?? null;
    for (let j = i; at === null && j < numbers.length; j++) at = numbers[j] ?? null;
    for (let j = i; at === null && j >= 0; j--) at = numbers[j] ?? null;
    out.set(stepNumber(t.id, i), at ?? 1);
  });
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

/** Every step that takes a screenshot, as `<step number>` -> `<path>`. */
export function shotsFor(test: Test): Map<string, string> {
  const out = new Map<string, string>();
  test.steps.forEach((s, i) => {
    if (s.shot) out.set(stepNumber(test.id, i), shotPath(test.id, i, s.shot));
  });
  return out;
}
