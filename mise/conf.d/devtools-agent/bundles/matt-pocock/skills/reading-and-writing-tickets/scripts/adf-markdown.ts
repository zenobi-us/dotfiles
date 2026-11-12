import { record } from "./dep-tree-shared.ts";

// Converts a Jira description in Atlassian Document Format (ADF) to Markdown for mirror files.
// Node names follow https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/.
// An unknown node keeps the text of its children, so new node types lose formatting, not words.

type AdfNode = Record<string, unknown>;

/** Returns Markdown for an ADF doc. Returns an empty string when the value is null or undefined. */
export function adfToMarkdown(value: unknown, label = "description"): string {
  if (value === undefined || value === null) return "";
  const document = record(value, label);
  if (document.type !== "doc") throw new Error(`${label} must be an Atlassian Document Format doc`);
  return blocks(children(document)).join("\n\n").trim();
}

const INLINE_TYPES = new Set(["text", "hardBreak", "mention", "emoji", "date", "status", "inlineCard", "mediaInline", "placeholder", "inlineExtension"]);

function children(node: AdfNode): AdfNode[] {
  return Array.isArray(node.content) ? node.content.map((child) => record(child, `ADF ${String(node.type)} child`)) : [];
}

function attrs(node: AdfNode): Record<string, unknown> {
  return node.attrs && typeof node.attrs === "object" ? node.attrs as Record<string, unknown> : {};
}

// Renders a run of nodes as Markdown blocks. Inline nodes outside a paragraph form one block.
function blocks(nodes: AdfNode[]): string[] {
  const result: string[] = [];
  let pendingInline: AdfNode[] = [];
  const flushInline = () => {
    const text = inline(pendingInline).trim();
    if (text) result.push(text);
    pendingInline = [];
  };
  for (const node of nodes) {
    if (INLINE_TYPES.has(String(node.type))) { pendingInline.push(node); continue; }
    flushInline();
    const text = block(node);
    if (text.trim()) result.push(text);
  }
  flushInline();
  return result;
}

function block(node: AdfNode): string {
  switch (node.type) {
    case "paragraph": return inline(children(node)).trim();
    case "heading": return `${"#".repeat(headingLevel(node))} ${inline(children(node)).trim()}`;
    case "bulletList": return listItems(node, () => "- ");
    case "orderedList": {
      const start = typeof attrs(node).order === "number" ? attrs(node).order as number : 1;
      return listItems(node, (index) => `${start + index}. `);
    }
    case "codeBlock": {
      const language = typeof attrs(node).language === "string" ? attrs(node).language : "";
      return `\`\`\`${language}\n${children(node).map((child) => String(child.text ?? "")).join("")}\n\`\`\``;
    }
    case "blockquote":
    case "panel": return quote(blocks(children(node)).join("\n\n"));
    case "rule": return "---";
    case "table": return table(node);
    case "mediaSingle":
    case "mediaGroup": return children(node).map(attachment).join("\n");
    case "media": return attachment(node);
    case "blockCard":
    case "embedCard": return typeof attrs(node).url === "string" ? `<${attrs(node).url}>` : "";
    case "expand":
    case "nestedExpand": {
      const title = typeof attrs(node).title === "string" && attrs(node).title ? [`**${attrs(node).title}**`] : [];
      return [...title, ...blocks(children(node))].join("\n\n");
    }
    default: return blocks(children(node)).join("\n\n");
  }
}

function headingLevel(node: AdfNode): number {
  const level = attrs(node).level;
  return typeof level === "number" && level >= 1 && level <= 6 ? level : 1;
}

// Items are tight: lines of one item follow the marker, and later lines are indented to the marker width.
function listItems(node: AdfNode, marker: (index: number) => string): string {
  return children(node).map((item, index) => {
    const prefix = marker(index);
    const lines = blocks(children(item)).join("\n").split("\n");
    return lines.map((line, lineIndex) => lineIndex === 0 ? `${prefix}${line}` : line ? `${" ".repeat(prefix.length)}${line}` : line).join("\n");
  }).join("\n");
}

function quote(text: string): string {
  return text.split("\n").map((line) => line ? `> ${line}` : ">").join("\n");
}

// The first row is the header row, because GitHub tables need one.
function table(node: AdfNode): string {
  const rows = children(node).map((row) => children(row).map((cell) => blocks(children(cell)).join(" ").replace(/\n/g, " ").replace(/\|/g, "\\|")));
  if (rows.length === 0) return "";
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(rows[0]!), line(rows[0]!.map(() => "---")), ...rows.slice(1).map(line)].join("\n");
}

function attachment(node: AdfNode): string {
  const alt = attrs(node).alt;
  return typeof alt === "string" && alt ? `[attachment: ${alt}]` : "[attachment]";
}

function inline(nodes: AdfNode[]): string {
  return nodes.map(inlineNode).join("");
}

function inlineNode(node: AdfNode): string {
  const nodeAttrs = attrs(node);
  switch (node.type) {
    case "text": return marked(typeof node.text === "string" ? node.text : "", node.marks);
    case "hardBreak": return "  \n";
    case "mention": return typeof nodeAttrs.text === "string" && nodeAttrs.text ? nodeAttrs.text : "@unknown";
    case "emoji": return typeof nodeAttrs.text === "string" && nodeAttrs.text ? nodeAttrs.text : String(nodeAttrs.shortName ?? "");
    case "date": return isoDate(nodeAttrs.timestamp);
    case "status": return typeof nodeAttrs.text === "string" && nodeAttrs.text ? `\`${nodeAttrs.text}\`` : "";
    case "inlineCard": return typeof nodeAttrs.url === "string" ? `<${nodeAttrs.url}>` : "";
    case "mediaInline": return attachment(node);
    default: return inline(children(node));
  }
}

// Code applies first, so the other marks wrap the backticks. A link wraps everything.
function marked(text: string, marks: unknown): string {
  if (!text || !Array.isArray(marks)) return text;
  const types = new Map(marks.map((mark) => { const value = record(mark, "ADF mark"); return [String(value.type), attrs(value)] as const; }));
  let result = text;
  if (types.has("code")) result = `\`${result}\``;
  if (types.has("strike")) result = `~~${result}~~`;
  if (types.has("em")) result = `*${result}*`;
  if (types.has("strong")) result = `**${result}**`;
  const href = types.get("link")?.href;
  if (typeof href === "string" && href) result = `[${result}](${href})`;
  return result;
}

// Jira stores a date node as milliseconds since the epoch, as a string.
function isoDate(timestamp: unknown): string {
  const milliseconds = Number(timestamp);
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString().slice(0, 10) : "";
}
