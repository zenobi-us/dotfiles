import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseWorkitemGet, parseWorkitemQueryPage, queryJiraIssues, type RunTwg } from "./twg-jira.ts";

// Fixtures are trimmed from real `twg` output recorded on 2026-11-12. Personal data is removed.
function recorded(name: string): unknown {
  return JSON.parse(readFileSync(path.join(import.meta.dir, "fixtures/twg", name), "utf8"));
}

describe("parseWorkitemGet", () => {
  test("reads the flattened issue and an inward blocker link", () => {
    expect(parseWorkitemGet(recorded("get-inward-blocked-by.json"), "RWR-20903")).toEqual({
      key: "RWR-20903",
      title: "E2E stack: pass AWS credentials to the backend containers so contact creates do not stall",
      type: "Bug",
      statusName: "To Do",
      statusCategory: "new",
      blockerKeys: ["RWR-20902"],
      description: "Found while verifying RWR-20174 (PR #759) on the local Payroll E2E container stack, 2026-10-15.",
      descriptionMarkdown: "Found while verifying RWR-20174 (PR #759) on the local Payroll E2E container stack, 2026-10-15.",
    });
  });
});

describe("parseWorkitemGet links", () => {
  test("ignores an outward blocks link and a relates link, and reads the parent key", () => {
    const issue = parseWorkitemGet(recorded("get-outward-blocks.json"), "RWR-20902");
    expect(issue.blockerKeys).toEqual([]);
    expect(issue.parentKey).toBe("RWR-18175");
    expect(issue.statusCategory).toBe("done");
  });

  test("fails when twg returns a different key", () => {
    expect(() => parseWorkitemGet(recorded("get-outward-blocks.json"), "RWR-1")).toThrow("twg get RWR-1 returned RWR-20902 instead");
  });

  test("fails on the old data.issue and fields shape", () => {
    const old = { data: { issue: { key: "RWR-1", fields: { summary: "x" } } } };
    expect(() => parseWorkitemGet(old, "RWR-1")).toThrow("twg get RWR-1 data must be an array of issues");
    expect(() => parseWorkitemGet({ data: [{ key: "RWR-1", fields: {} }] }, "RWR-1")).toThrow("has a fields wrapper");
  });

  test("fails when the field set leaves out issuelinks", () => {
    const output = recorded("get-inward-blocked-by.json") as { data: Array<Record<string, unknown>> };
    delete output.data[0].issuelinks;
    expect(() => parseWorkitemGet(output, "RWR-20903")).toThrow("has no issuelinks array; pass --fields");
  });
});

describe("queryJiraIssues", () => {
  function fakeTwg(pages: unknown[]) {
    const calls: string[][] = [];
    const runTwg: RunTwg = async (args) => {
      calls.push(args);
      if (pages.length === 0) throw new Error("fake twg has no more pages");
      return pages.shift();
    };
    return { calls, runTwg };
  }

  test("reads one page that ends with hasNextPage false", async () => {
    const twg = fakeTwg([recorded("query-one-page.json")]);
    const issues = await queryJiraIssues("parent = RWR-18175", twg.runTwg);
    expect(issues.map((issue) => issue.key)).toEqual(["RWR-20174", "RWR-20902", "RWR-20903"]);
    expect(issues[2].blockerKeys).toEqual(["RWR-20902"]);
    expect(twg.calls).toEqual([["jira", "workitem", "query", "--jql", "parent = RWR-18175",
      "--fields", "summary,status,issuetype,parent,issuelinks,description,updated", "--limit", "100"]]);
  });

  test("treats a response with no pageInfo as the last page", async () => {
    const twg = fakeTwg([recorded("query-no-page-info.json")]);
    const issues = await queryJiraIssues("key = RWR-20902", twg.runTwg);
    expect(issues.map((issue) => issue.key)).toEqual(["RWR-20902"]);
    expect(twg.calls).toHaveLength(1);
  });

  test("follows pageInfo.nextCursor with --after", async () => {
    const firstPage = recorded("query-page-1.json") as { pageInfo: { nextCursor: string } };
    const twg = fakeTwg([firstPage, recorded("query-page-2.json")]);
    const issues = await queryJiraIssues("parent = RWR-18175", twg.runTwg);
    expect(issues.map((issue) => issue.key)).toEqual(["RWR-20174", "RWR-20902", "RWR-20903"]);
    expect(twg.calls).toHaveLength(2);
    expect(twg.calls[0]).not.toContain("--after");
    expect(twg.calls[1].slice(-2)).toEqual(["--after", firstPage.pageInfo.nextCursor]);
  });

  test("fails when the next page has no cursor", async () => {
    const page = recorded("query-page-1.json") as { pageInfo: Record<string, unknown> };
    delete page.pageInfo.nextCursor;
    await expect(queryJiraIssues("x", fakeTwg([page]).runTwg)).rejects.toThrow("twg query page 1 pageInfo.nextCursor must be a non-empty string");
  });

  test("fails when a cursor repeats", async () => {
    const twg = fakeTwg([recorded("query-page-1.json"), recorded("query-page-1.json")]);
    await expect(queryJiraIssues("x", twg.runTwg)).rejects.toThrow("twg query page 2 repeated an earlier pageInfo.nextCursor");
  });

  test("fails on the old data.data.issues shape instead of returning no issues", async () => {
    await expect(queryJiraIssues("x", fakeTwg([{ data: { data: { issues: [] } } }]).runTwg)).rejects.toThrow("twg query page 1 has no data.issues array");
  });
});

describe("parseWorkitemQueryPage mirror fields", () => {
  test("reads updated and the description as Markdown", () => {
    const { issues } = parseWorkitemQueryPage(recorded("query-mirror-epics.json"));
    const epic = issues.find((issue) => issue.key === "RWR-12937")!;
    expect(epic.updated).toBe("2026-09-11T15:14:37.861+1000");
    expect(epic.descriptionMarkdown).toContain("Designer - @Example Person - <https://www.figma.com/design/");
    expect(issues.find((issue) => issue.key === "RWR-14798")!.descriptionMarkdown).toBe("");
  });

  test("leaves updated out when twg does not return it", () => {
    expect(parseWorkitemGet(recorded("get-inward-blocked-by.json"), "RWR-20903").updated).toBeUndefined();
  });
});
