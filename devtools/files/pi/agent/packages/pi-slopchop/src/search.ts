import type { ReviewFile } from "./types.js";

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, "");
}

export function getBaseName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export function scoreSubsequence(query: string, candidate: string): number {
  if (!query) return 0;

  let queryIndex = 0;
  let score = 0;
  let firstMatchIndex = -1;
  let previousMatchIndex = -2;

  for (let i = 0; i < candidate.length && queryIndex < query.length; i += 1) {
    if (candidate[i] !== query[queryIndex]) continue;

    if (firstMatchIndex === -1) firstMatchIndex = i;
    score += 10;

    if (i === previousMatchIndex + 1) {
      score += 8;
    }

    const previousChar = i > 0 ? candidate[i - 1] : "";
    if (i === 0 || previousChar === "/" || previousChar === "_" || previousChar === "-" || previousChar === ".") {
      score += 12;
    }

    previousMatchIndex = i;
    queryIndex += 1;
  }

  if (queryIndex !== query.length) return -1;
  if (firstMatchIndex >= 0) score += Math.max(0, 20 - firstMatchIndex);
  return score;
}

export function getFileSearchScore(query: string, file: ReviewFile): number {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return 0;

  const path = file.path.toLowerCase();
  const baseName = getBaseName(path);
  const pathScore = scoreSubsequence(normalizedQuery, path);
  const baseScore = scoreSubsequence(normalizedQuery, baseName);
  let score = Math.max(pathScore, baseScore >= 0 ? baseScore + 40 : -1);

  if (score < 0) return -1;
  if (baseName === normalizedQuery) score += 200;
  else if (baseName.startsWith(normalizedQuery)) score += 120;
  else if (path.includes(normalizedQuery)) score += 35;

  return score;
}

export function filterFilesBySearch(files: ReviewFile[], query: string): ReviewFile[] {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return [...files];

  return files
    .map((file) => ({ file, score: getFileSearchScore(normalizedQuery, file) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const baseNameLengthDelta = getBaseName(a.file.path).length - getBaseName(b.file.path).length;
      if (baseNameLengthDelta !== 0) return baseNameLengthDelta;

      return a.file.path.localeCompare(b.file.path);
    })
    .map((entry) => entry.file);
}
