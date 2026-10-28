import path from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { Input, fuzzyMatch, matchesKey, stripTerminalSequences, truncateToWidth, visibleWidth, type TuiMouseEvent, type TuiMouseEventResult } from "@earendil-works/pi-tui";
import type { SharedAgentContext } from "./model";
import { safeTerminalText } from "./terminal-text";

type Tab = "tracker" | "files";
interface TabContent {
  render(width: number): string[];
  handleInput(data: string): void | Promise<void>;
  moveFocus?(reverse: boolean): boolean;
  enterFocus?(reverse: boolean): void;
  setActive?(active: boolean): void;
  handleMouse?(event: TuiMouseEvent): TuiMouseEventResult | undefined;
}
export interface ProjectEntry {
  id: string;
  name: string;
  identity: string;
  resolve(): Promise<SharedAgentContext>;
  checkout: boolean;
}
export interface ProjectWorkspace {
  context: SharedAgentContext;
  tracker: TabContent;
  files: TabContent;
  activate(): Promise<void>;
  suspend(): void;
  dispose(): void;
}
export interface ProjectOptions {
  current: ProjectEntry;
  list(): Promise<ProjectEntry[]>;
  create(context: SharedAgentContext, checkout: boolean): ProjectWorkspace;
  selected(context: SharedAgentContext): void;
  close(): void;
  height(): number;
}

export class SharedContextModal {
  private active: Tab;
  private highlighted?: Tab | "projects" | "project";
  private projects = false;
  private entries: ProjectEntry[] = [];
  private filteredEntries: ProjectEntry[] = [];
  private projectFilter = new Input();
  private projectIndex = 0;
  private projectOffset = 0;
  private message = "";
  private busy = false;
  private disposed = false;
  private workspaces = new Map<string, { workspace: ProjectWorkspace; tab: Tab }>();
  private currentId: string;
  private currentWorkspace?: ProjectWorkspace;
  private projectName?: string;
  private projectHit = { x: 0, width: 0 };

  constructor(
    private context: SharedAgentContext,
    private theme: Theme,
    private tracker: TabContent,
    private files: TabContent,
    private requestRender: () => void,
    initialTab: Tab = "tracker",
    private options?: ProjectOptions,
  ) {
    this.active = initialTab;
    this.currentId = options?.current.id ?? context.canonicalOrigin;
    this.projectName = options?.current.name;
  }

  attach(workspace: ProjectWorkspace): void {
    this.currentWorkspace = workspace;
    this.workspaces.set(this.currentId, { workspace, tab: this.active });
  }

  showFiles(): void {
    this.active = "files";
    this.projects = false;
    this.highlighted = undefined;
    this.requestRender();
  }

  async showProjects(): Promise<void> {
    if (!this.options || this.disposed || this.busy) return;
    this.projects = true;
    this.highlighted = undefined;
    this.projectFilter.setValue("");
    this.projectOffset = 0;
    this.busy = true;
    this.message = "Loading projects…";
    this.requestRender();
    try {
      const entries = await this.options.list();
      if (this.disposed) return;
      const unique = new Map([[this.options.current.id, this.options.current]]);
      for (const entry of entries) if (!unique.has(entry.id)) unique.set(entry.id, entry);
      this.entries = [...unique.values()];
      this.message = entries.length ? "" : "No stored projects. The current project is available.";
    } catch (error) {
      this.entries = [this.options.current];
      this.message = `Project list unreadable: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      this.filterProjects(this.currentId);
      this.busy = false;
      if (!this.disposed) this.requestRender();
    }
  }

  private filterProjects(selectedId = this.filteredEntries[this.projectIndex]?.id ?? this.currentId): void {
    const query = this.projectFilter.getValue();
    this.filteredEntries = query
      ? this.entries.filter(entry => fuzzyMatch(query, entry.name).matches || fuzzyMatch(query, entry.identity).matches)
      : this.entries;
    this.projectIndex = Math.max(0, this.filteredEntries.findIndex(entry => entry.id === selectedId));
    this.projectOffset = 0;
  }

  private async selectProject(): Promise<void> {
    const entry = this.filteredEntries[this.projectIndex];
    if (!entry || !this.options || this.busy || this.disposed) return;
    this.busy = true;
    this.message = "Resolving project routes…";
    this.requestRender();
    try {
      const context = await entry.resolve();
      if (context.error) throw new Error(context.error);
      context.checkoutAvailable ??= entry.checkout;
      if (this.disposed) return;
      const previous = this.workspaces.get(this.currentId);
      if (previous) previous.tab = this.active;
      this.currentWorkspace?.suspend();
      let saved = this.workspaces.get(entry.id);
      if (!saved) {
        saved = { workspace: this.options.create(context, entry.checkout), tab: "tracker" };
        this.workspaces.set(entry.id, saved);
      } else {
        Object.assign(saved.workspace.context, context);
      }
      this.currentId = entry.id;
      this.projectName = entry.name;
      this.currentWorkspace = saved.workspace;
      this.context = saved.workspace.context;
      this.tracker = saved.workspace.tracker;
      this.files = saved.workspace.files;
      this.active = saved.tab;
      this.options.selected(this.context);
      await saved.workspace.activate();
      if (this.disposed) return;
      this.projects = false;
      this.message = "";
    } catch (error) {
      this.message = `Project unavailable: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      this.busy = false;
      if (!this.disposed) this.requestRender();
    }
  }

  dispose(): void {
    this.disposed = true;
    for (const { workspace } of this.workspaces.values()) workspace.dispose();
  }

  handleMouse(event: TuiMouseEvent): TuiMouseEventResult | undefined {
    if (event.button !== "left" || event.type !== "click") return;
    if (event.y === 1 && event.x >= 2 && event.x < 12) {
      void this.showProjects();
      return { handled: true };
    }
    if (!this.projects && this.active === "tracker") {
      if (event.y === 1 && event.x >= this.projectHit.x && event.x < this.projectHit.x + this.projectHit.width) {
        void this.tracker.handleInput("h");
        this.highlighted = undefined;
        this.requestRender();
        return { handled: true };
      }
      const result = this.tracker.handleMouse?.({ ...event, y: event.y - 3 });
      if (result?.handled) {
        this.highlighted = undefined;
        this.requestRender();
      }
      return result;
    }
  }

  async handleInput(data: string): Promise<void> {
    if (this.disposed) return;
    if (this.busy) {
      if (matchesKey(data, "ctrl+c")) this.options?.close();
      return;
    }
    if (matchesKey(data, "ctrl+c")) {
      if (this.options) this.options.close();
      else await this.tracker.handleInput(data);
    } else if (matchesKey(data, "tab") || matchesKey(data, "shift+tab")) {
      const reverse = matchesKey(data, "shift+tab");
      if (!this.projects && this.highlighted === undefined && this.active === "tracker" && this.tracker.moveFocus?.(reverse)) {
        this.requestRender();
        return;
      }
      const controls: (Tab | "projects" | "project" | undefined)[] = this.options ? [undefined, "tracker", "files", "projects", "project"] : [undefined, "tracker", "files"];
      const index = controls.indexOf(this.highlighted);
      this.highlighted = controls[(index + (matchesKey(data, "tab") ? 1 : controls.length - 1)) % controls.length];
      if (this.highlighted === undefined && !this.projects && this.active === "tracker") this.tracker.enterFocus?.(reverse);
    } else if (this.highlighted !== undefined && (matchesKey(data, "enter") || data === " ")) {
      if (this.highlighted === "projects") await this.showProjects();
      else if (this.highlighted === "project") { await this.tracker.handleInput("h"); this.active = "tracker"; this.projects = false; this.highlighted = undefined; }
      else { this.active = this.highlighted; this.projects = false; this.highlighted = undefined; }
    } else if (this.projects) {
      if (matchesKey(data, "escape")) this.options?.close();
      else if (matchesKey(data, "up")) this.projectIndex = Math.max(0, this.projectIndex - 1);
      else if (matchesKey(data, "down")) this.projectIndex = Math.max(0, Math.min(this.filteredEntries.length - 1, this.projectIndex + 1));
      else if (matchesKey(data, "enter")) await this.selectProject();
      else if (this.highlighted === undefined) {
        const query = this.projectFilter.getValue();
        this.projectFilter.handleInput(data);
        if (query !== this.projectFilter.getValue()) this.filterProjects();
      }
    } else if (matchesKey(data, "1") || matchesKey(data, "2")) {
      this.active = matchesKey(data, "1") ? "tracker" : "files";
      this.projects = false;
      this.highlighted = undefined;
    } else if (this.highlighted !== undefined && matchesKey(data, "escape")) {
      this.highlighted = undefined;
    } else if (this.highlighted === undefined) {
      await (this.active === "tracker" ? this.tracker : this.files).handleInput(data);
    }
    this.requestRender();
  }

  render(width: number): string[] {
    const inner = Math.max(1, width - 2);
    const row = (value: string) => {
      const clipped = truncateToWidth(value, inner, "…");
      return this.theme.fg("border", "│") + clipped + " ".repeat(Math.max(0, inner - visibleWidth(clipped))) + this.theme.fg("border", "│");
    };
    const storage = this.context.routes?.alignment.store === "shared" ? "Shared" : "Repo";
    const breadcrumb = this.highlighted === "projects" ? ">Projects<" : "Projects";
    const project = safeTerminalText(this.projectName ?? path.basename(this.context.repositoryRoot));
    const prefix = `${breadcrumb} · ${storage} > `;
    const title = safeTerminalText(prefix) + (this.highlighted === "project" ? `>${project}<` : project);
    this.projectHit = { x: 2 + visibleWidth(prefix), width: visibleWidth(project) };
    this.tracker.setActive?.(!this.projects && this.active === "tracker" && this.highlighted === undefined);
    const tabs = (["tracker", "files"] as const).map((tab, index) => {
      const label = `${index + 1} ${tab === "tracker" ? "Tracker" : "Files"}`;
      const labelWithState = tab === this.active && !this.projects ? `[${label}]` : ` ${label} `;
      return this.theme.fg(tab === this.active || tab === this.highlighted ? "accent" : "muted", this.highlighted === tab ? `>${labelWithState}<` : ` ${labelWithState} `);
    }).join("  ");
    let content: string[];
    if (this.projects) {
      const count = Math.max(1, Math.floor(((this.options?.height() ?? 20) - 8) / 2));
      this.projectOffset = Math.max(0, Math.min(this.projectOffset, this.projectIndex, this.filteredEntries.length - count));
      if (this.projectIndex >= this.projectOffset + count) this.projectOffset = this.projectIndex - count + 1;
      const query = this.projectFilter.getValue();
      content = [
        row(this.theme.fg("accent", ` Projects (${this.filteredEntries.length}/${this.entries.length}) · ↑↓ select · Enter open · Esc close`)),
        row(this.theme.fg("muted", query ? safeTerminalText(` Filter: ${query}`) : " Type to filter names and identities")),
      ];
      if (!this.filteredEntries.length && !this.busy) content.push(row(this.theme.fg("muted", " No projects match. Edit the filter or use Ctrl+U to clear.")));
      for (const [offset, entry] of this.filteredEntries.slice(this.projectOffset, this.projectOffset + count).entries()) {
        const selected = this.projectOffset + offset === this.projectIndex;
        const label = safeTerminalText(` ${selected ? ">" : " "} ${entry.name}${entry.id === this.options?.current.id ? " (current)" : ""}`);
        content.push(row(selected ? this.theme.bg("selectedBg", this.theme.fg("text", label)) : this.theme.fg("text", label)));
        content.push(row(this.theme.fg("muted", safeTerminalText(`   ${entry.identity}`))));
      }
      if (this.message) content.push(row(this.theme.fg("warning", safeTerminalText(this.message))));
      content.push(this.theme.fg("border", `╰${"─".repeat(inner)}╯`));
    } else {
      content = (this.active === "tracker" ? this.tracker : this.files).render(width);
      if (content[0] && stripTerminalSequences(content[0]).startsWith("╭")) content[0] = this.theme.fg("border", `├${"─".repeat(inner)}┤`);
    }
    return [
      this.theme.fg("border", `╭${"─".repeat(inner)}╮`),
      row(this.theme.fg("accent", ` ${title}`)),
      row(` ${tabs}  ${this.theme.fg("muted", "Tab focus · Space/Enter activate")}`),
      ...content,
    ].map(line => truncateToWidth(line, width));
  }
}
