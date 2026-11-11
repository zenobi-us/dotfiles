import { mkdtemp, mkdir, readFile, writeFile, stat, readdir, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const source = '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui';
const parent = '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles';
const cli = join(source, 'mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts');
const root = await mkdtemp('/tmp/ce-fix-0017-');
const repository = join(root, 'repository');
const commands: object[] = [];
async function run(args: string[], expected = 0) {
 const p = Bun.spawn(args, { cwd: root, env: process.env, stdout: 'pipe', stderr: 'pipe' });
 const [stdout, stderr, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
 commands.push({args, code, stdout, stderr});
 if (code !== expected) throw new Error(JSON.stringify(commands.at(-1)));
 return stdout;
}
await mkdir(repository);
await run(['git','init','--quiet', repository]);
await run(['git','-C',repository,'remote','add','origin','https://example.invalid/owned/fix-0017.git']);
await writeFile(join(repository,'.context-routes.toml'), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
await run([cli,'doctor','--driver','tui','--json']);
const results: object[] = [];
for (const mode of ['transition','expect-confirmation']) {
 const fixture = join(root,mode+'.ts'); const input = join(root,mode+'-input');
 await writeFile(fixture, `import { appendFileSync } from 'node:fs';
process.stdin.setRawMode(true);
const screen = (title: string) => process.stdout.write('\\x1b[?25l\\x1b[2J\\x1b[H\\x1b[38;2;230;225;242m' + title + '\\r\\nSelected item\\r\\n\\x1b[48;2;201;166;255m' + ' '.repeat(30) + '\\x1b[0m' + ${JSON.stringify(mode === 'expect-confirmation' ? '\r\nDelete files? [y/N]\r\n' : '')});
screen('Ready screen');
process.stdin.on('data', data => { appendFileSync(${JSON.stringify(input)}, data); screen('Loading screen'); setTimeout(() => screen('Details screen'),1500); });
`);
 const directory = join(root,mode+'-working');
 await run([cli,'init',directory,'--repository',repository,'--workflow','native','--run',mode,'--driver','tui','--json']);
 const command = [process.execPath,fixture];
 const image = {width:1280,height:720,pixels:[{x:10,y:55,rgb:[201,166,255]}],lines:[{text:'Ready screen',top:11},{text:'Selected item',top:31}]};
 const steps: object[] = [{do:'expect',says:'Inspect ready.',locator:'screen',text:'Ready screen',shot:'ready',image}];
 if(mode==='transition') steps.push({do:'press',says:'Open details.',key:'n',screen:'Ready screen'},{do:'expect',says:'Inspect details.',locator:'screen',text:'Details screen',shot:'details',image:{...image,lines:[{text:'Details screen',top:11},{text:'Selected item',top:31}]}});
 const plan = {schema:'collect-evidence/v1',kind:'plan',workId:'native',driver:'tui',base:'terminal://private',terminal:{command,cwd:root,columns:80,rows:24,font:'monospace:size=12',lineHeight:20},approval:{origins:[],confirmations:mode==='transition'?['case.2']:[],terminal:{command,cwd:root}},tests:[{id:'case',claim:'Native safety and delayed transition',pass:'Expected outcome',fail:'Unexpected outcome',steps}]};
 await writeFile(join(directory,'plan.ts'),'export const plan = '+JSON.stringify(plan)+';\n');
 for (const op of ['render','compile','run']) await run([cli,op,directory,'--json'], op==='run'&&mode==='expect-confirmation'?3:0);
 const sealed = join(repository,'workflows/native/artifacts/evidence',mode);
 await run([cli,'validate',sealed,'--json']);
 const verdict = JSON.parse(await run([cli,'verdicts',sealed,'--json']));
 if (verdict.verdicts[0].verdict !== (mode==='transition'?'PASS':'BLOCKED')) throw new Error('Wrong verdict');
 await writeFile(join(root,mode+'-report.html'), await run([cli,'report',sealed]));
 const result = JSON.parse(await readFile(join(sealed,'cases/case/case.json'),'utf8'));
 const frames: object[] = [];
 for (const asset of result.assets) {
  const path = join(sealed,asset.path); const hash = createHash('sha256').update(await readFile(path)).digest('hex');
  if(hash!==asset.sha256) throw new Error('Hash mismatch');
  if(await stat(asset.terminal.runtime).then(()=>true,()=>false)) throw new Error('Runtime remains');
  frames.push({path,hash,terminal:asset.terminal});
 }
 const native = join(sealed,'native/workflows');
 const diagnostics = (await readdir(native)).filter(name=>/-frame-\d+\.png$/.test(name));
 if(mode==='expect-confirmation') {
  if(await stat(input).then(()=>true,()=>false)) throw new Error('Unexpected input');
  if(!diagnostics.length) throw new Error('Missing native prompt frame');
 }
 results.push({mode,verdict,input:await readFile(input,'utf8').catch(()=>null),frames,diagnostics:diagnostics.map(name=>join(native,name)),case:result});
}
await writeFile(join(root,'validation.json'),JSON.stringify({root,source,commands,results,limits:'Private CPU-rendered Linux native display; English OCR; no video. Only harmless owned fixture input n was submitted. No credentials, installations, graphics overrides or remote Git operations.'},null,2));
const retained = join(parent,'workflows/collect-evidence-feedback-02-tui/artifacts/evidence/fix-0017-smoke');
await cp(root,retained,{recursive:true,errorOnExist:true,force:false});
console.log(JSON.stringify({root,retained,results:results.map(({mode,verdict,frames,diagnostics}:any)=>({mode,verdict,frames,diagnostics}))},null,2));
