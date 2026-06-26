import { spawn } from "node:child_process";
import { join } from "node:path";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Editor, type EditorTheme, Key, matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { adjustStructuredDiffContext, buildStructuredDiff, type StructuredDiff, type StructuredDiffVisibleItem } from "../diff.js";
import {
  clampSelectedLineTarget,
  createInitialReviewState,
  cycleFocus,
  cycleFocusBackward,
  deleteComment,
  ensureActiveFile,
  extendSelectedLineTarget,
  getCommentsForFileScope,
  getFileComment,
  getLineComment,
  getLineTargetRange,
  getScopedFiles,
  getSelectedLineTarget,
  hasDraftContent,
  moveSelectedCommentIndex,
  moveSelectedLineTarget,
  setActiveFileId,
  setFocus,
  setAllComment,
  setScope,
  setSearchQuery,
  setSelectedLineTarget,
  setWrapLines,
  toggleHideUnchanged,
  upsertFileComment,
  upsertLineComment,
} from "../state.js";
import { detectPiLanguage, highlightCodeLineWithPi } from "../pi-render.js";
import { getShortcutConfigPath, getShortcutsForSide, type CommentShortcut } from "../shortcuts.js";
import { filterFilesBySearch } from "../search.js";
import { highlightJsonLine, highlightMarkdownLine } from "../theme-highlight.js";
import type { CommentIntent, DiffReviewComment, ReviewFile, ReviewFileContents, ReviewLineTarget, ReviewResult, ReviewScope, ReviewState, ReviewSubmoduleInfo } from "../types.js";
import { formatIntentLabel, formatScopeLabel, getReviewFileDisplayPath, getSubmoduleInfo, hasExactSubmoduleRange, isSubmoduleReviewFile, joinReviewPath } from "../types.js";

interface LoadedEntryReady {
  status: "ready";
  contents: ReviewFileContents;
  baseDiff: StructuredDiff;
}

interface LoadedEntryError {
  status: "error";
  error: string;
}

interface LoadedEntryLoading {
  status: "loading";
}

type LoadedEntry = LoadedEntryReady | LoadedEntryError | LoadedEntryLoading;

type EditTarget =
  | { kind: "line"; fileId: string; scope: ReviewScope; side: ReviewLineTarget["side"]; startLine: number; endLine: number; initialBody: string; intent: CommentIntent }
  | { kind: "file"; fileId: string; scope: ReviewScope; initialBody: string; intent: CommentIntent }
  | { kind: "all"; initialBody: string; intent: CommentIntent };

type CommentPanelItem =
  | { kind: "all"; body: string; intent: CommentIntent }
  | { kind: "comment"; comment: DiffReviewComment };

interface ReviewFrame {
  repoRoot: string;
  pathPrefix?: string;
  files: ReviewFile[];
  state: ReviewState;
  cache: Map<string, LoadedEntry>;
  navigatorScroll: number;
  diffScroll: number;
  commentsScroll: number;
  relatedFilterAnchorFileId: string | null;
  relatedFilterReturnFileId: string | null;
}

interface ReviewAppOptions {
  files: ReviewFile[];
  repoRoot: string;
  loadFileContents: (repoRoot: string, file: ReviewFile, scope: ReviewScope) => Promise<ReviewFileContents>;
  loadSubmoduleReviewData: (submodule: ReviewSubmoduleInfo) => Promise<{ repoRoot: string; files: ReviewFile[] }>;
  commentShortcuts: CommentShortcut[];
  notify: ExtensionContext["ui"]["notify"];
}

interface MousePaneBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface MousePaneLayout {
  navigator: MousePaneBounds;
  diff: MousePaneBounds;
  comments: MousePaneBounds | null;
}

const SEARCHABLE_SCOPES: ReviewScope[] = ["git-diff", "last-commit", "all-files"];
const DEFAULT_CONTEXT_LINES = 3;
const STACKED_LAYOUT_MAX_WIDTH = 99;
const GO_BACK_SHORTCUT = "b";

function formatFrameLabel(repoRoot: string): string {
  const label = repoRoot.split("/").filter((part) => part.length > 0).pop() ?? repoRoot;
  return label.length > 0 ? label : repoRoot;
}

function namespaceReviewFileId(pathPrefix: string | undefined, fileId: string): string {
  return pathPrefix == null || pathPrefix.length === 0 ? fileId : `${pathPrefix}::${fileId}`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildEditorLaunchCommand(editorCommand: string, filePath: string, line: number): string {
  const lineNumber = Math.max(1, Math.floor(line));
  return `${editorCommand.trim() || "vi"} +${lineNumber} -- ${shellQuote(filePath)}`;
}

function runShellCommand(command: string, cwd: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      env: process.env,
      shell: true,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code) => resolve(code));
  });
}

export function getEditorLineForTarget(diff: StructuredDiff, target: ReviewLineTarget): number {
  if (target.side === "added") return target.line;

  const rowIndex = diff.rows.findIndex((row) => row.oldLineNumber === target.line);
  if (rowIndex < 0) return target.line;

  const selectedRow = diff.rows[rowIndex]!;
  if (selectedRow.newLineNumber != null) return selectedRow.newLineNumber;

  for (let index = rowIndex + 1; index < diff.rows.length; index += 1) {
    const line = diff.rows[index]!.newLineNumber;
    if (line != null) return line;
  }

  for (let index = rowIndex - 1; index >= 0; index -= 1) {
    const line = diff.rows[index]!.newLineNumber;
    if (line != null) return line;
  }

  return 1;
}

export function getHalfPageStep(visibleRows: number): number {
  return Math.max(1, Math.floor(visibleRows / 2));
}

export function shouldStackPanes(frameInnerWidth: number): boolean {
  return frameInnerWidth <= STACKED_LAYOUT_MAX_WIDTH;
}

export function getPaneLayout(frameInnerWidth: number, commentsHidden: boolean): { navigatorWidth: number; diffWidth: number; commentsWidth: number } {
  const navigatorWidth = Math.max(24, Math.min(36, Math.floor(frameInnerWidth * 0.26)));
  if (commentsHidden) {
    return {
      navigatorWidth,
      diffWidth: Math.max(24, frameInnerWidth - navigatorWidth - 1),
      commentsWidth: 0,
    };
  }

  const commentsWidth = Math.max(24, Math.min(36, Math.floor(frameInnerWidth * 0.27)));
  return {
    navigatorWidth,
    commentsWidth,
    diffWidth: Math.max(24, frameInnerWidth - navigatorWidth - commentsWidth - 2),
  };
}

export function getStackedPaneLayout(bodyHeight: number, commentsHidden: boolean): { navigatorHeight: number; diffHeight: number; commentsHeight: number } {
  const safeBodyHeight = Math.max(commentsHidden ? 6 : 9, Math.floor(bodyHeight));
  const minimums = commentsHidden ? [3, 3] : [3, 3, 3];
  const weights = commentsHidden ? [1, 2] : [1, 2, 1];
  const heights = [...minimums];
  let remaining = safeBodyHeight - heights.reduce((sum, height) => sum + height, 0);

  while (remaining > 0) {
    let selectedIndex = 0;
    for (let index = 1; index < weights.length; index += 1) {
      if (heights[index]! / weights[index]! < heights[selectedIndex]! / weights[selectedIndex]!) {
        selectedIndex = index;
      }
    }
    heights[selectedIndex]! += 1;
    remaining -= 1;
  }

  return {
    navigatorHeight: heights[0]!,
    diffHeight: heights[1]!,
    commentsHeight: commentsHidden ? 0 : heights[2]!,
  };
}

export type MouseWheelDirection = "up" | "down";

export interface MouseWheelEvent {
  direction: MouseWheelDirection;
  col: number;
  row: number;
}

export function parseMouseWheelInput(data: string): MouseWheelEvent | null {
  const match = data.match(/^\x1b\[<(\d+);(\d+);(\d+)[Mm]$/);
  if (match == null) return null;

  const button = Number.parseInt(match[1]!, 10);
  if ((button & 64) === 0) return null;

  const wheelButton = button & 3;
  if (wheelButton !== 0 && wheelButton !== 1) return null;

  return {
    direction: wheelButton === 0 ? "up" : "down",
    col: Number.parseInt(match[2]!, 10),
    row: Number.parseInt(match[3]!, 10),
  };
}

type PaneName = "navigator" | "diff" | "comments";

type RelatedFileMarker = "→" | "←" | "↔";

export function getRelatedFilePaths(file: ReviewFile | null): Set<string> {
  return new Set([
    ...(file?.allFilesOutgoingReferences ?? []),
    ...(file?.allFilesIncomingReferences ?? []),
  ]);
}

export function getRelatedFileMarker(file: ReviewFile, activeFile: ReviewFile | null, scope: ReviewScope): RelatedFileMarker | null {
  if (activeFile == null || scope !== "all-files" || file.id === activeFile.id) return null;
  const outgoing = new Set(activeFile.allFilesOutgoingReferences ?? []).has(file.path);
  const incoming = new Set(activeFile.allFilesIncomingReferences ?? []).has(file.path);
  if (outgoing && incoming) return "↔";
  if (outgoing) return "→";
  if (incoming) return "←";
  return null;
}

export type ReviewAppTheme = Parameters<ExtensionContext["ui"]["custom"]>[0] extends (tui: any, theme: infer T, kb: any, done: any) => any ? T : never;
type Theme = ReviewAppTheme;

function repeat(char: string, count: number): string {
  return count <= 0 ? "" : char.repeat(count);
}

function padLine(text: string, width: number): string {
  const truncated = truncateToWidth(text, width, "", true);
  const padding = Math.max(0, width - visibleWidth(truncated));
  return truncated + " ".repeat(padding);
}

function wrapAnsiText(text: string, width: number, wrapLines: boolean): string[] {
  const safeWidth = Math.max(1, width);
  if (!wrapLines) return [truncateToWidth(text, safeWidth, "…", false)];
  const wrapped = wrapTextWithAnsi(text, safeWidth).map((line) => truncateToWidth(line, safeWidth, "", false));
  return wrapped.length > 0 ? wrapped : [""];
}

function getScopeComparison(file: ReviewFile | null, scope: ReviewScope) {
  if (file == null) return null;
  if (scope === "git-diff") return file.gitDiff;
  if (scope === "last-commit") return file.lastCommit;
  return file.allFiles;
}

function getScopeDisplayPath(file: ReviewFile | null, scope: ReviewScope): string {
  return getReviewFileDisplayPath(file, scope);
}

function getStatusLabel(file: ReviewFile | null, scope: ReviewScope): string {
  const status = getScopeComparison(file, scope)?.status ?? file?.worktreeStatus;
  switch (status) {
    case "added": return "A";
    case "deleted": return "D";
    case "renamed": return "R";
    case "modified": return "M";
    default: return "·";
  }
}

function getChangeCountLabel(theme: Theme, file: ReviewFile, scope: ReviewScope): string {
  const comparison = getScopeComparison(file, scope);
  const additions = comparison?.additions;
  const deletions = comparison?.deletions;
  if (additions == null && deletions == null) return "";
  const safeAdditions = additions ?? 0;
  const safeDeletions = deletions ?? 0;
  if (safeAdditions === 0 && safeDeletions === 0) return "";
  return ` ${theme.fg("success", `+${safeAdditions}`)} ${theme.fg("error", `-${safeDeletions}`)}`;
}

function getFileCommentCount(state: ReviewState, fileId: string, scope: ReviewScope): number {
  return state.draft.comments.filter((comment) => comment.fileId === fileId && comment.scope === scope).length;
}

function getCommentPanelItems(state: ReviewState, fileId: string | null, scope: ReviewScope): CommentPanelItem[] {
  const items: CommentPanelItem[] = [];
  if (state.draft.allComment.trim().length > 0) {
    items.push({ kind: "all", body: state.draft.allComment.trim(), intent: state.draft.allIntent });
  }
  if (fileId == null) return items;
  for (const comment of getCommentsForFileScope(state, fileId, scope)) {
    items.push({ kind: "comment", comment });
  }
  return items;
}

function getIntentBadge(theme: Theme, intent: CommentIntent): string {
  const text = `[${formatIntentLabel(intent)}]`;
  return intent === "fix" ? theme.fg("success", text) : theme.fg("warning", text);
}

function formatLineSideLabel(side: ReviewLineTarget["side"]): string {
  return side === "deleted" ? "Deleted" : "Added";
}

function formatLineRangeLabel(startLine: number, endLine: number): string {
  return startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
}

function getPanelItemLabel(theme: Theme, item: CommentPanelItem): string {
  if (item.kind === "all") return `${getIntentBadge(theme, item.intent)} All note`;
  if (item.comment.side === "file") return `${getIntentBadge(theme, item.comment.intent)} File comment`;
  return `${getIntentBadge(theme, item.comment.intent)} ${formatLineSideLabel(item.comment.side)} line ${formatLineRangeLabel(item.comment.startLine ?? 0, item.comment.endLine ?? item.comment.startLine ?? 0)}`;
}

export function getDraftCommentCount(state: ReviewState): number {
  return state.draft.comments.length + (state.draft.allComment.trim().length > 0 ? 1 : 0);
}

export function getCancelAction(state: ReviewState): "cancel" | "confirm" {
  return hasDraftContent(state) ? "confirm" : "cancel";
}

function centerText(text: string, width: number): string {
  const clean = truncateToWidth(text, width, "", false);
  const remaining = Math.max(0, width - visibleWidth(clean));
  const left = Math.floor(remaining / 2);
  return `${" ".repeat(left)}${clean}`;
}

export function shortenNavigatorPath(path: string, maxWidth: number): string {
  const safeWidth = Math.max(1, maxWidth);
  if (visibleWidth(path) <= safeWidth) return path;

  const parts = path.split("/").filter((part) => part.length > 0);
  const baseName = parts[parts.length - 1] ?? path;
  if (parts.length <= 1) {
    return truncateToWidth(baseName, safeWidth, "…", false);
  }

  let suffix = baseName;
  for (let index = parts.length - 2; index >= 0; index -= 1) {
    const nextSuffix = `${parts[index]}/${suffix}`;
    if (visibleWidth(`…/${nextSuffix}`) > safeWidth) break;
    suffix = nextSuffix;
  }

  const candidate = `…/${suffix}`;
  if (visibleWidth(candidate) <= safeWidth) return candidate;
  return truncateToWidth(baseName, safeWidth, "…", false);
}

export function formatPaneTitle(title: string, focused: boolean): string {
  return focused ? `▶ ${title}` : title;
}

export function formatFocusStatus(focus: ReviewState["focus"]): string {
  switch (focus) {
    case "navigator": return "Focus: Navigator";
    case "diff": return "Focus: Diff";
    case "comments": return "Focus: Comments";
  }
}

function renderBox(title: string, width: number, height: number, theme: Theme, lines: string[], focused = false): string[] {
  const innerWidth = Math.max(1, width - 2);
  const innerHeight = Math.max(1, height - 2);
  const titleText = truncateToWidth(` ${formatPaneTitle(title, focused)} `, Math.max(1, innerWidth - 2), "", false);
  const leftPad = Math.max(0, Math.floor((innerWidth - visibleWidth(titleText)) / 2));
  const rightPad = Math.max(0, innerWidth - visibleWidth(titleText) - leftPad);
  const borderColor = focused ? "accent" : "border";
  const top = theme.fg(borderColor, `┌${repeat("─", leftPad)}${titleText}${repeat("─", rightPad)}┐`);
  const bottom = theme.fg(borderColor, `└${repeat("─", innerWidth)}┘`);
  const body: string[] = [];

  for (let i = 0; i < innerHeight; i += 1) {
    const line = padLine(lines[i] ?? "", innerWidth);
    body.push(`${theme.fg(borderColor, "│")}${line}${theme.fg(borderColor, "│")}`);
  }

  return [top, ...body, bottom];
}

const MODAL_INNER_PADDING_X = 2;
const MODAL_INNER_PADDING_Y = 1;

function renderOuterFrame(
  width: number,
  height: number,
  theme: Theme,
  title: string,
  lines: string[],
  color: "accent" | "border" | "borderMuted" = "accent",
  paddingX = MODAL_INNER_PADDING_X,
  paddingY = MODAL_INNER_PADDING_Y,
): string[] {
  const innerWidth = Math.max(1, width - 2);
  const innerHeight = Math.max(1, height - 2);
  const contentWidth = Math.max(1, innerWidth - paddingX * 2);
  const contentHeight = Math.max(1, innerHeight - paddingY * 2);
  const titleText = truncateToWidth(` ${title} `, Math.max(1, innerWidth - 2), "", false);
  const leftPad = 1;
  const rightPad = Math.max(0, innerWidth - visibleWidth(titleText) - leftPad);
  const top = theme.fg(color, `┌${repeat("─", leftPad)}${titleText}${repeat("─", rightPad)}┐`);
  const bottom = theme.fg(color, `└${repeat("─", innerWidth)}┘`);
  const body: string[] = [];
  const sidePadding = " ".repeat(paddingX);

  for (let i = 0; i < innerHeight; i += 1) {
    let line = "";
    if (i >= paddingY && i < paddingY + contentHeight) {
      line = `${sidePadding}${padLine(lines[i - paddingY] ?? "", contentWidth)}${sidePadding}`;
    } else {
      line = " ".repeat(innerWidth);
    }
    body.push(`${theme.fg(color, "│")}${line}${theme.fg(color, "│")}`);
  }

  return [top, ...body, bottom];
}

const FOOTER_ACTION_HINT = "Tab focus • / search • ? help/actions • v diff view • s submit • Esc exit";

const HELP_KEY_SECTIONS = [
  {
    title: "Core",
    lines: [
      "1/2/3 switch review scope",
      "Tab / Shift+Tab cycle focus",
      "/ search files • ? toggle help",
      "w wrap lines • v toggle diff view",
      "u toggle unchanged context",
      "h hide/show comments • s submit",
      "Esc exit review • Ctrl+C exit alias",
    ],
  },
  {
    title: "Navigation",
    lines: [
      "navigator: ↑↓/j/k files",
      "Ctrl+d/u half-page • gg/G top/bottom",
      "r related filter • Enter focus diff",
    ],
  },
  {
    title: "Diff actions",
    lines: [
      "diff: ↑↓/j/k lines",
      "Shift+↑↓ extend range",
      "←/→ choose side in side-by-side view",
      "Ctrl+d/u half-page • gg/G top/bottom",
      "n/p next/previous hunk",
      "t templates • o open in $EDITOR",
      "f fix line • d/c discuss line",
      "e edit • x delete • l file • a all",
    ],
  },
  {
    title: "Comments",
    lines: [
      "comments: ↑↓/j/k comments",
      "Ctrl+d/u half-page • gg/G top/bottom",
      "e/Enter edit • d delete",
    ],
  },
  {
    title: "Editor",
    lines: [
      "Tab toggle intent",
      "Enter save • Shift+Enter newline",
      "Esc cancel",
    ],
  },
];

function pushWrappedAnsiText(lines: string[], text: string, width: number, prefix = ""): void {
  const availableWidth = Math.max(1, width - visibleWidth(prefix));
  const wrapped = wrapAnsiText(text, availableWidth, true);
  for (const line of wrapped) {
    lines.push(`${prefix}${line}`);
  }
}

function pushWrappedText(lines: string[], theme: Theme, text: string, width: number, color: "muted" | "dim" = "muted", prefix = ""): void {
  pushWrappedAnsiText(lines, theme.fg(color, text), width, prefix);
}

export function buildCommentPanelTextLines(theme: Theme, width: number, text: string, color: "muted" | "dim" = "muted", prefix = "", maxLines?: number): string[] {
  const lines: string[] = [];
  const contentWidth = Math.max(1, width - 2);
  pushWrappedText(lines, theme, text, contentWidth, color, prefix);
  return maxLines == null ? lines : lines.slice(0, Math.max(0, maxLines));
}

export function buildCommentPanelEmptyStateLines(theme: Theme, width: number): string[] {
  return [
    ...buildCommentPanelTextLines(theme, width, "No comments yet.", "dim"),
    ...buildCommentPanelTextLines(theme, width, "Use f/d/c for a line or range, l for file, or a for all.", "dim"),
  ];
}

export function buildFooterLines(theme: Theme, promptStatus: string, frameInnerWidth: number): string[] {
  return [
    truncateToWidth(theme.fg("dim", promptStatus), frameInnerWidth, "…", false),
    truncateToWidth(theme.fg("dim", FOOTER_ACTION_HINT), frameInnerWidth, "…", false),
  ];
}

export function buildHelpPanelLines(theme: Theme, width: number, activeShortcuts: CommentShortcut[], configPath: string): string[] {
  const lines: string[] = [];
  const contentWidth = Math.max(1, width - 2);

  pushWrappedText(lines, theme, "? toggle help • Esc close", contentWidth, "muted");

  for (const section of HELP_KEY_SECTIONS) {
    lines.push("");
    lines.push(truncateToWidth(theme.fg("warning", section.title), contentWidth, "", false));
    for (const line of section.lines) {
      pushWrappedText(lines, theme, line, contentWidth, "muted");
    }
  }

  lines.push("");
  lines.push(truncateToWidth(theme.fg("warning", "Template shortcuts"), contentWidth, "", false));
  if (activeShortcuts.length === 0) {
    pushWrappedText(lines, theme, "No active shortcuts for the current selection.", contentWidth, "dim");
  } else {
    for (const shortcut of activeShortcuts) {
      const badge = getIntentBadge(theme, shortcut.intent);
      pushWrappedText(lines, theme, `${shortcut.key} ${shortcut.label} ${badge}`, contentWidth, "muted");
    }
  }

  lines.push("");
  lines.push(truncateToWidth(theme.fg("warning", "Config"), contentWidth, "", false));
  pushWrappedText(lines, theme, configPath, contentWidth, "muted");

  return lines;
}

function sliceAnsiByColumn(line: string, startCol: number, length: number): string {
  if (length <= 0) return "";

  const ansiPattern = /\x1b\[[0-9;?]*[ -/]*[@-~]/y;
  let column = 0;
  let index = 0;
  let result = "";
  let activeSequences = "";
  let started = false;

  while (index < line.length) {
    ansiPattern.lastIndex = index;
    const ansiMatch = ansiPattern.exec(line);
    if (ansiMatch != null) {
      const sequence = ansiMatch[0]!;
      index += sequence.length;
      if (!started && column < startCol) {
        activeSequences += sequence;
      } else {
        result += sequence;
      }
      continue;
    }

    const char = line[index]!;
    const charWidth = visibleWidth(char);
    const charStart = column;
    const charEnd = column + charWidth;

    if (charEnd > startCol && charStart < startCol + length) {
      if (!started) {
        result = activeSequences + result;
        started = true;
      }
      result += char;
    }

    column = charEnd;
    index += char.length;
    if (column >= startCol + length) break;
  }

  return result;
}

function compositeLineAt(baseLine: string, overlayLine: string, left: number, totalWidth: number): string {
  const prefix = sliceAnsiByColumn(baseLine, 0, left);
  const overlayWidth = visibleWidth(overlayLine);
  const suffixStart = left + overlayWidth;
  const suffix = sliceAnsiByColumn(baseLine, suffixStart, Math.max(0, totalWidth - suffixStart));
  const composed = `${prefix}${overlayLine}${suffix}`;
  return composed + " ".repeat(Math.max(0, totalWidth - visibleWidth(composed)));
}

export function renderCenteredOverlay(baseLines: string[], overlayLines: string[], totalWidth: number, totalHeight = baseLines.length): string[] {
  if (overlayLines.length === 0) return [...baseLines];

  const overlayWidth = Math.min(totalWidth, Math.max(...overlayLines.map((line) => visibleWidth(line))));
  const overlayHeight = Math.min(totalHeight, overlayLines.length);
  const left = Math.max(0, Math.floor((totalWidth - overlayWidth) / 2));
  const top = Math.max(0, Math.floor((totalHeight - overlayHeight) / 2));
  const result = [...baseLines];

  for (let i = 0; i < overlayHeight; i += 1) {
    const row = top + i;
    const baseLine = result[row] ?? " ".repeat(totalWidth);
    const overlayLine = visibleWidth(overlayLines[i]!) > overlayWidth
      ? sliceAnsiByColumn(overlayLines[i]!, 0, overlayWidth)
      : overlayLines[i]!;
    result[row] = compositeLineAt(baseLine, overlayLine, left, totalWidth);
  }

  return result;
}

export type DisplayRow =
  | { kind: "gap"; displayLineNumber: null; commentLineNumber: null; commentSide: null; sign: " "; codeText: string; pairedText?: undefined }
  | { kind: "context" | "added" | "removed"; displayLineNumber: number | null; commentLineNumber: number | null; commentSide: ReviewLineTarget["side"] | null; sign: " " | "+" | "-"; codeText: string; pairedText?: string };

export interface SideBySideCell {
  side: ReviewLineTarget["side"];
  lineNumber: number;
  sign: " " | "+" | "-";
  text: string;
  tone: DiffTone;
}

export type SideBySideDisplayRow =
  | { kind: "gap"; label: string; oldCell: null; newCell: null }
  | { kind: "context" | "change"; oldCell: SideBySideCell | null; newCell: SideBySideCell | null };

export type DiffViewMode = "unified" | "side-by-side";

type DiffTone = "added" | "removed" | "context";

function applyLineBackground(theme: Theme, text: string, tone: DiffTone): string {
  if (tone === "added") return theme.bg("toolSuccessBg", text);
  if (tone === "removed") return theme.bg("toolErrorBg", text);
  return text;
}

function highlightCodeLine(theme: Theme, _tone: DiffTone, text: string, language: string | undefined): string {
  if (text.length === 0) return "";
  if (language === "json") return highlightJsonLine(theme, text);
  if (language === "markdown") return highlightMarkdownLine(theme, text);
  return highlightCodeLineWithPi(text, language);
}

export function buildDisplayRows(diff: StructuredDiff): DisplayRow[] {
  const rows: DisplayRow[] = [];

  const pushLine = (
    sign: " " | "+" | "-",
    displayLineNumber: number | undefined,
    commentLineNumber: number | undefined,
    commentSide: ReviewLineTarget["side"] | undefined,
    codeText: string,
    kind: "context" | "added" | "removed",
    pairedText?: string,
  ) => {
    rows.push({
      sign,
      displayLineNumber: displayLineNumber ?? null,
      commentLineNumber: commentLineNumber ?? null,
      commentSide: commentSide ?? null,
      codeText,
      kind,
      pairedText,
    });
  };

  for (const item of diff.visibleItems) {
    if (item.type === "gap") {
      rows.push({ sign: " ", displayLineNumber: null, commentLineNumber: null, commentSide: null, codeText: item.label, kind: "gap" });
      continue;
    }

    const row = item.row;
    if (row.kind === "equal") {
      pushLine(" ", row.newLineNumber, row.newLineNumber, "added", row.newText, "context");
      continue;
    }
    if (row.kind === "delete") {
      pushLine("-", row.oldLineNumber, row.oldLineNumber, "deleted", row.oldText, "removed");
      continue;
    }
    if (row.kind === "insert") {
      pushLine("+", row.newLineNumber, row.newLineNumber, "added", row.newText, "added");
      continue;
    }

    pushLine("-", row.oldLineNumber, row.oldLineNumber, "deleted", row.oldText, "removed", row.newText);
    pushLine("+", row.newLineNumber, row.newLineNumber, "added", row.newText, "added", row.oldText);
  }

  return rows;
}

export function buildSideBySideDisplayRows(diff: StructuredDiff): SideBySideDisplayRow[] {
  const rows: SideBySideDisplayRow[] = [];

  for (const item of diff.visibleItems) {
    if (item.type === "gap") {
      rows.push({ kind: "gap", label: item.label, oldCell: null, newCell: null });
      continue;
    }

    const row = item.row;
    if (row.kind === "equal") {
      rows.push({
        kind: "context",
        oldCell: row.oldLineNumber == null ? null : { side: "deleted", lineNumber: row.oldLineNumber, sign: " ", text: row.oldText, tone: "context" },
        newCell: row.newLineNumber == null ? null : { side: "added", lineNumber: row.newLineNumber, sign: " ", text: row.newText, tone: "context" },
      });
      continue;
    }

    if (row.kind === "delete") {
      rows.push({
        kind: "change",
        oldCell: row.oldLineNumber == null ? null : { side: "deleted", lineNumber: row.oldLineNumber, sign: "-", text: row.oldText, tone: "removed" },
        newCell: null,
      });
      continue;
    }

    if (row.kind === "insert") {
      rows.push({
        kind: "change",
        oldCell: null,
        newCell: row.newLineNumber == null ? null : { side: "added", lineNumber: row.newLineNumber, sign: "+", text: row.newText, tone: "added" },
      });
      continue;
    }

    rows.push({
      kind: "change",
      oldCell: row.oldLineNumber == null ? null : { side: "deleted", lineNumber: row.oldLineNumber, sign: "-", text: row.oldText, tone: "removed" },
      newCell: row.newLineNumber == null ? null : { side: "added", lineNumber: row.newLineNumber, sign: "+", text: row.newText, tone: "added" },
    });
  }

  return rows;
}

export function getSideBySidePairedLineTarget(diff: StructuredDiff, target: ReviewLineTarget): ReviewLineTarget | null {
  for (const row of diff.rows) {
    if (row.kind !== "replace" || row.oldLineNumber == null || row.newLineNumber == null) continue;
    if (target.side === "deleted" && target.line === row.oldLineNumber) return { side: "added", line: row.newLineNumber };
    if (target.side === "added" && target.line === row.newLineNumber) return { side: "deleted", line: row.oldLineNumber };
  }
  return null;
}

export function formatSelectedLineTargetLabel(target: ReviewLineTarget | null): string {
  if (target == null) return "no line selected";
  const range = getLineTargetRange(target);
  const noun = range.startLine === range.endLine ? "line" : "lines";
  return `selected ${target.side} ${noun} ${formatLineRangeLabel(range.startLine, range.endLine)}`;
}

export function formatDiffViewModeLabel(mode: DiffViewMode): string {
  return mode === "side-by-side" ? "side-by-side" : "unified";
}

function getCommentableLineTargets(diff: StructuredDiff): ReviewLineTarget[] {
  const seen = new Set<string>();
  const targets: ReviewLineTarget[] = [];

  for (const row of buildDisplayRows(diff)) {
    if (row.commentLineNumber == null || row.commentSide == null) continue;
    const key = `${row.commentSide}:${row.commentLineNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ side: row.commentSide, line: row.commentLineNumber });
  }

  return targets;
}

class ReviewApp {
  focused = false;

  private repoRoot: string;
  private files: ReviewFile[];
  private state: ReviewState;
  private cache = new Map<string, LoadedEntry>();
  private readonly frameStack: ReviewFrame[] = [];
  private readonly archivedFrames = new Map<string, ReviewFrame>();
  private openingSubmoduleKey: string | null = null;
  private searchMode = false;
  private searchBuffer = "";
  private shortcutMode = false;
  private helpMode = false;
  private diffViewMode: DiffViewMode = "unified";
  private confirmCancel = false;
  private commentsHidden = false;
  private externalEditorOpen = false;
  private editTarget: EditTarget | null = null;
  private editor: Editor;
  private message: string | null = null;
  private navigatorScroll = 0;
  private diffScroll = 0;
  private commentsScroll = 0;
  private navigatorPageSize = 1;
  private diffPageSize = 1;
  private commentsPageSize = 1;
  private relatedFilterAnchorFileId: string | null = null;
  private relatedFilterReturnFileId: string | null = null;
  private mousePaneLayout: MousePaneLayout | null = null;
  private mouseTrackingEnabled = false;
  private lastWidth = 120;
  private pendingVimSequence: "g" | null = null;
  private readonly previousHardwareCursor: boolean;
  private readonly syntaxLineCache = new Map<string, string>();
  private readonly renderedDiffLineCache = new Map<string, string[]>();

  constructor(
    private readonly tui: any,
    private readonly theme: Theme,
    private readonly done: (value: { result: ReviewResult; files: ReviewFile[] }) => void,
    private readonly options: ReviewAppOptions,
  ) {
    this.repoRoot = options.repoRoot;
    this.files = options.files;
    this.state = ensureActiveFile(createInitialReviewState(this.files), this.files);
    this.searchBuffer = this.state.searchQuery;

    const editorTheme: EditorTheme = {
      borderColor: (text) => this.theme.fg("accent", text),
      selectList: {
        selectedPrefix: (text) => this.theme.fg("accent", text),
        selectedText: (text) => this.theme.fg("accent", text),
        description: (text) => this.theme.fg("muted", text),
        scrollInfo: (text) => this.theme.fg("dim", text),
        noMatch: (text) => this.theme.fg("warning", text),
      },
    };
    this.editor = new Editor(this.tui, editorTheme);
    this.editor.disableSubmit = true;
    this.previousHardwareCursor = typeof this.tui.getShowHardwareCursor === "function"
      ? this.tui.getShowHardwareCursor()
      : false;
    this.syncCursorMode();
    this.setMouseTracking(true);

    queueMicrotask(() => {
      this.ensureActiveEntry();
      this.requestRender();
    });
  }

  dispose(): void {
    this.setMouseTracking(false);
    if (typeof this.tui.setShowHardwareCursor === "function") {
      this.tui.setShowHardwareCursor(this.previousHardwareCursor);
    }
  }

  invalidate(): void {
    this.syntaxLineCache.clear();
    this.renderedDiffLineCache.clear();
    this.message = this.message;
  }

  private syncCursorMode(): void {
    if (typeof this.tui.setShowHardwareCursor === "function") {
      this.tui.setShowHardwareCursor(this.editTarget != null || this.previousHardwareCursor);
    }
    (this.editor as unknown as { focused?: boolean }).focused = this.editTarget != null;
  }

  private requestRender(): void {
    if (typeof this.tui.requestRender === "function") {
      this.tui.requestRender();
    }
  }

  private writeTerminal(data: string): void {
    if (typeof this.tui.terminal?.write === "function") {
      this.tui.terminal.write(data);
    } else {
      process.stdout.write(data);
    }
  }

  private setMouseTracking(enabled: boolean): void {
    if (this.mouseTrackingEnabled === enabled) return;
    this.mouseTrackingEnabled = enabled;
    this.writeTerminal(enabled ? "\x1b[?1000h\x1b[?1006h" : "\x1b[?1000l\x1b[?1006l");
  }

  private getPaneAtMousePosition(col: number, row: number): PaneName | null {
    const layout = this.mousePaneLayout;
    if (layout == null) return null;

    const zeroCol = col - 1;
    const zeroRow = row - 1;
    const contains = (bounds: MousePaneBounds | null): boolean => bounds != null
      && zeroRow >= bounds.top
      && zeroRow <= bounds.bottom
      && zeroCol >= bounds.left
      && zeroCol <= bounds.right;

    if (contains(layout.navigator)) return "navigator";
    if (contains(layout.diff)) return "diff";
    if (contains(layout.comments)) return "comments";
    return null;
  }

  private getCachedHighlightedCode(tone: DiffTone, text: string, language: string | undefined): string {
    const key = `${language ?? ""}\u001f${tone}\u001f${text}`;
    const cached = this.syntaxLineCache.get(key);
    if (cached != null) return cached;

    const highlighted = highlightCodeLine(this.theme, tone, text, language);
    if (this.syntaxLineCache.size > 5000) this.syntaxLineCache.clear();
    this.syntaxLineCache.set(key, highlighted);
    return highlighted;
  }

  private getCachedRenderedDiffLines(
    width: number,
    wrapLines: boolean,
    rowKind: DisplayRow["kind"],
    tone: DiffTone,
    contentText: string,
    isSelected: boolean,
  ): string[] {
    const key = `${width}\u001f${wrapLines ? "wrap" : "nowrap"}\u001f${rowKind}\u001f${tone}\u001f${isSelected ? 1 : 0}\u001f${contentText}`;
    const cached = this.renderedDiffLineCache.get(key);
    if (cached != null) return cached;

    const wrapped = wrapAnsiText(contentText, Math.max(1, width - 2), wrapLines);
    const rendered = wrapped.map((line) => {
      const paddedLine = padLine(line, Math.max(1, width - 2));
      if (isSelected) return this.theme.bg("selectedBg", paddedLine);
      if (rowKind === "added" || rowKind === "removed") return applyLineBackground(this.theme, paddedLine, tone);
      return paddedLine;
    });

    if (this.renderedDiffLineCache.size > 5000) this.renderedDiffLineCache.clear();
    this.renderedDiffLineCache.set(key, rendered);
    return rendered;
  }

  private setMessage(message: string): void {
    this.message = message;
  }

  private currentPathPrefix(): string | undefined {
    return this.files[0]?.pathPrefix;
  }

  private getFrameKey(repoRoot: string, pathPrefix: string | undefined): string {
    return `${repoRoot}::${pathPrefix ?? ""}`;
  }

  private saveCurrentFrame(): ReviewFrame {
    return {
      repoRoot: this.repoRoot,
      pathPrefix: this.currentPathPrefix(),
      files: this.files,
      state: this.state,
      cache: this.cache,
      navigatorScroll: this.navigatorScroll,
      diffScroll: this.diffScroll,
      commentsScroll: this.commentsScroll,
      relatedFilterAnchorFileId: this.relatedFilterAnchorFileId,
      relatedFilterReturnFileId: this.relatedFilterReturnFileId,
    };
  }

  private restoreFrame(frame: ReviewFrame): void {
    this.repoRoot = frame.repoRoot;
    this.files = frame.files;
    this.state = frame.state;
    this.cache = frame.cache;
    this.navigatorScroll = frame.navigatorScroll;
    this.diffScroll = frame.diffScroll;
    this.commentsScroll = frame.commentsScroll;
    this.relatedFilterAnchorFileId = frame.relatedFilterAnchorFileId;
    this.relatedFilterReturnFileId = frame.relatedFilterReturnFileId;
    this.searchMode = false;
    this.searchBuffer = this.state.searchQuery;
    this.shortcutMode = false;
    this.helpMode = false;
    this.confirmCancel = false;
    this.editTarget = null;
    this.message = null;
    this.openingSubmoduleKey = null;
    this.syncCursorMode();
    this.ensureLineSelection();
  }

  private collectAllFrames(): ReviewFrame[] {
    const frames = new Map<string, ReviewFrame>();
    for (const frame of this.archivedFrames.values()) frames.set(this.getFrameKey(frame.repoRoot, frame.pathPrefix), frame);
    for (const frame of this.frameStack) frames.set(this.getFrameKey(frame.repoRoot, frame.pathPrefix), frame);
    const current = this.saveCurrentFrame();
    frames.set(this.getFrameKey(current.repoRoot, current.pathPrefix), current);
    return [...frames.values()];
  }

  private rootFrame(frames: ReviewFrame[]): ReviewFrame {
    return this.frameStack[0] ?? frames.find((frame) => frame.pathPrefix == null) ?? frames[0]!;
  }

  private buildAggregatedSubmitData(): { files: ReviewFile[]; draft: ReviewState["draft"] } {
    const frames = this.collectAllFrames();
    const root = this.rootFrame(frames);
    const rootKey = this.getFrameKey(root.repoRoot, root.pathPrefix);
    const aggregatedFiles: ReviewFile[] = [];
    const aggregatedComments: DiffReviewComment[] = [];

    for (const frame of frames) {
      aggregatedFiles.push(...frame.files);
      aggregatedComments.push(...frame.state.draft.comments);

      const frameKey = this.getFrameKey(frame.repoRoot, frame.pathPrefix);
      if (frameKey === rootKey || frame.state.draft.allComment.trim().length === 0) continue;

      const noteFileId = `frame-note:${frameKey}`;
      aggregatedFiles.push({
        id: noteFileId,
        path: frame.pathPrefix ?? formatFrameLabel(frame.repoRoot),
        pathPrefix: undefined,
        worktreeStatus: null,
        hasWorkingTreeFile: false,
        inGitDiff: frame.state.activeScope === "git-diff",
        inLastCommit: frame.state.activeScope === "last-commit",
        inAllFiles: frame.state.activeScope === "all-files",
        gitDiff: null,
        lastCommit: null,
        allFiles: null,
      });
      aggregatedComments.push({
        id: `${noteFileId}::all-note`,
        fileId: noteFileId,
        scope: frame.state.activeScope,
        side: "file",
        intent: frame.state.draft.allIntent,
        startLine: null,
        endLine: null,
        body: frame.state.draft.allComment,
      });
    }

    return {
      files: aggregatedFiles,
      draft: {
        allComment: root.state.draft.allComment,
        allIntent: root.state.draft.allIntent,
        comments: aggregatedComments,
      },
    };
  }

  private hasAggregateDraftContent(): boolean {
    return this.collectAllFrames().some((frame) => hasDraftContent(frame.state));
  }

  private getAggregateDraftCommentCount(): number {
    return this.collectAllFrames().reduce((count, frame) => count + getDraftCommentCount(frame.state), 0);
  }

  private activeFile(): ReviewFile | null {
    return this.files.find((file) => file.id === this.state.activeFileId) ?? null;
  }

  private activeSubmoduleInfo(): { file: ReviewFile; submodule: ReviewSubmoduleInfo } | null {
    const file = this.activeFile();
    const submodule = getSubmoduleInfo(file, this.state.activeScope);
    return file != null && submodule != null ? { file, submodule } : null;
  }

  private async openSubmoduleReview(file: ReviewFile, submodule: ReviewSubmoduleInfo): Promise<void> {
    const pathPrefix = joinReviewPath(file.pathPrefix, file.path);
    const frameKey = this.getFrameKey(submodule.repoRoot, pathPrefix);
    if (this.openingSubmoduleKey === frameKey) return;

    if (!submodule.available) {
      this.setMessage(submodule.unavailableReason ?? `Submodule ${file.path} is not available locally.`);
      this.requestRender();
      return;
    }

    const currentFrame = this.saveCurrentFrame();
    const archivedFrame = this.archivedFrames.get(frameKey);
    if (archivedFrame != null) {
      this.archivedFrames.delete(frameKey);
      this.frameStack.push(currentFrame);
      this.restoreFrame(archivedFrame);
      this.setMessage(`Reviewing submodule ${file.path}. Press ${GO_BACK_SHORTCUT} to go back.`);
      this.requestRender();
      return;
    }

    this.openingSubmoduleKey = frameKey;
    this.setMessage(`Opening submodule ${file.path}…`);
    this.requestRender();

    try {
      const reviewData = await this.options.loadSubmoduleReviewData(submodule);
      if (reviewData.files.length === 0) {
        this.setMessage(`No reviewable files changed inside submodule ${file.path}.`);
        return;
      }

      const prefixedFiles = reviewData.files.map((nestedFile) => ({
        ...nestedFile,
        id: namespaceReviewFileId(pathPrefix, nestedFile.id),
        pathPrefix,
      }));

      this.frameStack.push(currentFrame);
      this.repoRoot = reviewData.repoRoot;
      this.files = prefixedFiles;
      this.state = ensureActiveFile(createInitialReviewState(prefixedFiles), prefixedFiles);
      this.cache = new Map();
      this.navigatorScroll = 0;
      this.diffScroll = 0;
      this.commentsScroll = 0;
      this.relatedFilterAnchorFileId = null;
      this.relatedFilterReturnFileId = null;
      this.searchMode = false;
      this.searchBuffer = this.state.searchQuery;
      this.shortcutMode = false;
      this.helpMode = false;
      this.confirmCancel = false;
      this.message = `Reviewing submodule ${file.path}. Press ${GO_BACK_SHORTCUT} to go back.`;
      void this.ensureActiveEntry();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setMessage(`Could not open submodule ${file.path}: ${message}`);
    } finally {
      this.openingSubmoduleKey = null;
      this.requestRender();
    }
  }

  private drillIntoSelectedSubmodule(): boolean {
    const active = this.activeSubmoduleInfo();
    if (active == null) return false;
    void this.openSubmoduleReview(active.file, active.submodule);
    return true;
  }

  private navigateBackFromSubmodule(): boolean {
    const currentFrame = this.saveCurrentFrame();
    const previous = this.frameStack.pop();
    if (previous == null) return false;

    this.archivedFrames.set(this.getFrameKey(currentFrame.repoRoot, currentFrame.pathPrefix), currentFrame);
    this.restoreFrame(previous);
    this.setMessage(`Returned to ${formatFrameLabel(this.repoRoot)}.`);
    this.requestRender();
    return true;
  }

  private cacheKey(fileId: string, scope: ReviewScope): string {
    return `${scope}::${fileId}`;
  }

  private getEntry(fileId: string | null, scope: ReviewScope): LoadedEntry | undefined {
    if (fileId == null) return undefined;
    return this.cache.get(this.cacheKey(fileId, scope));
  }

  private invalidateEntry(fileId: string, scope: ReviewScope): void {
    this.cache.delete(this.cacheKey(fileId, scope));
    this.syntaxLineCache.clear();
    this.renderedDiffLineCache.clear();
  }

  private getDisplayDiff(fileId: string | null, scope: ReviewScope): StructuredDiff | null {
    const entry = this.getEntry(fileId, scope);
    if (entry?.status !== "ready") return null;
    if (scope === "all-files") return entry.baseDiff;
    return adjustStructuredDiffContext(entry.baseDiff, this.state.hideUnchanged ? 0 : DEFAULT_CONTEXT_LINES);
  }

  private getVisibleLineTargets(fileId: string | null, scope: ReviewScope): ReviewLineTarget[] {
    const diff = this.getDisplayDiff(fileId, scope);
    if (diff == null) return [];
    return getCommentableLineTargets(diff);
  }

  private relatedFilterAnchorFile(): ReviewFile | null {
    if (this.relatedFilterAnchorFileId == null || this.state.activeScope !== "all-files") return null;
    return this.files.find((file) => file.id === this.relatedFilterAnchorFileId) ?? null;
  }

  private getNavigatorFiles(): ReviewFile[] {
    let files = getScopedFiles(this.files, this.state.activeScope);
    const anchor = this.relatedFilterAnchorFile();

    if (anchor != null) {
      const relatedPaths = getRelatedFilePaths(anchor);
      files = files
        .filter((file) => file.id === anchor.id || relatedPaths.has(file.path))
        .sort((a, b) => {
          if (a.id === anchor.id) return -1;
          if (b.id === anchor.id) return 1;
          return 0;
        });
    }

    return filterFilesBySearch(files, this.state.searchQuery);
  }

  private ensureLineSelection(): void {
    const file = this.activeFile();
    if (file == null) return;
    const visibleTargets = this.getVisibleLineTargets(file.id, this.state.activeScope);
    this.state = clampSelectedLineTarget(this.state, file.id, this.state.activeScope, visibleTargets);
  }

  private async ensureActiveEntry(): Promise<void> {
    const file = this.activeFile();
    if (file == null || isSubmoduleReviewFile(file, this.state.activeScope)) return;
    const key = this.cacheKey(file.id, this.state.activeScope);
    if (this.cache.has(key)) {
      this.ensureLineSelection();
      return;
    }

    this.cache.set(key, { status: "loading" });
    this.requestRender();

    try {
      const contents = await this.options.loadFileContents(this.repoRoot, file, this.state.activeScope);
      const baseDiff = buildStructuredDiff(contents.originalContent, contents.modifiedContent, DEFAULT_CONTEXT_LINES);
      this.cache.set(key, { status: "ready", contents, baseDiff });
      this.ensureLineSelection();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.cache.set(key, { status: "error", error: message });
    }

    this.requestRender();
  }

  private setScope(scope: ReviewScope): void {
    this.relatedFilterAnchorFileId = null;
    this.relatedFilterReturnFileId = null;
    this.state = setScope(this.state, this.files, scope);
    this.diffScroll = 0;
    this.navigatorScroll = 0;
    this.commentsScroll = 0;
    void this.ensureActiveEntry();
    this.requestRender();
  }

  private openSearch(): void {
    this.relatedFilterAnchorFileId = null;
    this.relatedFilterReturnFileId = null;
    this.searchMode = true;
    this.searchBuffer = this.state.searchQuery;
    this.state = setFocus(this.state, "navigator");
    this.confirmCancel = false;
    this.requestRender();
  }

  private closeSearch(apply: boolean): void {
    if (apply) {
      this.state = setSearchQuery(this.state, this.files, this.searchBuffer);
      void this.ensureActiveEntry();
    }
    this.searchMode = false;
    this.requestRender();
  }

  private openEditor(target: EditTarget): void {
    this.commentsHidden = false;
    this.editTarget = target;
    this.editor.setText(target.initialBody);
    this.syncCursorMode();
    this.requestRender();
  }

  private setEditIntent(intent: CommentIntent): void {
    if (this.editTarget == null) return;
    this.editTarget = { ...this.editTarget, intent };
    this.requestRender();
  }

  private toggleEditIntent(): void {
    if (this.editTarget == null) return;
    this.setEditIntent(this.editTarget.intent === "fix" ? "discuss" : "fix");
  }

  private saveEditor(): void {
    const value = this.editor.getText();
    const target = this.editTarget;
    if (target == null) return;

    if (target.kind === "all") {
      this.state = setAllComment(this.state, value, target.intent);
    } else if (target.kind === "file") {
      this.state = upsertFileComment(this.state, target.fileId, target.scope, value, target.intent);
    } else {
      this.state = upsertLineComment(
        this.state,
        target.fileId,
        target.scope,
        target.side,
        target.startLine,
        value,
        target.intent,
        target.endLine,
      );
    }

    this.editTarget = null;
    this.syncCursorMode();
    this.requestRender();
  }

  private cancelEditor(): void {
    this.editTarget = null;
    this.syncCursorMode();
    this.requestRender();
  }

  private editLineCommentWithIntent(defaultIntent: CommentIntent): void {
    const file = this.activeFile();
    if (file == null) return;
    const target = getSelectedLineTarget(this.state, file.id, this.state.activeScope);
    if (target == null) {
      this.setMessage("No selectable diff line in view.");
      this.requestRender();
      return;
    }
    const range = getLineTargetRange(target);
    const existing = getLineComment(this.state, file.id, this.state.activeScope, target.side, target.line);
    this.openEditor({
      kind: "line",
      fileId: file.id,
      scope: this.state.activeScope,
      side: target.side,
      startLine: existing?.startLine ?? range.startLine,
      endLine: existing?.endLine ?? range.endLine,
      initialBody: existing?.body ?? "",
      intent: existing?.intent ?? defaultIntent,
    });
  }

  private editLineComment(): void {
    const file = this.activeFile();
    if (file == null) return;
    const target = getSelectedLineTarget(this.state, file.id, this.state.activeScope);
    if (target == null) {
      this.setMessage("No selectable diff line in view.");
      this.requestRender();
      return;
    }
    const range = getLineTargetRange(target);
    const existing = getLineComment(this.state, file.id, this.state.activeScope, target.side, target.line);
    this.openEditor({
      kind: "line",
      fileId: file.id,
      scope: this.state.activeScope,
      side: target.side,
      startLine: existing?.startLine ?? range.startLine,
      endLine: existing?.endLine ?? range.endLine,
      initialBody: existing?.body ?? "",
      intent: existing?.intent ?? "fix",
    });
  }

  private editFileComment(): void {
    const file = this.activeFile();
    if (file == null) return;
    const existing = getFileComment(this.state, file.id, this.state.activeScope);
    this.openEditor({
      kind: "file",
      fileId: file.id,
      scope: this.state.activeScope,
      initialBody: existing?.body ?? "",
      intent: existing?.intent ?? "fix",
    });
  }

  private editAllNote(): void {
    this.openEditor({ kind: "all", initialBody: this.state.draft.allComment, intent: this.state.draft.allIntent });
  }

  private editCurrentLineComment(): void {
    const file = this.activeFile();
    if (file == null) return;
    const target = getSelectedLineTarget(this.state, file.id, this.state.activeScope);
    if (target == null) return;
    const existing = getLineComment(this.state, file.id, this.state.activeScope, target.side, target.line);
    if (existing == null) {
      this.setMessage("No line comment on selected line.");
      this.requestRender();
      return;
    }
    this.editLineComment();
  }

  private deleteCurrentLineComment(): void {
    const file = this.activeFile();
    if (file == null) return;
    const target = getSelectedLineTarget(this.state, file.id, this.state.activeScope);
    if (target == null) return;
    const existing = getLineComment(this.state, file.id, this.state.activeScope, target.side, target.line);
    if (existing == null) return;
    this.state = deleteComment(this.state, existing.id);
    this.requestRender();
  }

  private deleteSelectedComment(): void {
    const file = this.activeFile();
    const items = getCommentPanelItems(this.state, file?.id ?? null, this.state.activeScope);
    const item = items[this.state.selectedCommentIndex];
    if (item == null) return;
    if (item.kind === "all") {
      this.state = setAllComment(this.state, "", this.state.draft.allIntent);
    } else {
      this.state = deleteComment(this.state, item.comment.id);
    }
    this.requestRender();
  }

  private editSelectedComment(): void {
    const file = this.activeFile();
    const items = getCommentPanelItems(this.state, file?.id ?? null, this.state.activeScope);
    const item = items[this.state.selectedCommentIndex];
    if (item == null) return;
    if (item.kind === "all") {
      this.editAllNote();
      return;
    }
    if (item.comment.side === "file") {
      this.editFileComment();
      return;
    }
    this.state = setSelectedLineTarget(this.state, item.comment.fileId, item.comment.scope, {
      side: item.comment.side,
      line: item.comment.endLine ?? item.comment.startLine ?? 1,
      endLine: item.comment.startLine != null && item.comment.endLine != null && item.comment.endLine !== item.comment.startLine
        ? item.comment.startLine
        : undefined,
    });
    this.editLineComment();
  }

  private async openSelectedLineInEditor(): Promise<void> {
    if (this.externalEditorOpen) return;

    const file = this.activeFile();
    if (file == null) {
      this.setMessage("No file selected.");
      this.requestRender();
      return;
    }

    if (!file.hasWorkingTreeFile) {
      this.setMessage("Cannot open this file in $EDITOR because it does not exist in the working tree.");
      this.requestRender();
      return;
    }

    const target = getSelectedLineTarget(this.state, file.id, this.state.activeScope);
    if (target == null) {
      this.setMessage("No selectable diff line to open in $EDITOR.");
      this.requestRender();
      return;
    }

    const diff = this.getDisplayDiff(file.id, this.state.activeScope);
    if (diff == null) {
      this.setMessage("Diff is still loading; try again in a moment.");
      this.requestRender();
      return;
    }

    const editorLine = getEditorLineForTarget(diff, target);
    const editorCommand = (process.env.EDITOR || process.env.VISUAL || "vi").trim() || "vi";
    const filePath = join(this.repoRoot, file.path);
    const command = buildEditorLaunchCommand(editorCommand, filePath, editorLine);

    this.externalEditorOpen = true;
    this.setMessage(`Opening ${file.path}:${editorLine} in $EDITOR…`);
    this.requestRender();

    try {
      this.setMouseTracking(false);
      if (typeof this.tui.stop === "function") this.tui.stop();
      if (typeof this.tui.terminal?.clearScreen === "function") this.tui.terminal.clearScreen();
      const code = await runShellCommand(command, this.repoRoot);
      this.setMessage(code === 0 ? `Returned from $EDITOR at ${file.path}:${editorLine}.` : `$EDITOR exited with code ${code ?? "unknown"}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setMessage(`Could not open $EDITOR: ${message}`);
    } finally {
      this.externalEditorOpen = false;
      this.invalidateEntry(file.id, this.state.activeScope);
      void this.ensureActiveEntry();
      if (typeof this.tui.start === "function") this.tui.start();
      this.setMouseTracking(true);
      if (typeof this.tui.requestRender === "function") this.tui.requestRender(true);
    }
  }

  private submit(): void {
    if (!this.hasAggregateDraftContent()) {
      this.setMessage("Add at least one line comment, file comment, or all note before submitting.");
      this.requestRender();
      return;
    }
    const aggregate = this.buildAggregatedSubmitData();
    this.done({ result: { type: "submit", ...aggregate.draft }, files: aggregate.files });
  }

  private cancel(): void {
    this.done({ result: { type: "cancel" }, files: this.buildAggregatedSubmitData().files });
  }

  private requestCancel(): void {
    if (!this.hasAggregateDraftContent()) {
      this.cancel();
      return;
    }

    this.confirmCancel = true;
    this.commentsHidden = false;
    this.helpMode = false;
    this.shortcutMode = false;
    this.requestRender();
  }

  private keepReviewing(): void {
    this.confirmCancel = false;
    this.requestRender();
  }

  private handleCancelConfirmationInput(data: string): void {
    if (data.toLowerCase() === "d") {
      this.cancel();
      return;
    }

    if (matchesKey(data, Key.enter) || matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
      this.keepReviewing();
    }
  }

  private moveHunk(delta: number): void {
    const file = this.activeFile();
    const diff = this.getDisplayDiff(file?.id ?? null, this.state.activeScope);
    if (file == null || diff == null || diff.hunks.length === 0) return;

    const visibleTargets = this.getVisibleLineTargets(file.id, this.state.activeScope);
    const current = getSelectedLineTarget(this.state, file.id, this.state.activeScope) ?? visibleTargets[0] ?? null;
    const targets = diff.hunks
      .map((hunk) => visibleTargets.find((target) => {
        const start = target.side === "deleted"
          ? (hunk.oldStartLine ?? hunk.newStartLine ?? target.line)
          : (hunk.newStartLine ?? hunk.oldStartLine ?? target.line);
        const end = target.side === "deleted"
          ? (hunk.oldEndLine ?? hunk.newEndLine ?? target.line)
          : (hunk.newEndLine ?? hunk.oldEndLine ?? target.line);
        return start <= target.line && target.line <= end;
      }))
      .filter((target): target is ReviewLineTarget => target != null);
    if (targets.length === 0 || current == null) return;

    let index = 0;
    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i]!;
      if (target.line < current.line || (target.line === current.line && target.side === current.side)) index = i;
    }
    const nextIndex = Math.max(0, Math.min(targets.length - 1, index + delta));
    this.state = setSelectedLineTarget(this.state, file.id, this.state.activeScope, targets[nextIndex]!);
    this.requestRender();
  }

  private getAvailableShortcuts(): CommentShortcut[] {
    const file = this.activeFile();
    const target = getSelectedLineTarget(this.state, file?.id ?? null, this.state.activeScope);
    if (file == null || target == null) return [];
    return getShortcutsForSide(this.options.commentShortcuts, target.side);
  }

  private openShortcutMode(): void {
    if (this.state.activeScope === "all-files") {
      this.setMessage("Template shortcuts are only available in git diff and last commit scopes.");
      this.requestRender();
      return;
    }
    const shortcuts = this.getAvailableShortcuts();
    if (shortcuts.length === 0) {
      this.setMessage("No template shortcuts available for the selected line.");
      this.requestRender();
      return;
    }
    this.commentsHidden = false;
    this.helpMode = false;
    this.confirmCancel = false;
    this.shortcutMode = true;
    this.requestRender();
  }

  private closeShortcutMode(): void {
    this.shortcutMode = false;
    this.requestRender();
  }

  private toggleHelpMode(): void {
    this.helpMode = !this.helpMode;
    if (this.helpMode) this.commentsHidden = false;
    this.requestRender();
  }

  private toggleDiffViewMode(): void {
    this.diffViewMode = this.diffViewMode === "unified" ? "side-by-side" : "unified";
    this.renderedDiffLineCache.clear();
    this.requestRender();
  }

  private selectSideBySidePair(side: ReviewLineTarget["side"]): boolean {
    if (this.diffViewMode !== "side-by-side" || this.state.focus !== "diff") return false;
    const file = this.activeFile();
    const diff = this.getDisplayDiff(file?.id ?? null, this.state.activeScope);
    const current = getSelectedLineTarget(this.state, file?.id ?? null, this.state.activeScope);
    if (file == null || diff == null || current == null || current.side === side) return false;

    const paired = getSideBySidePairedLineTarget(diff, current);
    if (paired == null || paired.side !== side) return false;
    this.state = setSelectedLineTarget(this.state, file.id, this.state.activeScope, paired);
    this.requestRender();
    return true;
  }

  private toggleCommentsPane(): void {
    this.commentsHidden = !this.commentsHidden;
    if (this.commentsHidden) this.helpMode = false;
    if (this.commentsHidden && this.state.focus === "comments") {
      this.state = setFocus(this.state, "diff");
    }
    this.requestRender();
  }

  private cycleVisibleFocus(backward = false): void {
    if (!this.commentsHidden) {
      this.state = backward ? cycleFocusBackward(this.state) : cycleFocus(this.state);
      this.requestRender();
      return;
    }

    const nextFocus = this.state.focus === "navigator" ? "diff" : "navigator";
    this.state = setFocus(this.state, nextFocus);
    this.requestRender();
  }

  private toggleRelatedFilter(): void {
    if (this.relatedFilterAnchorFileId != null) {
      const returnFileId = this.relatedFilterReturnFileId;
      this.relatedFilterAnchorFileId = null;
      this.relatedFilterReturnFileId = null;
      if (returnFileId != null) {
        this.state = setActiveFileId(this.state, this.files, returnFileId);
        void this.ensureActiveEntry();
      }
      this.navigatorScroll = 0;
      this.setMessage("Showing all files.");
      this.requestRender();
      return;
    }

    if (this.state.activeScope !== "all-files") {
      this.setMessage("Related filter is only available in the all files scope.");
      this.requestRender();
      return;
    }

    const file = this.activeFile();
    const relatedPaths = getRelatedFilePaths(file);
    if (file == null || relatedPaths.size === 0) {
      this.setMessage("No related files for the active file.");
      this.requestRender();
      return;
    }

    this.relatedFilterAnchorFileId = file.id;
    this.relatedFilterReturnFileId = file.id;
    this.navigatorScroll = 0;
    this.setMessage(`Showing files related to ${file.path}. Press r to show all files.`);
    this.requestRender();
  }

  private moveNavigatorSelection(delta: number): void {
    const files = this.getNavigatorFiles();
    if (files.length === 0) {
      this.state = setActiveFileId(this.state, this.files, null);
      this.requestRender();
      return;
    }

    const index = files.findIndex((file) => file.id === this.state.activeFileId);
    const currentIndex = index >= 0 ? index : 0;
    const nextIndex = Math.max(0, Math.min(files.length - 1, currentIndex + delta));
    this.state = setActiveFileId(this.state, this.files, files[nextIndex]!.id);
    void this.ensureActiveEntry();
    this.requestRender();
  }

  private moveDiffSelection(delta: number): void {
    const file = this.activeFile();
    if (file == null) return;
    const visibleTargets = this.getVisibleLineTargets(file.id, this.state.activeScope);
    this.state = moveSelectedLineTarget(this.state, file.id, this.state.activeScope, visibleTargets, delta);
    this.requestRender();
  }

  private extendDiffSelection(delta: number): void {
    const file = this.activeFile();
    if (file == null) return;
    const visibleTargets = this.getVisibleLineTargets(file.id, this.state.activeScope);
    this.state = extendSelectedLineTarget(this.state, file.id, this.state.activeScope, visibleTargets, delta);
    this.requestRender();
  }

  private moveCommentSelection(delta: number): void {
    const items = getCommentPanelItems(this.state, this.state.activeFileId, this.state.activeScope);
    this.state = moveSelectedCommentIndex(this.state, items.length, delta);
    this.requestRender();
  }

  private jumpToBoundary(direction: "start" | "end"): void {
    if (this.state.focus === "navigator") {
      const files = this.getNavigatorFiles();
      if (files.length === 0) return;
      const file = direction === "start" ? files[0]! : files[files.length - 1]!;
      this.state = setActiveFileId(this.state, this.files, file.id);
      void this.ensureActiveEntry();
      this.requestRender();
      return;
    }

    if (this.state.focus === "diff") {
      const file = this.activeFile();
      if (file == null) return;
      const visibleTargets = this.getVisibleLineTargets(file.id, this.state.activeScope);
      if (visibleTargets.length === 0) return;
      const target = direction === "start" ? visibleTargets[0]! : visibleTargets[visibleTargets.length - 1]!;
      this.state = setSelectedLineTarget(this.state, file.id, this.state.activeScope, target);
      this.requestRender();
      return;
    }

    const items = getCommentPanelItems(this.state, this.state.activeFileId, this.state.activeScope);
    if (items.length === 0) return;
    const delta = direction === "start" ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    this.state = moveSelectedCommentIndex(this.state, items.length, delta);
    this.requestRender();
  }

  private handleMouseWheel(data: string): boolean {
    const event = parseMouseWheelInput(data);
    if (event == null) return false;

    const pane = this.getPaneAtMousePosition(event.col, event.row);
    if (pane == null) return true;

    const delta = event.direction === "down" ? 1 : -1;
    if (pane === "navigator") {
      this.state = setFocus(this.state, "navigator");
      this.moveNavigatorSelection(delta);
      return true;
    }
    if (pane === "diff") {
      this.state = setFocus(this.state, "diff");
      this.moveDiffSelection(delta);
      return true;
    }
    if (pane === "comments" && !this.commentsHidden) {
      this.state = setFocus(this.state, "comments");
      this.moveCommentSelection(delta);
      return true;
    }

    return true;
  }

  private applyShortcutByKey(key: string): void {
    const file = this.activeFile();
    const target = getSelectedLineTarget(this.state, file?.id ?? null, this.state.activeScope);
    if (file == null || target == null) {
      this.shortcutMode = false;
      this.requestRender();
      return;
    }

    const shortcut = this.getAvailableShortcuts().find((item) => item.key === key.toLowerCase());
    if (shortcut == null) {
      this.setMessage(`No template shortcut for '${key}'.`);
      this.shortcutMode = false;
      this.requestRender();
      return;
    }

    const range = getLineTargetRange(target);
    this.state = upsertLineComment(this.state, file.id, this.state.activeScope, target.side, range.startLine, shortcut.text, shortcut.intent, range.endLine);
    this.shortcutMode = false;
    this.requestRender();
  }

  private handleSearchInput(data: string): void {
    if (matchesKey(data, Key.escape)) {
      this.closeSearch(false);
      return;
    }
    if (matchesKey(data, Key.enter)) {
      this.closeSearch(true);
      return;
    }
    if (matchesKey(data, Key.backspace)) {
      this.searchBuffer = this.searchBuffer.slice(0, -1);
      this.state = setSearchQuery(this.state, this.files, this.searchBuffer);
      void this.ensureActiveEntry();
      this.requestRender();
      return;
    }
    if (data.length === 1 && data >= " ") {
      this.searchBuffer += data;
      this.state = setSearchQuery(this.state, this.files, this.searchBuffer);
      void this.ensureActiveEntry();
      this.requestRender();
    }
  }

  handleInput(data: string): void {
    if (this.externalEditorOpen) return;
    if (this.handleMouseWheel(data)) return;

    if (this.editTarget != null) {
      if (matchesKey(data, Key.escape)) {
        this.cancelEditor();
        return;
      }
      if (matchesKey(data, Key.shift("tab")) || matchesKey(data, Key.tab)) {
        this.toggleEditIntent();
        return;
      }
      if (matchesKey(data, Key.shift("enter"))) {
        this.editor.handleInput("\n");
        this.requestRender();
        return;
      }
      if (matchesKey(data, Key.enter)) {
        this.saveEditor();
        return;
      }
      this.editor.handleInput(data);
      this.requestRender();
      return;
    }

    if (this.searchMode) {
      this.handleSearchInput(data);
      return;
    }

    if (this.shortcutMode) {
      if (matchesKey(data, Key.escape)) {
        this.closeShortcutMode();
        return;
      }
      if (data.length === 1 && data >= " ") {
        this.applyShortcutByKey(data);
        return;
      }
      return;
    }

    if (this.confirmCancel) {
      this.handleCancelConfirmationInput(data);
      return;
    }

    if (this.pendingVimSequence === "g") {
      this.pendingVimSequence = null;
      if (data === "g") {
        this.jumpToBoundary("start");
        return;
      }
    }

    if (data === "?") { this.toggleHelpMode(); return; }
    if (this.helpMode && matchesKey(data, Key.escape)) { this.helpMode = false; this.requestRender(); return; }

    if (data === "1") { this.setScope("git-diff"); return; }
    if (data === "2") { this.setScope("last-commit"); return; }
    if (data === "3") { this.setScope("all-files"); return; }
    if (matchesKey(data, Key.shift("tab"))) { this.cycleVisibleFocus(true); return; }
    if (matchesKey(data, Key.tab)) { this.cycleVisibleFocus(); return; }
    if (data === "g") { this.pendingVimSequence = "g"; return; }
    if (data === "G") { this.jumpToBoundary("end"); return; }
    if (data === "/") { this.openSearch(); return; }
    if (data.toLowerCase() === GO_BACK_SHORTCUT && this.navigateBackFromSubmodule()) { return; }
    if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) { this.requestCancel(); return; }
    if (data === "h") { this.toggleCommentsPane(); return; }
    if (data === "w") { this.state = setWrapLines(this.state, !this.state.wrapLines); this.requestRender(); return; }
    if (data === "v") { this.toggleDiffViewMode(); return; }
    if (data === "u") { this.state = toggleHideUnchanged(this.state); this.ensureLineSelection(); this.requestRender(); return; }
    if (data === "s") { this.submit(); return; }
    if (data === "l") { this.editFileComment(); return; }
    if (data === "a") { this.editAllNote(); return; }
    if (data === "n") { this.moveHunk(1); return; }
    if (data === "p") { this.moveHunk(-1); return; }

    if (this.state.focus === "navigator") {
      if (matchesKey(data, Key.down) || data === "j") {
        this.moveNavigatorSelection(1);
        return;
      }
      if (matchesKey(data, Key.up) || data === "k") {
        this.moveNavigatorSelection(-1);
        return;
      }
      if (matchesKey(data, Key.ctrl("d"))) {
        this.moveNavigatorSelection(getHalfPageStep(this.navigatorPageSize));
        return;
      }
      if (matchesKey(data, Key.ctrl("u"))) {
        this.moveNavigatorSelection(-getHalfPageStep(this.navigatorPageSize));
        return;
      }
      if (data === "r") {
        this.toggleRelatedFilter();
        return;
      }
      if (matchesKey(data, Key.right)) {
        if (this.drillIntoSelectedSubmodule()) return;
      }
      if (matchesKey(data, Key.enter)) {
        if (this.drillIntoSelectedSubmodule()) return;
        this.state = setFocus(this.state, "diff");
        this.requestRender();
      }
      return;
    }

    if (this.state.focus === "diff") {
      if (data === "t") {
        this.openShortcutMode();
        return;
      }
      const file = this.activeFile();
      if (file != null) {
        if (matchesKey(data, Key.shift("down"))) {
          this.extendDiffSelection(1);
          return;
        }
        if (matchesKey(data, Key.shift("up"))) {
          this.extendDiffSelection(-1);
          return;
        }
        if (matchesKey(data, Key.down) || data === "j") {
          this.moveDiffSelection(1);
          return;
        }
        if (matchesKey(data, Key.up) || data === "k") {
          this.moveDiffSelection(-1);
          return;
        }
        if (matchesKey(data, Key.left)) {
          if (this.selectSideBySidePair("deleted")) return;
        }
        if (matchesKey(data, Key.right)) {
          if (this.selectSideBySidePair("added")) return;
          if (this.drillIntoSelectedSubmodule()) return;
        }
        if (matchesKey(data, Key.ctrl("d"))) {
          this.moveDiffSelection(getHalfPageStep(this.diffPageSize));
          return;
        }
        if (matchesKey(data, Key.ctrl("u"))) {
          this.moveDiffSelection(-getHalfPageStep(this.diffPageSize));
          return;
        }
        if (matchesKey(data, Key.enter)) {
          if (this.drillIntoSelectedSubmodule()) return;
        }
        if (data === "o") {
          void this.openSelectedLineInEditor();
          return;
        }
        if (data === "f") {
          this.editLineCommentWithIntent("fix");
          return;
        }
        if (data === "d" || data === "c") {
          this.editLineCommentWithIntent("discuss");
          return;
        }
        if (data === "e") {
          this.editCurrentLineComment();
          return;
        }
        if (data === "x") {
          this.deleteCurrentLineComment();
          return;
        }
      }
      return;
    }

    if (this.state.focus === "comments") {
      if ((matchesKey(data, Key.right) || matchesKey(data, Key.enter)) && this.drillIntoSelectedSubmodule()) return;
      const items = getCommentPanelItems(this.state, this.state.activeFileId, this.state.activeScope);
      if (matchesKey(data, Key.down) || data === "j") {
        this.moveCommentSelection(1);
        return;
      }
      if (matchesKey(data, Key.up) || data === "k") {
        this.moveCommentSelection(-1);
        return;
      }
      if (matchesKey(data, Key.ctrl("d"))) {
        this.moveCommentSelection(getHalfPageStep(this.commentsPageSize));
        return;
      }
      if (matchesKey(data, Key.ctrl("u"))) {
        this.moveCommentSelection(-getHalfPageStep(this.commentsPageSize));
        return;
      }
      if (data === "e" || matchesKey(data, Key.enter)) {
        this.editSelectedComment();
        return;
      }
      if (data === "d") {
        this.deleteSelectedComment();
        return;
      }
    }
  }

  private renderNavigator(width: number, height: number): string[] {
    const files = this.getNavigatorFiles();
    const lines: string[] = [];
    const relatedAnchor = this.relatedFilterAnchorFile();
    const relatedSuffix = relatedAnchor == null ? "" : ` • related to ${shortenNavigatorPath(relatedAnchor.path, 24)}`;
    const titleSuffix = this.searchMode ? ` (${this.searchBuffer || "…"})` : this.state.searchQuery ? ` (${this.state.searchQuery})` : "";
    lines.push(this.theme.fg("muted", `${files.length} file${files.length === 1 ? "" : "s"}${titleSuffix}${relatedSuffix}`));
    lines.push("");

    if (files.length === 0) {
      lines.push(this.theme.fg("warning", "No files in this scope."));
      lines.push(this.theme.fg("dim", "Try another scope or clear search."));
      return renderBox("Navigator", width, height, this.theme, lines, this.state.focus === "navigator");
    }

    const maxBody = Math.max(1, height - 4);
    this.navigatorPageSize = maxBody;
    const activeIndex = Math.max(0, files.findIndex((file) => file.id === this.state.activeFileId));
    if (activeIndex < this.navigatorScroll) this.navigatorScroll = activeIndex;
    if (activeIndex >= this.navigatorScroll + maxBody) this.navigatorScroll = activeIndex - maxBody + 1;
    const visible = files.slice(this.navigatorScroll, this.navigatorScroll + maxBody);
    const activeFile = this.activeFile();
    const relationSource = relatedAnchor ?? activeFile;
    const relatedFilterActive = relatedAnchor != null;

    for (const file of visible) {
      const active = file.id === this.state.activeFileId;
      const relationMarker = getRelatedFileMarker(file, relationSource, this.state.activeScope);
      const related = relationMarker != null;
      const prefix = relationMarker == null
        ? active && !relatedFilterActive ? this.theme.fg("accent", "›") : " "
        : this.theme.fg(active || !relatedFilterActive ? "accent" : "muted", relationMarker);
      const status = this.theme.fg(active || (!relatedFilterActive && related) ? "accent" : "muted", getStatusLabel(file, this.state.activeScope));
      const count = getFileCommentCount(this.state, file.id, this.state.activeScope);
      const changeMarker = getChangeCountLabel(this.theme, file, this.state.activeScope);
      const commentMarker = count > 0 ? this.theme.fg("success", ` ${count}●`) : this.theme.fg("dim", "  ·");
      const submoduleMarker = isSubmoduleReviewFile(file, this.state.activeScope) ? this.theme.fg(active ? "accent" : "muted", " ↗") : "";
      const prefixText = `${prefix} ${status} `;
      const pathWidth = Math.max(1, width - 2 - visibleWidth(prefixText) - visibleWidth(changeMarker) - visibleWidth(commentMarker) - visibleWidth(submoduleMarker));
      const shortenedPath = shortenNavigatorPath(file.path, pathWidth);
      const pathText = active || (!relatedFilterActive && related)
        ? this.theme.fg("accent", shortenedPath)
        : this.theme.fg("text", shortenedPath);
      lines.push(`${prefixText}${pathText}${submoduleMarker}${changeMarker}${commentMarker}`);
    }

    return renderBox("Navigator", width, height, this.theme, lines, this.state.focus === "navigator");
  }

  private renderSideBySideCellLines(cell: SideBySideCell | null, width: number, language: string | undefined, selected: boolean, fileId: string): string[] {
    if (cell == null) return [" ".repeat(Math.max(1, width))];

    const lineComment = getLineComment(this.state, fileId, this.state.activeScope, cell.side, cell.lineNumber);
    const lineLabel = String(cell.lineNumber).padStart(4, " ");
    const gutterLine = this.theme.fg("borderMuted", lineLabel);
    const gutterSign = cell.sign === "+"
      ? this.theme.fg("success", cell.sign)
      : cell.sign === "-"
        ? this.theme.fg("error", cell.sign)
        : this.theme.fg("toolDiffContext", cell.sign);
    const commentIndicator = lineComment == null
      ? " "
      : lineComment.intent === "fix"
        ? this.theme.fg("success", "●")
        : this.theme.fg("warning", "◆");
    const highlightedCode = this.getCachedHighlightedCode(cell.tone, cell.text, language);
    const contentText = `${gutterLine} ${gutterSign} ${commentIndicator} ${highlightedCode}`;

    return wrapAnsiText(contentText, Math.max(1, width), this.state.wrapLines).map((line) => {
      const paddedLine = padLine(line, Math.max(1, width));
      if (selected) return this.theme.bg("selectedBg", paddedLine);
      if (cell.tone === "added" || cell.tone === "removed") return applyLineBackground(this.theme, paddedLine, cell.tone);
      return paddedLine;
    });
  }

  private renderSideBySideDiff(diff: StructuredDiff, width: number, fileId: string, language: string | undefined, selectedTarget: ReviewLineTarget | null): { lines: string[]; selectedIndex: number } {
    const innerWidth = Math.max(1, width - 2);
    const separator = this.theme.fg("borderMuted", " │ ");
    const separatorWidth = visibleWidth(separator);
    const oldWidth = Math.max(8, Math.floor((innerWidth - separatorWidth) / 2));
    const newWidth = Math.max(8, innerWidth - separatorWidth - oldWidth);
    const selectedRange = selectedTarget == null ? null : getLineTargetRange(selectedTarget);
    const rows = buildSideBySideDisplayRows(diff);
    const lines: string[] = [];
    let selectedIndex = 0;

    const oldHeaderActive = selectedTarget?.side === "deleted";
    const newHeaderActive = selectedTarget?.side === "added";
    lines.push(`${padLine(this.theme.fg(oldHeaderActive ? "accent" : "muted", "Deleted / Old"), oldWidth)}${separator}${padLine(this.theme.fg(newHeaderActive ? "accent" : "muted", "Added / New"), newWidth)}`);

    for (const row of rows) {
      if (row.kind === "gap") {
        lines.push(this.theme.fg("muted", centerText(row.label, innerWidth)));
        continue;
      }

      const oldSelected = row.oldCell != null
        && selectedTarget?.side === row.oldCell.side
        && selectedRange != null
        && selectedRange.startLine <= row.oldCell.lineNumber
        && row.oldCell.lineNumber <= selectedRange.endLine;
      const newSelected = row.newCell != null
        && selectedTarget?.side === row.newCell.side
        && selectedRange != null
        && selectedRange.startLine <= row.newCell.lineNumber
        && row.newCell.lineNumber <= selectedRange.endLine;
      const oldCurrent = row.oldCell != null && selectedTarget?.side === row.oldCell.side && selectedTarget.line === row.oldCell.lineNumber;
      const newCurrent = row.newCell != null && selectedTarget?.side === row.newCell.side && selectedTarget.line === row.newCell.lineNumber;
      const oldLines = this.renderSideBySideCellLines(row.oldCell, oldWidth, language, oldSelected, fileId);
      const newLines = this.renderSideBySideCellLines(row.newCell, newWidth, language, newSelected, fileId);
      const rowStart = lines.length;
      const rowHeight = Math.max(oldLines.length, newLines.length);
      for (let index = 0; index < rowHeight; index += 1) {
        lines.push(`${oldLines[index] ?? " ".repeat(oldWidth)}${separator}${newLines[index] ?? " ".repeat(newWidth)}`);
      }
      if (oldCurrent || newCurrent) selectedIndex = rowStart;
    }

    return { lines, selectedIndex };
  }

  private renderDiff(width: number, height: number): string[] {
    const file = this.activeFile();
    const lines: string[] = [];
    if (file == null) {
      lines.push(this.theme.fg("warning", "No file selected."));
      return renderBox("Diff", width, height, this.theme, lines, this.state.focus === "diff");
    }

    const entry = this.getEntry(file.id, this.state.activeScope);
    lines.push(this.theme.fg("muted", getScopeDisplayPath(file, this.state.activeScope)));
    lines.push(this.theme.fg("dim", `${formatScopeLabel(this.state.activeScope)} • view ${formatDiffViewModeLabel(this.diffViewMode)} • wrap ${this.state.wrapLines ? "on" : "off"}${this.state.activeScope === "all-files" ? "" : ` • unchanged ${this.state.hideUnchanged ? "hidden" : "shown"}`}`));
    lines.push("");

    const submodule = getSubmoduleInfo(file, this.state.activeScope);
    if (submodule != null) {
      lines.push(this.theme.fg("accent", `Submodule: ${file.path}`));
      lines.push(this.theme.fg("muted", `${submodule.oldSha ?? "new"} → ${submodule.newSha ?? "deleted"}`));
      lines.push("");
      if (!submodule.available) {
        lines.push(this.theme.fg("warning", submodule.unavailableReason ?? "Nested review is unavailable for this submodule change."));
      } else if (hasExactSubmoduleRange(submodule)) {
        lines.push(this.theme.fg("dim", "Press Enter or → to review the nested commit range."));
      } else {
        lines.push(this.theme.fg("dim", "Press Enter or → to review nested working tree changes."));
      }
      lines.push(this.theme.fg("dim", "Press l to comment on the submodule pointer change."));
      if (this.frameStack.length > 0) lines.push(this.theme.fg("dim", `Press ${GO_BACK_SHORTCUT} to return to the parent review.`));
      return renderBox("Diff", width, height, this.theme, lines, this.state.focus === "diff");
    }

    if (entry == null || entry.status === "loading") {
      lines.push(this.theme.fg("muted", "Loading file contents…"));
      return renderBox("Diff", width, height, this.theme, lines, this.state.focus === "diff");
    }
    if (entry.status === "error") {
      lines.push(this.theme.fg("error", "Could not load file contents."));
      lines.push(this.theme.fg("muted", entry.error));
      return renderBox("Diff", width, height, this.theme, lines, this.state.focus === "diff");
    }

    const diff = this.getDisplayDiff(file.id, this.state.activeScope)!;
    const visibleTargets = this.getVisibleLineTargets(file.id, this.state.activeScope);
    const language = detectPiLanguage(file.path);
    this.state = clampSelectedLineTarget(this.state, file.id, this.state.activeScope, visibleTargets);
    const selectedTarget = getSelectedLineTarget(this.state, file.id, this.state.activeScope);
    lines[1] = this.theme.fg("dim", `${formatScopeLabel(this.state.activeScope)} • view ${formatDiffViewModeLabel(this.diffViewMode)} • ${formatSelectedLineTargetLabel(selectedTarget)} • wrap ${this.state.wrapLines ? "on" : "off"}${this.state.activeScope === "all-files" ? "" : ` • unchanged ${this.state.hideUnchanged ? "hidden" : "shown"}`}`);
    let rendered: string[];
    let selectedIndex = 0;

    if (this.diffViewMode === "side-by-side") {
      const sideBySide = this.renderSideBySideDiff(diff, width, file.id, language, selectedTarget);
      rendered = sideBySide.lines;
      selectedIndex = sideBySide.selectedIndex;
    } else {
      const displayRows = buildDisplayRows(diff);
      rendered = [];

      for (const row of displayRows) {
      const selectedRange = selectedTarget == null ? null : getLineTargetRange(selectedTarget);
      const selectedSide = selectedTarget?.side ?? null;
      const isCurrentTarget = row.commentLineNumber != null
        && row.commentSide != null
        && selectedTarget?.line === row.commentLineNumber
        && selectedSide === row.commentSide;
      const isSelected = row.commentLineNumber != null
        && row.commentSide != null
        && selectedRange != null
        && selectedSide === row.commentSide
        && selectedRange.startLine <= row.commentLineNumber
        && row.commentLineNumber <= selectedRange.endLine;
      const lineComment = row.commentLineNumber != null && row.commentSide != null
        ? getLineComment(this.state, file.id, this.state.activeScope, row.commentSide, row.commentLineNumber)
        : undefined;

      let contentText: string;
      let tone: DiffTone = "context";
      if (row.kind === "gap") {
        contentText = this.theme.fg("muted", centerText(row.codeText, Math.max(row.codeText.length + 2, 10)));
      } else {
        tone = row.kind === "added" ? "added" : row.kind === "removed" ? "removed" : "context";
        const lineLabel = row.displayLineNumber == null ? "    " : String(row.displayLineNumber).padStart(4, " ");
        const gutterLine = this.theme.fg("borderMuted", lineLabel);
        const gutterSign = row.sign === "+"
          ? this.theme.fg("success", row.sign)
          : row.sign === "-"
            ? this.theme.fg("error", row.sign)
            : this.theme.fg("toolDiffContext", row.sign);
        const commentIndicator = lineComment == null
          ? " "
          : lineComment.intent === "fix"
            ? this.theme.fg("success", "●")
            : this.theme.fg("warning", "◆");
        const highlightedCode = this.getCachedHighlightedCode(tone, row.codeText, language);
        contentText = `${gutterLine} ${gutterSign} ${commentIndicator} ${highlightedCode}`;
      }

      const renderedLines = this.getCachedRenderedDiffLines(width, this.state.wrapLines, row.kind, tone, contentText, isSelected);
        if (isCurrentTarget) selectedIndex = rendered.length;
        rendered.push(...renderedLines);
      }
    }

    const maxBody = Math.max(1, height - 5);
    this.diffPageSize = maxBody;
    if (selectedIndex < this.diffScroll) this.diffScroll = selectedIndex;
    if (selectedIndex >= this.diffScroll + maxBody) this.diffScroll = selectedIndex - maxBody + 1;
    lines.push(...rendered.slice(this.diffScroll, this.diffScroll + maxBody));

    return renderBox(`Diff ${diff.hunks.length > 0 ? `(${diff.hunks.length} hunk${diff.hunks.length === 1 ? "" : "s"})` : ""}`.trim(), width, height, this.theme, lines, this.state.focus === "diff");
  }

  private renderHelpPanel(width: number, height: number): string[] {
    return renderBox("Help", width, height, this.theme, buildHelpPanelLines(this.theme, width, this.getAvailableShortcuts(), getShortcutConfigPath()), true);
  }

  private renderCancelConfirmation(): string[] {
    const count = this.getAggregateDraftCommentCount();
    const noun = count === 1 ? "draft item" : "draft items";
    const lines = [
      this.theme.fg("warning", `Discard ${count} ${noun}?`),
      "",
      this.theme.fg("muted", "d discard review"),
      this.theme.fg("muted", "Enter keep reviewing"),
      this.theme.fg("muted", "Esc keep reviewing • Ctrl+C keep reviewing"),
    ];
    return renderBox("Discard review", 50, 7, this.theme, lines, true)
      .map((line) => this.theme.bg("toolPendingBg", line));
  }

  private renderComments(width: number, height: number): string[] {
    const file = this.activeFile();
    const lines: string[] = [];
    const contentWidth = Math.max(1, width - 2);
    const fileId = file?.id ?? null;
    const items = getCommentPanelItems(this.state, fileId, this.state.activeScope);
    this.state = moveSelectedCommentIndex(this.state, items.length, 0);

    if (this.shortcutMode) {
      const shortcuts = this.getAvailableShortcuts();
      pushWrappedText(lines, this.theme, "Press a key to apply a templated comment.", contentWidth, "muted");
      pushWrappedText(lines, this.theme, "Esc cancel", contentWidth, "dim");
      lines.push("");

      if (shortcuts.length === 0) {
        lines.push(this.theme.fg("warning", "No template shortcuts available."));
        return renderBox("Template shortcuts", width, height, this.theme, lines, true);
      }

      const groups = [
        { intent: "discuss" as const, header: this.theme.fg("warning", "DISCUSS") },
        { intent: "fix" as const, header: this.theme.fg("success", "FIX") },
      ];

      groups.forEach((group, groupIndex) => {
        const groupShortcuts = shortcuts.filter((shortcut) => shortcut.intent === group.intent);
        if (groupShortcuts.length === 0) return;
        if (groupIndex > 0 && lines[lines.length - 1] !== "") lines.push("");
        lines.push(truncateToWidth(group.header, contentWidth, "", false));
        lines.push("");

        for (const shortcut of groupShortcuts) {
          pushWrappedAnsiText(lines, `${this.theme.fg("accent", shortcut.key)} ${this.theme.fg("text", shortcut.label)}`, contentWidth);
          for (const line of buildCommentPanelTextLines(this.theme, width, shortcut.text, "muted", "  ", 3)) {
            lines.push(line);
          }
          lines.push("");
        }
      });

      return renderBox("Template shortcuts", width, height, this.theme, lines, true);
    }

    if (this.helpMode) {
      return this.renderHelpPanel(width, height);
    }

    if (this.editTarget != null) {
      lines.push(this.theme.fg("muted", this.editTarget.kind === "all"
        ? "All note"
        : this.editTarget.kind === "file"
          ? "File comment"
          : `${formatLineSideLabel(this.editTarget.side)} line ${formatLineRangeLabel(this.editTarget.startLine, this.editTarget.endLine)}`));
      lines.push(`${getIntentBadge(this.theme, this.editTarget.intent)} ${this.theme.fg("dim", "Tab toggle")}`);
      lines.push(this.theme.fg("dim", "Enter save • Shift+Enter newline"));
      lines.push(this.theme.fg("dim", "Esc cancel"));
      lines.push("");
      const editorLines = this.editor.render(Math.max(10, width - 4));
      lines.push(...editorLines.map((line) => ` ${line}`));
      return renderBox("Edit comment", width, height, this.theme, lines, true);
    }

    lines.push(this.theme.fg("muted", `${this.state.draft.comments.length} scoped comment${this.state.draft.comments.length === 1 ? "" : "s"}`));
    lines.push(this.theme.fg("dim", this.state.draft.allComment ? `all note set • ${formatIntentLabel(this.state.draft.allIntent).toLowerCase()}` : "all note: none"));
    lines.push("");

    if (file != null) {
      const fileComment = getFileComment(this.state, file.id, this.state.activeScope);
      const selectedTarget = getSelectedLineTarget(this.state, file.id, this.state.activeScope);
      const lineComment = selectedTarget == null
        ? undefined
        : getLineComment(this.state, file.id, this.state.activeScope, selectedTarget.side, selectedTarget.line);
      lines.push(this.theme.fg("muted", `file: ${fileComment ? "commented" : "none"}`));
      lines.push(this.theme.fg("muted", selectedTarget == null
        ? "line —: none"
        : `${formatLineSideLabel(selectedTarget.side).toLowerCase()} ${formatLineRangeLabel(getLineTargetRange(selectedTarget).startLine, getLineTargetRange(selectedTarget).endLine)}: ${lineComment ? "commented" : "none"}`));
      lines.push("");
    }

    if (items.length === 0) {
      lines.push(...buildCommentPanelEmptyStateLines(this.theme, width));
      return renderBox("Comments", width, height, this.theme, lines, this.state.focus === "comments");
    }

    const maxBody = Math.max(1, height - 5);
    this.commentsPageSize = maxBody;
    const activeIndex = Math.max(0, this.state.selectedCommentIndex);
    if (activeIndex < this.commentsScroll) this.commentsScroll = activeIndex;
    if (activeIndex >= this.commentsScroll + maxBody) this.commentsScroll = activeIndex - maxBody + 1;

    for (const [index, item] of items.slice(this.commentsScroll, this.commentsScroll + maxBody).entries()) {
      const absoluteIndex = this.commentsScroll + index;
      const selected = absoluteIndex === activeIndex;
      const prefix = selected ? this.theme.fg("accent", "› ") : "  ";
      const label = getPanelItemLabel(this.theme, item);
      pushWrappedAnsiText(lines, selected ? this.theme.fg("accent", label) : label, contentWidth, prefix);
      const body = item.kind === "all" ? item.body : item.comment.body;
      for (const line of buildCommentPanelTextLines(this.theme, width, body, "muted", "   ", 3)) {
        lines.push(line);
      }
      if (item.kind === "comment" && item.comment.side !== "file") {
        pushWrappedText(lines, this.theme, `${getScopeDisplayPath(file, this.state.activeScope)}:${formatLineRangeLabel(item.comment.startLine ?? 0, item.comment.endLine ?? item.comment.startLine ?? 0)} (${item.comment.side})`, contentWidth, "dim", "   ");
      }
      lines.push("");
    }

    return renderBox("Comments", width, height, this.theme, lines, this.state.focus === "comments");
  }

  render(width: number): string[] {
    this.lastWidth = Math.max(40, width);
    const terminalRows = this.tui?.terminal?.rows ?? 28;
    const totalHeight = Math.max(20, terminalRows - 4);
    const frameColor = "accent" as const;
    const frameInnerWidth = Math.max(20, this.lastWidth - 2 - MODAL_INNER_PADDING_X * 2);
    const frameInnerHeight = Math.max(10, totalHeight - 2 - MODAL_INNER_PADDING_Y * 2);

    const stackPanes = shouldStackPanes(frameInnerWidth);
    const headerLineCount = this.frameStack.length > 0 ? 2 : 1;
    const bodyHeight = Math.max(stackPanes && !this.commentsHidden ? 9 : 6, frameInnerHeight - headerLineCount - 4);
    const terminalCols = this.tui?.terminal?.columns ?? this.lastWidth;
    const overlayOriginCol = Math.max(0, Math.floor((terminalCols - this.lastWidth) / 2));
    const overlayOriginRow = Math.max(0, Math.floor((terminalRows - totalHeight) / 2));
    const bodyTop = overlayOriginRow + 1 + MODAL_INNER_PADDING_Y + headerLineCount;
    const contentLeft = overlayOriginCol + 1 + MODAL_INNER_PADDING_X;

    const layoutStatus = stackPanes ? "stacked layout • " : "";
    const promptStatus = this.shortcutMode
      ? "Template shortcuts • choose from the comments panel • Esc cancel"
      : this.helpMode
        ? "Help open • ? toggle • Esc close"
        : this.message ?? (this.searchMode
          ? `Search: ${this.searchBuffer}`
          : this.editTarget != null
            ? `Editing ${formatIntentLabel(this.editTarget.intent).toLowerCase()} comment`
            : `${formatFocusStatus(this.state.focus)} • ${layoutStatus}Tab focus • / search • t templates • v diff view • ? help • 1/2/3 scopes • h ${this.commentsHidden ? "show" : "hide"} comments • o open in $EDITOR • s submit${this.frameStack.length > 0 ? ` • ${GO_BACK_SHORTCUT} return` : ""} • Esc exit • Ctrl+C exit`);

    const scopeTabs = SEARCHABLE_SCOPES.map((scope, index) => {
      const active = this.state.activeScope === scope;
      const count = getScopedFiles(this.files, scope).length;
      const text = `${index + 1}:${formatScopeLabel(scope)}(${count})`;
      return active ? this.theme.bg("selectedBg", this.theme.fg("text", ` ${text} `)) : this.theme.fg("muted", ` ${text} `);
    }).join(" ");

    const breadcrumbLabels = [...this.frameStack.map((frame) => formatFrameLabel(frame.repoRoot)), formatFrameLabel(this.repoRoot)];
    const headerLines = this.frameStack.length > 0
      ? [
          truncateToWidth(`repo: ${breadcrumbLabels.join(" › ")}`, frameInnerWidth, "", false),
          truncateToWidth(scopeTabs, frameInnerWidth, "", false),
        ]
      : [truncateToWidth(scopeTabs, frameInnerWidth, "", false)];

    const body: string[] = [];

    if (stackPanes) {
      const { navigatorHeight, diffHeight, commentsHeight } = getStackedPaneLayout(bodyHeight, this.commentsHidden);
      const paneLeft = contentLeft;
      const paneRight = contentLeft + frameInnerWidth - 1;
      const navigatorTop = bodyTop;
      const diffTop = navigatorTop + navigatorHeight;
      const commentsTop = diffTop + diffHeight;
      this.mousePaneLayout = {
        navigator: { top: navigatorTop, bottom: navigatorTop + navigatorHeight - 1, left: paneLeft, right: paneRight },
        diff: { top: diffTop, bottom: diffTop + diffHeight - 1, left: paneLeft, right: paneRight },
        comments: this.commentsHidden ? null : { top: commentsTop, bottom: commentsTop + commentsHeight - 1, left: paneLeft, right: paneRight },
      };

      body.push(...this.renderNavigator(frameInnerWidth, navigatorHeight));
      body.push(...this.renderDiff(frameInnerWidth, diffHeight));
      if (!this.commentsHidden) body.push(...this.renderComments(frameInnerWidth, commentsHeight));
    } else {
      const { navigatorWidth, diffWidth, commentsWidth } = getPaneLayout(frameInnerWidth, this.commentsHidden);
      const diffLeft = contentLeft + navigatorWidth + 1;
      const commentsLeft = this.commentsHidden ? null : diffLeft + diffWidth + 1;
      this.mousePaneLayout = {
        navigator: { top: bodyTop, bottom: bodyTop + bodyHeight - 1, left: contentLeft, right: contentLeft + navigatorWidth - 1 },
        diff: { top: bodyTop, bottom: bodyTop + bodyHeight - 1, left: diffLeft, right: diffLeft + diffWidth - 1 },
        comments: commentsLeft == null ? null : { top: bodyTop, bottom: bodyTop + bodyHeight - 1, left: commentsLeft, right: commentsLeft + commentsWidth - 1 },
      };

      const navigator = this.renderNavigator(navigatorWidth, bodyHeight);
      const diff = this.renderDiff(diffWidth, bodyHeight);
      const comments = this.commentsHidden ? [] : this.renderComments(commentsWidth, bodyHeight);

      for (let i = 0; i < bodyHeight; i += 1) {
        body.push(this.commentsHidden
          ? `${navigator[i] ?? ""} ${diff[i] ?? ""}`
          : `${navigator[i] ?? ""} ${diff[i] ?? ""} ${comments[i] ?? ""}`);
      }
    }

    const footer = buildFooterLines(this.theme, promptStatus, frameInnerWidth);

    const rendered = renderOuterFrame(this.lastWidth, totalHeight, this.theme, "slopchop", [...headerLines, ...body, ...footer], frameColor);
    if (!this.confirmCancel) return rendered;
    return renderCenteredOverlay(rendered, this.renderCancelConfirmation(), this.lastWidth, totalHeight);
  }
}

export async function runReviewApp(
  ctx: ExtensionContext,
  options: Omit<ReviewAppOptions, "notify">,
): Promise<{ result: ReviewResult; files: ReviewFile[] }> {
  return ctx.ui.custom<{ result: ReviewResult; files: ReviewFile[] }>(
    (tui, theme, _kb, done) => new ReviewApp(tui, theme, done, { ...options, notify: ctx.ui.notify.bind(ctx.ui) }),
    {
      overlay: true,
      overlayOptions: {
        anchor: "center",
        width: "100%",
        maxHeight: "100%",
        minWidth: 40,
        margin: 1,
      },
    },
  );
}
