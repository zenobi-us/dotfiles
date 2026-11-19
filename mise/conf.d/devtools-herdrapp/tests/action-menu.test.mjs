// Draft lifecycle checks prevent old instructions from leaking into a later task launch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

async function menuFixture() {
  const context = createContext({ Map, Object, JSON });
  const elements = new Map(), inputs = [], launches = [];
  function element(id) {
    const handlers = {};
    const node = new Proxy({ handlers }, {
      get(target, key) {
        if (key in target) return target[key];
        return (...args) => {
          if (key === "when") { if (args[0]) args[1](node); }
          else if (key === "id") elements.set(args[0], node);
          else if (key.startsWith("on_")) handlers[key] = args.at(-1);
          return node;
        };
      }
    });
    if (id) elements.set(id, node);
    return node;
  }
  const values = {
    "gpui-kit": { div: () => element() },
    "gpui-base": {
      h_flex: () => element(), v_flex: () => element(),
      Popup: { new: () => element() }, Input: { new: () => element() },
      InputState: {
        new() {
          let value = "";
          const handlers = {};
          const input = {
            on(event, handler) { handlers[event] = handler; }, value: () => value,
            set_value(next) { value = next; }, focus() { }, handlers
          };
          inputs.push(input); return input;
        }
      },
    },
    herdr: { theme: () => ({}) },
    "./ui.js": { note: () => element(), button(id, _label, handler) { const node = element(id); node.handlers.click = handler; return node; } },
    "./header-controls.js": { recordReasonButton: () => element() },
    "./action.js": {
      invalidateAction(view) { view.actionBusy = false; },
      launchAction(view, given, _cx, opened) { view.actionBusy = true; launches.push({ given, succeed() { view.actionBusy = false; opened(); }, fail() { view.actionBusy = false; view.actionError = "Launch failed"; } }); },
    },
  };
  const modules = new Map();
  async function load(name) {
    if (modules.has(name)) return modules.get(name);
    const exports = values[name];
    const module = exports ? new SyntheticModule(Object.keys(exports), function() {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context }) : new SourceTextModule(await readFile(new URL(`../app/mods/shared-context/${name.slice(2)}`, import.meta.url), "utf8"), { context });
    modules.set(name, module); await module.link(load); return module;
  }
  const module = await load("./action-menu.js"); await module.evaluate();
  const cx = { focus_handle: () => ({ focus() { }, is_focused: () => false }), notify() { }, stop_propagation() { } };
  const view = {};
  module.namespace.initActionMenus(view, cx);
  const given = { cwd: "/repo", kind: "ticket", id: "T", space: "s1" };
  const choice = { action: "review", label: "Review" };
  const draw = () => module.namespace.actionDropdown(view, choice, given);
  const click = id => { draw(); elements.get(id).handlers.click({}, cx); };
  return { view, inputs, launches, click, elements, element, cx, api: module.namespace, type(text) { inputs[0].set_value(text); inputs[0].handlers.change({}, cx); } };
}

test("a successful task launch clears additional instructions before the same action is reopened", async () => {
  const f = await menuFixture();
  f.click("action:review"); f.type("Check the keyboard path"); f.click("launch-action-prompt");
  assert.match(f.launches[0].given.prompt, /Check the keyboard path/);
  f.launches[0].succeed();
  f.click("action:review");
  assert.equal(f.inputs[0].value(), "");
  f.click("launch-action-prompt");
  assert.doesNotMatch(f.launches[1].given.prompt, /Check the keyboard path/);
});

test("a failed launch and a cancelled prompt retain unfinished instructions for retry", async () => {
  const f = await menuFixture();
  f.click("action:review"); f.type("Keep this retry detail"); f.click("launch-action-prompt");
  f.launches[0].fail();
  assert.equal(f.inputs[0].value(), "Keep this retry detail");
  f.click("cancel-action-prompt"); f.click("action:review");
  assert.equal(f.inputs[0].value(), "Keep this retry detail");
  f.click("launch-action-prompt");
  assert.match(f.launches[1].given.prompt, /Keep this retry detail/);
});

test("a secondary click selects its own record and keyboard navigation skips unavailable actions", async () => {
  const f = await menuFixture(), trigger = f.element();
  Object.assign(f.view, {
    selected: { id: "old", kind: "ticket" }, detail: { actions: [{ action: "review", label: "Old action" }] },
    context: { repository: "/repo" }, where: { machine: null, space: "s1" }, focus: f.cx.focus_handle(),
    choose(record, kind) { this.selected = { id: record.id, kind }; this.detail = null; this.detailLoading = true; },
  });
  const row = { path: "initiative:I/new", type: "ticket", record: { id: "new", title: "New ticket" } };
  const draw = () => f.api.recordContextMenu(f.view, row, trigger, false);
  draw(); trigger.handlers.on_mouse_down({}, f.cx); draw();
  assert.equal(f.view.selected.id, "new");
  assert.equal(f.elements.has("context-action:initiative:I/new:review"), false);
  f.view.detailLoading = false;
  f.view.detail = {
    actions: [
      { action: "start", label: "Start", disabledReason: "Already started" },
      { action: "review", label: "Review" }, { action: "finish", label: "Finish" },
    ]
  };
  draw();
  const menu = f.elements.get("record-context-menu:initiative:I/new");
  menu.handlers.on_key_down({ key: "down" }, f.cx);
  draw();
  f.elements.get("record-context-menu:initiative:I/new").handlers.on_key_down({ key: "enter" }, f.cx);
  assert.equal(f.view.actionOpen.choice.action, "finish");
  assert.equal(f.view.actionOpen.given.id, "new");
  assert.equal(f.view.recordContextOpen, null);
});
