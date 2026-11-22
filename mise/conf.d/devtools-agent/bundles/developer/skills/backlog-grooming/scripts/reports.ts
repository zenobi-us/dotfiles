// Pure report validation is shared by compilation and safe upgrades.
import { readFileSync } from "node:fs";
import { basename } from "node:path";
export const VERDICTS = ["groomed", "clarify", "cancel", "action"] as const;
const POINTS = [1, 2, 3, 5, 8, 13];
const ACTION_KINDS = ["comment", "estimate", "update", "transition", "link", "create", "label"];
const SECTIONS = [
  "Next action",
  "Story points",
  "Clarifications required",
  "Things to be aware of",
  "Claims",
];

type Verdict = (typeof VERDICTS)[number];

interface ProposedAction {
  id: string;
  kind: string;
  summary: string;
  detail: string;
}

export interface Report {
  file: string;
  ticket: string;
  title: string;
  url?: string;
  verdict: Verdict;
  storyPoints?: number;
  action?: string;
  comment?: string;
  questionCount: number;
  proposedActions: ProposedAction[];
  body: string;
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isVerdict(value: unknown): value is Verdict {
  return typeof value === "string" && (VERDICTS as readonly string[]).includes(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function sectionBody(body: string, heading: string): string | undefined {
  const lines = body.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s/.test(line));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

function countQuestions(section: string): number {
  return section.split("\n").filter((line) => /^\s*(\d+[.)]|[-*])\s+\S/.test(line)).length;
}

function parseActions(value: unknown, where: string, errors: string[]): ProposedAction[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push(`${where}: proposed_actions must be a list`);
    return [];
  }
  const seen = new Set<string>();
  const actions: ProposedAction[] = [];
  value.forEach((item, index) => {
    const at = `${where}: proposed_actions[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${at} must be a mapping`);
      return;
    }
    const id = typeof item.id === "string" ? item.id : "";
    const kind = typeof item.kind === "string" ? item.kind : "";
    const summary = typeof item.summary === "string" ? item.summary : "";
    if (!id.trim() || !kind.trim() || !summary.trim()) {
      errors.push(`${at} needs id, kind and summary`);
      return;
    }
    if (!ACTION_KINDS.includes(kind)) errors.push(`${at}: kind must be one of ${ACTION_KINDS.join(", ")}; got ${kind}`);
    if (seen.has(id)) errors.push(`${at}: id ${id} is used twice`);
    seen.add(id);
    if (item.detail !== undefined && typeof item.detail !== "string") errors.push(`${at}: detail must be a string`);
    actions.push({ ...item, id, kind, summary, detail: typeof item.detail === "string" ? item.detail : "" });
  });
  return actions;
}

export function parseReport(file: string, errors: string[], raw = readFileSync(file, "utf8")): Report | undefined {
  const where = basename(file);
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    errors.push(`${where}: missing YAML frontmatter`);
    return undefined;
  }
  let meta: unknown;
  try {
    meta = Bun.YAML.parse(match[1]);
  } catch (error) {
    errors.push(`${where}: frontmatter is not valid YAML (${error instanceof Error ? error.message : String(error)})`);
    return undefined;
  }
  if (!isRecord(meta)) {
    errors.push(`${where}: frontmatter must be a mapping`);
    return undefined;
  }
  const body = match[2];
  const before = errors.length;
  if (Object.hasOwn(meta, "schemaVersion") &&
      !["grooming-report/v1", "grooming-report/v2"].includes(meta.schemaVersion as string)) {
    errors.push(`${where}: unsupported schemaVersion`);
  }
  if (Object.hasOwn(meta, "schema")) errors.push(`${where}: schema is not a supported report identifier`);

  const ticket = text(meta.ticket);
  const title = text(meta.title);
  if (!ticket) errors.push(`${where}: ticket is required`);
  if (!title) errors.push(`${where}: title is required`);
  if (ticket && basename(file, ".md") !== ticket) errors.push(`${where}: file name must be ${ticket}.md`);
  if (!isVerdict(meta.verdict)) errors.push(`${where}: verdict must be one of ${VERDICTS.join(", ")}`);

  const missing = SECTIONS.filter((heading) => sectionBody(body, heading) === undefined);
  for (const heading of missing) errors.push(`${where}: section "## ${heading}" is missing`);
  const positions = SECTIONS.map((heading) => body.search(new RegExp(`^## ${heading}\\s*$`, "m")));
  if (missing.length === 0 && positions.some((pos, i) => i > 0 && pos < positions[i - 1])) {
    errors.push(`${where}: sections must be in this order: ${SECTIONS.join(", ")}`);
  }

  const clarifications = sectionBody(body, "Clarifications required") ?? "";
  const questionCount = countQuestions(clarifications);
  const storyPoints = typeof meta.story_points === "number" ? meta.story_points : undefined;
  const action = text(meta.action);
  const comment = text(meta.comment);
  const verdict = meta.verdict;

  if (verdict === "groomed" && (storyPoints === undefined || !POINTS.includes(storyPoints))) {
    errors.push(`${where}: a groomed report needs story_points from ${POINTS.join(", ")}`);
  }
  if (verdict === "clarify" && questionCount === 0) {
    errors.push(`${where}: a clarify report needs a list item for each question under "## Clarifications required"`);
  }
  if (verdict === "cancel" && !comment) errors.push(`${where}: a cancel report needs comment`);
  if (verdict === "action" && (!action || !comment)) errors.push(`${where}: an action report needs action and comment`);

  const proposedActions = parseActions(meta.proposed_actions, where, errors);
  if (errors.length > before || !ticket || !title || !isVerdict(verdict)) return undefined;

  return {
    file,
    ticket,
    title,
    url: text(meta.url),
    verdict,
    storyPoints,
    action,
    comment,
    questionCount,
    proposedActions,
    body,
  };
}
