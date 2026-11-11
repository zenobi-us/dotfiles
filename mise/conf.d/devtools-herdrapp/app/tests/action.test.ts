import { describe, expect, test } from "bun:test";
import { ACTION_PRESETS, actionPrompt } from "../mods/shared-context/action-model.js";

describe("action preset with optional detail", () => {
  test("retains both the selected preset and the user's qualifier", () => {
    const preset = ACTION_PRESETS.submit[1]!;
    const detail = "Only capture the narrow-screen flow.\nKeep the screenshots local.";
    expect(actionPrompt("submit", 1, `  ${detail}  `)).toBe(`${preset.prompt}\n\n${detail}`);
  });

  test("does not add instructions or separators for a blank workflow request", () => {
    for (const action of ["start", "review", "fix", "submit", "finish"] as const) {
      expect(actionPrompt(action, 0, "  \n\t ")).toBe("");
    }
  });

  test("allows a custom request without a preset instruction", () => {
    expect(actionPrompt("fix", 0, "  Reproduce the focus loss before changing code.  "))
      .toBe("Reproduce the focus loss before changing code.");
  });

  test("keeps the chosen question when additional detail is blank", () => {
    expect(actionPrompt("ask-matt", 1, " \n ")).toBe(ACTION_PRESETS["ask-matt"][1]!.prompt);
  });
});
