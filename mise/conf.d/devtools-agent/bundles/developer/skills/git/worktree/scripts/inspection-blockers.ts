// Describes observations without selecting phases. Only the shared decision supplies actions.
import type { RecoveryDecision } from "./recovery";
import { receiptEvent, receiptPhase } from "./recovery";
import type { WorkflowReadResult } from "./workflow";

export interface InspectionBlocker {
  code: string;
  receiptRefs: string[];
  evidence: Record<string, unknown>;
  missingEvidence: string[];
  requiredApproval: boolean;
  recoveryActions: { action: NonNullable<RecoveryDecision["action"]>; mode: RecoveryDecision["mode"]; requiredApproval: boolean }[];
}

/** Reports blockers independently of precedence; actions never override the supplied decision. */
export function inspectionBlockers(workflow: WorkflowReadResult, decision: RecoveryDecision): InspectionBlocker[] {
  const blockers: InspectionBlocker[] = [];
  const add = (code: string, receiptRefs: string[], evidence: Record<string, unknown>, missingEvidence: string[]): void => {
    const actions = decision.mode !== "blocked" && decision.mode !== "complete" && decision.action
      ? [decision.action, ...decision.alternatives ?? []] : [];
    blockers.push({
      code, receiptRefs, evidence, missingEvidence, requiredApproval: decision.requiredApproval,
      recoveryActions: actions.map(action => ({ action, mode: decision.mode, requiredApproval: decision.requiredApproval }))
    });
  };
  for (const diagnostic of workflow.diagnostics ?? []) {
    if (diagnostic.severity !== "error") continue;
    add(diagnostic.code, [diagnostic.ref], { message: diagnostic.message }, ["Validated receipt identity, source objects, and parent history."]);
  }
  const inspection = workflow.inspection;
  if (!inspection) {
    add("inspection_unavailable", [], { error: workflow.error }, ["Current workflow observations."]);
    return blockers;
  }
  const refs = workflow.receipts.map(receipt => receipt.ref);
  if (!inspection.historyValid && !blockers.length) add("invalid_history", refs, { error: inspection.historyError ?? workflow.error }, ["Validated receipt history."]);
  const hasSource = refs.length > 0 || Boolean(inspection.source.path || inspection.source.candidates || inspection.commits.some(commit => commit.kind === "source"));
  if (!inspection.finishVerified && hasSource && inspection.source.state !== "available") {
    add("source_unavailable", refs, { ...inspection.source }, ["Available source worktree with verified branch, commit, tree, and uncommitted changes."]);
  }
  for (const receipt of workflow.receipts) {
    if (receiptEvent(receipt) === "operator-approval") continue;
    if (receiptEvent(receipt) === "phase-result" && !workflow.receipts.some(parent => receiptEvent(parent) === "phase-complete" && parent.parentReceipt === receipt.id)) {
      add("missing_parent_completion", [receipt.ref], { phase: receipt.phase, status: receipt.status, sourceCommit: receipt.sourceCommit, sourceTree: receipt.sourceTree }, ["Parent validation of child outcome, artifacts, exact source, and session shutdown."]);
    }
    if (receiptPhase(receipt) !== "review" || receiptEvent(receipt) === "phase-start" || (receiptEvent(receipt) === "phase-complete" && !receipt.verdict)) continue;
    const artifacts = inspection.artifacts.filter(artifact => artifact.receiptId === receipt.id);
    if (!["SUCCESS", "FAILURE"].includes(receipt.verdict ?? "") || receipt.fields.result_missing === true || receipt.status === "blocked" || (receipt.verdict === "SUCCESS" && receipt.status !== "completed") || !artifacts.some(artifact => artifact.state === "readable" && artifact.matchesSource === true)) {
      add("unusable_review_evidence", [receipt.ref], { verdict: receipt.verdict ?? null, status: receipt.status, artifacts }, ["Usable review verdict and readable artifact bound to the reviewed source commit."]);
    }
  }
  if (!inspection.finishVerified && hasSource && inspection.ownership === "unknown") {
    add("unknown_ownership", refs, { ownership: inspection.ownership, workspace: inspection.source.path }, ["Verified session liveness, reservations, and scoped ownership or takeover approval before mutation."]);
  }
  if (decision.mode === "blocked" && !blockers.length) add("recovery_blocked", refs, { reason: decision.reason, inputs: decision.inputs }, [decision.reason]);
  return blockers;
}

export function formatInspection(result: { decision: RecoveryDecision; blockers: InspectionBlocker[] }): string {
  const { decision } = result;
  const lines = [`${decision.label}: ${decision.reason}`, `Action: ${decision.action ?? "none"}`, `Mode: ${decision.mode}`, `Approval required: ${decision.requiredApproval}`];
  for (const blocker of result.blockers) {
    lines.push(`Blocker: ${blocker.code}`, `Receipts: ${blocker.receiptRefs.join(", ") || "none"}`, `Evidence: ${JSON.stringify(blocker.evidence)}`, `Missing evidence: ${blocker.missingEvidence.join(" ")}`, `Approval required: ${blocker.requiredApproval}`, `Recovery actions: ${blocker.recoveryActions.map(item => `${item.action} (${item.mode})`).join(", ") || "none"}`);
  }
  return lines.join("\n");
}
