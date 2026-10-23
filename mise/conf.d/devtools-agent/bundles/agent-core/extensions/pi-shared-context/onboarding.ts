import { stat } from "node:fs/promises";
import path from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi, type TuiMouseEvent, type TuiMouseEventResult } from "@earendil-works/pi-tui";
import type { RecordKind, Store } from "../../skills/shared-context/scripts/shared-context/lib";
import { ROUTE_MANIFEST_FILE } from "../../skills/shared-context/scripts/shared-context/lib";
import type { SharedAgentContext } from "./model";
import { safeTerminalText } from "./terminal-text";

export interface ContextReadiness {
  routesConfigured: boolean;
  storesReady: boolean;
  missingStores: string[];
}

export async function readContextReadiness(context: SharedAgentContext): Promise<ContextReadiness> {
  if (context.error) throw new Error(context.error);
  const stores = new Set<Store>();
  for (const kind of Object.keys(context.routes) as RecordKind[]) {
    if (kind === "tickets" && context.routes[kind].adapter !== "local-markdown") continue;
    let route = context.routes[kind];
    while (route.inherits) route = context.routes[route.inherits];
    if (route.store) stores.add(route.store);
  }
  const roots: string[] = [];
  if (stores.has("repository")) roots.push(context.repositoryRoot);
  if (stores.has("shared")) {
    if (!context.candidateSharedRoot) throw new Error("Shared routes require a canonical Git origin. Restore the origin and check again.");
    roots.push(context.candidateSharedRoot);
  }
  const missingStores: string[] = [];
  for (const root of roots) {
    if (!await isDirectory(root)) missingStores.push(root);
  }
  return { routesConfigured: Boolean(context.routeSource), storesReady: missingStores.length === 0, missingStores };
}

interface OnboardingOptions {
  context: SharedAgentContext;
  readiness: ContextReadiness;
  theme: Theme;
  height: () => number;
  viewport?: () => { columns: number; rows: number };
  requestRender: () => void;
  run: (action: "setup" | "check", store: Store) => Promise<ContextReadiness>;
  done: (ready: boolean) => void;
}

type ButtonBounds = { action: number; x: number; y: number; width: number };

export class ContextOnboarding {
  private focusedAction = 0;
  private busy = false;
  private disposed = false;
  private initialized = false;
  private selectedStore: Store;
  private detailOffset = 0;
  private message = "";
  private failed = false;
  private buttons: ButtonBounds[] = [];
  private screen?: { columns: number; rows: number; width: number; height: number };
  private mousePress?: { action: number; x: number; y: number };

  constructor(private options: OnboardingOptions) {
    this.selectedStore = options.context.storage;
    this.focusedAction = this.checkOnly ? 0 : this.selectedStore === "shared" ? 1 : 0;
  }

  private get checkOnly(): boolean {
    return this.initialized || this.options.readiness.routesConfigured;
  }

  async handleInput(data: string): Promise<void> {
    if (this.busy || this.disposed) return;
    if (data.startsWith("\x1b[<")) {
      await this.handleSgrMouse(data);
      return;
    }
    this.mousePress = undefined;
    if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
      this.close(false);
    } else if (matchesKey(data, "pageUp") || matchesKey(data, "pageDown")) {
      this.detailOffset = Math.max(0, this.detailOffset + (matchesKey(data, "pageUp") ? -1 : 1));
      this.options.requestRender();
    } else if (matchesKey(data, "tab") || matchesKey(data, "shift+tab") || matchesKey(data, "left") || matchesKey(data, "right") || matchesKey(data, "up") || matchesKey(data, "down")) {
      const count = this.checkOnly ? 2 : 4;
      const backwards = matchesKey(data, "shift+tab") || matchesKey(data, "left") || matchesKey(data, "up");
      this.focusedAction = (this.focusedAction + (backwards ? count - 1 : 1)) % count;
      this.options.requestRender();
    } else if (matchesKey(data, "enter") || data === " ") {
      await this.activate(this.focusedAction);
    }
  }

  handleMouse(event: TuiMouseEvent): TuiMouseEventResult | undefined {
    if (this.disposed || event.button !== "left" || (event.type !== "press" && event.type !== "click")) return;
    const button = this.findButton(event.x, event.y);
    if (!button) return;
    if (!this.busy) {
      this.focusedAction = button.action;
      if (event.type === "click") void this.activate(button.action);
      this.options.requestRender();
    }
    return { handled: true, focus: true };
  }

  render(width: number): string[] {
    this.buttons = [];
    const height = Math.max(1, Math.floor(this.options.height()));
    const viewport = this.options.viewport?.();
    if (this.screen?.columns !== viewport?.columns || this.screen?.rows !== viewport?.rows || this.screen?.width !== width || this.screen?.height !== height) {
      this.mousePress = undefined;
    }
    this.screen = viewport ? { ...viewport, width, height } : undefined;
    if (width < 4 || height < 9) return [truncateToWidth("Context: enlarge terminal", Math.max(1, width))];
    const inner = width - 2;
    const { theme, readiness, context } = this.options;
    const center = (text: string) => {
      const clipped = truncateToWidth(text, inner, "…");
      const gap = inner - visibleWidth(clipped);
      return " ".repeat(Math.floor(gap / 2)) + clipped + " ".repeat(Math.ceil(gap / 2));
    };
    const details = [this.checkOnly ? "Check context storage" : "Choose context storage"];
    if (this.checkOnly) {
      details.push(readiness.storesReady ? "Selected stores are available." : "Restore these stores, then check again:", ...readiness.missingStores);
      details.push("Checking does not create or migrate files.");
    } else {
      const target = this.selectedStore === "repository" ? context.repositoryRoot : context.candidateSharedRoot;
      details.push(`Target: ${target ?? "unavailable: configure a canonical Git origin"}`);
      details.push("Create missing files only:", ROUTE_MANIFEST_FILE, "AGENTS.md", "CONTEXT-MAP.md");
      if (this.selectedStore === "shared" && context.alignmentRoot !== context.candidateSharedRoot) {
        details.push("Copy if present: docs/agents/context-layout.toml", "docs/agents/issue-tracker.md");
      }
      details.push("Existing files stay unchanged.");
    }
    if (this.busy) details.unshift("Working…");
    if (this.message) details.unshift(this.message);
    const labels = this.checkOnly
      ? ["Check again", "Cancel"]
      : [`${this.selectedStore === "repository" ? "(*)" : "( )"} Repository`, `${this.selectedStore === "shared" ? "(*)" : "( )"} Shared store`, "Apply setup", "Cancel"];
    const buttonText = labels.map((label, index) => ` ${this.focusedAction === index ? ">" : " "} ${label} `);
    const stacked = buttonText.reduce((total, text) => total + visibleWidth(text), (labels.length - 1) * 2) > inner;
    const actionRows = stacked ? labels.length : 1;
    const detailRows = height - 3 - actionRows - 1;
    const wrapped = details.flatMap(text => wrapTextWithAnsi(safeTerminalText(text), inner));
    this.detailOffset = Math.min(this.detailOffset, Math.max(0, wrapped.length - detailRows));
    const content = wrapped.slice(this.detailOffset, this.detailOffset + detailRows).map(text => theme.fg(this.failed ? "error" : "text", text));
    while (content.length < detailRows) content.push("");
    const actionY = content.length + 1;
    const actionLines = stacked ? buttonText : [buttonText.join("  ")];
    for (let row = 0; row < actionLines.length; row++) {
      const indices = stacked ? [row] : labels.map((_, index) => index);
      let x = 1 + Math.max(0, Math.floor((inner - visibleWidth(actionLines[row]!)) / 2));
      const styled = indices.map(index => {
        const text = truncateToWidth(buttonText[index]!, inner, "…");
        this.buttons.push({ action: index, x, y: actionY + row, width: visibleWidth(text) });
        x += visibleWidth(text) + 2;
        return theme.bg("selectedBg", theme.fg(this.busy ? "muted" : this.focusedAction === index ? "accent" : "text", text));
      }).join("  ");
      content.push(styled);
    }
    content.push(theme.fg("muted", "Tab/↑↓ focus · Enter select · PgUp/PgDn details · Esc cancel"));
    const rows = Array.from({ length: height - 2 }, (_, row) => theme.fg("border", "│") + center(content[row] ?? "") + theme.fg("border", "│"));
    return [theme.fg("border", `╭${"─".repeat(inner)}╮`), ...rows, theme.fg("border", `╰${"─".repeat(inner)}╯`)];
  }

  invalidate(): void {
    this.buttons = [];
    this.mousePress = undefined;
  }

  dispose(): void {
    this.disposed = true;
    this.buttons = [];
    this.mousePress = undefined;
  }

  private findButton(x: number, y: number): ButtonBounds | undefined {
    return this.buttons.find(button => y === button.y && x >= button.x && x < button.x + button.width);
  }

  private async handleSgrMouse(data: string): Promise<void> {
    const match = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/.exec(data);
    const screen = this.screen;
    const viewport = this.options.viewport?.();
    if (!match || !screen || viewport?.columns !== screen.columns || viewport.rows !== screen.rows) {
      this.mousePress = undefined;
      return;
    }
    const code = Number(match[1]);
    const x = Number(match[2]) - 1;
    const y = Number(match[3]) - 1;
    const button = this.findButton(x - Math.floor((screen.columns - screen.width) / 2), y - Math.floor((screen.rows - screen.height) / 2));
    if (code === 0 && match[4] === "M") {
      this.mousePress = button ? { action: button.action, x, y } : undefined;
      if (button) {
        this.focusedAction = button.action;
        this.options.requestRender();
      }
      return;
    }
    const press = this.mousePress;
    this.mousePress = undefined;
    if (code === 0 && match[4] === "m" && press && button?.action === press.action && x === press.x && y === press.y) {
      await this.activate(button.action);
    }
  }

  private close(ready: boolean): void {
    this.dispose();
    this.options.done(ready);
  }

  private async activate(action: number): Promise<void> {
    if (this.busy || this.disposed) return;
    if (action === (this.checkOnly ? 1 : 3)) {
      this.close(false);
      return;
    }
    if (!this.checkOnly && action < 2) {
      this.selectedStore = action === 0 ? "repository" : "shared";
      this.detailOffset = 0;
      this.options.requestRender();
      return;
    }
    const operation = this.checkOnly ? "check" : "setup";
    this.busy = true;
    this.failed = false;
    this.detailOffset = 0;
    this.options.requestRender();
    try {
      const readiness = await this.options.run(operation, this.selectedStore);
      if (this.disposed) return;
      this.options.readiness = readiness;
      this.initialized = readiness.routesConfigured;
      this.focusedAction = this.checkOnly ? 0 : 2;
      if (readiness.routesConfigured && readiness.storesReady) {
        this.close(true);
        return;
      }
      this.message = readiness.routesConfigured
        ? "Restore the missing storage roots, then check again."
        : "Routes are not configured. Review the target and retry setup.";
    } catch (error) {
      if (this.disposed) return;
      this.failed = true;
      this.message = `${operation === "check" ? "Check" : "Setup"} failed: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      this.busy = false;
      if (!this.disposed) this.options.requestRender();
    }
  }
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    const info = await stat(target);
    if (info.isDirectory()) return true;
    throw new Error(`Expected a directory at ${target}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
