import { keyText, type Theme } from "@earendil-works/pi-coding-agent";
import {
  Markdown,
  Text,
  type Component,
  type MarkdownTheme,
} from "@earendil-works/pi-tui";

type ToolStatusTone = "error" | "muted" | "success" | "warning";

type ToolStatusLineOptions = {
  tool: string;
  item: string;
  status: string;
  context?: string;
  expandable?: boolean;
  tone?: ToolStatusTone;
};

type SkillSearchRow = {
  shortname: string;
  description: string;
};

function isSkillSearchRow(value: unknown): value is SkillSearchRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SkillSearchRow>;
  return typeof row.shortname === "string" && typeof row.description === "string";
}

export function renderToolStatusLine(
  theme: Theme,
  options: ToolStatusLineOptions,
): Text {
  const separator = theme.fg("dim", " · ");
  const subject =
    theme.fg("toolTitle", theme.bold(`• ${options.tool}`)) +
    " " +
    theme.fg("accent", `\`${options.item}\``);
  const parts = [
    subject,
    theme.fg(options.tone ?? "muted", options.status),
  ];

  if (options.context) {
    parts.push(theme.fg("muted", options.context));
  }

  if (options.expandable) {
    const shortcut = keyText("app.tools.expand").trim();
    parts.push(theme.fg("muted", shortcut ? `${shortcut} expand` : "expand"));
  }

  return new Text(parts.join(separator), 0, 0);
}

export function renderMarkdownSafely(
  text: string,
  markdownTheme: MarkdownTheme,
): Component {
  const fallback = new Text(text, 0, 0);
  let markdown: Markdown | undefined;

  try {
    markdown = new Markdown(text, 0, 0, markdownTheme);
  } catch {
    return fallback;
  }

  return {
    render(width) {
      try {
        return markdown.render(width);
      } catch {
        return fallback.render(width);
      }
    },
    invalidate() {
      markdown.invalidate();
      fallback.invalidate();
    },
  };
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

export function buildCollapsedSkillSearchMarkdown(
  skills: readonly unknown[],
  totalMatches?: number,
): string {
  const validSkills = skills.filter(isSkillSearchRow);
  const shown = validSkills.slice(0, 3);
  const hidden = Math.max(0, (totalMatches ?? validSkills.length) - shown.length);

  return [
    ...shown.map((skill) => `- \`${skill.shortname}\``),
    ...(hidden > 0 ? ["", `... ${hidden} more`] : []),
  ].join("\n");
}

export function buildSkillSearchMarkdown(
  skills: readonly unknown[],
  totalMatches?: number,
): string {
  const validSkills = skills.filter(isSkillSearchRow);
  const rows = validSkills.map(
    (skill) =>
      `| ${escapeMarkdownTableCell(skill.shortname)} | ${escapeMarkdownTableCell(skill.description)} |`,
  );
  const omitted = Math.max(0, (totalMatches ?? validSkills.length) - validSkills.length);

  if (omitted > 0) rows.push(`| … | ${omitted} more results omitted from renderer details |`);

  return ["| Name | Summary |", "| --- | --- |", ...rows].join("\n");
}
