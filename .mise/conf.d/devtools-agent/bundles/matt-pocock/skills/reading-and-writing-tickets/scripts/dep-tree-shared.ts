import { execFileSync } from "node:child_process";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface Ticket {
  id: string;
  title: string;
  type: string;
  status?: string;
}

export interface DependencyGraph {
  roots: string[];
  tickets: Map<string, Ticket>;
  blockedBy: Map<string, string[]>;
}

export type LoadTicket = (id: string) => Promise<{ ticket: Ticket; blockedBy: string[] }>;

export async function buildDependencyGraph(root: string, loadTicket: LoadTicket): Promise<DependencyGraph> {
  return buildDependencyForest([root], loadTicket);
}

export async function buildDependencyForest(roots: string[], loadTicket: LoadTicket): Promise<DependencyGraph> {
  if (roots.length === 0) throw new Error("dependency graph needs at least one root ticket");
  const tickets = new Map<string, Ticket>();
  const blockedBy = new Map<string, string[]>();
  const visiting = new Set<string>();

  async function visit(id: string, chain: string[]): Promise<void> {
    if (visiting.has(id)) {
      const start = chain.indexOf(id);
      throw new Error(`dependency cycle: ${[...chain.slice(start), id].join(" -> ")}`);
    }
    if (tickets.has(id)) return;
    visiting.add(id);
    const loaded = await loadTicket(id);
    if (loaded.ticket.id !== id) throw new Error(`provider returned ${loaded.ticket.id} when ${id} was requested`);
    tickets.set(id, loaded.ticket);
    const dependencies = [...new Set(loaded.blockedBy)].sort(compareIds);
    blockedBy.set(id, dependencies);
    for (const dependency of dependencies) await visit(dependency, [...chain, id]);
    visiting.delete(id);
  }

  for (const root of roots) await visit(root, []);
  return { roots: [...new Set(roots)], tickets, blockedBy };
}

export function renderDependencyGraph(graph: DependencyGraph): string {
  const lines: string[] = [];
  const emitted = new Set<string>();
  function render(id: string, depth: number): void {
    const ticket = graph.tickets.get(id);
    if (!ticket) throw new Error(`internal graph error: ticket ${id} is missing`);
    const blockers = graph.blockedBy.get(id) ?? [];
    const status = blockers.length > 0 ? "WAITING" : formatStatus(ticket.status);
    const blockerLabel = blockers.length > 0 ? ` · blocked by ${blockers.join(", ")}` : "";
    lines.push(`${"  ".repeat(depth)}- [${ticket.type}] ${ticket.id} - ${ticket.title}  ${status}${blockerLabel}`);
    if (emitted.has(id)) return;
    emitted.add(id);
    for (const dependency of graph.blockedBy.get(id) ?? []) render(dependency, depth + 1);
  }
  for (const root of graph.roots) render(root, 0);
  return lines.join("\n");
}

function formatStatus(status: string | undefined): string {
  const value = status?.trim().toLowerCase();
  if (!value) return "UNKNOWN";
  if (["done", "closed", "resolved", "complete", "completed", "merged", "implemented"].includes(value)) return "COMPLETED";
  if (["in progress", "in-progress", "in_progress", "active", "started", "claimed"].includes(value)) return "IN PROGRESS";
  if (["todo", "to do", "open", "new", "backlog", "unclaimed", "ready"].includes(value)) return "NOT STARTED";
  return (status ?? "UNKNOWN").trim().toUpperCase();
}

export function compareIds(left: string, right: string): number {
  return left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

export function run(command: string, args: string[]): string {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const failure = error as { stderr?: { toString(): string }; status?: number | null; message?: string };
    const stderr = failure.stderr?.toString().trim();
    throw new Error(stderr || failure.message || `${command} exited with status ${failure.status ?? "unknown"}`);
  }
}

export function parseJson(text: string, label: string): JsonValue {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} returned invalid JSON`);
  }
}

export function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} has an invalid shape`);
  return value as Record<string, unknown>;
}

export function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}
