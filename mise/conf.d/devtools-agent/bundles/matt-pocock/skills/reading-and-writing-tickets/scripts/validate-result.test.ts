import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("./validate-result.ts", import.meta.url));
const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const result = { operation: "check", backend: "local-markdown", initiatives: [{ id: "release", title: "Release", ref: "tracker/initiatives/release/index.md", children: [{ id: "T-1", ref: "tracker/tickets/T-1.md" }] }], tickets: [], changes: null, validation: { status: "passed", details: [] }, publication: null, rendered: null };

test("result command reads current and historical content without rewriting either input", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tracker-result-")); temporary.push(directory);
  for (const identity of [{ schema: "tracker-result/v1" }, { schemaVersion: "tracker-result/v2" }]) {
    const input = { ...identity, ...result };
    const bytes = JSON.stringify(input, null, 4) + "\n";
    const filename = join(directory, "result.json"); await writeFile(filename, bytes);
    const output = spawnSync(cli, ["--input", filename], { encoding: "utf8" });
    expect(output.status).toBe(0);
    expect(JSON.parse(output.stdout)).toEqual(input);
    expect(await readFile(filename, "utf8")).toBe(bytes);
  }
}, 60_000);

test("result command rejects label-only, malformed membership and ambiguous identities unchanged", async () => {
  const directory = await mkdtemp(join(tmpdir(), "tracker-result-")); temporary.push(directory);
  const current = { schemaVersion: "tracker-result/v2", ...result };
  for (const input of [
    { schemaVersion: "tracker-result/v2" },
    { ...current, initiatives: [{ ...result.initiatives[0], children: ["T-1"] }] },
    { ...current, schema: "tracker-result/v1" },
    { ...current, schemaVersion: "tracker-result/v99" },
    { ...current, tickets: [{ id: "T-1", title: "Task", ref: "ticket", blocked_by: [2] }] },
  ]) {
    const bytes = JSON.stringify(input); const filename = join(directory, "result.json"); await writeFile(filename, bytes);
    const output = spawnSync(cli, ["--input", filename], { encoding: "utf8" });
    expect(output.status).toBe(1);
    expect(output.stdout).toBe("");
    expect(await readFile(filename, "utf8")).toBe(bytes);
  }
}, 60_000);
