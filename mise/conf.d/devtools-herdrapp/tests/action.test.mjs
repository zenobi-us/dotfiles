// Action launches use the SDK's pane/tab/space snapshots, including changes during startup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

async function launchFixture() {
  const context = createContext({ console });
  const modules = new Map(), live = new Map(), commands = [], discarded = [];
  const state = {
    focus: { space: "s1", tab: "tab1", pane: "p1", terminal: "t1" },
    panes: [{ pane: "p1", tab: "tab1", terminal: "t1" }],
    spaces: [{ id: "s1", tabs: [{ id: "tab1" }] }],
    beforeObserved() { },
  };
  const values = {
    herdr: {
      focused: () => state.focus, panes: () => state.panes, spaces: () => state.spaces,
      terminals() { state.beforeObserved(); return [...live.values()]; },
      run(name, args) { commands.push({ name, args: JSON.parse(JSON.stringify(args)) }); },
      closeOverlay() { },
      async hc(args) {
        if (args[0] === "run") live.set("t2", { address: "t2", state: "live" });
        if (args[0] === "kill") live.get(args[2]).state = "finished";
        if (args[0] === "rm") live.delete(args[2]);
        return { code: 0, stdout: args[0] === "run" ? JSON.stringify(live.get("t2")) : "{}", stderr: "" };
      },
    },
    "./data.js": {
      async query() { return { repository: "/repo", session: "/private/session", recordRef: "tracker/tickets/T.md", argv: ["agent"] }; },
      async discardSession(_given, session) { discarded.push(session); },
    },
  };
  async function load(name) {
    if (modules.has(name)) return modules.get(name);
    let module;
    if (values[name]) module = new SyntheticModule(Object.keys(values[name]), function() {
      for (const [key, value] of Object.entries(values[name])) this.setExport(key, value);
    }, { context });
    else module = new SourceTextModule(await readFile(new URL(`../app/mods/shared-context/${name.replace("./", "")}`, import.meta.url), "utf8"), { context });
    modules.set(name, module);
    await module.link(load);
    return module;
  }
  const action = await load("./action.js"); await action.evaluate();
  const view = { preferencesReady: true, preferences: { harness: "omp" }, revision: 1, context: { repository: "/repo" }, selected: { id: "T", kind: "ticket" } };
  const given = { cwd: "/repo", machine: null, space: "s1", id: "T", kind: "ticket", action: "review", prompt: "" };
  let finished, opened = false;
  const cx = { notify() { }, timer: { after() { } }, spawn(body) { finished = body(cx); } };
  return {
    state, view, live, commands, discarded, async launch() {
      action.namespace.launchAction(view, given, cx, () => { opened = true; });
      await finished;
      return opened;
    }
  };
}

test("review attaches its agent when the unchanged pane has only the SDK tab field", async () => {
  const fixture = await launchFixture();
  const opened = await fixture.launch();
  assert.equal(fixture.view.actionError, "");
  assert.equal(opened, true);
  assert.equal(fixture.live.get("t2")?.state, "live");
  assert.ok(fixture.commands.some(command => command.name === "terminal.keep" && command.args.terminal === "t2"));
  assert.deepEqual(fixture.discarded, []);
});

test("moving the target tab to another workspace stops only the unshown agent and removes its session", async () => {
  const fixture = await launchFixture();
  fixture.state.beforeObserved = () => {
    fixture.state.spaces = [{ id: "s1", tabs: [] }, { id: "s2", tabs: [{ id: "tab1" }] }];
  };
  assert.equal(await fixture.launch(), false);
  assert.match(fixture.view.actionError, /selected pane was closed or moved/);
  assert.equal(fixture.live.has("t2"), false);
  assert.ok(!fixture.commands.some(command => command.name === "terminal.keep"));
  assert.deepEqual(fixture.discarded, ["/private/session"]);
});

test("closing the target pane during startup stops the unshown agent and removes its session", async () => {
  const fixture = await launchFixture();
  fixture.state.beforeObserved = () => { fixture.state.panes = []; };
  assert.equal(await fixture.launch(), false);
  assert.match(fixture.view.actionError, /selected pane was closed or moved/);
  assert.equal(fixture.live.has("t2"), false);
  assert.deepEqual(fixture.discarded, ["/private/session"]);
});

test("a focus change during startup still attaches beside the original valid pane", async () => {
  const fixture = await launchFixture();
  fixture.state.beforeObserved = () => {
    fixture.state.focus = { space: "s2", tab: "tab2", pane: "p2", terminal: "t3" };
    fixture.state.spaces = [{ id: "s1", tabs: [{ id: "tab1" }] }, { id: "s2", tabs: [{ id: "tab2" }] }];
    fixture.state.panes = [{ pane: "p1", tab: "tab1", terminal: "t1" }, { pane: "p2", tab: "tab2", terminal: "t3" }];
  };
  assert.equal(await fixture.launch(), true);
  assert.equal(fixture.view.actionError, "");
  assert.equal(fixture.live.get("t2")?.state, "live");
  assert.ok(fixture.commands.some(command => command.name === "pane.focus" && command.args.pane === "p1"));
});
