import type { Skill } from "./skill-registry.js";
import {
  FIELD_BOOSTS,
  containsExcluded,
  detectIntent,
  fieldPhraseScore,
  mapResult,
  maxTokenSimilarity,
  normalizeSkills,
  normalizeText,
  parseSkillQuery,
  rankByScore,
  tokenize,
  type SearchQuery,
  type SearchResults,
  visibleSkills,
} from "./search-shared.js";

export function lexicalScoreSearch(
  query: SearchQuery,
  skills: Skill[],
  threshold = 0.5,
): SearchResults {
  const parsed = parseSkillQuery(query);
  const visible = visibleSkills(skills);

  if (parsed.listAll) {
    return mapResult(query, visible, visible, "lexical");
  }

  const docs = normalizeSkills(visible);
  const intent = detectIntent(query, parsed);
  const phrase = normalizeText(
    (Array.isArray(query) ? query.join(" ") : query).trim(),
  );

  const ranked = rankByScore(
    docs.filter((doc) => !containsExcluded(parsed, doc)),
    (doc) => {
      const phraseComponent =
        fieldPhraseScore(doc.qualified, phrase) * FIELD_BOOSTS.qualified +
        fieldPhraseScore(doc.shortname, phrase) * FIELD_BOOSTS.shortname +
        fieldPhraseScore(doc.description, phrase) * FIELD_BOOSTS.description;

      const includeTerms = parsed.include.flatMap((term) => tokenize(term));
      const termComponent = includeTerms.length
        ? includeTerms.reduce((acc, term) => {
            const q = doc.qualified.includes(term)
              ? 1
              : maxTokenSimilarity(term, tokenize(doc.qualified));
            const n = doc.shortname.includes(term)
              ? 1
              : maxTokenSimilarity(term, tokenize(doc.shortname));
            const d = doc.description.includes(term)
              ? 1
              : maxTokenSimilarity(term, tokenize(doc.description));

            const weighted =
              q * FIELD_BOOSTS.qualified +
              n * FIELD_BOOSTS.shortname +
              d * FIELD_BOOSTS.description;
            return (
              acc +
              weighted /
                (FIELD_BOOSTS.qualified +
                  FIELD_BOOSTS.shortname +
                  FIELD_BOOSTS.description)
            );
          }, 0) / includeTerms.length
        : 0;

      const fuzzyComponent = includeTerms.length
        ? includeTerms.reduce(
            (acc, term) => acc + maxTokenSimilarity(term, doc.tokens),
            0,
          ) / includeTerms.length
        : 0;

      const weights =
        intent === "phrase"
          ? { phrase: 0.65, terms: 0.25, fuzzy: 0.1 }
          : intent === "terms"
            ? { phrase: 0.2, terms: 0.7, fuzzy: 0.1 }
            : { phrase: 0.4, terms: 0.5, fuzzy: 0.1 };

      return (
        phraseComponent * weights.phrase +
        termComponent * weights.terms +
        fuzzyComponent * weights.fuzzy
      );
    },
  );

  const matched = ranked
    .filter((r) => r.score >= threshold)
    .map((r) => r.item.skill);
  return mapResult(query, visible, matched, `lexical (${intent})`);
}
