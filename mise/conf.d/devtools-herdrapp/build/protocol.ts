// The helper has one JSON protocol for direct requests and stored query results.
import path from "node:path";
import { contextData, setup, directory, file, tracker, detail, prepare, type CollectionKind } from "./data";
import { discardSession, QueryError } from "./native";
import type { SessionAction } from "../../devtools-agent/bundles/developer/skills/git/worktree/scripts/session-actions";
import { ReadCache } from "./cache";

export const MAX_ENVELOPE_BYTES = 6 * 1024 * 1024;
const MAX_REQUEST_BYTES = 1024 * 1024;
const operations: Record<string, true> = { context: true, setup: true, directory: true, file: true, tracker: true, detail: true, validate: true, prepare: true, "discard-session": true };
const collections: Record<string, true> = { alignment: true, tickets: true, initiatives: true, sources: true };
const actions: Record<SessionAction, true> = { "ask-matt": true, "to-tickets": true, grill: true, prototype: true, start: true, review: true, fix: true, finish: true, submit: true };
export type Request = { protocol: 1; operation: string; cwd: string; fields: Record<string, unknown> };
export type Progress = { phase: string; completed: number; total: number | null; current?: string };
export type Failure = { code: string; message: string };
export type Envelope = { protocol: 1; ok: true; value: unknown } | { protocol: 1; ok: false; error: Failure };

const reads: Record<string, true> = { context: true, directory: true, file: true, tracker: true, detail: true };
const cache = new ReadCache(load, async cwd => {
  const context = await contextData(cwd);
  return [context.repository, context.metadata.routes, context.metadata.layout, context.routeSource, context.root, context.collections];
});

export async function dispatch(request: Request, onProgress?: (progress: Progress) => void): Promise<unknown> {
  if (request.operation === "validate") return cache.validate(request.cwd, request.fields.entries as { identity: string; version: string }[]);
  if (Object.hasOwn(reads, request.operation) && request.fields.$cache === true) return cache.read(request, onProgress);
  return load(request, onProgress);
}

async function load(request: Request, onProgress?: (progress: Progress) => void): Promise<unknown> {
  const { cwd, operation, fields } = request;
  switch (operation) {
    case "context": return contextData(cwd);
    case "setup": return setup(cwd, fields.store as "repository" | "shared", fields.preset as string | undefined);
    case "directory": return directory(cwd, fields.collection as CollectionKind, fields.path as string);
    case "file": return file(cwd, fields.collection as CollectionKind, fields.path as string);
    case "tracker": return tracker(cwd, onProgress, fields.tree === true);
    case "detail": return detail(cwd, fields.id as string, fields.kind as "ticket" | "initiative");
    case "prepare": return prepare(cwd, fields.id as string, fields.kind as "ticket" | "initiative", fields.action as SessionAction, (fields.prompt as string | undefined) ?? "", fields.harness as string);
    case "discard-session": return discardSession(fields.session as string);
    default: throw new QueryError("INVALID_REQUEST", "Select a supported Shared Context operation.");
  }
}

export function parseRequest(source: string | undefined): Request {
  if (typeof source !== "string" || Buffer.byteLength(source) > MAX_REQUEST_BYTES) throw new QueryError("INVALID_REQUEST", "The request is missing or exceeds the 1 MiB request limit.");
  let value: unknown;
  try { value = JSON.parse(source); }
  catch { throw new QueryError("INVALID_REQUEST", "The request must be valid JSON."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new QueryError("INVALID_REQUEST", "The request must be a JSON object.");
  const request = value as Record<string, unknown>;
  if (request.protocol !== 1) throw new QueryError("PROTOCOL_MISMATCH", "The request must use protocol 1.");
  if (typeof request.cwd !== "string" || !path.isAbsolute(request.cwd) || request.cwd.includes("\0")) throw new QueryError("INVALID_REQUEST", "Select an absolute repository folder.");
  if (typeof request.operation !== "string" || !Object.hasOwn(operations, request.operation)) throw new QueryError("INVALID_REQUEST", "Select a supported Shared Context operation.");
  if (!request.fields || typeof request.fields !== "object" || Array.isArray(request.fields)) throw new QueryError("INVALID_REQUEST", "Request fields must be a JSON object.");
  const fields = request.fields as Record<string, unknown>;
  if (request.operation === "setup" && (fields.store !== "repository" && fields.store !== "shared" || fields.preset !== undefined && typeof fields.preset !== "string")) throw new QueryError("INVALID_REQUEST", "Select repository or shared storage and a valid preset.");
  if (request.operation === "validate" && (!Array.isArray(fields.entries) || fields.entries.length > 512 || fields.entries.some(entry => !entry || typeof entry !== "object" || !/^[a-f0-9]{64}$/.test(entry.identity) || !/^[a-f0-9]{64}$/.test(entry.version)))) throw new QueryError("INVALID_REQUEST", "Validation requires at most 512 cache identities and versions.");
  if ((request.operation === "directory" || request.operation === "file") && (typeof fields.collection !== "string" || !Object.hasOwn(collections, fields.collection) || typeof fields.path !== "string" || fields.path.includes("\0"))) throw new QueryError("INVALID_REQUEST", "Select a resolved context collection and a collection-relative path.");
  if ((request.operation === "detail" || request.operation === "prepare") && (typeof fields.id !== "string" || !fields.id || fields.kind !== "ticket" && fields.kind !== "initiative")) throw new QueryError("INVALID_REQUEST", "Select a ticket or initiative.");
  if (request.operation === "prepare" && (typeof fields.harness !== "string" || !fields.harness || typeof fields.action !== "string" || !Object.hasOwn(actions, fields.action) || fields.prompt !== undefined && typeof fields.prompt !== "string")) throw new QueryError("INVALID_REQUEST", "Select an agent harness, a supported action, and a text prompt.");
  if (request.operation === "discard-session" && typeof fields.session !== "string") throw new QueryError("INVALID_REQUEST", "Select a target session directory.");
  return request as Request;
}

export function failure(error: unknown): Failure {
  if (error instanceof QueryError) return { code: error.code, message: error.message.slice(0, 4096) };
  const code = (error as NodeJS.ErrnoException | null)?.code;
  if (code === "ENOENT") return { code: "NOT_FOUND", message: "A required target path no longer exists." };
  if (code === "EACCES" || code === "EPERM") return { code: "PERMISSION_DENIED", message: "The target user cannot access a required path or command." };
  return { code: "QUERY_FAILED", message: error instanceof Error ? error.message.slice(0, 4096) : "The target query failed." };
}

/** The size includes the final newline; Core must never receive truncated JSON. */
export function encodeEnvelope(envelope: Envelope): string {
  const source = JSON.stringify(envelope) + "\n";
  if (Buffer.byteLength(source) > MAX_ENVELOPE_BYTES) throw new QueryError("OUTPUT_TOO_LARGE", "The target query exceeded the 6 MiB response limit.");
  return source;
}
