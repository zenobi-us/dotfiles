import { describe, expect, it } from "bun:test";
import { failureFromOutput } from "../drivers/playwright-driver.ts";
import { test } from "./fixture.ts";


describe("failureFromOutput", () => {
  it("names the step in the ASSERT FAIL message", () => {
    expect(failureFromOutput(test, "x\nError: ASSERT FAIL 1.7: gone\n").step).toBe("1.7");
  });

  it("blames the last step when there is no ASSERT FAIL", () => {
    expect(failureFromOutput(test, "TimeoutError: page.goto").step).toBe(`1.${test.steps.length}`);
  });
});
