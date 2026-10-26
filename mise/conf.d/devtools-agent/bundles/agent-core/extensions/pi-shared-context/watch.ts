import { EventEmitter } from "node:events";
import { watch, type FSWatcher } from "node:fs";
import { lstat, readdir, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export interface WatchTarget {
  key: string;
  path: string;
  recursive?: boolean;
  suffixes?: string[];
}

export class DirectoryMonitor {
  private targets: WatchTarget[] = [];
  private signatures = new Map<string, string>();
  private watchers = new Map<string, FSWatcher>();
  private dirty = new Set<string>();
  private timer?: NodeJS.Timeout;
  private interval: NodeJS.Timeout;
  private firstEvent = 0;
  private running = false;
  private pending = false;
  private disposed = false;
  private revision = 0;

  constructor(
    private changed: (keys: Set<string>) => Promise<void> | void,
    private failed: (error: unknown) => void,
    private reconcileMs = 5_000,
    private debounceMs = 200,
  ) {
    this.interval = setInterval(() => this.schedule(), reconcileMs);
    this.interval.unref();
  }

  setTargets(targets: WatchTarget[]): void {
    const next = targets.map(target => ({ ...target, path: resolve(target.path) }));
    if (JSON.stringify(next) === JSON.stringify(this.targets)) return;
    this.targets = next;
    this.revision++;
    this.schedule();
  }

  dispose(): void {
    this.disposed = true;
    clearInterval(this.interval);
    clearTimeout(this.timer);
    for (const watcher of this.watchers.values()) watcher.close();
    this.watchers.clear();
    this.dirty.clear();
  }

  private schedule(): void {
    if (this.disposed) return;
    if (!this.firstEvent) this.firstEvent = Date.now();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.reconcile(); }, Math.max(0, Math.min(this.debounceMs, 1_000 - (Date.now() - this.firstEvent))));
    this.timer.unref();
  }

  private async reconcile(): Promise<void> {
    this.firstEvent = 0;
    if (this.disposed) return;
    if (this.running) { this.pending = true; return; }
    this.running = true;
    try {
      do {
        this.pending = false;
        const revision = this.revision;
        const targets = this.targets;
        const wanted = new Map<string, { path: string; recursive: boolean }>();
        for (const target of targets) {
          const directory = await existingDirectory(target.path);
          const recursive = Boolean(target.recursive && directory === target.path);
          wanted.set(`${directory}:${recursive}:${(await stat(directory)).ino}`, { path: directory, recursive });
        }
        if (this.disposed) return;
        if (revision !== this.revision) { this.pending = true; continue; }
        for (const [id, directory] of wanted) {
          if (this.watchers.has(id)) continue;
          try {
            const watcher = watch(directory.path, { recursive: directory.recursive, persistent: false }, (_event, filename) => {
              const changedPath = filename == null ? undefined : resolve(directory.path, String(filename));
              for (const target of this.targets) {
                if (!changedPath || relevant(target, changedPath)) this.dirty.add(target.key);
              }
              if (this.dirty.size) this.schedule();
            });
            // This bundle's current FSWatcher types omit inherited emitter methods.
            EventEmitter.prototype.on.call(watcher, "error", (error: Error) => {
              watcher.close();
              this.watchers.delete(id);
              if (!this.disposed) { this.failed(error); this.schedule(); }
            });
            this.watchers.set(id, watcher);
          } catch (error) {
            this.failed(error);
          }
        }
        for (const [id, watcher] of this.watchers) {
          if (!wanted.has(id)) { watcher.close(); this.watchers.delete(id); }
        }
        const signatures = new Map<string, string>();
        for (const target of targets) {
          const id = `${target.key}:${target.path}`;
          const signature = await fingerprint(target);
          signatures.set(id, signature);
          if (!this.signatures.has(id) || this.signatures.get(id) !== signature) this.dirty.add(target.key);
        }
        if (this.disposed) return;
        if (revision !== this.revision) { this.pending = true; continue; }
        this.signatures = signatures;
        const active = new Set(targets.map(target => target.key));
        const dirty = new Set([...this.dirty].filter(key => active.has(key)));
        this.dirty.clear();
        if (dirty.size) await this.changed(dirty);
      } while (this.pending && !this.disposed);
    } catch (error) {
      if (!this.disposed) this.failed(error);
    } finally {
      this.running = false;
    }
  }
}

function within(root: string, path: string): boolean {
  const part = relative(root, path);
  return part === "" || part !== ".." && !part.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(part);
}

function relevant(target: WatchTarget, path: string): boolean {
  if (within(path, target.path)) return true;
  if (!within(target.path, path)) return false;
  if (!target.recursive && dirname(path) !== target.path) return false;
  return !target.suffixes || target.suffixes.some(suffix => path.endsWith(suffix)) || !path.split(/[\\/]/).at(-1)!.includes(".");
}

async function existingDirectory(path: string): Promise<string> {
  for (;;) {
    try {
      if ((await stat(path)).isDirectory()) return path;
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
    }
    const parent = dirname(path);
    if (parent === path) return path;
    path = parent;
  }
}

async function fingerprint(target: WatchTarget): Promise<string> {
  const parts: string[] = [];
  const visit = async (path: string, root = false): Promise<void> => {
    try {
      const info = root ? await stat(path, { bigint: true }) : await lstat(path, { bigint: true });
      const directory = info.isDirectory();
      if (directory || !target.suffixes || target.suffixes.some(suffix => path.endsWith(suffix))) parts.push(`${path}:${info.ino}:${info.size}:${info.mtimeNs}`);
      if (!directory || !root && !target.recursive) return;
      for (const entry of (await readdir(path)).sort()) await visit(join(path, entry));
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
      parts.push(`${path}:missing`);
    }
  };
  await visit(target.path, true);
  return parts.join("\n");
}
