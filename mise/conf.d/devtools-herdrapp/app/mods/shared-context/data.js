// Each view owns bounded read cells. Writes bypass the cache and are never replayed by refresh.
import { runQuery, forgetTarget, targetKey, cancelled } from "./core.js";

const READS = new Set(["context", "directory", "file", "tracker", "detail"]);
const MAX_CELLS = 64;

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
  }

  query(operation, where, fields = {}, onProgress) {
    if (this.closed) return Promise.reject(cancelled());
    if (!READS.has(operation)) return query(operation, where, fields, onProgress);
    const target = { cwd: where.cwd, machine: where.machine ?? null };
    const key = JSON.stringify([target.machine, target.cwd, operation, ordered(fields)]);
    let cell = this.cells.get(key);
    if (!cell) {
      this.evict();
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
      cell.stale = false;
      cell.control = { cancelled: false };
      let value;
      try {
        value = await runQuery(cell.operation, cell.target, cell.fields, progress => {
          if (cell.released || generation !== cell.generation) return;
          cell.progress = progress;
          for (const listener of cell.listeners) listener(progress);
        }, cell.control);
      } catch (error) {
        cell.stale = true;
        if (cell.released) throw cancelled();
        if (generation !== cell.generation) continue;
        throw error;
      }
      if (cell.released) throw cancelled();
      if (generation !== cell.generation) continue;
      cell.value = value;
      cell.hasValue = true;
      cell.stale = false;
      return value;
    }
  }

  evict() {
    if (this.cells.size < MAX_CELLS) return;
    for (const [key, cell] of this.cells) {
      if (cell.flight) continue;
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
