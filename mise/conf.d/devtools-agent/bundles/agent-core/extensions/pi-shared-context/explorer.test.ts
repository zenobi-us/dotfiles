import { expect, test } from "bun:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { stripTerminalSequences, visibleWidth, type TuiMouseEvent } from "@earendil-works/pi-tui";
import { GraphExplorer, focusedTicketIds, type ExplorerResult } from "./explorer";
import { SharedContextModal } from "./modal";
import type { ExplorerReceipt, ExplorerSnapshot, SharedAgentContext, TicketWorkflow } from "./model";

const snapshot: ExplorerSnapshot = {
  backend: "local-markdown",
  initiatives: [
    { id: "plan", title: "Graph continuity", phase: "implementation", ref: "tracker/initiatives/plan/index.md", ticketIds: ["T-2", "T-3", "T-4"], body: "## Problem\nRecorded initiative summary." },
    { id: "unassigned", title: "Ungrouped", ref: "tracker/tickets", ticketIds: ["T-1"], body: "Tickets without an assigned initiative.", group: true },
  ],
  tickets: [
    { id: "T-1", title: "Routes", ref: "tracker/tickets/T-1.md", status: "completed", blockedBy: [], backend: "local-markdown", body: "" },
    { id: "T-2", title: "Graph", documentType: "enhancement", ref: "tracker/tickets/T-2.md", status: "claimed", blockedBy: ["T-1"], backend: "local-markdown", body: "" },
    { id: "T-3", title: "Receipts", ref: "tracker/tickets/T-3.md", status: "open", blockedBy: ["T-1"], backend: "local-markdown", body: "Receipt detail" },
    { id: "T-4", title: "Actions", ref: "tracker/tickets/T-4.md", status: "open", blockedBy: ["T-2", "T-3"], backend: "local-markdown", body: "" },
  ],
};
const context = { repositoryRoot: "/fixture/project", canonicalOrigin: "github.com/fixture/project" } as SharedAgentContext;
const theme = { fg: (_token: string, value: string) => value, bg: (_token: string, value: string) => value } as Theme;
const commands = () => [{ name: "skill:worktree" }, { name: "skill:ask-matt" }, { name: "skill:to-tickets" }];
const receipt: ExplorerReceipt = {
  id: "implementation-1", ref: "workflows/T-3/events/implementation-1.md", workflowId: "T-3", phase: "implementation", status: "completed",
  sourceCommit: "a".repeat(40), sourceTree: "b".repeat(40), createdAt: "2026-10-20T12:00:00Z", workspacePath: "/worktrees/T-3",
  sourceBranch: "feature/T-3", baseBranch: "main", outputs: [], fields: {}, body: "",
};

async function fixture(data = snapshot, height: number | (() => number) = 40, loader?: () => Promise<ExplorerSnapshot>) {
  let result: ExplorerResult;
  const component = new GraphExplorer({
    context, theme, exec: async () => { throw new Error("Unexpected process execution"); },
    done: value => { result = value; }, requestRender: () => { }, height: () => (typeof height === "number" ? height : height()) - 3, commands,
    loadSnapshot: loader ?? (async () => data),
    loadWorkflow: async (_context, ticket): Promise<TicketWorkflow> => ({ ticketId: ticket.id, receipts: ticket.id === "T-3" ? [receipt] : [], sourceCommit: receipt.sourceCommit, sourceTree: receipt.sourceTree }),
  });
  await component.load();
  const modal = new SharedContextModal(context, theme, component, { render: () => ["Independent Files"], handleInput: () => { } }, () => { }, "tracker", {
    current: { id: "project", name: "project", identity: context.canonicalOrigin, checkout: true, resolve: async () => context },
    list: async () => [], create: () => { throw new Error("No project switch expected"); }, selected: () => { }, close: () => { }, height: () => typeof height === "number" ? height : height(),
  });
  return { component, modal, view: (width = 120) => modal.render(width).join("\n"), result: () => result };
}

test("normal entry separates initiative fields and opens canonical children and existing detail", async () => {
  const f = await fixture();
  const root = f.view();
  expect(root.indexOf("Graph continuity")).toBeLessThan(root.indexOf("Ungrouped"));
  expect(root).toContain("Phase: implementation");
  expect(root).toContain("Items: 3");
  expect(root).not.toContain("Routes");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("Recorded initiative summary.");
  expect(f.view()).toContain("plan");
  expect(f.view()).toContain("T-2");
  expect(f.view()).toContain("State: claimed");
  expect(f.view()).not.toContain("Routes");
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("Receipt detail");
  await f.modal.handleInput("m");
  const result = f.result();
  if (result?.kind !== "session" || result.request.target.kind !== "ticket") throw new Error("Expected ticket action");
  expect(result.request.target.ticket.ref).toBe("tracker/tickets/T-3.md");
});

test("zero-item Ungrouped remains visible and exposes no initiative planning controls", async () => {
  const data = { ...snapshot, initiatives: snapshot.initiatives.map(item => item.group ? { ...item, ticketIds: [] } : { ...item, phase: undefined }) };
  const f = await fixture(data);
  expect(f.view()).toContain("Phase: unavailable");
  expect(f.view()).toContain("Items: 0");
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("a");
  expect(f.view()).not.toContain("To tickets");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("This collection is empty");
  await f.modal.handleInput("m");
  expect(f.result()).toBeUndefined();
});

test("Esc, keyboard ancestors and mouse ancestors preserve child selection and queue access", async () => {
  const f = await fixture();
  await f.modal.handleInput("\r");
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  f.view();
  await f.modal.handleInput("\x1b");
  expect(f.view().split("\n").some(line => line.includes("Receipts") && line.includes(">"))).toBe(true);
  await f.modal.handleInput("\x1b[Z");
  expect(f.view()).toContain(">Initiatives<");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("Ungrouped");
  await f.modal.handleInput("\r");
  await f.modal.handleInput("\r");
  f.view();
  const mouse = f.modal.handleMouse({ type: "click", button: "left", x: 3, y: 4 } as TuiMouseEvent);
  expect(mouse?.handled).toBe(true);
  expect(f.view()).toContain("Ungrouped");
  await f.modal.handleInput("6");
  expect(f.view()).toContain("Ticket queues");
  expect(f.view()).toContain("Receipts");
  await f.modal.handleInput("2");
  expect(f.view()).toContain("Independent Files");
  await f.modal.handleInput("1");
  expect(f.view()).toContain("Ticket queues");
});

test("compact Events returns restore the paged overview through Esc and keyboard or mouse ancestors", async () => {
  for (const route of ["escape", "keyboard", "mouse"] as const) {
    const data = structuredClone(snapshot);
    const f = await fixture(data, 12);
    f.view(40);
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\x1b[B");
    await f.modal.handleInput("\r");
    const firstPage = f.view(40);
    for (let page = 0; page < 4; page++) await f.modal.handleInput("\x1b[6~");
    const savedPage = f.view(40);
    expect(savedPage).not.toBe(firstPage);
    await f.modal.handleInput("\r");
    expect(f.view(40)).toContain("Events / newest first");
    if (route === "escape") await f.modal.handleInput("\x1b");
    else if (route === "keyboard") {
      await f.modal.handleInput("\x1b[Z");
      await f.modal.handleInput("\x1b[C");
      await f.modal.handleInput("\x1b[C");
      expect(f.view(40)).toContain(">T-3<");
      await f.modal.handleInput("\r");
    } else {
      const lines = f.modal.render(40);
      const y = lines.findIndex(line => line.includes("T-3") && line.includes(" > "));
      const x = visibleWidth(stripTerminalSequences(lines[y]).split("T-3")[0]);
      expect(f.modal.handleMouse({ type: "click", button: "left", x, y } as TuiMouseEvent)?.handled).toBe(true);
    }
    expect(f.view(40)).toBe(savedPage);
    await f.modal.handleInput("m");
    const result = f.result();
    if (result?.kind !== "session" || result.request.target.kind !== "ticket") throw new Error("Expected restored overview target");
    expect(result.request.target.ticket.ref).toBe("tracker/tickets/T-3.md");
  }
});

test("removing an inactive remembered child preserves unrelated queue and home action contexts", async () => {
  for (const screen of ["queues", "home"] as const) {
    for (const [width, height] of [[40, 12], [80, 24], [120, 40]]) {
      let data = structuredClone(snapshot);
      const f = await fixture(data, height, async () => data);
      f.view(width);
      await f.modal.handleInput("\r");
      await f.modal.handleInput("\r");
      f.view(width);
      await f.modal.handleInput("\x1b");
      await f.modal.handleInput("\x1b");
      if (screen === "queues") {
        await f.modal.handleInput("8");
        await f.modal.handleInput("\x1b[B");
        await f.modal.handleInput("\x1b[B");
      }
      f.view(width);
      await f.modal.handleInput("a");
      const before = f.view(width);
      expect(before).toContain("Open a fresh chat");
      data = {
        ...data,
        tickets: data.tickets.filter(ticket => ticket.id !== "T-2"),
        initiatives: data.initiatives.map(item => ({ ...item, ticketIds: item.ticketIds.filter(id => id !== "T-2") })),
      };
      await f.component.load();
      expect(f.view(width)).toBe(before);
      await f.modal.handleInput("\x1b");
      expect(f.view(width)).not.toContain("Open a fresh chat");
      expect(f.view(width)).toContain(screen === "queues" ? "Ticket queues" : "Ungrouped");
      await f.modal.handleInput("m");
      const result = f.result();
      if (result?.kind !== "session") throw new Error("Expected surviving action context");
      expect(result.navigation.screen).toBe(screen);
      const target = result.request.target;
      if (screen === "queues") {
        if (target.kind !== "ticket") throw new Error("Expected queue ticket target");
        expect(target.ticket.ref).toBe("tracker/tickets/T-3.md");
        expect(result.navigation.queue).toBe("all");
      } else {
        if (target.kind !== "initiative") throw new Error("Expected home initiative target");
        expect(target.initiative.ref).toBe("tracker/initiatives/plan/index.md");
      }
    }
  }
});

test("removing the active queue action target closes its menu and selects a surviving canonical ticket", async () => {
  let data = structuredClone(snapshot);
  const f = await fixture(data, 40, async () => data);
  await f.modal.handleInput("8");
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("a");
  expect(f.view()).toContain("Open a fresh chat");
  data = {
    ...data,
    tickets: data.tickets.filter(ticket => ticket.id !== "T-2"),
    initiatives: data.initiatives.map(item => ({ ...item, ticketIds: item.ticketIds.filter(id => id !== "T-2") })),
  };
  await f.component.load();
  expect(f.view()).not.toContain("Open a fresh chat");
  expect(f.view()).toContain("Ticket queues");
  expect(f.view()).toContain("removed");
  await f.modal.handleInput("m");
  const result = f.result();
  if (result?.kind !== "session" || result.request.target.kind !== "ticket") throw new Error("Expected surviving queue target");
  expect(result.request.target.ticket.ref).toBe("tracker/tickets/T-3.md");
  expect(result.navigation.screen).toBe("queues");
});

test("refresh preserves canonical selection and explains removal while stale content disables transitions", async () => {
  let data = snapshot;
  let failure = false;
  const f = await fixture(data, 40, async () => { if (failure) throw new Error("permission denied"); return data; });
  await f.modal.handleInput("\r");
  await f.modal.handleInput("\x1b[B");
  f.view();
  data = { ...data, tickets: data.tickets.map(ticket => ticket.id === "T-3" ? { ...ticket, title: "Updated receipt title" } : ticket) };
  await f.component.load();
  expect(f.view().split("\n").some(line => line.includes("Updated receipt title") && line.includes(">"))).toBe(true);
  failure = true;
  await f.component.load();
  expect(f.view()).toContain("Live refresh failed");
  expect(f.view()).toContain("Updated receipt title");
  await f.modal.handleInput("s");
  expect(f.result()).toBeUndefined();
  failure = false;
  data = { ...data, tickets: data.tickets.filter(ticket => ticket.id !== "T-3"), initiatives: data.initiatives.map(item => ({ ...item, ticketIds: item.ticketIds.filter(id => id !== "T-3") })) };
  await f.component.load();
  expect(f.view()).toContain("removed");
  expect(f.view()).not.toContain("Updated receipt title");
});

test("membership changes close child readers and actions before selecting a nearby child or empty parent", async () => {
  for (const screen of ["detail", "receipts", "actions", "reader-actions"] as const) {
    for (const keepNeighbor of [false, true]) {
      let data = structuredClone(snapshot);
      data.initiatives[0].ticketIds = keepNeighbor ? ["T-2", "T-3"] : ["T-2"];
      const f = await fixture(data, 40, async () => data);
      await f.modal.handleInput("\r");
      if (screen !== "actions") await f.modal.handleInput("\r");
      if (screen === "receipts") await f.modal.handleInput("\r");
      if (screen === "actions" || screen === "reader-actions") await f.modal.handleInput("a");
      f.view();
      data = { ...data, initiatives: data.initiatives.map(item => ({ ...item, ticketIds: item.group ? [...item.ticketIds, "T-2"] : item.ticketIds.filter(id => id !== "T-2") })) };
      await f.component.load();
      expect(f.view()).toContain("removed from this collection");
      expect(f.view()).not.toContain("Open a fresh chat");
      if (keepNeighbor) {
        expect(f.view().split("\n").some(line => line.includes("T-3") && line.includes(">"))).toBe(true);
        await f.modal.handleInput("\r");
        expect(f.view()).toContain("Receipt detail");
        await f.modal.handleInput("\x1b");
        await f.modal.handleInput("m");
        const result = f.result();
        if (result?.kind !== "session" || result.request.target.kind !== "ticket") throw new Error("Expected nearby child target");
        expect(result.request.target.ticket.ref).toBe("tracker/tickets/T-3.md");
      } else {
        expect(f.view()).toContain("This collection is empty");
        await f.modal.handleInput("\r");
        await f.modal.handleInput("m");
        expect(f.result()).toBeUndefined();
      }
      await f.modal.handleInput("\x1b");
      expect(f.view()).toContain("Ungrouped");
    }
  }
});

test("removing a remembered initiative preserves an unrelated queue selection and viewport", async () => {
  let data = structuredClone(snapshot);
  const f = await fixture(data, 12, async () => data);
  await f.modal.handleInput("\r");
  await f.modal.handleInput("\x1b");
  await f.modal.handleInput("8");
  await f.modal.handleInput("\x1b[B");
  f.view(40);
  await f.modal.handleInput("\x1b[6~");
  const before = f.view(40);
  data = { ...data, initiatives: data.initiatives.filter(item => item.id !== "plan") };
  await f.component.load();
  expect(f.view(40)).toBe(before);
  await f.modal.handleInput("m");
  const result = f.result();
  if (result?.kind !== "session" || result.request.target.kind !== "ticket") throw new Error("Expected queue target");
  expect(result.request.target.ticket.ref).toBe("tracker/tickets/T-2.md");
  expect(result.navigation.queue).toBe("all");
  expect(result.navigation.screen).toBe("queues");
});

test("layout changes reveal the selected identity while unchanged renders retain deliberate paging", async () => {
  let height = 40;
  let data = structuredClone(snapshot);
  const f = await fixture(data, () => height, async () => data);
  f.view();
  await f.modal.handleInput("\x1b[B");
  expect(f.view().split("\n").some(line => line.includes("Ungrouped") && line.includes(">"))).toBe(true);
  height = 12;
  expect(f.view(40).split("\n").some(line => line.includes("Ungrouped") && line.includes(">"))).toBe(true);
  data = { ...data, initiatives: data.initiatives.map(item => item.group ? item : { ...item, title: "Expanded preceding initiative title ".repeat(12) }) };
  await f.component.load();
  expect(f.view(40).split("\n").some(line => line.includes("Ungrouped") && line.includes(">"))).toBe(true);
  await f.modal.handleInput("\x1b[5~");
  const page = f.view(40);
  expect(page).not.toContain(">Ungrouped");
  expect(f.view(40)).toBe(page);
  await f.modal.handleInput("m");
  expect(f.result()).toBeUndefined();
});

test("resizing a child list keeps its selected canonical item visible", async () => {
  let height = 40;
  const f = await fixture(snapshot, () => height);
  await f.modal.handleInput("\r");
  await f.modal.handleInput("\x1b[B");
  f.view();
  height = 12;
  expect(f.view(40).split("\n").some(line => line.includes("T-3") && line.includes(">"))).toBe(true);
  await f.modal.handleInput("m");
  const result = f.result();
  if (result?.kind !== "session" || result.request.target.kind !== "ticket") throw new Error("Expected selected child");
  expect(result.request.target.ticket.ref).toBe("tracker/tickets/T-3.md");
});

test("narrow paging exposes the full recorded phase and its distinct unique Items value", async () => {
  const phase = "awaiting-maintainer-review-and-recorded-confirmation";
  const data = { ...snapshot, initiatives: snapshot.initiatives.map(item => item.group ? item : { ...item, phase, ticketIds: ["T-2", "T-3"] }) };
  const f = await fixture(data, 12);
  const pages: string[] = [];
  for (let page = 0; page < 5; page++) {
    pages.push(stripTerminalSequences(f.view(40)));
    await f.modal.handleInput("\x1b[6~");
  }
  const content = pages.join("\n").replace(/^[>◇ ]/gm, "").replace(/\s+/g, "");
  expect(content).toContain(`Phase:${phase}`);
  expect(content).toContain("Items:2");
  expect(pages.some(page => page.split("\n").some(line => line.includes("Items: 2") && !line.includes("Phase:")))).toBe(true);
});

test("long Unicode titles wrap without terminal controls at all required dimensions", async () => {
  const data = { ...snapshot, initiatives: snapshot.initiatives.map(item => ({ ...item, title: `依存関係 ${"long label ".repeat(8)}\x1b]52;c;secret\x07\u202e` })) };
  for (const [width, height] of [[40, 12], [80, 24], [120, 40]]) {
    const f = await fixture(data, height);
    for (const key of ["", "\x1b[6~", "\r", "\r", "\x1b"]) {
      if (key) await f.modal.handleInput(key);
      const lines = f.modal.render(width);
      expect(lines.length).toBeLessThanOrEqual(height);
      for (const line of lines) {
        expect(visibleWidth(line)).toBeLessThanOrEqual(width);
        expect(line).not.toContain("\x1b]52");
        expect(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/.test(stripTerminalSequences(line))).toBe(false);
      }
    }
  }
});

test("invalid events remain inspectable and source evidence remains reachable", async () => {
  const invalid = { id: "invalid", ref: "workflows/T-3/events/invalid.json", fields: { receipt_id: "invalid", phase: "review", status: "completed" }, error: "Receipt workflow.root does not match the resolved workflow store root." };
  const component = new GraphExplorer({
    context, theme, commands, exec: async () => { throw new Error("Unexpected execution"); }, done: () => { }, requestRender: () => { }, height: () => 37,
    navigation: { screen: "receipts", ticketId: "T-3", queue: "all", focus: "list", offsets: [] }, loadSnapshot: async () => snapshot,
    loadWorkflow: async (_context, ticket) => ({ ticketId: ticket.id, receipts: [receipt], events: [invalid, receipt], error: invalid.error }),
  });
  await component.load();
  const modal = new SharedContextModal(context, theme, component, { render: () => [], handleInput: () => { } }, () => { });
  expect(modal.render(160).join("\n")).toContain("Not valid workflow evidence");
  await modal.handleInput("\x1b[B");
  expect(modal.render(160).join("\n")).toContain(`Commit: ${receipt.sourceCommit}`);
  await modal.handleInput("\x1b[A");
  expect(modal.render(160).join("\n")).toContain(invalid.error);
});

test("ticket focus includes transitive dependents and direct blockers without visiting unrelated branches", () => {
  const selected = snapshot.tickets[2];
  const extra = { ...snapshot.tickets[0], id: "T-5", blockedBy: ["T-4"] };
  const data = { ...snapshot, tickets: [...snapshot.tickets, extra] };
  expect([...focusedTicketIds(data, { kind: "ticket", ticket: selected })].sort()).toEqual(["T-1", "T-3", "T-4", "T-5"]);
  expect([...focusedTicketIds(data, { kind: "initiative", initiative: data.initiatives[0] })].sort()).toEqual(["T-1", "T-2", "T-3", "T-4"]);
});
