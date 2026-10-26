import { expect, test } from "bun:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import { GraphExplorer, focusedTicketIds, type ExplorerResult } from "./explorer";
import type { ExplorerReceipt, ExplorerSnapshot, SharedAgentContext, TicketWorkflow } from "./model";

const snapshot: ExplorerSnapshot = {
  backend: "local-markdown",
  initiatives: [{ id: "plan", title: "Graph continuity", ref: "tracker/initiatives/plan/index.md", ticketIds: ["T-2", "T-3", "T-4"], body: "" }],
  tickets: [
    { id: "T-1", title: "Routes", ref: "tracker/tickets/T-1.md", status: "completed", blockedBy: [], backend: "local-markdown", body: "" },
    { id: "T-2", title: "Graph", ref: "tracker/tickets/T-2.md", status: "open", blockedBy: ["T-1"], backend: "local-markdown", body: "" },
    { id: "T-3", title: "Receipts", ref: "tracker/tickets/T-3.md", status: "open", blockedBy: ["T-1"], backend: "local-markdown", body: "Receipt detail" },
    { id: "T-4", title: "Actions", ref: "tracker/tickets/T-4.md", status: "open", blockedBy: ["T-2", "T-3"], backend: "local-markdown", body: "" },
  ],
};
const context = {} as SharedAgentContext;
const theme = { fg: (_token: string, value: string) => value, bg: (_token: string, value: string) => value } as Theme;
const commands = () => [{ name: "skill:worktree" }, { name: "skill:ask-matt" }];
const receipt: ExplorerReceipt = {
  id: "implementation-1", ref: "workflows/T-3/events/implementation-1.md", workflowId: "T-3", phase: "implementation", status: "completed",
  sourceCommit: "a".repeat(40), sourceTree: "b".repeat(40), createdAt: "2026-10-20T12:00:00Z", workspacePath: "/worktrees/T-3",
  sourceBranch: "feature/T-3", baseBranch: "main", outputs: [], fields: {}, body: "",
};

async function fixture(data = snapshot, height = 40) {
  let result: ExplorerResult;
  const component = new GraphExplorer({
    context, theme, exec: async () => { throw new Error("Unexpected process execution"); },
    done: value => { result = value; }, requestRender: () => {}, height: () => height, commands,
    loadSnapshot: async () => data,
    loadWorkflow: async (_context, ticket): Promise<TicketWorkflow> => ({ ticketId: ticket.id, receipts: ticket.id === "T-3" ? [receipt] : [], sourceCommit: receipt.sourceCommit, sourceTree: receipt.sourceTree }),
  });
  await component.load();
  return { component, result: () => result };
}

test("a ticket and its receipt selection survive leaving and restoring parent columns", async () => {
  const { component, result } = await fixture();
  component.handleInput("\r");
  component.handleInput("\x1b[D");
  component.handleInput("\x1b[C");
  component.handleInput("\x1b[B");
  component.handleInput("\x1b[C");
  component.handleInput("\x1b[D");
  component.handleInput("\x1b[C");
  component.handleInput("m");
  const selected = result();
  expect(selected?.kind).toBe("session");
  if (selected?.kind !== "session" || selected.request.target.kind !== "ticket") throw new Error("Ticket session was not selected");
  expect(selected.request.target.ticket.id).toBe("T-3");
  expect(selected.navigation.screen).toBe("receipts");
  expect(selected.navigation.receiptId).toBe(receipt.id);
});

test("action breadcrumbs follow the target without overwriting saved column selections", async () => {
  const { component, result } = await fixture(snapshot, 12);
  component.handleInput("6");
  component.handleInput("a");
  const ticketHeading = component.render(120)[0];
  expect(ticketHeading).toContain("T-3");
  expect(ticketHeading).not.toContain("T-2");
  component.handleInput("\x1b");
  component.handleInput("\r");
  component.handleInput("\x1b[D");
  component.handleInput("\x1b[D");
  component.handleInput("a");
  const initiativeHeading = component.render(120)[0];
  expect(initiativeHeading).toContain("plan");
  expect(initiativeHeading).not.toContain("T-3");
  component.handleInput("\x1b");
  component.handleInput("\x1b[C");
  component.handleInput("m");
  const selected = result();
  if (selected?.kind !== "session" || selected.request.target.kind !== "ticket") throw new Error("Ticket session was not selected");
  expect(selected.request.target.ticket.id).toBe("T-3");
});

test("long and wide record text cannot overflow terminal bounds or inject terminal controls", async () => {
  const data: ExplorerSnapshot = { ...snapshot, tickets: snapshot.tickets.map(ticket => ({ ...ticket, title: `依存関係 ${"long label ".repeat(30)}\x1b]52;c;secret\x07\u202e`, body: `${"body ".repeat(50)}\x1b[2J` })) };
  for (const [width, height] of [[40, 12], [80, 24], [120, 40]]) {
    const { component } = await fixture(data, height);
    for (const key of ["\r", "\x1b[B", "\x1b[C", "\x1b[6~", "\x1b[D"]) {
      component.handleInput(key);
      const lines = component.render(width);
      expect(lines.length).toBeLessThanOrEqual(height);
      for (const line of lines) {
        expect(visibleWidth(line)).toBeLessThanOrEqual(width);
        expect(line).not.toContain("\x1b]52");
        expect(line).not.toContain("\x1b[2J");
        expect(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/.test(stripTerminalSequences(line))).toBe(false);
      }
    }
  }
});

test("narrow receipt wrapping preserves complete object IDs and paging reaches hidden source fields", async () => {
  const { component } = await fixture(snapshot, 12);
  component.handleInput("\r");
  component.handleInput("\t");
  component.handleInput("\x1b[B");
  component.handleInput("\x1b[C");
  component.handleInput("\x1b[C");
  component.handleInput("\x1b[C");
  const first = component.render(40).map(line => stripTerminalSequences(line).replace(/\s/g, "")).join("");
  expect(first).toContain(receipt.sourceCommit);
  expect(first).not.toContain(receipt.sourceTree);
  component.handleInput("\x1b[6~");
  const next = component.render(40).map(line => stripTerminalSequences(line).replace(/\s/g, "")).join("");
  expect(next).toContain(receipt.sourceTree);
});

test("compact receipt lists remain reachable through focus and back navigation", async () => {
  const { component } = await fixture(snapshot, 12);
  component.handleInput("6");
  component.handleInput("\r");
  component.handleInput("\x1b[C");
  expect(component.render(40).some(line => line.startsWith(">") && line.includes(receipt.id))).toBe(true);
  component.handleInput("\x1b[C");
  component.handleInput("\t");
  component.handleInput("\t");
  expect(component.render(40).some(line => line.startsWith(">") && line.includes(receipt.id))).toBe(true);
  component.handleInput("\x1b[C");
  component.handleInput("\x1b[D");
  expect(component.render(40).some(line => line.startsWith(">") && line.includes(receipt.id))).toBe(true);
});

test("dependency navigation keeps the selected neighbor inside the viewport", async () => {
  const dependencies = Array.from({ length: 10 }, (_, index) => ({ ...snapshot.tickets[0], id: `D-${index}`, title: `Dependency ${index}` }));
  const data: ExplorerSnapshot = { ...snapshot, tickets: [...snapshot.tickets.map(ticket => ticket.id === "T-3" ? { ...ticket, blockedBy: dependencies.map(item => item.id) } : ticket), ...dependencies] };
  const { component } = await fixture(data, 12);
  component.handleInput("6");
  component.handleInput("\r");
  component.handleInput("\x1b[C");
  component.handleInput("\t");
  component.handleInput("\t");
  for (let index = 0; index < 10; index++) component.handleInput("\x1b[B");
  expect(component.render(40).some(line => line.startsWith(">") && line.includes("T-4"))).toBe(true);
});

test("invalid events can be selected and inspected alongside valid history", async () => {
  const selected = { ...snapshot.tickets[2], blockedBy: [] };
  const invalid = { id: "workflows/T-3/events/invalid.json", ref: "workflows/T-3/events/invalid.json", fields: { receipt_id: "invalid", phase: "review", status: "completed", workflow: { root: "/wrong/workflow/directory" } }, error: "Receipt workflow.root does not match the resolved workflow store root." };
  const component = new GraphExplorer({
    context, theme, commands, exec: async () => { throw new Error("Unexpected process execution"); },
    done: () => {}, requestRender: () => {}, height: () => 40,
    navigation: { screen: "receipts", ticketId: selected.id, queue: "all", focus: "list", offsets: [] },
    loadSnapshot: async () => ({ ...snapshot, tickets: [selected], initiatives: [] }),
    loadWorkflow: async () => ({ ticketId: selected.id, receipts: [receipt], events: [invalid, receipt], error: invalid.error }),
  });
  await component.load();
  const invalidView = component.render(160).join("\n");
  expect(invalidView).toContain("invalid review [INVALID]");
  expect(invalidView).toContain("/wrong/workflow/directory");
  expect(invalidView).toContain("Not valid workflow evidence");
  component.handleInput("\x1b[B");
  expect(component.render(160).join("\n")).toContain(`Commit: ${receipt.sourceCommit}`);
  component.handleInput("\x1b[A");
  expect(component.render(160).join("\n")).toContain("/wrong/workflow/directory");
});

test("ticket focus includes transitive dependents and direct blockers without visiting unrelated branches", () => {
  const selected = snapshot.tickets[2];
  const extra = { ...snapshot.tickets[0], id: "T-5", blockedBy: ["T-4"] };
  const data = { ...snapshot, tickets: [...snapshot.tickets, extra] };
  expect([...focusedTicketIds(data, { kind: "ticket", ticket: selected })].sort()).toEqual(["T-1", "T-3", "T-4", "T-5"]);
  expect([...focusedTicketIds(data, { kind: "initiative", initiative: data.initiatives[0] })].sort()).toEqual(["T-1", "T-2", "T-3", "T-4"]);
});
