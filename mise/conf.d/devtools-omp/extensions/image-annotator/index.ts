import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import type { AddressInfo } from "node:net";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

declare const __dirname: string | undefined;
const EXTENSION_DIR = typeof __dirname === "string"
  ? __dirname
  : resolve(homedir(), ".omp", "agent", "extensions", "image-annotator");
const STATIC_DIR = resolve(EXTENSION_DIR, "dist");
const STATIC_CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

interface ExtensionContext {
  mode: "tui" | "rpc" | "json" | "print";
  cwd: string;
  signal?: AbortSignal;
  ui: { notify(message: string, type?: "info" | "warning" | "error"): void };
}

interface ExtensionAPI {
  registerCommand(
    name: string,
    command: { description: string; handler(args: string, ctx: ExtensionContext): Promise<void> },
  ): void;
  on(
    event: "input",
    handler: (event: { source: string; text: string; images?: ImageContent[] }, ctx: ExtensionContext) => Promise<{ action: "continue" | "handled" }>,
  ): void;
  sendUserMessage(content: ({ type: "text"; text: string } | ImageContent)[]): Promise<void> | void;
}

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_EXPORT_BYTES = 50 * 1024 * 1024;
const IMAGE_MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export interface SourceImage extends ImageContent {
  name: string;
}

export interface AnnotatorResult {
  data: Buffer;
  name: string;
}

export default function imageAnnotatorExtension(pi: ExtensionAPI): void {
  pi.registerCommand("annotate-image", {
    description: "Annotate an image file; for a pasted image, submit it with text starting `annotate:`",
    handler: async (args, ctx) => {
      const parsed = parseArguments(args);
      if (!parsed.path) {
        ctx.ui.notify("Usage: /annotate-image <imagepath>. For a pasted image, submit it with text starting `annotate:`.", "warning");
        return;
      }

      try {
        const source = await readImageFile(parsed.path, ctx.cwd);
        const result = await openAnnotator(source, ctx);
        if (result) await sendImage(pi, result, parsed.prompt);
      } catch (error) {
        ctx.ui.notify(errorMessage(error), "error");
      }
    },
  });

  pi.on("input", async (event, ctx) => {
    if (event.source === "extension") return { action: "continue" };

    const match = /^\s*annotate:\s*([\s\S]*)$/i.exec(event.text);
    if (!match) return { action: "continue" };

    const pastedImage = event.images?.[0];
    try {
      if (!pastedImage) {
        ctx.ui.notify("Attach an image and start the message with `annotate:`.", "warning");
        return { action: "handled" };
      }

      const source = imageContent(pastedImage, "pasted-image");
      const result = await openAnnotator(source, ctx);
      if (result) {
        await sendImage(pi, result, match[1]?.trim() || undefined, event.images?.slice(1));
      }
    } catch (error) {
      ctx.ui.notify(errorMessage(error), "error");
    }
    return { action: "handled" };
  });
}

function parseArguments(args: string): { path?: string; prompt?: string } {
  const trimmed = args.trim();
  if (!trimmed) return {};

  const quote = trimmed[0];
  if (quote === "'" || quote === '"') {
    const end = trimmed.indexOf(quote, 1);
    if (end < 0) throw new Error("Close the quote around the image path.");
    return {
      path: trimmed.slice(1, end),
      prompt: trimmed.slice(end + 1).trim() || undefined,
    };
  }

  const separator = trimmed.search(/\s/);
  return separator < 0
    ? { path: trimmed }
    : { path: trimmed.slice(0, separator), prompt: trimmed.slice(separator).trim() || undefined };
}

async function readImageFile(path: string, cwd: string): Promise<SourceImage> {
  const absolutePath = isAbsolute(path) ? path : resolve(cwd, path);
  const info = await stat(absolutePath);
  if (!info.isFile()) throw new Error(`Not a file: ${absolutePath}`);
  if (info.size === 0 || info.size > MAX_SOURCE_BYTES) {
    throw new Error("Image files must be between 1 byte and 25 MiB.");
  }

  const mimeType = IMAGE_MIME_TYPES[extname(absolutePath).toLowerCase()];
  if (!mimeType) throw new Error("Use a PNG, JPEG, WebP, or GIF image.");
  const data = await readFile(absolutePath);
  validateImageSignature(data, mimeType);
  return { type: "image", data: data.toString("base64"), mimeType, name: absolutePath };
}

function imageContent(image: ImageContent, name: string): SourceImage {
  if (!Object.values(IMAGE_MIME_TYPES).includes(image.mimeType)) {
    throw new Error("Use a PNG, JPEG, WebP, or GIF image.");
  }
  const data = Buffer.from(image.data, "base64");
  if (data.length === 0 || data.length > MAX_SOURCE_BYTES) {
    throw new Error("Image attachments must be between 1 byte and 25 MiB.");
  }
  validateImageSignature(data, image.mimeType);
  return { ...image, name };
}

function validateImageSignature(data: Buffer, mimeType: string): void {
  const matches = mimeType === "image/png"
    ? data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mimeType === "image/jpeg"
      ? data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
      : mimeType === "image/webp"
        ? data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP"
        : mimeType === "image/gif"
          ? data.length >= 6 && ["GIF87a", "GIF89a"].includes(data.toString("ascii", 0, 6))
          : false;
  if (!matches) throw new Error("The file content does not match its image type.");
}

async function openAnnotator(source: SourceImage, ctx: ExtensionContext): Promise<AnnotatorResult | undefined> {
  if (ctx.mode !== "tui") throw new Error("Image annotation needs Pi's interactive terminal mode.");
  const token = randomBytes(32).toString("hex");
  let complete: (result: AnnotatorResult | undefined) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const result = new Promise<AnnotatorResult | undefined>((resolveResult, rejectResult) => {
    complete = resolveResult;
    reject = rejectResult;
  });
  const server = await createAnnotationServer(source, token, complete);
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    await server.close();
    throw new Error("The annotation server did not start.");
  }

  const url = `http://127.0.0.1:${(address as AddressInfo).port}/?token=${token}`;
  try {
    const timeout = setTimeout(() => reject(new Error("Annotation timed out after 15 minutes.")), 15 * 60 * 1000);
    const abort = () => reject(new Error("Annotation was cancelled."));
    ctx.signal?.addEventListener("abort", abort, { once: true });
    if (ctx.signal?.aborted) abort();
    try {
      await openBrowser(url);
      return await result;
    } finally {
      clearTimeout(timeout);
      ctx.signal?.removeEventListener("abort", abort);
    }
  } finally {
    await server.close();
  }
}

export interface AnnotationServer {
  httpServer: Server;
  close(): Promise<void>;
}

export async function createAnnotationServer(
  source: SourceImage,
  token: string,
  complete: (result: AnnotatorResult | undefined) => void,
): Promise<AnnotationServer> {
  const httpServer = createServer((request, response) => {
    void handleRequest(request, response).catch((error: unknown) => {
      if (response.headersSent) response.destroy();
      else response.writeHead(500).end(errorMessage(error));
    });
  });
  await new Promise<void>((resolveListen, rejectListen) => {
    const onError = (error: Error) => rejectListen(error);
    httpServer.once("error", onError);
    httpServer.listen(0, "127.0.0.1", () => {
      httpServer.off("error", onError);
      resolveListen();
    });
  });

  return {
    httpServer,
    close: () => new Promise<void>((resolveClose, rejectClose) => {
      if (!httpServer.listening) {
        resolveClose();
        return;
      }
      httpServer.close((error) => error ? rejectClose(error) : resolveClose());
    }),
  };

  async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    if (requestUrl.pathname.startsWith("/api/")) {
      if (!isValidToken(requestUrl.searchParams.get("token"), token)) {
        response.writeHead(404).end();
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/api/source") {
        response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
        response.end(JSON.stringify({ data: source.data, mimeType: source.mimeType }));
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/api/cancel") {
        response.writeHead(200, { "cache-control": "no-store" }).end("Cancelled");
        complete(undefined);
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/api/done") {
        if (request.headers["content-type"] !== "image/png") {
          response.writeHead(415).end("Expected a PNG export.");
          return;
        }
        try {
          const data = await readRequest(request, MAX_EXPORT_BYTES);
          if (data.length === 0) throw new Error("The PNG export is empty.");
          response.writeHead(200, { "cache-control": "no-store" }).end("Done");
          complete({ data, name: source.name });
        } catch (error) {
          response.writeHead(413).end(errorMessage(error));
        }
        return;
      }
      response.writeHead(404).end();
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405).end();
      return;
    }
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const candidate = resolve(STATIC_DIR, `.${decodedPath}`);
    const filePath = candidate === STATIC_DIR ? resolve(STATIC_DIR, "index.html") : candidate;
    const relativePath = relative(STATIC_DIR, filePath);
    if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
      response.writeHead(404).end();
      return;
    }
    let data: Buffer;
    let servedPath = filePath;
    try {
      data = await readFile(servedPath);
    } catch {
      if (extname(servedPath)) {
        response.writeHead(404).end();
        return;
      }
      servedPath = resolve(STATIC_DIR, "index.html");
      data = await readFile(servedPath);
    }
    const contentType = STATIC_CONTENT_TYPES[extname(servedPath).toLowerCase()] ?? "application/octet-stream";
    response.writeHead(200, { "content-type": contentType, "cache-control": "no-store" });
    response.end(request.method === "HEAD" ? undefined : data);
  }
}

function isValidToken(candidate: string | null, token: string): boolean {
  if (!candidate || candidate.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(token));
}

async function readRequest(request: IncomingMessage, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error("The PNG export exceeds 50 MiB.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, size);
}

async function openBrowser(url: string): Promise<void> {
  const [command, args] = process.platform === "win32"
    ? ["cmd", ["/d", "/s", "/c", "start", "", url]]
    : process.platform === "darwin"
      ? ["open", [url]]
      : ["xdg-open", [url]];
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  try {
    await new Promise<void>((resolveSpawn, rejectSpawn) => {
      child.once("spawn", resolveSpawn);
      child.once("error", rejectSpawn);
    });
  } catch (error) {
    throw new Error(`Could not open a browser: ${errorMessage(error)}`);
  }
  child.unref();
}

async function sendImage(
  pi: ExtensionAPI,
  result: AnnotatorResult,
  prompt?: string,
  otherImages: ImageContent[] = [],
): Promise<void> {
  const name = result.name.split(/[\\/]/).at(-1) ?? "image";
  const text = prompt ? `${prompt}\n\nAnnotated image: ${name}` : `Annotated image: ${name}`;
  await pi.sendUserMessage([
    { type: "text", text },
    { type: "image", data: result.data.toString("base64"), mimeType: "image/png" },
    ...otherImages,
  ]);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
