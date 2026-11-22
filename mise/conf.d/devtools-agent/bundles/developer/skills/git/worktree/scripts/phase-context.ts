// Generates publication identity from phase authorization and observed Git state, never execution cwd.
import { realpath } from "node:fs/promises";
import { isAbsolute } from "node:path";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import { linkedWorkflowRoot, validateReceipt } from "./receipt-validation";
import { contractIdentity } from "./contract-identity";

type Fields = Record<string, unknown>;
const identityKeys = ["schema", "schemaVersion", "receipt_id", "event", "phase", "attempt", "parent_receipt", "repository", "worktree", "workspace_path", "source_branch", "base_branch", "source_commit", "source_tree", "source_dirty", "ticket", "ticket_ref", "workflow_id", "workflow", "muxer", "agent", "pane_id", "session_id", "goal_run_id", "goal_dispatch_ref"];

/** Validate the complete context before the writer creates directories or delivers a result. */
export async function generateReceipt(context: Fields, outcome: Fields, repository: string, workflow: Fields, parent: Fields | undefined, exec: Exec, handoff?: { runId?: string; operationId?: string }): Promise<Fields> {
  const contextContract = contractIdentity(context, "worktree-phase-context", 2, [1]);
  const supported = contextContract === "worktree-phase-context/v2" ? ["worktree-receipt/v3"] : ["worktree-receipt/v1", "worktree-receipt/v2"];
  if (!supported.includes(String(context.receipt_schema))) throw new Error("Phase context requires its supported receipt_schema");
  if (context.receipt_schema === "worktree-receipt/v1" && (!handoff || parent?.schema !== "worktree-receipt/v1" || parent.event !== "phase-start" || context.event !== "phase-result")) throw new Error("Generated v1 identity requires a retained v1 phase-start and assigned handoff; new executions use v3");
  if (context.receipt_schema === "worktree-receipt/v1" && parent?.phase !== (context.phase === "implementation" ? "start" : context.phase)) throw new Error("Generated v1 identity requires a matching parent phase");
  if (context.receipt_schema === "worktree-receipt/v2") {
    const retained = parent?.schema === "worktree-receipt/v2";
    const parentPhase = context.phase === "implementation" ? "start" : context.phase;
    const assignedResult = handoff && context.event === "phase-result" && context.phase !== "finish"
      && parent?.event === "phase-start" && parent.phase === parentPhase;
    const reconciliation = !handoff && (
      context.event === "phase-complete" && (
        parent?.event === "phase-result" && parent.phase === context.phase
        || parent?.event === "phase-start" && parent.phase === parentPhase
          && outcome.result_missing === true && ["failed", "blocked"].includes(String(outcome.status))
      )
      || context.phase === "finish" && parent?.phase === "finish"
        && ["phase-checkpoint", "phase-result"].includes(String(context.event))
    );
    if (!retained || !(assignedResult || reconciliation)) throw new Error("Generated v2 identity requires retained v2 authorization and an assigned handoff or historical reconciliation; new executions use v3");
  }
  for (const key of identityKeys) if (Object.hasOwn(outcome, key)) throw new Error("Outcome must not supply receipt identity: " + key);
  const ticket = record(context.ticket, "phase ticket");
  for (const key of ["backend", "id", "ref"]) text(ticket[key], "phase ticket " + key);
  const workflowId = ticket.backend === "github" ? "GH-" + ticket.id : text(ticket.id, "phase ticket id");
  if (context.workflow_id !== workflowId) throw new Error("Phase workflow_id does not match the ticket");
  const phase = text(context.phase, "phase");
  const event = text(context.event, "phase event");
  if (!Object.hasOwn(context, "parent_receipt")) throw new Error("Phase context requires parent_receipt");
  if (context.parent_receipt !== null) {
    if (!parent) throw new Error("The phase parent event is missing");
    if ((event === "phase-result" || event === "phase-complete") && context.attempt !== parent.attempt) throw new Error("Phase attempt differs from its parent");
    validateReceipt(parent);
    const parentTicket = record(parent.ticket, "parent ticket");
    if (parent.receipt_id !== context.parent_receipt || parent.workflow_id !== workflowId || ["backend", "id", "ref"].some(key => parentTicket[key] !== ticket[key])) throw new Error("Phase context does not match its parent ticket or workflow");
    const parentWorkflow = record(parent.workflow, "parent workflow");
    if (["store", "ref"].some(key => parentWorkflow[key] !== workflow[key])
      || (parentWorkflow.root !== workflow.root && !await linkedWorkflowRoot(parent, workflow, exec))) throw new Error("Phase parent does not match the resolved workflow");
  } else if (!(phase === "start" && event === "phase-start")) throw new Error("Only an initial start may omit its parent");
  const session = record(context.session, "phase session");
  for (const key of ["muxer", "agent", "session_id"]) text(session[key], "phase session " + key);
  if (!Object.hasOwn(session, "pane_id")) throw new Error("Phase session requires pane_id (null for a parent without a pane)");
  if (handoff && (!handoff.runId || !handoff.operationId || session.run_id !== handoff.runId || session.operation_id !== handoff.operationId)) throw new Error("Phase session does not match the assigned result handoff");
  const source = record(context.source, "phase source");
  const requestedRoot = text(source.worktree, "phase source worktree");
  if (!isAbsolute(requestedRoot)) throw new Error("Phase source worktree must be absolute");
  const branch = text(source.branch, "phase source branch");
  const base = text(source.base_branch, "phase base branch");
  // A missing child result cannot freeze work that the child left incomplete.
  const partialClosure = event === "phase-complete" && ["start", "implementation", "fix"].includes(phase)
    && ["failed", "blocked"].includes(String(outcome.status)) && outcome.result_missing === true
    && parent?.event === "phase-start" && parent.phase === (phase === "implementation" ? "start" : phase);
  const frozen = phase === "review" || phase === "submit" || phase === "finish" || (event === "phase-complete" && !partialClosure);
  if ((source.commit == null) !== (source.tree == null)) throw new Error("Source commit and tree expectations must be supplied together");
  if (frozen && (source.commit == null || source.tree == null)) throw new Error("This phase requires frozen source commit and tree expectations");
  let root: string;
  let removed = false;
  try { root = await realpath(requestedRoot); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" || phase !== "finish" || !parent || parent.worktree !== requestedRoot) throw error;
    root = requestedRoot;
    removed = true;
  }
  if (parent) {
    const parentRoot = await realpath(text(parent.worktree, "parent worktree")).catch(error => {
      if (removed && (error as NodeJS.ErrnoException).code === "ENOENT") return parent.worktree;
      throw error;
    });
    if (root !== parentRoot || branch !== parent.source_branch || base !== parent.base_branch) throw new Error("Phase source checkout, branch or base does not match its parent");
    if (frozen && (source.commit !== parent.source_commit || source.tree !== parent.source_tree)) throw new Error("Frozen source identity does not match the parent");
  }
  let commit: string;
  let tree: string;
  let dirty = false;
  if (removed) {
    commit = text(source.commit, "removed source commit");
    tree = text(source.tree, "removed source tree");
    const observed = await git(exec, repository, ["rev-parse", commit + "^{commit}", commit + "^{tree}"]);
    if (observed !== commit + "\n" + tree) throw new Error("Removed source objects do not match frozen identity");
  } else {
    const top = await git(exec, root, ["rev-parse", "--show-toplevel"]);
    if (await realpath(top) !== root) throw new Error("Phase source path must identify the worktree root");
    const sourceCommon = await realpath(await git(exec, root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]));
    const repositoryCommon = await realpath(await git(exec, repository, ["rev-parse", "--path-format=absolute", "--git-common-dir"]));
    if (sourceCommon !== repositoryCommon) throw new Error("Phase source and publication checkout must belong to the same Git repository");
    if (await git(exec, root, ["symbolic-ref", "--short", "HEAD"]) !== branch) throw new Error("The current source branch does not match the phase context");
    [commit, tree] = (await git(exec, root, ["rev-parse", "HEAD", "HEAD^{tree}"])).split("\n") as [string, string];
    if (!partialClosure && source.commit != null && (commit !== source.commit || tree !== source.tree)) throw new Error("Observed source commit or tree differs from phase expectations");
    if (frozen || partialClosure) dirty = Boolean(await git(exec, root, ["status", "--porcelain=v1", "--untracked-files=all"]));
    if (frozen && dirty) throw new Error("Frozen source worktree has uncommitted changes");
  }
  const receipt: Fields = {
    ...outcome, ...(context.receipt_schema === "worktree-receipt/v3" ? { schemaVersion: context.receipt_schema } : { schema: context.receipt_schema }), receipt_id: text(context.receipt_id, "phase receipt_id"), event, phase,
    attempt: context.attempt, parent_receipt: context.parent_receipt, repository,
    worktree: root, workspace_path: root, source_branch: branch, base_branch: base, source_commit: commit, source_tree: tree,
    ticket: { backend: ticket.backend, id: ticket.id, ref: ticket.ref }, ticket_ref: ticket.ref, workflow_id: workflowId,
    workflow: { store: workflow.store, root: workflow.root, ref: workflow.ref },
    muxer: session.muxer, agent: session.agent, pane_id: session.pane_id, session_id: session.session_id,
  };
  if (partialClosure) receipt.source_dirty = dirty;
  if ((context.goal_run_id == null) !== (context.goal_dispatch_ref == null)) throw new Error("Phase goal run and dispatch identity are required together");
  for (const key of ["goal_run_id", "goal_dispatch_ref"]) {
    if (parent?.[key] != null && context[key] !== parent[key]) throw new Error("Phase goal identity differs from its parent");
    if (context[key] != null) receipt[key] = text(context[key], "phase " + key);
  }
  return receipt;
}

function record(value: unknown, label: string): Fields {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " must be an object");
  return value as Fields;
}
function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()) throw new Error(label + " must be a non-empty string without surrounding whitespace");
  return value;
}
async function git(exec: Exec, root: string, args: string[]): Promise<string> {
  const result = await exec("git", ["-C", root, ...args]);
  if (result.code !== 0) throw new Error("Phase source Git identity is unavailable");
  return result.stdout.trim();
}
