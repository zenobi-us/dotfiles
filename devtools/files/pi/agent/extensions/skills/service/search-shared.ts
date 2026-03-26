import type { Skill } from "./skill-registry.js";

export type SearchQuery = string | string[];

export type SearchResults = {
  query: SearchQuery;
  skills: {
    name: string;
    shortname: string;
    description: string;
    location: string;
  }[];
  summary: {
    total: number;
    matches: number;
    feedback: string;
  };
};

export type QueryIntent = "phrase" | "terms" | "mixed";

export type ParsedSkillQuery = {
  include: string[];
  exclude: string[];
  listAll: boolean;
};

export type NormalizedSkill = {
  skill: Skill;
  qualified: string;
  shortname: string;
  description: string;
  full: string;
  tokens: string[];
};

export const FIELD_BOOSTS = {
  qualified: 3.0,
  shortname: 2.5,
  description: 1.0,
} as const;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "where",
  "which",
  "with",
  "you",
]);

export const SYNONYMS: Record<string, string[]> = {
  debug: ["diagnose", "troubleshoot", "fix"],
  diagnose: ["debug", "troubleshoot"],
  troubleshoot: ["debug", "diagnose", "fix"],
  test: ["testing", "spec", "assert"],
  testing: ["test", "spec"],
  refactor: ["cleanup", "restructure"],
  plan: ["design", "architecture"],
  perf: ["performance", "optimize"],
  optimize: ["performance", "perf"],
  docs: ["documentation", "readme"],
  documentation: ["docs", "readme"],
};

export function parseSkillQuery(query: SearchQuery): ParsedSkillQuery {
  const raw = (Array.isArray(query) ? query : [query]).join(" ").trim();

  if (!raw || raw === "*") {
    return { include: [], exclude: [], listAll: true };
  }

  const parts = raw.match(/"[^"]+"|'[^']+'|[^\s,]+/g) ?? [];
  const include: string[] = [];
  const exclude: string[] = [];

  for (const rawPart of parts) {
    let part = rawPart.trim();
    let isExclude = false;

    if (part.startsWith("-") && part.length > 1) {
      isExclude = true;
      part = part.slice(1);
    }

    if (
      (part.startsWith('"') && part.endsWith('"')) ||
      (part.startsWith("'") && part.endsWith("'"))
    ) {
      part = part.slice(1, -1);
    }

    const normalized = normalizeText(part);
    if (!normalized) continue;

    if (isExclude) exclude.push(normalized);
    else include.push(normalized);
  }

  return { include, exclude, listAll: include.length === 0 };
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

export function mapResult(
  query: SearchQuery,
  visibleSkills: Skill[],
  matches: Skill[],
  mode: string,
): SearchResults {
  return {
    query,
    skills: matches.map((skill) => ({
      name: skill.qualifiedName,
      shortname: skill.name,
      description: skill.description,
      location: skill.filePath,
    })),
    summary: {
      total: visibleSkills.length,
      matches: matches.length,
      feedback:
        matches.length === 0
          ? `No skills matched (${mode}). Try broader terms or query '*' to list all skills.`
          : `Found ${matches.length} matching skill(s) via ${mode}`,
    },
  };
}

export function visibleSkills(skills: Skill[]): Skill[] {
  return skills.filter((s) => !s.disableModelInvocation);
}

export function normalizeSkills(skills: Skill[]): NormalizedSkill[] {
  return skills.map((skill) => {
    const qualified = normalizeText(skill.qualifiedName);
    const shortname = normalizeText(skill.name);
    const description = normalizeText(skill.description);
    const full = `${qualified} ${shortname} ${description}`.trim();
    return {
      skill,
      qualified,
      shortname,
      description,
      full,
      tokens: tokenize(full),
    };
  });
}

export function detectIntent(
  query: SearchQuery,
  parsed: ParsedSkillQuery,
): QueryIntent {
  const raw = (Array.isArray(query) ? query : [query]).join(" ").trim();
  const terms = parsed.include.flatMap((t) => tokenize(t));

  if (terms.length === 0) return "mixed";

  const hasQuotes = /["']/.test(raw);
  const hasComma = raw.includes(",");
  const hasExclusions = parsed.exclude.length > 0;
  const stopwordCount = terms.filter((t) => STOPWORDS.has(t)).length;
  const stopwordRatio = stopwordCount / Math.max(terms.length, 1);

  if (hasQuotes) return "phrase";
  if (hasComma || hasExclusions) return "terms";
  if (terms.length >= 5 && stopwordRatio >= 0.25) return "phrase";
  if (terms.length <= 3 && stopwordRatio <= 0.2) return "terms";
  return "mixed";
}

export function fieldPhraseScore(field: string, phrase: string): number {
  if (!field || !phrase) return 0;
  if (field === phrase) return 1;
  if (field.includes(phrase)) {
    const lengthFactor = Math.min(
      1,
      phrase.length / Math.max(field.length * 0.6, 1),
    );
    return 0.85 + 0.15 * lengthFactor;
  }

  const phraseTerms = tokenize(phrase);
  if (phraseTerms.length < 2) return 0;
  const fieldTerms = new Set(tokenize(field));
  const overlap = phraseTerms.filter((t) => fieldTerms.has(t)).length;
  if (overlap === 0) return 0;
  return 0.35 * (overlap / phraseTerms.length);
}

export function maxTokenSimilarity(term: string, tokens: string[]): number {
  let best = 0;
  for (const token of tokens) {
    const sim = diceCoefficient(term, token);
    if (sim > best) best = sim;
  }
  return best;
}

export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const aBigrams = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const gram = a.slice(i, i + 2);
    aBigrams.set(gram, (aBigrams.get(gram) ?? 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const gram = b.slice(i, i + 2);
    const count = aBigrams.get(gram) ?? 0;
    if (count > 0) {
      aBigrams.set(gram, count - 1);
      intersection++;
    }
  }

  return (2 * intersection) / (a.length + b.length - 2);
}

export function containsExcluded(
  parsed: ParsedSkillQuery,
  doc: NormalizedSkill,
): boolean {
  return parsed.exclude.some((term) => doc.full.includes(term));
}

export function rankByScore<T>(
  items: T[],
  scorer: (item: T) => number,
): Array<{ item: T; score: number }> {
  return items
    .map((item) => ({ item, score: scorer(item) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
