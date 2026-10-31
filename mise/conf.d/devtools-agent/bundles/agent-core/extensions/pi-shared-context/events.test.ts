// Exercise event inspection through the complete modal, without a second navigation API.
import { expect, test } from "bun:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import { GraphExplorer } from "./explorer";
import { SharedContextModal } from "./modal";
import { buildSessionPrompt } from "./actions";
import type { ExplorerResult } from "./explorer";
import type { ExplorerReceipt, ExplorerSnapshot, SharedAgentContext, TicketWorkflow } from "./model";

async function fixture() {
  const context = { repositoryRoot: "/project", mode: "repository" } as SharedAgentContext;
  const theme = { fg: (_: string, text: string) => text, bg: (_: string, text: string) => text } as Theme;
  const commit = "a".repeat(40), tree = "b".repeat(40);
  const receipt = (id: string, phase: string, status: string, extra: Record<string, unknown> = {}): ExplorerReceipt => {
    const fields = { receipt_id: id, phase, status, source_commit: commit, source_tree: tree, workspace_path: "/historical/workspace", source_branch: "feature/recorded", session_id: "recorded-session", ...extra };
    return { id, phase, status, ref: `workflows/T/events/${id}.json`, workflowId: "T", sourceCommit: commit, sourceTree: tree, createdAt: "2026-10-20T00:00:00Z", workspacePath: fields.workspace_path, sourceBranch: fields.source_branch, baseBranch: "main", outputs: [], fields, body: "", ...extra };
  };
  const review = receipt("review-2", "review", "completed", { verdict: "FAILURE", summary: "Review found a real defect. 界 é 👩‍💻", changed_files: ["one.ts", "two.ts"] });
  const failed = receipt("review-1", "review", "failed", { summary: "The review process exited before a verdict." });
  const snapshot: ExplorerSnapshot = {
    backend: "local-markdown", initiatives: [{ id: "I", title: "Event initiative", ref: "tracker/initiatives/I/index.md", body: "Scope", ticketIds: ["T"] }],
    tickets: [{ id: "T", title: "Canonical ticket", ref: "tracker/tickets/T.md", backend: "local-markdown", status: "claimed", body: "Canonical description", blockedBy: ["BLOCK"] }, { id: "BLOCK", title: "Unresolved prerequisite", ref: "tracker/tickets/BLOCK.md", backend: "local-markdown", status: "open", body: "", blockedBy: [] }],
  };
  let workflow: TicketWorkflow = { ticketId: "T", receipts: [review, failed], events: [review, failed], recordedAttempts: { review: 2, fix: 0 }, sourceCommit: commit, sourceTree: tree };
  let height = 33, failure = false;
  let result: ExplorerResult;
  const graph = new GraphExplorer({
    context, theme, exec: async () => { throw new Error("No execution expected"); }, done: value => { result = value; }, requestRender: () => { }, height: () => height, commands: () => [{ name: "skill:ask-matt" }, { name: "skill:worktree" }], loadSnapshot: async () => snapshot, loadWorkflow: async (_context, ticket) => {
      if (failure) throw new Error("Store is unreadable");
      return ticket.id === "T" ? structuredClone(workflow) : { ticketId: ticket.id, receipts: [] };
    }
  });
  await graph.load();
  const modal = new SharedContextModal(context, theme, graph, { render: () => ["Independent Files selection"], handleInput: () => { } }, () => { });
  const lines = (width = 120) => modal.render(width).map(stripTerminalSequences);
  const view = (width = 120) => lines(width).join("\n");
  const click = (label: string) => {
    const rendered = lines();
    const y = rendered.findIndex(line => line.includes(label));
    if (y < 0) throw new Error(`No visible ${label}`);
    modal.handleMouse({ type: "click", button: "left", y, x: visibleWidth(rendered[y]!.split(label)[0]!) } as Parameters<SharedContextModal["handleMouse"]>[0]);
  };
  for (let index = 0; index < 3; index++) await modal.handleInput("\r");
  return { graph, modal, view, lines, click, review, failed, commit, tree, receipt, setWorkflow: (value: TicketWorkflow) => { workflow = value; }, getWorkflow: () => workflow, fail: () => { failure = true; }, height: (value: number) => { height = value; }, result: () => result };
}

test("event inspection separates execution and verdict, leads with body, and exposes full durable evidence", async () => {
  const f = await fixture();
  try {
    expect(f.view()).toContain("Ticket: T");
    expect(f.view()).toContain("Reviews: 2");
    expect(f.view()).toContain("Fixes: 0");
    expect(f.view()).toContain("Execution: completed");
    expect(f.view()).toContain("Verdict: FAILURE");
    expect(f.view()).toContain("Execution: failed");
    expect(f.view()).toContain("Source commit: aaaaaaaaaaaa");
    await f.modal.handleInput("\r");
    let view = f.view();
    expect(view).toContain("Review found a real defect.");
    expect(view.indexOf("Execution: completed")).toBeLessThan(view.indexOf("Recorded body:"));
    expect(view.indexOf("Review found a real defect.")).toBeLessThan(view.indexOf("Evidence details:"));
    expect(view).toContain("Source: matched");
    expect(view).toContain(f.commit);
    expect(view).toContain(f.tree);
    expect(view).toContain("Changed files: 2 (recorded)");
    await f.modal.handleInput("a");
    await f.modal.handleInput("s");
    expect(f.result()).toBeUndefined();
    await f.modal.handleInput("m");
    const result = f.result();
    if (result?.kind !== "session") throw new Error("Expected canonical chat request");
    expect(buildSessionPrompt({ ...result.request, prompt: "Discuss the recorded defect" }).split("\n")[0]).toBe('/skill:ask-matt "tracker/tickets/T.md"');
    await f.modal.handleInput("\x1b");
    await f.modal.handleInput("\x1b");
    await f.modal.handleInput("\x1b[B");
    await f.modal.handleInput("\r");
    view = f.view();
    expect(view).toContain("Execution: failed");
    expect(view).not.toContain("Review verdict:");
    expect(view).not.toContain("Changed files:");
  } finally { f.graph.dispose(); }
});

test("stable events survive insertions, Files, failed refresh, and keyboard or mouse ancestor return", async () => {
  const f = await fixture();
  try {
    await f.modal.handleInput("\x1b[B");
    const origin = f.view();
    await f.modal.handleInput("\r");
    expect(f.view()).toContain("The review process exited before a verdict.");
    const inserted = f.receipt("fix-new", "fix", "completed", { summary: "New fix body" });
    f.setWorkflow({ ...f.getWorkflow(), events: [inserted, f.review, f.failed], receipts: [inserted, f.review, f.failed], recordedAttempts: { review: 2, fix: 1 } });
    await f.graph.load();
    expect(f.view()).toContain("The review process exited before a verdict.");
    expect(f.view()).not.toContain("New fix body");
    await f.modal.handleInput("2");
    expect(f.view()).toContain("Independent Files selection");
    await f.modal.handleInput("1");
    expect(f.view()).toContain("The review process exited before a verdict.");
    f.click("Events");
    expect(f.view()).not.toContain("Recorded body:");
    await f.modal.handleInput("\r");
    expect(f.view()).toContain("The review process exited before a verdict.");
    await f.modal.handleInput("\x1b");
    expect(f.view()).toContain("Reviews: 2");
    expect(f.view()).toContain("Fixes: 1");
    await f.modal.handleInput("\r");
    f.fail();
    await f.graph.load();
    expect(f.view()).toContain("The review process exited before a verdict.");
    expect(f.view()).toContain("Source: unavailable");
    expect(f.view()).toContain("History refresh failed");
    await f.modal.handleInput("a");
    const previous = f.result();
    await f.modal.handleInput("r");
    expect(f.result()).toBe(previous);
    expect(origin).toContain("review-1");
  } finally { f.graph.dispose(); }
});

test("event evidence reflows without terminal controls, keeps invalid raw fields, and distinguishes source freshness", async () => {
  const f = await fixture();
  try {
    const hostile = { ...f.review, body: "Readable body\n\x1b[2J\x1b]0;hostile\x07END 界", error: "Invalid receipt identity", fields: { ...f.review.fields, source_commit: "c".repeat(64), arbitrary: "exact raw field" } };
    f.setWorkflow({ ticketId: "T", receipts: [], events: [hostile], error: "Invalid receipt identity", recordedAttempts: { review: 0, fix: 0 } });
    await f.graph.load();
    await f.modal.handleInput("\r");
    for (const [width, height] of [[40, 7], [80, 18], [120, 33]]) {
      f.height(height!);
      let accumulated = "", previous = "";
      for (let page = 0; page < 100; page++) {
        const current = f.view(width);
        expect(f.lines(width).every(line => visibleWidth(line) <= width!)).toBe(true);
        accumulated += current + "\n";
        if (current === previous) break;
        previous = current;
        await f.modal.handleInput("\x1b[6~");
      }
      expect(accumulated).toContain("INVALID");
      expect(accumulated).toContain("exact raw field");
      expect(accumulated).toContain("Source: unavailable");
      expect(accumulated).not.toContain("hostile");
      for (let page = 0; page < 100; page++) await f.modal.handleInput("\x1b[5~");
    }
    f.height(33);
    f.setWorkflow({ ...f.getWorkflow(), receipts: [f.review], events: [f.review], sourceCommit: "d".repeat(40), sourceTree: f.tree, error: undefined });
    await f.graph.load();
    expect(f.view()).toContain("Source: stale");
    await f.modal.handleInput("\x1b");
    f.setWorkflow({ ticketId: "T", receipts: [], events: [] });
    await f.graph.load();
    expect(f.view()).toContain("No events recorded.");
    f.setWorkflow({ ticketId: "T", receipts: [], events: [], error: "Unreadable store" });
    await f.graph.load();
    expect(f.view()).toContain("History unreadable");
    expect(f.view()).not.toContain("No events recorded.");
  } finally { f.graph.dispose(); }
});
