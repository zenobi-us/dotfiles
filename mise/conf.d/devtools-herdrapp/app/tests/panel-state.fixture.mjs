// Exercise the real panel methods with deterministic native/API response ordering.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { test } from "node:test";

async function harness() {
  const jobs = [], pending = [], launches = [], storage = new Map();
  let cwd = "/A";
  const context = createContext({ console, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
  const cx = { notify() { }, spawn(fn) { const job = fn(cx); jobs.push(job); return job; }, focus_handle() { return { focus() { } }; } };
  const request = (operation, repository, fields) => new Promise((resolve, reject) => pending.push({ operation, repository, fields, resolve, reject }));
  class NativeInput {
    handlers = new Map();
    text = "";
    on(event, callback) { this.handlers.set(event, callback); }
    set_value(text) { this.text = text; this.handlers.get("change")?.({}, cx); }
    value() { return this.text; }
    release() { }
  }
  const mocks = {
    "gpui-kit": { View: class { }, div() { } },
    "gpui-base": { h_flex() { }, v_flex() { }, TextView: {}, Scrollbar: {}, h_resizable() { }, resizable_panel() { }, Popup: {}, Input: {}, InputState: { new: () => new NativeInput() } },
    herdr: { spaces: () => [{ active: true, folder: cwd, id: "space" }], panes: () => [{ pane: "pane", cwd }], focused: () => ({ pane: "pane", space: "space" }), props: () => ({}), theme() { }, run: (name, args) => launches.push({ name, args }), nextCommand() { }, appHome: () => "/private-home", closeOverlay() { } },
    "./client.js": { request },
    "./preferences.js": { loadPreferences() { }, DEFAULTS: {} },
    "./ui.js": { button() { }, icon() { }, note() { }, select() { }, typeColor() { }, typeIcon() { } },
    "./graph-view.js": { graphView() { }, initGraphMenu() { }, renderGraphMenu() { } },
    "./header.js": { compactHeader() { } },
    "./progress-model.js": { initiativeProgress: () => new Map() },
    "./progress.js": { initiativeProgressRow() { } },
    "./activity-model.js": { workflowActivity: () => ({}) },
  };
  const modules = new Map();
  const load = async name => {
    if (modules.has(name)) return modules.get(name);
    let module;
    if (mocks[name]) {
      const values = mocks[name];
      module = new SyntheticModule(Object.keys(values), function() { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
    } else {
      module = new SourceTextModule(await readFile(new URL(`../mods/shared-context/${name.replace("./", "")}`, import.meta.url), "utf8"), { context, identifier: name });
    }
    modules.set(name, module);
    await module.link(load);
    return module;
  };
  const main = await load("./main.js");
  await main.evaluate();
  const view = new main.namespace.default();
  Object.assign(view, { mode: "context", preferencesReady: true, revision: 0, detailRevision: 0, fileRevision: 0, actionGeneration: 0, where: { cwd, space: "space" }, context: { repository: cwd }, saved: new Map(), fileFolders: new Set(), fileEntries: new Map(), filePending: new Set(), collapsed: new Set(), selected: { id: "alpha", kind: "ticket" }, actionOpen: {}, error: "", loading: false });
  modules.get("./action-menu.js").namespace.initActionMenus(view, cx);
  view.actionOpen = { draft: { detail: "" } };
  const take = operation => { const index = pending.findIndex(item => item.operation === operation); assert.notEqual(index, -1, `Missing ${operation} request`); return pending.splice(index, 1)[0]; };
  const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };
  return { view, cx, pending, launches, take, flush, storage, setCwd(value) { cwd = value; }, action: modules.get("./action.js").namespace };
}

const readyContext = { identity: "fixture", repository: "/A", ready: true, collections: [{ id: "alignment", path: "/A/docs" }] };
const launch = h => h.action.launchAction(h.view, { cwd: "/A", space: "space", id: "alpha", kind: "ticket", action: "ask-matt", prompt: "Harmless question" }, h.cx, () => { h.view.actionOpen = null; });
const prepared = { binary: "omp", repository: "/A", prompt: "Harmless question" };

test("refresh reloads retained descendants and settings restoration repopulates them", async () => {
  const h = await harness();
  h.view.fileFolders = new Set(["alignment:", "alignment:nested", "alignment:nested/deep"]);
  h.view.saved.set("fixture:/A", { fileFolders: h.view.fileFolders });
  for (const restoring of [false, true]) {
    h.view.viewKey = restoring ? null : "fixture:/A";
    h.view.refresh(h.cx);
    h.take("context").resolve(readyContext);
    await h.flush();
    const requests = h.pending.splice(0);
    assert.deepEqual(requests.map(item => item.fields.path), ["", "nested", "nested/deep"]);
    for (const request of requests) request.resolve([{ name: restoring ? "restored" : "changed", path: `${request.fields.path}/file`, directory: false }]);
    await h.flush();
    assert.equal(h.view.fileEntries.get("alignment:nested/deep")[0].name, restoring ? "restored" : "changed");
  }
});

test("an old repository directory response cannot populate the next repository", async () => {
  const h = await harness();
  h.view.loadFolder("alignment", "nested", h.cx);
  const old = h.take("directory");
  h.setCwd("/B"); h.view.follow(h.cx);
  old.resolve([{ name: "obsolete" }]);
  await h.flush();
  assert.equal(h.view.fileEntries.has("alignment:nested"), false);
});

test("preview B stays readable when older A fails", async () => {
  const h = await harness();
  h.view.openFile("alignment", "A", h.cx); const a = h.take("file");
  h.view.openFile("alignment", "B", h.cx); const b = h.take("file");
  b.resolve({ body: "B body" }); await h.flush();
  a.reject(new Error("Obsolete A error")); await h.flush();
  assert.equal(h.view.filePreview.body, "B body"); assert.equal(h.view.error, "");
});

for (const failure of [false, true]) test(`A-B-A rejects the first A ${failure ? "failure" : "success"}`, async () => {
  const h = await harness();
  h.view.openFile("alignment", "A", h.cx); const old = h.take("file");
  h.view.openFile("alignment", "B", h.cx); const b = h.take("file");
  h.view.openFile("alignment", "A", h.cx); const fresh = h.take("file");
  fresh.resolve({ body: "Fresh A" }); b.resolve({ body: "B" }); await h.flush();
  if (failure) old.reject(new Error("Obsolete A error")); else old.resolve({ body: "Obsolete A" });
  await h.flush();
  assert.equal(h.view.filePreview.body, "Fresh A"); assert.equal(h.view.error, "");
});

for (const change of ["repository", "record", "input", "close"]) for (const failure of [false, true]) test(`pending launch ignores old ${failure ? "error" : "success"} after ${change} change`, async () => {
  const h = await harness();
  launch(h); const old = h.take("prepare");
  if (change === "repository") { h.setCwd("/B"); h.view.follow(h.cx); }
  if (change === "record") h.view.choose({ id: "beta", ref: "beta.md" }, "ticket", h.cx);
  if (change === "input") h.view.actionInput.set_value("Changed instruction");
  if (change === "close") h.view.close();
  h.view.actionError = "Current selection error";
  if (failure) old.reject(new Error("Obsolete preparation error")); else old.resolve(prepared);
  await h.flush();
  assert.deepEqual(h.launches, []); assert.equal(h.view.actionError, "Current selection error"); assert.equal(h.view.actionBusy, false);
});

test("an unchanged launch opens exactly one fresh session and releases busy state", async () => {
  const h = await harness();
  launch(h); launch(h);
  h.take("prepare").resolve(prepared); await h.flush();
  assert.equal(h.launches.length, 1);
  assert.equal(h.launches[0].name, "pane.split");
  assert.equal(h.launches[0].args.pane, "pane");
  const argv = h.launches[0].args.argv;
  assert.deepEqual(Array.from(argv).slice(0, 4), ["omp", "--cwd", "/A", "--session-dir"]);
  assert.match(argv[4], /^\/private-home\/data\/shared-context-sessions\//);
  assert.equal(h.view.actionBusy, false); assert.equal(h.view.actionOpen, null);
});

test("obsolete completion cannot clear a newer launch's busy state", async () => {
  const h = await harness();
  launch(h); const old = h.take("prepare");
  h.action.invalidateAction(h.view); launch(h); const fresh = h.take("prepare");
  old.reject(new Error("Old error")); await h.flush();
  assert.equal(h.view.actionBusy, true); assert.equal(h.view.actionError, "");
  fresh.resolve(prepared); await h.flush();
  assert.equal(h.launches.length, 1); assert.equal(h.view.actionBusy, false);
});
