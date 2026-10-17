import { afterEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildContextIndex, initializeSharedContext, migrateContextRoute, resolveContextPath,
  resolveContextRecord, resolveSharedContext, slugifyGitRemote } from "../lib";
import type { Exec } from "../lib";

const directories: string[] = [];
const origin = "https://github.com/Owner/Layout.git";
const exec: Exec = async (command, args) => {
  const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
  return { stdout: Buffer.from(result.stdout).toString(), code: result.exitCode };
};
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

async function fixture(layout = 'schema = 1\n[paths]\ntracker = "docs/tracker"\nsources = "docs/sources"\n') {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "context-layout-"));
  directories.push(sandbox);
  const repo = path.join(sandbox, "repo");
  const base = path.join(sandbox, "shared");
  await fs.mkdir(path.join(repo, "docs/agents"), { recursive: true });
  for (const args of [["init", repo], ["-C", repo, "remote", "add", "origin", origin]]) {
    const result = await exec("git", args);
    if (result.code !== 0) throw new Error("Cannot prepare Git fixture");
  }
  await fs.writeFile(path.join(repo, "docs/agents/context-layout.toml"), layout);
  return { sandbox, repo, base, shared: path.join(base, slugifyGitRemote(origin)) };
}

async function routes(shared: string, stores: { alignment?: string; tickets?: string; initiatives?: string; sources?: string } = {}) {
  await fs.mkdir(shared, { recursive: true });
  const lines = ["schema = 2"];
  for (const kind of ["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"] as const) {
    const adapter = kind === "tickets" ? "local-markdown" : kind === "alignment" || kind === "initiatives" ? "markdown" : "files";
    const store = stores[kind as keyof typeof stores] ?? "repository";
    lines.push(`[records.${kind}]`, `adapter = "${adapter}"`, `store = "${store}"`);
  }
  await fs.writeFile(path.join(shared, ".context-routes.toml"), lines.join("\n"));
}

test("layout resolves collection roots, files, refs, unchanged workflows and indexed source content", async () => {
  const { repo, base } = await fixture();
  const context = (await resolveSharedContext(exec, repo, base))!;
  for (const [kind, relative] of [["tracker", "docs/tracker"], ["tickets", "docs/tracker/tickets"],
    ["initiatives", "docs/tracker/initiatives"], ["sources", "docs/sources"]] as const) {
    expect(await resolveContextRecord(context, { kind })).toMatchObject({ kind, root: repo, path: path.join(repo, relative), ref: relative, store: "repository" });
  }
  expect(await resolveContextPath(context, { kind: "tracker" })).toBe(path.join(repo, "docs/tracker"));
  expect((await resolveContextRecord(context, { kind: "ticket", id: "TASK-1" })).path).toBe(path.join(repo, "docs/tracker/tickets/TASK-1.md"));
  expect((await resolveContextRecord(context, { kind: "initiative", id: "launch" })).path).toBe(path.join(repo, "docs/tracker/initiatives/launch"));
  expect((await resolveContextRecord(context, { kind: "workflow", id: "launch" })).path).toBe(path.join(repo, "workflows/launch"));
  const source = await resolveContextRecord(context, { kind: "source", ticket: "TASK-1", source: "web" });
  expect(source.path).toBe(path.join(repo, "docs/sources/tickets/TASK-1/web"));
  await fs.mkdir(source.path!, { recursive: true });
  await fs.writeFile(path.join(source.path!, "page.md"), '---\nsource: web\ntitle: Actual page\nurl: https://example.com/page\n---\nBody\n');
  const index = await buildContextIndex(source.path!, { root: source.root });
  expect(index.entries).toEqual([{ file: "page.md", title: "Actual page", url: "https://example.com/page" }]);
  expect(await fs.readFile(index.path, "utf8")).toContain("[page.md](page.md)");
  expect((await resolveContextRecord(context, { kind: "source", library: true, source: "document" })).path).toBe(path.join(repo, "docs/sources/library/document"));
});

test("explicit local tracker roots override layout defaults independently", async () => {
  const { repo, base } = await fixture();
  await fs.writeFile(path.join(repo, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\nissue-root: 'records/issues'\ninitiative-root: records/plans\n---\n");
  const context = (await resolveSharedContext(exec, repo, base))!;
  expect((await resolveContextRecord(context, { kind: "tickets" })).path).toBe(path.join(repo, "records/issues"));
  expect((await resolveContextRecord(context, { kind: "ticket", id: "TASK-1" })).path).toBe(path.join(repo, "records/issues/TASK-1.md"));
  expect((await resolveContextRecord(context, { kind: "initiatives" })).path).toBe(path.join(repo, "records/plans"));
  expect((await resolveContextRecord(context, { kind: "initiative", id: "launch" })).path).toBe(path.join(repo, "records/plans/launch"));
  expect((await resolveContextRecord(context, { kind: "tracker" })).path).toBe(path.join(repo, "docs/tracker"));
});

for (const layout of ["schema = 2", 'schema = 1\nunknown = true', 'schema = 1\n[paths]\nworkflows = "docs/workflows"',
  'schema = 1\npaths = "docs"', 'schema = 1\n[paths]\ntracker = 42', 'schema = 1\n[paths]\ntracker = ""',
  'schema = 1\n[paths]\ntracker = "/tmp/tracker"', 'schema = 1\n[paths]\nsources = "../sources"',
  'schema = 1\n[paths]\ntracker = "docs/../tracker"', 'schema = 1\n[paths]\ntracker = [',
  'schema = 1\n[paths]\ntracker = "C:/tracker"']) {
  test(`invalid layout fails closed: ${JSON.stringify(layout)}`, async () => {
    const { repo, base } = await fixture(layout);
    await expect(resolveSharedContext(exec, repo, base)).rejects.toThrow();
  });
}

for (const field of ["issue-root", "initiative-root"]) {
  test(`invalid explicit ${field} fails closed`, async () => {
    const { repo, base } = await fixture();
    await fs.writeFile(path.join(repo, "docs/agents/issue-tracker.md"), `---\nbackend: local-markdown\n${field}: ../outside\n---\n`);
    await expect(resolveSharedContext(exec, repo, base)).rejects.toThrow("relative directory");
  });
}

test("configured and subsequently introduced symlink escapes are rejected", async () => {
  const { sandbox, repo, base } = await fixture();
  const outside = path.join(sandbox, "outside");
  await fs.mkdir(outside);
  await fs.symlink(outside, path.join(repo, "docs/sources"));
  await expect(resolveSharedContext(exec, repo, base)).rejects.toThrow("symlink");
  await fs.unlink(path.join(repo, "docs/sources"));
  const context = (await resolveSharedContext(exec, repo, base))!;
  await fs.symlink(path.join(outside, "missing"), path.join(repo, "docs/tracker"));
  await expect(resolveContextRecord(context, { kind: "ticket", id: "TASK-1" })).rejects.toThrow("symlink");
});

test("symlinked configuration never silently falls back", async () => {
  const { repo, base, sandbox } = await fixture();
  await fs.unlink(path.join(repo, "docs/agents/context-layout.toml"));
  await fs.symlink(path.join(sandbox, "missing.toml"), path.join(repo, "docs/agents/context-layout.toml"));
  await expect(resolveSharedContext(exec, repo, base)).rejects.toThrow("symlink");
});

test("mixed routes interpret layout against selected stores and retain configured data through migrations", async () => {
  const { repo, base, shared } = await fixture();
  await fs.writeFile(path.join(repo, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\nissue-root: docs/issues\ninitiative-root: docs/plans\n---\n");
  for (const [relative, content] of [["docs/issues/TASK-1.md", "ticket"], ["docs/plans/launch/index.md", "plan"], ["docs/sources/library/web/page.md", "source"]]) {
    await fs.mkdir(path.dirname(path.join(repo, relative)), { recursive: true });
    await fs.writeFile(path.join(repo, relative), content);
  }
  let context = (await resolveSharedContext(exec, repo, base))!;
  for (const kind of ["tickets", "initiatives", "sources"] as const) {
    await migrateContextRoute(context, kind, "shared");
    context = (await resolveSharedContext(exec, repo, base))!;
  }
  expect(context.alignmentRoot).toBe(repo);
  expect((await resolveContextRecord(context, { kind: "ticket", id: "TASK-1" })).path).toBe(path.join(shared, "docs/issues/TASK-1.md"));
  expect(await fs.readFile(path.join(shared, "docs/issues/TASK-1.md"), "utf8")).toBe("ticket");
  expect(await fs.readFile(path.join(shared, "docs/plans/launch/index.md"), "utf8")).toBe("plan");
  expect(await fs.readFile(path.join(shared, "docs/sources/library/web/page.md"), "utf8")).toBe("source");
  await migrateContextRoute(context, "alignment", "shared");
  context = (await resolveSharedContext(exec, repo, base))!;
  expect(context.alignmentRoot).toBe(shared);
  expect((await resolveContextRecord(context, { kind: "sources" })).path).toBe(path.join(shared, "docs/sources"));
  await fs.writeFile(path.join(repo, "docs/agents/context-layout.toml"), "schema = 999");
  expect((await resolveSharedContext(exec, repo, base))!.layout!.tracker).toBe("docs/tracker");
});

test("initialization carries layout and explicit roots to the new active alignment root", async () => {
  const { repo, base, shared } = await fixture();
  await fs.writeFile(path.join(repo, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\nissue-root: records/issues\n---\n");
  await initializeSharedContext((await resolveSharedContext(exec, repo, base))!);
  const context = (await resolveSharedContext(exec, repo, base))!;
  expect(context.alignmentRoot).toBe(shared);
  expect((await resolveContextRecord(context, { kind: "tickets" })).path).toBe(path.join(shared, "records/issues"));
  expect((await resolveContextRecord(context, { kind: "sources" })).path).toBe(path.join(shared, "docs/sources"));
});

test("linked worktrees share origin routes but load repository layout from their own active root", async () => {
  const { sandbox, repo, base, shared } = await fixture();
  for (const args of [["-C", repo, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-m", "fixture"],
    ["-C", repo, "worktree", "add", "-b", "linked", path.join(sandbox, "linked")]]) {
    if ((await exec("git", args)).code !== 0) throw new Error("Cannot prepare linked worktree");
  }
  const linked = path.join(sandbox, "linked");
  await fs.mkdir(path.join(linked, "docs/agents"), { recursive: true });
  await fs.writeFile(path.join(linked, "docs/agents/context-layout.toml"), 'schema = 1\n[paths]\ntracker = "linked/tracker"\nsources = "linked/sources"\n');
  await routes(shared, { tickets: "shared", sources: "shared" });
  const context = (await resolveSharedContext(exec, linked, base))!;
  expect(context.repositoryRoot).toBe(linked);
  expect(context.candidateSharedRoot).toBe(shared);
  expect((await resolveContextRecord(context, { kind: "tickets" })).path).toBe(path.join(shared, "linked/tracker/tickets"));
  expect((await resolveContextRecord(context, { kind: "initiatives" })).path).toBe(path.join(linked, "linked/tracker/initiatives"));
});

test("absent layout preserves default collection paths", async () => {
  const { repo, base } = await fixture();
  await fs.unlink(path.join(repo, "docs/agents/context-layout.toml"));
  const context = (await resolveSharedContext(exec, repo, base))!;
  for (const [kind, relative] of [["tracker", "tracker"], ["tickets", "tracker/tickets"], ["initiatives", "tracker/initiatives"], ["sources", "sources"]] as const) {
    expect((await resolveContextRecord(context, { kind })).path).toBe(path.join(repo, relative));
  }
});

test("migration refuses configured destination symlink escapes before copying files", async () => {
  const { sandbox, repo, base, shared } = await fixture();
  await fs.mkdir(path.join(repo, "docs/tracker/tickets"), { recursive: true });
  await fs.writeFile(path.join(repo, "docs/tracker/tickets/TASK-1.md"), "ticket");
  const context = (await resolveSharedContext(exec, repo, base))!;
  await fs.mkdir(path.join(shared, "docs"), { recursive: true });
  const outside = path.join(sandbox, "outside");
  await fs.mkdir(outside);
  await fs.symlink(outside, path.join(shared, "docs/tracker"));
  await expect(migrateContextRoute(context, "tickets", "shared")).rejects.toThrow("symlink");
  expect(await fs.readdir(outside)).toEqual([]);
  await expect(fs.stat(path.join(shared, ".context-routes.toml"))).rejects.toMatchObject({ code: "ENOENT" });
});

test("collection selectors expose typed CLI records without changing machine configuration", async () => {
  const { sandbox, repo, base } = await fixture();
  const home = path.join(sandbox, "home");
  await fs.mkdir(path.join(home, ".config/shared-agent-context"), { recursive: true });
  await fs.writeFile(path.join(home, ".config/shared-agent-context/config.json"), JSON.stringify({ storage_path: base }));
  for (const [kind, relative] of [["tracker", "docs/tracker"], ["tickets", "docs/tracker/tickets"],
    ["initiatives", "docs/tracker/initiatives"], ["sources", "docs/sources"]] as const) {
    const result = Bun.spawnSync([process.execPath, path.join(import.meta.dir, "../cli.ts"), "resolve", kind, "--json"], {
      cwd: repo, env: { ...process.env, HOME: home }, stdout: "pipe", stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(Buffer.from(result.stdout).toString())).toMatchObject({
      kind, path: path.join(repo, relative), root: repo, store: "repository", ref: relative,
    });
  }
});
