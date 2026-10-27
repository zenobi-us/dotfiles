// Shared validation for versioned tracker readers and explicit migration tooling.
export const TICKET_SCHEMA = "tracker-ticket/v1";
export const INITIATIVE_SCHEMA = "tracker-initiative/v1";
export const RESULT_SCHEMA = "tracker-result/v1";
export type RecordKind = "ticket" | "initiative";

type ValidationOptions = { allowLegacy?: boolean; expectedId?: string };
const statuses = ["unclaimed", "claimed", "implemented", "merged", "completed"];

export function validateRecord(fields: Record<string, unknown>, kind: RecordKind, options: ValidationOptions = {}): string[] {
  if (!Object.hasOwn(fields, "schema")) return options.allowLegacy ? [] : ["schema is required; migrate this legacy record explicitly."];
  const schema = kind === "ticket" ? TICKET_SCHEMA : INITIATIVE_SCHEMA;
  if (fields.schema !== schema) return [`schema must be ${schema}; unsupported schemas cannot be read or changed.`];
  const errors: string[] = [];
  for (const field of ["id", "title"]) {
    if (typeof fields[field] !== "string" || !fields[field].trim()) errors.push(`${field} must be a non-empty string.`);
  }
  if (options.expectedId !== undefined && fields.id !== options.expectedId) errors.push("id must match the record filename or initiative directory.");
  if (kind === "initiative") {
    for (const field of ["work_status", "blocked_by"]) if (Object.hasOwn(fields, field)) errors.push(`initiative must not contain ticket field ${field}.`);
    return errors;
  }
  if (typeof fields.work_status !== "string" || !statuses.includes(fields.work_status)) errors.push("work_status must be unclaimed, claimed, implemented, merged, or completed.");
  if (!Array.isArray(fields.blocked_by) || fields.blocked_by.some(value => typeof value !== "string" || !value.trim())) errors.push("blocked_by must be a list of non-empty string ticket IDs.");
  if (Object.hasOwn(fields, "parent") && (typeof fields.parent !== "string" || !fields.parent.trim())) errors.push("parent must be a non-empty string when present.");
  if (Object.hasOwn(fields, "sequence") && (typeof fields.sequence !== "number" || !Number.isInteger(fields.sequence) || fields.sequence <= 0)) errors.push("sequence must be a finite positive integer when present.");
  return errors;
}

export function assertRecord(fields: Record<string, unknown>, kind: RecordKind, options: ValidationOptions = {}): void {
  const errors = validateRecord(fields, kind, options);
  if (errors.length) throw new Error(`Invalid ${kind} record: ${errors.join(" ")}`);
}

export function validateInitiativeMembership(initiativeId: string, ticketIds: string[], tickets: { id: string; parent?: string }[]): string[] {
  const errors: string[] = [];
  const byId = new Map(tickets.map(ticket => [ticket.id, ticket]));
  const linked = new Set(ticketIds);
  for (const id of linked) {
    if (byId.get(id)?.parent !== initiativeId) errors.push(`initiative ${initiativeId} links ticket ${id}, but its direct parent does not match.`);
  }
  for (const ticket of tickets) {
    if (ticket.parent === initiativeId && !linked.has(ticket.id)) errors.push(`initiative ${initiativeId} is missing ticket ${ticket.id} from its Tickets index.`);
  }
  return errors;
}

// Only the Tickets section declares v1 membership; specification links are references.
// Both readers bind source and doc, with the OKF and section mq modules loaded.
export const INITIATIVE_LINKS_QUERY = 'if (doc["frontmatter"]["schema"] == "tracker-initiative/v1"): okf::okf_extract_links(to_markdown_string(section::collect(filter(section::sections(to_markdown(doc["body"]), true), fn(s): section::level(s) == 2 && section::title(s) == "Tickets";)))) else: okf::okf_extract_links(source)';
