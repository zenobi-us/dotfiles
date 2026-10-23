import { stat } from "node:fs/promises";
import path from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi, type TuiMouseEvent, type TuiMouseEventResult } from "@earendil-works/pi-tui";
import type { SharedAgentContext } from "./model";
import { safeTerminalText } from "./terminal-text";

export interface ContextReadiness {
  routesConfigured: boolean;
  sharedDirectory: boolean;
}

export async function readContextReadiness(context: SharedAgentContext): Promise<ContextReadiness> {
  if (context.error) throw new Error(context.error);
  if (!context.candidateSharedRoot) throw new Error("Shared context requires a canonical Git origin.");
  return {
    routesConfigured: Boolean(context.routeSource),
    sharedDirectory: await isDirectory(context.candidateSharedRoot),
  };
}

interface OnboardingOptions {
  context: SharedAgentContext;
  readiness: ContextReadiness;
  theme: Theme;
  height: () => number;
  viewport?: () => { columns: number; rows: number };
  requestRender: () => void;
  run: (action: "setup" | "check") => Promise<ContextReadiness>;
  done: (ready: boolean) => void;
}

type ButtonBounds = { action: number; x: number; y: number; width: number };

export class ContextOnboarding {
  private focusedAction = 0;
  private busy = false;
  private disposed = false;
  private initialized = false;
  private message = "";
  private failed = false;
  private buttons: ButtonBounds[] = [];
  private screen?: { columns: number; rows: number; width: number; height: number };
  private mousePress?: { action: number; x: number; y: number };

  constructor(private options: OnboardingOptions) {}

  async handleInput(data: string): Promise<void> {
    if (this.busy || this.disposed) return;
    if (data.startsWith("\x1b[<")) {
      await this.handleSgrMouse(data);
      return;
    }
    this.mousePress = undefined;
    if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
      this.options.done(false);
    } else if (matchesKey(data, "tab") || matchesKey(data, "shift+tab") || matchesKey(data, "left") || matchesKey(data, "right")) {
      this.focusedAction = 1 - this.focusedAction;
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
    if (width < 4 || height < 7) return [truncateToWidth("Shared context: enlarge terminal", Math.max(1, width))];
    const inner = width - 2;
    const { theme, readiness } = this.options;
    const center = (text: string) => {
      const clipped = truncateToWidth(text, inner, "…");
      const gap = inner - visibleWidth(clipped);
      return " ".repeat(Math.floor(gap / 2)) + clipped + " ".repeat(Math.ceil(gap / 2));
    };
    const content = [theme.fg("accent", "Set up shared context")];
    if (height >= 10) content.push(theme.fg("muted", safeTerminalText(path.basename(this.options.context.repositoryRoot))));
    if (height >= 16) content.push("");
    content.push(
      `${readiness.routesConfigured ? "[ok]" : "[--]"} Context routes: ${readiness.routesConfigured ? "found" : "missing"}`,
      `${readiness.sharedDirectory ? "[ok]" : "[--]"} Shared dir: ${readiness.sharedDirectory ? "found" : "missing"}`,
    );
    const message = this.busy ? "Running setup…" : this.message || "Creates shared files; preserves existing files.";
    const messageRows = Math.max(0, height - 4 - content.length);
    content.push(...wrapTextWithAnsi(theme.fg(this.failed ? "error" : "muted", safeTerminalText(message)), inner).slice(0, messageRows));
    const labels = [this.busy ? "Working…" : this.initialized ? "Check again" : "Run setup", "Close"];
    const buttonText = labels.map((label, index) => ` ${this.focusedAction === index ? ">" : " "} ${label} `);
    const stacked = buttonText.reduce((total, text) => total + visibleWidth(text), 2) > inner;
    const actionRows = stacked ? 2 : 1;
    while (content.length + actionRows + 1 > height - 2 && content.length > 3) content.pop();
    const offset = Math.max(0, Math.floor((height - 2 - content.length - actionRows - 1) / 2));
    const actionY = offset + content.length + 1;
    const actionLines = stacked ? buttonText : [buttonText.join("  ")];
    for (let row = 0; row < actionLines.length; row++) {
      const indices = stacked ? [row] : [0, 1];
      let x = 1 + Math.max(0, Math.floor((inner - visibleWidth(actionLines[row]!)) / 2));
      const styled = indices.map(index => {
        const text = buttonText[index]!;
        this.buttons.push({ action: index, x, y: actionY + row, width: Math.min(inner, visibleWidth(text)) });
        x += visibleWidth(text) + 2;
        return theme.bg("selectedBg", theme.fg(this.busy ? "muted" : this.focusedAction === index ? "accent" : "text", text));
      }).join("  ");
      content.push(styled);
    }
    content.push(theme.fg("muted", "Tab focus · Enter run · Esc close"));
    const rows = Array.from({ length: height - 2 }, (_, row) => theme.fg("border", "│") + center(content[row - offset] ?? "") + theme.fg("border", "│"));
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

  private async activate(action: number): Promise<void> {
    if (this.busy || this.disposed) return;
    if (action === 1) {
      this.options.done(false);
      return;
    }
    this.busy = true;
    this.failed = false;
    this.options.requestRender();
    try {
      this.options.readiness = await this.options.run(this.initialized ? "check" : "setup");
      this.initialized = true;
      if (this.disposed) return;
      if (this.options.readiness.routesConfigured && this.options.readiness.sharedDirectory) {
        this.options.done(true);
        return;
      }
      this.message = this.options.readiness.routesConfigured
        ? "The shared directory is still missing. Check storage, then check again."
        : "Context routes are still missing. Check shared storage, then check again.";
    } catch (error) {
      this.failed = true;
      this.message = `Setup failed: ${error instanceof Error ? error.message : String(error)}`;
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
