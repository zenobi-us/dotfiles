import { tokenizeJsonLine, type SyntaxSegment } from "./syntax-highlight.js";

export interface ThemeHighlightAdapter {
  fg(color: string, text: string): string;
}

function styleSegment(theme: ThemeHighlightAdapter, text: string, color?: string): string {
  if (text.length === 0) return "";
  return color ? theme.fg(color, text) : text;
}

function renderJsonSegments(theme: ThemeHighlightAdapter, segments: SyntaxSegment[]): string {
  return segments.map((segment) => {
    switch (segment.token) {
      case "attr":
        return theme.fg("syntaxVariable", segment.text);
      case "string":
        return theme.fg("syntaxString", segment.text);
      case "number":
      case "literal":
        return theme.fg("syntaxNumber", segment.text);
      case "meta":
        return theme.fg("syntaxPunctuation", segment.text);
      default:
        return segment.text;
    }
  }).join("");
}

function findNextMarkdownToken(text: string, start: number):
  | { index: number; length: number; kind: "code"; text: string }
  | { index: number; length: number; kind: "link"; label: string; url: string }
  | null {
  const remaining = text.slice(start);
  const codeMatch = /`[^`]+`/.exec(remaining);
  const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(remaining);

  const codeIndex = codeMatch ? start + codeMatch.index : Number.POSITIVE_INFINITY;
  const linkIndex = linkMatch ? start + linkMatch.index : Number.POSITIVE_INFINITY;

  if (!Number.isFinite(codeIndex) && !Number.isFinite(linkIndex)) return null;

  if (codeIndex <= linkIndex && codeMatch) {
    return {
      index: codeIndex,
      length: codeMatch[0].length,
      kind: "code",
      text: codeMatch[0],
    };
  }

  if (!linkMatch) return null;
  return {
    index: linkIndex,
    length: linkMatch[0].length,
    kind: "link",
    label: linkMatch[1] ?? "",
    url: linkMatch[2] ?? "",
  };
}

function renderMarkdownInline(theme: ThemeHighlightAdapter, text: string, baseColor?: string): string {
  const output: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const nextToken = findNextMarkdownToken(text, cursor);
    if (!nextToken) {
      output.push(styleSegment(theme, text.slice(cursor), baseColor));
      break;
    }

    if (nextToken.index > cursor) {
      output.push(styleSegment(theme, text.slice(cursor, nextToken.index), baseColor));
    }

    if (nextToken.kind === "code") {
      output.push(theme.fg("mdCode", nextToken.text));
    } else {
      output.push(theme.fg("mdLink", `[${nextToken.label}]`));
      output.push(theme.fg("mdLinkUrl", `(${nextToken.url})`));
    }

    cursor = nextToken.index + nextToken.length;
  }

  return output.join("");
}

export function highlightMarkdownLine(theme: ThemeHighlightAdapter, text: string): string {
  if (text.length === 0) return "";

  if (/^\s{0,3}#{1,6}\s+/.test(text)) {
    return theme.fg("mdHeading", text);
  }

  if (/^\s*(```+|~~~+)/.test(text)) {
    return theme.fg("mdCodeBlockBorder", text);
  }

  if (/^\s*([-*_]\s*){3,}$/.test(text.trim())) {
    return theme.fg("mdHr", text);
  }

  const quoteMatch = /^(\s*>+\s?)(.*)$/.exec(text);
  if (quoteMatch) {
    return `${theme.fg("mdQuoteBorder", quoteMatch[1] ?? "")}${renderMarkdownInline(theme, quoteMatch[2] ?? "", "mdQuote")}`;
  }

  const listMatch = /^(\s*)([-*+]|\d+[.)])(\s+)(.*)$/.exec(text);
  if (listMatch) {
    return `${listMatch[1] ?? ""}${theme.fg("mdListBullet", listMatch[2] ?? "")}${listMatch[3] ?? ""}${renderMarkdownInline(theme, listMatch[4] ?? "")}`;
  }

  return renderMarkdownInline(theme, text);
}

export function highlightJsonLine(theme: ThemeHighlightAdapter, text: string): string {
  if (text.length === 0) return "";
  return renderJsonSegments(theme, tokenizeJsonLine(text));
}
