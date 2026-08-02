#!/usr/bin/env bun
/**
 * PROTOTYPE — throwaway singleton state model.
 *
 * Question: does a shared singleton store remove conflicting plugin memory?
 * Run: bun pkgs/plugins/pi-extension/src/prototype-singleton.ts
 */
import { Database } from "bun:sqlite";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { rmSync } from "node:fs";

const dbPath = "/tmp/zellij-agent-threads-prototype.sqlite";
rmSync(dbPath, { force: true });

const db = new Database(dbPath);
db.exec(`
  create table agents (
    key text primary key,
    zellij_session text not null,
    pane_id text not null,
    state text not null,
    title text not null,
    updated_at integer not null,
    lease_until integer not null
  )
`);

let now = 0;
const leaseMs = 10_000;
const pluginViews = new Map<string, Agent[]>();

type Agent = {
  key: string;
  zellij_session: string;
  pane_id: string;
  state: string;
  title: string;
  updated_at: number;
  lease_until: number;
};

const upsertAgent = db.query<Agent, [string, string, string, string, string, number, number]>(`
  insert into agents (key, zellij_session, pane_id, state, title, updated_at, lease_until)
  values (?, ?, ?, ?, ?, ?, ?)
  on conflict(key) do update set
    state = excluded.state,
    title = excluded.title,
    updated_at = excluded.updated_at,
    lease_until = excluded.lease_until
  returning *
`);
const deleteAgent = db.query(`delete from agents where key = ?`);
const gcAgents = db.query(`delete from agents where lease_until <= ?`);
const snapshotAgents = db.query<Agent, [number]>(`
  select * from agents where lease_until > ? order by zellij_session, pane_id
`);

function report(zellijSession: string, paneId: string, state: "idle" | "running" | "shutdown", title: string) {
  const key = `${zellijSession}:${paneId}`;
  if (state === "shutdown") deleteAgent.run(key);
  else upsertAgent.get(key, zellijSession, paneId, state, title, now, now + leaseMs);
}

function pull(plugin: string) {
  pluginViews.set(plugin, snapshotAgents.all(now));
}

function tick(ms: number) {
  now += ms;
  gcAgents.run(now);
}

function printState(reason: string) {
  const dbAgents = snapshotAgents.all(now);
  console.log(`\n== ${reason} @ ${now}ms ==`);
  console.table(dbAgents.map(row));
  console.log("plugin views:");
  for (const plugin of ["plugin-a", "plugin-b"]) {
    console.log(`  ${plugin}: ${JSON.stringify((pluginViews.get(plugin) ?? []).map(row))}`);
  }
  console.log("\ncommands: 1=a running 2=b running 3=a idle 4=a shutdown 5=tick 11s a=pull A b=pull B q=quit");
}

function row(agent: Agent) {
  return {
    key: agent.key,
    state: agent.state,
    title: agent.title,
    lease_ms_left: agent.lease_until - now,
  };
}

report("alpha", "1", "running", "alpha pane 1");
pull("plugin-a");
printState("initial report + plugin-a pull");

const rl = createInterface({ input, output });
for (;;) {
  const command = (await rl.question("> ")).trim();
  if (command === "q") break;
  if (command === "1") report("alpha", "1", "running", "alpha pane 1");
  else if (command === "2") report("beta", "1", "running", "beta pane 1");
  else if (command === "3") report("alpha", "1", "idle", "alpha pane 1");
  else if (command === "4") report("alpha", "1", "shutdown", "alpha pane 1");
  else if (command === "5") tick(11_000);
  else if (command === "a") pull("plugin-a");
  else if (command === "b") pull("plugin-b");
  else console.log("unknown command");
  printState(command);
}
rl.close();
db.close();
console.log(`prototype DB was ${dbPath}`);
