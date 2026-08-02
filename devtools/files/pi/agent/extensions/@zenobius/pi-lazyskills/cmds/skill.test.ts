import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { formatSkillCommandName } from "./skill.js";
import { createSkillRegistry } from "../service/skill-registry.js";

describe("skill command names", () => {
  test("formats configured command templates", () => {
    const skill = { name: "using-superpowers", qualifiedName: "superpowers-using-superpowers" };

    expect(formatSkillCommandName("/{shortname}", skill)).toBe("using-superpowers");
    expect(formatSkillCommandName("skill:{qualified_name}", skill)).toBe(
      "skill:superpowers-using-superpowers",
    );
  });

  test("qualified name omits SKILL.md", async () => {
    const root = join(tmpdir(), `pi-lazyskills-${process.pid}-${Date.now()}`);
    const skillDir = join(root, ".pi", "skills", "superpowers", "using-superpowers");
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, "SKILL.md"),
      "---\nname: using-superpowers\ndescription: Use when starting any conversation\n---\nbody\n",
    );

    const registry = createSkillRegistry();
    try {
      await registry.load({ cwd: root, agentDir: join(root, "agent"), includeDefaults: true });
      expect(registry.skills.map((skill) => skill.qualifiedName)).toContain(
        "superpowers-using-superpowers",
      );
      expect(registry.skills.map((skill) => skill.qualifiedName)).not.toContain(
        "superpowers-using-superpowers-SKILL.md",
      );
    } finally {
      await registry.dispose();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
