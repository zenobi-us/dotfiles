import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./data";
import { GraphExplorer } from "./explorer";
import { ContextBrowser } from "./index";
import { SharedContextModal } from "./modal";
import type { Exec } from "./model";

const cleanups: (() => void | Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const theme = { fg: (_name: string, value: string) => value, bg: (_name: string, value: string) => value } as Theme;
const execute: Exec = async (command, args) => {
  const child = Bun.spawn([command, ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout: code ? `${stdout}\n${stderr}` : stdout, code };
};

// Native watcher delivery and Bun debounce timers must share the platform clock.
async function until(condition: () => boolean, describe: string) {
  const deadline = Date.now() + 6_000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`Timed out: ${describe}`);
    await Bun.sleep(10);
  }
}

async function put(file: string, content: string) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "context-live-"));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  for (const args of [["init", "--quiet", root], ["-C", root, "remote", "add", "origin", `https://github.com/fixture/${basename(root)}.git`], ["-C", root, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "Initial"]]) {
    const result = await execute("git", args);
    if (result.code) throw new Error(result.stdout);
  }
  await put(join(root, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
  const context = await resolveSharedContext(execute, root);
  if (!context) throw new Error("Fixture context is unavailable");
  const commit = (await execute("git", ["-C", root, "rev-parse", "HEAD"])).stdout.trim();
  const tree = (await execute("git", ["-C", root, "rev-parse", "HEAD^{tree}"])).stdout.trim();
  const ticket = async (id: string, blockers: string[] = [], title = id) => put(join(root, `tracker/tickets/${id}.md`), `---\nid: ${id}\ntitle: ${title}\nwork_status: open\nblocked_by: ${JSON.stringify(blockers)}\n---\n`);
  const receipt = async (id: string, receiptId: string) => put(join(root, `workflows/${id}/events/${receiptId}.json`), JSON.stringify({
    schema: "worktree-receipt/v1", workflow_id: id, receipt_id: receiptId, phase: "implementation", status: "completed", attempt: 1,
    parent_receipt: null, created_at: "2026-10-20T10:00:00Z", repository: root, worktree: root, workspace_path: root,
    source_commit: commit, source_tree: tree, source_branch: "feature", base_branch: "main", muxer: "herdr", pane_id: "1", agent: "omp", session_id: null,
    ticket: { id, backend: "local-markdown", ref: `tracker/tickets/${id}.md` }, ticket_ref: `tracker/tickets/${id}.md`,
    workflow: { store: "repository", root, ref: `workflows/${id}` }, evidence: { store: "repository", ref: `workflows/${id}/artifacts/evidence/test` }, inputs: [], outputs: [],
  }));
  return { root, context, ticket, receipt };
}

test("the open modal refreshes focused DAG history and discovers a new dependent outside its scope", async () => {
  const f = await fixture();
  await f.ticket("A"); await f.ticket("B", ["A"]); await f.ticket("C", ["B"]); await f.ticket("D");
  await f.receipt("A", "initial-A");
  const counts = new Map<string, number>();
  const loaded = new Map<string, string[]>();
  let graphReads = 0;
  let renders = 0;
  const graph = new GraphExplorer({
    context: f.context, exec: execute, theme, done: () => { }, requestRender: () => { renders++; }, height: () => 40,
    commands: () => [{ name: "skill:worktree" }], live: true,
    navigation: { screen: "receipts", ticketId: "A", receiptId: "workflows/A/events/initial-A.json", focus: "list", queue: "all", offsets: [] },
    loadSnapshot: async (...args) => { graphReads++; return loadExplorerSnapshot(...args); },
    loadWorkflow: async (context, ticket, exec) => {
      const workflow = await loadTicketWorkflow(context, ticket, exec);
      counts.set(ticket.id, (counts.get(ticket.id) ?? 0) + 1);
      loaded.set(ticket.id, workflow.receipts.map(receipt => receipt.id));
      return workflow;
    },
  });
  cleanups.push(() => graph.dispose());
  await graph.load();
  const files = new ContextBrowser(f.root, theme, () => { }, () => { renders++; }, f.root, execute, () => { }, () => 40);
  cleanups.push(() => files.dispose());
  const modal = new SharedContextModal(f.context, theme, graph, files, () => { renders++; });
  await until(() => graphReads >= 2 && (counts.get("D") ?? 0) >= 2, "initial subscriptions");
  await until(() => modal.render(180).join("\n").includes("initial-A"), "selected receipt");
  const unrelatedReads = counts.get("D");
  const snapshotsBefore = graphReads;
  await f.receipt("C", "new-C");
  await until(() => Boolean(loaded.get("C")?.includes("new-C")), "transitive dependent receipt refresh");
  expect(counts.get("D")).toBe(unrelatedReads);
  expect(graphReads).toBe(snapshotsBefore);
  expect(modal.render(180).join("\n")).toContain("initial-A");
  await f.ticket("D", ["A"], "New dependent");
  await until(() => modal.render(180).join("\n").includes("New dependent"), "new dependency edge");
  await f.receipt("D", "new-D");
  await until(() => Boolean(loaded.get("D")?.includes("new-D")), "newly focused dependent history");
  await modal.handleInput("2");
  await f.receipt("A", "later-A");
  await until(() => Boolean(loaded.get("A")?.includes("later-A")), "tracker refresh while Files tab is open");
  await modal.handleInput("1");
  expect(modal.render(180).join("\n")).toContain("initial-A");
  await put(join(f.root, "tracker/tickets/D.md"), "---\nid: D\n---\n");
  await until(() => modal.render(180).join("\n").includes("Live refresh failed"), "invalid graph update");
  expect(modal.render(180).join("\n")).toContain("initial-A");
  await f.receipt("A", "while-graph-invalid");
  await until(() => Boolean(loaded.get("A")?.includes("while-graph-invalid")), "history refresh with stale graph");
  expect(modal.render(180).join("\n")).toContain("Live refresh failed");
  await f.ticket("D", ["A"], "Recovered dependent");
  await until(() => modal.render(180).join("\n").includes("Recovered dependent") && !modal.render(180).join("\n").includes("Live refresh failed"), "graph recovery");
  graph.dispose(); files.dispose();
  const afterClose = renders;
  await f.receipt("A", "after-close");
  await graph.load();
  expect(renders).toBe(afterClose);
});

test("file previews follow atomic replacement without moving selection to an inserted sibling", async () => {
  const f = await fixture();
  const folder = join(f.root, "preview");
  await put(join(folder, "b.txt"), "original preview");
  const browser = new ContextBrowser(folder, theme, () => { }, () => { }, f.root, execute, () => { }, () => 40);
  cleanups.push(() => browser.dispose());
  browser.startWatching();
  await browser.load();
  await browser.handleInput("\x1b[C");
  await put(join(folder, "a.txt"), "unselected sibling");
  await put(join(folder, ".replacement"), "updated preview");
  await rename(join(folder, ".replacement"), join(folder, "b.txt"));
  await until(() => browser.render(160).join("\n").includes("updated preview"), "atomic preview replacement");
  const view = browser.render(160).join("\n");
  expect(view).toContain("b.txt");
  expect(view).not.toContain("unselected sibling");
});

test("mixed canonical records refresh type and membership without inventing workflows or dependency membership", async () => {
  const f = await fixture();
  const record = (id: string, type: string, extra = "", body = `${id} recorded findings`) =>
    put(join(f.root, `tracker/tickets/${id}.md`), `---\nid: ${id}\ntitle: ${id} title\ntype: ${type}\n${extra}---\n${body}\n`);
  const index = join(f.root, "tracker/initiatives/I/index.md");
  await record("R", "research", "status: draft\nsource: sources/study\n");
  await record("T", "enhancement", "work_status: open\n");
  await record("N", "Report");
  await record("U", "research");
  await record("D", "task", "work_status: open\nblocked_by: [T]\n");
  await put(index, "---\ntitle: Mixed initiative\n---\n[R](../../tickets/R.md)\n[T](../../tickets/T.md)\n[N](../../tickets/N.md)\n");
  const graph = new GraphExplorer({ context: f.context, exec: execute, theme, done: () => { }, requestRender: () => { }, height: () => 40, commands: () => [{ name: "skill:to-tickets" }, { name: "skill:worktree" }], live: true });
  cleanups.push(() => graph.dispose());
  await graph.load();
  const modal = new SharedContextModal(f.context, theme, graph, { render: () => ["Independent Files"], handleInput: () => { } }, () => { });
  const view = () => modal.render(180).join("\n");
  expect(view()).toContain("Items: 3");
  expect(view()).toContain("Items: 2");
  await modal.handleInput("\r");
  expect(view()).toContain("[research]");
  expect(view()).toContain("[enhancement]");
  expect(view()).toContain("[Report]");
  expect(view()).not.toContain("U title");
  expect(view()).not.toContain("D title");
  await modal.handleInput("\r");
  expect(view()).toContain("sources/study");
  expect(view()).not.toContain("Current source:");
  await modal.handleInput("a");
  expect(view()).toContain("To tickets");
  expect(view()).toContain("skill:grill-with-docs command is unavailable");
  expect(view()).not.toContain("Start worktree");
  await modal.handleInput("\x1b");
  await record("R", "task", "work_status: open\n", "R is now executable");
  await until(() => view().includes("R is now executable"), "selected research becomes a ticket");
  await modal.handleInput("\r");
  expect(view()).toContain("Events /");
  await record("R", "research", "status: reviewed\n", "R research restored");
  await until(() => view().includes("R research restored"), "ticket event view returns to research details");
  expect(view()).not.toContain("Events /");
  expect(view()).not.toContain("Current source:");
  await modal.handleInput("2");
  await record("R", "research", "status: reviewed\n", "R refreshed while Files is active");
  await modal.handleInput("1");
  await until(() => view().includes("R refreshed while Files is active"), "Files preserves selected canonical research");
  await record("R", "research", "parent: missing-initiative\n");
  await until(() => view().includes("missing-initiative"), "missing parent explanation").catch(error => { throw new Error(`${error}\n${view()}`); });
  expect(view()).toContain("R refreshed while Files is active");
  await record("R", "research");
  await put(index, "---\ntitle: Mixed initiative\n---\n[T](../../tickets/T.md)\n[N](../../tickets/N.md)\n");
  await until(() => view().includes("removed from this collection"), "membership removal explains context change");
  expect(view()).not.toContain("R title");
  await modal.handleInput("\x1b");
  await modal.handleInput("\x1b[B");
  await modal.handleInput("\r");
  expect(view()).toContain("Items 3");
  expect(view()).toContain("R title");
  expect(view()).toContain("U title");
  expect(view()).toContain("D title");
  expect(view()).not.toContain("T title");
  await modal.handleInput("\x1b[B");
  await modal.handleInput("\r");
  expect(view()).toContain("ID: R");
  await modal.handleInput("\x1b");
  expect(view()).toContain("unassigned");
}, 30_000);

test("a live description reader follows canonical body updates and returns safely after record removal", async () => {
  const f = await fixture();
  const file = join(f.root, "tracker/tickets/R.md");
  const record = (body: string) => put(file, `---\nid: R\ntitle: Live research\ntype: research\n---\n${body}\n`);
  await record(Array.from({ length: 80 }, (_, index) => `Recorded paragraph ${index}`).join("\n"));
  const graph = new GraphExplorer({ context: f.context, exec: execute, theme, done: () => { }, requestRender: () => { }, height: () => 20, commands: () => [], live: true });
  cleanups.push(() => graph.dispose());
  await graph.load();
  const modal = new SharedContextModal(f.context, theme, graph, { render: () => ["Files"], handleInput: () => { } }, () => { });
  const view = () => modal.render(100).join("\n");
  await modal.handleInput("\r");
  await modal.handleInput("\r");
  await modal.handleInput("d");
  for (let index = 0; index < 8; index++) { await modal.handleInput("\x1b[6~"); view(); }
  expect(view()).toContain("Recorded paragraph 79");
  await record("Short replacement body.");
  await until(() => view().includes("Short replacement body."), "reader clamps after a live body replacement");
  expect(view()).toContain("[Return]");
  await record("");
  await until(() => view().includes("No description recorded."), "empty body is not loading");
  await put(file, "---\nid: R\n---\n");
  await until(() => view().includes("Description unreadable"), "failed body refresh explains retained data");
  await record("Recovered full description.");
  await until(() => view().includes("Recovered full description.") && !view().includes("Description unreadable"), "reader recovers");
  await rm(file);
  await until(() => !view().includes("[Return]") && view().includes("removed"), "reader removal returns to its collection");
  expect(view()).toContain("No child items");
}, 20_000);
