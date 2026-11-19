// Action policy and skill handoffs shared by Herdr and the Pi explorer.
import { recordKind } from "../../../../../matt-pocock/skills/reading-and-writing-tickets/scripts/model";
import type { InitiativeRecord, TicketRecord, TrackerSnapshot } from "../../../../../matt-pocock/skills/reading-and-writing-tickets/scripts/model";
import type { TicketWorkflow } from "./model";
import { recoveryDecision, type WorktreeAction } from "./recovery";

export type SessionTarget =
  | { kind: "initiative"; initiative: InitiativeRecord }
  | { kind: "ticket"; ticket: TicketRecord };

export type SessionAction = "ask-matt" | "to-tickets" | "grill" | "prototype" | "start" | "review" | "fix" | "finish" | "submit";

export interface SessionActionChoice {
  action: SessionAction;
  key: "m" | "t" | "g" | "p" | "s" | "r" | "x" | "f" | "u";
  label: string;
  disabledReason?: string;
}

export interface SessionRequest {
  action: SessionAction;
  target: SessionTarget;
  snapshot: TrackerSnapshot;
  workflow?: TicketWorkflow;
  prompt: string;
}

const initiativeActions: readonly SessionActionChoice[] = [
  { action: "ask-matt", key: "m", label: "Ask Matt" },
  { action: "to-tickets", key: "t", label: "To tickets" },
  { action: "grill", key: "g", label: "Grill" },
];
const ticketActions: readonly SessionActionChoice[] = [
  { action: "ask-matt", key: "m", label: "Ask Matt" },
  { action: "start", key: "s", label: "Start worktree" },
  { action: "review", key: "r", label: "Review" },
  { action: "fix", key: "x", label: "Fix" },
  { action: "finish", key: "f", label: "Finish" },
  { action: "submit", key: "u", label: "Submit" },
];
const prototypeActions: readonly SessionActionChoice[] = [
  { action: "ask-matt", key: "m", label: "Ask Matt" },
  { action: "prototype", key: "p", label: "Prototype" },
];

export function actionChoices(
  target: SessionTarget,
  snapshot: TrackerSnapshot,
  workflow: TicketWorkflow | undefined,
  commands: readonly { name: string }[],
): SessionActionChoice[] {
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
export function buildSessionPrompt(request: SessionRequest): string {
  const { target, action } = request;
  const record = target.kind === "ticket" ? target.ticket : target.initiative;
  if (action === "ask-matt" && !request.prompt.trim()) throw new Error("Ask Matt requires a typed prompt.");
  const command = `/skill:${skillName(action)} ${isWorktreeAction(action) ? `${action} ` : ""}${quoteData(record.ref)}`;
  return request.prompt.trim() ? `${command}\n\nUser request: ${quoteData(request.prompt)}` : command;
}

function skillName(action: SessionAction): string {
  if (action === "grill") return "grill-with-docs";
  return isWorktreeAction(action) ? "worktree" : action;
}

function isWorktreeAction(action: SessionAction): action is WorktreeAction {
  return ["start", "review", "fix", "finish", "submit"].includes(action);
}

function quoteData(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026").replace(/[\u007f-\u009f\u202a-\u202e\u2066-\u2069\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
