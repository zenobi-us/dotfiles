// Reuses parsed documents, never filesystem observations or workflow authorization.
// A read session captures bytes once for parsing, then checks bytes and membership
// again before its caller publishes a snapshot.
import { createHash } from "node:crypto";
import { lstat, mkdtemp, open, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { TextDecoder } from "node:util";
import type { Exec, SharedAgentContext } from "../../../../../agent-core/extensions/pi-shared-context/model";
import { INITIATIVE_LINKS_QUERY } from "../../../../../matt-pocock/skills/reading-and-writing-tickets/scripts/record-schema";
import { validateStorePath } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/layout";

export type ParsedDocument = { fields: Record<string, unknown>; body: string; links: unknown[] };
type Capture = { file: string; root: string; actual: string; digest: string; bytes: Buffer; identity: string; key: string };
type Collection = { root: string; storeRoot: string; pattern: RegExp; membership: string };
type CacheEntry = { document: ParsedDocument; size: number };
type ParseResult = { document: ParsedDocument } | { error: unknown };
type PendingParse = { result: Promise<ParseResult>; settle: (result: ParseResult) => void };
const PARSER_VERSION = "okf-document/v2";
const MAX_CACHE_ENTRIES = 2_048;
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const parsedCache = new Map<string, CacheEntry>();
const pendingParses = new Map<string, PendingParse>();
let cacheBytes = 0;

export class DocumentReadSession {
 private readonly captures = new Map<string, Capture>();
 private readonly collections: Collection[] = [];
 private readonly contextKey: string;

 constructor(context: SharedAgentContext, private readonly exec: Exec) {
  this.contextKey = JSON.stringify([context.canonicalOrigin, context.slug, context.repositoryRoot, context.candidateSharedRoot, context.alignmentRoot, context.root, context.layout, context.routes]);
 }

 async collect(root: string, pattern: RegExp, storeRoot = root): Promise<string[]> {
  const collection = await scanCollection(root, storeRoot, pattern);
  this.collections.push({ root, storeRoot, pattern, membership: collection.membership });
  return collection.files;
 }

 async captureAll(requests: { file: string; root: string }[]): Promise<Map<string, unknown>> {
  const errors = new Map<string, unknown>();
  for (const { file, root } of requests) {
   try {
    const capture = this.captures.get(file);
    if (!capture) this.captures.set(file, await captureFile(file, root, this.contextKey));
    else if (resolve(capture.root) !== resolve(root)) throw new Error("Document requested through different store roots.");
   } catch (error) { errors.set(file, error); }
  }
  return errors;
 }

 async readAll(requests: { file: string; root: string }[]): Promise<{ documents: Map<string, ParsedDocument>; errors: Map<string, unknown> }> {
  const documents = new Map<string, ParsedDocument>();
  const errors = await this.captureAll(requests);
  const changed: Capture[] = [];
  const waiting: { capture: Capture; result: Promise<ParseResult> }[] = [];
  const owned = new Map<string, PendingParse>();
  for (const { file } of requests) {
   if (errors.has(file)) continue;
   try {
    const capture = this.captures.get(file)!;
    const cached = parsedCache.get(capture.key);
    if (cached) {
     parsedCache.delete(capture.key);
     parsedCache.set(capture.key, cached);
     documents.set(file, structuredClone(cached.document));
    } else {
     let pending = pendingParses.get(capture.key);
     if (pending) waiting.push({ capture, result: pending.result });
     else {
      pending = pendingParse();
      pendingParses.set(capture.key, pending);
      owned.set(capture.key, pending);
      changed.push(capture);
     }
    }
   } catch (error) { errors.set(file, error); }
  }
  try {
   const markdown: Capture[] = [];
   const input: { source: string }[] = [];
   for (const capture of changed.filter(capture => capture.file.endsWith(".md"))) {
    try { input.push({ source: decode(capture.bytes) }); markdown.push(capture); }
    catch (error) { errors.set(capture.file, error); }
   }
   if (markdown.length) {
    try {
     const query = `import "github.com/harehare/okf.mq" | import "section" | map(fn(item): try: do let source = item["source"] | let doc = okf::okf_parse(source) | { document: { fields: doc["frontmatter"], body: doc["body"], links: ${INITIATIVE_LINKS_QUERY} } }; catch(e): { error: e["message"] };)`;
     const output: unknown = JSON.parse(await temporaryInput(this.exec, JSON.stringify(input), "json", query));
     if (!Array.isArray(output) || output.length !== markdown.length) throw new Error("mq returned an invalid document batch.");
     for (let index = 0; index < markdown.length; index++) {
      const capture = markdown[index]!;
      try {
       const row = object(output[index], "mq batch result");
       if (typeof row.error === "string") throw new Error(row.error);
       remember(capture, parseDocument(row.document), documents);
      } catch (error) { errors.set(capture.file, error); }
     }
    } catch (error) { for (const capture of markdown) errors.set(capture.file, error); }
   }
   for (const capture of changed.filter(capture => !capture.file.endsWith(".md"))) {
    try {
     const source = decode(capture.bytes);
     const fields = capture.file.endsWith(".json") ? JSON.parse(source) : JSON.parse(await temporaryInput(this.exec, source, "yaml", 'import "github.com/harehare/okf.mq" | .'));
     remember(capture, { fields: object(fields, "document fields"), body: "", links: [] }, documents);
    } catch (error) { errors.set(capture.file, error); }
   }
  } finally {
   for (const capture of changed) {
    const pending = owned.get(capture.key)!;
    const document = documents.get(capture.file);
    pending.settle(document ? { document: structuredClone(document) } : { error: errors.get(capture.file) ?? new Error("Document parsing did not produce a result.") });
    if (pendingParses.get(capture.key) === pending) pendingParses.delete(capture.key);
   }
  }
  // Finish this reader's owned batch before waiting, so overlapping batches
  // cannot deadlock by each waiting for a document reserved by the other.
  for (const { capture, result } of waiting) {
   const parsed = await result;
   if ("document" in parsed) documents.set(capture.file, structuredClone(parsed.document));
   else errors.set(capture.file, parsed.error);
  }
  return { documents, errors };
 }

 async read(file: string, root: string): Promise<ParsedDocument> {
  const { documents, errors } = await this.readAll([{ file, root }]);
  if (errors.has(file)) throw errors.get(file);
  return documents.get(file)!;
 }

 digest(file: string): string {
  const capture = this.captures.get(file);
  if (!capture) throw new Error("Document checksum requested before capture.");
  return capture.digest;
 }

 actual(file: string): string {
  const capture = this.captures.get(file);
  if (!capture) throw new Error("Document path requested before capture.");
  return capture.actual;
 }

 async validate(): Promise<void> {
  try {
   await this.validateCollections();
   for (const capture of this.captures.values()) {
    const current = await captureFile(capture.file, capture.root, this.contextKey);
    if (current.digest !== capture.digest || current.actual !== capture.actual || current.identity !== capture.identity) throw changedDuringRead();
   }
   await this.validateCollections();
  } catch (error) {
   if (error instanceof Error && error.message.startsWith("Records changed during read")) throw error;
   throw changedDuringRead(error);
  }
 }

 private async validateCollections(): Promise<void> {
  for (const collection of this.collections) {
   const current = await scanCollection(collection.root, collection.storeRoot, collection.pattern);
   if (current.membership !== collection.membership) throw changedDuringRead();
  }
 }
}

function pendingParse(): PendingParse {
 const { promise, resolve } = Promise.withResolvers<ParseResult>();
 return { result: promise, settle: resolve };
}

function remember(capture: Capture, document: ParsedDocument, documents: Map<string, ParsedDocument>): void {
 const size = capture.bytes.length + Buffer.byteLength(JSON.stringify(document));
 if (size <= MAX_CACHE_BYTES) {
  const previous = parsedCache.get(capture.key);
  if (previous) cacheBytes -= previous.size;
  parsedCache.delete(capture.key);
  parsedCache.set(capture.key, { document, size });
  cacheBytes += size;
  while (parsedCache.size > MAX_CACHE_ENTRIES || cacheBytes > MAX_CACHE_BYTES) {
   const key = parsedCache.keys().next().value!;
   cacheBytes -= parsedCache.get(key)!.size;
   parsedCache.delete(key);
  }
 }
 documents.set(capture.file, structuredClone(document));
}

async function captureFile(file: string, root: string, contextKey: string): Promise<Capture> {
 const actualRoot = await realpath(root);
 const actual = await contained(root, file);
 const handle = await open(actual, "r");
 try {
  const before = await handle.stat({ bigint: true });
  if (!before.isFile()) throw new Error("Record must be a regular file.");
  const bytes = await handle.readFile();
  const after = await handle.stat({ bigint: true });
  const current = await stat(file, { bigint: true });
  if (fileIdentity(before) !== fileIdentity(after) || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs || fileIdentity(current) !== fileIdentity(after) || current.size !== after.size || current.mtimeNs !== after.mtimeNs || current.ctimeNs !== after.ctimeNs || await contained(root, file) !== actual || await realpath(root) !== actualRoot) throw changedDuringRead();
  const digest = createHash("sha256").update(bytes).digest("hex");
  const format = file.endsWith(".md") ? "markdown" : file.endsWith(".json") ? "json" : "yaml";
  return { file, root, actual, digest, bytes, identity: `${fileIdentity(after)}:${after.size}:${after.mtimeNs}:${after.ctimeNs}`, key: JSON.stringify([PARSER_VERSION, contextKey, resolve(root), actualRoot, resolve(file), actual, format, digest]) };
 } finally { await handle.close(); }
}

async function scanCollection(root: string, storeRoot: string, pattern: RegExp): Promise<{ files: string[]; membership: string }> {
 if (!await exists(root)) {
  // Validate projected paths through existing ancestors without creating a store.
  await validateStorePath(storeRoot, relative(storeRoot, root).split("\\").join("/") || basename(root));
  return { files: [], membership: "missing" };
 }
 const actualRoot = await realpath(root);
 const found: string[] = [];
 const entries: unknown[] = [];
 const visited = new Set<string>();
 const walk = async (directory: string): Promise<void> => {
  const actual = await contained(storeRoot, directory);
  if (!within(actualRoot, actual)) throw new Error("Record symlink escapes its configured collection.");
  if (visited.has(actual)) throw new Error("Collection contains a directory alias or symlink cycle.");
  visited.add(actual);
  const info = await stat(directory, { bigint: true });
  entries.push([directory, actual, "directory", fileIdentity(info), String(info.mtimeNs), String(info.ctimeNs)]);
  for (const entry of (await readdir(directory)).sort()) {
   const file = join(directory, entry);
   const target = await contained(storeRoot, file);
   if (!within(actualRoot, target)) throw new Error("Record symlink escapes its configured collection.");
   const info = await stat(file, { bigint: true });
   entries.push([file, target, info.isDirectory() ? "directory" : info.isFile() ? "file" : "other", fileIdentity(info), (await lstat(file)).isSymbolicLink()]);
   if (info.isDirectory()) await walk(file);
   else if (info.isFile() && pattern.test(entry)) found.push(file);
  }
 };
 await walk(root);
 return { files: found, membership: JSON.stringify(entries) };
}

async function temporaryInput(exec: Exec, source: string, format: "json" | "yaml", query: string): Promise<string> {
 const directory = await mkdtemp(join(tmpdir(), "shared-context-documents-"));
 try {
  const file = join(directory, `input.${format}`);
  await writeFile(file, source, { mode: 0o600 });
  const result = await exec("mq", ["--allow-http-import", "--no-lockfile", "-I", format, "-F", "json", query, file]);
  if (result.code !== 0) throw new Error(`mq failed (exit ${result.code}): ${result.stdout}`);
  return result.stdout;
 } finally { await rm(directory, { recursive: true, force: true }); }
}

function parseDocument(value: unknown): ParsedDocument {
 const parsed = object(value, "mq document");
 if (typeof parsed.body !== "string") throw new Error("document body must be a string.");
 if (!Array.isArray(parsed.links)) throw new Error("document links must be a list.");
 return { fields: object(parsed.fields, "document fields"), body: parsed.body, links: parsed.links };
}
function object(value: unknown, label: string): Record<string, unknown> {
 if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
 return value as Record<string, unknown>;
}
function decode(bytes: Buffer): string {
 return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
}
function fileIdentity(info: { dev: bigint; ino: bigint }): string { return `${info.dev}:${info.ino}`; }
function changedDuringRead(cause?: unknown): Error {
 return new Error("Records changed during read. Reload the explorer before acting.", cause === undefined ? undefined : { cause });
}
async function exists(path: string): Promise<boolean> {
 try { await stat(path); return true; }
 catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  try { if ((await lstat(path)).isSymbolicLink()) throw new Error("Record path contains a dangling symlink."); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  return false;
 }
}
function within(root: string, target: string): boolean {
 const path = relative(resolve(root), resolve(target));
 return path === "" || (path !== ".." && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(path));
}
async function contained(root: string, target: string): Promise<string> {
 if (!within(root, target)) throw new Error("Record path escapes its configured store.");
 const actual = await realpath(target);
 if (!within(await realpath(root), actual)) throw new Error("Record symlink escapes its configured store.");
 return actual;
}
