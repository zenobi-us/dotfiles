import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { recordKind } from "./model";
import type { ExplorerAction, ExplorerActionChoice, ExplorerSessionRequest, ExplorerSnapshot, ExplorerTarget, TicketWorkflow } from "./model";

import { recoveryDecision, type WorktreeAction } from "../../../developer/skills/git/worktree/scripts/recovery";

const initiativeActions: readonly ExplorerActionChoice[] = [
  { action: "ask-matt", key: "m", label: "Ask Matt" },
  { action: "to-tickets", key: "t", label: "To tickets" },
  { action: "grill", key: "g", label: "Grill" },
];
const ticketActions: readonly ExplorerActionChoice[] = [
  { action: "ask-matt", key: "m", label: "Ask Matt" },
  { action: "start", key: "s", label: "Start worktree" },
  { action: "review", key: "r", label: "Review" },
  { action: "fix", key: "x", label: "Fix" },
  { action: "finish", key: "f", label: "Finish" },
  { action: "submit", key: "u", label: "Submit" },
];
const prototypeActions: readonly ExplorerActionChoice[] = [
  { action: "ask-matt", key: "m", label: "Ask Matt" },
  { action: "prototype", key: "p", label: "Prototype" },
];

export function actionChoices(
  target: ExplorerTarget,
  snapshot: ExplorerSnapshot,
  workflow: TicketWorkflow | undefined,
  commands: readonly { name: string }[],
): ExplorerActionChoice[] {
  const available = new Set(commands.map(command => command.name));
  const kind = target.kind === "ticket" ? recordKind(target.ticket) : "planning";
  const isPrototype = target.kind === "ticket" && target.ticket.documentType?.trim().toLowerCase() === "prototype";
  const actions = isPrototype ? prototypeActions : kind === "ticket" ? ticketActions : kind === "record" ? initiativeActions.slice(0, 1) : initiativeActions;
  const decision = target.kind === "ticket" && kind === "ticket" ? recoveryDecision(target.ticket, snapshot, workflow) : undefined;
  return actions.map(choice => {
    const skill = skillName(choice.action);
    const disabledReason = target.kind === "initiative" && target.initiative.group
      ? "This is a ticket collection, not a planning initiative. Select a ticket."
      : !available.has(`skill:${skill}`)
        ? `Required skill:${skill} command is unavailable.`
        : target.kind === "ticket" && kind === "ticket" && choice.action !== "ask-matt"
          ? choice.action === decision?.action || isWorktreeAction(choice.action) && decision?.alternatives?.includes(choice.action)
            ? undefined
            : decision?.action ? `Next: ${decision.label}. ${decision.reason}` : decision?.reason
          : undefined;
    return { ...choice, ...(choice.action === decision?.action ? { label: decision.label } : {}), ...(disabledReason ? { disabledReason } : {}) };
  });
}

/** Pass the canonical selector and optional user request; skills read current records and workflow state. */
export function buildSessionPrompt(request: ExplorerSessionRequest): string {
  const { target, action } = request;
  const record = target.kind === "ticket" ? target.ticket : target.initiative;
  if (action === "ask-matt" && !request.prompt.trim()) throw new Error("Ask Matt requires a typed prompt.");
  const command = `/skill:${skillName(action)} ${isWorktreeAction(action) ? `${action} ` : ""}${quoteData(record.ref)}`;
  return request.prompt.trim() ? `${command}\n\nUser request: ${quoteData(request.prompt)}` : command;
}

/** The caller waits for idle, then revalidates the confirmed inputs before opening the session. */
export async function launchExplorerSession(pi: ExtensionAPI, ctx: ExtensionCommandContext, request: ExplorerSessionRequest): Promise<boolean> {
  const choice = actionChoices(request.target, request.snapshot, request.workflow, pi.getCommands()).find(item => item.action === request.action);
  if (!choice) throw new Error("This action is not available for the selected target.");
  if (choice.disabledReason) throw new Error(choice.disabledReason);
  const message = buildSessionPrompt(request);
  const parentSession = ctx.sessionManager.getSessionFile();
  let opened = false;
  try {
    const result = await ctx.newSession({
      parentSession,
      withSession: async next => {
        opened = true;
        await next.sendUserMessage(message);
      },
    });
    if (result.cancelled) return false;
    // Pi replaces the API through withSession; OMP keeps it live and ignores that callback.
    if (!opened) {
      opened = true;
      pi.sendUserMessage(message);
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${opened ? "New session opened, but prompt delivery failed" : "Could not open a new session"}: ${message}`, { cause: error });
  }
}

function skillName(action: ExplorerAction): string {
  if (action === "grill") return "grill-with-docs";
  return isWorktreeAction(action) ? "worktree" : action;
}

function isWorktreeAction(action: ExplorerAction): action is WorktreeAction {
  return ["start", "review", "fix", "finish", "submit"].includes(action);
}

function quoteData(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026").replace(/[\u007f-\u009f\u202a-\u202e\u2066-\u2069\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}



