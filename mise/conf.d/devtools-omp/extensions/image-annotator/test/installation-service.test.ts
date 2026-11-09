// Exercise the public/trusted boundary over real HTTP and certificate-verified HTTPS.
import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir, networkInterfaces } from "node:os";
import { join } from "node:path";
import { request } from "node:https";
import { startInstallationService, sha256 } from "../installation-service";

test("only loopback supplies trusted install instructions and identity survives restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pi-ink-service-"));
  const first = await startInstallationService(directory, 0, 0);
  const base = `http://127.0.0.1:${first.port}`;
  try {
    const instructions = await fetch(`${base}/instructions`).then(r => r.json());
    const archive = await fetch(`${base}/tablet/client.zip`).then(r => r.arrayBuffer());
    expect(instructions.command).toContain(sha256(Buffer.from(archive)));
    expect(instructions.command).toContain("StrictHostKeyChecking=yes");
    const address = Object.values(networkInterfaces()).flat().find(a => a?.family === "IPv4" && !a.internal)!.address;
    expect(await fetch(`http://${address}:${first.port}/instructions`).then(r => r.status)).toBe(404);
    expect(await fetch(`${base}/instructions`, { headers: { Origin: "https://attacker.invalid" } }).then(r => r.status)).toBe(403);
    expect(await fetch(`${base}/setup`, { method: "POST" }).then(r => r.status)).toBe(405);
    const ca = await readFile(join(directory, "certificate.pem"));
    const verified = Promise.withResolvers<{ id: string }>();
    request(`https://127.0.0.1:${first.tlsPort}/health`, { ca }, response => {
      const chunks: Buffer[] = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => verified.resolve(JSON.parse(Buffer.concat(chunks).toString())));
    }).on("error", verified.reject).end();
    expect((await verified.promise).id).toBe(first.health.id);
    await first.close();
    const second = await startInstallationService(directory, 0, 0);
    try { expect(second.health.id).toBe(first.health.id); expect(second.health.fingerprint).toBe(first.health.fingerprint); }
    finally { await second.close(); }
  } finally { await first.close(); await rm(directory, { recursive: true, force: true }); }
}, 30000);
