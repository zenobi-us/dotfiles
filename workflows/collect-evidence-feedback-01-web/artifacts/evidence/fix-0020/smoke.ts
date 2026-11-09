import { mkdtemp, mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const cli = process.argv[2];
const target = process.argv[3];
const root = await mkdtemp('/tmp/ce-fix-0020-');
const repo = join(root, 'repository');
await mkdir(repo);
async function command(argv: string[]) {
  const p = Bun.spawn(argv, { cwd: '/tmp', env: { ...process.env, TMPDIR: root }, stdout: 'pipe', stderr: 'pipe' });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  const code = await p.exited;
  assert.equal(code, 0, JSON.stringify({ argv, code, out, err }));
  return { out, err };
}
await command(['git', 'init', '--quiet', repo]);
await command(['git', '-C', repo, 'remote', 'add', 'origin', 'https://example.invalid/owned/fix-0020.git']);
await writeFile(join(repo, '.context-routes.toml'), 'schema = 2\n' + ['alignment','tickets','initiatives','sources','evidence','workflows'].map(kind => `[records.${kind}]\nadapter = "${kind === 'tickets' ? 'local-markdown' : ['alignment','initiatives'].includes(kind) ? 'markdown' : 'files'}"\nstore = "repository"\n`).join(''));
let submitted = 0;
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(request) {
  const url = new URL(request.url);
  if (url.pathname === '/submitted') { submitted++; return new Response('ok'); }
  return new Response(`<!doctype html><title>Owned ID regression</title><style>body{font:28px sans-serif;margin:48px}button{font:inherit;padding:16px}</style><h1>Case ${url.searchParams.get('case')}</h1><button autofocus onclick="document.querySelector('p').textContent='Submitted';fetch('/submitted')">Confirm operation</button><p>Not submitted</p>`, { headers: { 'Content-Type': 'text/html' } });
} });
const evidence: object[] = [];
try {
  for (const driver of ['surf', 'playwright']) {
    const list = driver === 'surf' ? ['surf','session.list','--json'] : ['playwright-cli','list'];
    const before = await command(list);
    const work = join(root, driver);
    async function invoke(args: string[]) { const r = await command([cli, ...args, '--json', '--no-input', '--no-color']); await writeFile(join(root, `${driver}-${args[0]}.json`), r.out); return JSON.parse(r.out); }
    await invoke(['init', work, '--repository', repo, '--workflow', 'fix-0020', '--run', driver, '--driver', driver]);
    const ids = ['approved-space', 'a-b', 'a.b', 'a_b'];
    await writeFile(join(work, 'plan.ts'), `export const plan = ${JSON.stringify({schema:'collect-evidence/v1',kind:'plan',workId:'fix-0020',driver,base:server.url.origin,approval:{origins:[server.url.origin],confirmations:['approved-space.2']},tests:ids.map(id=>({id,claim:`Preserve ${id}`,pass:'The matching page is observed',fail:'The identity changes',steps:[{do:'navigate',to:`/?case=${id}`},...(id==='approved-space'?[{do:'press',key:'Space'},{do:'expect',locator:'p',text:'Submitted',shot:'approved-keyboard'}]:[{do:'expect',locator:'h1',text:`Case ${id}`,shot:'punctuation-identity'}])]}))})};`);
    await invoke(['compile', work]);
    const run = await invoke(['run', work]);
    assert.deepEqual(run.verdicts, ids.map(caseId=>({caseId,verdict:'PASS'})));
    const dir = run.destination.path;
    await invoke(['validate', dir]);
    for (const id of ids) {
      const c = JSON.parse(await readFile(join(dir, 'cases', id, 'case.json'), 'utf8'));
      assert.equal(c.id, id);
      assert.deepEqual(c.steps.map((s:any)=>s.id), id==='approved-space'?[`${id}.1`,`${id}.2`,`${id}.3`]:[`${id}.1`,`${id}.2`]);
      for (const a of c.assets) {
        const png = await readFile(join(dir, a.path));
        assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
        assert.equal(a.caseId,id); assert.equal(a.driver,driver);
        assert.ok(a.width > 0 && a.height > 0);
      }
    }
    const after = await command(list);
    assert.equal(after.out, before.out, 'Owned sessions must be gone; borrowed sessions must remain');
    await mkdir(target, {recursive:true});
    await cp(dir, join(target, driver), {recursive:true, errorOnExist:true, force:false, preserveTimestamps:true});
    await writeFile(join(target, `${driver}-sessions-before.txt`), before.out, {flag:'wx'});
    await writeFile(join(target, `${driver}-sessions-after.txt`), after.out, {flag:'wx'});
    evidence.push({driver,verdicts:run.verdicts,source:dir,destination:join(target,driver),cleanup:'before/after session lists match'});
  }
  assert.equal(submitted,2);
  await writeFile(join(target,'smoke.json'), JSON.stringify({schema:'fix-smoke/v1',root,confirmations:submitted,evidence},null,2),{flag:'wx'});
  console.log(JSON.stringify({root,target,evidence},null,2));
} finally { server.stop(true); }
