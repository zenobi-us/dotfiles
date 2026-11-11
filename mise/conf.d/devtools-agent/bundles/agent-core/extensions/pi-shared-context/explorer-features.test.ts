import { expect, test } from "bun:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";
import { GraphExplorer, focusedTicketIds, type ExplorerNavigation, type ExplorerResult } from "./explorer";
import { initiativeDag } from "./explorer-dag";
import { copyMode, cycleCopyMode, formatExplorerReference } from "./explorer-reference";
import { recallSnapshot, rememberSnapshot, snapshotIdentity } from "./explorer-state";
import type { ExplorerSnapshot, ExplorerTarget, SharedAgentContext, TicketWorkflow } from "./model";
import { buildDependencyForest, renderDependencyGraph } from "../../../matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-shared";

const context: SharedAgentContext = {
  repositoryRoot: "/tmp/explorer-project", origin: "git@example.test:project.git", canonicalOrigin: "example.test/project", slug: "project",
  sharedRoot: "/tmp/explorer-shared", candidateSharedRoot: "/tmp/explorer-shared", root: "/tmp/explorer-project", alignmentRoot: "/tmp/explorer-project", storage: "repository", mode: "repository",
  routes: { alignment: { adapter: "markdown", store: "repository" }, tickets: { adapter: "local-markdown", store: "repository" }, initiatives: { adapter: "markdown", store: "repository" }, workflows: { adapter: "files", store: "repository" }, evidence: { adapter: "files", inherits: "workflows" }, sources: { adapter: "files", inherits: "alignment" } },
};
const theme = { fg: (_: string, value: string) => value, bg: (_: string, value: string) => value } as Theme;
const commands = () => ["ask-matt", "grill", "to-tickets", "prototype", "worktree"].map(name => ({ name: `skill:${name}` }));
function data(): ExplorerSnapshot {
  return {
    backend: "local-markdown", initiatives: [
      { id: "plan", title: "Plan", ref: "tracker/initiatives/plan/index.md", ticketIds: ["T-2", "T-3"], rootTicketIds: ["T-2"], body: "Plan body" },
      { id: "other", title: "Other", ref: "tracker/initiatives/other/index.md", ticketIds: [], body: "Other body" },
    ], tickets: [
      { id: "T-1", title: "Outside blocker", ref: "tracker/tickets/T-1.md", backend: "local-markdown", status: "done", blockedBy: [], body: "" },
      { id: "T-2", title: "Direct member", ref: "tracker/tickets/T-2.md", backend: "local-markdown", status: "open", blockedBy: ["T-1"], body: "" },
      { id: "T-3", title: "Expanded child", ref: "tracker/tickets/T-3.md", backend: "local-markdown", status: "open", blockedBy: [], body: "" },
    ],
  };
}
function deferred<T>() { return Promise.withResolvers<T>(); }
function explorer(loadSnapshot: () => Promise<ExplorerSnapshot>, extra: { navigation?: ExplorerNavigation; loadWorkflow?: (_context: SharedAgentContext, ticket: ExplorerSnapshot["tickets"][number]) => Promise<TicketWorkflow>; copy?: (value: string) => void | Promise<void>; loadAdrs?: () => Promise<ExplorerSnapshot["tickets"]> } = {}) {
  let result: ExplorerResult;
  const renders: (() => void)[] = [];
  const component = new GraphExplorer({
    context: structuredClone(context), theme, commands,
    exec: async () => { throw new Error("No process expected"); }, height: () => 20, done: value => { result = value; },
    requestRender: () => { renders.splice(0).forEach(resolve => resolve()); }, loadSnapshot,
    loadWorkflow: async (_context, ticket) => ({ ticketId: ticket.id, receipts: [] }), ...extra,
  });
  return {
    component, view: (width = 100) => component.render(width).join("\n"), result: () => result,
    rendered: () => {
      const next = Promise.withResolvers<void>();
      renders.push(next.resolve);
      return next.promise;
    }
  };
}

test("initiative DAG matches CLI direct roots and includes transitive blockers only", async () => {
  const snapshot = data();
  const graph = await initiativeDag(snapshot.initiatives[0], snapshot);
  const expected = await buildDependencyForest(["T-2"], async id => {
    const ticket = snapshot.tickets.find(ticket => ticket.id === id)!;
    return { ticket: { id, title: ticket.title, type: "ticket", status: ticket.status }, blockedBy: ticket.blockedBy };
  });
  expect(graph).toEqual({ text: renderDependencyGraph(expected) });
  expect(graph.text).toContain("Outside blocker");
  expect(graph.text).not.toContain("Expanded child");
  const changed = structuredClone(snapshot);
  changed.tickets[0].title = "Changed blocker";
  expect((await initiativeDag(changed.initiatives[0], changed)).text).toContain("Changed blocker");
  changed.initiatives[0].rootTicketIds = ["T-1", "T-2"];
  expect((await initiativeDag(changed.initiatives[0], changed)).text.split("\n")[0]).toContain("T-1");
});

test("invalid DAGs show canonical errors without an invented diagram", async () => {
  const snapshot = data();
  snapshot.tickets[0].blockedBy = ["T-2"];
  const cycle = await initiativeDag(snapshot.initiatives[0], snapshot);
  expect(cycle.error).toContain("dependency cycle: T-2 -> T-1 -> T-2");
  expect(cycle.text).toBe("");
  snapshot.tickets[0].blockedBy = ["missing"];
  const missing = await initiativeDag(snapshot.initiatives[0], snapshot);
  expect(missing.error).toContain("Missing blocker or membership root: missing");
  expect(missing.text).toBe("");
});

test("initiative tabs preserve child selection, per-initiative tab and DAG paging across recreation", async () => {
  const snapshot = data();
  for (let index = 4; index < 25; index++) snapshot.tickets.push({ ...snapshot.tickets[0], id: `T-${index}`, title: `Blocker ${index}`, blockedBy: index < 24 ? [`T-${index + 1}`] : [] });
  snapshot.tickets[0].blockedBy = ["T-4"];
  const loader = async () => snapshot;
  const f = explorer(loader);
  await f.component.load();
  f.component.handleInput("\r");
  f.component.handleInput("\x1b[B");
  f.component.handleInput("v");
  const rendered = f.rendered();
  f.view();
  await rendered;
  f.view();
  f.component.handleInput("\x1b[6~");
  const paged = f.view();
  f.component.handleInput("v");
  f.component.handleInput("m");
  const action = f.result();
  if (action?.kind !== "session" || action.request.target.kind !== "ticket") throw new Error("Expected remembered child");
  expect(action.request.target.ticket.id).toBe("T-3");
  f.component.handleInput("v");
  f.component.handleInput("b");
  const saved = f.result();
  if (saved?.kind !== "files") throw new Error("Expected navigation");
  const reopened = explorer(loader, { navigation: saved.navigation });
  const reopenedRendered = reopened.rendered();
  reopened.view();
  await reopenedRendered;
  expect(reopened.view()).toContain("Detail / >DAG<");
  expect(saved.navigation.offsets.some(([id, offset]) => id === "dag:plan" && offset > 0)).toBe(true);
  expect(reopened.view().split("\n").slice(4, -3)).toEqual(paged.split("\n").slice(4, -3));
  f.component.handleInput("\x1b");
  f.component.handleInput("\x1b[B");
  f.component.handleInput("\r");
  expect(f.view()).toContain(">Detail< / DAG");
  for (const line of reopened.component.render(40)) expect(visibleWidth(line)).toBeLessThanOrEqual(40);
  f.component.dispose(); reopened.component.dispose();
});

test("copy formatting uses resolved routes for initiatives, research, tickets and ADRs", async () => {
  const snapshot = data();
  const targets: ExplorerTarget[] = [
    { kind: "initiative", initiative: snapshot.initiatives[0] },
    { kind: "ticket", ticket: snapshot.tickets[0] },
    { kind: "ticket", ticket: { ...snapshot.tickets[0], id: "R-1", ref: "tracker/tickets/R-1.md", documentType: "research" } },
    { kind: "ticket", ticket: { ...snapshot.tickets[0], id: "0001", documentType: "adr", ref: "docs/adr/0001.md" } },
  ];
  const paths = ["tracker/initiatives/plan/index.md", "tracker/tickets/T-1.md", "tracker/tickets/R-1.md", "docs/adr/0001.md"];
  for (const [index, target] of targets.entries()) {
    const id = target.kind === "initiative" ? target.initiative.id : target.ticket.id;
    expect(await formatExplorerReference(context, target, "id")).toBe(id);
    expect(await formatExplorerReference(context, target, "reference")).toBe(paths[index]);
    expect(await formatExplorerReference(context, target, "path")).toBe(`${context.repositoryRoot}/${paths[index]}`);
    const shared = structuredClone(context);
    shared.routes.alignment.store = shared.routes.tickets.store = shared.routes.initiatives.store = "shared";
    expect(await formatExplorerReference(shared, target, "reference")).toBe(`shared://${paths[index]}`);
  }
  const group: ExplorerTarget = { kind: "initiative", initiative: { ...snapshot.initiatives[0], group: true } };
  for (const mode of ["path", "reference", "id"] as const) await expect(formatExplorerReference(context, group, mode)).rejects.toThrow("collection");
  const hosted: ExplorerTarget = { kind: "ticket", ticket: { ...snapshot.tickets[0], backend: "github", ref: "https://github.com/owner/repo/issues/1" } };
  expect(await formatExplorerReference(context, hosted, "reference")).toBe(hosted.ticket.ref);
  await expect(formatExplorerReference(context, hosted, "path")).rejects.toThrow("no local path");
});

test("copy selector persists in session and distinguishes initiative from selected child", async () => {
  while (copyMode() !== "id") cycleCopyMode();
  const copied = deferred<string>();
  const snapshot = data();
  const f = explorer(async () => snapshot, { copy: value => copied.resolve(value) });
  await f.component.load();
  f.component.handleInput("\r");
  f.component.handleInput("c");
  expect(await copied.promise).toBe("T-2");
  f.component.handleInput("C");
  expect(copyMode()).toBe("path");
  f.component.handleInput("C");
  expect(copyMode()).toBe("reference");
  f.component.handleInput("C");
  expect(copyMode()).toBe("id");
  const initiative = deferred<string>();
  const g = explorer(async () => snapshot, { copy: value => initiative.resolve(value) });
  await g.component.load();
  g.component.handleInput("\r");
  g.component.handleInput("i");
  expect(await initiative.promise).toBe("plan");
  const failing = explorer(async () => snapshot, { copy: async () => { throw new Error("clipboard unavailable"); } });
  await failing.component.load();
  const rendered = failing.rendered();
  failing.component.handleInput("c");
  await rendered;
  expect(failing.view()).toContain("Copy failed");
  while (copyMode() !== "path") cycleCopyMode();
  f.component.dispose(); g.component.dispose(); failing.component.dispose();
});

test("ADRs open as recorded details and never enter workflow queues or inspections", async () => {
  const snapshot = data();
  const adr = { ...snapshot.tickets[0], id: "0001", title: "Architecture decision", documentType: "adr", ref: "docs/adr/0001.md" };
  const inspected: string[] = [];
  const f = explorer(async () => snapshot, { loadAdrs: async () => [adr], loadWorkflow: async (_context, ticket) => { inspected.push(ticket.id); return { ticketId: ticket.id, receipts: [] }; } });
  await f.component.load();
  expect(inspected).not.toContain("0001");
  f.component.handleInput("\x1b[B"); f.component.handleInput("\x1b[B"); f.component.handleInput("\r");
  expect(f.view()).toContain("adr / recorded details");
  await f.component.load();
  expect(f.view()).toContain("Architecture decision");
  f.component.handleInput("\x1b");
  expect(f.view()).toContain("Plan");
  f.component.handleInput("8");
  expect(f.view()).not.toContain("Architecture decision");
  f.component.dispose();
});

test("session cache clones data and separates projects, routes and resolved roots", () => {
  const snapshot = data();
  const key = snapshotIdentity(context);
  rememberSnapshot(key, snapshot, 12);
  snapshot.tickets[0].title = "External mutation";
  const first = recallSnapshot(key)!;
  expect(first.snapshot.tickets[0].title).toBe("Outside blocker");
  first.snapshot.tickets[0].blockedBy.push("mutated");
  expect(recallSnapshot(key)!.snapshot.tickets[0].blockedBy).toEqual([]);
  for (const changed of [{ ...context, repositoryRoot: "/tmp/other" }, { ...context, candidateSharedRoot: "/tmp/new-shared" }, { ...context, layout: { tracker: "tracker", tickets: "tasks", initiatives: "initiatives", sources: "sources" } }, { ...context, routes: { ...context.routes, tickets: { adapter: "github" } } }]) {
    expect(snapshotIdentity(changed)).not.toBe(key);
    expect(recallSnapshot(snapshotIdentity(changed))).toBeUndefined();
  }
});

test("reopen displays cached records unverified until byte validation and retains error markings", async () => {
  const pending = deferred<ExplorerSnapshot>();
  let reads = 0;
  const loader = () => ++reads === 1 ? Promise.resolve(data()) : pending.promise;
  const first = explorer(loader);
  await first.component.load(); first.component.dispose();
  const second = explorer(loader);
  expect(second.view()).toContain("Plan");
  expect(second.view()).toContain("unverified");
  const loading = second.component.load();
  expect(second.view()).toContain("checking");
  second.component.handleInput("\r");
  second.component.handleInput("s");
  expect(second.result()).toBeUndefined();
  pending.reject(new Error("unreadable tracker"));
  await loading;
  expect(second.view()).toContain("unverified");
  expect(second.view()).toContain("unreadable tracker");
  second.component.dispose();
});

test("planning is available while unrelated workflow refresh is pending", async () => {
  const pending = deferred<TicketWorkflow>();
  let result: ExplorerResult;
  const f = explorer(async () => data(), { loadWorkflow: async (_context, ticket) => ticket.id === "T-1" ? pending.promise : ({ ticketId: ticket.id, receipts: [] }) });
  const rendered = f.rendered();
  const loading = f.component.load();
  await rendered;
  // A graph render precedes unrelated receipt workers; wait for that render if needed.
  if (!f.view().includes("Plan")) await f.rendered();
  f.component.handleInput("t");
  result = f.result();
  expect(result?.kind).toBe("session");
  if (result?.kind === "session") expect(result.request.action).toBe("to-tickets");
  pending.resolve({ ticketId: "T-1", receipts: [] });
  await loading;
  f.component.dispose();
});

test("a validated selected ticket can start while an unrelated workflow is still checking", async () => {
  const pending = deferred<TicketWorkflow>();
  const f = explorer(async () => data(), { loadWorkflow: async (_context, ticket) => ticket.id === "T-1" ? pending.promise : ({ ticketId: ticket.id, receipts: [] }) });
  const loading = f.component.load();
  while (!f.view().includes("Plan")) await f.rendered();
  f.component.handleInput("\r");
  f.component.handleInput("\r");
  while (!f.view().includes("State: READY")) await f.rendered();
  f.component.handleInput("s");
  const result = f.result();
  expect(result?.kind).toBe("session");
  if (result?.kind === "session") {
    expect(result.request.action).toBe("start");
    expect(result.request.target.kind === "ticket" && result.request.target.ticket.id).toBe("T-2");
  }
  pending.resolve({ ticketId: "T-1", receipts: [] });
  await loading;
  f.component.dispose();
});

test("successful refresh clears cached unverified markings using the new snapshot", async () => {
  const pending = deferred<ExplorerSnapshot>();
  let firstRead = true;
  const loader = () => {
    if (!firstRead) return pending.promise;
    firstRead = false;
    return Promise.resolve(data());
  };
  const first = explorer(loader);
  await first.component.load();
  first.component.dispose();
  const second = explorer(loader);
  expect(second.view()).toContain("unverified");
  const loading = second.component.load();
  const updated = data();
  updated.initiatives[0].title = "Freshly validated plan";
  pending.resolve(updated);
  await loading;
  expect(second.view()).toContain("Freshly validated plan");
  expect(second.view()).not.toContain("unverified");
  expect(second.view()).toContain("Last validated");
  second.component.dispose();
});

test("DAG uses canonical GitHub types and local work_status before caching", async () => {
  const snapshot = data();
  snapshot.initiatives[0].rootTicketIds = ["T-1"];
  snapshot.tickets[0].fields = { status: "done" };
  expect((await initiativeDag(snapshot.initiatives[0], snapshot)).text).toContain("UNKNOWN");
  snapshot.tickets[0].fields = { work_status: "claimed" };
  expect((await initiativeDag(snapshot.initiatives[0], snapshot)).text).toContain("IN PROGRESS");
  snapshot.tickets[0].backend = "github";
  snapshot.tickets[0].fields = { labels: ["wayfinder:research"] };
  expect((await initiativeDag(snapshot.initiatives[0], snapshot)).text).toContain("[research]");
  snapshot.tickets[0].fields = { labels: ["wayfinder:map"] };
  expect((await initiativeDag(snapshot.initiatives[0], snapshot)).text).toContain("[map]");
  snapshot.tickets[0].fields = { labels: [] };
  expect((await initiativeDag(snapshot.initiatives[0], snapshot)).text).toContain("[issue]");
});

test("ADR and tracker records with the same numeric ID retain distinct queues, DAG, copies and detail selection", async () => {
  while (copyMode() !== "path") cycleCopyMode();
  const snapshot = data();
  snapshot.tickets[0].id = "0001";
  snapshot.tickets[0].ref = "tracker/tickets/0001.md";
  snapshot.tickets[1].blockedBy = ["0001"];
  snapshot.initiatives[0].ticketIds = ["0001", "T-2"];
  const adr = { ...snapshot.tickets[0], documentType: "adr", ref: "docs/adr/0001.md", title: "Architecture decision" };
  const diagram = await initiativeDag(snapshot.initiatives[0], { ...snapshot, adrs: [adr] });
  expect(diagram.text).toContain("Outside blocker");
  expect(diagram.text).not.toContain("Architecture decision");
  expect([...focusedTicketIds({ ...snapshot, adrs: [adr] }, { kind: "ticket", ticket: adr })]).toEqual([]);
  const trackerCopy = deferred<string>();
  const adrCopy = deferred<string>();
  let copy = trackerCopy.resolve;
  const loader = async () => snapshot;
  const f = explorer(loader, { loadAdrs: async () => [adr], copy: value => copy(value) });
  await f.component.load();
  f.component.handleInput("8");
  expect(f.view()).toContain("Outside blocker");
  expect(f.view()).not.toContain("Architecture decision");
  f.component.handleInput("c");
  expect(await trackerCopy.promise).toBe(`${context.repositoryRoot}/tracker/tickets/0001.md`);
  f.component.handleInput("h");
  f.component.handleInput("\x1b[B"); f.component.handleInput("\x1b[B");
  f.component.handleInput("\r");
  expect(f.view()).toContain("adr / recorded details");
  expect(f.view()).toContain("Architecture decision");
  copy = adrCopy.resolve;
  f.component.handleInput("c");
  expect(await adrCopy.promise).toBe(`${context.repositoryRoot}/docs/adr/0001.md`);
  f.component.handleInput("b");
  const result = f.result();
  if (result?.kind !== "files") throw new Error("Expected ADR navigation");
  const reopened = explorer(loader, { navigation: result.navigation, loadAdrs: async () => [adr] });
  expect(reopened.view()).toContain("Architecture decision");
  expect(reopened.view()).not.toContain("Outside blocker");
  f.component.dispose(); reopened.component.dispose();
});

test("cached description warnings remain visible after scrolling while validation is pending", async () => {
  const snapshot = data();
  snapshot.initiatives[0].body = Array.from({ length: 80 }, (_, index) => `Description paragraph ${index}`).join("\n");
  const pending = deferred<ExplorerSnapshot>();
  let reads = 0;
  const loader = () => ++reads === 1 ? Promise.resolve(snapshot) : pending.promise;
  const first = explorer(loader);
  await first.component.load();
  first.component.dispose();
  const second = explorer(loader);
  const loading = second.component.load();
  try {
    second.component.handleInput("\r");
    second.component.handleInput("d");
    second.component.handleInput("\x1b[6~");
    expect(second.view()).not.toContain("Description paragraph 0");
    expect(second.view().split("\n").at(-1)).toContain("unverified");
    pending.resolve(snapshot);
    await loading;
    expect(second.view().split("\n").at(-1)).not.toContain("unverified");
  } finally {
    pending.resolve(snapshot);
    await loading;
    second.component.dispose();
  }
});
