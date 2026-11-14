// Relationship failures must not promote a child result into a different source or outcome.
import { expect, test } from "bun:test";
import { receiptParentIssues } from "./receipt-diagnostics";

const child = {
  schema: "worktree-receipt/v2", receipt_id: "fix-2", workflow_id: "T-1",
  phase: "fix", event: "phase-result", status: "completed", parent_receipt: "start-1",
  source_commit: "a".repeat(40), source_tree: "b".repeat(40), source_branch: "feature/T-1",
  created_at: "2026-11-01T00:00:00Z",
};
const complete = { ...child, receipt_id: "complete-3", event: "phase-complete", parent_receipt: child.receipt_id, created_at: "2026-11-01T00:01:00Z" };

test.each(["source_commit", "source_tree", "source_branch"])("rejects a completion that changes the child's %s", key => {
  expect(receiptParentIssues({ ...complete, [key]: "c".repeat(40) }, child)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "completion_source_mismatch", severity: "error" })]));
  expect(receiptParentIssues(complete, child)).toEqual([]);
});

test("preserves explicit legacy reconciliation as a diagnostic, not new v2 authority", () => {
  const legacy = { ...complete, schema: "worktree-receipt/v1", source_commit: "c".repeat(40) };
  expect(receiptParentIssues(legacy, child)).toEqual([expect.objectContaining({ code: "completion_source_mismatch", severity: "warning" })]);
  const start = { ...child, event: "phase-start" };
  expect(receiptParentIssues(complete, start)).toEqual([expect.objectContaining({ code: "completion_parent_not_result", severity: "error" })]);
  expect(receiptParentIssues({ ...complete, status: "failed" }, start)).toEqual([]);
});

test("requires existing workflow parents and causal timestamps", () => {
  expect(receiptParentIssues(child)).toEqual([expect.objectContaining({ code: "missing_parent", severity: "error" })]);
  expect(receiptParentIssues(complete, { ...child, workflow_id: "other" })).toEqual([expect.objectContaining({ code: "missing_parent", severity: "error" })]);
  expect(receiptParentIssues({ ...complete, created_at: "2026-10-31T23:59:00Z" }, child)).toEqual([expect.objectContaining({ code: "parent_after_child", severity: "error" })]);
  expect(receiptParentIssues(complete, { ...child, status: "blocked" })).toEqual([expect.objectContaining({ code: "completion_status_mismatch", severity: "error" })]);
});

test("binds child results to the matching ticket and launch phase", () => {
  const start = { ...child, receipt_id: child.parent_receipt, event: "phase-start", ticket_ref: "tracker/tickets/T-1.md" };
  const result = { ...child, ticket_ref: start.ticket_ref };
  expect(receiptParentIssues(result, start)).toEqual([]);
  expect(receiptParentIssues(result, { ...start, phase: "review" })).toEqual([expect.objectContaining({ code: "result_parent_not_start", severity: "error" })]);
  expect(receiptParentIssues(result, { ...start, ticket_ref: "tracker/tickets/T-2.md" })).toEqual([expect.objectContaining({ code: "parent_ticket_mismatch", severity: "error" })]);
});
