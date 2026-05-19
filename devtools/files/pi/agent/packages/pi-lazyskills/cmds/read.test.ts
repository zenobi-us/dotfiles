import { describe, expect, test } from "bun:test";
import { buildReadSkillCollapsedSummary, buildSkillUserMessage, formatReadSkillOutput } from "../index.js";

const skill = {
  qualifiedName: "superpowers-using-superpowers",
  name: "using-superpowers",
  description: "Use when starting any conversation",
  filePath: "/tmp/skills/superpowers/using-superpowers/SKILL.md",
  baseDir: "/tmp/skills/superpowers/using-superpowers",
  source: "path",
  disableModelInvocation: false,
};

describe("formatReadSkillOutput", () => {
  test("renders metadata frontmatter and trims body content", () => {
    const result = formatReadSkillOutput(skill, "\n\n# Skill Content\n\nUse this skill first.\n\n");

    expect(result.trimStart().startsWith("---\n")).toBe(true);
    expect(result).toContain("qualified_name: superpowers-using-superpowers");
    expect(result).toContain("shortname: using-superpowers");
    expect(result).toContain("location: /tmp/skills/superpowers/using-superpowers/SKILL.md");
    expect(result).toContain("base_dir: /tmp/skills/superpowers/using-superpowers");
    expect(result).toContain("scripts_dir: /tmp/skills/superpowers/using-superpowers/scripts");
    expect(result).toContain("references_dir: /tmp/skills/superpowers/using-superpowers/references");
    expect(result).toContain("assets_dir: /tmp/skills/superpowers/using-superpowers/assets");
    expect(result).toContain("# Skill Content\n\nUse this skill first.");
  });

  test("rewrites relative resource paths to absolute skill package paths", () => {
    const body = [
      "Load skills/setup.md first",
      "Then read ./references/faq.md",
      "And inspect assets/diagram.svg",
    ].join("\n");

    const result = formatReadSkillOutput(skill, body);

    expect(result).toContain("/tmp/skills/superpowers/using-superpowers/skills/setup.md");
    expect(result).toContain("/tmp/skills/superpowers/using-superpowers/references/faq.md");
    expect(result).toContain("/tmp/skills/superpowers/using-superpowers/assets/diagram.svg");
  });

  test("rewrites absolute and dot-prefixed resource paths while leaving unrelated text untouched", () => {
    const body = [
      "Absolute: /elsewhere/skills/deep/path.md",
      "Dot prefixed: ./skills/local/path.md",
      "Unrelated token: myskills/keep-as-is.md",
    ].join("\n");

    const result = formatReadSkillOutput(skill, body);

    expect(result).toContain("/tmp/skills/superpowers/using-superpowers/skills/deep/path.md");
    expect(result).toContain("/tmp/skills/superpowers/using-superpowers/skills/local/path.md");
    expect(result).toContain("myskills/keep-as-is.md");
  });
});

describe("buildSkillUserMessage", () => {
  test("builds /skill message from read_skill output and appends user instructions", () => {
    const result = buildSkillUserMessage(skill, "# Skill Content\n\nUse this skill first.", "focus on tests");

    expect(result).toContain("qualified_name: superpowers-using-superpowers");
    expect(result).toContain("# Skill Content\n\nUse this skill first.");
    expect(result).toContain("\n\nUser: focus on tests");
    expect(result).not.toContain("<skill ");
  });
});

describe("buildReadSkillCollapsedSummary", () => {
  test("prefers resolved qualified skill name when available", () => {
    const result = buildReadSkillCollapsedSummary(
      { resolvedQualifiedName: "superpowers-using-superpowers-SKILL.md", requestedName: "using-superpowers" },
      "ctrl+e",
    );

    expect(result).toBe("Loaded skill: superpowers-using-superpowers-SKILL.md - (show full output with ctrl+e)");
  });

  test("falls back to requested name and generic expand hint", () => {
    const result = buildReadSkillCollapsedSummary({ requestedName: "using-superpowers" });

    expect(result).toBe("Loaded skill: using-superpowers - (expand to show full output)");
  });
});
