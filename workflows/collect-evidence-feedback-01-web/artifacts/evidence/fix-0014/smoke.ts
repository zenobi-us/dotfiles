// Public CLI smoke against an owned HTTP page. All captures stay in /tmp until sealed.
import { mkdtemp, mkdir, writeFile, readFile, cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';
const source = '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web';
const cli = join(source, 'mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts');
const destination = '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-01-web/artifacts/evidence/fix-0014';
const root = await mkdtemp('/tmp/ce-fix-0014-smoke-');
const repository = join(root, 'repository'); await mkdir(repository);
for (const args of [['init','--quiet',repository], ['-C',repository,'remote','add','origin','https://example.invalid/owned/fix0014.git']]) {
 const p = Bun.spawn(['git',...args], {stdout:'pipe',stderr:'pipe'}); if(await p.exited) throw Error(await new Response(p.stderr).text());
}
await writeFile(join(repository,'.context-routes.toml'),'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n');
let submissions = 0;
const server = Bun.serve({hostname:'127.0.0.1',port:0,fetch(request){
 if(new URL(request.url).pathname==='/submitted'){ submissions++; return new Response('recorded'); }
 return new Response(`<!doctype html><html lang="en"><title>Fix 0014 owned smoke</title><style>body{font:24px sans-serif;margin:48px}button{font:inherit;padding:16px}p{border:3px solid;padding:24px}</style><h1>Fix 0014 owned smoke</h1><button autofocus onclick="document.querySelector('p').textContent='Submitted once';fetch('/submitted')">Confirm owned operation</button><p>Not submitted</p></html>`,{headers:{'Content-Type':'text/html'}});
}});
const log: object[] = [];
async function invoke(args:string[], expected:number){
 const startedAt = new Date().toISOString();
 const p = Bun.spawn([cli,...args,'--json','--no-input','--no-color'],{cwd:root,env:{...process.env,TMPDIR:root},stdout:'pipe',stderr:'pipe'});
 const [out,err] = await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text()]);
 const code=await p.exited; const result=JSON.parse(out);
 log.push({command:[cli,...args,'--json','--no-input','--no-color'],cwd:root,startedAt,finishedAt:new Date().toISOString(),code,result,stderr:err});
 if(code!==expected)throw Error(JSON.stringify({args,code,out,err})); return result;
}
const runs:object[]=[];
try {
 for(const driver of ['surf','playwright']) {
  const before=submissions;
  const work=join(root,driver);
  await invoke(['init',work,'--repository',repository,'--workflow','fix-smoke','--run',driver,'--driver',driver],0);
  const plan={schema:'collect-evidence/v1',kind:'plan',workId:'fix-smoke',driver,base:server.url.origin,approval:{origins:[server.url.origin],confirmations:['approved.2']},preconditions:[{id:'ready',desc:'Owned page is available',check:{goto:'/',locator:'h1',text:'Fix 0014 owned smoke'}}],tests:[
   {id:'blocked',requires:['ready'],claim:'Block unapproved Space activation',pass:'No unapproved submission',fail:'An unapproved submission occurs',steps:[{do:'navigate',to:'/',says:'Open the owned confirmation page'},{do:'press',key:'Space',says:'Attempt the unapproved confirmation'}]},
   {id:'approved',requires:['ready'],claim:'Allow the approved confirmation',pass:'One submission appears',fail:'The approved confirmation is blocked',steps:[{do:'navigate',to:'/',says:'Open the owned page'},{do:'press',key:'Space',says:'Confirm the owned operation'},{do:'expect',locator:'p',text:'Submitted once',says:'Check the submitted state',shot:'submitted-state'}]},
  ]};
  await writeFile(join(work,'plan.ts'),'export const plan = '+JSON.stringify(plan)+';\n');
  await invoke(['render',work],0); await invoke(['compile',work],0);
  const run=await invoke(['run',work],3);
  if(JSON.stringify(run.verdicts)!==JSON.stringify([{caseId:'blocked',verdict:'BLOCKED'},{caseId:'approved',verdict:'PASS'}]))throw Error(JSON.stringify(run.verdicts));
  if(submissions-before!==1)throw Error('Expected exactly one approved HTTP submission');
  await invoke(['validate',run.destination.path],0); await invoke(['report',run.destination.path],0);
  const blocked=JSON.parse(await readFile(join(run.destination.path,'cases/blocked/case.json'),'utf8'));
  if(!blocked.errors.some((e:{message:string})=>e.message.includes('SAFETY STOP')))throw Error('No safety-stop diagnostic');
  runs.push({driver,directory:run.destination.path,submissions:submissions-before,verdicts:run.verdicts});
 }
 await mkdir(destination); // Exclusive: never overwrite an earlier evidence identity.
 for(const run of runs as {driver:string,directory:string}[])await cp(run.directory,join(destination,run.driver),{recursive:true,errorOnExist:true,force:false});
 await writeFile(join(destination,'smoke-results.json'),JSON.stringify({schema:'collect-evidence/v1',kind:'event',root,source,environment:{MISE_AUTO_INSTALL:process.env.MISE_AUTO_INSTALL,PLAYWRIGHT_MCP_EXECUTABLE_PATH:process.env.PLAYWRIGHT_MCP_EXECUTABLE_PATH},runs,log},null,2));
 await cp(import.meta.path,join(destination,'smoke.ts'));
 console.log(JSON.stringify({destination,root,runs},null,2));
} finally {server.stop(true); await writeFile(join(root,'smoke-command-log.json'),JSON.stringify(log,null,2));}
