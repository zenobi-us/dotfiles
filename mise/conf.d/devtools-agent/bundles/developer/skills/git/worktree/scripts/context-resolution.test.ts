// Preserve retained snapshot hashes while interpreting owner location semantics.
import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readContextResolution } from "./context-resolution";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "worktree-resolution-"));
  roots.push(root);
  return { kind: "workflow", adapter: "files", store: "repository", root, path: join(root, "workflows/TASK-1"), ref: "workflows/TASK-1", publication: "repository" };
}

test("retained snapshot projection matches current v1 without changing bytes, ordering or hash", async () => {
  const retained = await fixture();
  const bytes = JSON.stringify({ resolution: retained, authored: { order: ["second", "first"] } }, null, 2) + "\n";
  const path = join(retained.root, "snapshot.json");
  await writeFile(path, bytes);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const snapshot = JSON.parse(await readFile(path, "utf8"));
  const current = { schemaVersion: "shared-context-resolution/v1", ...retained };
  expect(await readContextResolution(snapshot.resolution)).toEqual(await readContextResolution(current));
  expect(snapshot.resolution).toEqual(retained);
  expect(Object.hasOwn(snapshot.resolution, "schemaVersion")).toBe(false);
  expect(await readFile(path, "utf8")).toBe(bytes);
  expect(createHash("sha256").update(await readFile(path)).digest("hex")).toBe(hash);
});

test.each([
  { schemaVersion: "shared-context-resolution/v99" },
  { schemaVersion: null },
  { schema: "shared-context-resolution/v1" },
  { schema: "shared-context-resolution/v1", schemaVersion: "shared-context-resolution/v1" },
  { kind: "unknown" }, { adapter: "" }, { store: "elsewhere" }, { root: "relative" },
  { path: "/outside/root" }, { ref: "../escape" }, { publication: "push-if-remote" },
])("invalid current or retained resolution is not silently legacy (%#)", async patch => {
  const retained = await fixture();
  const input = { ...retained, ...patch };
  const before = JSON.stringify(input);
  await expect(readContextResolution(input)).rejects.toThrow();
  expect(JSON.stringify(input)).toBe(before);
});

test("shared references and symlink containment use owner location rules", async () => {
  const retained = await fixture();

  const shared = { ...retained, store: "shared" as const, ref: "shared://workflows/TASK-1", publication: "push-if-remote" as const };
  expect(await readContextResolution(shared)).toEqual(shared);
  await expect(readContextResolution({ ...shared, ref: retained.ref })).rejects.toThrow();
  await symlink(tmpdir(), join(retained.root, "escape"));
  await expect(readContextResolution({ ...retained, path: join(retained.root, "escape/outside"), ref: "escape/outside" })).rejects.toThrow();
});
test.each(["kind", "adapter", "store", "root", "path", "ref", "publication"])("both input identities require %s", async key => {
  for (const versioned of [false, true]) {
    const input: Record<string, unknown> = { ...await fixture(), ...(versioned ? { schemaVersion: "shared-context-resolution/v1" } : {}) };
    delete input[key];
    await expect(readContextResolution(input)).rejects.toThrow();
  }
});
