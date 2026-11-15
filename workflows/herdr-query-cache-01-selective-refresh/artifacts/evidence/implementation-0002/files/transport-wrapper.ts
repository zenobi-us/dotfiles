#!/usr/bin/env bun
// Scratch-only transport measurements. Every result comes from the real helper.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
const root = '/tmp/herdr-query-cache-bKzX6y';
const args = process.argv.slice(2), started = Date.now();
let request;
try {
  if (['request', 'job-create'].includes(args[0])) request = JSON.parse(args[1]);
  if (args[0] === 'job-run') request = JSON.parse(readFileSync(`${process.env.XDG_STATE_HOME}/herdr/shared-context-queries/${args[1]}/request.json`, 'utf8')).request;
} catch {}
const scenario = existsSync(`${root}/scenario.txt`) ? readFileSync(`${root}/scenario.txt`, 'utf8').trim() : 'cold-and-unchanged';
const delay = existsSync(`${root}/delay.json`) ? JSON.parse(readFileSync(`${root}/delay.json`, 'utf8')) : {};
const delayed = delay.operation === request?.operation && (!delay.command || delay.command === args[0]);
appendFileSync(`${root}/starts.jsonl`, JSON.stringify({ scenario, started, command: args[0], job: args[0]?.startsWith("job-") ? args[1] : undefined, request }) + '\n');
if (delayed && delay.phase === 'before') await Bun.sleep(delay.ms);
const child = Bun.spawnSync([process.execPath, '/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-herdr-query-cache-01-selective-refresh/mise/conf.d/devtools-herdrapp/app/bin/herdr-context.mjs', ...args], { stdout: 'pipe', stderr: 'pipe', env: process.env });
let envelope;
try { envelope = JSON.parse(child.stdout.toString()); } catch {}
if (delayed && delay.phase !== 'before') await Bun.sleep(delay.ms);
appendFileSync(`${root}/transport.jsonl`, JSON.stringify({ scenario, started, finished: Date.now(), command: args[0], job: args[0]?.startsWith("job-") ? args[1] : undefined, request, code: child.exitCode, bytes: child.stdout.length, envelope }) + '\n');
process.stdout.write(child.stdout); process.stderr.write(child.stderr); process.exit(child.exitCode);
