// Public commands must preserve rejected bytes and report only actual persisted conversions.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ContractManifest } from "./contracts.ts";
const router = fileURLToPath(new URL("./router.ts", import.meta.url));
const example = fileURLToPath(new URL("../examples/upgrades", import.meta.url));
let root: string;
let skill: string;
let artifact: string;
let manifest: ContractManifest;
let preload: string | undefined;
const note = { schemaVersion: "example-note/v1", title: "  Authored ☃ title\n", body: "First\n\n**Keep**  spacing.\n", metadata: { labels: ["one", "two"], count: 0, enabled: false } };
beforeEach(async () => {
  preload = undefined;
  root = await mkdtemp(join(tmpdir(), "contract-upgrade-"));
  skill = join(root, "owner");
  artifact = join(root, "note.json");
  await cp(example, skill, { recursive: true });
  manifest = JSON.parse(await readFile(join(skill, "contracts.json"), "utf8"));
  await writeFile(artifact, JSON.stringify(note, null, 2));
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
async function saveManifest(): Promise<void> { await writeFile(join(skill, "contracts.json"), JSON.stringify(manifest)); }
async function override(methods: string): Promise<void> {
  await writeFile(join(skill, "test-owner.ts"), `import owner from './owner.ts'; export default {...owner, ${methods}};`);
}
async function run(operation = "safe-upgrade", args: string[] = []) {
  const child = Bun.spawn([process.execPath, ...(preload ? ["--preload", preload] : []), "--install=fallback", router, operation, "--skill", skill, ...(operation === "validate" || operation === "resolve" ? [] : ["--owner", "file:test-owner.ts"]), ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  const [code, out, error] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  return { code, out, error };
}
async function upgrade(operation = "upgrade", extra: string[] = []) {
  return run("safe-upgrade", ["--artifact", artifact, "--operation", operation, ...extra]);
}
async function rejected(message: string, operation = "upgrade", extra: string[] = []) {
  const before = await readFile(artifact);
  const result = await upgrade(operation, extra);
  expect(result.code).toBe(1);
  expect(result.error).toContain(message);
  expect(result.out).toBe("");
  expect(await readFile(artifact)).toEqual(before);
}

test("public mutation converts structure, preserves authored content, then applies only requested change", async () => {
  await override("");
  const request = join(root, "request.json");
  await writeFile(request, JSON.stringify({ title: "New title" }));
  const result = await upgrade("rename", ["--request", request]);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.out)).toEqual({ status: "completed", artifact, changed: true, from: "example-note/v1", to: "example-note/v2" });
  expect(JSON.parse(await readFile(artifact, "utf8"))).toEqual({ schemaVersion: "example-note/v2", document: { heading: "New title", text: note.body }, metadata: note.metadata });
});
test("explicit bulk conversion preserves meaning and current bytes on repeated execution", async () => {
  await override("");
  const list = join(root, "list.json");
  await writeFile(list, JSON.stringify([artifact]));
  const result = await run("bulk-upgrade", ["--artifacts", list]);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.out).status).toBe("completed");
  expect(JSON.parse(await readFile(artifact, "utf8"))).toEqual({ schemaVersion: "example-note/v2", document: { heading: note.title, text: note.body }, metadata: note.metadata });
  const before = await readFile(artifact);
  const repeat = await run("bulk-upgrade", ["--artifacts", list]);
  expect(JSON.parse(repeat.out).results[0].changed).toBe(false);
  expect(await readFile(artifact)).toEqual(before);
});
test("explicit exactly-one legacy detection converts supported unversioned content", async () => {
  await override("");
  const { schemaVersion, ...legacy } = note;
  await writeFile(artifact, JSON.stringify(legacy));
  expect((await upgrade()).code).toBe(0);
  expect(JSON.parse(await readFile(artifact, "utf8"))).toEqual({ schemaVersion: "example-note/v2", document: { heading: note.title, text: note.body }, metadata: note.metadata });
});
test.each([{ matches: [] }, { matches: ["example-note/v1", "example-note/v2"] }])("legacy detection rejects uncertain matches %j", async ({ matches }) => {
  await override(`detectLegacy() { return ${JSON.stringify(matches)}; }`);
  const { schemaVersion, ...legacy } = note;
  await writeFile(artifact, JSON.stringify(legacy));
  await rejected("exactly one supported");
});
test("unknown explicit identifier never invokes legacy detection", async () => {
  await override("detectLegacy() { throw new Error('must not detect'); }");
  await writeFile(artifact, JSON.stringify({ ...note, schemaVersion: "example-note/v99" }));
  await rejected("Unsupported explicit contract");
});
test("malformed explicit identifier is not absent", async () => {
  await override("");
  await writeFile(artifact, JSON.stringify({ ...note, schemaVersion: null }));
  await rejected("Explicit schemaVersion");
});
test("absent declared path rejects without persistence", async () => {
  await override(""); manifest.upgrades = []; await saveManifest();
  await rejected("No declared upgrade path");
});
test("operation with two reachable destinations is ambiguous regardless of numeric ordering", async () => {
  await override("destinations() { return ['example-note/v2', 'example-note/v9']; }");
  manifest.produces.push("example-note/v9"); manifest.contracts["example-note/v9"] = "file:definitions.txt";
  manifest.upgrades.push({ from: "example-note/v1", to: "example-note/v9", procedure: "file:upgrade.txt" }); await saveManifest();
  await rejected("Ambiguous upgrade");
});
test("multiple declared paths to the same destination stop before conversion", async () => {
  await override(""); manifest.contracts["example-note/v3"] = "file:definitions.txt";
  manifest.upgrades.push({ from: "example-note/v1", to: "example-note/v3", procedure: "file:upgrade.txt" }, { from: "example-note/v3", to: "example-note/v2", procedure: "file:upgrade.txt" }); await saveManifest();
  await rejected("Ambiguous upgrade");
});
test.each([
  ["lossless: false", "loses data"],
  ["requiresDecision: true", "user decision"],
  ["content: JSON.stringify({...JSON.parse(result.content), document: {heading: 'lost', text: 'lost'}})", "changed meaning or authored content"],
  ["content: JSON.stringify({...JSON.parse(content), schemaVersion: to})", "destination content validation"],
])("unsafe conversion rejects: %s", async (replacement, message) => {
  await override(`convert(procedure, from, to, content) { const result = owner.convert(procedure, from, to, content); return {...result, ${replacement}}; }`);
  await rejected(message);
});
test("source validation rejects malformed content before conversion", async () => {
  await override(""); await writeFile(artifact, JSON.stringify({ ...note, body: 42 }));
  await rejected("source content validation");
});
test("failed mutation preserves the original old-contract bytes, not the converted intermediate", async () => {
  await override(""); await rejected("Rename requires", "rename");
});
test("failed mutation validation rejects all intermediate changes", async () => {
  await override("mutate() { return JSON.stringify({schemaVersion: 'example-note/v2'}); }");
  await rejected("mutation content validation", "rename");
});
test("immutable artifacts require historical readers", async () => {
  await override(""); await writeFile(artifact, JSON.stringify({ ...note, immutable: true }));
  await rejected("historical reader");
});
test("unresolved declarations stop before artifact conversion", async () => {
  await override(""); manifest.upgrades[0].procedure = "file:missing.txt"; await saveManifest();
  await rejected("Cannot resolve file:");
});
test("read-only public operations do not invoke adapters or rewrite artifacts", async () => {
  await override("convert() { throw new Error('must not convert'); }");
  const before = await readFile(artifact);
  expect((await run("validate")).code).toBe(0);
  expect((await run("resolve", ["--contract", "example-note/v1"])).code).toBe(0);
  expect(await readFile(artifact)).toEqual(before);
});
test("bulk reports actual persisted successes and byte-preserving failures as partial with nonzero exit", async () => {
  await override(""); const bad = join(root, "immutable.json");
  await writeFile(bad, JSON.stringify({ ...note, immutable: true })); const before = await readFile(bad);
  const list = join(root, "list.json"); await writeFile(list, JSON.stringify([artifact, bad]));
  const result = await run("bulk-upgrade", ["--artifacts", list]);
  expect(result.code).toBe(1); const report = JSON.parse(result.out);
  expect(report.status).toBe("partial");
  expect(report.results.map((item: { status: string; changed: boolean }) => [item.status, item.changed])).toEqual([["completed", true], ["failed", false]]);
  expect(JSON.parse(await readFile(artifact, "utf8")).document.text).toBe(note.body);
  expect(await readFile(bad)).toEqual(before);
});
test("symlink artifacts cannot redirect persistence", async () => {
  await override(""); const target = join(root, "target.json"); await writeFile(target, JSON.stringify(note));
  await rm(artifact); await symlink(target, artifact); await rejected("regular, non-symlink");
});

test("operation destinations select a lower declared version without numeric preference", async () => {
  await override("");
  manifest.produces.push("example-note/v9"); manifest.contracts["example-note/v9"] = "file:definitions.txt";
  manifest.upgrades.push({ from: "example-note/v1", to: "example-note/v9", procedure: "file:upgrade.txt" }); await saveManifest();
  expect((await upgrade()).code).toBe(0);
  expect(JSON.parse(await readFile(artifact, "utf8"))).toEqual({ schemaVersion: "example-note/v2", document: { heading: note.title, text: note.body }, metadata: note.metadata });
});
test("declared multi-step conversion preserves authored values across different intermediate structure", async () => {
  await writeFile(join(skill, "test-owner.ts"), `
    import owner from './owner.ts';
    function legacy(content) {
      const {schemaVersion, draft, ...authored} = JSON.parse(content);
      return JSON.stringify({...authored, schemaVersion:'example-note/v1', title:draft.title, body:draft.body});
    }
    export default {...owner,
      validate(contract, content) { return contract === 'example-note/v3' ? owner.validate('example-note/v1', legacy(content)) : owner.validate(contract, content); },
      preservation(contract, content) { return contract === 'example-note/v3' ? owner.preservation('example-note/v1', legacy(content)) : owner.preservation(contract, content); },
      convert(procedure, from, to, content) {
        const {schemaVersion, title, body, draft, ...authored} = JSON.parse(content);
        const value = from === 'example-note/v1'
          ? {...authored, schemaVersion:to, draft:{title,body}}
          : {...authored, schemaVersion:to, document:{heading:draft.title,text:draft.body}};
        return {content:JSON.stringify(value), lossless:true, requiresDecision:false};
      }
    };
  `);
  manifest.contracts["example-note/v3"] = "file:definitions.txt";
  manifest.upgrades = [{ from: "example-note/v1", to: "example-note/v3", procedure: "file:upgrade.txt" }, { from: "example-note/v3", to: "example-note/v2", procedure: "file:upgrade.txt" }]; await saveManifest();
  expect((await upgrade()).code).toBe(0);
  expect(JSON.parse(await readFile(artifact, "utf8"))).toEqual({ schemaVersion: "example-note/v2", document: { heading: note.title, text: note.body }, metadata: note.metadata });
});

test.each(["9007199254740993", "1e400", "0.10000000000000001", "-0"])("unsafe authored numeric value %s is rejected without rewriting", async (number) => {
  await override("");
  await writeFile(artifact, `{"schemaVersion":"example-note/v1","title":"Title","body":"Text","metadata":{"count":${number}}}`);
  await rejected("numeric value");
});
test.each(["safe-upgrade", "bulk-upgrade"])("post-commit cleanup failure reports actual persisted bytes through %s", async (operation) => {
  await override("");
  preload = join(root, "fault.ts");
  await writeFile(preload, `
    import {mock} from 'bun:test';
    import * as fs from 'node:fs/promises';
    const original = {...fs};
    mock.module('node:fs/promises', () => ({...original, unlink: async (path) => {
      if (String(path).endsWith('.contract-upgrade.lock')) throw new Error('injected cleanup failure');
      return original.unlink(path);
    }}));
  `);
  const list = join(root, "list.json"); await writeFile(list, JSON.stringify([artifact]));
  const result = operation === "safe-upgrade" ? await upgrade() : await run(operation, ["--artifacts", list]);
  expect(result.code).toBe(1);
  const report = JSON.parse(result.out);
  const item = operation === "safe-upgrade" ? report : report.results[0];
  expect(item.status).toBe("failed");
  expect(item.changed).toBe(true);
  expect(item.cleanup_errors).toEqual(["Cannot remove the artifact upgrade lock."]);
  expect(JSON.parse(await readFile(artifact, "utf8"))).toEqual({ schemaVersion: "example-note/v2", document: { heading: note.title, text: note.body }, metadata: note.metadata });
});

test.each([{ source: "0.10", value: 0.1 }, { source: "1e3", value: 1000 }, { source: "9007199254740992", value: 9007199254740992 }])("exact authored numeric value $source survives conversion", async ({ source, value }) => {
  await override("");
  await writeFile(artifact, `{"schemaVersion":"example-note/v1","title":"Title","body":"Text","metadata":{"count":${source}}}`);
  expect((await upgrade()).code).toBe(0);
  expect(JSON.parse(await readFile(artifact, "utf8"))).toEqual({ schemaVersion: "example-note/v2", document: { heading: "Title", text: "Text" }, metadata: { count: value } });
});
