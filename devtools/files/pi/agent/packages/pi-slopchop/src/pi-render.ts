import { getLanguageFromPath, highlightCode } from "@earendil-works/pi-coding-agent";

export function detectPiLanguage(filePath: string): string | undefined {
  return getLanguageFromPath(filePath);
}

export function highlightCodeLineWithPi(text: string, language: string | undefined): string {
  if (text.length === 0) return "";
  return highlightCode(text, language)[0] ?? text;
}

function replaceTabs(text: string): string {
  return text.replace(/\t/g, "   ");
}

const WORD_DIFF_TOKEN_MATRIX_LIMIT = 20_000;

interface WordToken {
  value: string;
  key: string;
}

interface WordDiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

function tokenizeWords(text: string): WordToken[] {
  return (text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]+/gu) ?? []).map((value) => ({
    value,
    key: /^\s+$/u.test(value) ? " " : value,
  }));
}

function pushWordDiffPart(parts: WordDiffPart[], part: WordDiffPart): void {
  if (part.value.length === 0) return;
  const previous = parts[parts.length - 1];
  if (previous && Boolean(previous.added) === Boolean(part.added) && Boolean(previous.removed) === Boolean(part.removed)) {
    previous.value += part.value;
    return;
  }
  parts.push(part);
}

function diffWordTokens(oldContent: string, newContent: string): WordDiffPart[] {
  const oldTokens = tokenizeWords(oldContent);
  const newTokens = tokenizeWords(newContent);
  if ((oldTokens.length + 1) * (newTokens.length + 1) > WORD_DIFF_TOKEN_MATRIX_LIMIT) {
    return [
      { value: oldContent, removed: true },
      { value: newContent, added: true },
    ];
  }

  const table = Array.from({ length: oldTokens.length + 1 }, () => new Uint16Array(newTokens.length + 1));

  for (let oldIndex = oldTokens.length - 1; oldIndex >= 0; oldIndex -= 1) {
    const current = table[oldIndex]!;
    const next = table[oldIndex + 1]!;
    for (let newIndex = newTokens.length - 1; newIndex >= 0; newIndex -= 1) {
      current[newIndex] = oldTokens[oldIndex]!.key === newTokens[newIndex]!.key
        ? next[newIndex + 1]! + 1
        : Math.max(next[newIndex]!, current[newIndex + 1]!);
    }
  }

  const parts: WordDiffPart[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldTokens.length && newIndex < newTokens.length) {
    if (oldTokens[oldIndex]!.key === newTokens[newIndex]!.key) {
      pushWordDiffPart(parts, { value: newTokens[newIndex]!.value });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (table[oldIndex + 1]![newIndex]! >= table[oldIndex]![newIndex + 1]!) {
      pushWordDiffPart(parts, { value: oldTokens[oldIndex]!.value, removed: true });
      oldIndex += 1;
      continue;
    }

    pushWordDiffPart(parts, { value: newTokens[newIndex]!.value, added: true });
    newIndex += 1;
  }

  while (oldIndex < oldTokens.length) {
    pushWordDiffPart(parts, { value: oldTokens[oldIndex]!.value, removed: true });
    oldIndex += 1;
  }

  while (newIndex < newTokens.length) {
    pushWordDiffPart(parts, { value: newTokens[newIndex]!.value, added: true });
    newIndex += 1;
  }

  return parts;
}

/**
 * Adapted from Pi's internal diff renderer so slopchop follows Pi's intra-line
 * diff highlighting behavior while still controlling its own gutters and
 * comment markers.
 */
export function renderPiIntraLineDiff(
  oldContent: string,
  newContent: string,
  inverse: (text: string) => string,
): { removedLine: string; addedLine: string } {
  const wordDiff = diffWordTokens(oldContent, newContent);

  let removedLine = "";
  let addedLine = "";
  let isFirstRemoved = true;
  let isFirstAdded = true;

  for (const part of wordDiff) {
    if (part.removed) {
      let value = replaceTabs(part.value);
      if (isFirstRemoved) {
        const leadingWs = value.match(/^(\s*)/)?.[1] ?? "";
        value = value.slice(leadingWs.length);
        removedLine += leadingWs;
        isFirstRemoved = false;
      }
      if (value) removedLine += inverse(value);
      continue;
    }

    if (part.added) {
      let value = replaceTabs(part.value);
      if (isFirstAdded) {
        const leadingWs = value.match(/^(\s*)/)?.[1] ?? "";
        value = value.slice(leadingWs.length);
        addedLine += leadingWs;
        isFirstAdded = false;
      }
      if (value) addedLine += inverse(value);
      continue;
    }

    const value = replaceTabs(part.value);
    removedLine += value;
    addedLine += value;
  }

  return { removedLine, addedLine };
}
