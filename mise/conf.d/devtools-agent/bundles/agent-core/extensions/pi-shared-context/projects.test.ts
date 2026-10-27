import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext, Theme } from "@earendil-works/pi-coding-agent";
import type { TuiMouseEvent } from "@earendil-works/pi-tui";
import { initializeRepositoryContext, initializeSharedContext, listSharedContexts, migrateContextRoute, resolveSharedContext, resolveStoredContext } from "../../skills/shared-context/scripts/shared-context/lib";
import { ContextBrowser, openGraphContext } from "./index";
import { GraphExplorer, type ExplorerResult } from "./explorer";
import { SharedContextModal, type ProjectEntry, type ProjectWorkspace } from "./modal";
import { loadExplorerSnapshot } from "./data";
import type { Exec, SharedAgentContext } from "./model";

const cleanups: (() => void | Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const theme = { fg: (_token: string, value: string) => value, bg: (_token: string, value: string) => value } as Theme;
const exec: Exec = async (command, args) => {
  const child = Bun.spawn([command, ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, code] = await Promise.all([new Response(child.stdout).text(), child.exited]);
  return { stdout, code };
};
// Native filesystem watchers and their debounce timers require the platform clock.
async function until(condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 6000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("Modal did not display the expected project state.");
    await Bun.sleep(10);
  }
}
async function put(file: string, text: string): Promise<void> {
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, text);
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "context-projects-"));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  const base = join(root, "shared");
  const contexts: SharedAgentContext[] = [];
  for (const owner of ["alpha", "beta"]) {
    const repo = join(root, owner, "repo");
    await mkdir(repo, { recursive: true });
    for (const args of [["init", "--quiet", repo], ["-C", repo, "remote", "add", "origin", `https://github.com/${owner}/repo.git`]]) {
      if ((await exec("git", args)).code) throw new Error("Could not create the project fixture.");
    }
    let context = (await resolveSharedContext(exec, repo, base))!;
    if (owner === "alpha") await initializeRepositoryContext(context);
    else await initializeSharedContext(context);
    context = (await resolveSharedContext(exec, repo, base))!;
    await put(join(context.root, "docs/agents/issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
    await put(join(context.root, "tracker/tickets/item.md"), `---\nid: item\ntitle: ${owner} item\nwork_status: open\nblocked_by: []\n---\n${owner} description\n`);
    await put(join(context.root, "notes.txt"), `${owner} file contents`);
    contexts.push(context);
  }
  const [a, b] = contexts as [SharedAgentContext, SharedAgentContext];
  const entry = (context: SharedAgentContext): ProjectEntry => ({
    id: context.slug, name: "repo", identity: context.canonicalOrigin, checkout: true,
    resolve: async () => (await resolveSharedContext(exec, context.repositoryRoot, base))!,
  });
  const current = entry(a);
  let selected = a;
  let closed = false;
  let result: ExplorerResult;
  let modal: SharedContextModal;
  const create = (context: SharedAgentContext, checkout: boolean): ProjectWorkspace => {
    const files = new ContextBrowser(checkout ? context.root : context.candidateSharedRoot!, theme, () => { closed = true; }, () => {}, context.repositoryRoot, exec, () => {}, () => 30);
    const tracker = new GraphExplorer({
      context, theme, exec, live: true, checkoutAvailable: checkout,
      resolveContext: async () => context,
      contextChanged: updated => files.setRoot(checkout ? updated.root : updated.candidateSharedRoot!),
      done: value => { if (value?.kind === "files") modal.showFiles(); else result = value; },
      projects: () => { void modal.showProjects(); }, requestRender: () => {}, height: () => 30,
      commands: () => [{ name: "skill:ask-matt" }, { name: "skill:worktree" }],
    });
    return {
      context, tracker, files,
      activate: async () => { files.setRoot(checkout ? context.root : context.candidateSharedRoot!); files.startWatching(); await Promise.all([tracker.load(), files.load()]); },
      suspend: () => { tracker.suspend(); files.suspend(); },
      dispose: () => { tracker.dispose(); files.dispose(); },
    };
  };
  let list = async () => [entry(b), { ...current, name: "duplicate identity" }];
  const workspace = create(a, true);
  modal = new SharedContextModal(a, theme, workspace.tracker, workspace.files, () => {}, "tracker", {
    current, list: () => list(), create, selected: context => { selected = context; }, close: () => { closed = true; }, height: () => 30,
  });
  modal.attach(workspace);
  cleanups.push(() => modal.dispose());
  await workspace.activate();
  const view = () => modal.render(120).join("\n");
  return { root, base, a, b, modal, view, entry, setList: (next: typeof list) => { list = next; }, selected: () => selected, closed: () => closed, result: () => result };
}

test("Projects supports reverse focus, mouse breadcrumbs, canonical identities, and escape levels", async () => {
  const f = await fixture();
  await f.modal.handleInput("\x1b[Z");
  await f.modal.handleInput("\t");
  await f.modal.handleInput("\x1b[Z");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("github.com/alpha/repo");
  expect(f.view()).toContain("github.com/beta/repo");
  expect(f.view()).not.toContain("duplicate identity");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("alpha item");
  f.modal.handleMouse({ type: "click", button: "left", x: 3, y: 1 } as TuiMouseEvent);
  await until(() => f.view().includes("github.com/beta/repo"));
  await f.modal.handleInput("\r");
  await f.modal.handleInput("\x1b");
  await until(() => f.view().includes("github.com/beta/repo"));
  await f.modal.handleInput("\x1b");
  expect(f.closed()).toBe(true);
});

test("Projects filters names and identities by subsequence and opens the filtered action target", async () => {
  const f = await fixture();
  f.setList(async () => [{ ...f.entry(f.b), name: "Query Board 12" }]);
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  for (const key of "qybd12") await f.modal.handleInput(key);
  expect(f.view()).toContain("Projects (1/2)");
  expect(f.view()).toContain("Filter: qybd12");
  expect(f.view()).toContain("> Query Board 12");
  expect(f.view()).not.toContain("github.com/alpha/repo");
  expect(f.closed()).toBe(false);
  await f.modal.handleInput("\x15");
  expect(f.view()).toContain("Projects (2/2)");
  expect(f.view()).toContain("> Query Board 12");
  for (const key of "BTA/RP") await f.modal.handleInput(key);
  expect(f.view()).toContain("Projects (1/2)");
  expect(f.view()).toContain("> Query Board 12");
  await f.modal.handleInput("\r");
  expect(f.selected().canonicalOrigin).toBe(f.b.canonicalOrigin);
  expect(f.view()).toContain("beta item");
  await f.modal.handleInput("m");
  const result = f.result();
  if (result?.kind !== "session" || result.request.target.kind !== "ticket") throw new Error("Expected selected project action.");
  expect(result.request.target.ticket.title).toBe("beta item");
});

test("Projects zero results cannot open a stale selection and editing restores a valid target", async () => {
  const f = await fixture();
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  for (const key of "zzzz") await f.modal.handleInput(key);
  expect(f.view()).toContain("Projects (0/2)");
  expect(f.view()).toContain("Filter: zzzz");
  expect(f.view()).toContain("No projects match");
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  expect(f.selected().canonicalOrigin).toBe(f.a.canonicalOrigin);
  expect(f.view()).toContain("No projects match");
  for (let index = 0; index < 4; index++) await f.modal.handleInput("\x7f");
  for (const key of "beta") await f.modal.handleInput(key);
  expect(f.view()).toContain("Projects (1/2)");
  expect(f.view()).toContain("> repo");
  await f.modal.handleInput("\r");
  expect(f.selected().canonicalOrigin).toBe(f.b.canonicalOrigin);
});

test("Escape closes Projects with an active filter even when a breadcrumb has focus", async () => {
  const f = await fixture();
  await f.modal.showProjects();
  await f.modal.handleInput("q");
  expect(f.closed()).toBe(false);
  expect(f.view()).toContain("Filter: q");
  await f.modal.handleInput("\t");
  await f.modal.handleInput("\x1b");
  expect(f.closed()).toBe(true);
});

test("project switching owns tracker actions and Files while preserving each workspace", async () => {
  const f = await fixture();
  await f.modal.handleInput("6");
  await f.modal.handleInput("2");
  await f.modal.handleInput("\x1b[B");
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("beta item");
  expect(f.view()).toContain("Shared");
  expect(f.view()).not.toContain("alpha item");
  expect(f.selected().repositoryRoot).toBe(f.b.repositoryRoot);
  await f.modal.handleInput("m");
  expect(f.result()?.kind).toBe("session");
  const result = f.result();
  if (result?.kind === "session" && result.request.target.kind === "ticket") expect(result.request.target.ticket.title).toBe("beta item");
  else throw new Error("The selected project did not own the action target.");
  await f.modal.handleInput("2");
  expect(f.view()).toContain(f.b.root);
  expect(f.view()).not.toContain(f.a.root);
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[A");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain(f.a.root);
  expect(f.view()).not.toContain(f.b.root);
  await f.modal.handleInput("1");
  expect(f.view()).toContain("Ready-work Home · review");
  await f.modal.handleInput("2");
  await f.modal.handleInput("\x1b");
  expect(f.closed()).toBe(true);
});

test("stored projects remain readable without a checkout and disable action dispatch", async () => {
  const f = await fixture();
  f.setList(async () => (await listSharedContexts(f.base)).map(project => ({ id: project.slug, name: "repo", identity: project.slug, checkout: false, resolve: () => resolveStoredContext(project) })));
  await rm(f.b.repositoryRoot, { recursive: true });
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("beta item");
  expect(f.view()).toContain("Shared");
  await f.modal.handleInput("m");
  expect(f.view()).toContain("No usable checkout");
  expect(f.result()).toBeUndefined();
  await f.modal.handleInput("2");
  expect(f.view()).toContain("notes.txt");
  expect(f.view()).toContain(f.b.root);
});

test("stored GitHub projects retain their remote identity after checkout removal", async () => {
  const f = await fixture();
  const manifest = join(f.b.candidateSharedRoot!, ".context-routes.toml");
  await writeFile(manifest, (await readFile(manifest, "utf8")).replace('[records.tickets]\nadapter = "local-markdown"\nstore = "shared"', '[records.tickets]\nadapter = "github"'));
  await put(join(f.b.root, "docs/agents/issue-tracker.md"), "---\nbackend: github\n---\n");
  await rm(f.b.repositoryRoot, { recursive: true });
  const stored = await resolveStoredContext((await listSharedContexts(f.base)).find(project => project.slug === f.b.slug)!);
  const requests: string[][] = [];
  const githubExec: Exec = async (command, args) => {
    if (command !== "gh") return exec(command, args);
    requests.push(args);
    const response = args[0] === "issue"
      ? { number: 42, title: "Surviving GitHub issue", state: "OPEN", body: "", labels: [] }
      : args.at(-1) === "repos/beta/repo/issues?state=all&per_page=100" ? [[{ number: 42 }]] : [[]];
    return { code: 0, stdout: JSON.stringify(response) };
  };
  const snapshot = await loadExplorerSnapshot(stored, githubExec);
  expect(snapshot.tickets[0]?.title).toBe("Surviving GitHub issue");
  expect(requests.some(args => args.includes("beta/repo"))).toBe(true);
  expect(stored.canonicalOrigin).toBe("github.com/beta/repo");
});

test("empty, unreadable, and unavailable project states retain the current project", async () => {
  const f = await fixture();
  f.setList(async () => []);
  await f.modal.showProjects();
  expect(f.view()).toContain("No stored projects");
  expect(f.view()).toContain("github.com/alpha/repo");
  f.setList(async () => { throw new Error("permission denied"); });
  await f.modal.showProjects();
  expect(f.view()).toContain("Project list unreadable: permission denied");
  f.setList(async () => [{ ...f.entry(f.b), resolve: async () => { throw new Error("checkout missing"); } }]);
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("Project unavailable: checkout missing");
  await f.modal.handleInput("\x1b[A");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("alpha item");
});

test("inactive project updates do not replace the selected view and return refreshes its state", async () => {
  const f = await fixture();
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  await put(join(f.a.root, "tracker/tickets/item.md"), "---\nid: item\ntitle: alpha changed\nwork_status: open\n---\n");
  await put(join(f.b.root, "tracker/tickets/item.md"), "---\nid: item\ntitle: beta changed\nwork_status: open\n---\n");
  await until(() => f.view().includes("beta changed"));
  expect(f.view()).not.toContain("alpha changed");
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[A");
  await f.modal.handleInput("\r");
  await until(() => f.view().includes("alpha changed"));
  await put(join(f.a.root, "tracker/tickets/item.md"), "---\nid: item\ntitle: alpha live again\nwork_status: open\n---\n");
  await until(() => f.view().includes("alpha live again"));
});

test("cached Files follows newly resolved alignment routes before reading records", async () => {
  const f = await fixture();
  await f.modal.handleInput("2");
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  await initializeSharedContext(f.a);
  await put(join(f.a.candidateSharedRoot!, "new-shared-file.txt"), "new alignment root");
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[A");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("new-shared-file.txt");
  expect(f.view()).toContain(f.a.candidateSharedRoot!);
  expect(f.view()).toContain("Shared");
});

test("checkoutless mixed routes retain shared records with a Repo alignment indicator", async () => {
  const f = await fixture();
  const manifest = join(f.b.candidateSharedRoot!, ".context-routes.toml");
  await writeFile(manifest, (await readFile(manifest, "utf8")).replace('[records.alignment]\nadapter = "markdown"\nstore = "shared"', '[records.alignment]\nadapter = "markdown"\nstore = "repository"'));
  f.setList(async () => (await listSharedContexts(f.base)).map(project => ({ id: project.slug, name: "repo", identity: project.slug, checkout: false, resolve: () => resolveStoredContext(project) })));
  await rm(f.b.repositoryRoot, { recursive: true });
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("beta item");
  expect(f.view()).toContain("Repo");
  expect(f.view()).toContain("repository records unavailable");
  await f.modal.handleInput("m");
  expect(f.result()).toBeUndefined();
  expect(f.view()).toContain("No usable checkout");
  await f.modal.handleInput("2");
  expect(f.view()).toContain("notes.txt");
  expect(f.view()).toContain(f.b.candidateSharedRoot!);
});

test("returning to a project restores its ticket reader and scroll position", async () => {
  const f = await fixture();
  await put(join(f.a.root, "tracker/tickets/item.md"), `---\nid: item\ntitle: alpha long description\nwork_status: open\n---\n${Array.from({ length: 70 }, (_, index) => `Alpha description line ${index}`).join("\n")}`);
  await until(() => f.view().includes("alpha long description"));
  await f.modal.handleInput("\r");
  await f.modal.handleInput("\t");
  await f.modal.handleInput("\x1b[6~");
  expect(f.view()).toContain("Alpha description line 25");
  expect(f.view()).not.toContain("Alpha description line 0");
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[B");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("beta item");
  await f.modal.showProjects();
  await f.modal.handleInput("\x1b[A");
  await f.modal.handleInput("\r");
  expect(f.view()).toContain("Alpha description line 25");
  expect(f.view()).not.toContain("Alpha description line 0");
});

test("focus traversal re-enters the first or last tracker pane in traversal order", async () => {
  const f = await fixture();
  await put(join(f.a.root, "tracker/tickets/item.md"), `---\nid: item\ntitle: focus reader\nwork_status: open\n---\n${Array.from({ length: 90 }, (_, index) => `Focus description line ${index}`).join("\n")}`);
  await until(() => f.view().includes("focus reader"));
  await f.modal.handleInput("\r");
  for (let index = 0; index < 6; index++) await f.modal.handleInput("\t");
  await f.modal.handleInput("\x1b[6~");
  expect(f.view()).toContain("Focus description line 25");
  for (let index = 0; index < 5; index++) await f.modal.handleInput("\x1b[Z");
  await f.modal.handleInput("\x1b[6~");
  expect(f.view()).toContain("Focus description line 47");
});

test("the live modal recovers the deduplicated current project after checkout removal", async () => {
  const f = await fixture();
  f.modal.dispose();
  await initializeSharedContext(f.a);
  let current = (await resolveSharedContext(exec, f.a.repositoryRoot, f.base))!;
  await writeFile(join(f.a.repositoryRoot, "AGENTS.md"), await readFile(join(current.root, "AGENTS.md"), "utf8"));
  await migrateContextRoute(current, "alignment", "repository");
  current = (await resolveSharedContext(exec, f.a.repositoryRoot, f.base))!;
  const shared = current.candidateSharedRoot!;
  await put(join(shared, "tracker/tickets/item.md"), "---\nid: item\ntitle: Surviving current item\nwork_status: open\n---\n");
  await put(join(shared, "surviving.txt"), "Shared Files remain readable");
  const notifications: string[] = [];
  let dispatched = false;
  const pi = { getCommands: () => [{ name: "skill:ask-matt" }, { name: "skill:worktree" }] } as unknown as ExtensionAPI;
  const ctx = { ui: {
    notify: (message: string) => notifications.push(message),
    pasteToEditor: () => { dispatched = true; },
    custom: async (factory: Function) => {
      let finished = false;
      const component = factory({ terminal: { rows: 40 }, requestRender: () => {} }, theme, {}, () => { finished = true; });
      const view = () => component.render(120).join("\n");
      const waitFor = async (text: string) => {
        try { await until(() => view().includes(text)); }
        catch { throw new Error(`Expected ${text} in modal:\n${view()}`); }
      };
      const projects = async () => {
        component.handleMouse({ type: "click", button: "left", x: 3, y: 1 });
        await until(() => view().includes("(current)") && !view().includes("Loading projects"));
      };
      try {
        await waitFor("Surviving current item");
        component.handleInput("2");
        expect(view()).toContain(current.repositoryRoot);
        await projects();
        component.handleInput("\x1b[B");
        component.handleInput("\r");
        await waitFor("beta item");
        await rm(f.a.repositoryRoot, { recursive: true });
        await projects();
        expect(view().match(/\(current\)/g)).toHaveLength(1);
        component.handleInput("\x1b[A");
        component.handleInput("\r");
        await waitFor("surviving.txt");
        expect(view()).toContain(shared);
        component.handleInput("1");
        expect(view()).toContain("Surviving current item");
        expect(view()).toContain("repository records unavailable");
        component.handleInput("m");
        await waitFor("No usable checkout");
        expect(finished).toBe(false);
        expect(dispatched).toBe(false);
        await put(join(shared, "tracker/tickets/item.md"), "---\nid: item\ntitle: Current live after removal\nwork_status: open\n---\n");
        await waitFor("Current live after removal");
        component.handleInput("2");
        await put(join(shared, "after-removal.txt"), "New shared file");
        await waitFor("after-removal.txt");
        expect(notifications).toEqual([]);
        component.handleInput("\x03");
        expect(finished).toBe(true);
      } finally { component.dispose(); }
      return undefined;
    },
  } } as unknown as ExtensionCommandContext;
  await openGraphContext(pi, ctx, current, exec);
}, 15_000);

test("repository-only A can disappear while selected shared B keeps loading records", async () => {
  const f = await fixture();
  f.modal.dispose();
  expect(await Bun.file(join(f.a.candidateSharedRoot!, ".context-routes.toml")).exists()).toBe(false);
  const sessionCwd = f.a.repositoryRoot;
  const pi = { getCommands: () => [] } as unknown as ExtensionAPI;
  const ctx = { cwd: sessionCwd, ui: {
    notify: (message: string) => { throw new Error(message); },
    pasteToEditor: () => {},
    custom: async (factory: Function) => {
      const component = factory({ terminal: { rows: 40 }, requestRender: () => {} }, theme, {}, () => {});
      const view = () => component.render(120).join("\n");
      try {
        await until(() => view().includes("alpha item"));
        component.handleMouse({ type: "click", button: "left", x: 3, y: 1 });
        await until(() => view().includes(f.b.slug));
        component.handleInput("\x1b[B");
        component.handleInput("\r");
        await until(() => view().includes("beta item"));
        await rm(f.a.repositoryRoot, { recursive: true });
        await put(join(f.b.root, "tracker/tickets/item.md"), "---\nid: item\ntitle: B survives A removal\nwork_status: open\n---\n");
        await until(() => view().includes("B survives A removal"));
        component.handleInput("2");
        expect(view()).toContain("notes.txt");
        expect(ctx.cwd).toBe(sessionCwd);
      } finally { component.dispose(); }
      return undefined;
    },
  } } as unknown as ExtensionCommandContext;
  await openGraphContext(pi, ctx, f.a, async (command, args, cwd = sessionCwd) => {
    const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
    const [stdout, code] = await Promise.all([new Response(child.stdout).text(), child.exited]);
    return { stdout, code };
  });
}, 15_000);

for (const source of ["checkout", "remote"] as const) {
  test(`legacy hosted identity recovery from ${source} opens the complete modal without a checkout`, async () => {
    const f = await fixture();
    f.modal.dispose();
    const manifest = join(f.b.root, ".context-routes.toml");
    await writeFile(manifest, (await readFile(manifest, "utf8")).replace('[records.tickets]\nadapter = "local-markdown"\nstore = "shared"', '[records.tickets]\nadapter = "github"'));
    await put(join(f.b.root, "docs/agents/issue-tracker.md"), "---\nbackend: github\n---\n");
    const identity = join(f.b.root, ".context-project.json");
    await rm(identity);
    const home = join(f.root, "home");
    await put(join(home, ".config/shared-agent-context/config.json"), JSON.stringify({ storage_path: f.base }));
    const cli = join(import.meta.dir, "../../skills/shared-context/scripts/shared-context/cli.ts");
    const recover = async (remoteSource: string, value: string) => {
      const child = Bun.spawn([cli, "recover-identity", f.b.slug, remoteSource, value], {
        cwd: f.root,
        env: {
          ...process.env, HOME: home, MISE_CONFIG_DIR: join(home, ".config/mise"),
          MISE_DATA_DIR: join(home, ".local/share/mise"),
          PATH: `${join(process.execPath, "..")}:${process.env.PATH}`,
          BUN_INSTALL_CACHE_DIR: join(process.env.HOME!, ".bun/install/cache"),
        },
        stdout: "pipe", stderr: "pipe",
      });
      const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      return { stdout, stderr, code };
    };
    await expect(resolveStoredContext({ slug: f.b.slug, root: f.b.root })).rejects.toThrow("recover-identity");
    const wrong = await recover("--remote", "https://github.com/unrelated/repo.git");
    expect(wrong.code).toBe(1);
    expect(await Bun.file(identity).exists()).toBe(false);
    const originalManifest = await readFile(manifest, "utf8");
    const recovered = await recover(source === "checkout" ? "--checkout" : "--remote", source === "checkout" ? f.b.repositoryRoot : "git@github.com:beta/repo.git");
    if (recovered.code) throw new Error(`Identity recovery failed: ${recovered.stderr}`);
    expect(recovered.code).toBe(0);
    expect(await readFile(manifest, "utf8")).toBe(originalManifest);
    await rm(f.b.repositoryRoot, { recursive: true });
    const requests: string[][] = [];
    const githubExec: Exec = async (command, args) => {
      if (command !== "gh") return exec(command, args);
      requests.push(args);
      return { code: 0, stdout: JSON.stringify(args[0] === "issue"
        ? { number: 42, title: "Recovered legacy issue", state: "OPEN", body: "", labels: [] }
        : args.at(-1) === "repos/beta/repo/issues?state=all&per_page=100" ? [[{ number: 42 }]] : [[]]) };
    };
    const pi = { getCommands: () => [] } as unknown as ExtensionAPI;
    const ctx = { ui: {
      notify: (message: string) => { throw new Error(message); }, pasteToEditor: () => {},
      custom: async (factory: Function) => {
        const component = factory({ terminal: { rows: 40 }, requestRender: () => {} }, theme, {}, () => {});
        const view = () => component.render(120).join("\n");
        try {
          await until(() => view().includes("alpha item"));
          component.handleMouse({ type: "click", button: "left", x: 3, y: 1 });
          await until(() => view().includes(f.b.slug));
          component.handleInput("\x1b[B");
          component.handleInput("\r");
          await until(() => view().includes("Recovered legacy issue"));
          expect(requests.some(args => args.includes("beta/repo"))).toBe(true);
          component.handleInput("m");
          await until(() => view().includes("No usable checkout"));
          component.handleInput("2");
          expect(view()).toContain("notes.txt");
        } finally { component.dispose(); }
        return undefined;
      },
    } } as unknown as ExtensionCommandContext;
    await openGraphContext(pi, ctx, f.a, githubExec);
  }, 15_000);
}
