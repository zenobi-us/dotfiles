// Saved cleanup plans must remain readable evidence, not rewritten apply inputs.
import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = new URL("../scripts/ha_ops.ts", import.meta.url).pathname;
const env = { ...process.env };
delete env.HA_URL;
delete env.HA_TOKEN;
const historical = {
  dry_run: true,
  steps: ["rename-switch-suffix", "create-groups"],
  renames: [{ entity_id: "switch.kitchen", old: "Lights Kitchen Switch", new: "Lights Kitchen", category: "switch-suffix" }],
  group_changes: [{ automation: "automation.sync_kitchen", group_id: "switch.kitchen_group", name: "Kitchen Lights", switches: ["switch.kitchen", "switch.kitchen_2"], action: "planned" }],
  warnings: ["Could not load device registry"],
};

async function validate(file: string) {
  const p = Bun.spawn([script, "validate-record", file], { env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exit] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  return { stdout, stderr, exit };
}

test("historical and current cleanup evidence validate offline without stamping or rewriting", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ha-cleanup-plan-"));
  try {
    for (const version of [1, 2]) {
      const file = join(dir, `plan-v${version}.json`);
      const bytes = JSON.stringify(version === 1 ? historical : { ...historical, schemaVersion: "homeassistant-cleanup-plan/v2" }, null, 3) + "\n\n";
      writeFileSync(file, bytes);
      const result = await validate(file);
      expect(result.exit).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({ contract: `homeassistant-cleanup-plan/v${version}`, valid: true });
      expect(readFileSync(file, "utf8")).toBe(bytes);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("cleanup plan readers reject unknown, mixed, wrong-family and malformed content without writes", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ha-cleanup-rejection-"));
  try {
    for (const value of [
      { ...historical, schemaVersion: "homeassistant-cleanup-plan/v999" },
      { ...historical, schemaVersion: "homeassistant-cleanup-plan/v1" },
      { ...historical, schemaVersion: "homeassistant-cleanup-plan/v2", schema: "homeassistant-cleanup-plan/v1" },
      { ...historical, schemaVersion: "homeassistant-snapshot/v2" },
      { ...historical, dry_run: false },
      { ...historical, renames: [{ entity_id: "switch.kitchen", new: "Lights" }] },
      { ...historical, group_changes: [{ ...historical.group_changes[0], switches: [4] }] },
      { ...historical, warnings: [false] },
    ]) {
      const file = join(dir, "plan.json");
      const bytes = JSON.stringify(value, null, 3);
      writeFileSync(file, bytes);
      const result = await validate(file);
      expect(result.exit).toBe(2);
      expect(readFileSync(file, "utf8")).toBe(bytes);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("nonempty JSON cleanup plans preserve proposed changes and never mutate the fixture", async () => {
  const requests: string[] = [];
  const mutations: string[] = [];
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(req, server) {
      const path = new URL(req.url).pathname;
      if (path === "/api/websocket" && server.upgrade(req)) return;
      requests.push(`${req.method} ${path}`);
      if (req.method !== "GET") mutations.push(`${req.method} ${path}`);
      return Response.json([{ entity_id: "switch.kitchen", attributes: { friendly_name: "Lights Kitchen Switch" } }]);
    },
    websocket: {
      open(ws) { ws.send(JSON.stringify({ type: "auth_required" })); },
      message(ws, raw) {
        const msg = JSON.parse(String(raw));
        if (msg.type === "auth") {
          ws.send(JSON.stringify({ type: "auth_ok" }));
          return;
        }
        requests.push(msg.type);
        if (!["config/area_registry/list", "config/device_registry/list", "config/entity_registry/list"].includes(msg.type)) mutations.push(msg.type);
        ws.send(JSON.stringify({ id: msg.id, type: "result", success: true, result: [] }));
      },
    },
  });
  try {
    const fixtureEnv = { ...env, HA_URL: `http://127.0.0.1:${server.port}`, HA_TOKEN: "fixture-only" };
    const p = Bun.spawn([script, "cleanup", "--json", "--steps", "rename-switch-suffix"], { env: fixtureEnv, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exit] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
    expect(exit).toBe(0);
    expect(JSON.parse(stdout)).toEqual({
      schemaVersion: "homeassistant-cleanup-plan/v2",
      dry_run: true,
      steps: ["rename-switch-suffix"],
      renames: [{ entity_id: "switch.kitchen", old: "Lights Kitchen Switch", new: "Lights Kitchen", category: "switch-suffix" }],
      group_changes: [],
      warnings: [],
    });
    expect(mutations).toEqual([]);
    expect(requests).toContain("GET /api/states");
    const count = requests.length;
    const rejected = Bun.spawn([script, "cleanup", "--apply", "--json"], { env: fixtureEnv, stdout: "pipe", stderr: "pipe" });
    await Promise.all([new Response(rejected.stdout).text(), new Response(rejected.stderr).text()]);
    expect(await rejected.exited).toBe(2);
    expect(requests.length).toBe(count);
  } finally { await server.stop(true); }
}, 20000);
