// Canonical replays validate semantic dependencies, including Git inspections.
// No timestamp shortcut or panel-supplied filesystem path can establish freshness.
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensurePrivateDirectory, QueryError } from "./native";
import type { Request, Progress } from "./protocol";
import { observeRead, type Observation } from "./observations";
import { withReadSession } from "./read-session";

const SCHEMA = "herdr-read/v1";
// Increment when canonical loaders or their result contracts change.
const LOADER = "canonical-replay/v2";
const MAX_ENTRIES = 512, MAX_BYTES = 32 * 1024 * 1024;
const MAX_ENTRY_BYTES = 6 * 1024 * 1024;
const HEX = /^[a-f0-9]{64}$/;
type Loader = (request: Request, progress?: (value: Progress) => void) => Promise<unknown>;
type Entry = { schema: string; identity: string; version: string; request: Request; context: string; observations: Observation[]; value: unknown };
type Token = { identity: string; version: string };
type Classification = { identity: string; status: "unchanged" | "changed" | "removed" | "unknown" };
const memory = new Map<string, { entry: Entry; bytes: number }>();
let memoryBytes = 0;

export class ReadCache {
  constructor(private readonly load: Loader, private readonly context: (cwd: string) => Promise<unknown>, private readonly root = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache"), "herdr/shared-context-reads")) { }

  async read(request: Request, progress?: (value: Progress) => void): Promise<{ cache: Token; value: unknown }> {
    const context = await this.context(request.cwd);
    const canonical = { ...request, cwd: await fs.realpath(request.cwd), fields: { ...request.fields } };
    delete canonical.fields.$cache;
    const identity = await this.identity(canonical, context);
    // Reading is always canonical. Only explicit batch validation can keep a
    // caller's displayed body without transferring it again.
    const { value, observations } = await withReadSession(() => this.capture(canonical, progress));
    const entry: Entry = { schema: SCHEMA, identity, version: digest([value, observations]), request: canonical, context: digest(context), observations, value };
    await this.store(entry);
    return { cache: { identity, version: entry.version }, value };
  }

  async validate(cwd: string, tokens: Token[]): Promise<Classification[]> {
    const repository = await fs.realpath(cwd), context = await this.context(repository), contextVersion = digest(context);
    const rows: Classification[] = tokens.map(token => ({ identity: token.identity, status: "unknown" }));
    const updates: { entry: Entry; source: string }[] = [];
    let cursor = 0, stagedBytes = 0;
    try {
      await withReadSession(async () => {
        await Promise.all(Array.from({ length: Math.min(4, tokens.length) }, async () => {
          while (cursor < tokens.length) {
            const index = cursor++, token = tokens[index]!, row = rows[index]!;
            const entry = await this.lookup(token.identity);
            if (!entry || entry.request.cwd !== repository || entry.context !== contextVersion || await this.identity(entry.request, context) !== token.identity) continue;
            try {
              const { value, observations } = await this.capture(entry.request);
              const version = digest([value, observations]);
              row.status = version === token.version ? "unchanged" : "changed";
              if (version !== entry.version) {
                const updated = { ...entry, version, observations, value }, source = JSON.stringify(updated), bytes = Buffer.byteLength(source);
                if (bytes <= MAX_ENTRY_BYTES && stagedBytes + bytes <= MAX_BYTES) {
                  stagedBytes += bytes;
                  updates.push({ entry: updated, source });
                }
              }
            } catch (error) {
              const code = (error as NodeJS.ErrnoException).code;
              if (code === "ENOENT" || code === "NOT_FOUND") row.status = "removed";
            }
          }
        }));
      });
      for (const update of updates) await this.store(update.entry, update.source);
      return rows;
    } catch {
      return tokens.map(token => ({ identity: token.identity, status: "unknown" }));
    }
  }
  private async capture(request: Request, progress?: (value: Progress) => void): Promise<{ value: unknown; observations: Observation[] }> {
    const before = await observeRead(request);
    const value = await this.load(request, progress);
    const observations = await observeRead(request);
    if (digest(before) !== digest(observations)) throw new QueryError("CHANGED_DURING_READ", "Query inputs changed during the read. Refresh to read a consistent result.");
    return { value, observations };
  }


  private async identity(request: Request, context: unknown): Promise<string> {
    const machine = await fs.readFile("/etc/machine-id", "utf8");
    return digest([SCHEMA, LOADER, machine.trim(), os.userInfo().username, process.getuid!(), request.cwd, context, request.operation, request.fields]);
  }

  private async lookup(identity: string): Promise<Entry | null> {
    if (!HEX.test(identity)) return null;
    // Disk is authoritative even when this process has a memory entry. A missing
    // or damaged observation must not become unchanged through a memory hit.
    try {
      await ensurePrivateDirectory(this.root);
      const file = path.join(this.root, `${identity}.json`), info = await fs.lstat(file);
      if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_ENTRY_BYTES || info.uid !== process.getuid!()) return null;
      const source = await fs.readFile(file, "utf8"), entry = JSON.parse(source) as Entry;
      if (entry.schema !== SCHEMA || entry.identity !== identity || !HEX.test(entry.version) || !Array.isArray(entry.observations) || digest([entry.value, entry.observations]) !== entry.version || !entry.request || !["context", "directory", "file", "tracker", "detail"].includes(entry.request.operation)) return null;
      // Cache mtime orders eviction only; it never establishes freshness.
      const accessed = new Date();
      await fs.utimes(file, accessed, accessed);
      const cached = memory.get(identity);
      if (cached?.entry.version === entry.version && cached.entry.context === entry.context) return cached.entry;
      remember(entry, Buffer.byteLength(source));
      return entry;
    } catch { return null; }
  }

  private async store(entry: Entry, source = JSON.stringify(entry)): Promise<void> {
    const bytes = Buffer.byteLength(source);
    if (bytes > MAX_ENTRY_BYTES) return;
    await ensurePrivateDirectory(this.root);
    const temporary = path.join(this.root, `.pending-${randomUUID()}`);
    try {
      const handle = await fs.open(temporary, "wx", 0o600);
      try { await handle.writeFile(source); await handle.sync(); } finally { await handle.close(); }
      await fs.rename(temporary, path.join(this.root, `${entry.identity}.json`));
      remember(entry, bytes);
      await this.prune();
    } finally { await fs.rm(temporary, { force: true }); }
  }

  private async prune(): Promise<void> {
    const entries = [];
    for (const name of await fs.readdir(this.root)) {
      if (!/^[a-f0-9]{64}\.json$/.test(name) && !name.startsWith(".pending-")) continue;
      const file = path.join(this.root, name);
      try {
        const stat = await fs.lstat(file);
        if (name.startsWith(".pending-")) {
          if (Date.now() - stat.mtimeMs > 180_000) await fs.rm(file, { force: true });
        } else entries.push({ file, bytes: stat.size, time: stat.mtimeMs });
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    entries.sort((a, b) => b.time - a.time);
    let bytes = 0;
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index]!; bytes += entry.bytes;
      if (index >= MAX_ENTRIES || bytes > MAX_BYTES) await fs.rm(entry.file, { force: true });
    }
  }
}

function remember(entry: Entry, bytes: number): void {
  const previous = memory.get(entry.identity);
  if (previous) memoryBytes -= previous.bytes;
  memory.delete(entry.identity); memory.set(entry.identity, { entry, bytes }); memoryBytes += bytes;
  while (memory.size > MAX_ENTRIES || memoryBytes > MAX_BYTES) {
    const key = memory.keys().next().value!;
    memoryBytes -= memory.get(key)!.bytes; memory.delete(key);
  }
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(ordered(value))).digest("hex");
}
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered((value as Record<string, unknown>)[key])]));
  return value;
}
