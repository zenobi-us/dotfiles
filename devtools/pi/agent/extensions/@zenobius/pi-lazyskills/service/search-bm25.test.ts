import { describe, expect, test } from "bun:test";
import { bm25Search } from "./search-bm25.js";
import type { Skill } from "./skill-registry.js";

const skills: Skill[] = [
  {
    qualifiedName: "experts-platform-engineering-release-automation",
    name: "release-automation",
    description: "Engineer CI/CD release pipelines and deployment automation",
    filePath: "/tmp/release-automation/SKILL.md",
    baseDir: "/tmp/release-automation",
    disableModelInvocation: false,
  },
  {
    qualifiedName: "experts-debugging-runtime-investigation",
    name: "runtime-investigation",
    description: "Investigate runtime failures and production incidents",
    filePath: "/tmp/runtime-investigation/SKILL.md",
    baseDir: "/tmp/runtime-investigation",
    disableModelInvocation: false,
  },
  {
    qualifiedName: "private-team-internal-playbook",
    name: "internal-playbook",
    description: "Internal-only operational notes",
    filePath: "/tmp/internal-playbook/SKILL.md",
    baseDir: "/tmp/internal-playbook",
    disableModelInvocation: true,
  },
];

describe("bm25Search", () => {
  test("lists only visible skills for '*' query", () => {
    const result = bm25Search("*", skills);

    expect(result.meta.total).toBe(2);
    expect(result.skills.map((s) => s.shortname)).toEqual([
      "release-automation",
      "runtime-investigation",
    ]);
  });

  test("returns engineering-oriented match for engineering query", () => {
    const result = bm25Search("engineering release automation", skills);
    expect(result.skills[0]?.shortname).toBe("release-automation");
  });

  test("handles malformed query payloads without throwing", () => {
    const malformedQueries: unknown[] = [() => "engineering", { query: "engineering" }];
    for (const query of malformedQueries) {
      expect(() => bm25Search(query as string, skills)).not.toThrow();
      const result = bm25Search(query as string, skills);
      expect(result.meta.total).toBe(2);
    }
  });
});
