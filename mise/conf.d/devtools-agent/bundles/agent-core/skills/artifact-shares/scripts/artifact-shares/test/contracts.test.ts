// Consumer-visible configuration and historical metadata boundaries, through owning commands.
import { afterEach, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readShareMetadata } from "../../../assets/repo-template/src/share-metadata.ts";
import { hashFile, readTypes } from "../lib.ts";

const cli = new URL("../cli.ts", import.meta.url).pathname;
const template = new URL("../../../assets/repo-template/", import.meta.url).pathname;
const roots: string[] = [];
function scratch(): string {
  const root = mkdtempSync(path.join(tmpdir(), "artifact-contracts-"));
  roots.push(root);
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
async function command(config: string, ...args: string[]) {
  const child = Bun.spawn([cli, ...args], {
    env: { ...process.env, ARTIFACT_SHARES_CONFIG: config }, stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout, stderr, exit };
}

test("legacy reads preserve bytes and authorized local mutation upgrades without losing authored configuration", async () => {
  const root = scratch();
  const file = path.join(root, "config.json");
  const entry = { repo: "private/example", branch: "release", pages_url: null, authored: { note: "keep", priority: 42 } };
  const original = `  ${JSON.stringify({ shares: { "named-share": entry }, authored: ["keep", { nested: true }] })}\n`;
  writeFileSync(file, original);
  expect((await command(file, "list")).exit).toBe(0);
  expect(readFileSync(file, "utf8")).toBe(original);
  const changed = await command(file, "config", "clone-root", root);
  expect(changed.exit).toBe(0);
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
    schemaVersion: "artifact-share-config/v2", clone_root: root,
    shares: { "named-share": entry }, authored: ["keep", { nested: true }],
  });
  const current = readFileSync(file);
  expect((await command(file, "config", "upgrade")).exit).toBe(0);
  expect(readFileSync(file)).toEqual(current);
});

test("unknown versions, malformed legacy data and unsafe conversion preserve exact bytes", async () => {
  const file = path.join(scratch(), "config.json");
  for (const content of [
    '{"schemaVersion":"artifact-share-config/v999","shares":{}}\n',
    '{"schemaVersion":null,"shares":{}}\n',
    '{"shares":null}\n',
    '{"shares":{},"authored":9007199254740993}\n',
    '{"shares":{},"authored":-0}\n',
    '{"shares":{},"shares":{"hidden":{}}}\n',
    '{"shares":{},"immutable":true}\n',
  ]) {
    writeFileSync(file, content);
    expect((await command(file, "config", "clone-root", "/another/root")).exit).not.toBe(0);
    expect(readFileSync(file, "utf8")).toBe(content);
  }
});

test("historical publication retrieval validates identity without rewriting authored pages or assets", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "artifact-contracts-"));
  try {
    const clone = path.join(root, "private");
    cpSync(template, clone, { recursive: true });
    expect(Bun.spawnSync(["git", "init", "-q", clone]).exitCode).toBe(0);
    const source = path.join(root, "source.html");
    for (const original of ["<h1>Review 376</h1>\n", "<h1>Historical review 313</h1>\n"]) {
      writeFileSync(source, original);
      const hash = hashFile(source);
      writeFileSync(path.join(clone, ".types"), `# Authored index\n${hash}=doc\n`);
      const page = path.join(clone, "content", "shares", `${hash}.mdx`);
      for (const version of ["", "schemaVersion: artifact-share-metadata/v1\n"]) {
        const historical = `---\n${version}title: Original\nkind: doc\nhash: ${hash}\ndate: 2026-11-22\nsource: source.html\nauthored: keep\n---\n\nAuthored body.\n`;
        writeFileSync(page, historical);
        const file = path.join(root, "config.json");
        writeFileSync(file, JSON.stringify({ clone_root: root, shares: { private: { repo: "private/example", branch: "main", pages_url: null } } }));
        const retrieved = await command(file, "share", "doc", source, "--dry-run");
        expect(retrieved.exit, retrieved.stderr).toBe(0);
        expect(JSON.parse(retrieved.stdout)).toMatchObject({ unchanged: true, dryRun: true, hash, url: null, repositoryPath: `content/shares/${hash}.mdx` });
        expect(readFileSync(page, "utf8")).toBe(historical);
        expect(readFileSync(source, "utf8")).toBe(original);
        const unsupported = historical.replace("title: Original", "schemaVersion: artifact-share-metadata/v999\ntitle: Original");
        writeFileSync(page, unsupported);
        expect((await command(file, "share", "doc", source, "--dry-run")).exit).not.toBe(0);
        expect(readFileSync(page, "utf8")).toBe(unsupported);
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 30_000);

test("metadata readers reject unknown explicit identity and share index rejects duplicate identities", () => {
  const front = "---\ntitle: Report\nkind: doc\nhash: abc123def456\ndate: 2026-11-22\nsource: report.md\n";
  expect(readShareMetadata(`${front}---\nBody`).source).toBe("report.md");
  expect(readShareMetadata(`${front}schemaVersion: artifact-share-metadata/v2\n---\nBody`).schemaVersion).toBe("artifact-share-metadata/v2");
  expect(() => readShareMetadata(`${front}schemaVersion: null\n---\nBody`)).toThrow();
  const root = scratch();
  writeFileSync(path.join(root, ".types"), "abc123def456=doc\nabc123def456=session\n");
  expect(() => readTypes(root)).toThrow();
});

test("historical numeric hash scalars retain their exact text only in legacy contracts", () => {
  for (const hash of ["860951705127", "000000000123", "123456789e12", "42226e907802"]) {
    const front = `---\ntitle: Report\nkind: doc\nhash: ${hash}\ndate: 2026-11-22\nsource: report.html\nauthored: keep\n`;
    for (const version of ["", "schemaVersion: artifact-share-metadata/v1\n"]) {
      expect(readShareMetadata(`${front}${version}---\nBody`)).toMatchObject({ hash, authored: "keep" });
    }
    for (const version of ["artifact-share-metadata/v2", "artifact-share-metadata/v999"]) {
      expect(() => readShareMetadata(`${front}schemaVersion: ${version}\n---\nBody`)).toThrow();
    }
  }
  for (const hash of ["123", "1.23456789e11", "123456789E12", "12345678e+12", "0x1234567890", "[123456789012]", "null"]) {
    expect(() => readShareMetadata(`---\ntitle: Report\nkind: doc\nhash: ${hash}\ndate: 2026-11-22\nsource: report.html\n---\nBody`)).toThrow();
  }
});

test("numeric-looking content hashes generate current string metadata without publishing", async () => {
  const root = scratch();
  const clone = path.join(root, "private");
  cpSync(template, clone, { recursive: true });
  expect(Bun.spawnSync(["git", "init", "-q", clone]).exitCode).toBe(0);
  const source = path.join(root, "report.html");
  const original = "<h1>Review 376</h1>\n";
  writeFileSync(source, original);
  expect(hashFile(source)).toBe("860951705127");
  const file = path.join(root, "config.json");
  writeFileSync(file, JSON.stringify({ clone_root: root, shares: { private: { repo: "private/example", branch: "main", pages_url: null } } }));
  const generated = await command(file, "share", "doc", source, "--dry-run");
  expect(generated.exit).toBe(0);
  const start = generated.stdout.indexOf('{\n  "dryRun"');
  const end = generated.stdout.indexOf("\n\nNothing was written", start);
  const result = JSON.parse(generated.stdout.slice(start, end));
  roots.push(result.stage);
  const page = readFileSync(result.page, "utf8");
  expect(page).toContain('hash: "860951705127"');
  expect(readShareMetadata(page)).toMatchObject({ schemaVersion: "artifact-share-metadata/v2", hash: "860951705127", title: "Review 376" });
  expect(result.url).toBeNull();
  expect(readTypes(clone).size).toBe(0);
  expect(readFileSync(source, "utf8")).toBe(original);
  expect(readFileSync(path.join(result.stage, "public", "s", result.hash, "report.html"), "utf8")).toBe(original);
}, 30_000);
