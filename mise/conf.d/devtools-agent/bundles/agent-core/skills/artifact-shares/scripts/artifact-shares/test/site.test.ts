// Exercise the installed MDX loader and static site builder, not a schema helper.
import { expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const template = new URL("../../../assets/repo-template/", import.meta.url).pathname;

test("site builds historical scalar hashes losslessly and rejects unsupported current scalars without rewriting pages", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "artifact-site-contract-"));
  async function run(args: string[]) {
    const child = Bun.spawn(["mise", "exec", "--", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    return { stdout, stderr, exit };
  }
  try {
    cpSync(template, root, { recursive: true });
    const installed = await run(["bun", "install", "--frozen-lockfile"]);
    expect(installed.exit, installed.stderr).toBe(0);
    const file = path.join(root, "content", "shares", "historical.mdx");
    const ordinary = "---\ntitle: Ordinary page\nschemaVersion: unrelated-page/v9\nsource: 123\n---\n\nOrdinary content stays readable.\n";
    writeFileSync(path.join(root, "content/index.mdx"), ordinary);
    const valid = "---\nschemaVersion: artifact-share-metadata/v2\ntitle: Current\nkind: doc\nhash: \"abc123def456\"\ndate: 2026-11-22\nsource: report.html\n---\n\nCurrent report\n";
    const malformed = [
      ...["xyz", "ABC123DEF456", "abc123def4560", ""].map((hash) => valid.replace('"abc123def456"', JSON.stringify(hash))),
      ...["title", "kind", "hash", "date", "source"].map((key) => valid.replace(new RegExp(`^${key}:.*\\n`, "m"), "")),
      valid.replace("kind: doc", 'kind: ""'),
      valid.replace("date: 2026-11-22", "date: tomorrow"),
      valid.replace("source: report.html", "source: 123"),
      valid.replace("title: Current", "title: 123"),
      valid.replace("title: Current", "title: Current\ndescription: 123"),
      ...["", "schemaVersion: artifact-share-metadata/v1\n"].map((version) => valid
        .replace("schemaVersion: artifact-share-metadata/v2\n", version)
        .replace('"abc123def456"', "000000000123")
        .replace("source: report.html\n", "")),
    ];
    for (const [version, hash, scalar, accepted] of [
      ["", "860951705127", "860951705127", true],
      ["artifact-share-metadata/v1", "000000000123", "000000000123", true],
      ["", "42226e907802", "42226e907802", true],
      ["artifact-share-metadata/v1", "123456789e12", "123456789e12", true],
      ["artifact-share-metadata/v2", "42226e907802", '"42226e907802"', true],
      ["artifact-share-metadata/v2", "000000000123", '"000000000123"', true],
      ["artifact-share-metadata/v2", "42226e907802", "42226e907802", false],
      ["artifact-share-metadata/v2", "123456789e12", "123456789e12", false],
      ["artifact-share-metadata/v2", "860951705127", '"860951705127"', true],
      ["artifact-share-metadata/v2", "860951705127", "860951705127", false],
      ["artifact-share-metadata/v999", "860951705127", '"860951705127"', false],
    ] as const) {
      const page = `---\n${version ? `schemaVersion: ${version}\n` : ""}title: Historical\nkind: doc\nhash: ${scalar}\ndate: 2026-11-22\nsource: report.html\n---\n\n<div data-interpreted-hash={frontmatter.hash}>Historical report</div>\n`;
      writeFileSync(file, page);
      // Avoid any previous compilation cache hiding a changed frontmatter value.
      for (const dir of [".source", "dist", "node_modules/.vite"]) rmSync(path.join(root, dir), { recursive: true, force: true });
      const built = await run(["bunx", "--no-install", "fumapress", "build"]);
      expect(readFileSync(file, "utf8")).toBe(page);
      if (accepted) {
        expect(built.exit, built.stdout + built.stderr).toBe(0);
        expect(readFileSync(path.join(root, "dist/public/index.html"), "utf8")).toContain("Ordinary content stays readable.");
        expect(readFileSync(path.join(root, "content/index.mdx"), "utf8")).toBe(ordinary);
        const html = readFileSync(path.join(root, "dist/public/shares/historical/index.html"), "utf8");
        expect(html).toContain(`data-interpreted-hash="${hash}"`);
      } else {
        expect(built.exit, built.stdout + built.stderr).not.toBe(0);
        expect(built.stdout + built.stderr).toMatch(/hash|Unsupported explicit share metadata contract/);
      }
    }
    for (const page of malformed) {
      writeFileSync(file, page);
      for (const dir of [".source", "dist", "node_modules/.vite"]) rmSync(path.join(root, dir), { recursive: true, force: true });
      const built = await run(["bunx", "--no-install", "fumapress", "build"]);
      expect(built.exit, page + built.stdout + built.stderr).not.toBe(0);
      expect(built.stdout + built.stderr).toMatch(/Share (metadata|description)/);
      expect(readFileSync(file, "utf8")).toBe(page);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 600_000);
