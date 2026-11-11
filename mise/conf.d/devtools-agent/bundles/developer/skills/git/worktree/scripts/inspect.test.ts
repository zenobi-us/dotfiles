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
    ticket_ref: ticket.ref, workflow: { root: source, store: "repository", ref: "workflows/T-1" }, inputs: [], outputs: [],
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

  const other = join(root, "unrelated");
  await run("git", ["init", "--quiet", other]);
  await put(path, JSON.stringify({ ...event, repository: other }));
  workflow = await loadTicketWorkflow(linked, ticket, inventory);
  expect(workflow.events?.find(item => item.ref.endsWith("/start.json"))?.error).toContain("Receipt repository does not match");
  expect(workflow.inspection?.historyValid).toBe(false);
  await put(baseRecord, JSON.stringify({ ...event, worktree: other, workspace_path: other, workflow: { ...event.workflow, root: other } }));
  workflow = await loadTicketWorkflow(context, ticket, inventory);
  expect(workflow.events?.find(item => item.ref.endsWith("/start.json"))?.error).toContain("workflow.root");
});

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

test("jira inspection reads one ticket and its blockers through the configured cli", async () => {
  const { context } = await fixture();
  await put(join(context.repositoryRoot, "docs/agents/issue-tracker.md"), "---\nbackend: jira\nsite: https://example.atlassian.net\ncli: jira-fixture --flag\n---\n");
  const jira = "https://example.atlassian.net/browse/ABC-7";
  const calls: string[][] = [];
  const issue = (blockerCategory: string) => JSON.stringify({
    key: "ABC-7", fields: {
      summary: "Fix lodgement", status: { name: "To Do", statusCategory: { key: "new" } }, issuetype: { name: "Dev bug" }, description: "Body",
      issuelinks: [
        { type: { inward: "is blocked by" }, inwardIssue: { key: "ABC-3", fields: { status: { name: "Code Review", statusCategory: { key: blockerCategory } } } } },
        { type: { inward: "is blocked by" }, outwardIssue: { key: "ABC-9", fields: { status: { name: "To Do", statusCategory: { key: "new" } } } } },
        { type: { inward: "relates to" }, inwardIssue: { key: "ABC-5", fields: { status: { name: "To Do", statusCategory: { key: "new" } } } } },
      ],
    }
  });
  let blockerCategory = "indeterminate";
  const execute: Exec = async (command, args, cwd) => {
    if (command === "jira-fixture") { calls.push([...args, cwd ?? ""]); return { code: 0, stdout: issue(blockerCategory) }; }
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) };
    return exec(command, args, cwd);
  };
  const jiraContext: SharedAgentContext = { ...context, routes: { ...context.routes, tickets: { adapter: "jira" } } };
  await expect(loadExplorerSnapshot(jiraContext, execute)).rejects.toThrow("one ticket at a time");
  await expect(loadExplorerSnapshot(jiraContext, execute, { ref: "https://other.atlassian.net/browse/ABC-7" })).rejects.toThrow("/browse/<KEY>");
  const decide = async () => {
    const snapshot = await loadExplorerSnapshot(jiraContext, execute, { ref: jira });
    const ticket = snapshot.tickets.find(item => item.ref === jira)!;
    return { ticket, decision: recoveryDecision(ticket, snapshot, await loadTicketWorkflow(jiraContext, ticket, execute)) };
  };
  const blocked = await decide();
  expect(calls[0]).toEqual(["--flag", "get-issue", "ABC-7", "summary,status,issuetype,issuelinks,description", "0", context.repositoryRoot]);
  expect(blocked.ticket).toMatchObject({ id: "ABC-7", backend: "jira", status: "todo", fields: { issueType: "Dev bug", status: "To Do" }, documentType: "issue", blockedBy: ["ABC-3"], body: "Body" });
  expect(blocked.decision).toMatchObject({ mode: "blocked", reason: "Unresolved prerequisites: ABC-3." });
  blockerCategory = "done";
  expect((await decide()).decision).toMatchObject({ action: "start", mode: "begin" });
  blockerCategory = "archived";
  await expect(loadExplorerSnapshot(jiraContext, execute, { ref: jira })).rejects.toThrow("category archived");
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
  const review = { ...common, receipt_id: "review-2", parent_receipt: null, phase: "review", status: "completed", verdict: "SUCCESS", created_at: "2026-10-01T00:00:00Z", outputs: [{ kind: "review-artifact", ref: "workflows/T-1/artifacts/reviews/review-2.md" }] };
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

test("branch-only and ambiguous inventory remain explicit recovery inputs", async () => {
  const { context, ticket } = await fixture();
  for (const items of [[{ branch: "feature/T-1" }], [{ branch: "feature/T-1-a" }, { branch: "fix/T-1-b" }]]) {
    const inventory: Exec = async (command, args, cwd) => command === "wt" ? { code: 0, stdout: JSON.stringify({ schema: 2, items }) } : exec(command, args, cwd);
    const workflow = await loadTicketWorkflow(context, ticket, inventory);
    expect(workflow.inspection?.source.candidates).toBe(items.length);
    expect(workflow.inspection?.source.error).toBeDefined();
    expect(recoveryDecision(ticket, { tickets: [ticket] }, workflow)).toMatchObject({ action: "start", mode: "takeover", requiredApproval: true });
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
