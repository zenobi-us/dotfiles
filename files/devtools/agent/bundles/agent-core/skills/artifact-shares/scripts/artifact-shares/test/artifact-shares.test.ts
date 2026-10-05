import { afterEach, expect, test } from "bun:test";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { convertHtmlToMdx, escapeMdx, frontmatterValue, splitFrontmatter } from "../html";
import {
  appendType,
  assertShareClone,
  assertShareName,
  hashDir,
  hashFile,
  readKinds,
  readTypes,
  removeShareFiles,
  removeType,
  slugify,
  timestamp,
  yamlString,
} from "../lib";

const cli = new URL("../cli.ts", import.meta.url).pathname;
const templateDir = path.resolve(import.meta.dir, "..", "..", "..", "assets", "repo-template");
const temporary: string[] = [];

function scratch(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "artifact-shares-test-"));
  temporary.push(dir);
  return dir;
}

afterEach(() => {
  while (temporary.length > 0) rmSync(temporary.pop()!, { recursive: true, force: true });
});

test("the CLI runs from its shebang and lists its commands", async () => {
  const process = Bun.spawn([cli, "--help"], { stdout: "pipe" });
  const output = await new Response(process.stdout).text();
  expect(output).toContain("COMMANDS:");
  for (const command of [
    "create",
    "share",
    "redact",
    "recreate",
    "list",
    "sync",
    "doctor",
    "check",
    "self-test",
  ]) {
    expect(output).toContain(command);
  }
  expect(output).toContain("Run a share repository's own checks");
  expect(await process.exited).toBe(0);
});

test("the CLI exposes repository-only creation and delayed Pages activation", async () => {
  const create = Bun.spawn([cli, "create", "--help"], { stdout: "pipe" });
  const createOutput = await new Response(create.stdout).text();
  expect(createOutput).toContain("--no-pages");
  expect(await create.exited).toBe(0);

  const pages = Bun.spawn([cli, "pages", "enable", "--help"], { stdout: "pipe" });
  const pagesOutput = await new Response(pages.stdout).text();
  expect(pagesOutput).toContain("--confirm");
  expect(await pages.exited).toBe(0);
});

test("self-test keeps its output contract", async () => {
  const process = Bun.spawn([cli, "self-test"], { stdout: "pipe" });
  expect(await new Response(process.stdout).text()).toContain("artifact-shares self-test: ok");
  expect(await process.exited).toBe(0);
});

test("a share name is checked before it becomes a repository name", () => {
  expect(() => assertShareName("my-shares")).not.toThrow();
  expect(() => assertShareName("My Shares")).toThrow();
  expect(() => assertShareName("-leading")).toThrow();
});

test("slugify makes a commit-safe name", () => {
  expect(slugify("My Great Share!")).toBe("my_great_share");
  expect(slugify("")).toBe("artifact");
});

test("a title with a quote survives the frontmatter", () => {
  expect(yamlString('a "b" c')).toBe('"a \\"b\\" c"');
});

test("MDX-unsafe characters are escaped outside code only", () => {
  expect(escapeMdx("a {b} <c>")).toBe("a &#123;b&#125; &lt;c>");
  expect(escapeMdx("`{a}`")).toBe("`{a}`");
  expect(escapeMdx("```\n{a}\n```")).toBe("```\n{a}\n```");
});

test("a figure becomes one Figure, with its caption and prefixed src", async () => {
  const result = await convertHtmlToMdx(
    '<title>Report</title><figure><img src="shots/a.png"><figcaption>A shot</figcaption></figure>',
    "s/abc123def456/",
  );
  expect(result.title).toBe("Report");
  expect(result.figures).toHaveLength(1);
  expect(result.markdown).toContain('<Figure src="s/abc123def456/shots/a.png" caption="A shot" />');
});

test("a remote image keeps its own URL", async () => {
  const result = await convertHtmlToMdx('<img src="https://example.com/a.png" alt="x">', "s/abc123def456/");
  expect(result.markdown).toContain('<Figure src="https://example.com/a.png" caption="x" />');
});

test("a heading that repeats the title is dropped", async () => {
  const result = await convertHtmlToMdx("<title>T</title><h1>T</h1><p>body</p>", "s/abc123def456/");
  expect(result.markdown.startsWith("#")).toBe(false);
  expect(result.markdown).toContain("body");
});

test("the title falls back to the first h1", async () => {
  const result = await convertHtmlToMdx("<h1>Only heading</h1>", "s/abc123def456/");
  expect(result.title).toBe("Only heading");
});

test("scripts and styles never reach the page", async () => {
  const result = await convertHtmlToMdx(
    "<title>T</title><style>body{color:red}</style><script>alert(1)</script><p>kept</p>",
    "s/abc123def456/",
  );
  expect(result.markdown).not.toContain("alert");
  expect(result.markdown).not.toContain("color:red");
  expect(result.markdown).toContain("kept");
});

test("frontmatter is split off and read back", () => {
  const split = splitFrontmatter('---\ntitle: "A doc"\ndescription: hi\n---\n\n# Body\n');
  expect(frontmatterValue(split.front, "title")).toBe("A doc");
  expect(frontmatterValue(split.front, "description")).toBe("hi");
  expect(split.body.trim()).toBe("# Body");
});

test("a document with no frontmatter is left alone", () => {
  const split = splitFrontmatter("# Body\n");
  expect(split.front).toBe("");
  expect(split.body).toBe("# Body\n");
});

test(".types round-trips, and comments are skipped", () => {
  const dir = scratch();
  writeFileSync(path.join(dir, ".types"), "# a comment\n\n");
  appendType(dir, "abc123def456", "session");
  appendType(dir, "0123456789ab", "doc");

  const types = readTypes(dir);
  expect(types.get("abc123def456")).toBe("session");
  expect(types.get("0123456789ab")).toBe("doc");
  expect(types.size).toBe(2);
  expect(readFileSync(path.join(dir, ".types"), "utf8")).toContain("# a comment");
});

test("the kinds come from the repository, not from this CLI", () => {
  expect(readKinds(templateDir).sort()).toEqual(["artifact", "doc", "session"]);
});

test("the same directory contents hash the same, different contents do not", () => {
  const first = scratch();
  const second = scratch();
  for (const dir of [first, second]) {
    mkdirSync(path.join(dir, "shots"), { recursive: true });
    writeFileSync(path.join(dir, "index.html"), "<p>a</p>");
    writeFileSync(path.join(dir, "shots", "a.png"), "png");
  }
  expect(hashDir(first)).toBe(hashDir(second));

  writeFileSync(path.join(second, "shots", "a.png"), "different");
  expect(hashDir(first)).not.toBe(hashDir(second));
});

test("an unknown command exits non-zero", async () => {
  const process = Bun.spawn([cli, "validate"], { stdout: "pipe", stderr: "pipe" });
  expect(await new Response(process.stderr).text()).toContain("Unknown command: validate");
  expect(await process.exited).toBe(1);
});

test("removeType takes out one line and leaves the rest", () => {
  const dir = scratch();
  writeFileSync(path.join(dir, ".types"), "# a comment\n");
  appendType(dir, "abc123def456", "session");
  appendType(dir, "0123456789ab", "doc");

  expect(removeType(dir, "abc123def456")).toBe(true);

  const types = readTypes(dir);
  expect(types.has("abc123def456")).toBe(false);
  expect(types.get("0123456789ab")).toBe("doc");
  expect(readFileSync(path.join(dir, ".types"), "utf8")).toContain("# a comment");
});

test("removeType reports a hash that was never there", () => {
  const dir = scratch();
  appendType(dir, "abc123def456", "session");
  expect(removeType(dir, "0123456789ab")).toBe(false);
  expect(readTypes(dir).size).toBe(1);
});

test("removeShareFiles takes out all three parts of a share", () => {
  const dir = scratch();
  const hash = "abc123def456";
  mkdirSync(path.join(dir, "public", "s", hash), { recursive: true });
  mkdirSync(path.join(dir, "content", "shares"), { recursive: true });
  writeFileSync(path.join(dir, "public", "s", hash, "index.html"), "<p>a</p>");
  writeFileSync(path.join(dir, "content", "shares", `${hash}.mdx`), "---\n---\n");
  appendType(dir, hash, "doc");

  removeShareFiles(dir, hash);

  expect(existsSync(path.join(dir, "public", "s", hash))).toBe(false);
  expect(existsSync(path.join(dir, "content", "shares", `${hash}.mdx`))).toBe(false);
  expect(readTypes(dir).size).toBe(0);
});

test("a directory that is not a share repository is refused", () => {
  const dir = scratch();
  expect(() => assertShareClone(dir)).toThrow(/Not a git repository/);

  mkdirSync(path.join(dir, ".git"), { recursive: true });
  expect(() => assertShareClone(dir)).toThrow(/Not an artifact share repository/);

  mkdirSync(path.join(dir, "src", "components"), { recursive: true });
  writeFileSync(path.join(dir, "src", "components", "kinds.ts"), "");
  expect(() => assertShareClone(dir)).not.toThrow();
});

test("a timestamp is safe in a file name and sorts by time", () => {
  const stamp = timestamp();
  expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
});

test("recreate refuses without a matching --confirm", async () => {
  const config = path.join(scratch(), "config.json");
  writeFileSync(
    config,
    JSON.stringify({
      clone_root: tmpdir(),
      shares: { demo: { repo: "someone/demo", branch: "main", pages_url: "https://x/demo/" } },
    }),
  );

  const process = Bun.spawn([cli, "recreate", "demo"], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, ARTIFACT_SHARES_CONFIG: config },
  });
  expect(await new Response(process.stderr).text()).toContain("repeat the name");
  expect(await process.exited).toBe(1);
});
test("create --no-pages keeps the repository private and archives the deploy workflow", async () => {
  const root = scratch();
  const bin = path.join(root, "bin");
  mkdirSync(bin);
  const gh = path.join(bin, "gh");
  const git = path.join(bin, "git");
  const mise = path.join(bin, "mise");
  const ghLog = path.join(root, "gh.log");
  writeFileSync(gh, `#!/bin/sh
printf '%s\\n' "$*" >> "$FAKE_GH_LOG"
case "$1:$2" in
  auth:status) exit 0 ;;
  api:user) printf 'owner\\n'; exit 0 ;;
  api:*) exit 1 ;;
  repo:view)
    case "$*" in *sshUrl*) printf 'git@github.com:owner/no-pages.git\\n'; exit 0 ;; esac
    exit 1 ;;
  repo:create) exit 0 ;;
esac
exit 1
`);
  writeFileSync(git, `#!/bin/sh
if [ "$1" = "init" ]; then mkdir -p .git; fi
exit 0
`);
  writeFileSync(mise, "#!/bin/sh\nexit 1\n");
  for (const file of [gh, git, mise]) chmodSync(file, 0o755);

  const config = path.join(root, "config.json");
  writeFileSync(config, JSON.stringify({ clone_root: root, shares: {} }));
  const child = Bun.spawn([process.execPath, cli, "create", "no-pages", "--no-pages"], {
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...Bun.env,
      PATH: `${bin}:${Bun.env.PATH}`,
      ARTIFACT_SHARES_CONFIG: config,
      FAKE_GH_LOG: ghLog,
    },
  });
  const output = await new Response(child.stdout).text();
  expect(await child.exited).toBe(0);
  expect(output).toContain('"pagesUrl": null');
  expect(output).toContain("Pages is disabled");
  const clone = path.join(root, "no-pages");
  expect(existsSync(path.join(clone, ".artifact-shares", "deploy.yml"))).toBe(true);
  expect(existsSync(path.join(clone, ".github", "workflows", "deploy.yml"))).toBe(false);
  const saved = JSON.parse(readFileSync(config, "utf8")) as { shares: Record<string, { pages_url: string | null }> };
  expect(saved.shares["no-pages"]?.pages_url).toBeNull();
  const calls = readFileSync(ghLog, "utf8");
  expect(calls).toContain("repo create owner/no-pages --private");
  expect(calls).not.toContain("repos/owner/no-pages/pages");
}, 30_000);
test("Pages activation warns about existing shares and publishes the workflow after confirmation", async () => {
  const root = scratch();
  const bin = path.join(root, "bin");
  const clone = path.join(root, "private");
  const remote = path.join(root, "remote.git");
  mkdirSync(bin);
  cpSync(templateDir, clone, { recursive: true });
  const archivedWorkflow = path.join(clone, ".artifact-shares", "deploy.yml");
  mkdirSync(path.dirname(archivedWorkflow), { recursive: true });
  renameSync(path.join(clone, ".github", "workflows", "deploy.yml"), archivedWorkflow);
  writeFileSync(path.join(clone, ".types"), "deadbeefcafe=doc\n");

  const init = Bun.spawnSync(["git", "init", "-b", "main", clone]);
  expect(init.exitCode).toBe(0);
  Bun.spawnSync(["git", "init", "--bare", remote]);
  Bun.spawnSync(["git", "-C", clone, "config", "user.name", "Artifact Share Test"]);
  Bun.spawnSync(["git", "-C", clone, "config", "user.email", "test@example.invalid"]);
  Bun.spawnSync(["git", "-C", clone, "add", "."]);
  Bun.spawnSync(["git", "-C", clone, "commit", "-m", "initial repository"]);
  Bun.spawnSync(["git", "-C", clone, "remote", "add", "origin", remote]);
  Bun.spawnSync(["git", "-C", clone, "push", "-u", "origin", "main"]);

  const gh = path.join(bin, "gh");
  writeFileSync(gh, `#!/bin/sh
case "$1:$2" in
  auth:status) exit 0 ;;
  api:*)
    case "$*" in
      *--jq*) printf 'https://owner.github.io/private\\n'; exit 0 ;;
      *--method\\ DELETE*) exit 0 ;;
      *--method\\ POST*) exit 0 ;;
      *--method\\ PUT*) exit 0 ;;
    esac
    ;;
esac
exit 1
`);
  chmodSync(gh, 0o755);

  const config = path.join(root, "config.json");
  writeFileSync(config, JSON.stringify({
    clone_root: root,
    shares: { private: { repo: "owner/private", branch: "main", pages_url: null } },
  }));
  const child = Bun.spawn([process.execPath, cli, "pages", "enable", "private", "--confirm", "private"], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, PATH: `${bin}:${Bun.env.PATH}`, ARTIFACT_SHARES_CONFIG: config },
  });
  const output = await new Response(child.stdout).text();
  const stderr = await new Response(child.stderr).text();
  const exitCode = await child.exited;
  if (exitCode !== 0) throw new Error(stderr || output);
  expect(output).toContain("all 1 existing share(s) public");
  expect(output).toContain('"existingSharesExposed": 1');
  expect(existsSync(path.join(clone, ".github", "workflows", "deploy.yml"))).toBe(true);
  expect(existsSync(path.join(clone, ".artifact-shares", "deploy.yml"))).toBe(false);
  const saved = JSON.parse(readFileSync(config, "utf8")) as { shares: Record<string, { pages_url: string | null }> };
  expect(saved.shares.private?.pages_url).toBe("https://owner.github.io/private/");
  writeFileSync(config, JSON.stringify({
    clone_root: root,
    shares: { private: { repo: "owner/private", branch: "main", pages_url: null } },
  }));
  const recovery = Bun.spawn([process.execPath, cli, "pages", "enable", "private", "--confirm", "private"], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, PATH: `${bin}:${Bun.env.PATH}`, ARTIFACT_SHARES_CONFIG: config },
  });
  const recoveredOutput = await new Response(recovery.stdout).text();
  const recoveryError = await new Response(recovery.stderr).text();
  if (await recovery.exited) throw new Error(recoveryError || recoveredOutput);
  expect(recoveredOutput).toContain('"pagesUrl": "https://owner.github.io/private/"');
  expect(JSON.parse(readFileSync(config, "utf8")).shares.private.pages_url).toBe("https://owner.github.io/private/");
}, 30_000);


test("list reports Pages as disabled for repository-only shares", async () => {
  const root = scratch();
  const config = path.join(root, "config.json");
  writeFileSync(config, JSON.stringify({
    clone_root: root,
    shares: { private: { repo: "owner/private", branch: "main", pages_url: null } },
  }));

  const process = Bun.spawn([cli, "list"], {
    stdout: "pipe",
    env: { ...Bun.env, ARTIFACT_SHARES_CONFIG: config },
  });
  const output = await new Response(process.stdout).text();
  expect(output).toContain("pages: disabled");
  expect(await process.exited).toBe(0);
});
test("repository-only dry runs return no URL and leave the clone unchanged", async () => {
  const root = scratch();
  const clone = path.join(root, "private");
  cpSync(templateDir, clone, { recursive: true });
  const git = Bun.spawnSync(["git", "init", "-q", clone]);
  expect(git.exitCode).toBe(0);

  const artifact = path.join(root, "report.md");
  writeFileSync(artifact, "# Private report\n\nStaged without a Pages URL.\n");
  const config = path.join(root, "config.json");
  writeFileSync(config, JSON.stringify({
    clone_root: root,
    shares: { private: { repo: "owner/private", branch: "main", pages_url: null } },
  }));

  const process = Bun.spawn([cli, "share", "doc", artifact, "--dry-run", "--into", "private"], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, ARTIFACT_SHARES_CONFIG: config },
  });
  const output = await new Response(process.stdout).text();
  expect(await process.exited).toBe(0);
  const start = output.indexOf('{\n  "dryRun"');
  const end = output.indexOf("\n\nNothing was written", start);
  const result = JSON.parse(output.slice(start, end)) as { url: string | null; repositoryPath: string };
  expect(result.url).toBeNull();
  expect(result.repositoryPath).toMatch(/^content\/shares\/[a-f0-9]{12}\.mdx$/);
  expect(readTypes(clone).size).toBe(0);
  expect(existsSync(path.join(clone, result.repositoryPath))).toBe(false);
}, 30_000);
test("an unchanged repository-only dry run reports its path and dry-run state", async () => {
  const root = scratch();
  const clone = path.join(root, "private");
  cpSync(templateDir, clone, { recursive: true });
  const artifact = path.join(root, "report.md");
  writeFileSync(artifact, "# Existing report\n");
  const hash = hashFile(artifact);
  writeFileSync(path.join(clone, ".types"), `${hash}=doc\n`);
  const git = Bun.spawnSync(["git", "init", "-q", clone]);
  expect(git.exitCode).toBe(0);

  const config = path.join(root, "config.json");
  writeFileSync(config, JSON.stringify({
    clone_root: root,
    shares: { private: { repo: "owner/private", branch: "main", pages_url: null } },
  }));
  const child = Bun.spawn([process.execPath, cli, "share", "doc", artifact, "--dry-run", "--into", "private"], {
    stdout: "pipe",
    env: { ...Bun.env, ARTIFACT_SHARES_CONFIG: config },
  });
  const output = await new Response(child.stdout).text();
  expect(await child.exited).toBe(0);
  const result = JSON.parse(output) as {
    url: string | null;
    repositoryPath: string;
    unchanged: boolean;
    dryRun: boolean;
  };
  expect(result.url).toBeNull();
  expect(result.repositoryPath).toBe(`content/shares/${hash}.mdx`);
  expect(result.unchanged).toBe(true);
  expect(result.dryRun).toBe(true);
});



test("Pages activation refuses without the exact repository confirmation", async () => {
  const root = scratch();
  const config = path.join(root, "config.json");
  writeFileSync(config, JSON.stringify({
    clone_root: root,
    shares: { private: { repo: "owner/private", branch: "main", pages_url: null } },
  }));

  const process = Bun.spawn([cli, "pages", "enable", "private", "--confirm", "wrong"], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, ARTIFACT_SHARES_CONFIG: config },
  });
  const stderr = await new Response(process.stderr).text();
  expect(stderr).toContain("Pages activation requires --confirm private");
  expect(await process.exited).toBe(1);
});

test("the template ships every check the hook and the workflows name", () => {
  const tasks = path.join(templateDir, ".mise", "tasks", "checks");
  for (const check of ["types", "scripts", "typescript", "secrets", "metadata", "size"]) {
    expect(existsSync(path.join(tasks, `${check}.ts`))).toBe(true);
  }

  const hooks = readFileSync(path.join(templateDir, "hk.pkl"), "utf8");
  for (const check of ["checks:secrets", "checks:metadata", "checks:size"]) {
    expect(hooks).toContain(check);
  }
});

test("the scanner ignore files never exclude the published bytes", () => {
  for (const name of [".gitleaksignore", ".trufflehogignore", ".gitleaks.toml"]) {
    const file = path.join(templateDir, name);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    // A commented warning names both paths. Only uncommented lines matter.
    const rules = text
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .join("\n");
    expect(rules).not.toContain("public/s");
    expect(rules).not.toContain("content/shares");
  }
});
