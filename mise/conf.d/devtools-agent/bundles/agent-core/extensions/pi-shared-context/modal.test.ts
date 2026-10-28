import { expect, test } from "bun:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { SharedContextModal } from "./modal";
import { GraphExplorer } from "./explorer";
import type { ExplorerResult } from "./explorer";
import type { ExplorerSnapshot, SharedAgentContext } from "./model";
import { buildSessionPrompt } from "./actions";

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
