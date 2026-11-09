import { expect, test } from "bun:test";
import { fuzzyScore } from "./fuzzy";

test("matches characters in order, with gaps", () => {
  expect(fuzzyScore("bgm", "backlog-grooming")).toBeNumber();
  expect(fuzzyScore("mgb", "backlog-grooming")).toBeUndefined();
});

test("an empty query matches everything with a score of zero", () => {
  expect(fuzzyScore("", "anything")).toBe(0);
  expect(fuzzyScore("   ", "anything")).toBe(0);
});

test("ignores case unless the term has an upper-case letter", () => {
  expect(fuzzyScore("TWG", "twg-jira")).toBeUndefined();
  expect(fuzzyScore("twg", "TWG-jira")).toBeNumber();
  expect(fuzzyScore("Jira", "twg-Jira")).toBeNumber();
});

test("every space-separated term must match", () => {
  expect(fuzzyScore("git work", "git/worktree")).toBeNumber();
  expect(fuzzyScore("git react", "git/worktree")).toBeUndefined();
});

test("ranks adjacent and word-start matches above scattered ones", () => {
  const adjacent = fuzzyScore("tree", "worktree") ?? 0;
  const scattered = fuzzyScore("tree", "taraeae") ?? 0;
  expect(adjacent).toBeGreaterThan(scattered);

  const wordStart = fuzzyScore("pr", "git/pr") ?? 0;
  const midWord = fuzzyScore("pr", "git/express") ?? 0;
  expect(wordStart).toBeGreaterThan(midWord);
});

test("scores the shortest window, not the first one", () => {
  expect(fuzzyScore("ab", "a----ab")).toBe(fuzzyScore("ab", "ab"));
});
