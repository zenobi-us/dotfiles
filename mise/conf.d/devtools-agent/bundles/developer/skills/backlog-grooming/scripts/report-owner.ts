// The shared writer owns persistence. These hooks only interpret grooming content.
import { basename } from "node:path";
import type { UpgradeOwner } from "../../../../agent-core/skills/skill-contracts/scripts/upgrades.ts";
import { parseReport } from "./reports.ts";

const REPORT_V1 = "grooming-report/v1";
const REPORT_V2 = "grooming-report/v2";
const ACTIONS_V1 = "grooming-actions/v1";
const ACTIONS_V2 = "grooming-actions/v2";
const PROCEDURE = "file:references/upgrades.md";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decode(content: string): { meta: Record<string, unknown>; body: string } | unknown[] {
  if (content.startsWith("---")) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) throw new Error("Report needs YAML frontmatter.");
    const meta = Bun.YAML.parse(match[1]);
    if (!record(meta)) throw new Error("Report frontmatter must be a mapping.");
    return { meta, body: match[2] };
  }
  const value = JSON.parse(content);
  if (!Array.isArray(value) && !record(value)) throw new Error("Actions must be a record or a historical array.");
  return Array.isArray(value) ? value : { meta: value, body: "" };
}

function identify(content: string): string | null {
  const value = decode(content);
  if (Array.isArray(value)) return null;
  if (Object.hasOwn(value.meta, "schema")) throw new Error("Unsupported schema identifier field.");
  if (!Object.hasOwn(value.meta, "schemaVersion")) return null;
  if (typeof value.meta.schemaVersion !== "string") throw new Error("schemaVersion must be a string.");
  return value.meta.schemaVersion;
}

// Historical arrays remain readable, but only the current envelope is produced.
export function readActions(content: string): Record<string, unknown>[] {
  // Refuse numeric lexemes that JSON cannot reproduce exactly during conversion.
  for (const token of content.match(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) ?? []) {
    if (!token.startsWith('"') && JSON.stringify(Number(token)) !== token) throw new Error("Action metadata has an unsafe numeric representation.");
  }
  const value = JSON.parse(content);
  const tickets = Array.isArray(value) ? value : record(value) && value.schemaVersion === ACTIONS_V2 && !Object.hasOwn(value, "schema") ? value.tickets : undefined;
  if (!Array.isArray(tickets)) throw new Error("Unsupported actions contract or invalid tickets list.");
  const seen = new Set<string>();
  for (const ticket of tickets) {
    if (!record(ticket) || typeof ticket.ticket !== "string" || !ticket.ticket.trim() || typeof ticket.title !== "string" || !ticket.title.trim() || !["groomed", "clarify", "cancel", "action"].includes(ticket.verdict as string) || !Array.isArray(ticket.proposed_actions)) throw new Error("Invalid action ticket record.");
    if (seen.has(ticket.ticket)) throw new Error("Duplicate action ticket identity.");
    seen.add(ticket.ticket);
    const ids = new Set<string>();
    for (const action of ticket.proposed_actions) {
      if (!record(action) || !["comment", "estimate", "update", "transition", "link", "create", "label"].includes(action.kind as string) || typeof action.id !== "string" || !action.id.trim() || typeof action.summary !== "string" || !action.summary.trim() || typeof action.detail !== "string") throw new Error("Invalid proposed action.");
      if (ids.has(action.id)) throw new Error("Duplicate proposed action identity.");
      ids.add(action.id);
    }
  }
  return tickets;
}

const owner: UpgradeOwner = {
  identify,
  async detectLegacy(content) {
    try {
      if (content.startsWith("---")) return await this.validate(REPORT_V1, content) ? [REPORT_V1] : [];
      return Array.isArray(JSON.parse(content)) && await this.validate(ACTIONS_V1, content) ? [ACTIONS_V1] : [];
    } catch { return []; }
  },
  validate(contract, content) {
    try {
      const id = identify(content);
      if (id !== null && id !== contract) return false;
      if ([REPORT_V1, REPORT_V2].includes(contract)) {
        if (contract === REPORT_V2 && id !== REPORT_V2) return false;
        const value = decode(content);
        if (Array.isArray(value)) return false;
        const errors: string[] = [];
        return !!parseReport(`${value.meta.ticket}.md`, errors, content) && errors.length === 0;
      }
      if (contract === ACTIONS_V1 && !Array.isArray(JSON.parse(content))) return false;
      if (contract === ACTIONS_V2 && id !== ACTIONS_V2) return false;
      if (![ACTIONS_V1, ACTIONS_V2].includes(contract)) return false;
      readActions(content);
      return true;
    } catch { return false; }
  },
  preservation(contract, content) {
    if (contract === ACTIONS_V1) return { tickets: JSON.parse(content) };
    if (contract === ACTIONS_V2) {
      const { schemaVersion, ...rest } = JSON.parse(content);
      return rest;
    }
    // Keep report YAML and body byte-for-byte, including comments and unknown metadata.
    return content.replace(/^schemaVersion: grooming-report\/v[12]\r?\n/m, "");
  },
  mutable(path, content) {
    if (path.split(/[\\/]/).some((part) => ["events", "receipts", "artifacts", "evidence", "snapshots"].includes(part))) return false;
    const value = decode(content);
    if (!Array.isArray(value) && value.meta.immutable === true) return false;
    return content.startsWith("---")
      ? !Array.isArray(value) && basename(path) === `${value.meta.ticket}.md`
      : basename(path) === "actions.json";
  },
  destinations(operation) {
    if (operation !== "upgrade") throw new Error("Only explicit upgrade is supported; tracker actions use the ticket skill.");
    return [REPORT_V2, ACTIONS_V2];
  },
  convert(procedure, from, to, content) {
    if (procedure !== PROCEDURE) throw new Error("Unsupported upgrade procedure.");
    if (from === REPORT_V1 && to === REPORT_V2) {
      const existing = identify(content);
      // Noncanonical explicit YAML needs a decision rather than a lossy rewrite.
      if (existing && !/^schemaVersion: grooming-report\/v1\r?$/m.test(content)) throw new Error("Explicit report identifier cannot be safely replaced.");
      const converted = existing ? content.replace(/^schemaVersion: grooming-report\/v1(?=\r?$)/m, "schemaVersion: grooming-report/v2") : content.replace(/^(---\r?\n)/, "$1schemaVersion: grooming-report/v2\n");
      return { content: converted, lossless: true, requiresDecision: false };
    }
    if (from === ACTIONS_V1 && to === ACTIONS_V2) {
      const value = JSON.parse(content);
      const compact = (content.match(/"(?:\\.|[^"\\])*"|\s+|./gs) ?? []).filter((token) => !/^\s+$/.test(token)).join("");
      if (compact !== JSON.stringify(value)) throw new Error("Action JSON cannot round-trip exactly; conversion requires a decision.");
      return { content: `${JSON.stringify({ schemaVersion: ACTIONS_V2, tickets: value }, null, 2)}\n`, lossless: true, requiresDecision: false };
    }
    throw new Error("Unsupported upgrade endpoints.");
  },
  mutate() { throw new Error("Grooming upgrades do not apply tracker actions."); },
};
export default owner;
