import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { slugifyGitRemote } from "../../../../agent-core/skills/shared-context/scripts/shared-context/lib.ts";
import { markdownGraph } from "./dep-tree-markdown.ts";

const temporaryDirectories: string[] = [];
const origin = "https://github.com/graph-tests/configured-layout.git";

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

async function fixture(options: { docs?: boolean; mixed?: boolean; customRoots?: boolean } = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dep-tree-markdown-"));
  temporaryDirectories.push(directory);
  const repositoryRoot = path.join(directory, "repository");
  const sharedBase = path.join(directory, "shared");
  const sharedRoot = path.join(sharedBase, slugifyGitRemote(origin));
  await fs.mkdir(repositoryRoot, { recursive: true });
  await fs.mkdir(sharedRoot, { recursive: true });
  execFileSync("git", ["init", "--quiet", repositoryRoot]);
  execFileSync("git", ["-C", repositoryRoot, "remote", "add", "origin", origin]);
  const tracker = options.docs ? "docs/tracker" : "tracker";
  const ticketsRelative = options.customRoots ? "docs/issues" : `${tracker}/tickets`;
  const initiativesRelative = options.customRoots ? "docs/efforts" : `${tracker}/initiatives`;
  await fs.mkdir(path.join(repositoryRoot, "docs/agents"), { recursive: true });
  await fs.writeFile(path.join(repositoryRoot, "docs/agents/issue-tracker.md"), [
    "---", "backend: local-markdown",
    ...(options.customRoots ? [`issue-root: ${ticketsRelative}`, `initiative-root: ${initiativesRelative}`] : []),
    "---", "", "# Tracker", "",
  ].join("\n"));
  if (options.docs) {
    await fs.writeFile(path.join(repositoryRoot, "docs/agents/context-layout.toml"), 'schema = 1\n[paths]\ntracker = "docs/tracker"\nsources = "docs/sources"\n');
  }
  if (options.mixed) {
    await fs.writeFile(path.join(sharedRoot, ".context-routes.toml"), [
      "schema = 2", "", '[records.alignment]', 'adapter = "markdown"', 'store = "repository"', "",
      '[records.tickets]', 'adapter = "local-markdown"', 'store = "repository"', "",
      '[records.initiatives]', 'adapter = "markdown"', 'store = "shared"', "",
      '[records.workflows]', 'adapter = "files"', 'store = "repository"', "",
      '[records.evidence]', 'adapter = "files"', 'store = "inherit:workflows"', "",
      '[records.sources]', 'adapter = "files"', 'store = "inherit:alignment"', "",
    ].join("\n"));
  }
  const ticketsRoot = path.join(repositoryRoot, ticketsRelative);
  const initiativeRoot = path.join(options.mixed ? sharedRoot : repositoryRoot, initiativesRelative, "release");
  await fs.mkdir(ticketsRoot, { recursive: true });
  await fs.mkdir(initiativeRoot, { recursive: true });
  await fs.writeFile(path.join(ticketsRoot, "T-1.md"), '---\nid: T-1\ntitle: First task\ntype: task\nwork_status: claimed\nblocked_by: [T-2]\n---\n');
  await fs.writeFile(path.join(ticketsRoot, "T-2.md"), '---\nid: T-2\ntitle: Prerequisite\ntype: research\nwork_status: completed\nblocked_by: []\n---\n');
  const link = path.relative(initiativeRoot, path.join(ticketsRoot, "T-1.md"));
  await fs.writeFile(path.join(initiativeRoot, "index.md"), `# Release\n\n- [First task](${link}#acceptance)\n`);
  return { repositoryRoot, sharedBase, ticketsRoot, initiativeRoot };
}

const expected = "- [task] T-1 - First task  WAITING · blocked by T-2\n  - [research] T-2 - Prerequisite  COMPLETED";

describe("Markdown dependency graphs", () => {
  test("retains default layout and ticket-to-initiative discovery", async () => {
    const { repositoryRoot, sharedBase } = await fixture();
    expect(await markdownGraph(repositoryRoot, "T-1", undefined, sharedBase)).toBe(expected);
  });

  test("uses docs roots from layout when tracker frontmatter omits roots", async () => {
    const { repositoryRoot, sharedBase } = await fixture({ docs: true });
    expect(await markdownGraph(repositoryRoot, undefined, "release", sharedBase)).toBe(expected);
  });

  test("uses exact configured collections across repository and shared stores", async () => {
    const { repositoryRoot, sharedBase } = await fixture({ docs: true, mixed: true, customRoots: true });
    expect(await markdownGraph(repositoryRoot, "T-1", undefined, sharedBase)).toBe(expected);
  });

  test("reports missing blockers instead of returning a partial graph", async () => {
    const { repositoryRoot, sharedBase, ticketsRoot } = await fixture({ docs: true });
    await fs.rm(path.join(ticketsRoot, "T-2.md"));
    await expect(markdownGraph(repositoryRoot, undefined, "release", sharedBase)).rejects.toThrow("references ticket T-2");
  });

  test("rejects invalid layout rather than reading default collections", async () => {
    const { repositoryRoot, sharedBase } = await fixture();
    await fs.writeFile(path.join(repositoryRoot, "docs/agents/context-layout.toml"), 'schema = 1\n[paths]\ntracker = "../outside"\n');
    await expect(markdownGraph(repositoryRoot, "T-1", undefined, sharedBase)).rejects.toThrow();
  });
});
