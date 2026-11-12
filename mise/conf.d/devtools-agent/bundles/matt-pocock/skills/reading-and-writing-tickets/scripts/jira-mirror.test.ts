// Temporary Git repositories and recorded `twg` output. These tests never call real `twg` or Jira.
import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { slugifyGitRemote } from "../../../../agent-core/skills/shared-context/scripts/shared-context/lib.ts";
import { syncJiraMirror } from "./jira-mirror.ts";
import type { RunTwg } from "./twg-jira.ts";

const origin = "https://github.com/mirror-tests/jira.git";
const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))); });

type Issue = Record<string, unknown> & { key: string };
type QueryOutput = { data: { issues: Issue[] }; pageInfo?: unknown };

// Trimmed from real `twg` output recorded on 2026-11-12. Mention names are replaced.
function recordedEpics(): QueryOutput {
  return JSON.parse(readFileSync(path.join(import.meta.dir, "fixtures/twg/query-mirror-epics.json"), "utf8"));
}

function page(issues: Issue[], nextCursor?: string): QueryOutput {
  return { data: { issues }, pageInfo: nextCursor ? { hasNextPage: true, nextCursor } : { hasNextPage: false } };
}

const DEFINITION = `---
backend: jira
site: https://example.atlassian.net/
mirror:
  root: tracker/jira
  queries:
    payroll-epics: 'project = RWR AND issuetype = Epic AND cf[12059] = Payroll'
---

# Issue tracker: Jira
`;

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

// The shared-context store sits inside a larger Git repository, as it does on a real machine.
// That repository has an unrelated staged change, which the sync must leave staged.
async function fixture(definition = DEFINITION) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "jira-mirror-"));
  temporary.push(directory);
  const repository = path.join(directory, "repository");
  const sharedContextBase = path.join(directory, "store", "shared-context");
  const storeRepository = path.join(directory, "store");
  const sharedRoot = path.join(sharedContextBase, slugifyGitRemote(origin));
  await fs.mkdir(repository, { recursive: true });
  await fs.mkdir(path.join(sharedRoot, "docs/agents"), { recursive: true });
  execFileSync("git", ["init", "--quiet", repository]);
  git(repository, "remote", "add", "origin", origin);
  await fs.writeFile(path.join(sharedRoot, ".storage"), "shared\n");
  await fs.writeFile(path.join(sharedRoot, "docs/agents/issue-tracker.md"), definition);
  execFileSync("git", ["init", "--quiet", storeRepository]);
  git(storeRepository, "config", "user.email", "test@example.com");
  git(storeRepository, "config", "user.name", "Test");
  await fs.writeFile(path.join(storeRepository, "unrelated.txt"), "one\n");
  git(storeRepository, "add", "-A");
  git(storeRepository, "commit", "--quiet", "-m", "initial");
  await fs.writeFile(path.join(storeRepository, "unrelated.txt"), "two\n");
  git(storeRepository, "add", "unrelated.txt");
  return { repository, sharedContextBase, sharedRoot, storeRepository, mirrorRoot: path.join(sharedRoot, "tracker/jira") };
}

function fakeTwg(answer: (jql: string, after?: string) => QueryOutput) {
  const calls: string[][] = [];
  const runTwg: RunTwg = async (args) => {
    calls.push(args);
    const after = args.indexOf("--after");
    return answer(args[args.indexOf("--jql") + 1]!, after < 0 ? undefined : args[after + 1]);
  };
  return { calls, runTwg };
}

function frontmatter(text: string): Record<string, unknown> {
  const block = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!block) throw new Error("mirror file has no frontmatter");
  return Bun.YAML.parse(block[1]!) as Record<string, unknown>;
}

const firstRun = () => new Date("2026-11-12T01:00:00.000Z");
const secondRun = () => new Date("2026-11-12T02:00:00.000Z");

describe("syncJiraMirror", () => {
  test("writes one mirror file per issue and commits them in one tracker commit", async () => {
    const store = await fixture();
    const twg = fakeTwg(() => recordedEpics());
    const result = await syncJiraMirror({ repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: twg.runTwg, now: firstRun });

    expect(twg.calls.map((args) => args[args.indexOf("--jql") + 1])).toEqual(["project = RWR AND issuetype = Epic AND cf[12059] = Payroll"]);
    expect(result.written).toEqual(["RWR-6974", "RWR-12937", "RWR-14798", "RWR-16547"]);
    expect(result.ref).toBe("shared://tracker/jira");
    expect((await fs.readdir(store.mirrorRoot)).sort()).toEqual(["RWR-12937.md", "RWR-14798.md", "RWR-16547.md", "RWR-6974.md"]);

    const blocked = await fs.readFile(path.join(store.mirrorRoot, "RWR-14798.md"), "utf8");
    expect(frontmatter(blocked)).toEqual({
      schema: "tracker-mirror/v1",
      id: "RWR-14798",
      title: "Pay slip update / enhancement to display employee Bank account",
      type: "Epic",
      status: "Done",
      status_category: "done",
      parent: "RWR-15115",
      blocked_by: ["RWR-14800"],
      queries: ["payroll-epics"],
      jira_updated: "2026-09-29T08:26:56.742+1000",
      synced_at: "2026-11-12T01:00:00.000Z",
      ref: "https://example.atlassian.net/browse/RWR-14798",
    });
    expect(blocked.endsWith("---\n")).toBe(true);

    const described = await fs.readFile(path.join(store.mirrorRoot, "RWR-6974.md"), "utf8");
    expect(frontmatter(described)).toMatchObject({ status: "Cancelled", parent: null, blocked_by: [] });
    expect(described).toContain("\n---\n\nUsers want the ability to search for employees by their:\n\n1. First name\n");

    expect(git(store.storeRepository, "log", "--format=%s")).toBe("chore(tracker): sync Jira mirror shared://tracker/jira (4 files)\ninitial");
    expect(result.commit).toBe(git(store.storeRepository, "rev-parse", "HEAD"));
    expect(git(store.storeRepository, "show", "--name-only", "--format=", "HEAD").split("\n").sort()).toEqual(
      ["RWR-12937.md", "RWR-14798.md", "RWR-16547.md", "RWR-6974.md"].map((name) => `shared-context/${slugifyGitRemote(origin)}/tracker/jira/${name}`));
    expect(git(store.storeRepository, "status", "--porcelain")).toBe("M  unrelated.txt");
  });

  test("a second run with no Jira changes writes nothing and makes no commit", async () => {
    const store = await fixture();
    const options = { repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: fakeTwg(() => recordedEpics()).runTwg };
    const first = await syncJiraMirror({ ...options, now: firstRun });
    const before = await fs.readFile(path.join(store.mirrorRoot, "RWR-12937.md"), "utf8");

    const second = await syncJiraMirror({ ...options, now: secondRun });
    expect(second.written).toEqual([]);
    expect(second.unchanged).toBe(4);
    expect(second.commit).toBeUndefined();
    expect(git(store.storeRepository, "rev-parse", "HEAD")).toBe(first.commit!);
    expect(await fs.readFile(path.join(store.mirrorRoot, "RWR-12937.md"), "utf8")).toBe(before);
    expect(git(store.storeRepository, "status", "--porcelain")).toBe("M  unrelated.txt");
  });

  test("rewrites only the changed issue, with a new synced_at", async () => {
    const store = await fixture();
    const options = { repository: store.repository, sharedContextBase: store.sharedContextBase };
    await syncJiraMirror({ ...options, runTwg: fakeTwg(() => recordedEpics()).runTwg, now: firstRun });

    const changed = recordedEpics();
    const epic = changed.data.issues.find((issue) => issue.key === "RWR-6974")!;
    epic.summary = 'Search for an employee: "name" or #number';
    epic.updated = "2026-11-12T12:00:00.000+1100";
    const second = await syncJiraMirror({ ...options, runTwg: fakeTwg(() => changed).runTwg, now: secondRun });

    expect(second.written).toEqual(["RWR-6974"]);
    expect(frontmatter(await fs.readFile(path.join(store.mirrorRoot, "RWR-6974.md"), "utf8"))).toMatchObject({
      title: 'Search for an employee: "name" or #number',
      jira_updated: "2026-11-12T12:00:00.000+1100",
      synced_at: "2026-11-12T02:00:00.000Z",
    });
    expect(frontmatter(await fs.readFile(path.join(store.mirrorRoot, "RWR-12937.md"), "utf8")).synced_at).toBe("2026-11-12T01:00:00.000Z");
    expect(git(store.storeRepository, "show", "--name-only", "--format=%s", "HEAD")).toBe(
      `chore(tracker): sync Jira mirror shared://tracker/jira (1 file)\n\nshared-context/${slugifyGitRemote(origin)}/tracker/jira/RWR-6974.md`);
  });

  test("follows pages and lists every query that returned an issue", async () => {
    const store = await fixture(DEFINITION.replace("    payroll-epics:", "    open-epics: 'project = RWR AND statusCategory != Done'\n    payroll-epics:"));
    const [a, b, c, d] = recordedEpics().data.issues;
    const twg = fakeTwg((jql, after) => jql.includes("statusCategory")
      ? page([a!])
      : after === undefined ? page([a!, b!], "cursor-2") : page([c!, d!]));
    const result = await syncJiraMirror({ repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: twg.runTwg, now: firstRun });

    expect(twg.calls).toHaveLength(3);
    expect(result.queries).toEqual(["open-epics", "payroll-epics"]);
    expect(result.written).toHaveLength(4);
    expect(frontmatter(await fs.readFile(path.join(store.mirrorRoot, `${a!.key}.md`), "utf8")).queries).toEqual(["open-epics", "payroll-epics"]);
    expect(frontmatter(await fs.readFile(path.join(store.mirrorRoot, `${d!.key}.md`), "utf8")).queries).toEqual(["payroll-epics"]);
  });

  test("writes frontmatter that the okf Markdown reader parses", async () => {
    const store = await fixture();
    const quoted = recordedEpics();
    quoted.data.issues[0]!.summary = "Title with 'single' and \"double\" quotes: and a # sign";
    await syncJiraMirror({ repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: fakeTwg(() => quoted).runTwg, now: firstRun });
    const file = path.join(store.mirrorRoot, `${quoted.data.issues[0]!.key}.md`);
    const parsed = JSON.parse(execFileSync("mise", ["x", "--", "mq", "--allow-http-import", "--no-lockfile", "-I", "raw", "-F", "json", 'import "github.com/harehare/okf.mq" | okf::okf_parse(.)', file], { encoding: "utf8" })) as { frontmatter: Record<string, unknown> };
    expect(parsed.frontmatter.title).toBe("Title with 'single' and \"double\" quotes: and a # sign");
    expect(parsed.frontmatter.blocked_by).toEqual([]);
  }, 60_000);
});

describe("syncJiraMirror tracker definition errors", () => {
  const twg = () => fakeTwg(() => { throw new Error("twg must not run"); }).runTwg;

  test("fails when the backend is not jira", async () => {
    const store = await fixture(DEFINITION.replace("backend: jira", "backend: github"));
    await expect(syncJiraMirror({ repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: twg() }))
      .rejects.toThrow("Jira mirror sync needs backend: jira in docs/agents/issue-tracker.md; found github");
  });

  test("fails when the mirror block is missing", async () => {
    const store = await fixture(DEFINITION.replace(/mirror:[\s\S]*?\n---/, "---"));
    await expect(syncJiraMirror({ repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: twg() }))
      .rejects.toThrow("docs/agents/issue-tracker.md has no mirror block; add mirror.root and mirror.queries");
  });

  test("fails when the mirror root leaves the store", async () => {
    const store = await fixture(DEFINITION.replace("root: tracker/jira", "root: ../outside"));
    await expect(syncJiraMirror({ repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: twg() }))
      .rejects.toThrow("mirror.root must be a non-empty relative directory path without traversal");
  });

  test("fails when mirror.queries is empty", async () => {
    const store = await fixture(DEFINITION.replace(/  queries:\n.*\n/, "  queries: {}\n"));
    await expect(syncJiraMirror({ repository: store.repository, sharedContextBase: store.sharedContextBase, runTwg: twg() }))
      .rejects.toThrow("mirror.queries must map at least one query name to a JQL string");
  });
});
