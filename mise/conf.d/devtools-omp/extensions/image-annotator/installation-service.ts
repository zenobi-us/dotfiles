// Public downloads carry no authority. Only trusted local output supplies install digests.
import { createHash, X509Certificate } from "node:crypto";
import { mkdir, readFile, writeFile, lstat } from "node:fs/promises";
import { createServer as httpServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { createServer as httpsServer } from "node:https";
import { networkInterfaces, homedir, hostname } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AddressInfo } from "node:net";
import { loadCoordinatorIdentity } from "./server-identity";

export const installationProtocol = 2;
export const setupPort = Number(process.env.PI_INK_SETUP_PORT ?? 47840);
export const securePort = Number(process.env.PI_INK_TLS_PORT ?? 47841);
if (![setupPort, securePort].every(p => Number.isInteger(p) && p > 0 && p <= 65535) || setupPort === securePort) throw new Error("Pi Ink setup and TLS ports must be distinct integers from 1 to 65535.");
const source = dirname(fileURLToPath(import.meta.url));
export const serviceDirectory = () => resolve(process.env.XDG_DATA_HOME || join(homedir(), ".local/share"), "pi-ink-bridge");
export const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

export async function startInstallationService(directory = serviceDirectory(), port = setupPort, tlsPort = securePort) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const permissions = await lstat(directory);
  if (!permissions.isDirectory() || permissions.isSymbolicLink() || (permissions.mode & 0o077)) throw new Error("Service data directory must be private (0700) and not a symlink.");
  const id = await loadCoordinatorIdentity(directory);
  const certificatePath = join(directory, "certificate.pem");
  const keyPath = join(directory, "key.pem");
  const addresses = Object.values(networkInterfaces()).flat().filter(a => a?.family === "IPv4" && !a.internal).map(a => a!.address);
  if (!addresses.length) throw new Error("No LAN IPv4 address. Connect the desktop to the LAN before adding a device.");
  // Existing identity is never silently rotated when addresses or hostnames change.
  const certificateExists = await lstat(certificatePath).catch(e => { if (e.code !== "ENOENT") throw e; return undefined; });
  const keyExists = await lstat(keyPath).catch(e => { if (e.code !== "ENOENT") throw e; return undefined; });
  if (Boolean(certificateExists) !== Boolean(keyExists)) throw new Error("Incomplete service TLS identity. Preserve existing files and repair them; setup will not replace a key.");
  if (certificateExists && (!certificateExists.isFile() || certificateExists.isSymbolicLink() || !keyExists?.isFile() || keyExists.isSymbolicLink() || (keyExists.mode & 0o077))) throw new Error("Service TLS files must be regular files; the private key must have mode 0600.");
  if (!certificateExists) {
    const altNames = ["IP:127.0.0.1", ...addresses.map(a => `IP:${a}`), `DNS:${hostname()}`].join(",");
    const process = Bun.spawn(["openssl", "req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:P-256", "-nodes", "-days", "3650", "-subj", `/CN=Pi Ink ${id}`, "-addext", `subjectAltName=${altNames}`, "-keyout", keyPath, "-out", certificatePath], { stdout: "ignore", stderr: "pipe" });
    if (await process.exited !== 0) throw new Error("Cannot generate service TLS identity. Check OpenSSL.");
  }
  const [certificate, key, installer, archive] = await Promise.all([
    readFile(certificatePath), readFile(keyPath), readFile(join(source, "tablet-client/production-install.sh")), readFile(join(source, "tablet-client/dist/client.zip")),
  ]);
  const cert = new X509Certificate(certificate);
  if (Date.parse(cert.validTo) <= Date.now()) throw new Error("Service certificate expired. Preserve identity and repair it before setup.");
  const fingerprint = sha256(cert.raw);
  const build = (await readFile(join(source, "build-id"), "utf8").catch(e => { if (e.code !== "ENOENT") throw e; return "development"; })).trim();
  const health = { service: "pi-ink-bridge", protocol: installationProtocol, id, fingerprint, build, status: "ready" };
  const files: Record<string, { bytes: Buffer; type: string }> = {
    "/tablet/install.sh": { bytes: installer, type: "text/plain" },
    "/tablet/client.zip": { bytes: archive, type: "application/zip" },
  };
  const hosts = new Set<string>();
  let installation = "";
  const publicPage = setupPage(false);
  let localPage = "";
  const serve = (request: IncomingMessage, response: ServerResponse) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'");
    if (!hosts.has(request.headers.host || "") || request.headers.origin) { response.writeHead(403).end(); return; }
    if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405).end(); return; }
    const path = request.url?.split("?")[0];
    const local = ["127.0.0.1", "::ffff:127.0.0.1", "::1"].includes(request.socket.remoteAddress || "") && [`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host || "");
    let bytes: Buffer;
    let type: string;
    if (path === "/health") { bytes = Buffer.from(JSON.stringify(health)); type = "application/json"; }
    else if (path === "/setup") { bytes = Buffer.from(local ? localPage : publicPage); type = "text/html; charset=utf-8"; }
    else if (path === "/instructions" && local) { bytes = Buffer.from(JSON.stringify({ ...health, setupUrl: `http://${addresses[0]}:${port}/setup`, command: installation })); type = "application/json"; }
    else if (path && files[path]) { ({ bytes, type } = files[path]); }
    else { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": type, "Content-Length": bytes.length });
    response.end(request.method === "HEAD" ? undefined : bytes);
  };
  const secure = httpsServer({ cert: certificate, key, minVersion: "TLSv1.2" }, (request, response) => {
    if (request.method !== "GET" || request.url !== "/health" || request.headers.origin) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(health));
  });
  const publicServer = httpServer(serve);
  for (const server of [secure, publicServer]) { server.requestTimeout = 15_000; server.headersTimeout = 10_000; }
  const listen = (server: Server, p: number) => {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    server.once("error", reject);
    server.listen(p, "0.0.0.0", () => { server.off("error", reject); resolve(); });
    return promise;
  };
  await listen(secure, tlsPort);
  try { await listen(publicServer, port); } catch (e) { secure.close(); throw e; }
  port = (publicServer.address() as AddressInfo).port;
  tlsPort = (secure.address() as AddressInfo).port;
  const bootstrap = Buffer.from(JSON.stringify({ serverId: id, name: "Pi Ink", origin: `https://${addresses[0]}:${tlsPort}`, certificate: certificate.toString(), fingerprint }));
  files["/tablet/server.json"] = { bytes: bootstrap, type: "application/json" };
  for (const host of [`127.0.0.1:${port}`, `localhost:${port}`, ...addresses.map(a => `${a}:${port}`)]) hosts.add(host);
  installation = installationInstructions(`http://${addresses[0]}:${port}`, sha256(installer), sha256(archive), sha256(bootstrap));
  localPage = setupPage(true, installation, fingerprint);
  return {
    health, port, tlsPort, close: async () => {
      await Promise.all([secure, publicServer].map(s => {
        const { promise, resolve } = Promise.withResolvers<void>();
        s.close(() => resolve());
        s.closeAllConnections();
        return promise;
      }));
    }
  };
}

export function installationInstructions(base: string, installerHash: string, archiveHash: string, bootstrapHash: string): string {
  const script = `set -eu; umask 077; work=$(mktemp -d /tmp/pi-ink-install.XXXXXX); trap 'rm -rf "$work"' EXIT; cd "$work"; curl --fail --silent --show-error --max-time 120 '${base}/tablet/install.sh' -o install.sh; printf '%s  install.sh\\n' '${installerHash}' | sha256sum -c -; curl --fail --silent --show-error --max-time 120 '${base}/tablet/client.zip' -o client.zip; printf '%s  client.zip\\n' '${archiveHash}' | sha256sum -c -; curl --fail --silent --show-error --max-time 120 '${base}/tablet/server.json' -o server.json; printf '%s  server.json\\n' '${bootstrapHash}' | sha256sum -c -; sh ./install.sh '${archiveHash}' '${bootstrapHash}'`;
  return `ssh -o StrictHostKeyChecking=yes root@10.11.99.1 ${shellQuote(script)}`;
}
function shellQuote(text: string): string { return "'" + text.replaceAll("'", "'\\''") + "'"; }
function escape(text: string): string { return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function setupPage(local: boolean, command = "", fingerprint = ""): string {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pi Annotations setup</title><style>body{font:18px/1.6 system-ui;max-width:780px;margin:3rem auto;padding:0 1.2rem;color:#202020}h1{line-height:1.2}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:1rem;border:1px solid #aaa;background:#f5f5f5}aside{border-left:4px solid #555;padding:0 1rem}</style><main><h1>Pi Annotations setup</h1><aside><h2>Before installation</h2><p>Paper Pro Developer Mode is required. Enabling Developer Mode performs a factory reset and weakens secure-boot protections. Back up your documents first. This installer never enables Developer Mode or upgrades firmware.</p></aside><h2>Compatibility</h2><p>Only Paper Pro firmware 3.28.0.172 is supported. The production AppLoad launch still requires owner-approved hardware acceptance. Existing XOVI, qt-resource-rebuilder, and AppLoad must be installed. Unsupported devices stop before changes.</p><h2>Trusted installation</h2><p>Use cable-connected SSH for this one-time installation only. Verify the SSH host key independently. The tablet must reach this desktop through Wi-Fi. A shared Wi-Fi name does not guarantee reachability. No firewall rules are changed.</p>${local ? `<p>Copy this command from this trusted loopback page or extension output. It verifies the installer, ZIP, and server identity before execution or extraction.</p><pre>${escape(command)}</pre><p>Server certificate SHA-256:</p><pre>${fingerprint}</pre>` : `<p>This LAN page is not a trust anchor. Run /annotate add-device on the trusted desktop to obtain the command and expected digests. Do not use checksums fetched beside HTTP downloads.</p>`}<h2>Activation</h2><p>The installer preserves existing drafts, pairing records, and unrelated extensions. After installation, save and close documents. Obtain owner approval before restarting Xochitl or rebooting. Open Pi Annotations in the sidebar after that restart and check its connection screen. Installation output alone does not prove launch.</p></main></html>`;
}
if (import.meta.main) {
  process.umask(0o077);
  const [directory, httpPort, httpsPort] = process.argv.slice(2);
  const ports = [Number(httpPort ?? setupPort), Number(httpsPort ?? securePort)];
  if (!ports.every(p => Number.isInteger(p) && p > 0 && p <= 65535) || ports[0] === ports[1]) throw new Error("Invalid service listener ports.");
  await startInstallationService(directory ?? serviceDirectory(), ports[0], ports[1]);
  console.log("Pi Ink installation service ready");
}
