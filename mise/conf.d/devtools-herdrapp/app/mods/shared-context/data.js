// Each view owns bounded read cells. Writes bypass the cache and are never replayed by refresh.
import { runQuery, forgetTarget, targetKey, cancelled } from "./core.js";

const READS = new Set(["context", "directory", "file", "tracker", "detail"]);
const MAX_CELLS = 128;
const MAX_BYTES = 8 * 1024 * 1024;
const STORAGE = "shared-context:reads:v4";

export function query(operation, where, fields = {}, onProgress, options = {}) {
  return runQuery(operation, where, fields, onProgress, options.control ?? {});
}

export function discardSession(where, session) {
  return query("discard-session", where, { session });
}

export function createQueryClient(_cx) {
  return new QueryClient();
}

class QueryClient {
  constructor() {
    this.cells = new Map();
    this.closed = false;
    try {
      const saved = storedReads();
      for (const entry of saved.entries.slice(-MAX_CELLS)) {
        if (!entry.cache || !/^[a-f0-9]{64}$/.test(entry.cache.identity) || !/^[a-f0-9]{64}$/.test(entry.cache.version) || !READS.has(entry.operation) || !entry.target?.cwd || entry.key !== JSON.stringify([entry.target.machine ?? null, entry.target.cwd, entry.operation, ordered(entry.fields)])) continue;
        this.cells.set(entry.key, { ...entry, fence: saved.fence, generation: 0, stale: true, hasValue: true, listeners: new Set(), flight: null, control: null, released: false });
      }
    } catch { /* Missing or damaged storage is a cold read. */ }
  }

  query(operation, where, fields = {}, onProgress) {
    if (this.closed) return Promise.reject(cancelled());
    if (!READS.has(operation)) return query(operation, where, fields, onProgress);
    const target = { cwd: where.cwd, machine: where.machine ?? null };
    const key = JSON.stringify([target.machine, target.cwd, operation, ordered(fields)]);
    let cell = this.cells.get(key);
    if (!cell) {
      this.evict(target);
      cell = { key, target, operation, fields: JSON.parse(JSON.stringify(fields)), generation: 0, stale: true, hasValue: false, listeners: new Set(), flight: null, control: null, released: false };
      this.cells.set(key, cell);
    } else {
      this.cells.delete(key);
      this.cells.set(key, cell);
    }
    if (!cell.stale && cell.hasValue && !cell.flight) return Promise.resolve(cell.value);
    if (onProgress) cell.listeners.add(onProgress);
    if (!cell.flight) {
      cell.flight = this.read(cell).finally(() => { cell.flight = null; cell.control = null; cell.progress = null; });
    } else if (onProgress && cell.progress) onProgress(cell.progress);
    return cell.flight.finally(() => { if (onProgress) cell.listeners.delete(onProgress); });
  }

  peek(operation, where, fields = {}) {
    const key = JSON.stringify([where.machine ?? null, where.cwd, operation, ordered(fields)]);
    const cell = this.cells.get(key);
    return cell?.hasValue && !cell.released ? cell.value : null;
  }
  isCurrent(operation, where, fields = {}) {
    const key = JSON.stringify([where.machine ?? null, where.cwd, operation, ordered(fields)]);
    const cell = this.cells.get(key);
    return Boolean(cell?.hasValue && !cell.released && !cell.stale && !cell.flight);
  }


  async validate(where) {
    const target = targetKey(where);
    const cells = [...this.cells.values()].filter(cell => targetKey(cell.target) === target && cell.hasValue && cell.cache);
    // Invalidate first: an old result or validation cannot publish over this sweep.
    this.invalidate(where);
    const observations = cells.map(cell => ({ cell, generation: cell.generation, cache: cell.cache }));
    if (!observations.length) return [];
    const control = { cancelled: false };
    this.validationControls ??= new Map();
    this.validationControls.set(control, target);
    try {
      const rows = await runQuery("validate", where, { entries: observations.map(item => item.cache) }, undefined, control);
      if (control.cancelled || this.closed) throw cancelled();
      const applied = [];
      const retired = [];
      for (const { cell, generation, cache } of observations) {
        if (cell.released || generation !== cell.generation || cache !== cell.cache) continue;
        const row = rows.find(row => row.identity === cache.identity);
        applied.push({ operation: cell.operation, fields: cell.fields, status: row?.status ?? "unknown" });
        if (row?.status === "unchanged") cell.stale = false;
        if (row?.status === "removed") {
          cell.released = true; cell.hasValue = false;
          this.cells.delete(cell.key);
          retired.push(cell);
        }
      }
      this.persist(retired);
      return applied;
    } finally { this.validationControls.delete(control); }
  }

  retainDetails(where, snapshot) {
    const target = targetKey(where);
    const ids = new Set([...snapshot.tickets.map(record => `ticket:${record.id}`), ...snapshot.initiatives.map(record => `initiative:${record.id}`)]);
    const retired = [];
    for (const [key, cell] of this.cells) {
      if (targetKey(cell.target) !== target || cell.operation !== "detail" || ids.has(`${cell.fields.kind}:${cell.fields.id}`)) continue;
      cell.released = true; cell.generation++;
      if (cell.control) { cell.control.cancelled = true; cell.control.cancel?.(); }
      this.cells.delete(key);
      retired.push(cell);
    }
    this.persist(retired);
  }

  persist(retired = []) {
    try {
      // One durable snapshot fence replaces an unbounded history of deleted keys.
      // Concurrent older reads cannot republish bodies or overwrite newer values.
      const saved = storedReads(), merged = new Map(saved.entries.map(entry => [entry.key, entry]));
      const removed = new Set(retired.map(cell => cell.key));
      for (const cell of retired) {
        const entry = merged.get(cell.key);
        if (entry && entry.loadedAt === cell.loadedAt && entry.cache.identity === cell.cache?.identity && entry.cache.version === cell.cache?.version) merged.delete(cell.key);
      }
      for (const cell of this.cells.values()) {
        if (!cell.hasValue || !cell.cache || cell.released || removed.has(cell.key) || cell.fence !== saved.fence || (cell.loadedAt ?? 0) < (merged.get(cell.key)?.loadedAt ?? 0)) continue;
        merged.delete(cell.key);
        merged.set(cell.key, { key: cell.key, target: cell.target, operation: cell.operation, fields: cell.fields, cache: cell.cache, value: cell.value, loadedAt: cell.loadedAt });
      }
      const fence = saved.fence + 1;
      const entries = [...merged.values()].slice(-MAX_CELLS);
      let source = JSON.stringify({ entries, fence });
      while (source.length * 2 > MAX_BYTES && entries.length) { entries.shift(); source = JSON.stringify({ entries, fence }); }
      localStorage.setItem(STORAGE, JSON.stringify({ source, checksum: checksum(source) }));
    } catch { /* Storage quota failures must not prevent canonical reads. */ }
  }

  invalidate(where, operations) {
    const target = where ? targetKey(where) : null;
    const allowed = operations ? new Set(typeof operations === "string" ? [operations] : operations) : null;
    for (const cell of this.cells.values()) {
      if (target !== null && targetKey(cell.target) !== target || allowed && !allowed.has(cell.operation)) continue;
      cell.generation++;
      cell.stale = true;
    }
  }

  async release(where) {
    if (!where) this.closed = true;
    const target = where ? targetKey(where) : null, pending = [];
    for (const [control, key] of this.validationControls ?? []) {
      if (target !== null && key !== target) continue;
      control.cancelled = true;
      if (control.cancel) pending.push(Promise.resolve(control.cancel()));
    }
    for (const [key, cell] of this.cells) {
      if (target !== null && targetKey(cell.target) !== target) continue;
      cell.released = true;
      cell.generation++;
      cell.listeners.clear();
      if (cell.control) {
        cell.control.cancelled = true;
        if (cell.control.cancel) pending.push(Promise.resolve(cell.control.cancel()));
      }
      this.cells.delete(key);
      forgetTarget(cell.target);
    }
    const settled = await Promise.allSettled(pending);
    const failed = settled.find(result => result.status === "rejected");
    if (failed) throw failed.reason;
  }

  async read(cell) {
    for (; ;) {
      if (cell.released) throw cancelled();
      const generation = cell.generation;
      const fence = storedReads().fence;
      cell.stale = false;
      cell.control = { cancelled: false };
      let value;
      try {
        value = await runQuery(cell.operation, cell.target, { ...cell.fields, $cache: true }, progress => {
          if (cell.released || generation !== cell.generation) return;
          cell.progress = progress;
          for (const listener of cell.listeners) listener(progress);
        }, cell.control);
        if (!value?.cache || !/^[a-f0-9]{64}$/.test(value.cache.identity) || !/^[a-f0-9]{64}$/.test(value.cache.version) || !Object.hasOwn(value, "value")) throw new Error("The helper does not support versioned read results. Rebuild and deploy the helper and mod together.");
      } catch (error) {
        cell.stale = true;
        if (cell.released) throw cancelled();
        if (generation !== cell.generation) continue;
        throw error;
      }
      if (cell.released) throw cancelled();
      if (generation !== cell.generation) continue;
      cell.cache = value.cache;
      value = value.value;
      cell.value = value;
      cell.hasValue = true;
      cell.fence = fence;
      cell.loadedAt = Date.now();
      cell.stale = false;
      this.persist();
      return value;
    }
  }

  evict(target) {
    if (this.cells.size < MAX_CELLS) return;
    for (const [key, cell] of this.cells) {
      if (cell.flight || ["context", "tracker"].includes(cell.operation) && targetKey(cell.target) === targetKey(target)) continue;
      cell.released = true;
      this.cells.delete(key);
      return;
    }
    throw new Error("Too many Shared Context queries are running. Wait for a query to finish before opening more records.");
  }
}

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]));
  return value;
}

function checksum(source) {
  let value = 2166136261;
  for (let index = 0; index < source.length; index++) value = Math.imul(value ^ source.charCodeAt(index), 16777619);
  return value >>> 0;
}

function storedReads() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
    if (saved && typeof saved.source === "string" && saved.source.length * 2 <= MAX_BYTES && saved.checksum === checksum(saved.source)) {
      const value = JSON.parse(saved.source);
      if (Array.isArray(value.entries) && Number.isSafeInteger(value.fence) && value.fence >= 0) return value;
    }
  } catch { /* A damaged snapshot is a miss for every client. */ }
  return { entries: [], fence: 0 };
}
