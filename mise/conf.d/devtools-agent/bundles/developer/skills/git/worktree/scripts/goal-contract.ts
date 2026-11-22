// Current coordinator events validate their envelope before reservations can grant ownership.
import { isAbsolute } from "node:path";
import { contractIdentity } from "./contract-identity";
type Fields = Record<string, unknown>;

export function validateGoalContract(fields: Fields): void {
  const identity = contractIdentity(fields, "worktree-goal", 2, [1]);
  // Retained v1 records keep the historical checks in coordination.ts, without rewriting history.
  if (identity === "worktree-goal/v1") return;
  for (const key of ["event_id", "kind", "run_id", "repository", "created_at"]) {
    if (typeof fields[key] !== "string" || !fields[key].trim()) throw new Error("Goal event requires non-empty identity fields.");
  }
  if (!isAbsolute(String(fields.repository)) || !/^[a-z]+(?:_[a-z]+)*$/.test(String(fields.kind))) throw new Error("Goal repository must be absolute and kind must be canonical.");
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(String(fields.created_at)) || !Number.isFinite(Date.parse(String(fields.created_at)))) throw new Error("Goal created_at requires an ISO timestamp with a timezone.");
  for (const key of ["parent_event", "initiative_ref"]) if (!Object.hasOwn(fields, key) || (fields[key] !== null && (typeof fields[key] !== "string" || !fields[key]))) throw new Error("Goal parent_event and initiative_ref require a string or explicit null.");
  const refs = fields.frozen_ticket_refs;
  if (!Array.isArray(refs) || refs.length === 0 || refs.some(ref => typeof ref !== "string" || !ref) || new Set(refs).size !== refs.length) throw new Error("Goal requires distinct frozen ticket references.");
  for (const key of ["workflow", "coordinator"]) {
    const value = fields[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Goal workflow and coordinator must be objects.");
  }
  const workflow = fields.workflow as Fields;
  if (!["repository", "shared"].includes(String(workflow.store)) || typeof workflow.root !== "string" || !isAbsolute(workflow.root) || typeof workflow.ref !== "string" || !workflow.ref) throw new Error("Goal workflow requires a store, absolute root and canonical reference.");
  const coordinator = fields.coordinator as Fields;
  if (typeof coordinator.session_id !== "string" || !coordinator.session_id || typeof coordinator.muxer !== "string" || !coordinator.muxer || !Object.hasOwn(coordinator, "pane_id")) throw new Error("Goal coordinator requires its observed session, muxer and pane identity.");
  if (fields.kind === "dispatch_reserved" && (!refs.includes(fields.ticket_ref) || typeof fields.phase !== "string" || !fields.phase)) throw new Error("Dispatch reservation must identify a frozen ticket and phase.");
}
