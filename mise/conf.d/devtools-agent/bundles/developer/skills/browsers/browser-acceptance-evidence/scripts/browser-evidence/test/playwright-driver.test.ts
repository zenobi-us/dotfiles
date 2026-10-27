import { describe, expect, it } from "bun:test";
import { compilePlaywright, failureFromOutput } from "../drivers/playwright-driver.ts";
import { plan, test } from "./fixture.ts";

const quoted = {
  ...test,
  steps: [
    ...test.steps,
    { do: "expect" as const, says: "Check the menu item.", locator: "getByRole('menuitem', { name: 'Edit' })", text: "Edit" },
  ],
};

describe("compilePlaywright", () => {
  it("emits a script that parses, even with single quotes in a locator", () => {
    const src = compilePlaywright({ ...plan, driver: "playwright" }, quoted, "/shots");
    expect(() => new Function(`return (\n${src}\n)`)).not.toThrow();
  });

  it("polls assertions and shoots on failure", () => {
    const src = compilePlaywright({ ...plan, driver: "playwright" }, test, "/shots");
    expect(src).toContain("await settle(");
    expect(src).toContain(".catch(() => {})");
  });

  it("waits for a gone element to detach", () => {
    const src = compilePlaywright({ ...plan, driver: "playwright" }, test, "/shots");
    expect(src).toContain("state: 'detached'");
  });
});

describe("failureFromOutput", () => {
  it("names the step in the ASSERT FAIL message", () => {
    expect(failureFromOutput(test, "x\nError: ASSERT FAIL 1.7: gone\n").step).toBe("1.7");
  });

  it("blames the last step when there is no ASSERT FAIL", () => {
    expect(failureFromOutput(test, "TimeoutError: page.goto").step).toBe(`1.${test.steps.length}`);
  });
});
