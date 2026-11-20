// Keeps publication and inspection on the same receipt envelope and source-path contract.
import { realpath } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import { receiptEvent, receiptPhase } from "./recovery";
import { validateReceiptContract } from "./receipt-contract";

type Fields = Record<string, unknown>;

/** Resolve real Git identity once per root during a workflow read. */
export function repositoryIdentity(path: string, exec: Exec, identities = new Map<string, Promise<string | undefined>>()): Promise<string | undefined> {
  const key = resolve(path);
  let identity = identities.get(key);
  if (!identity) {
    identity = (async () => {
      const git = await exec("git", ["-C", key, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
      if (git.code !== 0 || !git.stdout.trim()) return undefined;
      return realpath(git.stdout.trim());
    })();
    identities.set(key, identity);
  }
  return identity;
}

/** Retained repository roots may name the recorded checkout, but must share real Git identity. */
export async function linkedWorkflowRoot(fields: Fields, current: Fields, exec: Exec, identities?: Map<string, Promise<string | undefined>>): Promise<boolean> {
  const workflow = object(fields.workflow, "receipt workflow");
  if (workflow.store !== "repository" || current.store !== "repository"
    || (workflow.root !== fields.workspace_path && workflow.root !== fields.repository) || workflow.root === current.root) return false;
  const [recordedRoot, currentRoot] = await Promise.all([
    repositoryIdentity(String(workflow.root), exec, identities),
    repositoryIdentity(String(current.root), exec, identities),
  ]);
  return Boolean(recordedRoot && recordedRoot === currentRoot);
}

export function validateReceipt(fields: Fields): { status: string; phase: string; outputs: string[]; createdAt: string; parentReceipt?: string } {
  validateReceiptContract(fields);
  for (const key of ["receipt_id", "workflow_id", "phase", "repository", "source_branch", "base_branch", "muxer", "agent", "ticket_ref"]) text(fields[key], "receipt " + key);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(fields.receipt_id))) throw new Error("The receipt ID must be a safe event filename");
  if (!isAbsolute(String(fields.repository))) throw new Error("Receipt repository must be absolute.");
  validateSourcePaths(fields);
  const ticket = object(fields.ticket, "receipt ticket");
  for (const key of ["backend", "id", "ref"]) text(ticket[key], "receipt ticket " + key);
  if (ticket.ref !== fields.ticket_ref) throw new Error("The ticket reference fields disagree");
  const workflow = object(fields.workflow, "receipt workflow");
  for (const key of ["store", "root", "ref"]) text(workflow[key], "receipt workflow " + key);
  const status = text(fields.status, "receipt status");
  const phase = receiptPhase({ phase: String(fields.phase) });
  const event = receiptEvent({ phase: String(fields.phase), fields });
  const started = ["phase-start", "phase-input-ready", "phase-checkpoint"].includes(event ?? "")
    && (status === "started" || (event === "phase-start" && phase === "finish" && status === "RUNNING"));
  const operatorEvent = event === "operator-approval" || event === "operator-decision-required";
  const approved = event === "operator-approval" && status === "approved";
  const prepared = ["source-once-inputs-prepared", "bounded-review-inputs-prepared"].includes(event ?? "") && status === "prepared";
  const finishing = phase === "finish" && status === "FINISHING";
  if (!started && !approved && !prepared && !finishing && !["completed", "failed", "blocked", "FINISHED", "FINISH_FAILED"].includes(status)) throw new Error("Receipt status is not a supported phase result or lifecycle state.");
  if ((started || approved || prepared || operatorEvent) && fields.verdict != null) throw new Error("Lifecycle and operator records cannot carry a review verdict.");
  if (fields.verdict != null && !["SUCCESS", "FAILURE"].includes(String(fields.verdict))) throw new Error("Receipt verdict must be SUCCESS or FAILURE.");
  if (phase === "review" && event === "phase-result" && status === "completed" && !["SUCCESS", "FAILURE"].includes(String(fields.verdict))) throw new Error("A completed review requires a SUCCESS or FAILURE verdict.");
  if (!Number.isInteger(fields.attempt) || Number(fields.attempt) < (operatorEvent ? 0 : 1)) throw new Error(operatorEvent ? "Receipt attempt must be a non-negative integer for an operator decision." : "Receipt attempt must be a positive integer.");
  const parentControl = (event === "phase-complete" || operatorEvent) && typeof fields.session_id === "string" && fields.session_id.trim() !== "";
  if (!((phase === "finish" || event === "phase-start" || parentControl) && fields.pane_id === null) && typeof fields.pane_id !== "number" && typeof fields.pane_id !== "string") throw new Error("Receipt pane_id is required.");
  if (fields.evidence != null) {
    const evidence = object(fields.evidence, "receipt evidence");
    text(evidence.store, "receipt evidence store");
    text(evidence.ref, "receipt evidence ref");
  }
  references(fields.inputs, "receipt inputs");
  const outputs = references(fields.outputs, "receipt outputs");
  const createdAt = text(fields.created_at, "receipt created_at");
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt))) throw new Error("Receipt created_at must be an ISO timestamp with a timezone.");
  if (!Object.hasOwn(fields, "parent_receipt") || !Object.hasOwn(fields, "session_id")) throw new Error("Receipt parent_receipt and session_id are required; use null when absent.");
  const parentReceipt = fields.parent_receipt == null ? undefined : text(fields.parent_receipt, "receipt parent_receipt");
  if (fields.session_id != null) text(fields.session_id, "receipt session_id");
  for (const key of ["source_commit", "source_tree"]) if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(text(fields[key], "receipt " + key))) throw new Error("Receipt " + key + " must be a full Git object ID.");
  return { status, phase, outputs, createdAt, parentReceipt };
}

export function validateSourcePaths(fields: Fields): string {
  const path = text(fields.worktree, "receipt worktree");
  if (!isAbsolute(path) || fields.worktree !== path || fields.workspace_path !== path) throw new Error("Receipt worktree and workspace_path must name the same absolute worktree.");
  return path;
}

export async function validateSourceWorktree(fields: Fields, exec: Exec, allowRemoved = false): Promise<void> {
  const path = validateSourcePaths(fields);
  let sourceRoot: string;
  try {
    sourceRoot = await realpath(path);
  } catch (error) {
    // Parent finish records must remain writable after verified source cleanup.
    if (allowRemoved && (error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  const result = await exec("git", ["-C", path, "rev-parse", "--show-toplevel"]);
  if (result.code !== 0) throw new Error("Receipt source worktree root is unavailable.");
  if (await realpath(result.stdout.trim()) !== sourceRoot) throw new Error("Receipt source path must identify the worktree root.");
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(label + " must be a non-empty string.");
  return value.trim();
}
function object(value: unknown, label: string): Fields {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " must be an object.");
  return value as Fields;
}
function references(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(label + " must be a list.");
  return value.map(entry => {
    const reference = object(entry, label);
    text(reference.kind, label + " kind");
    return text(reference.ref, label + " ref");
  });
}
