import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rename, rm, stat, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { loadExplorerAdrs, loadExplorerSnapshot, loadTicketWorkflow } from "../../../developer/skills/git/worktree/scripts/workflow";
import { unresolvedBlockers } from "./model";
import type { Exec, ExplorerTicket, SharedAgentContext } from "./model";
import { actionChoices } from "./actions";
import { recoveryDecision } from "../../../developer/skills/git/worktree/scripts/recovery";
import { DocumentReadSession } from "../../../developer/skills/git/worktree/scripts/document-cache";
import { formatExplorerReference } from "./explorer-reference";

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

const execute: Exec = async (command, args) => {
  const process = Bun.spawn([command, ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  return { stdout: code === 0 ? stdout : `${stdout}\n${stderr}`, code };
};

async function put(file: string, content: string): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

async function fixture(backend = "local-markdown"): Promise<SharedAgentContext> {
  const root = await mkdtemp(join(tmpdir(), "continuity-loader-"));
  temporaryDirectories.push(root);
  const repositoryRoot = join(root, "repository");
  const sharedRoot = join(root, "shared");
  await mkdir(repositoryRoot);
  await mkdir(sharedRoot);
  await put(join(repositoryRoot, "docs/agents/issue-tracker.md"), `---\nbackend: ${backend}\n---\n`);
  return {
    repositoryRoot, origin: "https://github.com/example/continuity.git", canonicalOrigin: "github.com/example/continuity", slug: "fixture",
    sharedRoot, candidateSharedRoot: sharedRoot, root: repositoryRoot, alignmentRoot: repositoryRoot, storage: "repository", mode: "mixed",
    layout: { tracker: "records", tickets: "records/issues", initiatives: "records/plans", sources: "sources" },
    routes: {
      alignment: { adapter: "markdown", store: "repository" }, tickets: { adapter: backend, store: "repository" },
      initiatives: { adapter: "markdown", store: "shared" }, workflows: { adapter: "files", store: "shared" },
      evidence: { adapter: "files", inherits: "workflows" }, sources: { adapter: "files", inherits: "alignment" },
    },
  };
}

async function ticket(context: SharedAgentContext, id: string, blockers: string[] = [], status = "open"): Promise<void> {
  await put(join(context.repositoryRoot, "records/issues", `${id}.md`), `---\nid: ${id}\ntitle: Ticket ${id}\nwork_status: ${status}\nblocked_by: ${JSON.stringify(blockers)}\n---\n\nDetail for ${id}.\n`);
}

test("configured mixed stores preserve completed blockers and discover unassigned tickets", async () => {
  const context = await fixture();
  await ticket(context, "A", ["B"]);
  await ticket(context, "B", [], "completed");
  const index = join(context.sharedRoot, "records/plans/release/index.md");
  const target = join(context.repositoryRoot, "records/issues/A.md");
  await put(index, `---\ntitle: Release\n---\n\n[Implement](${relative(dirname(index), target)}#acceptance)\n`);
  const snapshot = await loadExplorerSnapshot(context, execute);
  expect(snapshot.initiatives.find(item => item.id === "release")?.ticketIds).toEqual(["A"]);
  expect(snapshot.initiatives.find(item => item.id === "unassigned")?.ticketIds).toEqual(["B"]);
  expect(unresolvedBlockers(snapshot.tickets.find(item => item.id === "A")!, snapshot)).toEqual([]);
});

test("missing collections are empty but a missing tracker definition is actionable", async () => {
  const context = await fixture();
  const empty = await loadExplorerSnapshot(context, execute);
  expect(empty.tickets).toEqual([]);
  expect(empty.initiatives.find(item => item.group)?.ticketIds).toEqual([]);
  await rm(join(context.repositoryRoot, "docs/agents/issue-tracker.md"));
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
});

test("missing blockers, dependency cycles, and duplicate ticket IDs fail instead of reporting readiness", async () => {
  const context = await fixture();
  await ticket(context, "A", ["B"]);
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
  await ticket(context, "B", ["A"]);
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
  await ticket(context, "B");
  await put(join(context.repositoryRoot, "records/issues/duplicate.md"), "---\nid: A\ntitle: Duplicate\n---\n");
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
});

test("initiative links cannot hide missing tickets or escape through collection symlinks", async () => {
  const context = await fixture();
  await ticket(context, "A");
  const index = join(context.sharedRoot, "records/plans/release/index.md");
  await put(index, `[Missing](${relative(dirname(index), join(context.repositoryRoot, "records/issues/missing.md"))})\n`);
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
  await rm(index);
  const outside = join(dirname(context.repositoryRoot), "outside.md");
  await put(outside, "---\nid: OUT\ntitle: Outside\n---\n");
  await symlink(outside, join(context.repositoryRoot, "records/issues/escape.md"));
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
});

test("versioned records render direct members and descendants without treating specification links as members", async () => {
  const context = await fixture();
  await put(join(context.repositoryRoot, "records/issues/A.md"), "---\nschema: tracker-ticket/v1\nid: A\ntitle: Ticket A\nwork_status: claimed\nblocked_by: []\nparent: release\nsequence: 1\n---\n\nImplementation detail.\n");
  await put(join(context.repositoryRoot, "records/issues/B.md"), "---\nschema: tracker-ticket/v1\nid: B\ntitle: Child B\nwork_status: unclaimed\nblocked_by: [A]\nparent: A\n---\n");
  const index = join(context.sharedRoot, "records/plans/release/index.md");
  const target = relative(dirname(index), join(context.repositoryRoot, "records/issues/A.md"));
  const missing = relative(dirname(index), join(context.repositoryRoot, "records/issues/missing.md"));
  await put(index, `---\nschema: tracker-initiative/v1\nid: release\ntitle: Release\n---\n\n## Specification\n\n[Reference](${missing})\n\n## Tickets\n\n[A](${target})\n\n## Notes\n\n[Reference](${missing})\n`);
  const snapshot = await loadExplorerSnapshot(context, execute);
  expect(snapshot.initiatives.find(item => item.id === "release")?.ticketIds).toEqual(["A", "B"]);
  expect(snapshot.tickets.find(item => item.id === "A")?.status).toBe("claimed");
  expect(snapshot.tickets.find(item => item.id === "A")?.body).toContain("Implementation detail.");
});

test("versioned UI reader rejects future ticket schemas, malformed fields, and filename identity mismatches", async () => {
  const context = await fixture();
  const file = join(context.repositoryRoot, "records/issues/A.md");
  for (const fields of ["schema: tracker-ticket/v2\nid: A\ntitle: Future", "schema: tracker-ticket/v1\nid: A\ntitle: Invalid\nwork_status: open\nblocked_by: []", "schema: tracker-ticket/v1\nid: B\ntitle: Wrong\nwork_status: claimed\nblocked_by: []", "schema: tracker-ticket/v1\nid: A\ntitle: Invalid\nwork_status: claimed\nblocked_by: [2]"]) {
    await put(file, `---\n${fields}\n---\n`);
    await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow("Invalid ticket record");
  }
});

test("versioned UI initiative indexes enforce schemas and exact direct-parent membership", async () => {
  const context = await fixture();
  await ticket(context, "A");
  const index = join(context.sharedRoot, "records/plans/release/index.md");
  const target = relative(dirname(index), join(context.repositoryRoot, "records/issues/A.md"));
  for (const fields of ["schema: tracker-initiative/v2\nid: release\ntitle: Future", "schema: tracker-initiative/v1\nid: wrong\ntitle: Wrong", "schema: tracker-initiative/v1\nid: release\ntitle: Invalid\nblocked_by: []", "schema: tracker-initiative/v1\nid: release\ntitle: Release"]) {
    await put(index, `---\n${fields}\n---\n\n## Tickets\n\n[A](${target})\n`);
    await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
  }
  await put(join(context.repositoryRoot, "records/issues/A.md"), "---\nid: A\ntitle: A\nparent: release\n---\n");
  await put(index, "---\nschema: tracker-initiative/v1\nid: release\ntitle: Release\n---\n\n## Tickets\n");
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow("missing ticket A");
});

async function receiptFixture() {
  const context = await fixture();
  for (const args of [["init", "--quiet", context.repositoryRoot], ["-C", context.repositoryRoot, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "Initial"]]) {
    const result = await execute("git", args);
    if (result.code) throw new Error(result.stdout);
  }
  const commit = (await execute("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD"])).stdout.trim();
  const tree = (await execute("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD^{tree}"])).stdout.trim();
  const selected: ExplorerTicket = { id: "A", title: "A", backend: "local-markdown", ref: "records/issues/A.md", status: "open", blockedBy: [], body: "" };
  const fields = {
    schema: "worktree-receipt/v1", receipt_id: "start-1", workflow_id: "A", phase: "start", attempt: 1, parent_receipt: null,
    repository: context.repositoryRoot, worktree: context.repositoryRoot, workspace_path: context.repositoryRoot,
    source_commit: commit, source_tree: tree, source_branch: "feature/a", base_branch: "main", created_at: "2026-10-01T10:00:00Z",
    muxer: "herdr", pane_id: "1", agent: "pi", session_id: null,
    ticket: { id: "A", backend: "local-markdown", ref: selected.ref }, ticket_ref: selected.ref,
    workflow: { store: "shared", root: context.sharedRoot, ref: "shared://workflows/A" },
    evidence: { store: "shared", ref: "shared://workflows/A/artifacts/evidence/run-1" },
    inputs: [{ kind: "ticket", ref: selected.ref }], outputs: [], status: "completed",
  };
  const events = join(context.sharedRoot, "workflows/A/events");
  await put(join(events, "z-first.json"), JSON.stringify(fields));
  return { context, selected, fields, events, commit, tree };
}

test("receipt identity and timestamps govern history, not filenames or projections", async () => {
  const { context, selected, fields, events, commit, tree } = await receiptFixture();
  await put(join(events, "a-last.md"), `---\n${JSON.stringify({ ...fields, receipt_id: "review-2", parent_receipt: "start-1", phase: "review", verdict: "SUCCESS", created_at: "2026-10-02T10:00:00Z" })}\n---\n\nReview details.\n`);
  await put(join(context.sharedRoot, "workflows/A/projections/latest-status.yaml"), "malformed: [");
  const workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.error).toBeUndefined();
  expect(workflow.receipts.map(item => item.id)).toEqual(["review-2", "start-1"]);
  expect(workflow.sourceCommit).toBe(commit);
  expect(workflow.sourceTree).toBe(tree);
  await put(join(events, "wrong.json"), JSON.stringify({ ...fields, receipt_id: "wrong", ticket_ref: "records/issues/B.md" }));
  expect((await loadTicketWorkflow(context, selected, execute)).error).toBeDefined();
});

test("invalid events remain inspectable without hiding valid receipts or permitting transitions", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  await put(join(events, "bad-root.json"), JSON.stringify({ ...fields, receipt_id: "bad-root", workflow: { ...fields.workflow, root: dirname(events) } }));
  await put(join(events, "broken.json"), "{");
  const workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.receipts.map(item => item.id)).toEqual(["start-1"]);
  expect(workflow.events?.map(item => item.ref.split("/").at(-1)).sort()).toEqual(["bad-root.json", "broken.json", "z-first.json"]);
  expect(workflow.events?.find(item => item.fields?.receipt_id === "bad-root")?.error).toContain("workflow.root");
  expect(workflow.events?.find(item => item.fields?.receipt_id === "bad-root")?.fields?.workflow).toEqual({ ...fields.workflow, root: dirname(events) });
  expect(workflow.error).toContain("bad-root.json");
  expect(workflow.error).toContain("broken.json");
  expect(workflow.sourceCommit).toBeUndefined();
  const choices = actionChoices({ kind: "ticket", ticket: selected }, { backend: selected.backend, tickets: [selected], initiatives: [] }, workflow, [{ name: "skill:worktree" }]);
  expect(choices.filter(choice => choice.action !== "ask-matt").every(choice => Boolean(choice.disabledReason))).toBe(true);
});


test("interrupted parent-run finish remains recoverable without a child pane", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  await put(join(events, "finish.json"), JSON.stringify({
    ...fields, receipt_id: "finish-failed", parent_receipt: fields.receipt_id,
    phase: "finish", event: "phase-complete", status: "FINISH_FAILED", pane_id: null,
    created_at: "2026-10-02T10:00:00Z",
  }));
  let workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(recoveryDecision(selected, { tickets: [selected] }, workflow)).toMatchObject({ action: "finish", mode: "reconcile" });
  await put(join(events, "finish.json"), JSON.stringify({
    ...fields, receipt_id: "invalid-review", parent_receipt: fields.receipt_id,
    phase: "review", status: "completed", pane_id: null, created_at: "2026-10-02T10:00:00Z",
  }));
  workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.inspection?.historyValid).toBe(false);
});

test("missing source worktrees and invalid source trees never borrow repository freshness", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  const absent = join(context.repositoryRoot, "removed-worktree");
  await put(join(events, "z-first.json"), JSON.stringify({ ...fields, worktree: absent, workspace_path: absent }));
  let workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.error).toBeDefined();
  expect(workflow.sourceTree).toBeUndefined();
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(workflow.inspection?.source.state).toBe("missing");
  await put(join(events, "z-first.json"), JSON.stringify({ ...fields, source_tree: fields.source_commit }));
  workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.error).toBeDefined();
  expect(workflow.sourceCommit).toBeUndefined();
  expect(workflow.inspection?.historyValid).toBe(false);
});

test("completed archives retain legacy worktree provenance without borrowing current source freshness", async () => {
  const { context, selected, fields, commit } = await receiptFixture();
  selected.status = "completed";
  context.routes.workflows = { adapter: "files", store: "repository" };
  const archiveEvents = join(context.repositoryRoot, "workflows/A/events");
  const removed = join(context.repositoryRoot, "removed-worktree");
  const { evidence, ...legacy } = fields;
  const start = {
    ...legacy, repository: removed, worktree: removed, workspace_path: removed,
    workflow: { store: "repository", root: removed, ref: "workflows/A" },
  };
  const finish = {
    ...start, receipt_id: "finish-2", parent_receipt: "start-1", phase: "finish",
    repository: context.repositoryRoot, workflow: { ...start.workflow, root: context.repositoryRoot },
    created_at: "2026-10-02T10:00:00Z", status: "FINISHED", pane_id: null,
    merged_commit: commit, pushed: true, ticket_completed: true, worktree_removed: true, workspace_closed: true,
  };
  await put(join(archiveEvents, "start.json"), JSON.stringify(start));
  await put(join(archiveEvents, "finish.json"), JSON.stringify(finish));
  const workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.error).toBeUndefined();
  expect(workflow.receipts.map(receipt => receipt.id)).toEqual(["finish-2", "start-1"]);
  expect(workflow.receipts[1]!.fields.workflow).toEqual(start.workflow);
  expect(workflow.sourceCommit).toBeUndefined();
  expect(workflow.sourceTree).toBeUndefined();
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(workflow.inspection?.finishVerified).not.toBe(true);
  expect(recoveryDecision(selected, { tickets: [selected] }, workflow)).toMatchObject({ action: "finish", mode: "reconcile", requiredApproval: true });

  for (const invalid of [
    { ...finish, pushed: false },
    { ...finish, merged_commit: "f".repeat(40) },
    { ...finish, ticket_ref: "records/issues/OTHER.md" },
    { ...finish, source_tree: commit },
    { ...finish, parent_receipt: "missing" },
  ]) {
    await put(join(archiveEvents, "finish.json"), JSON.stringify(invalid));
    expect((await loadTicketWorkflow(context, selected, execute)).error).toBeDefined();
  }
  await put(join(archiveEvents, "finish.json"), JSON.stringify(finish));
  await put(join(archiveEvents, "start.json"), JSON.stringify({ ...start, workflow: { ...start.workflow, root: join(context.repositoryRoot, "unrelated") } }));
  expect((await loadTicketWorkflow(context, selected, execute)).error).toBeDefined();
  await put(join(archiveEvents, "start.json"), JSON.stringify(start));
  selected.status = "claimed";
  expect((await loadTicketWorkflow(context, selected, execute)).error).toBeDefined();
});

test("orphaned and cyclic receipt parents are invalid workflow history", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  await put(join(events, "z-first.json"), JSON.stringify({ ...fields, parent_receipt: "absent" }));
  expect((await loadTicketWorkflow(context, selected, execute)).error).toBeDefined();
  await put(join(events, "z-first.json"), JSON.stringify({ ...fields, parent_receipt: "start-1" }));
  expect((await loadTicketWorkflow(context, selected, execute)).error).toBeDefined();
});

test("recorded attempts exclude invalid fields and do not validate orphaned or cyclic review history", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  for (const [id, phase, status] of [["review-1", "review", "completed"], ["review-2", "review", "failed"], ["fix-1", "fix", "blocked"], ["implementation", "implementation", "completed"]]) {
    await put(join(events, `${id}.json`), JSON.stringify({ ...fields, receipt_id: id, parent_receipt: "start-1", phase, status }));
  }
  await put(join(events, "invalid.json"), JSON.stringify({ ...fields, receipt_id: "invalid", phase: "review", ticket_ref: "wrong" }));
  expect((await loadTicketWorkflow(context, selected, execute)).recordedAttempts).toEqual({ review: 2, fix: 1 });
  await put(join(events, "review-1.json"), JSON.stringify({ ...fields, receipt_id: "review-1", phase: "review", parent_receipt: "absent" }));
  expect((await loadTicketWorkflow(context, selected, execute)).recordedAttempts).toBeUndefined();
  await put(join(events, "review-1.json"), JSON.stringify({ ...fields, receipt_id: "review-1", phase: "review", parent_receipt: "review-1" }));
  expect((await loadTicketWorkflow(context, selected, execute)).recordedAttempts).toBeUndefined();
});

test("GitHub pagination includes later pages and recursive prerequisite closure without parsing body references", async () => {
  const context = await fixture("github");
  const base = "https://github.com/example/continuity/issues/";
  const issue = (number: number, extra: Record<string, unknown> = {}) => ({ number, html_url: `${base}${number}`, title: `Issue ${number}`, body: "See #999, which is not a blocker.", state: number === 4 ? "CLOSED" : "OPEN", labels: [], issueType: null, parent: null, ...extra });
  const ghExec: Exec = async (command, args) => {
    if (command !== "gh") return execute(command, args);
    if (args[0] === "issue") {
      const id = Number(args[2]);
      return { code: 0, stdout: JSON.stringify(issue(id, id === 1 ? { issueType: { name: "Spec" } } : {})) };
    }
    const endpoint = args[args.length - 1]!;
    if (endpoint === "repos/example/continuity/issues?state=all&per_page=100") return { code: 0, stdout: JSON.stringify([[issue(1)], [issue(2)]]) };
    if (endpoint.includes("/1/sub_issues?")) return { code: 0, stdout: JSON.stringify([[issue(2)]]) };
    if (endpoint.includes("/2/dependencies/blocked_by?")) return { code: 0, stdout: JSON.stringify([[issue(3)]]) };
    if (endpoint.includes("/3/dependencies/blocked_by?")) return { code: 0, stdout: JSON.stringify([[issue(4)]]) };
    return { code: 0, stdout: "[[]]" };
  };
  const snapshot = await loadExplorerSnapshot(context, ghExec);
  expect(snapshot.tickets.map(item => item.id).sort()).toEqual(["1", "2", "3", "4"]);
  expect(snapshot.initiatives.find(item => item.id === "1")?.ticketIds).toEqual(["2"]);
  expect(snapshot.tickets.find(item => item.id === "2")?.blockedBy).toEqual(["3"]);
  expect(unresolvedBlockers(snapshot.tickets.find(item => item.id === "3")!, snapshot)).toEqual([]);
  expect(snapshot.tickets.find(item => item.id === "4")?.ref).toBe(`${base}4`);
});

test("GitHub failures and unsupported backends are errors, not empty or guessed graphs", async () => {
  const context = await fixture("github");
  const failed: Exec = async (command, args) => command === "gh" ? { code: 1, stdout: "Issues are disabled" } : execute(command, args);
  await expect(loadExplorerSnapshot(context, failed)).rejects.toThrow();
  await put(join(context.repositoryRoot, "docs/agents/issue-tracker.md"), "---\nbackend: jira\n---\n");
  context.routes.tickets.adapter = "jira";
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
});

test("inspection reads actual source and separates implementation from tracker/evidence-only commits without mutation", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  const git = async (...args: string[]) => {
    const result = await execute("git", ["-C", context.repositoryRoot, ...args]);
    if (result.code !== 0) throw new Error(result.stdout);
    return result.stdout.trim();
  };
  await git("branch", "-m", "feature/a");
  await put(join(context.repositoryRoot, "source.ts"), "export const implementation = true;\n");
  await git("add", "source.ts");
  await git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "A implementation");
  const implementation = await git("rev-parse", "HEAD");
  await ticket(context, "A");
  await git("add", "records/issues/A.md");
  await git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "A tracker evidence");
  const tracker = await git("rev-parse", "HEAD");
  await git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "A implemented");
  const messageOnly = await git("rev-parse", "HEAD");
  const statusBefore = await git("status", "--porcelain=v1", "--untracked-files=all");
  const receiptBefore = await Bun.file(join(events, "z-first.json")).text();
  const observed: string[][] = [];
  const exec: Exec = async (command, args) => {
    observed.push([command, ...args]);
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/a", worktree: { path: context.repositoryRoot } }] }) };
    return execute(command, args);
  };
  const workflow = await loadTicketWorkflow(context, selected, exec);
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(workflow.inspection?.source).toMatchObject({ state: "available", path: context.repositoryRoot, branch: "feature/a", commit: messageOnly, dirty: true });
  expect(workflow.inspection?.ownership).toBe("unknown");
  expect(workflow.inspection?.commits.find(item => item.commit === implementation)).toMatchObject({ kind: "source", paths: ["source.ts"] });
  expect(workflow.inspection?.commits.find(item => item.commit === tracker)).toMatchObject({ kind: "tracker-evidence-only", paths: ["records/issues/A.md"] });
  expect(workflow.inspection?.commits.find(item => item.commit === messageOnly)).toMatchObject({ kind: "tracker-evidence-only", paths: [] });
  expect(await git("status", "--porcelain=v1", "--untracked-files=all")).toBe(statusBefore);
  expect(await Bun.file(join(events, "z-first.json")).text()).toBe(receiptBefore);
  expect(JSON.parse(receiptBefore)).toEqual(fields);
  expect(observed.some(args => args[0] === "wt" && args.includes("--format=json"))).toBe(true);
  expect(observed.some(args => args.some(arg => ["add", "commit", "push", "fetch", "switch", "remove"].includes(arg)))).toBe(false);
});

test("read-only artifact inspection controls review freshness and detects missing artifacts", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  for (const args of [["branch", "-m", "feature/a"], ["add", "docs/agents/issue-tracker.md"], ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "Record tracker definition"]]) {
    const result = await execute("git", ["-C", context.repositoryRoot, ...args]);
    if (result.code) throw new Error(result.stdout);
  }
  const commit = (await execute("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD"])).stdout.trim();
  const tree = (await execute("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD^{tree}"])).stdout.trim();
  const artifact = join(context.sharedRoot, "workflows/A/artifacts/reviews/review-2.md");
  const review = { ...fields, receipt_id: "review-2", parent_receipt: fields.receipt_id, phase: "review", event: "phase-complete", verdict: "SUCCESS", source_commit: commit, source_tree: tree, created_at: "2026-10-02T10:00:00Z", outputs: [{ kind: "review-artifact", ref: "shared://workflows/A/artifacts/reviews/review-2.md" }] };
  await put(join(events, "review.json"), JSON.stringify(review));
  await put(artifact, `# Review\n\nSource: ${commit}\n\nSUCCESS. No blocking findings.\n`);
  const exec: Exec = async (command, args) => command === "wt"
    ? { code: 0, stdout: JSON.stringify([{ branch: "feature/a", path: context.repositoryRoot }]) }
    : execute(command, args);
  let workflow = await loadTicketWorkflow(context, selected, exec);
  expect(workflow.inspection?.source.dirty).toBe(false);
  expect(workflow.inspection?.artifacts).toContainEqual(expect.objectContaining({ receiptId: "review-2", state: "readable", matchesSource: true }));
  expect(recoveryDecision(selected, { tickets: [selected] }, workflow)).toMatchObject({ action: "finish", mode: "begin" });
  await rm(artifact);
  workflow = await loadTicketWorkflow(context, selected, exec);
  expect(workflow.error).toBeUndefined();
  expect(workflow.inspection?.artifacts[0]?.state).toBe("missing");
  expect(recoveryDecision(selected, { tickets: [selected] }, workflow)).toMatchObject({ action: "review", mode: "retry" });
});

test("Worktrunk activity is observed while inventory failure remains uncertainty, not inactivity", async () => {
  const { context, selected } = await receiptFixture();
  const active: Exec = async (command, args) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/a", marker: "🤖", worktree: { path: context.repositoryRoot } }] }) }
    : execute(command, args);
  const workflow = await loadTicketWorkflow(context, selected, active);
  expect(workflow.inspection?.ownership).toBe("active");
  expect(recoveryDecision(selected, { tickets: [selected] }, workflow)).toMatchObject({ mode: "observe" });
  const unavailable: Exec = async (command, args) => command === "wt" ? { code: 1, stdout: "inventory unavailable" } : execute(command, args);
  const uncertain = await loadTicketWorkflow(context, selected, unavailable);
  expect(uncertain.inspection?.ownership).toBe("unknown");
  expect(uncertain.inspection?.inventoryError).toContain("inventory unavailable");
});

test("legacy lifecycle names and missing-child failed completion remain immutable readable history", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  const renamed = await execute("git", ["-C", context.repositoryRoot, "branch", "-m", "feature/a"]);
  if (renamed.code) throw new Error(renamed.stdout);
  const { evidence, ...envelope } = fields;
  const interrupted = { ...envelope, receipt_id: "review-start-2", parent_receipt: fields.receipt_id, phase: "review-start", event_type: "phase-start", status: "started", created_at: "2026-10-02T10:00:00Z" };
  const failed = { ...envelope, receipt_id: "review-failed-3", parent_receipt: interrupted.receipt_id, phase: "review", stage: "phase-complete", status: "failed", result_missing: true, failure_reason: "Reviewer exited without writing a result", created_at: "2026-10-03T10:00:00Z" };
  await put(join(events, "review-start.json"), JSON.stringify(interrupted));
  await put(join(events, "review-failed.json"), JSON.stringify(failed));
  const workflow = await loadTicketWorkflow(context, selected, execute);
  expect(workflow.error).toBeUndefined();
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(workflow.receipts.find(receipt => receipt.id === interrupted.receipt_id)?.fields).toEqual(interrupted);
  expect(workflow.receipts[0]?.fields).toEqual(failed);
  expect(recoveryDecision(selected, { tickets: [selected] }, workflow)).toMatchObject({ action: "review", mode: "retry" });
});

test("warm snapshots retain independent values while exact bytes detect preserved-timestamp edits", async () => {
  const context = await fixture();
  await ticket(context, "A");
  const first = await loadExplorerSnapshot(context, execute);
  first.tickets[0]!.title = "Mutated return";
  (first.tickets[0]!.fields!.blocked_by as unknown[]).push("invented");
  first.initiatives[0]!.ticketIds.push("invented");
  const noParser: Exec = async (command, args) => command === "mq" ? { code: 1, stdout: "Parser must not be needed for unchanged bytes" } : execute(command, args);
  const unchanged = await loadExplorerSnapshot(context, noParser);
  expect(unchanged.tickets[0]!.title).toBe("Ticket A");
  expect(unchanged.tickets[0]!.fields!.blocked_by).toEqual([]);
  expect(unchanged.initiatives[0]!.ticketIds).toEqual(["A"]);
  const file = join(context.repositoryRoot, "records/issues/A.md");
  const before = await stat(file);
  const original = await readFile(file, "utf8");
  await writeFile(file, original.replace("Ticket A", "Ticket Z"));
  await utimes(file, before.atime, before.mtime);
  expect((await stat(file)).size).toBe(before.size);
  expect((await loadExplorerSnapshot(context, execute)).tickets[0]!.title).toBe("Ticket Z");
});

test("warm collection membership notices new collections, additions, deletions, and renamed records", async () => {
  const context = await fixture();
  expect((await loadExplorerSnapshot(context, execute)).tickets).toEqual([]);
  await ticket(context, "A");
  await ticket(context, "B");
  expect((await loadExplorerSnapshot(context, execute)).tickets.map(item => item.id)).toEqual(["A", "B"]);
  await rm(join(context.repositoryRoot, "records/issues/A.md"));
  await rename(join(context.repositoryRoot, "records/issues/B.md"), join(context.repositoryRoot, "records/issues/C.md"));
  await ticket(context, "C");
  expect((await loadExplorerSnapshot(context, execute)).tickets.map(item => item.id)).toEqual(["C"]);
});

test("corrupt changed records fail repeatedly and recover without retaining old parsed fields", async () => {
  const context = await fixture();
  await ticket(context, "A");
  await loadExplorerSnapshot(context, execute);
  const file = join(context.repositoryRoot, "records/issues/A.md");
  await put(file, "---\nid: A\ntitle: [\n---\n");
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
  await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow();
  await put(file, "---\nid: A\ntitle: Recovered\nblocked_by: []\n---\n");
  expect((await loadExplorerSnapshot(context, execute)).tickets[0]!.title).toBe("Recovered");
});

test("cached document values do not cross context roots or route changes", async () => {
  const first = await fixture();
  const second = await fixture();
  await ticket(first, "A");
  await put(join(second.repositoryRoot, "records/issues/A.md"), "---\nid: A\ntitle: Second context\n---\n");
  expect((await loadExplorerSnapshot(first, execute)).tickets[0]!.title).toBe("Ticket A");
  expect((await loadExplorerSnapshot(second, execute)).tickets[0]!.title).toBe("Second context");
  await put(join(first.sharedRoot, "records/issues/A.md"), "---\nid: A\ntitle: Shared route\n---\n");
  const routed = { ...first, routes: { ...first.routes, tickets: { adapter: "local-markdown", store: "shared" as const } } };
  const shared = await loadExplorerSnapshot(routed, execute);
  expect(shared.tickets[0]!.title).toBe("Shared route");
  expect(shared.tickets[0]!.ref).toBe("shared://records/issues/A.md");
  expect((await loadExplorerSnapshot(first, execute)).tickets[0]!.title).toBe("Ticket A");
});

for (const mutation of ["bytes", "add", "delete", "rename", "symlink"] as const) {
  test(`snapshot rejects ${mutation} mutation after captured bytes have been parsed`, async () => {
    const context = await fixture();
    await ticket(context, "A");
    const file = join(context.repositoryRoot, "records/issues/A.md");
    const outside = join(dirname(context.repositoryRoot), "outside.md");
    await put(outside, "---\nid: A\ntitle: Escaped\n---\n");
    let changed = false;
    const duringParse: Exec = async (command, args) => {
      const result = await execute(command, args);
      if (command === "mq" && !changed) {
        changed = true;
        if (mutation === "bytes") {
          const before = await stat(file);
          await writeFile(file, (await readFile(file, "utf8")).replace("Ticket A", "Ticket Z"));
          await utimes(file, before.atime, before.mtime);
        } else if (mutation === "add") await ticket(context, "B");
        else if (mutation === "delete") await rm(file);
        else if (mutation === "rename") await rename(file, join(dirname(file), "renamed.md"));
        else { await rm(file); await symlink(outside, file); }
      }
      return result;
    };
    await expect(loadExplorerSnapshot(context, duringParse)).rejects.toThrow("Records changed during read");
    expect(changed).toBe(true);
    if (mutation === "bytes") expect((await loadExplorerSnapshot(context, execute)).tickets[0]!.title).toBe("Ticket Z");
    if (mutation === "add") expect((await loadExplorerSnapshot(context, execute)).tickets.map(item => item.id)).toEqual(["A", "B"]);
    if (mutation === "delete") expect((await loadExplorerSnapshot(context, execute)).tickets).toEqual([]);
    if (mutation === "symlink") await expect(loadExplorerSnapshot(context, execute)).rejects.toThrow("escapes");
  });
}

test("captured JSON batches are removed on parser failure and successful recovery", async () => {
  const context = await fixture();
  await ticket(context, "A");
  const inputs: string[] = [];
  const fail: Exec = async (command, args) => {
    if (command !== "mq") return execute(command, args);
    inputs.push(args.at(-1)!);
    const captured = JSON.parse(await readFile(args.at(-1)!, "utf8"));
    expect(captured.some((item: { source: string }) => item.source.includes("Ticket A"))).toBe(true);
    return { code: 1, stdout: "Parser unavailable" };
  };
  await expect(loadExplorerSnapshot(context, fail)).rejects.toThrow("Parser unavailable");
  for (const input of inputs) await expect(stat(dirname(input))).rejects.toMatchObject({ code: "ENOENT" });
  const recover: Exec = async (command, args) => {
    if (command === "mq") inputs.push(args.at(-1)!);
    return execute(command, args);
  };
  expect((await loadExplorerSnapshot(context, recover)).tickets[0]!.id).toBe("A");
  for (const input of inputs) await expect(stat(dirname(input))).rejects.toMatchObject({ code: "ENOENT" });
});

test("receipt documents reuse independent parsing while live ownership is always inspected", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  await put(join(events, "start.md"), `---\n${JSON.stringify({ ...fields, receipt_id: "markdown-start", created_at: "2026-10-02T10:00:00Z", parent_receipt: fields.receipt_id })}\n---\n`);
  let marker = "🤖";
  const observe: Exec = async (command, args) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/a", marker, worktree: { path: context.repositoryRoot } }] }) }
    : execute(command, args);
  const first = await loadTicketWorkflow(context, selected, observe);
  expect(first.inspection?.ownership).toBe("active");
  first.receipts[0]!.fields.ticket = { id: "mutated" };
  first.events![0]!.body = "Mutated body";
  marker = "";
  const noParser: Exec = async (command, args) => command === "mq" ? { code: 1, stdout: "Unchanged receipts need no parser" } : observe(command, args);
  const second = await loadTicketWorkflow(context, selected, noParser);
  expect(second.error).toBeUndefined();
  expect(second.inspection?.ownership).toBe("unknown");
  expect(second.receipts[0]!.fields.ticket).toEqual(fields.ticket);
  expect(second.events?.some(event => event.body === "Mutated body")).toBe(false);
  await put(join(events, "z-first.json"), "{");
  expect((await loadTicketWorkflow(context, selected, observe)).inspection?.historyValid).toBe(false);
  await put(join(events, "z-first.json"), JSON.stringify(fields));
  expect((await loadTicketWorkflow(context, selected, observe)).inspection?.historyValid).toBe(true);
});

test("receipt membership and bytes are checked after live inspection before authorizing history", async () => {
  for (const mutation of ["bytes", "add", "delete"] as const) {
    const { context, selected, fields, events } = await receiptFixture();
    let changed = false;
    const duringInspection: Exec = async (command, args) => {
      if (command === "wt") {
        if (!changed) {
          changed = true;
          if (mutation === "bytes") await put(join(events, "z-first.json"), JSON.stringify({ ...fields, agent: "changed" }));
          else if (mutation === "add") await put(join(events, "extra.json"), JSON.stringify({ ...fields, receipt_id: "extra" }));
          else await rm(join(events, "z-first.json"));
        }
        return { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) };
      }
      return execute(command, args);
    };
    const workflow = await loadTicketWorkflow(context, selected, duringInspection);
    expect(workflow.error).toContain("Records changed during read");
    expect(workflow.inspection?.historyValid).toBe(false);
    expect(workflow.recordedAttempts).toBeUndefined();
    expect(workflow.sourceCommit).toBeUndefined();
  }
});

test("scoped snapshots keep transitive blockers and initiative descendants without hiding global errors", async () => {
  const context = await fixture();
  await ticket(context, "A", ["B"]);
  await ticket(context, "B", ["C"]);
  await ticket(context, "C");
  await ticket(context, "D");
  await put(join(context.repositoryRoot, "records/issues/CHILD.md"), "---\nid: CHILD\ntitle: Child\nparent: A\n---\n");
  const index = join(context.sharedRoot, "records/plans/release/index.md");
  const target = relative(dirname(index), join(context.repositoryRoot, "records/issues/A.md"));
  await put(index, `---\ntitle: Release\n---\n\n[A](${target})\n`);
  const selected = await loadExplorerSnapshot(context, execute, { ref: "records/issues/A.md", kind: "ticket" });
  expect(selected.tickets.map(item => item.id)).toEqual(["A", "B", "C"]);
  const initiative = await loadExplorerSnapshot(context, execute, { ref: "shared://records/plans/release/index.md", kind: "initiative" });
  expect(initiative.tickets.map(item => item.id)).toEqual(["A", "B", "C", "CHILD"]);
  expect(initiative.initiatives[0]!.rootTicketIds).toEqual(["A"]);
  await ticket(context, "D", ["missing"]);
  await expect(loadExplorerSnapshot(context, execute, { ref: "records/issues/A.md", kind: "ticket" })).rejects.toThrow("Missing ticket blocker");
});

test("ADRs resolve numeric identities from the alignment store and refresh cached content", async () => {
  const context = await fixture();
  context.routes.alignment = { adapter: "markdown", store: "shared" };
  await put(join(context.repositoryRoot, "docs/adr/0001-local.md"), "---\ntitle: Wrong store\n---\n");
  const file = join(context.sharedRoot, "docs/adr/0001-decision.md");
  await put(file, "---\ntitle: Shared decision\nstatus: accepted\n---\n\nDecision body.\n");
  await put(join(context.sharedRoot, "docs/adr/index.md"), "# Decisions\n");
  const first = await loadExplorerAdrs(context, execute);
  expect(first).toHaveLength(1);
  expect(first[0]).toMatchObject({ id: "0001", ref: "shared://docs/adr/0001-decision.md", documentType: "adr", title: "Shared decision" });
  first[0]!.fields!.title = "Mutated";
  const noParser: Exec = async () => ({ code: 1, stdout: "Unchanged ADR needs no parser" });
  expect((await loadExplorerAdrs(context, noParser))[0]!.title).toBe("Shared decision");
  await put(file, "---\ntitle: Revised decision\nstatus: accepted\n---\n");
  expect((await loadExplorerAdrs(context, execute))[0]!.title).toBe("Revised decision");
});

test("selected GitHub traversal loads canonical connected records without requiring a repository listing", async () => {
  const context = await fixture("github");
  const base = "https://github.com/example/continuity/issues/";
  const issue = (number: number) => ({
    number, html_url: `${base}${number}`, title: `Issue ${number}`, body: "", state: "OPEN", labels: [],
    issueType: number === 1 ? { name: "Spec" } : null,
    parent: [2, 3].includes(number) ? { number: number === 2 ? 1 : 2, url: `${base}${number === 2 ? 1 : 2}` } : null,
  });
  const hosted: Exec = async (command, args) => {
    if (command !== "gh") return execute(command, args);
    if (args[0] === "issue") return { code: 0, stdout: JSON.stringify(issue(Number(args[2]))) };
    const endpoint = args.at(-1)!;
    if (endpoint === "repos/example/continuity/issues?state=all&per_page=100") throw new Error("Repository-wide listing is unavailable");
    const ids = endpoint.includes("/1/sub_issues?") ? [2]
      : endpoint.includes("/2/sub_issues?") ? [3]
        : endpoint.includes("/2/dependencies/blocked_by?") ? [4]
          : endpoint.includes("/4/dependencies/blocked_by?") ? [5] : [];
    return { code: 0, stdout: JSON.stringify([ids.map(issue)]) };
  };
  const selected = await loadExplorerSnapshot(context, hosted, { ref: `${base}2`, kind: "ticket" });
  expect(selected.tickets.map(item => item.id)).toEqual(["2", "4", "5"]);
  const initiative = await loadExplorerSnapshot(context, hosted, { ref: `${base}1`, kind: "initiative" });
  expect(initiative.tickets.map(item => item.id).sort()).toEqual(["2", "3", "4", "5"]);
  expect(initiative.initiatives[0]).toMatchObject({ id: "1", rootTicketIds: ["2"], ticketIds: ["2", "3"] });
  await expect(loadExplorerSnapshot(context, hosted, { ref: "https://github.com/other/repo/issues/2", kind: "ticket" })).rejects.toThrow("GitHub record reference");
});

test("a malformed Markdown event does not hide valid events and repaired bytes recover", async () => {
  const { context, selected, fields, events } = await receiptFixture();
  const file = join(events, "broken.md");
  await put(file, "---\ninvalid: [\n---\n");
  const invalid = await loadTicketWorkflow(context, selected, execute);
  expect(invalid.inspection?.historyValid).toBe(false);
  expect(invalid.receipts.map(receipt => receipt.id)).toEqual(["start-1"]);
  expect(invalid.events?.find(event => event.ref.endsWith("/broken.md"))?.error).toBeDefined();
  await put(file, `---\n${JSON.stringify({ ...fields, receipt_id: "repaired", parent_receipt: fields.receipt_id, created_at: "2026-10-02T10:00:00Z" })}\n---\n`);
  const repaired = await loadTicketWorkflow(context, selected, execute);
  expect(repaired.error).toBeUndefined();
  expect(repaired.receipts.map(receipt => receipt.id)).toEqual(["repaired", "start-1"]);
});


for (const failure of [false, true]) {
  test(`concurrent document reads join withheld parsing and ${failure ? "recover after failure" : "return independent values"}`, async () => {
    const context = await fixture();
    await ticket(context, "A");
    await ticket(context, "B");
    const directory = join(context.repositoryRoot, "records/issues");
    const requests = ["A", "B"].map(id => ({ file: join(directory, `${id}.md`), root: context.repositoryRoot }));
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const ownerExec: Exec = async (command, args) => {
      if (command === "mq") {
        entered.resolve();
        await release.promise;
        if (failure) return { code: 1, stdout: "Withheld parser failure" };
      }
      return execute(command, args);
    };
    const owner = new DocumentReadSession(context, ownerExec);
    const waiter = new DocumentReadSession(context, async () => { throw new Error("Concurrent reader must join the captured document parse"); });
    await owner.collect(directory, /\.md$/, context.repositoryRoot);
    await waiter.collect(directory, /\.md$/, context.repositoryRoot);
    await waiter.captureAll(requests);
    const first = owner.readAll(requests);
    await entered.promise;
    let settled = false;
    const second = waiter.readAll(requests).then(result => { settled = true; return result; });
    try {
      await waiter.captureAll(requests);
      expect(settled).toBe(false);
      release.resolve();
      const results = await Promise.all([first, second]);
      if (failure) {
        for (const result of results) {
          expect(result.documents.size).toBe(0);
          for (const request of requests) expect(String(result.errors.get(request.file))).toContain("Withheld parser failure");
        }
        const recovered = await new DocumentReadSession(context, execute).readAll(requests);
        expect(recovered.errors.size).toBe(0);
        expect(recovered.documents.get(requests[0]!.file)?.fields.title).toBe("Ticket A");
      } else {
        for (const result of results) {
          expect(result.errors.size).toBe(0);
          expect([...result.documents.values()].map(document => document.fields.title)).toEqual(["Ticket A", "Ticket B"]);
        }
        results[0]!.documents.get(requests[0]!.file)!.fields.title = "Mutated result";
        expect(results[1]!.documents.get(requests[0]!.file)!.fields.title).toBe("Ticket A");
      }
      await owner.validate();
      await waiter.validate();
    } finally {
      release.resolve();
      await Promise.allSettled([first, second]);
    }
  });
}

test("a joined parse still validates the waiting session's captured bytes before publication", async () => {
  const context = await fixture();
  await ticket(context, "A");
  const file = join(context.repositoryRoot, "records/issues/A.md");
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const owner = new DocumentReadSession(context, async (command, args) => {
    if (command === "mq") { entered.resolve(); await release.promise; }
    return execute(command, args);
  });
  const waiter = new DocumentReadSession(context, async () => { throw new Error("Waiting session must not launch another parse"); });
  const requests = [{ file, root: context.repositoryRoot }];
  const first = owner.readAll(requests);
  await entered.promise;
  await waiter.captureAll(requests);
  const second = waiter.readAll(requests);
  try {
    await waiter.captureAll(requests);
    await writeFile(file, (await readFile(file, "utf8")).replace("Ticket A", "Ticket Z"));
    release.resolve();
    const result = await second;
    expect(result.errors.size).toBe(0);
    expect(result.documents.get(file)!.fields.title).toBe("Ticket A");
    await expect(waiter.validate()).rejects.toThrow("Records changed during read");
    const current = await new DocumentReadSession(context, execute).readAll(requests);
    expect(current.documents.get(file)!.fields.title).toBe("Ticket Z");
  } finally {
    release.resolve();
    await Promise.allSettled([first, second]);
  }
});

test("scoped GitHub initiatives expand descendants previously encountered only as blockers", async () => {
  const context = await fixture("github");
  const base = "https://github.com/example/continuity/issues/";
  const parentById = new Map([[2, 1], [3, 1], [4, 3], [5, 4], [6, 5]]);
  const childrenById = new Map([[1, [2, 3]], [3, [4]], [4, [5]], [5, [6]]]);
  const issue = (number: number) => ({
    number, html_url: `${base}${number}`, title: `Issue ${number}`, body: "", state: "OPEN", labels: [],
    issueType: number === 1 ? { name: "Spec" } : null,
    parent: parentById.has(number) ? { number: parentById.get(number), url: `${base}${parentById.get(number)}` } : null,
  });
  const hosted: Exec = async (command, args) => {
    if (command !== "gh") return execute(command, args);
    if (args[0] === "issue") return { code: 0, stdout: JSON.stringify(issue(Number(args[2]))) };
    const endpoint = args.at(-1)!;
    if (endpoint.includes("issues?state=all")) throw new Error("Scoped actions must not require a repository-wide listing");
    const id = Number(/\/issues\/(\d+)\//.exec(endpoint)?.[1]);
    const related = endpoint.includes("/sub_issues?") ? childrenById.get(id) ?? []
      : id === 2 && endpoint.includes("/dependencies/blocked_by?") ? [5] : [];
    return { code: 0, stdout: JSON.stringify([related.map(issue)]) };
  };
  const snapshot = await loadExplorerSnapshot(context, hosted, { ref: `${base}1`, kind: "initiative" });
  expect(snapshot.tickets.map(ticket => ticket.id).sort()).toEqual(["2", "3", "4", "5", "6"]);
  expect(snapshot.initiatives[0]?.rootTicketIds).toEqual(["2", "3"]);
  expect(snapshot.initiatives[0]?.ticketIds).toContain("6");
});

test("current source summaries use the same observation as workflow inspection after HEAD changes", async () => {
  const { context, selected, fields } = await receiptFixture();
  let currentCommit = "";
  const observe: Exec = async (command, args) => {
    if (command === "wt") {
      const commit = await execute("git", ["-C", context.repositoryRoot, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "Changed source"]);
      if (commit.code) throw new Error(commit.stdout);
      currentCommit = (await execute("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD"])).stdout.trim();
      return { code: 0, stdout: JSON.stringify({ schema: 2, items: [{ branch: "feature/a", worktree: { path: context.repositoryRoot } }] }) };
    }
    return execute(command, args);
  };
  const workflow = await loadTicketWorkflow(context, selected, observe);
  expect(workflow.error).toBeUndefined();
  expect(currentCommit).not.toBe(fields.source_commit);
  expect(workflow.sourceCommit).toBe(currentCommit);
  expect(workflow.sourceTree).toBe(workflow.inspection?.source.tree);
  expect(workflow.inspection?.source.commit).toBe(currentCommit);
  expect(workflow.receipts[0]!.sourceCommit).toBe(fields.source_commit);
});

test("missing shared stores remain empty readable collections without initialization", async () => {
  const { context, selected } = await receiptFixture();
  await ticket(context, "A");
  await rm(context.sharedRoot, { recursive: true, force: true });
  const snapshot = await loadExplorerSnapshot(context, execute);
  expect(snapshot.tickets.map(record => record.id)).toEqual(["A"]);
  expect(snapshot.initiatives.filter(record => !record.group)).toEqual([]);
  const readOnly: Exec = async (command, args) => command === "wt"
    ? { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) }
    : execute(command, args);
  const workflow = await loadTicketWorkflow(context, selected, readOnly);
  expect(workflow.error).toBeUndefined();
  expect(workflow.inspection?.historyValid).toBe(true);
  expect(recoveryDecision(selected, snapshot, workflow).mode).toBe("begin");
  await expect(stat(context.sharedRoot)).rejects.toMatchObject({ code: "ENOENT" });
});

test("nested ticket and research refs copy their canonical paths without flattening directories", async () => {
  const context = await fixture();
  for (const [id, type] of [["T", "task"], ["R", "research"]]) {
    const file = join(context.repositoryRoot, `records/issues/team/${id}.md`);
    await put(file, `---\nid: ${id}\ntitle: Nested ${type}\ntype: ${type}\n---\n`);
  }
  const snapshot = await loadExplorerSnapshot(context, execute);
  for (const record of snapshot.tickets) {
    const target = { kind: "ticket" as const, ticket: record };
    expect(await formatExplorerReference(context, target, "path")).toBe(join(context.repositoryRoot, `records/issues/team/${record.id}.md`));
    expect(await formatExplorerReference(context, target, "reference")).toBe(`records/issues/team/${record.id}.md`);
  }
});

test("source commit and tree remain one revision when HEAD changes between observations", async () => {
  const { context, selected, fields } = await receiptFixture();
  let changed = false;
  const observe: Exec = async (command, args) => {
    if (command === "wt") return { code: 0, stdout: JSON.stringify({ schema: 2, items: [] }) };
    const result = await execute(command, args);
    if (!changed && command === "git" && args.at(-1) === "HEAD^{commit}") {
      changed = true;
      await writeFile(join(context.repositoryRoot, "source.txt"), "New source tree\n");
      const added = await execute("git", ["-C", context.repositoryRoot, "add", "source.txt"]);
      if (added.code) throw new Error(added.stdout);
      const committed = await execute("git", ["-C", context.repositoryRoot, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "Changed tree"]);
      if (committed.code) throw new Error(committed.stdout);
    }
    return result;
  };
  const workflow = await loadTicketWorkflow(context, selected, observe);
  expect(changed).toBe(true);
  expect(workflow.error).toBeUndefined();
  expect(workflow.inspection?.source.commit).toBe(fields.source_commit);
  expect(workflow.inspection?.source.tree).toBe(fields.source_tree);
  expect(workflow.sourceCommit).toBe(fields.source_commit);
  expect(workflow.sourceTree).toBe(fields.source_tree);
  const actualTree = (await execute("git", ["-C", context.repositoryRoot, "rev-parse", "HEAD^{tree}"])).stdout.trim();
  expect(actualTree).not.toBe(workflow.sourceTree);
});
