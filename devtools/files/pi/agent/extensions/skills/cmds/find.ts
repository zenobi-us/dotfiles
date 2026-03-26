import type { SearchStrategy } from "../service/config.js";
import { bm25Search } from "../service/search-bm25.js";
import { lexicalScoreSearch } from "../service/search-lexical.js";
import type { SearchQuery, SearchResults } from "../service/search-shared.js";
import { vectorSearch } from "../service/search-vector.js";

export type {
  SearchQuery,
  SearchResults,
  ParsedSkillQuery,
  QueryIntent,
  NormalizedSkill,
} from "../service/search-shared.js";

export { parseSkillQuery } from "../service/search-shared.js";
export { lexicalScoreSearch } from "../service/search-lexical.js";
export { bm25Search } from "../service/search-bm25.js";
export { vectorSearch } from "../service/search-vector.js";

function reciprocalRankFusion(
  query: SearchQuery,
  total: number,
  lists: SearchResults[],
): SearchResults {
  const k = 60;
  const scored = new Map<
    string,
    {
      rank: number;
      item: SearchResults["skills"][number];
    }
  >();

  for (const list of lists) {
    list.skills.forEach((item, idx) => {
      const weight = 1 / (k + idx + 1);
      const existing = scored.get(item.name);
      if (!existing) {
        scored.set(item.name, { rank: weight, item });
      } else {
        existing.rank += weight;
      }
    });
  }

  const merged = Array.from(scored.values())
    .sort((a, b) => b.rank - a.rank)
    .map((entry) => entry.item);

  return {
    query,
    skills: merged,
    summary: {
      total,
      matches: merged.length,
      feedback:
        merged.length === 0
          ? "No skills matched (hybrid). Try broader terms or query '*' to list all skills."
          : `Found ${merged.length} matching skill(s) via hybrid`,
    },
  };
}

export function FindSkillsCmd(
  skills: import("../service/skill-registry.js").Skill[],
  query: SearchQuery,
  strategy: SearchStrategy = "lexical",
): SearchResults {
  if (strategy === "lexical") return lexicalScoreSearch(query, skills);
  if (strategy === "bm25") return bm25Search(query, skills);
  if (strategy === "vector") return vectorSearch(query, skills);

  const lexical = lexicalScoreSearch(query, skills);
  const bm25 = bm25Search(query, skills);
  const vector = vectorSearch(query, skills);
  return reciprocalRankFusion(query, lexical.summary.total, [lexical, bm25, vector]);
}
