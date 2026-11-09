// All extension instances use one user-owned runtime directory and Pitchfork daemon ID.
import { mkdir, readFile, writeFile, rename, rm, lstat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { X509Certificate } from "node:crypto";
import { fileURLToPath } from "node:url";
import { installationProtocol, serviceDirectory, setupPort, securePort, sha256 } from "./installation-service";

export async function addDevice(extensionDirectory: string): Promise<string> {
  const directory = serviceDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink() || (info.mode & 0o077)) throw new Error("Pi Ink service storage must be a private 0700 directory, not a symlink.");
  const lock = join(directory, "startup.lock");
  let locked = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    try { await mkdir(lock, { mode: 0o700 }); locked = true; break; }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e; }
    await Bun.sleep(200);
  }
  if (!locked) throw new Error("Pi Ink startup is busy. Inspect startup.lock and the Pitchfork service before retrying; no existing process was stopped.");
  try {
    const tools = await run(["mise", "exec", "bun@1.4.3", "--", "bun", "--version"], extensionDirectory);
    if (tools.trim() !== "1.4.3") throw new Error("Install the pinned image-annotator mise dependencies first.");
    const supervisor = await run(["mise", "exec", "pitchfork@2.30.1", "--", "pitchfork", "--version"], extensionDirectory);
    if (supervisor.trim() !== "pitchfork 2.30.1") throw new Error("Pitchfork 2.30.1 is required. Run mise install in image-annotator.");
    const built = await Bun.build({ entrypoints: [join(extensionDirectory, "installation-service.ts")], target: "bun", minify: false });
    if (!built.success || built.outputs.length !== 1) throw new Error("Cannot build the Pi Ink service. Check the installed extension dependencies.");
    const code = Buffer.from(await built.outputs[0].arrayBuffer());
    const [archive, installer] = await Promise.all([readFile(join(extensionDirectory, "tablet-client/dist/client.zip")), readFile(join(extensionDirectory, "tablet-client/production-install.sh"))]);
    const build = sha256(Buffer.concat([code, archive, installer]));
    const runtime = join(directory, "runtimes", build);
    await mkdir(join(directory, "runtimes"), { recursive: true, mode: 0o700 });
    if (!await lstat(runtime).catch(e => { if (e.code !== "ENOENT") throw e; return undefined; })) {
      const staging = join(directory, "runtimes", `.stage-${process.pid}`);
      await mkdir(join(staging, "tablet-client/dist"), { recursive: true, mode: 0o700 });
      await writeFile(join(staging, "service.js"), code, { mode: 0o600, flag: "wx" });
      await writeFile(join(staging, "build-id"), build, { mode: 0o600, flag: "wx" });
      await writeFile(join(staging, "tablet-client/dist/client.zip"), archive, { mode: 0o600, flag: "wx" });
      await writeFile(join(staging, "tablet-client/production-install.sh"), installer, { mode: 0o600, flag: "wx" });
      await rename(staging, runtime);
    }
    // No force flag: an incompatible live service must be repaired explicitly, never killed by onboarding.
    const bun = (await run(["mise", "which", "bun"], extensionDirectory)).trim();
    const pitchfork = (await run(["mise", "which", "pitchfork"], extensionDirectory)).trim();
    await run([pitchfork, "run", "pi-ink-bridge", "--http", `http://127.0.0.1:${setupPort}/health`, "--", bun, join(runtime, "service.js"), directory, String(setupPort), String(securePort)], directory);
    const response = await fetch(`http://127.0.0.1:${setupPort}/instructions`, { signal: AbortSignal.timeout(5000), redirect: "error" });
    if (!response.ok) throw new Error("Pi Ink did not become ready. Inspect pitchfork logs pi-ink-bridge. No successful setup is available.");
    const ready = await response.json();
    const id = (await readFile(join(directory, "coordinator-id"), "utf8")).trim();
    const cert = new X509Certificate(await readFile(join(directory, "certificate.pem")));
    if (ready.service !== "pi-ink-bridge" || ready.protocol !== installationProtocol || ready.id !== id || ready.fingerprint !== sha256(cert.raw) || ready.build !== build || ready.status !== "ready" || typeof ready.command !== "string" || typeof ready.setupUrl !== "string") throw new Error("Pi Ink service identity or version does not match this extension. Preserve existing data; inspect Pitchfork before repair.");
    return `Pi Annotations setup: ${ready.setupUrl}\nTrusted local instructions: http://127.0.0.1:${setupPort}/setup\nServer ID: ${id}\nCertificate SHA-256: ${ready.fingerprint}\nDeveloper Mode performs a factory reset and weakens secure boot. Back up documents first. Obtain owner approval before device access or restart.\nRun this one-time SSH command only after approval and SSH host-key verification:\n${ready.command}`;
  } finally { await rm(lock, { recursive: true }); }
}

async function run(command: string[], cwd: string): Promise<string> {
  const child = Bun.spawn(command, { cwd: resolve(cwd), env: { ...process.env, MISE_AUTO_INSTALL: "0" }, stdout: "pipe", stderr: "pipe", timeout: 60_000 });
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  if (code !== 0) throw new Error(`Pi Ink setup command failed (${command[0]}): ${stderr.trim() || stdout.trim()}`);
  return stdout;
}

if (import.meta.main) console.log(await addDevice(dirname(fileURLToPath(import.meta.url))));
