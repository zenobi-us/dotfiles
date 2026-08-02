import { describe, expect, test } from "bun:test";
import { parseSkillQuery, normalizeText, detectIntent } from "./search-shared.js";

describe("search-shared query parsing", () => {
  test("parses string queries", () => {
    const parsed = parseSkillQuery("engineering release -legacy");
    expect(parsed.include).toEqual(["engineering", "release"]);
    expect(parsed.exclude).toEqual(["legacy"]);
    expect(parsed.listAll).toBe(false);
  });

  test("parses array queries", () => {
    const parsed = parseSkillQuery(["engineering", "automation"]);
    expect(parsed.include).toEqual(["engineering", "automation"]);
    expect(parsed.exclude).toEqual([]);
    expect(parsed.listAll).toBe(false);
  });

  test("normalizes punctuation and casing", () => {
    expect(normalizeText("  Engineering,   AUTOmation!! ")).toBe("engineering automation");
  });

  test("does not throw for malformed runtime query payloads", () => {
    const malformedQueries: unknown[] = [() => "engineering", { query: "engineering" }];

    for (const query of malformedQueries) {
      expect(() => parseSkillQuery(query as string)).not.toThrow();
      const parsed = parseSkillQuery(query as string);
      expect(() => detectIntent(query as string, parsed)).not.toThrow();
    }
  });
});
