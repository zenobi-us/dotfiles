// Revalidate action inputs independently of the explorer's last displayed snapshot.
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";
import { loadExplorerAdrs, loadExplorerSnapshot, loadTicketWorkflow } from "../../../developer/skills/git/worktree/scripts/workflow";
import type { Exec, ExplorerSessionRequest, ExplorerSnapshot, SharedAgentContext } from "./model";

export interface PreparedSessionRequest {
  request: ExplorerSessionRequest;
  key: string;
}

/** Re-read routes, record content, blockers and (only for transitions) live workflow observations. */
export async function prepareSessionRequest(context: SharedAgentContext, exec: Exec, request: ExplorerSessionRequest): Promise<PreparedSessionRequest> {
  const current = await resolveSharedContext(exec, context.repositoryRoot, context.candidateSharedRoot ? dirname(context.candidateSharedRoot) : undefined);
  if (!current || current.error) throw new Error(current?.error ?? "The selected project context is unavailable.");
  if (current.slug !== context.slug || current.canonicalOrigin !== context.canonicalOrigin) throw new Error("The selected project identity changed. Reload the explorer.");
  if (current.checkoutAvailable === false) throw new Error("No usable checkout. Open this project from a checkout to run actions.");
  let refreshed: ExplorerSessionRequest;
  if (request.target.kind === "ticket" && request.target.ticket.documentType?.toLowerCase() === "adr") {
    const previous = request.target.ticket;
    const ticket = (await loadExplorerAdrs(current, exec)).find(item => item.id === previous.id && item.ref === previous.ref);
    if (!ticket) throw new Error("The selected ADR changed or disappeared. Reload the explorer.");
    refreshed = { ...request, target: { kind: "ticket", ticket }, snapshot: { backend: "local-markdown", initiatives: [], tickets: [ticket] }, workflow: undefined };
  } else {
    const record = request.target.kind === "ticket" ? request.target.ticket : request.target.initiative;
    const snapshot = await loadExplorerSnapshot(current, exec, { ref: record.ref, kind: request.target.kind });
    if (request.target.kind === "ticket") {
      const previous = request.target.ticket;
      const ticket = snapshot.tickets.find(item => item.id === previous.id && item.ref === previous.ref && item.backend === previous.backend);
      if (!ticket) throw new Error("The selected ticket changed or disappeared. Reload the explorer.");
      refreshed = {
        ...request, target: { kind: "ticket", ticket }, snapshot,
        workflow: ["start", "review", "fix", "finish", "submit"].includes(request.action) ? await loadTicketWorkflow(current, ticket, exec) : undefined,
      };
      if (refreshed.workflow) {
        const verifiedSnapshot = await loadExplorerSnapshot(current, exec, { ref: ticket.ref, kind: "ticket" });
        const verifiedTicket = verifiedSnapshot.tickets.find(item => item.id === ticket.id && item.ref === ticket.ref && item.backend === ticket.backend);
        if (!verifiedTicket || sessionRequestKey(current, refreshed) !== sessionRequestKey(current, {
          ...refreshed, snapshot: verifiedSnapshot, target: { kind: "ticket", ticket: verifiedTicket },
        })) throw new Error("Action records changed during workflow inspection. Select the action again.");
      }
    } else {
      const previous = request.target.initiative;
      const initiative = snapshot.initiatives.find(item => item.id === previous.id && item.ref === previous.ref && !item.group);
      if (!initiative) throw new Error("The selected initiative changed or disappeared. Reload the explorer.");
      refreshed = { ...request, target: { kind: "initiative", initiative }, snapshot, workflow: undefined };
    }
  }
  const verifiedContext = await resolveSharedContext(exec, context.repositoryRoot, context.candidateSharedRoot ? dirname(context.candidateSharedRoot) : undefined);
  const key = sessionRequestKey(current, refreshed);
  if (!verifiedContext || verifiedContext.error || sessionRequestKey(verifiedContext, refreshed) !== key) throw new Error("Project routes changed while preparing the action. Reload the explorer.");
  return { request: refreshed, key };
}

/** Bind confirmation to current records and observations; the handoff itself contains only the selector and user request. */
export function sessionRequestKey(context: SharedAgentContext, request: ExplorerSessionRequest): string {
  const roots = request.target.kind === "ticket" ? [request.target.ticket.id] : request.target.initiative.ticketIds;
  const inputs = relatedTickets(request.snapshot, roots);
  return createHash("sha256").update(JSON.stringify(canonical({
    version: 1,
    context: {
      repositoryRoot: context.repositoryRoot, canonicalOrigin: context.canonicalOrigin, slug: context.slug,
      candidateSharedRoot: context.candidateSharedRoot, alignmentRoot: context.alignmentRoot,
      routes: context.routes, layout: context.layout, checkoutAvailable: context.checkoutAvailable,
    },
    action: request.action, prompt: request.prompt, target: request.target,
    backend: request.snapshot.backend, tickets: inputs,
    workflow: ["start", "review", "fix", "finish", "submit"].includes(request.action) ? request.workflow : undefined,
  }))).digest("hex");
}
/** Reconfirm changed inputs instead of sending a prompt approved for an older state. */
export async function confirmSessionRequest(
  read: () => Promise<PreparedSessionRequest>,
  confirm: (prepared: PreparedSessionRequest) => Promise<boolean>,
  waitForIdle: () => Promise<void>,
  changed: () => void,
): Promise<ExplorerSessionRequest | undefined> {
  let prepared = await read();
  while (await confirm(prepared)) {
    await waitForIdle();
    const current = await read();
    if (current.key === prepared.key) return current.request;
    changed();
    prepared = current;
  }
  return undefined;
}

function relatedTickets(snapshot: ExplorerSnapshot, roots: string[]): unknown[] {
  const records = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const selected = new Set<string>();
  const visit = (id: string): void => {
    if (selected.has(id)) return;
    selected.add(id);
    for (const blocker of records.get(id)?.blockedBy ?? []) visit(blocker);
  };
  for (const id of roots) visit(id);
  return [...selected].sort().map(id => records.get(id) ?? { id, missing: true });
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
