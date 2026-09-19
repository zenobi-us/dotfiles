import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { convertHtmlToMdx, escapeMdx, frontmatterValue, splitFrontmatter } from "../html";
import {
  appendType,
  assertShareClone,
  assertShareName,
  hashDir,
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
  // The `check` subcommand's own description. "check" alone would also match
  // doctor's description, so it proves nothing on its own.
  expect(output).toContain("Run a share repository's own checks");
  expect(await process.exited).toBe(0);
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
