// Temporary tablet transport into the originating image_editor PDF gate.
// No stock-service paths or desktop file paths are accepted from the LAN.
import { randomBytes, timingSafeEqual } from "node:crypto";
import { appendFile, open, readFile, rename, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createServer, type Server } from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { PdfSession } from "./pdf-session";

interface Pairing {
  serverId: string;
  name: string;
  address: string;
  port: number;
  certificate: string;
  key: string;
  deviceId: string;
  token: string;
  managementToken?: string;
  statusPath?: string;
  diagnosticsPath?: string;
}
interface Job {
  requestId: string;
  sourceDigest: string;
  pdf?: PdfSession;
  state: "pending" | "completed" | "cancelled";
  submissionEpoch: number;
  documentUUID?: string;
  folderUUID?: string;
}
interface Gateway {
  config: Pairing;
  configPath: string;
  server: Server;
  sockets: WebSocketServer;
  jobs: Map<string, Job>;
  references: number;
  closing?: Promise<void>;
  diagnosticWrites: Promise<void>;
  pendingDiagnosticWrites: number;
  pendingPair?: { deviceId: string; token: string; id: string; approving?: boolean };
}
const gateways = new Map<string, Promise<Gateway>>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const prefix = "/tablet/v1";

export interface TabletRequest {
  end(state: "completed" | "cancelled"): void;
  close(): Promise<void>;
}

/** Register only this live request. Configuration comes from trusted desktop setup. */
export async function attachTabletRequest(pdf: PdfSession, configPath: string): Promise<TabletRequest> {
  let loading = gateways.get(configPath);
  if (!loading) {
    loading = startGateway(configPath);
    gateways.set(configPath, loading);
    loading.catch(() => gateways.delete(configPath));
  }
  const gateway = await loading;
  if (gateway.closing) {
    await gateway.closing;
    return attachTabletRequest(pdf, configPath);
  }
  const job: Job = { requestId: pdf.requestId, sourceDigest: pdf.sourceDigest, pdf, state: "pending", submissionEpoch: 0 };
  gateway.references++;
  gateway.jobs.set(pdf.requestId, job);
  publish(gateway);
  let released = false;
  return {
    end(state) {
      if (job.state !== "pending") return;
      job.state = state;
      pdf.close();
      job.pdf = undefined;
      publish(gateway);
    },
    async close() {
      if (released) return;
      released = true;
      if (job.state === "pending") {
        job.state = "cancelled";
        pdf.close();
        job.pdf = undefined;
        publish(gateway);
      }
      if (--gateway.references !== 0) return;
      for (const socket of gateway.sockets.clients) socket.close(1000, "Request ended");
      // Let active result responses finish before a new request reuses this listener.
      gateway.closing = new Promise<void>((resolve, reject) => gateway.server.close(error => error ? reject(error) : resolve()))
        .then(() => gateway.diagnosticWrites);
      await gateway.closing.finally(() => {
        gateways.delete(configPath);
        gateway.sockets.close();
      });
    },
  };
}

async function startGateway(configPath: string): Promise<Gateway> {
  const input = object(JSON.parse(await readFile(configPath, "utf8")));
  if (typeof input.serverId !== "string" || !/^[a-zA-Z0-9_-]{16,128}$/.test(input.serverId) ||
    typeof input.deviceId !== "string" || !input.deviceId ||
    !((typeof input.token === "string" && input.token.length >= 32) ||
      (typeof input.managementToken === "string" && input.managementToken.length >= 32)) ||
    typeof input.name !== "string" || !input.name || typeof input.address !== "string" || !input.address ||
    typeof input.certificate !== "string" || typeof input.key !== "string" ||
    typeof input.port !== "number" || !Number.isInteger(input.port) || input.port < 0 || input.port > 65535) {
    throw new Error("Invalid tablet pairing configuration. Check the desktop identity, credential and TLS listener.");
  }
  const config: Pairing = {
    serverId: input.serverId, deviceId: input.deviceId, token: typeof input.token === "string" ? input.token : "",
    name: input.name, address: input.address, certificate: input.certificate, key: input.key, port: input.port
    , statusPath: typeof input.statusPath === "string" ? input.statusPath : undefined
    , managementToken: typeof input.managementToken === "string" ? input.managementToken : undefined
    , diagnosticsPath: typeof input.diagnosticsPath === "string" ? input.diagnosticsPath : `${configPath}.diagnostics.jsonl`
  };
  const [cert, key] = await Promise.all([readFile(config.certificate), readFile(config.key)]);
  const jobs = new Map<string, Job>();
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  const server = createServer({ cert, key, minVersion: "TLSv1.2" }, (request, response) => {
    void handle(gateway, request, response).catch(() => {
      if (response.headersSent) response.destroy();
      else json(response, 500, { error: "Tablet request failed. Check the desktop PDF processing setup." });
    });
  });
  const gateway: Gateway = { config, configPath, server, sockets, jobs, references: 0, diagnosticWrites: Promise.resolve(), pendingDiagnosticWrites: 0 };
  server.headersTimeout = 10_000;
  server.requestTimeout = 60_000;
  server.on("upgrade", (request, socket, head) => {
    if (request.url !== `${prefix}/events` || !authorized(config, request) || request.headers.origin) {
      socket.end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      return;
    }
    sockets.handleUpgrade(request, socket, head, connection => {
      // A paired client reports readiness over the same authenticated connection.
      connection.on("message", bytes => {
        try {
          const text = bytes.toString();
          const status = object(JSON.parse(text));
          if (status.type === "diagnostic") {
            if (gateway.closing) return;
            if (Buffer.byteLength(text, "utf8") > 4096 || !validDiagnostic(gateway, status)) {
              connection.close(1008, "Invalid diagnostic"); return;
            }
            if (gateway.pendingDiagnosticWrites >= 64) {
              connection.close(1013, "Diagnostic queue full"); return;
            }
            gateway.pendingDiagnosticWrites++;
            const line = JSON.stringify({ ...status, receivedAt: new Date().toISOString() }) + "\n";
            gateway.diagnosticWrites = gateway.diagnosticWrites
              .then(() => appendDiagnostic(config.diagnosticsPath!, line))
              .catch(() => { connection.close(1011, "Diagnostic storage unavailable"); })
              .finally(() => { gateway.pendingDiagnosticWrites--; });
            return;
          }
          if (status.type !== "status" || status.deviceId !== config.deviceId) {
            connection.close(1008, "Identity rejected"); return;
          }
          if (config.statusPath) {
            // Only kernel-network metadata enters experiment evidence, never titles/content.
            const observation = {
              time: new Date().toISOString(), serverId: config.serverId, deviceId: config.deviceId,
              udc: status.udc, usbIPv4: status.usbIPv4, listeners: status.listeners, safe: status.safe
            };
            void appendFile(config.statusPath, JSON.stringify(observation) + "\n", { mode: 0o600 })
              .catch(() => connection.close(1011, "Status storage unavailable"));
          }
        } catch { connection.close(1008, "Invalid status"); }
      });
      connection.on("error", () => { });
      connection.send(snapshot(gateway));
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.address, () => { server.off("error", reject); resolve(); });
  });
  server.unref();
  return gateway;
}

function authorized(config: Pairing, request: IncomingMessage): boolean {
  if (!config.token) return false;
  const actual = Buffer.from(request.headers.authorization ?? "");
  const expected = Buffer.from(`Bearer ${config.token}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function identity(job: Job) {
  return {
    jobId: job.requestId, requestId: job.requestId, sourceDigest: job.sourceDigest,
    state: job.state, submissionEpoch: job.submissionEpoch, documentUUID: job.documentUUID, folderUUID: job.folderUUID
  };
}
function snapshot(gateway: Gateway): string {
  return JSON.stringify({
    type: "jobs", serverId: gateway.config.serverId,
    jobs: [...gateway.jobs.values()].map(identity)
  });
}
function publish(gateway: Gateway) {
  const data = snapshot(gateway);
  for (const socket of gateway.sockets.clients) if (socket.readyState === WebSocket.OPEN) socket.send(data);
}
function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify(value));
}
async function body(request: IncomingMessage, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > limit) throw new Error("Tablet upload exceeds the permitted size.");
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, size);
}
async function handle(gateway: Gateway, request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.headers.origin) { json(response, 403, { error: "Browser origin refused" }); return; }
  if (request.url === `${prefix}/pair` && request.method === "POST") {
    if (!gateway.config.managementToken || gateway.config.token) {
      json(response, 409, { error: "Pairing unavailable" }); return;
    }
    const data = object(JSON.parse((await body(request, 4096)).toString()));
    if (data.deviceId !== gateway.config.deviceId || typeof data.token !== "string" || !/^[a-f0-9]{64}$/.test(data.token)) {
      json(response, 403, { error: "Setup device identity rejected" }); return;
    }
    if (gateway.pendingPair && gateway.pendingPair.token !== data.token) {
      json(response, 409, { error: "Another pairing awaits desktop approval" }); return;
    }
    gateway.pendingPair ??= { deviceId: data.deviceId, token: data.token, id: randomBytes(16).toString("hex") };
    json(response, 202, { serverId: gateway.config.serverId, pairingId: gateway.pendingPair.id }); return;
  }
  const rejectingPair = request.url === `${prefix}/management/pair/reject`;
  if (request.url === `${prefix}/management/pair` || rejectingPair) {
    const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "");
    if (!local || !gateway.config.managementToken ||
      !authorized({ ...gateway.config, token: gateway.config.managementToken }, request)) {
      json(response, 401, { error: "Local desktop approval required" }); return;
    }
    if (request.method === "GET" && !rejectingPair) {
      const pair = gateway.pendingPair;
      json(response, 200, { pending: pair ? { deviceId: pair.deviceId, pairingId: pair.id } : null }); return;
    }
    if (request.method === "POST") {
      const data = object(JSON.parse((await body(request, 4096)).toString()));
      const pair = gateway.pendingPair;
      if (!pair || data.pairingId !== pair.id || pair.approving) {
        json(response, 409, { error: "Pairing approval is stale or in progress" }); return;
      }
      if (rejectingPair) {
        gateway.pendingPair = undefined;
        json(response, 200, { rejected: true }); return;
      }
      // Reject cannot interrupt an approval after its credential write starts.
      pair.approving = true;
      try {
        const stored = object(JSON.parse(await readFile(gateway.configPath, "utf8")));
        stored.token = pair.token;
        const temporary = `${gateway.configPath}.${randomBytes(16).toString("hex")}`;
        await writeFile(temporary, JSON.stringify(stored, null, 2) + "\n", { mode: 0o600, flag: "wx" });
        await rename(temporary, gateway.configPath);
        gateway.config.token = pair.token;
        gateway.pendingPair = undefined;
        json(response, 200, { approved: true }); return;
      } finally {
        pair.approving = false;
      }
    }
    json(response, 405, { error: "Unsupported management method" }); return;
  }
  if (!authorized(gateway.config, request)) { json(response, 401, { error: "Unauthorized" }); return; }
  const match = /^\/tablet\/v1\/jobs\/([a-f0-9]{32})(?:\/(source\.pdf|bind|result|confirm|invalidate))?$/.exec(request.url ?? "");
  const job = match ? gateway.jobs.get(match[1]) : undefined;
  if (!match || !job) { json(response, 404, { error: "Unknown job" }); return; }
  const action = match[2];
  if (!action && request.method === "GET") { json(response, 200, identity(job)); return; }
  const pdf = job.pdf;
  if (job.state !== "pending" || !pdf) { json(response, 409, { error: "Request terminal", ...identity(job) }); return; }
  if (action === "source.pdf" && request.method === "GET") {
    await pdf.handle(request, response, "/api/pdf-source", body); return;
  }
  if (action === "bind" && request.method === "POST") {
    const data = object(JSON.parse((await body(request, 4096)).toString()));
    if (job.state !== "pending" || data.requestId !== pdf.requestId || typeof data.documentUUID !== "string" || !uuid.test(data.documentUUID) ||
      (data.folderUUID !== undefined && data.folderUUID !== "" && (typeof data.folderUUID !== "string" || !uuid.test(data.folderUUID))) ||
      (job.documentUUID !== undefined && (job.documentUUID !== data.documentUUID || job.folderUUID !== data.folderUUID)) ||
      [...gateway.jobs.values()].some(other => other !== job && other.documentUUID === data.documentUUID)) {
      json(response, 409, { error: "Document association rejected" }); return;
    }
    job.documentUUID = data.documentUUID;
    job.folderUUID = typeof data.folderUUID === "string" ? data.folderUUID : undefined;
    publish(gateway);
    json(response, 200, identity(job)); return;
  }
  if (action === "result" && request.method === "POST") {
    if (!job.documentUUID || request.headers["x-document-uuid"] !== job.documentUUID ||
      request.headers["x-request-id"] !== pdf.requestId || request.headers["x-submission-epoch"] !== String(job.submissionEpoch)) {
      json(response, 409, { error: "Wrong document or request" }); return;
    }
    await pdf.handle(request, response, "/api/pdf-submit", body); return;
  }
  if ((action === "confirm" || action === "invalidate") && request.method === "POST") {
    const bytes = await body(request, 4096);
    const data = object(JSON.parse(bytes.toString()));
    if (job.state !== "pending" || !job.documentUUID || data.documentUUID !== job.documentUUID || data.requestId !== pdf.requestId) {
      json(response, 409, { error: "Wrong document or request" }); return;
    }
    if (action === "invalidate") {
      job.submissionEpoch++;
      pdf.invalidate(); publish(gateway); json(response, 200, identity(job)); return;
    }
    await pdf.handle(request, response, "/api/pdf-confirm", async () => bytes); return;
  }
  json(response, 405, { error: "Unsupported tablet action" });
}

const diagnosticFields = new Set([
  "type", "schemaVersion", "deviceId", "serverId", "jobId", "requestId", "importName",
  "timestamp", "clientVersion", "code", "level", "message", "droppedBefore",
]);
const diagnosticCodes: Record<string, readonly [string, string]> = {
  "import.started": ["info", "Controlled import started"],
  "import.source_verified": ["info", "Source PDF verified against the approved synthetic allowlist"],
  "import.upload_started": ["info", "Controlled stock upload started"],
  "import.upload_completed": ["info", "Controlled stock upload completed"],
  "import.receipt_received": ["info", "Native controlled import receipt received"],
  "import.receipt_accepted": ["info", "Native controlled import receipt accepted"],
  "import.bound": ["info", "Stock association persisted and acknowledged by the originating server"],
  "import.failed": ["error", "Controlled import failed"],
  "import.receipt_filename_mismatch": ["warn", "Native receipt filename does not match the controlled upload filename"],
  "import.receipt_uuid_invalid": ["error", "Native receipt document UUID is invalid"],
  "import.receipt_parent_invalid": ["error", "Native receipt parent UUID is invalid"],
};
const diagnosticFailures: Record<string, true> = {
  "paired server request failed": true,
  "paired server rejected request": true,
  "paired server response exceeds limit or was interrupted": true,
  "paired server returned invalid JSON": true,
  "source PDF is not on the owner-approved synthetic SHA256 allowlist": true,
  "toolbar did not acknowledge the controlled import name": true,
  "import job was cancelled or changed": true,
  "stock loopback service unavailable": true,
  "stock loopback service rejected request": true,
  "stock response exceeded limit or was interrupted": true,
  "Paper Pro requires observations from both UDC controllers": true,
  "require detached or powered USB without USB IPv4, stock service on IPv4 localhost:81, and no exposed port80": true,
  "stock import returned an invalid explicit document UUID": true,
  "stock import returned conflicting explicit document UUIDs": true,
  "stock response and Library receipt UUIDs disagree": true,
  "stock import has no matching native document and parent receipt": true,
  "import cancelled before binding": true,
  "native import destination belongs to another paired server": true,
  "stock UUID is already associated": true,
  "stock association persisted; binding acknowledgement failed": true,
  "Controlled import failed during local preparation or state persistence": true,
};

function validDiagnostic(gateway: Gateway, data: Record<string, unknown>): boolean {
  if (Object.keys(data).length !== diagnosticFields.size || Object.keys(data).some(key => !diagnosticFields.has(key)) ||
    data.schemaVersion !== 1 || data.deviceId !== gateway.config.deviceId || data.serverId !== gateway.config.serverId ||
    typeof data.jobId !== "string" || typeof data.requestId !== "string" ||
    gateway.jobs.get(data.jobId)?.requestId !== data.requestId ||
    typeof data.importName !== "string" || !/^pi-ink-[0-9a-f]{32}$/.test(data.importName) ||
    typeof data.clientVersion !== "string" || data.clientVersion.length > 64 ||
    !/^(?:development|\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/.test(data.clientVersion) ||
    typeof data.code !== "string" || !Object.hasOwn(diagnosticCodes, data.code) ||
    typeof data.message !== "string" || Buffer.byteLength(data.message, "utf8") > 512 ||
    !Number.isSafeInteger(data.droppedBefore) || (data.droppedBefore as number) < 0 ||
    typeof data.timestamp !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(data.timestamp)) return false;
  const seconds = data.timestamp.slice(0, 19) + ".000Z";
  const time = new Date(seconds);
  if (!Number.isFinite(time.getTime()) || time.toISOString() !== seconds) return false;
  const [level, message] = diagnosticCodes[data.code];
  return data.level === level && (data.message === message ||
    (data.code === "import.failed" && Object.hasOwn(diagnosticFailures, data.message)));
}

async function appendDiagnostic(path: string, line: string): Promise<void> {
  // Refuse symlinks and keep an existing log private, not just a newly created one.
  const file = await open(path, constants.O_APPEND | constants.O_CREAT | constants.O_WRONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK, 0o600);
  try {
    if (!(await file.stat()).isFile()) throw new Error("Diagnostic storage must be a regular file.");
    await file.chmod(0o600);
    await file.appendFile(line, "utf8");
  } finally {
    await file.close();
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a JSON object.");
  return value as Record<string, unknown>;
}
