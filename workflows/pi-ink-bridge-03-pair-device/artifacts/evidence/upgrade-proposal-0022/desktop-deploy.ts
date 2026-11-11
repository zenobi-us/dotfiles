import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, readdir, rename, rmdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHash, X509Certificate } from "node:crypto";
import { request } from "node:https";
import { networkInterfaces } from "node:os";

type Pin = { exists?: boolean; uid?: number; gid?: number; mode?: string; size?: number; device?: number; inode?: number; sha256?: string };
export type Deployment = {
 id: string; directory: string; owner: number; bun: string; pitchfork: string;
 oldPID: number; oldStart: string; oldService: string; oldBuild: string;
 serverID: string; fingerprint: string; httpPort: number; tlsPort: number; lanAddress: string;
 build: string; staging: string; backup: string;
 privateFiles: Record<string, Pin>; oldFiles: Record<string, Pin>;
 payload: Record<string, { source?: string; text?: string; size: number; sha256: string }>;
};
const reject = (code: string): never => { throw new Error(code); };
const missing = async (path: string) => {
 try { await lstat(path); } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return; throw e; }
 reject("occupied_path");
};
async function regular(path: string, owner: number, pin?: Pin): Promise<Buffer> {
 const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
 try {
  const before = await file.stat();
  if (!before.isFile() || before.uid !== owner || (before.mode & 0o777) !== 0o600 || before.size > 16 * 1024 * 1024) reject("file_policy");
  if (pin) for (const [key, actual] of Object.entries({ uid: before.uid, gid: before.gid, mode: (before.mode & 0o777).toString(8), size: before.size, device: before.dev, inode: before.ino })) {
   if (pin[key as keyof Pin] != null && pin[key as keyof Pin] !== actual) reject("file_identity_changed");
  }
  const bytes = await file.readFile();
  const after = await file.stat();
  const named = await lstat(path);
  if (named.isSymbolicLink() || named.dev !== before.dev || named.ino !== before.ino || after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs || bytes.length !== before.size) reject("file_changed_during_read");
  if (pin?.sha256 && createHash("sha256").update(bytes).digest("hex") !== pin.sha256) reject("file_hash_changed");
  return bytes;
 } finally { await file.close(); }
}
async function directory(path: string, owner: number) {
 const info = await lstat(path);
 if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== owner || (info.mode & 0o777) !== 0o700) reject("directory_policy");
 return info;
}
async function writeExclusive(path: string, bytes: Uint8Array) {
 const file = await open(path, "wx", 0o600);
 try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
}
async function command(argv: string[], cwd: string) {
 const child = Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "ignore", timeout: 60000, env: { ...process.env, MISE_AUTO_INSTALL: "0" } });
 const [exit, stdout] = await Promise.all([child.exited, new Response(child.stdout).text()]);
 if (exit !== 0) reject(`supervisor_command_failed_${exit}`);
 return stdout;
}
async function processIdentity(pid: number) {
 const stat = await readFile(`/proc/${pid}/stat`, "utf8");
 const start = stat.slice(stat.lastIndexOf(") ") + 2).trim().split(/\s+/)[19];
 const args = (await readFile(`/proc/${pid}/cmdline`)).toString().split("\0").filter(Boolean);
 return { start, args };
}
async function health(spec: Deployment, build: string) {
 const response = await fetch(`http://127.0.0.1:${spec.httpPort}/health`, { redirect: "error", signal: AbortSignal.timeout(5000) });
 const text = await response.text();
 if (!response.ok || text.length > 4096) reject("health_response");
 const value = JSON.parse(text);
 if (value.service !== "pi-ink-bridge" || value.protocol !== 2 || value.id !== spec.serverID || value.fingerprint !== spec.fingerprint || value.build !== build || value.status !== "ready") reject("health_identity_changed");
}
async function daemon(spec: Deployment) {
 const values = JSON.parse(await command([spec.pitchfork, "list", "--json"], spec.directory));
 const matches = values.filter((value: { id: string }) => value.id === spec.id);
 if (matches.length !== 1) reject("daemon_identity_ambiguous");
 return matches[0] as { id: string; status: string; pid: number };
}
async function verifyPrivate(spec: Deployment) {
 const data = new Map<string, Buffer>();
 for (const [name, pin] of Object.entries(spec.privateFiles)) {
  if (!pin.exists) { await missing(join(spec.directory, name)); continue; }
  data.set(name, await regular(join(spec.directory, name), spec.owner, pin));
 }
 return data;
}
async function negotiate(spec: Deployment, certificate: Buffer) {
 const { promise, resolve: resolveProtocol, reject: rejectProtocol } = Promise.withResolvers<void>();
 const req = request(`https://127.0.0.1:${spec.tlsPort}/protocol`, { method: "POST", ca: certificate, timeout: 5000, headers: { "content-type": "application/json" } }, res => {
  const chunks: Buffer[] = []; let size = 0;
  res.on("data", (chunk: Buffer) => { size += chunk.length; if (size > 4096) res.destroy(new Error("protocol_response_limit")); else chunks.push(chunk); });
  res.on("error", rejectProtocol);
  res.on("end", () => {
   try { const body = JSON.parse(Buffer.concat(chunks).toString()); if (res.statusCode !== 200 || body.serverId !== spec.serverID || body.protocol !== 1) reject("protocol_rejected"); resolveProtocol(); } catch { rejectProtocol(new Error("protocol_rejected")); }
  });
 });
 req.on("error", () => rejectProtocol(new Error("verified_TLS_protocol_failed")));
 req.on("timeout", () => req.destroy(new Error("protocol_timeout")));
 req.end(JSON.stringify({ serverId: spec.serverID, role: "extension", versions: [1] }));
 await promise;
}
export async function deploy(spec: Deployment) {
 process.umask(0o077);
 await directory(spec.directory, spec.owner);
 await directory(join(spec.directory, "runtimes"), spec.owner);
 const runtime = join(spec.directory, "runtimes", spec.build);
 if (dirname(spec.staging) !== join(spec.directory, "runtimes") || dirname(spec.backup) !== spec.directory || !/^[a-f0-9]{64}$/.test(spec.build)) reject("deployment_paths");
 for (const path of [runtime, spec.staging, spec.backup, join(spec.directory, "startup.lock")]) await missing(path);
 const current = await daemon(spec);
 const old = await processIdentity(spec.oldPID);
 if (current.status !== "running" || current.pid !== spec.oldPID || old.start !== spec.oldStart || JSON.stringify(old.args) !== JSON.stringify([spec.bun, spec.oldService, spec.directory, String(spec.httpPort), String(spec.tlsPort)])) reject("old_process_changed");
 await health(spec, spec.oldBuild);
 const privateBytes = await verifyPrivate(spec);
 if (Object.keys(spec.privateFiles).sort().join("|") !== "certificate.pem|coordinator-id|devices.json|key.pem") reject("private_file_allowlist");
 const certificate = privateBytes.get("certificate.pem") ?? reject("certificate_missing");
 const cert = new X509Certificate(certificate);
 if (privateBytes.get("coordinator-id")?.toString().trim() !== spec.serverID || createHash("sha256").update(cert.raw).digest("hex") !== spec.fingerprint || Date.parse(cert.validFrom) > Date.now() || Date.parse(cert.validTo) <= Date.now() || cert.checkIP(spec.lanAddress) !== spec.lanAddress || cert.checkIP("127.0.0.1") !== "127.0.0.1") reject("preserved_identity_mismatch");
 if (!Object.values(networkInterfaces()).flat().some(address => address?.family === "IPv4" && address.address === spec.lanAddress)) reject("LAN_address_changed");
 for (const [name, pin] of Object.entries(spec.oldFiles)) await regular(join(dirname(spec.oldService), name), spec.owner, pin);
 const expectedNames = ["build-id", "service.js", "tablet-client/dist/client.zip", "tablet-client/production-install.sh"];
 if (Object.keys(spec.payload).sort().join("|") !== expectedNames.sort().join("|")) reject("payload_members");
 const payload = new Map<string, Buffer>();
 for (const [name, pin] of Object.entries(spec.payload)) {
  const bytes = pin.source ? await readFile(pin.source) : Buffer.from(pin.text ?? "");
  if (bytes.length !== pin.size || createHash("sha256").update(bytes).digest("hex") !== pin.sha256) reject("payload_hash_changed");
  payload.set(name, bytes);
 }
 const actualBuild = createHash("sha256").update(payload.get("service.js")!).update(payload.get("tablet-client/dist/client.zip")!).update(payload.get("tablet-client/production-install.sh")!).digest("hex");
 if (actualBuild !== spec.build || payload.get("build-id")!.toString() !== spec.build) reject("runtime_build_mismatch");
 const lock = join(spec.directory, "startup.lock");
 await mkdir(lock, { mode: 0o700 });
 const lockID = await directory(lock, spec.owner);
 // Failures preserve the new lock, backup and runtimes; never guess a rollback.
 await mkdir(spec.backup, { mode: 0o700 });
 for (const [name, bytes] of privateBytes) await writeExclusive(join(spec.backup, name), bytes);
 await mkdir(spec.staging, { mode: 0o700 });
 await mkdir(join(spec.staging, "tablet-client"), { mode: 0o700 });
 await mkdir(join(spec.staging, "tablet-client/dist"), { mode: 0o700 });
 for (const [name, bytes] of payload) await writeExclusive(join(spec.staging, name), bytes);
 const stageID = await directory(spec.staging, spec.owner);
 await missing(runtime);
 await rename(spec.staging, runtime);
 const runtimeID = await directory(runtime, spec.owner);
 if (runtimeID.dev !== stageID.dev || runtimeID.ino !== stageID.ino) reject("runtime_publish_identity");
 if ((await readdir(runtime)).sort().join("|") !== "build-id|service.js|tablet-client") reject("runtime_foreign_entry");
 for (const [name, pin] of Object.entries(spec.payload)) await regular(join(runtime, name), spec.owner, { sha256: pin.sha256, size: pin.size });
 const again = await daemon(spec); const generation = await processIdentity(spec.oldPID);
 if (again.pid !== spec.oldPID || again.status !== "running" || generation.start !== spec.oldStart) reject("old_process_changed_before_stop");
 await verifyPrivate(spec); await health(spec, spec.oldBuild);
 await command([spec.pitchfork, "stop", spec.id], spec.directory);
 const stopped = await daemon(spec);
 if (stopped.pid || !["stopped", "completed"].includes(stopped.status)) reject("daemon_not_stopped");
 await verifyPrivate(spec);
 await command([spec.pitchfork, "run", spec.id, "--retry", "0", "--http", `http://127.0.0.1:${spec.httpPort}/health`, "--", spec.bun, join(runtime, "service.js"), spec.directory, String(spec.httpPort), String(spec.tlsPort)], spec.directory);
 await health(spec, spec.build);
 await negotiate(spec, privateBytes.get("certificate.pem") ?? reject("certificate_missing"));
 await verifyPrivate(spec);
 for (const [name, pin] of Object.entries(spec.oldFiles)) await regular(join(dirname(spec.oldService), name), spec.owner, pin);
 const ready = await daemon(spec); const fresh = await processIdentity(ready.pid);
 if (ready.status !== "running" || JSON.stringify(fresh.args) !== JSON.stringify([spec.bun, join(runtime, "service.js"), spec.directory, String(spec.httpPort), String(spec.tlsPort)])) reject("new_process_identity");
 const actualLock = await directory(lock, spec.owner);
 if (actualLock.dev !== lockID.dev || actualLock.ino !== lockID.ino) reject("startup_lock_replaced");
 await rmdir(lock);
 return { status: "ready", build: spec.build, PID: ready.pid, start_ticks: fresh.start, server_identity_preserved: true, private_files_preserved: true, protocol: 1, rollback_performed: false };
}
