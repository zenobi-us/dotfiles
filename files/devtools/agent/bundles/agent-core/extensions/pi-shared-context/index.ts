import { promises as fs } from "node:fs";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, wrapTextWithAnsi, type AutocompleteItem } from "@earendil-works/pi-tui";
import { buildSharedContextReport, initializeContextForCwd } from "../../skills/shared-context/scripts/shared-context/api";
import { resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";

type Entry = { name: string; path: string; directory: boolean };

async function readEntries(directory: string): Promise<Entry[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter(entry => entry.name !== ".git" && entry.name !== ".DS_Store" && !entry.isSymbolicLink())
    .map(entry => ({
      name: entry.name,
      path: path.join(directory, entry.name),
      directory: entry.isDirectory(),
    }))
    .sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
}

class ContextBrowser {
  private levels: string[];
  private cursors: number[] = [0];
  private offsets: number[] = [0];
  private entries: Entry[][] = [];
  private activeColumn = 0;
  private preview = "";
  private previewPath = "";
  private previewOffset = 0;

  constructor(
    root: string,
    private theme: Theme,
    private done: (result: void) => void,
    private requestRender: () => void,
  ) {
    this.levels = [root];
  }

  async load(): Promise<void> {
    this.entries = await Promise.all(this.levels.map(readEntries));
    await this.loadPreview();
    this.requestRender();
  }

  private async loadPreview(): Promise<void> {
    if (this.activeColumn >= this.levels.length) return;
    const column = this.activeColumn;
    const entry = this.entries[column]?.[this.cursors[column] ?? 0];
    if (!entry || entry.directory) {
      this.preview = "Select a file to preview it.";
      this.previewPath = "";
      this.previewOffset = 0;
      return;
    }
    this.previewPath = entry.path;
    this.previewOffset = 0;
    try {
      const stat = await fs.stat(entry.path);
      this.preview = stat.size > 100_000
        ? "File is larger than 100 KB. Preview is not available."
        : await fs.readFile(entry.path, "utf8");
    } catch (error) {
      this.preview = error instanceof Error ? error.message : String(error);
    }
  }

  async handleInput(data: string): Promise<void> {
    if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
      this.done();
      return;
    }
    if (matchesKey(data, "left")) {
      this.activeColumn = Math.max(0, this.activeColumn - 1);
      await this.loadPreview();
      this.requestRender();
      return;
    }
    if (matchesKey(data, "right")) {
      const entry = this.entries[this.activeColumn]?.[this.cursors[this.activeColumn] ?? 0];
      if (entry?.directory) await this.enter(entry);
      else if (entry) this.activeColumn = this.levels.length;
      await this.loadPreview();
      this.requestRender();
      return;
    }
    if ((matchesKey(data, "up") || matchesKey(data, "down")) && this.activeColumn >= this.levels.length) {
      const maxOffset = Math.max(0, this.preview.split(/\r?\n/).length - 16);
      this.previewOffset = Math.max(0, Math.min(maxOffset, this.previewOffset + (matchesKey(data, "up") ? -1 : 1)));
      this.requestRender();
      return;
    }
    if (matchesKey(data, "up") || matchesKey(data, "down")) {
      const list = this.entries[this.activeColumn] ?? [];
      const delta = matchesKey(data, "up") ? -1 : 1;
      this.cursors[this.activeColumn] = Math.max(0, Math.min(list.length - 1, (this.cursors[this.activeColumn] ?? 0) + delta));
      const cursor = this.cursors[this.activeColumn];
      if (cursor < this.offsets[this.activeColumn]) this.offsets[this.activeColumn] = cursor;
      if (cursor >= this.offsets[this.activeColumn] + 16) this.offsets[this.activeColumn] = cursor - 15;
      this.levels = this.levels.slice(0, this.activeColumn + 1);
      this.entries = this.entries.slice(0, this.activeColumn + 1);
      this.cursors = this.cursors.slice(0, this.activeColumn + 1);
      this.offsets = this.offsets.slice(0, this.activeColumn + 1);
      await this.loadPreview();
      this.requestRender();
      return;
    }
    if (matchesKey(data, "backspace")) {
      if (this.activeColumn > 0) {
        this.levels = this.levels.slice(0, -1);
        this.entries = this.entries.slice(0, -1);
        this.cursors = this.cursors.slice(0, -1);
        this.offsets = this.offsets.slice(0, -1);
        this.activeColumn = this.levels.length - 1;
      }
      await this.loadPreview();
      this.requestRender();
      return;
    }
    if (matchesKey(data, "return")) {
      const entry = this.entries[this.activeColumn]?.[this.cursors[this.activeColumn] ?? 0];
      if (entry?.directory) await this.enter(entry);
      else await this.loadPreview();
      this.requestRender();
    }
  }

  private async enter(entry: Entry): Promise<void> {
    this.levels = [...this.levels.slice(0, this.activeColumn + 1), entry.path];
    this.cursors = [...this.cursors.slice(0, this.activeColumn + 1), 0];
    this.offsets = [...this.offsets.slice(0, this.activeColumn + 1), 0];
    this.entries = await Promise.all(this.levels.map(readEntries));
    this.activeColumn = this.levels.length - 1;
  }

  render(width: number): string[] {
    const th = this.theme;
    const inner = Math.max(24, width - 4);
    const visibleLevels = this.levels.length;
    const previewWidth = Math.max(24, Math.floor(inner * 0.38));
    const paneWidth = Math.max(14, Math.floor((inner - previewWidth - visibleLevels) / visibleLevels));
    const paneCount = visibleLevels + 1;
    const bodyHeight = 16;
    const lines: string[] = [];
    const clip = (text: string, size: number) => truncateToWidth(text, Math.max(1, size), "…", true);
    const border = th.fg("border", "│");
    const pathName = (value: string) => path.basename(value) || value;
    const header = ["Shared context", ...this.levels.map(pathName), "Preview"].join("  ›  ");
    lines.push(th.fg("accent", clip(header, inner)));
    lines.push(th.fg("border", "─".repeat(inner)));

    for (let rowIndex = 0; rowIndex < bodyHeight; rowIndex++) {
      const panes: string[] = [];
      for (let column = 0; column < visibleLevels; column++) {
        const itemIndex = rowIndex + (this.offsets[column] ?? 0);
        const item = this.entries[column]?.[itemIndex];
        const cursor = this.cursors[column] === itemIndex;
        const label = item ? `${item.directory ? "▸ " : "  "}${item.name}` : "";
        const styled = cursor && column === this.activeColumn
          ? th.bg("selectedBg", th.fg("text", clip(label, paneWidth)))
          : cursor ? th.fg("accent", clip(label, paneWidth)) : clip(label, paneWidth);
        panes.push(styled);
      }
      const previewLines = this.preview.split(/\r?\n/);
      const previewText = previewLines[rowIndex + this.previewOffset] ?? "";
      const active = this.activeColumn === visibleLevels;
      const previewStyled = active ? th.fg("accent", clip(previewText, previewWidth)) : clip(previewText, previewWidth);
      panes.push(previewStyled);
      lines.push(panes.map((pane, i) => clip(pane, i === paneCount - 1 ? previewWidth : paneWidth)).join(border));
    }

    lines.push(th.fg("border", "─".repeat(inner)));
    const selected = this.entries[this.activeColumn]?.[this.cursors[this.activeColumn] ?? 0];
    const status = selected?.path ?? (this.previewPath || this.levels[Math.min(this.activeColumn, this.levels.length - 1)]);
    lines.push(clip(`${status}  ·  ←→ browse  ↑↓ move/scroll  Enter open  Backspace parent  Esc close`, inner));
    return lines;
  }
}

class ReportModal {
  private offset = 0;

  constructor(
    private report: string,
    private theme: Theme,
    private done: (result: void) => void,
  ) {}

  handleInput(data: string): void {
    if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
      this.done();
    } else if (matchesKey(data, "up")) {
      this.offset = Math.max(0, this.offset - 1);
    } else if (matchesKey(data, "down")) {
      this.offset += 1;
    } else if (matchesKey(data, "pageUp")) {
      this.offset = Math.max(0, this.offset - 12);
    } else if (matchesKey(data, "pageDown")) {
      this.offset += 12;
    }
  }

  render(width: number): string[] {
    const inner = Math.max(20, width - 4);
    const lines = wrapTextWithAnsi(this.report, inner);
    const visible = lines.slice(this.offset, this.offset + 20);
    while (visible.length < 20) visible.push("");
    return [
      this.theme.fg("accent", truncateToWidth("Shared context report", inner, "…", true)),
      this.theme.fg("border", "─".repeat(inner)),
      ...visible.map(line => truncateToWidth(line, inner, "…", true)),
      this.theme.fg("border", "─".repeat(inner)),
      this.theme.fg("dim", truncateToWidth("↑↓ scroll  PgUp/PgDn page  Esc close", inner, "…", true)),
    ];
  }
}

export default function sharedContextBrowser(pi: ExtensionAPI): void {
  const exec = async (cwd: string, command: string, args: string[]) => {
    const result = await pi.exec(command, args, { cwd });
    return { stdout: result.stdout, code: result.code };
  };

  pi.registerCommand("shared-context", {
    description: "Browse and manage shared context for the current project",
    getArgumentCompletions: (prefix): AutocompleteItem[] | null => {
      const subcommands: AutocompleteItem[] = [
        { value: "report", label: "report", description: "Show resolved context roots and routes" },
        { value: "init", label: "init", description: "Create shared context storage for this repository" },
      ];
      if (!prefix.includes(" ")) return subcommands.filter(item => item.value.startsWith(prefix));
      if (prefix.startsWith("init ")) {
        const optionPrefix = prefix.slice("init ".length);
        if (optionPrefix.startsWith("--preset ")) {
          const valuePrefix = optionPrefix.slice("--preset ".length);
          return [{ value: "hosted-shared", label: "hosted-shared", description: "Use hosted tickets with shared engineering records" }]
            .filter(item => item.value.startsWith(valuePrefix));
        }
        if ("--preset".startsWith(optionPrefix)) {
          return [{ value: "--preset", label: "--preset", description: "Select an initialization preset" }];
        }
      }
      return null;
    },
    handler: async (args, ctx) => {
      const [subcommand = "", ...subcommandArgs] = args.trim().split(/\s+/).filter(Boolean);
      try {
        if (subcommand === "report") {
          const report = await buildSharedContextReport((command, argv) => exec(ctx.cwd, command, argv), ctx.cwd);
          if (!report) {
            ctx.ui.notify("No git repository with an origin remote found.", "warning");
            return;
          }
          await ctx.ui.custom<void>((_tui, theme, _keybindings, done) => {
            const modal = new ReportModal(report, theme, done);
            return { render: (width: number) => modal.render(width), handleInput: (data: string) => modal.handleInput(data), invalidate: () => {} };
          }, { overlay: true, overlayOptions: { anchor: "center", width: "80%", maxHeight: "80%" } });
          return;
        }
        if (subcommand === "init") {
          let preset: string | undefined;
          if (subcommandArgs.length > 0) {
            if (subcommandArgs.length !== 2 || subcommandArgs[0] !== "--preset") {
              ctx.ui.notify("Usage: /shared-context init [--preset hosted-shared]", "warning");
              return;
            }
            preset = subcommandArgs[1];
          }
          const result = await initializeContextForCwd((command, argv) => exec(ctx.cwd, command, argv), ctx.cwd, preset);
          ctx.ui.notify(`${result.created ? `Created ${result.agents}` : `${result.agents} already exists`}. Shared storage activates on the next session.${result.hostedShared ? " Preset: Hosted tickets with shared engineering records." : ""}`, "info");
          return;
        }
        if (subcommand) {
          ctx.ui.notify("Usage: /shared-context [report|init]", "warning");
          return;
        }
        const context = await resolveSharedContext((command, argv) => exec(ctx.cwd, command, argv), ctx.cwd);
        if (!context) {
          ctx.ui.notify("Could not resolve shared context for this project.", "warning");
          return;
        }
        await ctx.ui.custom<void>((tui, theme, _keybindings, done) => {
          const component = new ContextBrowser(context.root, theme, done, () => tui.requestRender());
          void component.load();
          return {
            render: (width: number) => component.render(width),
            handleInput: (data: string) => { void component.handleInput(data); },
            invalidate: () => {},
          };
        }, {
          overlay: true,
          overlayOptions: { anchor: "center", width: "90%", maxHeight: "80%" },
        });
      } catch (error) {
        ctx.ui.notify(`Could not open shared context: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    },
  });
}
