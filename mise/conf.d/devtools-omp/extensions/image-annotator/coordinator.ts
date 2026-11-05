import { open } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";

export const COORDINATOR_PORT = 47840;

export interface CoordinatorServer {
  httpServer: Server;
  url: string;
  id: string;
  port: number;
  close(): Promise<void>;
}

export interface CoordinatorOptions {
  bundleDirectory: string;
  id: string;
  port?: number;
}

// This server exposes public bootstrap files only. Image requests stay on the token-protected editor server.
export async function createCoordinatorServer(options: CoordinatorOptions): Promise<CoordinatorServer> {
  if (!/^[a-f0-9]{32}$/.test(options.id)) {
    throw new Error("Coordinator ID must contain 32 lowercase hexadecimal characters.");
  }
  const httpServer = createServer((request, response) => {
    void handleRequest(request, response, options).catch((error: unknown) => {
      if (response.destroyed) return;
      console.error("[image-annotator] Coordinator request failed:", error);
      if (response.headersSent) response.destroy();
      else response.writeHead(500).end("Coordinator request failed.");
    });
  });
  httpServer.requestTimeout = 15_000;
  httpServer.headersTimeout = 10_000;
  await new Promise<void>((resolveListen, rejectListen) => {
    const onError = (error: Error) => rejectListen(error);
    httpServer.once("error", onError);
    httpServer.listen({ port: options.port ?? COORDINATOR_PORT, host: "::", ipv6Only: false }, () => {
      httpServer.off("error", onError);
      resolveListen();
    });
  });
  httpServer.unref();
  const address = httpServer.address() as AddressInfo;
  let closing: Promise<void> | undefined;
  return {
    httpServer,
    url: `http://127.0.0.1:${address.port}`,
    id: options.id,
    port: address.port,
    close: () => closing ??= new Promise<void>((resolveClose, rejectClose) => {
      httpServer.close((error) => error ? rejectClose(error) : resolveClose());
      httpServer.closeAllConnections();
    }),
  };
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, options: CoordinatorOptions): Promise<void> {
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(request.method === "HEAD" ? undefined : JSON.stringify({
      service: "image-annotator", status: "ok", protocol: 1, id: options.id,
    }));
    return;
  }
  const asset = pathname === "/tablet/bundle.tar.gz"
    ? { name: "bundle.tar.gz", contentType: "application/gzip" }
    : pathname === "/tablet/bundle.sha256"
      ? { name: "bundle.sha256", contentType: "text/plain; charset=utf-8" }
      : undefined;
  if (!asset) {
    response.writeHead(404).end();
    return;
  }
  const file = await open(resolve(options.bundleDirectory, asset.name), "r").catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
    return undefined;
  });
  if (!file) {
    response.writeHead(503).end("Tablet bundle is not built. Run bun run build:tablet in image-annotator.");
    return;
  }
  try {
    const info = await file.stat();
    response.writeHead(200, { "content-type": asset.contentType, "content-length": info.size });
    if (request.method === "HEAD") response.end();
    else await pipeline(file.createReadStream({ autoClose: false }), response);
  } finally {
    await file.close();
  }
}
