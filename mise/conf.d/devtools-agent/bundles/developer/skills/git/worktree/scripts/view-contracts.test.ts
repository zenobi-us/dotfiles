// Protect authored YAML and immutable provenance at the shared upgrade boundary.
import { afterEach, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { UpgradeRequest, UpgradeResult } from "../../../../../agent-core/skills/skill-contracts/scripts/upgrades";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const skill = fileURLToPath(new URL("..", import.meta.url));
const source = `# Authored operator note
schema: worktree-workflow/v2 # Identity note
workflow_id: TASK-1
ticket_ref: tracker/tickets/TASK-1.md
initiative: null
event_root: events
artifact_root: artifacts
projection_root: projections
latest_receipt: start-1
state: RUNNING
custom:
  note: "keep these exact words" # Nested comment
  order: [second, first]
`;
const latest = `# Retained status note
schema: worktree-latest-status/v1
workflow_id: TASK-1
ticket: tracker/tickets/TASK-1.md
state: IMPLEMENTED
latest_receipt: implementation-2
latest_source_commit: ${"a".repeat(40)}
latest_source_tree: ${"b".repeat(40)}
latest_review_verdict: null
open_findings: []
custom: keep-status
`;
async function fixture(content = source, location = "manifest.yaml") {
  const root = await mkdtemp(join(tmpdir(), "worktree-view-contract-"));
  roots.push(root);
  const artifact = join(root, "TASK-1", location);
  await mkdir(dirname(artifact), { recursive: true });
  await writeFile(artifact, content);
  return { artifact, skill, owner: "file:scripts/view-contracts.ts" };
}

async function safeUpgrade(request: UpgradeRequest): Promise<UpgradeResult> {
  const router = fileURLToPath(new URL("../../../../../agent-core/skills/skill-contracts/scripts/router.ts", import.meta.url));
  const input = request.artifact + ".request.json";
  await writeFile(input, JSON.stringify(request.request ?? {}));
  const child = Bun.spawn([process.execPath, "--install=fallback", router, "safe-upgrade", "--skill", request.skill, "--owner", request.owner, "--artifact", request.artifact, "--operation", request.operation, "--request", input], { stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  if (code !== 0) throw new Error(stderr);
  return JSON.parse(stdout);
}

test("an authorized view mutation upgrades identity and preserves comments, unknown data and order", async () => {
  const request = await fixture();
  const result = await safeUpgrade({ ...request, operation: "update", request: { state: "IMPLEMENTED", latest_receipt: "implementation-2" } });
  expect(result.status).toBe("completed");
  const content = await readFile(request.artifact, "utf8");
  expect(Bun.YAML.parse(content)).toMatchObject({ schemaVersion: "worktree-workflow/v3", state: "IMPLEMENTED", latest_receipt: "implementation-2", custom: { note: "keep these exact words", order: ["second", "first"] } });
  expect(content).toContain("# Authored operator note");
  expect(content).toContain("# Identity note");
  expect(content).toContain("# Nested comment");
  const current = await safeUpgrade({ ...request, operation: "upgrade" });
  expect(current.changed).toBe(false);
  expect(await readFile(request.artifact, "utf8")).toBe(content);
});

test.each([
  [source, "manifest.yaml", { workflow_id: "OTHER" }],
  [source, "events/manifest.yaml", { state: "IMPLEMENTED" }],
  [source.replace("worktree-workflow/v2", "worktree-workflow/v99"), "manifest.yaml", { state: "IMPLEMENTED" }],
  [source + "schemaVersion: worktree-workflow/v3\n", "manifest.yaml", { state: "IMPLEMENTED" }],
  [source.replace("schema: worktree-workflow/v2", "unversioned: true"), "manifest.yaml", { state: "IMPLEMENTED" }],
  [source + "number: 9007199254740993\n", "manifest.yaml", { state: "IMPLEMENTED" }],
  [source + "authored: &note original\ncopy: *note\n", "manifest.yaml", { state: "IMPLEMENTED" }],
  [source, "manifest.yaml", { latest_receipt: null }],
])("rejected view updates preserve original bytes (%#)", async (content, location, update) => {
  const request = await fixture(content as string, location as string);
  const before = await readFile(request.artifact);
  await expect(safeUpgrade({ ...request, operation: "update", request: update })).rejects.toThrow();
  expect(await readFile(request.artifact)).toEqual(before);
});

test.each([
  [source, "projections/latest-status.yaml"],
  [source.replace("schema: worktree-workflow/v2", "schemaVersion: worktree-workflow/v3"), "projections/latest-status.yaml"],
  [latest, "manifest.yaml"],
  [latest.replace("schema: worktree-latest-status/v1", "schemaVersion: worktree-latest-status/v2"), "manifest.yaml"],
])("owning update and public bulk upgrade reject swapped view families without writes (%#)", async (content, location) => {
  const root = await mkdtemp(join(tmpdir(), "worktree-view-cli-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", ["-C", root, "remote", "add", "origin", "https://github.com/view-tests/" + crypto.randomUUID() + ".git"]);
  const artifact = join(root, "workflows/TASK-1", location!);
  await mkdir(dirname(artifact), { recursive: true });
  await writeFile(artifact, content!);
  const request = join(root, "request.json");
  await writeFile(request, JSON.stringify({ state: "FIXED" }));
  const before = await readFile(artifact);
  const writer = fileURLToPath(new URL("./write-view.ts", import.meta.url));
  const kind = location === "manifest.yaml" ? "manifest" : "latest-status";
  const update = await command(writer, ["--repository", root, "--id", "TASK-1", "--kind", kind, "--input", request], root);
  expect(update.code).not.toBe(0);
  expect(await readFile(artifact)).toEqual(before);
  const list = join(root, "artifacts.json");
  await writeFile(list, JSON.stringify([artifact]));
  const router = fileURLToPath(new URL("../../../../../agent-core/skills/skill-contracts/scripts/router.ts", import.meta.url));
  const bulk = await command(router, ["bulk-upgrade", "--skill", skill, "--owner", "file:scripts/view-contracts.ts", "--artifacts", list], root);
  expect(bulk.code).not.toBe(0);
  expect(JSON.parse(bulk.stdout)).toMatchObject({ status: "failed", results: [{ status: "failed", changed: false }] });
  expect(await readFile(artifact)).toEqual(before);
});

test("latest-status upgrades preserve authored data at the correct path", async () => {
  const request = await fixture(latest, "projections/latest-status.yaml");
  const result = await safeUpgrade({ ...request, operation: "update", request: { state: "FIXED" } });
  expect(result.status).toBe("completed");
  const content = await readFile(request.artifact, "utf8");
  expect(Bun.YAML.parse(content)).toMatchObject({ schemaVersion: "worktree-latest-status/v2", state: "FIXED", custom: "keep-status" });
  expect(content).toContain("# Retained status note");
  expect((await safeUpgrade({ ...request, operation: "upgrade" })).changed).toBe(false);
  expect(await readFile(request.artifact, "utf8")).toBe(content);
});

test.each([null, "example-initiative"])("owning creation preserves explicit initiative %j", async initiative => {
  const root = await mkdtemp(join(tmpdir(), "worktree-initiative-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", ["-C", root, "remote", "add", "origin", "https://github.com/view-tests/" + crypto.randomUUID() + ".git"]);
  const request = join(root, "request.json");
  const manifest: Record<string, unknown> = { ...Bun.YAML.parse(source) as Record<string, unknown>, schemaVersion: "worktree-workflow/v3", initiative };
  delete manifest.schema;
  await writeFile(request, JSON.stringify(manifest));
  const result = await command(fileURLToPath(new URL("./write-view.ts", import.meta.url)), ["--repository", root, "--id", "TASK-1", "--kind", "manifest", "--input", request], root);
  expect(result.code).toBe(0);
  expect((Bun.YAML.parse(await readFile(join(root, "workflows/TASK-1/manifest.yaml"), "utf8")) as Record<string, unknown>).initiative).toBe(initiative);
}, 120_000);

test.each([undefined, "", " ", 1, false, [], {}, "bad/id", " padded"].map(initiative => [initiative]))("owning creation rejects invalid initiative %j without a manifest", async initiative => {
  const root = await mkdtemp(join(tmpdir(), "worktree-initiative-reject-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", ["-C", root, "remote", "add", "origin", "https://github.com/view-tests/" + crypto.randomUUID() + ".git"]);
  const request = join(root, "request.json");
  const manifest: Record<string, unknown> = { ...Bun.YAML.parse(source) as Record<string, unknown>, schemaVersion: "worktree-workflow/v3", initiative };
  delete manifest.schema;
  await writeFile(request, JSON.stringify(manifest));
  const result = await command(fileURLToPath(new URL("./write-view.ts", import.meta.url)), ["--repository", root, "--id", "TASK-1", "--kind", "manifest", "--input", request], root);
  expect(result.code).not.toBe(0);
  expect(await Bun.file(join(root, "workflows/TASK-1/manifest.yaml")).exists()).toBe(false);
}, 120_000);

test.each([null, "example-initiative"])("historical upgrade preserves initiative %j", async initiative => {
  const request = await fixture(source.replace("initiative: null", "initiative: " + JSON.stringify(initiative)));
  await safeUpgrade({ ...request, operation: "upgrade" });
  expect((Bun.YAML.parse(await readFile(request.artifact, "utf8")) as Record<string, unknown>).initiative).toBe(initiative);
}, 120_000);

test.each(["", "initiative: invalid/id\n", "initiative: false\n"])("historical ambiguous initiative needs a decision and preserves bytes (%#)", async field => {
  const request = await fixture(source.replace("initiative: null\n", field));
  const before = await readFile(request.artifact);
  await expect(safeUpgrade({ ...request, operation: "upgrade" })).rejects.toThrow();
  expect(await readFile(request.artifact)).toEqual(before);
}, 120_000);

async function command(script: string, args: string[], cwd: string) {
  const child = Bun.spawn([process.execPath, "--install=fallback", script, ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  return { code, stdout, stderr };
}
