// Real helper processes prove disk recovery and canonical result invalidation.
import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile, readdir, readFile, utimes, rename, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const helper = path.resolve(import.meta.dir, "../app/bin/herdr-context.mjs");
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "herdr-cache-test-")); roots.push(root);
  const cwd = path.join(root, "repo"), cache = path.join(root, "cache");
  await mkdir(cwd); await mkdir(cache);
  const env = { ...process.env, XDG_CACHE_HOME: cache, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
  async function run(argv: string[]) {
    const child = Bun.spawn(argv, { cwd, env, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    if (code !== 0) throw new Error(stderr || stdout);
    return stdout;
  }
  async function query(operation: string, fields: Record<string, unknown> = {}) {
    const envelope = JSON.parse(await run([process.execPath, helper, "request", JSON.stringify({ protocol: 1, cwd, operation, fields })]));
    if (!envelope.ok) throw new Error(JSON.stringify(envelope.error));
    return envelope.value;
  }
  async function ticket(id: string, title = id, blockers: string[] = []) {
    const fields = { schema: "tracker-ticket/v1", id, title, triage: "ready-for-agent", work_status: "unclaimed", blocked_by: blockers };
    await run(["mq", "--allow-http-import", "-I", "null", "-F", "text", "--argjson", "fields", JSON.stringify(fields), "--args", "body", `# ${title}\n\n${title} body.`, 'import "github.com/harehare/okf.mq" | okf::okf_new("enhancement", fields, body) | okf::okf_stringify(.)', "-o", path.join(cwd, `tracker/tickets/${id}.md`)]);
  }
  await run(["git", "init", "-q"]);
  await run(["git", "remote", "add", "origin", "git@github.com:example/cache-test.git"]);
  await query("setup", { store: "repository" });
  await mkdir(path.join(cwd, "docs/agents"), { recursive: true });
  await mkdir(path.join(cwd, "tracker/tickets"), { recursive: true });
  await mkdir(path.join(cwd, "tracker/initiatives"), { recursive: true });
  await run(["mq", "--allow-http-import", "-I", "null", "-F", "text", 'import "github.com/harehare/okf.mq" | okf::okf_new("Concept", {backend:"local-markdown", "issue-root":"tracker/tickets", "initiative-root":"tracker/initiatives", title:"Scratch"}, "# Scratch") | okf::okf_stringify(.)', "-o", path.join(cwd, "docs/agents/issue-tracker.md")]);
  await ticket("A"); await ticket("B");
  const read = (operation: string, fields = {}) => query(operation, { ...fields, $cache: true });
  const validate = (entries: { cache: unknown }[]) => query("validate", { entries: entries.map(entry => entry.cache) });
  return { cwd, cache: path.join(cache, "herdr/shared-context-reads"), query, read, validate, ticket, run };
}

test("one validation keeps unchanged bodies across helper restarts and isolates query arguments", async () => {
  const f = await fixture();
  const entries = await Promise.all([f.read("context"), f.read("tracker", { tree: true }), f.read("detail", { id: "A", kind: "ticket" }), f.read("detail", { id: "B", kind: "ticket" }), f.read("directory", { collection: "tickets", path: "" }), f.read("file", { collection: "tickets", path: "A.md" })]);
  expect(new Set(entries.map(entry => entry.cache.identity)).size).toBe(entries.length);
  const rows = await f.validate(entries);
  expect(rows.map((row: { status: string }) => row.status)).toEqual(entries.map(() => "unchanged"));
  expect(rows.every((row: object) => !Object.hasOwn(row, "value"))).toBe(true);
  const canonical = await f.query("tracker", { tree: true });
  expect(entries[1].value).toEqual(canonical);
}, 60_000);

test("record edits preserve unrelated details and shared blockers invalidate dependents", async () => {
  const f = await fixture();
  const tree = await f.read("tracker", { tree: true });
  const a = await f.read("detail", { id: "A", kind: "ticket" }), b = await f.read("detail", { id: "B", kind: "ticket" });
  await f.ticket("A", "Alpha edited");
  expect((await f.validate([tree, a, b])).map((row: { status: string }) => row.status)).toEqual(["changed", "changed", "unchanged"]);
  await f.ticket("A", "Alpha edited", ["B"]);
  const dependent = await f.read("detail", { id: "A", kind: "ticket" });
  await f.ticket("B", "Shared blocker edited");
  expect((await f.validate([dependent, b])).map((row: { status: string }) => row.status)).toEqual(["changed", "changed"]);
}, 60_000);

test("deletion and corrupt or missing disk observations cannot validate current", async () => {
  const f = await fixture();
  const a = await f.read("detail", { id: "A", kind: "ticket" }), b = await f.read("detail", { id: "B", kind: "ticket" });
  await rm(path.join(f.cwd, "tracker/tickets/A.md"));
  expect((await f.validate([a]))[0].status).toBe("removed");
  const file = path.join(f.cache, `${b.cache.identity}.json`);
  await writeFile(file, "{broken");
  expect((await f.validate([b]))[0].status).toBe("unknown");
  const fresh = await f.read("detail", { id: "B", kind: "ticket" });
  await rm(path.join(f.cache, `${fresh.cache.identity}.json`));
  expect((await f.validate([fresh]))[0].status).toBe("unknown");
  expect((await readdir(f.cache)).some(name => name.startsWith(".pending-"))).toBe(false);
}, 60_000);

test("same-metadata byte changes and replacement identities invalidate file reads", async () => {
  const f = await fixture();
  const file = path.join(f.cwd, "tracker/tickets/plain.txt");
  await writeFile(file, "before");
  await utimes(file, new Date(0), new Date(0));
  const initial = await f.read("file", { collection: "tickets", path: "plain.txt" });
  await writeFile(file, "after!"); await utimes(file, new Date(0), new Date(0));
  expect((await f.validate([initial]))[0].status).toBe("changed");
  const current = await f.read("file", { collection: "tickets", path: "plain.txt" });
  const body = await readFile(file); await writeFile(`${file}.replacement`, body); await rename(`${file}.replacement`, file);
  expect((await f.validate([current]))[0].status).toBe("changed");
}, 60_000);

test("repository paths and route configurations cannot reuse incompatible entries", async () => {
  const f = await fixture(), other = await fixture();
  const initial = await f.read("context"), separate = await other.read("context");
  expect(initial.cache.identity).not.toBe(separate.cache.identity);
  const routes = path.join(f.cwd, ".context-routes.toml");
  await writeFile(routes, (await readFile(routes, "utf8")).replace('store = "inherit:alignment"', 'store = "repository"'));
  expect((await f.validate([initial]))[0].status).toBe("unknown");
  const changed = await f.read("context");
  expect(changed.cache.identity).not.toBe(initial.cache.identity);
}, 60_000);

test("Git-only source changes invalidate workflow-derived detail results", async () => {
  const f = await fixture();
  await f.run(["git", "add", "."]);
  await f.run(["git", "-c", "user.name=Scratch", "-c", "user.email=scratch@example.invalid", "commit", "-qm", "test: herdr-query-cache-01-selective-refresh fixture"]);
  const commit = (await f.run(["git", "rev-parse", "HEAD"])).trim();
  const tree = (await f.run(["git", "rev-parse", "HEAD^{tree}"])).trim();
  const branch = (await f.run(["git", "branch", "--show-current"])).trim();
  const directory = path.join(f.cwd, "workflows/A/events"); await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "start-0001.json"), JSON.stringify({
    schema: "worktree-receipt/v2", receipt_id: "start-0001", workflow_id: "A", phase: "start", event: "phase-start", attempt: 1, parent_receipt: null,
    repository: f.cwd, worktree: f.cwd, source_branch: branch, base_branch: branch, source_commit: commit, source_tree: tree, created_at: new Date().toISOString(),
    muxer: "herdr-app", workspace_path: f.cwd, pane_id: "scratch", agent: "omp", session_id: "scratch",
    ticket: { backend: "local-markdown", id: "A", ref: "tracker/tickets/A.md" }, ticket_ref: "tracker/tickets/A.md",
    workflow: { store: "repository", root: f.cwd, ref: "workflows/A" }, inputs: [], outputs: [], status: "started",
  }));
  const before = await f.read("detail", { id: "A", kind: "ticket" });
  await f.run(["git", "-c", "user.name=Scratch", "-c", "user.email=scratch@example.invalid", "commit", "--allow-empty", "-qm", "test: herdr-query-cache-01-selective-refresh git change"]);
  expect((await f.validate([before]))[0].status).toBe("changed");
}, 60_000);

test("disk pruning bounds entry count and bytes without publishing temporary writes", async () => {
  const f = await fixture();
  await f.read("context");
  for (let index = 0; index < 513; index++) {
    await writeFile(path.join(f.cache, `${index.toString(16).padStart(64, "0")}.json`), "{}");
  }
  await writeFile(path.join(f.cache, `${"f".repeat(64)}.json`), Buffer.alloc(33 * 1024 * 1024));
  await f.read("context");
  const names = await readdir(f.cache);
  expect(names.length).toBeLessThanOrEqual(512);
  const sizes = await Promise.all(names.map(async name => (await stat(path.join(f.cache, name))).size));
  expect(sizes.reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(32 * 1024 * 1024);
}, 60_000);

test("validation workers publish classifications without replaying unchanged bodies", async () => {
  const f = await fixture(), entry = await f.read("detail", { id: "A", kind: "ticket" });
  const request = { protocol: 1, operation: "validate", cwd: f.cwd, fields: { entries: [entry.cache] } };
  const created = JSON.parse(await f.run([process.execPath, helper, "job-create", JSON.stringify(request)]));
  const job = created.value.job;
  await f.run([process.execPath, helper, "job-run", job]);
  const status = JSON.parse(await f.run([process.execPath, helper, "job-status", job]));
  expect(status.value.state).toBe("done");
  expect(status.value.value).toEqual([{ identity: entry.cache.identity, status: "unchanged" }]);
  await f.run([process.execPath, helper, "job-remove", job]);
}, 60_000);

test("additions, nested renames and deletions update membership and only affected details", async () => {
  const f = await fixture();
  let tree = await f.read("tracker", { tree: true });
  const b = await f.read("detail", { id: "B", kind: "ticket" });
  const directory = await f.read("directory", { collection: "tickets", path: "" });
  await f.ticket("C");
  expect((await f.validate([tree, b, directory])).map((row: { status: string }) => row.status)).toEqual(["changed", "unchanged", "changed"]);
  await mkdir(path.join(f.cwd, "tracker/tickets/nested"));
  await rename(path.join(f.cwd, "tracker/tickets/B.md"), path.join(f.cwd, "tracker/tickets/nested/B.md"));
  expect((await f.validate([b]))[0].status).toBe("changed");
  const moved = await f.read("detail", { id: "B", kind: "ticket" });
  expect(moved.value.record.ref).toBe("tracker/tickets/nested/B.md");
  await rm(path.join(f.cwd, "tracker/tickets/nested/B.md"));
  expect((await f.validate([moved]))[0].status).toBe("removed");
  tree = await f.read("tracker", { tree: true });
  expect(tree.value.tickets.map((record: { id: string }) => record.id).sort()).toEqual(["A", "C"]);
  expect(tree.value).toEqual(await f.query("tracker", { tree: true }));
}, 60_000);
