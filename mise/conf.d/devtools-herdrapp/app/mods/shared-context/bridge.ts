// A loopback-only bridge lets GPUI use the existing Bun/Node TypeScript APIs.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { contextData, setup, directory, file, tracker, detail, prepare, message, type CollectionKind } from "./data";
import type { ExplorerAction } from "../../../../devtools-agent/bundles/agent-core/extensions/pi-shared-context/model";

export async function request(input: Record<string, unknown>) {
  if (typeof input.cwd !== "string" || !path.isAbsolute(input.cwd)) throw new Error("Select an absolute repository folder.");
  const cwd = input.cwd;
  switch (input.operation) {
    case "context": return contextData(cwd);
    case "setup": {
      if (input.store !== "repository" && input.store !== "shared") throw new Error("Select repository or shared storage.");
      return setup(cwd, input.store, typeof input.preset === "string" ? input.preset : undefined);
    }
    case "directory": case "file": {
      if (!["alignment", "tickets", "initiatives", "sources"].includes(String(input.collection))) throw new Error("Select a resolved context collection.");
      if (typeof input.path !== "string") throw new Error("Select a collection-relative path.");
      return input.operation === "directory" ? directory(cwd, input.collection as CollectionKind, input.path) : file(cwd, input.collection as CollectionKind, input.path);
    }
    case "tracker": return tracker(cwd);
    case "detail": case "prepare": {
      if (typeof input.id !== "string" || !input.id) throw new Error("Select a tracker record.");
      if (input.kind !== "ticket" && input.kind !== "initiative") throw new Error("Select a ticket or initiative.");
      return input.operation === "detail" ? detail(cwd, input.id, input.kind) : prepare(cwd, input.id, input.kind, String(input.action) as ExplorerAction, typeof input.prompt === "string" ? input.prompt : "");
    }
    default: throw new Error("Unknown shared-context operation.");
  }
}

export async function main(argv = process.argv.slice(2)) {
  const homeIndex = argv.indexOf("--home");
  const appHome = homeIndex === -1 ? path.join(os.homedir(), ".config/herdr-app") : path.resolve(argv[homeIndex + 1]!);
  try {
    const runtime = JSON.parse(await fs.readFile(path.join(appHome, "mods/shared-context/.runtime.json"), "utf8"));
    if (typeof runtime.path === "string" && runtime.path) process.env.PATH = runtime.path;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const state = path.join(appHome, "data/shared-context-bridge");
  await fs.mkdir(state, { recursive: true, mode: 0o700 });
  const descriptor = path.join(state, "connection.json"), lock = path.join(state, "server.lock");
  if (argv.includes("--stop")) {
    if (!await alive(descriptor)) return;
    const info = JSON.parse(await fs.readFile(descriptor, "utf8"));
    const health = await (await fetch(`${info.url}/health`, { headers: { authorization: `Bearer ${info.token}` } })).json();
    if (!Number.isInteger(info.pid) || health.pid !== info.pid) throw new Error("The service identity changed. Do not stop an unknown process.");
    if (health.active) throw new Error("The context service is busy. Install again after the current operation finishes.");
    process.kill(info.pid, "SIGTERM");
    for (let attempt = 0; attempt < 30; attempt++) {
      await Bun.sleep(100);
      try { if (await fs.readFile(lock, "utf8") !== String(info.pid)) return; }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw error; }
    }
    throw new Error("The context service did not stop.");
  }
  if (argv.includes("--start")) {
    if (await alive(descriptor)) return;
    const log = await fs.open(path.join(state, "service.log"), "a", 0o600);
    const child = Bun.spawn([process.execPath, import.meta.filename, "--serve", "--home", appHome], { env: process.env, stdin: "ignore", stdout: log.fd, stderr: log.fd, detached: true });
    child.unref();
    await log.close();
    for (let attempt = 0; attempt < 50; attempt++) {
      await Bun.sleep(100);
      if (await alive(descriptor)) return;
    }
    throw new Error(`The context service did not start. Read ${path.join(state, "service.log")}.`);
  }
  if (!argv.includes("--serve")) throw new Error("Use --start or --serve.");
  try { await fs.writeFile(lock, String(process.pid), { flag: "wx", mode: 0o600 }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const pid = Number(await fs.readFile(lock, "utf8"));
    try { process.kill(pid, 0); return; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error; }
    await fs.unlink(lock);
    await fs.writeFile(lock, String(process.pid), { flag: "wx", mode: 0o600 });
  }
  const token = randomBytes(32).toString("hex");
  let lastUse = Date.now(), active = 0;
  const server = Bun.serve({
    hostname: "127.0.0.1", port: 0, idleTimeout: 120,
    async fetch(req) {
      const url = new URL(req.url);
      if (req.headers.get("host") !== `127.0.0.1:${server.port}` || req.headers.get("authorization") !== `Bearer ${token}` || req.headers.has("origin")) return new Response("Forbidden", { status: 403 });
      lastUse = Date.now();
      if (url.pathname === "/health" && req.method === "GET") return Response.json({ ok: true, pid: process.pid, active });
      if (url.pathname !== "/request" || req.method !== "POST" || req.headers.get("content-type") !== "application/json") return new Response("Not found", { status: 404 });
      active++;
      try { return Response.json({ data: await request(await req.json()) }); }
      catch (error) { return Response.json({ error: message(error) }, { status: 400 }); }
      finally { active--; lastUse = Date.now(); }
    },
  });
  await fs.writeFile(descriptor, JSON.stringify({ url: `http://127.0.0.1:${server.port}`, token, pid: process.pid }), { mode: 0o600 });
  async function stop() {
    server.stop();
    await fs.unlink(descriptor).catch(() => { });
    await fs.unlink(lock).catch(() => { });
    process.exit(0);
  }
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
  setInterval(() => { if (!active && Date.now() - lastUse > 300_000) void stop(); }, 60_000);
}

async function alive(descriptor: string): Promise<boolean> {
  try {
    const { url, token } = JSON.parse(await fs.readFile(descriptor, "utf8"));
    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(url)) return false;
    return (await fetch(`${url}/health`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(1000) })).ok;
  } catch { return false; }
}

if (import.meta.main) main().catch(error => { console.error(message(error)); process.exitCode = 1; });
