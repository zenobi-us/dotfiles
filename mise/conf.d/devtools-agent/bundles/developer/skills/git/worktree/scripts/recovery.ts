// Shared decisions for read-only inspection and the explorer. Execution must inspect again.
export type WorktreeAction = "start" | "review" | "fix" | "finish" | "submit";
export type RecoveryMode = "begin" | "reconcile" | "retry" | "takeover" | "observe" | "blocked" | "complete";
export interface RecoveryDecision {
  action?: WorktreeAction;
  mode: RecoveryMode;
  label: string;
  reason: string;
  requiredApproval: boolean;
  parentReceipt?: string;
  inputs: string[];
  alternatives?: WorktreeAction[];
}
export interface WorkflowInspection {
  historyValid: boolean;
  historyError?: string;
  source: { state: "available" | "missing" | "unknown"; path?: string; branch?: string; dirty?: boolean; commit?: string; tree?: string; error?: string; candidates?: number };
  ownership: "active" | "inactive" | "unknown";
  worktrees: { path?: string; branch?: string; marker?: string }[];
  inventoryError?: string;
  commits: { commit: string; paths: string[]; kind: "source" | "tracker-evidence-only"; relatedBy: "receipt" | "ticket-path" | "message-and-diff" }[];
  commitsError?: string;
  artifacts: { receiptId: string; ref: string; state: "readable" | "missing" | "unusable" | "unknown"; matchesSource?: boolean; error?: string }[];
  finishIntegrated?: boolean;
  finishVerified?: boolean;
  finishError?: string;
  submission?: { remoteCommit?: string; pullRequests?: string[]; verified?: boolean; merged?: boolean; error?: string };
}
interface Ticket {
  id: string; ref: string; status: string; blockedBy: string[]; documentType?: string;
}
interface Receipt {
  id: string; ref: string; phase: string; status: string; parentReceipt?: string;
  sourceCommit: string; sourceTree: string; sourceBranch: string; baseBranch: string;
  createdAt: string; outputs: string[]; fields: Record<string, unknown>; verdict?: string;
}
interface Workflow {
  ticketId: string; receipts: Receipt[]; error?: string; sourceCommit?: string; sourceTree?: string; inspection?: WorkflowInspection;
}

/** Returns a recommendation, never permission to mutate or proof that a phase succeeded. */
export function recoveryDecision(ticket: Ticket, snapshot: { tickets: Ticket[] }, workflow?: Workflow): RecoveryDecision {
  if (!workflow) return { mode: "blocked", label: "Inspect workflow", reason: "Load the current workflow before choosing a recovery action.", requiredApproval: false, inputs: [ticket.ref] };
  const inspection = workflow.inspection;
  const receipts = chronologicalReceipts(workflow.receipts).reverse().map(receipt => ({ ...receipt, phase: receiptPhase(receipt), event: receiptEvent(receipt) }));
  const latest = receipts[0];
  const inputs = [...new Set([ticket.ref, ...receipts.flatMap(receipt => [receipt.ref, ...receipt.outputs])])];
  const decision = (action: WorktreeAction | undefined, mode: RecoveryMode, label: string, reason: string, approval = false, alternatives?: WorktreeAction[]): RecoveryDecision => ({
    ...(action ? { action } : {}), mode, label, reason, requiredApproval: approval,
    ...(latest ? { parentReceipt: latest.ref } : {}), inputs, ...(alternatives ? { alternatives } : {}),
  });
  if (ticket.documentType && !["ticket", "issue", "task", "bug", "fix", "feature", "enhancement", "chore"].includes(ticket.documentType.trim().toLowerCase())) return decision(undefined, "blocked", "Not executable", "This record is not an executable ticket.");
  if (workflow.ticketId !== ticket.id) return decision(undefined, "blocked", "Reload ticket workflow", "The workflow belongs to a different ticket. Reload its canonical history before choosing an action.");
  if (inspection?.historyValid === false || (!inspection && workflow.error)) return decision(undefined, "blocked", "Repair workflow history", inspection?.historyError ?? workflow.error ?? "Receipt history is invalid. Preserve the receipts and repair their identity or parent graph.");
  if (inspection?.finishVerified) return decision(undefined, "complete", "Finished", "Verified finish history records integration, publication, and ticket completion.");
  if (inspection?.ownership === "active") return decision(undefined, "observe", "Observe active owner", "An agent may still own this workspace. Observe that session; do not restart or terminate it.");
  const unknownOwner = inspection?.ownership !== "inactive";
  const finishedTracker = completed(ticket);
  if (latest?.phase === "finish" || finishedTracker) return decision("finish", "reconcile", "Reconcile finish", inspection?.finishIntegrated ? "Integration is recorded. Reconcile publication, ticket completion, and cleanup without repeating the merge." : inspection?.finishError ?? "Inspect the finish mapping, integration, publication, and cleanup before any merge. Tracker state alone does not prove finish.", true);
  if (latest?.phase === "submit") {
    if (inspection?.submission?.merged) return decision("finish", "reconcile", "Reconcile merged submission", "A merged pull request was observed. Establish the durable reviewed-source-to-integration mapping before publication or cleanup; do not merge again.", true);
    const submittedReview = receipts.find(receipt => receipt.phase === "review" && receipt.verdict === "SUCCESS" && receipt.sourceCommit === latest.sourceCommit && receipt.sourceTree === latest.sourceTree && receipt.sourceBranch === latest.sourceBranch && usableReview(receipt, workflow));
    if (submittedReview && latest.status === "completed" && latest.event !== "phase-result" && inspection?.submission?.verified && inspection.source.state === "available" && !inspection.source.dirty && inspection.source.commit === latest.sourceCommit && inspection.source.tree === latest.sourceTree && inspection.source.branch === latest.sourceBranch) return decision("finish", "begin", "Finish submitted work", "The current clean reviewed source is published and has an observed pull request. Inspect the finish safety mapping before integration.", unknownOwner);
    return decision("submit", "reconcile", "Reconcile submission", "Inspect the observed remote branch and pull requests before retrying publication. A receipt alone does not prove push or PR success.", true);
  }
  const blockers = ticket.blockedBy.filter(id => !snapshot.tickets.some(item => item.id === id && completed(item)));
  if (blockers.length) return decision(undefined, "blocked", "Resolve blockers", `Unresolved prerequisites: ${blockers.join(", ")}.`);
  const source = inspection?.source;
  const currentCommit = source?.commit ?? workflow.sourceCommit;
  const currentTree = source?.tree ?? workflow.sourceTree;
  const sourceUnavailable = source ? source.state !== "available" : !currentCommit || !currentTree;
  const sameSource = (receipt: Receipt): boolean => receipt.sourceCommit === currentCommit && receipt.sourceTree === currentTree && (source?.branch === undefined || source.branch === receipt.sourceBranch);
  const review = receipts.find(receipt => receipt.phase === "review" && receipt.verdict && receipt.event !== "phase-start");
  const interrupted = latest && (latest.event === "phase-start" || latest.status === "started" || (["failed", "blocked"].includes(latest.status) && !(latest.phase === "review" && latest.verdict)));
  // A child result must be reconciled by its parent, not rerun or promoted to success.
  if (latest?.phase === "review" && latest.event === "phase-result" && !usableReview(latest, workflow)) return decision("review", "retry", "Recover review evidence", "The child review has no usable source-bound result artifact. Preserve its history and use a fresh reviewer; do not append a successful parent completion.", true);
  if (latest?.event === "phase-result") return decision(actionFor(latest.phase), "reconcile", `Reconcile ${actionFor(latest.phase)}`, "Read the child result and artifacts, verify the frozen source and outcome, then append the parent completion. Do not repeat the child work.", unknownOwner);
  if (interrupted && (latest.phase === "start" || latest.phase === "implementation")) return decision("start", "takeover", "Recover implementation", "Preserve existing work and inspect the interrupted start before a scoped takeover. Resolve liveness, reservations, and ownership first.", unknownOwner);
  if (interrupted && latest.phase === "fix") {
    const byId = new Map(receipts.map(receipt => [receipt.id, receipt]));
    const seen = new Set<string>();
    let parent = latest.parentReceipt;
    while (parent && parent !== review?.id && byId.has(parent) && !seen.has(parent)) { seen.add(parent); parent = byId.get(parent)!.parentReceipt; }
    const inputs = Array.isArray(latest.fields.inputs) ? latest.fields.inputs : [];
    const linkedReview = review && (parent === review.id || inputs.some(input => input && typeof input === "object" && "ref" in input && (input.ref === review.ref || input.ref === review.id)));
    const traceable = linkedReview && review?.verdict === "FAILURE" && usableReview(review, workflow) && latest.sourceBranch === review.sourceBranch && latest.sourceCommit === review.sourceCommit && latest.sourceTree === review.sourceTree;
    if (traceable) return decision("fix", "takeover", "Recover interrupted fix", "The findings and fix handoff identify the same source. Preserve dirty work and obtain scoped takeover approval before continuing.", unknownOwner);
    return decision("review", "retry", "Recover findings", "The interrupted fix has no usable, traceable findings. Inspect the source and create a fresh review before fixing.", unknownOwner);
  }
  if (sourceUnavailable && latest) return decision(undefined, "blocked", "Locate source worktree", source?.error ?? workflow.error ?? "Readable history exists, but the source worktree is unavailable. Locate the recorded branch and workspace before review or fix.");
  if (latest && source?.state === "available" && source.branch !== latest.sourceBranch) return decision(undefined, "blocked", "Resolve source branch", "The recorded workspace is on a different branch or detached HEAD. Locate the recorded source branch before running a phase.");
  if (interrupted && latest.phase === "review") return decision("review", "retry", "Retry interrupted review", source?.dirty ? "Preserve dirty changes and resolve them before review. Inspect prior output, then use a fresh reviewer only after the source is clean." : "Inspect prior review output, then use a fresh reviewer. An interrupted review is not a verdict.", unknownOwner || Boolean(source?.dirty));
  if (source && latest && source.dirty === undefined) return decision(undefined, "blocked", "Inspect source cleanliness", "Current source cleanliness is unknown. Inspect it without changing the worktree before review or finish.");
  if (source?.dirty && latest) return decision("start", "takeover", "Preserve uncommitted source", "The source is dirty. Preserve and identify its changes through a scoped takeover; review and finish require a clean frozen source.", true);
  if (review && !sameSource(review)) return decision("review", "retry", "Review changed source", "The source changed after the recorded review, including any failed verdict. Review the current clean source before fixing or finishing.", unknownOwner);
  if (latest?.phase === "review") {
    const result = latest.verdict ? latest : receipts.find(receipt => receipt.id === latest.parentReceipt && receipt.phase === "review");
    if (!result || !usableReview(result, workflow)) return decision("review", "retry", "Recover review evidence", "The review result or source-bound artifact is missing or unusable. Create a fresh review; do not infer a verdict from tracker state.", unknownOwner);
    if (result.verdict === "FAILURE") return decision("fix", "begin", "Fix review findings", "The failed review has usable findings for the current source. Start a fresh fixer with those exact inputs.", unknownOwner);
    if (result.verdict === "SUCCESS") return decision("finish", "begin", "Finish reviewed work", "The successful review matches the current clean source. The finish playbook must still verify its full safety mapping.", unknownOwner, ["submit"]);
    return decision("review", "retry", "Recover review verdict", "The review has no usable verdict. Review again.", unknownOwner);
  }
  if (latest?.phase === "start") {
    const implementation = receipts.find(receipt => ["implementation", "fix"].includes(receipt.phase) && receipt.status === "completed" && sameSource(receipt));
    if (!implementation) return decision("start", "reconcile", "Reconcile start outcome", "Start lifecycle completion alone does not prove implementation. Inspect the child outcome and actual source before recording a product result.", unknownOwner);
  }
  if (latest && ["implementation", "start", "fix"].includes(latest.phase)) return decision("review", "begin", "Review implementation", "Implementation history is available. Review the current clean source in a fresh session; implementation is not completion.", unknownOwner);
  if (!latest && !["open", "ready", "todo", "backlog", "queued", "unclaimed", "claimed", "in_progress", "in-progress", "implemented", "merged", "reviewed"].includes(ticket.status.trim().toLowerCase())) return decision(undefined, "blocked", "Inspect tracker state", "The tracker state is unknown. Resolve its meaning through the ticket adapter before starting work.");
  if (inspection?.commits.length || inspection?.inventoryError || inspection?.commitsError || source?.state === "available" || source?.error || source?.candidates) return decision("start", "takeover", "Inspect existing work", "Existing work or incomplete inspection needs reconciliation. Tracker and evidence-only commits do not prove implementation. Preserve changes and resolve ownership before takeover.", true);
  if (["claimed", "in_progress", "in-progress", "implemented", "merged", "reviewed"].includes(ticket.status.trim().toLowerCase())) return decision("start", "takeover", "Recover ticket context", "Tracker state alone does not prove a phase result. Inspect the existing branch, workflow, and owner before a scoped takeover.", true);
  return decision("start", "begin", "Start work", "No validated implementation history was found. Resolve ownership and active reservations before starting.", unknownOwner);
}

function completed(ticket: Ticket): boolean {
  return ["done", "closed", "resolved", "complete", "completed"].includes(ticket.status.trim().toLowerCase());
}
function actionFor(phase: string): WorktreeAction {
  return ["review", "fix", "finish", "submit"].includes(phase) ? phase as WorktreeAction : "start";
}
function usableReview(receipt: Receipt, workflow: Workflow): boolean {
  if (!["SUCCESS", "FAILURE"].includes(receipt.verdict ?? "")) return false;
  if (receipt.fields.result_missing === true || receipt.status === "blocked" || (receipt.verdict === "SUCCESS" && receipt.status !== "completed")) return false;
  return workflow.inspection?.artifacts.some(artifact => artifact.receiptId === receipt.id && artifact.state === "readable" && artifact.matchesSource === true) ?? false;
}
export function receiptPhase(receipt: { phase: string }): string {
  return receipt.phase.toLowerCase().replace(/[-_](?:phase[-_])?(?:start|result|complete)$/, "");
}

export function receiptEvent(receipt: { phase: string; fields: Record<string, unknown> }): string | undefined {
  const event = receipt.fields.event ?? receipt.fields.event_type ?? receipt.fields.stage;
  if (typeof event === "string") return event.toLowerCase().replaceAll("_", "-");
  const suffix = /[-_](?:phase[-_])?(start|result|complete)$/i.exec(receipt.phase)?.[1];
  return suffix ? `phase-${suffix.toLowerCase()}` : undefined;
}

export function chronologicalReceipts<T extends { id: string; createdAt: string; parentReceipt?: string }>(receipts: readonly T[]): T[] {
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
  return [...receipts].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt) || depths.get(left.id)! - depths.get(right.id)! || left.id.localeCompare(right.id, "en", { numeric: true }));
}
