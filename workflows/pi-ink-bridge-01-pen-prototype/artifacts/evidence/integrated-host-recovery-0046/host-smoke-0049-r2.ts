// Real extension/image_editor, compiled client, TLS/WSS and PDF worker.
// Only browser launch, stock HTTP and native UI events are simulated.
import { spyOn } from "bun:test";
import * as cp from "node:child_process";
import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import { createServer as netServer } from "node:net";
import { createServer as stockServer } from "node:http";
import { request as tlsRequest } from "node:https";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";

const temporary = process.env.INK_SMOKE_TEMP!;
const sourceRoot = process.env.INK_SOURCE_ROOT!;
const retained = process.env.INK_RETAINED_ROOT!;
const out = import.meta.dirname;
process.env.HOME = join(temporary, "home");
await mkdir(process.env.HOME, { recursive: true });
// The source root is runtime-selected. HOME must be isolated before module-level PDF storage resolves.
const { default: extension } = await import(join(sourceRoot, "index.ts"));
type API = Parameters<typeof extension>[0];
let tool!: Parameters<API["registerTool"]>[0];
let nextURL: ((url: string) => void) | undefined;
const launcher = spyOn(cp, "spawn").mockImplementation((_command, args) => {
 const child = Object.assign(new EventEmitter(), { unref() { } });
 queueMicrotask(() => { child.emit("spawn"); nextURL?.((args as string[]).at(-1)!); });
 return child as cp.ChildProcess;
});
extension({ zod: { object() { }, enum() { }, string: () => ({ optional() { } }) }, registerTool(value) { tool = value; }, registerCommand() { }, on() { }, sendUserMessage() { } });
const check = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
async function waitFor<T>(read: () => Promise<T>, matches: (value: T) => boolean, message: string): Promise<T> {
 const until = Date.now() + 25_000;
 while (Date.now() < until) { const value = await read(); if (matches(value)) return value; await Bun.sleep(100); }
 throw new Error(message);
}
async function port() {
 const server = netServer();
 await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
 const address = server.address(); if (!address || typeof address === "string") throw new Error("No port");
 await new Promise<void>(resolve => server.close(() => resolve())); return address.port;
}
// Refuse an occupied port. Never inspect or kill an existing owner.
const reservation = netServer();
await new Promise<void>((resolve, reject) => { reservation.once("error", reject); reservation.listen(9821, "127.0.0.1", resolve); });
await new Promise<void>(resolve => reservation.close(() => resolve()));
const certificate = join(temporary, "cert.pem"), key = join(temporary, "key.pem");
cp.execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1", "-keyout", key, "-out", certificate], { stdio: "ignore" });
const ca = await readFile(certificate), serverPort = await port();
const serverID = "host-smoke-trusted-server", deviceID = "host-smoke-simulated-tablet", admin = "9".repeat(64);
const gatewayPath = join(temporary, "gateway.json");
await writeFile(gatewayPath, JSON.stringify({ serverId: serverID, deviceId: deviceID, name: "Host smoke", address: "127.0.0.1", port: serverPort, certificate, key, managementToken: admin }), { mode: 0o600 });
process.env.OMP_IMAGE_ANNOTATOR_TABLET_CONFIG = gatewayPath;
async function execute() {
 let urlResolve!: (url: string) => void;
 const url = new Promise<string>(resolve => { urlResolve = resolve; }); nextURL = urlResolve;
 let settled = false;
 const result = tool.execute("host-smoke", { action: "annotate", path: join(retained, "source.png") }, undefined, undefined, { mode: "tui", cwd: temporary, ui: { notify() { } } }).then(value => { settled = true; return value; });
 return { url: await url, result, settled: () => settled };
}
const first = await execute();
const second = await execute();
const sourcePDF = Buffer.from(await (await fetch(new URL("/api/pdf-source" + new URL(first.url).search, first.url))).arrayBuffer());
check(sourcePDF.subarray(0, 5).toString() === "%PDF-", "Real request did not prepare a PDF");
const markedPDF = await readFile(join(retained, "retained-annotated.pdf"));
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const document = "11111111-1111-4111-8111-111111111111", foreign = "22222222-2222-4222-8222-222222222222", folder = "33333333-3333-4333-8333-333333333333";
let ui: vm.Context;
let importedName = "", exports = 0, uploads = 0;
const stock = stockServer(async (req, res) => {
 if (req.method === "POST" && req.url === "/upload") {
  const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const bytes = Buffer.concat(chunks); const name = /filename="(pi-ink-[a-f0-9]{32})\.pdf"/.exec(bytes.toString("latin1"))?.[1];
  check(name && bytes.includes(sourcePDF), "Stock peer received wrong source"); importedName = name!; uploads++;
  vm.runInContext(`reportImport(${JSON.stringify(name)}, ${JSON.stringify("{" + document.toUpperCase() + "}")})`, ui);
  res.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify({ id: document }));
 } else if (req.method === "GET" && req.url === `/download/${document}/pdf`) {
  exports++; res.writeHead(200, { "content-type": "application/pdf" }).end(markedPDF);
 } else { res.writeHead(404).end(); }
});
await new Promise<void>((resolve, reject) => { stock.once("error", reject); stock.listen(0, "127.0.0.1", resolve); });
const stockAddress = stock.address(); if (!stockAddress || typeof stockAddress === "string") throw new Error("Stock peer unavailable");
const clientPath = join(temporary, "client.json");
await writeFile(clientPath, JSON.stringify({ deviceId: deviceID, statePath: join(temporary, "state.json"), uiAddress: "127.0.0.1:9821", syntheticAllowlist: [hash(sourcePDF)], servers: [{ serverId: serverID, name: "Host smoke", origin: `https://localhost:${serverPort}`, ca: certificate }] }), { mode: 0o600 });
const child = Bun.spawn([join(temporary, "pi-ink-client"), "serve", "--config", clientPath], { env: { ...process.env, INK_SIMULATED_STOCK: `127.0.0.1:${stockAddress.port}` }, stdin: "pipe", stdout: "pipe", stderr: "pipe" });
const reader = child.stderr.getReader();
const startup = await reader.read();
check(startup.value && Buffer.from(startup.value).toString().includes("Pi Ink UI ready"), "Client did not own test UI port");
async function local(path: string, data?: unknown) {
 const response = await fetch(`http://127.0.0.1:9821${path}`, { method: data === undefined ? "GET" : "POST", headers: { "content-type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data) });
 const text = await response.text();
 return { status: response.status, value: text.startsWith("{") ? JSON.parse(text) : { error: text } };
}
async function secure(path: string, method: string, token: string, data?: unknown) {
 return new Promise<{ status: number; value: Record<string, unknown> }>((resolve, reject) => {
  const req = tlsRequest(`https://localhost:${serverPort}/tablet/v1${path}`, { method, ca, headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" } }, res => {
   const bytes: Buffer[] = []; res.on("data", chunk => bytes.push(chunk)); res.on("end", () => resolve({ status: res.statusCode!, value: JSON.parse(Buffer.concat(bytes).toString()) }));
  }); req.on("error", reject); req.end(data ? JSON.stringify(data) : undefined);
 });
}
class XHR {
 static DONE = 4; readyState = 0; status = 0; responseText = ""; onreadystatechange?: () => void; onerror?: () => void;
 method = "GET"; url = ""; headers: Record<string, string> = {};
 open(method: string, url: string) { this.method = method; this.url = url; }
 setRequestHeader(key: string, value: string) { this.headers[key] = value; }
 send(body: string) { void fetch(this.url, { method: this.method, headers: this.headers, body: this.method === "GET" ? undefined : body }).then(async res => { this.status = res.status; this.responseText = await res.text(); this.readyState = XHR.DONE; this.onreadystatechange?.(); }).catch(() => this.onerror?.()); }
}
const qml = await readFile(join(sourceRoot, "tablet-qml/PiInkToolbar.qml"), "utf8");
const functions = ["canonicalUUID", "request", "updateCurrent", "publishCurrent", "refreshState", "acknowledgeImportReady", "submit", "importSource", "pairServer", "createServerFolder", "reportImport", "sendImportReceipt"].map(name => {
 const start = qml.indexOf(`    function ${name}(`); const end = qml.indexOf("\n    }", start);
 check(start >= 0 && end > start, `Missing QML action ${name}`); return qml.slice(start, end + 6);
}).join("\n");
let folderCreated = false;
ui = vm.createContext({
 XMLHttpRequest: XHR, state: {}, actionBusy: false, polling: false, currentBusy: false, currentPending: false, generation: 0, documentUUID: "", localOnline: true, expanded: true, errorText: "", importNames: {}, importReady: {}, importReports: {}, stockUUIDPattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, library: {
  uniqueVisibleName(name: string) { return name; },
  createCollection(parent: string, name: string) { check(parent === "" && name.includes(serverID), "Native folder action has wrong inputs"); folderCreated = true; return `{${folder}}`; },
  parentIdForId() { return `{${folder.toUpperCase()}}`; }
 }
});
ui.bridge = ui;
Object.defineProperty(ui, "currentMatches", { get: () => ui.localOnline && !ui.currentPending && ui.state.documentUUID === ui.documentUUID });
vm.runInContext(functions, ui);
const polling = setInterval(() => vm.runInContext("refreshState()", ui), 100);
const evidence: Record<string, unknown> = { scope: "HOST ONLY; stock HTTP, native Library and browser launcher simulated", transport: "actual certificate-verified HTTPS/WSS; actual compiled Go client", sourcePDF: hash(sourcePDF), annotatedPDF: hash(markedPDF) };
try {
 check((await secure("/jobs/" + "0".repeat(32), "GET", "")).status === 401, "Empty credentials authorized content");
 vm.runInContext(`pairServer(${JSON.stringify(serverID)})`, ui);
 await waitFor(() => local("/state"), s => !!s.value.servers[0].pairingId, "App pairing did not display approval ID");
 const pending = await secure("/management/pair", "GET", admin);
 const pair = pending.value.pending;
 check(pair && typeof pair === "object" && "pairingId" in pair, "Desktop has no pending pairing");
 if (!pair || typeof pair !== "object" || !("pairingId" in pair)) throw new Error("No pairing");
 check((await secure("/management/pair", "POST", "wrong", { pairingId: pair.pairingId })).status === 401, "Approval lacked private management protection");
 check((await secure("/management/pair", "POST", admin, { pairingId: pair.pairingId })).status === 200, "Desktop approval failed");
 const online = await waitFor(() => local("/state"), s => s.value.servers[0].connection === "online" && s.value.imports.length === 2, "Go client did not receive WSS jobs");
 const job = online.value.imports[0], cancelledJob = online.value.imports[1];
 evidence.pairing = { serverId: serverID, deviceId: deviceID, pairingId: pair.pairingId, approved: true };
 vm.runInContext(`createServerFolder(${JSON.stringify(serverID)})`, ui);
 await waitFor(() => local("/state"), s => s.value.folders.some((f: { folderUUID: string }) => f.folderUUID === folder), "Native folder association missing");
 check(folderCreated, "Actual QML folder action not exercised");
 vm.runInContext(`importSource(${JSON.stringify(job)})`, ui);
 await waitFor(() => local("/state"), s => s.value.imports[0].status === "pending" && !!s.value.imports[0].importName && uploads === 1 && !ui.actionBusy, "Controlled import and UUID binding failed");
 ui.documentUUID = document; vm.runInContext("updateCurrent()", ui);
 await waitFor(() => local("/state"), s => s.value.documentUUID === document && s.value.canSend && ui.currentMatches, "Native current document not associated");
 check(!first.settled() && exports === 0, "Import or open completed request");
 // Simulated local save and native close have no Send action.
 ui.documentUUID = ""; vm.runInContext("updateCurrent()", ui);
 await waitFor(() => local("/state"), s => s.value.documentUUID === "", "Close did not clear current document");
 check(!first.settled() && exports === 0, "Save/Close completed request");
 check((await local("/send", { documentUUID: document })).status === 409, "Closed-document Send succeeded");
 ui.documentUUID = foreign; vm.runInContext("updateCurrent()", ui);
 await waitFor(() => local("/state"), s => s.value.documentUUID === foreign, "Switch did not apply");
 check((await local("/send", { documentUUID: foreign })).status === 409, "Unassociated document sent");
 ui.documentUUID = document; vm.runInContext("updateCurrent()", ui);
 await waitFor(() => local("/state"), s => s.value.canSend && ui.currentMatches, "Associated document not ready");
 check((await local("/send", { documentUUID: document, serverId: "wrong-server" })).status === 409, "Alternate server was accepted");
 check((await local("/send", { documentUUID: document, jobId: cancelledJob.jobId })).status === 409, "Wrong request was accepted");
 const credentials = JSON.parse(await readFile(gatewayPath, "utf8"));
 check((await secure(`/jobs/${job.jobId}/result`, "POST", "wrong")).status === 401, "Foreign server credential authorized result");
 check((await secure(`/jobs/${job.jobId}/bind`, "POST", credentials.token, { requestId: cancelledJob.requestId, documentUUID: foreign })).status === 409, "Wrong request binding succeeded");
 vm.runInContext(`submit("/send", ${JSON.stringify(document)}, "")`, ui);
 const review = await waitFor(() => local("/state"), s => s.value.status === "confirmation-required", "Send did not reach clipping gate");
 check(!first.settled() && exports === 1, "Clipping gate delivered before consent");
 const stale = review.value.confirmationId;
 ui.documentUUID = foreign; vm.runInContext("updateCurrent()", ui);
 await waitFor(() => local("/state"), s => s.value.documentUUID === foreign && !s.value.canConfirm, "Switch retained consent");
 check((await local("/confirm", { documentUUID: document, confirmationId: stale })).status === 409, "Switched confirmation succeeded");
 // Cancel the other real image_editor request while this gateway remains open.
 check((await fetch(new URL("/api/cancel" + new URL(second.url).search, second.url), { method: "POST" })).ok, "Browser cancellation failed");
 const cancelled = await second.result;
 check(cancelled.details.status === "cancelled" && !cancelled.content.some(c => c.type === "image"), "Cancellation returned an image");
 await waitFor(() => local("/state"), s => s.value.imports.some((j: { jobId: string; status: string }) => j.jobId === cancelledJob.jobId && j.status === "cancelled"), "WSS did not preserve terminal cancellation");
 check((await local("/import", { serverId: serverID, jobId: cancelledJob.jobId })).status === 409, "Cancelled request imported");
 ui.documentUUID = document; vm.runInContext("updateCurrent()", ui);
 await waitFor(() => local("/state"), s => s.value.canSend && ui.currentMatches, "Original request not ready after switch");
 vm.runInContext(`submit("/send", ${JSON.stringify(document)}, "")`, ui);
 const latest = await waitFor(() => local("/state"), s => s.value.status === "confirmation-required" && !ui.actionBusy, "New Send failed");
 check(latest.value.confirmationId !== stale, "Stale result consent reused");
 await waitFor(async () => ui.state, s => s.canConfirm && s.confirmationId === latest.value.confirmationId, "QML did not display result-specific consent");
 vm.runInContext(`submit("/confirm", ${JSON.stringify(document)}, ${JSON.stringify(latest.value.confirmationId)})`, ui);
 const result = await first.result;
 check(result.details.status === "completed", "Originating image_editor did not complete");
 const image = result.content.find(c => c.type === "image"); check(image?.type === "image", "Tool has no PNG");
 if (!image || image.type !== "image") throw new Error("Missing PNG");
 const png = Buffer.from(image.data, "base64"); check(png.readUInt32BE(16) === 800 && png.readUInt32BE(20) === 1000, "Wrong source dimensions");
 await writeFile(join(out, "host-delivered-0049-r2.png"), png);
 const text = result.content.find(c => c.type === "text");
 const fullPath = text?.type === "text" ? text.text.split("Full annotated PDF retained at: ")[1] : undefined;
 check(fullPath && hash(await readFile(fullPath)) === hash(markedPDF), "Full annotated PDF not retained");
 await writeFile(join(out, "host-retained-0049-r2.pdf"), markedPDF);
 evidence.result = { status: result.details.status, dimensions: [800, 1000], pngSHA256: hash(png), fullPDFRetained: true, uploads, exports };
 evidence.checks = ["app Pair action and local approval", "native folder action and visual association state", "authenticated source import and controlled native document/parent UUID binding", "live current-document state", "Save/Close separation", "unassociated/closed/wrong-server/wrong-request refusal", "result-specific clipping confirmation and switch invalidation", "terminal cancellation with no image", "originating image_editor PNG completion"];
 await writeFile(join(out, "host-smoke-0049-r2.json"), JSON.stringify(evidence, null, 2) + "\n");
 console.log("HOST_SMOKE_PASS", JSON.stringify(evidence));
} finally {
 clearInterval(polling); launcher.mockRestore();
 // The simulated host boundary exits on stdin. No signal or process-kill command runs.
 child.stdin.write("host-smoke-complete\n"); child.stdin.end(); await child.exited;
 await new Promise<void>(resolve => stock.close(() => resolve()));
}
