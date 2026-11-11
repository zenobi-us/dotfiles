// Public CLI proof for SPEC-02. Uses only harmless fixtures and private displays.
import { mkdtemp, mkdir, readFile, writeFile, stat, readdir, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { CaseRecord } from '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts';
const source = '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui';
const cli = join(source, 'mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts');
const retained = '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-02-tui/artifacts/evidence/fix-0023-smoke';
const root = await mkdtemp('/tmp/ce-fix-0023-');
const repository = join(root, 'repository');
const commands: object[] = [];
async function run(args: string[], expected = 0) {
  const p = Bun.spawn(args, { cwd: root, env: process.env, stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  commands.push({ args, code, stdout: args[1] === 'report' ? '[Stored separately as HTML]' : stdout, stderr });
  if (code !== expected) throw new Error(JSON.stringify(commands.at(-1)));
  return stdout;
}
await mkdir(repository);
await run(['git', 'init', '--quiet', repository]);
await run(['git', '-C', repository, 'remote', 'add', 'origin', 'https://example.invalid/owned/fix-0023.git']);
await writeFile(join(repository, '.context-routes.toml'), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
await run([cli, 'doctor', '--driver', 'tui', '--json']);
const scenarios = [{ id: 'transition', prompt: '', action: 'transition' }, ...['API token:', 'API-key:', 'PIN:', 'OTP:'].flatMap((prompt, index) => ['expect', 'fill', 'press'].map(action => ({ id: `credential-${index}-${action}`, prompt, action })))];
const results: object[] = [];
for (const { id, prompt, action } of scenarios) {
  const fixture = join(root, id + '.ts');
  const input = join(root, id + '-input');
  const identity = join(root, id + '-identity.json');
  await writeFile(fixture, `import { appendFileSync, writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(identity)}, JSON.stringify({ runtime: process.env.XDG_RUNTIME_DIR, pid: process.pid, server: process.ppid }));
process.stdin.setRawMode(true);
const screen = (title: string) => process.stdout.write('\\x1b[?25l\\x1b[2J\\x1b[H\\x1b[38;2;230;225;242m' + title + '\\r\\nSelected item\\r\\n\\x1b[48;2;201;166;255m' + ' '.repeat(30) + '\\x1b[0m\\r\\n' + ${JSON.stringify(prompt)} + '\\r\\n');
screen('Ready screen');
process.stdin.on('data', data => { appendFileSync(${JSON.stringify(input)}, data); ${action === 'transition' ? "screen('Loading screen'); setTimeout(() => screen('Details screen'), 1500);" : ''} });
`);
  const directory = join(root, id + '-working');
  await run([cli, 'init', directory, '--repository', repository, '--workflow', 'native', '--run', id, '--driver', 'tui', '--json']);
  const command = [process.execPath, fixture];
  const image = { width: 1280, height: 720, pixels: [{ x: 10, y: 55, rgb: [201, 166, 255] }], lines: [{ text: 'Ready screen', top: 11 }, { text: 'Selected item', top: 31 }] };
  const steps: object[] = action === 'fill' ? [{ do: 'fill', says: 'Try approved harmless input.', locator: 'screen', screen: prompt, text: 'fixture-probe' }] : action === 'press' ? [{ do: 'press', says: 'Try approved Enter.', key: 'RET', screen: prompt }] : [{ do: 'expect', says: 'Inspect ready.', locator: 'screen', text: 'Ready screen', shot: 'ready', image }];
  if (action === 'transition') steps.push({ do: 'press', says: 'Open details.', key: 'n', screen: 'Ready screen' }, { do: 'expect', says: 'Inspect details.', locator: 'screen', text: 'Details screen', shot: 'details', image: { ...image, lines: [{ text: 'Details screen', top: 11 }, { text: 'Selected item', top: 31 }] } });
  const plan = { schema: 'collect-evidence/v1', kind: 'plan', workId: 'native', driver: 'tui', base: 'terminal://private', terminal: { command, cwd: root, columns: 80, rows: 24, font: 'monospace:size=12', lineHeight: 20 }, approval: { origins: [], confirmations: action === 'transition' ? ['case.2'] : ['fill', 'press'].includes(action) ? ['case.1'] : [], terminal: { command, cwd: root } }, tests: [{ id: 'case', claim: 'Credential safety and delayed native transition', pass: 'Expected outcome', fail: 'Unexpected outcome', steps }] };
  await writeFile(join(directory, 'plan.ts'), 'export const plan = ' + JSON.stringify(plan) + ';\n');
  for (const op of ['render', 'compile', 'run']) await run([cli, op, directory, '--json'], op === 'run' && action !== 'transition' ? 3 : 0);
  const sealed = join(repository, 'workflows/native/artifacts/evidence', id);
  await run([cli, 'validate', sealed, '--json']);
  const verdicts = JSON.parse(await run([cli, 'verdicts', sealed, '--json']));
  if (verdicts.verdicts[0].verdict !== (action === 'transition' ? 'PASS' : 'BLOCKED')) throw new Error('Wrong verdict');
  await writeFile(join(root, id + '-report.html'), await run([cli, 'report', sealed]));
  const result: CaseRecord = JSON.parse(await readFile(join(sealed, 'cases/case/case.json'), 'utf8'));
  const frames: object[] = [];
  for (const asset of result.assets) {
    const path = join(sealed, asset.path);
    const hash = createHash('sha256').update(await readFile(path)).digest('hex');
    if (hash !== asset.sha256) throw new Error('Hash mismatch');
    frames.push({ path, hash, width: asset.width, height: asset.height, terminal: asset.terminal });
  }
  const received = await readFile(input, 'utf8').catch(() => null);
  if (received !== (action === 'transition' ? 'n' : null)) throw new Error('Unexpected input');
  if (action !== 'transition' && !result.errors.some(error => error.message.includes('credential prompt'))) throw new Error('Wrong safety stop');
  const owned = JSON.parse(await readFile(identity, 'utf8'));
  if (await stat(owned.runtime).then(() => true, () => false)) throw new Error('Runtime remains');
  for (const pid of [owned.pid, owned.server, ...result.assets.flatMap(asset => [asset.terminal!.cagePid, asset.terminal!.footPid])]) {
    const alive = await readFile(`/proc/${pid}/stat`, 'utf8').then(text => !text.slice(text.lastIndexOf(')') + 2).startsWith('Z'), () => false);
    if (alive) throw new Error('Owned process remains');
  }
  const native = join(sealed, 'native/workflows');
  results.push({ id, prompt, action, verdicts: verdicts.verdicts, received, owned, cleanup: 'runtime absent; owned processes exited', frames, nativeFiles: await readdir(native) });
}
await writeFile(join(root, 'validation.json'), JSON.stringify({ root, source, commands, results, limits: 'Private CPU-rendered Linux display; English OCR; no video. Credential snapshots stop before PNG capture. Original positive native PNGs retained. Only harmless n input received. No borrowed terminal attached or closed.' }, null, 2));
await cp(root, retained, { recursive: true, errorOnExist: true, force: false });
console.log(JSON.stringify({ root, retained, results }, null, 2));
