import { filterFilesBySearch } from "./search.js";
import type { ChangeStatus, CommentIntent, CommentSide, DiffReviewComment, ReviewFile, ReviewFocus, ReviewLineTarget, ReviewScope, ReviewState } from "./types.js";
import { scopeFileKey } from "./types.js";

function hasFilesForScope(files: ReviewFile[], scope: ReviewScope): boolean {
  return getScopedFiles(files, scope).length > 0;
}

export function getDefaultScope(files: ReviewFile[]): ReviewScope {
  if (hasFilesForScope(files, "git-diff")) return "git-diff";
  if (hasFilesForScope(files, "all-files")) return "all-files";
  if (hasFilesForScope(files, "last-commit")) return "last-commit";
  return "all-files";
}

function getAllFilesStatusRank(status: ChangeStatus | null | undefined): number {
  if (status === "modified" || status === "renamed") return 0;
  if (status === "added") return 1;
  if (status === "deleted") return 2;
  return 3;
}

function getAllFilesSupportRank(path: string): number {
  const lowerPath = path.toLowerCase();
  if (/(^|\/)(\.changeset|docs?|tests?|__tests__|__mocks__)(\/|$)/.test(lowerPath)) return 1;
  if (/(^|\/)[^/]+\.(test|spec)\.[cm]?[jt]sx?$/.test(lowerPath)) return 1;
  if (/\.(md|mdx|txt|ya?ml)$/.test(lowerPath)) return 1;
  return 0;
}

/**
 * Order branch-level "all files" changes for review, not for path browsing:
 * most referenced changed files first, then modified/renamed before added before
 * deleted, then source files before tests/docs/changesets, then path order.
 */
export function compareAllFilesForReview(a: ReviewFile, b: ReviewFile): number {
  const referenceDelta = (b.allFilesReferenceCount ?? 0) - (a.allFilesReferenceCount ?? 0);
  if (referenceDelta !== 0) return referenceDelta;

  const statusDelta = getAllFilesStatusRank(a.allFiles?.status) - getAllFilesStatusRank(b.allFiles?.status);
  if (statusDelta !== 0) return statusDelta;

  const supportDelta = getAllFilesSupportRank(a.path) - getAllFilesSupportRank(b.path);
  if (supportDelta !== 0) return supportDelta;

  return a.path.localeCompare(b.path);
}

export function getScopedFiles(files: ReviewFile[], scope: ReviewScope): ReviewFile[] {
  switch (scope) {
    case "git-diff":
      return files.filter((file) => file.inGitDiff);
    case "last-commit":
      return files.filter((file) => file.inLastCommit);
    case "all-files": {
      const scoped = files.filter((file) => file.inAllFiles);
      if (!scoped.some((file) => file.allFiles != null)) return scoped;
      return scoped.sort(compareAllFilesForReview);
    }
  }
}

export function getFilteredFiles(files: ReviewFile[], state: ReviewState): ReviewFile[] {
  return filterFilesBySearch(getScopedFiles(files, state.activeScope), state.searchQuery);
}

export function ensureActiveFile(state: ReviewState, files: ReviewFile[]): ReviewState {
  const filtered = getFilteredFiles(files, state);
  if (filtered.length === 0) {
    return { ...state, activeFileId: null };
  }
  if (filtered.some((file) => file.id === state.activeFileId)) {
    return state;
  }
  return { ...state, activeFileId: filtered[0]!.id };
}

export function createInitialReviewState(files: ReviewFile[]): ReviewState {
  const initialScope = getDefaultScope(files);
  const scoped = getScopedFiles(files, initialScope);
  return {
    activeScope: initialScope,
    activeFileId: scoped[0]?.id ?? null,
    searchQuery: "",
    focus: "navigator",
    wrapLines: false,
    hideUnchanged: false,
    selectedCommentIndex: 0,
    selectedLineTargetByScopeFile: {},
    draft: {
      allComment: "",
      allIntent: "fix",
      comments: [],
    },
  };
}

export function setScope(state: ReviewState, files: ReviewFile[], scope: ReviewScope): ReviewState {
  return ensureActiveFile({ ...state, activeScope: scope, selectedCommentIndex: 0 }, files);
}

export function setSearchQuery(state: ReviewState, files: ReviewFile[], query: string): ReviewState {
  return ensureActiveFile({ ...state, searchQuery: query, selectedCommentIndex: 0 }, files);
}

export function moveActiveFile(state: ReviewState, files: ReviewFile[], delta: number): ReviewState {
  const filtered = getFilteredFiles(files, state);
  if (filtered.length === 0) return { ...state, activeFileId: null };
  const index = filtered.findIndex((file) => file.id === state.activeFileId);
  const currentIndex = index >= 0 ? index : 0;
  const nextIndex = Math.max(0, Math.min(filtered.length - 1, currentIndex + delta));
  return { ...state, activeFileId: filtered[nextIndex]!.id, selectedCommentIndex: 0 };
}

export function setActiveFileId(state: ReviewState, files: ReviewFile[], fileId: string | null): ReviewState {
  const filtered = getFilteredFiles(files, state);
  if (fileId == null || !filtered.some((file) => file.id === fileId)) {
    return ensureActiveFile({ ...state, activeFileId: fileId, selectedCommentIndex: 0 }, files);
  }
  return { ...state, activeFileId: fileId, selectedCommentIndex: 0 };
}

export function cycleFocus(state: ReviewState): ReviewState {
  const order: ReviewFocus[] = ["navigator", "diff", "comments"];
  const index = order.indexOf(state.focus);
  return { ...state, focus: order[(index + 1) % order.length]! };
}

export function cycleFocusBackward(state: ReviewState): ReviewState {
  const order: ReviewFocus[] = ["navigator", "diff", "comments"];
  const index = order.indexOf(state.focus);
  return { ...state, focus: order[(index - 1 + order.length) % order.length]! };
}

export function setFocus(state: ReviewState, focus: ReviewFocus): ReviewState {
  return { ...state, focus };
}

export function setWrapLines(state: ReviewState, wrapLines: boolean): ReviewState {
  return { ...state, wrapLines };
}

export function toggleHideUnchanged(state: ReviewState): ReviewState {
  return { ...state, hideUnchanged: !state.hideUnchanged };
}

function sameLineTarget(a: ReviewLineTarget | null, b: ReviewLineTarget | null): boolean {
  return a?.side === b?.side && a?.line === b?.line;
}

function getTargetIndex(visibleTargets: ReviewLineTarget[], target: ReviewLineTarget): number {
  const index = visibleTargets.findIndex((candidate) => sameLineTarget(candidate, target));
  return index >= 0 ? index : 0;
}

function normalizeRange(startLine: number, endLine: number): { startLine: number; endLine: number } {
  return {
    startLine: Math.min(startLine, endLine),
    endLine: Math.max(startLine, endLine),
  };
}

function commentContainsLine(comment: DiffReviewComment, line: number): boolean {
  if (comment.startLine == null) return false;
  const { startLine, endLine } = normalizeRange(comment.startLine, comment.endLine ?? comment.startLine);
  return startLine <= line && line <= endLine;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function getLineTargetRange(target: ReviewLineTarget): { startLine: number; endLine: number } {
  return normalizeRange(target.line, target.endLine ?? target.line);
}

export function setSelectedLineTarget(state: ReviewState, fileId: string, scope: ReviewScope, target: ReviewLineTarget): ReviewState {
  return {
    ...state,
    selectedLineTargetByScopeFile: {
      ...state.selectedLineTargetByScopeFile,
      [scopeFileKey(scope, fileId)]: target,
    },
  };
}

export function getSelectedLineTarget(state: ReviewState, fileId: string | null, scope: ReviewScope): ReviewLineTarget | null {
  if (fileId == null) return null;
  return state.selectedLineTargetByScopeFile[scopeFileKey(scope, fileId)] ?? null;
}

export function clampSelectedLineTarget(state: ReviewState, fileId: string, scope: ReviewScope, visibleTargets: ReviewLineTarget[]): ReviewState {
  if (visibleTargets.length === 0) return state;
  const current = getSelectedLineTarget(state, fileId, scope);
  if (current == null) return setSelectedLineTarget(state, fileId, scope, visibleTargets[0]!);
  if (visibleTargets.some((target) => sameLineTarget(target, current))) return state;

  const next = visibleTargets.find((target) => target.line >= current.line) ?? visibleTargets[visibleTargets.length - 1]!;
  return setSelectedLineTarget(state, fileId, scope, next);
}

export function moveSelectedLineTarget(state: ReviewState, fileId: string, scope: ReviewScope, visibleTargets: ReviewLineTarget[], delta: number): ReviewState {
  if (visibleTargets.length === 0) return state;
  const current = getSelectedLineTarget(state, fileId, scope) ?? visibleTargets[0]!;
  const index = getTargetIndex(visibleTargets, current);
  const nextIndex = Math.max(0, Math.min(visibleTargets.length - 1, index + delta));
  return setSelectedLineTarget(state, fileId, scope, visibleTargets[nextIndex]!);
}

export function extendSelectedLineTarget(state: ReviewState, fileId: string, scope: ReviewScope, visibleTargets: ReviewLineTarget[], delta: number): ReviewState {
  if (visibleTargets.length === 0) return state;
  const current = getSelectedLineTarget(state, fileId, scope) ?? visibleTargets[0]!;
  const direction = Math.sign(delta);
  if (direction === 0) return state;

  const anchorLine = current.endLine ?? current.line;
  const currentIndex = getTargetIndex(visibleTargets, current);
  let nextIndex = currentIndex + direction;

  while (nextIndex >= 0 && nextIndex < visibleTargets.length) {
    const nextTarget = visibleTargets[nextIndex]!;
    if (nextTarget.side === current.side) {
      return setSelectedLineTarget(state, fileId, scope, { ...nextTarget, endLine: anchorLine });
    }
    nextIndex += direction;
  }

  if (current.endLine == null) return state;
  return setSelectedLineTarget(state, fileId, scope, { side: current.side, line: anchorLine });
}

export function getCommentKey(comment: Pick<DiffReviewComment, "fileId" | "scope" | "side" | "startLine">): string {
  return `${comment.scope}::${comment.fileId}::${comment.side}::${comment.startLine ?? "file"}`;
}

function withTrimmedBody(body: string): string {
  return body.trim();
}

export function getLineComment(state: ReviewState, fileId: string, scope: ReviewScope, side: Exclude<CommentSide, "file">, line: number): DiffReviewComment | undefined {
  return state.draft.comments.find((comment) => (
    comment.fileId === fileId
      && comment.scope === scope
      && comment.side === side
      && commentContainsLine(comment, line)
  ));
}

export function getFileComment(state: ReviewState, fileId: string, scope: ReviewScope): DiffReviewComment | undefined {
  return state.draft.comments.find((comment) => (
    comment.fileId === fileId
      && comment.scope === scope
      && comment.side === "file"
  ));
}

export function getCommentsForFileScope(state: ReviewState, fileId: string, scope: ReviewScope): DiffReviewComment[] {
  return state.draft.comments
    .filter((comment) => comment.fileId === fileId && comment.scope === scope)
    .sort((a, b) => {
      const aLine = a.startLine ?? -1;
      const bLine = b.startLine ?? -1;
      if (a.side !== b.side) {
        if (a.side === "file") return -1;
        if (b.side === "file") return 1;
        if (a.side === "deleted") return -1;
        if (b.side === "deleted") return 1;
      }
      if (aLine !== bLine) return aLine - bLine;
      return a.id.localeCompare(b.id);
    });
}

function replaceComment(state: ReviewState, matcher: (comment: DiffReviewComment) => boolean, nextComment: DiffReviewComment | null): ReviewState {
  const remaining = state.draft.comments.filter((comment) => !matcher(comment));
  return {
    ...state,
    draft: {
      ...state.draft,
      comments: nextComment == null ? remaining : [...remaining, nextComment],
    },
  };
}

export function upsertLineComment(
  state: ReviewState,
  fileId: string,
  scope: ReviewScope,
  side: Exclude<CommentSide, "file">,
  line: number,
  body: string,
  intent: CommentIntent = "fix",
  endLine = line,
): ReviewState {
  const trimmed = withTrimmedBody(body);
  const nextRange = normalizeRange(line, endLine);
  const existing = state.draft.comments.find((comment) => (
    comment.fileId === fileId
      && comment.scope === scope
      && comment.side === side
      && comment.startLine != null
      && rangesOverlap(comment.startLine, comment.endLine ?? comment.startLine, nextRange.startLine, nextRange.endLine)
  ));
  const nextComment = trimmed.length === 0
    ? null
    : {
        id: existing?.id ?? `line:${scope}:${fileId}:${side}:${nextRange.startLine}`,
        fileId,
        scope,
        side,
        intent,
        startLine: nextRange.startLine,
        endLine: nextRange.endLine,
        body: trimmed,
      };

  return replaceComment(
    state,
    (comment) => comment.fileId === fileId
      && comment.scope === scope
      && comment.side === side
      && comment.startLine != null
      && rangesOverlap(comment.startLine, comment.endLine ?? comment.startLine, nextRange.startLine, nextRange.endLine),
    nextComment,
  );
}

export function upsertFileComment(state: ReviewState, fileId: string, scope: ReviewScope, body: string, intent: CommentIntent = "fix"): ReviewState {
  const trimmed = withTrimmedBody(body);
  const existing = getFileComment(state, fileId, scope);
  const nextComment = trimmed.length === 0
    ? null
    : {
        id: existing?.id ?? `file:${scope}:${fileId}`,
        fileId,
        scope,
        side: "file" as const,
        intent,
        startLine: null,
        endLine: null,
        body: trimmed,
      };

  return replaceComment(
    state,
    (comment) => comment.fileId === fileId && comment.scope === scope && comment.side === "file",
    nextComment,
  );
}

export function deleteComment(state: ReviewState, id: string): ReviewState {
  return {
    ...state,
    draft: {
      ...state.draft,
      comments: state.draft.comments.filter((comment) => comment.id !== id),
    },
  };
}

export function setAllComment(state: ReviewState, allComment: string, allIntent: CommentIntent = state.draft.allIntent): ReviewState {
  return {
    ...state,
    draft: {
      ...state.draft,
      allComment: allComment.trim(),
      allIntent,
    },
  };
}

export function moveSelectedCommentIndex(state: ReviewState, totalItems: number, delta: number): ReviewState {
  if (totalItems <= 0) return { ...state, selectedCommentIndex: 0 };
  const nextIndex = Math.max(0, Math.min(totalItems - 1, state.selectedCommentIndex + delta));
  return { ...state, selectedCommentIndex: nextIndex };
}

export function hasDraftContent(state: ReviewState): boolean {
  return state.draft.allComment.trim().length > 0 || state.draft.comments.length > 0;
}
