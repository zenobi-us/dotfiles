import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadFzfConfig, renderTemplate, resolveAction } from "./config.js";

describe("renderTemplate", () => {
  it("replaces {{selected}} placeholder", () => {
    expect(renderTemplate("Read {{selected}}", "foo.ts")).toBe("Read foo.ts");
  });

  it("replaces multiple occurrences", () => {
    expect(renderTemplate("{{selected}} and {{selected}}", "x")).toBe(
      "x and x",
    );
  });

  it("trims the selected value", () => {
    expect(renderTemplate("file: {{selected}}", "  foo.ts  ")).toBe(
      "file: foo.ts",
    );
  });

  it("returns template unchanged if no placeholder", () => {
    expect(renderTemplate("no placeholder", "ignored")).toBe("no placeholder");
  });
});

describe("resolveAction", () => {
  it("converts short form string to editor action", () => {
    const result = resolveAction("Read {{selected}}");
    expect(result).toEqual({
      type: "editor",
      template: "Read {{selected}}",
      output: "notify",
    });
  });

  it("preserves long form editor action", () => {
    const result = resolveAction({
      type: "editor",
      template: "{{selected}}",
    });
    expect(result).toEqual({
      type: "editor",
      template: "{{selected}}",
      output: "notify",
    });
  });

  it("preserves long form send action", () => {
    const result = resolveAction({
      type: "send",
      template: "{{selected}}",
    });
    expect(result).toEqual({
      type: "send",
      template: "{{selected}}",
      output: "notify",
    });
  });

  it("preserves long form bash action with default output", () => {
    const result = resolveAction({
      type: "bash",
      template: "cat {{selected}}",
    });
    expect(result).toEqual({
      type: "bash",
      template: "cat {{selected}}",
      output: "notify",
    });
  });

  it("preserves explicit output option", () => {
    const result = resolveAction({
      type: "bash",
      template: "cat {{selected}}",
      output: "editor",
    });
    expect(result).toEqual({
      type: "bash",
      template: "cat {{selected}}",
      output: "editor",
    });
  });

  it("supports send output option", () => {
    const result = resolveAction({
      type: "bash",
      template: "echo hello",
      output: "send",
    });
    expect(result).toEqual({
      type: "bash",
      template: "echo hello",
      output: "send",
    });
  });
});

describe("loadFzfConfig", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `pi-fzf-test-${Date.now()}`);
    mkdirSync(join(testDir, ".pi"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function writeProjectConfig(config: object) {
    writeFileSync(join(testDir, ".pi", "fzf.json"), JSON.stringify(config));
  }

  it("loads commands from project config", () => {
    writeProjectConfig({
      commands: {
        test: { list: "ls", action: "Read {{selected}}" },
      },
    });

    const result = loadFzfConfig(testDir);
    const testCmd = result.find((c) => c.name === "test");

    expect(testCmd).toBeDefined();
    expect(testCmd).toMatchObject({
      name: "test",
      list: "ls",
      action: {
        type: "editor",
        template: "Read {{selected}}",
        output: "notify",
      },
    });
  });

  it("loads multiple commands", () => {
    writeProjectConfig({
      commands: {
        foo: { list: "ls -a", action: "{{selected}}" },
        bar: {
          list: "git branch",
          action: { type: "bash", template: "git checkout {{selected}}" },
        },
      },
    });

    const result = loadFzfConfig(testDir);
    const names = result.map((c) => c.name);

    expect(names).toContain("foo");
    expect(names).toContain("bar");
  });

  it("handles invalid JSON gracefully", () => {
    writeFileSync(join(testDir, ".pi", "fzf.json"), "not valid json");

    // Should not throw, just skip invalid config
    const result = loadFzfConfig(testDir);
    expect(Array.isArray(result)).toBe(true);
  });

  it("handles missing commands key", () => {
    writeProjectConfig({ notCommands: {} });

    const result = loadFzfConfig(testDir);
    // Should not throw, may return global config only
    expect(Array.isArray(result)).toBe(true);
  });

  it("loads shortcut when specified", () => {
    writeProjectConfig({
      commands: {
        test: {
          list: "ls",
          action: "Read {{selected}}",
          shortcut: "ctrl+shift+f",
        },
      },
    });

    const result = loadFzfConfig(testDir);
    const testCmd = result.find((c) => c.name === "test");

    expect(testCmd).toBeDefined();
    expect(testCmd?.shortcut).toBe("ctrl+shift+f");
  });

  it("shortcut is undefined when not specified", () => {
    writeProjectConfig({
      commands: {
        test: { list: "ls", action: "Read {{selected}}" },
      },
    });

    const result = loadFzfConfig(testDir);
    const testCmd = result.find((c) => c.name === "test");

    expect(testCmd).toBeDefined();
    expect(testCmd?.shortcut).toBeUndefined();
  });
});
