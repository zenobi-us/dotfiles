// Protect authored YAML and immutable provenance at the shared upgrade boundary.
import { afterEach, expect, test } from "bun:test";
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
event_root: events
artifact_root: artifacts
projection_root: projections
latest_receipt: start-1
state: RUNNING
custom:
  note: "keep these exact words" # Nested comment
  order: [second, first]
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
