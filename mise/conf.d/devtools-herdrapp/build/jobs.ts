// Jobs keep target-private request state. Atomic snapshots let independent status readers
// observe real progress without a socket or one Core request per filesystem operation.
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync, promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { ensurePrivateDirectory, QueryError, QUERY_TIMEOUT_MS, withDeadline } from "./native";
import { dispatch, encodeEnvelope, failure, MAX_ENVELOPE_BYTES, parseRequest, type Failure, type Progress, type Request } from "./protocol";

type Event = Progress & { seq: number };
type State = "pending" | "running" | "done" | "error";
type Snapshot = { state: State; progress: Event[]; deadline: number; pid?: number; error?: Failure };
type Manifest = { protocol: 1; job: string; uid: number; request: Request };
export type JobStatus = { state: State; progress: Event[]; value?: unknown; error?: Failure };
const MAX_STATE_BYTES = 128 * 1024;
const MAX_PHASES = 16;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class QueryJobs {
  constructor(private readonly root = path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local/state"), "herdr/shared-context-queries")) { }

  async create(request: Request): Promise<{ job: string }> {
    if (request.operation !== "tracker" && request.operation !== "validate") throw new QueryError("INVALID_REQUEST", "Only tracker and validation reads use background query jobs.");
    await ensurePrivateDirectory(this.root);
    const job = randomUUID(), directory = path.join(this.root, job);
    await fs.mkdir(directory, { mode: 0o700 });
    try {
      atomicJson(directory, "request.json", { protocol: 1, job, uid: process.getuid!(), request } satisfies Manifest);
      atomicJson(directory, "status.json", { state: "pending", progress: [], deadline: Date.now() + (request.operation === "validate" ? 600_000 : QUERY_TIMEOUT_MS) } satisfies Snapshot);
      return { job };
    } catch (error) {
      await fs.rm(directory, { recursive: true, force: true });
      throw error;
    }
  }

  async run(job: string): Promise<{ state: "done" | "error" }> {
    const { directory, manifest } = await this.owned(job);
    const initial = readSnapshot(directory);
    if (initial.state !== "pending") throw new QueryError("JOB_ALREADY_STARTED", "This query job already has a worker.");
    if (Date.now() >= initial.deadline) throw new QueryError("DEADLINE_EXCEEDED", "The target query job expired before its worker started.");
    let lock;
    try { lock = openSync(path.join(directory, "worker.lock"), constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new QueryError("JOB_ALREADY_STARTED", "This query job already has a worker.");
      throw error;
    }
    closeSync(lock);
    const timeout = manifest.request.operation === "validate" ? 600_000 : QUERY_TIMEOUT_MS;
    const snapshot: Snapshot = { state: "running", progress: [], deadline: Date.now() + timeout, pid: process.pid };
    atomicJson(directory, "status.json", snapshot);
    let sequence = 0, active = true;
    const phases = new Map<string, { first: Event; latest: Event }>();
    const onProgress = (progress: Progress) => {
      if (!active) return;
      if (!phases.has(progress.phase) && phases.size >= MAX_PHASES) throw new QueryError("INVALID_PROGRESS", "The target query exceeded the progress phase limit.");
      const event = { ...progress, seq: ++sequence };
      const phase = phases.get(event.phase);
      if (phase) phase.latest = event;
      else phases.set(event.phase, { first: event, latest: event });
      snapshot.progress = [...phases.values()].flatMap(item => item.first.seq === item.latest.seq ? [item.first] : [item.first, item.latest]).sort((a, b) => a.seq - b.seq);
      atomicJson(directory, "status.json", snapshot);
    };
    try {
      const value = await withDeadline(() => dispatch(manifest.request, onProgress), timeout);
      active = false;
      // Validate the largest status response before publishing a terminal success.
      encodeEnvelope({ protocol: 1, ok: true, value: { state: "done", progress: snapshot.progress, value } });
      atomicJson(directory, "result.json", value);
      snapshot.state = "done";
      atomicJson(directory, "status.json", snapshot);
      return { state: "done" };
    } catch (error) {
      active = false;
      snapshot.state = "error";
      snapshot.error = failure(error);
      try { atomicJson(directory, "status.json", snapshot); }
      catch (writeError) { if ((writeError as NodeJS.ErrnoException).code !== "ENOENT") throw writeError; }
      return { state: "error" };
    }
  }

  async status(job: string, afterSeq = 0, waitMs = 0): Promise<JobStatus> {
    if (!Number.isSafeInteger(afterSeq) || afterSeq < 0 || !Number.isSafeInteger(waitMs) || waitMs < 0 || waitMs > 1000) throw new QueryError("INVALID_REQUEST", "Status requires a non-negative sequence and a wait from 0 to 1000 ms.");
    const { directory } = await this.owned(job);
    let snapshot = readSnapshot(directory);
    let terminalError = workerFailure(snapshot);
    if (waitMs > 0 && !terminalError && (snapshot.state === "pending" || snapshot.state === "running")) {
      await Bun.sleep(waitMs);
      snapshot = readSnapshot(directory);
      terminalError = workerFailure(snapshot);
    }
    const progress = snapshot.progress.filter(event => event.seq > afterSeq).sort((a, b) => a.seq - b.seq);
    if (terminalError) return { state: "error", progress, error: terminalError };
    if (snapshot.state === "done") return { state: "done", progress, value: readJson(path.join(directory, "result.json"), MAX_ENVELOPE_BYTES) };
    if (snapshot.state === "error") return { state: "error", progress, error: snapshot.error ?? { code: "QUERY_FAILED", message: "The target query failed." } };
    return { state: snapshot.state, progress };
  }

  async remove(job: string): Promise<{ removed: true }> {
    let owned;
    try { owned = await this.owned(job); }
    catch (error) { if (error instanceof QueryError && error.code === "JOB_NOT_FOUND") return { removed: true }; throw error; }
    await fs.rm(owned.directory, { recursive: true, force: true });
    return { removed: true };
  }

  private async owned(job: string): Promise<{ directory: string; manifest: Manifest }> {
    if (typeof job !== "string" || !UUID.test(job)) throw new QueryError("INVALID_JOB", "A query job must be an owned UUID.");
    await ensurePrivateDirectory(this.root);
    const directory = path.join(this.root, job);
    let info;
    try { info = await fs.lstat(directory); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new QueryError("JOB_NOT_FOUND", "The target query job no longer exists.");
      throw error;
    }
    if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid!() || (info.mode & 0o077) !== 0 || await fs.realpath(directory) !== path.join(await fs.realpath(this.root), job)) throw new QueryError("UNSAFE_PATH", "The query job directory is not owned private storage.");
    const manifest = readJson(path.join(directory, "request.json"), 2 * 1024 * 1024) as Manifest;
    if (!manifest || manifest.protocol !== 1 || manifest.job !== job || manifest.uid !== process.getuid!()) throw new QueryError("INVALID_JOB", "The query job has no matching ownership record.");
    manifest.request = parseRequest(JSON.stringify(manifest.request));
    if (manifest.request.operation !== "tracker" && manifest.request.operation !== "validate") throw new QueryError("INVALID_JOB", "The query job does not contain a tracker or validation read.");
    return { directory, manifest };
  }
}

function atomicJson(directory: string, name: string, value: unknown): void {
  const info = lstatSync(directory);
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid!()) throw new QueryError("UNSAFE_PATH", "Query state requires an owned directory.");
  const temporary = path.join(directory, `.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, JSON.stringify(value), { mode: 0o600, flag: "wx" });
    renameSync(temporary, path.join(directory, name));
  } finally {
    try { unlinkSync(temporary); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
}

function readJson(file: string, limit: number): unknown {
  const descriptor = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = fstatSync(descriptor);
    if (!info.isFile() || info.uid !== process.getuid!() || (info.mode & 0o077) !== 0) throw new QueryError("UNSAFE_PATH", "Query state must be a private file owned by the current user.");
    if (info.size > limit) throw new QueryError("OUTPUT_TOO_LARGE", "Stored query state exceeded its size limit.");
    try { return JSON.parse(readFileSync(descriptor, "utf8")); }
    catch (error) { if (error instanceof SyntaxError) throw new QueryError("INVALID_JOB", "The query job contains invalid JSON."); throw error; }
  } finally { closeSync(descriptor); }
}

function readSnapshot(directory: string): Snapshot {
  const snapshot = readJson(path.join(directory, "status.json"), MAX_STATE_BYTES) as Snapshot;
  if (!snapshot || !["pending", "running", "done", "error"].includes(snapshot.state) || !Number.isFinite(snapshot.deadline) || !Array.isArray(snapshot.progress) || snapshot.progress.length > MAX_PHASES * 2 || snapshot.progress.some(event => !event || !Number.isSafeInteger(event.seq) || event.seq < 1 || typeof event.phase !== "string" || !Number.isFinite(event.completed) || event.total !== null && !Number.isFinite(event.total))) throw new QueryError("INVALID_JOB", "The query job contains invalid status data.");
  if (snapshot.state === "running" && (!Number.isSafeInteger(snapshot.pid) || snapshot.pid! <= 0)) throw new QueryError("INVALID_JOB", "The query worker has no valid process identity.");
  return snapshot;
}

function workerFailure(snapshot: Snapshot): Failure | undefined {
  if (snapshot.state !== "pending" && snapshot.state !== "running") return;
  if (Date.now() >= snapshot.deadline) return { code: "DEADLINE_EXCEEDED", message: "The target query job exceeded its deadline." };
  if (snapshot.state === "running") {
    try { process.kill(snapshot.pid!, 0); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ESRCH") return { code: "WORKER_LOST", message: "The target query worker stopped before it published a result." }; }
  }
}
