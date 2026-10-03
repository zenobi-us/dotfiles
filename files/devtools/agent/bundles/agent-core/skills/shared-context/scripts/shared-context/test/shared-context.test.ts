import { afterEach, describe, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  migrateLegacyStorage,
  buildContextIndex,
  canonicalizeGitRemote,
  INDEX_MARKER_END,
  INDEX_MARKER_START,
  initializeSharedContext,
  listSharedContexts,
  migrateAlignmentContext,
  migrateContextRoute,
  parseFrontmatter,
  renderContextReport,
  renderSharedContext,
  resolveContextPath,
  resolveContextRecord,
  resolveSharedContext,
  ROUTE_MANIFEST_FILE,
  slugifyGitRemote,
  type SharedAgentContext,
} from "../lib";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

async function temporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "shared-agent-context-"));
  temporaryDirectories.push(directory);
  return directory;
}

function gitExec(repositoryRoot: string, origin: string) {
  return async (_command: string, args: string[]) => {
    if (args.includes("--show-toplevel")) return { stdout: `${repositoryRoot}\n`, code: 0 };
    if (args.includes("get-url")) return { stdout: `${origin}\n`, code: 0 };
    return { stdout: "", code: 1 };
  };
}

describe("git origin normalization", () => {
  test("SSH, SCP, and HTTPS forms resolve to one canonical origin and slug", () => {
    const remotes = [
      "git@github.com:Owner/Repo.git",
      "ssh://git@github.com/Owner/Repo.git",
      "https://github.com/Owner/Repo.git",
    ];

    expect(remotes.map(canonicalizeGitRemote)).toEqual([
      "github.com/Owner/Repo",
      "github.com/Owner/Repo",
      "github.com/Owner/Repo",
    ]);
    expect(new Set(remotes.map(slugifyGitRemote)).size).toBe(1);
  });
});

describe("context resolution", () => {
  test("falls back to repository storage when shared AGENTS.md is absent", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    await fs.writeFile(path.join(repositoryRoot, "AGENTS.md"), "repo instructions");

    const context = await resolveSharedContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    );

    const slug = slugifyGitRemote("https://github.com/Owner/Repo.git");
    expect(context?.storage).toBe("repository");
    expect(context?.root).toBe(repositoryRoot);
    expect(context?.sharedRoot).toBe(repositoryRoot);
    expect(context?.candidateSharedRoot).toBe(path.join(sharedBase, slug));
    expect(context?.source).toBe(path.join(repositoryRoot, "AGENTS.md"));
  });

  test("uses shared storage and reloads changed instructions on each resolution", async () => {
    const repositoryRoot = await temporaryDirectory();
    const worktree = path.join(repositoryRoot, "worktree");
    const sharedBase = await temporaryDirectory();
    const slug = slugifyGitRemote("git@github.com:Owner/Repo.git");
    const sharedRoot = path.join(sharedBase, slug);
    const agents = path.join(sharedRoot, "AGENTS.md");
    await fs.mkdir(sharedRoot, { recursive: true });
    await fs.writeFile(agents, "shared <rules> & policy");

    const first = await resolveSharedContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      worktree,
      sharedBase,
    );
    await fs.writeFile(agents, "changed next turn");
    const second = await resolveSharedContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      worktree,
      sharedBase,
    );

    expect(first?.storage).toBe("shared");
    expect(first?.root).toBe(sharedRoot);
    expect(first?.sharedRoot).toBe(sharedRoot);
    expect(first?.candidateSharedRoot).toBe(sharedRoot);
    expect(first?.instructions).toBe("shared <rules> & policy");
    expect(second?.instructions).toBe("changed next turn");
  });

  test("resolves each record through an origin-scoped route manifest", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    const slug = slugifyGitRemote("https://github.com/Owner/Repo.git");
    const sharedRoot = path.join(sharedBase, slug);
    await fs.mkdir(sharedRoot, { recursive: true });
    await fs.writeFile(path.join(sharedRoot, "AGENTS.md"), "shared instructions");
    await fs.writeFile(path.join(sharedRoot, ROUTE_MANIFEST_FILE), [
      "schema = 2",
      "",
      "[records.alignment]",
      'adapter = "markdown"',
      'store = "shared"',
      "",
      "[records.tickets]",
      'adapter = "github"',
      "",
      "[records.initiatives]",
      'adapter = "markdown"',
      'store = "shared"',
      "",
      "[records.workflows]",
      'adapter = "files"',
      'store = "repository"',
      "",
      "[records.evidence]",
      'adapter = "files"',
      'store = "inherit:workflows"',
      "",
      "[records.sources]",
      'adapter = "files"',
      'store = "inherit:alignment"',
      "",
    ].join("\n"));

    const context = await resolveSharedContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    );

    expect(context?.mode).toBe("mixed");
    expect(context?.alignmentRoot).toBe(sharedRoot);
    expect(context?.routes).toMatchObject({
      alignment: { adapter: "markdown", store: "shared" },
      tickets: { adapter: "github" },
      initiatives: { adapter: "markdown", store: "shared" },
      workflows: { adapter: "files", store: "repository" },
      evidence: { adapter: "files", inherits: "workflows" },
      sources: { adapter: "files", inherits: "alignment" },
    });

    await expect(resolveContextRecord(context!, { kind: "workflow", id: "GH-42" })).resolves.toMatchObject({
      adapter: "files",
      store: "repository",
      root: repositoryRoot,
      path: path.join(repositoryRoot, "workflows", "GH-42"),
      ref: "workflows/GH-42",
      publication: "repository",
    });
    await expect(resolveContextRecord(context!, { kind: "evidence", workflow: "GH-42", run: "manual-001" })).resolves.toMatchObject({
      store: "repository",
      path: path.join(repositoryRoot, "workflows", "GH-42", "artifacts", "evidence", "manual-001"),
      ref: "workflows/GH-42/artifacts/evidence/manual-001",
    });
    await expect(resolveContextRecord(context!, { kind: "source", ticket: "GH-42", source: "confluence" })).resolves.toMatchObject({
      store: "shared",
      path: path.join(sharedRoot, "sources", "tickets", "GH-42", "confluence"),
      ref: "shared://sources/tickets/GH-42/confluence",
      publication: "push-if-remote",
    });
    await expect(resolveContextPath(context!, { kind: "ticket", id: "42" })).rejects.toThrow(
      /github owns tickets/i,
    );
  });

  test("maps a legacy storage marker to routes without moving external tickets", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    const slug = slugifyGitRemote("https://github.com/Owner/Repo.git");
    const sharedRoot = path.join(sharedBase, slug);
    await fs.mkdir(path.join(sharedRoot, "docs", "agents"), { recursive: true });
    await fs.writeFile(path.join(sharedRoot, ".storage"), "shared\n");
    await fs.writeFile(path.join(sharedRoot, "AGENTS.md"), "shared instructions");
    await fs.writeFile(path.join(sharedRoot, "docs", "agents", "issue-tracker.md"), "---\nbackend: github\n---\n");

    const context = await resolveSharedContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    );

    expect(context?.mode).toBe("shared");
    expect(context?.routes.tickets).toEqual({ adapter: "github" });
    expect(context?.routes.workflows.store).toBe("shared");
    expect(renderContextReport(context!)).toContain("tickets: github");
  });

  test("migrates the legacy preference to a route manifest and removes the marker", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    const sharedRoot = path.join(sharedBase, slugifyGitRemote("https://github.com/Owner/Repo.git"));
    await fs.mkdir(path.join(sharedRoot, "docs", "agents"), { recursive: true });
    await fs.writeFile(path.join(sharedRoot, ".storage"), "shared\n");
    await fs.writeFile(path.join(sharedRoot, "docs", "agents", "issue-tracker.md"), "---\nbackend: github\n---\n");
    const context = (await resolveSharedContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    ))!;

    await migrateLegacyStorage(context);

    const manifest = await fs.readFile(path.join(sharedRoot, ROUTE_MANIFEST_FILE), "utf8");
    expect(manifest).toContain('[records.tickets]\nadapter = "github"');
    expect(manifest).toContain('[records.workflows]\nadapter = "files"\nstore = "shared"');
    await expect(fs.stat(path.join(sharedRoot, ".storage"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("initializes the external candidate without writing into the repository", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    const context = await resolveSharedContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    );

    expect(context).toBeDefined();
    const result = await initializeSharedContext(context!);
    expect(result.created).toBe(true);
    expect(result.agents).toBe(path.join(context!.candidateSharedRoot!, "AGENTS.md"));
    expect(await fs.readFile(result.agents, "utf8")).toContain("# Shared agent context");
    expect(await fs.readFile(path.join(context!.candidateSharedRoot!, ROUTE_MANIFEST_FILE), "utf8")).toContain('schema = 2');
    expect(await fs.readFile(path.join(context!.candidateSharedRoot!, "CONTEXT-MAP.md"), "utf8")).toContain("# Context map");
    await expect(fs.stat(path.join(context!.candidateSharedRoot!, ".storage"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.stat(path.join(repositoryRoot, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("initialization preserves an authored context map", async () => {
    const root = await temporaryDirectory();
    const context = sharedContext(root);
    await fs.writeFile(path.join(root, "AGENTS.md"), "existing instructions");
    await fs.writeFile(path.join(root, "CONTEXT-MAP.md"), "authored navigation");

    const result = await initializeSharedContext(context);

    expect(result.created).toBe(false);
    expect(await fs.readFile(path.join(root, "CONTEXT-MAP.md"), "utf8")).toBe("authored navigation");
  });

  test("initialization preserves an existing route manifest", async () => {
    const root = await temporaryDirectory();
    const context = sharedContext(root);
    const manifest = [
      "schema = 2",
      "",
      "[records.alignment]",
      'adapter = "markdown"',
      'store = "shared"',
      "",
      "[records.tickets]",
      'adapter = "github"',
      "",
      "[records.initiatives]",
      'adapter = "markdown"',
      'store = "repository"',
      "",
      "[records.workflows]",
      'adapter = "files"',
      'store = "shared"',
      "",
      "[records.evidence]",
      'adapter = "files"',
      'store = "inherit:workflows"',
      "",
      "[records.sources]",
      'adapter = "files"',
      'store = "inherit:alignment"',
      "",
    ].join("\n");
    await fs.writeFile(path.join(root, ROUTE_MANIFEST_FILE), manifest);

    await initializeSharedContext(context);

    expect(await fs.readFile(path.join(root, ROUTE_MANIFEST_FILE), "utf8")).toBe(manifest);
  });

  test("copies the typed context areas in both directions and ignores legacy layouts", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    const origin = "https://github.com/Owner/Repo.git";
    await fs.mkdir(path.join(repositoryRoot, "docs", "agents"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "docs", "adr"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "domains", "billing"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "tracker", "tickets"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "workflows", "billing-01", "events"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "workflows", "billing-01", "artifacts", "evidence", "manual-001", "screenshots"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "sources", "library", "web"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, ".scratch", "feature"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "library", "web"), { recursive: true });
    await fs.writeFile(path.join(repositoryRoot, "AGENTS.md"), "repo instructions");
    await fs.writeFile(path.join(repositoryRoot, "CONTEXT-MAP.md"), "stable entry points");
    await fs.writeFile(path.join(repositoryRoot, "docs", "agents", "domain.md"), "domain config");
    await fs.writeFile(path.join(repositoryRoot, "docs", "adr", "billing-01.md"), "decision");
    await fs.writeFile(path.join(repositoryRoot, "domains", "billing", "CONTEXT.md"), "domain glossary");
    await fs.writeFile(path.join(repositoryRoot, "tracker", "tickets", "billing-01.md"), "local issue");
    await fs.writeFile(path.join(repositoryRoot, "workflows", "billing-01", "events", "start-0001.yaml"), "receipt");
    await fs.writeFile(path.join(repositoryRoot, "workflows", "billing-01", "artifacts", "evidence", "manual-001", "screenshots", "screen.png"), "evidence");
    await fs.writeFile(path.join(repositoryRoot, "sources", "library", "web", "rfc-2119.md"), "ingested page");
    await fs.writeFile(path.join(repositoryRoot, ".scratch", "feature", "issue.md"), "legacy issue");
    await fs.writeFile(path.join(repositoryRoot, "library", "web", "legacy.md"), "legacy source");

    const repository = await resolveSharedContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase);
    const toShared = await migrateAlignmentContext(repository!);
    expect(toShared.store).toBe("shared");
    expect(toShared.copied).toContain("CONTEXT-MAP.md");
    expect(toShared.copied).toContain("docs/adr");
    expect(toShared.copied).toContain("domains");
    expect(toShared.copied).not.toContain("tracker");
    expect(toShared.copied).not.toContain("workflows");
    expect(toShared.copied).not.toContain("sources");
    expect(toShared.copied).not.toContain(".scratch");
    expect(toShared.copied).not.toContain("library");

    const shared = await resolveSharedContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase);
    const toSharedWorkflows = await migrateContextRoute(shared!, "workflows", "shared");
    expect(toSharedWorkflows.copied).toEqual(["workflows"]);
    const afterWorkflowMigration = (await resolveSharedContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase))!;
    const evidenceRecord = await resolveContextRecord(afterWorkflowMigration, {
      kind: "evidence", workflow: "billing-01", run: "manual-001",
    });
    expect(evidenceRecord.store).toBe("repository");
    await expect(fs.stat(path.join(shared!.candidateSharedRoot!, "workflows", "billing-01", "artifacts", "evidence"))).rejects.toMatchObject({ code: "ENOENT" });
    const toSharedEvidence = await migrateContextRoute(afterWorkflowMigration, "evidence", "shared");
    expect(toSharedEvidence.copied).toEqual([path.join("workflows", "billing-01", "artifacts", "evidence")]);
    await expect(migrateContextRoute(shared!, "tickets", "shared")).rejects.toThrow();
    expect(await fs.readFile(path.join(repositoryRoot, "tracker", "tickets", "billing-01.md"), "utf8")).toBe("local issue");
    const toSharedSources = await migrateContextRoute(
      (await resolveSharedContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase))!,
      "sources",
      "shared",
    );
    expect(toSharedSources.copied).toEqual(["sources"]);
    const toRepository = await migrateAlignmentContext(
      (await resolveSharedContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase))!,
    );
    expect(toRepository.store).toBe("repository");

    const restored = await resolveSharedContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase);
    expect(restored?.mode).toBe("mixed");
    expect(await fs.readFile(path.join(shared!.candidateSharedRoot!, "domains", "billing", "CONTEXT.md"), "utf8")).toBe("domain glossary");
    expect(await fs.readFile(path.join(shared!.candidateSharedRoot!, "sources", "library", "web", "rfc-2119.md"), "utf8")).toBe("ingested page");
    expect(await fs.readFile(path.join(shared!.candidateSharedRoot!, "workflows", "billing-01", "events", "start-0001.yaml"), "utf8")).toBe("receipt");
    await expect(fs.stat(path.join(shared!.candidateSharedRoot!, ".scratch"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.stat(path.join(shared!.candidateSharedRoot!, "library"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("returns no context when origin is missing", async () => {
    const repositoryRoot = await temporaryDirectory();
    const context = await resolveSharedContext(async (_command, args) => {
      if (args.includes("--show-toplevel")) return { stdout: repositoryRoot, code: 0 };
      return { stdout: "", code: 2 };
    }, repositoryRoot, await temporaryDirectory());

    expect(context).toBeUndefined();
  });
});

test("lists shared contexts alphabetically with storage preferences", async () => {
  const sharedBase = await temporaryDirectory();
  await fs.mkdir(path.join(sharedBase, "z-repo"));
  await fs.mkdir(path.join(sharedBase, "a-repo"));
  await fs.writeFile(path.join(sharedBase, "z-repo", ".storage"), "repository\n");
  await fs.writeFile(path.join(sharedBase, "a-repo", ".storage"), "shared\n");

  const contexts = await listSharedContexts(sharedBase);
  expect(contexts.map((context) => [context.slug, context.storage])).toEqual([
    ["a-repo", "shared"],
    ["z-repo", "repository"],
  ]);
});

test("the CLI is directly executable and exposes help", () => {
  const script = path.join(import.meta.dir, "..", "cli.ts");
  const result = Bun.spawnSync([script, "--help"], { stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(0);
  expect(Buffer.from(result.stdout).toString()).toContain("doctor");
});

test("hosted-shared init rejects local tickets and routes external tickets", async () => {
  const sandbox = await temporaryDirectory();
  const repositoryRoot = path.join(sandbox, "repo");
  const home = path.join(sandbox, "home");
  const sharedBase = path.join(sandbox, "shared");
  await fs.mkdir(path.join(repositoryRoot, "docs", "agents"), { recursive: true });
  await fs.mkdir(path.join(home, ".config", "shared-agent-context"), { recursive: true });
  await fs.writeFile(
    path.join(home, ".config", "shared-agent-context", "config.json"),
    JSON.stringify({ storage_path: sharedBase }),
  );
  await fs.writeFile(path.join(repositoryRoot, "docs", "agents", "issue-tracker.md"), [
    "---",
    "backend: local-markdown",
    "initiative-root: tracker/initiatives",
    "issue-root: tracker/tickets",
    "---",
    "",
  ].join("\n"));
  const initialized = Bun.spawnSync(["git", "init", repositoryRoot], { stdout: "pipe", stderr: "pipe" });
  expect(initialized.exitCode).toBe(0);
  const remote = Bun.spawnSync([
    "git", "-C", repositoryRoot, "remote", "add", "origin", "https://github.com/Owner/Repo.git",
  ], { stdout: "pipe", stderr: "pipe" });
  expect(remote.exitCode).toBe(0);

  const script = path.join(import.meta.dir, "..", "cli.ts");
  const result = Bun.spawnSync([process.execPath, script, "init", "--preset", "hosted-shared"], {
    cwd: repositoryRoot,
    env: { ...process.env, HOME: home },
    stdout: "pipe",
    stderr: "pipe",
  });

  expect(result.exitCode).toBe(1);
  expect(Buffer.from(result.stderr).toString()).toContain("requires an external ticket adapter");
  await expect(fs.stat(sharedBase)).rejects.toMatchObject({ code: "ENOENT" });

  const hostedRoot = path.join(sandbox, "hosted");
  await fs.mkdir(path.join(hostedRoot, "docs", "agents"), { recursive: true });
  await fs.writeFile(path.join(hostedRoot, "docs", "agents", "issue-tracker.md"), "---\nbackend: github\n---\n");
  const hostedGit = Bun.spawnSync(["git", "init", hostedRoot], { stdout: "pipe", stderr: "pipe" });
  expect(hostedGit.exitCode).toBe(0);
  const hostedRemote = "https://github.com/Owner/Hosted.git";
  const hostedOrigin = Bun.spawnSync([
    "git", "-C", hostedRoot, "remote", "add", "origin", hostedRemote,
  ], { stdout: "pipe", stderr: "pipe" });
  expect(hostedOrigin.exitCode).toBe(0);
  const hostedResult = Bun.spawnSync([process.execPath, script, "init", "--preset", "hosted-shared"], {
    cwd: hostedRoot,
    env: { ...process.env, HOME: home },
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(hostedResult.exitCode).toBe(0);
  const hostedManifest = await fs.readFile(
    path.join(sharedBase, slugifyGitRemote(hostedRemote), ROUTE_MANIFEST_FILE),
    "utf8",
  );
  expect(hostedManifest).toContain('[records.tickets]\nadapter = "github"');
  expect(hostedManifest).toContain('[records.initiatives]\nadapter = "markdown"\nstore = "shared"');
});

test("repository XML points root and shared-root at the repository", () => {
  const context: SharedAgentContext = {
    repositoryRoot: "/work/repo",
    origin: "https://github.com/Owner/Repo.git",
    canonicalOrigin: "github.com/Owner/Repo",
    slug: "github-com-owner-repo--12345678",
    sharedRoot: "/work/repo",
    candidateSharedRoot: "/home/q/shared-agent-context/github-com-owner-repo--12345678",
    root: "/work/repo",
    storage: "repository",
    mode: "repository",
    alignmentRoot: "/work/repo",
    routes: testRoutes("repository"),
    source: "/work/repo/AGENTS.md",
  };

  const xml = renderSharedContext(context);
  expect(xml).toContain('storage="repository"');
  expect(xml).toContain('alignment-root="/work/repo"');
  expect(xml).toContain('routes="alignment=repository,tickets=repository,initiatives=repository,workflows=repository,evidence=workflows-&gt;repository,sources=alignment-&gt;repository"');
  expect(xml).toContain('root="/work/repo"');
  expect(xml).toContain('shared-root="/work/repo"');
  expect(xml).not.toContain(context.candidateSharedRoot!);
});

test("rendered XML identifies provenance and escapes injected instructions", () => {
  const context: SharedAgentContext = {
    repositoryRoot: "/work/repo",
    origin: "https://github.com/Owner/Repo.git",
    canonicalOrigin: "github.com/Owner/Repo",
    slug: "github-com-owner-repo--12345678",
    sharedRoot: "/home/q/shared-agent-context/github-com-owner-repo--12345678",
    candidateSharedRoot: "/home/q/shared-agent-context/github-com-owner-repo--12345678",
    root: "/home/q/shared-agent-context/github-com-owner-repo--12345678",
    storage: "shared",
    mode: "shared",
    alignmentRoot: "/home/q/shared-agent-context/github-com-owner-repo--12345678",
    routes: testRoutes("shared"),
    source: "/home/q/shared-agent-context/github-com-owner-repo--12345678/AGENTS.md",
    instructions: "Use <safe> & exact rules.",
  };

  const xml = renderSharedContext(context);
  expect(xml).toContain('storage="shared"');
  expect(xml).toContain('source="/home/q/shared-agent-context/github-com-owner-repo--12345678/AGENTS.md"');
  expect(xml).toContain("Use &lt;safe&gt; &amp; exact rules.");
});

function testRoutes(store: "shared" | "repository"): SharedAgentContext["routes"] {
  return {
    alignment: { adapter: "markdown", store },
    tickets: { adapter: "local-markdown", store },
    initiatives: { adapter: "markdown", store },
    workflows: { adapter: "files", store },
    evidence: { adapter: "files", inherits: "workflows" },
    sources: { adapter: "files", inherits: "alignment" },
  };
}

function sharedContext(root: string): SharedAgentContext {
  return {
    repositoryRoot: "/work/repo",
    origin: "https://github.com/Owner/Repo.git",
    canonicalOrigin: "github.com/Owner/Repo",
    slug: "github-com-owner-repo--12345678",
    sharedRoot: root,
    candidateSharedRoot: root,
    root,
    storage: "shared",
    mode: "shared",
    alignmentRoot: root,
    routes: testRoutes("shared"),
    source: path.join(root, "AGENTS.md"),
  };
}


describe("typed context paths", () => {
  test("resolves every stable record type", async () => {
    const root = await temporaryDirectory();
    const context = sharedContext(root);
    await fs.mkdir(path.join(root, "docs", "adr"), { recursive: true });
    await fs.writeFile(path.join(root, "docs", "adr", "ledger-ui-10-shell-state.md"), "decision");

    await expect(resolveContextPath(context, { kind: "tracker" })).resolves.toBe(path.join(root, "tracker"));
    await expect(resolveContextPath(context, { kind: "ticket", id: "ledger-ui-04" })).resolves.toBe(path.join(root, "tracker", "tickets", "ledger-ui-04.md"));
    await expect(resolveContextPath(context, { kind: "initiative", id: "ledger-ui-shadcn-migration" })).resolves.toBe(path.join(root, "tracker", "initiatives", "ledger-ui-shadcn-migration"));
    await expect(resolveContextPath(context, { kind: "workflow", id: "ledger-ui-04" })).resolves.toBe(path.join(root, "workflows", "ledger-ui-04"));
    await expect(resolveContextPath(context, { kind: "source", ticket: "ledger-ui-04", source: "jira" })).resolves.toBe(path.join(root, "sources", "tickets", "ledger-ui-04", "jira"));
    await expect(resolveContextPath(context, { kind: "source", library: true, source: "document" })).resolves.toBe(path.join(root, "sources", "library", "document"));
    await expect(resolveContextPath(context, { kind: "adr", id: "ledger-ui-10" })).resolves.toBe(path.join(root, "docs", "adr", "ledger-ui-10-shell-state.md"));
    await expect(resolveContextPath(context, { kind: "adr", id: "ledger-ui-11" })).resolves.toBe(path.join(root, "docs", "adr", "ledger-ui-11.md"));
  });

  test("refuses invalid or incomplete typed paths", async () => {
    const context = sharedContext("/shared/repo");
    await expect(resolveContextPath(context, { kind: "source", source: "../../etc", library: true })).rejects.toThrow(/Invalid source/);
    await expect(resolveContextPath(context, { kind: "source", source: "web" })).rejects.toThrow(/exactly one/);
    await expect(resolveContextPath(context, { kind: "source", source: "web", ticket: "ABC-1", library: true })).rejects.toThrow(/exactly one/);
    await expect(resolveContextPath(context, { kind: "ticket", id: ".." })).rejects.toThrow(/Invalid id/);
  });
});

describe("frontmatter", () => {
  test("reads quoted, bare, and numeric fields and ignores the body", () => {
    const fields = parseFrontmatter(['---', 'source: "confluence"', "id: 4280287398", "title: Leave screen", "---", "", "id: not-this"].join("\n"));
    expect(fields).toEqual({ source: "confluence", id: "4280287398", title: "Leave screen" });
  });

  test("a file with no frontmatter yields no fields", () => {
    expect(parseFrontmatter("# Title\n\nbody")).toEqual({});
  });
});

describe("index rebuild", () => {
  test("lists every sibling markdown file, links the url when present, and excludes itself", async () => {
    const base = await temporaryDirectory();
    const directory = path.join(base, "RWR-1", "confluence");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "200.md"), '---\nsource: "confluence"\nid: "200"\ntitle: "Second"\nurl: "https://example.test/200"\n---\nbody\n');
    await fs.writeFile(path.join(directory, "100.md"), '---\nsource: "confluence"\nid: "100"\ntitle: "First"\n---\nbody\n');
    await fs.writeFile(path.join(directory, "index.md"), "stale\n");

    const result = await buildContextIndex(directory, { force: true });
    expect(result.entries.map((entry) => entry.file)).toEqual(["100.md", "200.md"]);

    const index = await fs.readFile(result.path, "utf8");
    expect(index).toContain('source: "confluence"');
    expect(index).toContain('scope: "RWR-1"');
    expect(index).toContain("# confluence sources for RWR-1");
    expect(index).toContain("- First — local copy: [100.md](100.md)");
    expect(index).toContain("- [Second](https://example.test/200) — local copy: [200.md](200.md)");
    expect(index).not.toContain("index.md](index.md)");
    expect(index).not.toContain("stale");
  });

  test("refuses to clobber a hand-written index and keeps text around a managed block", async () => {
    const base = await temporaryDirectory();
    const directory = path.join(base, "RWR-2", "confluence");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "300.md"), '---\nsource: "confluence"\nid: "300"\ntitle: "Third"\n---\nbody\n');
    await fs.writeFile(path.join(directory, "index.md"), "# Hand written\n\n| Page | Why it matters |\n|---|---|\n| 300 | cited in the PRD |\n");

    await expect(buildContextIndex(directory)).rejects.toThrow(/written by hand/);
    expect(await fs.readFile(path.join(directory, "index.md"), "utf8")).toContain("cited in the PRD");

    await fs.writeFile(
      path.join(directory, "index.md"),
      `# Hand written\n\nWhy it matters: cited in the PRD.\n\n${INDEX_MARKER_START}\nold\n${INDEX_MARKER_END}\n\nTrailing note.\n`,
    );
    const result = await buildContextIndex(directory);
    expect(result.preserved).toBe(true);

    const index = await fs.readFile(result.path, "utf8");
    expect(index).toContain("cited in the PRD");
    expect(index).toContain("Trailing note.");
    expect(index).toContain("- Third — local copy: [300.md](300.md)");
    expect(index).not.toContain("old");
  });

  test("rebuilding twice produces the same entries", async () => {
    const base = await temporaryDirectory();
    const directory = path.join(base, "library", "web");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "rfc-2119.md"), '---\nsource: "web"\ntitle: "RFC 2119"\nurl: "https://example.test/rfc"\n---\nbody\n');

    const first = await buildContextIndex(directory);
    const second = await buildContextIndex(directory);
    expect(second.entries).toEqual(first.entries);
    expect(second.entries).toHaveLength(1);
  });
});
