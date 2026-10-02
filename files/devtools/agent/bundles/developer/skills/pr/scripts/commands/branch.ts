/**
 * Check a git branch name against the conventional form this skill documents, and build one
 * from its parts. `pr.ts branch validate` and `pr.ts branch build` are the entry points.
 */
import { captureResult, repoRoot } from "../core.ts";

export const TYPES = ["feat", "feature", "fix", "hotfix", "chore", "docs", "refactor", "perf", "test", "ci", "build", "style"];

/** Branch names a working branch must never take: they are the lines work merges into. */
export const RESERVED = ["main", "master", "develop", "development", "trunk", "release"];

export const TICKET = /^[A-Z][A-Z0-9]+-\d+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface Parsed {
  type: string | null;
  ticket: string | null;
  slug: string | null;
}

export interface Verdict extends Parsed {
  branch: string;
  valid: boolean;
  errors: string[];
}

/** `feat/ABC-12-add-widget` -> its three parts. A part that is not there comes back null. */
export function parse(branch: string): Parsed {
  const slash = branch.indexOf("/");
  if (slash < 1) return { type: null, ticket: null, slug: null };
  const type = branch.slice(0, slash);
  const rest = branch.slice(slash + 1);
  const dash = rest.indexOf("-", rest.indexOf("-") + 1);
  const head = dash < 0 ? rest : rest.slice(0, dash);
  if (TICKET.test(head)) return { type, ticket: head, slug: rest.slice(head.length + 1) || null };
  return { type, ticket: null, slug: rest || null };
}

export function validate(branch: string, { requireTicket = false } = {}): Verdict {
  const errors: string[] = [];
  const parsed = parse(branch);

  if (!branch.trim()) return { branch, ...parsed, valid: false, errors: ["the branch name is empty"] };
  if (RESERVED.includes(branch)) errors.push(`${branch} is a base branch, not a working branch`);
  if (/\.\.|[~^: \\?*[\]]|@\{|^-|\/$|\/\/|\.lock$/.test(branch)) errors.push("git rejects this name (see git check-ref-format)");

  if (parsed.type === null) errors.push(`the name needs a <type>/ prefix, one of: ${TYPES.join(", ")}`);
  else if (!TYPES.includes(parsed.type)) errors.push(`unknown type "${parsed.type}"; use one of: ${TYPES.join(", ")}`);

  if (requireTicket && parsed.ticket === null) errors.push("a ticket key is required, as in feat/ABC-123-short-description");

  if (parsed.slug === null) errors.push("the name needs a short description after the type");
  else if (!SLUG.test(parsed.slug)) errors.push(`"${parsed.slug}" must be lowercase words joined by single hyphens`);

  return { branch, ...parsed, valid: errors.length === 0, errors };
}

const kebab = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function build(type: string, description: string, ticket?: string): string {
  return [type, [ticket, kebab(description)].filter(Boolean).join("-")].join("/");
}

export async function currentBranch(): Promise<string> {
  const result = await captureResult("git", ["branch", "--show-current"], { cwd: repoRoot() });
  return result.code === 0 ? result.stdout.trim() : "";
}
