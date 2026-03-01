import type {
  EditToolDetails,
  ExtensionAPI,
  Theme,
} from "@mariozechner/pi-coding-agent";
import {
  createEditTool,
  getLanguageFromPath,
  highlightCode,
} from "@mariozechner/pi-coding-agent";
import {
  Text,
  truncateToWidth,
  type Component,
  visibleWidth,
} from "@mariozechner/pi-tui";

type DiffLine = {
  prefix: "+" | "-" | " ";
  line: string;
  lineNumber: string;
};

type SplitDiffRow = {
  kind: "context" | "changed" | "added" | "removed";
  left?: DiffLine;
  right?: DiffLine;
};

type CellLineKind = "add" | "remove" | "context";

type DiffSpan = { start: number; end: number };

type RgbColor = { r: number; g: number; b: number };

type DiffPalette = {
  addRowBgAnsi: string;
  removeRowBgAnsi: string;
  addEmphasisBgAnsi: string;
  removeEmphasisBgAnsi: string;
};

const ANSI_ESCAPE_SEQUENCE_PATTERN = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const BG_ANSI_PATTERN =
  /\x1b\[(?:4\d|10\d|48;5;\d{1,3}|48;2;\d{1,3};\d{1,3};\d{1,3}|49)m/g;
const ADD_ROW_BACKGROUND_MIX_RATIO = 0.24;
const REMOVE_ROW_BACKGROUND_MIX_RATIO = 0.12;
const ADD_INLINE_EMPHASIS_MIX_RATIO = 0.44;
const REMOVE_INLINE_EMPHASIS_MIX_RATIO = 0.26;

const editToolCache = new Map<string, ReturnType<typeof createEditTool>>();

function getEditTool(cwd: string) {
  let tool = editToolCache.get(cwd);
  if (!tool) {
    tool = createEditTool(cwd);
    editToolCache.set(cwd, tool);
  }
  return tool;
}

function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_SEQUENCE_PATTERN, "");
}

function padRight(value: string, width: number): string {
  const visual = visibleWidth(stripAnsi(value));
  if (visual >= width) return value;
  return value + " ".repeat(width - visual);
}

function fitToWidth(value: string, width: number): string {
  return padRight(truncateToWidth(value, width), width);
}

function padRenderedLineWidth(line: string, width: number): string {
  const safeWidth = Math.max(1, width);
  const current = visibleWidth(stripAnsi(line));
  if (current >= safeWidth) return line;
  return line + " ".repeat(safeWidth - current);
}

function wrapPlainText(text: string, width: number): string[] {
  const safeWidth = Math.max(1, width);
  const safeText = sanitizeSingleLineText(text);
  if (!safeText) return [""];

  const lines: string[] = [];
  let cursor = 0;

  while (cursor < safeText.length) {
    const remaining = safeText.length - cursor;
    if (remaining <= safeWidth) {
      lines.push(safeText.slice(cursor));
      break;
    }

    const window = safeText.slice(cursor, cursor + safeWidth);
    const breakOnSpace = window.lastIndexOf(" ");

    if (breakOnSpace > 0) {
      const next = breakOnSpace + 1; // keep the space so offsets stay stable for inline diff spans
      lines.push(safeText.slice(cursor, cursor + next));
      cursor += next;
      continue;
    }

    // Fallback for long uninterrupted tokens (paths, hashes, etc.)
    lines.push(window);
    cursor += safeWidth;
  }

  return lines.length > 0 ? lines : [""];
}

function firstText(content: Array<{ type: string; text?: string }>): string {
  for (const part of content) {
    if (part.type === "text" && typeof part.text === "string") {
      return part.text;
    }
  }
  return "";
}

function extractEditedPath(message: string): string | undefined {
  const m = message.match(/Successfully replaced text in (.+)\.$/);
  return m?.[1];
}

function ansi256ToRgb(code: number): RgbColor {
  if (code <= 15) {
    const base16: RgbColor[] = [
      { r: 0, g: 0, b: 0 },
      { r: 128, g: 0, b: 0 },
      { r: 0, g: 128, b: 0 },
      { r: 128, g: 128, b: 0 },
      { r: 0, g: 0, b: 128 },
      { r: 128, g: 0, b: 128 },
      { r: 0, g: 128, b: 128 },
      { r: 192, g: 192, b: 192 },
      { r: 128, g: 128, b: 128 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 0, b: 255 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
    ];
    return base16[code] ?? { r: 255, g: 255, b: 255 };
  }
  if (code >= 232) {
    const value = Math.max(0, Math.min(255, 8 + (code - 232) * 10));
    return { r: value, g: value, b: value };
  }
  const cube = code - 16;
  const levels = [0, 95, 135, 175, 215, 255];
  const blue = cube % 6;
  const green = Math.floor(cube / 6) % 6;
  const red = Math.floor(cube / 36) % 6;
  return {
    r: levels[red] ?? 0,
    g: levels[green] ?? 0,
    b: levels[blue] ?? 0,
  };
}

function parseAnsiColorCode(ansi: string | undefined): RgbColor | null {
  if (!ansi) return null;
  const rgbMatch = /\x1b\[(?:3|4)8;2;(\d{1,3});(\d{1,3});(\d{1,3})m/.exec(ansi);
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1] ?? "0", 10);
    const g = Number.parseInt(rgbMatch[2] ?? "0", 10);
    const b = Number.parseInt(rgbMatch[3] ?? "0", 10);
    return { r, g, b };
  }
  const bitMatch = /\x1b\[(?:3|4)8;5;(\d{1,3})m/.exec(ansi);
  if (bitMatch) {
    const code = Number.parseInt(bitMatch[1] ?? "0", 10);
    return ansi256ToRgb(code);
  }
  return null;
}

function rgbToBgAnsi(color: RgbColor): string {
  const r = Math.max(0, Math.min(255, Math.round(color.r)));
  const g = Math.max(0, Math.min(255, Math.round(color.g)));
  const b = Math.max(0, Math.min(255, Math.round(color.b)));
  return `\x1b[48;2;${r};${g};${b}m`;
}

function mixRgb(base: RgbColor, tint: RgbColor, ratio: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, ratio));
  return {
    r: base.r * (1 - clamped) + tint.r * clamped,
    g: base.g * (1 - clamped) + tint.g * clamped,
    b: base.b * (1 - clamped) + tint.b * clamped,
  };
}

function resolveDiffPalette(theme: Theme): DiffPalette {
  const baseBg = parseAnsiColorCode(theme.getBgAnsi("toolSuccessBg")) ??
    parseAnsiColorCode(theme.getBgAnsi("toolPendingBg")) ?? {
      r: 32,
      g: 35,
      b: 42,
    };
  const addFg = parseAnsiColorCode(theme.getFgAnsi("toolDiffAdded")) ?? {
    r: 88,
    g: 173,
    b: 88,
  };
  const removeFg = parseAnsiColorCode(theme.getFgAnsi("toolDiffRemoved")) ?? {
    r: 196,
    g: 98,
    b: 98,
  };

  const addRowBg = mixRgb(baseBg, addFg, ADD_ROW_BACKGROUND_MIX_RATIO);
  const removeRowBg = mixRgb(baseBg, removeFg, REMOVE_ROW_BACKGROUND_MIX_RATIO);
  const addEmphasisBg = mixRgb(baseBg, addFg, ADD_INLINE_EMPHASIS_MIX_RATIO);
  const removeEmphasisBg = mixRgb(
    baseBg,
    removeFg,
    REMOVE_INLINE_EMPHASIS_MIX_RATIO,
  );

  return {
    addRowBgAnsi: rgbToBgAnsi(addRowBg),
    removeRowBgAnsi: rgbToBgAnsi(removeRowBg),
    addEmphasisBgAnsi: rgbToBgAnsi(addEmphasisBg),
    removeEmphasisBgAnsi: rgbToBgAnsi(removeEmphasisBg),
  };
}

function keepBackgroundAcrossResets(text: string, rowBgAnsi: string): string {
  if (!text) return text;

  return text.replace(/\x1b\[([0-9;]*)m/g, (sequence, rawCodes) => {
    const split = String(rawCodes ?? "")
      .split(";")
      .filter(Boolean);
    const codes = split.length > 0 ? split : ["0"]; // ESC[m == reset
    const hasGlobalReset = codes.includes("0");
    const hasBgReset = codes.includes("49");
    if (!hasGlobalReset && !hasBgReset) {
      return sequence;
    }

    const rebuiltCodes = codes.filter((code) => code !== "49");
    const rebuilt =
      rebuiltCodes.length > 0 ? `\x1b[${rebuiltCodes.join(";")}m` : "";
    return `${rebuilt}${rowBgAnsi}`;
  });
}

function applyBackgroundToVisibleRange(
  ansiText: string,
  start: number,
  end: number,
  backgroundAnsi: string,
  restoreBackgroundAnsi: string,
): string {
  if (!ansiText || start >= end || end <= 0) return ansiText;

  let output = "";
  let visibleIndex = 0;
  let index = 0;
  let inRange = false;

  while (index < ansiText.length) {
    if (ansiText[index] === "\x1b") {
      const sequenceEnd = ansiText.indexOf("m", index);
      if (sequenceEnd !== -1) {
        output += ansiText.slice(index, sequenceEnd + 1);
        index = sequenceEnd + 1;
        continue;
      }
    }

    if (visibleIndex === start && !inRange) {
      output += backgroundAnsi;
      inRange = true;
    }
    if (visibleIndex === end && inRange) {
      output += restoreBackgroundAnsi;
      inRange = false;
    }

    output += ansiText[index] ?? "";
    visibleIndex++;
    index++;
  }

  if (inRange) output += restoreBackgroundAnsi;
  return output;
}

function computeInlineDiffSpans(
  leftLine: string,
  rightLine: string,
): { left: DiffSpan[]; right: DiffSpan[] } {
  if (leftLine === rightLine) return { left: [], right: [] };
  let start = 0;
  const minLen = Math.min(leftLine.length, rightLine.length);
  while (start < minLen && leftLine[start] === rightLine[start]) start++;

  let leftEnd = leftLine.length;
  let rightEnd = rightLine.length;
  while (
    leftEnd > start &&
    rightEnd > start &&
    leftLine[leftEnd - 1] === rightLine[rightEnd - 1]
  ) {
    leftEnd--;
    rightEnd--;
  }

  const leftSpan = leftEnd > start ? [{ start, end: leftEnd }] : [];
  const rightSpan = rightEnd > start ? [{ start, end: rightEnd }] : [];
  return { left: leftSpan, right: rightSpan };
}

function countDiffStats(diff: string): { additions: number; removals: number } {
  let additions = 0;
  let removals = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) additions += 1;
    if (line.startsWith("-")) removals += 1;
  }
  return { additions, removals };
}

function renderDiffMeter(
  theme: Theme,
  additions: number,
  removals: number,
  width = 20,
): string {
  const total = additions + removals;
  if (total <= 0) return "";

  const addBlocks = Math.round((additions / total) * width);
  const removeBlocks = Math.max(0, width - addBlocks);
  const addBar =
    addBlocks > 0 ? theme.fg("toolDiffAdded", "━".repeat(addBlocks)) : "";
  const removeBar =
    removeBlocks > 0
      ? theme.fg("toolDiffRemoved", "━".repeat(removeBlocks))
      : "";
  return `${theme.fg("dim", "[")}${addBar}${removeBar}${theme.fg("dim", "]")}`;
}

function sanitizeSingleLineText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function stripInlineBreaksPreserveAnsi(value: string): string {
  return value.replace(/\r/g, "").replace(/\n/g, "");
}

function parseLineNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function makeDiffLine(
  prefix: "+" | "-" | " ",
  lineNumber: number | undefined,
  line: string,
): DiffLine {
  return {
    prefix,
    lineNumber: lineNumber === undefined ? "" : String(lineNumber),
    line,
  };
}

function parseDiffLine(rawLine: string): DiffLine | undefined {
  const match = rawLine.match(/^([+\- ])(\s*\d*)\s(.*)$/);
  if (!match) return undefined;
  const [, prefix, lineNumber = "", line = ""] = match;
  if (prefix !== "+" && prefix !== "-" && prefix !== " ") return undefined;
  const cleanLineNumber = sanitizeSingleLineText(lineNumber);
  const cleanLine = sanitizeSingleLineText(line).replace(/\t/g, "    ");
  return { prefix, lineNumber: cleanLineNumber, line: cleanLine };
}

function buildSplitRows(diff: string): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  let pendingLeft: DiffLine[] = [];
  let pendingRight: DiffLine[] = [];
  let oldCursor: number | undefined;
  let newCursor: number | undefined;

  const flushPending = () => {
    while (pendingLeft.length > 0 || pendingRight.length > 0) {
      const left = pendingLeft.shift();
      const right = pendingRight.shift();
      if (left && right) rows.push({ kind: "changed", left, right });
      else if (left) rows.push({ kind: "removed", left });
      else if (right) rows.push({ kind: "added", right });
    }
  };

  for (const rawLine of diff.split("\n")) {
    const parsed = parseDiffLine(rawLine);
    if (!parsed) continue;

    const parsedNum = parseLineNumber(parsed.lineNumber);
    if (parsed.prefix === "-") {
      const oldNum = parsedNum ?? oldCursor;
      if (oldNum !== undefined) oldCursor = oldNum + 1;
      pendingLeft.push(makeDiffLine("-", oldNum, parsed.line));
      continue;
    }
    if (parsed.prefix === "+") {
      const newNum = parsedNum ?? newCursor;
      if (newNum !== undefined) newCursor = newNum + 1;
      pendingRight.push(makeDiffLine("+", newNum, parsed.line));
      continue;
    }

    flushPending();

    const oldNum = parsedNum ?? oldCursor;
    const newNum = newCursor ?? oldNum;
    if (oldNum !== undefined) oldCursor = oldNum + 1;
    if (newNum !== undefined) newCursor = newNum + 1;

    rows.push({
      kind: "context",
      left: makeDiffLine(" ", oldNum, parsed.line),
      right: makeDiffLine(" ", newNum, parsed.line),
    });
  }

  flushPending();
  return rows;
}

class SplitDiffComponent implements Component {
  private cacheWidth?: number;
  private cacheLines?: string[];
  private readonly lineNumberWidth: number;
  private readonly highlightCache = new Map<string, string>();
  private readonly inlineHighlights = new WeakMap<DiffLine, DiffSpan[]>();
  private readonly palette: DiffPalette;
  private readonly containerBgAnsi: string;

  constructor(
    private readonly theme: Theme,
    private readonly rows: SplitDiffRow[],
    private readonly maxRows: number,
    private readonly language?: string,
  ) {
    let maxDigits = 3;
    for (const row of rows) {
      const leftDigits = row.left?.lineNumber.trim().length ?? 0;
      const rightDigits = row.right?.lineNumber.trim().length ?? 0;
      maxDigits = Math.max(maxDigits, leftDigits, rightDigits);

      if (row.kind === "changed" && row.left && row.right) {
        const spans = computeInlineDiffSpans(row.left.line, row.right.line);
        if (spans.left.length > 0)
          this.inlineHighlights.set(row.left, spans.left);
        if (spans.right.length > 0)
          this.inlineHighlights.set(row.right, spans.right);
      }
    }
    this.lineNumberWidth = maxDigits;
    this.palette = resolveDiffPalette(theme);
    this.containerBgAnsi = theme.getBgAnsi("toolSuccessBg");
  }

  private getCellLineKind(
    kind: SplitDiffRow["kind"],
    side: "left" | "right",
  ): CellLineKind {
    if (kind === "changed") return side === "left" ? "remove" : "add";
    if (kind === "removed" && side === "left") return "remove";
    if (kind === "added" && side === "right") return "add";
    return "context";
  }

  private getVisualLineKind(
    kind: SplitDiffRow["kind"],
    side: "left" | "right",
    line?: DiffLine,
  ): CellLineKind {
    const base = this.getCellLineKind(kind, side);
    if ((kind === "added" || kind === "removed") && (line?.line ?? "") === "") {
      return "context";
    }
    return base;
  }

  private getNumberColor(
    lineKind: CellLineKind,
  ): "toolDiffRemoved" | "toolDiffAdded" | "dim" {
    if (lineKind === "remove") return "toolDiffRemoved";
    if (lineKind === "add") return "toolDiffAdded";
    return "dim";
  }

  private getRowBackground(lineKind: CellLineKind): string | undefined {
    if (lineKind === "add") return this.palette.addRowBgAnsi;
    if (lineKind === "remove") return this.palette.removeRowBgAnsi;
    return undefined;
  }

  private getEmphasisBackground(lineKind: CellLineKind): string | undefined {
    if (lineKind === "add") return this.palette.addEmphasisBgAnsi;
    if (lineKind === "remove") return this.palette.removeEmphasisBgAnsi;
    return undefined;
  }

  private getCellFillBackground(
    kind: SplitDiffRow["kind"],
    side: "left" | "right",
  ): string | undefined {
    switch (kind) {
      case "changed":
        return side === "left"
          ? this.palette.removeRowBgAnsi
          : this.palette.addRowBgAnsi;
      case "removed":
        return side === "left" ? this.palette.removeRowBgAnsi : undefined;
      case "added":
        return side === "right" ? this.palette.addRowBgAnsi : undefined;
      default:
        return undefined;
    }
  }

  private blankCell(
    kind: SplitDiffRow["kind"],
    side: "left" | "right",
    columnWidth: number,
  ): string {
    const lineKind = this.getCellLineKind(kind, side);
    const markerChar = lineKind === "add" || lineKind === "remove" ? "▌" : " ";
    const markerColor =
      lineKind === "add"
        ? "toolDiffAdded"
        : lineKind === "remove"
          ? "toolDiffRemoved"
          : "borderMuted";
    const marker = this.theme.fg(markerColor, markerChar);
    const lineNumber = this.theme.fg("dim", " ".repeat(this.lineNumberWidth));
    const divider = this.theme.fg("borderMuted", " │ ");
    const prefix = `${marker} ${lineNumber}${divider}`;
    const prefixPlain = `${markerChar} ${" ".repeat(this.lineNumberWidth)} │ `;
    const tailWidth = Math.max(0, columnWidth - visibleWidth(prefixPlain));
    let rendered = prefix + " ".repeat(tailWidth);

    const bg = this.getCellFillBackground(kind, side);
    if (!bg) return padRenderedLineWidth(rendered, columnWidth);
    rendered = `${bg}${keepBackgroundAcrossResets(rendered, bg)}${this.containerBgAnsi}`;
    return padRenderedLineWidth(rendered, columnWidth);
  }

  private syntaxHighlight(line: string): string {
    if (!this.language) return stripInlineBreaksPreserveAnsi(line);
    const safeLine = sanitizeSingleLineText(line);
    const key = `${this.language}\n${safeLine}`;
    const cached = this.highlightCache.get(key);
    if (cached) return cached;

    let highlighted = safeLine;
    try {
      highlighted = highlightCode(safeLine, this.language)[0] ?? safeLine;
      highlighted = stripInlineBreaksPreserveAnsi(highlighted).replace(
        BG_ANSI_PATTERN,
        "",
      );
    } catch {
      highlighted = safeLine;
    }
    this.highlightCache.set(key, highlighted);
    return highlighted;
  }

  private formatCellLines(
    kind: SplitDiffRow["kind"],
    side: "left" | "right",
    line: DiffLine | undefined,
    columnWidth: number,
  ): string[] {
    if (!line) return [this.blankCell(kind, side, columnWidth)];

    const lineKind = this.getVisualLineKind(kind, side, line);
    const markerChar = lineKind === "add" || lineKind === "remove" ? "▌" : " ";
    const markerColor =
      lineKind === "add"
        ? "toolDiffAdded"
        : lineKind === "remove"
          ? "toolDiffRemoved"
          : "borderMuted";
    const lineNumber = line.lineNumber
      .trim()
      .padStart(this.lineNumberWidth, " ");

    const firstPrefixAnsi =
      this.theme.fg(markerColor, markerChar) +
      " " +
      this.theme.fg(this.getNumberColor(lineKind), lineNumber) +
      this.theme.fg("borderMuted", " │ ");
    const firstPrefixPlain = `${markerChar} ${lineNumber} │ `;

    const contPrefixAnsi =
      this.theme.fg(markerColor, markerChar) +
      " " +
      this.theme.fg("dim", " ".repeat(this.lineNumberWidth)) +
      this.theme.fg("borderMuted", " │ ");
    const contPrefixPlain = `${markerChar} ${" ".repeat(this.lineNumberWidth)} │ `;

    const codeWidth = Math.max(1, columnWidth - visibleWidth(firstPrefixPlain));
    const rowBg = this.getRowBackground(lineKind);
    const emphasisBg = this.getEmphasisBackground(lineKind);

    const plainSegments = wrapPlainText(line.line, codeWidth);
    const lines: string[] = [];
    const spans = this.inlineHighlights.get(line) ?? [];

    let consumed = 0;
    for (let i = 0; i < plainSegments.length; i++) {
      const prefixAnsi = i === 0 ? firstPrefixAnsi : contPrefixAnsi;
      const prefixPlain = i === 0 ? firstPrefixPlain : contPrefixPlain;
      const plainSegment = plainSegments[i] ?? "";
      let segment = this.syntaxHighlight(plainSegment);

      if (spans.length > 0 && emphasisBg) {
        const segmentStart = consumed;
        for (let si = spans.length - 1; si >= 0; si--) {
          const span = spans[si];
          if (!span) continue;
          const localStart = Math.max(0, span.start - segmentStart);
          const localEnd = Math.min(
            plainSegment.length,
            span.end - segmentStart,
          );
          if (localEnd > localStart) {
            segment = applyBackgroundToVisibleRange(
              segment,
              localStart,
              localEnd,
              emphasisBg,
              rowBg ?? this.containerBgAnsi,
            );
          }
        }
      }

      segment = fitToWidth(segment, codeWidth);
      let rendered = prefixAnsi + segment;

      // Defensive pad if prefix widths diverge because of unicode widths
      const expectedWidth = visibleWidth(prefixPlain) + codeWidth;
      const currentWidth = visibleWidth(stripAnsi(rendered));
      if (currentWidth < expectedWidth) {
        rendered += " ".repeat(expectedWidth - currentWidth);
      }

      if (rowBg) {
        rendered = `${rowBg}${keepBackgroundAcrossResets(rendered, rowBg)}${this.containerBgAnsi}`;
      }
      lines.push(padRenderedLineWidth(rendered, columnWidth));
      consumed += plainSegment.length;
    }

    return lines;
  }

  render(width: number): string[] {
    if (this.cacheWidth === width && this.cacheLines) return this.cacheLines;

    const safeWidth = Math.max(20, width);
    const columnSeparator = this.theme.fg("borderMuted", " │ ");
    const separatorWidth = visibleWidth(stripAnsi(columnSeparator));
    const leftWidth = Math.max(
      20,
      Math.floor((safeWidth - separatorWidth) / 2),
    );
    const rightWidth = Math.max(20, safeWidth - separatorWidth - leftWidth);

    const formatTopBorderCell = (columnWidth: number): string => {
      const safeColumnWidth = Math.max(1, columnWidth);
      const chars = "─".repeat(safeColumnWidth).split("");
      const dividerIndex = this.lineNumberWidth + 3;
      if (dividerIndex >= 0 && dividerIndex < chars.length) {
        chars[dividerIndex] = "┬";
      }
      return this.theme.fg("borderMuted", chars.join(""));
    };

    const formatHeaderCell = (label: string, columnWidth: number): string => {
      // Keep marker+space columns, then place label inside the line-number column.
      const markerPad = "  ";
      const lineNumberLabel = fitToWidth(label, this.lineNumberWidth);
      const prefixAnsi =
        this.theme.fg("borderMuted", markerPad) +
        this.theme.fg("dim", lineNumberLabel) +
        this.theme.fg("borderMuted", " │ ");
      const prefixPlain = `${markerPad}${stripAnsi(lineNumberLabel)} │ `;
      const codeWidth = Math.max(0, columnWidth - visibleWidth(prefixPlain));
      return padRenderedLineWidth(
        prefixAnsi + " ".repeat(codeWidth),
        columnWidth,
      );
    };

    const lines: string[] = [];
    lines.push(
      padRenderedLineWidth(
        formatTopBorderCell(leftWidth) +
          this.theme.fg("borderMuted", "─┬─") +
          formatTopBorderCell(rightWidth),
        safeWidth,
      ),
    );
    lines.push(
      padRenderedLineWidth(
        formatHeaderCell("old", leftWidth) +
          columnSeparator +
          formatHeaderCell("new", rightWidth),
        safeWidth,
      ),
    );

    for (const row of this.rows.slice(0, this.maxRows)) {
      const leftCellLines = this.formatCellLines(
        row.kind,
        "left",
        row.left,
        leftWidth,
      );
      const rightCellLines = this.formatCellLines(
        row.kind,
        "right",
        row.right,
        rightWidth,
      );
      const rowHeight = Math.max(leftCellLines.length, rightCellLines.length);

      for (let i = 0; i < rowHeight; i++) {
        const leftFallbackKind: SplitDiffRow["kind"] =
          row.kind === "changed" ? "context" : row.kind;
        const rightFallbackKind: SplitDiffRow["kind"] =
          row.kind === "changed" ? "context" : row.kind;
        const leftCell =
          leftCellLines[i] ??
          this.blankCell(leftFallbackKind, "left", leftWidth);
        const rightCell =
          rightCellLines[i] ??
          this.blankCell(rightFallbackKind, "right", rightWidth);
        const joined = padRenderedLineWidth(
          leftCell + columnSeparator + rightCell,
          safeWidth,
        );
        lines.push(joined);
      }
    }

    if (this.rows.length > this.maxRows) {
      lines.push(
        this.theme.fg(
          "muted",
          `... ${this.rows.length - this.maxRows} more rows`,
        ),
      );
    }

    this.cacheWidth = width;
    this.cacheLines = lines;
    return lines;
  }

  invalidate(): void {
    this.cacheWidth = undefined;
    this.cacheLines = undefined;
    this.highlightCache.clear();
  }
}

export default function diffRendererExtension(pi: ExtensionAPI) {
  const templateTool = getEditTool(process.cwd());

  pi.registerTool({
    name: "edit",
    label: templateTool.label,
    description: templateTool.description,
    parameters: templateTool.parameters,

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return getEditTool(ctx.cwd).execute(toolCallId, params, signal, onUpdate);
    },

    renderCall(args, theme) {
      return new Text(
        `${theme.fg("toolTitle", theme.bold("edit"))} ${theme.fg("accent", args.path)}`,
        0,
        0,
      );
    },

    renderResult(result, { expanded, isPartial }, theme) {
      if (isPartial) {
        return new Text(
          `${theme.fg("dim", "↳")} ${theme.fg("muted", "Applying edit...")}`,
          0,
          0,
        );
      }

      const message = firstText(result.content);
      if (message && /^error[:\s]/i.test(message.trim())) {
        return new Text(theme.fg("error", message), 0, 0);
      }

      const details = result.details as EditToolDetails | undefined;
      if (!details?.diff) {
        return new Text(
          `${theme.fg("dim", "↳")} ${theme.fg("muted", "Edit applied")}`,
          0,
          0,
        );
      }

      const sourcePath = extractEditedPath(message);
      const language = sourcePath ? getLanguageFromPath(sourcePath) : undefined;
      const { additions, removals } = countDiffStats(details.diff);
      const meter = renderDiffMeter(theme, additions, removals);
      const summary =
        `${theme.fg("dim", "↳")} ${theme.fg("muted", "diff")}` +
        ` ${theme.fg("toolDiffAdded", `+${additions}`)}` +
        ` ${theme.fg("toolDiffRemoved", `-${removals}`)}` +
        ` ${theme.fg("muted", "split")}` +
        (meter ? ` ${meter}` : "");

      const rows = buildSplitRows(details.diff);
      const maxRows = expanded ? 160 : 36;
      const split = new SplitDiffComponent(theme, rows, maxRows, language);

      return {
        render(width: number): string[] {
          const safeWidth = Math.max(20, width - 1);
          const headerLines = new Text(summary, 0, 0).render(safeWidth);
          return [...headerLines, ...split.render(safeWidth)];
        },
        invalidate(): void {
          split.invalidate();
        },
      };
    },
  });
}
