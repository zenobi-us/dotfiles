import { editorKey } from "@mariozechner/pi-coding-agent";
import type { Focusable } from "@mariozechner/pi-tui";
import {
  Container,
  getEditorKeybindings,
  Input,
  truncateToWidth,
  visibleWidth,
} from "@mariozechner/pi-tui";
import { extendedMatch, Fzf, type FzfResultItem } from "fzf";

export interface SelectorTheme {
  accent: (text: string) => string;
  muted: (text: string) => string;
  dim: (text: string) => string;
  match: (text: string) => string;
  border: (text: string) => string;
  bold: (text: string) => string;
}

interface FzfEntry {
  item: string;
  positions: Set<number>;
}

/**
 * Fuzzy selector component: Input + fzf-filtered scrollable list.
 *
 * Renders as a box with side borders (│), top/bottom borders (─),
 * and rounded corners (╭╮╰╯).
 *
 * Implements Focusable so the Input child gets proper IME cursor positioning.
 */
export class FuzzySelector extends Container implements Focusable {
  private input: Input;
  private candidates: string[];
  private filtered: FzfEntry[];
  private selectedIndex = 0;
  private maxVisible: number;
  private selectorTheme: SelectorTheme;
  private title: string;
  private fzf: Fzf<string[]>;

  public onSelect?: (item: string) => void;
  public onCancel?: () => void;

  // --- Focusable ---
  private _focused = false;
  get focused(): boolean {
    return this._focused;
  }
  set focused(value: boolean) {
    this._focused = value;
    this.input.focused = value;
  }

  constructor(
    candidates: string[],
    title: string,
    maxVisible: number,
    theme: SelectorTheme,
  ) {
    super();
    this.candidates = candidates;
    this.title = title;
    this.maxVisible = maxVisible;
    this.selectorTheme = theme;

    // Initial unfiltered list
    this.filtered = candidates.map((item) => ({
      item,
      positions: new Set<number>(),
    }));

    // Fzf instance — created once since candidates don't change
    this.fzf = new Fzf(candidates, {
      forward: false,
      match: extendedMatch,
    });

    // Input field for fuzzy query
    this.input = new Input();
  }

  handleInput(data: string): void {
    const kb = getEditorKeybindings();

    // Navigation: up/down (uses selectUp/selectDown keybindings)
    if (kb.matches(data, "selectUp")) {
      if (this.filtered.length > 0) {
        this.selectedIndex =
          this.selectedIndex === 0
            ? this.filtered.length - 1
            : this.selectedIndex - 1;
      }
      return;
    }

    if (kb.matches(data, "selectDown")) {
      if (this.filtered.length > 0) {
        this.selectedIndex =
          this.selectedIndex === this.filtered.length - 1
            ? 0
            : this.selectedIndex + 1;
      }
      return;
    }

    if (kb.matches(data, "selectPageUp")) {
      if (this.filtered.length > 0) {
        this.selectedIndex = Math.max(0, this.selectedIndex - this.maxVisible);
      }
      return;
    }

    if (kb.matches(data, "selectPageDown")) {
      if (this.filtered.length > 0) {
        this.selectedIndex = Math.min(
          this.filtered.length - 1,
          this.selectedIndex + this.maxVisible,
        );
      }
      return;
    }

    // Select (uses selectConfirm keybinding)
    if (kb.matches(data, "selectConfirm")) {
      const entry = this.filtered[this.selectedIndex];
      if (entry) {
        this.onSelect?.(entry.item);
      }
      return;
    }

    // Cancel (uses selectCancel keybinding)
    if (kb.matches(data, "selectCancel")) {
      this.onCancel?.();
      return;
    }

    // Everything else goes to the input field
    const prevValue = this.input.getValue();
    this.input.handleInput(data);
    const newValue = this.input.getValue();

    // Re-filter if query changed
    if (newValue !== prevValue) {
      this.applyFilter(newValue);
    }
  }

  private applyFilter(query: string): void {
    if (!query) {
      // No query — show all candidates in original order, no highlights
      this.filtered = this.candidates.map((item) => ({
        item,
        positions: new Set<number>(),
      }));
    } else {
      const results: FzfResultItem<string>[] = this.fzf.find(query);
      this.filtered = results.map((r) => ({
        item: r.item,
        positions: r.positions,
      }));
    }

    // Reset selection to top
    this.selectedIndex = 0;
  }

  override render(width: number): string[] {
    const t = this.selectorTheme;
    const lines: string[] = [];

    // Inner content width (minus 2 for side borders)
    const innerWidth = Math.max(1, width - 2);
    const side = t.border("│");

    // Top border with rounded corners
    lines.push(
      t.border("╭") + t.border("─".repeat(innerWidth)) + t.border("╮"),
    );

    // Title
    lines.push(boxLine(` ${t.accent(t.bold(this.title))}`, innerWidth, side));

    // Input field — render then wrap each line in side borders
    const inputLines = this.input.render(innerWidth);
    for (const il of inputLines) {
      lines.push(boxLine(il, innerWidth, side));
    }

    // Separator
    lines.push(
      t.border("├") + t.border("─".repeat(innerWidth)) + t.border("┤"),
    );

    // Filtered list
    if (this.filtered.length === 0) {
      lines.push(boxLine(t.muted("  No matches"), innerWidth, side));
    } else {
      // Calculate visible window (scroll around selection)
      const total = this.filtered.length;
      const visible = Math.min(this.maxVisible, total);
      const startIndex = Math.max(
        0,
        Math.min(this.selectedIndex - Math.floor(visible / 2), total - visible),
      );
      const endIndex = Math.min(startIndex + visible, total);

      for (let i = startIndex; i < endIndex; i++) {
        const entry = this.filtered[i];
        if (!entry) continue;
        const isSelected = i === this.selectedIndex;
        const prefix = isSelected ? "→ " : "  ";

        // Build highlighted text
        const highlighted = highlightMatches(
          entry.item,
          entry.positions,
          t.match,
        );

        const content = isSelected
          ? t.accent(prefix) + t.accent(highlighted)
          : prefix + highlighted;

        lines.push(
          boxLine(truncateToWidth(content, innerWidth), innerWidth, side),
        );
      }

      // Scroll indicator
      if (total > visible) {
        const info = `  (${this.selectedIndex + 1}/${total})`;
        lines.push(boxLine(t.dim(info), innerWidth, side));
      }
    }

    // Help line with configured keybindings
    const upKey = prettyKey(editorKey("selectUp"));
    const downKey = prettyKey(editorKey("selectDown"));
    const confirmKey = prettyKey(editorKey("selectConfirm"));
    const cancelKey = prettyKey(editorKey("selectCancel"));
    lines.push(
      boxLine(
        t.dim(
          ` ${upKey} ${downKey} navigate • ${confirmKey} select • ${cancelKey} cancel`,
        ),
        innerWidth,
        side,
      ),
    );

    // Bottom border with rounded corners
    lines.push(
      t.border("╰") + t.border("─".repeat(innerWidth)) + t.border("╯"),
    );

    return lines;
  }

  override invalidate(): void {
    super.invalidate();
    this.input.invalidate();
  }
}

const PRETTY_KEYS: Record<string, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  escape: "esc",
  enter: "⏎",
};

/**
 * Replace well-known key names with nicer symbols (e.g. "up" → "↑").
 * Handles composite strings like "up/ctrl+p" by replacing each segment.
 */
function prettyKey(key: string): string {
  return key
    .split("/")
    .map((k) => PRETTY_KEYS[k] ?? k)
    .join("/");
}

/**
 * Wrap a content line with side borders, padding to fill the box width.
 */
function boxLine(content: string, innerWidth: number, side: string): string {
  const contentWidth = visibleWidth(content);
  const padding = Math.max(0, innerWidth - contentWidth);
  return side + content + " ".repeat(padding) + side;
}

/**
 * Highlight matched character positions in a string.
 * Characters at positions in `positions` are wrapped with `highlightFn`.
 */
function highlightMatches(
  text: string,
  positions: Set<number>,
  highlightFn: (ch: string) => string,
): string {
  if (positions.size === 0) return text;

  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    result += positions.has(i) ? highlightFn(char) : char;
  }
  return result;
}
