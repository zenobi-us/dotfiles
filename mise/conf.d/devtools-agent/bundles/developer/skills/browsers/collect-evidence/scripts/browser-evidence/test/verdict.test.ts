import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Evidence } from "../plan.ts";
import { decideVerdict } from "../verdict.ts";
import { test } from "./fixture.ts";

const record = (step: string, over: Partial<Evidence> = {}): Evidence => ({
  test: "1", step, action: "click", target: "x", resolved: "", url: "u",
  screenshot: "", observed: "Done.", verdict: "", note: "", ...over,
});

const dirWith = (...shots: string[]) => {
  const dir = mkdtempSync(join(tmpdir(), "be-verdict-"));
  mkdirSync(join(dir, "shots"));
  for (const s of shots) writeFileSync(join(dir, s), "png");
  return dir;
};

describe("decideVerdict", () => {
  it("will not pass a run with no image", () => {
    const { verdict, records } = decideVerdict(test, { records: [record("1.1", { screenshot: "shots/11-list.png" })], raw: "", attempts: 1 }, dirWith());
    expect(verdict).toBe("PARTIAL");
  });

  it("caps a run with a human step at PARTIAL", () => {
    const run = { records: [record("1.1", { screenshot: "shots/11-list.png" }), record("1.10", { verdict: "PARTIAL" })], raw: "", attempts: 1 };
    expect(decideVerdict(test, run, dirWith("shots/11-list.png")).verdict).toBe("PARTIAL");
  });

  it("adds a FAIL record when the driver returned none for the failing step", () => {
    const run = { records: [], failure: { step: "1.4", message: "ASSERT FAIL 1.4: nope" }, raw: "", attempts: 1 };
    const { verdict, records } = decideVerdict(test, run, dirWith());
    expect(verdict).toBe("FAIL");
    expect(records).toHaveLength(1);
    expect(records[0]!.step).toBe("1.4");
  });
});
