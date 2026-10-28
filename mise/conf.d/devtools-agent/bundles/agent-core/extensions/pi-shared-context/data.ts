import { lstat, readdir, realpath, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContextRecord } from "../../skills/shared-context/scripts/shared-context/lib";
import { chronologicalReceipts, recordKind } from "./model";
import type { Exec, ExplorerEvent, ExplorerInitiative, ExplorerReceipt, ExplorerSnapshot, ExplorerTicket, SharedAgentContext, TicketWorkflow } from "./model";
import { assertRecord, INITIATIVE_LINKS_QUERY, INITIATIVE_SCHEMA, validateInitiativeMembership } from "../../../matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema";

type Fields = Record<string, unknown>;
type Document = { fields: Fields; body: string; links: unknown[] };

export async function loadExplorerSnapshot(context: SharedAgentContext, exec: Exec): Promise<ExplorerSnapshot> {
  if (context.error) throw new Error(context.error);
  let backend = context.routes.tickets.adapter;
  if (context.checkoutAvailable !== false || context.routes.alignment.store === "shared") {
    const alignment = await resolveContextRecord(context, { kind: "alignment" });
    if (!alignment.path) throw new Error("Alignment has no file-backed tracker definition.");
    const definition = join(alignment.path, "docs/agents/issue-tracker.md");
    if (!await exists(definition)) throw new Error(`Missing tracker definition: ${definition}. Configure docs/agents/issue-tracker.md before opening the explorer.`);
    await contained(alignment.path, definition);
    const config = (await document(definition, alignment.path, exec)).fields;
    backend = text(config.backend, "tracker backend");
    if (backend !== context.routes.tickets.adapter) throw new Error("Tracker backend disagrees with the resolved tickets route. Update the tracker definition or route configuration.");
  }
  const snapshot = backend === "local-markdown" ? await localSnapshot(context, exec)
    : backend === "github" ? await githubSnapshot(context, exec)
      : (() => { throw new Error(`Unsupported tracker backend: ${backend}`); })();
  validateRelations(snapshot.tickets, "ticket blocker");
  const assigned = new Set(snapshot.initiatives.flatMap(item => item.ticketIds));
  if (snapshot.backend === "github") for (const initiative of snapshot.initiatives) assigned.add(initiative.id);
  const unassigned = snapshot.tickets.filter(ticket => !assigned.has(ticket.id)).map(ticket => ticket.id);
  let groupId = "unassigned";
  while (snapshot.initiatives.some(item => item.id === groupId)) groupId = `_${groupId}`;
  const collectionRef = snapshot.backend === "local-markdown"
    ? (await resolveContextRecord(context, { kind: "tickets" })).ref
    : `https://${context.canonicalOrigin.replace(/^https?:\/\//, "").replace(/\.git$/, "")}/issues`;
  snapshot.initiatives.push({ id: groupId, title: "Ungrouped", ref: collectionRef, ticketIds: unassigned, body: "Records without an assigned initiative.", group: true });
  return snapshot;
}

export async function loadTicketWorkflow(context: SharedAgentContext, ticket: ExplorerTicket, exec: Exec): Promise<TicketWorkflow> {
  const result: TicketWorkflow = { ticketId: ticket.id, receipts: [], events: [] };
  if (recordKind(ticket) !== "ticket") return result;
  try {
    const workflowId = ticket.backend === "github" ? `GH-${ticket.id}` : ticket.id;
    const record = await resolveContextRecord(context, { kind: "workflow", id: workflowId });
    if (!record.path || !record.root) throw new Error("Workflow route is not file-backed.");
    if (context.checkoutAvailable === false && record.store === "repository") throw new Error("Workflow context requires a usable repository checkout.");
    if (!await exists(record.path)) return result;
    await contained(record.root, record.path);
    const events = join(record.path, "events");
    if (!await exists(events)) return result;
    for (const file of await files(events, /\.(md|yaml|yml|json)$/)) {
      const ref = `${record.ref}/events/${relative(events, file).split("\\").join("/")}`;
      const event: ExplorerEvent = { id: ref, ref };
      result.events!.push(event);
      try {
        const doc = await document(file, record.root, exec);
        const fields = doc.fields;
        event.fields = fields;
        event.body = doc.body;
        if (fields.schema !== "worktree-receipt/v1") throw new Error("Event must use schema worktree-receipt/v1.");
        if (fields.workflow_id !== workflowId) throw new Error("Receipt workflow_id does not match the selected ticket.");
        const identity = object(fields.ticket, "receipt ticket");
        if (String(identity.id) !== ticket.id || identity.backend !== ticket.backend || identity.ref !== ticket.ref || fields.ticket_ref !== ticket.ref) throw new Error("Receipt ticket identity or ref does not match the selected ticket.");
        const workflow = object(fields.workflow, "receipt workflow");
        for (const field of ["ref", "store", "root"] as const) {
          if (workflow[field] !== record[field]) throw new Error(`Receipt workflow.${field} does not match the resolved workflow${field === "root" ? " store root (not the workflow directory)" : ""}.`);
        }
        const repository = text(fields.repository, "receipt repository");
        if (!isAbsolute(repository) || resolve(repository) !== resolve(context.repositoryRoot)) throw new Error("Receipt repository does not match the current repository.");
        const workspacePath = text(fields.worktree, "receipt worktree");
        if (!isAbsolute(workspacePath) || fields.workspace_path !== workspacePath) throw new Error("Receipt worktree and workspace_path must name the same absolute worktree.");
        const status = text(fields.status, "receipt status");
        const lifecycle = fields.event === "phase-start" || fields.event === "phase-complete";
        const started = fields.event === "phase-start" && status === "started";
        const finishing = fields.phase === "finish" && status === "FINISHING";
        if (!started && !finishing && !["completed", "failed", "blocked", "FINISHED", "FINISH_FAILED"].includes(status)) throw new Error("Receipt status is not a supported phase result or lifecycle state.");
        if (fields.verdict != null && !["SUCCESS", "FAILURE"].includes(String(fields.verdict))) throw new Error("Receipt verdict must be SUCCESS or FAILURE.");
        if (!Number.isInteger(fields.attempt) || Number(fields.attempt) < 1) throw new Error("Receipt attempt must be a positive integer.");
        text(fields.muxer, "receipt muxer");
        text(fields.agent, "receipt agent");
        if (typeof fields.pane_id !== "number" && typeof fields.pane_id !== "string") throw new Error("Receipt pane_id is required.");
        if (!lifecycle || fields.evidence != null) {
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
    if (errors.length) {
      result.error = errors.join("\n");
      return result;
    }
    const byId = new Map<string, ExplorerReceipt>();
    for (const receipt of result.receipts) {
      if (byId.has(receipt.id)) throw new Error("Duplicate receipt ID.");
      byId.set(receipt.id, receipt);
    }
    validateRelations([...byId.values()].map(item => ({ id: item.id, blockedBy: item.parentReceipt ? [item.parentReceipt] : [] })), "receipt parent");
    const newest = result.receipts[0];
    if (newest) {
      if (!await exists(newest.workspacePath)) throw new Error("Recorded worktree is unavailable; current source freshness cannot be established.");
      const top = (await run(exec, "git", ["-C", newest.workspacePath, "rev-parse", "--show-toplevel"])).trim();
      if (await realpath(top) !== await realpath(newest.workspacePath)) throw new Error("Recorded workspace is not the worktree root.");
      const worktreeCommon = (await run(exec, "git", ["-C", newest.workspacePath, "rev-parse", "--git-common-dir"])).trim();
      const repositoryCommon = (await run(exec, "git", ["-C", context.repositoryRoot, "rev-parse", "--git-common-dir"])).trim();
      if (await realpath(resolve(newest.workspacePath, worktreeCommon)) !== await realpath(resolve(context.repositoryRoot, repositoryCommon))) throw new Error("Recorded worktree belongs to a different Git repository.");
      const commit = hash((await run(exec, "git", ["-C", newest.workspacePath, "rev-parse", "--verify", "HEAD^{commit}"])).trim(), "current source commit");
      const tree = hash((await run(exec, "git", ["-C", newest.workspacePath, "rev-parse", "--verify", "HEAD^{tree}"])).trim(), "current source tree");
      for (const receipt of result.receipts) {
        await run(exec, "git", ["-C", newest.workspacePath, "cat-file", "-e", `${receipt.sourceCommit}^{commit}`]);
        const type = (await run(exec, "git", ["-C", newest.workspacePath, "cat-file", "-t", receipt.sourceTree])).trim();
        if (type !== "tree") throw new Error("Receipt source_tree is not a real Git tree.");
      }
      result.sourceCommit = commit;
      result.sourceTree = tree;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    delete result.sourceCommit;
    delete result.sourceTree;
  }
  return result;
}

async function localSnapshot(context: SharedAgentContext, exec: Exec): Promise<ExplorerSnapshot> {
  const ticketsRecord = await resolveContextRecord(context, { kind: "tickets" });
  const initiativesRecord = await resolveContextRecord(context, { kind: "initiatives" });
  if (!ticketsRecord.path || !ticketsRecord.root || !initiativesRecord.path || !initiativesRecord.root || !["markdown", "local-markdown"].includes(initiativesRecord.adapter)) throw new Error("Local Markdown requires file-backed ticket and initiative routes.");
  const tickets: ExplorerTicket[] = [];
  const paths = new Map<string, string>();
  const parents = new Map<string, string>();
  for (const file of context.checkoutAvailable === false && ticketsRecord.store === "repository" ? [] : await files(ticketsRecord.path, /\.md$/)) {
    const doc = await document(file, ticketsRecord.root, exec);
    try { assertRecord(doc.fields, "ticket", { allowLegacy: true, expectedId: basename(file, ".md") }); }
    catch (error) { throw new Error(`Unreadable record ${file}: ${error instanceof Error ? error.message : String(error)}`); }
    const id = scalar(doc.fields.id, "ticket id");
    const documentType = doc.fields.type == null ? undefined : text(doc.fields.type, "ticket type");
    tickets.push({ id, title: text(doc.fields.title, "ticket title"), documentType, fields: doc.fields, ref: `${ticketsRecord.ref}/${relative(ticketsRecord.path, file).split("\\").join("/")}`, backend: "local-markdown", status: doc.fields.work_status == null ? doc.fields.status == null ? "unavailable" : text(doc.fields.status, "record status") : text(doc.fields.work_status, "ticket work_status"), blockedBy: list(doc.fields.blocked_by ?? [], "ticket blocked_by").map(value => scalar(value, "ticket blocker")), body: doc.body });
    paths.set(await realpath(file), id);
    if (doc.fields.parent != null) parents.set(id, scalar(doc.fields.parent, "ticket parent"));
  }
  const initiatives: ExplorerInitiative[] = [];
  for (const file of context.checkoutAvailable === false && initiativesRecord.store === "repository" ? [] : await files(initiativesRecord.path, /\.md$/)) {
    if (relative(initiativesRecord.path, file).split(/[\\/]/).length !== 2 || !file.endsWith("/index.md")) continue;
    const doc = await document(file, initiativesRecord.root, exec);
    const id = dirname(relative(initiativesRecord.path, file));
    assertRecord(doc.fields, "initiative", { allowLegacy: true, expectedId: id });
    const ticketIds: string[] = [];
    for (const rawLink of doc.links) {
      const url = text(object(rawLink, "initiative link").url, "initiative link URL");
      if (url.startsWith("#") || url.startsWith("//") || (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(url) && !url.startsWith("file:"))) continue;
      const target = url.startsWith("file:") ? fileURLToPath(new URL(url)) : resolve(dirname(file), decodeURIComponent(url.split(/[?#]/, 1)[0]!));
      if (context.checkoutAvailable === false && ticketsRecord.store === "repository") continue;
      if (!within(ticketsRecord.path, target) || !target.endsWith(".md")) continue;
      await contained(ticketsRecord.path, target);
      const linkedId = paths.get(await realpath(target));
      if (!linkedId) throw new Error("Initiative links to a missing or unknown ticket.");
      ticketIds.push(linkedId);
    }
    if (doc.fields.schema === INITIATIVE_SCHEMA) {
      const errors = validateInitiativeMembership(id, ticketIds, tickets.map(ticket => ({ id: ticket.id, parent: parents.get(ticket.id) })));
      if (errors.length) throw new Error(errors.join(" "));
    }
    initiatives.push({ id, title: doc.fields.title == null ? id : text(doc.fields.title, "initiative title"), ref: `${initiativesRecord.ref}/${id}/index.md`, ticketIds: [...new Set(ticketIds)], body: doc.body, ...(typeof doc.fields.phase === "string" && doc.fields.phase.trim() ? { phase: doc.fields.phase } : {}) });
  }
  validateRelations([...parents].map(([id, parent]) => ({ id, blockedBy: parents.has(parent) ? [parent] : [] })), "ticket hierarchy");
  for (const [id, parent] of parents) {
    if (context.checkoutAvailable === false && initiativesRecord.store === "repository" && !tickets.some(ticket => ticket.id === parent)) continue;
    if (!tickets.some(ticket => ticket.id === parent) && !initiatives.some(item => item.id === parent)) throw new Error(`Record ${id} refers to missing parent ${parent}.`);
    let current: string | undefined = parent;
    while (current) {
      for (const initiative of initiatives) if (initiative.id === current || initiative.ticketIds.includes(current)) initiative.ticketIds = [...new Set([...initiative.ticketIds, id])];
      current = parents.get(current);
    }
  }
  return { backend: "local-markdown", tickets, initiatives };
}

async function githubSnapshot(context: SharedAgentContext, exec: Exec): Promise<ExplorerSnapshot> {
  const match = /^github\.com\/([^/\s]+)\/([^/\s]+)$/.exec(context.canonicalOrigin.replace(/^https?:\/\//, "").replace(/\.git$/, ""));
  if (!match) throw new Error("GitHub backend requires a github.com OWNER/REPO canonical origin.");
  const repository = `${match[1]}/${match[2]}`;
  const base = `https://github.com/${repository}/issues/`;
  const tickets = new Map<string, ExplorerTicket>();
  const initiatives = new Map<string, ExplorerInitiative>();
  const parents = new Map<string, string>();
  const pending = (await pages(exec, `repos/${repository}/issues?state=all&per_page=100`)).filter(value => !object(value, "GitHub issue").pull_request).map(value => issueNumber(object(value, "GitHub issue").number));
  while (pending.length) {
    const id = pending.shift()!;
    if (tickets.has(id)) continue;
    const issue = object(JSON.parse(await run(exec, "gh", ["issue", "view", id, "--repo", repository, "--json", "number,title,body,state,labels,issueType,parent"])), "GitHub issue");
    if (issueNumber(issue.number) !== id) throw new Error("GitHub returned a different issue identity.");
    const related = async (endpoint: string): Promise<string[]> => (await pages(exec, `repos/${repository}/issues/${id}/${endpoint}?per_page=100`)).map(value => {
      const relation = object(value, "GitHub issue relationship");
      const number = issueNumber(relation.number);
      if (relation.html_url !== `${base}${number}`) throw new Error("GitHub relationship refers to an unsupported cross-repository or noncanonical issue.");
      return number;
    });
    const blockedBy = await related("dependencies/blocked_by");
    const children = await related("sub_issues");
    const title = text(issue.title, "GitHub issue title");
    const body = string(issue.body, "GitHub issue body");
    const labels = list(issue.labels, "GitHub labels").map(value => text(object(value, "GitHub label").name, "GitHub label name"));
    const type = issue.issueType == null ? undefined : text(object(issue.issueType, "GitHub issue type").name, "GitHub issue type name");
    tickets.set(id, { id, title, documentType: type, fields: { labels }, ref: `${base}${id}`, backend: "github", status: text(issue.state, "GitHub issue state"), blockedBy, body });
    if (labels.includes("wayfinder:map") || type?.toLowerCase() === "spec") initiatives.set(id, { id, title, ref: `${base}${id}`, ticketIds: children, body });
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

async function document(file: string, root: string, exec: Exec): Promise<Document> {
  await contained(root, file);
  const markdown = file.endsWith(".md");
  const query = markdown
    ? `import "github.com/harehare/okf.mq" | import "section" | let source = . | let doc = okf::okf_parse(source) | { fields: doc["frontmatter"], body: doc["body"], links: ${INITIATIVE_LINKS_QUERY} }`
    : 'import "github.com/harehare/okf.mq" | { fields: ., body: "", links: [] }';
  const parsed = object(JSON.parse(await run(exec, "mq", ["--allow-http-import", "--no-lockfile", `--allow-read=${root}`, "-I", markdown ? "raw" : file.endsWith(".json") ? "json" : "yaml", "-F", "json", query, file])), "mq document");
  return { fields: object(parsed.fields, "document fields"), body: string(parsed.body, "document body"), links: list(parsed.links, "document links") };
}

async function files(root: string, pattern: RegExp): Promise<string[]> {
  if (!await exists(root)) return [];
  const found: string[] = [];
  const visited = new Set<string>();
  const walk = async (directory: string): Promise<void> => {
    const actual = await contained(root, directory);
    if (visited.has(actual)) throw new Error("Collection contains a directory alias or symlink cycle.");
    visited.add(actual);
    for (const entry of (await readdir(directory)).sort()) {
      const file = join(directory, entry);
      await contained(root, file);
      const info = await stat(file);
      if (info.isDirectory()) await walk(file);
      else if (info.isFile() && pattern.test(entry)) found.push(file);
    }
  };
  await walk(root);
  return found;
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
