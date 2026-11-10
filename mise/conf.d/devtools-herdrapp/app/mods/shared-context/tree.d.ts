export interface DependencyTicket {
  id: string;
  title: string;
  status: string;
  blockedBy: string[];
}
export interface DependencyInitiative {
  id: string;
  title: string;
  ticketIds: string[];
  rootTicketIds?: string[];
}
export type DependencyRow<Ticket, Initiative> = {
  path: string;
  depth: number;
  expanded: boolean;
  children: number;
  reference?: string;
  context?: boolean;
  state?: string;
} & ({ type: "ticket"; record: Ticket } | { type: "initiative"; record: Initiative });
export function dependencyRows<Ticket extends DependencyTicket, Initiative extends DependencyInitiative>(
  snapshot: { tickets: Ticket[]; initiatives: Initiative[]; states: Record<string, { state: string }> },
  queue: "initiatives" | "all" | "ready" | "review" | "blocked",
  collapsed: ReadonlySet<string>,
): { rows: DependencyRow<Ticket, Initiative>[]; canonical: Map<string, string> };
export function revealPath(collapsed: Set<string>, path: string): void;
