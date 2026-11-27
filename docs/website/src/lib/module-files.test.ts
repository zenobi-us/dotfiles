import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { moduleFiles } from "./module-files";

function addModule(root: string, id: string, items?: unknown[]) {
  const directory = join(root, id);
  mkdirSync(join(directory, "docs/tool"), { recursive: true });
  for (const file of ["README.md", "mise.toml", "docs/tool/README.md", "docs/tool/HOWTO.md"])
    writeFileSync(join(directory, file), "Example source\n");
  const item = {
    id: "tool",
    title: "Tool",
    description: "Use the tool",
    kind: "tool",
    sources: ["mise.toml"],
    readme: "docs/tool/README.md",
    howto: "docs/tool/HOWTO.md",
  };
  const manifest = { title: id, description: "Example module", items: items ?? [item] };
  writeFileSync(join(directory, "docs.json"), JSON.stringify(manifest));
  return { directory, item };
}

function fixture(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "module-docs-"));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("module manifests reject source traversal and symlinks outside the module", () =>
  fixture((root) => {
    const module = addModule(root, "commands-test");
    writeFileSync(join(root, "private.txt"), "private");
    const manifest = {
      title: "Test",
      description: "Test module",
      items: [{ ...module.item, sources: ["../private.txt"] }],
    };
    writeFileSync(join(module.directory, "docs.json"), JSON.stringify(manifest));
    expect(() => moduleFiles(root)).toThrow("must stay within");
    symlinkSync(join(root, "private.txt"), join(module.directory, "outside.txt"));
    manifest.items[0]!.sources = ["outside.txt"];
    writeFileSync(join(module.directory, "docs.json"), JSON.stringify(manifest));
    expect(() => moduleFiles(root)).toThrow("symlink escapes");
  }));

test("canonical item links resolve to an authored item, not another link or a missing item", () =>
  fixture((root) => {
    addModule(root, "devtools-owner");
    const item = {
      id: "shared",
      title: "Shared tool",
      description: "Use the canonical owner",
      kind: "tool",
      sources: ["mise.toml"],
      href: "/modules/devtools-owner/items/tool/",
    };
    const linked = addModule(root, "commands-links", [item]);
    expect(moduleFiles(root).find((module) => module.id === "commands-links")?.items[0]?.href).toBe(item.href);
    item.href = "/modules/devtools-owner/items/missing/";
    writeFileSync(
      join(linked.directory, "docs.json"),
      JSON.stringify({ title: "Links", description: "Links", items: [item] }),
    );
    expect(() => moduleFiles(root)).toThrow("Unknown canonical destination");
  }));
