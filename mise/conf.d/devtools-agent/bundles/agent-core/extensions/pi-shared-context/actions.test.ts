import { describe, expect, test } from "bun:test";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { launchExplorerSession } from "./actions";
import type { SessionAction, SessionRequest, SessionTarget } from "../../../developer/skills/git/worktree/scripts/session-actions";
import type { WorkflowReceipt, TicketWorkflow } from "../../../developer/skills/git/worktree/scripts/model";
import type { TrackerSnapshot } from "../../../matt-pocock/skills/reading-and-writing-tickets/scripts/model";

type SessionOptions = NonNullable<Parameters<ExtensionCommandContext["newSession"]>[0]>;
type SessionContext = Parameters<NonNullable<SessionOptions["withSession"]>>[0];

const ticket = { id: "42", title: "Graph continuity", ref: "https://github.com/owner/repo/issues/42", backend: "github", status: "open", blockedBy: [] as string[], body: "Private tracker details." };
const target: SessionTarget = { kind: "ticket", ticket };
const snapshot: TrackerSnapshot = { tickets: [ticket], initiatives: [], backend: "github" };
const commands = ["worktree", "ask-matt", "to-tickets", "grill-with-docs"].map(name => ({ name: `skill:${name}` }));

function workflow(receipts: WorkflowReceipt[], overrides: Partial<TicketWorkflow> = {}): TicketWorkflow {
  return {
    ticketId: ticket.id, receipts, sourceCommit: "commit-a", sourceTree: "tree-a",
    inspection: {
      historyValid: !overrides.error,
      source: { state: "available", branch: "feature/GH-42", dirty: false },
      ownership: "unknown", worktrees: [], commits: [],
      artifacts: receipts.filter(receipt => receipt.phase === "review" && receipt.verdict).map(receipt => ({
        receiptId: receipt.id, ref: `reviews/${receipt.id}.md`, state: "readable", matchesSource: true,
      })),
    },
    ...overrides,
  };
}

function request(action: SessionAction, state = workflow([])): SessionRequest {
  return { action, target, snapshot, workflow: state, prompt: "Assess the remaining design questions." };
}

test("prototype launches reject removed commands and changed record types", async () => {
  let opened = 0;
  const ctx = {
    waitForIdle: async () => { },
    sessionManager: { getSessionFile: () => undefined },
    newSession: async () => { opened++; return { cancelled: false }; },
  } as unknown as ExtensionCommandContext;
  for (const current of [
    { documentType: "prototype", commands },
    { documentType: "task", commands: [...commands, { name: "skill:prototype" }] },
  ]) {
    const selected: SessionTarget = { kind: "ticket", ticket: { ...ticket, documentType: current.documentType } };
    const pi = { getCommands: () => current.commands, sendUserMessage: () => { } } as unknown as ExtensionAPI;
    await expect(launchExplorerSession(pi, ctx, {
      action: "prototype", target: selected, snapshot: { ...snapshot, tickets: [selected.ticket] }, prompt: "",
    })).rejects.toThrow();
  }
  expect(opened).toBe(0);
});

describe("fresh-session boundaries", () => {
  for (const host of ["omp", "pi"] as const) {
    test(`${host} delivers the confirmed prompt once, only in the fresh session`, async () => {
      let activeSession = "parent";
      const messages: { session: string; text: string }[] = [];
      const deliver = (text: string) => { messages.push({ session: activeSession, text }); };
      const ctx = {
        waitForIdle: async () => { },
        sessionManager: { getSessionFile: () => "/sessions/parent.jsonl" },
        newSession: async (options: SessionOptions) => {
          activeSession = "new";
          if (host === "pi") {
            await options.withSession?.({
              sendUserMessage: async (text: string) => { deliver(text); },
            } as unknown as SessionContext);
          }
          return { cancelled: false };
        },
      } as unknown as ExtensionCommandContext;
      const pi = {
        getCommands: () => commands,
        sendUserMessage: (text: string) => {
          if (host === "pi") throw new Error("The original Pi API is stale after replacement.");
          deliver(text);
        },
      } as unknown as ExtensionAPI;
      expect(await launchExplorerSession(pi, ctx, request("start"))).toBe(true);
      expect(messages).toEqual([{
        session: "new",
        text: expect.stringContaining('/skill:worktree start'),
      }]);
      expect(messages[0].text).toContain(ticket.ref);
      expect(messages[0].text).toContain("Assess the remaining design questions.");
    });
  }

  test("session creation and delivery failures retain the underlying cause", async () => {
    const cause = new Error("Host operation failed");
    const ctx = {
      waitForIdle: async () => { },
      sessionManager: { getSessionFile: () => "/sessions/parent.jsonl" },
      newSession: async () => ({ cancelled: false }),
    } as unknown as ExtensionCommandContext;
    const pi = {
      getCommands: () => commands,
      sendUserMessage: () => { throw cause; },
    } as unknown as ExtensionAPI;
    await expect(launchExplorerSession(pi, ctx, request("start"))).rejects.toMatchObject({
      cause,
    });
    ctx.newSession = async () => { throw cause; };
    await expect(launchExplorerSession(pi, ctx, request("start"))).rejects.toMatchObject({
      cause,
    });
  });

  test("cancelling session creation preserves the old editor draft", async () => {
    let editor = "unsent user draft";
    const ctx = {
      waitForIdle: async () => { }, sessionManager: { getSessionFile: () => "/sessions/parent.jsonl" },
      ui: { setEditorText: (text: string) => { editor = text; } }, newSession: async () => ({ cancelled: true }),
    } as unknown as ExtensionCommandContext;
    const pi = {
      getCommands: () => commands,
      sendUserMessage: () => { throw new Error("Cancellation must not submit a prompt."); },
    } as unknown as ExtensionAPI;
    expect(await launchExplorerSession(pi, ctx, request("start"))).toBe(false);
    expect(editor).toBe("unsent user draft");
  });
});
