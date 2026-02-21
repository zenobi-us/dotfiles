import fs from "node:fs";

import { loadConfig } from "./config.js";
import { decodeEmbedding, embedPassage, embedQuery, encodeEmbedding, similarity } from "./embed.js";
import { getDb, getGlobalDbPath, getGlobalRoot, getModelDir, getProjectDbPath, getStores, readMemories } from "./store.js";
import type { MemoryHit, MemoryItem, Scope, Source, Store } from "./types.js";

export { loadConfig, getDb, getGlobalDbPath, getGlobalRoot, getModelDir, getProjectDbPath, encodeEmbedding, embedPassage };

export async function searchMemories(cwd: string, query: string, scope: Scope): Promise<MemoryHit[]> {
  const q = query.trim();
  if (!q) return [];
  const qvec = await embedQuery(q);
  const results: MemoryHit[] = [];
  for (const store of getStores(cwd, scope)) {
    for (const row of readMemories(store)) {
      const score = similarity(qvec, decodeEmbedding(row.embedding));
      results.push({ id: row.id, content: row.content, score, source: store.source });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

export function listAllMemories(cwd: string, scope: Scope): MemoryItem[] {
  const items: MemoryItem[] = [];
  for (const store of getStores(cwd, scope)) {
    for (const row of readMemories(store)) {
      items.push({ id: row.id, content: row.content, timestamp: row.timestamp, source: store.source });
    }
  }
  items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return items;
}

export function deleteMemoryInStore(cwd: string, id: number, source: Source): boolean {
  const store: Store = source === "global" ? { source: "global", dbPath: getGlobalDbPath() } : { source: "project", dbPath: getProjectDbPath(cwd) };
  if (!fs.existsSync(store.dbPath)) return false;
  const db = getDb(store.dbPath);
  const before = db.prepare("SELECT COUNT(*) as c FROM memories").get() as { c: number };
  db.prepare("DELETE FROM memories WHERE id = ?").run(id);
  const after = db.prepare("SELECT COUNT(*) as c FROM memories").get() as { c: number };
  db.close();
  return before.c !== after.c;
}
