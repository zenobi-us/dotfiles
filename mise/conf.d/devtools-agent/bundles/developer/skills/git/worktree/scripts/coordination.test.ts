// Disposable repositories exercise the real tracker, receipt, journal, and Git readers.
import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Exec, SharedAgentContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import { coordinateTicket, loadCoordination } from "./coordination";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./workflow";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))); });
const exec: Exec = async (command, args, cwd) => {
  const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { code, stdout: code ? `${stdout}\n${stderr}` : stdout };
};
async function run(command: string, args: string[]): Promise<string> {
  const result = await exec(command, args);
  if (result.code) throw new Error(result.stdout);
  return result.stdout.trim();
}
async function put(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}
async function fixture() {
  const repositoryRoot = await mkdtemp(join(tmpdir(), "worktree-coordination-"));
  directories.push(repositoryRoot);
  const git = (...args: string[]) => run("git", ["-C", repositoryRoot, ...args]);
  await run("git", ["init", "--quiet", "-b", "main", repositoryRoot]);
  await git("config", "user.name", "Fixture");
  await git("config", "user.email", "fixture@example.invalid");
  await git("remote", "add", "origin", `https://github.com/example/${repositoryRoot.split("/").at(-1)}.git`);
  await put(join(repositoryRoot, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
  const ticket = async (id: string, status: string, blockedBy: string[] = [], type = "ticket") => {
    await put(join(repositoryRoot, `tracker/tickets/${id}.md`), `---\nid: ${id}\ntitle: ${id} work\ntype: ${type}\nwork_status: ${status}\nblocked_by: ${JSON.stringify(blockedBy)}\n---\n\nRequirements for ${id}.\n`);
  };
  await ticket("T-1", "unclaimed", ["T-2"]);
  await ticket("T-2", "claimed");
  await ticket("T-3", "claimed");
  await ticket("R-1", "claimed", [], "research");
  await put(join(repositoryRoot, "tracker/initiatives/one/index.md"), "---\nid: one\ntitle: First initiative\n---\n\n## Tickets\n\n- [T-1](../../tickets/T-1.md)\n");
  await put(join(repositoryRoot, "tracker/initiatives/two/index.md"), "---\nid: two\ntitle: Other initiative\n---\n\n## Tickets\n\n- [T-2](../../tickets/T-2.md)\n- [T-3](../../tickets/T-3.md)\n- [R-1](../../tickets/R-1.md)\n");
  await git("add", ".");
  await git("commit", "-m", "Initial tracker");
  await git("switch", "-c", "feature/T-2");
  await put(join(repositoryRoot, "src/shared.ts"), "export const shared = 1;\n");
  await git("add", "src/shared.ts");
  await git("commit", "-m", "T-2 implement shared API");
  const sourceCommit = await git("rev-parse", "HEAD");
  const sourceTree = await git("rev-parse", "HEAD^{tree}");
  const receipt = {
    schema: "worktree-receipt/v1", workflow_id: "T-2", receipt_id: "start-1", phase: "start", event: "phase-start", status: "started", attempt: 1, parent_receipt: null,
    repository: repositoryRoot, worktree: repositoryRoot, workspace_path: repositoryRoot, source_branch: "feature/T-2", base_branch: "main", source_commit: sourceCommit, source_tree: sourceTree,
    created_at: "2026-11-01T00:00:00Z", muxer: "herdr", agent: "omp", pane_id: "pane-2", session_id: "session-2",
    ticket: { id: "T-2", backend: "local-markdown", ref: "tracker/tickets/T-2.md" }, ticket_ref: "tracker/tickets/T-2.md",
    workflow: { store: "repository", root: repositoryRoot, ref: "workflows/T-2" }, inputs: [], outputs: [],
  };
  const receiptPath = join(repositoryRoot, "workflows/T-2/events/start.json");
  await put(receiptPath, JSON.stringify(receipt));
  const context: SharedAgentContext = {
    repositoryRoot, origin: "https://github.com/example/coordination-fixture.git", canonicalOrigin: "github.com/example/coordination-fixture", slug: "coordination-fixture", root: repositoryRoot, sharedRoot: repositoryRoot, candidateSharedRoot: join(repositoryRoot, "shared"), alignmentRoot: repositoryRoot, storage: "repository", mode: "repository",
    layout: { tracker: "tracker", tickets: "tracker/tickets", initiatives: "tracker/initiatives", sources: "sources" },
    routes: { alignment: { adapter: "markdown", store: "repository" }, tickets: { adapter: "local-markdown", store: "repository" }, initiatives: { adapter: "markdown", store: "repository" }, workflows: { adapter: "files", store: "repository" }, evidence: { adapter: "files", inherits: "workflows" }, sources: { adapter: "files", inherits: "alignment" } },
  };
  const inventory: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/T-2", marker: "active", worktree: { path: repositoryRoot } }] }) }
    : exec(command, args, cwd);
  const goalEvent = {
    schema: "worktree-goal/v1", event_id: "reserved-1", parent_event: null, kind: "dispatch_reserved", run_id: "run-two", repository: repositoryRoot,
    workflow: { store: "repository", root: repositoryRoot, ref: "workflows/goal-two" },
    created_at: "2026-11-01T00:00:00Z", frozen_ticket_refs: ["tracker/tickets/T-2.md"], initiative_ref: "tracker/initiatives/two/index.md",
    ticket_ref: "tracker/tickets/T-2.md", phase: "start", coordinator: { session_id: "coordinator-two", muxer: "herdr", pane_id: "parent-pane" },
  };
  return { context, inventory, git, ticket, receipt, receiptPath, goalEvent };
}

async function linkedFixture() {
  const base = await fixture();
  const linked = `${base.context.repositoryRoot}-linked`;
  directories.push(linked);
  await base.git("worktree", "add", "-b", "other-work", linked, "HEAD");
  const inventory: Exec = async (command, args, cwd) => command === "wt"
    ? {
      code: 0, stdout: JSON.stringify({
        schema: 2, items: [
          { branch: "feature/T-2", marker: "active", worktree: { path: base.context.repositoryRoot } },
          { branch: "other-work", worktree: { path: linked } },
        ]
      })
    }
    : base.inventory(command, args, cwd);
  return { ...base, linked, inventory };
}

test("reports another initiative's owner, actual Git paths, and explicit hard prerequisite without treating overlap as a lock", async () => {
  const { context, inventory } = await fixture();
  await put(join(context.repositoryRoot, "src/shared.ts"), "export const shared = 2;\n");
  await put(join(context.repositoryRoot, "src/new file.ts"), "export const added = true;\n");
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.proposed.initiatives).toEqual([{ id: "one", ref: "tracker/initiatives/one/index.md" }]);
  expect(report.hardBlockers).toEqual([{ id: "T-2", ref: "tracker/tickets/T-2.md", status: "claimed", initiatives: [{ id: "two", ref: "tracker/initiatives/two/index.md" }] }]);
  const other = report.streams.find(stream => stream.ticket.id === "T-2")!;
  expect(other.ownership).toBe("active");
  expect(other.owners[0]).toMatchObject({ sessionId: "session-2", workspacePath: context.repositoryRoot, paneId: "pane-2" });
  expect(other.scope.paths).toContain("src/shared.ts");
  expect(other.scope.paths).toContain("src/new file.ts");
  expect(report.comparisons.find(item => item.ticketRef.endsWith("T-2.md"))).toMatchObject({ assessment: "overlap-risk", overlaps: expect.arrayContaining([{ proposed: "src", active: "src/shared.ts" }]) });
  expect(report.streams.some(stream => stream.ticket.id === "R-1")).toBe(false);
  expect(report.assessmentRequired).toBe(true);
}, 60_000);

test("missing proposed or active scope remains unknown, including claimed tickets without receipts", async () => {
  const { context, inventory } = await fixture();
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", [], inventory);
  expect(report.proposed.scope.state).toBe("unknown");
  expect(report.comparisons.every(item => item.assessment === "unknown-scope")).toBe(true);
  expect(report.streams.find(stream => stream.ticket.id === "T-3")?.scope).toMatchObject({ state: "unknown", paths: [] });
}, 60_000);

test("declared scope and directory boundaries remain separate from compatibility and blockers", async () => {
  const { context, inventory, receipt, receiptPath, ticket } = await fixture();
  await ticket("T-1", "unclaimed");
  await put(receiptPath, JSON.stringify({ ...receipt, scope_paths: ["src", "config/settings.json"] }));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src-other"], inventory);
  expect(report.hardBlockers).toEqual([]);
  expect(report.streams.find(stream => stream.ticket.id === "T-2")?.scope.state).toBe("declared");
  expect(report.comparisons.find(item => item.ticketRef.endsWith("T-2.md"))).toMatchObject({ assessment: "distinct-observed-paths", overlaps: [] });
  expect(report.assessmentRequired).toBe(true);
}, 60_000);

test("inventories reservations from other goal journals and retains unverified reconciliation", async () => {
  const { context, inventory, goalEvent } = await fixture();
  const folder = join(context.repositoryRoot, "workflows/goal-two/events");
  const reservationRef = "workflows/goal-two/events/reserved.json";
  await put(join(folder, "reserved.json"), JSON.stringify(goalEvent));
  await put(join(folder, "reconciled.json"), JSON.stringify({ ...goalEvent, event_id: "reconciled-2", parent_event: "reserved-1", kind: "dispatch_reconciled", dispatch_ref: reservationRef, complete_receipt_ref: "workflows/T-2/events/missing.json" }));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.streams.find(stream => stream.ticket.id === "T-2")?.reservations).toEqual([expect.objectContaining({ ref: reservationRef, runId: "run-two", coordinator: { session_id: "coordinator-two", muxer: "herdr", pane_id: "parent-pane" } })]);
}, 60_000);

test.each(["completed", "failed", "blocked"])("releases a reconciled %s reservation only after validated parent completion", async status => {
  const { context, inventory, goalEvent, receipt } = await fixture();
  const folder = join(context.repositoryRoot, "workflows/goal-two/events");
  await put(join(folder, "reserved.json"), JSON.stringify(goalEvent));
  const completeRef = "workflows/T-2/events/complete.json";
  await put(join(context.repositoryRoot, "workflows/T-2/events/result.json"), JSON.stringify({ ...receipt, receipt_id: "implementation-2", parent_receipt: receipt.receipt_id, phase: "implementation", event: "phase-result", status, created_at: "2026-11-02T00:00:00Z" }));
  await put(join(context.repositoryRoot, completeRef), JSON.stringify({ ...receipt, receipt_id: "complete-3", parent_receipt: "implementation-2", event: "phase-complete", status, created_at: "2026-11-03T00:00:00Z" }));
  await put(join(folder, "reconciled.json"), JSON.stringify({ ...goalEvent, event_id: "reconciled-2", parent_event: "reserved-1", kind: "dispatch_reconciled", dispatch_ref: "workflows/goal-two/events/reserved.json", complete_receipt_ref: completeRef }));
  const report = await loadCoordination(context, "tracker/tickets/T-2.md", ["src"], inventory);
  expect(report.proposed.reservations).toEqual([]);
  expect(report.reservationObservations.find(reservation => reservation.ticketRef.endsWith("T-2.md"))?.reconciliationVerified).toBe(true);
}, 60_000);

test("broken goal parent chains and unavailable worktree inventory are visible errors", async () => {
  const { context, inventory, goalEvent } = await fixture();
  await put(join(context.repositoryRoot, "workflows/goal-two/events/reserved.json"), JSON.stringify({ ...goalEvent, parent_event: "missing-parent" }));
  const failedInventory: Exec = async (command, args, cwd) => command === "wt" ? { code: 1, stdout: "inventory unavailable" } : inventory(command, args, cwd);
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], failedInventory);
  expect(report.inventoryComplete).toBe(false);
  expect(report.errors.some(error => error.includes("broken goal parent graph"))).toBe(true);
  expect(report.streams.find(stream => stream.ticket.id === "T-2")?.errors.some(error => error.includes("inventory unavailable"))).toBe(true);
  expect(report.streams.find(stream => stream.ticket.id === "T-2")?.reservations).toHaveLength(1);
}, 60_000);

test("canonical entrypoint and JSON CLI do not change source, index, or receipt bytes", async () => {
  const { context, inventory, git, receiptPath } = await fixture();
  const beforeStatus = await git("status", "--porcelain=v1");
  const beforeReceipt = await readFile(receiptPath, "utf8");
  const beforeIndex = await readFile(join(context.repositoryRoot, ".git/index"));
  await expect(coordinateTicket("T-1", ["src"], inventory, context.repositoryRoot)).rejects.toThrow("canonical reference");
  expect((await coordinateTicket("tracker/tickets/T-1.md", ["src"], inventory, context.repositoryRoot)).schema).toBe("worktree-coordination/v1");
  const script = fileURLToPath(new URL("coordination.ts", import.meta.url));
  const result = await exec(process.execPath, [script, "tracker/tickets/T-1.md", "--json", "--scope", "src"], context.repositoryRoot);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({ schema: "worktree-coordination/v1", proposed: { ticket: { ref: "tracker/tickets/T-1.md" }, scope: { paths: ["src"] } } });
  expect(await git("status", "--porcelain=v1")).toBe(beforeStatus);
  expect(await readFile(receiptPath, "utf8")).toBe(beforeReceipt);
  expect(await readFile(join(context.repositoryRoot, ".git/index"))).toEqual(beforeIndex);
}, 60_000);

test("rejects traversal and glob scope rather than claiming compatibility", async () => {
  const { context, inventory } = await fixture();
  for (const scope of ["../outside", "/absolute", "src/**", "src/../other", "."]) await expect(loadCoordination(context, "tracker/tickets/T-1.md", [scope], inventory)).rejects.toThrow("Scope must");
}, 60_000);

test("Jira's mirror gives complete cross-initiative inventory until a blocker is not in the mirror", async () => {
  const { context, inventory } = await fixture();
  const site = "https://example.atlassian.net";
  await put(join(context.repositoryRoot, "docs/agents/issue-tracker.md"), `---\nbackend: jira\nsite: ${site}\nmirror:\n  root: tracker/jira\n  queries:\n    work: 'project = ABC'\n---\n`);
  const issue = (id: string, blockedBy: string[]) => `---\nschema: "tracker-mirror/v1"\nid: "${id}"\ntitle: "Work ${id}"\ntype: "Task"\nstatus: "To Do"\nstatus_category: "new"\nparent: null\nblocked_by: ${JSON.stringify(blockedBy)}\nref: "${site}/browse/${id}"\n---\n`;
  await put(join(context.repositoryRoot, "tracker/jira/ABC-7.md"), issue("ABC-7", []));
  await put(join(context.repositoryRoot, "tracker/jira/ABC-8.md"), issue("ABC-8", []));
  const jira: SharedAgentContext = { ...context, routes: { ...context.routes, tickets: { adapter: "jira" } } };
  const complete = await loadCoordination(jira, `${site}/browse/ABC-7`, ["src"], inventory);
  expect(complete.inventoryComplete).toBe(true);
  expect(complete.streams.map(stream => stream.ticket.id)).not.toContain("ABC-7");
  expect(complete.errors).toEqual([]);
  await put(join(context.repositoryRoot, "tracker/jira/ABC-8.md"), issue("ABC-8", ["POR-1"]));
  const partial = await loadCoordination(jira, `${site}/browse/ABC-7`, ["src"], inventory);
  expect(partial.inventoryComplete).toBe(false);
  expect(partial.errors).toEqual([expect.stringContaining("Blocker not in the mirror: POR-1.")]);
  expect(partial.assessmentRequired).toBe(true);
}, 60_000);

test("observed Git paths never hide missing planned scope", async () => {
  const { context, inventory } = await fixture();
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["unrelated"], inventory);
  expect(report.streams.find(stream => stream.ticket.id === "T-2")?.scope).toMatchObject({ state: "observed", plannedScope: "unknown" });
  expect(report.comparisons.find(item => item.ticketRef.endsWith("T-2.md"))?.assessment).toBe("unknown-scope");
}, 60_000);

test("the proposed ticket exposes its own outstanding reservation before launch", async () => {
  const { context, inventory, goalEvent } = await fixture();
  await put(join(context.repositoryRoot, "workflows/goal-two/events/reserved.json"), JSON.stringify({ ...goalEvent, ticket_ref: "tracker/tickets/T-1.md", frozen_ticket_refs: ["tracker/tickets/T-1.md"] }));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.proposed.reservations).toEqual([expect.objectContaining({ ticketRef: "tracker/tickets/T-1.md", runId: "run-two" })]);
}, 60_000);

test("completed archives without source workspaces do not require remote finish verification or block unrelated starts", async () => {
  const { context, inventory, git, ticket, receipt, receiptPath } = await fixture();
  await ticket("T-2", "completed");
  await git("switch", "main");
  const removed = join(context.repositoryRoot, "removed-source");
  const historical = { ...receipt, worktree: removed, workspace_path: removed };
  await put(receiptPath, JSON.stringify(historical));
  await put(join(context.repositoryRoot, "workflows/T-2/events/finish.json"), JSON.stringify({
    ...historical, receipt_id: "finish-2", parent_receipt: receipt.receipt_id, phase: "finish", event: "phase-complete",
    status: "FINISHED", created_at: "2026-11-02T00:00:00Z", pushed: true, ticket_completed: true,
    worktree_removed: true, workspace_closed: true, merged_commit: "f".repeat(40), remote: "origin", remote_ref: "refs/heads/main",
  }));
  let archivedObjectReads = 0;
  const execute: Exec = async (command, args, cwd) => {
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: context.repositoryRoot } }, { branch: "feature/T-2" }] }) };
    if (command === "git" && args.includes(`${receipt.source_commit}^{tree}`)) archivedObjectReads++;
    return inventory(command, args, cwd);
  };
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], execute);
  expect(report.streams.some(stream => stream.ticket.id === "T-2")).toBe(false);
  expect(report.hardBlockers).toEqual([]);
  expect(report.inventoryComplete).toBe(true);
  expect(archivedObjectReads).toBe(0);
}, 60_000);

test("completed retained workspaces remain visible as cleanup-only without becoming compatibility blockers", async () => {
  const { context, inventory, ticket } = await fixture();
  await ticket("T-2", "completed");
  await put(join(context.repositoryRoot, "workflows/T-2/events/broken.json"), JSON.stringify({ schema: "unknown-receipt/v99" }));
  const execute: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/T-2", worktree: { path: context.repositoryRoot } }] }) }
    : inventory(command, args, cwd);
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], execute);
  const retained = report.streams.find(stream => stream.ticket.id === "T-2")!;
  expect(retained.cleanupOnly).toBe(true);
  expect(retained.owners.some(owner => owner.workspacePath === context.repositoryRoot)).toBe(true);
  expect(retained.errors.length).toBeGreaterThan(0);
  expect(report.comparisons.find(comparison => comparison.ticketRef.endsWith("T-2.md"))?.assessment).toBe("cleanup-only");
  expect(report.inventoryComplete).toBe(true);
  expect(report.hardBlockers).toEqual([]);
}, 60_000);

test("completed integration candidates remain visible when their source workspaces are absent", async () => {
  const { context, inventory, git, ticket, receipt, receiptPath } = await fixture();
  await ticket("T-2", "completed");
  await git("switch", "-c", "integration-candidate");
  const removed = join(context.repositoryRoot, "removed-source");
  await put(receiptPath, JSON.stringify({ ...receipt, worktree: removed, workspace_path: removed, candidate_workspace: context.repositoryRoot, candidate_branch: "integration-candidate" }));
  const execute: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "integration-candidate", worktree: { path: context.repositoryRoot } }] }) }
    : inventory(command, args, cwd);
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], execute);
  const retained = report.streams.find(stream => stream.ticket.id === "T-2")!;
  expect(retained.cleanupOnly).toBe(true);
  expect(retained.owners).toContainEqual({ ref: "tracker/tickets/T-2.md", workspacePath: context.repositoryRoot, sourceBranch: "integration-candidate" });
  expect(report.inventoryComplete).toBe(true);
}, 60_000);

test("a reservation held only in another verified linked checkout prevents a duplicate canonical-ticket dispatch", async () => {
  const { context, linked, inventory, goalEvent } = await linkedFixture();
  const eventPath = join(linked, "workflows/goal-two/events/reserved.json");
  await put(eventPath, JSON.stringify({ ...goalEvent, ticket_ref: "tracker/tickets/T-1.md", frozen_ticket_refs: ["tracker/tickets/T-1.md"] }));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.checkouts).toContain(linked);
  expect(report.proposed.reservations).toEqual([expect.objectContaining({ ticketRef: "tracker/tickets/T-1.md", locations: [eventPath] })]);
}, 60_000);

test("byte-identical copied journals count once and inconsistent linked event copies stay ambiguous", async () => {
  const { context, linked, inventory, goalEvent } = await linkedFixture();
  const event = { ...goalEvent, ticket_ref: "tracker/tickets/T-1.md", frozen_ticket_refs: ["tracker/tickets/T-1.md"] };
  const primaryPath = join(context.repositoryRoot, "workflows/goal-two/events/reserved.json");
  const linkedPath = join(linked, "workflows/goal-two/events/reserved.json");
  await put(primaryPath, JSON.stringify(event));
  await put(linkedPath, JSON.stringify(event));
  let report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.proposed.reservations).toHaveLength(1);
  expect(report.proposed.reservations[0]?.locations).toEqual([primaryPath, linkedPath]);
  await put(linkedPath, JSON.stringify({ ...event, run_id: "conflicting-run" }));
  report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.proposed.reservations).toHaveLength(2);
  expect(report.proposed.reservations.every(reservation => reservation.ambiguous)).toBe(true);
  expect(report.errors.some(error => error.includes("inconsistent goal event ID"))).toBe(true);
}, 60_000);

test("linked-checkout-only phase receipts contribute their actual workspace owner and Git scope", async () => {
  const { context, linked, inventory, receipt } = await linkedFixture();
  await put(join(linked, "workflows/T-2/events/linked-start.json"), JSON.stringify({
    ...receipt, receipt_id: "linked-start-2", source_branch: "other-work", worktree: linked, workspace_path: linked,
    session_id: "linked-session", scope_paths: ["linked-only"],
  }));
  await put(join(linked, "linked-only/new.ts"), "export const linked = true;\n");
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["linked-only"], inventory);
  const stream = report.streams.find(stream => stream.ticket.id === "T-2")!;
  expect(stream.owners).toContainEqual(expect.objectContaining({ workspacePath: linked, sessionId: "linked-session" }));
  expect(stream.scope.paths).toContain("linked-only/new.ts");
  expect(report.comparisons.find(comparison => comparison.ticketRef.endsWith("T-2.md"))?.assessment).toBe("overlap-risk");
}, 60_000);

test("an independent damaged workflow remains a scoped assessment issue rather than a direct prerequisite blocker", async () => {
  const { context, inventory, ticket, receipt, receiptPath } = await fixture();
  await ticket("T-1", "unclaimed");
  const missingSource = join(context.repositoryRoot, "unavailable-other-source");
  await put(receiptPath, JSON.stringify({ ...receipt, worktree: missingSource, workspace_path: missingSource, scope_paths: ["other-feature"], changed_files: ["other-feature/file.ts"] }));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["independent-feature"], inventory);
  expect(report.inventoryComplete).toBe(false);
  expect(report.hardBlockers).toEqual([]);
  expect(report.proposed.reservations).toEqual([]);
  expect(report.streams.find(stream => stream.ticket.id === "T-2")?.errors.length).toBeGreaterThan(0);
  expect(report.comparisons.find(comparison => comparison.ticketRef.endsWith("T-2.md"))?.assessment).toBe("distinct-observed-paths");
  expect(report.assessmentRequired).toBe(true);
}, 60_000);

test("inconsistent linked ticket copies remain explicit and cannot clear a direct prerequisite", async () => {
  const { context, linked, inventory } = await linkedFixture();
  const path = join(linked, "tracker/tickets/T-2.md");
  await put(path, (await readFile(path, "utf8")).replace("work_status: claimed", "work_status: completed"));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.ambiguities).toEqual([expect.objectContaining({ ref: "tracker/tickets/T-2.md", copies: expect.arrayContaining([expect.objectContaining({ checkout: linked }), expect.objectContaining({ checkout: context.repositoryRoot })]) })]);
  expect(report.hardBlockers).toContainEqual(expect.objectContaining({ id: "T-2", status: "claimed" }));
}, 60_000);

test("coordination reports an unrelated malformed ticket while ordinary snapshots remain strict", async () => {
  const { context, inventory, ticket } = await fixture();
  await ticket("T-1", "unclaimed");
  await put(join(context.repositoryRoot, "tracker/tickets/T-3.md"), "---\nschema: tracker-ticket/v99\nid: T-3\ntitle: Invalid unrelated record\nwork_status: claimed\nblocked_by: []\n---\n");
  await expect(loadExplorerSnapshot(context, inventory)).rejects.toThrow("Unreadable record");
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["independent-feature"], inventory);
  expect(report.inventoryComplete).toBe(false);
  expect(report.hardBlockers).toEqual([]);
  expect(report.proposed.scope).toMatchObject({ state: "declared", paths: ["independent-feature"] });
  expect(report.recordDiagnostics).toContainEqual(expect.objectContaining({ checkout: context.repositoryRoot, ref: "tracker/tickets/T-3.md" }));
  expect(report.streams.some(stream => stream.ticket.id === "T-3")).toBe(false);
}, 60_000);

test("a malformed direct blocker remains unresolved in partial coordination inventory", async () => {
  const { context, inventory } = await fixture();
  await put(join(context.repositoryRoot, "tracker/tickets/T-2.md"), "---\nschema: tracker-ticket/v99\nid: T-2\ntitle: Invalid prerequisite\nwork_status: completed\nblocked_by: []\n---\n");
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.hardBlockers).toContainEqual(expect.objectContaining({ id: "T-2", status: "unknown" }));
  expect(report.recordDiagnostics).toContainEqual(expect.objectContaining({ ref: "tracker/tickets/T-2.md" }));
}, 60_000);

test("a malformed proposed ticket fails explicitly instead of becoming an empty compatible inventory", async () => {
  const { context, inventory } = await fixture();
  await put(join(context.repositoryRoot, "tracker/tickets/T-1.md"), "---\nschema: tracker-ticket/v99\nid: T-1\ntitle: Invalid proposed record\nwork_status: unclaimed\nblocked_by: []\n---\n");
  await expect(loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory)).rejects.toThrow("Proposed ticket record is invalid");
}, 60_000);

test("a malformed prerequisite copy cannot be cleared by a completed record in another checkout", async () => {
  const { context, linked, inventory } = await linkedFixture();
  await put(join(context.repositoryRoot, "tracker/tickets/T-2.md"), "---\nschema: tracker-ticket/v99\nid: T-2\ntitle: Invalid prerequisite copy\nwork_status: completed\nblocked_by: []\n---\n");
  const path = join(linked, "tracker/tickets/T-2.md");
  await put(path, (await readFile(path, "utf8")).replace("work_status: claimed", "work_status: completed"));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.hardBlockers).toContainEqual(expect.objectContaining({ id: "T-2", status: "unknown" }));
  expect(report.recordDiagnostics).toContainEqual(expect.objectContaining({ checkout: context.repositoryRoot, ref: "tracker/tickets/T-2.md" }));
}, 60_000);

test("coordination never invokes remote publication checks or repository history scans for stale archived copies", async () => {
  const { context, linked, inventory, git, ticket, receipt, receiptPath } = await linkedFixture();
  await ticket("T-2", "completed");
  await git("switch", "main");
  const removed = join(context.repositoryRoot, "removed-source");
  await put(receiptPath, JSON.stringify({ ...receipt, worktree: removed, workspace_path: removed }));
  const forbidden: string[][] = [];
  const execute: Exec = async (command, args, cwd) => {
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: context.repositoryRoot } }, { branch: "other-work", worktree: { path: linked } }] }) };
    if (command === "git" && (args.some(arg => ["ls-remote", "log", "diff-tree", "merge-base"].includes(arg)) || args.includes(`${receipt.source_commit}^{tree}`))) {
      forbidden.push(args);
      return { code: 1, stdout: "Coordination must not inspect publication or repository history." };
    }
    return inventory(command, args, cwd);
  };
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["independent"], execute);
  expect(forbidden).toEqual([]);
  expect(report.hardBlockers).toEqual([]);
  expect(report.streams.some(stream => stream.ticket.id === "T-2")).toBe(false);
  expect(report.ambiguities.some(item => item.ref === "tracker/tickets/T-2.md")).toBe(true);
}, 60_000);

test("coordination envelope observations never claim fully validated workflow history", async () => {
  const { context, inventory } = await fixture();
  const snapshot = await loadExplorerSnapshot(context, inventory);
  const ticket = snapshot.tickets.find(ticket => ticket.id === "T-2")!;
  const forbidden: string[][] = [];
  const execute: Exec = async (command, args, cwd) => {
    if (command === "git" && (args.includes("log") || args.includes("ls-remote") || args.includes("--verify"))) {
      forbidden.push(args);
      return { code: 1, stdout: "Observation mode must not verify source objects or publication." };
    }
    return inventory(command, args, cwd);
  };
  const workflow = await loadTicketWorkflow(context, ticket, execute, { mode: "coordination" });
  expect(workflow.inventory).toEqual({ envelopesValid: true });
  expect(workflow.inspection?.historyValid).toBe(false);
  expect(workflow.inspection?.source.state).toBe("unknown");
  expect(forbidden).toEqual([]);
}, 60_000);

test("unpublished drift summaries preserve retrieval references and digests without duplicating full tickets", async () => {
  const { context, linked, inventory } = await linkedFixture();
  const path = join(linked, "tracker/tickets/T-2.md");
  await put(path, (await readFile(path, "utf8")).replace("work_status: claimed", "work_status: completed"));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  const copies = report.ambiguities.find(item => item.ref === "tracker/tickets/T-2.md")!.copies;
  expect(copies).toContainEqual(expect.objectContaining({ checkout: linked, ref: "tracker/tickets/T-2.md", id: "T-2", backend: "local-markdown", status: "completed", blockedBy: [] }));
  expect(new Set(copies.map(copy => copy.snapshotDigest)).size).toBe(2);
  for (const copy of copies) {
    expect(copy.snapshotDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(copy).not.toHaveProperty("ticket");
    expect(copy).not.toHaveProperty("body");
    expect(copy).not.toHaveProperty("fields");
  }
}, 60_000);

test("valid-looking wrong-source envelopes cannot clear the proposed ticket's reconciled reservation", async () => {
  const { context, inventory, goalEvent, receipt } = await fixture();
  const own = {
    ...receipt, workflow_id: "T-1", receipt_id: "own-start-1", source_tree: "f".repeat(40),
    ticket: { id: "T-1", backend: "local-markdown", ref: "tracker/tickets/T-1.md" }, ticket_ref: "tracker/tickets/T-1.md",
    workflow: { store: "repository", root: context.repositoryRoot, ref: "workflows/T-1" }
  };
  await put(join(context.repositoryRoot, "workflows/T-1/events/start.json"), JSON.stringify(own));
  await put(join(context.repositoryRoot, "workflows/T-1/events/result.json"), JSON.stringify({ ...own, receipt_id: "own-implementation-2", parent_receipt: own.receipt_id, phase: "implementation", event: "phase-result", status: "completed", created_at: "2026-11-02T00:00:00Z" }));
  const completeRef = "workflows/T-1/events/complete.json";
  await put(join(context.repositoryRoot, completeRef), JSON.stringify({ ...own, receipt_id: "own-complete-3", parent_receipt: "own-implementation-2", event: "phase-complete", status: "completed", created_at: "2026-11-03T00:00:00Z" }));
  const goal = { ...goalEvent, ticket_ref: "tracker/tickets/T-1.md", frozen_ticket_refs: ["tracker/tickets/T-1.md"] };
  await put(join(context.repositoryRoot, "workflows/goal-two/events/reserved.json"), JSON.stringify(goal));
  await put(join(context.repositoryRoot, "workflows/goal-two/events/reconciled.json"), JSON.stringify({ ...goal, event_id: "reconciled-2", parent_event: goal.event_id, kind: "dispatch_reconciled", dispatch_ref: "workflows/goal-two/events/reserved.json", complete_receipt_ref: completeRef }));
  let fullSourceChecks = 0;
  const execute: Exec = async (command, args, cwd) => {
    if (command === "git" && args.includes(`${own.source_commit}^{tree}`)) fullSourceChecks++;
    return inventory(command, args, cwd);
  };
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], execute);
  expect(fullSourceChecks).toBeGreaterThan(0);
  expect(report.proposed.reservations).toHaveLength(1);
  expect(report.proposed.reservations[0]).toMatchObject({ reconciledReceipt: completeRef, reconciliationVerified: false });
  expect(report.proposed.reservations[0]?.verificationError).toContain("source_tree");
}, 60_000);

test("a linked owner of the proposed ticket remains visible without a goal reservation or receipt", async () => {
  const { context, linked, inventory } = await linkedFixture();
  await run("git", ["-C", linked, "switch", "-c", "feature/T-1"]);
  const execute: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/T-2", worktree: { path: context.repositoryRoot } }, { branch: "feature/T-1", marker: "active", worktree: { path: linked } }] }) }
    : inventory(command, args, cwd);
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], execute);
  expect(report.proposed.reservations).toEqual([]);
  expect(report.proposed.ownership).toBe("active");
  expect(report.proposed.owners).toContainEqual(expect.objectContaining({ ref: "tracker/tickets/T-1.md", workspacePath: linked, sourceBranch: "feature/T-1" }));
  expect(report.proposed.sourceObservations).toContainEqual(expect.objectContaining({ source: expect.objectContaining({ state: "available", path: linked }) }));
}, 60_000);

test("another stream's envelope-only reconciliation stays observable without triggering full verification", async () => {
  const { context, inventory, goalEvent, receipt } = await fixture();
  const completeRef = "workflows/T-2/events/complete.json";
  await put(join(context.repositoryRoot, "workflows/T-2/events/result.json"), JSON.stringify({ ...receipt, receipt_id: "implementation-2", parent_receipt: receipt.receipt_id, phase: "implementation", event: "phase-result", status: "completed", created_at: "2026-11-02T00:00:00Z" }));
  await put(join(context.repositoryRoot, completeRef), JSON.stringify({ ...receipt, receipt_id: "complete-3", parent_receipt: "implementation-2", event: "phase-complete", status: "completed", created_at: "2026-11-03T00:00:00Z" }));
  await put(join(context.repositoryRoot, "workflows/goal-two/events/reserved.json"), JSON.stringify(goalEvent));
  await put(join(context.repositoryRoot, "workflows/goal-two/events/reconciled.json"), JSON.stringify({ ...goalEvent, event_id: "reconciled-2", parent_event: goalEvent.event_id, kind: "dispatch_reconciled", dispatch_ref: "workflows/goal-two/events/reserved.json", complete_receipt_ref: completeRef }));
  let fullSourceChecks = 0;
  const execute: Exec = async (command, args, cwd) => {
    if (command === "git" && (args.includes(`${receipt.source_commit}^{tree}`) || args.includes("log") || args.includes("ls-remote"))) fullSourceChecks++;
    return inventory(command, args, cwd);
  };
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], execute);
  expect(fullSourceChecks).toBe(0);
  expect(report.streams.find(stream => stream.ticket.id === "T-2")?.reservations).toHaveLength(1);
  expect(report.reservationObservations.find(reservation => reservation.ticketRef.endsWith("T-2.md"))?.reconciliationVerified).not.toBe(true);
}, 60_000);

test("noncanonical journal kinds remain visible and cannot reconcile reservations", async () => {
  const { context, inventory, goalEvent } = await fixture();
  const directory = join(context.repositoryRoot, "workflows/goal-two/events");
  await put(join(directory, "reserved.json"), JSON.stringify(goalEvent));
  await put(join(directory, "reconciled.json"), JSON.stringify({
    ...goalEvent, event_id: "reconciled-2", parent_event: goalEvent.event_id, kind: "dispatch-reconciled",
    dispatch_ref: "workflows/goal-two/events/reserved.json", complete_receipt_ref: "workflows/T-2/events/complete.json",
  }));
  const report = await loadCoordination(context, "tracker/tickets/T-1.md", ["src"], inventory);
  expect(report.errors.some(error => error.includes("[noncanonical_goal_event_kind]"))).toBe(true);
  expect(report.reservationObservations).toContainEqual(expect.objectContaining({
    ref: "workflows/goal-two/events/reserved.json", ambiguous: true,
  }));
  expect(report.reservationObservations.find(item => item.ref.endsWith("/reserved.json"))?.reconciledReceipt).toBeUndefined();
}, 60_000);
