import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const cli = process.argv[2];
const root = await mkdtemp('/tmp/ce-fix-0026-proof-');
const repository = join(root, 'repository'); await mkdir(repository);
const commands: unknown[] = [];
async function command(argv: string[]) {
 const p = Bun.spawn(argv, { cwd:'/tmp', env:{...process.env,TMPDIR:root}, stdout:'pipe',stderr:'pipe' });
 const [out,err] = await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text()]);
 const code = await p.exited;
 commands.push({argv,code,out,err});
 await writeFile(join(root,'commands.json'),JSON.stringify(commands,null,2));
 assert.equal(code,0,JSON.stringify({argv,code,out,err})); return out;
}
await command(['git','init','--quiet',repository]);
await command(['git','-C',repository,'remote','add','origin','https://example.invalid/fix/owned.git']);
await writeFile(join(repository,'.context-routes.toml'),'schema = 2\n'+['alignment','tickets','initiatives','sources','evidence','workflows'].map(k=>`[records.${k}]\nadapter = "${k==='tickets'?'local-markdown':['alignment','initiatives'].includes(k)?'markdown':'files'}"\nstore = "repository"\n`).join(''));
const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(r){const id=new URL(r.url).searchParams.get('id');return new Response(`<!doctype html><title>Fix 0026 controlled page</title><style>body{font:28px sans-serif;margin:50px}</style><h1>Identity ${id}</h1><p>Empty navigation slug; explicit native capture.</p>`,{headers:{'Content-Type':'text/html'}});}});
const results=[];
console.error(`Diagnostics: ${root}`);
try {
 for(const driver of ['surf','playwright']) {
  const listing=driver==='surf'?['surf','session.list','--json']:['playwright-cli','list'];
  const before=await command(listing); const work=join(root,driver);
  async function invoke(args:string[]) {return JSON.parse(await command([cli,...args,'--json','--no-input','--no-color']));}
  await invoke(['init',work,'--repository',repository,'--workflow','fix-0026','--run',driver,'--driver',driver]);
  const ids=['a','a.map'];
  const plan={schema:'collect-evidence/v1',kind:'plan',workId:'fix-0026',driver,base:server.url.origin,approval:{origins:[server.url.origin],confirmations:[]},tests:ids.map(id=>({id,claim:`Observe identity ${id}`,pass:'The exact identity is visible',fail:'The identity is wrong',steps:[{do:'navigate',says:'Open the identity page without a screenshot',to:`/?id=${id}`,shot:''},{do:'expect',says:'Check the exact identity',locator:'h1',text:`Identity ${id}`},{do:'capture',says:'Capture the visible heading',locator:'h1',as:'identity',shot:'explicit-identity'}]}))};
  await writeFile(join(work,'plan.ts'),`export const plan = ${JSON.stringify(plan)};`);
  await invoke(['compile',work]);
  await invoke(['render',work]);
  const rendered=JSON.parse(await readFile(join(work,'plan.json'),'utf8'));
  assert.deepEqual(rendered.data.tests.map((t:any)=>[t.id,t.steps[0].shot]),[['a',''],['a.map','']]);
  const run=await invoke(['run',work]);
  assert.deepEqual(run.verdicts,ids.map(caseId=>({caseId,verdict:'PASS'})));
  await invoke(['validate',run.destination.path]); const images=[];
  for(const id of ids) {
   const c=JSON.parse(await readFile(join(run.destination.path,'cases',id,'case.json'),'utf8'));
   assert.equal(c.id,id);
   assert.deepEqual(c.steps.map((s:any)=>s.id),[`${id}.1`,`${id}.2`,`${id}.3`]);
   assert.ok(!c.assets.some((a:any)=>a.stepId===`${id}.1`),'Empty slug must not capture');
   assert.ok(c.assets.some((a:any)=>a.stepId===`${id}.3`),'Explicit capture must produce an image');
   for(const a of c.assets) {const path=join(run.destination.path,a.path);const b=await readFile(path);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(a.caseId,id);images.push({id,path,sha256:a.sha256,width:a.width,height:a.height});}
  }
  const after=await command(listing);assert.equal(after,before,'Owned sessions released; borrowed sessions preserved');
  results.push({driver,verdicts:run.verdicts,destination:run.destination.path,images,cleanup:'session lists unchanged'});
 }
 const result={root,results};await writeFile(join(root,'proof.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{server.stop(true);}
