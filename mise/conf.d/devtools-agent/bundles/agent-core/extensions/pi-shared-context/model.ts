import type { SharedAgentContext, Exec } from "../../skills/shared-context/scripts/shared-context/lib";
import type { WorkflowInspection } from "../../../developer/skills/git/worktree/scripts/recovery";

export type { SharedAgentContext, Exec };

export interface ExplorerTicket {
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

export interface ExplorerInitiative {
  id: string;
  title: string;
  ref: string;
  ticketIds: string[];
  body: string;
  phase?: string;
  group?: true;
}

export interface ExplorerSnapshot {
  initiatives: ExplorerInitiative[];
  tickets: ExplorerTicket[];
  backend: string;
}

export interface ExplorerReceipt {
  id: string;
  ref: string;
  workflowId: string;
  phase: string;
  status: string;
  parentReceipt?: string;
  sourceCommit: string;
  sourceTree: string;
  createdAt: string;
  workspacePath: string;
  sourceBranch: string;
  baseBranch: string;
  sessionId?: string;
  verdict?: string;
  outputs: string[];
  fields: Record<string, unknown>;
  body: string;
}

export interface ExplorerEvent {
  id: string;
  ref: string;
  fields?: Record<string, unknown>;
  body?: string;
  error?: string;
}

export interface TicketWorkflow {
  ticketId: string;
  receipts: ExplorerReceipt[];
  events?: ExplorerEvent[];
  sourceCommit?: string;
  sourceTree?: string;
  error?: string;
  inspection?: WorkflowInspection;
  // Counts are available only after receipt identity and parent-graph validation.
  recordedAttempts?: { review: number; fix: number };
}

export type ExplorerTarget =
  | { kind: "initiative"; initiative: ExplorerInitiative }
  | { kind: "ticket"; ticket: ExplorerTicket };

export type ExplorerAction = "ask-matt" | "to-tickets" | "grill" | "start" | "review" | "fix" | "finish" | "submit";

export interface ExplorerActionChoice {
  action: ExplorerAction;
  key: "m" | "t" | "g" | "s" | "r" | "x" | "f" | "u";
  label: string;
  disabledReason?: string;
}

export interface ExplorerSessionRequest {
  action: ExplorerAction;
  target: ExplorerTarget;
  snapshot: ExplorerSnapshot;
  workflow?: TicketWorkflow;
  prompt: string;
}


// Tracker adapters return canonical issue records, including research and planning.
// Only executable record types may consume workflow evidence or offer transitions.
export function recordKind(ticket: ExplorerTicket): "ticket" | "research" | "planning" | "record" {
  const type = ticket.documentType?.trim().toLowerCase();
  if (!type || ["ticket", "issue", "task", "bug", "fix", "feature", "enhancement", "chore"].includes(type)) return "ticket";
  if (type === "research") return "research";
  if (["spec", "specification", "initiative", "plan"].includes(type)) return "planning";
  return "record";
}

export function isCompleted(ticket: ExplorerTicket): boolean {
  return ["done", "closed", "resolved", "complete", "completed"].includes(ticket.status.trim().toLowerCase());
}

export function unresolvedBlockers(ticket: ExplorerTicket, snapshot: ExplorerSnapshot): string[] {
  const tickets = new Map(snapshot.tickets.map(item => [item.id, item]));
  return ticket.blockedBy.filter(id => !tickets.has(id) || !isCompleted(tickets.get(id)!));
}
