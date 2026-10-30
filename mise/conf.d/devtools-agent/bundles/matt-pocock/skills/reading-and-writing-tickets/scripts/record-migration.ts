// Plans are reproducible snapshots. Apply re-resolves routes and rebuilds the plan
// before taking a local lock; the caller must separately coordinate other writers.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContextRecord, resolveSharedContext, type ResolvedRecord, type SharedAgentContext } from "../../../../agent-core/skills/shared-context/scripts/shared-context/lib.ts";
import { validateStorePath } from "../../../../agent-core/skills/shared-context/scripts/shared-context/layout.ts";
import { loadExplorerSnapshot } from "../../../../agent-core/extensions/pi-shared-context/data.ts";
import { markdownGraph } from "./dep-tree-markdown.ts";
import { buildDependencyGraph, renderDependencyGraph } from "./dep-tree-shared.ts";
import { assertRecord, INITIATIVE_SCHEMA, RESULT_SCHEMA, TICKET_SCHEMA, validateRecord } from "./record-schema.ts";

export type Selector = { kind: "ticket" | "spec-ticket" | "initiative-spec"; id: string };
export type Options = { repository: string; sharedContextBase?: string };
type Position = { line: number; column: number };
type Link = { url: string; node: { position: { start: Position; end: Position } } };
type Document = { path: string; root: string; ref: string; store?: string; text: string; fields: Record<string, unknown>; links: Link[] };
type Input = { path: string; root: string; text: string; hash: string; commit: string | null; blob: string | null };
type Change = { oldPath: string; newPath: string; oldRef: string; newRef: string; oldRoot: string; newRoot: string; before: string; after: string; beforeHash: string; afterHash: string };
export type MigrationPlan = {
  schema: "tracker-migration-plan/v1"; id: string; repository: string; origin: string; slug: string; selector: Selector;
  routes: { tickets: ResolvedRecord; initiatives: ResolvedRecord; tracker: ResolvedRecord; workflow: ResolvedRecord };
  selected: string[]; affectedChildren: string[]; inboundReferences: { from: string; url: string; to: string }[];
  coverage: { roots: string[]; scope: string; excluded: string[] }; inputs: Input[]; changes: Change[];
  conflicts: string[]; validation: string[]; writerSafety: string;
};
type State = { schema: "tracker-migration/v1"; migration: string; sequence: number; previousHash: string | null; state: "applying" | "applied" | "rolled-back" | "recovery-required"; planHash: string; at: string; error?: string; recovery?: string[] };
type Environment = { context: SharedAgentContext; tickets: ResolvedRecord; initiatives: ResolvedRecord; tracker: ResolvedRecord };
const helper = fileURLToPath(new URL("./record-markdown.mq", import.meta.url));
const excludedSegments: Record<string, true> = { events: true, reviews: true, artifacts: true, ".git": true };

export async function planMigration(options: Options, selector: Selector): Promise<MigrationPlan> {
  const env = await environment(options);
  const documents = await discover(env);
  const selectedTarget = await resolveContextRecord(env.context, selector.kind === "initiative-spec" ? { kind: "initiative", id: selector.id } : { kind: "ticket", id: selector.id });
  const sourcePath = selector.kind === "initiative-spec" ? path.join(requiredPath(selectedTarget), "spec.md") : requiredPath(selectedTarget);
  const source = documents.find((document) => document.path === sourcePath);
  if (!source) throw new Error("Selected record was not found in its resolved collection");
  const errors = validateRecord(source.fields, selector.kind === "initiative-spec" ? "initiative" : "ticket", { allowLegacy: true, expectedId: selector.id });
  if (errors.length) throw new Error(errors.join("; "));
  if (source.fields.schema !== undefined && selector.kind !== "initiative-spec") throw new Error("Named migration requires an unversioned legacy record; use check for versioned records");
  if (typeof source.fields.id !== "string" || !source.fields.id.trim() || typeof source.fields.title !== "string" || !source.fields.title.trim()) throw new Error("Migration requires nonempty string id and title in source YAML frontmatter. Add reviewed metadata first; this tool does not infer it from filenames or headings.");
  if (String(source.fields.id) !== selector.id) throw new Error("Selected record id must match the explicit selector");
  const children = selector.kind === "ticket" ? [] : documents.filter((document) => within(requiredPath(env.tickets), document.path) && document.fields.parent === selector.id);
  const conflicts: string[] = [];
  const changes: Change[] = [];
  let destination = sourcePath;
  let target = selectedTarget;
  let after: string;
  if (selector.kind === "ticket") {
    after = stamp(source, TICKET_SCHEMA, []);
  } else {
    target = await resolveContextRecord(env.context, { kind: "initiative", id: selector.id });
    destination = path.join(requiredPath(target), "index.md");
    if (await exists(destination)) conflicts.push("Initiative index already exists; consolidation never overwrites authored content");
    if (selector.kind === "spec-ticket") {
      const companion = path.join(requiredPath(target), "spec.md");
      if (await exists(companion)) conflicts.push("Initiative spec.md already exists; consolidate it separately before moving a spec ticket");
      if (source.fields.work_status !== undefined && source.fields.work_status !== "unclaimed") conflicts.push("Spec ticket has executable workflow status; resolve its work history before conversion");
      if (source.fields.blocked_by !== undefined && (!Array.isArray(source.fields.blocked_by) || source.fields.blocked_by.length > 0)) conflicts.push("Spec ticket has executable blockers; resolve them before conversion");
      const sourceWorkflow = await resolveContextRecord(env.context, { kind: "workflow", id: selector.id });
      if (await exists(requiredPath(sourceWorkflow)) && (await fs.readdir(requiredPath(sourceWorkflow))).length) conflicts.push("Spec ticket has workflow history; explicit history reconciliation is required before conversion");
    }
    const relocated = rewriteLinks(source.text, source.links, sourcePath, destination, new Map([[sourcePath, destination]]));
    after = stamp({ ...source, text: relocated }, INITIATIVE_SCHEMA, ["work_status", "blocked_by"]);
    const memberships = children.map((child) => ({ text: String(child.fields.title ?? child.fields.id), url: relativeLink(destination, child.path) }));
    after = membership(after, memberships);
    for (const document of documents) {
      if (document.path !== sourcePath && document.fields.id === selector.id) conflicts.push("Selected id is duplicated in the resolved tracker collections");
      if (document.fields.blocked_by instanceof Array && document.fields.blocked_by.includes(selector.id)) conflicts.push(`Executable dependency on the spec ticket must be resolved explicitly: ${document.ref}`);
    }
  }
  const nextFields = inspect(after).fields;
  assertRecord(nextFields, selector.kind === "ticket" ? "ticket" : "initiative", { expectedId: selector.id });
  changes.push(change(source, target, destination, after));
  const inboundReferences: MigrationPlan["inboundReferences"] = [];
  if (destination !== sourcePath) {
    for (const document of documents) {
      if (document.path === sourcePath) continue;
      const inbound = document.links.filter((link) => linkPath(document.path, link.url) === sourcePath);
      if (!inbound.length) continue;
      for (const link of inbound) inboundReferences.push({ from: document.ref, url: link.url, to: reference(target, destination) });
      const patched = rewriteLinks(document.text, inbound, document.path, document.path, new Map([[sourcePath, destination]]));
      if (patched !== document.text) changes.push(change(document, recordForDocument(env, document), document.path, patched));
    }
  }
  for (const child of children) {
    const childErrors = validateRecord(child.fields, "ticket", { allowLegacy: true });
    if (childErrors.length) conflicts.push(`${child.ref}: ${childErrors.join("; ")}`);
    if (selector.kind !== "ticket" && child.fields.schema === undefined) {
      const existing = changes.find((entry) => entry.oldPath === child.path);
      const after = stamp({ ...child, text: existing?.after ?? child.text }, TICKET_SCHEMA, []);
      assertRecord(inspect(after).fields, "ticket", { expectedId: String(child.fields.id) });
      const stamped = change(child, recordForDocument(env, child), child.path, after);
      if (existing) Object.assign(existing, stamped);
      else changes.push(stamped);
    }
  }
  const inputs = documents.map((document) => ({ path: document.path, root: document.root, text: document.text, hash: hash(document.text), ...gitSnapshot(document.root, document.path) }));
  const workflowPlaceholder = await resolveContextRecord(env.context, { kind: "workflow", id: "migration-plan" });
  const core = {
    schema: "tracker-migration-plan/v1" as const, repository: env.context.repositoryRoot, origin: env.context.canonicalOrigin, slug: env.context.slug, selector,
    routes: { tickets: env.tickets, initiatives: env.initiatives, tracker: env.tracker, workflow: workflowPlaceholder },
    selected: [source.ref], affectedChildren: children.map((child) => child.ref).sort(), inboundReferences,
    coverage: { roots: [...new Set([requiredPath(env.tracker), requiredPath(env.tickets), requiredPath(env.initiatives)])].sort(), scope: "Live Markdown in resolved tracker, ticket and initiative collections only. Ordinary repository docs, external repositories and sources are not searched: review those references manually before publication.", excluded: ["events", "reviews", "artifacts", "immutable workflow history"] },
    inputs, changes, conflicts: [...new Set(conflicts)], validation: ["shared-context roots resolved", "unknown schemas rejected", "target schema validated", "source and inbound snapshots hashed", "destination must be absent", "children IDs, parents, status and dependencies retained"],
    writerSafety: "No automated muxer or other-writer liveness check. Coordinate all writers before apply and acknowledge this limit explicitly.",
  };
  const id = hash(JSON.stringify(core)).slice(0, 24);
  const workflow = await resolveContextRecord(env.context, { kind: "workflow", id: `migration-${id}` });
  return { ...core, id, routes: { ...core.routes, workflow } };
}

export async function applyMigration(options: Options, plan: MigrationPlan, acknowledgeWriterSafety: boolean): Promise<Record<string, unknown>> {
  if (!acknowledgeWriterSafety) throw new Error("Apply requires --acknowledge-writer-safety after coordinating all writers; no automated liveness claim is made");
  validatePlanShape(plan);
  const env = await environment(options);
  await validatePlanPaths(env, plan);
  const workflow = await resolveContextRecord(env.context, { kind: "workflow", id: `migration-${plan.id}` });
  const directory = requiredPath(workflow);
  const planFile = path.join(directory, "artifacts/snapshots/migration-plan.json");
  if (await exists(planFile)) {
    const stored = JSON.parse(await fs.readFile(planFile, "utf8"));
    if (JSON.stringify(stored) !== JSON.stringify(plan)) throw new Error("Migration id already has a different immutable plan");
    const state = await latestState(directory);
    if (state?.state === "applied") return { ...(await checkMigration(options, plan.id)), idempotent: true };
    throw new Error("Migration has an incomplete recovery or publication state; inspect its append-only events before further work");
  }
  if (await exists(directory) && (await fs.readdir(directory)).length) throw new Error("Migration workflow collision: existing content has no approved migration plan");
  await blockIncompleteMigrations(env, plan.id);
  const rebuilt = await planMigration(options, plan.selector);
  if (JSON.stringify(rebuilt) !== JSON.stringify(plan)) throw new Error("Stale or altered plan: routes, selected records, collection membership, Git source or destination changed; create a new plan");
  if (plan.conflicts.length) throw new Error(`Plan has conflicts: ${plan.conflicts.join("; ")}`);
  await validateStaged(options, plan);
  await fs.mkdir(directory, { recursive: true });
  const lockPath = path.join(directory, ".migration-writer.lock");
  const lock = await fs.open(lockPath, "wx");
  const applied: Change[] = [];
  let stateStarted = false;
  try {
    // Recheck inside the local lock. This lock does not coordinate non-CLI writers.
    const lockedPlan = await planMigration(options, plan.selector);
    if (JSON.stringify(lockedPlan) !== JSON.stringify(plan)) throw new Error("Inputs changed before apply acquired its local lock");
    await fs.mkdir(path.dirname(planFile), { recursive: true });
    await durableWrite(planFile, JSON.stringify(plan, null, 2) + "\n", true);
    await appendState(directory, plan, "applying");
    stateStarted = true;
    for (const entry of plan.changes) {
      await guardChange(entry);
      await fs.mkdir(path.dirname(entry.newPath), { recursive: true });
      await installChange(entry);
      applied.push(entry);
    }
    await checkContents(options, plan);
    await appendState(directory, plan, "applied");
  } catch (error) {
    const recovery: string[] = [];
    for (const entry of applied.reverse()) {
      try { await restoreChange(entry); } catch (rollbackError) { recovery.push(`${entry.oldRef}: ${message(rollbackError)}`); }
    }
    if (stateStarted) await appendState(directory, plan, recovery.length ? "recovery-required" : "rolled-back", message(error), recovery);
    throw new Error(`${message(error)}; ${recovery.length ? "manual recovery required; inspect migration events" : "partial writes rolled back"}`);
  } finally {
    await lock.close();
    await fs.unlink(lockPath);
  }
  return checkMigration(options, plan.id);
}

export async function checkMigration(options: Options, id: string): Promise<Record<string, unknown>> {
  if (!/^[a-f0-9]{24}$/.test(id)) throw new Error("Migration id must be the 24-character id from the plan");
  const env = await environment(options);
  const workflow = await resolveContextRecord(env.context, { kind: "workflow", id: `migration-${id}` });
  const directory = requiredPath(workflow);
  const plan = JSON.parse(await fs.readFile(path.join(directory, "artifacts/snapshots/migration-plan.json"), "utf8")) as MigrationPlan;
  validatePlanShape(plan);
  if (plan.id !== id) throw new Error("Migration record id does not match its workflow");
  await validatePlanPaths(env, plan);
  const state = await latestState(directory);
  if (!state || state.migration !== id || state.planHash !== hash(JSON.stringify(plan))) throw new Error("Migration event does not match the immutable plan");
  if (state.state !== "applied") throw new Error(`Migration recovery is incomplete (${state.state}); further work is blocked`);
  const content = await checkContents(options, plan);
  const stores = await publicationStatus(plan, directory);
  const furtherWorkBlocked = stores.some((item) => item.status !== "published" && item.status !== "local-only");
  const status = stores.some((item) => item.status === "uncommitted") ? "required"
    : stores.some((item) => item.status === "committed") ? "committed"
      : stores.every((item) => item.status === "local-only") ? "local-only" : "published";
  const publication = { status, stores, required: furtherWorkBlocked, details: stores.map((item) => item.required) };
  return { schema: RESULT_SCHEMA, operation: "migrate check", backend: "local-markdown", ok: true, migration: id, workflow: workflow.ref, recovery: state.state, coverage: plan.coverage, snapshots: plan.changes.map((entry) => ({ oldRef: entry.oldRef, newRef: entry.newRef, beforeHash: entry.beforeHash, afterHash: entry.afterHash })), changes: null, validation: { status: "passed", details: ["Verified immutable migration snapshots, event chain, membership, dependency graph and normal tracker discovery."] }, rendered: content.dependencyGraph ?? null, ...content, publication, furtherWorkBlocked };
}

export async function checkRecord(options: Options, kind: "ticket" | "initiative", id: string): Promise<Record<string, unknown>> {
  const env = await environment(options);
  const documents = await discover(env);
  const target = await resolveContextRecord(env.context, { kind, id });
  const recordPath = kind === "initiative" ? path.join(requiredPath(target), "index.md") : requiredPath(target);
  const document = documents.find((item) => item.path === recordPath);
  if (!document) throw new Error("Selected record is missing from normal tracker discovery");
  assertRecord(document.fields, kind, { allowLegacy: true, expectedId: id });
  let graph: string;
  let graphScope = "initiative dependency graph";
  try {
    graph = await markdownGraph(env.context.repositoryRoot, kind === "ticket" ? id : undefined, kind === "initiative" ? id : undefined, options.sharedContextBase);
  } catch (error) {
    if (kind === "initiative" && message(error) === "dependency graph needs at least one root ticket") {
      graph = "";
      graphScope = "empty initiative; no executable dependency graph";
    } else if (kind === "ticket" && message(error).startsWith("No initiative found for ticket ")) {
      const dependency = await buildDependencyGraph(id, async (ticketId) => {
        const record = documents.find((candidate) => within(requiredPath(env.tickets), candidate.path) && candidate.fields.id === ticketId);
        if (!record) throw new Error(`Dependency ticket ${ticketId} was not found`);
        assertRecord(record.fields, "ticket", { allowLegacy: true });
        const blockers = record.fields.blocked_by ?? [];
        if (!Array.isArray(blockers) || blockers.some((blocker) => typeof blocker !== "string")) throw new Error("Legacy dependency blocked_by must be a list of ticket IDs");
        return { ticket: { id: ticketId, title: String(record.fields.title), type: String(record.fields.type ?? "ticket"), status: typeof record.fields.work_status === "string" ? record.fields.work_status : undefined }, blockedBy: blockers as string[] };
      });
      graph = renderDependencyGraph(dependency);
      graphScope = "standalone ticket dependency graph; markdownGraph found no initiative membership";
    } else throw error;
  }
  const snapshot = await loadExplorerSnapshot(env.context, async (command, args) => {
    const result = spawnSync(command, args, { encoding: "utf8" });
    if (result.error) throw result.error;
    return { stdout: result.stdout ?? "", code: result.status ?? 1 };
  });
  const discovered = (kind === "ticket" ? snapshot.tickets : snapshot.initiatives).some((record) => record.id === id);
  if (!discovered) throw new Error("The normal tracker explorer did not discover the selected migrated record");
  const selectedInitiative = snapshot.initiatives.find((record) => record.id === id);
  const ticketIds = kind === "ticket" ? [id] : selectedInitiative?.ticketIds ?? [];
  const tickets = snapshot.tickets.filter((ticket) => ticketIds.includes(ticket.id)).map((ticket) => ({ id: ticket.id, title: ticket.title, ref: ticket.ref, state: ticket.status, blocked_by: ticket.blockedBy }));
  const initiatives = kind === "initiative" && selectedInitiative ? [{ id, title: selectedInitiative.title, ref: selectedInitiative.ref, children: tickets.map((ticket) => ({ id: ticket.id, ref: ticket.ref })) }] : [];
  return { schema: RESULT_SCHEMA, operation: "check", backend: "local-markdown", ok: true, initiatives, tickets, changes: null, validation: { status: "passed", details: ["Validated the selected record through the normal graph and tracker explorer readers."] }, publication: null, rendered: graph, kind, id, ref: reference(target, recordPath), recordSchema: document.fields.schema ?? null, legacy: document.fields.schema === undefined, graph, graphScope, normalTrackerDiscovery: { tickets: snapshot.tickets.length, initiatives: snapshot.initiatives.length }, coverage: "Resolved tracker collections; normal Markdown graph and explorer discovery" };
}

export async function writePlanOutput(options: Options, plan: MigrationPlan, filename: string): Promise<void> {
  const env = await environment(options);
  const destination = path.resolve(filename);
  const workflow = await resolveContextRecord(env.context, { kind: "workflow", id: `migration-${plan.id}` });
  const collections = [requiredPath(env.tracker), requiredPath(env.tickets), requiredPath(env.initiatives), path.dirname(requiredPath(workflow))];
  for (const collection of collections) {
    const root = await realAncestor(collection);
    if (within(root, await realAncestor(destination))) throw new Error("Plan output must be outside all resolved tracker and workflow collections");
  }
  await durableWrite(destination, JSON.stringify(plan, null, 2) + "\n", true);
}

export function describePlanRecords(plan: MigrationPlan): { initiatives: Record<string, unknown>[]; tickets: Record<string, unknown>[] } {
  const first = plan.changes[0]!;
  const selected = inspect(first.after).fields;
  const selectedTicket = plan.selector.kind === "ticket";
  const tickets = selectedTicket
    ? [{ id: String(selected.id), title: String(selected.title), ref: first.newRef, state: selected.work_status, blocked_by: selected.blocked_by }]
    : plan.affectedChildren.map((ref) => {
      const input = plan.inputs.find((item) => {
        const target = [plan.routes.tickets, plan.routes.initiatives, plan.routes.tracker].find((route) => route.root === item.root && within(requiredPath(route), item.path));
        return target && reference(target, item.path) === ref;
      })!;
      const changed = plan.changes.find((entry) => entry.oldPath === input.path);
      const fields = inspect(changed?.after ?? input.text).fields;
      return { id: String(fields.id), title: String(fields.title), ref: changed?.newRef ?? ref, state: fields.work_status, blocked_by: fields.blocked_by };
    });
  const initiatives = selectedTicket ? [] : [{ id: String(selected.id), title: String(selected.title), ref: first.newRef, children: tickets.map((ticket) => ({ id: ticket.id, ref: ticket.ref })) }];
  return { initiatives, tickets };
}

async function environment(options: Options): Promise<Environment> {
  if (!options.repository || !path.isAbsolute(options.repository)) throw new Error("Pass an explicit absolute --repository path");
  const context = await resolveSharedContext(async (command, args) => {
    const result = spawnSync(command, args, { encoding: "utf8" });
    if (result.error) throw result.error;
    return { stdout: result.stdout ?? "", code: result.status ?? 1 };
  }, options.repository, options.sharedContextBase);
  if (!context || context.error) throw new Error(context?.error ?? "Target needs a Git repository, origin and resolvable shared context");
  if (context.routes.tickets.adapter !== "local-markdown") throw new Error("Prerequisite: this CLI supports only the Local Markdown backend; use the configured hosted tracker migration tools. No mutation performed.");
  const [tickets, initiatives, tracker] = await Promise.all([resolveContextRecord(context, { kind: "tickets" }), resolveContextRecord(context, { kind: "initiatives" }), resolveContextRecord(context, { kind: "tracker" })]);
  return { context, tickets, initiatives, tracker };
}

async function discover(env: Environment): Promise<Document[]> {
  const documents = new Map<string, Document>();
  for (const target of [env.tracker, env.tickets, env.initiatives]) {
    const root = requiredPath(target);
    if (!await exists(root)) continue;
    const rows = mq< { path: string; text: string }[]>("map(walk_files(root, \"**/*.md\"), fn(file): {path: file, text: read_file(root + \"/\" + file)};)", "", { root }, root, false);
    for (const row of rows) {
      if (row.path.split(/[\\/]/).some((segment) => Object.hasOwn(excludedSegments, segment))) continue;
      const filename = path.resolve(root, row.path);
      await validateStorePath(target.root!, path.relative(target.root!, filename));
      const metadata = inspect(row.text);
      if (metadata.fields.schema !== undefined) {
        const kind = within(requiredPath(env.tickets), filename) ? "ticket" : "initiative";
        const errors = validateRecord(metadata.fields, kind, { allowLegacy: true });
        if (errors.length) throw new Error(`${reference(target, filename)}: ${errors.join("; ")}`);
      }
      documents.set(filename, { path: filename, root: target.root!, ref: reference(target, filename), store: target.store, text: row.text, ...metadata });
    }
  }
  return [...documents.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function mq<T>(query: string, input: string, args: Record<string, unknown> = {}, readRoot?: string, useHelper = true): T {
  const flags = ["x", "--", "mq", "--allow-http-import", "--no-lockfile", "-I", useHelper ? "raw" : "null", "-F", "json"];
  if (readRoot) flags.push(`--allow-read=${readRoot}`);
  for (const [name, value] of Object.entries(args)) flags.push("--argjson", name, JSON.stringify(value));
  if (useHelper) flags.push("--from-file", helper);
  else flags.push(`import "github.com/harehare/okf.mq" | ${query}`);
  return JSON.parse(execFileSync("mise", flags, { input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
}

function inspect(text: string): { fields: Record<string, unknown>; links: Link[] } { return mq("", text, { operation: "inspect" }); }
function stamp(document: Document, schema: string, removed: string[]): string {
  const defaults: Record<string, string> = {};
  if (schema === TICKET_SCHEMA) {
    if (document.fields.work_status === undefined) defaults.work_status = "unclaimed";
    if (document.fields.blocked_by === undefined) defaults.blocked_by = "[]";
  }
  return mq("", document.text, { operation: "stamp", schema, defaults, removed });
}
function membership(text: string, links: { text: string; url: string }[]): string {
  return mq("", text, { operation: "membership", entries: links });
}
function rewriteLinks(text: string, links: Link[], oldPath: string, newPath: string, moves: Map<string, string>): string {
  const replacements: { before: string; after: string; start: Position; end: Position }[] = [];
  for (const link of links) {
    const target = linkPath(oldPath, link.url);
    if (!target || (oldPath === newPath && !moves.has(target))) continue;
    const suffix = link.url.match(/[?#].*$/)?.[0] ?? "";
    const next = relativeLink(newPath, moves.get(target) ?? target) + suffix;
    if (next !== link.url) replacements.push({ before: link.url, after: next, ...link.node.position });
  }
  replacements.sort((a, b) => b.start.line - a.start.line || b.start.column - a.start.column);
  return replacements.length ? mq("", text, { operation: "replace", replacements }) : text;
}
function linkPath(filename: string, url: string): string | undefined {
  if (url.startsWith("file:")) return fileURLToPath(new URL(url));
  if (!url || url.startsWith("#") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url) || url.startsWith("//")) return;
  try { return path.resolve(path.dirname(filename), decodeURIComponent(url.split(/[?#]/, 1)[0]!)); } catch { throw new Error("Tracker link has invalid URL encoding"); }
}
function relativeLink(from: string, to: string): string {
  return path.relative(path.dirname(from), to).split(path.sep).map((segment) => encodeURIComponent(segment).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");
}
function reference(target: ResolvedRecord, filename: string): string { return `${target.store === "shared" ? "shared://" : ""}${path.relative(target.root!, filename).split(path.sep).join("/")}`; }
function requiredPath(target: ResolvedRecord): string { if (!target.path || !target.root) throw new Error("A resolved file-backed record is required"); return target.path; }
function change(source: Document, target: ResolvedRecord, destination: string, after: string): Change {
  return { oldPath: source.path, newPath: destination, oldRef: source.ref, newRef: reference(target, destination), oldRoot: source.root, newRoot: target.root!, before: source.text, after, beforeHash: hash(source.text), afterHash: hash(after) };
}
function recordForDocument(env: Environment, document: Document): ResolvedRecord { return [env.tickets, env.initiatives, env.tracker].find((target) => target.root === document.root && within(requiredPath(target), document.path))!; }
function hash(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function within(root: string, target: string): boolean { const relative = path.relative(root, target); return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)); }
async function exists(filename: string): Promise<boolean> { try { await fs.lstat(filename); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; } }
async function realAncestor(filename: string): Promise<string> { try { return await fs.realpath(filename); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; return path.join(await realAncestor(path.dirname(filename)), path.basename(filename)); } }
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function git(root: string, args: string[]): string | null { const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" }); return result.status === 0 ? result.stdout.trim() : null; }
function gitSnapshot(root: string, filename: string): { commit: string | null; blob: string | null } {
  const gitRoot = git(root, ["rev-parse", "--show-toplevel"]);
  return { commit: git(root, ["rev-parse", "HEAD"]), blob: gitRoot ? git(root, ["rev-parse", `HEAD:${path.relative(gitRoot, filename).split(path.sep).join("/")}`]) : null };
}

function validatePlanShape(plan: MigrationPlan): void {
  if (!plan || plan.schema !== "tracker-migration-plan/v1" || !/^[a-f0-9]{24}$/.test(plan.id) || !["ticket", "spec-ticket", "initiative-spec"].includes(plan.selector?.kind) || !Array.isArray(plan.changes) || plan.changes.length === 0 || !Array.isArray(plan.inputs)) throw new Error("Unsupported or malformed migration plan");
  for (const entry of plan.changes) if (hash(entry.before) !== entry.beforeHash || hash(entry.after) !== entry.afterHash) throw new Error("Migration snapshot bytes do not match their hashes");
  for (const input of plan.inputs) if (hash(input.text) !== input.hash) throw new Error("Migration input snapshot does not match its hash");
}
async function validatePlanPaths(env: Environment, plan: MigrationPlan): Promise<void> {
  if (plan.repository !== env.context.repositoryRoot || plan.origin !== env.context.canonicalOrigin || plan.slug !== env.context.slug) throw new Error("Plan repository identity changed");
  const workflow = await resolveContextRecord(env.context, { kind: "workflow", id: `migration-${plan.id}` });
  const routes = { tickets: env.tickets, initiatives: env.initiatives, tracker: env.tracker, workflow };
  if (JSON.stringify(routes) !== JSON.stringify(plan.routes)) throw new Error("Plan roots or routes do not match fresh shared-context resolution");
  for (const suffix of ["artifacts/snapshots/migration-plan.json", "events", ".migration-writer.lock"]) {
    await validateStorePath(workflow.root!, path.relative(workflow.root!, path.join(requiredPath(workflow), suffix)));
  }
  for (const entry of plan.changes) {
    for (const [filename, root] of [[entry.oldPath, entry.oldRoot], [entry.newPath, entry.newRoot]]) {
      if (!Object.values(routes).some((target) => target.root === root && target.kind !== "workflow" && within(requiredPath(target), filename!))) throw new Error("Plan path escapes resolved tracker collections");
      if (path.relative(root!, filename!).split(path.sep).some((segment) => Object.hasOwn(excludedSegments, segment))) throw new Error("Plan attempts to rewrite immutable history");
      await validateStorePath(root!, path.relative(root!, filename!));
    }
  }
  const { id, ...core } = plan;
  const placeholder = await resolveContextRecord(env.context, { kind: "workflow", id: "migration-plan" });
  if (hash(JSON.stringify({ ...core, routes: { ...core.routes, workflow: placeholder } })).slice(0, 24) !== id) throw new Error("Migration plan content does not match its immutable id");
}
async function validateStaged(options: Options, plan: MigrationPlan): Promise<void> {
  const env = await environment(options);
  const documents = await discover(env);
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), "tracker-migration-stage-"));
  const stagedPath = (filename: string) => path.join(stage, filename.replace(/^[/\\]+/, ""));
  const stagedRepository = stagedPath(env.context.repositoryRoot);
  const sharedBase = path.dirname(env.context.candidateSharedRoot!);
  try {
    await fs.mkdir(stagedRepository, { recursive: true });
    execFileSync("git", ["init", "--quiet", stagedRepository]);
    execFileSync("git", ["-C", stagedRepository, "remote", "add", "origin", env.context.origin]);
    const configuration = [
      path.join(env.context.alignmentRoot, "docs/agents/context-layout.toml"),
      path.join(env.context.alignmentRoot, "docs/agents/issue-tracker.md"),
      path.join(env.context.candidateSharedRoot!, ".context-routes.toml"),
      path.join(env.context.candidateSharedRoot!, ".storage"),
    ];
    for (const filename of configuration) {
      if (!await exists(filename)) continue;
      const destination = stagedPath(filename);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      const text = filename.endsWith(".md") ? mq<string>("read_file(filename)", "", { filename }, path.dirname(filename), false) : await fs.readFile(filename, "utf8");
      await fs.writeFile(destination, text);
    }
    for (const document of documents) {
      const entry = plan.changes.find((candidate) => candidate.oldPath === document.path);
      const destination = stagedPath(entry?.newPath ?? document.path);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, entry?.after ?? document.text);
    }
    await checkRecord({ repository: stagedRepository, sharedContextBase: stagedPath(sharedBase) }, plan.selector.kind === "ticket" ? "ticket" : "initiative", plan.selector.id);
  } finally {
    await fs.rm(stage, { recursive: true, force: true });
  }
}
async function guardChange(entry: Change): Promise<void> {
  if (hash(await fs.readFile(entry.oldPath)) !== entry.beforeHash) throw new Error("Source changed during apply");
  if (entry.newPath !== entry.oldPath && await exists(entry.newPath)) throw new Error("Destination appeared during apply");
}
async function durableWrite(filename: string, content: string, exclusive = false): Promise<void> {
  const file = await fs.open(filename, exclusive ? "wx" : "w");
  try { await file.writeFile(content); await file.sync(); } finally { await file.close(); }
  const parent = await fs.open(path.dirname(filename), "r");
  try { await parent.sync(); } finally { await parent.close(); }
}
async function installChange(entry: Change): Promise<void> {
  const staged = `${entry.newPath}.migration-${entry.afterHash.slice(0, 12)}.tmp`;
  await durableWrite(staged, entry.after, true);
  try {
    await guardChange(entry);
    if (entry.oldPath === entry.newPath) await fs.rename(staged, entry.newPath);
    else {
      await fs.link(staged, entry.newPath);
      try { await fs.unlink(entry.oldPath); } catch (error) { await fs.unlink(entry.newPath); throw error; }
    }
  } finally { if (await exists(staged)) await fs.unlink(staged); }
}
async function restoreChange(entry: Change): Promise<void> {
  if (hash(await fs.readFile(entry.newPath)) !== entry.afterHash) throw new Error("Rollback refused: a writer changed the migrated file");
  if (entry.oldPath !== entry.newPath) {
    if (await exists(entry.oldPath)) throw new Error("Rollback refused: original path was recreated");
    await durableWrite(entry.oldPath, entry.before, true);
    await fs.unlink(entry.newPath);
  } else {
    const staged = `${entry.oldPath}.rollback-${entry.beforeHash.slice(0, 12)}.tmp`;
    await durableWrite(staged, entry.before, true);
    await fs.rename(staged, entry.oldPath);
  }
}
async function appendState(directory: string, plan: MigrationPlan, state: State["state"], error?: string, recovery?: string[]): Promise<void> {
  const latest = await latestState(directory);
  const sequence = (latest?.sequence ?? 0) + 1;
  const event: State = { schema: "tracker-migration/v1", migration: plan.id, sequence, previousHash: latest ? hash(JSON.stringify(latest)) : null, state, planHash: hash(JSON.stringify(plan)), at: new Date().toISOString(), ...(error ? { error } : {}), ...(recovery ? { recovery } : {}) };
  const events = path.join(directory, "events");
  await fs.mkdir(events, { recursive: true });
  await durableWrite(path.join(events, `${String(sequence).padStart(6, "0")}-migration.json`), JSON.stringify(event, null, 2) + "\n", true);
}
async function latestState(directory: string): Promise<State | undefined> {
  const events = path.join(directory, "events");
  if (!await exists(events)) return;
  const files = (await fs.readdir(events)).filter((name) => /^\d{6}-migration\.json$/.test(name)).sort();
  let previous = 0;
  let latest: State | undefined;
  for (const filename of files) {
    const state = JSON.parse(await fs.readFile(path.join(events, filename), "utf8")) as State;
    if (state.schema !== "tracker-migration/v1" || !["applying", "applied", "rolled-back", "recovery-required"].includes(state.state) || state.sequence !== previous + 1 || state.sequence !== Number(filename.slice(0, 6)) || state.previousHash !== (latest ? hash(JSON.stringify(latest)) : null) || (latest && (latest.state !== "applying" || state.state === "applying" || state.migration !== latest.migration || state.planHash !== latest.planHash)) || (!latest && state.state !== "applying")) throw new Error("Migration event history is corrupt or uses an unsupported schema");
    previous = state.sequence;
    latest = state;
  }
  return latest;
}
async function checkContents(options: Options, plan: MigrationPlan): Promise<Record<string, unknown>> {
  const env = await environment(options);
  const documents = await discover(env);
  const expectedPaths = new Set(plan.inputs.map((input) => plan.changes.find((entry) => entry.oldPath === input.path)?.newPath ?? input.path));
  if (documents.length !== expectedPaths.size || documents.some((document) => !expectedPaths.has(document.path))) throw new Error("Tracker collection membership changed since the approved migration");
  for (const entry of plan.changes) {
    const document = documents.find((item) => item.path === entry.newPath);
    if (!document || hash(document.text) !== entry.afterHash) throw new Error("Migrated content differs from its immutable after snapshot");
    if (entry.oldPath !== entry.newPath && await exists(entry.oldPath)) throw new Error("Moved legacy source still exists");
  }
  for (const input of plan.inputs) {
    if (plan.changes.some((entry) => entry.oldPath === input.path)) continue;
    const document = documents.find((item) => item.path === input.path);
    if (!document || hash(document.text) !== input.hash) throw new Error("Unaffected tracker input changed since migration");
  }
  const kind = plan.selector.kind === "ticket" ? "ticket" : "initiative";
  const checked = await checkRecord(options, kind, plan.selector.id);
  return { initiatives: checked.initiatives, tickets: checked.tickets, contentVerified: true, membershipVerified: true, dependencyGraph: checked.graph, graphScope: checked.graphScope, normalTrackerDiscovery: checked.normalTrackerDiscovery, discovery: "Normal shared-context collections, markdownGraph and tracker explorer" };
}
async function publicationStatus(plan: MigrationPlan, directory: string): Promise<{ root: string; status: string; required: string }[]> {
  const roots = [...new Set([...plan.changes.flatMap((entry) => [entry.oldRoot, entry.newRoot]), plan.routes.workflow.root!])];
  return roots.map((root) => {
    const gitRoot = git(root, ["rev-parse", "--show-toplevel"]);
    if (!gitRoot) return { root, status: "local-only", required: "No Git repository; local durable record only" };
    const paths = [...new Set([...plan.changes.filter((entry) => entry.oldRoot === root).map((entry) => path.relative(root, entry.oldPath)), ...plan.changes.filter((entry) => entry.newRoot === root).map((entry) => path.relative(root, entry.newPath)), ...(within(root, directory) ? [path.relative(root, directory)] : [])])];
    const status = git(root, ["status", "--porcelain", "--untracked-files=all", "--", ...paths]);
    if (status === null || status) return { root, status: "uncommitted", required: "Commit all migrated paths and migration workflow, then push; further work is blocked" };
    const requiredFiles = [...plan.changes.filter((entry) => entry.newRoot === root).map((entry) => path.relative(root, entry.newPath)), ...(within(root, directory) ? [path.relative(root, path.join(directory, "artifacts/snapshots/migration-plan.json"))] : [])];
    // Git reports its physical root even when the shared store uses a symlink.
    const physicalGitRoot = realpathSync(gitRoot);
    const physicalRoot = realpathSync(root);
    if (requiredFiles.some((filename) => git(root, ["cat-file", "-e", `HEAD:${path.relative(physicalGitRoot, path.resolve(physicalRoot, filename)).split(path.sep).join("/")}`]) === null)) return { root, status: "uncommitted", required: "Migration files are not all committed (including ignored files); commit and publish before further work" };
    const branch = git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
    const remote = branch ? git(root, ["config", "--get", `branch.${branch}.remote`]) : null;
    const mergeRef = branch ? git(root, ["config", "--get", `branch.${branch}.merge`]) : null;
    if (!remote || remote === "." || !mergeRef) return { root, status: "committed", required: "Configure a remote upstream and push; remote publication has not been observed" };
    const observed = spawnSync("git", ["-C", root, "ls-remote", "--exit-code", remote, mergeRef], { encoding: "utf8", timeout: 15_000 });
    const remoteCommit = observed.status === 0 ? observed.stdout.trim().split(/\s+/)[0] : undefined;
    const head = git(root, ["rev-parse", "HEAD"]);
    if (!remoteCommit || !/^[a-f0-9]{40,64}$/.test(remoteCommit)) return { root, status: "committed", required: "Remote branch could not be observed with ls-remote; publication is unverified. Check remote access, publish, then repeat migration check" };
    if (head === remoteCommit || git(root, ["merge-base", "--is-ancestor", "HEAD", remoteCommit]) !== null) return { root, status: "published", required: `None; ls-remote observed ${remoteCommit} at ${remote}/${mergeRef}, which includes local HEAD. No fetch or push performed` };
    return { root, status: "committed", required: `Observed remote ${remote}/${mergeRef} at ${remoteCommit}; inclusion of local HEAD cannot be verified from available local objects. Publish or obtain the remote history explicitly, then repeat migration check` };
  });
}
async function blockIncompleteMigrations(env: Environment, current: string): Promise<void> {
  const sample = await resolveContextRecord(env.context, { kind: "workflow", id: `migration-${current}` });
  const workflows = path.dirname(requiredPath(sample));
  if (!await exists(workflows)) return;
  for (const entry of await fs.readdir(workflows, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^migration-[a-f0-9]{24}$/.test(entry.name) || entry.name === `migration-${current}`) continue;
    const directory = path.join(workflows, entry.name);
    const snapshot = path.join(directory, "artifacts/snapshots/migration-plan.json");
    if (!await exists(snapshot)) continue;
    const previous = JSON.parse(await fs.readFile(snapshot, "utf8")) as MigrationPlan;
    validatePlanShape(previous);
    await validatePlanPaths(env, previous);
    const state = await latestState(directory);
    if (state?.state !== "applied" || (await publicationStatus(previous, directory)).some((item) => item.status !== "published" && item.status !== "local-only")) throw new Error("An earlier migration has incomplete recovery or publication; check and publish it before further migration work");
  }
}
