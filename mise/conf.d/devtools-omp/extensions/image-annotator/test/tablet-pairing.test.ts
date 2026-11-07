// Pairing cannot authorize content until local desktop approval succeeds.
import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { request } from "node:https";
import { attachTabletRequest } from "../tablet-gateway";
import { createPdfSession } from "../pdf-session";

test("setup trust requires matching local approval before credentials authorize jobs", async () => {
 const directory = await mkdtemp(join(tmpdir(), "ink-pairing-"));
 const key = join(directory, "key.pem"), certificate = join(directory, "cert.pem");
 execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1", "-keyout", key, "-out", certificate], { stdio: "ignore" });
 const reservation = createServer();
 await new Promise<void>(resolve => reservation.listen(0, "127.0.0.1", resolve));
 const address = reservation.address();
 if (!address || typeof address === "string") throw new Error("Host port reservation failed");
 const port = address.port;
 await new Promise<void>(resolve => reservation.close(() => resolve()));
 const config = join(directory, "gateway.json"), admin = "c".repeat(64), token = "d".repeat(64);
 await writeFile(config, JSON.stringify({ serverId: "trusted-server-identity", deviceId: "setup-device", name: "Desktop", address: "127.0.0.1", port, key, certificate, managementToken: admin }), { mode: 0o600 });
 const gateway = await attachTabletRequest(createPdfSession(undefined, () => { throw new Error("pairing must not deliver"); }), config);
 const ca = await readFile(certificate);
 function call(path: string, method = "GET", auth = "", data?: unknown, origin?: string) {
  return new Promise<{ status: number; value: Record<string, unknown> }>((resolve, reject) => {
   const req = request(`https://localhost:${port}/tablet/v1${path}`, { method, ca, headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) } }, res => {
    const chunks: Buffer[] = [];
    res.on("data", chunk => chunks.push(chunk));
    res.on("end", () => resolve({ status: res.statusCode!, value: JSON.parse(Buffer.concat(chunks).toString()) }));
   });
   req.on("error", reject); req.end(data ? JSON.stringify(data) : undefined);
  });
 }
 try {
  expect((await call("/jobs/" + "0".repeat(32))).status).toBe(401);
  expect((await call("/pair", "POST", "", { deviceId: "wrong-device", token })).status).toBe(403);
  const unwantedToken = "e".repeat(64);
  const unwanted = await call("/pair", "POST", "", { deviceId: "setup-device", token: unwantedToken });
  expect(unwanted.status).toBe(202);
  expect((await call("/pair", "POST", "", { deviceId: "setup-device", token })).status).toBe(409);
  expect((await call("/management/pair/reject", "POST", unwantedToken, { pairingId: unwanted.value.pairingId })).status).toBe(401);
  expect((await call("/management/pair/reject", "POST", admin, { pairingId: "stale" })).status).toBe(409);
  expect((await call("/management/pair/reject", "POST", admin, { pairingId: unwanted.value.pairingId }, "https://untrusted.example")).status).toBe(403);
  expect((await call("/pair", "POST", "", { deviceId: "setup-device", token })).status).toBe(409);
  expect((await call("/management/pair/reject", "POST", admin, { pairingId: unwanted.value.pairingId })).status).toBe(200);
  expect((await call("/jobs/" + "0".repeat(32), "GET", unwantedToken)).status).toBe(401);
  const pairing = await call("/pair", "POST", "", { deviceId: "setup-device", token });
  expect(pairing.status).toBe(202);
  expect((await call("/jobs/" + "0".repeat(32), "GET", token)).status).toBe(401);
  expect((await call("/management/pair", "POST", token, { pairingId: pairing.value.pairingId })).status).toBe(401);
  expect((await call("/management/pair", "POST", admin, { pairingId: "stale" })).status).toBe(409);
  expect((await call("/management/pair", "POST", admin, { pairingId: unwanted.value.pairingId })).status).toBe(409);
  expect((await call("/management/pair", "POST", admin, { pairingId: pairing.value.pairingId }, "https://untrusted.example")).status).toBe(403);
  expect((await call("/jobs/" + "0".repeat(32), "GET", token)).status).toBe(401);
  expect((await call("/management/pair", "POST", admin, { pairingId: pairing.value.pairingId })).status).toBe(200);
  expect((await call("/jobs/" + "0".repeat(32), "GET", token)).status).toBe(404);
  expect((await call("/management/pair", "GET", token)).status).toBe(401);
  expect((JSON.parse(await readFile(config, "utf8"))).token).toBe(token);
 } finally { await gateway.close(); await rm(directory, { recursive: true, force: true }); }
}, 30_000);
