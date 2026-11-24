import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = new URL("../scripts/ha_ops.ts", import.meta.url).pathname;
const isolatedEnv = { ...process.env, HA_URL: "http://127.0.0.1:1", HA_TOKEN: "fixture-secret-do-not-print" };

test("doctor reports credential presence without exposing credentials", async () => {
  const p = Bun.spawn([script, "doctor"], { stdout: "pipe", env: isolatedEnv });
  const output = await new Response(p.stdout).text();
  expect(JSON.parse(output).HA_TOKEN).toBe(true);
  expect(output).not.toContain(isolatedEnv.HA_TOKEN);
  expect(await p.exited).toBe(0);
});

test("rollback rejects unknown and mixed identities before remote access without rewriting evidence", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ha-record-rejection-"));
  try {
    for (const identity of [
      { schemaVersion: "homeassistant-snapshot/v999" },
      { schemaVersion: "homeassistant-snapshot/v2", schema: "homeassistant-snapshot/v1" },
    ]) {
      const file = join(dir, "snapshot.json");
      const bytes = JSON.stringify({ ...identity, registries: { entities: [{ entity_id: "light.old" }] } }, null, 3);
      writeFileSync(file, bytes);
      const p = Bun.spawn([script, "rollback", file, "--yes"], { stdout: "pipe", stderr: "pipe", env: isolatedEnv });
      const stderr = await new Response(p.stderr).text();
      expect(await p.exited).toBe(2);
      expect(stderr).toContain("Failed to load snapshot: Unsupported");
      expect(stderr).not.toContain("connect");
      expect(readFileSync(file, "utf8")).toBe(bytes);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
