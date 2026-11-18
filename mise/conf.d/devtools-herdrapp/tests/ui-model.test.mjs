// UI decisions run without Core, the desktop, or filesystem watchers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { resolveLocation, targetKey, copyIsShown, localWatchPaths, localWatchFallback, completedAgentWork, RefreshQueue } from "../app/mods/shared-context/refresh-model.js";
import { client as queryClient } from "./query-client.mjs";
import { workflowActivity } from "../app/mods/shared-context/activity-model.js";
import { DEFAULT_FILTERS, filterRestrictions } from "../app/mods/shared-context/filter-model.js";
import { dependencyRows } from "../app/mods/shared-context/tree.js";
import { initiativeProgress } from "../app/mods/shared-context/progress-model.js";

const space = { id: "local-space", machine: null, folder: "/local", active: true, tabs: [{ id: "active-tab", active: true }] };
const terminal = { pane: "p1", terminal: "t1", cwd: "/local/pane" };
const focus = { pane: "p1", terminal: "t1", shown: "server/t9", cwd: "/remote/peek" };

function layout(mode = "tracker") {
  return { type: "column", children: [{ id: "panel", type: "stack", active: mode, children: ["tracker", "context"].map(mode => ({ id: mode, type: "block", content: { mod: "shared-context", props: { mode } } })) }] };
}

test("explicit location props win, including a local folder in a remote space", () => {
  assert.deepEqual(resolveLocation({ cwd: "/chosen", machine: "other", space: "s2" }, space, terminal, focus), { cwd: "/chosen", machine: "other", space: "s2" });
  assert.equal(resolveLocation({ cwd: "/chosen" }, { ...space, machine: "remote" }, terminal, focus).machine, null);
  assert.equal(resolveLocation({ machine: null }, space, terminal, focus).machine, null);
  assert.equal(resolveLocation({ machine: "explicit" }, space, terminal, focus).cwd, "/remote/peek");
});

test("a peek and a layout terminal use their terminal machine, not the active space", () => {
  assert.deepEqual(resolveLocation({}, space, terminal, focus), { cwd: "/remote/peek", machine: "server", space: space.id });
  assert.equal(resolveLocation({}, { ...space, machine: "wrong" }, null, { terminal: "server/t3", cwd: "/server" }).machine, "server");
  assert.equal(resolveLocation({}, { ...space, machine: "wrong" }, terminal, { terminal: "t1", cwd: "/local" }).machine, null);
  assert.deepEqual(resolveLocation({}, space, null, null), { cwd: "/local", machine: null, space: space.id });
});

test("target keys distinguish machine and folder but normalize absent local machine", () => {
  assert.equal(targetKey({ cwd: "/a" }), targetKey({ cwd: "/a", machine: null }));
  assert.notEqual(targetKey({ cwd: "/a", machine: "server" }), targetKey({ cwd: "/a" }));
  assert.notEqual(targetKey({ cwd: "/a" }), targetKey({ cwd: "/b" }));
});

test("only the shown stack child polls, and a hidden ancestor disables it", () => {
  const tree = layout();
  assert.equal(copyIsShown({}, "tracker", tree, [], [space]), true);
  assert.equal(copyIsShown({}, "context", tree, [], [space]), false);
  tree.children[0].hidden = true;
  assert.equal(copyIsShown({}, "tracker", tree, [], [space]), false);
  assert.equal(copyIsShown({}, "tracker", null, [], [space]), false);
});

test("explicit pane visibility respects active tabs and zoom; ambiguous copies do not poll", () => {
  const pane = { pane: "mod-pane", mod: "shared-context", tab: "active-tab" };
  assert.equal(copyIsShown({ pane: pane.pane }, "tracker", null, [pane], [space]), true);
  assert.equal(copyIsShown({ pane: pane.pane }, "tracker", null, [{ ...pane, tab: "hidden-tab" }], [space]), false);
  assert.equal(copyIsShown({ pane: pane.pane }, "tracker", null, [pane, { pane: "other", tab: "active-tab", zoomed: true }], [space]), false);
  const tree = layout();
  tree.children.push({ type: "block", hidden: true, content: { mod: "shared-context", props: { mode: "tracker" } } });
  assert.equal(copyIsShown({}, "tracker", tree, [], [space]), false);
  assert.equal(copyIsShown({ overlay: "o1" }, "tracker", tree, [], [space]), true);
});

test("remote paths never become local watches; local tracker watches include workflows", () => {
  const context = { collections: [{ id: "alignment", path: "/repo" }, { id: "tickets", path: "/repo/tracker/tickets" }, { id: "sources", path: "/shared/sources" }], watchPaths: ["/repo", "/repo/tracker/tickets", "/shared/workflows", "/shared/sources", "/shared/workflows", "relative"] };
  assert.deepEqual(localWatchPaths({ machine: "server" }, context, "tracker"), []);
  assert.deepEqual(localWatchPaths({ machine: null }, context, "tracker"), ["/repo/tracker/tickets", "/shared/workflows"]);
  assert.deepEqual(localWatchPaths({ machine: null }, context, "context"), ["/repo", "/repo/tracker/tickets", "/shared/workflows", "/shared/sources"]);
});

test("missing local watch folders enable polling only for the affected view", () => {
  const missingSources = { watchMissing: ["sources"] }, missingWorkflow = { watchMissing: ["workflow"] };
  assert.equal(localWatchFallback({ machine: null }, missingSources, "context"), true);
  assert.equal(localWatchFallback({ machine: null }, missingSources, "tracker"), false);
  assert.equal(localWatchFallback({ machine: null }, missingWorkflow, "tracker"), true);
  assert.equal(localWatchFallback({ machine: "remote" }, missingWorkflow, "tracker"), false);
});

test("a refresh burst coalesces into one trailing pass without overlap", () => {
  const queue = new RefreshQueue();
  assert.equal(queue.request(), true);
  for (let i = 0; i < 10; i++) assert.equal(queue.request(), false);
  assert.equal(queue.finish(), true);
  assert.equal(queue.request(), true);
  assert.equal(queue.finish(), false);
  assert.equal(queue.running, false);
  assert.equal(queue.queued, false);
});

test("only an observed relevant work-to-done or idle transition refreshes", () => {
  const previous = new Map([["server/t1", "working"], ["server/t2", "blocked"]]);
  assert.equal(completedAgentWork(previous, new Map([["server/t1", "done"]])), true);
  assert.equal(completedAgentWork(previous, new Map([["server/t2", "idle"]])), true);
  assert.equal(completedAgentWork(previous, new Map([["unrelated", "done"]])), false);
  assert.equal(completedAgentWork(previous, new Map([["server/t1", "blocked"]])), false);
  assert.equal(completedAgentWork(new Map([["server/t1", "done"]]), new Map([["server/t1", "idle"]])), false);
});

async function uiModules() {
  const context = createContext({ Date, Map, Set, Object, Proxy, Promise });
  const modules = new Map();
  const externals = { "gpui-kit": { View: class { }, div() { } }, "gpui-base": { h_flex() { }, v_flex() { }, Progress: {}, ProgressTrack: {}, ProgressIndicator: {} }, herdr: { theme() { } }, "./ui.js": { icon() { } } };
  async function load(name) {
    if (modules.has(name)) return modules.get(name);
    let module;
    if (externals[name]) {
      const values = externals[name];
      module = new SyntheticModule(Object.keys(values), function() { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
    } else {
      module = new SourceTextModule(await readFile(new URL(`../app/mods/shared-context/${name.slice(2)}`, import.meta.url), "utf8"), { context, identifier: name });
    }
    modules.set(name, module);
    await module.link(load);
    return module;
  }
  const retained = await load("./retained-views.js");
  await retained.evaluate();
  return { retained: retained.namespace, loading: modules.get("./loading.js").namespace };
}

test("progress redraws only its retained owners even when another mod resolves the task", async () => {
  const { retained, loading } = await uiModules();
  const notifications = [], timers = [], tasks = [];
  const view = { closed: false };
  function owner(kind) {
    const cx = {
      new(Class, props) {
        const child = new Class();
        child.init(props, owner(props.kind));
        return { kind: props.kind, release() { } };
      },
      spawn(body) { tasks.push(Promise.resolve(body(cx))); return { cancel() { } }; },
      notify(entity) {
        assert.equal(entity, undefined, "foreign ambient scopes must not resolve another view's Entity");
        notifications.push(kind);
      },
      timer: { every(_ms, callback) { timers.push(callback); return { cancel() { } }; } },
    };
    return cx;
  }
  const cx = owner("root");
  retained.initRetainedViews(view, cx);
  loading.beginLoading(view.retainedModel, cx);
  loading.updateLoading(view.retainedModel, { phase: "read", completed: 2, total: 8 }, cx);
  retained.notifyQueryStatus(view, cx);
  await new Promise(resolve => setImmediate(resolve));
  timers[0](cx);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(notifications.includes("status"));
  assert.ok(notifications.includes("loading"));
  assert.ok(!notifications.includes("root"));
  assert.ok(!notifications.includes("tree"));
  view.retainedModel.headerReason = { reason: "canonical reason" };
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(notifications.includes("root"), "structural changes still update parent layout");
  view.closed = true;
  view.requestRender();
  for (const signal of Object.values(view.surfaceSignals)) signal();
  await Promise.all(tasks);
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function rootModel(client, storage = new Map()) {
  const current = { where: { machine: null, cwd: "/repo" } }, tasks = [];
  const noop = () => { };
  client.validate ??= async () => [];
  client.isCurrent ??= () => false;
  client.peek ??= () => null;
  client.retainDetails ??= noop;
  const stubs = (...names) => Object.fromEntries(names.map(name => [name, noop]));
  const modules = {
    "gpui-kit": { View: class { }, div: noop },
    "gpui-base": stubs("h_flex", "v_flex", "TextView", "Scrollbar", "h_resizable", "resizable_panel"),
    herdr: stubs("props", "run", "nextCommand", "theme"),
    "./data.js": { createQueryClient: () => client },
    "./loading.js": stubs("beginLoading", "updateLoading", "stopLoading"),
    "./retained-views.js": stubs("initRetainedViews", "notifyQueryStatus", "releaseRetainedViews"),
    "./refresh.js": { ...stubs("initObservation", "scheduleObservation", "startRefreshResources", "stopRefreshResources", "updateLocalWatches"), currentLocation: given => given?.cwd ? resolveLocation(given, space, terminal, focus) : current.where },
    "./refresh-model.js": { targetKey, RefreshQueue },
    "./preferences.js": { loadPreferences: noop, DEFAULTS: {} },
    "./tree.js": { ...stubs("revealPath", "itemType"), dependencyRows: () => ({ canonical: new Map() }) },
    "./ui.js": stubs("button", "icon", "note", "select", "typeColor", "typeIcon"),
    "./graph-view.js": stubs("graphView", "initGraphMenu", "renderGraphMenu"),
    "./header.js": stubs("compactHeader"),
    "./header-controls.js": stubs("initHeaderControls", "clearHeaderControls", "renderHeaderReason"),
    "./progress-model.js": { initiativeProgress },
    "./progress.js": stubs("initiativeProgressRow"),
    "./activity-model.js": { workflowActivity },
    "./action-menu.js": stubs("initActionMenus"),
    "./action.js": stubs("invalidateAction"),
    "./agents.js": stubs("observeAgentLaunch"),
    "./filter-model.js": { DEFAULT_FILTERS },
    "./tree-filters.js": stubs("initTreeFilters", "treeFilters", "closeTreeFilters"),
    "./agent-model.js": stubs("agentActivitySummary"),
    "./agent-activity.js": stubs("agentDots"),
    "./metadata.js": stubs("openMetadata", "initMetadata", "renderMetadata"),
    "./settings.js": stubs("openSettings", "initSettings", "renderSettings"),
  };
  const context = createContext({ Date, Map, Set, Object, Promise, JSON, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
  const module = new SourceTextModule(await readFile(new URL("../app/mods/shared-context/main.js", import.meta.url), "utf8"), { context });
  await module.link(async name => {
    const values = modules[name];
    assert.ok(values, `Missing UI import stub: ${name}`);
    return new SyntheticModule(Object.keys(values), function() { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await module.evaluate();
  const view = new module.namespace.default();
  Object.assign(view, {
    client, closed: false, revision: 1, detailRevision: 0, fileRevision: 0,
    key: targetKey(current.where), where: current.where, mode: "tracker",
    pendingQueries: new Set(), selected: null, drawer: "peek", snapshot: null,
    remember: noop, changed: noop, refreshQueue: new RefreshQueue(),
  });
  const cx = { spawn(body) { tasks.push(Promise.resolve(body(cx))); return { cancel: noop }; } };
  return { view, current, tasks, cx };
}

test("cached trees show completed initiative progress before validation", async () => {
  const snapshot = { tickets: [{ id: "T", status: "completed" }], initiatives: [{ id: "I", ticketIds: ["T"] }] };
  const { view, current, tasks, cx } = await rootModel({
    release() { },
    peek(operation) { return operation === "tracker" ? snapshot : null; },
  });
  view.preferencesReady = true;
  current.where = { machine: null, cwd: "/cached" };
  view.follow(cx);
  assert.equal(view.progress.get("I").done, 1);
  assert.equal(view.progress.get("I").percent, 100);
  await Promise.all(tasks);
});

test("initiative progress follows workflow details as each ticket loads", async () => {
  const first = deferred(), second = deferred();
  const snapshot = {
    tickets: [{ id: "A", status: "ready" }, { id: "B", status: "ready" }],
    initiatives: [{ id: "I", ticketIds: ["A", "B"] }], states: {},
  };
  const { view, cx } = await rootModel({
    query(_operation, _where, fields) {
      return fields.id === "I" ? Promise.resolve({}) : ({ A: first, B: second })[fields.id].promise;
    },
  });
  view.snapshot = snapshot;
  view.progress = initiativeProgress(snapshot);
  const loading = view.loadDetails(cx, view.revision, snapshot);
  first.resolve({ state: { state: "DONE" } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(view.progress.get("I").done, 1);
  assert.equal(view.progress.get("I").unavailable, 1);
  second.resolve({ state: { state: "BLOCKED" } });
  await loading;
  assert.equal(view.progress.get("I").percent, 50);
  assert.equal(view.progress.get("I").blocked, 1);
  assert.equal(view.progress.get("I").unavailable, 0);
});

test("selected ticket refresh updates initiative progress without a tree reload", async () => {
  const { view, tasks, cx } = await rootModel({
    query() { return Promise.resolve({ state: { state: "ACTIVE" } }); },
  });
  view.snapshot = {
    tickets: [{ id: "T", status: "ready" }],
    initiatives: [{ id: "I", ticketIds: ["T"] }],
  };
  view.choose({ id: "T", ref: "tickets/T" }, "ticket", cx);
  await Promise.all(tasks);
  assert.equal(view.progress.get("I").active, 1);
  assert.equal(view.progress.get("I").percent, 0);
  assert.equal(view.progress.get("I").unavailable, 0);
});

test("an older record completion cannot replace a newer selection or a different machine", async () => {
  const first = deferred(), second = deferred(), third = deferred();
  const { view, current, tasks, cx } = await rootModel({
    query(_operation, _where, fields) { return ({ A: first, B: second, C: third })[fields.id].promise; },
  });
  view.choose({ id: "A", ref: "tickets/A" }, "ticket", cx);
  view.choose({ id: "B", ref: "tickets/B" }, "ticket", cx);
  second.resolve({ record: { id: "B" } });
  first.resolve({ record: { id: "A" } });
  await Promise.all(tasks);
  assert.equal(view.detail.record.id, "B");
  view.choose({ id: "C", ref: "tickets/C" }, "ticket", cx);
  current.where = { machine: "server", cwd: "/repo" };
  third.resolve({ record: { id: "C" } });
  await Promise.all(tasks);
  assert.equal(view.detail, null, "the selection's pending detail cannot commit on another machine before follow runs");
});

test("an older file completion cannot replace the latest file preview", async () => {
  const first = deferred(), second = deferred();
  const { view, tasks, cx } = await rootModel({
    query(_operation, _where, fields) { return fields.path === "a" ? first.promise : second.promise; },
  });
  view.openFile("alignment", "a", cx);
  view.openFile("alignment", "b", cx);
  second.resolve({ body: "latest" }); first.resolve({ body: "older" });
  await Promise.all(tasks);
  assert.equal(view.filePreview.body, "latest");
});

test("an old tracker completion cannot replace a snapshot after the repository changes", async () => {
  const tracker = deferred(), started = deferred();
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [] };
  const { view, current, tasks, cx } = await rootModel({
    invalidate() { },
    query(operation) {
      if (operation === "context") return Promise.resolve(context);
      started.resolve(); return tracker.promise;
    },
  });
  const retained = { tickets: [], initiatives: [], marker: "last successful" };
  view.snapshot = retained; view.context = context; view.viewKey = "repo:/repo";
  view.refresh(cx);
  await started.promise;
  current.where = { cwd: "/different", machine: null };
  tracker.resolve({ tickets: [], initiatives: [], marker: "late old target" });
  await Promise.all(tasks);
  assert.equal(view.snapshot, retained);
});

test("refresh failure keeps the last successful tracker snapshot and marks it stale", async () => {
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [] };
  const { view, tasks, cx } = await rootModel({
    invalidate() { },
    query(operation) { return operation === "context" ? Promise.resolve(context) : Promise.reject(new Error("Machine disconnected.")); },
  });
  const retained = { tickets: [], initiatives: [] };
  view.snapshot = retained; view.context = context; view.viewKey = "repo:/repo";
  view.refresh(cx);
  await Promise.all(tasks);
  assert.equal(view.snapshot, retained);
  assert.equal(view.stale, true);
  assert.equal(view.error, "Machine disconnected.");
  assert.equal(view.loading, false);
});

test("captured root props keep retained callbacks pinned when the focused terminal changes", async () => {
  const { view, current } = await rootModel({});
  view.given = { cwd: "/pinned", machine: "server" };
  view.key = targetKey(view.given);
  current.where = { cwd: "/unrelated", machine: null };
  assert.equal(view.current(view.revision), true);
  assert.equal(view.current(view.revision - 1), false);
});

test("an initial tracker failure does not claim that a tracker snapshot is retained", async () => {
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [] };
  const { view, tasks, cx } = await rootModel({
    invalidate() { },
    query(operation) { return operation === "context" ? Promise.resolve(context) : Promise.reject(new Error("Tracker read failed.")); },
  });
  view.context = context; view.viewKey = "repo:/repo";
  view.refresh(cx);
  await Promise.all(tasks);
  assert.equal(view.snapshot, null);
  assert.equal(view.stale, false);
});

test("large detail sweeps consume validated hits before misses can evict them", async () => {
  const requests = [];
  const client = await queryClient(async (operation, where, fields) => {
    if (operation === "validate") return fields.entries.map(entry => ({ identity: entry.identity, status: "unchanged" }));
    requests.push({ operation, id: fields.id });
    return operation === "detail" ? { record: { id: fields.id }, state: { state: "READY" } } : { identity: "repo" };
  });
  const { view, cx } = await rootModel(client);
  const tickets = Array.from({ length: 200 }, (_, index) => ({ id: `T${index}`, ref: `tickets/T${index}` }));
  const snapshot = { tickets, initiatives: [], states: {} };
  view.snapshot = snapshot;
  await client.query("context", view.where);
  await client.query("tracker", view.where, { tree: true });
  await view.loadDetails(cx, view.revision, snapshot);
  const retained = new Set(tickets.filter(record => client.isCurrent("detail", view.where, { id: record.id, kind: "ticket" })).map(record => record.id));
  await client.validate(view.where);
  requests.length = 0;
  await view.loadDetails(cx, view.revision, snapshot);
  assert.equal(requests.some(request => retained.has(request.id)), false, "unchanged retained details never transfer again");
  await client.query("context", view.where);
  await client.query("tracker", view.where, { tree: true });
  assert.equal(requests.some(request => request.operation !== "detail"), false, "detail scans preserve the current context and tree");
  assert.equal(view.detailProgress.completed, 200);
  await client.release();
});

test("a removed selected file disappears and its delayed read cannot restore the preview", async () => {
  const late = deferred(), context = { identity: "repo", repository: "/repo", ready: true, collections: [] };
  const { view, tasks, cx } = await rootModel({
    validate: async () => [{ operation: "file", fields: { collection: "alignment", path: "gone.txt" }, status: "removed" }],
    query: operation => operation === "file" ? late.promise : Promise.resolve(context),
  });
  Object.assign(view, { mode: "context", context, viewKey: "repo:/repo", fileSelection: { collection: "alignment", path: "gone.txt" }, filePreview: { body: "deleted content" }, fileFolders: new Set(), fileEntries: new Map() });
  view.openFile("alignment", "gone.txt", cx);
  view.refresh(cx);
  await tasks[1];
  late.resolve({ body: "late deleted content" }); await Promise.all(tasks);
  assert.equal(view.fileSelection, null);
  assert.equal(view.filePreview, null);
});

test("warm Files reconnect shows saved folders and preview stale before validation, then applies changes and removal", async () => {
  const storage = new Map(), where = { cwd: "/repo", machine: null };
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [{ id: "alignment", path: "/repo" }] };
  const directory = { collection: "alignment", path: "" }, file = { collection: "alignment", path: "a.md" };
  const seed = await queryClient(async operation => operation === "context" ? context : operation === "directory" ? [{ name: "a.md", path: "a.md", directory: false }] : { body: "cached preview" }, storage);
  await seed.query("context", where);
  await seed.query("directory", where, directory);
  await seed.query("file", where, file);
  const { view: previous } = await rootModel(seed, storage);
  Object.assign(previous, { viewKey: "repo:/repo", viewStorageKey: "shared-context:context:views:v1", saved: new Map(), filters: {}, collapsed: new Set(), fileFolders: new Set(["alignment:"]), fileSelection: file });
  delete previous.remember;
  previous.remember();
  const validation = deferred(), replacement = deferred();
  let removed = false;
  const warm = await queryClient(async (operation, _where, fields) => {
    if (operation === "validate") {
      await validation.promise;
      return fields.entries.map(entry => ({ identity: entry.identity, status: removed ? "removed" : "changed" }));
    }
    if (operation === "directory") return [{ name: "b.md", path: "b.md", directory: false }];
    if (operation === "file") return replacement.promise;
    return context;
  }, storage);
  const { view, cx, tasks } = await rootModel(warm, storage);
  const saved = new Map(JSON.parse(storage.get("shared-context:context:views:v1")).map(([key, state]) => [key, { ...state, collapsed: new Set(state.collapsed), fileFolders: new Set(state.fileFolders) }]));
  Object.assign(view, { mode: "context", key: "", where: null, preferencesReady: true, progress: new Map(), saved });
  view.follow(cx);
  view.refresh(cx);
  assert.equal(view.fileEntries.get("alignment:")[0].name, "a.md");
  assert.equal(view.filePreview.body, "cached preview");
  assert.equal(view.fileSelection.path, "a.md");
  assert.equal(view.stale, true);
  validation.resolve();
  await tasks[0];
  assert.equal(view.filePreview.body, "cached preview", "changed preview stays visible while its body is pending");
  assert.equal(view.stale, true);
  replacement.resolve({ body: "changed preview" });
  await Promise.all(tasks);
  assert.equal(view.fileEntries.get("alignment:")[0].name, "b.md");
  assert.equal(view.filePreview.body, "changed preview");
  assert.equal(view.stale, false);
  removed = true;
  view.refresh(cx);
  await Promise.all(tasks);
  assert.equal(view.fileSelection, null);
  assert.equal(view.filePreview, null);
  assert.equal(view.fileEntries.size, 0);
  assert.equal(view.fileFolders.size, 0);
  await Promise.all([seed.release(), warm.release()]);
});

test("warm Files validation cannot restore the old target after follow changes machines", async () => {
  const storage = new Map(), where = { cwd: "/repo", machine: null };
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [{ id: "alignment", path: "/repo" }] };
  const selection = { collection: "alignment", path: "a.md" }, waiting = deferred();
  const seed = await queryClient(async operation => operation === "context" ? context : { body: "local only" }, storage);
  await seed.query("context", where); await seed.query("file", where, selection);
  const warm = await queryClient(async (_operation, _where, fields) => { await waiting.promise; return fields.entries.map(entry => ({ identity: entry.identity, status: "unchanged" })); }, storage);
  const { view, current, cx, tasks } = await rootModel(warm);
  Object.assign(view, {
    mode: "context", key: "", where: null, preferencesReady: true, progress: new Map(),
    saved: new Map([["repo:/repo", { fileFolders: new Set(), fileSelection: selection }]])
  });
  view.follow(cx); view.refresh(cx);
  assert.equal(view.filePreview.body, "local only");
  current.where = { cwd: "/repo", machine: "remote" };
  view.follow(cx);
  waiting.resolve(); await Promise.all(tasks);
  assert.equal(view.context, null);
  assert.equal(view.filePreview, null);
  assert.equal(view.fileSelection, null);
  assert.equal(view.fileEntries.size, 0);
  await Promise.all([seed.release(), warm.release()]);
});

test("warm Tracker restores persisted selected description and activity before validation and retires removal", async () => {
  const storage = new Map(), where = { cwd: "/repo", machine: null };
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [] };
  const selected = { id: "A", kind: "ticket", ref: "tickets/A" };
  const snapshot = { tickets: [selected], initiatives: [] };
  const cached = { record: { id: "A", body: "cached description" }, workflow: { events: [{ id: "fix-1", phase: "fix", status: "completed" }] }, state: { state: "READY" } };
  const seed = await queryClient(async operation => operation === "context" ? context : operation === "tracker" ? snapshot : cached, storage);
  await seed.query("context", where); await seed.query("tracker", where, { tree: true }); await seed.query("detail", where, { id: "A", kind: "ticket" });
  storage.set("shared-context:tracker:views:v1", JSON.stringify([["repo:/repo", { selected, collapsed: [], fileFolders: [] }]]));
  const validation = deferred(), replacement = deferred();
  let classification = "unchanged";
  const warm = await queryClient(async (operation, _where, fields) => {
    if (operation === "validate") {
      await validation.promise;
      return fields.entries.map(entry => ({ identity: entry.identity, status: classification }));
    }
    if (operation === "context") return context;
    if (operation === "tracker") return classification === "removed" ? { tickets: [], initiatives: [] } : snapshot;
    return replacement.promise;
  }, storage);
  const { view, cx, tasks } = await rootModel(warm, storage);
  Object.assign(view, { key: "", where: null, preferencesReady: true, saved: new Map(JSON.parse(storage.get("shared-context:tracker:views:v1"))) });
  view.follow(cx); view.refresh(cx);
  assert.equal(view.detail.record.body, "cached description");
  assert.equal(view.activity.events[0].id, "fix-1");
  assert.equal(view.stale, true);
  validation.resolve(); await Promise.all(tasks);
  assert.equal(view.error, "");
  assert.equal(view.detail.record.body, "cached description");
  assert.equal(view.stale, false);
  classification = "changed";
  view.refresh(cx);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(view.detail.record.body, "cached description");
  assert.equal(view.stale, true, "a changed selected body remains stale while its replacement is pending");
  replacement.resolve({ ...cached, record: { id: "A", body: "changed description" }, workflow: { events: [{ id: "fix-2", phase: "fix", status: "completed" }] } });
  await Promise.all(tasks);
  assert.equal(view.detail.record.body, "changed description");
  assert.equal(view.activity.events[0].id, "fix-2");
  assert.equal(view.stale, false);
  classification = "removed";
  view.refresh(cx); await Promise.all(tasks);
  assert.equal(view.selected, null);
  assert.equal(view.detail, null);
  assert.equal(view.activity.events.length, 0);
  assert.equal(warm.peek("detail", where, { id: "A", kind: "ticket" }), null);
  await Promise.all([seed.release(), warm.release()]);
});

test("warm Tracker validation cannot restore selected detail or activity after a target switch", async () => {
  const storage = new Map(), where = { cwd: "/repo", machine: null }, waiting = deferred();
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [] };
  const selected = { id: "A", kind: "ticket", ref: "tickets/A" };
  const seed = await queryClient(async operation => operation === "context" ? context : operation === "tracker" ? { tickets: [selected], initiatives: [] } : { record: { body: "local description" }, workflow: {} }, storage);
  await seed.query("context", where); await seed.query("tracker", where, { tree: true }); await seed.query("detail", where, { id: "A", kind: "ticket" });
  const warm = await queryClient(async (_operation, _where, fields) => { await waiting.promise; return fields.entries.map(entry => ({ identity: entry.identity, status: "unchanged" })); }, storage);
  const { view, current, cx, tasks } = await rootModel(warm);
  Object.assign(view, { key: "", where: null, preferencesReady: true, saved: new Map([["repo:/repo", { selected }]]) });
  view.follow(cx); view.refresh(cx);
  assert.equal(view.detail.record.body, "local description");
  current.where = { cwd: "/repo", machine: "remote" }; view.follow(cx);
  waiting.resolve(); await Promise.all(tasks);
  assert.equal(view.detail, null);
  assert.equal(view.selected, null);
  assert.equal(view.activity.events.length, 0);
  await Promise.all([seed.release(), warm.release()]);
});

async function retainedTracker() {
  const where = { cwd: "/repo", machine: null };
  const context = { identity: "repo", repository: "/repo", ready: true, collections: [] };
  const records = ["A", "B"].map(id => ({ id, kind: "ticket", ref: `tickets/${id}` }));
  const body = (id, version) => ({ record: { id, body: `${id} description ${version}` }, workflow: { events: [{ id: `${id}-${version}`, phase: "fix", status: "completed" }] }, state: { state: "READY" } });
  const pending = deferred(), started = deferred();
  let replacing = false, removed = false;
  const client = await queryClient(async (operation, _where, fields) => {
    if (operation === "validate") return fields.entries.map(entry => ({ identity: entry.identity, status: replacing ? "changed" : "unchanged" }));
    if (operation === "context") return context;
    if (operation === "tracker") return { tickets: removed ? [records[1]] : records, initiatives: [] };
    if (replacing && fields.id === "A") { started.resolve(); return pending.promise; }
    return body(fields.id, "current");
  });
  const model = await rootModel(client);
  Object.assign(model.view, { context, viewKey: "repo:/repo", saved: new Map() });
  model.view.refresh(model.cx); await Promise.all(model.tasks);
  model.view.choose(records[0], "ticket", model.cx); await Promise.all(model.tasks);
  replacing = true;
  return { ...model, client, records, body, pending, started, remove() { removed = true; }, recover() { pending.promise = Promise.resolve(body("A", "recovered")); }, where };
}

for (const code of ["NOT_FOUND", "EIO"]) {
  test(`failed selected replacement (${code}) retains stale description/activity until successful retry`, async () => {
    const model = await retainedTracker();
    const { view, cx, tasks, client, pending, started, records, where } = model;
    view.refresh(cx); await started.promise;
    assert.equal(view.snapshot.tickets.length, 2, "the validated tree is usable before detail replacement");
    pending.reject(Object.assign(new Error("replacement failed"), { code }));
    await Promise.all(tasks);
    assert.equal(view.detail.record.body, "A description current");
    assert.equal(view.activity.events[0].id, "A-current");
    assert.equal(view.detailError, "replacement failed");
    assert.equal(client.isCurrent("detail", where, { id: "A", kind: "ticket" }), false);
    assert.equal(view.stale, true);
    assert.equal(view.detailProgress.completed, 1, "failed details are not applied progress");
    // Retry only the selected read, as a user can do without another tree sweep.
    model.recover();
    view.choose(records[0], "ticket", cx); await Promise.all(tasks);
    assert.equal(view.detail.record.body, "A description recovered");
    assert.equal(view.activity.events[0].id, "A-recovered");
    assert.equal(view.detailError, "");
    assert.equal(view.stale, false);
    await client.release();
  });
}

for (const outcome of ["failure", "success"]) {
  test(`late selected replacement ${outcome} cannot alter a newer selection or retired record`, async () => {
    const { view, cx, tasks, client, pending, started, records, body, remove } = await retainedTracker();
    view.refresh(cx); await started.promise;
    view.choose(records[1], "ticket", cx);
    if (outcome === "failure") pending.reject(new Error("late A failure"));
    else pending.resolve(body("A", "late"));
    await Promise.all(tasks);
    assert.equal(view.selected.id, "B");
    assert.equal(view.detail.record.body, "B description current");
    assert.equal(view.activity.events[0].id, "B-current");
    assert.equal(view.detailError, "");
    assert.equal(view.stale, false);
    remove(); view.refresh(cx); await Promise.all(tasks);
    assert.equal(view.snapshot.tickets.some(record => record.id === "A"), false);
    assert.equal(client.peek("detail", view.where, { id: "A", kind: "ticket" }), null);
    await client.release();
  });
}

for (const outcome of ["failure", "success"]) {
  test(`late replacement ${outcome} cannot change freshness after follow switches targets`, async () => {
    const { view, current, cx, tasks, client, pending, started, body } = await retainedTracker();
    view.refresh(cx); await started.promise;
    current.where = { cwd: "/repo", machine: "other" }; view.preferencesReady = true; view.follow(cx);
    assert.equal(view.stale, false);
    if (outcome === "failure") pending.reject(new Error("old target failure"));
    else pending.resolve(body("A", "old-target"));
    await Promise.all(tasks);
    assert.equal(view.detail, null);
    assert.equal(view.selected, null);
    assert.equal(view.activity.events.length, 0);
    assert.equal(view.stale, false);
    assert.equal(view.error, "");
    await client.release();
  });
}

function filterSnapshot() {
  const tickets = ["READY", "REVIEW", "FIX", "FINISH", "SUBMIT", "BLOCKED", "ERROR", "UNKNOWN", "DONE", "OTHER"].map(state => ({
    id: state, title: state, documentType: "ticket", status: state === "DONE" ? "completed" : "unclaimed", blockedBy: state === "READY" ? ["BLOCKED"] : [],
  }));
  return {
    tickets,
    initiatives: [{ id: "I", title: "Initiative", ticketIds: tickets.map(ticket => ticket.id) }],
    states: Object.fromEntries(tickets.map(ticket => [ticket.id, { state: ticket.id }])),
  };
}

test("tracker status queues combine with OR without expanding dependencies", () => {
  const snapshot = filterSnapshot();
  const rows = dependencyRows(snapshot, { initiatives: true, ready: true, review: true, blocked: false }, new Set()).rows;
  const tickets = rows.filter(row => row.type === "ticket");
  assert.deepEqual(tickets.map(row => row.record.id), ["READY", "REVIEW", "FIX", "FINISH", "SUBMIT"]);
  assert.ok(tickets.every(row => row.depth === 1 && row.children === 0));
  assert.deepEqual(snapshot.tickets[0].blockedBy, ["BLOCKED"]);
});

test("hiding initiatives keeps matching tickets visible outside initiative groups", () => {
  const rows = dependencyRows(filterSnapshot(), { initiatives: false, ready: false, review: false, blocked: true }, new Set()).rows;
  assert.equal(rows.some(row => row.type === "initiative"), false);
  assert.deepEqual(rows.filter(row => row.type === "ticket").map(row => [row.record.id, row.depth]), [["BLOCKED", 0], ["ERROR", 0], ["UNKNOWN", 0]]);
});

test("All includes completed and unclassified records that status queues omit", () => {
  const snapshot = filterSnapshot();
  const all = dependencyRows(snapshot, { ...DEFAULT_FILTERS }, new Set()).rows.filter(row => row.type === "ticket").map(row => row.record.id);
  assert.deepEqual(all, ["READY", "REVIEW", "FIX", "FINISH", "SUBMIT", "BLOCKED", "ERROR", "UNKNOWN", "DONE", "OTHER"]);
  const queues = dependencyRows(snapshot, { ...DEFAULT_FILTERS, initiatives: false }, new Set()).rows.filter(row => row.type === "ticket").map(row => row.record.id);
  assert.deepEqual(queues, ["READY", "REVIEW", "FIX", "FINISH", "SUBMIT", "BLOCKED", "ERROR", "UNKNOWN"]);
  assert.deepEqual(dependencyRows(snapshot, { initiatives: false, ready: false, review: false, blocked: false }, new Set()).rows, []);
});

test("restriction counts include hidden initiatives and disabled status queues", () => {
  assert.equal(filterRestrictions({ initiatives: false, ready: true, review: false, blocked: true }), 2);
  assert.equal(filterRestrictions({ initiatives: true, ready: false, review: false, blocked: false }), 3);
  assert.equal(filterRestrictions({ initiatives: false, ready: false, review: false, blocked: false }), 4);
});

test("repository filters and selections survive another repository and a mod reload", async () => {
  const storage = new Map(), first = { identity: "A", repository: "/a" }, second = { identity: "B", repository: "/b" };
  const { view, cx } = await rootModel({}, storage);
  delete view.remember;
  Object.assign(view, { saved: new Map(), viewStorageKey: "shared-context:tracker:views:v1" });
  view.restoreView(first);
  view.selected = { id: "READY", kind: "ticket", ref: "tracker/tickets/READY.md" };
  view.collapsed.add("initiative:I");
  view.fileFolders.add("alignment:docs");
  view.fileSelection = { collection: "alignment", path: "docs/guide.md" };
  view.setFilters({ initiatives: false, ready: true, review: false, blocked: true }, cx);
  view.restoreView(second);
  assert.equal(view.selected, null);
  assert.equal(view.fileSelection, null);
  assert.equal(view.filters.initiatives, true);
  view.setFilters({ initiatives: true, ready: false, review: true, blocked: false }, cx);

  const { view: reloaded } = await rootModel({}, storage);
  Object.assign(reloaded, { saved: new Map(JSON.parse(storage.get("shared-context:tracker:views:v1"))) });
  reloaded.restoreView(first);
  assert.equal(reloaded.filters.initiatives, false);
  assert.equal(reloaded.filters.ready, true);
  assert.equal(reloaded.filters.review, false);
  assert.equal(reloaded.filters.blocked, true);
  assert.equal(reloaded.selected.id, "READY");
  assert.equal(reloaded.fileSelection.path, "docs/guide.md");
  assert.ok(reloaded.collapsed.has("initiative:I"));
  assert.ok(reloaded.fileFolders.has("alignment:docs"));
  reloaded.restoreView(second);
  assert.equal(reloaded.filters.ready, false);
  assert.equal(reloaded.filters.review, true);
  assert.equal(reloaded.selected, null);
});
