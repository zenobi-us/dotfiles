import {
  getMarkdownTheme,
  initTheme,
  type Theme,
} from "@earendil-works/pi-coding-agent";
import { describe, expect, test } from "bun:test";
import {
  buildCollapsedSkillSearchMarkdown,
  buildSkillSearchMarkdown,
  renderMarkdownSafely,
  renderToolStatusLine,
} from "./tool-render.js";

const theme = {
  bold: (text: string) => text,
  fg: (_color: string, text: string) => text,
} as unknown as Theme;

describe("renderToolStatusLine", () => {
  test("renders the canonical tool, item, status, and context format", () => {
    const component = renderToolStatusLine(theme, {
      tool: "Skill",
      item: "typescript-testing",
      status: "Loaded",
      context: "184 lines",
      tone: "success",
    });

    expect(component.render(200).map((line) => line.trimEnd())).toEqual([
      "• Skill `typescript-testing` · Loaded · 184 lines",
    ]);
  });
});

const searchSkills = [
  { shortname: "typescript-testing", description: "Testing TypeScript projects" },
  { shortname: "debugging", description: "Systematic | bug diagnosis" },
  { shortname: "code-review", description: "Review\nbranch changes" },
  { shortname: "tooling", description: "Developer tooling" },
];

describe("skill search Markdown", () => {
  test("renders the first three skills as a collapsed list", () => {
    expect(buildCollapsedSkillSearchMarkdown(searchSkills)).toBe(
      [
        "- `typescript-testing`",
        "- `debugging`",
        "- `code-review`",
        "",
        "... 1 more",
      ].join("\n"),
    );
  });

  test("renders all skills as an expanded table and escapes cells", () => {
    expect(buildSkillSearchMarkdown(searchSkills)).toBe(
      [
        "| Name | Summary |",
        "| --- | --- |",
        "| typescript-testing | Testing TypeScript projects |",
        "| debugging | Systematic \\| bug diagnosis |",
        "| code-review | Review branch changes |",
        "| tooling | Developer tooling |",
      ].join("\n"),
    );
  });

  test("renders a large expanded result as a Markdown table instead of JSON", () => {
    initTheme(undefined, false);
    const skills = Array.from({ length: 75 }, (_, index) => ({
      shortname: `skill-${index}`,
      description: `Summary for skill ${index}`,
    }));
    const component = renderMarkdownSafely(
      buildSkillSearchMarkdown(skills),
      getMarkdownTheme(),
    );
    const output = component.render(140).join("\n");

    expect(output).toContain("Name");
    expect(output).toContain("Summary");
    expect(output).toContain("skill-74");
    expect(output).not.toContain('"skills"');
  });

  test("keeps expanded output renderable when result details were sanitized", () => {
    const sanitizedSkills = [
      ...searchSkills,
      "[output-policy: array truncated, dropped 71 item(s)]",
    ];

    expect(buildSkillSearchMarkdown(sanitizedSkills, 75)).toContain(
      "| … | 71 more results omitted from renderer details |",
    );
    expect(buildCollapsedSkillSearchMarkdown(sanitizedSkills, 75)).toContain(
      "... 72 more",
    );
  });
});
