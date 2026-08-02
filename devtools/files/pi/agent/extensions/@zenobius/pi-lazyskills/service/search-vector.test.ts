import { describe, expect, test } from "bun:test";
import { vectorSearch } from "./search-vector.js";
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
];

describe("vectorSearch", () => {
  test("returns at least one match for engineering query", () => {
    const result = vectorSearch("engineering automation", skills);

    expect(result.meta.total).toBe(2);
    expect(result.skills.length).toBeGreaterThan(0);
  });

  test("handles malformed query payloads without throwing", () => {
    const malformedQueries: unknown[] = [() => "engineering", { query: "engineering" }];
    for (const query of malformedQueries) {
      expect(() => vectorSearch(query as string, skills)).not.toThrow();
      const result = vectorSearch(query as string, skills);
      expect(result.meta.total).toBe(2);
    }
  });

  test("does not break when token matches Object prototype keys", () => {
    const withPrototypeToken: Skill[] = [
      ...skills,
      {
        qualifiedName: "experts-platform-constructor-pattern",
        name: "constructor-pattern",
        description: "constructor pattern for object creation",
        filePath: "/tmp/constructor-pattern/SKILL.md",
        baseDir: "/tmp/constructor-pattern",
        disableModelInvocation: false,
      },
    ];

    expect(() => vectorSearch("constructor", withPrototypeToken)).not.toThrow();
    const result = vectorSearch("constructor", withPrototypeToken);
    expect(result.meta.total).toBe(3);
  });
});
