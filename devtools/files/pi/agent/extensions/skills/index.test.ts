import { describe, expect, test } from "bun:test";
import { buildSkillUserMessage, formatReadSkillOutput } from "./index";

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
  test("uses frontmatter preamble and appends raw skill content", () => {
    const result = formatReadSkillOutput(skill, "# Skill Content\n\nUse this skill first.");

    expect(result.startsWith("---\n")).toBe(true);
    expect(result).toContain("qualified_name: superpowers-using-superpowers");
    expect(result).toContain("shortname: using-superpowers");
    expect(result).toContain("location: /tmp/skills/superpowers/using-superpowers/SKILL.md");
    expect(result).toContain("references: relative to /tmp/skills/superpowers/using-superpowers");
    expect(result).toContain("\n---\n\n# Skill Content\n\nUse this skill first.");
    expect(result).not.toContain("<skill ");
    expect(result).not.toContain("</skill>");
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
