import { expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileDocument } from "./markdown";
import { skillFiles } from "./skill-files";
import { skillMetadata } from "./skill-metadata";

const cache: Parameters<typeof compileDocument>[0]["cache"] = async (key, compute) => compute(key);
const meta = { filePath: "sample.md", fileName: "sample.md", directory: "", path: "sample", extension: "md" };

test("heading links distinguish duplicate headings and preserve document-local navigation", async () => {
  const html = await compileDocument(
    { cache },
    {
      _meta: meta,
      content:
        "## Read this\n\n[Second section](#read-this-1)\n\n## Read this\n\n## Read this-1\n\n[Source](references/guide.md)\n\n[External](https://example.com/)",
    },
    "https://example.com/skills/sample/",
  );
  expect(html).toContain('id="doc-sample-read-this"');
  expect(html).toContain('id="doc-sample-read-this-1"');
  expect(html).toContain('id="doc-sample-read-this-1-1"');
  expect(html).toContain('href="#doc-sample-read-this-1">Second section</a>');
  expect(html).toContain('href="https://example.com/skills/sample/references/guide.md"');
  expect(html).toContain('href="https://example.com/">External</a>');
});

test("metadata follows local reference documents but excludes input files and external links", () => {
  const directory = mkdtempSync(join(tmpdir(), "skill-metadata-"));
  try {
    mkdirSync(join(directory, "sample/references"), { recursive: true });
    writeFileSync(
      join(directory, "sample/references/contract.md"),
      "# Outputs\n\nWrites `reports/<KEY>.md` and `actions.json`.\n\n## Inputs\n\nRead `input.json`.\n\nWrite `applied.json`. Then read `input.md`.\n\nWrite `SKILL.md`.\n",
    );
    const metadata = skillMetadata(
      "[Contract](references/contract.md)\n\n[Duplicate](references/contract.md)\n\n[External](https://example.com/input.md)\n\n[Outside](../outside.md)",
      "sample",
      directory,
    );
    expect(metadata.references.map((entry) => entry.path)).toEqual(["references/contract.md"]);
    expect(metadata.artifacts.map((entry) => entry.path)).toEqual([
      "reports/<KEY>.md",
      "actions.json",
      "applied.json",
      "SKILL.md",
    ]);
    expect(metadata.artifacts[0]?.source).toEndWith("/sample/references/contract.md");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("static discovery includes nested skills and only adjacent how-to guides", () => {
  const directory = mkdtempSync(join(tmpdir(), "skill-files-"));
  try {
    mkdirSync(join(directory, "child"));
    mkdirSync(join(directory, "references"));
    writeFileSync(join(directory, "SKILL.md"), "---\nname: parent\n---\n");
    writeFileSync(join(directory, "child/SKILL.md"), "---\nname: child\n---\n");
    writeFileSync(join(directory, "child/how-to-use.md"), "---\ntitle: Use child\n---\n");
    writeFileSync(join(directory, "references/how-to-example.md"), "Not a guide for the parent.");
    expect(skillFiles(directory)).toEqual([
      { name: "parent", hasHowTos: false },
      { name: "child", hasHowTos: true },
    ]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
