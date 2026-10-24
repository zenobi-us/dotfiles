import { afterEach, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const setupCli = fileURLToPath(new URL("./setup.ts", import.meta.url));
const sharedContextCli = fileURLToPath(new URL(
  "../../../../agent-core/skills/shared-context/scripts/shared-context/cli.ts",
  import.meta.url,
));
const temporaryRoots: string[] = [];
const timeout = 120_000;

test("plan and dry-run are stable and leave the target untouched", async () => {
  const fixture = await createRepository();
  const before = await snapshot(fixture.target);
  const first = await setup(fixture, "plan");
  const second = await setup(fixture, "plan");
  const dryRun = await setup(fixture, "init", ["--dry-run"]);

  for (const result of [first, second, dryRun]) expectSuccess(result);
  const plan = parseResult(first);
  expect(plan.command).toBe("plan");
  expect(plan.target).toBe(fixture.target);
  expect(plan.alignmentRoot).toBe(fixture.target);
  expect(plan.changes.some((change) => change.action === "create")).toBe(true);
  expect(parseResult(second).changes).toEqual(plan.changes);
  expect(parseResult(dryRun).changes).toEqual(plan.changes);
  expect(await snapshot(fixture.target)).toEqual(before);
}, timeout);

test("init preserves unrelated instructions and a second init makes no changes", async () => {
  const fixture = await createRepository();
  const instructions = [
    "# Project instructions", "", "Keep the production deployment manual.", "",
    "## Agent skills", "", "### Release workflow", "",
    "Use the signed release process. Never publish from a laptop.", "",
    "### Examples", "", "```markdown", "## Agent skills", "",
    "### Issue tracker", "", "Keep this fenced example unchanged.", "```", "",
    "### Issue tracker", "", "Retired external tracker policy.", "",
    "### Local Markdown", "", "Keep the local Markdown rules.", "",
    "## Local commands", "", "Run the project-specific smoke command.", "",
  ].join("\n");
  await put(fixture.target, "AGENTS.md", instructions);

  expectSuccess(await setup(fixture, "init"));
  const generated = await fs.readFile(path.join(fixture.target, "AGENTS.md"), "utf8");
  expect(generated).toContain("Keep the production deployment manual.");
  expect(generated).toContain("### Release workflow\n\nUse the signed release process. Never publish from a laptop.");
  expect(generated).toContain("## Local commands\n\nRun the project-specific smoke command.");
  expect(generated).toContain("```markdown\n## Agent skills\n\n### Issue tracker\n\nKeep this fenced example unchanged.\n```");
  expect(generated).toContain("### Local Markdown\n\nKeep the local Markdown rules.");
  expect(generated).not.toContain("Retired external tracker policy.");
  const before = await snapshot(fixture.target);
  const again = await setup(fixture, "init");
  expectSuccess(again);
  expect(parseResult(again).changes.every((change) => change.action === "unchanged")).toBe(true);
  expect(await snapshot(fixture.target)).toEqual(before);
  expectSuccess(await setup(fixture, "check"));
  expect(Object.keys(before).filter((name) => name.endsWith("setup-state.json"))).toEqual([
    "docs/agents/setup-state.json",
  ]);
  expect(Object.keys(before).filter((name) => /copier.*answers|answers.*copier/i.test(name))).toEqual([]);
}, timeout);

test("check detects edited managed files and init conflicts without partial writes", async () => {
  const fixture = await createRepository();
  expectSuccess(await setup(fixture, "init"));
  const document = "docs/agents/domain.md";
  await fs.appendFile(path.join(fixture.target, document), "\nAuthored domain policy: retain the audit trail.\n");
  const beforeCheck = await snapshot(fixture.target);
  const check = await setup(fixture, "check");
  expect(check.code, diagnostic(check)).toBe(4);
  expect(await snapshot(fixture.target)).toEqual(beforeCheck);

  await fs.rm(path.join(fixture.target, "docs/agents/triage-labels.md"));
  const beforeInit = await snapshot(fixture.target);
  const init = await setup(fixture, "init");
  expect(init.code, diagnostic(init)).toBe(3);
  expect(parseResult(init).changes.some((change) =>
    change.path.endsWith(document) && change.action === "conflict"
  )).toBe(true);
  expect(await snapshot(fixture.target)).toEqual(beforeInit);
}, timeout);

test("invalid answers, missing decisions, and backend route mismatches never write", async () => {
  const fixture = await createRepository();
  const invalidAnswers = [
    "schema: 1\ntracker_backend: local-markdown\nunknown_option: true\ninstruction_file: AGENTS.md\n",
    "schema: 1\ntracker_backend: unsupported\ninstruction_file: AGENTS.md\n",
    "schema: 2\ntracker_backend: local-markdown\ninstruction_file: AGENTS.md\n",
    "schema: 1\ntracker_backend: local-markdown\ndomain_mode: multi\ninstruction_file: AGENTS.md\n",
    "schema: 1\ntracker_backend: local-markdown\n",
  ];
  for (const answers of invalidAnswers) {
    await fs.writeFile(fixture.answers, answers);
    const before = await snapshot(fixture.target);
    const result = await setup(fixture, "init");
    expect(result.code, diagnostic(result)).toBe(2);
    expect(await snapshot(fixture.target)).toEqual(before);
  }
  const missingAnswers = await run(fixture, [
    process.execPath, setupCli, "init", fixture.target,
    "--shared-context", sharedContextCli, "--json",
  ]);
  expect(missingAnswers.code, diagnostic(missingAnswers)).toBe(2);

  await fs.writeFile(fixture.answers, defaultAnswers);
  await put(fixture.target, ".context-routes.toml", [
    "schema = 2", "",
    "[records.alignment]", 'adapter = "markdown"', 'store = "repository"', "",
    "[records.tickets]", 'adapter = "github"', "",
    "[records.initiatives]", 'adapter = "markdown"', 'store = "repository"', "",
    "[records.workflows]", 'adapter = "files"', 'store = "repository"', "",
    "[records.evidence]", 'adapter = "files"', 'store = "inherit:workflows"', "",
    "[records.sources]", 'adapter = "files"', 'store = "inherit:alignment"', "",
  ].join("\n"));
  const before = await snapshot(fixture.target);
  const mismatch = await setup(fixture, "init");
  expect(mismatch.code, diagnostic(mismatch)).toBe(2);
  expect(await snapshot(fixture.target)).toEqual(before);
}, timeout);

test("CLAUDE takes precedence and local collections follow custom layout and frontmatter roots", async () => {
  const fixture = await createRepository();
  const agents = "# Repository instructions\n\nKeep these AGENTS instructions unchanged.\n";
  await put(fixture.target, "AGENTS.md", agents);
  await put(fixture.target, "CLAUDE.md", "# Claude instructions\n\nKeep this local policy.\n");
  await put(fixture.target, "docs/agents/context-layout.toml", [
    "schema = 1", "", "[paths]", 'tracker = "planning/tracker"', 'sources = "planning/sources"', "",
  ].join("\n"));
  expectSuccess(await setup(fixture, "init"));
  expect(await fs.readFile(path.join(fixture.target, "AGENTS.md"), "utf8")).toBe(agents);
  const claude = await fs.readFile(path.join(fixture.target, "CLAUDE.md"), "utf8");
  expect(claude).toContain("Keep this local policy.");
  await expectCollection(fixture, "tickets", "planning/tracker/tickets");
  await expectCollection(fixture, "initiatives", "planning/tracker/initiatives");
  expectSuccess(await setup(fixture, "check"));

  const rooted = await createRepository();
  expectSuccess(await setup(rooted, "init"));
  const trackerPath = path.join(rooted.target, "docs/agents/issue-tracker.md");
  const tracker = await fs.readFile(trackerPath, "utf8");
  await fs.writeFile(trackerPath, tracker
    .replace('issue-root: "tracker/tickets"', 'issue-root: "planning/issues"')
    .replace('initiative-root: "tracker/initiatives"', 'initiative-root: "strategy/initiatives"'));
  await fs.rm(path.join(rooted.target, "docs/agents/setup-state.json"));
  expectSuccess(await setup(rooted, "init"));
  await expectCollection(rooted, "tickets", "planning/issues");
  await expectCollection(rooted, "initiatives", "strategy/initiatives");
  expectSuccess(await setup(rooted, "check"));
}, timeout);

test("a symlink cannot redirect generated files outside the target", async () => {
  const fixture = await createRepository();
  const outside = path.join(fixture.root, "outside");
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, "sentinel"), "Do not change this directory.\n");
  await fs.symlink(outside, path.join(fixture.target, "docs"), "dir");
  const beforeTarget = await snapshot(fixture.target);
  const beforeOutside = await snapshot(outside);

  for (const command of ["plan", "init"] as const) {
    const result = await setup(fixture, command);
    expect(result.code, diagnostic(result)).not.toBe(0);
    expect(await snapshot(fixture.target)).toEqual(beforeTarget);
    expect(await snapshot(outside)).toEqual(beforeOutside);
  }
}, timeout);

test("external trackers initialize without resolving or creating a local ticket collection", async () => {
  for (const backend of ["github", "gitlab"]) {
    const fixture = await createRepository();
    await fs.writeFile(fixture.answers, `schema: 1\ntracker_backend: ${backend}\ninstruction_file: AGENTS.md\ntriage_enabled: false\n`);
    await put(fixture.target, ".context-routes.toml", [
      "schema = 2", "",
      "[records.alignment]", 'adapter = "markdown"', 'store = "repository"', "",
      "[records.tickets]", `adapter = "${backend}"`, "",
      "[records.initiatives]", 'adapter = "markdown"', 'store = "repository"', "",
      "[records.workflows]", 'adapter = "files"', 'store = "repository"', "",
      "[records.evidence]", 'adapter = "files"', 'store = "inherit:workflows"', "",
      "[records.sources]", 'adapter = "files"', 'store = "inherit:alignment"', "",
    ].join("\n"));
    expectSuccess(await setup(fixture, "init"));
    expectSuccess(await setup(fixture, "check"));
    expect(await fs.stat(path.join(fixture.target, "tracker")).catch(() => null)).toBeNull();
    const repeat = await setup(fixture, "init");
    expectSuccess(repeat);
    expect(parseResult(repeat).changes.every((change) => change.action === "unchanged")).toBe(true);
  }
}, timeout);

test("shared alignment preserves repository ticket routes across initialization", async () => {
  const fixture = await createRepository();
  await put(fixture.target, "AGENTS.md", "# Repository-only instructions\n");
  await put(fixture.target, ".context-routes.toml", [
    "schema = 2", "",
    "[records.alignment]", 'adapter = "markdown"', 'store = "shared"', "",
    "[records.tickets]", 'adapter = "local-markdown"', 'store = "repository"', "",
    "[records.initiatives]", 'adapter = "markdown"', 'store = "shared"', "",
    "[records.workflows]", 'adapter = "files"', 'store = "repository"', "",
    "[records.evidence]", 'adapter = "files"', 'store = "inherit:workflows"', "",
    "[records.sources]", 'adapter = "files"', 'store = "inherit:alignment"', "",
  ].join("\n"));
  await expectCollection(fixture, "tickets", "tracker/tickets");
  const initial = await setup(fixture, "init");
  expectSuccess(initial);
  expect(parseResult(initial).alignmentRoot).not.toBe(fixture.target);
  await expectCollection(fixture, "tickets", "tracker/tickets");
  expect(await fs.readFile(path.join(fixture.target, "AGENTS.md"), "utf8")).toBe("# Repository-only instructions\n");
  expectSuccess(await setup(fixture, "check"));
  const repeat = await setup(fixture, "init");
  expectSuccess(repeat);
  expect(parseResult(repeat).changes.every((change) => change.action === "unchanged")).toBe(true);
}, timeout);

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

type Fixture = {
  root: string;
  target: string;
  answers: string;
  env: Record<string, string | undefined>;
};
type ProcessResult = { code: number; stdout: string; stderr: string };
type Change = {
  path: string;
  action: "create" | "unchanged" | "managed-update" | "conflict";
  before: unknown;
  after: unknown;
  reason?: string;
};
type SetupResult = {
  command: string;
  target: string;
  alignmentRoot: string;
  changes: Change[];
};

const defaultAnswers = "schema: 1\ntracker_backend: local-markdown\ninstruction_file: AGENTS.md\n";

async function createRepository(): Promise<Fixture> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "matt-pocock-setup-test-"));
  temporaryRoots.push(root);
  const target = path.join(root, "repository");
  const home = path.join(root, "home");
  await fs.mkdir(target);
  await put(home, ".config/shared-agent-context/config.json", JSON.stringify({
    storage_path: path.join(root, "shared-context"),
  }));
  const fixture: Fixture = {
    root,
    target,
    answers: path.join(root, "answers.yaml"),
    env: {
      ...process.env,
      HOME: home,
      PATH: [path.dirname(process.execPath), path.dirname(Bun.which("uvx")!), process.env.PATH].join(path.delimiter),
      UV_CACHE_DIR: process.env.UV_CACHE_DIR ?? path.join(os.homedir(), ".cache/uv"),
      XDG_CONFIG_HOME: path.join(home, ".config"),
      GIT_CONFIG_GLOBAL: path.join(home, ".gitconfig"),
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_TERMINAL_PROMPT: "0",
    },
  };
  for (const args of [
    ["git", "init", "--quiet", target],
    ["git", "-C", target, "remote", "add", "origin", `https://github.com/setup-regression/${randomUUID()}.git`],
  ]) expectSuccess(await run(fixture, args));
  await fs.writeFile(fixture.answers, defaultAnswers);
  return fixture;
}

async function setup(fixture: Fixture, command: "plan" | "init" | "check", extra: string[] = []): Promise<ProcessResult> {
  return run(fixture, [
    process.execPath, setupCli, command, fixture.target,
    ...(command === "check" ? [] : ["--answers", fixture.answers]),
    "--shared-context", sharedContextCli, "--json", ...extra,
  ]);
}

async function run(fixture: Fixture, command: string[]): Promise<ProcessResult> {
  const subprocess = Bun.spawn(command, {
    cwd: fixture.target,
    env: fixture.env,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [code, stdout, stderr] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
  ]);
  return { code, stdout, stderr };
}

function diagnostic(result: ProcessResult): string {
  return `exit ${result.code}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;
}

function expectSuccess(result: ProcessResult): void {
  expect(result.code, diagnostic(result)).toBe(0);
}

function parseResult(result: ProcessResult): SetupResult {
  return JSON.parse(result.stdout) as SetupResult;
}

async function expectCollection(fixture: Fixture, kind: string, relativePath: string): Promise<void> {
  const result = await run(fixture, [process.execPath, sharedContextCli, "resolve", kind, "--json"]);
  expectSuccess(result);
  const record = JSON.parse(result.stdout) as { path: string; adapter: string };
  expect(record.adapter).toBe(kind === "tickets" ? "local-markdown" : "markdown");
  expect(record.path).toBe(path.join(fixture.target, relativePath));
}

async function put(root: string, relativePath: string, content: string): Promise<void> {
  const filename = path.join(root, relativePath);
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, content);
}

async function snapshot(root: string, prefix = ""): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const entries = await fs.readdir(path.join(root, prefix), { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    const filename = path.join(root, relativePath);
    if (entry.isSymbolicLink()) files[relativePath] = `symlink:${await fs.readlink(filename)}`;
    else if (entry.isDirectory()) {
      files[`${relativePath}/`] = "directory";
      Object.assign(files, await snapshot(root, relativePath));
    } else files[relativePath] = (await fs.readFile(filename)).toString("base64");
  }
  return files;
}
