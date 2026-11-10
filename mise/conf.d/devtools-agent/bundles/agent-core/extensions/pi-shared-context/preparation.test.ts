// Confirmation must cover the consumed records and live observations, not only prompt summaries.
import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";
import { loadExplorerSnapshot } from "../../../developer/skills/git/worktree/scripts/workflow";
import { confirmSessionRequest, prepareSessionRequest, sessionRequestKey } from "./preparation";
import type { PreparedSessionRequest } from "./preparation";
import type { ExplorerSessionRequest, SharedAgentContext } from "./model";

const context = {
  repositoryRoot: "/project", canonicalOrigin: "github.com/example/project", slug: "project",
  alignmentRoot: "/project", routes: { tickets: { adapter: "local-markdown", store: "repository" } },
} as SharedAgentContext;

function fixture(): ExplorerSessionRequest {
  const ticket = { id: "A", title: "Implement", ref: "tracker/tickets/A.md", backend: "local-markdown", status: "open", body: "Original acceptance criteria", blockedBy: ["B"] };
  return {
    action: "ask-matt", target: { kind: "ticket", ticket }, prompt: "Discuss the criteria",
    snapshot: {
      backend: "local-markdown", initiatives: [],
      tickets: [ticket, { ...ticket, id: "B", ref: "tracker/tickets/B.md", body: "Prerequisite", blockedBy: ["C"] }, { ...ticket, id: "C", ref: "tracker/tickets/C.md", status: "completed", blockedBy: [] }, { ...ticket, id: "OTHER", blockedBy: [] }],
    },
  };
}

function prepared(request: ExplorerSessionRequest, project = context): PreparedSessionRequest {
  return { request: structuredClone(request), key: sessionRequestKey(project, request) };
}

test("changed acceptance criteria require a new confirmation even when prompt summaries are unchanged", async () => {
  const request = fixture();
  const displayed: string[] = [];
  let notices = 0;
  const result = await confirmSessionRequest(
    async () => prepared(request),
    async value => {
      const record = value.request.target;
      if (record.kind !== "ticket") throw new Error("Expected ticket");
      displayed.push(record.ticket.body);
      if (displayed.length === 1 && request.target.kind === "ticket") request.target.ticket.body = "Updated acceptance criteria";
      return true;
    },
    async () => { },
    () => { notices++; },
  );
  expect(displayed).toEqual(["Original acceptance criteria", "Updated acceptance criteria"]);
  expect(notices).toBe(1);
  expect(result?.target.kind === "ticket" && result.target.ticket.body).toBe("Updated acceptance criteria");
});

test("cancelling the changed handoff never returns an approved request", async () => {
  const request = fixture();
  let confirmations = 0;
  const result = await confirmSessionRequest(
    async () => prepared(request),
    async () => {
      confirmations++;
      request.snapshot.tickets.find(ticket => ticket.id === "C")!.status = "open";
      return confirmations === 1;
    },
    async () => { },
    () => { },
  );
  expect(confirmations).toBe(2);
  expect(result).toBeUndefined();
});

test("unrelated record edits do not interrupt confirmation", async () => {
  const request = fixture();
  let confirmations = 0;
  const result = await confirmSessionRequest(
    async () => prepared(request),
    async () => {
      confirmations++;
      request.snapshot.tickets.find(ticket => ticket.id === "OTHER")!.body = "Unrelated edit";
      return true;
    },
    async () => { },
    () => { throw new Error("Unrelated input invalidated confirmation"); },
  );
  expect(confirmations).toBe(1);
  expect(result?.target).toEqual(request.target);
});

test("changes while waiting for idle invalidate approval before dispatch", async () => {
  const request = fixture();
  let confirmations = 0;
  const result = await confirmSessionRequest(
    async () => prepared(request),
    async () => ++confirmations === 1,
    async () => { request.snapshot.tickets.find(ticket => ticket.id === "B")!.blockedBy = []; },
    () => { },
  );
  expect(confirmations).toBe(2);
  expect(result).toBeUndefined();
});

test("review artifact changes, source changes and route changes all invalidate workflow approval", async () => {
  for (const mutation of ["artifact", "source", "route", "owner"] as const) {
    const request = fixture();
    request.action = "review";
    request.workflow = {
      ticketId: "A", receipts: [], inspection: {
        historyValid: true, source: { state: "available", commit: "a".repeat(40), dirty: false },
        ownership: "inactive", worktrees: [], commits: [],
        artifacts: [{ receiptId: "review-1", ref: "review.md", state: "readable", matchesSource: true, contentHash: "original" }],
      },
    };
    const project = structuredClone(context);
    let confirmations = 0;
    const result = await confirmSessionRequest(
      async () => prepared(request, project),
      async () => {
        confirmations++;
        if (mutation === "artifact") request.workflow!.inspection!.artifacts[0]!.contentHash = "changed";
        if (mutation === "source") request.workflow!.inspection!.source.dirty = true;
        if (mutation === "route") project.routes.tickets.store = "shared";
        if (mutation === "owner") request.workflow!.inspection!.ownership = "active";
        return confirmations === 1;
      },
      async () => { },
      () => { },
    );
    expect(confirmations).toBe(2);
    expect(result).toBeUndefined();
  }
});

test("failed revalidation cannot return an approved request", async () => {
  let reads = 0;
  await expect(confirmSessionRequest(
    async () => {
      if (++reads > 1) throw new Error("Current inputs are unreadable");
      return prepared(fixture());
    },
    async () => true,
    async () => { },
    () => { },
  )).rejects.toThrow("Current inputs are unreadable");
});

test("planning reads current canonical records without inspecting unrelated workflows", async () => {
  const root = await mkdtemp(join(tmpdir(), "shared-context-preparation-"));
  const exec = async (command: string, args: string[], cwd = root) => {
    if (command === "wt") throw new Error("Planning must not require Worktrunk");
    const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    return { stdout: code ? `${stdout}\n${stderr}` : stdout, code };
  };
  try {
    for (const args of [["init", "--quiet", root], ["-C", root, "remote", "add", "origin", "https://github.com/fixture/preparation.git"]]) {
      const result = await exec("git", args);
      if (result.code) throw new Error(result.stdout);
    }
    await mkdir(join(root, "docs/agents"), { recursive: true });
    await mkdir(join(root, "tracker/tickets"), { recursive: true });
    await writeFile(join(root, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
    const file = join(root, "tracker/tickets/R.md");
    const record = "---\nid: R\ntitle: Research\ntype: research\nwork_status: draft\nblocked_by: []\n---\n\n";
    await writeFile(file, record + "Original evidence.\n");
    const project = await resolveSharedContext(exec, root);
    if (!project) throw new Error("Fixture context unavailable");
    const snapshot = await loadExplorerSnapshot(project, exec);
    const target = snapshot.tickets.find(ticket => ticket.id === "R")!;
    const request: ExplorerSessionRequest = { action: "grill", target: { kind: "ticket", ticket: target }, snapshot, prompt: "" };
    const before = await prepareSessionRequest(project, exec, request);
    await writeFile(file, record + "Revised evidence.\n");
    const after = await prepareSessionRequest(project, exec, request);
    expect(after.request.target.kind === "ticket" && after.request.target.ticket.body).toContain("Revised evidence.");
    expect(after.request.workflow).toBeUndefined();
    expect(after.key).not.toBe(before.key);
    await rm(file);
    await expect(prepareSessionRequest(project, exec, request)).rejects.toThrow("changed or disappeared");
  } finally { await rm(root, { recursive: true, force: true }); }
}, 30_000);
