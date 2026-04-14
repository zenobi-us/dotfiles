import { describe, expect, test } from "bun:test";
import { DEFAULT_RUNTIME_SETTINGS } from "./config.js";
import { lexicalScoreSearch } from "./search-lexical.js";
import type { Skill } from "./skill-registry.js";

const skills: Skill[] = [
  {
    qualifiedName: "superpowers-systematic-debugging-SKILL.md",
    name: "systematic-debugging",
    description: "Use when encountering any bug, test failure, or unexpected behavior",
    filePath: "/tmp/systematic-debugging/SKILL.md",
    baseDir: "/tmp/systematic-debugging",
    disableModelInvocation: false,
  },
  {
    qualifiedName: "experts-quality-security-debugger-SKILL.md",
    name: "debugger",
    description: "Expert debugger specializing in complex issue diagnosis",
    filePath: "/tmp/debugger/SKILL.md",
    baseDir: "/tmp/debugger",
    disableModelInvocation: false,
  },
  {
    qualifiedName: "experts-developer-experience-tooling-engineer-SKILL.md",
    name: "tooling-engineer",
    description: "Expert tooling engineer specializing in developer tool creation",
    filePath: "/tmp/tooling-engineer/SKILL.md",
    baseDir: "/tmp/tooling-engineer",
    disableModelInvocation: false,
  },
];

describe("lexicalScoreSearch", () => {
  test("uses a default lexical threshold of 0.5", () => {
    expect(DEFAULT_RUNTIME_SETTINGS.lexicalThreshold).toBe(0.5);
  });

  test("filters weak fuzzy matches at the default threshold", () => {
    const result = lexicalScoreSearch(["debugging"], skills);

    expect(result.skills.map((skill) => skill.shortname)).toEqual([
      "systematic-debugging",
      "debugger",
    ]);
  });

  test("allows weaker fuzzy matches when threshold is lowered", () => {
    const result = lexicalScoreSearch(["debugging"], skills, 0.1);

    expect(result.skills.map((skill) => skill.shortname)).toEqual([
      "systematic-debugging",
      "debugger",
      "tooling-engineer",
    ]);
  });
});
