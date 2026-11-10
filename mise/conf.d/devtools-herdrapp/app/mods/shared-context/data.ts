// Imports the canonical context, tracker, and recovery APIs. No shared-context CLI transport.
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { resolveSharedContext, resolveContextRecord, type Exec, type SharedAgentContext, type RecordKind } from "../../../../devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib";
export type CollectionKind = "alignment" | "tickets" | "initiatives" | "sources";
import { initializeContextForCwd } from "../../../../devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/api";
import { loadExplorerSnapshot, loadTicketWorkflow } from "../../../../devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow";
import { createInspectionExecutor } from "../../../../devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection-exec";
import { recoveryDecision } from "../../../../devtools-agent/bundles/developer/skills/git/worktree/scripts/recovery";
import { actionChoices, buildSessionPrompt } from "../../../../devtools-agent/bundles/agent-core/extensions/pi-shared-context/actions";
import { prepareSessionRequest } from "../../../../devtools-agent/bundles/agent-core/extensions/pi-shared-context/preparation";
import { recordKind, type ExplorerAction, type ExplorerSessionRequest } from "../../../../devtools-agent/bundles/agent-core/extensions/pi-shared-context/model";

export function executor(cwd: string): Exec {
  return async (command, args, directory = cwd) => {
    const child = Bun.spawn([command, ...args], { cwd: directory, env: process.env, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    return { stdout: code === 0 ? stdout : [stdout, stderr].filter(Boolean).join("\n"), code };
  };
}

export async function project(cwd: string): Promise<SharedAgentContext> {
  if (!path.isAbsolute(cwd)) throw new Error("Select an absolute repository folder.");
  const context = await resolveSharedContext(executor(cwd), cwd);
  if (!context) throw new Error("This folder has no Git origin. Select a repository with an origin remote.");
  if (context.error) throw new Error(context.error);
  return context;
}

export async function contextData(cwd: string) {
  const context = await project(cwd);
  const kinds: CollectionKind[] = ["alignment", "tickets", "initiatives", "sources"];
  const collections = await Promise.all(kinds.map(async kind => {
    if (kind === "tickets" && context.routes.tickets.adapter !== "local-markdown") return { id: kind, kind, label: "Tickets", adapter: context.routes.tickets.adapter, root: null, path: null, store: null };
    const record = await resolveContextRecord(context, { kind });
    return { ...record, id: kind, label: kind[0]!.toUpperCase() + kind.slice(1) };
  }));
  const missing = new Set<string>();
  for (const kind of Object.keys(context.routes) as RecordKind[]) {
    let route = context.routes[kind];
    while (route.inherits) route = context.routes[route.inherits];
    if (route.store === "shared" && context.candidateSharedRoot) {
      try { if (!(await fs.stat(context.candidateSharedRoot)).isDirectory()) missing.add(context.candidateSharedRoot); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") missing.add(context.candidateSharedRoot); else throw error; }
    }
  }
  for (const collection of collections) {
    if (!collection.root) continue;
    try { if (!(await fs.stat(collection.root)).isDirectory()) missing.add(collection.root); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") missing.add(collection.root); else throw error; }
  }
  return { identity: context.slug, repository: context.repositoryRoot, root: context.root, routeSource: context.routeSource, storage: context.storage, mode: context.mode, ready: Boolean(context.routeSource) && missing.size === 0, missing: [...missing], collections };
}

export async function setup(cwd: string, store: "repository" | "shared", preset?: string) {
  await initializeContextForCwd(executor(cwd), cwd, { store, ...(preset ? { preset } : {}) });
  return contextData(cwd);
}

async function collectionPath(cwd: string, kind: CollectionKind, relative: string) {
  const record = await resolveContextRecord(await project(cwd), { kind });
  if (!record.path) throw new Error("This collection belongs to an external tracker.");
  const root = await fs.realpath(record.path);
  const target = await fs.realpath(path.resolve(root, relative));
  const offset = path.relative(root, target);
  if (offset === ".." || offset.startsWith(`..${path.sep}`) || path.isAbsolute(offset)) throw new Error("The path leaves the resolved collection.");
  return { target, record };
}

export async function directory(cwd: string, kind: CollectionKind, relative: string) {
  let resolved;
  try { resolved = await collectionPath(cwd, kind, relative); }
  catch (error) {
    if (relative !== "" || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const record = await resolveContextRecord(await project(cwd), { kind });
    if (!record.root) throw error;
    await fs.access(record.root);
    return [];
  }
  const { target } = resolved;
  const entries = await fs.readdir(target, { withFileTypes: true });
  return entries.filter(entry => entry.name !== ".git" && !entry.isSymbolicLink()).sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name)).map(entry => ({ name: entry.name, directory: entry.isDirectory(), path: path.posix.join(relative, entry.name) }));
}

export async function file(cwd: string, kind: CollectionKind, relative: string) {
  const { target, record } = await collectionPath(cwd, kind, relative);
  if ((await fs.stat(target)).size > 400_000) throw new Error("This file exceeds the 400 KB preview limit.");
  const body = await fs.readFile(target, "utf8");
  if (body.includes("\0")) throw new Error("This file is binary. No text preview is available.");
  return { body, ref: `${record.ref}/${relative}`, path: target };
}

export async function tracker(cwd: string) {
  const context = await project(cwd), exec = executor(cwd);
  const snapshot = await loadExplorerSnapshot(context, exec);
  const inspectionExec = createInspectionExecutor(exec, context.repositoryRoot);
  const states: Record<string, { state: string; reason: string; next?: string }> = {};
  let cursor = 0;
  // Limit concurrent Git inspections. A large tracker must not start one process per ticket at once.
  await Promise.all(Array.from({ length: Math.min(4, snapshot.tickets.length) }, async () => {
    while (cursor < snapshot.tickets.length) {
      const ticket = snapshot.tickets[cursor++]!;
      if (recordKind(ticket) !== "ticket") { states[ticket.id] = { state: ticket.status, reason: "Recorded planning context." }; continue; }
      try {
        const workflow = await loadTicketWorkflow(context, ticket, inspectionExec);
        const decision = recoveryDecision(ticket, snapshot, workflow);
        const state = decision.mode === "complete" ? "DONE" : decision.action === "start" ? "READY" : decision.action?.toUpperCase() ?? (decision.mode === "observe" ? "ACTIVE" : "BLOCKED");
        states[ticket.id] = { state, reason: decision.reason, next: decision.label };
      } catch (error) { states[ticket.id] = { state: "ERROR", reason: message(error) }; }
    }
  }));
  return { ...snapshot, states, identity: context.slug, repository: context.repositoryRoot };
}

async function commands() {
  const agentRoot = process.env.PI_CODING_AGENT_DIR ?? path.join(os.homedir(), ".omp/agent");
  const roots = [path.join(agentRoot, "bundles"), path.join(agentRoot, "skills")];
  const found = new Set<string>(), visited = new Set<string>();
  async function walk(root: string, depth: number): Promise<void> {
    if (depth > 5) return;
    let entries;
    try {
      const real = await fs.realpath(root);
      if (visited.has(real) || !(await fs.stat(real)).isDirectory()) return;
      visited.add(real);
      entries = await fs.readdir(real, { withFileTypes: true });
    }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw error; }
    if (entries.some(entry => entry.name === "SKILL.md")) { found.add(`skill:${path.basename(root)}`); return; }
    for (const entry of entries) if ((entry.isDirectory() || entry.isSymbolicLink()) && !entry.name.startsWith(".") && entry.name !== "node_modules") await walk(path.join(root, entry.name), depth + 1);
  }
  for (const root of roots) await walk(root, 0);
  return [...found].map(name => ({ name }));
}

export async function detail(cwd: string, id: string, kind: "ticket" | "initiative" = "ticket") {
  const context = await project(cwd), exec = executor(cwd), snapshot = await loadExplorerSnapshot(context, exec);
  const record = kind === "initiative" ? snapshot.initiatives.find(item => item.id === id) : snapshot.tickets.find(item => item.id === id);
  if (!record) throw new Error("The selected record no longer exists. Refresh the tracker.");
  if ("group" in record && record.group) throw new Error("Select an initiative record, not a collection.");
  const ticket = kind === "ticket" ? snapshot.tickets.find(item => item.id === id)! : undefined;
  const target = ticket ? { kind: "ticket" as const, ticket } : { kind: "initiative" as const, initiative: snapshot.initiatives.find(item => item.id === id)! };
  const workflow = ticket && recordKind(ticket) === "ticket" ? await loadTicketWorkflow(context, ticket, exec) : undefined;
  return { record, kind, workflow, actions: actionChoices(target, snapshot, workflow, await commands()), repository: context.repositoryRoot };
}

export async function prepare(cwd: string, id: string, kind: "ticket" | "initiative", action: ExplorerAction, prompt: string, expectedKey?: string) {
  const context = await project(cwd), exec = executor(cwd), snapshot = await loadExplorerSnapshot(context, exec);
  const target = kind === "initiative"
    ? { kind: "initiative" as const, initiative: snapshot.initiatives.find(item => item.id === id)! }
    : { kind: "ticket" as const, ticket: snapshot.tickets.find(item => item.id === id)! };
  if (kind === "ticket" && !target.ticket || kind === "initiative" && !target.initiative) throw new Error("The selected record no longer exists.");
  if (target.kind === "initiative" && target.initiative.group) throw new Error("Select an initiative record, not a collection.");
  const request = { action, target, snapshot, prompt } as ExplorerSessionRequest;
  const prepared = await prepareSessionRequest(context, exec, request);
  const choice = actionChoices(prepared.request.target, prepared.request.snapshot, prepared.request.workflow, await commands()).find(item => item.action === action);
  if (!choice || choice.disabledReason) throw new Error(choice?.disabledReason ?? "This action is unavailable.");
  if (expectedKey && expectedKey !== prepared.key) throw new Error("Action inputs changed. Prepare and inspect the prompt again.");
  return { key: prepared.key, prompt: buildSessionPrompt(prepared.request), repository: context.repositoryRoot };
}

export function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
