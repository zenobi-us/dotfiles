import { afterEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { initializeRepositoryContext, initializeSharedContext, migrateContextRoute, resolveSharedContext, ROUTE_MANIFEST_FILE, slugifyGitRemote, type Exec } from "../lib";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })));
});

async function fixture(adapter?: string) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "context-setup-"));
  directories.push(directory);
  const repo = path.join(directory, "repo");
  const home = path.join(directory, "home");
  const base = path.join(directory, "shared");
  const origin = "https://github.com/Owner/Setup.git";
  await fs.mkdir(repo);
  await fs.mkdir(path.join(home, ".config/shared-agent-context"), { recursive: true });
  await fs.writeFile(path.join(home, ".config/shared-agent-context/config.json"), JSON.stringify({ storage_path: base }));
  if (adapter) {
    await fs.mkdir(path.join(repo, "docs/agents"), { recursive: true });
    await fs.writeFile(path.join(repo, "docs/agents/issue-tracker.md"), `---\nbackend: ${adapter}\n---\n`);
  }
  const exec: Exec = async (_command, args) => ({ stdout: args.includes("--show-toplevel") ? repo : origin, code: 0 });
  const resolve = async () => (await resolveSharedContext(exec, repo, base))!;
  const setup = (options: unknown, setupOrigin = origin) => {
    const script = `
      import { initializeContextForCwd } from ${JSON.stringify(path.join(import.meta.dir, "../api.ts"))};
      const exec = async (_command, args) => ({ stdout: args.includes("--show-toplevel") ? ${JSON.stringify(repo)} : ${JSON.stringify(setupOrigin)}, code: 0 });
      try {
        console.log(JSON.stringify(await initializeContextForCwd(exec, ${JSON.stringify(repo)}, ${JSON.stringify(options)})));
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
      }
    `;
    const result = Bun.spawnSync([process.execPath, "--eval", script], { env: { ...process.env, HOME: home }, stdout: "pipe", stderr: "pipe" });
    return { code: result.exitCode, output: result.stdout.toString(), error: result.stderr.toString() };
  };
  return { repo, home, base, shared: path.join(base, slugifyGitRemote(origin)), setup, resolve };
}

test("repository setup reopens locally, preserves authored files, and never creates shared storage", async () => {
  const f = await fixture();
  await fs.writeFile(path.join(f.repo, "AGENTS.md"), "authored instructions");
  await fs.writeFile(path.join(f.repo, "CONTEXT-MAP.md"), "authored map");
  expect(f.setup({ store: "repository" }).code).toBe(0);
  const manifest = await fs.readFile(path.join(f.repo, ROUTE_MANIFEST_FILE), "utf8");
  expect(f.setup({ store: "repository" }).code).toBe(0);
  expect(await fs.readFile(path.join(f.repo, ROUTE_MANIFEST_FILE), "utf8")).toBe(manifest);
  expect(await fs.readFile(path.join(f.repo, "AGENTS.md"), "utf8")).toBe("authored instructions");
  expect(await fs.readFile(path.join(f.repo, "CONTEXT-MAP.md"), "utf8")).toBe("authored map");
  const reopened = await f.resolve();
  expect(reopened.mode).toBe("repository");
  expect(reopened.routeSource).toBe(path.join(f.repo, ROUTE_MANIFEST_FILE));
  await expect(fs.stat(f.base)).rejects.toMatchObject({ code: "ENOENT" });
  await expect(fs.stat(path.join(f.repo, "tracker"))).rejects.toMatchObject({ code: "ENOENT" });
});

test("shared setup reopens without changing authored repository files", async () => {
  const f = await fixture();
  await fs.writeFile(path.join(f.repo, "AGENTS.md"), "repository instructions");
  const result = f.setup({ store: "shared" });
  expect(result.code).toBe(0);
  expect(JSON.parse(result.output)).toMatchObject({ store: "shared", hostedShared: false });
  const context = await f.resolve();
  expect(context.mode).toBe("shared");
  expect(context.routes.tickets).toEqual({ adapter: "local-markdown", store: "shared" });
  expect(f.setup({ store: "shared" }).code).toBe(0);
  expect(await fs.readFile(path.join(f.repo, "AGENTS.md"), "utf8")).toBe("repository instructions");
});

test("repository tracker configuration rejects shared setup before writing a shared policy", async () => {
  const f = await fixture("local-markdown");
  const tracker = await fs.readFile(path.join(f.repo, "docs/agents/issue-tracker.md"), "utf8");
  const result = f.setup({ store: "shared" });
  expect(result.code).toBe(1);
  expect(result.error).toContain("Migrate");
  expect((await f.resolve()).mode).toBe("repository");
  expect(await fs.readFile(path.join(f.repo, "docs/agents/issue-tracker.md"), "utf8")).toBe(tracker);
  await expect(fs.stat(f.base)).rejects.toMatchObject({ code: "ENOENT" });
});

test("hosted-shared setup preserves external tickets after explicit shared initialization", async () => {
  const f = await fixture("github");
  await initializeSharedContext(await f.resolve());
  const before = await f.resolve();
  const result = f.setup({ store: "shared", preset: "hosted-shared" });
  expect(result.code).toBe(0);
  expect(JSON.parse(result.output)).toMatchObject({ store: "shared", hostedShared: true });
  expect((await f.resolve()).routes).toEqual(before.routes);
});
test("setup refuses opposite configured storage before creating files", async () => {
  for (const store of ["repository", "shared"] as const) {
    const f = await fixture();
    expect(f.setup({ store }).code).toBe(0);
    const root = store === "repository" ? f.repo : f.shared;
    const manifest = await fs.readFile(path.join(root, ROUTE_MANIFEST_FILE), "utf8");
    const result = f.setup({ store: store === "repository" ? "shared" : "repository" });
    expect(result.code).toBe(1);
    expect(result.error).toContain("Migrate");
    expect(await fs.readFile(path.join(root, ROUTE_MANIFEST_FILE), "utf8")).toBe(manifest);
    if (store === "repository") await expect(fs.stat(f.base)).rejects.toMatchObject({ code: "ENOENT" });
    else await expect(fs.stat(path.join(f.repo, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
  }
});

test("same-store mixed setup preserves routes and shared policies take precedence", async () => {
  const f = await fixture("github");
  await initializeRepositoryContext(await f.resolve());
  await initializeSharedContext(await f.resolve());
  await migrateContextRoute(await f.resolve(), "initiatives", "repository");
  const before = await f.resolve();
  expect(before.mode).toBe("mixed");
  const manifest = await fs.readFile(path.join(f.shared, ROUTE_MANIFEST_FILE), "utf8");
  expect(f.setup({ store: "shared" }).code).toBe(0);
  expect((await f.resolve()).routes).toEqual(before.routes);
  expect(await fs.readFile(path.join(f.shared, ROUTE_MANIFEST_FILE), "utf8")).toBe(manifest);
  expect(f.setup({ store: "repository" }).code).toBe(1);
  expect(f.setup({ store: "shared", preset: "hosted-shared" }).code).toBe(1);
});

test("setup requires an explicit store and validates presets without writes", async () => {
  const f = await fixture();
  for (const options of [undefined, {}, { store: "invalid" }, { store: "repository", preset: "hosted-shared" }, { store: "shared", preset: "unknown" }, { store: "shared", preset: "hosted-shared" }]) {
    expect(f.setup(options).code).toBe(1);
    await expect(fs.stat(f.base)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.stat(path.join(f.repo, ROUTE_MANIFEST_FILE))).rejects.toMatchObject({ code: "ENOENT" });
  }
});

test("repository registration keeps an external ticket adapter", async () => {
  const f = await fixture("jira");
  const result = f.setup({ store: "repository" });
  expect(result.code).toBe(0);
  expect(JSON.parse(result.output)).toMatchObject({ store: "repository", created: true });
  expect((await f.resolve()).routes.tickets).toEqual({ adapter: "jira" });
  await expect(fs.stat(f.base)).rejects.toMatchObject({ code: "ENOENT" });
});

test("legacy repository routes reject shared setup without rewriting the policy", async () => {
  const f = await fixture();
  await fs.mkdir(f.shared, { recursive: true });
  await fs.writeFile(path.join(f.shared, ".storage"), "repository\n");
  const result = f.setup({ store: "shared" });
  expect(result.code).toBe(1);
  expect(await fs.readFile(path.join(f.shared, ".storage"), "utf8")).toBe("repository\n");
  expect(await fs.readdir(f.shared)).toEqual([".storage"]);
});

test("repository-aligned mixed setup preserves shared record routes", async () => {
  const f = await fixture("github");
  await initializeSharedContext(await f.resolve());
  await migrateContextRoute(await f.resolve(), "alignment", "repository");
  const before = await f.resolve();
  expect(before.storage).toBe("repository");
  expect(before.mode).toBe("mixed");
  const manifest = await fs.readFile(path.join(f.shared, ROUTE_MANIFEST_FILE), "utf8");
  expect(f.setup({ store: "repository" }).code).toBe(0);
  expect((await f.resolve()).routes).toEqual(before.routes);
  expect(await fs.readFile(path.join(f.shared, ROUTE_MANIFEST_FILE), "utf8")).toBe(manifest);
  expect(f.setup({ store: "shared" }).code).toBe(1);
});

test("shared initialization preserves mixed routes from a repository manifest", async () => {
  const f = await fixture();
  const context = await f.resolve();
  await initializeRepositoryContext({
    ...context,
    routes: { ...context.routes, alignment: { adapter: "markdown", store: "shared" } },
  });
  const before = await f.resolve();
  expect(before.mode).toBe("mixed");
  expect(before.storage).toBe("shared");
  expect(before.routeSource).toBe(path.join(f.repo, ROUTE_MANIFEST_FILE));
  expect(f.setup({ store: "shared" }).code).toBe(0);
  const reopened = await f.resolve();
  expect(reopened.routes).toEqual(before.routes);
  expect(reopened.mode).toBe("mixed");
  expect(reopened.routeSource).toBe(path.join(f.shared, ROUTE_MANIFEST_FILE));
});

test("layout-only repository context rejects shared setup without changing routing", async () => {
  const f = await fixture();
  await fs.mkdir(path.join(f.repo, "docs/agents"), { recursive: true });
  const layout = path.join(f.repo, "docs/agents/context-layout.toml");
  await fs.writeFile(layout, 'schema = 1\n[paths]\ntracker = "docs/tracker"\n');
  expect((await f.resolve()).routeSource).toBe(layout);
  expect(f.setup({ store: "shared" }).code).toBe(1);
  expect((await f.resolve()).mode).toBe("repository");
  await expect(fs.stat(f.base)).rejects.toMatchObject({ code: "ENOENT" });
  await expect(fs.stat(path.join(f.repo, ROUTE_MANIFEST_FILE))).rejects.toMatchObject({ code: "ENOENT" });
});

test("resolver errors stop setup before repository files are created", async () => {
  const f = await fixture();
  expect(f.setup({ store: "repository" }, "file:///tmp/unsupported-origin").code).toBe(1);
  await expect(fs.stat(path.join(f.repo, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
  await expect(fs.stat(path.join(f.repo, "CONTEXT-MAP.md"))).rejects.toMatchObject({ code: "ENOENT" });
  await expect(fs.stat(path.join(f.repo, ROUTE_MANIFEST_FILE))).rejects.toMatchObject({ code: "ENOENT" });
  await expect(fs.stat(f.base)).rejects.toMatchObject({ code: "ENOENT" });
});
