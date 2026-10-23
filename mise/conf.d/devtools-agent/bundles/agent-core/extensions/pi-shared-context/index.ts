import { promises as fs, type Dirent } from "node:fs";
import path from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi, type AutocompleteItem } from "@earendil-works/pi-tui";
import { buildSharedContextReport, initializeContextForCwd } from "../../skills/shared-context/scripts/shared-context/api";
import { renderSharedContext, resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";
import { GraphExplorer } from "./explorer";
import type { ExplorerNavigation, ExplorerResult } from "./explorer";
import { buildSessionPrompt, launchExplorerSession } from "./actions";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./data";
import type { Exec, ExplorerSessionRequest, SharedAgentContext } from "./model";
import { safeTerminalText } from "./terminal-text";
import { SharedContextModal } from "./modal";
import { ContextOnboarding, readContextReadiness } from "./onboarding";

type Entry = { name: string; path: string; directory: boolean };
type AlignmentSkill = { name: string; description: string; location: string };

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function parseSkillMetadata(content: string, fallbackName: string): { name: string; description: string } {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? "";
  const name = frontmatter.match(/^name:\s*["']?([^\r\n"']+)["']?\s*$/m)?.[1]?.trim() || fallbackName;
  const descriptionStart = frontmatter.match(/^description:\s*(.*)$/m);
  let description = "";
  if (descriptionStart) {
    const after = frontmatter.slice((descriptionStart.index ?? 0) + descriptionStart[0].length);
    if (["|", ">", "|-", ">-", "|+", ">+"].includes(descriptionStart[1].trim())) {
      description = after.split("\n").filter(line => /^\s+/.test(line)).map(line => line.trim()).join(" ");
    } else {
      description = descriptionStart[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  return { name, description };
}

async function readAlignmentSkills(root: string): Promise<AlignmentSkill[]> {
  const skillsRoot = path.join(root, "skills");
  const results: AlignmentSkill[] = [];
  const visit = async (directory: string): Promise<void> => {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.isSymbolicLink()) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else if (entry.isFile() && entry.name === "SKILL.md") {
        const content = await fs.readFile(fullPath, "utf8");
        const fallbackName = path.basename(path.dirname(fullPath));
        const metadata = parseSkillMetadata(content, fallbackName);
        results.push({ ...metadata, location: fullPath });
      }
    }
  };
  await visit(skillsRoot);
  return results;
}

async function readPromptFile(file: string): Promise<string | undefined> {
  try {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.size > 100_000) return;
    const content = (await fs.readFile(file, "utf8")).trim();
    return content || undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

function renderAlignmentSkill(skill: AlignmentSkill): string {
  return [
    "  <skill>",
    `    <name>${escapeXml(skill.name)}</name>`,
    `    <description>${escapeXml(skill.description)}</description>`,
    `    <location>${escapeXml(skill.location)}</location>`,
    "  </skill>",
  ].join("\n");
}

function mergeAlignmentSkills(systemPrompt: string, skills: AlignmentSkill[]): string {
  if (skills.length === 0) return systemPrompt;

  const blockPattern = /<skills>\s*<available_skills>([\s\S]*?)<\/available_skills>\s*<\/skills>/;
  const match = blockPattern.exec(systemPrompt);
  if (!match) {
    const entries = skills.map(renderAlignmentSkill).join("\n");
    return `${systemPrompt}\n\n<skills>\n<available_skills>\n${entries}\n</available_skills>\n</skills>`;
  }

  const existingLocations = new Set(
    [...match[1].matchAll(/<location>([\s\S]*?)<\/location>/g)].map(location => location[1]),
  );
  const additions = skills
    .filter(skill => !existingLocations.has(escapeXml(skill.location)))
    .map(renderAlignmentSkill);
  if (additions.length === 0) return systemPrompt;

  return systemPrompt.replace(blockPattern, (_whole, contents: string) =>
    `<skills>\n<available_skills>${contents}${contents.trim() ? "\n" : ""}${additions.join("\n")}\n</available_skills>\n</skills>`,
  );
}

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
  private pathFormat = 0;

  constructor(
    root: string,
    private theme: Theme,
    private done: (result: void) => void,
    private requestRender: () => void,
    private cwd: string,
    private exec: (command: string, args: string[]) => Promise<{ stdout: string; code: number }>,
    private insertText: (text: string) => void,
    private height: () => number,
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
    if (matchesKey(data, "y")) {
      await this.insertSelectedPath();
      return;
    }
    if (matchesKey(data, "f")) {
      this.pathFormat = (this.pathFormat + 1) % 4;
      this.requestRender();
      return;
    }
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
      const bodyHeight = Math.max(1, Math.min(16, this.height() - 8));
      const maxOffset = Math.max(0, this.preview.split(/\r?\n/).length - bodyHeight);
      this.previewOffset = Math.max(0, Math.min(maxOffset, this.previewOffset + (matchesKey(data, "up") ? -1 : 1)));
      this.requestRender();
      return;
    }
    if (matchesKey(data, "up") || matchesKey(data, "down")) {
      const list = this.entries[this.activeColumn] ?? [];
      const delta = matchesKey(data, "up") ? -1 : 1;
      this.cursors[this.activeColumn] = Math.max(0, Math.min(list.length - 1, (this.cursors[this.activeColumn] ?? 0) + delta));
      const cursor = this.cursors[this.activeColumn];
      const bodyHeight = Math.max(1, Math.min(16, this.height() - 8));
      if (cursor < this.offsets[this.activeColumn]) this.offsets[this.activeColumn] = cursor;
      if (cursor >= this.offsets[this.activeColumn] + bodyHeight) this.offsets[this.activeColumn] = cursor - bodyHeight + 1;
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

  private async insertSelectedPath(): Promise<void> {
    const selected = this.entries[this.activeColumn]?.[this.cursors[this.activeColumn] ?? 0];
    const absolute = selected?.path ?? (this.previewPath || this.levels[Math.min(this.activeColumn, this.levels.length - 1)]);
    let value = absolute;
    if (this.pathFormat === 0) value = `shared://${path.relative(this.levels[0], absolute).split(path.sep).join("/")}`;
    else if (this.pathFormat === 2) value = path.basename(absolute);
    else if (this.pathFormat === 3) {
      const rootResult = await this.exec("git", ["-C", this.cwd, "rev-parse", "--show-toplevel"]);
      const gitRoot = rootResult.code === 0 ? rootResult.stdout.trim() : this.cwd;
      const remoteResult = await this.exec("git", ["-C", gitRoot, "remote", "get-url", "origin"]);
      const remote = remoteResult.code === 0 ? remoteResult.stdout.trim() : "";
      const webRemote = remote.replace(/^(?:[^@/]+@)?([^/:]+):(.+)$/, "https://$1/$2").replace(/^ssh:\/\//, "https://").replace(/\.git$/i, "");
      const remotePath = path.relative(gitRoot, absolute).split(path.sep).join("/");
      if (!remote || remotePath.startsWith("../")) return;
      value = `${webRemote}/blob/HEAD/${remotePath}`;
    }
    this.insertText(value);
    this.done();
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
    const boxWidth = Math.max(4, width);
    const inner = boxWidth - 2;
    const visibleLevels = this.levels.length;
    const previewWidth = Math.max(12, Math.floor(inner * 0.38));
    const paneWidth = Math.max(8, Math.floor((inner - previewWidth - visibleLevels) / visibleLevels));
    const row = (content: string) => {
      const clipped = truncateToWidth(content, inner, "…", true);
      return th.fg("border", "│") + clipped + " ".repeat(Math.max(0, inner - visibleWidth(clipped))) + th.fg("border", "│");
    };
    const paneCount = visibleLevels + 1;
    const bodyHeight = Math.max(1, Math.min(16, this.height() - 8));
    const lines: string[] = [];
    const clip = (text: string, size: number) => truncateToWidth(text, Math.max(1, size), "…", true);
    const border = th.fg("border", "│");
    const pathName = (value: string) => path.basename(value) || value;
    const header = ["Shared context", ...this.levels.map(pathName), "Preview"].join("  ›  ");
    lines.push(th.fg("border", `╭${"─".repeat(inner)}╮`));
    lines.push(row(th.fg("accent", ` ${header}`)));
    lines.push(th.fg("border", `├${"─".repeat(inner)}┤`));

    for (let rowIndex = 0; rowIndex < bodyHeight; rowIndex++) {
      const panes: string[] = [];
      for (let column = 0; column < visibleLevels; column++) {
        const itemIndex = rowIndex + (this.offsets[column] ?? 0);
        const item = this.entries[column]?.[itemIndex];
        const cursor = this.cursors[column] === itemIndex;
        const label = item ? `${item.directory ? "▸ " : "  "}${item.name}` : "";
        let styled = clip(label, paneWidth);
        if (cursor && column === this.activeColumn) styled = th.bg("selectedBg", th.fg("text", styled));
        else if (cursor) styled = th.fg("accent", styled);
        panes.push(styled);
      }
      const previewLines = this.preview.split(/\r?\n/);
      const previewText = previewLines[rowIndex + this.previewOffset] ?? "";
      const active = this.activeColumn === visibleLevels;
      const previewStyled = active ? th.fg("accent", clip(previewText, previewWidth)) : clip(previewText, previewWidth);
      panes.push(previewStyled);
      const content = panes.map((pane, i) => clip(pane, i === paneCount - 1 ? previewWidth : paneWidth)).join(border);
      lines.push(row(content));
    }

    lines.push(th.fg("border", `├${"─".repeat(inner)}┤`));
    const selected = this.entries[this.activeColumn]?.[this.cursors[this.activeColumn] ?? 0];
    const status = selected?.path ?? (this.previewPath || this.levels[Math.min(this.activeColumn, this.levels.length - 1)]);
    lines.push(row(clip(` ${status}`, inner)));
    const navigation = " ←→ browse  ↑↓ move  Enter open  Backspace parent";
    const actions = `y insert  f format: ${["shared://", "absolute", "filename", "remote URL"][this.pathFormat]}  Esc close`;
    const gap = " ".repeat(Math.max(1, inner - visibleWidth(navigation) - visibleWidth(actions)));
    lines.push(row(`${navigation}${gap}${actions}`));
    lines.push(th.fg("border", `╰${"─".repeat(inner)}╯`));
    return lines;
  }
}

async function openGraphContext(pi: ExtensionAPI, ctx: ExtensionCommandContext, context: SharedAgentContext, exec: Exec, initialTab: "tracker" | "files" = "tracker"): Promise<void> {
  let navigation: ExplorerNavigation | undefined;
  while (true) {
    const result = await ctx.ui.custom<ExplorerResult>((tui, theme, _keybindings, done) => {
      const height = () => Math.max(5, Math.floor(tui.terminal.rows * 0.9) - 3);
      let modal: SharedContextModal;
      const component = new GraphExplorer({
        context, exec, theme, navigation,
        done: result => {
          if (result?.kind === "files") modal.showFiles();
          else done(result);
        },
        requestRender: () => tui.requestRender(),
        height,
        commands: () => pi.getCommands(),
      });
      const files = new ContextBrowser(context.root, theme, () => done(undefined), () => tui.requestRender(), ctx.cwd, exec, text => ctx.ui.pasteToEditor(text), height);
      modal = new SharedContextModal(context, theme, component, files, () => tui.requestRender(), initialTab);
      void component.load();
      void files.load().catch(error => {
        ctx.ui.notify(safeTerminalText(`Could not browse shared files: ${error instanceof Error ? error.message : String(error)}`), "error");
      });
      return {
        render: (width: number) => modal.render(width),
        handleInput: (data: string) => { void modal.handleInput(data); },
        invalidate: () => {},
        dispose: () => component.dispose(),
      };
    }, { overlay: true, overlayOptions: { anchor: "center", width: "95%", maxHeight: "95%" } });
    if (!result) return;
    navigation = result.navigation;
    if (result.kind === "files") continue;
    let request: ExplorerSessionRequest = result.request;
    const prompt = await ctx.ui.input(
      request.action === "ask-matt" ? "Ask Matt: what should this chat help with?" : "Additional prompt (optional)",
      "The next chat will receive the selected record and durable receipt references.",
    );
    if (prompt === undefined) continue;
    if (request.action === "ask-matt" && !prompt.trim()) {
      ctx.ui.notify("Add a prompt before opening an ask-matt chat.", "warning");
      continue;
    }
    request = { ...request, prompt: prompt.trim() };
    try {
      const snapshot = await loadExplorerSnapshot(context, exec);
      if (request.target.kind === "ticket") {
        const previous = request.target.ticket;
        const ticket = snapshot.tickets.find(ticket => ticket.id === previous.id && ticket.ref === previous.ref);
        if (!ticket) throw new Error("The selected ticket changed or disappeared. Reload the explorer.");
        request = { ...request, snapshot, target: { kind: "ticket", ticket }, workflow: await loadTicketWorkflow(context, ticket, exec) };
      } else {
        const previous = request.target.initiative;
        const initiative = snapshot.initiatives.find(initiative => initiative.id === previous.id && initiative.ref === previous.ref);
        if (!initiative) throw new Error("The selected initiative changed or disappeared. Reload the explorer.");
        request = { ...request, snapshot, target: { kind: "initiative", initiative } };
      }
      const confirmed = await ctx.ui.confirm(
        "Open a fresh chat?",
        safeTerminalText(`${buildSessionPrompt(request)}\n\nThe command will be placed in the NEW chat's editor. Press Enter there to run it. Saved sessions remain available in /resume.`, true),
      );
      if (!confirmed) continue;
      if (await launchExplorerSession(pi, ctx, request)) return;
      ctx.ui.notify("Chat creation was cancelled. The current session is unchanged.", "info");
    } catch (error) {
      ctx.ui.notify(safeTerminalText(`Could not prepare the next chat: ${error instanceof Error ? error.message : String(error)}`), "error");
    }
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
    return { stdout: result.code === 0 ? result.stdout : [result.stdout, result.stderr].filter(Boolean).join("\n"), code: result.code };
  };
  const openExplorer = async (ctx: ExtensionCommandContext, tab: "tracker" | "files" = "tracker"): Promise<void> => {
    if (ctx.mode !== "tui") {
      ctx.ui.notify("The shared-context explorer requires the interactive terminal.", "warning");
      return;
    }
    try {
      let context = await resolveSharedContext((command, argv) => exec(ctx.cwd, command, argv), ctx.cwd);
      if (!context) {
        ctx.ui.notify("Could not resolve shared context for this project.", "warning");
        return;
      }
      const run: Exec = (command, argv) => exec(ctx.cwd, command, argv);
      const readiness = await readContextReadiness(context);
      if (!readiness.routesConfigured || !readiness.storesReady) {
        const initialContext = context;
        const overlayOptions = { anchor: "center", width: "95%", maxHeight: "95%", fullscreen: true, mouseTracking: true } as const;
        const ready = await ctx.ui.custom<boolean>((tui, theme, _keybindings, done) => {
          return new ContextOnboarding({
            context: initialContext, readiness, theme,
            height: () => Math.max(1, Math.floor(tui.terminal.rows * 0.9)),
            viewport: () => ({ columns: tui.terminal.columns, rows: tui.terminal.rows }),
            requestRender: () => tui.requestRender(),
            done,
            run: async (action, store) => {
              try {
                if (action === "setup") {
                  await initializeContextForCwd(run, ctx.cwd, { store });
                  await refreshContext(ctx.cwd);
                }
                const resolved = await resolveSharedContext(run, ctx.cwd);
                if (!resolved) throw new Error("Could not resolve shared context after setup.");
                context = resolved;
                return await readContextReadiness(resolved);
              } catch (error) {
                ctx.ui.notify(safeTerminalText(`Could not set up shared context: ${error instanceof Error ? error.message : String(error)}`), "error");
                throw error;
              }
            },
          });
        }, { overlay: true, overlayOptions });
        if (!ready) return;
      }
      await openGraphContext(pi, ctx, context, run, tab);
    } catch (error) {
      ctx.ui.notify(safeTerminalText(`Could not open shared context: ${error instanceof Error ? error.message : String(error)}`), "error");
    }
  };
  let contextBlock: string | undefined;
  let alignmentBlock: string | undefined;
  let alignmentSkills: AlignmentSkill[] = [];

  async function refreshContext(cwd: string): Promise<void> {
    contextBlock = undefined;
    alignmentBlock = undefined;
    alignmentSkills = [];
    const context = await resolveSharedContext((command, args) => exec(cwd, command, args), cwd);
    if (!context) return;
    contextBlock = renderSharedContext(context);

    const agentsPath = context.source ?? path.join(context.alignmentRoot, "AGENTS.md");
    const [agents, sharedAppend, repositoryAppend, skills] = await Promise.all([
      readPromptFile(agentsPath),
      readPromptFile(path.join(context.sharedRoot, "APPEND_SYSTEM.md")),
      readPromptFile(path.join(context.repositoryRoot, "APPEND_SYSTEM.md")),
      readAlignmentSkills(context.alignmentRoot),
    ]);
    const additions: string[] = [];
    if (agents && context.source) {
      additions.push(`<project_instructions path="${escapeXml(agentsPath)}">\n${escapeXml(agents)}\n</project_instructions>`);
    }
    for (const contents of [sharedAppend, repositoryAppend]) {
      if (contents) additions.push(contents);
    }
    alignmentSkills = skills;
    if (additions.length > 0) alignmentBlock = additions.join("\n\n");
  }

  pi.on("session_start", async (_event, ctx) => {
    await refreshContext(ctx.cwd);
  });


  pi.on("before_agent_start", event => {
    const additions = [contextBlock, alignmentBlock].filter((block): block is string => Boolean(block));
    const systemPrompt = mergeAlignmentSkills(event.systemPrompt, alignmentSkills);
    if (additions.length === 0 && systemPrompt === event.systemPrompt) return;
    return { systemPrompt: [systemPrompt, ...additions].join("\n\n") };
  });

  pi.registerShortcut("ctrl+shift+g", {
    description: "Open shared-context Graph continuity explorer",
    handler: async ctx => {
      // omp creates a command context for shortcuts, although the API declares a base context.
      const commandContext = ctx as ExtensionCommandContext;
      await openExplorer(commandContext);
    },
  });

  pi.registerCommand("shared-context", {
    description: "Browse ready work, initiative dependency graphs, receipts, and shared files",
    getArgumentCompletions: (prefix): AutocompleteItem[] | null => {
      const subcommands: AutocompleteItem[] = [
        { value: "report", label: "report", description: "Show resolved context roots and routes" },
        { value: "init", label: "init", description: "Initialize repository or shared context with --store" },
        { value: "files", label: "files", description: "Browse raw shared-context files" },
      ];
      if (!prefix.includes(" ")) return subcommands.filter(item => item.value.startsWith(prefix));
      if (prefix.startsWith("init ")) {
        const optionPrefix = prefix.slice("init ".length);
        const valueMatch = /(?:^|\s)(--store|--preset) ([^\s]*)$/.exec(optionPrefix);
        if (valueMatch) {
          const choices = valueMatch[1] === "--store"
            ? [
              { value: "repository", label: "repository", description: "Keep context in this checkout" },
              { value: "shared", label: "shared", description: "Keep context in the shared store" },
            ]
            : [{ value: "hosted-shared", label: "hosted-shared", description: "Use hosted tickets with shared engineering records" }];
          return choices.filter(item => item.value.startsWith(valueMatch[2]!));
        }
        const flagPrefix = optionPrefix.split(/\s+/).at(-1) ?? "";
        return [
          { value: "--store", label: "--store", description: "Choose repository or shared storage" },
          { value: "--preset", label: "--preset", description: "Select an initialization preset" },
        ].filter(item => item.value.startsWith(flagPrefix));
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
          const usage = "Usage: /shared-context init --store repository|shared [--preset hosted-shared]";
          const flags = new Map<string, string>();
          for (let index = 0; index < subcommandArgs.length; index += 2) {
            const flag = subcommandArgs[index]!;
            const value = subcommandArgs[index + 1];
            if (!["--store", "--preset"].includes(flag) || !value || value.startsWith("--") || flags.has(flag)) {
              ctx.ui.notify(usage, "warning");
              return;
            }
            flags.set(flag, value);
          }
          const store = flags.get("--store");
          if (store !== "repository" && store !== "shared") {
            ctx.ui.notify(usage, "warning");
            return;
          }
          const result = await initializeContextForCwd((command, argv) => exec(ctx.cwd, command, argv), ctx.cwd, { store, preset: flags.get("--preset") });
          ctx.ui.notify(safeTerminalText(`${result.created ? `Created ${result.agents}` : `${result.agents} already exists`}. Context storage: ${result.store}. Reopen the session to refresh instructions.${result.hostedShared ? " Preset: Hosted tickets with shared engineering records." : ""}`), "info");
          return;
        }
        if (subcommand && subcommand !== "files") {
          ctx.ui.notify("Usage: /shared-context [files|report|init]", "warning");
          return;
        }
        await openExplorer(ctx, subcommand === "files" ? "files" : "tracker");
      } catch (error) {
        ctx.ui.notify(safeTerminalText(`Could not open shared context: ${error instanceof Error ? error.message : String(error)}`), "error");
      }
    },
  });
}
