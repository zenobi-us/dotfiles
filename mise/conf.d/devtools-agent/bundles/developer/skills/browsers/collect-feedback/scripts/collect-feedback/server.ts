// One loopback service owns the session writer and drains saves before shutdown.
import { constants } from "node:fs";
import { lstat, open, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { CliError } from "../../../collect-evidence/scripts/browser-evidence/sh.ts";
import { assetBytes, boundedFile, requireValue, safeComponents, schema, validateSession, type FeedbackView } from "./records.ts";
import { AnnotationError, createAnnotation, exportSession, listAnnotations } from "./annotations.ts";

export async function serveSession(directory: string, port: number, ready: (data: object) => void): Promise<void> {
  requireValue(Number.isInteger(port) && port >= 1 && port <= 65535, "--port must be an explicit integer from 1 to 65535");
  directory = resolve(directory);
  await safeComponents(directory);
  const lockPath = join(directory, ".writer.lock");
  const lock = await open(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
    .catch(() => { throw new CliError("Session writer lock is held or unavailable; stop its owner before serving", 3); });
  const identity = await lock.stat();
  let server: Bun.Server<undefined> | undefined;
  let writes: Promise<unknown> = Promise.resolve();
  let stopped = false;
  const completion = Promise.withResolvers<void>();
  const stop = () => { stopped = true; completion.resolve(); };
  process.on("SIGINT", stop); process.on("SIGTERM", stop);
  try {
    await lock.writeFile(JSON.stringify({ schema, kind: "lock", pid: process.pid }) + "\n");
    await lock.sync();
    const view = await validateSession(directory);
    await listAnnotations(view);
    const assets = new Map(view.cases.flatMap(c => c.assets.map(asset => [asset.id, asset] as const)));
    let validation: Promise<FeedbackView> | undefined;
    const writeToken = crypto.randomUUID();
    const html = await boundedFile(resolve(import.meta.dir, "../../viewer"), "index.html", 8 * 1024 * 1024);
    if (stopped) throw new CliError("Serve interrupted before startup", 1);
    const authority = `127.0.0.1:${port}`, origin = `http://${authority}`;
    let active = 0;
    const headers = {
      "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin", "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src 'self'; media-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    };
    function json(kind: string, data: object, status = 200): Response {
      return Response.json({ schema, kind, success: status < 400, ...data }, { status, headers });
    }
    server = Bun.serve({
      hostname: "127.0.0.1", port, reusePort: false, maxRequestBodySize: 65536, idleTimeout: 10,
      async fetch(request) {
        if (stopped) return json("error", { message: "Server stopping" }, 503);
        if (request.headers.get("host") !== authority || (request.headers.has("origin") && request.headers.get("origin") !== origin)) return json("error", { message: "Host or Origin refused" }, 403);
        if (["cross-site", "same-site"].includes(request.headers.get("sec-fetch-site") ?? "")) return json("error", { message: "Cross-origin request refused" }, 403);
        if (request.url.length > 2048 || [...request.headers].reduce((n, [k, v]) => n + k.length + v.length, 0) > 8192 || request.headers.has("transfer-encoding") || Number(request.headers.get("content-length") ?? "0") > 65536) return json("error", { message: "Request exceeds limits" }, 413);
        const mutation = request.method === "POST";
        if (request.method !== "GET" && !mutation) return json("error", { message: "Method not allowed" }, 405);
        if (mutation && (request.headers.get("origin") !== origin || request.headers.get("x-write-token") !== writeToken)) return json("error", { message: "Write authorization refused" }, 403);
        if (mutation && request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json("error", { message: "JSON payload required" }, 415);
        if (active >= 16) return json("error", { message: "Request limit reached" }, 429);
        active++;
        try {
          const url = new URL(request.url);
          if (url.search || url.hash || /%|\\/.test(url.pathname)) return json("error", { message: "Unsafe path" }, 400);
          if (mutation) {
            if (url.pathname !== "/api/v1/annotations") return json("error", { message: "Route not found" }, 404);
            const bytes = await request.arrayBuffer();
            if (bytes.byteLength > 65536) return json("error", { message: "Payload exceeds limit" }, 413);
            let input: unknown;
            try { input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
            catch { return json("error", { message: "Malformed JSON payload" }, 400); }
            // The queue stays usable after a failed save. Each response awaits its durable write.
            const saved = writes.then(() => createAnnotation(view, input));
            writes = saved.catch(() => {});
            const annotation = await saved;
            const response = json("annotation", { annotation }, 201);
            response.headers.set("ETag", `"${annotation.id}:${annotation.revision}"`);
            return response;
          }
          if (url.pathname === "/api/v1/annotations") return json("annotations", { annotations: await listAnnotations(view) });
          if (url.pathname === "/api/v1/export") return Response.json(await exportSession(directory), { headers });
          if (url.pathname === "/") return new Response(html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
          if (url.pathname === "/api/v1/session" || url.pathname === "/api/v1/cases") {
            // Concurrent session/case reads share work, but the next request checks disk again.
            const current = await (validation ??= validateSession(directory).finally(() => { validation = undefined; }));
            return url.pathname.endsWith("session") ? json("session", { session: current.session, writeToken }) : json("cases", { cases: current.cases });
          }
          if (url.pathname.startsWith("/api/v1/assets/")) {
            const id = url.pathname.slice("/api/v1/assets/".length);
            if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,255}$/.test(id)) return json("error", { message: "Invalid asset ID" }, 400);
            const asset = assets.get(id);
            if (!asset) return json("error", { message: "Asset is not registered" }, 404);
            const bytes = await assetBytes(directory, asset);
            return new Response(bytes, { headers: { ...headers, "Content-Type": asset.mediaType, "Content-Length": String(bytes.length), ETag: `"${asset.sha256}"` } });
          }
          return json("error", { message: "Route not found" }, 404);
        } catch (error) {
          if (error instanceof AnnotationError) return json("error", { message: error.message }, error.status);
          return json("error", { message: "Session or asset validation failed; validate the session and import a new identity" }, 409);
        } finally { active--; }
      },
      error() { return json("error", { message: "Request rejected" }, 400); },
    });
    ready({ url: origin, port, sessionId: view.session.id, readOnly: false });
    await completion.promise;
  } finally {
    stopped = true;
    if (server) await server.stop(false);
    // stop(false) drains active responses; the queue covers durable writes even on disconnect.
    await writes;
    process.off("SIGINT", stop); process.off("SIGTERM", stop);
    await lock.close();
    const current = await lstat(lockPath).catch(() => null);
    if (current?.ino === identity.ino && current.dev === identity.dev) await unlink(lockPath);
  }
}
