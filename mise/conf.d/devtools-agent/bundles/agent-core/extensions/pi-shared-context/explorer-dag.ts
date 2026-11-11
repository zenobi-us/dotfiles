// Reuse the CLI graph semantics without starting a process; build only when requested.
import type { ExplorerInitiative, ExplorerSnapshot, ExplorerTicket } from "./model";
import { buildDependencyForest, renderDependencyGraph, type Ticket } from "../../../matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-shared";

export interface InitiativeDag { text: string; error?: string }
type DagRecord = { ticket: Ticket; blockedBy: string[] };
const diagrams = new Map<string, Promise<InitiativeDag>>();

export function initiativeDag(initiative: ExplorerInitiative, snapshot: ExplorerSnapshot): Promise<InitiativeDag> {
  const roots = initiative.rootTicketIds ?? initiative.ticketIds;
  const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const closure = new Map<string, DagRecord | undefined>();
  const visit = (id: string): void => {
    if (closure.has(id)) return;
    const ticket = tickets.get(id);
    closure.set(id, ticket ? { ticket: graphTicket(ticket), blockedBy: ticket.blockedBy } : undefined);
    for (const blocker of ticket?.blockedBy ?? []) visit(blocker);
  };
  roots.forEach(visit);
  const key = JSON.stringify([roots, [...closure].sort(([a], [b]) => a.localeCompare(b)).map(([id, ticket]) =>
    [id, ticket?.ticket.title, ticket?.ticket.type, ticket?.ticket.status, ticket?.blockedBy])]);
  const existing = diagrams.get(key);
  if (existing) return existing;
  const result = renderDag(roots, closure);
  diagrams.set(key, result);
  if (diagrams.size > 32) diagrams.delete(diagrams.keys().next().value!);
  return result;
}

async function renderDag(roots: string[], closure: Map<string, DagRecord | undefined>): Promise<InitiativeDag> {
  if (!roots.length) return { text: "No direct membership roots recorded." };
  const load = async (id: string) => {
    const ticket = closure.get(id);
    if (!ticket) throw new Error(`Missing blocker or membership root: ${id}`);
    return ticket;
  };
  try {
    return { text: renderDependencyGraph(await buildDependencyForest(roots, load)) };
  } catch (error) {
    return { text: "", error: error instanceof Error ? error.message : String(error) };
  }
}

function graphTicket(source: ExplorerTicket): Ticket {
  let type = source.documentType?.trim() || "ticket";
  let status: string | undefined = source.status;
  if (source.backend === "github") {
    const labels = Array.isArray(source.fields?.labels) ? source.fields.labels.filter((value): value is string => typeof value === "string") : [];
    type = source.documentType?.trim() || labels.find(label => label.startsWith("wayfinder:"))?.slice("wayfinder:".length) || "issue";
    if (labels.includes("wayfinder:map") || type.toLowerCase() === "spec") type = "map";
  } else if (source.backend === "local-markdown" && source.fields) {
    status = typeof source.fields.work_status === "string" ? source.fields.work_status.trim() : undefined;
  }
  return { id: source.id, title: source.title, type, status };
}
