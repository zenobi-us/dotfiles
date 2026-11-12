// Feedback imports retain a sealed evidence snapshot so validation works offline.
// Feedback records remain separate from the collector's authoritative records.
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { chmod, cp, lstat, mkdir, mkdtemp, open, readdir, realpath, rename, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { validateRun, type AssetRecord, type CaseRecord, type RunRecord } from "../../../collect-evidence/scripts/browser-evidence/records.ts";
import { CliError } from "../../../collect-evidence/scripts/browser-evidence/sh.ts";

export const schema = "collect-feedback/v1" as const;
const MAX_RECORD = 4 * 1024 * 1024;
export const MAX_ASSET = 128 * 1024 * 1024;
export interface Session {
  schema: typeof schema; kind: "session"; id: string; createdAt: string;
  source: RunRecord & { runId: string; manifestSha256: string };
  cases: Array<{ id: string; path: string }>;
}
export interface FeedbackCase extends Omit<CaseRecord, "schema" | "runId"> {
  schema: typeof schema; sessionId: string; source: { runId: string; caseId: string };
}
export interface FeedbackView { directory: string; session: Session; cases: FeedbackCase[] }
export interface ImportOptions { repository: string; workflow: string; session: string; dryRun?: boolean }

export async function importSession(source: string, options: ImportOptions): Promise<object> {
  checkId(options.session); checkId(options.workflow);
  const evidence = await validateRun(source);
  const destination = await route(options);
  const sourcePath = resolve(source), target = resolve(destination.path);
  requireValue(!inside(sourcePath, target) && !inside(target, sourcePath), "Source and destination must be separate trees");
  if (options.dryRun) return { dryRun: true, destination, runId: evidence.run.id };
  await safeComponents(dirname(target), true);
  await mkdir(dirname(target), { recursive: true });
  await safeComponents(dirname(target));
  const staging = await mkdtemp(join(dirname(target), ".incomplete-feedback-"));
  try {
    await cp(evidence.directory, join(staging, "source"), { recursive: true, errorOnExist: true, force: false });
    const snapshot = await validateRun(join(staging, "source"));
    const session: Session = {
      schema, kind: "session", id: options.session, createdAt: new Date().toISOString(),
      source: { ...snapshot.run, runId: snapshot.run.id, manifestSha256: digest(await boundedFile(join(staging, "source"), "run.json", MAX_RECORD)) },
      cases: snapshot.run.cases,
    };
    for (const record of snapshot.cases) {
      const directory = join(staging, "cases", record.id);
      await mkdir(join(directory, "media"), { recursive: true });
      const feedback = feedbackCase(record, session.id);
      for (const asset of record.assets) {
        const bytes = await assetBytes(join(staging, "source"), asset);
        await writeFile(join(staging, asset.path), bytes, { flag: "wx", mode: 0o444 });
      }
      await jsonFile(join(directory, "case.json"), feedback);
      await markdown(join(directory, "notes.md"), "case", `# Case ${record.id}\n\nRead-only imported evidence. Original capture times and hashes remain unchanged.\n`);
    }
    await jsonFile(join(staging, "session.json"), session);
    await markdown(join(staging, "index.md"), "session", `# Feedback ${session.id}\n\nRead-only viewer for sealed evidence ${snapshot.run.id}. Annotation editing and export are not supported.\n`);
    await validateSession(staging, true);
    await mkdir(target);
    try { await rename(staging, target); } catch (error) { await rmdir(target); throw error; }
    return { destination, session };
  } finally {
    await removeOwnedTree(staging);
  }
}

export async function validateSession(directory: string, importing = false): Promise<FeedbackView> {
  try {
    directory = resolve(directory);
    requireValue(importing || !directory.split(sep).at(-1)!.startsWith(".incomplete-feedback-"), "Session finalization is incomplete");
    await safeComponents(directory);
    const session = await readJson<Session>(directory, "session.json");
    requireValue(session.schema === schema && session.kind === "session", "Unsupported feedback session schema or kind");
    checkId(session.id);
    requireValue(typeof session.createdAt === "string" && Number.isFinite(Date.parse(session.createdAt)), "Invalid session creation time");
    const source = await validateRun(join(directory, "source"));
    requireValue(session.source?.manifestSha256 === digest(await boundedFile(join(directory, "source"), "run.json", MAX_RECORD)), "Source run identity changed");
    requireValue(same(session.source, { ...source.run, runId: source.run.id, manifestSha256: session.source.manifestSha256 }), "Source provenance changed");
    requireValue(same(session.cases, source.run.cases), "Invalid session case references");
    requireValue(source.cases.length <= 1000, "Session exceeds 1000 cases");
    const cases: FeedbackCase[] = [];
    const ids = new Set<string>();
    for (const original of source.cases) {
      const record = await readJson<FeedbackCase>(directory, `cases/${original.id}/case.json`);
      requireValue(record.schema === schema && record.kind === "case", "Unsupported feedback case schema or kind");
      requireValue(same(record, feedbackCase(original, session.id)), "Feedback case differs from its sealed source");
      for (const asset of record.assets) {
        requireValue(!ids.has(asset.id) && ids.size < 10000, "Duplicate asset ID or asset limit exceeded"); ids.add(asset.id);
        await assetBytes(directory, asset);
      }
      cases.push(record);
    }
    return { directory, session, cases };
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError("Invalid feedback session: missing, unsafe or malformed records", 2);
  }
}

/** Read bytes through one non-following descriptor; hash those same response bytes. */
export async function assetBytes(root: string, asset: AssetRecord): Promise<Buffer> {
  const bytes = await boundedFile(root, asset.path, MAX_ASSET, true);
  requireValue(digest(bytes) === asset.sha256, "Registered asset bytes changed; import a new session");
  return bytes;
}
export async function boundedFile(root: string, path: string, limit: number, immutable = false): Promise<Buffer> {
  requireValue(typeof path === "string" && path.length > 0 && !path.includes("\\") && !path.includes("\0") && !path.startsWith("/") && path.split("/").every(p => p !== ".." && p !== "." && p !== ""), "Unsafe registered path");
  const file = join(root, path);
  await safeComponents(file);
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    requireValue(await realpath(`/proc/self/fd/${handle.fd}`) === resolve(file), "File escaped its registered path");
    const stat = await handle.stat();
    requireValue(stat.isFile() && stat.size <= limit, "File is not regular or exceeds its size limit");
    requireValue(!immutable || (stat.mode & 0o222) === 0, "Registered media must be immutable");
    const bytes = Buffer.alloc(stat.size + 1);
    let length = 0;
    while (length < bytes.length) {
      const result = await handle.read(bytes, length, bytes.length - length, null);
      if (!result.bytesRead) break;
      length += result.bytesRead;
    }
    requireValue(length === stat.size, "File changed while reading");
    return bytes.subarray(0, length);
  } finally { await handle.close(); }
}
export async function safeComponents(path: string, allowMissing = false): Promise<void> {
  let current = resolve(path);
  while (true) {
    try { requireValue(!(await lstat(current)).isSymbolicLink(), "Symlink paths are not allowed"); }
    catch (error) { if (!allowMissing || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const parent = dirname(current); if (parent === current) break; current = parent;
  }
}
export function requireValue(value: unknown, message: string): asserts value { if (!value) throw new CliError(message, 2); }
export function checkId(value: unknown): asserts value is string { requireValue(typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value) && value !== "." && value !== "..", "ID must use 1–128 letters, digits, dots, underscores or hyphens"); }
function inside(root: string, path: string): boolean { const r = relative(root, path); return r === "" || (!r.startsWith(`..${sep}`) && r !== ".." && !r.startsWith(sep)); }
function digest(bytes: Buffer): string { return createHash("sha256").update(bytes).digest("hex"); }
function same(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }
function feedbackCase(record: CaseRecord, sessionId: string): FeedbackCase {
  const { runId, schema: _schema, ...fields } = record;
  return { ...fields, events: `source/${record.events}`, schema, sessionId, source: { runId, caseId: record.id } };
}
async function readJson<T>(root: string, path: string): Promise<T> { return JSON.parse((await boundedFile(root, path, MAX_RECORD)).toString("utf8")); }
async function jsonFile(path: string, data: unknown): Promise<void> { await writeFile(path, JSON.stringify(data, null, 2) + "\n", { flag: "wx" }); }
async function route(options: ImportOptions): Promise<{ path: string; ref: string; root: string; store: string }> {
  const cli = resolve(import.meta.dir, "../../../../../../agent-core/skills/shared-context/scripts/shared-context/cli.ts");
  const child = Bun.spawn([cli, "resolve", "evidence", "--workflow", options.workflow, "--run", options.session, "--json"], { cwd: resolve(options.repository), stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
  if (await child.exited !== 0) throw new CliError(`Evidence store resolution failed: ${err.trim()}`, 3);
  return JSON.parse(out);
}
async function markdown(path: string, kind: string, text: string): Promise<void> {
  const child = Bun.spawn(["mise", "exec", "--", "mq", "--allow-http-import", "--no-lockfile", "-I", "raw", "-F", "raw", "--no-clobber", "-o", path, 'import "github.com/harehare/okf.mq" | .'], { stdin: "pipe", stdout: "pipe", stderr: "pipe" });
  child.stdin.write(`---\nschema: ${schema}\nkind: ${kind}\n---\n${text}`);
  await child.stdin.end();
  const err = await new Response(child.stderr).text();
  if (await child.exited !== 0) throw new CliError(`Markdown generation failed: ${err}`, 3);
}
async function removeOwnedTree(path: string): Promise<void> {
  try {
    const stat = await lstat(path);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      await chmod(path, 0o700);
      for (const child of await readdir(path)) await removeOwnedTree(join(path, child));
      await rmdir(path);
    } else await rm(path);
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
