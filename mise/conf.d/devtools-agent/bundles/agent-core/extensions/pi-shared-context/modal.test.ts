import { expect, test } from "bun:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { SharedContextModal } from "./modal";
import { GraphExplorer } from "./explorer";
import type { ExplorerResult } from "./explorer";
import type { ExplorerSnapshot, SharedAgentContext } from "./model";
import { buildSessionPrompt } from "./actions";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";

const theme = { fg: (_token: string, text: string) => text, bg: (_token: string, text: string) => `<focus>${text}</focus>` } as Theme;
const context = { repositoryRoot: "/projects/example", mode: "mixed" } as SharedAgentContext;

test("tab highlighting does not activate content until Space or Enter", async () => {
  const tracker = new GraphExplorer({ context, theme, exec: async () => ({ stdout: "", code: 0 }), done: () => { }, requestRender: () => { }, height: () => 20, commands: () => [], loadSnapshot: async () => ({ backend: "local-markdown", initiatives: [], tickets: [] }) });
  await tracker.load();
  let fileOpens = 0;
  const files = { render: () => ["File browser"], handleInput: (key: string) => { if (key === "\r") fileOpens++; } };
  const modal = new SharedContextModal(context, theme, tracker, files, () => { });
  await modal.handleInput("\t");
  await modal.handleInput("\t");
  expect(modal.render(100)[2]).toContain("> 2 Files <");
  expect(modal.render(100).join("\n")).not.toContain("File browser");
  await modal.handleInput(" ");
  expect(modal.render(100).at(-1)).toBe("File browser");
  expect(fileOpens).toBe(0);
  await modal.handleInput("\r");
  expect(fileOpens).toBe(1);
  await modal.handleInput("\t");
  await modal.handleInput("\r");
  expect(modal.render(100).join("\n")).not.toContain("File browser");
});

test("number shortcuts switch tabs without changing tracker queues or losing selection", async () => {
  const tracker = new GraphExplorer({ context, theme, exec: async () => ({ stdout: "", code: 0 }), done: () => { }, requestRender: () => { }, height: () => 20, commands: () => [], loadSnapshot: async () => ({ backend: "local-markdown", initiatives: [], tickets: [] }) });
  await tracker.load();
  const modal = new SharedContextModal(context, theme, tracker, { render: () => ["File browser"], handleInput: () => { } }, () => { });
  await modal.handleInput("6");
  await modal.handleInput("2");
  expect(modal.render(100).at(-1)).toBe("File browser");
  await modal.handleInput("1");
  expect(modal.render(100).join("\n")).toContain("Ticket queues · review");
});

test("mixed items retain canonical details, planning commands, and independent Files selection", async () => {
  const research = { id: "R", title: "Research 界 with recorded findings", documentType: "research", status: "draft", backend: "local-markdown", ref: "tracker/tickets/R.md", blockedBy: [], body: "Findings: use the recorded source.", fields: { source: "sources/study", author: "Reader" } };
  const snapshot: ExplorerSnapshot = {
    backend: "local-markdown",
    tickets: [research, { ...research, id: "T", title: "Executable work", documentType: "enhancement", status: "open", ref: "tracker/tickets/T.md", blockedBy: ["missing"] }],
    initiatives: [{ id: "I", title: "Mixed initiative", ref: "tracker/initiatives/I/index.md", ticketIds: ["R", "T"], body: "Recorded scope." }],
  };
  let result: ExplorerResult;
  const graph = new GraphExplorer({
    context, theme, exec: async () => ({ stdout: "", code: 0 }), done: value => { result = value; }, requestRender: () => { }, height: () => 40,
    commands: () => ["ask-matt", "to-tickets", "grill-with-docs", "worktree"].map(name => ({ name: `skill:${name}` })),
    loadSnapshot: async () => snapshot, loadWorkflow: async (_context, ticket) => ({ ticketId: ticket.id, receipts: [] }),
  });
  await graph.load();
  const modal = new SharedContextModal(context, theme, graph, { render: () => ["Independent file selection"], handleInput: () => { } }, () => { });
  await modal.handleInput("\r");
  expect(modal.render(120).join("\n")).toContain("Items 2");
  expect(modal.render(120).join("\n")).toContain("[research]");
  await modal.handleInput("\r");
  let view = modal.render(180).join("\n");
  expect(view).toContain("Findings: use the recorded source.");
  expect(view).toContain("sources/study");
  expect(view).not.toContain("Current source:");
  expect(view).not.toContain("Receipts:");
  await modal.handleInput("\r");
  expect(modal.render(180).join("\n")).not.toContain("Events /");
  await modal.handleInput("2");
  expect(modal.render(120).join("\n")).toContain("Independent file selection");
  await modal.handleInput("1");
  await modal.handleInput("a");
  view = modal.render(180).join("\n");
  expect(view).toContain("To tickets");
  expect(view).toContain("Grill");
  expect(view).not.toContain("Start worktree");
  await modal.handleInput("t");
  expect(result?.kind).toBe("session");
  if (result?.kind !== "session") throw new Error("Expected canonical planning request");
  expect(buildSessionPrompt(result.request).split("\n")[0]).toBe('/skill:to-tickets "tracker/tickets/R.md"');
  await modal.handleInput("\x1b");
  await modal.handleInput("\x1b");
  await modal.handleInput("\x1b[B");
  await modal.handleInput("\r");
  expect(modal.render(180).join("\n")).toContain("missing");
  await modal.handleInput("a");
  expect(modal.render(180).join("\n")).toContain("Unresolved or missing direct blockers");
  graph.dispose();
});

test("canonical planning and other records keep their own details and action boundaries", async () => {
  const record = { id: "P", title: "Recorded planning", documentType: "Spec", status: "draft", backend: "local-markdown", ref: "tracker/tickets/P.md", blockedBy: [], body: "Planning decisions." };
  const snapshot: ExplorerSnapshot = {
    backend: "local-markdown",
    tickets: [record, { ...record, id: "N", title: "Recorded report", documentType: "Report", ref: "tracker/tickets/N.md", body: "Report findings." }],
    initiatives: [{ id: "unassigned", title: "Ungrouped", ref: "tracker/tickets", ticketIds: ["P", "N"], body: "", group: true }],
  };
  let result: ExplorerResult;
  const graph = new GraphExplorer({
    context, theme, exec: async () => { throw new Error("Unexpected execution"); }, done: value => { result = value; }, requestRender: () => { }, height: () => 40,
    commands: () => ["ask-matt", "to-tickets", "grill-with-docs", "worktree"].map(name => ({ name: `skill:${name}` })),
    loadSnapshot: async () => snapshot,
    loadWorkflow: async () => { throw new Error("Non-executable records must not read workflows"); },
  });
  try {
    await graph.load();
    const modal = new SharedContextModal(context, theme, graph, { render: () => [], handleInput: () => { } }, () => { });
    const view = () => modal.render(180).join("\n");
    await modal.handleInput("\r");
    expect(view()).toContain("[Spec]");
    expect(view()).toContain("[Report]");
    await modal.handleInput("\r");
    expect(view()).toContain("Planning decisions.");
    expect(view()).not.toContain("Workflow unreadable");
    await modal.handleInput("g");
    if (result?.kind !== "session") throw new Error("Expected planning action");
    expect(buildSessionPrompt(result.request).split("\n")[0]).toBe('/skill:grill-with-docs "tracker/tickets/P.md"');
    // Returning through an ancestor must retain the selected canonical record.
    const lines = modal.render(180);
    const y = lines.findIndex(line => line.includes("Initiatives") && line.includes("Ungrouped"));
    const x = lines[y]!.indexOf("Ungrouped");
    modal.handleMouse({ type: "click", button: "left", x, y } as Parameters<SharedContextModal["handleMouse"]>[0]);
    expect(view()).not.toContain("Planning decisions.");
    await modal.handleInput("\r");
    expect(view()).toContain("Planning decisions.");
    await modal.handleInput("\x1b");
    await modal.handleInput("\x1b[B");
    await modal.handleInput("\r");
    expect(view()).toContain("Report findings.");
    await modal.handleInput("a");
    expect(view()).toContain("Ask Matt");
    expect(view()).not.toContain("To tickets");
    expect(view()).not.toContain("Start worktree");
    await modal.handleInput("\x1b");
    await modal.handleInput("\x1b");
    await modal.handleInput("\r");
    expect(view()).toContain("Report findings.");
  } finally { graph.dispose(); }
});

// Exercise the reader through the same modal used by Pi, including its focus ring.
async function descriptionFixture() {
  const plain = { fg: (_: string, text: string) => text, bg: (_: string, text: string) => text } as Theme;
  const body = (name: string) => Array.from({ length: 90 }, (_, index) => `${name} paragraph ${index}: 界 é 👩‍💻 ${"long".repeat(12)}`).join("\n");
  const snapshot: ExplorerSnapshot = {
    backend: "local-markdown",
    initiatives: [{ id: "I", title: "Reader initiative", ref: "tracker/initiatives/I/index.md", ticketIds: ["R", "T"], body: body("Initiative") }],
    tickets: [
      { id: "R", title: "Reader research", ref: "tracker/tickets/R.md", documentType: "research", backend: "local-markdown", status: "draft", blockedBy: [], body: body("Research") },
      { id: "T", title: "Reader ticket", ref: "tracker/tickets/T.md", documentType: "task", backend: "local-markdown", status: "open", blockedBy: [], body: body("Ticket") },
    ],
  };
  let height = 20;
  let failure = false;
  const graph = new GraphExplorer({
    context, theme: plain, exec: async () => { throw new Error("Unexpected execution"); },
    done: () => { }, requestRender: () => { }, height: () => height, commands: () => [],
    loadSnapshot: async () => { if (failure) throw new Error("Record cannot be read"); return structuredClone(snapshot); },
    loadWorkflow: async (_context, ticket) => ({
      ticketId: ticket.id, receipts: [],
      events: ["newest", "older"].map(id => ({ id, ref: `workflows/T/events/${id}.json`, fields: { receipt_id: id, phase: "implementation", status: "blocked" }, body: `${id} event body` })),
    }),
  });
  await graph.load();
  const modal = new SharedContextModal(context, plain, graph, { render: () => ["Independent Files selection"], handleInput: () => { } }, () => { });
  const lines = (width = 100) => modal.render(width).map(stripTerminalSequences);
  const view = (width = 100) => lines(width).join("\n");
  const click = (text: string, width = 100) => {
    const rendered = lines(width);
    const y = rendered.findIndex(line => line.includes(text));
    if (y < 0) throw new Error(`Missing visible control: ${text}`);
    modal.handleMouse({ type: "click", button: "left", y, x: visibleWidth(rendered[y]!.split(text)[0]!) } as Parameters<SharedContextModal["handleMouse"]>[0]);
  };
  return { graph, modal, snapshot, lines, view, click, height: (value: number) => { height = value; }, fail: (value: boolean) => { failure = value; } };
}

test("initiative descriptions open by focus and mouse, scroll fully, and return to the same child and viewport", async () => {
  const f = await descriptionFixture();
  try {
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\x1b[B");
    await f.modal.handleInput("\t");
    expect(f.view()).toContain(">[d] Full description<");
    const origin = f.view();
    await f.modal.handleInput(" ");
    expect(f.view()).toContain("Reader initiative · Description");
    expect(f.view()).toContain("Initiative paragraph 0");
    for (let index = 0; index < 30; index++) { await f.modal.handleInput("\x1b[6~"); f.view(); }
    expect(f.view()).toContain("Initiative paragraph 89");
    expect(f.view()).toContain("Reader initiative · Description");
    await f.modal.handleInput("\x1b");
    expect(f.view()).toBe(origin);
    await f.modal.handleInput("\r");
    expect(f.view()).toContain("Initiative paragraph 89");
    f.click("Return");
    f.click("Full description");
    expect(f.view()).toContain("Initiative paragraph 89");
    f.click("Initiatives");
    expect(f.view()).not.toContain("[Return]");
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\r");
    expect(f.view()).toContain("Reader ticket");
  } finally { f.graph.dispose(); }
});

test("type-specific item readers retain event selection, overview scroll, and independent Files state", async () => {
  const f = await descriptionFixture();
  try {
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\r");
    await f.modal.handleInput("d");
    expect(f.view()).toContain("Reader research · Description");
    expect(f.view()).toContain("Research paragraph 0");
    await f.modal.handleInput("\x1b[6~");
    const reading = f.view();
    await f.modal.handleInput("2");
    expect(f.view()).toContain("Independent Files selection");
    await f.modal.handleInput("1");
    expect(f.view()).toBe(reading);
    await f.modal.handleInput("\t");
    expect(f.view()).toContain(">[Return]<");
    await f.modal.handleInput("\r");
    expect(f.view()).not.toContain("[Return]");
    expect(f.view()).not.toContain("Events /");
    await f.modal.handleInput("\x1b");
    await f.modal.handleInput("\x1b[B");
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\x1b[B");
    const event = f.view();
    expect(event).toContain("older");
    f.click("Full description");
    expect(f.view()).toContain("Reader ticket · Description");
    await f.modal.handleInput("\x1b");
    expect(f.view()).toBe(event);
    await f.modal.handleInput("d");
    await f.modal.handleInput("\x1b[Z");
    await f.modal.handleInput("\x1b[D");
    await f.modal.handleInput("\r");
    expect(f.view()).not.toContain("[Return]");
  } finally { f.graph.dispose(); }
});

test("reader reflow, terminal sanitization, live shrinking, empty bodies, unreadable refresh, and removal stay recoverable", async () => {
  const f = await descriptionFixture();
  try {
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\r");
    f.snapshot.tickets[0]!.body += "\n\x1b[2J\x1b]0;hostile\x07END 界 👩‍💻\u0000";
    await f.graph.load();
    await f.modal.handleInput("d");
    for (const [width, height] of [[40, 5], [80, 18], [120, 33]]) {
      f.height(height!);
      let previous = "";
      for (let page = 0; page < 600; page++) {
        await f.modal.handleInput("\x1b[6~");
        const current = f.view(width);
        if (current === previous) break;
        previous = current;
      }
      const lines = f.lines(width);
      expect(lines.length).toBe(height! + 3);
      expect(lines.every(line => visibleWidth(line) <= width!)).toBe(true);
      expect(lines.join("\n")).toContain("END 界");
      expect(lines.join("\n")).not.toContain("hostile");
      expect(lines.join("\n")).toContain("[Return]");
    }
    f.snapshot.tickets[0]!.body = "Updated short body.";
    await f.graph.load();
    expect(f.view()).toContain("Updated short body.");
    f.snapshot.tickets[0]!.body = "";
    await f.graph.load();
    expect(f.view()).toContain("No description recorded.");
    f.fail(true);
    await f.graph.load();
    expect(f.view()).toContain("Description unreadable");
    expect(f.view()).not.toContain("Loading");
    f.fail(false);
    f.snapshot.tickets.shift();
    f.snapshot.initiatives[0]!.ticketIds.shift();
    await f.graph.load();
    expect(f.view()).not.toContain("[Return]");
    expect(f.view()).toContain("removed");
    expect(f.view()).toContain("Reader ticket");
    await f.modal.handleInput("\r");
    await f.modal.handleInput("d");
    expect(f.view()).toContain("Reader ticket · Description");
  } finally { f.graph.dispose(); }
});

test("clicking a description transfers keyboard focus from workspace controls into its reader", async () => {
  const f = await descriptionFixture();
  try {
    await f.modal.handleInput("\r");
    await f.modal.handleInput("\t");
    await f.modal.handleInput("\t");
    expect(f.view()).toContain(">[1 Tracker]<");
    f.click("Full description");
    const start = f.view();
    expect(start).toContain("> Reader initiative");
    await f.modal.handleInput("\x1b[6~");
    expect(f.view()).not.toBe(start);
    f.click("Return");
    expect(f.view()).not.toContain("[Return]");
  } finally { f.graph.dispose(); }
});
