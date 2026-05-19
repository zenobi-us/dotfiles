import type { Skill } from "./skill-registry.js";
import {
  FIELD_BOOSTS,
  SYNONYMS,
  containsExcluded,
  mapResult,
  normalizeSkills,
  normalizeText,
  queryToRawText,
  parseSkillQuery,
  tokenize,
  type NormalizedSkill,
  type SearchQuery,
  type SearchResults,
  visibleSkills,
} from "./search-shared.js";

function hashString(text: string, mod: number): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0) % mod;
}

function addVectorFeature(
  vector: Float64Array,
  key: string,
  weight: number,
): void {
  const idx = hashString(key, vector.length);
  vector[idx] += weight;
}

function addTokenFeatures(
  vector: Float64Array,
  token: string,
  weight: number,
): void {
  addVectorFeature(vector, `tok:${token}`, weight);

  if (token.length >= 3) {
    for (let i = 0; i <= token.length - 3; i++) {
      addVectorFeature(vector, `tri:${token.slice(i, i + 3)}`, weight * 0.3);
    }
  }

  const synonyms = SYNONYMS[token];
  if (Array.isArray(synonyms)) {
    for (const synonym of synonyms) {
      addVectorFeature(vector, `tok:${synonym}`, weight * 0.5);
    }
}
}

function buildVectorFromText(text: string, dimensions = 384): Float64Array {
  const vector = new Float64Array(dimensions);
  for (const token of tokenize(text)) {
    addTokenFeatures(vector, token, 1);
  }
  return vector;
}

function buildSkillVector(
  doc: NormalizedSkill,
  dimensions = 384,
): Float64Array {
  const vector = new Float64Array(dimensions);

  for (const token of tokenize(doc.qualified)) {
    addTokenFeatures(vector, token, FIELD_BOOSTS.qualified);
  }
  for (const token of tokenize(doc.shortname)) {
    addTokenFeatures(vector, token, FIELD_BOOSTS.shortname);
  }
  for (const token of tokenize(doc.description)) {
    addTokenFeatures(vector, token, FIELD_BOOSTS.description);
  }

  return vector;
}

function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function vectorSearch(query: SearchQuery, skills: Skill[]): SearchResults {
  const parsed = parseSkillQuery(query);
  const visible = visibleSkills(skills);

  if (parsed.listAll) {
    return mapResult(query, visible, visible, "vector");
  }

  const docs = normalizeSkills(visible).filter(
    (doc) => !containsExcluded(parsed, doc),
  );
  const rawQuery = normalizeText(queryToRawText(query));
  const queryVector = buildVectorFromText(rawQuery);

  const ranked = docs
    .map((doc) => {
      const docVector = buildSkillVector(doc);
      let score = cosineSimilarity(queryVector, docVector);
      if (rawQuery && doc.full.includes(rawQuery)) score += 0.08;
      return { doc, score };
    })
    .filter((r) => r.score > 0.08)
    .sort((a, b) => b.score - a.score);

  return mapResult(
    query,
    visible,
    ranked.map((r) => r.doc.skill),
    "vector",
  );
}
