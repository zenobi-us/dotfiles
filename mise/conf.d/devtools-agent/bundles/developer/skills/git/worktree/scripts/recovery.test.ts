// Exercises the same decision contract used by inspect and the explorer.
import { expect, test } from "bun:test";
import { recoveryDecision } from "./recovery";
import type { WorkflowInspection } from "./recovery";
import type { ExplorerReceipt, ExplorerTicket, TicketWorkflow } from "../../../../../agent-core/extensions/pi-shared-context/model";

const ticket: ExplorerTicket = { id: "T-1", title: "Recover", ref: "tracker/tickets/T-1.md", backend: "local-markdown", status: "open", blockedBy: [], body: "" };
const snapshot = { tickets: [ticket], initiatives: [], backend: ticket.backend };
const commit = "a".repeat(40);
const tree = "b".repeat(40);
function receipt(phase: string, overrides: Partial<ExplorerReceipt> = {}): ExplorerReceipt {
  return { id: `${phase}-1`, ref: `workflows/T-1/events/${phase}-1.json`, workflowId: ticket.id, phase, status: "completed", sourceCommit: commit, sourceTree: tree, sourceBranch: "feature/T-1", baseBranch: "main", workspacePath: "/work/T-1", createdAt: "2026-10-01T00:00:00Z", outputs: [], fields: { event: "phase-complete" }, body: "", ...overrides };
}
function workflow(receipts: ExplorerReceipt[] = [], overrides: Partial<WorkflowInspection> = {}): TicketWorkflow {
  return { ticketId: ticket.id, receipts, sourceCommit: commit, sourceTree: tree, inspection: { historyValid: true, source: { state: "available", path: "/work/T-1", branch: "feature/T-1", commit, tree, dirty: false }, ownership: "inactive", worktrees: [], commits: [], artifacts: [], ...overrides } };
}
function reviewed(verdict: "SUCCESS" | "FAILURE"): TicketWorkflow {
  const review = receipt("review", { verdict, outputs: ["workflows/T-1/artifacts/reviews/review-1.md"] });
  return workflow([review], { artifacts: [{ receiptId: review.id, ref: review.outputs[0]!, state: "readable", matchesSource: true }] });
}

test("untouched tracker aliases allow a new start without takeover", () => {
  const state = workflow([], { source: { state: "missing" }, ownership: "inactive" });
  for (const status of ["open", "todo", "to do", "new", "backlog", "queued", "unclaimed", "ready"]) {
    expect(recoveryDecision({ ...ticket, status }, snapshot, state)).toMatchObject({ action: "start", mode: "begin", requiredApproval: false });
  }
});

test("claimed, implemented, and merged tracker states never prove phase completion", () => {
  for (const status of ["claimed", "implemented", "merged"]) {
    const selected = { ...ticket, status };
    const state = workflow([], { source: { state: "missing" }, ownership: "unknown" });
    expect(recoveryDecision(selected, snapshot, state)).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
  }
  for (const status of ["implemented", "merged"]) expect(recoveryDecision({ ...ticket, status }, snapshot, workflow([receipt("implementation")]))).toMatchObject({ action: "review", mode: "begin" });
});

test("tracker and evidence-only commits never promote a ticket to review or finish", () => {
  const state = workflow([], { source: { state: "missing" }, commits: [{ commit, paths: [ticket.ref, "workflows/T-1/events/start.json"], kind: "tracker-evidence-only", relatedBy: "ticket-path" }] });
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
});

test("interrupted start preserves work and requires scoped approval for unknown ownership", () => {
  const state = workflow([receipt("start", { status: "started", fields: { event: "phase-start" } })], { ownership: "unknown", source: { state: "available", branch: "feature/T-1", commit, tree, dirty: true } });
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
  state.inspection!.ownership = "active";
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ mode: "observe", requiredApproval: false });
  expect(recoveryDecision(ticket, snapshot, state).action).toBeUndefined();
});

test("child results reconcile their phase instead of repeating work or claiming success", () => {
  for (const phase of ["implementation", "review", "fix"]) {
    const state = workflow([receipt(phase, { verdict: "SUCCESS", fields: { event: "phase-result" } })], { ownership: "unknown", artifacts: phase === "review" ? [{ receiptId: "review-1", ref: "review.md", state: "readable", matchesSource: true }] : [] });
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: phase === "implementation" ? "start" : phase, mode: "reconcile", requiredApproval: true });
  }
});

test("interrupted review retries in a fresh session", () => {
  expect(recoveryDecision(ticket, snapshot, workflow([receipt("review", { status: "started", fields: { event: "phase-start" } })]))).toMatchObject({ action: "review", mode: "retry" });
});

test("review success needs a readable source-bound artifact and clean current source", () => {
  const state = reviewed("SUCCESS");
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "finish", mode: "begin", alternatives: ["submit"] });
  for (const artifact of [[], [{ receiptId: "review-1", ref: "missing", state: "missing" as const }], [{ receiptId: "review-1", ref: "old", state: "readable" as const, matchesSource: false }]]) {
    state.inspection!.artifacts = artifact;
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry" });
  }
  state.inspection!.source.dirty = true;
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
});

test("current failure offers fix but source changes after either verdict require review", () => {
  expect(recoveryDecision(ticket, snapshot, reviewed("FAILURE"))).toMatchObject({ action: "fix", mode: "begin" });
  for (const verdict of ["SUCCESS", "FAILURE"] as const) {
    const state = reviewed(verdict);
    state.inspection!.source.commit = "c".repeat(40);
    state.inspection!.source.tree = "d".repeat(40);
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry" });
  }
});

test("interrupted fix takes over only traceable findings and preserves dirty source", () => {
  const state = reviewed("FAILURE");
  state.receipts.unshift(receipt("fix", { status: "started", parentReceipt: "review-1", createdAt: "2026-10-02T00:00:00Z", fields: { event: "phase-start" } }));
  state.inspection!.source.dirty = true;
  state.inspection!.ownership = "unknown";
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "fix", mode: "takeover", requiredApproval: true });
  state.inspection!.artifacts = [];
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry" });
});

test("missing source does not erase history or block finish reconciliation", () => {
  const state = workflow([receipt("finish", { status: "FINISH_FAILED" })], { source: { state: "missing", error: "Recorded worktree is unavailable" }, finishIntegrated: true });
  state.error = "Recorded worktree is unavailable";
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "finish", mode: "reconcile", requiredApproval: true });
  state.receipts = [receipt("implementation")];
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ mode: "blocked", label: "Locate source worktree" });
  state.inspection!.historyValid = false;
  state.inspection!.historyError = "Missing receipt parent";
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ mode: "blocked", label: "Repair workflow history", reason: "Missing receipt parent" });
});

test("completed tracker state reconciles finish until terminal evidence is verified", () => {
  const selected = { ...ticket, status: "completed" };
  const state = workflow([], { source: { state: "missing" } });
  expect(recoveryDecision(selected, snapshot, state)).toMatchObject({ action: "finish", mode: "reconcile" });
  state.inspection!.finishVerified = true;
  expect(recoveryDecision(selected, snapshot, state)).toMatchObject({ mode: "complete" });
});

test("submission recovery observes existing publication rather than repeating push", () => {
  const state = workflow([receipt("submit", { status: "failed" })], { submission: { remoteCommit: commit, pullRequests: ["https://github.com/example/repo/pull/1"] } });
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "submit", mode: "reconcile", requiredApproval: true });
});

test("detached and different source branches cannot authorize review or finish", () => {
  for (const branch of ["", "feature/OTHER"]) {
    const state = reviewed("SUCCESS");
    state.inspection!.source.branch = branch;
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ mode: "blocked", label: "Resolve source branch" });
  }
});

test("unloaded, wrong-ticket, and unknown tracker states cannot start a fresh phase", () => {
  expect(recoveryDecision(ticket, snapshot)).toMatchObject({ mode: "blocked", label: "Inspect workflow" });
  expect(recoveryDecision(ticket, snapshot, { ...workflow(), ticketId: "OTHER" })).toMatchObject({ mode: "blocked", label: "Reload ticket workflow" });
  for (const status of ["constructor", "unavailable", "unknown-state"]) expect(recoveryDecision({ ...ticket, status }, snapshot, workflow([]))).toMatchObject({ mode: "blocked", label: "Inspect tracker state" });
});

test("review child with missing evidence retries without inventing a successful completion", () => {
  const state = workflow([receipt("review", { verdict: "SUCCESS", fields: { event: "phase-result" } })]);
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry", requiredApproval: true });
});

test("start lifecycle completion requires an actual successful product result before review", () => {
  const start = receipt("start", { createdAt: "2026-10-02T00:00:00Z" });
  const state = workflow([start]);
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "start", mode: "reconcile" });
  state.receipts.push(receipt("implementation", { status: "failed" }));
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "start", mode: "reconcile" });
  state.receipts[1]!.status = "completed";
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "begin" });
});

test("dirty interrupted review remains a review recovery but must obtain clean source first", () => {
  const state = workflow([receipt("review", { status: "started", fields: { event: "phase-start" } })]);
  state.inspection!.source.dirty = true;
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry", requiredApproval: true });
  expect(recoveryDecision(ticket, snapshot, state).reason).toContain("clean");
});

test("failed child results are reconciled as failures, never promoted to a next-phase success", () => {
  const state = reviewed("FAILURE");
  state.receipts[0]!.fields.event = "phase-result";
  state.receipts[0]!.status = "failed";
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "reconcile" });
});

test("legacy phase suffixes and lifecycle aliases keep the interrupted phase", () => {
  for (const phase of ["review-start", "review_phase_start", "REVIEW-phase-start"]) {
    const state = workflow([receipt(phase, { status: "started", fields: {} })]);
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry" });
  }
  for (const fields of [{ event_type: "phase-start" }, { stage: "phase_start" }]) {
    const state = workflow([receipt("review", { status: "started", fields })]);
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry" });
  }
});

test("missing child permits a failed parent envelope but never claims successful work", () => {
  const state = workflow([receipt("review", { status: "failed", fields: { event: "phase-complete", result_missing: true, failure_reason: "Reviewer exited before writing a result" } })]);
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry" });
  state.receipts[0]!.phase = "start";
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "start", mode: "takeover" });
});

test("verified submission leaves publication recovery only with a current successful review", () => {
  const state = reviewed("SUCCESS");
  state.receipts.unshift(receipt("submit", { parentReceipt: "review-1", createdAt: "2026-10-02T00:00:00Z" }));
  state.inspection!.submission = { verified: true, remoteCommit: commit, pullRequests: ["https://github.com/example/repo/pull/1"] };
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "finish", mode: "begin" });
  state.inspection!.submission.merged = true;
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "finish", mode: "reconcile", requiredApproval: true });
  state.inspection!.submission.merged = false;
  state.inspection!.artifacts = [];
  expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "submit", mode: "reconcile" });
});

test("known branch-only and ambiguous workspace candidates cannot begin a duplicate start", () => {
  for (const candidates of [1, 2]) {
    const state = workflow([], { source: { state: "unknown", candidates } });
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
  }
});

test("failed or missing-result review cannot become a successful next phase from a copied verdict", () => {
  for (const status of ["failed", "blocked"]) {
    const state = reviewed("SUCCESS");
    state.receipts[0]!.status = status;
    state.receipts[0]!.fields.result_missing = true;
    expect(recoveryDecision(ticket, snapshot, state)).toMatchObject({ action: "review", mode: "retry" });
  }
});
