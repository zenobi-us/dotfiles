# TUI: Lists & Pickers

## List Component Structure

```typescript
interface ListItem {
  id: string;
  name: string;
  description?: string;
  isFavorite?: boolean;
}

interface ListState {
  items: ListItem[];
  filtered: ListItem[];
  cursor: number;
  scrollOffset: number;
  filterQuery: string;
}

const VIEWPORT_HEIGHT = 12;
```

## Full Picker Component

```typescript
import type { Theme } from "@mariozechner/pi-coding-agent";
import { matchesKey, visibleWidth } from "@mariozechner/pi-tui";

type PickerResult = 
  | { action: "select"; item: ListItem }
  | { action: "cancel" };

class ListPickerComponent {
  private state: ListState;
  private width = 80;

  constructor(
    items: ListItem[],
    private theme: Theme,
    private done: (result: PickerResult) => void
  ) {
    // Sort: favorites first, then alphabetically
    const sorted = [...items].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });

    this.state = {
      items: sorted,
      filtered: sorted,
      cursor: 0,
      scrollOffset: 0,
      filterQuery: "",
    };
  }

  handleInput(data: string): void {
    // Cancel
    if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
      // Hierarchical: clear filter first, then cancel
      if (this.state.filterQuery.length > 0) {
        this.state.filterQuery = "";
        this.state.filtered = this.state.items;
        this.state.cursor = 0;
        this.state.scrollOffset = 0;
        return;
      }
      this.done({ action: "cancel" });
      return;
    }

    // Select
    if (matchesKey(data, "return") || matchesKey(data, "enter")) {
      const selected = this.state.filtered[this.state.cursor];
      if (selected) {
        this.done({ action: "select", item: selected });
      }
      return;
    }

    // Navigation
    if (matchesKey(data, "up")) {
      this.state.cursor--;
      this.clampCursor();
      return;
    }

    if (matchesKey(data, "down")) {
      this.state.cursor++;
      this.clampCursor();
      return;
    }

    // Page navigation
    if (matchesKey(data, "pageup")) {
      this.state.cursor -= VIEWPORT_HEIGHT;
      this.clampCursor();
      return;
    }

    if (matchesKey(data, "pagedown")) {
      this.state.cursor += VIEWPORT_HEIGHT;
      this.clampCursor();
      return;
    }

    // Backspace for filter
    if (matchesKey(data, "backspace")) {
      if (this.state.filterQuery.length > 0) {
        this.state.filterQuery = this.state.filterQuery.slice(0, -1);
        this.applyFilter();
      }
      return;
    }

    // Character input for filter
    if (data.length === 1 && data.charCodeAt(0) >= 32) {
      this.state.filterQuery += data;
      this.applyFilter();
      return;
    }
  }

  private applyFilter(): void {
    this.state.filtered = this.filterItems(this.state.items, this.state.filterQuery);
    this.state.cursor = 0;
    this.state.scrollOffset = 0;
    this.clampCursor();
  }

  private filterItems(items: ListItem[], query: string): ListItem[] {
    if (!query.trim()) return items;
    const lq = query.toLowerCase();
    return items.filter((item) => {
      const lt = item.name.toLowerCase();
      if (lt.includes(lq)) return true;
      // Fuzzy: character sequence match
      let qi = 0;
      for (let i = 0; i < lt.length && qi < lq.length; i++) {
        if (lt[i] === lq[qi]) qi++;
      }
      return qi === lq.length;
    });
  }

  private clampCursor(): void {
    if (this.state.filtered.length === 0) {
      this.state.cursor = 0;
      this.state.scrollOffset = 0;
      return;
    }

    this.state.cursor = Math.max(0, Math.min(this.state.cursor, this.state.filtered.length - 1));
    
    const maxOffset = Math.max(0, this.state.filtered.length - VIEWPORT_HEIGHT);
    this.state.scrollOffset = Math.max(0, Math.min(this.state.scrollOffset, maxOffset));

    if (this.state.cursor < this.state.scrollOffset) {
      this.state.scrollOffset = this.state.cursor;
    } else if (this.state.cursor >= this.state.scrollOffset + VIEWPORT_HEIGHT) {
      this.state.scrollOffset = this.state.cursor - VIEWPORT_HEIGHT + 1;
    }
  }

  render(width: number): string[] {
    const th = this.theme;
    const w = Math.min(width - 4, this.width);
    const innerW = w - 2;
    const lines: string[] = [];

    const pad = (s: string, len: number) => {
      const vis = visibleWidth(s);
      return s + " ".repeat(Math.max(0, len - vis));
    };

    const row = (content: string) =>
      th.fg("border", "│") + pad(content, innerW) + th.fg("border", "│");

    // Header
    const title = ` Items (${this.state.filtered.length}) `;
    const titlePad = Math.max(0, innerW - visibleWidth(title));
    const titleLeft = Math.floor(titlePad / 2);
    const titleRight = titlePad - titleLeft;
    lines.push(
      th.fg("border", "╭" + "─".repeat(titleLeft)) +
      th.fg("accent", title) +
      th.fg("border", "─".repeat(titleRight) + "╮")
    );
    lines.push(row(""));

    // Search input
    const cursor = th.fg("accent", "│");
    const queryDisplay = this.state.filterQuery 
      ? this.state.filterQuery + cursor 
      : th.fg("dim", "Type to search...") + cursor;
    lines.push(row(" 🔍 " + queryDisplay));
    lines.push(row(""));

    // List items
    if (this.state.filtered.length === 0) {
      lines.push(row(" " + th.fg("warning", "No items match your search")));
      for (let i = 0; i < VIEWPORT_HEIGHT - 1; i++) {
        lines.push(row(""));
      }
    } else {
      const startIdx = this.state.scrollOffset;
      const endIdx = Math.min(this.state.filtered.length, startIdx + VIEWPORT_HEIGHT);
      const visible = this.state.filtered.slice(startIdx, endIdx);

      for (let i = 0; i < visible.length; i++) {
        const item = visible[i];
        const isSelected = startIdx + i === this.state.cursor;
        
        const favIcon = item.isFavorite ? "⭐ " : "   ";
        const cursorChar = isSelected ? th.fg("accent", "▸ ") : "  ";
        const nameText = isSelected ? th.fg("accent", item.name) : item.name;
        const descText = item.description ? th.fg("muted", ` - ${item.description}`) : "";
        
        lines.push(row(" " + favIcon + cursorChar + nameText + descText));
      }

      // Pad remaining viewport
      for (let i = visible.length; i < VIEWPORT_HEIGHT; i++) {
        lines.push(row(""));
      }
    }

    // Scroll indicator
    const above = this.state.scrollOffset;
    const below = Math.max(0, this.state.filtered.length - this.state.scrollOffset - VIEWPORT_HEIGHT);
    let scrollInfo = "";
    if (above > 0) scrollInfo += `↑ ${above} more`;
    if (below > 0) scrollInfo += `${scrollInfo ? "  " : ""}↓ ${below} more`;
    if (scrollInfo) {
      lines.push(row(" " + th.fg("dim", scrollInfo)));
    } else {
      lines.push(row(""));
    }

    // Footer
    const footer = th.fg("dim", "↑↓ navigate • Enter select • Esc cancel");
    lines.push(row(" " + footer));
    lines.push(th.fg("border", "╰" + "─".repeat(innerW) + "╯"));

    return lines;
  }

  invalidate(): void {}
  dispose(): void {}
}
```

## Scroll Indicator Helper

```typescript
function formatScrollInfo(above: number, below: number): string {
  let info = "";
  if (above > 0) info += `↑ ${above} more`;
  if (below > 0) info += `${info ? "  " : ""}↓ ${below} more`;
  return info;
}
```

## Selection Indicators

```
▸ Selected item      # Cursor on this item
  Unselected item    # Regular item
⭐ Favorite item      # Has favorite flag
✓ Enabled item       # Checkbox checked
○ Disabled item      # Checkbox unchecked
```

## Multi-Select Pattern

```typescript
interface MultiSelectState extends ListState {
  selected: Set<string>;  // Track selected item IDs
}

// Toggle selection with space
if (data === " ") {
  const item = this.state.filtered[this.state.cursor];
  if (item) {
    if (this.state.selected.has(item.id)) {
      this.state.selected.delete(item.id);
    } else {
      this.state.selected.add(item.id);
    }
  }
  return;
}

// Render with checkbox
const checkbox = this.state.selected.has(item.id) 
  ? th.fg("accent", "✓ ") 
  : "○ ";
```

## Empty State

Always handle empty lists gracefully:

```typescript
if (this.state.filtered.length === 0) {
  if (this.state.filterQuery) {
    lines.push(row(" " + th.fg("warning", "No items match your search")));
    lines.push(row(" " + th.fg("dim", "Try a different search term")));
  } else {
    lines.push(row(" " + th.fg("dim", "No items available")));
    lines.push(row(" " + th.fg("dim", "Run: /mycommand add <name>")));
  }
}
```
