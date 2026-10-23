import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { ProcessTerminal, TuiAltScreen, stripTerminalSequences, visibleWidth, type TuiMouseEvent } from "@earendil-works/pi-tui";
import { ContextOnboarding, readContextReadiness, type ContextReadiness } from "./onboarding";
import type { SharedAgentContext } from "./model";
import { initializeRepositoryContext, initializeSharedContext, migrateContextRoute, resolveSharedContext, ROUTE_MANIFEST_FILE, type Store } from "../../skills/shared-context/scripts/shared-context/lib";

const theme = { fg: (_token: string, text: string) => text, bg: (_token: string, text: string) => `\x1b[48;5;24m${text}\x1b[49m` } as Theme;
const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

async function fixture(): Promise<SharedAgentContext> {
  const root = await mkdtemp(path.join(os.tmpdir(), "context-onboarding-"));
  temporaryDirectories.push(root);
  const repositoryRoot = path.join(root, "repo");
  await mkdir(repositoryRoot);
  return resolveFixture({ repositoryRoot, candidateSharedRoot: path.join(root, "shared", "candidate") } as SharedAgentContext);
}

async function resolveFixture(context: SharedAgentContext): Promise<SharedAgentContext> {
  const resolved = await resolveSharedContext(async (_command, args) => {
    if (args.includes("--show-toplevel")) return { stdout: context.repositoryRoot, code: 0 };
    if (args.includes("get-url")) return { stdout: "https://github.com/example/onboarding.git", code: 0 };
    return { stdout: "", code: 1 };
  }, context.repositoryRoot, path.dirname(context.candidateSharedRoot!));
  if (!resolved) throw new Error("Could not resolve fixture context.");
  return resolved;
}

function mouse(x: number, y: number, type: TuiMouseEvent["type"] = "click"): TuiMouseEvent {
  return { type, button: "left", x, y, screenX: x, screenY: y, width: 80, height: 20, shift: false, alt: false, ctrl: false };
}

function button(modal: ContextOnboarding, label: string, width = 80): { x: number; y: number } {
  const rows = modal.render(width).map(stripTerminalSequences);
  const y = rows.findIndex(row => row.includes(label));
  expect(y).toBeGreaterThanOrEqual(0);
  return { x: visibleWidth(rows[y]!.slice(0, rows[y]!.indexOf(label))), y };
}

for (const store of ["repository", "shared"] as const) {
  test(`${store} setup is explicit, persists on reopen and preserves existing instructions`, async () => {
    const context = await fixture();
    const instructions = path.join(context.repositoryRoot, "AGENTS.md");
    await writeFile(instructions, "# Existing instructions\n");
    const calls: Array<[string, Store]> = [];
    const completed: boolean[] = [];
    const modal = new ContextOnboarding({
      context, readiness: await readContextReadiness(context), theme, height: () => 24,
      requestRender: () => {}, done: ready => completed.push(ready),
      run: async (action, selected) => {
        calls.push([action, selected]);
        if (action === "setup") {
          if (selected === "repository") await initializeRepositoryContext(context);
          else await initializeSharedContext(context);
        }
        return readContextReadiness(await resolveFixture(context));
      },
    });
    await modal.handleInput("\r");
    expect(calls).toEqual([]);
    if (store === "shared") {
      await modal.handleInput("\t");
      await modal.handleInput("\r");
    }
    const preview = modal.render(120).map(stripTerminalSequences).join("\n");
    expect(preview).toContain(store === "shared" ? context.candidateSharedRoot! : context.repositoryRoot);
    expect(preview).toContain(ROUTE_MANIFEST_FILE);
    if (store === "shared") {
      await modal.handleInput("\t");
    } else {
      await modal.handleInput("\x1b[Z");
      await modal.handleInput("\x1b[Z");
    }
    await modal.handleInput("\r");
    expect(calls).toEqual([["setup", store]]);
    expect(completed).toEqual([true]);
    expect(await readFile(instructions, "utf8")).toBe("# Existing instructions\n");
    const reopened = await resolveFixture(context);
    expect(reopened.storage).toBe(store);
    expect(await readContextReadiness(reopened)).toEqual({ routesConfigured: true, storesReady: true, missingStores: [] });
    if (store === "repository") await expect(stat(context.candidateSharedRoot!)).rejects.toMatchObject({ code: "ENOENT" });
    const manifest = path.join(store === "repository" ? context.repositoryRoot : context.candidateSharedRoot!, ROUTE_MANIFEST_FILE);
    const before = await readFile(manifest, "utf8");
    const reopenedActions: string[] = [];
    const reopenedModal = new ContextOnboarding({
      context: reopened, readiness: await readContextReadiness(reopened), theme, height: () => 20,
      requestRender: () => {}, done: () => {},
      run: async action => { reopenedActions.push(action); return readContextReadiness(reopened); },
    });
    await reopenedModal.handleInput("\r");
    expect(reopenedActions).toEqual(["check"]);
    expect(await readFile(manifest, "utf8")).toBe(before);
  });
}

test("cancel after choosing shared storage performs no initialization", async () => {
  const context = await fixture();
  const completed: boolean[] = [];
  let calls = 0;
  const modal = new ContextOnboarding({
    context, readiness: await readContextReadiness(context), theme, height: () => 20,
    requestRender: () => {}, done: ready => completed.push(ready),
    run: async () => { calls++; await initializeSharedContext(context); return readContextReadiness(await resolveFixture(context)); },
  });
  await modal.handleInput("\t");
  await modal.handleInput("\r");
  await modal.handleInput("\x1b");
  await modal.handleInput("\r");
  expect(calls).toBe(0);
  expect(completed).toEqual([false]);
  await expect(stat(context.candidateSharedRoot!)).rejects.toMatchObject({ code: "ENOENT" });
  await expect(stat(path.join(context.repositoryRoot, ROUTE_MANIFEST_FILE))).rejects.toMatchObject({ code: "ENOENT" });
});

test("existing repository tracker or layout routes are ready without shared registration", async () => {
  for (const adapter of ["local-markdown", "github", undefined]) {
    const context = await fixture();
    await mkdir(path.join(context.repositoryRoot, "docs/agents"), { recursive: true });
    await writeFile(path.join(context.repositoryRoot, "docs/agents/context-layout.toml"), 'schema = 1\n[paths]\ntracker = "docs/tracker"\nsources = "docs/sources"\n');
    const tracker = path.join(context.repositoryRoot, "docs/agents/issue-tracker.md");
    if (adapter) await writeFile(tracker, `---\nbackend: ${adapter}\n---\n`);
    const resolved = await resolveFixture(context);
    expect(resolved.mode).toBe("repository");
    expect(resolved.routeSource).toBe(adapter ? tracker : path.join(context.repositoryRoot, "docs/agents/context-layout.toml"));
    expect(await readContextReadiness(resolved)).toEqual({ routesConfigured: true, storesReady: true, missingStores: [] });
    await expect(stat(context.candidateSharedRoot!)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(path.join(context.repositoryRoot, "docs/tracker"))).rejects.toMatchObject({ code: "ENOENT" });
  }
});

test("repository routes ignore an invalid unused shared base and optional collections", async () => {
  const context = await fixture();
  await initializeRepositoryContext(context);
  const resolved = await resolveFixture(context);
  await mkdir(path.dirname(context.candidateSharedRoot!), { recursive: true });
  await writeFile(context.candidateSharedRoot!, "not a directory");
  expect(await readContextReadiness(resolved)).toEqual({ routesConfigured: true, storesReady: true, missingStores: [] });
  expect(await readContextReadiness({ ...resolved, candidateSharedRoot: undefined })).toEqual({ routesConfigured: true, storesReady: true, missingStores: [] });
});

test("mixed and inherited routes require only selected roots, external tickets have no file store", async () => {
  const context = await fixture();
  await initializeSharedContext(context);
  await migrateContextRoute(await resolveFixture(context), "alignment", "repository");
  const resolved = await resolveFixture(context);
  expect(resolved.mode).toBe("mixed");
  await rm(context.candidateSharedRoot!, { recursive: true });
  expect(await readContextReadiness(resolved)).toEqual({ routesConfigured: true, storesReady: false, missingStores: [context.candidateSharedRoot!] });
  const local = { ...resolved, routes: {
    alignment: { adapter: "local-markdown", store: "repository" },
    tickets: { adapter: "github", store: "shared" },
    initiatives: { adapter: "local-markdown", store: "repository" },
    workflows: { adapter: "local-markdown", store: "repository" },
    evidence: { adapter: "local-markdown", inherits: "workflows" },
    sources: { adapter: "local-markdown", inherits: "alignment" },
  } } as SharedAgentContext;
  expect(await readContextReadiness(local)).toEqual({ routesConfigured: true, storesReady: true, missingStores: [] });
  local.routes.workflows.store = "shared";
  expect((await readContextReadiness(local)).missingStores).toEqual([context.candidateSharedRoot!]);
});

test("required root errors are actionable and resolver errors propagate", async () => {
  const context = await fixture();
  context.routes.alignment.store = "shared";
  await mkdir(path.dirname(context.candidateSharedRoot!), { recursive: true });
  await writeFile(context.candidateSharedRoot!, "not a directory");
  await expect(readContextReadiness(context)).rejects.toThrow("Expected a directory");
  await expect(readContextReadiness({ ...context, error: "Invalid routes" })).rejects.toThrow("Invalid routes");
  await expect(readContextReadiness({ ...context, candidateSharedRoot: undefined })).rejects.toThrow("canonical Git origin");
});

test("established missing store offers check only, retries errors and never rewrites policy", async () => {
  const context = await fixture();
  await initializeSharedContext(context);
  const established = await resolveFixture(context);
  const policy = path.join(established.repositoryRoot, "policy.txt");
  await writeFile(policy, "keep");
  await rm(context.candidateSharedRoot!, { recursive: true });
  const actions: string[] = [];
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context: established, readiness: await readContextReadiness(established), theme, height: () => 20,
    requestRender: () => {}, done: ready => completed.push(ready),
    run: async action => {
      actions.push(action);
      if (actions.length === 1) throw new Error("Permission denied");
      return readContextReadiness(established);
    },
  });
  await modal.handleInput("\r");
  expect(modal.render(120).map(stripTerminalSequences).join("\n")).toContain("Permission denied");
  await modal.handleInput("\r");
  expect(completed).toEqual([]);
  await mkdir(context.candidateSharedRoot!, { recursive: true });
  await modal.handleInput("\r");
  expect(actions).toEqual(["check", "check", "check"]);
  expect(completed).toEqual([true]);
  expect(await readFile(policy, "utf8")).toBe("keep");
  await expect(stat(path.join(context.candidateSharedRoot!, ROUTE_MANIFEST_FILE))).rejects.toMatchObject({ code: "ENOENT" });
});

test("pending setup rejects duplicate input and disposal prevents late completion", async () => {
  const { promise, resolve } = Promise.withResolvers<ContextReadiness>();
  let runs = 0;
  let renders = 0;
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context: await fixture(), readiness: { routesConfigured: false, storesReady: true, missingStores: [] }, theme,
    height: () => 20, requestRender: () => { renders++; }, done: ready => completed.push(ready),
    run: () => { runs++; return promise; },
  });
  const target = button(modal, "Apply setup");
  modal.handleMouse(mouse(target.x, target.y, "press"));
  expect(runs).toBe(0);
  modal.handleMouse(mouse(target.x, target.y));
  await modal.handleInput("\r");
  modal.handleMouse(mouse(target.x, target.y));
  expect(runs).toBe(1);
  modal.dispose();
  const before = renders;
  resolve({ routesConfigured: true, storesReady: true, missingStores: [] });
  await promise;
  await Promise.resolve();
  expect(completed).toEqual([]);
  expect(renders).toBe(before);
});

test("successful setup with unavailable roots transitions to check rather than initializing twice", async () => {
  const actions: string[] = [];
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context: await fixture(), readiness: { routesConfigured: false, storesReady: true, missingStores: [] }, theme,
    height: () => 20, requestRender: () => {}, done: ready => completed.push(ready),
    run: async action => {
      actions.push(action);
      return { routesConfigured: true, storesReady: actions.length > 1, missingStores: actions.length > 1 ? [] : ["/offline"] };
    },
  });
  await modal.handleInput("\t");
  await modal.handleInput("\t");
  await modal.handleInput("\r");
  await modal.handleInput("\r");
  expect(actions).toEqual(["setup", "check"]);
  expect(completed).toEqual([true]);
});

test("narrow layouts retain bounded actions and keyboard cancellation", async () => {
  const context = await fixture();
  context.repositoryRoot += "/研究-very-long-repository-name-with-many-components";
  let height = 20;
  let runs = 0;
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context, readiness: await readContextReadiness(context), theme,
    height: () => height, requestRender: () => {}, done: ready => completed.push(ready),
    run: async () => { runs++; return { routesConfigured: true, storesReady: true, missingStores: [] }; },
  });
  const tui = new TuiAltScreen(new ProcessTerminal());
  tui.setFocus(modal);
  for (const [width, rows] of [[114, 36], [76, 21], [38, 10], [22, 10]]) {
    height = rows!;
    const lines = modal.render(width!);
    expect(lines.length).toBe(rows!);
    expect(lines.every(line => visibleWidth(line) === width)).toBe(true);
  }
  await modal.handleInput("\x1b[Z");
  await modal.handleInput(" ");
  expect(completed).toEqual([false]);
  expect(runs).toBe(0);
});

test("raw SGR mouse guards drags, stale bounds, right clicks and duplicate releases", async () => {
  let columns = 80;
  let rows = 24;
  let runs = 0;
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context: await fixture(), readiness: { routesConfigured: false, storesReady: true, missingStores: [] }, theme,
    height: () => Math.floor(rows * 0.9), viewport: () => ({ columns, rows }), requestRender: () => {},
    done: ready => completed.push(ready),
    run: async () => { runs++; return { routesConfigured: true, storesReady: true, missingStores: [] }; },
  });
  const target = button(modal, "Apply setup", 76);
  const x = target.x + 3;
  const y = target.y + 2;
  for (const events of [
    [`\x1b[<0;${x};${y}m`],
    [`\x1b[<2;${x};${y}M`, `\x1b[<2;${x};${y}m`],
    [`\x1b[<0;${x};${y}M`, `\x1b[<32;${x + 1};${y}M`, `\x1b[<0;${x};${y}m`],
    [`\x1b[<0;1;1M`, `\x1b[<0;${x};${y}m`],
    [`\x1b[<0;${x};${y}M`, `\x1b[<0;1;1m`],
  ]) {
    for (const event of events) await modal.handleInput(event);
  }
  await modal.handleInput(`\x1b[<0;${x};${y}M`);
  columns = 40;
  rows = 12;
  await modal.handleInput(`\x1b[<0;${x};${y}m`);
  expect(runs).toBe(0);
  const resized = button(modal, "Apply setup", 38);
  modal.handleMouse(mouse(0, resized.y));
  modal.handleMouse({ ...mouse(resized.x, resized.y), button: "right" });
  expect(runs).toBe(0);
  await modal.handleInput(`\x1b[<0;${resized.x + 2};${resized.y + 2}M`);
  modal.render(38);
  await modal.handleInput(`\x1b[<0;${resized.x + 2};${resized.y + 2}m`);
  await modal.handleInput(`\x1b[<0;${resized.x + 2};${resized.y + 2}m`);
  expect(runs).toBe(1);
  expect(completed).toEqual([true]);
});

test("detected shared choice survives setup failure and retries only on explicit apply", async () => {
  const context = await fixture();
  context.storage = "shared";
  const selections: Store[] = [];
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context, readiness: await readContextReadiness(context), theme, height: () => 20,
    requestRender: () => {}, done: ready => completed.push(ready),
    run: async (_action, store) => {
      selections.push(store);
      if (selections.length === 1) throw new Error("Storage unavailable");
      await initializeSharedContext(context);
      return readContextReadiness(await resolveFixture(context));
    },
  });
  await modal.handleInput("\r");
  expect(selections).toEqual([]);
  await modal.handleInput("\t");
  await modal.handleInput("\r");
  expect(completed).toEqual([]);
  expect(modal.render(120).map(stripTerminalSequences).join("\n")).toContain("Storage unavailable");
  await modal.handleInput("\r");
  expect(selections).toEqual(["shared", "shared"]);
  expect(completed).toEqual([true]);
});
