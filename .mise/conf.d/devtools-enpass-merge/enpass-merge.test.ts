import { describe, expect, test } from "bun:test";
import { mergeExports } from "./enpass-merge";

describe("mergeExports", () => {
  test("keeps the A export shape and items only in A", () => {
    const result = mergeExports(
      { version: 1, items: [{ uuid: "a", title: "Only A", updatedAt: "2026-01-01" }] },
      { version: 2, items: [] },
    );

    expect(result.output).toEqual({ version: 1, items: [{ uuid: "a", title: "Only A", updatedAt: "2026-01-01" }] });
    expect(result.decisions[0]?.reason).toBe("only-in-a");
  });

  test("uses the item with the latest update date", () => {
    const result = mergeExports(
      { items: [{ uuid: "same", title: "Login", username: "old", updatedAt: "2026-04-01T10:00:00Z" }] },
      { items: [{ uuid: "same", title: "Login", username: "new", updatedAt: "2026-04-02T10:00:00Z" }] },
    );

    expect((result.output as { items: Array<{ username: string }> }).items[0]?.username).toBe("new");
    expect(result.decisions[0]).toMatchObject({ action: "kept-b", reason: "b-newer" });
  });

  test("keeps A when B is older, equal, or undated", () => {
    const result = mergeExports(
      {
        items: [
          { uuid: "older-b", value: "A", updatedAt: "2026-04-02" },
          { uuid: "equal", value: "A", updatedAt: "2026-04-02" },
          { uuid: "undated", value: "A" },
        ],
      },
      {
        items: [
          { uuid: "older-b", value: "B", updatedAt: "2026-04-01" },
          { uuid: "equal", value: "B", updatedAt: "2026-04-02" },
          { uuid: "undated", value: "B" },
        ],
      },
    );

    const items = (result.output as { items: Array<{ value: string }> }).items;
    expect(items.map((item) => item.value)).toEqual(["A", "A", "A"]);
    expect(result.decisions.map((decision) => decision.reason)).toEqual(["a-newer", "a-newer", "undated-a-wins"]);
  });

  test("adds items only in B and matches UUID-less items by title/category", () => {
    const result = mergeExports(
      { items: [{ title: "Email", category: "login", value: "old", updatedAt: "2026-01-01" }] },
      {
        items: [
          { title: " email ", category: "LOGIN", value: "new", updatedAt: "2026-02-01" },
          { uuid: "b-only", title: "Only B" },
        ],
      },
    );

    const items = (result.output as { items: Array<{ value?: string; title: string }> }).items;
    expect(items).toHaveLength(2);
    expect(items[0]?.value).toBe("new");
    expect(items[1]?.title).toBe("Only B");
    expect(result.decisions.map((decision) => decision.reason)).toEqual(["b-newer", "only-in-b"]);
  });

  test("supports a bare array export", () => {
    const result = mergeExports([{ uuid: "a", title: "A" }], [{ uuid: "b", title: "B" }]);
    expect(result.output).toEqual([{ uuid: "a", title: "A" }, { uuid: "b", title: "B" }]);
  });
});
