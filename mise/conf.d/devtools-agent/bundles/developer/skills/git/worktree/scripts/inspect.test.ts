// Uses disposable Git repositories; inspection itself must not write workflow or source state.
import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectTicket } from "./inspect";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./workflow";
import { recoveryDecision } from "./recovery";
import { inspectWorkflow } from "./inspection";
import type { Exec, SharedAgentContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { ExplorerTicket, TicketWorkflow } from "../../../../../agent-core/extensions/pi-shared-context/model";
import { prepareIntegration } from "./integration";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const exec: Exec = async (command, args, cwd) => {
  const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout: code ? `${stdout}\n${stderr}` : stdout, code };
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
  const root = await mkdtemp(join(tmpdir(), "worktree-inspect-"));
  directories.push(root);
  const repositoryRoot = join(root, "repo");
  await run("git", ["init", "--quiet", "-b", "main", repositoryRoot]);
  await run("git", ["-C", repositoryRoot, "config", "user.name", "Fixture"]);
  await run("git", ["-C", repositoryRoot, "config", "user.email", "fixture@example.invalid"]);
  await put(join(repositoryRoot, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
  await put(join(repositoryRoot, "tracker/tickets/T-1.md"), "---\nid: T-1\ntitle: Recover ticket\nwork_status: open\nblocked_by: []\n---\n");
  await run("git", ["-C", repositoryRoot, "add", "."]);
  await run("git", ["-C", repositoryRoot, "commit", "-m", "Initial tracker"]);
  const context: SharedAgentContext = {
    repositoryRoot, origin: "https://github.com/example/inspection-fixture.git", canonicalOrigin: "github.com/example/inspection-fixture", slug: "inspection-fixture", root: repositoryRoot, sharedRoot: repositoryRoot, candidateSharedRoot: join(root, "shared"), alignmentRoot: repositoryRoot, storage: "repository", mode: "repository",
    layout: { tracker: "tracker", tickets: "tracker/tickets", initiatives: "tracker/initiatives", sources: "sources" },
    routes: { alignment: { adapter: "markdown", store: "repository" }, tickets: { adapter: "local-markdown", store: "repository" }, initiatives: { adapter: "markdown", store: "repository" }, workflows: { adapter: "files", store: "repository" }, evidence: { adapter: "files", inherits: "workflows" }, sources: { adapter: "files", inherits: "alignment" } },
  };
  const ticket: ExplorerTicket = { id: "T-1", title: "Recover ticket", ref: "tracker/tickets/T-1.md", backend: "local-markdown", status: "open", blockedBy: [], body: "" };
  return { root, context, ticket };
}

test("active receipts retain their base-checkout identity when inspected from a linked checkout", async () => {
  const { context, ticket, root } = await fixture();
  const base = context.repositoryRoot;
  const source = join(root, "source");
  await run("git", ["-C", base, "worktree", "add", "-b", "feature/T-1", source]);
  const linked = { ...context, repositoryRoot: source, root: source, sharedRoot: source, alignmentRoot: source };
  const commit = await run("git", ["-C", source, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", source, "rev-parse", "HEAD^{tree}"]);
  const event = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, receipt_id: "start-1",
    phase: "start", event: "phase-start", status: "started", attempt: 1, parent_receipt: null,
    repository: base, worktree: source, workspace_path: source, source_branch: "feature/T-1", base_branch: "main",
    source_commit: commit, source_tree: tree, muxer: "herdr", pane_id: "1", agent: "omp", session_id: "parent",
    created_at: "2026-10-01T00:00:00Z", ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend },
    ticket_ref: ticket.ref, workflow: { root: base, store: "repository", ref: "workflows/T-1" }, inputs: [], outputs: [],
  };
  const path = join(source, "workflows/T-1/events/start.json");
  const original = JSON.stringify(event);
  await put(path, original);
  const inventory: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/T-1", worktree: { path: source } }] }) }
    : exec(command, args, cwd);
  let workflow = await loadTicketWorkflow(linked, ticket, inventory);
  expect(workflow.events?.find(item => item.ref.endsWith("/start.json"))?.error).toBeUndefined();
  expect(workflow.receipts.map(item => item.id)).toContain("start-1");
  expect(await readFile(path, "utf8")).toBe(original);

  const completionPath = join(source, "workflows/T-1/events/complete.json");
  const completion = {
    ...event, receipt_id: "complete-2", parent_receipt: "start-1", event: "phase-complete",
    status: "blocked", pane_id: null, created_at: "2026-10-02T00:00:00Z"
  };
  await put(completionPath, JSON.stringify(completion));
  workflow = await loadTicketWorkflow(linked, ticket, inventory);
  expect(workflow.receipts.map(item => item.id)).toContain("complete-2");
  await put(completionPath, JSON.stringify({ ...completion, session_id: null }));
  workflow = await loadTicketWorkflow(linked, ticket, inventory);
  expect(workflow.events?.find(item => item.ref.endsWith("/complete.json"))?.error).toContain("pane_id");
  await put(completionPath, JSON.stringify({
    ...completion, phase: "implementation", event: "phase-result",
    evidence: { store: "repository", ref: "workflows/T-1/artifacts/evidence/run" }
  }));
  workflow = await loadTicketWorkflow(linked, ticket, inventory);
  expect(workflow.events?.find(item => item.ref.endsWith("/complete.json"))?.error).toContain("pane_id");
  await rm(completionPath);

  const baseRecord = join(base, "workflows/T-1/events/start.json");
  await put(baseRecord, original);
  workflow = await loadTicketWorkflow(context, ticket, inventory);
  expect(workflow.receipts.map(item => item.id)).toContain("start-1");
  expect(await readFile(baseRecord, "utf8")).toBe(original);
  await put(baseRecord, JSON.stringify({ ...event, workflow: { ...event.workflow, root: source } }));
  workflow = await loadTicketWorkflow(context, ticket, inventory);
  expect(workflow.receipts.map(item => item.id)).toContain("start-1");

  const other = join(root, "unrelated");
  await run("git", ["init", "--quiet", other]);
  await put(path, JSON.stringify({ ...event, repository: other, workflow: { ...event.workflow, root: source } }));
  workflow = await loadTicketWorkflow(linked, ticket, inventory);
  expect(workflow.events?.find(item => item.ref.endsWith("/start.json"))?.error).toContain("Receipt repository does not match");
  expect(workflow.inspection?.historyValid).toBe(false);
  await put(baseRecord, JSON.stringify({ ...event, worktree: other, workspace_path: other, workflow: { ...event.workflow, root: other } }));
  workflow = await loadTicketWorkflow(context, ticket, inventory);
  expect(workflow.events?.find(item => item.ref.endsWith("/start.json"))?.error).toContain("workflow.root");
});

test("parent operator approvals without a child pane retain the review parent chain", async () => {
  const { context, ticket } = await fixture();
  const root = context.repositoryRoot;
  const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", root, "rev-parse", "HEAD^{tree}"]);
  const approval = {
    schema: "worktree-receipt/v2", workflow_id: ticket.id, receipt_id: "approval-1",
    phase: "review", event: "operator-approval", status: "approved", attempt: 0, parent_receipt: null,
    repository: root, worktree: root, workspace_path: root, source_branch: "main", base_branch: "main",
    source_commit: commit, source_tree: tree, muxer: "herdr-app", pane_id: null, agent: "omp", session_id: "parent",
    created_at: "2026-10-01T00:00:00Z", ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend },
    ticket_ref: ticket.ref, workflow: { root, store: "repository", ref: "workflows/T-1" }, inputs: [], outputs: [],
  };
  const approvalPath = join(root, "workflows/T-1/events/approval.yaml");
  const original = Bun.YAML.stringify(approval);
  await put(approvalPath, original);
  await put(join(root, "workflows/T-1/events/start.json"), JSON.stringify({
    ...approval, receipt_id: "review-start-2", parent_receipt: "approval-1",
    event: "phase-start", status: "started", attempt: 1, created_at: "2026-10-02T00:00:00Z",
  }));
  const inventory: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: root } }] }) }
    : exec(command, args, cwd);
  const workflow = await loadTicketWorkflow(context, ticket, inventory);
  expect(workflow.error).toBeUndefined();
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(workflow.receipts.find(item => item.id === "review-start-2")?.parentReceipt).toBe("approval-1");
  expect(await readFile(approvalPath, "utf8")).toBe(original);

  await put(approvalPath, Bun.YAML.stringify({ ...approval, session_id: null }));
  const anonymous = await loadTicketWorkflow(context, ticket, inventory);
  expect(anonymous.events?.find(item => item.ref.endsWith("/approval.yaml"))?.error).toContain("pane_id");
  expect(anonymous.inspection?.historyValid).toBe(false);
}, 60_000);

test("canonical CLI inspection resolves the current adapter and prints real JSON without editing tracked state", async () => {
  const { context, root, ticket } = await fixture();
  await run("git", ["-C", context.repositoryRoot, "remote", "add", "origin", `https://github.com/example/${root.split("/").at(-1)}.git`]);
  const inventory: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) } : exec(command, args, cwd);
  const result = await inspectTicket(ticket.ref, inventory, context.repositoryRoot);
  expect(result.ticket.ref).toBe(ticket.ref);
  expect(result.workflow.inspection?.historyValid).toBe(true);
  expect(result.decision.action).toBe("start");
  await expect(inspectTicket("T-1", inventory, context.repositoryRoot)).rejects.toThrow("canonical reference");
  const status = await run("git", ["-C", context.repositoryRoot, "status", "--porcelain=v1"]);
  for (const script of ["inspect.ts", "router.ts"]) {
    const path = fileURLToPath(new URL(script, import.meta.url));
    const args = script === "router.ts" ? ["inspect", ticket.ref, "--json"] : [ticket.ref, "--json"];
    const child = Bun.spawn([process.execPath, path, ...args], { cwd: context.repositoryRoot, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    if (code) throw new Error(stderr || stdout);
    const json = JSON.parse(stdout);
    expect(json.ticket.ref).toBe(ticket.ref);
    expect(json.decision).toMatchObject({ action: "start" });
    expect(await run("git", ["-C", context.repositoryRoot, "status", "--porcelain=v1"])).toBe(status);
  }
}, 60_000);

const JIRA_SITE = "https://example.atlassian.net";
function mirrorIssue(id: string, fields: { type?: string; status?: string; category?: string | null; parent?: string | null; blockedBy?: string[]; mirrorStatus?: string; schema?: string; ref?: string; body?: string } = {}): string {
  const lines = [
    `schema: ${JSON.stringify(fields.schema ?? "tracker-mirror/v1")}`, `id: "${id}"`, `title: "Title ${id}"`, `type: "${fields.type ?? "Story"}"`,
    `status: "${fields.status ?? "To Do"}"`, ...(fields.category === null ? [] : [`status_category: "${fields.category ?? "new"}"`]), `parent: ${JSON.stringify(fields.parent ?? null)}`,
    `blocked_by: ${JSON.stringify(fields.blockedBy ?? [])}`, `queries: ["epics"]`, `jira_updated: "2026-09-21T17:25:25.526+1000"`, `synced_at: "2026-11-12T11:19:39.356Z"`,
    `ref: "${fields.ref ?? `${JIRA_SITE}/browse/${id}`}"`, ...(fields.mirrorStatus ? [`mirror_status: ${JSON.stringify(fields.mirrorStatus)}`] : []),
  ];
  return `---\n${lines.join("\n")}\n---\n${fields.body ? `\n${fields.body}\n` : ""}`;
}
async function jiraFixture(issues: Record<string, string> | null, definition = `---\nbackend: jira\nsite: ${JIRA_SITE}\nmirror:\n  root: tracker/jira\n  queries:\n    epics: 'issuetype = Epic'\n---\n`) {
  const { context } = await fixture();
  await put(join(context.repositoryRoot, "docs/agents/issue-tracker.md"), definition);
  if (issues) {
    await mkdir(join(context.repositoryRoot, "tracker/jira"), { recursive: true });
    for (const [id, content] of Object.entries(issues)) await put(join(context.repositoryRoot, "tracker/jira", `${id}.md`), content);
  }
  const jiraContext: SharedAgentContext = { ...context, routes: { ...context.routes, tickets: { adapter: "jira" } } };
  const execute: Exec = async (command, args, cwd) => {
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) };
    if (command === "twg") throw new Error("Unit tests must not call twg.");
    return exec(command, args, cwd);
  };
  return { context: jiraContext, execute };
}

test("jira snapshot reads every mirror file without a scope", async () => {
  const { context, execute } = await jiraFixture({
    "ABC-1": mirrorIssue("ABC-1", { type: "Epic", status: "In Progress", category: "indeterminate", body: "Epic body" }),
    "ABC-2": mirrorIssue("ABC-2", { parent: "ABC-1", blockedBy: ["ABC-3"] }),
    "ABC-3": mirrorIssue("ABC-3", { parent: "ABC-1", status: "Done", category: "done", mirrorStatus: "stale" }),
    "ABC-4": mirrorIssue("ABC-4", { type: "Sub-task", parent: "ABC-2" }),
    "ABC-5": mirrorIssue("ABC-5", { parent: "ABC-99" }),
    "ABC-6": mirrorIssue("ABC-6"),
  });
  const snapshot = await loadExplorerSnapshot(context, execute);
  expect(snapshot.backend).toBe("jira");
  expect(snapshot.tickets.map(item => item.id).sort()).toEqual(["ABC-1", "ABC-2", "ABC-3", "ABC-4", "ABC-5", "ABC-6"]);
  const epic = snapshot.initiatives.find(item => item.id === "ABC-1")!;
  expect(epic).toMatchObject({ title: "Title ABC-1", ref: `${JIRA_SITE}/browse/ABC-1`, body: "Epic body", rootTicketIds: ["ABC-2", "ABC-3"] });
  expect(epic.ticketIds.sort()).toEqual(["ABC-2", "ABC-3", "ABC-4"]);
  const ungrouped = snapshot.initiatives.find(item => item.group)!;
  expect(ungrouped).toMatchObject({ title: "Ungrouped", ref: `${JIRA_SITE}/issues` });
  expect(ungrouped.ticketIds.sort()).toEqual(["ABC-5", "ABC-6"]);
  expect(snapshot.tickets.find(item => item.id === "ABC-1")).toMatchObject({ documentType: "epic", status: "in_progress", backend: "jira" });
  expect(snapshot.tickets.find(item => item.id === "ABC-2")).toMatchObject({ documentType: "issue", status: "todo", blockedBy: ["ABC-3"], fields: { issueType: "Story", status: "To Do", parent: "ABC-1" } });
  expect(snapshot.tickets.find(item => item.id === "ABC-3")).toMatchObject({ status: "done", fields: { stale: true } });
  expect(snapshot.tickets.find(item => item.id === "ABC-2")!.fields!.stale).toBeUndefined();
}, 60_000);

test("jira scoped load reads one ticket and its blockers from the mirror", async () => {
  const issues = (category: string) => ({ "ABC-3": mirrorIssue("ABC-3", { status: "Code Review", category }), "ABC-7": mirrorIssue("ABC-7", { type: "Dev bug", blockedBy: ["ABC-3"], body: "Body" }), "ABC-8": mirrorIssue("ABC-8") });
  const { context, execute } = await jiraFixture(issues("indeterminate"));
  const jira = `${JIRA_SITE}/browse/ABC-7`;
  const decide = async () => {
    const snapshot = await loadExplorerSnapshot(context, execute, { ref: jira });
    expect(snapshot.tickets.map(item => item.id).sort()).toEqual(["ABC-3", "ABC-7"]);
    const ticket = snapshot.tickets.find(item => item.ref === jira)!;
    return { ticket, decision: recoveryDecision(ticket, snapshot, await loadTicketWorkflow(context, ticket, execute)) };
  };
  const blocked = await decide();
  expect(blocked.ticket).toMatchObject({ id: "ABC-7", backend: "jira", status: "todo", fields: { issueType: "Dev bug", status: "To Do" }, documentType: "issue", blockedBy: ["ABC-3"], body: "Body" });
  expect(blocked.decision).toMatchObject({ mode: "blocked", reason: "Unresolved prerequisites: ABC-3." });
  await put(join(context.repositoryRoot, "tracker/jira/ABC-3.md"), issues("done")["ABC-3"]);
  expect((await decide()).decision).toMatchObject({ action: "start", mode: "begin" });
  await put(join(context.repositoryRoot, "tracker/jira/ABC-3.md"), issues("archived")["ABC-3"]);
  await expect(loadExplorerSnapshot(context, execute, { ref: jira })).rejects.toThrow("category archived");
}, 60_000);

test("jira snapshot rejects blocker cycles", async () => {
  const cycle = await jiraFixture({ "ABC-1": mirrorIssue("ABC-1", { blockedBy: ["ABC-2", "ABC-404"] }), "ABC-2": mirrorIssue("ABC-2", { blockedBy: ["ABC-1"] }) });
  await expect(loadExplorerSnapshot(cycle.context, cycle.execute)).rejects.toThrow("Cycle in ticket blocker graph");
  await expect(loadExplorerSnapshot(cycle.context, cycle.execute, undefined, [])).resolves.toBeDefined();
  const diagnostics: { ref: string; error: string }[] = [];
  await loadExplorerSnapshot(cycle.context, cycle.execute, undefined, diagnostics);
  expect(diagnostics.some(item => item.error.includes("Cycle in ticket blocker graph"))).toBe(true);
}, 60_000);

test("jira snapshot warns about a blocker that is not in the mirror and keeps the ticket blocked", async () => {
  const { context, execute } = await jiraFixture({ "ABC-1": mirrorIssue("ABC-1", { blockedBy: ["ABC-404", "ABC-2"] }), "ABC-2": mirrorIssue("ABC-2", { status: "Done", category: "done" }) });
  const strict = await loadExplorerSnapshot(context, execute);
  expect(strict.tickets.find(item => item.id === "ABC-1")!.blockedBy).toEqual(["ABC-404", "ABC-2"]);
  const diagnostics: { ref: string; error: string }[] = [];
  const snapshot = await loadExplorerSnapshot(context, execute, undefined, diagnostics);
  expect(diagnostics).toEqual([{ ref: `${JIRA_SITE}/browse/ABC-1`, error: "Blocker not in the mirror: ABC-404. Jira issue ABC-1 is blocked by ABC-404. Add blockers to mirror.closure, then run jira-mirror.ts sync." }]);
  const ticket = snapshot.tickets.find(item => item.id === "ABC-1")!;
  expect(recoveryDecision(ticket, snapshot, await loadTicketWorkflow(context, ticket, execute))).toMatchObject({ mode: "blocked", reason: "Unresolved prerequisites: ABC-404." });
}, 60_000);

test("jira scoped load succeeds while another mirror file has a blocker that is not in the mirror", async () => {
  const { context, execute } = await jiraFixture({ "ABC-1": mirrorIssue("ABC-1", { blockedBy: ["POR-6673"] }), "ABC-7": mirrorIssue("ABC-7") });
  const jira = `${JIRA_SITE}/browse/ABC-7`;
  expect((await loadExplorerSnapshot(context, execute, { ref: jira })).tickets.map(item => item.id)).toEqual(["ABC-7"]);
  const diagnostics: { ref: string; error: string }[] = [];
  expect((await loadExplorerSnapshot(context, execute, { ref: jira }, diagnostics)).tickets.map(item => item.id)).toEqual(["ABC-7"]);
  expect(diagnostics).toEqual([]);
  const blocked: { ref: string; error: string }[] = [];
  await loadExplorerSnapshot(context, execute, { ref: `${JIRA_SITE}/browse/ABC-1` }, blocked);
  expect(blocked.map(item => item.error)).toEqual([expect.stringContaining("Blocker not in the mirror: POR-6673.")]);
}, 60_000);

test("jira snapshot tells the user to sync when the mirror is missing or empty", async () => {
  const missing = await jiraFixture(null);
  await expect(loadExplorerSnapshot(missing.context, missing.execute)).rejects.toThrow(/Jira mirror .*tracker\/jira has no issue files\. Run jira-mirror\.ts sync/);
  const empty = await jiraFixture({});
  await expect(loadExplorerSnapshot(empty.context, empty.execute)).rejects.toThrow(/has no issue files\. Run jira-mirror\.ts sync/);
  const unconfigured = await jiraFixture(null, `---\nbackend: jira\nsite: ${JIRA_SITE}\n---\n`);
  await expect(loadExplorerSnapshot(unconfigured.context, unconfigured.execute)).rejects.toThrow("has no mirror block");
}, 60_000);

test("jira snapshot rejects mirror files that break the file contract", async () => {
  const cases: [Record<string, string>, string][] = [
    [{ "ABC-1": mirrorIssue("ABC-1", { schema: "tracker-mirror/v9" }) }, "schema tracker-mirror/v9 is not tracker-mirror/v1"],
    [{ "ABC-1": mirrorIssue("ABC-2") }, "id ABC-2 does not match its file name ABC-1.md"],
    [{ "ABC-1": mirrorIssue("ABC-1", { ref: "https://other.atlassian.net/browse/ABC-1" }) }, `ref must be ${JIRA_SITE}/browse/ABC-1`],
    [{ "ABC-1": mirrorIssue("ABC-1", { parent: "ABC-2", type: "Epic" }), "ABC-2": mirrorIssue("ABC-2", { parent: "ABC-1", type: "Epic" }) }, "Cycle in Jira parent graph"],
    [{ "ABC-1": mirrorIssue("ABC-1", { mirrorStatus: "gone" }) }, "mirror_status gone is not stale"],
    [{ "ABC-1": mirrorIssue("ABC-1", { category: null }) }, "status_category"],
  ];
  for (const [issues, message] of cases) {
    const { context, execute } = await jiraFixture(issues);
    await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow(message);
  }
}, 60_000);

test("removed source permits finish recovery only after exact squash mapping and remote reachability", async () => {
  const { context, ticket, root } = await fixture();
  const git = (...args: string[]) => run("git", ["-C", context.repositoryRoot, ...args]);
  const base = await git("rev-parse", "HEAD");
  const source = join(root, "source");
  await git("worktree", "add", "-b", "feature/T-1", source, "main");
  await put(join(source, "product.ts"), "export const product = 1;\n");
  await run("git", ["-C", source, "add", "product.ts"]);
  await run("git", ["-C", source, "commit", "-m", "T-1 implement product"]);
  const sourceCommit = await run("git", ["-C", source, "rev-parse", "HEAD"]);
  const sourceTree = await run("git", ["-C", source, "rev-parse", "HEAD^{tree}"]);
  await git("merge", "--squash", "feature/T-1");
  await git("commit", "-m", "T-1 integrate reviewed product");
  const merged = await git("rev-parse", "HEAD");
  const mergedTree = await git("rev-parse", "HEAD^{tree}");
  const remote = join(root, "remote.git");
  await run("git", ["init", "--quiet", "--bare", remote]);
  await git("remote", "add", "origin", remote);
  await git("push", "origin", "main");
  await git("worktree", "remove", source);
  ticket.status = "completed";
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, attempt: 1, repository: context.repositoryRoot, worktree: source, workspace_path: source,
    source_commit: sourceCommit, source_tree: sourceTree, source_branch: "feature/T-1", base_branch: "main", muxer: "hrdx", pane_id: "1", agent: "pi", session_id: null,
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root: context.repositoryRoot, store: "repository", ref: "workflows/T-1" }, evidence: { store: "repository", ref: "workflows/T-1/artifacts/evidence/run-1" }, inputs: [], outputs: [],
  };
  const lifecycle = [
    { event: "phase-start", phase: "finish", status: "RUNNING", attempt: 2 },
    { event: "phase-input-ready", phase: "review", status: "started", attempt: 1 },
    { event: "phase-checkpoint", phase: "review", status: "started", attempt: 1 },
    { event: "operator-decision-required", phase: "review", status: "blocked", attempt: 0 },
    { event: "operator-approval", phase: "review", status: "approved", attempt: 0 },
    { event: "source-once-inputs-prepared", phase: "review", status: "prepared", attempt: 1 },
    { event: "bounded-review-inputs-prepared", phase: "review", status: "prepared", attempt: 1 },
  ];
  for (const [index, fields] of lifecycle.entries()) {
    await put(join(context.repositoryRoot, `workflows/T-1/events/lifecycle-${index}.json`), JSON.stringify({
      ...common, ...fields, receipt_id: `lifecycle-${index}`, parent_receipt: index ? `lifecycle-${index - 1}` : null,
      created_at: `2026-09-0${index + 1}T00:00:00Z`,
    }));
  }
  const review = { ...common, receipt_id: "review-2", parent_receipt: "lifecycle-6", phase: "review", status: "completed", verdict: "SUCCESS", created_at: "2026-10-01T00:00:00Z", outputs: [{ kind: "review-artifact", ref: "workflows/T-1/artifacts/reviews/review-2.md" }] };
  const finish = { ...common, receipt_id: "finish-3", parent_receipt: "review-2", phase: "finish", status: "FINISHED", pane_id: null, created_at: "2026-10-02T00:00:00Z", merged_commit: merged, merged_tree: mergedTree, base_before: base, expected_merge_tree: mergedTree, reviewed_source_commit: sourceCommit, reviewed_source_tree: sourceTree, review_receipt: "review-2", remote: "origin", remote_ref: "refs/heads/main", pushed: true, ticket_completed: true, worktree_removed: true, workspace_closed: true };
  await put(join(context.repositoryRoot, "workflows/T-1/events/review.json"), JSON.stringify(review));
  await put(join(context.repositoryRoot, "workflows/T-1/events/finish.json"), JSON.stringify(finish));
  await put(join(context.repositoryRoot, "workflows/T-1/artifacts/reviews/review-2.md"), `# Review\n\nReviewed ${sourceCommit}. SUCCESS.\n`);
  const readOnly: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: context.repositoryRoot } }] }) } : exec(command, args, cwd);
  let workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.error).toBeUndefined();
  expect(workflow.sourceCommit).toBeUndefined();
  expect(workflow.inspection).toMatchObject({ historyValid: true, source: { state: "missing" }, finishIntegrated: true, finishVerified: true });
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ mode: "complete" });
  await put(join(context.repositoryRoot, "workflows/T-1/events/finish.json"), JSON.stringify({ ...finish, expected_merge_tree: "f".repeat(40) }));
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.finishVerified).not.toBe(true);
  expect(workflow.inspection?.finishError).toContain("base parent and expected merge tree");
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ action: "finish", mode: "reconcile", requiredApproval: true });
});

test("v2 finish remains complete after independent remote advancement and reports missing verification objects without merging", async () => {
  const { context, ticket, root } = await fixture();
  const repo = context.repositoryRoot;
  const git = (...args: string[]) => run("git", ["-C", repo, ...args]);
  await git("switch", "-c", "feature/T-1");
  await put(join(repo, "product.ts"), "export const product = 1;\n");
  await git("add", "product.ts"); await git("commit", "-m", "T-1 source");
  const sourceCommit = await git("rev-parse", "HEAD");
  const sourceTree = await git("rev-parse", "HEAD^{tree}");
  await git("switch", "main");
  await put(join(repo, "other.ts"), "export const independent = 2;\n");
  await git("add", "other.ts"); await git("commit", "-m", "Other initiative");
  const plan = await prepareIntegration(repo, sourceCommit, "main", "merge", exec);
  const merged = await git("commit-tree", plan.expected_merge_tree, "-p", plan.base_before, "-p", sourceCommit, "-m", "T-1 integration");
  await git("merge", "--ff-only", merged);
  const remote = join(root, "remote.git");
  await run("git", ["init", "--bare", "--quiet", "-b", "main", remote]);
  await git("remote", "add", "origin", remote); await git("push", "origin", "main");
  ticket.status = "completed";
  const common = {
    schema: "worktree-receipt/v2", workflow_id: ticket.id, attempt: 1, repository: repo,
    worktree: join(root, "removed-source"), workspace_path: join(root, "removed-source"),
    source_commit: sourceCommit, source_tree: sourceTree, source_branch: "feature/T-1", base_branch: "main",
    muxer: "hrdx", pane_id: null, agent: "omp", session_id: "parent",
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root: repo, store: "repository", ref: "workflows/T-1" }, inputs: [], outputs: [],
  };
  await put(join(repo, "workflows/T-1/events/review.json"), JSON.stringify({
    ...common, pane_id: "reviewer", receipt_id: "review-1", parent_receipt: null, phase: "review", status: "completed",
    verdict: "SUCCESS", created_at: "2026-10-01T00:00:00Z",
    review_base_commit: plan.base_before, changed_scope: ["product.ts"], affected_contracts: [],
    integration_checks: [{ argv: ["bun", "test"] }],
    outputs: [{ kind: "review-artifact", ref: "workflows/T-1/artifacts/reviews/review-1.md" }],
  }));
  await put(join(repo, "workflows/T-1/artifacts/reviews/review-1.md"), `# Review\nReviewed ${sourceCommit}. SUCCESS.\n`);
  await put(join(repo, "workflows/T-1/events/failed-attempt.json"), JSON.stringify({
    ...common, receipt_id: "finish-failed", parent_receipt: "review-1", phase: "finish", status: "FINISH_FAILED",
    created_at: "2026-10-01T12:00:00Z", candidate_branch: "integration/failed", candidate_workspace: join(root, "earlier-candidate"),
    failure_step: "validation", failure_reason: "Candidate check failed before integration.",
  }));
  await put(join(repo, "workflows/T-1/events/finish.json"), JSON.stringify({
    ...common, ...plan, schema: "worktree-receipt/v2", receipt_id: "finish-2", parent_receipt: "finish-failed",
    phase: "finish", status: "FINISHED", created_at: "2026-10-02T00:00:00Z", review_receipt: "review-1",
    merged_commit: merged, merged_tree: plan.expected_merge_tree, merged_parents: [plan.base_before, sourceCommit],
    candidate_branch: "integration/T-1", candidate_workspace: join(root, "removed-candidate"),
    remote: "origin", remote_ref: "refs/heads/main", pushed: true, ticket_completed: true, worktree_removed: true, workspace_closed: true,
    validation_results: [{ argv: ["bun", "test"], cwd: repo, exit_code: 0, source_commit: merged, source_tree: plan.expected_merge_tree }],
  }));
  const readOnly: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: repo } }] }) } : exec(command, args, cwd);
  let workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow).mode).toBe("complete");
  await mkdir(join(root, "removed-candidate"));
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.finishVerified).toBe(false);
  expect(workflow.inspection?.finishIntegrated).toBe(true);
  await rm(join(root, "removed-candidate"), { recursive: true });
  await mkdir(join(root, "earlier-candidate"));
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.finishVerified).toBe(false);
  expect(workflow.inspection?.finishIntegrated).toBe(true);
  await rm(join(root, "earlier-candidate"), { recursive: true });
  const other = join(root, "remote-writer");
  await run("git", ["clone", "--quiet", remote, other]);
  await run("git", ["-C", other, "config", "user.name", "Other"]);
  await run("git", ["-C", other, "config", "user.email", "other@example.invalid"]);
  await put(join(other, "later.ts"), "export const later = 3;\n");
  await run("git", ["-C", other, "add", "."]); await run("git", ["-C", other, "commit", "-m", "Later independent initiative"]);
  await run("git", ["-C", other, "push", "origin", "main"]);
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ mode: "blocked", label: "Fetch remote verification objects" });
  expect(workflow.inspection?.finishIntegrated).toBe(true);
  await git("fetch", "origin", "refs/heads/main");
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow).mode).toBe("complete");
  expect(await git("rev-parse", "main")).toBe(merged);
}, 60_000);

test("lifecycle statuses cannot replace review results or authorize a zero-attempt result", async () => {
  const { context, ticket } = await fixture();
  const root = context.repositoryRoot;
  const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", root, "rev-parse", "HEAD^{tree}"]);
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, receipt_id: "review-1", parent_receipt: null,
    repository: root, worktree: root, workspace_path: root, source_branch: "main", base_branch: "main",
    source_commit: commit, source_tree: tree, muxer: "herdr", pane_id: "1", agent: "omp", session_id: "parent",
    created_at: "2026-10-01T00:00:00Z", ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend },
    ticket_ref: ticket.ref, workflow: { root, store: "repository", ref: "workflows/T-1" }, inputs: [], outputs: [],
    phase: "review", event: "phase-result", status: "completed", attempt: 1, verdict: "SUCCESS",
  };
  const inventory: Exec = async (command, args, cwd) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) } : exec(command, args, cwd);
  const invalid = [
    ...["RUNNING", "approved", "prepared", "started"].map(status => ({ status })),
    { attempt: 0 },
    { event: "operator-approval", status: "approved", attempt: 0 },
    { event: "phase-input-ready", status: "started" },
    { event: "bounded-review-inputs-prepared", status: "prepared" },
  ];
  for (const fields of invalid) {
    await put(join(root, "workflows/T-1/events/review.json"), JSON.stringify({ ...common, ...fields }));
    const workflow = await loadTicketWorkflow(context, ticket, inventory);
    expect(workflow.events?.find(event => event.ref.endsWith("/review.json"))?.error).toBeDefined();
    expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow).mode).toBe("blocked");
  }
});

test("branch-only and ambiguous inventory remain explicit recovery inputs", async () => {
  const { context, ticket } = await fixture();
  for (const items of [[{ branch: "feature/T-1" }], [{ branch: "feature/T-1-a" }, { branch: "fix/T-1-b" }]]) {
    const inventory: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items }) } : exec(command, args, cwd);
    const workflow = await loadTicketWorkflow(context, ticket, inventory);
    expect(workflow.inspection?.source.candidates).toBe(items.length);
    expect(workflow.inspection?.source.error).toBeDefined();
    const decision = recoveryDecision(ticket, { tickets: [ticket] }, workflow);
    if (items.length === 1) expect(decision).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
    else {
      expect(decision).toMatchObject({ mode: "blocked", label: "Resolve source workspace" });
      expect(decision.action).toBeUndefined();
    }
  }
});

test("submission verification requires the exact PR head, base and non-closed publication", async () => {
  const { context, ticket } = await fixture();
  const commit = await run("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD^{tree}"]);
  const workflow: TicketWorkflow = {
    ticketId: ticket.id, receipts: [{
      id: "submit-1", ref: "workflows/T-1/events/submit-1.json", workflowId: ticket.id,
      phase: "submit", status: "completed", sourceCommit: commit, sourceTree: tree,
      sourceBranch: "main", baseBranch: "release", workspacePath: context.repositoryRoot,
      createdAt: "2026-10-01T00:00:00Z", outputs: [], fields: {}, body: "",
    }]
  };
  let pullRequest = { url: "https://github.com/example/inspection-fixture/pull/1", headRefOid: commit, headRefName: "main", baseRefName: "other", state: "OPEN" };
  const observed: Exec = async (command, args, cwd) => {
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) };
    if (command === "gh") return { code: 0, stdout: JSON.stringify([pullRequest]) };
    if (command === "git" && args.includes("ls-remote")) return { code: 0, stdout: `${commit}\trefs/heads/main\n` };
    return exec(command, args, cwd);
  };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(false);
  pullRequest = { ...pullRequest, baseRefName: "release", state: "CLOSED" };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(false);
  pullRequest = { ...pullRequest, state: "OPEN", headRefName: "other" };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(false);
  pullRequest = { ...pullRequest, headRefName: "main" };
  expect((await inspectWorkflow(context, ticket, workflow, observed)).submission?.verified).toBe(true);
});

test("a start written before its pane opens and a result with no evidence run stay valid history", async () => {
  const { context, ticket } = await fixture();
  const root = context.repositoryRoot;
  await put(join(root, ".git/info/exclude"), "/workflows/\n");
  const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", root, "rev-parse", "HEAD^{tree}"]);
  const workflowRoot = "workflows/T-1";
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, attempt: 1, repository: root, worktree: root, workspace_path: root,
    source_commit: commit, source_tree: tree, source_branch: "main", base_branch: "main", muxer: "hrdx", agent: "pi", session_id: null,
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root, store: "repository", ref: workflowRoot }, inputs: [], outputs: [],
  };
  const start = { ...common, receipt_id: "start-1", parent_receipt: null, phase: "start", event: "phase-start", status: "started", pane_id: null, created_at: "2026-10-01T00:00:00Z" };
  const result = { ...common, receipt_id: "implementation-2", parent_receipt: "start-1", phase: "implementation", event: "phase-result", status: "completed", pane_id: "1", created_at: "2026-10-02T00:00:00Z" };
  await put(join(root, workflowRoot, "events/start-1.json"), JSON.stringify(start));
  await put(join(root, workflowRoot, "events/implementation-2.json"), JSON.stringify(result));
  const readOnly: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: root } }] }) } : exec(command, args, cwd);
  let workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.error).toBeUndefined();
  expect(workflow.inspection?.historyValid).toBe(true);
  await put(join(root, workflowRoot, "events/implementation-2.json"), JSON.stringify({ ...result, pane_id: null }));
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.error).toContain("Receipt pane_id is required.");
  await put(join(root, workflowRoot, "events/implementation-2.json"), JSON.stringify({ ...result, evidence: { store: "repository" } }));
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.error).toContain("receipt evidence ref");
});

test("a review artifact ref relative to the workflow folder resolves inside it", async () => {
  const { context, ticket } = await fixture();
  const root = context.repositoryRoot;
  await put(join(root, ".git/info/exclude"), "/workflows/\n");
  const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", root, "rev-parse", "HEAD^{tree}"]);
  const workflowRoot = "workflows/T-1";
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, attempt: 1, repository: root, worktree: root, workspace_path: root,
    source_commit: commit, source_tree: tree, source_branch: "main", base_branch: "main", muxer: "hrdx", agent: "pi", pane_id: "1", session_id: null,
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root, store: "repository", ref: workflowRoot }, inputs: [],
  };
  const review = { ...common, receipt_id: "review-1", parent_receipt: null, phase: "review", event: "phase-result", status: "completed", verdict: "FAILURE", created_at: "2026-10-01T00:00:00Z", outputs: [{ kind: "review-artifact", ref: "artifacts/reviews/review-review-1.md" }] };
  await put(join(root, workflowRoot, "events/review-1.json"), JSON.stringify(review));
  await put(join(root, workflowRoot, "artifacts/reviews/review-review-1.md"), `# Review\n\nReviewed ${commit}. FAILURE.\n`);
  const readOnly: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: root } }] }) } : exec(command, args, cwd);
  const workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.artifacts).toMatchObject([{ receiptId: "review-1", state: "readable", matchesSource: true }]);
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ action: "review", mode: "reconcile" });
});

test("checksum-bound history supplements repair envelopes without rewriting receipts or losing parents", async () => {
  const { context, ticket } = await fixture();
  const root = context.repositoryRoot;
  await put(join(root, ".git/info/exclude"), "/workflows/\n");
  const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", root, "rev-parse", "HEAD^{tree}"]);
  const workflowRoot = "workflows/T-1";
  const evidence = { store: "repository", ref: `${workflowRoot}/artifacts/evidence/recorded.json` };
  await put(join(root, evidence.ref), '{"observed":true}\n');
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, attempt: 1, repository: root, worktree: root, workspace_path: root,
    source_commit: commit, source_tree: tree, source_branch: "main", base_branch: "main", muxer: "hrdx", pane_id: "1", agent: "pi", session_id: null,
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root, store: "repository", ref: workflowRoot }, inputs: [], outputs: [],
  };
  const historicalRoot = join(root, "old-worktree");
  const original = JSON.stringify({ ...common, worktree: historicalRoot, workspace_path: historicalRoot, workflow: { ...common.workflow, root: historicalRoot }, receipt_id: "implementation-1", parent_receipt: null, phase: "implementation", event: "phase-result", status: "completed", created_at: "2026-10-01T00:00:00Z" });
  const target = `${workflowRoot}/events/implementation-1.json`;
  await put(join(root, target), original);
  const readOnly: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: root } }] }) } : exec(command, args, cwd);
  expect((await loadTicketWorkflow(context, ticket, readOnly)).inspection?.historyValid).toBe(false);
  const supplement = { ref: target, sha256: createHash("sha256").update(original).digest("hex"), evidence, normalize_workflow_root: true };
  const repair = {
    ...common, receipt_id: "repair-2", parent_receipt: "implementation-1", phase: "fix", event: "history-reconciled", status: "completed",
    created_at: "2026-10-02T00:00:00Z", evidence, inputs: [{ kind: "receipt", ref: target }],
    history_supplements: [supplement],
    history_repair_reason: "Recover missing historical evidence from its retained record.",
    history_repair_authorization: "Explicit fixture repair request.",
  };
  const repairPath = join(root, workflowRoot, "events/repair-2.json");
  await put(repairPath, JSON.stringify(repair));
  let workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ mode: "begin", action: "review" });
  expect(await readFile(join(root, target), "utf8")).toBe(original);
  expect(workflow.events?.find(event => event.ref === target)?.fields?.evidence).toBeUndefined();
  for (const invalid of [
    { ...supplement, sha256: "0".repeat(64) },
    { ...supplement, source_commit: "f".repeat(40) },
    { ...supplement, parent_receipt: null },
    { ...supplement, evidence: { store: "repository", ref: "../outside" } },
    { ...supplement, evidence: { store: "repository", ref: `${workflowRoot}/artifacts/evidence/missing.json` } },
  ]) {
    await put(repairPath, JSON.stringify({ ...repair, history_supplements: [invalid] }));
    workflow = await loadTicketWorkflow(context, ticket, readOnly);
    expect(workflow.inspection?.historyValid).toBe(false);
    expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow).mode).toBe("blocked");
  }
  await put(repairPath, JSON.stringify({ ...repair, parent_receipt: "missing-parent" }));
  workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.historyValid).toBe(false);
  expect(workflow.error).toContain("Missing receipt parent");
});

test("missing input refs can be supplemented without changing original bytes or existing provenance", async () => {
  const { context, ticket } = await fixture();
  const root = context.repositoryRoot;
  await put(join(root, ".git/info/exclude"), "/workflows/\n");
  const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", root, "rev-parse", "HEAD^{tree}"]);
  const workflowRoot = "workflows/T-1";
  const artifact = `${workflowRoot}/artifacts/evidence/intent.json`;
  await put(join(root, artifact), '{"scope":"read-only"}\n');
  await put(join(root, "outside.json"), '{"outside":true}\n');
  const escaped = `${workflowRoot}/artifacts/evidence/escape.json`;
  await symlink(join(root, "outside.json"), join(root, escaped));
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, attempt: 1, repository: root, worktree: root, workspace_path: root,
    source_commit: commit, source_tree: tree, source_branch: "main", base_branch: "main", muxer: "hrdx", pane_id: "1", agent: "pi", session_id: null,
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root, store: "repository", ref: workflowRoot }, outputs: [],
  };
  const originalInputs = [{ kind: "approval", description: "Explicit read-only scope." }, { kind: "evidence", ref: artifact }];
  const original = JSON.stringify({
    ...common, receipt_id: "start-1", parent_receipt: null, phase: "start", event: "phase-complete", status: "blocked",
    created_at: "2026-10-01T00:00:00Z", inputs: originalInputs,
  });
  const target = `${workflowRoot}/events/start-1.json`;
  await put(join(root, target), original);
  const readOnly: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: root } }] }) } : exec(command, args, cwd);
  expect((await loadTicketWorkflow(context, ticket, readOnly)).error).toContain("receipt inputs ref must be a string");
  const supplement = { ref: target, sha256: createHash("sha256").update(original).digest("hex"), input_refs: [{ index: 0, ref: artifact }] };
  const repair = {
    ...common, receipt_id: "repair-2", parent_receipt: "start-1", phase: "start", event: "history-reconciled", status: "blocked",
    created_at: "2026-10-02T00:00:00Z", inputs: [{ kind: "receipt", ref: target }, { kind: "evidence", ref: artifact }],
    history_supplements: [supplement], history_repair_reason: "Supply the absent approval artifact reference.",
    history_repair_authorization: "Explicit fixture envelope-only repair request.",
  };
  const repairPath = join(root, workflowRoot, "events/repair-2.json");
  await put(repairPath, JSON.stringify(repair));
  let workflow = await loadTicketWorkflow(context, ticket, readOnly);
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(workflow.receipts.find(receipt => receipt.fields.receipt_id === "start-1")?.fields.inputs).toEqual([
    { ...originalInputs[0], ref: artifact }, originalInputs[1],
  ]);
  expect(workflow.events?.find(event => event.ref === target)?.fields?.inputs).toEqual(originalInputs);
  expect(await readFile(join(root, target), "utf8")).toBe(original);
  for (const invalid of [
    { ...supplement, sha256: "0".repeat(64) },
    { ...supplement, input_refs: [] },
    { ...supplement, input_refs: [{ index: -1, ref: artifact }] },
    { ...supplement, input_refs: [{ index: 0.5, ref: artifact }] },
    { ...supplement, input_refs: [{ index: 2, ref: artifact }] },
    { ...supplement, input_refs: [{ index: 1, ref: artifact }] },
    { ...supplement, input_refs: [{ index: 0, ref: artifact }, { index: 0, ref: artifact }] },
    { ...supplement, input_refs: [{ index: 0, ref: artifact, status: "completed" }] },
    { ...supplement, input_refs: [{ index: 0, ref: join(root, artifact) }] },
    { ...supplement, input_refs: [{ index: 0, ref: "outside.json" }] },
    { ...supplement, input_refs: [{ index: 0, ref: escaped }] },
    { ...supplement, input_refs: [{ index: 0, ref: target }] },
    { ...supplement, input_refs: [{ index: 0, ref: `${workflowRoot}/artifacts/evidence/missing.json` }] },
    { ...supplement, input_refs: [{ index: 0, ref: `${workflowRoot}/artifacts/evidence` }] },
    { ...supplement, inputs: [{ kind: "approval", ref: artifact }] },
  ]) {
    const supplied = invalid.input_refs?.map(value => ({ kind: "evidence", ref: value.ref })) ?? [];
    await put(repairPath, JSON.stringify({ ...repair, inputs: [...repair.inputs, ...supplied], history_supplements: [invalid] }));
    workflow = await loadTicketWorkflow(context, ticket, readOnly);
    expect(workflow.inspection?.historyValid).toBe(false);
    expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow).mode).toBe("blocked");
  }
  await put(repairPath, JSON.stringify({ ...repair, inputs: [{ kind: "receipt", ref: target }] }));
  expect((await loadTicketWorkflow(context, ticket, readOnly)).error).toContain("listed in the repair inputs");
  expect(await readFile(join(root, target), "utf8")).toBe(original);
});

test("historical v1 finish workspace repairs preserve source identity and reject unrelated envelopes", async () => {
  const { context, ticket } = await fixture();
  const root = context.repositoryRoot;
  await put(join(root, ".git/info/exclude"), "/workflows/\n");
  const commit = await run("git", ["-C", root, "rev-parse", "HEAD"]);
  const tree = await run("git", ["-C", root, "rev-parse", "HEAD^{tree}"]);
  const workflowRoot = "workflows/T-1";
  const source = join(root, "removed-source");
  const common = {
    schema: "worktree-receipt/v1", workflow_id: ticket.id, attempt: 1, repository: root, worktree: root, workspace_path: root,
    source_commit: commit, source_tree: tree, source_branch: "main", base_branch: "main", muxer: "hrdx", pane_id: null, agent: "pi", session_id: "parent",
    ticket: { id: ticket.id, ref: ticket.ref, backend: ticket.backend }, ticket_ref: ticket.ref,
    workflow: { root, store: "repository", ref: workflowRoot }, inputs: [], outputs: [],
  };
  const historical = {
    ...common, worktree: source, source_workspace_path: source, receipt_id: "finish-1", parent_receipt: null,
    phase: "finish", event: "phase-complete", status: "FINISHED", pushed: true, ticket_completed: true,
    merged_commit: commit, created_at: "2026-10-01T00:00:00Z",
  };
  const target = `${workflowRoot}/events/finish-1.json`;
  const repairPath = join(root, workflowRoot, "events/repair-2.json");
  const readOnly: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "main", worktree: { path: root } }] }) } : exec(command, args, cwd);
  const original = JSON.stringify(historical);
  await put(join(root, target), original);
  expect((await loadTicketWorkflow(context, ticket, readOnly)).error).toContain("worktree and workspace_path");
  const repair = {
    ...common, receipt_id: "repair-2", parent_receipt: "finish-1", phase: "finish", event: "phase-complete", status: "FINISHED",
    pushed: true, ticket_completed: true, merged_commit: commit, created_at: "2026-10-02T00:00:00Z",
    inputs: [{ kind: "receipt", ref: target }], history_repair_reason: "Normalize the recorded parent checkout to the retained source identity.",
    history_repair_authorization: "Explicit fixture history repair request.",
  };
  const supplement = { ref: target, sha256: createHash("sha256").update(original).digest("hex"), normalize_finish_workspace: true };
  await put(repairPath, JSON.stringify({ ...repair, history_supplements: [supplement] }));
  let workflow = await loadTicketWorkflow(context, { ...ticket, status: "completed" }, readOnly);
  expect(workflow.inspection?.historyValid).toBe(true);
  const effective = workflow.receipts.find(receipt => receipt.id === "finish-1")!;
  expect(effective.fields.workspace_path).toBe(source);
  expect(effective.sourceCommit).toBe(commit);
  expect(effective.parentReceipt).toBeUndefined();
  expect(workflow.events?.find(event => event.ref === target)?.fields?.workspace_path).toBe(root);
  expect(await readFile(join(root, target), "utf8")).toBe(original);
  for (const changes of [
    { schema: "worktree-receipt/v2" }, { phase: "implementation" },
    { workspace_path: source }, { workspace_path: join(root, "unrelated") },
    { source_workspace_path: undefined }, { source_workspace_path: root },
    { worktree: "relative", source_workspace_path: "relative" },
  ]) {
    const bytes = JSON.stringify({ ...historical, ...changes });
    await put(join(root, target), bytes);
    await put(repairPath, JSON.stringify({ ...repair, history_supplements: [{ ...supplement, sha256: createHash("sha256").update(bytes).digest("hex") }] }));
    workflow = await loadTicketWorkflow(context, ticket, readOnly);
    expect(workflow.inspection?.historyValid).toBe(false);
  }
});
