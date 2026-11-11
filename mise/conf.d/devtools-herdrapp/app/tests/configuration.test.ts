import { afterEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { matchesSource, mergePreferences } from "../configuration";

const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true }))); });

test("owned keys override preferences without losing unrelated settings or dotted keys", () => {
  const current = {
    zoom: 1.5,
    sounds: { enabled: true, volume: 0.2 },
    global: { "ctrl-p": "local.command", "alt-h": "old.command" },
    "better-changes.diff-layout": "split",
    layout: "personal",
  };
  const result = mergePreferences(current, {
    sounds: { enabled: false },
    global: { "alt-h": "pane.go:left" },
    "better-changes.diff-layout": "inline",
  });
  expect(result).toEqual({
    zoom: 1.5,
    sounds: { enabled: false, volume: 0.2 },
    global: { "ctrl-p": "local.command", "alt-h": "pane.go:left" },
    "better-changes.diff-layout": "inline",
    layout: "personal",
  });
  expect(current.sounds.enabled).toBe(true);
  expect(mergePreferences(result, { sounds: { enabled: false } })).toEqual(result);
});

test("CLI adoption rejects changed files and links but ignores generated editor files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "herdr-adoption-"));
  temporary.push(root);
  const source = path.join(root, "source"), installed = path.join(root, "installed");
  await fs.mkdir(path.join(source, "icons"), { recursive: true });
  await fs.writeFile(path.join(source, "main.js"), "original");
  await fs.writeFile(path.join(source, "icons/test.svg"), "icon");
  await fs.cp(source, installed, { recursive: true });
  await fs.writeFile(path.join(installed, "jsconfig.json"), "local editor configuration");
  expect(await matchesSource(source, installed)).toBe(true);
  await fs.writeFile(path.join(installed, "icons/test.svg"), "local edit");
  expect(await matchesSource(source, installed)).toBe(false);
  await fs.writeFile(path.join(installed, "icons/test.svg"), "icon");
  await fs.unlink(path.join(installed, "main.js"));
  expect(await matchesSource(source, installed)).toBe(false);
  await fs.symlink(path.join(source, "main.js"), path.join(installed, "main.js"));
  expect(await matchesSource(source, installed)).toBe(false);
});
