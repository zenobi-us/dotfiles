// Exercise the owning record reader offline and retain byte-preservation evidence.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const [source, output] = process.argv.slice(2);
if (!source || !output) throw new Error("Expected source checkout and output path");
const script = join(source, "mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/ha_ops.ts");
const env = { ...process.env };
delete env.HA_URL;
delete env.HA_TOKEN;
const plan = {
  dry_run: true,
  steps: ["rename-switch-suffix", "create-groups"],
  renames: [{ entity_id: "switch.kitchen", old: "Lights Kitchen Switch", new: "Lights Kitchen", category: "switch-suffix" }],
  group_changes: [{ automation: "automation.sync_kitchen", group_id: "switch.kitchen_group", name: "Kitchen Lights", switches: ["switch.kitchen", "switch.kitchen_2"], action: "planned" }],
  warnings: ["Could not load device registry"],
};
const cases = [
  { name: "historical", value: plan, expected: 0 },
  { name: "current", value: { ...plan, schemaVersion: "homeassistant-cleanup-plan/v2" }, expected: 0 },
  { name: "unknown", value: { ...plan, schemaVersion: "homeassistant-cleanup-plan/v999" }, expected: 2 },
  { name: "stamped-history", value: { ...plan, schemaVersion: "homeassistant-cleanup-plan/v1" }, expected: 2 },
  { name: "mixed", value: { ...plan, schemaVersion: "homeassistant-cleanup-plan/v2", schema: "homeassistant-cleanup-plan/v1" }, expected: 2 },
  { name: "wrong-family", value: { ...plan, schemaVersion: "homeassistant-snapshot/v2" }, expected: 2 },
  { name: "unsafe", value: { ...plan, dry_run: false }, expected: 2 },
  { name: "malformed-rename", value: { ...plan, renames: [{ entity_id: "switch.kitchen", new: "Lights" }] }, expected: 2 },
  { name: "malformed-group", value: { ...plan, group_changes: [{ ...plan.group_changes[0], switches: [4] }] }, expected: 2 },
  { name: "malformed-warning", value: { ...plan, warnings: [false] }, expected: 2 },
];
const dir = mkdtempSync(join(tmpdir(), "ha-fix-0014-smoke-"));
const results = [];
let active: Bun.Subprocess | undefined;
let failure: string | undefined;
const sha = (bytes: string) => createHash("sha256").update(bytes).digest("hex");
try {
  for (const item of cases) {
    const file = join(dir, `${item.name}.json`);
    const before = JSON.stringify(item.value, null, 3) + "\n\n";
    writeFileSync(file, before);
    const argv = [script, "validate-record", file];
    active = Bun.spawn(argv, { cwd: source, env, stdout: "pipe", stderr: "pipe" });
    const child = active;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, 10000);
    let stdout: string, stderr: string, exit: number;
    try {
      [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null) child.kill("SIGKILL");
      await child.exited;
    }
    const after = readFileSync(file, "utf8");
    results.push({ name: item.name, argv, cwd: source, pid: child.pid, exit_code: exit, expected_exit_code: item.expected, stdout, stderr, timed_out: timedOut, before_sha256: sha(before), after_sha256: sha(after), bytes_preserved: before === after, process_stopped: child.exitCode !== null });
    active = undefined;
    if (timedOut || exit !== item.expected || before !== after) throw new Error(`Failed case ${item.name}`);
    if (item.expected === 0) {
      const result = JSON.parse(stdout);
      const expectedContract = `homeassistant-cleanup-plan/v${item.name === "historical" ? 1 : 2}`;
      if (result.contract !== expectedContract || result.valid !== true) throw new Error(`Wrong accepted contract for ${item.name}`);
    }
  }
} catch (error) {
  failure = String(error);
} finally {
  if (active) {
    if (active.exitCode === null) active.kill("SIGKILL");
    await active.exited;
  }
  rmSync(dir, { recursive: true, force: true });
  await Bun.write(output, JSON.stringify({ source, credentials: "HA_URL and HA_TOKEN removed", service: "none; offline reader only", results, fixture_directory_removed: true, owned_children_stopped: results.every((r) => r.process_stopped), failure: failure ?? null }, null, 2) + "\n");
}
if (failure) throw new Error(failure);
console.log(`${results.length} owning CLI cases passed; bytes preserved; all children reaped; fixtures removed`);
