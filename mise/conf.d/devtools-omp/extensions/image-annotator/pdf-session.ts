// Owns one request's PDF processing, durable original, and one-use clipping consent.
// Both browser import and authenticated tablet Send use this same gate.
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AnnotatorResult, SourceImage } from "./index";

const exec = promisify(execFile);
const WORKER = join(import.meta.dirname, "pdf-worker.py");
const ROOT = join(homedir(), ".local", "share", "omp", "image-annotator");
interface Analysis {
  width: number;
  height: number;
  outsidePixels: number;
  requiresConfirmation: boolean;
  uncertainPaintBounds: boolean;
  exportDigest: string;
}

export interface PdfSession {
  requestId: string;
  sourceDigest: string;
  handle(request: IncomingMessage, response: ServerResponse, path: string,
    readBody: (request: IncomingMessage, limit: number) => Promise<Buffer>): Promise<boolean>;
  invalidate(): number;
  close(): void;
  isCurrent(revision: number): boolean;
}

export function createPdfSession(source: SourceImage | undefined, complete: (result: AnnotatorResult) => void): PdfSession {
  const requestId = randomBytes(16).toString("hex");
  const sourceDigest = source ? createHash("sha256").update(Buffer.from(source.data, "base64")).digest("hex") : "";
  const directory = join(ROOT, requestId);
  let revision = 0;
  let active = true;
  let pending: { consent: string; result: AnnotatorResult; analysis: Analysis } | undefined;
  let preparation: Promise<void> | undefined;
  const lifetime = new AbortController();
  let processing = new AbortController();

  function invalidate() {
    processing.abort();
    processing = new AbortController();
    revision++;
    pending = undefined;
    return revision;
  }
  function close() { active = false; lifetime.abort(); invalidate(); }
  function isCurrent(captured: number) { return active && captured === revision; }
  function json(response: ServerResponse, status: number, value: unknown) {
    response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify(value));
  }
  async function worker(mode: string, path: string, signal = lifetime.signal): Promise<string> {
    try {
      const { stdout } = await exec("uv", ["run", "--offline", "--no-project", "--script", WORKER, mode, path], {
        timeout: 60_000, maxBuffer: 1024 * 1024, signal,
      });
      return stdout;
    } catch (error) {
      const detail = error as Error & { stderr?: string };
      throw new Error(`PDF processing failed: ${detail.stderr || detail.message}\nPDF mode requires the pinned renderer. Setup: uv sync --script ${WORKER}`);
    }
  }
  async function prepare() {
    if (!source) throw new Error("Stock PDF import needs a source image.");
    preparation ??= (async () => {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(join(directory, "source-image"), Buffer.from(source.data, "base64"), { flag: "wx", mode: 0o600 });
      await worker("source", directory);
    })();
    return preparation;
  }
  async function handle(request: IncomingMessage, response: ServerResponse, path: string,
    readBody: (request: IncomingMessage, limit: number) => Promise<Buffer>): Promise<boolean> {
    if (!path.startsWith("/api/pdf-")) return false;
    if (!active) { json(response, 409, { error: "This request has ended." }); return true; }
    if (path === "/api/pdf-invalidate" && request.method === "POST") {
      invalidate(); json(response, 200, { requestId, sourceDigest }); return true;
    }
    if (path === "/api/pdf-source" && request.method === "GET") {
      await prepare();
      if (!active) { json(response, 409, { error: "This request has ended." }); return true; }
      response.writeHead(200, { "content-type": "application/pdf", "content-disposition": "attachment; filename=source.pdf", "cache-control": "no-store" });
      response.end(await readFile(join(directory, "source.pdf"))); return true;
    }
    if (path === "/api/pdf-confirm" && request.method === "POST") {
      const captured = pending;
      const body: unknown = JSON.parse((await readBody(request, 4096)).toString());
      if (!body || typeof body !== "object" || !("requestId" in body) || !("sourceDigest" in body) ||
        !("exportDigest" in body) || !("consent" in body) ||
        !active || !captured || pending !== captured || body.requestId !== requestId || body.sourceDigest !== sourceDigest ||
        body.exportDigest !== captured.analysis.exportDigest || body.consent !== captured.consent) {
        json(response, 409, { error: "This clipping confirmation is stale. Review the current PDF." }); return true;
      }
      close();
      complete(captured.result);
      json(response, 200, { status: "completed", originalPdfPath: captured.result.originalPdfPath }); return true;
    }
    if (path === "/api/pdf-submit" && request.method === "POST") {
      invalidate();
      const capturedRevision = revision;
      const signal = processing.signal;
      if (request.headers["content-type"] !== "application/pdf") {
        json(response, 415, { error: "Expected an annotated PDF." }); return true;
      }
      const data = await readBody(request, 50 * 1024 * 1024);
      if (!isCurrent(capturedRevision)) {
        json(response, 409, { error: "This PDF submission is stale or cancelled." }); return true;
      }
      try {
        await prepare();
      } catch (error) {
        if (isCurrent(capturedRevision)) throw error;
        json(response, 409, { error: "This PDF submission is stale or cancelled." }); return true;
      }
      if (!isCurrent(capturedRevision)) {
        json(response, 409, { error: "This PDF submission is stale or cancelled." }); return true;
      }
      const exportDigest = createHash("sha256").update(data).digest("hex");
      const exportDirectory = join(directory, `${capturedRevision}-${exportDigest}`);
      await mkdir(exportDirectory, { mode: 0o700 });
      const originalPdfPath = join(exportDirectory, "annotated.pdf");
      await writeFile(originalPdfPath, data, { flag: "wx", mode: 0o600 });
      await writeFile(join(exportDirectory, "source-image"), Buffer.from(source!.data, "base64"), { flag: "wx", mode: 0o600 });
      let analysis: Analysis;
      try {
        signal.throwIfAborted();
        analysis = JSON.parse(await worker("analyze", exportDirectory, signal));
      } catch (error) {
        if (!signal.aborted) throw error;
        json(response, 409, { error: "This PDF submission is stale or cancelled." }); return true;
      }
      const result: AnnotatorResult = { data: await readFile(join(exportDirectory, "clipped.png")), name: source!.name, originalPdfPath };
      await writeFile(join(exportDirectory, "analysis.json"), JSON.stringify({ requestId, sourceDigest, ...analysis }), { flag: "wx", mode: 0o600 });
      if (!isCurrent(capturedRevision)) {
        json(response, 409, { error: "This PDF submission is stale or cancelled." }); return true;
      }
      if (analysis.requiresConfirmation) {
        pending = { consent: randomBytes(32).toString("hex"), result, analysis };
        json(response, 202, { status: "confirmation-required", requestId, sourceDigest, ...analysis, consent: pending.consent, originalPdfPath });
      } else {
        close(); complete(result);
        json(response, 200, { status: "completed", originalPdfPath });
      }
      return true;
    }
    json(response, 404, { error: "Unknown PDF action." }); return true;
  }
  return { requestId, sourceDigest, handle, invalidate, close, isCurrent };
}
