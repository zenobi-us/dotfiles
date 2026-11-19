// Workflow evidence shared by CLI inspection, Herdr and the Pi explorer.
import type { WorkflowInspection } from "./recovery";

export interface WorkflowReceipt {
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

export interface WorkflowEvent {
  id: string;
  ref: string;
  fields?: Record<string, unknown>;
  body?: string;
  error?: string;
}

export interface TicketWorkflow {
  ticketId: string;
  receipts: WorkflowReceipt[];
  events?: WorkflowEvent[];
  sourceCommit?: string;
  sourceTree?: string;
  error?: string;
  inspection?: WorkflowInspection;
  // Counts are available only after receipt identity and parent-graph validation.
  recordedAttempts?: { review: number; fix: number };
}
