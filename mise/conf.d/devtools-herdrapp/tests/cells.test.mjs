// Read-cell behavior is exercised with deferred transport results so target and invalidation races are deterministic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

const source = new URL("../app/mods/shared-context/data.js", import.meta.url);
const target = (cwd = "/repo", machine = null) => ({ cwd, machine });
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function cancelled() { return Object.assign(new Error("Query cancelled"), { code: "CANCELLED" }); }

async function client(runQuery) {
  const context = createContext({ console });
  const transport = new SyntheticModule(["runQuery", "forgetTarget", "targetKey", "cancelled"], function() {
    this.setExport("runQuery", runQuery);
    this.setExport("forgetTarget", () => { });
    this.setExport("targetKey", where => JSON.stringify([where.machine ?? null, where.cwd]));
    this.setExport("cancelled", cancelled);
  }, { context });
  const data = new SourceTextModule(await fs.readFile(source, "utf8"), { context });
  await data.link(() => transport); await data.evaluate();
  return data.namespace.createQueryClient();
}

const turn = () => new Promise(resolve => setImmediate(resolve));

test("read cells share matching work without mixing machines or selected records", async () => {
  const requests = [];
  const queries = await client((operation, where, fields) => {
    const waiting = deferred(); requests.push({ where, fields, waiting }); return waiting.promise;
  });
  const a = queries.query("detail", target(), { id: "A", kind: "ticket" });
  const again = queries.query("detail", target(), { kind: "ticket", id: "A" });
  const remote = queries.query("detail", target("/repo", "box"), { id: "A", kind: "ticket" });
  const other = queries.query("detail", target(), { id: "B", kind: "ticket" });
  assert.equal(requests.length, 3);
  requests[0].waiting.resolve({ title: "Local A" });
  requests[1].waiting.resolve({ title: "Remote A" });
  requests[2].waiting.resolve({ title: "Local B" });
  assert.deepEqual(await Promise.all([a, again, remote, other]), [{ title: "Local A" }, { title: "Local A" }, { title: "Remote A" }, { title: "Local B" }]);
  assert.equal((await queries.query("detail", target(), { id: "A", kind: "ticket" })).title, "Local A");
  assert.equal(requests.length, 3);
  await queries.release();
});

test("invalidating an in-flight read coalesces refresh and never publishes its obsolete result", async () => {
  const requests = [];
  const queries = await client(() => { const waiting = deferred(); requests.push(waiting); return waiting.promise; });
  let delivered = false;
  const result = queries.query("tracker", target()).then(value => { delivered = true; return value; });
  queries.invalidate(target()); queries.invalidate(target(), ["tracker"]);
  const joined = queries.query("tracker", target());
  requests[0].resolve({ revision: "old" });
  await turn();
  assert.equal(delivered, false);
  assert.equal(requests.length, 2);
  requests[1].resolve({ revision: "new" });
  assert.deepEqual(await result, { revision: "new" });
  assert.deepEqual(await joined, { revision: "new" });
  assert.equal(requests.length, 2);
  await queries.release();
});

test("releasing one target cancels its owned job and cannot cancel another target", async () => {
  const requests = [];
  const queries = await client((operation, where, fields, progress, control) => {
    const waiting = deferred();
    let stopped = false;
    control.cancel = () => { stopped = true; waiting.reject(cancelled()); };
    requests.push({ where, waiting, stopped: () => stopped });
    return waiting.promise;
  });
  const a = queries.query("tracker", target("/a"));
  const aRejected = assert.rejects(a, error => error.code === "CANCELLED");
  const b = queries.query("tracker", target("/b"));
  await queries.release(target("/a"));
  await aRejected;
  assert.equal(requests[0].stopped(), true);
  assert.equal(requests[1].stopped(), false);
  requests[1].waiting.resolve({ repository: "/b" });
  assert.deepEqual(await b, { repository: "/b" });
  await queries.release();
  await assert.rejects(queries.query("tracker", target("/a")), error => error.code === "CANCELLED");
});

test("refresh does not replay or combine user-requested mutations", async () => {
  let writes = 0;
  const waiting = deferred();
  const queries = await client(async operation => {
    if (operation === "setup") { writes++; await waiting.promise; return { initialized: writes }; }
    return { ready: true };
  });
  const first = queries.query("setup", target(), { store: "repository" });
  const second = queries.query("setup", target(), { store: "repository" });
  queries.invalidate(target());
  await queries.query("context", target());
  waiting.resolve();
  await Promise.all([first, second]);
  assert.equal(writes, 2);
  await queries.release();
});

test("a released read cannot deliver a late successful result", async () => {
  const waiting = deferred();
  const queries = await client(() => waiting.promise);
  const result = queries.query("file", target(), { collection: "alignment", path: "a.md" });
  const rejected = assert.rejects(result, error => error.code === "CANCELLED");
  await queries.release(target());
  waiting.resolve({ body: "obsolete" });
  await rejected;
});

test("a failed superseded read does not replace an explicitly requested refresh with its error", async () => {
  const requests = [];
  const queries = await client(() => { const waiting = deferred(); requests.push(waiting); return waiting.promise; });
  const result = queries.query("tracker", target());
  queries.invalidate(target());
  requests[0].reject(new Error("obsolete failure"));
  await turn();
  requests[1].resolve({ revision: "fresh" });
  assert.deepEqual(await result, { revision: "fresh" });
  await queries.release();
});
