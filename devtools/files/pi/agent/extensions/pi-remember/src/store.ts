import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import type { MemoryRow, Scope, Store } from "./types.js";

export function getGlobalRoot(): string {
  return path.join(os.homedir(), ".pi", "agent", "memory");
}

export function getModelDir(): string {
  const dir = path.join(getGlobalRoot(), "models");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getGlobalDbPath(): string {
  const dir = getGlobalRoot();
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "memories.sqlite");
}

export function getProjectDbPath(cwd: string): string {
  const dir = path.join(cwd, ".agents", "memory");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "memories.sqlite");
}

export function getStores(cwd: string, scope: Scope): Store[] {
  if (scope === "global") return [{ source: "global", dbPath: getGlobalDbPath() }];
  if (scope === "project") return [{ source: "project", dbPath: getProjectDbPath(cwd) }];
  return [
    { source: "project", dbPath: getProjectDbPath(cwd) },
    { source: "global", dbPath: getGlobalDbPath() },
  ];
}

export function getDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(`
\t\tCREATE TABLE IF NOT EXISTS memories (
\t\t\tid INTEGER PRIMARY KEY AUTOINCREMENT,
\t\t\tcontent TEXT NOT NULL,
\t\t\ttimestamp TEXT NOT NULL,
\t\t\tembedding BLOB NOT NULL
\t\t)
\t`);
  return db;
}

export function readMemories(store: Store): MemoryRow[] {
  if (!fs.existsSync(store.dbPath)) return [];
  const db = getDb(store.dbPath);
  const rows = db.prepare("SELECT id, content, timestamp, embedding FROM memories").all() as MemoryRow[];
  db.close();
  return rows;
}
