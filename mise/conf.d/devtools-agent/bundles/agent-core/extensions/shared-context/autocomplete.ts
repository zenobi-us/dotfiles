import path from "node:path";

export interface AutocompleteItem {
  value: string;
  label: string;
  description?: string;
}

export interface AutocompleteProvider<Arguments extends unknown[] = [
  signal?: AbortSignal,
  onPartial?: (suggestions: { items: AutocompleteItem[]; prefix: string }) => void,
]> {
  triggerCharacters?: string[];
  getSuggestions(
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    ...args: Arguments
  ): Promise<{ items: AutocompleteItem[]; prefix: string } | null>;
  applyCompletion(
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    item: AutocompleteItem,
    prefix: string,
  ): { lines: string[]; cursorLine: number; cursorCol: number; onApplied?: () => void };
  getInlineHint?(lines: string[], cursorLine: number, cursorCol: number): string | null;
  trySyncSlashCompletion?(textBeforeCursor: string): { items: AutocompleteItem[]; prefix: string } | null;
  trySyncInlineReplace?(textBeforeCursor: string): { replaceLen: number; insert: string } | null;
  getForceFileSuggestions?(
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    signal?: AbortSignal,
  ): Promise<{ items: AutocompleteItem[]; prefix: string } | null>;
  shouldTriggerFileCompletion?(lines: string[], cursorLine: number, cursorCol: number): boolean;
}

export interface SharedContextItem {
  absolutePath: string;
  relativePath: string;
  searchText?: string;
}

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

type RunSharedContext = (args: string[], cwd: string) => Promise<CommandResult>;
export type GetItems = () => Promise<SharedContextItem[]>;

interface SharedContextAutocompleteItem extends AutocompleteItem {
  sharedContextPath: string;
}

const MAX_SUGGESTIONS = 100;
const CACHE_TTL_MS = 2_000;

const SHARED_PREFIX = "shared://";

function sharedPrefix(textBeforeCursor: string): string | null {
  const match = /(?:^|\s)(shared:\/\/[^\s]*)$/.exec(textBeforeCursor);
  return match?.[1] ?? null;
}

function matchScore(query: string, target: string): number {
  if (query.length === 0) return 1;
  if (target === query) return 100;
  if (target.startsWith(query)) return 90;

  const basenameIndex = target.lastIndexOf("/") + 1;
  if (target.startsWith(query, basenameIndex)) return 80;
  if (target.includes(query)) return 60;

  let queryIndex = 0;
  let gaps = 0;
  let previousMatch = -1;
  for (let targetIndex = 0; targetIndex < target.length && queryIndex < query.length; targetIndex += 1) {
    if (query.charCodeAt(queryIndex) !== target.charCodeAt(targetIndex)) continue;
    if (previousMatch >= 0 && targetIndex - previousMatch > 1) gaps += 1;
    previousMatch = targetIndex;
    queryIndex += 1;
  }
  return queryIndex === query.length ? Math.max(1, 40 - gaps * 5) : 0;
}

function suggestionsFor(items: SharedContextItem[], prefix: string): SharedContextAutocompleteItem[] {
  const query = prefix.slice(SHARED_PREFIX.length).toLowerCase();
  const matches: Array<{ item: SharedContextItem; score: number }> = [];

  for (const item of items) {
    const score = matchScore(query, item.searchText ?? item.relativePath.toLowerCase());
    if (score > 0) matches.push({ item, score });
  }

  matches.sort((left, right) =>
    right.score - left.score || left.item.relativePath.localeCompare(right.item.relativePath),
  );

  return matches.slice(0, MAX_SUGGESTIONS).map(({ item }) => ({
    value: item.absolutePath,
    label: item.relativePath,
    description: "Shared context",
    sharedContextPath: item.absolutePath,
  }));
}

function isSharedContextItem(item: AutocompleteItem): item is SharedContextAutocompleteItem {
  return "sharedContextPath" in item && typeof item.sharedContextPath === "string";
}

function attachmentFor(filePath: string): string {
  return /\s/.test(filePath) ? `@"${filePath}"` : `@${filePath}`;
}

export async function loadSharedContextItems(cwd: string, run: RunSharedContext): Promise<SharedContextItem[]> {
  const [rootResult, filesResult] = await Promise.all([
    run(["root"], cwd),
    run(["files"], cwd),
  ]);
  if (rootResult.code !== 0) {
    throw new Error(rootResult.stderr.trim() || "shared-context root failed");
  }
  if (filesResult.code !== 0) {
    throw new Error(filesResult.stderr.trim() || "shared-context files failed");
  }

  const root = rootResult.stdout.trim();
  if (!root) return [];

  const items: SharedContextItem[] = [];
  for (const line of filesResult.stdout.split("\n")) {
    const absolutePath = line.endsWith("\r") ? line.slice(0, -1) : line;
    if (absolutePath.length === 0) continue;
    const relativePath = path.relative(root, absolutePath);
    if (
      !relativePath ||
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      continue;
    }
    const normalizedPath = relativePath.split(path.sep).join("/");
    items.push({
      absolutePath,
      relativePath: normalizedPath,
      searchText: normalizedPath.toLowerCase(),
    });
  }
  return items;
}

export function createSharedContextAutocompleteProvider<Arguments extends unknown[]>(
  current: AutocompleteProvider<Arguments>,
  getItems: GetItems,
  getSignal: (...args: Arguments) => AbortSignal | undefined,
): AutocompleteProvider<Arguments> {
  return {
    triggerCharacters: current.triggerCharacters,
    async getSuggestions(lines, cursorLine, cursorCol, ...args) {
      const currentLine = lines[cursorLine] ?? "";
      const prefix = sharedPrefix(currentLine.slice(0, cursorCol));
      if (!prefix) return current.getSuggestions(lines, cursorLine, cursorCol, ...args);
      const signal = getSignal(...args);
      if (signal?.aborted) return null;

      const items = suggestionsFor(await getItems(), prefix);
      if (signal?.aborted || items.length === 0) return null;
      return { items, prefix };
    },

    applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
      if (!isSharedContextItem(item) || !prefix.startsWith(SHARED_PREFIX)) {
        return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
      }

      const currentLine = lines[cursorLine] ?? "";
      const textBeforeCursor = currentLine.slice(0, cursorCol);
      const livePrefix = sharedPrefix(textBeforeCursor);
      if (!livePrefix) return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);

      const beforePrefix = currentLine.slice(0, cursorCol - livePrefix.length);
      const afterCursor = currentLine.slice(cursorCol);
      const attachment = attachmentFor(item.sharedContextPath);
      const suffix = afterCursor.length === 0 || !/^\s/.test(afterCursor) ? " " : "";
      const newLines = [...lines];
      newLines[cursorLine] = `${beforePrefix}${attachment}${suffix}${afterCursor}`;
      return {
        lines: newLines,
        cursorLine,
        cursorCol: beforePrefix.length + attachment.length + suffix.length,
      };
    },

    getInlineHint: current.getInlineHint?.bind(current),
    trySyncSlashCompletion: current.trySyncSlashCompletion?.bind(current),
    trySyncInlineReplace: current.trySyncInlineReplace?.bind(current),
    getForceFileSuggestions: current.getForceFileSuggestions?.bind(current),
    shouldTriggerFileCompletion: current.shouldTriggerFileCompletion?.bind(current),
  };
}

export function cachedItems(loader: GetItems, onError: (error: unknown) => void): GetItems {
  let items: SharedContextItem[] = [];
  let loadedAt = 0;
  let pending: Promise<SharedContextItem[]> | undefined;

  return async () => {
    if (Date.now() - loadedAt < CACHE_TTL_MS) return items;
    pending ??= loader()
      .then((loaded) => {
        items = loaded;
        loadedAt = Date.now();
        return items;
      })
      .catch((error) => {
        onError(error);
        loadedAt = Date.now();
        return items;
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
}

