import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileSurf, isNavigateStall, parseSurfJson, recordsFromSurfRun, type SurfRunJson } from "../drivers/surf-driver.ts";
import { plan, test } from "./fixture.ts";

const compiled = () => {
  const { workflow, map } = compileSurf(plan, test, "/shots");
  return { steps: JSON.parse(workflow).steps as Array<{ tool: string; args: { code?: string }; as?: string }>, map };
};

/** A surf --json result where every workflow step ran ok. */
const completedRun = (vars: Record<string, unknown>): SurfRunJson => {
  const { steps } = compiled();
  return {
    status: "completed",
    completedSteps: steps.length,
    totalSteps: steps.length,
    results: steps.map((s, i) => ({ step: i + 1, cmd: s.tool, status: "ok" })),
    vars,
  };
};

const reportDirWithShots = (...shots: string[]) => {
  const dir = mkdtempSync(join(tmpdir(), "be-surf-"));
  mkdirSync(join(dir, "shots"));
  for (const s of shots) writeFileSync(join(dir, s), "png");
  return dir;
};

describe("compileSurf", () => {
  it("maps every plan step onto a contiguous run of workflow steps", () => {
    const { steps, map } = compiled();
    expect(map).toHaveLength(test.steps.length);
    let next = 0;
    for (const entry of map) {
      expect(entry.from).toBe(next);
      next += entry.count;
    }
    expect(next).toBe(steps.length);
  });

  it("emits js that parses, even when a locator carries quotes", () => {
    for (const s of compiled().steps.filter((x) => x.tool === "js")) {
      expect(() => new Function(`return ${s.args.code}`)).not.toThrow();
    }
  });

  it("captures the URL after every navigate and click", () => {
    const { map } = compiled();
    const withUrl = map.filter((e) => e.url).map((e) => e.kind);
    expect(withUrl).toEqual(["navigate", "click", "click"]);
  });

  it("shoots before an expect, so a failed assert still leaves an image", () => {
    const { steps, map } = compiled();
    const shotExpect = map.find((e) => e.kind === "expect" && e.shot)!;
    const tools = steps.slice(shotExpect.from, shotExpect.from + shotExpect.count).map((s) => s.tool);
    expect(tools).toEqual(["screenshot", "js", "screenshot"]);
  });

  it("compiles a gone wait to a polling js step, not wait.element", () => {
    const { steps, map } = compiled();
    const gone = map.find((e) => e.target.startsWith("gone "))!;
    expect(steps[gone.from]!.tool).toBe("js");
    expect(steps[gone.from]!.args.code).toContain("setTimeout");
  });
});

describe("recordsFromSurfRun", () => {
  it("builds one record per plan step from a completed run", () => {
    const dir = reportDirWithShots("shots/11-list.png", "shots/14-selected.png", "shots/17-gone.png");
    const run = completedRun({
      url_1_1: "https://app.example.invalid/list",
      url_1_3: "https://app.example.invalid/list?sel=1",
      assert_1_4: "1 selected",
      title: "Things",
    });
    const { records, failure } = recordsFromSurfRun(plan, test, compiled().map, run, dir);
    expect(failure).toBeUndefined();
    expect(records.map((r) => r.step)).toEqual(test.steps.map((_, i) => `1.${i + 1}`));
    expect(records[3]!.resolved).toBe("1 selected");
    expect(records[3]!.observed).toBe("Found text: 1 selected");
    expect(records[6]!.observed).toBe("Absent, as required.");
    expect(records[3]!.url).toBe("https://app.example.invalid/list?sel=1");
    expect(records[3]!.screenshot).toBe("shots/14-selected.png");
    expect(records[7]!.observed).toBe("Read: Things");
    expect(records[9]!.verdict).toBe("PARTIAL");
    expect(records[9]!.note).toBe("Confirm the email arrived.");
  });

  it("stops at the failing step and names it", () => {
    const { steps, map } = compiled();
    const failingEntry = map[3]!;
    const failAt = failingEntry.from + failingEntry.count - 1;
    const run: SurfRunJson = {
      status: "failed",
      results: steps.slice(0, failAt + 1).map((s, i) => ({
        step: i + 1,
        cmd: s.tool,
        status: i === failAt ? "error" : "ok",
        error: i === failAt ? "Error: ASSERT FAIL 1.4: expected 1 selected, got 0 selected" : undefined,
      })),
      error: "Error: ASSERT FAIL 1.4: expected 1 selected, got 0 selected",
      vars: {},
    };
    const { records, failure } = recordsFromSurfRun(plan, test, map, run, reportDirWithShots());
    expect(records).toHaveLength(4);
    expect(failure).toEqual({ step: "1.4", message: "Error: ASSERT FAIL 1.4: expected 1 selected, got 0 selected" });
  });

  it("blames the first step when the run never started", () => {
    const run: SurfRunJson = {
      status: "failed",
      completedSteps: 0,
      results: [{ step: 1, cmd: "navigate", status: "error", error: "request timed out" }],
      error: "request timed out",
    };
    const { records, failure } = recordsFromSurfRun(plan, test, compiled().map, run, reportDirWithShots());
    expect(records).toHaveLength(1);
    expect(failure?.step).toBe("1.1");
  });
});

describe("surf output", () => {
  it("parses JSON printed after a session banner", () => {
    const out = `[surf session=x tab=1 window=2]\n{"status":"completed","results":[],"vars":{}}`;
    expect(parseSurfJson(out)?.status).toBe("completed");
  });

  it("recognises the first-navigate stall and nothing else", () => {
    const stall: SurfRunJson = {
      status: "failed",
      completedSteps: 0,
      results: [{ step: 1, cmd: "navigate", status: "error", error: "request timed out" }],
    };
    expect(isNavigateStall(stall)).toBe(true);
    expect(isNavigateStall({ ...stall, completedSteps: 3 })).toBe(false);
    expect(isNavigateStall({ ...stall, results: [{ step: 1, cmd: "js", status: "error", error: "ASSERT FAIL" }] })).toBe(false);
  });
});
