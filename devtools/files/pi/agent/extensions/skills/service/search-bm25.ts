import type { Skill } from "./skill-registry.js";
import {
  FIELD_BOOSTS,
  containsExcluded,
  mapResult,
  normalizeSkills,
  normalizeText,
  parseSkillQuery,
  tokenize,
  type SearchQuery,
  type SearchResults,
  visibleSkills,
} from "./search-shared.js";

export function bm25Search(query: SearchQuery, skills: Skill[]): SearchResults {
  const parsed = parseSkillQuery(query);
  const visible = visibleSkills(skills);

  if (parsed.listAll) {
    return mapResult(query, visible, visible, "bm25");
  }

  const docs = normalizeSkills(visible).filter(
    (doc) => !containsExcluded(parsed, doc),
  );
  const queryTerms = parsed.include.flatMap((t) => tokenize(t));
  if (queryTerms.length === 0) {
    return mapResult(query, visible, [], "bm25");
  }

  const k1 = 1.2;
  const b = 0.75;

  const tfMaps = docs.map((doc) => {
    const tf = new Map<string, number>();
    for (const token of tokenize(doc.qualified)) {
      tf.set(token, (tf.get(token) ?? 0) + FIELD_BOOSTS.qualified);
    }
    for (const token of tokenize(doc.shortname)) {
      tf.set(token, (tf.get(token) ?? 0) + FIELD_BOOSTS.shortname);
    }
    for (const token of tokenize(doc.description)) {
      tf.set(token, (tf.get(token) ?? 0) + FIELD_BOOSTS.description);
    }
    return tf;
  });

  const docLengths = tfMaps.map((tf) =>
    Array.from(tf.values()).reduce((a, v) => a + v, 0),
  );
  const avgDocLength =
    docLengths.reduce((a, v) => a + v, 0) / Math.max(docLengths.length, 1);

  const documentFrequency = new Map<string, number>();
  for (const tf of tfMaps) {
    for (const term of new Set(tf.keys())) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const rawQuery = normalizeText(
    (Array.isArray(query) ? query.join(" ") : query).trim(),
  );

  const ranked = docs
    .map((doc, idx) => {
      let score = 0;
      const tf = tfMaps[idx];
      const dl = docLengths[idx] || 1;

      for (const term of queryTerms) {
        const termTf = tf.get(term) ?? 0;
        if (termTf <= 0) continue;

        const df = documentFrequency.get(term) ?? 0;
        const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
        const numerator = termTf * (k1 + 1);
        const denominator =
          termTf + k1 * (1 - b + b * (dl / Math.max(avgDocLength, 1)));
        score += idf * (numerator / denominator);
      }

      if (rawQuery && doc.full.includes(rawQuery)) {
        score += 0.75;
      }

      return { doc, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return mapResult(
    query,
    visible,
    ranked.map((r) => r.doc.skill),
    "bm25",
  );
}
