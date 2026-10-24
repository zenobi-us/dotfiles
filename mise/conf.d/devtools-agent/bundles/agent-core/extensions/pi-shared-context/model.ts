import type { SharedAgentContext, Exec } from "../../skills/shared-context/scripts/shared-context/lib";

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
}

export interface ExplorerInitiative {
  id: string;
  title: string;
  ref: string;
  ticketIds: string[];
  body: string;
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

export interface TicketWorkflow {
  ticketId: string;
  receipts: ExplorerReceipt[];
  sourceCommit?: string;
  sourceTree?: string;
  error?: string;
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

export function chronologicalReceipts(receipts: ExplorerReceipt[]): ExplorerReceipt[] {
  const byId = new Map(receipts.map(receipt => [receipt.id, receipt]));
  const depths = new Map<string, number>();
  for (const receipt of receipts) {
    const ancestors = new Set<string>();
    let parent = receipt.parentReceipt;
    while (parent && byId.has(parent) && !ancestors.has(parent)) {
      ancestors.add(parent);
      parent = byId.get(parent)!.parentReceipt;
    }
    depths.set(receipt.id, ancestors.size);
  }
  return [...receipts].sort((left, right) =>
    Date.parse(left.createdAt) - Date.parse(right.createdAt)
    || depths.get(left.id)! - depths.get(right.id)!
    || left.id.localeCompare(right.id, "en", { numeric: true }),
  );
}

export function isCompleted(ticket: ExplorerTicket): boolean {
  return ["done", "closed", "resolved", "complete", "completed", "merged", "implemented"].includes(ticket.status.trim().toLowerCase());
}

export function unresolvedBlockers(ticket: ExplorerTicket, snapshot: ExplorerSnapshot): string[] {
  const tickets = new Map(snapshot.tickets.map(item => [item.id, item]));
  return ticket.blockedBy.filter(id => !tickets.has(id) || !isCompleted(tickets.get(id)!));
}
