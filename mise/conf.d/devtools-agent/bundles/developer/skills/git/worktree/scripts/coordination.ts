#!/usr/bin/env -S mise x -- bun --install=fallback
// Reports cross-initiative hazards without claiming work or granting launch permission.
import { createHash } from "node:crypto";
import { readdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, relative } from "node:path";
import { resolveContextRecord, resolveSharedContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { Exec, SharedAgentContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import { isCompleted, recordKind } from "../../../../../agent-core/extensions/pi-shared-context/model";
import type { ExplorerSnapshot, ExplorerTicket, TicketWorkflow } from "../../../../../agent-core/extensions/pi-shared-context/model";
import { DocumentReadSession } from "./document-cache";
import { chronologicalReceipts, isUnstarted, receiptPhase } from "./recovery";
import type { WorkflowInspection } from "./recovery";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./workflow";
import type { WorkflowReadResult } from "./workflow";

type Fields = Record<string, unknown>;
interface WorkspaceObservation { path: string; branch?: string; marker?: string }
interface Scope {
  state: "declared" | "observed" | "unknown";
  plannedScope: "known" | "unknown";
  paths: string[];
  evidence: { ref: string; paths: string[]; kind: "declared" | "git" | "receipt" }[];
}
interface Reservation {
  ref: string;
  runId: string;
  ticketRef: string;
  phase: string;
  coordinator: Fields;
  fields: Fields;
  reconciledReceipt?: string;
  locations?: string[];
  ambiguous?: boolean;
  reconciliationVerified?: boolean;
  verificationError?: string;
}
interface Stream {
  ticket: ExplorerTicket;
  initiatives: { id: string; ref: string }[];
  scope: Scope;
  ownership: string;
  owners: { ref: string; workspacePath?: string; sourceBranch?: string; sessionId?: string; agent?: unknown; muxer?: unknown; paneId?: unknown }[];
  reservations: Reservation[];
  receiptRefs: string[];
  cleanupOnly?: boolean;
  errors: string[];
}
export interface CoordinationReport {
  schema: "worktree-coordination/v1";
  repository: string;
  inventoryComplete: boolean;
  checkouts: string[];
  ambiguities: { ref: string; copies: { checkout: string; ref: string; id: string; backend: string; status: string; blockedBy: string[]; snapshotDigest: string }[] }[];
  recordDiagnostics: { checkout: string; ref: string; error: string }[];
  proposed: { ticket: ExplorerTicket; initiatives: { id: string; ref: string }[]; scope: Scope; reservations: Reservation[]; ownership: string; owners: Stream["owners"]; sourceObservations: { checkout: string; source: WorkflowInspection["source"]; errors: string[] }[]; receiptRefs: string[] };
  reservationObservations: Omit<Reservation, "fields">[];
  hardBlockers: { id: string; ref?: string; status: string; initiatives: { id: string; ref: string }[] }[];
  streams: Stream[];
  comparisons: { ticketRef: string; assessment: "unknown-scope" | "overlap-risk" | "distinct-observed-paths" | "cleanup-only"; overlaps: { proposed: string; active: string }[] }[];
  assessmentRequired: true;
  errors: string[];
}

/** Reads every available initiative. Unknown inventory or scope is never reported as compatibility. */
export async function coordinateTicket(ref: string, scopes: string[], exec: Exec, cwd = process.cwd()): Promise<CoordinationReport> {
  const context = await resolveSharedContext(exec, cwd);
  if (!context) throw new Error("Coordination requires a repository with a canonical origin and configured ticket adapter.");
  if (context.error) throw new Error(context.error);
  return loadCoordination(context, ref, scopes, exec);
}

export async function loadCoordination(context: SharedAgentContext, ref: string, scopes: string[], exec: Exec): Promise<CoordinationReport> {
  const proposedPaths = [...new Set(scopes.map(scopePath))].sort();
  const errors: string[] = [];
  let inventory: Promise<{ stdout: string; code: number }> | undefined;
  const inventoryExec: Exec = (command, args, cwd) => {
    if (command === "wt" && args.includes("list")) return inventory ??= exec(command, args, cwd);
    return exec(command, args, cwd);
  };
  let snapshot: ExplorerSnapshot;
  let inventoryComplete = true;
  const primaryDiagnostics: { ref: string; error: string }[] = [];
  try { snapshot = await loadExplorerSnapshot(context, exec, undefined, primaryDiagnostics); }
  catch (error) {
    // The Jira adapter currently resolves one ticket and its direct blockers only.
    if (context.routes.tickets.adapter !== "jira") throw error;
    errors.push(`Cross-initiative inventory unavailable: ${message(error)}`);
    inventoryComplete = false;
    snapshot = await loadExplorerSnapshot(context, exec, { ref }, primaryDiagnostics);
  }
  const workspaces: WorkspaceObservation[] = [];
  const contexts = await linkedContexts(context, inventoryExec, errors, workspaces);
  const inventoryError = errors.find(error => error.startsWith("Linked-checkout inventory unavailable:"));
  const snapshots = [{ context, snapshot, diagnostics: primaryDiagnostics }];
  if (context.routes.tickets.adapter === "local-markdown" && context.routes.tickets.store === "repository") {
    for (const linked of contexts.slice(1)) {
      const diagnostics: { ref: string; error: string }[] = [];
      try { snapshots.push({ context: linked, snapshot: await loadExplorerSnapshot(linked, inventoryExec, undefined, diagnostics), diagnostics }); }
      catch (error) { errors.push(`${linked.repositoryRoot}: tracker inventory unavailable: ${message(error)}`); }
    }
  }
  const recordDiagnostics = snapshots.flatMap(item => item.diagnostics.map(diagnostic => ({ checkout: item.context.repositoryRoot, ...diagnostic })));
  for (const diagnostic of recordDiagnostics) errors.push(`${diagnostic.ref} (${diagnostic.checkout}): ${diagnostic.error}`);
  const invalidRecordRefs = new Set(snapshots.flatMap(item => item.diagnostics.filter(diagnostic => !item.snapshot.tickets.some(ticket => ticket.ref === diagnostic.ref)).map(diagnostic => diagnostic.ref)));
  const invalidProposed = primaryDiagnostics.find(diagnostic => diagnostic.ref === ref && !snapshots[0]!.snapshot.tickets.some(ticket => ticket.ref === ref));
  if (invalidProposed) throw new Error(`Proposed ticket record is invalid: ${ref} (${context.repositoryRoot}): ${invalidProposed.error}`);
  const ambiguities: CoordinationReport["ambiguities"] = [];
  const tickets = new Map<string, ExplorerTicket>();
  for (const item of snapshots) for (const candidate of item.snapshot.tickets) {
    if (!tickets.has(candidate.ref)) {
      const canonical = snapshots[0]!.snapshot.tickets.some(ticket => ticket.ref === candidate.ref);
      tickets.set(candidate.ref, canonical ? candidate : { ...candidate, status: "unknown" });
      if (!canonical) errors.push(`${candidate.ref}: record exists only in an unpublished linked checkout.`);
    }
  }
  for (const ticketRef of tickets.keys()) {
    const copies = snapshots.flatMap(item => item.snapshot.tickets.filter(value => value.ref === ticketRef).map(ticket => ({
      checkout: item.context.repositoryRoot, ref: ticket.ref, id: ticket.id, backend: ticket.backend, status: ticket.status, blockedBy: ticket.blockedBy,
      snapshotDigest: createHash("sha256").update(JSON.stringify(ticket)).digest("hex"),
    })));
    if (new Set(copies.map(copy => copy.snapshotDigest)).size > 1 || invalidRecordRefs.has(ticketRef)) {
      ambiguities.push({ ref: ticketRef, copies });
      errors.push(`${ticketRef}: unpublished or inconsistent linked ticket copies differ from the designated context record.`);
    }
  }
  const initiatives = new Map<string, ExplorerSnapshot["initiatives"][number]>();
  for (const item of snapshots) for (const initiative of item.snapshot.initiatives) {
    const known = initiatives.get(initiative.ref);
    initiatives.set(initiative.ref, known ? { ...known, ticketIds: [...new Set([...known.ticketIds, ...initiative.ticketIds])] } : initiative);
  }
  snapshot = { ...snapshot, tickets: [...tickets.values()], initiatives: [...initiatives.values()] };
  if (!snapshots[0]!.snapshot.tickets.some(ticket => ticket.ref === ref)) throw new Error("No ticket matches the canonical reference in the designated context checkout. Publish or repair that record before dispatch.");
  const ticket = snapshot.tickets.find(item => item.ref === ref);
  if (!ticket) throw new Error("No ticket matches the canonical reference. Use the resolved ticket adapter's exact reference.");
  if (recordKind(ticket) !== "ticket") throw new Error("Coordination requires an executable ticket, not an initiative or research record.");
  const workflowRoots = new Map<string, Set<string>>();
  const reservations = await goalReservations(contexts, ticket, inventoryExec, errors, workflowRoots);
  const repositoryIdentities = new Map<string, Promise<string | undefined>>();
  const sourceHeads = new Map<string, Promise<{ commit: string; branch: string }>>();
  const streams: Stream[] = [];
  const proposedReservations: Reservation[] = [];
  const proposedOwners: Stream["owners"] = [];
  const proposedSourceObservations: CoordinationReport["proposed"]["sourceObservations"] = [];
  const proposedReceiptRefs = new Set<string>();
  let proposedOwnership = "unknown";
  const fullVerification = new Map<string, Promise<WorkflowReadResult>>();
  for (const candidate of snapshot.tickets.filter(item => recordKind(item) === "ticket")) {
    const reserved = reservations.some(reservation => reservation.ticketRef === candidate.ref && (candidate.ref === ref || !reservation.reconciledReceipt || reservation.ambiguous));
    const archived = isCompleted(candidate);
    const copies: { checkout: SharedAgentContext; workflow: WorkflowReadResult; retained?: { path: string; branch?: string }[] }[] = [];
    const workflowId = candidate.backend === "github" ? `GH-${candidate.id}` : candidate.id;
    const token = new RegExp(`(?:^|[/_.-])${workflowId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[/_.-])`, "i");
    const namedWorkspace = workspaces.some(workspace => workspace.branch && token.test(workspace.branch));
    for (const checkout of context.routes.workflows.store === "shared" ? contexts.slice(0, 1) : contexts) {
      const hasEvents = workflowRoots.get(checkout.repositoryRoot)?.has(workflowId);
      if (hasEvents === false && checkout !== contexts[0]) continue;
      const retained = archived && hasEvents !== false && !inventoryError ? await archivedWorkspaces(checkout, candidate, inventoryExec, workspaces) : undefined;
      if (archived && !reserved && ((hasEvents === false && !namedWorkspace) || retained?.length === 0)) continue;
      let workflow: WorkflowReadResult;
      try {
        workflow = hasEvents === false
          ? { ticketId: candidate.id, receipts: [], inventory: { envelopesValid: true } }
          : await loadTicketWorkflow(checkout, candidate, inventoryExec, { mode: "coordination", repositoryIdentities });
      } catch (error) { workflow = { ticketId: candidate.id, receipts: [], error: message(error) }; }
      await observeSource(candidate, workflow, workspaces, inventoryExec, sourceHeads, inventoryError);
      copies.push({ checkout, workflow, retained });
    }
    const receiptCopies = new Map<string, string>();
    const conflictingReceipts = new Set<string>();
    for (const copy of copies) for (const receipt of copy.workflow.receipts) {
      const content = JSON.stringify([receipt.fields, receipt.body]);
      const prior = receiptCopies.get(receipt.id);
      if (prior && prior !== content) conflictingReceipts.add(receipt.ref);
      else receiptCopies.set(receipt.id, content);
    }
    if (conflictingReceipts.size) {
      for (const copy of copies) copy.workflow.error = [copy.workflow.error, `Inconsistent receipt copies across linked checkouts: ${[...conflictingReceipts].join(", ")}`].filter(Boolean).join("\n");
    }
    if (candidate.ref === ref && !conflictingReceipts.size) {
      for (const reservation of reservations.filter(reservation => reservation.ticketRef === ref && reservation.reconciledReceipt && !reservation.ambiguous)) {
        const location = copies.find(copy => copy.workflow.inventory?.envelopesValid && !copy.workflow.error && copy.workflow.receipts.some(receipt => receipt.ref === reservation.reconciledReceipt));
        if (!location) continue;
        try {
          let verified = fullVerification.get(location.checkout.repositoryRoot);
          if (!verified) {
            verified = loadTicketWorkflow(location.checkout, candidate, inventoryExec);
            fullVerification.set(location.checkout.repositoryRoot, verified);
          }
          const result = await verified;
          reservation.reconciliationVerified = reservationCompleted(reservation, result);
          if (!reservation.reconciliationVerified) reservation.verificationError = result.error ?? result.inspection?.historyError ?? "Referenced phase completion is not fully verified.";
        } catch (error) { reservation.verificationError = message(error); }
        if (reservation.verificationError) errors.push(`${reservation.ref}: ${reservation.verificationError}`);
      }
    }
    const pending = reservations.filter(reservation => reservation.ticketRef === candidate.ref && !reservation.reconciliationVerified);
    const outstanding = pending.some(reservation => !reservation.reconciledReceipt || reservation.ambiguous);
    if (candidate.ref === ref) proposedReservations.push(...pending);
    let combined: Stream | undefined;
    for (const { checkout, workflow, retained } of copies) {
      const inspection = workflow.inspection;
      if (candidate.ref === ref) {
        for (const error of [workflow.error, inspection?.inventoryError, inspection?.commitsError, inspection?.source.error]) if (error) errors.push(`${candidate.ref}: ${error}`);
        if (inspection) proposedSourceObservations.push({ checkout: checkout.repositoryRoot, source: inspection.source, errors: [workflow.error, inspection.inventoryError, inspection.source.error].filter((error): error is string => Boolean(error)) });
        if (inspection?.ownership === "active") proposedOwnership = "active";
        for (const receipt of workflow.receipts) proposedReceiptRefs.add(receipt.ref);
        const latest = workflow.receipts[0];
        const owner = latest
          ? { ref: latest.ref, workspacePath: latest.workspacePath, sourceBranch: latest.sourceBranch, sessionId: latest.sessionId, agent: latest.fields.agent, muxer: latest.fields.muxer, paneId: latest.fields.pane_id }
          : inspection?.source.path ? { ref: candidate.ref, workspacePath: inspection.source.path, sourceBranch: inspection.source.branch } : undefined;
        if (owner && !proposedOwners.some(known => JSON.stringify(known) === JSON.stringify(owner))) proposedOwners.push(owner);
      }
      const active = archived
        ? inspection?.source.state === "available" || inspection?.ownership === "active" || outstanding || Boolean(retained?.length)
        : !isUnstarted(candidate) || workflow.receipts.length > 0 || Boolean(workflow.events?.length) || Boolean(workflow.error)
          || inspection?.source.state === "available" || Boolean(inspection?.source.candidates) || inspection?.ownership === "active"
          || Boolean(inspection?.commits.some(commit => commit.kind === "source")) || pending.length > 0
          || Boolean(inspection?.inventoryError || inspection?.commitsError || inspection?.source.error);
      if (!active || candidate.ref === ref) continue;
      const stream = await streamScope(candidate, workflow, pending, inventoryExec);
      stream.initiatives = memberships(snapshot, candidate.id);
      if (archived && inspection?.ownership !== "active" && !outstanding) stream.cleanupOnly = true;
      for (const workspace of retained ?? []) {
        if (!stream.owners.some(owner => owner.workspacePath === workspace.path)) stream.owners.push({ ref: candidate.ref, workspacePath: workspace.path, sourceBranch: workspace.branch });
      }
      if (!combined) combined = stream;
      else {
        combined.scope.paths = [...new Set([...combined.scope.paths, ...stream.scope.paths])].sort();
        combined.scope.evidence.push(...stream.scope.evidence);
        if (stream.scope.plannedScope === "known") { combined.scope.plannedScope = "known"; combined.scope.state = "declared"; }
        else if (combined.scope.state === "unknown" && stream.scope.state === "observed") combined.scope.state = "observed";
        combined.owners.push(...stream.owners.filter(owner => !combined!.owners.some(known => JSON.stringify(known) === JSON.stringify(owner))));
        combined.receiptRefs = [...new Set([...combined.receiptRefs, ...stream.receiptRefs])];
        combined.errors = [...new Set([...combined.errors, ...stream.errors])];
        if (stream.ownership === "active") combined.ownership = "active";
        combined.cleanupOnly = combined.cleanupOnly === true && stream.cleanupOnly === true;
      }
    }
    if (combined) streams.push(combined);
  }
  for (const reservation of reservations) {
    if (!snapshot.tickets.some(item => item.ref === reservation.ticketRef)) errors.push(`${reservation.ref}: reserved ticket is outside the available tracker inventory: ${reservation.ticketRef}`);
  }
  const hardBlockers = ticket.blockedBy.flatMap(id => {
    const blocker = snapshot.tickets.find(item => item.id === id || item.ref === id);
    return blocker && isCompleted(blocker) ? [] : [{ id, ref: blocker?.ref, status: blocker?.status ?? "unknown", initiatives: blocker ? memberships(snapshot, blocker.id) : [] }];
  });
  streams.sort((left, right) => left.ticket.ref.localeCompare(right.ticket.ref));
  if (errors.length || streams.some(stream => !stream.cleanupOnly && stream.errors.length)) inventoryComplete = false;
  return {
    schema: "worktree-coordination/v1", repository: context.repositoryRoot, inventoryComplete, checkouts: contexts.map(checkout => checkout.repositoryRoot), ambiguities, recordDiagnostics,
    proposed: { ticket, initiatives: memberships(snapshot, ticket.id), scope: { state: proposedPaths.length ? "declared" : "unknown", plannedScope: proposedPaths.length ? "known" : "unknown", paths: proposedPaths, evidence: proposedPaths.length ? [{ ref: ticket.ref, paths: proposedPaths, kind: "declared" }] : [] }, reservations: proposedReservations, ownership: proposedOwnership, owners: proposedOwners, sourceObservations: proposedSourceObservations, receiptRefs: [...proposedReceiptRefs] },
    reservationObservations: reservations.map(reservation => ({ ref: reservation.ref, runId: reservation.runId, ticketRef: reservation.ticketRef, phase: reservation.phase, coordinator: reservation.coordinator, reconciledReceipt: reservation.reconciledReceipt, locations: reservation.locations, ambiguous: reservation.ambiguous, reconciliationVerified: reservation.reconciliationVerified, verificationError: reservation.verificationError })),
    hardBlockers, streams,
    comparisons: streams.map(stream => {
      const overlaps = proposedPaths.flatMap(proposed => stream.scope.paths.filter(active => pathsOverlap(proposed, active)).map(active => ({ proposed, active })));
      return { ticketRef: stream.ticket.ref, assessment: stream.cleanupOnly ? "cleanup-only" : overlaps.length ? "overlap-risk" : !proposedPaths.length || stream.scope.plannedScope === "unknown" ? "unknown-scope" : "distinct-observed-paths", overlaps };
    }),
    assessmentRequired: true, errors,
  };
}

async function linkedContexts(context: SharedAgentContext, exec: Exec, errors: string[], workspaces: WorkspaceObservation[]): Promise<SharedAgentContext[]> {
  const contexts = [context];
  try {
    const result = await exec("wt", ["-C", context.repositoryRoot, "--config-set", "list.full=false", "--config-set", "list.summary=false", "list", "--format=json", "--branches"]);
    if (result.code !== 0) throw new Error(result.stdout.trim());
    const parsed = JSON.parse(result.stdout);
    const rows = Array.isArray(parsed) ? parsed : parsed?.schema === 2 ? parsed.items : undefined;
    if (!Array.isArray(rows)) throw new Error("Worktrunk returned an unsupported inventory schema.");
    const common = await exec("git", ["-C", context.repositoryRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
    if (common.code !== 0) throw new Error("Repository Git identity is unavailable.");
    const identity = await realpath(common.stdout.trim());
    const seen = new Set([await realpath(context.repositoryRoot)]);
    for (const row of rows) {
      const path = typeof row?.path === "string" ? row.path : row?.worktree?.path;
      if (typeof path !== "string") continue;
      try {
        const actual = await realpath(path);
        if (!seen.has(actual)) {
          const candidate = await exec("git", ["-C", actual, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
          if (candidate.code !== 0 || await realpath(candidate.stdout.trim()) !== identity) throw new Error("Checkout does not share the repository's Git common directory.");
          seen.add(actual);
          contexts.push({ ...context, repositoryRoot: actual, root: context.root === context.repositoryRoot ? actual : context.root, alignmentRoot: context.alignmentRoot === context.repositoryRoot ? actual : context.alignmentRoot, sharedRoot: context.sharedRoot === context.repositoryRoot ? actual : context.sharedRoot });
        }
        workspaces.push({ path: actual, branch: typeof row.branch === "string" ? row.branch : undefined, marker: typeof row.marker === "string" ? row.marker : undefined });
      } catch (error) { errors.push(`${path}: linked checkout identity unavailable: ${message(error)}`); }
    }
  } catch (error) { errors.push(`Linked-checkout inventory unavailable: ${message(error)}`); }
  return contexts;
}

async function observeSource(ticket: ExplorerTicket, workflow: WorkflowReadResult, workspaces: WorkspaceObservation[], exec: Exec, heads: Map<string, Promise<{ commit: string; branch: string }>>, inventoryError?: string): Promise<void> {
  const inspection = workflow.inspection ??= { historyValid: false, source: { state: "unknown" }, ownership: "unknown", worktrees: [], commits: [], artifacts: [] };
  inspection.worktrees = workspaces;
  if (inventoryError) {
    inspection.inventoryError = inventoryError;
    inspection.source = { state: "unknown", error: inventoryError };
    return;
  }
  const latest = workflow.receipts[0];
  const id = ticket.backend === "github" ? `GH-${ticket.id}` : ticket.id;
  const token = new RegExp(`(?:^|[/_.-])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[/_.-])`, "i");
  const recordedPath = latest ? await realpath(latest.workspacePath).catch(() => undefined) : undefined;
  const candidates = workspaces.filter(workspace => latest ? workspace.path === recordedPath || workspace.branch === latest.sourceBranch : workspace.branch && token.test(workspace.branch));
  if (candidates.some(workspace => /🤖|💬|(?:^|\W)(?:working|waiting|active)(?:$|\W)/i.test(workspace.marker ?? ""))) inspection.ownership = "active";
  const matches = latest ? candidates.filter(workspace => workspace.path === recordedPath) : candidates;
  if (!matches.length) {
    inspection.source = { state: recordedPath ? "unknown" : "missing", path: latest?.workspacePath, candidates: candidates.length,
      ...(latest && (!isCompleted(ticket) || inspection.ownership === "active") ? { error: "Recorded source workspace is unavailable in the current inventory. A matching branch does not establish a replacement workspace." } : {}) };
    return;
  }
  if (matches.length !== 1) {
    inspection.source = { state: "unknown", candidates: matches.length, error: "Multiple observed workspaces match this ticket; resolve its source identity." };
    return;
  }
  const workspace = matches[0]!;
  try {
    let head = heads.get(workspace.path);
    if (!head) {
      head = (async () => {
        const commit = await exec("git", ["-C", workspace.path, "rev-parse", "--verify", "HEAD^{commit}"]);
        const branch = await exec("git", ["-C", workspace.path, "branch", "--show-current"]);
        if (commit.code !== 0 || branch.code !== 0) throw new Error("Current source identity is unavailable.");
        return { commit: commit.stdout.trim(), branch: branch.stdout.trim() };
      })();
      heads.set(workspace.path, head);
    }
    const current = await head;
    if (workspace.branch && current.branch !== workspace.branch) throw new Error("Workspace branch changed after inventory; repeat coordination.");
    inspection.source = { state: "available", path: workspace.path, branch: current.branch, commit: current.commit, candidates: 1,
      ...(latest && current.branch !== latest.sourceBranch ? { error: "Observed workspace no longer uses the recorded source branch." } : {}) };
  } catch (error) {
    inspection.source = { state: "unknown", path: workspace.path, candidates: 1, error: message(error) };
  }
}

/** A lightweight archive probe avoids remote/artifact validation when no workspace remains. */
async function archivedWorkspaces(context: SharedAgentContext, ticket: ExplorerTicket, exec: Exec, workspaces: WorkspaceObservation[]): Promise<{ path: string; branch?: string }[] | undefined> {
  try {
    if (!workspaces.length) return [];
    const id = ticket.backend === "github" ? `GH-${ticket.id}` : ticket.id;
    const token = new RegExp(`(?:^|[/_.-])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[/_.-])`, "i");
    const matches = new Map(workspaces.filter(workspace => workspace.branch && token.test(workspace.branch)).map(workspace => [workspace.path, workspace]));
    const record = await resolveContextRecord(context, { kind: "workflow", id });
    if (!record.path || !record.root) return undefined;
    const session = new DocumentReadSession(context, exec);
    const files = await session.collect(`${record.path}/events`, /\.(md|yaml|yml|json)$/, record.root);
    const { documents, errors } = await session.readAll(files.map(file => ({ file, root: record.root! })));
    if (errors.size) return undefined;
    for (const document of documents.values()) {
      const fields = document.fields;
      if (!["worktree-receipt/v1", "worktree-receipt/v2"].includes(String(fields.schema)) || fields.workflow_id !== id || fields.ticket_ref !== ticket.ref) return undefined;
      for (const workspace of workspaces) {
        if ((typeof fields.source_branch === "string" && workspace.branch === fields.source_branch)
          || (typeof fields.worktree === "string" && workspace.path === fields.worktree)
          || (typeof fields.workspace_path === "string" && workspace.path === fields.workspace_path)
          || (typeof fields.candidate_workspace === "string" && workspace.path === fields.candidate_workspace)
          || (typeof fields.candidate_branch === "string" && workspace.branch === fields.candidate_branch)) matches.set(workspace.path, workspace);
      }
    }
    await session.validate();
    return [...matches.values()];
  } catch { return undefined; }
}

function reservationCompleted(reservation: Reservation, workflow: WorkflowReadResult): boolean {
  if (!reservation.reconciledReceipt || !workflow.inspection?.historyValid || workflow.error) return false;
  const completion = workflow.receipts.find(receipt => receipt.ref === reservation.reconciledReceipt);
  if (!completion || completion.fields.event !== "phase-complete" || !["completed", "failed", "blocked", "FINISHED", "FINISH_FAILED"].includes(completion.status)) return false;
  if (receiptPhase(completion) !== reservation.phase) return false;
  const result = workflow.receipts.find(receipt => receipt.id === completion.parentReceipt);
  if (!result || result.fields.event !== "phase-result" || !["completed", "failed", "blocked", "FINISHED", "FINISH_FAILED"].includes(result.status)) return false;
  const resultPhase = receiptPhase(result);
  if (resultPhase !== reservation.phase && !(reservation.phase === "start" && resultPhase === "implementation")) return false;
  if (workflow.inspection.source.state === "available" && workflow.inspection.source.branch !== result.sourceBranch) return false;
  if (resultPhase === "review" && result.verdict && !workflow.inspection.artifacts.some(artifact => artifact.receiptId === result.id && artifact.state === "readable" && artifact.matchesSource === true)) return false;
  if (resultPhase === "finish" && result.status === "FINISHED" && !workflow.inspection.finishVerified) return false;
  if (resultPhase === "submit" && result.status === "completed" && !workflow.inspection.submission?.verified) return false;
  return result.sourceCommit === completion.sourceCommit && result.sourceTree === completion.sourceTree && result.sourceBranch === completion.sourceBranch;
}

async function streamScope(ticket: ExplorerTicket, workflow: TicketWorkflow, reservations: Reservation[], exec: Exec): Promise<Stream> {
  const errors = [workflow.error, workflow.inspection?.inventoryError, workflow.inspection?.commitsError, workflow.inspection?.source.error].filter((value): value is string => Boolean(value));
  const evidence: Scope["evidence"] = [];
  const receipts = chronologicalReceipts(workflow.receipts).reverse();
  const latest = receipts[0];
  // Older scope declarations can describe abandoned attempts. Use the current envelope only.
  for (const item of [...(latest ? [{ ref: latest.ref, fields: latest.fields }] : []), ...reservations]) {
    for (const [field, kind] of [["scope_paths", "declared"], ["changed_files", "receipt"], ["changed_scope", "receipt"]] as const) {
      if (item.fields[field] == null) continue;
      try { evidence.push({ ref: item.ref, paths: pathList(item.fields[field]), kind }); }
      catch (error) { errors.push(`${item.ref}: ${field}: ${message(error)}`); }
    }
  }
  const source = workflow.inspection?.source;
  if (source?.state === "available" && source.path && source.commit && (!latest || source.branch === latest.sourceBranch)) {
    const git = async (args: string[]): Promise<string> => {
      const result = await exec("git", ["-C", source.path!, ...args]);
      if (result.code !== 0) throw new Error(`Git scope inspection failed (${args[0]}): ${result.stdout.trim()}`);
      return result.stdout;
    };
    try {
      const before = (await git(["rev-parse", "HEAD"])).trim();
      if (before !== source.commit) throw new Error("Source changed during scope inspection; rerun coordination.");
      const committed = latest ? await git(["diff", "--name-only", "--no-renames", "-z", `${latest.baseBranch}...${source.commit}`, "--"]) : "";
      const dirty = await git(["diff", "--name-only", "--no-renames", "-z", "HEAD", "--"]);
      const untracked = await git(["ls-files", "--others", "--exclude-standard", "-z"]);
      if ((await git(["rev-parse", "HEAD"])).trim() !== before) throw new Error("Source changed during scope inspection; rerun coordination.");
      const paths = [...new Set([committed, dirty, untracked].flatMap(output => output.split("\0").filter(Boolean)).map(scopePath))];
      if (paths.length) evidence.push({ ref: latest?.ref ?? ticket.ref, paths, kind: "git" });
    } catch (error) { errors.push(message(error)); }
  }
  const paths = [...new Set(evidence.flatMap(item => item.paths))].sort();
  const owners: Stream["owners"] = receipts.slice(0, 1).map(receipt => ({ ref: receipt.ref, workspacePath: receipt.workspacePath, sourceBranch: receipt.sourceBranch, sessionId: receipt.sessionId, agent: receipt.fields.agent, muxer: receipt.fields.muxer, paneId: receipt.fields.pane_id }));
  if (!owners.length && source?.path) owners.push({ ref: ticket.ref, workspacePath: source.path, sourceBranch: source.branch });
  const declared = evidence.some(item => item.kind === "declared" && item.paths.length);
  return { ticket, initiatives: [], scope: { state: declared ? "declared" : paths.length ? "observed" : "unknown", plannedScope: declared ? "known" : "unknown", paths, evidence }, ownership: workflow.inspection?.ownership ?? "unknown", owners, reservations, receiptRefs: receipts.map(receipt => receipt.ref), errors };
}

async function goalReservations(contexts: SharedAgentContext[], ticket: ExplorerTicket, exec: Exec, errors: string[], workflowRoots: Map<string, Set<string>>): Promise<Reservation[]> {
  const reservations: Reservation[] = [];
  type Entry = { ref: string; fields: Fields; digest: string; locations: string[] };
  const journals = new Map<string, Entry[]>();
  const identities = new Map<string, string>();
  const roots = new Set(contexts.map(context => context.repositoryRoot));
  const scanned = new Map<string, Set<string>>();
  for (const context of contexts) {
    try {
      const target = await resolveContextRecord(context, { kind: "workflow", id: ticket.backend === "github" ? `GH-${ticket.id}` : ticket.id });
      if (!target.path || !target.root) throw new Error("Workflow route is not file-backed.");
      const collection = dirname(target.path);
      const prior = scanned.get(collection);
      if (prior) { workflowRoots.set(context.repositoryRoot, prior); continue; }
      const names = await readdir(collection).catch(error => { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; });
      const locations = new Set(names);
      scanned.set(collection, locations);
      workflowRoots.set(context.repositoryRoot, locations);
      const collectionRef = target.ref.slice(0, target.ref.lastIndexOf("/"));
      const session = new DocumentReadSession(context, exec);
      const files: string[] = [];
      for (const name of names) {
        if (!name.startsWith("goal-")) continue;
        try { files.push(...await session.collect(join(collection, name, "events"), /\.(md|yaml|yml|json)$/, target.root)); }
        catch (error) { errors.push(`${collectionRef}/${name}: goal event inventory unavailable: ${message(error)}`); }
      }
      const { documents, errors: readErrors } = await session.readAll(files.map(file => ({ file, root: target.root! })));
      await session.validate();
      for (const file of files) {
        const ref = `${collectionRef}/${relative(collection, file).split("\\").join("/")}`;
        if (readErrors.has(file)) { errors.push(`${ref} (${file}): ${message(readErrors.get(file))}`); continue; }
        const fields = documents.get(file)!.fields;
        if (fields.schema !== "worktree-goal/v1") { errors.push(`${ref}: unsupported goal journal schema.`); continue; }
        const workflow = fields.workflow;
        const expectedRef = `${collectionRef}/${relative(collection, dirname(dirname(file))).split("\\").join("/")}`;
        if (!workflow || typeof workflow !== "object" || Array.isArray(workflow) || (workflow as Fields).ref !== expectedRef || (workflow as Fields).store !== target.store
          || ((workflow as Fields).root !== target.root && !(target.store === "repository" && typeof (workflow as Fields).root === "string" && roots.has(String((workflow as Fields).root))))) {
          errors.push(`${ref}: goal workflow identity does not match its resolved store.`);
          continue;
        }
        if (typeof fields.repository !== "string") { errors.push(`${ref}: goal repository identity is missing.`); continue; }
        for (const repository of [contexts[0]!.repositoryRoot, fields.repository]) {
          if (identities.has(repository)) continue;
          const result = await exec("git", ["-C", repository, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
          if (result.code !== 0) throw new Error(`${ref}: goal repository identity cannot be verified.`);
          identities.set(repository, await realpath(result.stdout.trim()));
        }
        if (identities.get(fields.repository) !== identities.get(contexts[0]!.repositoryRoot)) { errors.push(`${ref}: goal belongs to another repository.`); continue; }
        const entries = journals.get(expectedRef) ?? [];
        const digest = session.digest(file);
        const known = entries.find(entry => entry.ref === ref && entry.digest === digest);
        if (known) known.locations.push(file);
        else entries.push({ ref, fields, digest, locations: [file] });
        journals.set(expectedRef, entries);
      }
    } catch (error) { errors.push(`${context.repositoryRoot}: goal reservation inspection failed: ${message(error)}`); }
  }
  for (const entries of journals.values()) {
    const byId = new Map<string, Entry>();
    const byRef = new Map<string, string>();
    let valid = true;
    for (const entry of entries) {
      const prior = byRef.get(entry.ref);
      if (prior && prior !== entry.digest) {
        errors.push(`${entry.ref}: inconsistent goal event copies across linked checkouts: ${entry.locations.join(", ")}.`);
        valid = false;
      } else byRef.set(entry.ref, entry.digest);
      const id = entry.fields.event_id;
      if (typeof id !== "string" || byId.has(id)) {
        errors.push(`${entry.ref}: missing, duplicate, or inconsistent goal event ID across checkout copies: ${entry.locations.join(", ")}.`);
        valid = false;
      } else byId.set(id, entry);
    }
    for (const entry of entries) {
      const seen = new Set<string>();
      let parent = entry.fields.parent_event;
      while (typeof parent === "string") {
        if (seen.has(parent) || !byId.has(parent)) { errors.push(`${entry.ref}: broken goal parent graph.`); valid = false; break; }
        seen.add(parent);
        parent = byId.get(parent)!.fields.parent_event;
      }
    }
    for (const entry of entries.filter(entry => entry.fields.kind === "dispatch_reserved")) {
      const fields = entry.fields;
      if (typeof fields.run_id !== "string" || typeof fields.ticket_ref !== "string" || typeof fields.phase !== "string") { errors.push(`${entry.ref}: reservation identity is incomplete.`); continue; }
      const reconciled = valid ? entries.find(other => other.fields.kind === "dispatch_reconciled" && other.fields.run_id === fields.run_id && other.fields.ticket_ref === fields.ticket_ref && other.fields.phase === fields.phase && other.fields.dispatch_ref === entry.ref && typeof other.fields.complete_receipt_ref === "string" && descendsFrom(other.fields, fields.event_id, byId)) : undefined;
      const coordinator = fields.coordinator;
      reservations.push({ ref: entry.ref, runId: fields.run_id, ticketRef: fields.ticket_ref, phase: fields.phase, coordinator: coordinator && typeof coordinator === "object" && !Array.isArray(coordinator) ? coordinator as Fields : {}, fields, reconciledReceipt: reconciled?.fields.complete_receipt_ref as string | undefined, locations: entry.locations, ambiguous: !valid });
    }
  }
  return reservations;
}

function descendsFrom(fields: Fields, ancestor: unknown, byId: Map<string, { fields: Fields }>): boolean {
  let parent = fields.parent_event;
  const seen = new Set<string>();
  while (typeof parent === "string" && !seen.has(parent)) {
    if (parent === ancestor) return true;
    seen.add(parent);
    parent = byId.get(parent)?.fields.parent_event;
  }
  return false;
}
function memberships(snapshot: ExplorerSnapshot, id: string): { id: string; ref: string }[] {
  return snapshot.initiatives.filter(initiative => !initiative.group && initiative.ticketIds.includes(id)).map(({ id, ref }) => ({ id, ref }));
}
function scopePath(value: string): string {
  if (!value || value.includes("\0") || isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.includes("\\") || value.split("/").includes("..") || /[*?\[\]{}]/.test(value)) throw new Error("Scope must be a repository-relative literal path, without traversal or globs.");
  const normalized = value.split("/").filter(part => part && part !== ".").join("/");
  if (!normalized) throw new Error("Scope must name a repository-relative file or directory.");
  return normalized;
}
function pathList(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== "string")) throw new Error("Scope paths must be a string list.");
  return value.map(scopePath);
}
function pathsOverlap(left: string, right: string): boolean { return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`); }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }

if (import.meta.main) {
  const args = process.argv.slice(2);
  const scopes: string[] = [];
  let ref: string | undefined;
  let valid = args.includes("--json");
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (arg === "--json") continue;
    if (arg === "--scope" && args[index + 1] && !args[index + 1]!.startsWith("--")) scopes.push(args[++index]!);
    else if (!arg.startsWith("-") && !ref) ref = arg;
    else valid = false;
  }
  if (!valid || !ref) {
    console.error("Usage: coordination.ts <canonical-ticket-ref> --json [--scope <repository-relative-path> ...]");
    process.exitCode = 1;
  } else {
    const exec: Exec = async (command, commandArgs, cwd) => {
      const child = Bun.spawn([command, ...commandArgs], { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
      const timer = setTimeout(() => child.kill("SIGTERM"), 30_000);
      try {
        const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
        return { stdout: code === 0 ? stdout : `${stdout}\n${stderr}`, code };
      } finally { clearTimeout(timer); }
    };
    try { console.log(JSON.stringify(await coordinateTicket(ref, scopes, exec), null, 2)); }
    catch (error) { console.log(JSON.stringify({ error: message(error) })); process.exitCode = 1; }
  }
}
