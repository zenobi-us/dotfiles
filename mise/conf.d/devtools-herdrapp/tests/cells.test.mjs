// Read-cell behavior is exercised with deferred transport results so target and invalidation races are deterministic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { client, cancelled } from "./query-client.mjs";

const target = (cwd = "/repo", machine = null) => ({ cwd, machine });
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

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

test("warm storage displays stale data then reuses bodies after one validation", async () => {
  const storage = new Map();
  const first = await client(async () => ({ title: "Cached A" }), storage);
  await first.query("detail", target(), { id: "A", kind: "ticket" });
  await first.release();
  const calls = [];
  const warm = await client(async (operation, where, fields) => {
    calls.push(operation);
    assert.equal(operation, "validate");
    return fields.entries.map(entry => ({ identity: entry.identity, status: "unchanged" }));
  }, storage);
  assert.equal(warm.peek("detail", target(), { id: "A", kind: "ticket" }).title, "Cached A");
  await warm.validate(target());
  assert.equal((await warm.query("detail", target(), { id: "A", kind: "ticket" })).title, "Cached A");
  assert.deepEqual(calls, ["validate"]);
  await warm.release();
});

test("unknown entries refresh and removed entries release pending consumers", async () => {
  let classification = "unknown", reads = 0;
  const queries = await client(async (operation, where, fields) => {
    if (operation === "validate") return fields.entries.map(entry => ({ identity: entry.identity, status: classification }));
    return { title: `Read ${++reads}` };
  });
  const fields = { id: "A", kind: "ticket" };
  await queries.query("detail", target(), fields);
  await queries.validate(target());
  assert.equal((await queries.query("detail", target(), fields)).title, "Read 2");
  classification = "removed";
  await queries.validate(target());
  assert.equal(queries.peek("detail", target(), fields), null);
  await queries.release();
});

test("tree membership prevents a delayed detail from restoring a deleted record", async () => {
  const waiting = deferred(), queries = await client(() => waiting.promise);
  const fields = { id: "A", kind: "ticket" };
  const pending = queries.query("detail", target(), fields);
  const rejected = assert.rejects(pending, error => error.code === "CANCELLED");
  queries.retainDetails(target(), { tickets: [], initiatives: [] });
  waiting.resolve({ record: { id: "A" } });
  await rejected;
  assert.equal(queries.peek("detail", target(), fields), null);
  await queries.release();
});

test("old validation cannot make a later invalidation current", async () => {
  const waiting = deferred();
  let reads = 0, token;
  const queries = await client(async (operation, where, fields) => {
    if (operation === "validate") { token = fields.entries[0]; return waiting.promise; }
    return { body: `Read ${++reads}` };
  });
  await queries.query("context", target());
  const validation = queries.validate(target());
  queries.invalidate(target());
  waiting.resolve([{ identity: token.identity, status: "unchanged" }]);
  await validation;
  assert.equal((await queries.query("context", target())).body, "Read 2");
  await queries.release();
});

test("corrupt persisted result bytes are a miss even with a valid cache token", async () => {
  const storage = new Map(), first = await client(async () => ({ title: "Original" }), storage);
  const fields = { id: "A", kind: "ticket" };
  await first.query("detail", target(), fields); await first.release();
  for (const [key, value] of storage) storage.set(key, value.replace("Original", "Tampered"));
  const next = await client(async () => ({ title: "Canonical" }), storage);
  assert.equal(next.peek("detail", target(), fields), null);
  assert.equal((await next.query("detail", target(), fields)).title, "Canonical");
  await next.release();
});

test("concurrent Files and Tracker clients preserve each other's persistent bodies", async () => {
  const storage = new Map(), requests = [];
  const transport = async (operation, where, fields) => {
    requests.push(operation);
    if (operation === "validate") return fields.entries.map(entry => ({ identity: entry.identity, status: "unchanged" }));
    return operation === "file" ? { body: fields.path } : { tickets: [{ id: "T", title: "Tracker retained" }] };
  };
  const files = await client(transport, storage), tracker = await client(transport, storage);
  await files.query("file", target(), { collection: "alignment", path: "one.txt" });
  await tracker.query("tracker", target());
  await files.query("file", target(), { collection: "alignment", path: "two.txt" });
  const warm = await client(transport, storage);
  requests.length = 0;
  await warm.validate(target());
  assert.equal((await warm.query("file", target(), { collection: "alignment", path: "one.txt" })).body, "one.txt");
  assert.equal((await warm.query("tracker", target())).tickets[0].title, "Tracker retained");
  assert.deepEqual(requests, ["validate"]);
  await files.release(); await tracker.release(); await warm.release();
});

test("a stale client's later persistence cannot restore a retired record", async () => {
  const storage = new Map();
  const old = await client(async () => ({ record: { id: "A" } }), storage);
  await old.query("detail", target(), { id: "A", kind: "ticket" });
  const current = await client(async () => ({}), storage);
  current.retainDetails(target(), { tickets: [], initiatives: [] });
  await old.query("context", target());
  const warm = await client(async () => ({}), storage);
  assert.equal(warm.peek("detail", target(), { id: "A", kind: "ticket" }), null);
  await old.release(); await current.release(); await warm.release();
});

test("changed previews stay stale while their replacement body is pending", async () => {
  const replacement = deferred();
  let reads = 0;
  const queries = await client(async (operation, where, fields) => {
    if (operation === "validate") return fields.entries.map(entry => ({ identity: entry.identity, status: "changed" }));
    return ++reads === 1 ? { body: "old" } : replacement.promise;
  });
  const fields = { collection: "alignment", path: "one.txt" };
  await queries.query("file", target(), fields);
  await queries.validate(target());
  const pending = queries.query("file", target(), fields);
  assert.equal(queries.isCurrent("file", target(), fields), false);
  assert.equal(queries.peek("file", target(), fields).body, "old");
  replacement.resolve({ body: "new" }); await pending;
  assert.equal(queries.isCurrent("file", target(), fields), true);
  await queries.release();
});

test("retirement overflow fences old snapshots while preserving fresh and cross-target values", async () => {
  const storage = new Map(), fields = { id: "A", kind: "ticket" };
  const old = await client(async () => ({ body: "deleted" }), storage);
  await old.query("detail", target(), fields);
  await old.query("file", target("/other"), { collection: "alignment", path: "keep.txt" });
  const current = await client(async () => ({ body: "new" }), storage);
  current.retainDetails(target(), { tickets: [], initiatives: [] });
  for (let index = 0; index < 140; index++) {
    await current.query("detail", target(), { id: `T${index}`, kind: "ticket" });
    current.retainDetails(target(), { tickets: [], initiatives: [] });
  }
  assert.ok((current.retired?.size ?? 0) <= 128, "retirement bookkeeping must remain bounded");
  await old.query("context", target());
  const warm = await client(async () => ({}), storage);
  assert.equal(warm.peek("detail", target(), fields), null);
  assert.equal(warm.peek("file", target("/other"), { collection: "alignment", path: "keep.txt" }).body, "deleted");
  assert.ok([...storage.values()].every(value => value.length * 2 <= 8 * 1024 * 1024));
  await current.query("detail", target(), fields);
  await old.query("tracker", target("/other"));
  const fresh = await client(async () => ({}), storage);
  assert.equal(fresh.peek("detail", target(), fields).body, "new", "fresh reads after retirement can publish the same key");
  await Promise.all([old.release(), current.release(), warm.release(), fresh.release()]);
});

test("a read started before another client's deletion cannot republish that deleted body", async () => {
  const storage = new Map(), fields = { collection: "alignment", path: "gone.txt" };
  const seed = await client(async () => ({ body: "deleted" }), storage);
  await seed.query("file", target(), fields);
  const late = deferred(), old = await client(() => late.promise, storage);
  const pending = old.query("file", target(), fields);
  const current = await client(async (_operation, _where, args) => args.entries.map(entry => ({ identity: entry.identity, status: "removed" })), storage);
  await current.validate(target());
  late.resolve({ body: "deleted" }); await pending;
  const warm = await client(async () => ({}), storage);
  assert.equal(warm.peek("file", target(), fields), null);
  await Promise.all([seed.release(), old.release(), current.release(), warm.release()]);
});

test("older concurrent reads and retirements cannot replace a newer same-target value", async () => {
  const storage = new Map(), fields = { id: "A", kind: "ticket" };
  const seed = await client(async () => ({ title: "original" }), storage);
  await seed.query("detail", target(), fields);
  const waiting = deferred(), oldRead = await client(() => waiting.promise, storage);
  const pending = oldRead.query("detail", target(), fields);
  const oldRemoval = await client(async () => ({}), storage);
  const current = await client(async () => ({ title: "newer" }), storage);
  await current.query("detail", target(), fields);
  waiting.resolve({ title: "obsolete" }); await pending;
  oldRemoval.retainDetails(target(), { tickets: [], initiatives: [] });
  const warm = await client(async () => ({}), storage);
  assert.equal(warm.peek("detail", target(), fields).title, "newer");
  await Promise.all([seed.release(), oldRead.release(), oldRemoval.release(), current.release(), warm.release()]);
});
