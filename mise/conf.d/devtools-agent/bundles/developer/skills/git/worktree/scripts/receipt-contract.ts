// V1 history remains immutable; v2 separates reviewed source from integration shape.
import { isAbsolute } from "node:path";
export function validateReceiptContract(fields: Record<string, unknown>): void {
  if (fields.schema !== "worktree-receipt/v1" && fields.schema !== "worktree-receipt/v2") throw new Error("Event must use schema worktree-receipt/v1 or worktree-receipt/v2.");
  if (fields.schema !== "worktree-receipt/v2") return;
  if (!["start", "implementation", "review", "fix", "submit", "finish"].includes(String(fields.phase))) throw new Error("V2 receipts require a canonical phase name.");
  if (fields.phase === "review" && fields.event === "phase-complete" && fields.verdict != null) throw new Error("A parent review completion cannot supply its own verdict.");
  if (fields.phase === "review" && fields.status === "completed" && fields.event !== "phase-complete") {
    if (typeof fields.review_base_commit !== "string" || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(fields.review_base_commit)) throw new Error("V2 review requires an exact review_base_commit.");
    for (const key of ["changed_scope", "affected_contracts"]) if (!Array.isArray(fields[key]) || (fields[key] as unknown[]).some(value => typeof value !== "string" || !value)) throw new Error(`V2 review requires ${key} as an array of names.`);
    if (!Array.isArray(fields.integration_checks) || fields.integration_checks.length === 0 || fields.integration_checks.some(check => !check || typeof check !== "object" || !Array.isArray(check.argv) || check.argv.length === 0 || check.argv.some((arg: unknown) => typeof arg !== "string"))) throw new Error("V2 review requires non-empty integration_checks argv commands.");
  }
  if (fields.phase !== "finish") return;
  if (fields.status === "FINISHED") {
    for (const key of ["pushed", "ticket_completed", "worktree_removed", "workspace_closed"]) if (fields[key] !== true) throw new Error(`A FINISHED receipt requires top-level ${key}: true.`);
  }
  const integrated = fields.merged_commit != null;
  if (fields.status === "FINISHED" && !integrated) throw new Error("FINISHED requires complete integration evidence including merged_commit.");
  if (!integrated && fields.status !== "FINISHED" && fields.checkpoint !== "prepared") return;
  if (integrated && (typeof fields.candidate_workspace !== "string" || !isAbsolute(fields.candidate_workspace) || typeof fields.candidate_branch !== "string" || !fields.candidate_branch)) throw new Error("V2 integration requires its exact candidate workspace and branch.");
  for (const key of ["review_receipt", "base_before", "expected_merge_tree", "reviewed_source_commit", "reviewed_source_tree", "remote", "remote_ref"]) {
    if (typeof fields[key] !== "string" || !String(fields[key]).trim()) throw new Error(`V2 finish requires ${key}.`);
  }
  if (fields.integration_method !== "merge" && fields.integration_method !== "squash") throw new Error("V2 finish requires an explicit merge or squash integration_method.");
  if (fields.source_commit !== fields.reviewed_source_commit || fields.source_tree !== fields.reviewed_source_tree) throw new Error("V2 finish source must identify the exact reviewed source, not the integration candidate.");
  if (!integrated) return;
  const parents = fields.merged_parents;
  const expected = fields.integration_method === "merge" ? [fields.base_before, fields.reviewed_source_commit] : [fields.base_before];
  if (fields.status === "FINISH_FAILED") return;
  if (!Array.isArray(parents) || parents.length !== expected.length || parents.some((parent, index) => parent !== expected[index])) throw new Error("V2 finish parents do not match its integration method and frozen inputs.");
  if (fields.merged_tree !== fields.expected_merge_tree) throw new Error("V2 finish merged_tree must match the expected integration tree.");
  if (fields.status === "FINISHED" || fields.pushed === true || fields.ticket_completed === true) {
    const checks = fields.validation_results;
    if (!Array.isArray(checks) || checks.length === 0 || checks.some(check => {
      if (!check || typeof check !== "object") return true;
      const row = check as Record<string, unknown>;
      return !Array.isArray(row.argv) || row.argv.length === 0 || row.argv.some(arg => typeof arg !== "string") || typeof row.cwd !== "string" || !row.cwd || row.exit_code !== 0 || row.source_commit !== fields.merged_commit || row.source_tree !== fields.merged_tree;
    })) throw new Error("V2 publication requires passing argv checks bound to the exact integration commit and tree.");
  }
}
