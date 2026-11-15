import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';
import {targetKey,RefreshQueue,resolveLocation} from '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/refresh-model.js';
import {workflowActivity} from '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/mods/shared-context/activity-model.js';
const root='/tmp/spec03-2j7vcjR1', source='/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh', cwd=root+'/repo', storage=new Map(), calls=[], exec=promisify(execFile);
const space={},terminal={},focus={};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
await mkdir(cwd,{recursive:true}); await exec('git',['init','-q'],{cwd});await exec('git',['config','remote.origin.url','git@github.com:example/spec03.git'],{cwd});
const helper=source+'/mise/conf.d/devtools-herdrapp/app/bin/herdr-context.mjs';
let gate=null, detailGate=null, detailStarted=null, transient=false;
async function transport(operation,where,fields){if(operation==='validate'&&gate)await gate.promise; if(operation==='detail'&&fields.id==='A'&&detailGate){detailStarted.resolve();await detailGate.promise;if(transient)throw Object.assign(new Error('transient detail read failure'),{code:'EIO'});} const {stdout}=await exec('bun',[helper,'request',JSON.stringify({protocol:1,operation,cwd:where.cwd,fields})],{env:{...process.env,XDG_CACHE_HOME:root+'/cache'},maxBuffer:16*1024*1024}).catch(error=>{if(error.stdout)return {stdout:error.stdout};throw error;}); const result=JSON.parse(stdout);calls.push({operation,fields,result}); if(!result.ok)throw Object.assign(new Error(result.error.message),result.error);return result.value;}
await transport('setup',{cwd},{store:'repository'});
async function markdown(file,fields,body){await exec('mq',['--allow-http-import','-I','null','-F','text','--argjson','fields',JSON.stringify(fields),'--args','body',body,'import "github.com/harehare/okf.mq" | okf::okf_new("enhancement", fields, body) | okf::okf_stringify(.)','-o',file]);}
await mkdir(cwd+'/tracker/tickets',{recursive:true});await mkdir(cwd+'/tracker/initiatives',{recursive:true});
await mkdir(cwd+'/docs/agents',{recursive:true});
await markdown(cwd+'/docs/agents/issue-tracker.md',{backend:'local-markdown','issue-root':'tracker/tickets','initiative-root':'tracker/initiatives',title:'Scratch'},'# Scratch');
const fields={schema:'tracker-ticket/v1',id:'A',title:'Cached Alpha',triage:'ready-for-agent',work_status:'unclaimed',blocked_by:[]};
await markdown(cwd+'/tracker/tickets/A.md',fields,'# Cached Alpha\n\nCached selected description.');
await mkdir(cwd+'/workflows/A/events',{recursive:true});await writeFile(cwd+'/workflows/A/events/start-1.yaml','schema: worktree-receipt/v2\nreceipt_id: start-1\nphase: start\nstatus: started\n');
async function client(){const context=createContext({localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});const core=new SyntheticModule(['runQuery','forgetTarget','targetKey','cancelled'],function(){this.setExport('runQuery',transport);this.setExport('forgetTarget',()=>{});this.setExport('targetKey',targetKey);this.setExport('cancelled',()=>Object.assign(new Error('cancelled'),{code:'CANCELLED'}));},{context});const data=new SourceTextModule(await readFile(source+'/mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.js','utf8'),{context});await data.link(()=>core);await data.evaluate();return data.namespace.createQueryClient();}
async function rootModel(client, storage = new Map()) {
  const current = { where: { machine: null, cwd: "/repo" } }, tasks = [];
  const noop = () => { };
  client.validate ??= async () => [];
  client.isCurrent ??= () => false;
  client.peek ??= () => null;
  client.retainDetails ??= noop;
  const stubs = (...names) => Object.fromEntries(names.map(name => [name, noop]));
  const modules = {
    "gpui-kit": { View: class { }, div: noop },
    "gpui-base": stubs("h_flex", "v_flex", "TextView", "Scrollbar", "h_resizable", "resizable_panel"),
    herdr: stubs("props", "run", "nextCommand", "theme"),
    "./data.js": { createQueryClient: () => client },
    "./loading.js": stubs("beginLoading", "updateLoading", "stopLoading"),
    "./retained-views.js": stubs("initRetainedViews", "notifyQueryStatus", "releaseRetainedViews"),
    "./refresh.js": { ...stubs("initObservation", "scheduleObservation", "startRefreshResources", "stopRefreshResources", "updateLocalWatches"), currentLocation: given => given?.cwd ? resolveLocation(given, space, terminal, focus) : current.where },
    "./refresh-model.js": { targetKey, RefreshQueue },
    "./preferences.js": { loadPreferences: noop, DEFAULTS: {} },
    "./tree.js": { ...stubs("revealPath", "itemType"), dependencyRows: () => ({ canonical: new Map() }) },
    "./ui.js": stubs("button", "icon", "note", "select", "typeColor", "typeIcon"),
    "./graph-view.js": stubs("graphView", "initGraphMenu", "renderGraphMenu"),
    "./header.js": stubs("compactHeader"),
    "./header-controls.js": stubs("initHeaderControls", "clearHeaderControls", "renderHeaderReason"),
    "./progress-model.js": { initiativeProgress: () => new Map() },
    "./progress.js": stubs("initiativeProgressRow"),
    "./activity-model.js": { workflowActivity },
    "./action-menu.js": stubs("initActionMenus"),
    "./action.js": stubs("invalidateAction"),
    "./agents.js": stubs("observeAgentLaunch"),
    "./filter-model.js": { DEFAULT_FILTERS: {} },
    "./tree-filters.js": stubs("initTreeFilters", "treeFilters", "closeTreeFilters"),
    "./agent-model.js": stubs("agentActivitySummary"),
    "./agent-activity.js": stubs("agentDots"),
    "./metadata.js": stubs("openMetadata", "initMetadata", "renderMetadata"),
    "./settings.js": stubs("openSettings", "initSettings", "renderSettings"),
  };
  const context = createContext({ Date, Map, Set, Object, Promise, JSON, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
  const module = new SourceTextModule(await readFile(source+"/mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js", "utf8"), { context });
  await module.link(async name => {
    const values = modules[name];
    assert.ok(values, `Missing UI import stub: ${name}`);
    return new SyntheticModule(Object.keys(values), function() { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await module.evaluate();
  const view = new module.namespace.default();
  Object.assign(view, {
    client, closed: false, revision: 1, detailRevision: 0, fileRevision: 0,
    key: targetKey(current.where), where: current.where, mode: "tracker",
    pendingQueries: new Set(), selected: null, drawer: "peek", snapshot: null,
    remember: noop, changed: noop, refreshQueue: new RefreshQueue(),
  });
  const cx = { spawn(body) { tasks.push(Promise.resolve(body(cx))); return { cancel: noop }; } };
  return { view, current, tasks, cx };
}


const where={cwd,machine:null}, seed=await client();
const context=await seed.query('context',where), tree=await seed.query('tracker',where,{tree:true});
await seed.query('detail',where,{id:'A',kind:'ticket'});
const saved=new Map([[context.identity+':'+context.repository,{selected:{id:'A',kind:'ticket',ref:tree.tickets[0].ref}}]]);
const warm=await client(), {view,current,cx,tasks}=await rootModel(warm,storage);
current.where=where;Object.assign(view,{key:'',where:null,preferencesReady:true,saved});view.follow(cx);view.refresh(cx);await Promise.all(tasks);
assert.equal(view.stale,false);const summary={};
async function change(text){await markdown(cwd+'/tracker/tickets/A.md',{...fields,title:text},'# '+text+'\n\n'+text);}
async function start(){detailGate=deferred();detailStarted=deferred();view.refresh(cx);await detailStarted.promise;assert.equal(view.snapshot.tickets[0].id,'A');assert.equal(view.stale,true);}
await change('Transient replacement');transient=true;await start();detailGate.resolve();await Promise.all(tasks);
assert.equal(view.stale,true);assert.match(view.detail.record.body,/Cached selected/);assert.ok(view.activity.events.length);assert.equal(warm.isCurrent('detail',where,{id:'A',kind:'ticket'}),false);
summary.transient={stale:view.stale,error:view.detailError,body:view.detail.record.body,activity:view.activity.events.length,completed:view.detailProgress.completed};
transient=false;detailGate=null;view.refresh(cx);await Promise.all(tasks);assert.equal(view.stale,false);assert.match(view.detail.record.body,/Transient replacement/);summary.recovery={stale:view.stale,body:view.detail.record.body};
await change('Removed after valid tree');await start();await unlink(cwd+'/tracker/tickets/A.md');detailGate.resolve();await Promise.all(tasks);
assert.equal(view.stale,true);assert.match(view.detail.record.body,/Transient replacement/);assert.match(view.detailError,/no longer exists/);summary.removedAfterTree={stale:view.stale,error:view.detailError,body:view.detail.record.body,activity:view.activity.events.length,completed:view.detailProgress.completed};
detailGate=null;view.refresh(cx);await Promise.all(tasks);assert.equal(view.selected,null);assert.equal(view.detail,null);assert.equal(view.activity.events.length,0);assert.equal(warm.peek('detail',where,{id:'A',kind:'ticket'}),null);summary.retired={selected:null,detail:null,stale:view.stale};
await change('Generation first');view.refresh(cx);await Promise.all(tasks);view.choose(view.snapshot.tickets[0],'ticket',cx);await Promise.all(tasks);
await change('Generation second');await start();await change('Generation third');warm.invalidate(where,'detail');detailGate.resolve();await Promise.all(tasks);assert.match(view.detail.record.body,/Generation third/);assert.equal(view.stale,false);summary.changedDuringReplacement={body:view.detail.record.body,stale:view.stale};
await change('Selection guard');await start();view.choose({id:'missing-B',ref:'tracker/tickets/missing-B.md'},'ticket',cx);detailGate.resolve();await Promise.all(tasks);assert.equal(view.selected.id,'missing-B');assert.equal(view.detail,null);summary.selectionGuard={selected:view.selected.id,detail:null};
view.choose(view.snapshot.tickets[0],'ticket',cx);await Promise.all(tasks);await change('Target guard');await start();current.where={cwd,machine:'other'};view.follow(cx);detailGate.resolve();await Promise.all(tasks);assert.equal(view.detail,null);assert.equal(view.stale,false);assert.equal(view.activity.events.length,0);summary.targetGuard={detail:null,stale:view.stale};
await Promise.all([seed.release(),warm.release()]);await writeFile(root+'/calls.json',JSON.stringify(calls,null,2));await writeFile(root+'/smoke.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
