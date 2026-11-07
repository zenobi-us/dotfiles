// Real TLS, WebSocket, request cancellation and PDF consent boundaries.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm, stat, symlink } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { request as httpsRequest } from "node:https";
import { WebSocket } from "ws";
import { createAnnotationServer, type AnnotationServer, type AnnotatorResult } from "../index";

const exec = promisify(execFile);
let directory: string;
let ca: Buffer;
let source: Buffer;
const servers: AnnotationServer[] = [];
const retained: string[] = [];
const documentUUID = "11111111-1111-4111-8111-111111111111";
const anotherUUID = "22222222-2222-4222-8222-222222222222";
const token = "a".repeat(64);
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "tablet-gateway-"));
  await exec("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1", "-keyout", join(directory, "key.pem"), "-out", join(directory, "cert.pem")]);
  await exec("uv", ["run", "--offline", "--script", join(import.meta.dirname, "pdf-fixtures.py"), directory]);
  ca = await readFile(join(directory, "cert.pem"));
  source = await readFile(join(directory, "source.png"));
});
afterAll(async () => {
  await Promise.all(servers.map(server => server.close()));
  await Promise.all(retained.map(path => rm(path, { recursive: true, force: true })));
  await rm(directory, { recursive: true, force: true });
});
async function setup(serverId: string, paths: { diagnosticsPath?: string; statusPath?: string } = {}) {
  const reservation = createServer();
  await new Promise<void>(resolve => reservation.listen(0, "127.0.0.1", resolve));
  const address = reservation.address();
  if (!address || typeof address === "string") throw new Error("Port reservation failed");
  const port = address.port;
  await new Promise<void>(resolve => reservation.close(() => resolve()));
  const config = join(directory, `${serverId}.json`);
  await writeFile(config, JSON.stringify({
    serverId, name: serverId, address: "127.0.0.1", port,
    certificate: join(directory, "cert.pem"), key: join(directory, "key.pem"), deviceId: "synthetic-tablet", token, ...paths
  }));
  const results: (AnnotatorResult | undefined)[] = [];
  const annotation = await createAnnotationServer({ type: "image", mimeType: "image/png", name: "synthetic", data: source.toString("base64") }, "browser-token", result => results.push(result), config);
  servers.push(annotation);
  // Bun's ws client reads tls.ca; Node's ws client reads ca.
  const trust = { ca, tls: { ca }, headers: { Authorization: `Bearer ${token}` } };
  const ws = new WebSocket(`wss://localhost:${port}/tablet/v1/events`, trust);
  const snapshot = await new Promise<{ jobs: { jobId: string; requestId: string; sourceDigest: string }[] }>((resolve, reject) => {
    ws.once("message", bytes => resolve(JSON.parse(bytes.toString())));
    ws.on("error", reject);
  });
  ws.close();
  const job = snapshot.jobs[0];
  retained.push(join(homedir(), ".local", "share", "omp", "image-annotator", job.requestId));
  function call(action: string, method = "GET", data?: Buffer | object, headers: Record<string, string> = {}, auth = token) {
    const bytes = Buffer.isBuffer(data) ? data : data ? Buffer.from(JSON.stringify(data)) : undefined;
    return new Promise<{ status: number; data: Buffer; json(): Record<string, unknown> }>((resolve, reject) => {
      const request = httpsRequest(`https://localhost:${port}/tablet/v1/jobs/${job.jobId}${action ? `/${action}` : ""}`, {
        method, ca,
        headers: { Authorization: `Bearer ${auth}`, "content-type": "application/json", ...headers }
      }, response => {
        const chunks: Buffer[] = [];
        response.on("data", chunk => chunks.push(chunk));
        response.on("end", () => { const body = Buffer.concat(chunks); resolve({ status: response.statusCode!, data: body, json: () => JSON.parse(body.toString()) }); });
      });
      request.once("error", reject);
      request.end(bytes);
    });
  }
  const bind = (uuid = documentUUID) => call("bind", "POST", { requestId: job.requestId, documentUUID: uuid });
  const submit = async () => {
    const current = (await call("")).json();
    return call("result", "POST", await readFile(join(directory, "black.pdf")), {
      "content-type": "application/pdf", "x-request-id": job.requestId, "x-document-uuid": documentUUID,
      "x-submission-epoch": String(current.submissionEpoch),
    });
  };
  return { annotation, results, job, call, bind, submit, port, config, serverId };
}

test("TLS trust, credential and immutable UUID binding protect a real request", async () => {
  const s = await setup("synthetic-server-A");
  await expect(new Promise<void>((resolve, reject) => {
    const request = httpsRequest(`https://localhost:${s.port}/tablet/v1/jobs/${s.job.jobId}`, response => { response.resume(); resolve(); });
    request.once("error", reject); request.end();
  })).rejects.toThrow();
  expect((await s.call("", "GET", undefined, {}, "wrong")).status).toBe(401);
  expect((await s.bind()).status).toBe(200);
  expect((await s.bind(anotherUUID)).status).toBe(409);
  const sourcePDF = await s.call("source.pdf");
  expect(sourcePDF.status).toBe(200);
  expect(sourcePDF.data.subarray(0, 5).toString()).toBe("%PDF-");
  expect((await s.call("result", "POST", await readFile(join(directory, "black.pdf")), { "content-type": "application/pdf", "x-request-id": s.job.requestId, "x-document-uuid": anotherUUID })).status).toBe(409);
  expect(s.results).toEqual([]);
  await s.annotation.close();
});

test("switch invalidation, foreign request and cancellation cannot consume clipping consent", async () => {
  const a = await setup("synthetic-server-B");
  const b = await setup("synthetic-server-C");
  await a.bind(); await b.bind();
  const review = (await a.submit()).json();
  expect(review.status).toBe("confirmation-required");
  expect(a.results).toEqual([]);
  const confirmation = { ...review, documentUUID };
  expect((await b.call("confirm", "POST", confirmation)).status).toBe(409);
  expect((await a.call("invalidate", "POST", { requestId: a.job.requestId, documentUUID: anotherUUID })).status).toBe(409);
  expect((await a.call("invalidate", "POST", { requestId: a.job.requestId, documentUUID })).status).toBe(200);
  expect((await a.call("confirm", "POST", confirmation)).status).toBe(409);
  const late = await a.call("result", "POST", await readFile(join(directory, "black.pdf")), {
    "content-type": "application/pdf", "x-request-id": a.job.requestId, "x-document-uuid": documentUUID,
    "x-submission-epoch": "0",
  });
  expect(late.status).toBe(409);
  expect(a.results).toEqual([]);
  const current = (await a.submit()).json();
  expect((await a.call("confirm", "POST", { ...current, documentUUID })).status).toBe(200);
  expect(a.results[0]?.data.readUInt32BE(16)).toBe(80);
  expect(a.results[0]?.data.readUInt32BE(20)).toBe(100);
  expect(await readFile(a.results[0]!.originalPdfPath!)).toEqual(await readFile(join(directory, "black.pdf")));
  const bAddress = b.annotation.httpServer.address();
  if (!bAddress || typeof bAddress === "string") throw new Error("Browser server unavailable");
  await fetch(`http://127.0.0.1:${bAddress.port}/api/cancel?token=browser-token`, { method: "POST" });
  expect((await b.submit()).status).toBe(409);
  expect(b.results).toEqual([undefined]);
  expect(a.results).toHaveLength(1);
  await a.annotation.close(); await b.annotation.close();
}, 30_000);

async function diagnosticSocket(port: number): Promise<WebSocket> {
  const trust = { ca, tls: { ca }, headers: { Authorization: `Bearer ${token}` } };
  const ws = new WebSocket(`wss://localhost:${port}/tablet/v1/events`, trust);
  await new Promise<void>((resolve, reject) => {
    ws.once("message", () => resolve());
    ws.once("error", reject);
  });
  return ws;
}

function diagnosticPacket(s: { serverId: string; job: { jobId: string; requestId: string } }) {
  return {
    type: "diagnostic", schemaVersion: 1, serverId: s.serverId, deviceId: "synthetic-tablet",
    jobId: s.job.jobId, requestId: s.job.requestId, importName: `pi-ink-${"b".repeat(32)}`,
    timestamp: "2026-11-06T12:34:56.123456789Z", clientVersion: "0.3.1-rc.1+diagnostic-smoke",
    code: "import.started", level: "info", message: "Controlled import started", droppedBefore: 0,
  };
}

async function received(ws: WebSocket): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ws.once("pong", () => resolve());
    ws.once("error", reject);
    ws.ping();
  });
}

test("diagnostics preserve receive order and flush privately on normal request close", async () => {
  const s = await setup("synthetic-diag-order");
  const path = `${s.config}.diagnostics.jsonl`;
  await writeFile(path, "", { mode: 0o644 });
  const ws = await diagnosticSocket(s.port);
  const first = diagnosticPacket(s);
  const second = { ...first, code: "import.failed", level: "error", message: "stock loopback service unavailable", droppedBefore: 3 };
  ws.send(JSON.stringify(first));
  ws.send(JSON.stringify(second));
  await received(ws);
  await s.annotation.close();
  const rows = (await readFile(path, "utf8")).trim().split("\n").map(line => JSON.parse(line));
  expect(rows.map(({ receivedAt, ...packet }) => packet)).toEqual([first, second]);
  for (const row of rows) expect(new Date(row.receivedAt).toISOString()).toBe(row.receivedAt);
  expect((await stat(path)).mode & 0o777).toBe(0o600);
});

test("diagnostics use only the trusted configured path beside unchanged hardware status", async () => {
  const path = join(directory, "configured-diagnostics.jsonl");
  const statusPath = join(directory, "configured-status.jsonl");
  const s = await setup("synthetic-diag-custom", { diagnosticsPath: path, statusPath });
  const ws = await diagnosticSocket(s.port);
  ws.send(JSON.stringify({ type: "status", deviceId: "synthetic-tablet", udc: ["detached"], usbIPv4: [], listeners: ["127.0.0.1:81"], safe: true }));
  ws.send(JSON.stringify(diagnosticPacket(s)));
  await received(ws);
  await s.annotation.close();
  expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject(diagnosticPacket(s));
  expect(JSON.parse(await readFile(statusPath, "utf8"))).toMatchObject({
    serverId: s.serverId, deviceId: "synthetic-tablet", udc: ["detached"], usbIPv4: [], listeners: ["127.0.0.1:81"], safe: true,
  });
  await expect(readFile(`${s.config}.diagnostics.jsonl`)).rejects.toMatchObject({ code: "ENOENT" });
});

test("diagnostics reject foreign identities, unsafe fields, codes and oversized UTF8 without logging", async () => {
  const s = await setup("synthetic-diag-reject");
  const packet = diagnosticPacket(s);
  const invalid = [
    { ...packet, schemaVersion: 2 }, { ...packet, deviceId: "foreign-tablet" },
    { ...packet, serverId: "foreign-server" }, { ...packet, jobId: "0".repeat(32) },
    { ...packet, requestId: "0".repeat(32) }, { ...packet, importName: `${packet.importName}.pdf` },
    { ...packet, token }, { ...packet, title: "unrelated title" }, { ...packet, diagnosticsPath: "/tmp/untrusted" },
    { ...packet, code: "import.unknown" }, { ...packet, code: "toString" }, { ...packet, level: "error" },
    { ...packet, message: "untrusted content" }, { ...packet, message: "é".repeat(257) },
    { ...packet, droppedBefore: -1 }, { ...packet, droppedBefore: 1.5 },
    { ...packet, droppedBefore: Number.MAX_SAFE_INTEGER + 1 },
    { ...packet, timestamp: "2026-02-30T12:34:56Z" }, { ...packet, timestamp: "2026-11-06T12:34:56+00:00" },
    { ...packet, clientVersion: "version containing document title" },
    { ...packet, timestamp: undefined },
  ];
  for (const value of [...invalid.map(value => JSON.stringify(value)), JSON.stringify(packet) + " ".repeat(4096)]) {
    const ws = await diagnosticSocket(s.port);
    const closed = new Promise<number>(resolve => ws.once("close", code => resolve(code)));
    ws.send(value);
    expect(await closed).toBe(1008);
  }
  await s.annotation.close();
  await expect(readFile(`${s.config}.diagnostics.jsonl`)).rejects.toMatchObject({ code: "ENOENT" });
}, 30_000);

test("diagnostics refuse a symlink target without modifying unrelated storage", async () => {
  const target = join(directory, "unrelated-private-file");
  const path = join(directory, "symlink-diagnostics");
  await writeFile(target, "leave unchanged");
  await symlink(target, path);
  const s = await setup("synthetic-diag-symlink", { diagnosticsPath: path });
  const ws = await diagnosticSocket(s.port);
  const closed = new Promise<number>(resolve => ws.once("close", code => resolve(code)));
  ws.send(JSON.stringify(diagnosticPacket(s)));
  expect(await closed).toBe(1011);
  await s.annotation.close();
  expect(await readFile(target, "utf8")).toBe("leave unchanged");
});
