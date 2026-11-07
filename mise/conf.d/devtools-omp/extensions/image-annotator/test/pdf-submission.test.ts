// Exercise the real HTTP delivery seam with PDFs, not mocked detector decisions.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createAnnotationServer, type AnnotationServer, type AnnotatorResult } from "../index";

const exec = promisify(execFile);
let fixtures: string;
const servers: AnnotationServer[] = [];
const retainedTestDirectories: string[] = [];
beforeAll(async () => {
  fixtures = await mkdtemp(join(tmpdir(), "pdf-gate-test-"));
  await exec("uv", ["run", "--offline", "--script", join(import.meta.dirname, "pdf-fixtures.py"), fixtures]);
});
afterAll(async () => {
  await Promise.all(servers.map(server => server.close()));
  await rm(fixtures, { recursive: true, force: true });
  await Promise.all(retainedTestDirectories.map(path => rm(path, { recursive: true, force: true })));
});
async function session() {
  const source = await readFile(join(fixtures, "source.png"));
  const results: (AnnotatorResult | undefined)[] = [];
  const server = await createAnnotationServer({ type: "image", mimeType: "image/png", name: "source.png", data: source.toString("base64") }, "test-token", result => results.push(result));
  servers.push(server);
  const base = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
  const post = (action: string, body?: BodyInit, type = "application/json") => fetch(`${base}/api/pdf-${action}?token=test-token`, { method: "POST", headers: { "content-type": type }, body });
  const submit = async (name: string) => post("submit", await readFile(join(fixtures, `${name}.pdf`)), "application/pdf");
  const identity = await (await post("invalidate")).json();
  if (!/^[a-f0-9]{32}$/.test(identity.requestId)) throw new Error("Invalid test request identity.");
  retainedTestDirectories.push(join(homedir(), ".local", "share", "omp", "image-annotator", identity.requestId));
  return { results, server, post, submit, base };
}

test("all outer ink colors and subpixel alpha require explicit result consent", async () => {
  for (const color of ["black", "blue", "white", "alpha", "subpixel"]) {
    const s = await session();
    const response = await s.submit(color);
    expect(response.status).toBe(202);
    const review = await response.json();
    expect(s.results).toEqual([]);
    expect(review.requiresConfirmation).toBe(true);
    expect(await readFile(review.originalPdfPath)).toEqual(await readFile(join(fixtures, `${color}.pdf`)));
    expect((await s.post("confirm", JSON.stringify(review))).status).toBe(200);
    expect(s.results[0]?.data.readUInt32BE(16)).toBe(80);
    expect(s.results[0]?.data.readUInt32BE(20)).toBe(100);
    await s.server.close();
    expect(await readFile(s.results[0]!.originalPdfPath!)).toEqual(await readFile(join(fixtures, `${color}.pdf`)));
  }
}, 30_000);

test("expanded whitespace sends without clipping consent and preserves source mapping", async () => {
  const s = await session();
  const response = await s.submit("empty");
  expect(response.status).toBe(200);
  const result = s.results[0]!;
  expect(result.data.readUInt32BE(16)).toBe(80);
  expect(result.data.readUInt32BE(20)).toBe(100);
  // Compare decoded samples, not PNG compression or metadata.
  const output = join(fixtures, "actual.png");
  await Bun.write(output, result.data);
  const { stdout } = await exec("uv", ["run", "--offline", "--script", join(import.meta.dirname, "pdf-samples.py"), join(fixtures, "source.png"), output]);
  expect(stdout.trim()).toBe("equal");
});

test("wrong source position fails closed instead of stretching or guessing", async () => {
  const s = await session();
  expect((await s.submit("shifted")).status).toBe(500);
  expect(s.results).toEqual([]);
});

test("replacement, altered digest, and another request cannot reuse consent", async () => {
  const a = await session();
  const b = await session();
  const old = await (await a.submit("black")).json();
  expect((await b.post("confirm", JSON.stringify(old))).status).toBe(409);
  expect((await a.post("confirm", JSON.stringify({ ...old, exportDigest: "wrong" }))).status).toBe(409);
  const current = await (await a.submit("blue")).json();
  expect((await a.post("confirm", JSON.stringify(old))).status).toBe(409);
  expect(a.results).toEqual([]);
  expect((await a.post("confirm", JSON.stringify(current))).status).toBe(200);
  expect(a.results).toHaveLength(1);
  expect(b.results).toEqual([]);
});

test("cancel and terminal close reject stale and late submissions", async () => {
  const s = await session();
  const review = await (await s.submit("black")).json();
  await fetch(`${s.base}/api/cancel?token=test-token`, { method: "POST" });
  expect((await s.post("confirm", JSON.stringify(review))).status).toBe(409);
  expect((await s.submit("empty")).status).toBe(409);
  expect(s.results).toEqual([undefined]);
  const running = await session();
  const response = running.submit("black");
  await fetch(`${running.base}/api/cancel?token=test-token`, { method: "POST" });
  expect((await response).status).toBe(409);
  expect(running.results).toEqual([undefined]);
});
