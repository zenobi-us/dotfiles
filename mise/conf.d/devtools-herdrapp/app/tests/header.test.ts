import { describe, expect, test } from "bun:test";
import { workflowBadge, badgePalette } from "../mods/shared-context/header-model.js";

function activeWorkflow(phase = "fix") {
  return {
    inspection: { historyValid: true, ownership: "active", source: { state: "available", path: "/work/ticket", branch: "ticket" } },
    receipts: [{ phase, status: "started", fields: { event: "phase-start" }, workspacePath: "/work/ticket", sourceBranch: "ticket" }],
  };
}

describe("header workflow badge", () => {
  test("does not describe a recommended fix or review as active work", () => {
    for (const state of ["FIX", "REVIEW", "FINISH", "SUBMIT"]) {
      expect(workflowBadge({ state }, undefined)).toEqual({ label: "next", value: state.toLowerCase(), tone: "next" });
    }
  });

  test("distinguishes readiness from a next action", () => {
    expect(workflowBadge({ state: "BLOCKED" }, undefined)).toEqual({ label: "status", value: "blocked", tone: "blocked" });
    expect(workflowBadge({ state: "READY" }, undefined)).toEqual({ label: "status", value: "ready", tone: "complete" });
    expect(workflowBadge(null, undefined)).toBeNull();
  });

  test("shows current only for a validated active phase bound to the inspected source", () => {
    expect(workflowBadge({ state: "ACTIVE" }, activeWorkflow())).toEqual({ label: "current", value: "fixing", tone: "current" });
    expect(workflowBadge({ state: "ACTIVE" }, activeWorkflow("review"))).toEqual({ label: "current", value: "reviewing", tone: "current" });
  });

  test("does not infer a phase from ownership alone, invalid history, a different source or a completed result", () => {
    const variants = [activeWorkflow(), activeWorkflow(), activeWorkflow(), activeWorkflow(), activeWorkflow(), activeWorkflow()];
    variants[0]!.inspection.historyValid = false;
    variants[1]!.inspection.ownership = "unknown";
    variants[2]!.inspection.source.path = "/work/other";
    variants[3]!.inspection.source.branch = "other";
    variants[4]!.receipts[0]!.status = "completed";
    variants[4]!.receipts[0]!.fields.event = "phase-result";
    variants[5]!.receipts = [];
    for (const workflow of variants) expect(workflowBadge({ state: "ACTIVE" }, workflow)).toEqual({ label: "status", value: "active", tone: "neutral" });
  });

  test("does not treat planning-record status text as a workflow recommendation", () => {
    expect(workflowBadge({ state: "FIX" }, undefined, false)).toEqual({ label: "status", value: "fix", tone: "neutral" });
  });
});

describe("same-hue badge tones", () => {
  test("changes lightness, not hue, on dark and light surfaces", () => {
    const dark = badgePalette("#ff0000", "#111111"), light = badgePalette("#ff0000", "#ffffff");
    for (const palette of [dark, light]) for (const color of [palette.label, palette.value]) {
      const [red, green, blue] = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
      expect(red!).toBeGreaterThan(green!);
      expect(green).toBe(blue);
    }
    const brightness = (color: string) => [1, 3, 5].reduce((total, offset) => total + parseInt(color.slice(offset, offset + 2), 16), 0);
    expect(brightness(dark.label)).toBeLessThan(brightness(dark.value));
    expect(brightness(light.label)).toBeGreaterThan(brightness(light.value));
  });

  test("keeps neutral shorthand and alpha-bearing theme tokens neutral", () => {
    for (const color of ["#888", "#808080cc"]) {
      const palette = badgePalette(color, "#111", true);
      expect(palette.label.slice(1, 3)).toBe(palette.label.slice(3, 5));
      expect(palette.value.slice(1, 3)).toBe(palette.value.slice(5, 7));
      expect(palette.label).not.toBe(palette.value);
    }
  });
});
