export type ReviewScope = "git-diff" | "last-commit" | "all-files";

export type ChangeStatus = "modified" | "added" | "deleted" | "renamed";

export interface ReviewFileComparison {
  status: ChangeStatus;
  oldPath: string | null;
  newPath: string | null;
  displayPath: string;
  hasOriginal: boolean;
  hasModified: boolean;
  additions?: number;
  deletions?: number;
  /** Revision used for the original side when this comparison has an explicit range. */
  originalRevision?: string | null;
  /** Revision used for the modified side when this comparison has an explicit range. */
  modifiedRevision?: string | null;
}

export interface ReviewSubmoduleInfo {
  /** Absolute repo root for the nested git repository. */
  repoRoot: string;
  /** Parent-visible submodule path for this scope. */
  path: string;
  /** Commit recorded on the original side of the parent diff. */
  oldSha: string | null;
  /** Commit recorded on the modified side of the parent diff. */
  newSha: string | null;
  /** True when the nested repository can be opened locally. */
  available: boolean;
  /** Human-facing reason shown when the nested review cannot be opened. */
  unavailableReason?: string;
}

export type ReviewSubmoduleByScope = Partial<Record<ReviewScope, ReviewSubmoduleInfo>>;

export interface ReviewFile {
  id: string;
  path: string;
  /** Parent repo path prefix used when rendering nested review file paths. */
  pathPrefix?: string;
  worktreeStatus: ChangeStatus | null;
  hasWorkingTreeFile: boolean;
  inGitDiff: boolean;
  inLastCommit: boolean;
  inAllFiles: boolean;
  gitDiff: ReviewFileComparison | null;
  lastCommit: ReviewFileComparison | null;
  allFiles: ReviewFileComparison | null;
  allFilesReferenceCount?: number;
  allFilesOutgoingReferences?: string[];
  allFilesIncomingReferences?: string[];
  submodule?: ReviewSubmoduleByScope;
}

export interface ReviewFileContents {
  originalContent: string;
  modifiedContent: string;
}

export type CommentSide = "added" | "deleted" | "file";

export type CommentIntent = "fix" | "discuss";

export interface DiffReviewComment {
  id: string;
  fileId: string;
  scope: ReviewScope;
  side: CommentSide;
  intent: CommentIntent;
  startLine: number | null;
  endLine: number | null;
  body: string;
}

export interface ReviewDraft {
  allComment: string;
  allIntent: CommentIntent;
  comments: DiffReviewComment[];
}

export type ReviewFocus = "navigator" | "diff" | "comments";

export interface ReviewLineTarget {
  side: Exclude<CommentSide, "file">;
  /** Active cursor line for the selection. */
  line: number;
  /** Anchor line when the selection spans multiple diff lines. */
  endLine?: number;
}

export interface ReviewState {
  activeScope: ReviewScope;
  activeFileId: string | null;
  searchQuery: string;
  focus: ReviewFocus;
  wrapLines: boolean;
  hideUnchanged: boolean;
  selectedCommentIndex: number;
  selectedLineTargetByScopeFile: Record<string, ReviewLineTarget>;
  draft: ReviewDraft;
}

export interface ReviewSubmitPayload extends ReviewDraft {
  type: "submit";
}

export interface ReviewCancelPayload {
  type: "cancel";
}

export type ReviewResult = ReviewSubmitPayload | ReviewCancelPayload;

export function formatScopeLabel(scope: ReviewScope): string {
  switch (scope) {
    case "git-diff": return "git diff";
    case "last-commit": return "last commit";
    case "all-files": return "all files";
  }
}

export function scopeFileKey(scope: ReviewScope, fileId: string): string {
  return `${scope}::${fileId}`;
}

export function formatIntentLabel(intent: CommentIntent): string {
  switch (intent) {
    case "fix": return "FIX";
    case "discuss": return "DISCUSS";
  }
}

export function isSubmoduleReviewFile(file: ReviewFile | null | undefined, scope: ReviewScope): file is ReviewFile & { submodule: ReviewSubmoduleByScope } {
  return file?.submodule?.[scope] != null;
}

export function getSubmoduleInfo(file: ReviewFile | null | undefined, scope: ReviewScope): ReviewSubmoduleInfo | null {
  return file?.submodule?.[scope] ?? null;
}

export function hasExactSubmoduleRange(
  submodule: ReviewSubmoduleInfo,
): submodule is ReviewSubmoduleInfo & { oldSha: string; newSha: string } {
  return submodule.oldSha != null && submodule.newSha != null && submodule.oldSha !== submodule.newSha;
}

export function joinReviewPath(prefix: string | undefined, path: string): string {
  return prefix == null || prefix.length === 0 ? path : `${prefix}/${path}`;
}

function getPrefixedComparisonDisplayPath(prefix: string | undefined, comparison: ReviewFileComparison): string {
  if (comparison.status === "renamed" && comparison.oldPath != null && comparison.newPath != null) {
    return `${joinReviewPath(prefix, comparison.oldPath)} -> ${joinReviewPath(prefix, comparison.newPath)}`;
  }

  return joinReviewPath(prefix, comparison.displayPath);
}

export function getReviewFileDisplayPath(file: ReviewFile | null | undefined, scope: ReviewScope): string {
  if (file == null) return "(no file)";
  const comparison = scope === "git-diff" ? file.gitDiff : scope === "last-commit" ? file.lastCommit : file.allFiles;
  return comparison == null
    ? joinReviewPath(file.pathPrefix, file.path)
    : getPrefixedComparisonDisplayPath(file.pathPrefix, comparison);
}
