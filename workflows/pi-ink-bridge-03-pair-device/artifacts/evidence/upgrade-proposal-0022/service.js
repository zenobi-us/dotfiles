// @bun
// installation-service.ts
import { createHash as createHash2, X509Certificate } from "crypto";
import { mkdir as mkdir2, readFile as readFile3, lstat as lstat3 } from "fs/promises";
import { createServer as httpServer } from "http";
import { createServer as httpsServer } from "https";
import { networkInterfaces, homedir, hostname } from "os";
import { join as join2, resolve as resolve2, dirname } from "path";
import { fileURLToPath } from "url";

// server-identity.ts
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile, lstat } from "fs/promises";
import { resolve } from "path";
async function loadCoordinatorIdentity(directory) {
  await mkdir(directory, { recursive: true, mode: 448 });
  const path = resolve(directory, "coordinator-id");
  let stored;
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.mode & 63)
      throw new Error("Stored server identity must be a private regular file.");
    stored = await readFile(path, "utf8");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT")
      throw error;
    const id = randomBytes(16).toString("hex");
    try {
      await writeFile(path, `${id}
`, { flag: "wx", mode: 384 });
      return id;
    } catch (writeError) {
      if (!(writeError instanceof Error) || !("code" in writeError) || writeError.code !== "EEXIST")
        throw writeError;
      stored = await readFile(path, "utf8");
    }
  }
  const id = stored.trim();
  if (!/^[a-f0-9]{32}$/.test(id))
    throw new Error("Stored server identity is damaged. Preserve the file and repair it before startup.");
  return id;
}

// device-pairing.ts
import { createHash, randomBytes as randomBytes2, randomInt, timingSafeEqual } from "crypto";
import { lstat as lstat2, open, readFile as readFile2, rename } from "fs/promises";
import { join } from "path";
import { WebSocketServer } from "ws";
var deviceProtocol = 1;
var windowMs = 120000;
var maxAttempts = 10;
var idPattern = /^[A-Za-z0-9_-]{16,128}$/;
var secretPattern = /^[a-f0-9]{64}$/;
var secret = () => randomBytes2(32).toString("hex");
var digest = (value) => createHash("sha256").update(value).digest("hex");
var equal = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
var pairingImage = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeElEQVR4nO3ZwQkDMQwAwdP137NTgyBhHZh5C8Hij8DzLJ1zVvMz89P972r6QgJqAmoCagJqAmoCagJqc9t9v93/9y8goCagJqAmoCagJqAmoLY7vv0PfJ+AmoCagJqAmoCagJqAmv+BmoCagJqAmoCagJqAmoDaBxl0GHeUFEvnAAAAAElFTkSuQmCC", "base64");
async function createDevicePairing(directory, serverId, fingerprint, now = Date.now) {
  const path = join(directory, "devices.json");
  let devices = [];
  const info = await lstat2(path).catch((e) => {
    if (e.code !== "ENOENT")
      throw e;
    return;
  });
  if (info) {
    if (!info.isFile() || info.isSymbolicLink() || info.mode & 63)
      throw new Error("Device storage must be a private regular file (0600).");
    devices = JSON.parse(await readFile2(path, "utf8"));
    if (!Array.isArray(devices) || devices.length > 100 || devices.some((d) => !idPattern.test(d.id) || !secretPattern.test(d.credentialHash) || typeof d.revoked !== "boolean") || new Set(devices.map((d) => d.id)).size !== devices.length)
      throw new Error("Invalid device storage. Preserve it and repair manually.");
  }
  let openedUntil = 0;
  let attempts = 0;
  const pending = new Map;
  const csrf = secret();
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const connections = new Map;
  let mutations = Promise.resolve();
  const mutate = (operation) => {
    const result = mutations.then(operation);
    mutations = result.catch(() => {});
    return result;
  };
  const persist = async (next) => {
    const temp = `${path}.${secret()}.tmp`;
    const file = await open(temp, "wx", 384);
    try {
      await file.writeFile(JSON.stringify(next));
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temp, path);
    const parent = await open(directory, "r");
    try {
      await parent.sync();
    } finally {
      await parent.close();
    }
    devices = next;
  };
  const protocol = (request) => request.headers["x-pi-ink-protocol"] === String(deviceProtocol) && request.headers["x-pi-ink-server"] === serverId;
  const authenticate = (request) => {
    if (!protocol(request) || request.headers.origin)
      return;
    const id = request.headers["x-pi-ink-device"];
    const authorization = request.headers.authorization ?? "";
    if (typeof id !== "string" || !authorization.startsWith("Bearer ") || !secretPattern.test(authorization.slice(7)))
      return;
    return devices.find((d) => d.id === id && !d.revoked && equal(d.credentialHash, digest(authorization.slice(7))));
  };
  const state = () => ({
    serverId,
    fingerprint,
    protocol: deviceProtocol,
    openedUntil,
    attemptsRemaining: Math.max(0, maxAttempts - attempts),
    csrf,
    requests: [...pending.values()].map((p) => ({ id: p.id, deviceId: p.deviceId, code: p.code, expires: p.expires, status: p.expires <= now() ? "expired" : p.status })),
    devices: devices.map((d) => ({ id: d.id, revoked: d.revoked, connected: [...connections.values()].includes(d.id) }))
  });
  return {
    attach(server) {
      server.on("upgrade", (request, socket, head) => {
        const device = authenticate(request);
        if (request.url !== "/tablet/v1/events" || !device) {
          socket.end(`HTTP/1.1 401 Unauthorized\r
Connection: close\r
\r
`);
          return;
        }
        sockets.handleUpgrade(request, socket, head, (connection) => {
          connections.set(connection, device.id);
          connection.on("close", () => connections.delete(connection));
          connection.on("error", () => {});
          connection.on("message", (bytes) => {
            try {
              if (JSON.parse(bytes.toString()).type !== "ready" || device.revoked || !devices.some((d) => d.id === device.id && !d.revoked && d.credentialHash === device.credentialHash))
                connection.close(1008, "Device rejected");
              else
                connection.send(JSON.stringify({ type: "ready", serverId, protocol: deviceProtocol, deviceId: device.id }));
            } catch {
              connection.close(1008, "Invalid message");
            }
          });
          connection.send(JSON.stringify({ type: "paired", serverId, protocol: deviceProtocol, deviceId: device.id }));
        });
      });
    },
    async secure(request, response) {
      if (request.headers.origin || request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "none") {
        json(response, 403, { error: "Browser requests refused" });
        return;
      }
      if (request.url === "/protocol" && request.method === "POST") {
        const data = await objectBody(request);
        if (data.serverId !== serverId || !["tablet", "extension"].includes(data.role) || !Array.isArray(data.versions) || !data.versions.includes(deviceProtocol)) {
          json(response, 426, { error: "Incompatible server or protocol", versions: [deviceProtocol] });
          return;
        }
        json(response, 200, { serverId, protocol: deviceProtocol });
        return;
      }
      if (!protocol(request)) {
        json(response, 426, { error: "Server identity and supported protocol required", versions: [deviceProtocol] });
        return;
      }
      if (request.url === "/tablet/v1/pair" && request.method === "POST") {
        if (now() >= openedUntil || attempts >= maxAttempts) {
          json(response, 429, { error: "Open a new pairing window on the desktop" });
          return;
        }
        attempts++;
        const data = await objectBody(request);
        if (typeof data.deviceId !== "string" || !idPattern.test(data.deviceId) || typeof data.requestSecret !== "string" || !secretPattern.test(data.requestSecret) || devices.some((d) => d.id === data.deviceId && !d.revoked)) {
          json(response, 403, { error: "Pairing request rejected" });
          return;
        }
        const existing = [...pending.values()].find((p) => p.deviceId === data.deviceId && p.requestHash === digest(data.requestSecret));
        const pair = existing ?? { id: secret(), deviceId: data.deviceId, requestHash: digest(data.requestSecret), code: String(randomInt(0, 1e6)).padStart(6, "0"), expires: openedUntil, status: "pending" };
        pending.set(pair.id, pair);
        json(response, 202, { serverId, pairingId: pair.id, code: pair.code, expires: pair.expires });
        return;
      }
      if (request.url === "/tablet/v1/pair/status" && request.method === "POST") {
        const data = await objectBody(request);
        const pair = typeof data.pairingId === "string" ? pending.get(data.pairingId) : undefined;
        if (!pair || typeof data.requestSecret !== "string" || !equal(pair.requestHash, digest(data.requestSecret)) || data.deviceId !== pair.deviceId) {
          json(response, 403, { error: "Pairing request rejected" });
          return;
        }
        if (now() >= pair.expires) {
          json(response, 410, { status: "expired" });
          return;
        }
        json(response, pair.status === "denied" ? 403 : 200, { serverId, status: pair.status, credential: pair.status === "approved" ? pair.credential : undefined });
        return;
      }
      const device = authenticate(request);
      if (!device) {
        json(response, 401, { error: "Approved device credential required" });
        return;
      }
      if (request.url === "/tablet/v1/pairing-image" && request.method === "GET") {
        response.writeHead(200, { "Content-Type": "image/png", "Content-Length": pairingImage.length, "Cache-Control": "no-store" }).end(pairingImage);
        return;
      }
      json(response, 404, { error: "Not found" });
    },
    async manage(request, response, port) {
      const host = request.headers.host ?? "";
      const origin = `http://${host}`;
      if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "") || ![`127.0.0.1:${port}`, `localhost:${port}`].includes(host) || request.headers.origin && request.headers.origin !== origin || request.headers["sec-fetch-site"] && !["none", "same-origin"].includes(request.headers["sec-fetch-site"])) {
        json(response, 403, { error: "Local management required" });
        return;
      }
      if (request.method === "GET" && request.url === "/management/state") {
        json(response, 200, state());
        return;
      }
      if (request.method === "GET" && request.url === "/manage") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(page(state(), now()));
        return;
      }
      if (request.method !== "POST" || request.headers.origin !== origin || request.headers["content-type"] !== "application/x-www-form-urlencoded") {
        json(response, 403, { error: "Same-origin form required" });
        return;
      }
      const form = new URLSearchParams((await body(request)).toString());
      if (!equal(form.get("csrf") ?? "", csrf)) {
        json(response, 403, { error: "Management form expired" });
        return;
      }
      await mutate(async () => {
        if (request.url === "/management/open") {
          if (now() < openedUntil) {
            json(response, 409, { error: "Current window is still open" });
            return;
          }
          openedUntil = now() + windowMs;
          attempts = 0;
          pending.clear();
        } else if (request.url === "/management/approve" || request.url === "/management/deny") {
          const pair = pending.get(form.get("id") ?? "");
          if (!pair || pair.status !== "pending" || now() >= pair.expires) {
            json(response, 409, { error: "Pairing request is no longer pending" });
            return;
          }
          if (request.url.endsWith("deny"))
            pair.status = "denied";
          else {
            if (form.get("code") !== pair.code || devices.filter((d) => d.id !== pair.deviceId).length >= 100) {
              json(response, 403, { error: "Compare the tablet code before approval" });
              return;
            }
            const credential = secret();
            await persist([...devices.filter((d) => d.id !== pair.deviceId), { id: pair.deviceId, credentialHash: digest(credential), revoked: false }]);
            pair.credential = credential;
            pair.status = "approved";
          }
        } else if (request.url === "/management/revoke") {
          const id = form.get("id");
          if (!devices.some((d) => d.id === id)) {
            json(response, 404, { error: "Unknown device" });
            return;
          }
          await persist(devices.map((d) => d.id === id ? { ...d, revoked: true } : d));
          for (const [socket, deviceId] of connections)
            if (deviceId === id)
              socket.terminate();
          for (const pair of pending.values())
            if (pair.deviceId === id) {
              pair.status = "denied";
              delete pair.credential;
            }
        } else {
          json(response, 404, { error: "Not found" });
          return;
        }
        response.writeHead(303, { Location: "/manage" }).end();
      });
    },
    close() {
      for (const socket of connections.keys())
        socket.terminate();
      sockets.close();
    }
  };
}
function json(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(value));
}
async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096)
      throw new Error("Request exceeds limit");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
async function objectBody(request) {
  const value = JSON.parse((await body(request)).toString());
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("JSON object required");
  return value;
}
var escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
function page(state, now) {
  const form = (action, label, id = "") => `<form method="post" action="/management/${action}"><input type="hidden" name="csrf" value="${state.csrf}"><input type="hidden" name="id" value="${id}">${action === "approve" ? '<label>Code shown on tablet <input name="code" inputmode="numeric" pattern="[0-9]{6}" required autocomplete="off"></label>' : ""}<button>${label}</button></form>`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pi Annotations devices</title><style>body{font:18px/1.5 system-ui;max-width:800px;margin:2rem auto;padding:1rem}code{overflow-wrap:anywhere}button,input{font:inherit;padding:.6rem;margin:.4rem}section{border-top:1px solid;padding:1rem 0}</style><main><h1>Pair and revoke a tablet</h1><p>Server ID: <code>${escape(state.serverId)}</code></p><p>Trusted certificate SHA-256: <code>${state.fingerprint}</code></p><p>Enter this fingerprint on the tablet from this local page or trusted extension output. Never copy trust from the LAN setup page.</p><p>Pairing window: ${state.openedUntil > now ? `open until ${new Date(state.openedUntil).toISOString()}` : "closed"}. At most ${maxAttempts} attempts per window.</p>${form("open", "Open pairing for two minutes")}<p><a href="/manage">Refresh pairing and connection state</a></p><h2>Pairing requests</h2>${state.requests.map((p) => `<section><p>Device: <code>${escape(p.deviceId)}</code></p><p>Compare code: <strong>${p.code}</strong>. Status: ${p.status}.</p>${p.status === "pending" ? form("approve", "Approve matching tablet", p.id) + form("deny", "Deny", p.id) : ""}</section>`).join("") || "<p>No requests.</p>"}<h2>Devices</h2>${state.devices.map((d) => `<section><p><code>${escape(d.id)}</code>: ${d.revoked ? "revoked" : d.connected ? "connected" : "paired, offline"}</p>${d.revoked ? "" : form("revoke", "Revoke and disconnect", d.id)}</section>`).join("") || "<p>No devices.</p>"}</main></html>`;
}

// installation-service.ts
var installationProtocol = 2;
var setupPort = Number(process.env.PI_INK_SETUP_PORT ?? 47840);
var securePort = Number(process.env.PI_INK_TLS_PORT ?? 47841);
if (![setupPort, securePort].every((p) => Number.isInteger(p) && p > 0 && p <= 65535) || setupPort === securePort)
  throw new Error("Pi Ink setup and TLS ports must be distinct integers from 1 to 65535.");
var source = dirname(fileURLToPath(import.meta.url));
var serviceDirectory = () => resolve2(process.env.XDG_DATA_HOME || join2(homedir(), ".local/share"), "pi-ink-bridge");
var sha256 = (bytes) => createHash2("sha256").update(bytes).digest("hex");
async function startInstallationService(directory = serviceDirectory(), port = setupPort, tlsPort = securePort, pairingNow = Date.now) {
  await mkdir2(directory, { recursive: true, mode: 448 });
  const permissions = await lstat3(directory);
  if (!permissions.isDirectory() || permissions.isSymbolicLink() || permissions.mode & 63)
    throw new Error("Service data directory must be private (0700) and not a symlink.");
  const id = await loadCoordinatorIdentity(directory);
  const certificatePath = join2(directory, "certificate.pem");
  const keyPath = join2(directory, "key.pem");
  const addresses = Object.values(networkInterfaces()).flat().filter((a) => a?.family === "IPv4" && !a.internal).map((a) => a.address);
  if (!addresses.length)
    throw new Error("No LAN IPv4 address. Connect the desktop to the LAN before adding a device.");
  const certificateExists = await lstat3(certificatePath).catch((e) => {
    if (e.code !== "ENOENT")
      throw e;
    return;
  });
  const keyExists = await lstat3(keyPath).catch((e) => {
    if (e.code !== "ENOENT")
      throw e;
    return;
  });
  if (Boolean(certificateExists) !== Boolean(keyExists))
    throw new Error("Incomplete service TLS identity. Preserve existing files and repair them; setup will not replace a key.");
  if (certificateExists && (!certificateExists.isFile() || certificateExists.isSymbolicLink() || !keyExists?.isFile() || keyExists.isSymbolicLink() || keyExists.mode & 63))
    throw new Error("Service TLS files must be regular files; the private key must have mode 0600.");
  if (!certificateExists) {
    const altNames = ["IP:127.0.0.1", ...addresses.map((a) => `IP:${a}`), `DNS:${hostname()}`].join(",");
    const process2 = Bun.spawn(["openssl", "req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:P-256", "-nodes", "-days", "3650", "-subj", `/CN=Pi Ink ${id}`, "-addext", `subjectAltName=${altNames}`, "-keyout", keyPath, "-out", certificatePath], { stdout: "ignore", stderr: "pipe" });
    if (await process2.exited !== 0)
      throw new Error("Cannot generate service TLS identity. Check OpenSSL.");
  }
  const [certificate, key, installer, archive] = await Promise.all([
    readFile3(certificatePath),
    readFile3(keyPath),
    readFile3(join2(source, "tablet-client/production-install.sh")),
    readFile3(join2(source, "tablet-client/dist/client.zip"))
  ]);
  const cert = new X509Certificate(certificate);
  if (Date.parse(cert.validTo) <= Date.now())
    throw new Error("Service certificate expired. Preserve identity and repair it before setup.");
  const fingerprint = sha256(cert.raw);
  const build = (await readFile3(join2(source, "build-id"), "utf8").catch((e) => {
    if (e.code !== "ENOENT")
      throw e;
    return "development";
  })).trim();
  const health = { service: "pi-ink-bridge", protocol: installationProtocol, id, fingerprint, build, status: "ready" };
  const pairing = await createDevicePairing(directory, id, fingerprint, pairingNow);
  const files = {
    "/tablet/install.sh": { bytes: installer, type: "text/plain" },
    "/tablet/client.zip": { bytes: archive, type: "application/zip" }
  };
  const hosts = new Set;
  let installation = "";
  const publicPage = setupPage(false);
  let localPage = "";
  const serve = (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'");
    if (request.url === "/manage" || request.url?.startsWith("/management/")) {
      pairing.manage(request, response, port).catch(() => {
        if (!response.headersSent)
          response.writeHead(400).end("Management request rejected");
        else
          response.destroy();
      });
      return;
    }
    if (!hosts.has(request.headers.host || "") || request.headers.origin) {
      response.writeHead(403).end();
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405).end();
      return;
    }
    const path = request.url?.split("?")[0];
    const local = ["127.0.0.1", "::ffff:127.0.0.1", "::1"].includes(request.socket.remoteAddress || "") && [`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host || "");
    let bytes;
    let type;
    if (path === "/health") {
      bytes = Buffer.from(JSON.stringify(health));
      type = "application/json";
    } else if (path === "/setup") {
      bytes = Buffer.from(local ? localPage : publicPage);
      type = "text/html; charset=utf-8";
    } else if (path === "/instructions" && local) {
      bytes = Buffer.from(JSON.stringify({ ...health, setupUrl: `http://${addresses[0]}:${port}/setup`, command: installation }));
      type = "application/json";
    } else if (path && files[path]) {
      ({ bytes, type } = files[path]);
    } else {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": type, "Content-Length": bytes.length });
    response.end(request.method === "HEAD" ? undefined : bytes);
  };
  const secure = httpsServer({ cert: certificate, key, minVersion: "TLSv1.2" }, (request, response) => {
    if (request.method === "GET" && request.url === "/health" && !request.headers.origin) {
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(health));
      return;
    }
    pairing.secure(request, response).catch(() => {
      if (!response.headersSent)
        response.writeHead(400).end("Device request rejected");
      else
        response.destroy();
    });
  });
  pairing.attach(secure);
  const publicServer = httpServer(serve);
  for (const server of [secure, publicServer]) {
    server.requestTimeout = 15000;
    server.headersTimeout = 1e4;
  }
  const listen = (server, p) => {
    const { promise, resolve, reject } = Promise.withResolvers();
    server.once("error", reject);
    server.listen(p, "0.0.0.0", () => {
      server.off("error", reject);
      resolve();
    });
    return promise;
  };
  await listen(secure, tlsPort);
  try {
    await listen(publicServer, port);
  } catch (e) {
    secure.close();
    throw e;
  }
  port = publicServer.address().port;
  tlsPort = secure.address().port;
  const bootstrap = Buffer.from(JSON.stringify({ serverId: id, name: "Pi Ink", origin: `https://${addresses[0]}:${tlsPort}`, certificate: certificate.toString(), fingerprint }));
  files["/tablet/server.json"] = { bytes: bootstrap, type: "application/json" };
  for (const host of [`127.0.0.1:${port}`, `localhost:${port}`, ...addresses.map((a) => `${a}:${port}`)])
    hosts.add(host);
  installation = installationInstructions(`http://${addresses[0]}:${port}`, sha256(installer), sha256(archive), sha256(bootstrap));
  localPage = setupPage(true, installation, fingerprint);
  return {
    health,
    port,
    tlsPort,
    close: async () => {
      pairing.close();
      await Promise.all([secure, publicServer].map((s) => {
        const { promise, resolve } = Promise.withResolvers();
        s.close(() => resolve());
        s.closeAllConnections();
        return promise;
      }));
    }
  };
}
function installationInstructions(base, installerHash, archiveHash, bootstrapHash) {
  const script = `set -eu; umask 077; work=$(mktemp -d /tmp/pi-ink-install.XXXXXX); trap 'rm -rf "$work"' EXIT; cd "$work"; curl --fail --silent --show-error --max-time 120 '${base}/tablet/install.sh' -o install.sh; printf '%s  install.sh\\n' '${installerHash}' | sha256sum -c -; curl --fail --silent --show-error --max-time 120 '${base}/tablet/client.zip' -o client.zip; printf '%s  client.zip\\n' '${archiveHash}' | sha256sum -c -; curl --fail --silent --show-error --max-time 120 '${base}/tablet/server.json' -o server.json; printf '%s  server.json\\n' '${bootstrapHash}' | sha256sum -c -; sh ./install.sh '${archiveHash}' '${bootstrapHash}'`;
  return `ssh -o StrictHostKeyChecking=yes root@10.11.99.1 ${shellQuote(script)}`;
}
function shellQuote(text) {
  return "'" + text.replaceAll("'", "'\\''") + "'";
}
function escape2(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function setupPage(local, command = "", fingerprint = "") {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pi Annotations setup</title><style>body{font:18px/1.6 system-ui;max-width:780px;margin:3rem auto;padding:0 1.2rem;color:#202020}h1{line-height:1.2}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:1rem;border:1px solid #aaa;background:#f5f5f5}aside{border-left:4px solid #555;padding:0 1rem}</style><main><h1>Pi Annotations setup</h1><aside><h2>Before installation</h2><p>Paper Pro Developer Mode is required. Enabling Developer Mode performs a factory reset and weakens secure-boot protections. Back up your documents first. This installer never enables Developer Mode or upgrades firmware.</p></aside><h2>Compatibility</h2><p>Only Paper Pro firmware 3.28.0.172 is supported. The production AppLoad launch still requires owner-approved hardware acceptance. Existing XOVI, qt-resource-rebuilder, and AppLoad must be installed. Unsupported devices stop before changes.</p><h2>Trusted installation</h2><p>Use cable-connected SSH for this one-time installation only. Verify the SSH host key independently. The tablet must reach this desktop through Wi-Fi. A shared Wi-Fi name does not guarantee reachability. No firewall rules are changed.</p>${local ? `<p>Copy this command from this trusted loopback page or extension output. It verifies the installer, ZIP, and server identity before execution or extraction.</p><pre>${escape2(command)}</pre><p>Server certificate SHA-256:</p><pre>${fingerprint}</pre>` : `<p>This LAN page is not a trust anchor. Run /annotate add-device on the trusted desktop to obtain the command and expected digests. Do not use checksums fetched beside HTTP downloads.</p>`}<h2>Activation</h2><p>The installer preserves existing drafts, pairing records, and unrelated extensions. After installation, save and close documents. Obtain owner approval before restarting Xochitl or rebooting. Open Pi Annotations in the sidebar after that restart and check its connection screen. Installation output alone does not prove launch.</p></main></html>`;
}
if (import.meta.main) {
  process.umask(63);
  const [directory, httpPort, httpsPort] = process.argv.slice(2);
  const ports = [Number(httpPort ?? setupPort), Number(httpsPort ?? securePort)];
  if (!ports.every((p) => Number.isInteger(p) && p > 0 && p <= 65535) || ports[0] === ports[1])
    throw new Error("Invalid service listener ports.");
  await startInstallationService(directory ?? serviceDirectory(), ports[0], ports[1]);
  console.log("Pi Ink installation service ready");
}
export {
  installationInstructions,
  installationProtocol,
  securePort,
  serviceDirectory,
  setupPort,
  sha256,
  startInstallationService
};
