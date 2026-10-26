import { afterEach, expect, test } from "bun:test";
import type { AddressInfo } from "node:net";
import { createAnnotationServer, type AnnotationServer, type AnnotatorResult, type SourceImage } from "../index";

const pixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F0sAAAAASUVORK5CYII=",
  "base64",
);
const servers = new Set<AnnotationServer>();

afterEach(async () => {
  await Promise.all([...servers].map((server) => server.close()));
  servers.clear();
});

test("annotation server protects source data and returns exported PNG bytes", async () => {
  const token = "a".repeat(64);
  const source: SourceImage = {
    type: "image",
    data: pixelPng.toString("base64"),
    mimeType: "image/png",
    name: "fixture.png",
  };
  const results: (AnnotatorResult | undefined)[] = [];
  const server = await createAnnotationServer(source, token, (result) => results.push(result));
  servers.add(server);
  const address = server.httpServer?.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;

  const unauthorized = await fetch(`${base}/api/source`);
  expect(unauthorized.status).toBe(404);

  const sourceResponse = await fetch(`${base}/api/source?token=${token}`);
  expect(sourceResponse.status).toBe(200);
  expect(await sourceResponse.json()).toEqual({ data: source.data, mimeType: source.mimeType });

  const exportResponse = await fetch(`${base}/api/done?token=${token}`, {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: pixelPng,
  });
  expect(exportResponse.status).toBe(200);
  expect(results).toHaveLength(1);
  expect(results[0]).toEqual({ data: pixelPng, name: source.name });
});

test("cancel ends the session without returning an image", async () => {
  const token = "b".repeat(64);
  const source: SourceImage = {
    type: "image",
    data: pixelPng.toString("base64"),
    mimeType: "image/png",
    name: "fixture.png",
  };
  const results: (AnnotatorResult | undefined)[] = [];
  const server = await createAnnotationServer(source, token, (result) => results.push(result));
  servers.add(server);
  const address = server.httpServer?.address() as AddressInfo;

  const response = await fetch(`http://127.0.0.1:${address.port}/api/cancel?token=${token}`, { method: "POST" });
  expect(response.status).toBe(200);
  expect(results).toEqual([undefined]);
});

test("a new drawing has no source image and returns its exported PNG", async () => {
  const token = "d".repeat(64);
  const results: (AnnotatorResult | undefined)[] = [];
  const server = await createAnnotationServer(undefined, token, result => results.push(result));
  servers.add(server);
  const address = server.httpServer.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;

  expect((await fetch(`${base}/api/source`)).status).toBe(404);
  const source = await fetch(`${base}/api/source?token=${token}`);
  expect(await source.json()).toBeNull();
  const exported = await fetch(`${base}/api/done?token=${token}`, {
    method: "POST", headers: { "content-type": "image/png" }, body: pixelPng,
  });
  expect(exported.status).toBe(200);
  expect(results).toEqual([{ data: pixelPng, name: "drawing.png" }]);
});

test("annotation server serves the built Excalidraw app and bundle", async () => {
  const token = "c".repeat(64);
  const source: SourceImage = {
    type: "image",
    data: pixelPng.toString("base64"),
    mimeType: "image/png",
    name: "fixture.png",
  };
  const server = await createAnnotationServer(source, token, () => {});
  servers.add(server);
  const address = server.httpServer.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;

  const pageResponse = await fetch(base);
  expect(pageResponse.status).toBe(200);
  const html = await pageResponse.text();
  const scriptPath = /<script[^>]+src="([^"]+\.js)"/.exec(html)?.[1];
  expect(scriptPath).toBeDefined();

  const scriptResponse = await fetch(new URL(scriptPath!, base));
  expect(scriptResponse.status).toBe(200);
  expect(scriptResponse.headers.get("content-type")).toContain("javascript");
});
