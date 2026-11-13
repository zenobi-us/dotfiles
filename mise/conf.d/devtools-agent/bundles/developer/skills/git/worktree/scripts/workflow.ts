// Owns the shared read-only tracker adapter and receipt validator for CLI and UI.
import { lstat, realpath, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContextRecord } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { Exec, ExplorerEvent, ExplorerInitiative, ExplorerReceipt, ExplorerSnapshot, ExplorerTicket, SharedAgentContext, TicketWorkflow } from "../../../../../agent-core/extensions/pi-shared-context/model";
import { assertRecord, INITIATIVE_SCHEMA, validateInitiativeMembership } from "../../../../../matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema";
import { inspectWorkflow } from "./inspection";
import { chronologicalReceipts, receiptEvent, receiptPhase } from "./recovery";
import { DocumentReadSession } from "./document-cache";
import type { ParsedDocument } from "./document-cache";
import { validateReceiptContract } from "./receipt-contract";

type Fields = Record<string, unknown>;
type Document = ParsedDocument;

/**
 * Strict by default. A diagnostic sink opts into partial record inventory for
 * coordination; configuration, backend, and read-race failures remain fatal.
 */
export async function loadExplorerSnapshot(context: SharedAgentContext, exec: Exec, scope?: { ref: string; kind?: "ticket" | "initiative" }, diagnostics?: { ref: string; error: string }[]): Promise<ExplorerSnapshot> {
 if (context.error) throw new Error(context.error);
 const session = new DocumentReadSession(context, exec);
 let backend = context.routes.tickets.adapter;
 let config: Fields = {};
 let localDefinition: { file: string; root: string } | undefined;
 if (context.checkoutAvailable !== false || context.routes.alignment.store === "shared") {
  const alignment = await resolveContextRecord(context, { kind: "alignment" });
  if (!alignment.path) throw new Error("Alignment has no file-backed tracker definition.");
  const definition = join(alignment.path, "docs/agents/issue-tracker.md");
  if (!await exists(definition)) throw new Error(`Missing tracker definition: ${definition}. Configure docs/agents/issue-tracker.md before opening the explorer.`);
  await contained(alignment.path, definition);
  if (backend === "local-markdown") localDefinition = { file: definition, root: alignment.path };
  else {
   config = (await session.read(definition, alignment.path)).fields;
   backend = text(config.backend, "tracker backend");
   if (backend !== context.routes.tickets.adapter) throw new Error("Tracker backend disagrees with the resolved tickets route. Update the tracker definition or route configuration.");
  }
 }
 const snapshot = backend === "local-markdown" ? await localSnapshot(context, session, localDefinition, diagnostics)
  : backend === "github" ? await githubSnapshot(context, exec, scope)
   : backend === "jira" ? await jiraSnapshot(context, exec, config, scope)
    : (() => { throw new Error(`Unsupported tracker backend: ${backend}`); })();
 if (!diagnostics) validateRelations(snapshot.tickets, "ticket blocker");
 else {
  const byId = new Map<string, ExplorerTicket[]>();
  for (const ticket of snapshot.tickets) {
   const existing = byId.get(ticket.id);
   if (existing) existing.push(ticket);
   else byId.set(ticket.id, [ticket]);
  }
  for (const ticket of snapshot.tickets) {
   const seen = new Set<string>();
   const pending = [ticket.id];
   const reachable: ExplorerTicket[] = [];
   while (pending.length) {
    const id = pending.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const row of byId.get(id) ?? []) { reachable.push(row); pending.push(...row.blockedBy); }
   }
   try { validateRelations(reachable, "ticket blocker"); }
   catch (error) { diagnostics.push({ ref: ticket.ref, error: error instanceof Error ? error.message : String(error) }); }
  }
 }
 const assigned = new Set(snapshot.initiatives.flatMap(item => item.ticketIds));
 if (snapshot.backend === "github") for (const initiative of snapshot.initiatives) assigned.add(initiative.id);
 const unassigned = snapshot.tickets.filter(ticket => !assigned.has(ticket.id)).map(ticket => ticket.id);
 let groupId = "unassigned";
 while (snapshot.initiatives.some(item => item.id === groupId)) groupId = `_${groupId}`;
 const collectionRef = snapshot.backend === "local-markdown"
  ? (await resolveContextRecord(context, { kind: "tickets" })).ref
  : snapshot.backend === "jira" ? `${jiraSite(config)}/issues`
   : `https://${context.canonicalOrigin.replace(/^https?:\/\//, "").replace(/\.git$/, "")}/issues`;
 snapshot.initiatives.push({ id: groupId, title: "Ungrouped", ref: collectionRef, ticketIds: unassigned, rootTicketIds: [...unassigned], body: "Records without an assigned initiative.", group: true });
 await session.validate();
 return scope && backend !== "jira" ? scopedSnapshot(snapshot, scope) : snapshot;
}

/** Discover numbered ADRs in the resolved alignment store, not the ticket store. */
export async function loadExplorerAdrs(context: SharedAgentContext, exec: Exec): Promise<ExplorerTicket[]> {
 if (context.error) throw new Error(context.error);
 const alignment = await resolveContextRecord(context, { kind: "alignment" });
 if (!alignment.path || !alignment.root) throw new Error("Alignment has no file-backed ADR collection.");
 if (context.checkoutAvailable === false && alignment.store === "repository") return [];
 const session = new DocumentReadSession(context, exec);
 const directory = join(alignment.path, "docs/adr");
 const files = (await session.collect(directory, /\.md$/, alignment.root)).filter(file => dirname(file) === directory && /^\d+(?:-[^/]+)?\.md$/.test(basename(file)));
 const { documents, errors } = await session.readAll(files.map(file => ({ file, root: alignment.root! })));
 if (errors.size) throw errors.values().next().value;
 const records: ExplorerTicket[] = [];
 for (const file of files) {
  const id = /^(\d+)/.exec(basename(file))![1]!;
  const record = await resolveContextRecord(context, { kind: "adr", id });
  if (record.path !== file) throw new Error("ADR identity does not match its resolved alignment record.");
  const doc = documents.get(file)!;
  records.push({ id, title: doc.fields.title == null ? basename(file, ".md") : text(doc.fields.title, "ADR title"), ref: record.ref, backend: "local-markdown", documentType: "adr", fields: { ...doc.fields, record_kind: "adr" }, status: doc.fields.status == null ? "unavailable" : text(doc.fields.status, "ADR status"), blockedBy: [], body: doc.body });
 }
 await session.validate();
 return records;
}

function scopedSnapshot(snapshot: ExplorerSnapshot, scope: { ref: string; kind?: "ticket" | "initiative" }): ExplorerSnapshot {
 const initiative = scope.kind === "initiative" ? snapshot.initiatives.find(item => item.ref === scope.ref) : undefined;
 const selected = initiative ? initiative.ticketIds : snapshot.tickets.filter(item => item.ref === scope.ref).map(item => item.id);
 const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
 const included = new Set<string>();
 const visit = (id: string): void => {
  if (included.has(id)) return;
  included.add(id);
  for (const blocker of tickets.get(id)?.blockedBy ?? []) visit(blocker);
 };
 for (const id of selected) visit(id);
 return {
  backend: snapshot.backend, tickets: snapshot.tickets.filter(ticket => included.has(ticket.id)),
  initiatives: snapshot.initiatives.filter(item => initiative ? item === initiative : item.ticketIds.some(id => included.has(id))).map(item => ({ ...item, ticketIds: item.ticketIds.filter(id => included.has(id)), ...(item.rootTicketIds ? { rootTicketIds: item.rootTicketIds.filter(id => included.has(id)) } : {}) })),
 };
}

export interface WorkflowReadResult extends TicketWorkflow {
 inventory?: { envelopesValid: boolean };
}

/** Observation mode validates envelopes, never source objects, phase outcomes, or publication. */
export interface WorkflowReadOptions {
 mode: "coordination";
 repositoryIdentities?: Map<string, Promise<string | undefined>>;
}

/**
 * Load immutable workflow history without changing receipt fields.
 * Closed tickets can retain historical repository-worktree roots, older envelopes
 * without evidence, and null finish panes. This read-only archive requires a
 * FINISHED receipt, recorded publication/completion, an integrated merge commit,
 * and matching source commit/tree pairs. It never reports current source freshness.
 * Active workflows still require the current routes and a usable source worktree.
 * Coordination mode returns separate envelope observations and leaves
 * inspection.historyValid false; those observations do not authorize a phase.
 */
export async function loadTicketWorkflow(context: SharedAgentContext, ticket: ExplorerTicket, exec: Exec, options?: WorkflowReadOptions): Promise<WorkflowReadResult> {
 const session = new DocumentReadSession(context, exec);
 const result = await loadWorkflowHistory(context, ticket, exec, session, options);
 if (!options) result.inspection = await inspectWorkflow(context, ticket, result, exec);
 const archive = ["completed", "closed", "done", "resolved", "complete"].includes(ticket.status.trim().toLowerCase());
 if (!options && !archive && result.inspection!.historyValid && !result.error) {
  const source = result.inspection!.source;
  if (source.state === "available") {
   result.sourceCommit = source.commit;
   result.sourceTree = source.tree;
  } else if (result.receipts.length) {
   result.error = source.error ?? "Recorded worktree is unavailable; current source freshness cannot be established.";
  }
 }
 try { await session.validate(); }
 catch (error) {
  result.error = error instanceof Error ? error.message : String(error);
  if (result.inventory) result.inventory.envelopesValid = false;
  result.inspection!.historyValid = false;
  result.inspection!.historyError = result.error;
  delete result.recordedAttempts;
  delete result.sourceCommit;
  delete result.sourceTree;
 }
 return result;
}

async function loadWorkflowHistory(context: SharedAgentContext, ticket: ExplorerTicket, exec: Exec, session: DocumentReadSession, options?: WorkflowReadOptions): Promise<WorkflowReadResult> {
 const result: WorkflowReadResult = {
  ticketId: ticket.id, receipts: [], events: [], recordedAttempts: { review: 0, fix: 0 },
  inspection: { historyValid: false, source: { state: "unknown" }, ownership: "unknown", worktrees: [], commits: [], artifacts: [] },
 };
 let historyValidated = false;
 const type = ticket.documentType?.trim().toLowerCase();
 if (type && !["ticket", "issue", "task", "bug", "fix", "feature", "enhancement", "chore"].includes(type)) return result;
 const archive = ["completed", "closed", "done", "resolved", "complete"].includes(ticket.status.trim().toLowerCase());
 try {
  const workflowId = ticket.backend === "github" ? `GH-${ticket.id}` : ticket.id;
  const record = await resolveContextRecord(context, { kind: "workflow", id: workflowId });
  if (!record.path || !record.root) throw new Error("Workflow route is not file-backed.");
  if (context.checkoutAvailable === false && record.store === "repository") throw new Error("Workflow context requires a usable repository checkout.");
  const events = join(record.path, "events");
  const eventFiles = await session.collect(events, /\.(md|yaml|yml|json)$/, record.root);
  const { documents, errors: readErrors } = await session.readAll(eventFiles.map(file => ({ file, root: record.root! })));
  const repositoryIdentities = options?.repositoryIdentities ?? new Map<string, Promise<string | undefined>>();
  const repositoryIdentity = (path: string): Promise<string | undefined> => {
   const key = resolve(path);
   let identity = repositoryIdentities.get(key);
   if (!identity) {
    identity = (async () => {
     const git = await exec("git", ["-C", key, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
     if (git.code !== 0 || !git.stdout.trim()) return undefined;
     return realpath(git.stdout.trim());
    })();
    repositoryIdentities.set(key, identity);
   }
   return identity;
  };
  const supplements = await historySupplements(documents, { root: record.root, ref: record.ref }, context, workflowId, session);
  for (const file of eventFiles) {
   const ref = `${record.ref}/events/${relative(events, file).split("\\").join("/")}`;
   const event: ExplorerEvent = { id: ref, ref };
   result.events!.push(event);
   try {
    if (readErrors.has(file)) throw readErrors.get(file);
    const doc = documents.get(file)!;
    const fields = supplements.get(file) ?? doc.fields;
    event.fields = doc.fields;
    event.body = doc.body;
    validateReceiptContract(fields);
    if (fields.workflow_id !== workflowId) throw new Error("Receipt workflow_id does not match the selected ticket.");
    const identity = object(fields.ticket, "receipt ticket");
    if (String(identity.id) !== ticket.id || identity.backend !== ticket.backend || identity.ref !== ticket.ref || fields.ticket_ref !== ticket.ref) throw new Error("Receipt ticket identity or ref does not match the selected ticket.");
    const workflow = object(fields.workflow, "receipt workflow");
    const repository = text(fields.repository, "receipt repository");
    const workspacePath = text(fields.worktree, "receipt worktree");
    if (!isAbsolute(workspacePath) || fields.workspace_path !== workspacePath) throw new Error("Receipt worktree and workspace_path must name the same absolute worktree.");
    const historicalWorktree = archive && workflow.store === "repository" && repository === workspacePath;
    let linkedWorkflowRoot = false;
    if (workflow.store === "repository" && record.store === "repository" && (workflow.root === workspacePath || workflow.root === repository) && workflow.root !== record.root) {
     const [recordedRoot, currentRoot] = await Promise.all([repositoryIdentity(String(workflow.root)), repositoryIdentity(record.root)]);
     linkedWorkflowRoot = Boolean(recordedRoot && recordedRoot === currentRoot);
    }
    for (const field of ["ref", "store", "root"] as const) {
     if (workflow[field] !== record[field] && !(field === "root" && ((historicalWorktree && workflow.root === workspacePath) || linkedWorkflowRoot))) throw new Error(`Receipt workflow.${field} does not match the resolved workflow${field === "root" ? " store root (not the workflow directory)" : ""}.`);
    }
    if (!isAbsolute(repository)) throw new Error("Receipt repository does not match the current repository.");
    if (resolve(repository) !== resolve(context.repositoryRoot) && !historicalWorktree) {
     const [recordedIdentity, currentIdentity] = await Promise.all([repositoryIdentity(repository), repositoryIdentity(context.repositoryRoot)]);
     if (!recordedIdentity || recordedIdentity !== currentIdentity) throw new Error("Receipt repository does not match the current repository.");
    }
    const status = text(fields.status, "receipt status");
    const phase = receiptPhase({ phase: text(fields.phase, "receipt phase") });
    const lifecycleEvent = receiptEvent({ phase: String(fields.phase), fields });
    const started = ["phase-start", "phase-input-ready", "phase-checkpoint"].includes(lifecycleEvent ?? "")
     && (status === "started" || (lifecycleEvent === "phase-start" && phase === "finish" && status === "RUNNING"));
    const operatorEvent = lifecycleEvent === "operator-approval" || lifecycleEvent === "operator-decision-required";
    const approved = lifecycleEvent === "operator-approval" && status === "approved";
    const prepared = ["source-once-inputs-prepared", "bounded-review-inputs-prepared"].includes(lifecycleEvent ?? "") && status === "prepared";
    const finishing = phase === "finish" && status === "FINISHING";
    if (!started && !approved && !prepared && !finishing && !["completed", "failed", "blocked", "FINISHED", "FINISH_FAILED"].includes(status)) throw new Error("Receipt status is not a supported phase result or lifecycle state.");
    // Control records remain parents in the audit graph, but cannot stand in for a review result.
    if ((started || approved || prepared || operatorEvent) && fields.verdict != null) throw new Error("Lifecycle and operator records cannot carry a review verdict.");
    if (fields.verdict != null && !["SUCCESS", "FAILURE"].includes(String(fields.verdict))) throw new Error("Receipt verdict must be SUCCESS or FAILURE.");
    if (!Number.isInteger(fields.attempt) || Number(fields.attempt) < (operatorEvent ? 0 : 1)) throw new Error(operatorEvent ? "Receipt attempt must be a non-negative integer for an operator decision." : "Receipt attempt must be a positive integer.");
    text(fields.muxer, "receipt muxer");
    text(fields.agent, "receipt agent");
    // Starts precede pane creation; parent completions can outlive the child pane.
    const parentCompletion = lifecycleEvent === "phase-complete" && typeof fields.session_id === "string" && fields.session_id.trim() !== "";
    if (!((phase === "finish" || lifecycleEvent === "phase-start" || parentCompletion) && fields.pane_id === null) && typeof fields.pane_id !== "number" && typeof fields.pane_id !== "string") throw new Error("Receipt pane_id is required.");
    // A phase with no evidence run records none; inventing one would be worse than its absence.
    if (fields.evidence != null) {
     const evidence = object(fields.evidence, "receipt evidence");
     text(evidence.store, "receipt evidence store");
     text(evidence.ref, "receipt evidence ref");
    }
    references(fields.inputs, "receipt inputs");
    const outputs = references(fields.outputs, "receipt outputs");
    const createdAt = text(fields.created_at, "receipt created_at");
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt))) throw new Error("Receipt created_at must be an ISO timestamp with a timezone.");
    if (!Object.hasOwn(fields, "parent_receipt") || !Object.hasOwn(fields, "session_id")) throw new Error("Receipt parent_receipt and session_id are required; use null when absent.");
    const parentReceipt = fields.parent_receipt == null ? undefined : text(fields.parent_receipt, "receipt parent_receipt");
    result.receipts.push({
     id: text(fields.receipt_id, "receipt receipt_id"), ref,
     workflowId, phase: text(fields.phase, "receipt phase"), status, parentReceipt,
     sourceCommit: hash(fields.source_commit, "receipt source_commit"), sourceTree: hash(fields.source_tree, "receipt source_tree"),
     createdAt, workspacePath, sourceBranch: text(fields.source_branch, "receipt source_branch"), baseBranch: text(fields.base_branch, "receipt base_branch"),
     sessionId: fields.session_id == null ? undefined : text(fields.session_id, "receipt session_id"),
     verdict: fields.verdict == null ? undefined : text(fields.verdict, "receipt verdict"), outputs, fields, body: doc.body,
    });
   } catch (error) {
    event.error = error instanceof Error ? error.message : String(error);
   }
  }
  result.events!.sort((left, right) => {
   const leftTime = Date.parse(String(left.fields?.created_at ?? ""));
   const rightTime = Date.parse(String(right.fields?.created_at ?? ""));
   return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0) || left.ref.localeCompare(right.ref);
  });
  result.receipts = chronologicalReceipts(result.receipts).reverse();
  const errors = result.events!.filter(event => event.error).map(event => `${event.ref}: ${event.error}`);
  delete result.recordedAttempts;
  const byId = new Map<string, ExplorerReceipt>();
  for (const receipt of result.receipts) {
   if (byId.has(receipt.id)) throw new Error("Duplicate receipt ID.");
   byId.set(receipt.id, receipt);
  }
  validateRelations([...byId.values()].map(item => ({ id: item.id, blockedBy: item.parentReceipt ? [item.parentReceipt] : [] })), "receipt parent");
  result.recordedAttempts = {
   review: result.receipts.filter(receipt => receiptPhase(receipt) === "review").length,
   fix: result.receipts.filter(receipt => receiptPhase(receipt) === "fix").length,
  };
  historyValidated = true;
  if (errors.length) {
   result.error = errors.join("\n");
   result.inspection!.historyError = result.error;
   return result;
  }
  if (options?.mode === "coordination") {
   result.inventory = { envelopesValid: true };
   return result;
  }
  const newest = result.receipts[0];
  // Validate source objects in the repository even when the recorded worktree is gone.
  for (const receipt of result.receipts) {
   const tree = (await run(exec, "git", ["-C", context.repositoryRoot, "rev-parse", "--verify", `${receipt.sourceCommit}^{tree}`])).trim();
   if (tree !== receipt.sourceTree) throw new Error("Receipt source_tree does not match its source_commit.");
  }
  result.inspection!.historyValid = true;
  if (archive && newest) {
   if (receiptPhase(newest) !== "finish" || newest.status !== "FINISHED" || newest.fields.pushed !== true || newest.fields.ticket_completed !== true) throw new Error("Completed history requires a terminal FINISHED receipt with pushed and ticket_completed.");
   const mergedCommit = hash(newest.fields.merged_commit, "finish merged_commit");
   await run(exec, "git", ["-C", context.repositoryRoot, "merge-base", "--is-ancestor", mergedCommit, "HEAD"]);
   return result;
  }
 } catch (error) {
  if (!historyValidated) delete result.recordedAttempts;
  result.error = error instanceof Error ? error.message : String(error);
  if (!result.inspection!.historyValid) result.inspection!.historyError = result.error;
  delete result.sourceCommit;
  delete result.sourceTree;
 }
 return result;
}

async function historySupplements(
 documents: Map<string, Document>,
 record: { root: string; ref: string },
 context: SharedAgentContext,
 workflowId: string,
 session: DocumentReadSession,
): Promise<Map<string, Fields>> {
 const effective = new Map<string, Fields>();
 const evidenceRoot = await resolveContextRecord(context, { kind: "evidence", workflow: workflowId, run: "history-repair" });
 for (const [holder, doc] of documents) {
  if (doc.fields.history_supplements == null) continue;
  text(doc.fields.history_repair_reason, "history repair reason");
  text(doc.fields.history_repair_authorization, "history repair authorization");
  const inputs = references(doc.fields.inputs, "history repair inputs");
  for (const value of list(doc.fields.history_supplements, "history supplements")) {
   const supplement = object(value, "history supplement");
   if (Object.keys(supplement).some(key => !["ref", "sha256", "evidence", "normalize_workflow_root", "input_refs"].includes(key))) throw new Error("History supplements may only repair missing evidence, workflow roots or absent input refs.");
   const ref = text(supplement.ref, "history supplement ref");
   const file = join(record.root, ref);
   const original = documents.get(file);
   if (!original || file === holder || !inputs.includes(ref)) throw new Error("History supplement must reference an earlier receipt in its inputs and current event collection.");
   if (effective.has(file)) throw new Error("Duplicate history supplement target.");
   if (!(Date.parse(String(original.fields.created_at)) < Date.parse(String(doc.fields.created_at)))) throw new Error("History supplement must follow its target.");
   const digest = session.digest(file);
   if (supplement.sha256 !== digest) throw new Error(`History supplement checksum mismatch: ${ref}`);
   const fields = { ...original.fields };
   if (supplement.evidence != null) {
    if (fields.evidence != null) throw new Error("History supplements cannot replace existing evidence.");
    const evidence = object(supplement.evidence, "supplement evidence");
    const evidenceRef = text(evidence.ref, "supplement evidence ref");
    if (evidence.store !== evidenceRoot.store || !evidenceRoot.root || !evidenceRoot.path || isAbsolute(evidenceRef)) throw new Error("Supplement evidence must use the resolved evidence store and a relative ref.");
    await contained(dirname(evidenceRoot.path), join(evidenceRoot.root, evidenceRef));
    fields.evidence = evidence;
   }
   if (supplement.normalize_workflow_root != null) {
    if (supplement.normalize_workflow_root !== true) throw new Error("normalize_workflow_root must be true.");
    const workflow = object(fields.workflow, "historical workflow");
    if (workflow.store !== "repository" || workflow.ref !== record.ref || workflow.root !== fields.worktree || workflow.root === record.root || fields.repository !== context.repositoryRoot) throw new Error("Only a historical repository-worktree workflow root can be normalized.");
    fields.workflow = { ...workflow, root: record.root };
   }
   if (supplement.input_refs != null) {
    const repairs = list(supplement.input_refs, "supplement input refs");
    if (!repairs.length) throw new Error("Supplement input refs must not be empty.");
    const patched = list(fields.inputs, "historical inputs").map(value => ({ ...object(value, "historical input") }));
    for (const value of repairs) {
     const repair = object(value, "supplement input ref");
     if (Object.keys(repair).some(key => !["index", "ref"].includes(key))) throw new Error("Input ref supplements may only supply an index and ref.");
     const index = repair.index;
     if (typeof index !== "number" || !Number.isSafeInteger(index) || index < 0 || index >= patched.length) throw new Error("Supplement input index is out of range.");
     const input = patched[index]!;
     if ("ref" in input) throw new Error("Input ref supplements cannot replace an existing ref.");
     text(input.kind, "historical input kind");
     const inputRef = text(repair.ref, "supplement input ref");
     if (isAbsolute(inputRef) || !inputs.includes(inputRef)) throw new Error("Supplement input refs must be relative artifacts listed in the repair inputs.");
     const artifact = await contained(join(record.root, record.ref, "artifacts"), join(record.root, inputRef));
     if (!(await stat(artifact)).isFile()) throw new Error("Supplement input ref must identify an existing workflow artifact file.");
     input.ref = inputRef;
    }
    fields.inputs = patched;
   }
   if (supplement.evidence == null && supplement.normalize_workflow_root == null && supplement.input_refs == null) throw new Error("History supplement has no envelope repair.");
   effective.set(file, fields);
  }
 }
 return effective;
}

async function localSnapshot(context: SharedAgentContext, session: DocumentReadSession, definition?: { file: string; root: string }, diagnostics?: { ref: string; error: string }[]): Promise<ExplorerSnapshot> {
 const ticketsRecord = await resolveContextRecord(context, { kind: "tickets" });
 const initiativesRecord = await resolveContextRecord(context, { kind: "initiatives" });
 if (!ticketsRecord.path || !ticketsRecord.root || !initiativesRecord.path || !initiativesRecord.root || !["markdown", "local-markdown"].includes(initiativesRecord.adapter)) throw new Error("Local Markdown requires file-backed ticket and initiative routes.");
 const ticketFiles = context.checkoutAvailable === false && ticketsRecord.store === "repository" ? [] : await session.collect(ticketsRecord.path, /\.md$/, ticketsRecord.root);
 const initiativeFiles = context.checkoutAvailable === false && initiativesRecord.store === "repository" ? [] : await session.collect(initiativesRecord.path, /\.md$/, initiativesRecord.root);
 const { documents, errors } = await session.readAll([...(definition ? [definition] : []), ...ticketFiles.map(file => ({ file, root: ticketsRecord.root! })), ...initiativeFiles.filter(file => relative(initiativesRecord.path!, file).split(/[\\/]/).length === 2 && file.endsWith("/index.md")).map(file => ({ file, root: initiativesRecord.root! }))]);
 if (!diagnostics && errors.size) throw errors.values().next().value;
 if (definition && errors.has(definition.file)) throw errors.get(definition.file);
 if (definition && text(documents.get(definition.file)!.fields.backend, "tracker backend") !== context.routes.tickets.adapter) throw new Error("Tracker backend disagrees with the resolved tickets route. Update the tracker definition or route configuration.");
 const tickets: ExplorerTicket[] = [];
 const paths = new Map<string, string>();
 const parents = new Map<string, string>();
 for (const file of ticketFiles) {
  const ref = `${ticketsRecord.ref}/${relative(ticketsRecord.path, file).split("\\").join("/")}`;
  try {
   if (errors.has(file)) throw errors.get(file);
   const doc = documents.get(file)!;
   assertRecord(doc.fields, "ticket", { allowLegacy: true, expectedId: basename(file, ".md") });
   const id = scalar(doc.fields.id, "ticket id");
   const documentType = doc.fields.type == null ? undefined : text(doc.fields.type, "ticket type");
   const parent = doc.fields.parent == null ? undefined : scalar(doc.fields.parent, "ticket parent");
   const ticket: ExplorerTicket = { id, title: text(doc.fields.title, "ticket title"), documentType, fields: doc.fields, ref, backend: "local-markdown", status: doc.fields.work_status == null ? doc.fields.status == null ? "unavailable" : text(doc.fields.status, "record status") : text(doc.fields.work_status, "ticket work_status"), blockedBy: list(doc.fields.blocked_by ?? [], "ticket blocked_by").map(value => scalar(value, "ticket blocker")), body: doc.body };
   paths.set(session.actual(file), id);
   if (parent) parents.set(id, parent);
   tickets.push(ticket);
  } catch (error) {
   const message = `Unreadable record ${file}: ${error instanceof Error ? error.message : String(error)}`;
   if (!diagnostics) throw new Error(message);
   diagnostics.push({ ref, error: message });
  }
 }
 const initiatives: ExplorerInitiative[] = [];
 for (const file of initiativeFiles) {
  if (relative(initiativesRecord.path, file).split(/[\\/]/).length !== 2 || !file.endsWith("/index.md")) continue;
  const id = dirname(relative(initiativesRecord.path, file));
  const ref = `${initiativesRecord.ref}/${id}/index.md`;
  try {
   if (errors.has(file)) throw errors.get(file);
   const doc = documents.get(file)!;
   assertRecord(doc.fields, "initiative", { allowLegacy: true, expectedId: id });
   const ticketIds: string[] = [];
   for (const rawLink of doc.links) {
    const url = text(object(rawLink, "initiative link").url, "initiative link URL");
    if (url.startsWith("#") || url.startsWith("//") || (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(url) && !url.startsWith("file:"))) continue;
    const target = url.startsWith("file:") ? fileURLToPath(new URL(url)) : resolve(dirname(file), decodeURIComponent(url.split(/[?#]/, 1)[0]!));
    if (context.checkoutAvailable === false && ticketsRecord.store === "repository") continue;
    if (!within(ticketsRecord.path, target) || !target.endsWith(".md")) continue;
    try {
     await contained(ticketsRecord.path, target);
     const linkedId = paths.get(await realpath(target));
     if (!linkedId) throw new Error("Initiative links to a missing or unknown ticket.");
     ticketIds.push(linkedId);
    } catch (error) {
     if (!diagnostics) throw error;
     diagnostics.push({ ref, error: `${target}: ${error instanceof Error ? error.message : String(error)}` });
    }
   }
   if (doc.fields.schema === INITIATIVE_SCHEMA) {
    const errors = validateInitiativeMembership(id, ticketIds, tickets.map(ticket => ({ id: ticket.id, parent: parents.get(ticket.id) })));
    if (errors.length) {
     if (!diagnostics) throw new Error(errors.join(" "));
     diagnostics.push({ ref, error: errors.join(" ") });
    }
   }
   initiatives.push({ id, title: doc.fields.title == null ? id : text(doc.fields.title, "initiative title"), ref, ticketIds: [...new Set(ticketIds)], rootTicketIds: [...new Set(ticketIds)], body: doc.body, ...(typeof doc.fields.phase === "string" && doc.fields.phase.trim() ? { phase: doc.fields.phase } : {}) });
  } catch (error) {
   if (!diagnostics) throw error;
   diagnostics.push({ ref, error: error instanceof Error ? error.message : String(error) });
  }
 }
 try { validateRelations([...parents].map(([id, parent]) => ({ id, blockedBy: parents.has(parent) ? [parent] : [] })), "ticket hierarchy"); }
 catch (error) {
  if (!diagnostics) throw error;
  diagnostics.push({ ref: ticketsRecord.ref, error: error instanceof Error ? error.message : String(error) });
 }
 for (const [id, parent] of parents) {
  if (context.checkoutAvailable === false && initiativesRecord.store === "repository" && !tickets.some(ticket => ticket.id === parent)) continue;
  if (!tickets.some(ticket => ticket.id === parent) && !initiatives.some(item => item.id === parent)) {
   const error = `Record ${id} refers to missing parent ${parent}.`;
   if (!diagnostics) throw new Error(error);
   diagnostics.push({ ref: tickets.find(ticket => ticket.id === id)!.ref, error });
   continue;
  }
  let current: string | undefined = parent;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
   seen.add(current);
   for (const initiative of initiatives) if (initiative.id === current || initiative.ticketIds.includes(current)) initiative.ticketIds = [...new Set([...initiative.ticketIds, id])];
   current = parents.get(current);
  }
 }
 return { backend: "local-markdown", tickets, initiatives };
}

async function githubSnapshot(context: SharedAgentContext, exec: Exec, scope?: { ref: string; kind?: "ticket" | "initiative" }): Promise<ExplorerSnapshot> {
 const match = /^github\.com\/([^/\s]+)\/([^/\s]+)$/.exec(context.canonicalOrigin.replace(/^https?:\/\//, "").replace(/\.git$/, ""));
 if (!match) throw new Error("GitHub backend requires a github.com OWNER/REPO canonical origin.");
 const repository = `${match[1]}/${match[2]}`;
 const base = `https://github.com/${repository}/issues/`;
 const selectedId = scope?.ref.startsWith(base) ? scope.ref.slice(base.length) : undefined;
 if (scope && (!selectedId || !/^[1-9]\d*$/.test(selectedId))) throw new Error(`GitHub record reference must be ${base}<NUMBER>.`);
 const descendants = new Set<string>(scope?.kind === "initiative" && selectedId ? [selectedId] : []);
 const tickets = new Map<string, ExplorerTicket>();
 const initiatives = new Map<string, ExplorerInitiative>();
 const parents = new Map<string, string>();
 const childrenById = new Map<string, string[]>();
 const pending = scope ? [selectedId!] : (await pages(exec, `repos/${repository}/issues?state=all&per_page=100`)).filter(value => !object(value, "GitHub issue").pull_request).map(value => issueNumber(object(value, "GitHub issue").number));
 while (pending.length) {
  const id = pending.shift()!;
  const existing = tickets.get(id);
  const expandChildren = !scope || descendants.has(id);
  if (existing && (!expandChildren || childrenById.has(id))) continue;
  const related = async (endpoint: string): Promise<string[]> => (await pages(exec, `repos/${repository}/issues/${id}/${endpoint}?per_page=100`)).map(value => {
   const relation = object(value, "GitHub issue relationship");
   const number = issueNumber(relation.number);
   if (relation.html_url !== `${base}${number}`) throw new Error("GitHub relationship refers to an unsupported cross-repository or noncanonical issue.");
   return number;
  });
  const blockedBy = existing?.blockedBy ?? await related("dependencies/blocked_by");
  const children = expandChildren ? childrenById.get(id) ?? await related("sub_issues") : [];
  if (expandChildren) childrenById.set(id, children);
  if (scope && descendants.has(id)) for (const child of children) descendants.add(child);
  if (existing) {
   const initiative = initiatives.get(id);
   if (initiative) { initiative.rootTicketIds = children; initiative.ticketIds = [...children]; }
   pending.push(...children);
   continue;
  }
  const issue = object(JSON.parse(await run(exec, "gh", ["issue", "view", id, "--repo", repository, "--json", "number,title,body,state,labels,issueType,parent"])), "GitHub issue");
  if (issueNumber(issue.number) !== id) throw new Error("GitHub returned a different issue identity.");
  const title = text(issue.title, "GitHub issue title");
  const body = string(issue.body, "GitHub issue body");
  const labels = list(issue.labels, "GitHub labels").map(value => text(object(value, "GitHub label").name, "GitHub label name"));
  const type = issue.issueType == null ? undefined : text(object(issue.issueType, "GitHub issue type").name, "GitHub issue type name");
  tickets.set(id, { id, title, documentType: type, fields: { labels }, ref: `${base}${id}`, backend: "github", status: text(issue.state, "GitHub issue state"), blockedBy, body });
  if (labels.includes("wayfinder:map") || type?.toLowerCase() === "spec") initiatives.set(id, { id, title, ref: `${base}${id}`, ticketIds: [...children], rootTicketIds: children, body });
  if (issue.parent != null) {
   const parent = object(issue.parent, "GitHub parent");
   const parentId = issueNumber(parent.number);
   if (parent.url !== undefined && parent.url !== `${base}${parentId}`) throw new Error("GitHub parent belongs to another repository.");
   parents.set(id, parentId);
   pending.push(parentId);
  }
  pending.push(...blockedBy, ...children);
 }
 validateRelations([...tickets.keys()].map(id => ({ id, blockedBy: parents.has(id) ? [parents.get(id)!] : [] })), "GitHub parent");
 for (const ticket of tickets.values()) {
  let parent = parents.get(ticket.id);
  while (parent) {
   const initiative = initiatives.get(parent);
   if (initiative && !initiative.ticketIds.includes(ticket.id)) initiative.ticketIds.push(ticket.id);
   parent = parents.get(parent);
  }
 }
 return { backend: "github", tickets: [...tickets.values()], initiatives: [...initiatives.values()] };
}

async function jiraSnapshot(context: SharedAgentContext, exec: Exec, config: Fields, scope?: { ref: string }): Promise<ExplorerSnapshot> {
 if (!scope) throw new Error("Jira backend loads one ticket at a time. Pass the canonical ticket reference.");
 const site = jiraSite(config);
 const cli = text(config.cli, "Jira tracker cli").split(/\s+/);
 const key = new RegExp(`^${site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/browse/([A-Z][A-Z0-9_]*-[1-9]\\d*)$`).exec(scope.ref)?.[1];
 if (!key) throw new Error(`Jira ticket reference must be ${site}/browse/<KEY>.`);
 const result = await exec(cli[0]!, [...cli.slice(1), "get-issue", key, "summary,status,issuetype,issuelinks,description", "0"], context.repositoryRoot);
 if (result.code !== 0) throw new Error(`Jira cli failed (exit ${result.code}): ${result.stdout}`);
 const issue = object(JSON.parse(result.stdout), "Jira issue");
 if (issue.key !== key) throw new Error("Jira returned a different issue identity.");
 const fields = object(issue.fields, "Jira issue fields");
 const tickets: ExplorerTicket[] = [];
 const blockedBy: string[] = [];
 for (const value of list(fields.issuelinks ?? [], "Jira issue links")) {
  const link = object(value, "Jira issue link");
  if (object(link.type, "Jira link type").inward !== "is blocked by" || link.inwardIssue == null) continue;
  const blocker = object(link.inwardIssue, "Jira blocking issue");
  const id = text(blocker.key, "Jira blocking issue key");
  const status = jiraStatus(object(blocker.fields, "Jira blocking issue fields").status, "Jira blocking issue status");
  blockedBy.push(id);
  tickets.push({ id, title: id, ref: `${site}/browse/${id}`, backend: "jira", status: status.state, fields: { status: status.name }, blockedBy: [], body: "" });
 }
 const issueType = text(object(fields.issuetype, "Jira issue type").name, "Jira issue type name");
 const status = jiraStatus(fields.status, "Jira status");
 tickets.push({
  id: key, title: text(fields.summary, "Jira summary"), documentType: issueType.toLowerCase() === "epic" ? "epic" : "issue", fields: { issueType, status: status.name },
  ref: `${site}/browse/${key}`, backend: "jira", status: status.state, blockedBy, body: fields.description == null ? "" : string(fields.description, "Jira description"),
 });
 return { backend: "jira", tickets, initiatives: [] };
}

function jiraStatus(value: unknown, label: string): { name: string; state: string } {
 const status = object(value, label);
 const name = text(status.name, `${label} name`);
 const category = text(object(status.statusCategory, `${label} category`).key, `${label} category key`);
 const state = { new: "todo", indeterminate: "in_progress", done: "done" }[category];
 if (!state) throw new Error(`${label} category ${category} is not new, indeterminate or done.`);
 return { name, state };
}

function jiraSite(config: Fields): string {
 const site = text(config.site, "Jira tracker site").replace(/\/+$/, "");
 if (!/^https:\/\/[^/\s]+$/.test(site)) throw new Error("Jira tracker site must be an https origin such as https://example.atlassian.net.");
 return site;
}

async function pages(exec: Exec, endpoint: string): Promise<unknown[]> {
 const result = JSON.parse(await run(exec, "gh", ["api", "--paginate", "--slurp", endpoint]));
 return list(result, "GitHub pages").flatMap(page => list(page, "GitHub page; pagination must return complete arrays"));
}

function validateRelations(rows: { id: string; blockedBy: string[] }[], label: string): void {
 const byId = new Map<string, { id: string; blockedBy: string[] }>();
 for (const row of rows) {
  if (byId.has(row.id)) throw new Error(`Duplicate ${label} ID: ${row.id}`);
  byId.set(row.id, row);
 }
 const active = new Set<string>();
 const done = new Set<string>();
 const visit = (id: string): void => {
  if (active.has(id)) throw new Error(`Cycle in ${label} graph at ${id}`);
  if (done.has(id)) return;
  const row = byId.get(id);
  if (!row) throw new Error(`Missing ${label}: ${id}`);
  active.add(id);
  for (const blocker of row.blockedBy) visit(blocker);
  active.delete(id);
  done.add(id);
 };
 for (const row of rows) visit(row.id);
}


async function exists(path: string): Promise<boolean> {
 try {
  await stat(path);
  return true;
 } catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  try {
   if ((await lstat(path)).isSymbolicLink()) throw new Error("Record path contains a dangling symlink.");
  } catch (linkError) {
   if ((linkError as NodeJS.ErrnoException).code !== "ENOENT") throw linkError;
  }
  return false;
 }
}
function within(root: string, target: string): boolean {
 const path = relative(resolve(root), resolve(target));
 return path === "" || (path !== ".." && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(path));
}
async function contained(root: string, target: string): Promise<string> {
 if (!within(root, target)) throw new Error("Record path escapes its configured store.");
 const actual = await realpath(target);
 if (!within(await realpath(root), actual)) throw new Error("Record symlink escapes its configured store.");
 return actual;
}
async function run(exec: Exec, command: string, args: string[]): Promise<string> {
 const result = await exec(command, args);
 if (result.code !== 0) throw new Error(`${command} failed (exit ${result.code}): ${result.stdout}`);
 return result.stdout;
}
function object(value: unknown, label: string): Fields {
 if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
 return value as Fields;
}
function list(value: unknown, label: string): unknown[] {
 if (!Array.isArray(value)) throw new Error(`${label} must be a list.`);
 return value;
}
function string(value: unknown, label: string): string {
 if (typeof value !== "string") throw new Error(`${label} must be a string.`);
 return value;
}
function text(value: unknown, label: string): string {
 const result = string(value, label).trim();
 if (!result) throw new Error(`${label} must not be empty.`);
 return result;
}
function scalar(value: unknown, label: string): string {
 return typeof value === "number" && Number.isFinite(value) ? String(value) : text(value, label);
}
function issueNumber(value: unknown): string {
 const id = scalar(value, "GitHub issue number");
 if (!/^[1-9]\d*$/.test(id)) throw new Error("GitHub issue number must be a positive integer.");
 return id;
}
function hash(value: unknown, label: string): string {
 const result = text(value, label);
 if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(result)) throw new Error(`${label} must be a full Git object ID.`);
 return result;
}
function references(value: unknown, label: string): string[] {
 return list(value, label).map(item => {
  const fields = object(item, label);
  text(fields.kind, `${label} kind`);
  return text(fields.ref, `${label} ref`);
 });
}

