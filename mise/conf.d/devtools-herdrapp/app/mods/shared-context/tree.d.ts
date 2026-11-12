export interface DependencyTicket {
  id: string;
  title: string;
  status: string;
  documentType?: string;
  blockedBy: string[];
}
export interface DependencyInitiative {
  id: string;
  title: string;
  ticketIds: string[];
  rootTicketIds?: string[];
  group?: true;
}
export type DependencyRow<Ticket, Initiative> = {
  path: string;
  depth: number;
  expanded: boolean;
  children: number;
  reference?: string;
  state?: string;
  itemType?: string;
} & ({ type: "ticket"; record: Ticket } | { type: "initiative"; record: Initiative } | { type: "section"; record: { id: string; title: string } });
export function dependencyRows<Ticket extends DependencyTicket, Initiative extends DependencyInitiative>(
  snapshot: { tickets: Ticket[]; initiatives: Initiative[]; states: Record<string, { state: string }> },
  filters: { initiatives: boolean; ready: boolean; review: boolean; blocked: boolean },
  collapsed: ReadonlySet<string>,
): { rows: DependencyRow<Ticket, Initiative>[]; canonical: Map<string, string> };
export function revealPath(collapsed: Set<string>, path: string): void;
export function itemType(ticket: { documentType?: string }): "ticket" | "prototype" | "research" | "planning" | "record";
export function ticketDisplayState(ticket: { status: string }, workflowState?: { state: string }): string;
