// UI decisions run without Core, the desktop, or filesystem watchers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { resolveLocation, targetKey, copyIsShown, localWatchPaths, localWatchFallback, completedAgentWork, RefreshQueue } from "../app/mods/shared-context/refresh-model.js";

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

async function rootModel(client) {
  const current = { where: { machine: null, cwd: "/repo" } }, tasks = [];
  const noop = () => { };
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
    "./tree.js": stubs("dependencyRows", "revealPath", "itemType"),
    "./ui.js": stubs("button", "icon", "note", "select", "typeColor", "typeIcon"),
    "./graph-view.js": stubs("graphView", "initGraphMenu", "renderGraphMenu"),
    "./header.js": stubs("compactHeader"),
    "./header-controls.js": stubs("initHeaderControls", "clearHeaderControls", "renderHeaderReason"),
    "./progress-model.js": { initiativeProgress: () => new Map() },
    "./progress.js": stubs("initiativeProgressRow"),
    "./activity-model.js": { workflowActivity: () => ({}) },
    "./action-menu.js": stubs("initActionMenus"),
    "./action.js": stubs("invalidateAction"),
    "./agents.js": stubs("observeAgentLaunch"),
    "./filter-model.js": { DEFAULT_FILTERS: {} },
    "./tree-filters.js": stubs("initTreeFilters", "treeFilters", "closeTreeFilters"),
    "./agent-model.js": stubs("agentActivitySummary"),
    "./agent-activity.js": stubs("agentDots"),
    "./metadata.js": stubs("openMetadata", "initMetadata", "renderMetadata"),
    "./settings.js": stubs("openSettings", "initSettings", "renderSettings"),
  };
  const context = createContext({ Date, Map, Set, Object, Promise, JSON, localStorage: { setItem: noop } });
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
