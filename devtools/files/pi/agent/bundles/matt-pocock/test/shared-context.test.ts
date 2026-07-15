import { afterEach, describe, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import mattPocockSharedContext, {
  canonicalizeGitRemote,
  initializeSharedContext,
  listSharedContexts,
  migrateAlignmentContext,
  renderMattPocockContext,
  resolveMattPocockContext,
  slugifyGitRemote,
  type MattPocockContext,
} from "../extensions/shared-context";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

async function temporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "matt-pocock-context-"));
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

    const context = await resolveMattPocockContext(
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

    const first = await resolveMattPocockContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      worktree,
      sharedBase,
    );
    await fs.writeFile(agents, "changed next turn");
    const second = await resolveMattPocockContext(
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

  test("initializes the external candidate without writing into the repository", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    const context = await resolveMattPocockContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    );

    expect(context).toBeDefined();
    const result = await initializeSharedContext(context!);

    expect(result.created).toBe(true);
    expect(result.agents).toBe(path.join(context!.candidateSharedRoot!, "AGENTS.md"));
    expect(await fs.readFile(result.agents, "utf8")).toContain("# Matt Pocock shared context");
    expect(await fs.readFile(path.join(context!.candidateSharedRoot!, ".storage"), "utf8")).toBe("shared\n");
    await expect(fs.stat(path.join(repositoryRoot, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("copies alignment files in both directions and toggles active storage", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    const origin = "https://github.com/Owner/Repo.git";
    await fs.mkdir(path.join(repositoryRoot, "docs", "agents"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, "src", "billing", "docs", "adr"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, ".scratch", "feature"), { recursive: true });
    await fs.writeFile(path.join(repositoryRoot, "AGENTS.md"), "repo instructions");
    await fs.writeFile(path.join(repositoryRoot, "CONTEXT.md"), "domain glossary");
    await fs.writeFile(path.join(repositoryRoot, "docs", "agents", "domain.md"), "domain config");
    await fs.writeFile(path.join(repositoryRoot, "docs", "agents", "issue-tracker.md"), "---\nbackend: local-markdown\n---\n");
    await fs.writeFile(path.join(repositoryRoot, ".scratch", "feature", "PRD.md"), "local issue");
    await fs.writeFile(path.join(repositoryRoot, "src", "billing", "docs", "adr", "0001.md"), "decision");

    const repository = await resolveMattPocockContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase);
    const toShared = await migrateAlignmentContext(repository!);
    expect(toShared.storage).toBe("shared");
    expect(toShared.copied).toContain("CONTEXT.md");
    expect(toShared.copied).toContain("src/billing/docs/adr");
    expect(toShared.copied).toContain(".scratch");

    const shared = await resolveMattPocockContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase);
    expect(shared?.storage).toBe("shared");
    const toRepository = await migrateAlignmentContext(shared!);
    expect(toRepository.storage).toBe("repository");

    const restored = await resolveMattPocockContext(gitExec(repositoryRoot, origin), repositoryRoot, sharedBase);
    expect(restored?.storage).toBe("repository");
    expect(await fs.readFile(path.join(shared!.candidateSharedRoot!, "CONTEXT.md"), "utf8")).toBe("domain glossary");
  });

  test("skips scratch data for an external tracker backend", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    await fs.mkdir(path.join(repositoryRoot, "docs", "agents"), { recursive: true });
    await fs.mkdir(path.join(repositoryRoot, ".scratch"), { recursive: true });
    await fs.writeFile(path.join(repositoryRoot, "AGENTS.md"), "repo instructions");
    await fs.writeFile(path.join(repositoryRoot, "docs", "agents", "issue-tracker.md"), "---\nbackend: github\n---\n");
    await fs.writeFile(path.join(repositoryRoot, ".scratch", "orphan.md"), "not tracker data");

    const context = await resolveMattPocockContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    );
    const result = await migrateAlignmentContext(context!);

    expect(result.copied).not.toContain(".scratch");
    await expect(fs.stat(path.join(context!.candidateSharedRoot!, ".scratch"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("refuses ambiguous scratch migration without tracker metadata", async () => {
    const repositoryRoot = await temporaryDirectory();
    const sharedBase = await temporaryDirectory();
    await fs.mkdir(path.join(repositoryRoot, ".scratch"), { recursive: true });
    await fs.writeFile(path.join(repositoryRoot, "AGENTS.md"), "repo instructions");
    await fs.writeFile(path.join(repositoryRoot, ".scratch", "issue.md"), "unknown backend");

    const context = await resolveMattPocockContext(
      gitExec(repositoryRoot, "https://github.com/Owner/Repo.git"),
      repositoryRoot,
      sharedBase,
    );

    await expect(migrateAlignmentContext(context!)).rejects.toThrow("Cannot migrate .scratch without backend metadata");
  });

  test("returns no context when origin is missing", async () => {
    const repositoryRoot = await temporaryDirectory();
    const context = await resolveMattPocockContext(async (_command, args) => {
      if (args.includes("--show-toplevel")) return { stdout: repositoryRoot, code: 0 };
      return { stdout: "", code: 2 };
    }, repositoryRoot, await temporaryDirectory());

    expect(context).toBeUndefined();
  });
});

test("registers eng-context with subcommand autocomplete", () => {
  let registeredName = "";
  let registeredOptions: any;
  mattPocockSharedContext({
    exec: async () => ({ stdout: "", stderr: "", code: 0, killed: false }),
    on: () => {},
    registerCommand: (name: string, options: any) => {
      registeredName = name;
      registeredOptions = options;
    },
  } as any);

  expect(registeredName).toBe("eng-context");
  expect(registeredOptions.getArgumentCompletions("r")).toEqual([{ value: "report", label: "report" }]);
  expect(registeredOptions.getArgumentCompletions("").map((item: any) => item.value)).toEqual([
    "report", "init", "list", "migrate",
  ]);
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

test("repository XML points root and shared-root at the repository", () => {
  const context: MattPocockContext = {
    repositoryRoot: "/work/repo",
    origin: "https://github.com/Owner/Repo.git",
    canonicalOrigin: "github.com/Owner/Repo",
    slug: "github-com-owner-repo--12345678",
    sharedRoot: "/work/repo",
    candidateSharedRoot: "/home/q/.pi/shared-context/github-com-owner-repo--12345678",
    root: "/work/repo",
    storage: "repository",
    source: "/work/repo/AGENTS.md",
  };

  const xml = renderMattPocockContext(context);
  expect(xml).toContain('storage="repository"');
  expect(xml).toContain('root="/work/repo"');
  expect(xml).toContain('shared-root="/work/repo"');
  expect(xml).not.toContain(context.candidateSharedRoot!);
});

test("rendered XML identifies provenance and escapes injected instructions", () => {
  const context: MattPocockContext = {
    repositoryRoot: "/work/repo",
    origin: "https://github.com/Owner/Repo.git",
    canonicalOrigin: "github.com/Owner/Repo",
    slug: "github-com-owner-repo--12345678",
    sharedRoot: "/home/q/.pi/shared-context/github-com-owner-repo--12345678",
    candidateSharedRoot: "/home/q/.pi/shared-context/github-com-owner-repo--12345678",
    root: "/home/q/.pi/shared-context/github-com-owner-repo--12345678",
    storage: "shared",
    source: "/home/q/.pi/shared-context/github-com-owner-repo--12345678/AGENTS.md",
    instructions: "Use <safe> & exact rules.",
  };

  const xml = renderMattPocockContext(context);
  expect(xml).toContain('storage="shared"');
  expect(xml).toContain('source="/home/q/.pi/shared-context/github-com-owner-repo--12345678/AGENTS.md"');
  expect(xml).toContain("Use &lt;safe&gt; &amp; exact rules.");
});
