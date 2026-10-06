/**
 * The acceptance plan: one typed source of truth for a browser evidence run.
 *
 * Everything else is generated from a Plan — the human-readable `test-plan.md`,
 * the driver script, the screenshot names, the evidence records and the report
 * sections. Nothing in this pipeline is transcribed by hand, so the plan and
 * the evidence cannot drift apart.
 */

/** A step's screenshot slug. An empty slug means the step takes no shot. */
export type Slug = string;

export type Step =
  /** Go to a URL. `to` is appended to the plan's `base` unless it is absolute. */
  | { do: "navigate"; to: string; shot?: Slug }
  /** Click a locator. */
  | { do: "click"; locator: string; shot?: Slug }
  /** Type into a locator. `text` is a literal; never put a secret here. */
  | { do: "fill"; locator: string; text: string; shot?: Slug }
  /**
   * Read something and keep it. The captured value lands in the evidence
   * record's `resolved` field, so capture the thing that identifies the
   * element: an href, a test id, a rendered value.
   */
  | { do: "capture"; locator: string; attr?: string; as: string; shot?: Slug }
  /**
   * Assert. A failed expect throws, which fails the run and makes the verdict
   * FAIL. At least one of `text`, `visible` or `url` must be given.
   */
  | {
      do: "expect";
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
   * Something only a human can finish — a popup the driver suppresses, a
   * payment, a second factor. The run records PARTIAL and `needs` says what
   * is still owed. It never fails the run.
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

/** The human-readable action line for a step, used in the plan and the report. */
export function stepText(step: Step, base: string): string {
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
    case "human":
      return `By hand: ${step.needs}`;
  }
}

/** Every step that takes a screenshot, as `<step number>` -> `<path>`. */
export function shotsFor(test: Test): Map<string, string> {
  const out = new Map<string, string>();
  test.steps.forEach((s, i) => {
    if (s.shot) out.set(stepNumber(test.id, i), shotPath(test.id, i, s.shot));
  });
  return out;
}
