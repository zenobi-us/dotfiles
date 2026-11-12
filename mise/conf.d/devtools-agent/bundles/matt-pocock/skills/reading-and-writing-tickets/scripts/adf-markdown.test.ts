import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { adfToMarkdown } from "./adf-markdown.ts";

type RecordedIssue = { key: string; description: unknown };

// Descriptions are trimmed from real `twg` output recorded on 2026-11-12. Mention names are replaced.
function recordedDescription(key: string): unknown {
  const output = JSON.parse(readFileSync(path.join(import.meta.dir, "fixtures/twg/query-mirror-epics.json"), "utf8")) as { data: { issues: RecordedIssue[] } };
  return output.data.issues.find((issue) => issue.key === key)!.description;
}

describe("adfToMarkdown with recorded descriptions", () => {
  test("writes links, inline code, and a bullet list", () => {
    expect(adfToMarkdown(recordedDescription("RWR-16547"))).toBe([
      "[RWR-12925](https://reckon.atlassian.net/browse/RWR-12925?utm_source=chatgpt.com) introduced the ability for users to create and lodge a SuperStream batch directly from the pay run, streamlining the Payday Super process and creating a more seamless user experience.",
      "",
      "As part of the original enhancement, the following additional functionality was also identified:",
      "",
      "- Print the batch summary =  `superstream_report`",
      "- Display batch totals on the SuperStream page = `superstream_totals`",
      "",
      "Develop the above under 2 separate and new feature flags",
      "",
      "This epic has been created as Phase 2 to ensure these additional enhancements do not delay the release of 12925.",
    ].join("\n"));
  });

  test("keeps mention text and inline card URLs", () => {
    expect(adfToMarkdown(recordedDescription("RWR-12937"))).toBe([
      "Enable users to choose which pay items are classified as Qualified Earnings and automatically include this information in each pay run as part of the STP pay event.",
      "",
      "Backend - @Example Person & @Example Person",
      "",
      "Front end - @Example Person",
      "",
      "Designer - @Example Person - <https://www.figma.com/design/KltpzGaNBpeeHWhy0PVZvv/0126-Qualifying-earnings--RWR-12937-?node-id=0-1>",
    ].join("\n"));
  });

  test("writes an ordered list, bold text, a hard break, and a panel as a quote", () => {
    expect(adfToMarkdown(recordedDescription("RWR-6974"))).toBe([
      "Users want the ability to search for employees by their:",
      "",
      "1. First name",
      "2. Last name",
      "3. Email address",
      "4. Employee number",
      "",
      "**Aha idea**: <https://reckon.aha.io/ideas/ideas/RKNWEB-I-43>",
      "",
      "**Designs:**  ",
      "Search employees here:<https://www.figma.com/file/oalf9pmJERJI3ZGCoAfmdB/%5BPayroll-Web%5D-Employees?type=design&node-id=808-20099&mode=design>",
      "",
      "> This epic was created from Discovery VOC Q4 2023",
    ].join("\n"));
  });

  test("returns an empty string when the issue has no description", () => {
    expect(adfToMarkdown(recordedDescription("RWR-14798"))).toBe("");
  });
});

describe("adfToMarkdown with other nodes", () => {
  const doc = (...content: unknown[]) => ({ type: "doc", version: 1, content });
  const paragraph = (...content: unknown[]) => ({ type: "paragraph", content });
  const text = (value: string, ...marks: unknown[]) => ({ type: "text", text: value, ...(marks.length ? { marks } : {}) });

  test("writes headings, code blocks, rules, and nested lists", () => {
    const value = doc(
      { type: "heading", attrs: { level: 2 }, content: [text("Scope")] },
      { type: "codeBlock", attrs: { language: "ts" }, content: [text("const a = 1;\nconst b = 2;")] },
      { type: "rule" },
      { type: "bulletList", content: [
        { type: "listItem", content: [paragraph(text("outer")), { type: "orderedList", attrs: { order: 3 }, content: [
          { type: "listItem", content: [paragraph(text("inner"))] },
        ] }] },
      ] },
    );
    expect(adfToMarkdown(value)).toBe("## Scope\n\n```ts\nconst a = 1;\nconst b = 2;\n```\n\n---\n\n- outer\n  3. inner");
  });

  test("writes emoji, dates, status lozenges, strike, emphasis, and media placeholders", () => {
    const value = doc(
      paragraph(
        { type: "emoji", attrs: { shortName: ":tick:", text: "✅" } }, text(" "),
        { type: "date", attrs: { timestamp: "1762905600000" } }, text(" "),
        { type: "status", attrs: { text: "IN REVIEW", color: "blue" } }, text(" "),
        text("old", { type: "strike" }), text(" "), text("new", { type: "em" }),
        { type: "mediaInline", attrs: { id: "x", type: "file" } },
      ),
      { type: "mediaSingle", content: [{ type: "media", attrs: { type: "file", id: "y", alt: "image.png" } }] },
    );
    expect(adfToMarkdown(value)).toBe("✅ 2025-11-12 `IN REVIEW` ~~old~~ *new*[attachment]\n\n[attachment: image.png]");
  });

  test("writes a table as GitHub table rows", () => {
    const cell = (type: string, value: string) => ({ type, content: [paragraph(text(value))] });
    const value = doc({ type: "table", content: [
      { type: "tableRow", content: [cell("tableHeader", "Name"), cell("tableHeader", "Value")] },
      { type: "tableRow", content: [cell("tableCell", "a|b"), cell("tableCell", "1")] },
    ] });
    expect(adfToMarkdown(value)).toBe("| Name | Value |\n| --- | --- |\n| a\\|b | 1 |");
  });

  test("fails when the value is not an ADF doc", () => {
    expect(() => adfToMarkdown({ type: "paragraph" })).toThrow("description must be an Atlassian Document Format doc");
  });
});
