import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { resolveSkillRoots, type Skill } from "./skill-registry.js";
import {
  resolveRepositoryContext,
  selectIndexedSkillNames,
} from "./repository.js";
import { formatSkillsForPrompt } from "./systemprompt.js";

function skill(root: string, relativeDir: string, qualifiedName: string): Skill {
  const baseDir = join(root, relativeDir);
  return {
    name: qualifiedName,
    qualifiedName,
    description: qualifiedName,
    filePath: join(baseDir, "SKILL.md"),
    baseDir,
    disableModelInvocation: false,
  };
}

describe("repo-scoped skill indexing", () => {
  test("selects only repository skills matching configured globs", () => {
    const root = join("", "tmp", "project");
    const selected = selectIndexedSkillNames(
      [
        skill(root, ".agents/skills/reckoning", "reckoning"),
        skill(root, ".agents/skills/testing", "testing"),
        skill(join("", "tmp", "other"), ".agents/skills/reckoning", "other"),
      ],
      root,
      [".agents/skills/reckon*"],
    );

    expect([...selected]).toEqual(["reckoning"]);
  });

  test("lazy prompt indexes only selected project skills", () => {
    const root = join("", "tmp", "project");
    const skills = [
      skill(root, ".agents/skills/reckoning", "reckoning"),
      skill(root, ".agents/skills/testing", "testing"),
    ];
    const selected = selectIndexedSkillNames(
      skills,
      root,
      [".agents/skills/reckon*"],
    );
    const prompt = formatSkillsForPrompt(
      new Map(skills.map((item) => [item.qualifiedName, item])),
      {
        lazySkills: true,
        indexSkill: (item) => selected.has(item.qualifiedName),
      },
    );

    expect(prompt).toContain("<name>reckoning</name>");
    expect(prompt).not.toContain("<name>testing</name>");
  });

  test("matches .agents globs through a .pi/skills symlink", async () => {
    const root = await mkdtemp(join(tmpdir(), "pi-lazyskills-repo-"));
    try {
      const realSkillDir = join(root, ".agents", "skills", "reckoning");
      await mkdir(realSkillDir, { recursive: true });
      await writeFile(join(realSkillDir, "SKILL.md"), "test", "utf8");
      await mkdir(join(root, ".pi"), { recursive: true });
      await symlink(join(root, ".agents", "skills"), join(root, ".pi", "skills"));

      const selected = selectIndexedSkillNames(
        [skill(root, ".pi/skills/reckoning", "reckoning")],
        root,
        [".agents/skills/**/*"],
      );

      expect([...selected]).toEqual(["reckoning"]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("discovers .agents skills from cwd through repository root", () => {
    const root = resolve("/tmp/project");
    const cwd = join(root, "packages", "app");
    const roots = resolveSkillRoots({
      cwd,
      projectRoot: root,
      agentDir: join("", "tmp", "agent"),
      includeProjectAgentSkills: true,
    });

    expect(roots).toContain(join(cwd, ".agents", "skills"));
    expect(roots).toContain(join(root, ".agents", "skills"));
    expect(
      resolveSkillRoots({
        cwd,
        projectRoot: root,
        agentDir: join("", "tmp", "agent"),
        includeProjectAgentSkills: false,
      }),
    ).not.toContain(join(root, ".agents", "skills"));
  });

  test("uses canonical remote slug as enabled config key", async () => {
    const context = await resolveRepositoryContext(async (args) => {
      return args[0] === "rev-parse"
        ? { code: 0, stdout: "/tmp/project\n" }
        : { code: 0, stdout: "git@github.com:zenobi-us/dotfiles.git\n" };
    }, "/tmp/project");

    expect(context).toEqual({
      root: "/tmp/project",
      slug: "github-com-zenobi-us-dotfiles",
    });
  });
});