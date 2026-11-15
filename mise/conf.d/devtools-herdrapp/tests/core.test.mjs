// Integration tests use a private Core session and target home; no desktop or user terminals are touched.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { localWatchFallback, localWatchPaths } from "../app/mods/shared-context/refresh-model.js";

const execute = promisify(execFile);
const source = path.resolve(import.meta.dirname, "../app/mods/shared-context");
const helper = path.resolve(import.meta.dirname, "../app/bin/herdr-context.mjs");
const context = createContext({ console, Date, Math, Uint8Array, BigInt });
const modules = new Map();
let root, environment, query, createQueryClient, agents;
const owned = new Set();
let observedTerminals = [];
let statusHold;

async function hc(args) {
  try { const output = await execute("hc", args, { env: environment, maxBuffer: 16_000_000 }); return { code: 0, ...output }; }
  catch (error) { return { code: typeof error.code === "number" ? error.code : 1, stdout: error.stdout ?? "", stderr: error.stderr || error.message }; }
}
async function exec(command, args, options = {}) {
  const hold = statusHold, held = hold && args.includes("job-status");
  if (held && hold.before) { hold.entered.resolve(); await hold.resume.promise; }
  const result = await hc(["exec", "--timeout", String((options.timeout ?? 60000) / 1000), ...(options.on ? ["--on", options.on] : []), ...(options.cwd ? ["--cwd", options.cwd] : []), "--", command, ...args]);
  if (held && !hold.before) { hold.entered.resolve(); await hold.resume.promise; }
  return result;
}
async function load(name) {
  if (modules.has(name)) return modules.get(name);
  let module;
  if (name === "herdr") {
    const values = { hc, exec, terminals: () => observedTerminals };
    module = new SyntheticModule(Object.keys(values), function() { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  } else module = new SourceTextModule(await fs.readFile(path.join(source, name.replace("./", "")), "utf8"), { context, identifier: name });
  modules.set(name, module); await module.link(load); return module;
}
async function checkout(name) {
  const cwd = path.join(root, name); await fs.mkdir(cwd);
  await execute("git", ["init", "--quiet", cwd]);
  await execute("git", ["-C", cwd, "remote", "add", "origin", `https://example.com/core-tests/${name}.git`]);
  return { cwd, machine: null };
}
async function markdown(where, file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await execute("mq", ["--allow-http-import", "-I", "null", "-F", "raw", "--argjson", "content", JSON.stringify(content), "-o", file, 'import "github.com/harehare/okf.mq" | content'], { cwd: where.cwd, env: environment });
}

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "herdr-query-test-"));
  environment = { ...process.env, HC_SESSION: `mod-test-${randomUUID().slice(0, 8)}`, HOME: `${root}/home`, XDG_CONFIG_HOME: `${root}/config`, XDG_STATE_HOME: `${root}/state`, XDG_RUNTIME_DIR: `${root}/runtime` };
  environment.PI_CODING_AGENT_DIR = `${root}/agent`;
  environment.PATH = `${environment.HOME}/.local/bin:${root}/bin:${process.env.PATH}`;
  await fs.mkdir(`${root}/bin`);
  await fs.writeFile(`${root}/bin/omp`, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
  delete environment.HC_SOCKET; delete environment.HC_TERMINAL_ID;
  for (const key of ["HOME", "XDG_CONFIG_HOME", "XDG_STATE_HOME", "XDG_RUNTIME_DIR"]) await fs.mkdir(environment[key], { recursive: true, mode: 0o700 });
  await fs.mkdir(`${environment.HOME}/.local/bin`, { recursive: true });
  await fs.symlink(helper, `${environment.HOME}/.local/bin/herdr-context`);
  const data = await load("./data.js"); await data.evaluate();
  query = data.namespace.query; createQueryClient = data.namespace.createQueryClient;
  const processes = await load("./agents.js"); await processes.evaluate(); agents = processes.namespace;
});
after(async () => {
  for (const address of owned) await agents.stopAgent(address);
  if (environment) await hc(["server", "stop"]);
  if (root) await fs.rm(root, { recursive: true, force: true });
});

test("target-side context queries separate checkouts and reject collection symlink escapes", async () => {
  const a = await checkout("a"), b = await checkout("b");
  await query("setup", a, { store: "repository" }); await query("setup", b, { store: "repository" });
  const results = await Promise.all([query("context", a), query("context", b)]);
  assert.equal(results[0].repository, a.cwd); assert.equal(results[1].repository, b.cwd);
  assert.notEqual(results[0].identity, results[1].identity);
  await fs.writeFile(`${a.cwd}/preview.txt`, "first checkout\n");
  const preview = await query("file", a, { collection: "alignment", path: "preview.txt" });
  assert.equal(preview.body, "first checkout\n");
  await fs.writeFile(`${root}/outside.txt`, "must not be exposed\n");
  await fs.symlink(`${root}/outside.txt`, `${a.cwd}/escape.txt`);
  await assert.rejects(query("file", a, { collection: "alignment", path: "escape.txt" }), /leaves the resolved collection/);
});

test("a fresh local context polls until its record folders exist, then switches to scoped watches", async () => {
  const where = await checkout("new-watch-roots");
  const initial = await query("setup", where, { store: "repository" });
  assert.equal(localWatchFallback(where, initial, "tracker"), true);
  assert.deepEqual(localWatchPaths(where, initial, "tracker"), []);
  for (const collection of initial.collections) if (collection.path) await fs.mkdir(collection.path, { recursive: true });
  await fs.mkdir(`${where.cwd}/workflows`, { recursive: true });
  const ready = await query("context", where);
  assert.equal(localWatchFallback(where, ready, "tracker"), false);
  const watched = localWatchPaths(where, ready, "tracker");
  assert.ok(watched.includes(`${where.cwd}/tracker/tickets`));
  assert.ok(watched.includes(`${where.cwd}/workflows`));
  assert.ok(!watched.includes(where.cwd), "tracker watches do not expand to all repository changes");
});

test("file previews preserve UTF-8 and reject binary and oversized contents", async () => {
  const where = await checkout("previews");
  await query("setup", where, { store: "repository" });
  const text = 'line with "quotes"\nλ\n'.repeat(7000);
  await fs.writeFile(`${where.cwd}/preview.txt`, text);
  assert.equal((await query("file", where, { collection: "alignment", path: "preview.txt" })).body, text);
  await fs.writeFile(`${where.cwd}/binary.txt`, Buffer.from([0, 1, 2]));
  await assert.rejects(query("file", where, { collection: "alignment", path: "binary.txt" }), /binary/);
  await fs.writeFile(`${where.cwd}/large.txt`, "a".repeat(400001));
  await assert.rejects(query("file", where, { collection: "alignment", path: "large.txt" }), /400 KB/);
});

test("session cleanup refuses unrelated directories", async () => {
  const where = await checkout("cleanup");
  const unrelated = `${root}/unrelated`; await fs.mkdir(unrelated);
  await fs.writeFile(`${unrelated}/keep`, "preserve");
  await assert.rejects(query("discard-session", where, { session: unrelated }), /session|unrelated|Refusing/);
  assert.equal(await fs.readFile(`${unrelated}/keep`, "utf8"), "preserve");
});

test("Core owns an agent terminal with the requested working directory and record identity", async () => {
  const address = await agents.startAgent({ cwd: root, machine: null }, { repository: root, recordRef: "tracker/tickets/core-test.md", argv: ["sh", "-c", "exec sleep 60"] });
  owned.add(address);
  const view = {}, cx = { notify() { }, timer: { after(ms, callback) { setTimeout(callback, ms).unref(); } } };
  let ready = false;
  const waiting = agents.waitForAgent(view, address, cx).then(() => { ready = true; });
  await Promise.resolve(); assert.equal(ready, false);
  const result = await hc(["get", "--json", address]); assert.equal(result.code, 0);
  const terminal = JSON.parse(result.stdout);
  assert.equal(terminal.state, "live"); assert.equal(terminal.cwd, root);
  assert.equal(terminal.labels["shared-context.target"], "tracker/tickets/core-test.md"); assert.equal(terminal.parent, null);
  observedTerminals = [terminal]; agents.observeAgentLaunch(view); await waiting;
  assert.equal(ready, true); assert.equal(view.agentWaiter, null);
  observedTerminals = [];
  const cancelled = agents.waitForAgent(view, address, cx);
  const rejection = assert.rejects(cancelled, /selected action changed/);
  agents.cancelAgentWait(view); await rejection;
  await agents.stopAgent(address); owned.delete(address);
  assert.notEqual((await hc(["get", "--json", address])).code, 0);
});

async function trackerFixture(name, ids) {
  const where = await checkout(name);
  await query("setup", where, { store: "repository" });
  await markdown(where, `${where.cwd}/docs/agents/issue-tracker.md`, "---\nbackend: local-markdown\n---\n");
  const resolved = await query("context", where);
  const collection = resolved.collections.find(item => item.id === "tickets");
  await fs.mkdir(collection.path, { recursive: true });
  for (const id of ids) await markdown(where, `${collection.path}/${id}.md`, `---\nid: ${id}\ntitle: Ticket ${id}\nwork_status: open\nblocked_by: []\n---\n`);
  return where;
}

test("tracker jobs report measured phase counts before returning independent query results", async () => {
  const cases = [];
  for (const [name, ids] of [["progress-a", ["A", "B"]], ["progress-b", []]]) cases.push({ where: await trackerFixture(name, ids), ids, events: [], settled: false });
  await Promise.all(cases.map(async item => {
    const snapshot = await query("tracker", item.where, {}, progress => { assert.equal(item.settled, false); item.events.push(progress); });
    item.settled = true;
    assert.deepEqual(Array.from(snapshot.tickets, ticket => ticket.id).sort(), item.ids);
  }));
  for (const item of cases) {
    assert.equal(item.events.find(event => event.phase === "discover")?.total, null);
    for (const phase of ["read", "parse", "validate"]) {
      const events = item.events.filter(event => event.phase === phase);
      assert.equal(events[0]?.completed, 0);
      assert.equal(events[0]?.total, item.ids.length + 1);
      assert.equal(events.at(-1)?.completed, events[0].total);
      assert.ok(events.every((event, index) => event.total === events[0].total && event.completed >= (events[index - 1]?.completed ?? 0) && event.completed <= event.total));
    }
    const workflow = item.events.filter(event => event.phase === "workflows");
    assert.equal(workflow[0]?.completed, 0); assert.equal(workflow[0]?.total, item.ids.length); assert.equal(workflow.at(-1)?.completed, item.ids.length);
  }
  const remaining = JSON.parse((await hc(["ls", "--all", "--json"])).stdout).terminals;
  assert.equal(remaining.filter(terminal => terminal.labels?.["shared-context.query"]).length, 0);
  assert.deepEqual(await fs.readdir(`${environment.XDG_STATE_HOME}/herdr/shared-context-queries`), []);
});

test("releasing a tracker cell stops only its query worker and removes its job files", async () => {
  const where = await trackerFixture("cancel", ["CANCEL"]), client = createQueryClient();
  let released;
  const result = client.query("tracker", where, {}, () => { released ??= client.release(where); });
  await assert.rejects(result, error => error.code === "CANCELLED");
  await released;
  const remaining = JSON.parse((await hc(["ls", "--all", "--json"])).stdout).terminals;
  assert.equal(remaining.filter(terminal => terminal.labels?.["shared-context.query"]).length, 0);
  assert.deepEqual(await fs.readdir(`${environment.XDG_STATE_HOME}/herdr/shared-context-queries`), []);
  await client.release();
});

test("release removes validation job files before a delayed status response returns", async () => {
  const where = await trackerFixture("cancel-validation", ["SAFE"]), client = createQueryClient();
  await client.query("context", where);
  const entered = Promise.withResolvers(), resume = Promise.withResolvers();
  statusHold = { entered, resume };
  const pending = client.validate(where);
  const rejected = assert.rejects(pending, error => error.code === "CANCELLED");
  try {
    await entered.promise;
    await client.release(where);
    assert.deepEqual(await fs.readdir(`${environment.XDG_STATE_HOME}/herdr/shared-context-queries`), []);
  } finally {
    statusHold = null; resume.resolve();
    await rejected; await client.release();
  }
});

test("cancellation wins over a status read whose job was removed during cleanup", async () => {
  const where = await trackerFixture("cancel-status-race", ["SAFE"]), client = createQueryClient();
  await client.query("context", where);
  const entered = Promise.withResolvers(), resume = Promise.withResolvers();
  statusHold = { entered, resume, before: true };
  const pending = client.validate(where);
  const rejected = assert.rejects(pending, error => error.code === "CANCELLED");
  try {
    await entered.promise;
    await client.release(where);
  } finally {
    statusHold = null; resume.resolve();
    await rejected; await client.release();
  }
});

test("a named Core machine executes queries in its own home and cleans up remote tracker workers", async () => {
  const remote = { ...environment, HC_SESSION: `remote-${randomUUID().slice(0, 8)}`, HOME: `${root}/remote-home`, XDG_CONFIG_HOME: `${root}/remote-config`, XDG_STATE_HOME: `${root}/remote-state`, XDG_RUNTIME_DIR: `${root}/remote-runtime` };
  for (const key of ["HOME", "XDG_CONFIG_HOME", "XDG_STATE_HOME", "XDG_RUNTIME_DIR"]) await fs.mkdir(remote[key], { recursive: true, mode: 0o700 });
  await fs.mkdir(`${remote.HOME}/.local/bin`, { recursive: true });
  await fs.symlink(helper, `${remote.HOME}/.local/bin/herdr-context`);
  const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
  const via = ["env", ...["HOME", "XDG_CONFIG_HOME", "XDG_STATE_HOME", "XDG_RUNTIME_DIR"].map(key => `${key}=${quote(remote[key])}`), "sh", "-c"].join(" ");
  let added = false;
  try {
    const connection = await hc(["machine", "add", "--via", via, "--name", "query-box", "--session", remote.HC_SESSION, "--temp", "--json"]);
    assert.equal(connection.code, 0, connection.stderr || connection.stdout);
    added = true;
    const checkoutTarget = await checkout("remote-checkout"), where = { ...checkoutTarget, machine: "query-box" };
    await query("setup", where, { store: "shared" });
    const resolved = await query("context", where);
    assert.equal(resolved.repository, where.cwd);
    assert.ok(resolved.root.startsWith(`${remote.HOME}/`), "the helper must use the remote account's context storage");
    await markdown(where, `${resolved.root}/docs/agents/issue-tracker.md`, "---\nbackend: local-markdown\n---\n");
    const tracker = await query("tracker", where);
    assert.equal(tracker.repository, where.cwd);
    const records = JSON.parse((await hc(["ls", "--all", "--json"])).stdout).terminals;
    assert.equal(records.filter(record => record.labels?.["shared-context.query"]).length, 0);
  } finally {
    if (added) await hc(["machine", "rm", "query-box", "--json"]);
    await execute("hc", ["server", "stop"], { env: remote }).catch(error => { if (error.code !== 3) throw error; });
  }
});

test("preparing an action writes a private target-side prompt and cleanup removes only its session", async () => {
  const where = await trackerFixture("prepare", ["ASK"]);
  await markdown(where, `${environment.PI_CODING_AGENT_DIR}/bundles/core/skills/ask-matt/SKILL.md`, "# Ask Matt\n");
  const prepared = await query("prepare", where, { id: "ASK", kind: "ticket", action: "ask-matt", prompt: "Explain the risks.", harness: "omp" });
  try {
    const prompt = await fs.readFile(`${prepared.session}/prompt.md`, "utf8");
    assert.ok(prompt.includes("Explain the risks."));
    assert.ok(prompt.includes("ask-matt"));
    assert.equal((await fs.stat(`${prepared.session}/prompt.md`)).mode & 0o777, 0o600);
    assert.equal((await fs.stat(prepared.session)).mode & 0o777, 0o700);
    assert.equal(prepared.repository, where.cwd);
    assert.ok(prepared.argv.includes(`SHARED_CONTEXT_TARGET=${prepared.recordRef}`));
    assert.ok(!prepared.argv.includes("Explain the risks."));
  } finally {
    await query("discard-session", where, { session: prepared.session });
  }
  await assert.rejects(fs.stat(prepared.session), error => error.code === "ENOENT");
});
