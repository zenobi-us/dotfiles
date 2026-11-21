import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { safeUpgrade, bulkUpgrade } from "../../../../agent-core/skills/skill-contracts/scripts/upgrades.ts";

const skill = fileURLToPath(new URL("../", import.meta.url));
const owner = "file:scripts/record-upgrade.ts";
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))); });
async function fixture(content: string, name = "T-1.md"): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "tracker-owner-"));
  directories.push(directory);
  const filename = join(directory, name);
  await mkdir(join(filename, ".."), { recursive: true });
  await writeFile(filename, content);
  return filename;
}
const ticket = "---\nschema: tracker-ticket/v1 # contract comment\nid: T-1\ntitle: Task\nwork_status: unclaimed # owner comment\nblocked_by: [T-2]\nparent: release\nsequence: 2\nunknown: {integer: 9007199254740993, decimal: 1.0000000000000001}\n# authored metadata\n---\n## Specification\n\n<!-- authored comment -->\nKeep [child](T-3.md).\n\n## Comments\n\nKeep this conversation.\n";

test("authorized mutation preserves authored bytes, numeric lexemes and dependency identity", async () => {
  const artifact = await fixture(ticket);
  const result = await safeUpgrade({ skill, owner, artifact, operation: "update", request: { fields: { work_status: "claimed" } } });
  expect(result).toMatchObject({ status: "completed", changed: true, from: "tracker-ticket/v1", to: "tracker-ticket/v2" });
  const expected = ticket.replace("schema: tracker-ticket/v1 # contract comment", "schemaVersion: tracker-ticket/v2\n# contract comment").replace("work_status: unclaimed # owner comment", 'work_status: "claimed" # owner comment');
  expect(await readFile(artifact, "utf8")).toBe(expected);
  expect(await safeUpgrade({ skill, owner, artifact, operation: "upgrade" })).toMatchObject({ changed: false });
  expect(await readFile(artifact, "utf8")).toBe(expected);
}, 60_000);

test("bulk conversion commits independent successes and preserves rejected immutable bytes", async () => {
  const good = await fixture(ticket);
  const immutable = await fixture(ticket, "events/T-1.md");
  const result = await bulkUpgrade({ skill, owner }, [good, immutable]);
  expect(result.status).toBe("partial");
  expect(result.results[0]).toMatchObject({ status: "completed", changed: true });
  expect(result.results[1]).toMatchObject({ status: "failed", changed: false });
  expect(await readFile(immutable, "utf8")).toBe(ticket);
  expect(await readFile(good, "utf8")).toContain("schemaVersion: tracker-ticket/v2");
}, 60_000);

test("unknown, ambiguous and structurally unsafe writes preserve original bytes", async () => {
  for (const content of [
    ticket.replace("tracker-ticket/v1", "tracker-ticket/v99"),
    ticket.replace("id: T-1", "schemaVersion: tracker-ticket/v2\nid: T-1"),
    ticket.replace("blocked_by: [T-2]", "blocked_by: unknown"),
    ticket.replace("id: T-1", "id: another"),
    ticket.replace("schema: tracker-ticket/v1 # contract comment\n", "").replace("work_status: unclaimed # owner comment\n", ""),
  ]) {
    const artifact = await fixture(content);
    await expect(safeUpgrade({ skill, owner, artifact, operation: "upgrade" })).rejects.toThrow();
    expect(await readFile(artifact, "utf8")).toBe(content);
  }
  const artifact = await fixture(ticket);
  await expect(safeUpgrade({ skill, owner, artifact, operation: "update", request: { fields: { blocked_by: [] } } })).rejects.toThrow();
  expect(await readFile(artifact, "utf8")).toBe(ticket);
}, 120_000);

test("unversioned initiative conversion refuses a changed membership interpretation", async () => {
  const prefix = "---\nid: release\ntitle: Release\ntype: Initiative\n---\n";
  const unsafe = prefix + "## Specification\n\n[Child](../../tickets/T-1.md)\n\n## Tickets\n\n[Other](../../tickets/T-2.md)\n";
  const rejected = await fixture(unsafe, "release/index.md");
  await expect(safeUpgrade({ skill, owner, artifact: rejected, operation: "upgrade" })).rejects.toThrow("meaning");
  expect(await readFile(rejected, "utf8")).toBe(unsafe);
  const safe = prefix + "## Tickets\n\n[Child](../../tickets/T-1.md)\n";
  const accepted = await fixture(safe, "release/index.md");
  await safeUpgrade({ skill, owner, artifact: accepted, operation: "upgrade" });
  expect(await readFile(accepted, "utf8")).toBe(safe.replace("---\n", "---\nschemaVersion: tracker-initiative/v2\n"));
}, 60_000);
