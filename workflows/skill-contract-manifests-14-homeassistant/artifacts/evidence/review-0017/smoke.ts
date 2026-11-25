// Independent owning-CLI review evidence. Only loopback fixture credentials are supplied.
import { strict as assert } from 'node:assert';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const source = '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-14-homeassistant';
const script = source + '/mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/scripts/ha_ops.ts';
const evidence = import.meta.dir;
const workflow = join(evidence, '../../..');
const temporary = mkdtempSync(join(tmpdir(), 'ha-review-0017-'));
const requests: unknown[] = [], mutations: unknown[] = [], runs: unknown[] = [];
const baseline = { entity_id: 'switch.kitchen', unique_id: 'fixture-kitchen', name: 'Kitchen Original', area_id: 'kitchen', disabled_by: null, hidden_by: null, icon: 'mdi:light', external_data: { preserved: true } };
let current = structuredClone(baseline);
let failDevices = false;
const automation = { use_blueprint: { path: 'fixture/sync_switch.yaml', input: { switches: ['switch.kitchen', 'switch.kitchen_2'] } } };
const states = [{ entity_id: 'switch.kitchen', state: 'off', attributes: { friendly_name: 'Lights Kitchen Switch' } }, { entity_id: 'automation.sync_kitchen', state: 'on', attributes: { friendly_name: 'Sync Kitchen Light Switches', id: 'fixture-sync' } }];
const server = Bun.serve({ hostname: '127.0.0.1', port: 0,
  fetch(req, server) {
    const path = new URL(req.url).pathname;
    if (path === '/api/websocket' && server.upgrade(req)) return;
    requests.push({ method: req.method, path });
    if (req.method !== 'GET') mutations.push({ method: req.method, path });
    if (path === '/api/states') return Response.json(states);
    if (path === '/api/config') return Response.json({ version: 'fixture', location_name: 'Review fixture', time_zone: 'UTC' });
    if (path === '/api/config/automation/config/fixture-sync') return Response.json(automation);
    if (path === '/api/lovelace/dashboards') return Response.json([]);
    return new Response('Not found', { status: 404 });
  }, websocket: {
    open(ws) { ws.send(JSON.stringify({ type: 'auth_required' })); },
    message(ws, raw) {
      const msg = JSON.parse(String(raw));
      if (msg.type === 'auth') { assert.equal(msg.access_token, 'review-fixture-only'); ws.send(JSON.stringify({ type: 'auth_ok' })); return; }
      requests.push(msg);
      if (msg.type === 'config/device_registry/list' && failDevices) { ws.send(JSON.stringify({ id: msg.id, type: 'result', success: false, error: { code: 'fixture', message: 'Controlled device warning' } })); return; }
      let result: unknown;
      if (msg.type === 'config/area_registry/list') result = [{ area_id: 'kitchen', name: 'Kitchen' }];
      else if (msg.type === 'config/device_registry/list') result = [{ id: 'fixture-device', area_id: 'kitchen', external_data: true }];
      else if (msg.type === 'config/entity_registry/list') result = [current];
      else if (msg.type === 'config/entity_registry/update') { mutations.push(msg); assert.equal(msg.entity_id, current.entity_id); if (msg.new_entity_id) current.entity_id = msg.new_entity_id; for (const key of ['name', 'area_id', 'disabled_by', 'hidden_by', 'icon']) if (Object.hasOwn(msg, key)) current[key] = msg[key]; result = current; }
      else throw new Error('Unexpected fixture request: ' + msg.type);
      ws.send(JSON.stringify({ id: msg.id, type: 'result', success: true, result }));
    }
  }
});
const clean = { ...process.env }; delete clean.HA_URL; delete clean.HA_TOKEN;
const children = new Set<Bun.Subprocess>();
const env = { ...clean, HA_URL: `http://127.0.0.1:${server.port}`, HA_TOKEN: 'review-fixture-only', BUN_OPTIONS: '--install=fallback' };
async function run(args: string[], expected = 0, input?: string, offline = false) {
  const isolated = { ...env }; if (offline) { delete isolated.HA_URL; delete isolated.HA_TOKEN; }
  const beforeRequests = requests.length, beforeMutations = mutations.length;
  const p = Bun.spawn([script, ...args], { cwd: source, env: isolated, stdin: input === undefined ? 'ignore' : 'pipe', stdout: 'pipe', stderr: 'pipe' });
  children.add(p);
  const deadline = setTimeout(() => p.kill('SIGKILL'), 15000);
  if (input !== undefined) { p.stdin.write(input); p.stdin.end(); }
  const [stdout, stderr, exit_code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  clearTimeout(deadline); children.delete(p);
  runs.push({ argv: [script, ...args], cwd: source, offline, exit_code, stdout, stderr, request_count: requests.length - beforeRequests, mutation_count: mutations.length - beforeMutations });
  assert.equal(exit_code, expected, stderr); return stdout;
}
const bytes = (file: string) => readFileSync(file, 'utf8');
let passed = false;
try {
  failDevices = true;
  const planText = await run(['cleanup', '--json', '--steps', 'rename-switch-suffix,create-groups']);
  const plan = JSON.parse(planText);
  assert.equal(plan.warnings.length, 1);
  assert.match(plan.warnings[0], /Could not load device registry:.*Controlled device warning/);
  assert.deepEqual({ ...plan, warnings: [] }, { schemaVersion: 'homeassistant-cleanup-plan/v2', dry_run: true, steps: ['rename-switch-suffix', 'create-groups'], renames: [{ entity_id: 'switch.kitchen', old: 'Lights Kitchen Switch', new: 'Lights Kitchen', category: 'switch-suffix' }], group_changes: [{ automation: 'automation.sync_kitchen', group_id: 'switch.kitchen_group', name: 'Kitchen Lights', switches: ['switch.kitchen', 'switch.kitchen_2'], action: 'planned' }], warnings: [] });
  assert.equal(mutations.length, 0);
  writeFileSync(join(evidence, 'cleanup-plan.json'), planText, { flag: 'wx' });
  await run(['validate-record', join(evidence, 'cleanup-plan.json')], 0, undefined, true);
  const historicalPlan = join(workflow, 'artifacts/evidence/review-0005/cleanup-plan.json');
  const historicalBytes = bytes(historicalPlan);
  assert.equal(JSON.parse(await run(['validate-record', historicalPlan], 0, undefined, true)).contract, 'homeassistant-cleanup-plan/v1');
  assert.equal(bytes(historicalPlan), historicalBytes);
  const before = requests.length;
  await run(['cleanup', '--apply', '--json'], 2);
  assert.equal(requests.length, before);
  await run(['rollback', join(evidence, 'cleanup-plan.json'), '--yes'], 2);
  await run(['find-references', '--map-json', join(evidence, 'cleanup-plan.json')], 2);
  assert.equal(requests.length, before);
  failDevices = false;
  const snapshotFile = join(evidence, 'snapshot.json');
  await run(['snapshot', '--out', snapshotFile, '--include-states']);
  const snapshotBytes = bytes(snapshotFile), snapshot = JSON.parse(snapshotBytes);
  assert.equal(snapshot.schemaVersion, 'homeassistant-snapshot/v2');
  assert.deepEqual(snapshot.registries.entities, [baseline]);
  assert.deepEqual(snapshot.configs.automations['automation.sync_kitchen'].config, automation);
  assert.deepEqual(snapshot.states, states);
  await run(['validate-record', snapshotFile], 0, undefined, true);
  const historicalSnapshot = structuredClone(snapshot); delete historicalSnapshot.schemaVersion;
  const historicalFile = join(evidence, 'historical-snapshot.json');
  writeFileSync(historicalFile, JSON.stringify(historicalSnapshot, null, 3) + '\n\n', { flag: 'wx' });
  const historicalSnapshotBytes = bytes(historicalFile);
  await run(['validate-record', historicalFile], 0, undefined, true);
  current = { ...baseline, entity_id: 'switch.renamed', name: 'Changed', area_id: 'elsewhere', icon: 'mdi:changed' };
  await run(['rollback', snapshotFile, '--dry-run']);
  await run(['rollback', historicalFile, '--dry-run']);
  await run(['rollback', snapshotFile], 0, 'n\n');
  assert.equal(mutations.length, 0);
  await run(['rollback', snapshotFile, '--yes', '--log', join(temporary, 'rollback.md')]);
  assert.deepEqual(current, baseline);
  assert.equal(bytes(snapshotFile), snapshotBytes);
  assert.equal(bytes(historicalFile), historicalSnapshotBytes);
  const mutationCount = mutations.length;
  for (const identity of [{ schemaVersion: 'homeassistant-snapshot/v999' }, { schemaVersion: 'homeassistant-snapshot/v2', schema: 'homeassistant-snapshot/v1' }]) {
    const file = join(evidence, Object.hasOwn(identity, 'schema') ? 'rejected-mixed.json' : 'rejected-unknown.json');
    const text = JSON.stringify({ ...snapshot, ...identity }, null, 3);
    writeFileSync(file, text, { flag: 'wx' }); const count = requests.length;
    await run(['rollback', file, '--yes'], 2); assert.equal(bytes(file), text); assert.equal(requests.length, count);
  }
  await run(['snapshot', '--out', snapshotFile], 1);
  assert.equal(bytes(snapshotFile), snapshotBytes);
  assert.equal(mutations.length, mutationCount);
  const mapFile = join(evidence, 'rename-map.json');
  writeFileSync(mapFile, JSON.stringify({ schemaVersion: 'homeassistant-rename-map/v2', mappings: { 'switch.kitchen': 'switch.new' } }), { flag: 'wx' });
  const reportFile = join(evidence, 'reference-report.json');
  await run(['find-references', '--map-json', mapFile, '--no-live', '--no-backup', '--out', join(temporary, 'refs.md'), '--json-out', reportFile], 0, undefined, true);
  const report = JSON.parse(bytes(reportFile));
  assert.equal(report.schemaVersion, 'homeassistant-reference-report/v2'); assert.deepEqual(report.meta.needles, ['switch.kitchen']);
  await run(['validate-record', reportFile], 0, undefined, true);
  passed = true;
} finally {
  for (const p of children) if (p.exitCode === null) p.kill('SIGKILL');
  await Promise.all([...children].map(p => p.exited));
  await server.stop(true);
  rmSync(temporary, { recursive: true, force: true });
  writeFileSync(join(evidence, 'cli-smoke.json'), JSON.stringify({ passed, runs, requests, mutations, baseline, restored: current, service_stopped: true }, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ passed, commands: runs.length, mutations: mutations.length, service_stopped: true }));
