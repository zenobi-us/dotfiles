// Reporting must preserve recovery precedence, including blocked and active-owner gates.
import { expect, test } from "bun:test";
import { inspectionBlockers } from "./inspection-blockers";
import { recoveryDecision } from "./recovery";
import type { WorkflowReadResult } from "./workflow";

const ticket = { id: "T-1", ref: "tracker/tickets/T-1.md", status: "open", blockedBy: [] };
function workflow(): WorkflowReadResult {
  return { ticketId: ticket.id, receipts: [], inspection: { historyValid: true, source: { state: "missing", path: "/missing" }, ownership: "unknown", worktrees: [], commits: [], artifacts: [] } };
}

test("blocked history reports concurrent evidence without granting a recovery action", () => {
  const state = workflow();
  state.inspection!.historyValid = false;
  state.inspection!.historyError = "Paths disagree";
  state.diagnostics = [{ ref: "events/start.yaml", code: "path_inconsistency", severity: "error", message: "Paths disagree" }];
  const decision = recoveryDecision(ticket, { tickets: [ticket] }, state);
  const before = structuredClone({ state, decision });
  const blockers = inspectionBlockers(state, decision);
  expect(decision.mode).toBe("blocked");
  expect(blockers.map(item => item.code)).toEqual(["path_inconsistency", "source_unavailable", "unknown_ownership"]);
  expect(blockers[0]!.receiptRefs).toEqual(["events/start.yaml"]);
  expect(blockers[0]!.evidence).toEqual({ message: "Paths disagree" });
  for (const blocker of blockers) {
    expect(blocker.recoveryActions).toEqual([]);
    expect(blocker.missingEvidence[0]).toBeDefined();
  }
  expect({ state, decision }).toEqual(before);
});

test("an active owner prevents source blockers from offering a phase", () => {
  const state = workflow();
  state.inspection!.ownership = "active";
  const decision = recoveryDecision(ticket, { tickets: [ticket] }, state);
  expect(decision.mode).toBe("observe");
  expect(inspectionBlockers(state, decision).find(item => item.code === "source_unavailable")!.recoveryActions).toEqual([]);
});

test("untouched workflows and verified source removal are not unavailable-source blockers", () => {
  const state = workflow();
  delete state.inspection!.source.path;
  expect(inspectionBlockers(state, recoveryDecision(ticket, { tickets: [ticket] }, state))).toEqual([]);
  state.inspection!.source.path = "/removed";
  state.inspection!.finishVerified = true;
  expect(inspectionBlockers(state, recoveryDecision(ticket, { tickets: [ticket] }, state))).toEqual([]);
});
