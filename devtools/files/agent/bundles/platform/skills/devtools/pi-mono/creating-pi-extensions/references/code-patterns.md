# Extension Code Patterns

## Architecture Principles

- **Discrete functions** - Small, focused functions that do one thing well
- **Classes for TUI components**
  - Factory functions to create components for different scenarios (from command handler, from another component, etc.)
  - Components handle their own state and input; parent passes data and receives events via callbacks
  - Components handle their own rendering nuances (truncation, padding, theming, borders)
- **Utility functions** for common tasks (fuzzy search, cursor clamping, scroll info formatting)

---

## Entry Point (index.ts)

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function myExtension(pi: ExtensionAPI) {
  pi.registerCommand("mycmd", {
    description: "My command description",
    handler: async (args, ctx) => {
      // Implementation
    },
  });

  pi.registerShortcut("ctrl+shift+m", {
    description: "Quick access shortcut",
    handler: async (ctx) => {
      // Implementation
    },
  });
}
```

---

## Types (types.ts)

```typescript
export interface MyItem {
  id: string;
  name: string;
  description: string;
  isFavorite?: boolean;
}

export interface ListState {
  items: MyItem[];
  filtered: MyItem[];
  cursor: number;
  scrollOffset: number;
  filterQuery: string;
}

export type ActionResult = 
  | { action: "select"; item: MyItem }
  | { action: "cancel" }
  | { action: "delete"; itemId: string };
```

---

## Render Helpers (render-helpers.ts)

```typescript
import type { Theme } from "@mariozechner/pi-coding-agent";
import { visibleWidth } from "@mariozechner/pi-tui";

export function pad(s: string, len: number): string {
  const vis = visibleWidth(s);
  return s + " ".repeat(Math.max(0, len - vis));
}

export function row(content: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  return theme.fg("border", "│") + pad(content, innerW) + theme.fg("border", "│");
}

export function renderHeader(text: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  const padLen = Math.max(0, innerW - visibleWidth(text));
  const padLeft = Math.floor(padLen / 2);
  const padRight = padLen - padLeft;
  return (
    theme.fg("border", "╭" + "─".repeat(padLeft)) +
    theme.fg("accent", text) +
    theme.fg("border", "─".repeat(padRight) + "╮")
  );
}

export function renderFooter(text: string, width: number, theme: Theme): string {
  const innerW = width - 2;
  const padLen = Math.max(0, innerW - visibleWidth(text));
  const padLeft = Math.floor(padLen / 2);
  const padRight = padLen - padLeft;
  return (
    theme.fg("border", "╰" + "─".repeat(padLeft)) +
    theme.fg("dim", text) +
    theme.fg("border", "─".repeat(padRight) + "╯")
  );
}
```

---

## Command with Subcommands

```typescript
pi.registerCommand("items", {
  description: "Manage items",
  handler: async (args, ctx) => {
    const parts = args?.trim().split(/\s+/) ?? [];
    const subcommand = parts[0] ?? "";
    const rest = parts.slice(1).join(" ");

    switch (subcommand) {
      case "":
      case "list":
        await showPicker(ctx);
        break;
        
      case "add":
        if (!rest) {
          ctx.ui.notify("Usage: /items add <name>", "warning");
          return;
        }
        await addItem(rest);
        ctx.ui.notify(`Added: ${rest}`, "info");
        break;
        
      case "rm":
      case "remove":
        await removeItem(rest);
        ctx.ui.notify(`Removed: ${rest}`, "info");
        break;
        
      default:
        ctx.ui.notify(
          `Unknown: ${subcommand}\n\nUsage:\n  /items [list]\n  /items add <name>\n  /items rm <name>`,
          "warning"
        );
    }
  },
});
```

---

## Notifications

```typescript
ctx.ui.notify("Operation completed", "info");     // Blue
ctx.ui.notify("No items found", "warning");       // Yellow
ctx.ui.notify("Failed to save", "error");         // Red

// Multi-line
ctx.ui.notify("Created:\n- Item 1\n- Item 2", "info");
```

---

## External Process Execution

```typescript
const result = await pi.exec("git", ["status", "--porcelain"], {
  timeout: 5000,
  cwd: "/path/to/repo",
});

if (result.code === 0) {
  const files = result.stdout.split("\n").filter(Boolean);
} else {
  ctx.ui.notify(`Error: ${result.stderr}`, "error");
}
```

---

## Data Storage

```typescript
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const DATA_DIR = join(
  process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"),
  "my-extension"
);

function ensureDirs(): void {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig<T>(defaults: T): T {
  const file = join(DATA_DIR, "config.json");
  try {
    return { ...defaults, ...JSON.parse(readFileSync(file, "utf-8")) };
  } catch {
    return defaults;
  }
}

function saveConfig<T>(config: T): void {
  const file = join(DATA_DIR, "config.json");
  writeFileSync(file, JSON.stringify(config, null, 2), "utf-8");
}
```

---

## Configuration & Settings

Use [`pi-extension-config`](https://github.com/zenobi-us/pi-extension-config) for type-safe, layered configuration.

```bash
bun add pi-extension-config
```

**Config sources (highest priority first):**
1. **Environment variables** — `MYEXT_SOME_KEY` (prefix derived from app name)
2. **Project config** — `.pi/<name>.config.json` (in git root or cwd)
3. **Home config** — `~/.pi/agent/<name>.config.json`
4. **Defaults** — passed when creating the service

```typescript
import { createConfigService } from 'pi-extension-config';

export default function MyExtension(pi: ExtensionAPI) {
  // Create a typed config service
  const service = await createConfigService<MyConfig>('my-extension', {
    defaults: { timeout: 30, verbose: false },
    parse: (raw) => mySchema.parse(raw), // optional validation
  });

  // Read config
  console.log(service.config.timeout); // 30

  // Update and persist
  await service.set('timeout', 60, 'project');
  await service.save('project');

  // Reload from disk
  await service.reload();
}
```

**`createConfigService<TConfig>(name, options?)`**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Extension name (used for file paths and env prefix) |
| `options.defaults` | `Partial<TConfig>` | Default values |
| `options.parse` | `(raw: unknown) => TConfig \| Promise<TConfig>` | Optional parser/validator |

**`ConfigService<TConfig>`**

| Property/Method | Description |
|-----------------|-------------|
| `config` | Current configuration object (readonly) |
| `set(key, value, target?)` | Set a key (`target`: `'home'` or `'project'`) |
| `save(target?)` | Persist changes to disk |
| `reload()` | Reload configuration from all sources |

---

## Interactive Overlay Invocation

```typescript
async function showPicker(ctx: ExtensionCommandContext): Promise<void> {
  const items = await loadItems();
  
  if (items.length === 0) {
    ctx.ui.notify("No items found", "warning");
    return;
  }

  const result = await ctx.ui.custom<ActionResult | null>(
    (tui, theme, _kb, done) => {
      const component = new PickerComponent(items, theme, done);
      return {
        render: (width: number) => component.render(width),
        handleInput: (data: string) => {
          component.handleInput(data);
          tui.requestRender();
        },
        invalidate: () => component.invalidate(),
      };
    },
    {
      overlay: true,
      overlayOptions: { anchor: "center", width: 80, maxHeight: "80%" },
    }
  );

  if (!result || result.action === "cancel") {
    ctx.ui.notify("Cancelled", "info");
    return;
  }

  if (result.action === "select") {
    ctx.ui.notify(`Selected: ${result.item.name}`, "info");
  }
}
```

---

## Component Class Pattern

```typescript
class MyComponent {
  private state: ListState;

  constructor(
    items: MyItem[],
    private theme: Theme,
    private done: (result: ActionResult | null) => void
  ) {
    this.state = {
      items,
      filtered: items,
      cursor: 0,
      scrollOffset: 0,
      filterQuery: "",
    };
  }

  handleInput(data: string): void { /* ... */ }
  render(width: number): string[] { /* ... */ }
  invalidate(): void {}
  dispose(): void {}
}
```

---

## Component Factory Functions

Create components for different contexts:

```typescript
// Factory for use in ctx.ui.custom() from command handler
export function createPickerOverlay(
  items: MyItem[],
  theme: Theme,
  done: (result: ActionResult | null) => void
) {
  const component = new PickerComponent(items, theme, done);
  return {
    render: (width: number) => component.render(width),
    handleInput: (data: string) => component.handleInput(data),
    invalidate: () => component.invalidate(),
  };
}

// Factory for embedding within another component
export function createNestedPicker(
  items: MyItem[],
  theme: Theme,
  onSelect: (item: MyItem) => void,
  onCancel: () => void
) {
  return new PickerComponent(items, theme, (result) => {
    if (result?.action === "select") onSelect(result.item);
    else onCancel();
  });
}
```

Usage from command handler:
```typescript
const result = await ctx.ui.custom<ActionResult | null>(
  (tui, theme, _kb, done) => {
    const overlay = createPickerOverlay(items, theme, done);
    return {
      ...overlay,
      handleInput: (data: string) => {
        overlay.handleInput(data);
        tui.requestRender();
      },
    };
  },
  { overlay: true, overlayOptions: { anchor: "center", width: 80, maxHeight: "80%" } }
);
```

Usage from parent component:
```typescript
class ParentComponent {
  private childPicker: PickerComponent | null = null;

  openPicker(): void {
    this.childPicker = createNestedPicker(
      this.items,
      this.theme,
      (item) => { this.handleSelection(item); this.childPicker = null; },
      () => { this.childPicker = null; }
    );
  }

  handleInput(data: string): void {
    if (this.childPicker) {
      this.childPicker.handleInput(data);
    } else {
      // Parent input handling
    }
  }

  render(width: number): string[] {
    if (this.childPicker) {
      return this.childPicker.render(width);
    }
    return this.renderSelf(width);
  }
}
```

---

## Multi-Screen State Machine

```typescript
interface ComponentState {
  screen: "list" | "detail" | "confirm";
  // ... other state
}

handleInput(data: string): void {
  switch (this.state.screen) {
    case "list":
      this.handleListInput(data);
      break;
    case "detail":
      this.handleDetailInput(data);
      break;
    case "confirm":
      this.handleConfirmInput(data);
      break;
  }
}

render(width: number): string[] {
  switch (this.state.screen) {
    case "list":
      return this.renderList(width);
    case "detail":
      return this.renderDetail(width);
    case "confirm":
      return this.renderConfirm(width);
  }
}
```

---

## Fuzzy Search

```typescript
function fuzzyMatch(query: string, text: string): boolean {
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  
  // Substring match
  if (lt.includes(lq)) return true;

  // Character sequence match
  let qi = 0;
  for (let i = 0; i < lt.length && qi < lq.length; i++) {
    if (lt[i] === lq[qi]) qi++;
  }
  return qi === lq.length;
}

function filterItems<T extends { name: string }>(items: T[], query: string): T[] {
  if (!query.trim()) return items;
  return items.filter((item) => fuzzyMatch(query, item.name));
}
```

---

## Cursor Clamping

```typescript
const VIEWPORT_HEIGHT = 12;

function clampCursor(state: ListState): void {
  if (state.filtered.length === 0) {
    state.cursor = 0;
    state.scrollOffset = 0;
    return;
  }

  state.cursor = Math.max(0, Math.min(state.cursor, state.filtered.length - 1));
  
  const maxOffset = Math.max(0, state.filtered.length - VIEWPORT_HEIGHT);
  state.scrollOffset = Math.max(0, Math.min(state.scrollOffset, maxOffset));

  // Keep cursor visible
  if (state.cursor < state.scrollOffset) {
    state.scrollOffset = state.cursor;
  } else if (state.cursor >= state.scrollOffset + VIEWPORT_HEIGHT) {
    state.scrollOffset = state.cursor - VIEWPORT_HEIGHT + 1;
  }
}
```

---

## Error Handling

```typescript
async function safeOperation(ctx: ExtensionCommandContext): Promise<void> {
  try {
    const result = await riskyOperation();
    ctx.ui.notify(`Success: ${result}`, "info");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.ui.notify(`Error: ${message}`, "error");
  }
}
```
