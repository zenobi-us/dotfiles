const MATCH = 16;
const BOUNDARY_BONUS = 8;
const CONSECUTIVE_BONUS = 4;
const GAP_START = 3;
const GAP_EXTENSION = 1;
const BOUNDARY = /[\s\-_/.:]/;

/**
 * Scores `text` against an fzf-style `query`. Each space-separated term must
 * appear in `text` with its characters in order, not necessarily adjacent.
 * Matching ignores case unless the term has an upper-case letter (smart case).
 * Returns undefined when a term does not match; a higher score is a better match.
 */
export function fuzzyScore(query: string, text: string): number | undefined {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const term of terms) {
    const score = scoreTerm(term, text);
    if (score === undefined) return undefined;
    total += score;
  }
  return total;
}

/** Finds the shortest window that holds the term in order, as fzf v1 does, then scores it. */
function scoreTerm(term: string, text: string): number | undefined {
  const caseSensitive = term !== term.toLowerCase();
  const needle = caseSensitive ? term : term.toLowerCase();
  const haystack = caseSensitive ? text : text.toLowerCase();

  let index = 0;
  let end = -1;
  for (let i = 0; i < haystack.length && index < needle.length; i++) {
    if (haystack[i] === needle[index]) {
      index++;
      if (index === needle.length) end = i;
    }
  }
  if (end < 0) return undefined;

  let start = end;
  for (let i = end, back = needle.length - 1; i >= 0 && back >= 0; i--) {
    if (haystack[i] === needle[back]) {
      back--;
      start = i;
    }
  }

  let score = 0;
  let previous = -1;
  for (let i = start, next = 0; i <= end && next < needle.length; i++) {
    if (haystack[i] !== needle[next]) continue;
    score += MATCH;
    if (i === 0 || BOUNDARY.test(text[i - 1] ?? "")) score += BOUNDARY_BONUS;
    if (previous >= 0 && i === previous + 1) score += CONSECUTIVE_BONUS;
    if (previous >= 0 && i > previous + 1) score -= GAP_START + (i - previous - 2) * GAP_EXTENSION;
    previous = i;
    next++;
  }
  return score;
}
