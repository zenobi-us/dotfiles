import assert from 'node:assert/strict';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
const [root, source, bun] = process.argv.slice(2), cwd = `${root}/repo`, helper = `${source}/mise/conf.d/devtools-herdrapp/app/bin/herdr-context.mjs`;
const exec = promisify(execFile), storage = new Map(), calls = [];
async function transport(operation, where, fields) {
  const { stdout } = await exec(bun, [helper, 'request', JSON.stringify({protocol:1,operation,cwd:where.cwd,fields})], {env:{...process.env,XDG_CACHE_HOME:`${root}/cache`},maxBuffer:8*1024*1024});
  const result = JSON.parse(stdout);
  calls.push({operation, bodyBytes: result.ok && result.value?.cache ? Buffer.byteLength(JSON.stringify(result.value.value)) : 0});
  if (!result.ok) throw Object.assign(new Error(result.error.message), result.error);
  return result.value;
}
async function client() {
  const context = createContext({localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}});
  const core = new SyntheticModule(['runQuery','forgetTarget','targetKey','cancelled'],function(){
    this.setExport('runQuery',transport); this.setExport('forgetTarget',()=>{});
    this.setExport('targetKey',where=>JSON.stringify([where.machine??null,where.cwd]));
    this.setExport('cancelled',()=>Object.assign(new Error('cancelled'),{code:'CANCELLED'}));
  },{context});
  const data = new SourceTextModule(await readFile(`${source}/mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js`,'utf8'),{context});
  await data.link(()=>core); await data.evaluate(); return data.namespace.createQueryClient();
}
const where = {cwd,machine:null}, fields = {collection:'tickets',path:'preview.txt'};
const old = await client(); await old.query('file',where,fields);
const current = await client(); await unlink(`${cwd}/tracker/tickets/preview.txt`); await current.validate(where);
for(let index=0;index<140;index++) {
  const path=`retired-${index}.txt`; await writeFile(`${cwd}/tracker/tickets/${path}`,'Retired scratch body');
  await current.query('file',where,{collection:'tickets',path}); await unlink(`${cwd}/tracker/tickets/${path}`); await current.validate(where);
}
await old.query('context',where);
const fresh = await client(); assert.equal(fresh.peek('file',where,fields),null);
assert.ok((current.retired?.size??0)<=128);
await writeFile(`${cwd}/tracker/tickets/preview.txt`,'Visible cached file before validation.\n');
await current.query('file',where,fields); await old.query('directory',where,{collection:'tickets',path:''});
const seed = await client(); assert.equal(seed.peek('file',where,fields).body,'Visible cached file before validation.\n');
await seed.query('context',where); await seed.query('directory',where,{collection:'tickets',path:''}); await seed.query('file',where,fields);
const before = calls.length; const validated = await seed.validate(where); assert.ok(validated.every(row=>row.status==='unchanged'));
await seed.query('file',where,fields); assert.equal(calls.length,before+1);
const summary={retirements:141,retirementKeys:current.retired?.size??0,removedBodyRecovered:false,sameKeyNewBody:seed.peek('file',where,fields).body,unchangedValidation:validated,unchangedBodyReads:0,storedBytes:[...storage.values()].reduce((n,v)=>n+v.length*2,0),helperCalls:calls.length};
await writeFile(`${root}/storage.json`,JSON.stringify([...storage])); await writeFile(`${root}/smoke.json`,JSON.stringify(summary,null,2)); await writeFile(`${root}/calls.json`,JSON.stringify(calls,null,2));
await Promise.all([old.release(),current.release(),fresh.release(),seed.release()]); console.log(JSON.stringify(summary,null,2));
