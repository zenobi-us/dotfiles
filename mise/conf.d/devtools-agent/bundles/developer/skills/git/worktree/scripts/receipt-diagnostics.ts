// Shared relationship checks keep publication and read-only inspection consistent.
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";

type Fields = Record<string, unknown>;
export interface ReceiptIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
}
export interface ReceiptDiagnostic extends ReceiptIssue { ref: string }

/** V1 source changes remain visible as warnings; new v2 completions must bind their result exactly. */
export function receiptParentIssues(receipt: Fields, parent?: Fields): ReceiptIssue[] {
  const issues: ReceiptIssue[] = [];
  const strict = receipt.schema === "worktree-receipt/v2";
  if (receipt.parent_receipt == null) {
    if (strict && ((receipt.event === "phase-result" && receipt.phase !== "finish") || (receipt.event === "phase-complete" && receipt.status === "completed"))) issues.push({ code: "missing_parent", severity: "error", message: "A child result or successful phase completion requires its parent receipt." });
    return issues;
  }
  if (!parent || parent.receipt_id !== receipt.parent_receipt || parent.workflow_id !== receipt.workflow_id) {
    issues.push({ code: "missing_parent", severity: "error", message: "The parent event is missing or belongs to another workflow." });
    return issues;
  }
  if (receipt.receipt_id === parent.receipt_id) issues.push({ code: "self_parent", severity: "error", message: "A receipt cannot name itself as its parent." });
  if (Date.parse(String(parent.created_at)) > Date.parse(String(receipt.created_at))) issues.push({ code: "parent_after_child", severity: "error", message: "The receipt timestamp precedes its parent timestamp." });
  if (strict && receipt.ticket_ref !== parent.ticket_ref) issues.push({ code: "parent_ticket_mismatch", severity: "error", message: "The parent event identifies a different ticket." });
  if (strict && receipt.event === "phase-result" && ["implementation", "review", "fix"].includes(String(receipt.phase))) {
    const phase = receipt.phase === "implementation" ? "start" : receipt.phase;
    if (parent.event !== "phase-start" || parent.phase !== phase) issues.push({ code: "result_parent_not_start", severity: "error", message: "A child result must name its matching phase-start receipt as parent." });
  }
  const completion = receipt.event === "phase-complete" && ["start", "implementation", "review", "fix"].includes(String(receipt.phase));
  if (!completion) return issues;
  const phase = receipt.phase === "start" ? "implementation" : receipt.phase;
  const result = parent.event === "phase-result" && parent.phase === phase;
  // Failed launches can close an attempt without a child result. They cannot claim success.
  if (!result) {
    if (receipt.status === "completed") issues.push({ code: "completion_parent_not_result", severity: strict ? "error" : "warning", message: "A successful phase completion must name its matching child result as parent; legacy reconciliation requires separate evidence." });
    return issues;
  }
  if (["source_commit", "source_tree", "source_branch"].some(key => receipt[key] !== parent[key])) issues.push({ code: "completion_source_mismatch", severity: strict ? "error" : "warning", message: "The phase completion source commit, tree or branch differs from its child result." });
  if (receipt.status !== parent.status) issues.push({ code: "completion_status_mismatch", severity: strict ? "error" : "warning", message: "The phase completion status differs from its child result." });
  return issues;
}

/** Inspect raw envelopes too, so an identity error cannot hide missing source objects or broken links. */
export async function inspectReceiptDiagnostics(entries: { ref: string; fields: Fields }[], repository?: string, exec?: Exec): Promise<ReceiptDiagnostic[]> {
  const diagnostics: ReceiptDiagnostic[] = [];
  const byId = new Map<unknown, Fields>();
  for (const { ref, fields } of entries) {
    if (typeof fields.receipt_id !== "string") continue;
    if (byId.has(fields.receipt_id)) diagnostics.push({ ref, code: "duplicate_receipt_id", severity: "error", message: "Multiple events use the same receipt ID." });
    else byId.set(fields.receipt_id, fields);
  }
  const trees = new Map<string, Promise<{ code: number; stdout: string }>>();
  for (const { ref, fields } of entries) {
    for (const issue of receiptParentIssues(fields, byId.get(fields.parent_receipt))) diagnostics.push({ ref, ...issue });
    if (Array.isArray(fields.history_supplements) && fields.history_supplements.length > 0) diagnostics.push({ ref, code: "history_supplement_applied", severity: "info", message: "Validated checksum-bound supplements repair earlier envelopes without changing their bytes." });
    if (!repository || !exec || typeof fields.source_commit !== "string" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(fields.source_commit)) continue;
    let tree = trees.get(fields.source_commit);
    if (!tree) {
      tree = exec("git", ["-C", repository, "rev-parse", "--verify", `${fields.source_commit}^{tree}`]);
      trees.set(fields.source_commit, tree);
    }
    const observed = await tree;
    if (observed.code !== 0) diagnostics.push({ ref, code: "source_object_unavailable", severity: "error", message: "The recorded source commit is unavailable in this repository; recover its Git objects before validating history." });
    else if (observed.stdout.trim() !== fields.source_tree) diagnostics.push({ ref, code: "source_tree_mismatch", severity: "error", message: "Receipt source_tree does not match its source_commit." });
  }
  return diagnostics;
}
