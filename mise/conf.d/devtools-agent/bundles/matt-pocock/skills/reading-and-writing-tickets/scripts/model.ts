// Canonical tracker records and blocker semantics shared by CLI and UI consumers.

export interface TicketRecord {
  id: string;
  title: string;
  ref: string;
  backend: string;
  documentType?: string;
  status: string;
  blockedBy: string[];
  body: string;
  fields?: Record<string, unknown>;
}

export interface InitiativeRecord {
  id: string;
  title: string;
  ref: string;
  ticketIds: string[];
  // Direct membership roots keep CLI DAG semantics separate from expanded children.
  rootTicketIds?: string[];
  body: string;
  phase?: string;
  group?: true;
}

export interface TrackerSnapshot {
  initiatives: InitiativeRecord[];
  tickets: TicketRecord[];
  // ADR identifiers are independent from tracker ticket identifiers.
  adrs?: TicketRecord[];
  backend: string;
}

// Tracker adapters return canonical issue records, including research and planning.
// Only executable record types may consume workflow evidence or offer transitions.
export function recordKind(ticket: TicketRecord): "ticket" | "research" | "planning" | "record" {
  const type = ticket.documentType?.trim().toLowerCase();
  if (!type || ["ticket", "issue", "task", "bug", "fix", "feature", "enhancement", "chore"].includes(type)) return "ticket";
  if (type === "research") return "research";
  if (["spec", "specification", "initiative", "plan", "epic"].includes(type)) return "planning";
  return "record";
}

export function isCompleted(ticket: TicketRecord): boolean {
  return ["done", "closed", "resolved", "complete", "completed"].includes(ticket.status.trim().toLowerCase());
}

export function unresolvedBlockers(ticket: TicketRecord, snapshot: TrackerSnapshot): string[] {
  const tickets = new Map(snapshot.tickets.map(item => [item.id, item]));
  return ticket.blockedBy.filter(id => !tickets.has(id) || !isCompleted(tickets.get(id)!));
}
