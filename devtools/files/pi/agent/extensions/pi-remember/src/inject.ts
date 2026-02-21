import type { MemoryHit, RememberConfig, Scope } from "./types.js";

type Search = (cwd: string, query: string, scope: Scope) => Promise<MemoryHit[]>;

export async function buildMemoryBlock(
  text: string,
  config: RememberConfig,
  cwd: string,
  search: Search,
): Promise<string | null> {
  if (!text.trim()) return null;
  if (text.includes("<user_memories>")) return null;
  const results = await search(cwd, text.slice(0, 500), config.scope);
  const filtered = results.filter((r) => r.score >= config.inject.lowThreshold);
  const picked = filtered.slice(0, config.inject.count);
  if (!picked.length) return "<user_memories>\n[none] no relevant memories\n</user_memories>";
  const lines = picked.map((r) => {
    const tag = r.score >= config.inject.highThreshold ? "[important]" : "[related]";
    const sourceTag = config.scope === "both" ? ` [${r.source}]` : "";
    return `${tag}${sourceTag} ${r.content}`;
  });
  return `<user_memories>\n${lines.join("\n")}\n</user_memories>`;
}
