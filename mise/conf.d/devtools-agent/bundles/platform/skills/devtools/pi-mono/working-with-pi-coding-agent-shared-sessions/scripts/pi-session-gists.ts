#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";

const app = new Crust("pi-session-gists").meta({ description: "Manage Pi shared-session gists" });
const limit = Number(process.env.PI_SESSION_GIST_LIMIT || 200);

type Result = { stdout: string; stderr: string; status: number };
async function gh(args: string[], input?: string, allowFailure = false): Promise<Result> {
  const p = Bun.spawn(["gh", ...args], { stdin: input === undefined ? undefined : new Blob([input]), stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, status] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  if (status !== 0 && !allowFailure) throw new Error(stderr.trim() || `gh ${args.join(" ")} failed`);
  return { stdout: stdout.trim(), stderr: stderr.trim(), status };
}
async function isPiSession(id: string) { return (await gh(["gist", "view", id, "--raw"], undefined, true)).stdout.split("\n").slice(0, 40).some((x) => x.includes("<title>Session Export</title>")); }
async function rows() {
  const listed = await gh(["gist", "list", "--limit", String(limit)]);
  const output: string[] = [];
  for (const line of listed.stdout.split("\n").filter(Boolean)) {
    const [id, ...parts] = line.split("\t");
    if (!id || !(await isPiSession(id))) continue;
    const json = JSON.parse((await gh(["api", `gists/${id}`])).stdout);
    const size = Object.values(json.files ?? {}).reduce((n: number, f: any) => n + (f.size ?? 0), 0);
    const first = Object.values(json.files ?? {})[0] as any;
    output.push([id, parts[0] ?? "", `${size}B`, parts[1] ?? "", first?.filename ?? "", parts[2] ?? "", parts[3] ?? ""].join("\t"));
  }
  return output;
}
async function list() {
  const data = await rows();
  if (!data.length) return console.log("No Pi shared-session gists found.");
  console.log("GIST ID                            UPDATED               SIZE        TITLE                             VISIBILITY");
  console.log("----------------------------------  --------------------  ----------  ----------------------------------  ------------------");
  for (const row of data) { const [id, updated, size, description, first, , visibility] = row.split("\t"); console.log(`${id.padEnd(34)}  ${updated.padEnd(20)}  ${size.padEnd(10)}  ${(description || first).slice(0, 34).padEnd(34)}  ${visibility}`); }
  console.log(`\nNext actions:\n  Open in browser:  ${process.argv[1]} open <gist_id>\n  Delete one:       ${process.argv[1]} delete <gist_id>\n  Delete all listed Pi session gists: ${process.argv[1]} delete-all [--yes]`);
}
async function open(id: string) { if (!id) throw new Error("missing gist_id"); const url = `https://pi.dev/session/#${id}`; const opener = process.platform === "darwin" ? "open" : "xdg-open"; const p = Bun.spawn([opener, url], { stdout: "ignore", stderr: "ignore" }); await p.exited.catch(() => {}); console.log(url); }
async function del(id: string, yes = false) { if (!id) throw new Error("missing gist_id"); await gh(["gist", "delete", id, ...(yes ? ["--yes"] : [])], undefined, false); }
async function deleteAll(yes = false) { const ids = (await rows()).map((x) => x.split("\t")[0]); if (!ids.length) return console.log("No Pi shared-session gists to delete."); console.log("About to delete the following Pi shared-session gists:\n" + ids.join("\n")); if (!yes) { const answer = prompt("Continue? [y/N] "); if (!/^y$/i.test(answer ?? "")) return console.log("Aborted."); } for (const id of ids) { console.log(`Deleting ${id}`); await del(id, true); } }
function doctor() { console.log(JSON.stringify({ bun: Bun.version, gh: Boolean(Bun.which("gh")), authenticated: Boolean(process.env.GH_TOKEN || process.env.GITHUB_TOKEN) }, null, 2)); }
const arg = { name: "gist-id", type: "string" as const, required: false };
const listCmd = app.sub("list").meta({ description: "List Pi session gists" }).run(list);
const openCmd = app.sub("open").meta({ description: "Open a session" }).args([ { ...arg, required: true } ]).run(({ args }) => open(args["gist-id"]));
const deleteCmd = app.sub("delete").meta({ description: "Delete one gist" }).args([{ ...arg, required: true }]).flags({ yes: { type: "boolean", short: "y" } }).run(({ args, flags }) => del(args["gist-id"], flags.yes));
const allCmd = app.sub("delete-all").meta({ description: "Delete all listed sessions" }).flags({ yes: { type: "boolean", short: "y" } }).run(({ flags }) => deleteAll(flags.yes));
const doctorCmd = app.sub("doctor").meta({ description: "Check gh and authentication prerequisites" }).run(doctor);
app.use(helpPlugin()).command(listCmd).command(openCmd).command(deleteCmd).command(allCmd).command(doctorCmd).execute();
