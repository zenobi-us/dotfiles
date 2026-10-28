import { join } from "node:path";
import { resolveContextRecord, resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi, type TuiMouseEvent, type TuiMouseEventResult } from "@earendil-works/pi-tui";
import { actionChoices } from "./actions";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./data";
import { isCompleted, recordKind, type Exec, type ExplorerActionChoice, type ExplorerInitiative, type ExplorerSessionRequest, type ExplorerSnapshot, type ExplorerTarget, type ExplorerTicket, type SharedAgentContext, type TicketWorkflow } from "./model";
import { safeTerminalText } from "./terminal-text";
import type { ExplorerEvent } from "./model";
import { DirectoryMonitor, type WatchTarget } from "./watch";

type Screen = "home" | "queues" | "initiatives" | "tickets" | "receipts" | "actions";
type Queue = "ready" | "review" | "blocked" | "all";
type Tone = "text" | "muted" | "accent" | "warning" | "error" | "success";
type Row = { text: string; tone?: Tone; selected?: boolean; target?: ExplorerTarget; receiptId?: string; fields?: { title: string; identity?: string; type?: string; state: string; count?: number; supporting?: string } };
type Pane = { id: string; title: string; rows: Row[] };

// The reader replaces content, not navigation. Keep its origin intact so returning
// cannot move the selected child, event, or an underlying pane's scroll position.
type DescriptionReader = { kind: "initiative" | "ticket"; ref: string; focus: ExplorerNavigation["focus"] };

export interface ExplorerNavigation {
  screen: Screen;
  initiativeId?: string;
  ticketId?: string;
  receiptId?: string;
  queue: Queue;
  focus: "list" | "detail" | "neighborhood" | "breadcrumb" | "description" | "return";
  offsets: [string, number][];
  homeIndex?: number;
  itemOrigin?: "initiatives" | "queues";
  queueIndex?: number;
  reader?: DescriptionReader;
}

export type ExplorerResult =
  | { kind: "files"; navigation: ExplorerNavigation }
  | { kind: "session"; request: ExplorerSessionRequest; navigation: ExplorerNavigation }
  | undefined;

interface ExplorerOptions {
  context: SharedAgentContext;
  exec: Exec;
  theme: Theme;
  done: (result: ExplorerResult) => void;
  requestRender: () => void;
  height: () => number;
  commands: () => readonly { name: string }[];
  navigation?: ExplorerNavigation;
  loadSnapshot?: typeof loadExplorerSnapshot;
  loadWorkflow?: typeof loadTicketWorkflow;
  live?: boolean;
  contextChanged?: (context: SharedAgentContext) => void;
  projects?: () => void;
  checkoutAvailable?: boolean;
  resolveContext?: () => Promise<SharedAgentContext>;
}

export class GraphExplorer {
  private snapshot?: ExplorerSnapshot;
  private tickets = new Map<string, ExplorerTicket>();
  private workflows = new Map<string, TicketWorkflow>();
  private scopes = new Map<string, string[]>();
  private ticketStates = new Map<string, string>();
  private screen: Screen;
  private returnScreen: Screen = "home";
  private queue: Queue;
  private initiativeId?: string;
  private ticketId?: string;
  private receiptId?: string;
  private homeIndex = 0;
  private actionIndex = 0;
  private queueIndex = 0;
  private itemOrigin: "initiatives" | "queues" = "initiatives";
  private childSelections = new Map<string, string>();
  private breadcrumbIndex = 0;
  private breadcrumbHits: { x: number; y: number; width: number; index: number }[] = [];
  private active = true;
  private reader?: DescriptionReader;
  private controlHits: { x: number; y: number; width: number; action: "description" | "return" | "up" | "down" }[] = [];
  private renderedSelection = new Map<string, string>();
  private renderedLayout = new Map<string, { width: number; height: number; start: number; end: number }>();
  private neighborhoodIndex = 0;
  private focus: ExplorerNavigation["focus"] = "list";
  private returnFocus: ExplorerNavigation["focus"] = "list";
  private offsets: Map<string, number>;
  private loading = false;
  private error = "";
  private notice = "";
  private disposed = false;
  private receiptChecks = 0;
  private lastWidth = 120;
  private monitor?: DirectoryMonitor;
  private liveTargets: WatchTarget[] = [];
  private scopeKey = "";
  private scopeRevision = 0;
  private focusedIds = new Set<string>();
  private pendingGraph = false;
  private pendingRoutes = false;
  private pendingAll = false;
  private pendingIds = new Set<string>();
  private refreshing?: Promise<void>;
  private refreshError = "";
  private graphError = "";
  private routeError = "";
  private sourceTimer?: NodeJS.Timeout;
  private remoteTimer?: NodeJS.Timeout;
  private pollingSource = false;

  constructor(private options: ExplorerOptions) {
    options.context.checkoutAvailable ??= options.checkoutAvailable ?? true;
    const navigation = options.navigation;
    this.screen = navigation?.screen ?? "home";
    this.queue = navigation?.queue ?? "ready";
    this.initiativeId = navigation?.initiativeId;
    this.ticketId = navigation?.ticketId;
    this.receiptId = navigation?.receiptId;
    this.focus = navigation?.focus ?? "list";
    this.offsets = new Map(navigation?.offsets ?? []);
    this.homeIndex = navigation?.homeIndex ?? 0;
    this.queueIndex = navigation?.queueIndex ?? 0;
    this.itemOrigin = navigation?.itemOrigin ?? "initiatives";
    this.reader = navigation?.reader;
  }

  async load(): Promise<void> {
    if (this.disposed) return;
    if (this.options.live && this.monitor) { await this.refresh(new Set(["routes"])); return; }
    if (this.options.live && !this.monitor) {
      try { await this.startWatching(); }
      catch (error) { this.stopWatching(); this.refreshFailed(error); }
    }
    this.pendingGraph = true;
    this.pendingAll = true;
    await this.drainRefresh();
  }

  private async refresh(keys: Set<string>): Promise<void> {
    if (keys.has("routes")) this.pendingRoutes = true;
    if (keys.has("graph")) this.pendingGraph = true;
    for (const key of keys) {
      if (key.startsWith("workflow:") && this.focusedIds.has(key.slice(9))) this.pendingIds.add(key.slice(9));
    }
    await this.drainRefresh();
  }

  private drainRefresh(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.refreshing) return this.refreshing;
    this.refreshing = this.readChanges().finally(() => {
      this.refreshing = undefined;
      if (!this.disposed && (this.pendingRoutes || this.pendingGraph || this.pendingAll || this.pendingIds.size)) void this.drainRefresh();
      if (!this.disposed) this.options.requestRender();
    });
    return this.refreshing;
  }

  private async readChanges(): Promise<void> {
    while (!this.disposed && (this.pendingRoutes || this.pendingGraph || this.pendingAll || this.pendingIds.size)) {
      const routes = this.pendingRoutes;
      let graph = this.pendingGraph;
      let all = this.pendingAll;
      const ids = this.pendingIds;
      this.pendingRoutes = false;
      this.pendingGraph = false;
      this.pendingAll = false;
      this.pendingIds = new Set();
      const initial = !this.snapshot;
      this.loading = initial;
      this.options.requestRender();
      try {
        if (routes) {
          const context = await (this.options.resolveContext?.() ?? resolveSharedContext(this.options.exec, this.options.context.repositoryRoot));
          if (!context || context.error) throw new Error(context?.error ?? "Repository context is unavailable.");
          if (this.disposed) return;
          Object.assign(this.options.context, context);
          this.options.contextChanged?.(this.options.context);
          this.scopeKey = "";
          await this.configureTargets();
          this.routeError = "";
          graph = true;
          all = true;
        }
        if (graph || !this.snapshot) {
          const snapshot = await (this.options.loadSnapshot ?? loadExplorerSnapshot)(this.options.context, this.options.exec);
          if (this.disposed) return;
          const selected = this.target();
          const previousChildIndex = Math.max(0, this.initiative()?.ticketIds.indexOf(this.ticketId ?? "") ?? 0);
          for (const [id] of this.workflows) {
            const before = this.tickets.get(id);
            const after = snapshot.tickets.find(ticket => ticket.id === id);
            if (!after || before?.ref !== after.ref || before?.backend !== after.backend || recordKind(after) !== "ticket") this.workflows.delete(id);
          }
          this.snapshot = snapshot;
          this.tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
          this.scopes.clear();
          for (const initiative of snapshot.initiatives) {
            const ids = initiative.ticketIds.filter(id => this.tickets.has(id));
            this.scopes.set(initiative.id, ids);
          }
          const logicalScreen = this.screen === "actions" ? this.returnScreen : this.screen;
          const initiativeView = logicalScreen === "initiatives" || (logicalScreen === "tickets" || logicalScreen === "receipts") && this.itemOrigin === "initiatives";
          const removedInitiative = this.initiativeId && !snapshot.initiatives.some(initiative => initiative.id === this.initiativeId);
          const removedTicket = this.ticketId && !this.tickets.has(this.ticketId);
          if (removedInitiative && initiativeView) {
            this.notice = "Selected initiative was removed. Returned to initiatives.";
            this.screen = "home";
            this.focus = "list";
          }
          if (!this.initiative() || removedInitiative) this.initiativeId = snapshot.initiatives[0]?.id;
          // A remembered child is not the active target in home or queue action menus.
          const removedTarget = selected?.kind === "ticket" && !snapshot.tickets.some(ticket => ticket.ref === selected.ticket.ref && ticket.backend === selected.ticket.backend);
          if (removedTarget) {
            this.notice = "Selected item was removed. Selected a nearby item or its parent.";
            if (this.screen === "tickets" || this.screen === "receipts" || this.screen === "actions") {
              this.screen = logicalScreen === "queues" ? "queues" : this.itemOrigin;
              this.focus = "list";
            }
          }
          const children = this.initiative()?.ticketIds ?? [];
          if (initiativeView && !removedInitiative && this.ticketId && !children.includes(this.ticketId)) {
            this.notice = "Selected item was removed from this collection. Selected a nearby item or its parent.";
            this.screen = "initiatives";
            this.focus = "list";
            this.receiptId = undefined;
            this.ticketId = children[Math.min(previousChildIndex, children.length - 1)];
            if (this.initiativeId) {
              if (this.ticketId) this.childSelections.set(this.initiativeId, this.ticketId);
              else this.childSelections.delete(this.initiativeId);
            }
          }
          if (!this.ticketId || removedTicket) this.ticketId = this.initiative()?.ticketIds[Math.min(previousChildIndex, (this.initiative()?.ticketIds.length ?? 0) - 1)];
          if (this.ticket() && recordKind(this.ticket()!) !== "ticket" && (this.screen === "receipts" || this.screen === "actions" && this.returnScreen === "receipts")) {
            this.screen = "tickets";
            this.focus = this.lastWidth < 70 || this.options.height() < 16 ? "detail" : "list";
            this.receiptId = undefined;
            this.notice = "Record type changed. Showing its recorded details.";
          }
          if (this.screen === "actions") this.actionIndex = Math.min(this.actionIndex, Math.max(0, this.choices().length - 1));
          if (this.reader && (!this.descriptionRecord() || this.screen === "home" || this.screen === "queues" || this.reader.kind === "ticket" && this.screen === "initiatives")) {
            this.reader = undefined;
            this.focus = "list";
          }
          this.scopeKey = "";
          this.updateWatchScope();
          this.ticketStates.clear();
          this.restoreHomeSelection(selected);
        }
        this.loading = false;
        this.error = "";
        const tickets = this.snapshot!.tickets.filter(ticket => recordKind(ticket) === "ticket" && (all || ids.has(ticket.id) || !this.workflows.has(ticket.id)));
        let index = 0;
        const worker = async () => {
          while (index < tickets.length && !this.disposed) {
            const ticket = tickets[index++];
            let workflow: TicketWorkflow;
            try {
              workflow = await (this.options.loadWorkflow ?? loadTicketWorkflow)(this.options.context, ticket, this.options.exec);
            } catch (error) {
              workflow = { ticketId: ticket.id, receipts: [], error: error instanceof Error ? error.message : String(error) };
            }
            if (this.disposed) return;
            const selected = initial ? undefined : this.target();
            this.workflows.set(ticket.id, workflow);
            this.ticketStates.clear();
            this.receiptChecks = this.workflows.size;
            this.restoreHomeSelection(selected);
            this.options.requestRender();
          }
        };
        await Promise.all(Array.from({ length: Math.min(3, tickets.length) }, worker));
        if (this.disposed) return;
        if (initial) this.restoreHomeSelection(undefined);
        if (graph) this.graphError = "";
        this.refreshError = this.routeError || this.graphError;
        this.updateWatchScope();
      } catch (error) {
        if (this.disposed) return;
        this.refreshFailed(error);
        if (routes) this.routeError = this.refreshError;
        if (graph) this.graphError = this.refreshError;
        if (!this.snapshot) this.error = `Tracker unreadable: ${error instanceof Error ? error.message : String(error)}`;
        this.loading = false;
      }
      if (!this.disposed) this.options.requestRender();
    }
  }

  private restoreHomeSelection(target: ExplorerTarget | undefined): void {
    const screen = this.screen === "actions" ? this.returnScreen : this.screen;
    if (screen !== "home" && screen !== "queues") return;
    const rows = screen === "home" ? this.homeRows() : this.queueRows();
    const index = target ? rows.findIndex(row => row.target?.kind === target.kind && (row.target.kind === "ticket" ? row.target.ticket.ref === (target.kind === "ticket" && target.ticket.ref) : row.target.initiative.ref === (target.kind === "initiative" && target.initiative.ref))) : -1;
    const previous = screen === "home" ? this.homeIndex : this.queueIndex;
    const next = index >= 0 ? index : Math.max(0, Math.min(previous, rows.length - 1));
    if (target && index < 0) this.notice = "Selected record was removed from this view. Selected a nearby record.";
    if (screen === "home") this.homeIndex = next;
    else this.queueIndex = next;
  }

  private refreshFailed(error: unknown): void {
    if (this.disposed) return;
    this.refreshError = `Live refresh failed: ${error instanceof Error ? error.message : String(error)}`;
    this.options.requestRender();
  }

  private async startWatching(): Promise<void> {
    this.monitor = new DirectoryMonitor(keys => this.refresh(keys), error => this.refreshFailed(error));
    const monitor = this.monitor;
    await this.configureTargets();
    if (this.disposed || this.monitor !== monitor) return;
    this.sourceTimer = setInterval(() => { void this.pollSources(); }, 5_000);
    this.sourceTimer.unref();
    this.remoteTimer = setInterval(() => {
      if (this.snapshot?.backend === "github") void this.refresh(new Set(["graph"]));
    }, 60_000);
    this.remoteTimer.unref();
  }

  private stopWatching(): void {
    this.monitor?.dispose();
    this.monitor = undefined;
    clearInterval(this.sourceTimer);
    clearInterval(this.remoteTimer);
  }

  private async pollSources(): Promise<void> {
    if (this.disposed || this.pollingSource) return;
    this.pollingSource = true;
    try {
      for (const id of this.focusedIds) {
        const workflow = this.workflows.get(id);
        const workspace = workflow?.receipts[0]?.workspacePath;
        if (!workspace) continue;
        const current = await this.options.exec("git", ["-C", workspace, "rev-parse", "--verify", "HEAD"]);
        if (this.disposed) return;
        if (current.code || current.stdout.trim() !== workflow?.sourceCommit) this.pendingIds.add(id);
      }
      await this.drainRefresh();
    } catch (error) { this.refreshFailed(error); }
    finally { this.pollingSource = false; }
  }

  private async configureTargets(): Promise<void> {
    const context = this.options.context;
    const alignment = await resolveContextRecord(context, { kind: "alignment" });
    const targets: WatchTarget[] = [
      ...(context.checkoutAvailable === false ? [] : [{ key: "routes", path: join(context.repositoryRoot, ".context-routes.toml") }]),
      { key: "routes", path: join(context.candidateSharedRoot ?? context.repositoryRoot, ".context-routes.toml") },
    ];
    if (alignment.path && !(context.checkoutAvailable === false && alignment.store === "repository")) for (const file of ["issue-tracker.md", "context-layout.toml"]) targets.push({ key: "routes", path: join(alignment.path, "docs/agents", file) });
    for (const kind of ["tickets", "initiatives"] as const) {
      if (kind === "tickets" && context.routes.tickets.adapter !== "local-markdown") continue;
      const record = await resolveContextRecord(context, { kind });
      if (record.path && !(context.checkoutAvailable === false && record.store === "repository")) targets.push({ key: "graph", path: record.path, recursive: true, suffixes: [".md"] });
    }
    if (this.disposed) return;
    this.liveTargets = targets;
    this.updateWatchScope();
  }

  private updateWatchScope(): void {
    if (!this.monitor || this.disposed) return;
    const target = this.target();
    const key = `${target?.kind}:${target?.kind === "ticket" ? target.ticket.id : target?.initiative.id}`;
    if (key === this.scopeKey) return;
    this.scopeKey = key;
    const previous = this.focusedIds;
    this.focusedIds = focusedTicketIds(this.snapshot, target);
    for (const id of this.focusedIds) if (!previous.has(id)) this.pendingIds.add(id);
    void this.bindScope(++this.scopeRevision).catch(error => this.refreshFailed(error));
  }

  private async bindScope(revision: number): Promise<void> {
    const targets = [...this.liveTargets];
    for (const id of this.focusedIds) {
      const ticket = this.tickets.get(id);
      if (!ticket) continue;
      const record = await resolveContextRecord(this.options.context, { kind: "workflow", id: ticket.backend === "github" ? `GH-${id}` : id });
      if (record.path && !(this.options.context.checkoutAvailable === false && record.store === "repository")) targets.push({ key: `workflow:${id}`, path: join(record.path, "events"), recursive: true, suffixes: [".md", ".json", ".yaml", ".yml"] });
    }
    if (this.disposed || this.scopeRevision !== revision) return;
    this.monitor?.setTargets(targets);
    if (this.pendingIds.size) await this.drainRefresh();
  }

  moveFocus(reverse: boolean): boolean {
    if (this.focus === "breadcrumb") {
      const nextCrumb = this.breadcrumbIndex + (reverse ? -1 : 1);
      if (nextCrumb >= 0 && nextCrumb < this.breadcrumbs().length - 1) {
        this.breadcrumbIndex = nextCrumb;
        return true;
      }
    }
    const order = this.focusOrder();
    const next = order.indexOf(this.focus) + (reverse ? -1 : 1);
    if (next < 0 || next >= order.length) return false;
    this.focus = order[next]!;
    if (this.focus === "breadcrumb") this.breadcrumbIndex = reverse ? this.breadcrumbs().length - 2 : 0;
    this.options.requestRender();
    return true;
  }

  enterFocus(reverse: boolean): void {
    const order = this.focusOrder();
    this.focus = reverse ? order[order.length - 1]! : order[0]!;
    if (this.focus === "breadcrumb") this.breadcrumbIndex = reverse ? this.breadcrumbs().length - 2 : 0;
    this.options.requestRender();
  }

  private focusOrder(): ExplorerNavigation["focus"][] {
    if (this.reader) return ["breadcrumb", "detail", "return"];
    const panes: ExplorerNavigation["focus"][] = this.panes().length < 2 ? ["list"]
      : this.screen === "receipts" && this.neighborhoodRows().length ? ["list", "detail", "neighborhood"] : ["list", "detail"];
    const controls = this.descriptionTarget() ? [...panes, "description" as const] : panes;
    return this.breadcrumbs().length > 1 ? ["breadcrumb", ...controls] : controls;
  }

  setActive(active: boolean): void { this.active = active; }

  private breadcrumbs(): { label: string; screen: Screen }[] {
    const screen = this.screen === "actions" ? this.returnScreen : this.screen;
    const crumbs: { label: string; screen: Screen }[] = [{ label: "Initiatives", screen: "home" }];
    if (screen === "home") return crumbs;
    if (screen === "queues" || (screen === "tickets" || screen === "receipts") && this.itemOrigin === "queues") crumbs.push({ label: "Queues", screen: "queues" });
    else crumbs.push({ label: this.initiative()?.title ?? "Initiative", screen: "initiatives" });
    if (screen === "tickets" || screen === "receipts") crumbs.push({ label: this.ticketId ?? "Item", screen: "tickets" });
    if (screen === "receipts") crumbs.push({ label: "Events", screen: "receipts" });
    if (this.reader) crumbs.push({ label: "Description", screen });
    return crumbs;
  }

  private activateBreadcrumb(index: number): void {
    const crumb = this.breadcrumbs()[index];
    if (!crumb || index >= this.breadcrumbs().length - 1) return;
    this.reader = undefined;
    this.screen = crumb.screen;
    this.focus = crumb.screen === "tickets" && (this.lastWidth < 70 || this.options.height() < 16) ? "detail" : "list";
    this.options.requestRender();
  }

  handleMouse(event: TuiMouseEvent): TuiMouseEventResult | undefined {
    if (event.type !== "click" || event.button !== "left") return;
    const control = this.controlHits.find(hit => hit.y === event.y && event.x >= hit.x && event.x < hit.x + hit.width);
    if (control) {
      if (control.action === "description") this.openDescription();
      else if (control.action === "return") this.closeDescription();
      else this.scrollDescription(control.action === "up" ? -1 : 1, true);
      this.options.requestRender();
      return { handled: true };
    }
    const hit = this.breadcrumbHits.find(hit => hit.y === event.y && event.x >= hit.x && event.x < hit.x + hit.width);
    if (!hit) return;
    this.activateBreadcrumb(hit.index);
    return { handled: true };
  }

  suspend(): void {
    this.stopWatching();
    this.scopeKey = "";
    this.scopeRevision++;
  }

  dispose(): void {
    this.disposed = true;
    this.stopWatching();
  }

  handleInput(data: string): void {
    try { this.handleKey(data); }
    finally { this.updateWatchScope(); }
  }

  private handleKey(data: string): void {
    if (matchesKey(data, "q") || matchesKey(data, "ctrl+c")) {
      this.options.done(undefined);
      return;
    }
    if (matchesKey(data, "b")) {
      this.options.done({ kind: "files", navigation: this.navigation() });
      return;
    }
    if (matchesKey(data, "shift+r")) {
      void this.load();
      return;
    }
    if (matchesKey(data, "home") || matchesKey(data, "h")) {
      this.reader = undefined;
      this.screen = "home";
      this.focus = "list";
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "escape") || matchesKey(data, "left") && this.focus !== "breadcrumb" || matchesKey(data, "backspace")) {
      if (this.reader) { this.closeDescription(); return; }
      let focus: ExplorerNavigation["focus"] = "list";
      if (this.screen === "actions") { this.screen = this.returnScreen; focus = this.returnFocus; }
      else if (this.screen === "receipts") {
        this.screen = "tickets";
        focus = this.lastWidth < 70 || this.options.height() < 16 ? "detail" : "list";
      }
      else if (this.screen === "tickets") this.screen = this.itemOrigin;
      else if (this.screen === "initiatives" || this.screen === "queues") this.screen = "home";
      else { if (matchesKey(data, "escape") && this.options.projects) this.options.projects(); else this.options.done(undefined); return; }
      this.focus = focus;
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (this.loading || this.error || !this.snapshot) return;
    if (this.screen === "home" || this.screen === "queues") {
      const filter = ([["5", "ready"], ["6", "review"], ["7", "blocked"], ["8", "all"]] as const).find(([key]) => matchesKey(data, key))?.[1];
      if (filter) {
        this.queue = filter;
        this.screen = "queues";
        this.queueIndex = 0;
        this.options.requestRender();
        return;
      }
    }
    if (this.focus === "breadcrumb" && !matchesKey(data, "tab") && !matchesKey(data, "shift+tab")) {
      const lastAncestor = this.breadcrumbs().length - 2;
      if (matchesKey(data, "right") || matchesKey(data, "down")) this.breadcrumbIndex = Math.min(lastAncestor, this.breadcrumbIndex + 1);
      else if (matchesKey(data, "left") || matchesKey(data, "up")) this.breadcrumbIndex = Math.max(0, this.breadcrumbIndex - 1);
      else if (matchesKey(data, "enter") || data === " ") this.activateBreadcrumb(this.breadcrumbIndex);
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "tab") || matchesKey(data, "shift+tab")) {
      const reverse = matchesKey(data, "shift+tab");
      if (!this.moveFocus(reverse)) this.enterFocus(reverse);
      return;
    }
    if (this.reader) {
      if (this.focus === "return" && (matchesKey(data, "enter") || data === " ")) this.closeDescription();
      else if (matchesKey(data, "up") || matchesKey(data, "down") || matchesKey(data, "pageUp") || matchesKey(data, "pageDown")) {
        this.scrollDescription(matchesKey(data, "up") || matchesKey(data, "pageUp") ? -1 : 1, matchesKey(data, "pageUp") || matchesKey(data, "pageDown"));
      }
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "d") || this.focus === "description" && (matchesKey(data, "enter") || data === " ")) {
      this.openDescription();
      return;
    }
    if (matchesKey(data, "pageUp") || matchesKey(data, "pageDown")) {
      const panes = this.panes();
      const pane = this.focusedPane(panes);
      const up = matchesKey(data, "pageUp");
      const compact = this.lastWidth < 70 || this.options.height() < 16;
      const step = Math.max(1, Math.min(30, this.options.height() - (compact ? 4 : 8)));
      if (pane) this.offsets.set(pane.id, Math.max(0, (this.offsets.get(pane.id) ?? 0) + (up ? -step : step)));
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "up") || matchesKey(data, "down")) {
      const delta = matchesKey(data, "up") ? -1 : 1;
      if (this.focus === "detail") {
        const pane = this.focusedPane(this.panes());
        if (pane) this.offsets.set(pane.id, Math.max(0, (this.offsets.get(pane.id) ?? 0) + delta));
      } else if (this.screen === "actions") {
        this.actionIndex = Math.max(0, Math.min(this.choices().length - 1, this.actionIndex + delta));
      } else if (this.focus === "neighborhood") {
        this.neighborhoodIndex = Math.max(0, Math.min(this.neighborhoodRows().length - 1, this.neighborhoodIndex + delta));
      } else if (this.screen === "home") {
        this.homeIndex = Math.max(0, Math.min(this.homeRows().length - 1, this.homeIndex + delta));
      } else if (this.screen === "queues") {
        this.queueIndex = Math.max(0, Math.min(this.queueRows().length - 1, this.queueIndex + delta));
      } else if (this.screen === "initiatives" || this.screen === "tickets") {
        const ids = this.scopes.get(this.initiativeId ?? "") ?? [];
        this.ticketId = ids[Math.max(0, Math.min(ids.length - 1, ids.indexOf(this.ticketId ?? "") + delta))];
        if (this.ticketId && this.initiativeId) this.childSelections.set(this.initiativeId, this.ticketId);
      } else {
        const receipts = this.history();
        const index = Math.max(0, receipts.findIndex(receipt => receipt.id === this.receiptId));
        this.receiptId = receipts[Math.max(0, Math.min(receipts.length - 1, index + delta))]?.id;
      }
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "enter") || matchesKey(data, "right")) {
      if (this.screen === "actions") { this.chooseAction(this.choices()[this.actionIndex]); return; }
      const compact = this.lastWidth < 70 || this.options.height() < 16;
      if (compact && this.focus === "list" && this.screen === "receipts") {
        this.focus = "detail";
        this.options.requestRender();
        return;
      }
      let focus: ExplorerNavigation["focus"] = this.focus;
      if (this.focus === "neighborhood") {
        const target = this.neighborhoodRows()[this.neighborhoodIndex]?.target;
        if (target?.kind === "ticket") {
          this.ticketId = target.ticket.id;
          if (!this.scopes.get(this.initiativeId ?? "")?.includes(this.ticketId)) this.initiativeId = this.snapshot.initiatives.find(initiative => initiative.ticketIds.includes(this.ticketId!))?.id;
          this.screen = "tickets";
          focus = compact ? "detail" : "list";
        }
      } else if (this.screen === "home") {
        const target = this.homeRows()[this.homeIndex]?.target;
        if (target?.kind === "initiative") {
          this.initiativeId = target.initiative.id;
          const saved = this.childSelections.get(this.initiativeId);
          this.ticketId = saved && target.initiative.ticketIds.includes(saved) ? saved : target.initiative.ticketIds[0];
          this.screen = "initiatives";
          focus = "list";
        }
      } else if (this.screen === "queues") {
        const target = this.queueRows()[this.queueIndex]?.target;
        if (target?.kind === "ticket") {
          this.ticketId = target.ticket.id;
          this.itemOrigin = "queues";
          this.initiativeId = this.snapshot.initiatives.find(initiative => initiative.ticketIds.includes(target.ticket.id))?.id;
          this.screen = "tickets";
          focus = compact ? "detail" : "list";
        }
      } else if (this.screen === "initiatives" && this.ticket()) {
        this.itemOrigin = "initiatives";
        this.screen = "tickets";
        focus = compact ? "detail" : "list";
      } else if (this.screen === "tickets" && this.ticket() && recordKind(this.ticket()!) === "ticket") {
        this.screen = "receipts";
        focus = "list";
        if (!this.history().some(receipt => receipt.id === this.receiptId)) this.receiptId = this.history()[0]?.id;
      }
      this.focus = focus;
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "a") && this.screen !== "actions" && this.choices().length) {
      this.returnScreen = this.screen;
      this.returnFocus = this.focus;
      this.screen = "actions";
      this.actionIndex = 0;
      this.focus = "list";
      this.options.requestRender();
      return;
    }
    const choice = this.choices().find(action => matchesKey(data, action.key));
    if (choice) this.chooseAction(choice);
  }

  render(width: number): string[] {
    this.lastWidth = width;
    this.controlHits = [];
    if (this.reader) return this.renderDescription(width);
    const th = this.options.theme;
    const inner = Math.max(1, width - 2);
    const compact = width < 70 || this.options.height() < 16;
    const height = Math.max(5, this.options.height());
    const control = this.descriptionTarget() ? this.descriptionControl(width) : undefined;
    const bodyHeight = Math.max(1, Math.min(30, height - (compact ? 4 : 9) - Number(control !== undefined)));
    let panes = this.panes();
    if (compact && panes.length > 1) {
      panes = [this.focusedPane(panes) ?? panes[panes.length - 1]];
    }
    const proportions = panes.length === 3 ? [0.22, 0.27, 0.51] : panes.length === 2 ? [0.34, 0.66] : [1];
    const available = inner - Math.max(0, panes.length - 1);
    const sizes = proportions.map((proportion, index) => index === panes.length - 1 ? available - proportions.slice(0, index).reduce((sum, part) => sum + Math.floor(available * part), 0) : Math.floor(available * proportion));
    const rendered = panes.map((pane, index) => this.renderPane(pane, Math.max(1, sizes[index]), bodyHeight));
    const join = (parts: string[]) => parts.join(th.fg("border", "│"));
    const headers = panes.map((pane, index) => this.pad(`${this.active && ["list", "detail", "neighborhood"].includes(this.focus) && this.focusedPane(panes)?.id === pane.id ? ">" : " "} ${pane.title}`, sizes[index]));
    const body = Array.from({ length: bodyHeight }, (_, row) => join(rendered.map(lines => lines[row] ?? "")));
    const target = this.target();
    const breadcrumb = this.renderBreadcrumbs(inner, compact);
    const ticketCount = this.snapshot?.tickets.reduce((count, ticket) => count + Number(recordKind(ticket) === "ticket"), 0) ?? 0;
    const checks = this.snapshot && this.receiptChecks < ticketCount ? `Checking receipts ${this.receiptChecks}/${ticketCount}` : "";
    const unavailable = this.options.context.checkoutAvailable === false
      ? Object.values(this.options.context.routes).some(route => route.store === "repository")
        ? "No checkout: repository records unavailable. Shared records remain readable."
        : "No checkout: context is readable; actions are disabled."
      : "";
    const summary = this.screen === "initiatives" ? this.initiative()?.body.split(/\r?\n/).map(line => line.trim()).find(line => line && !/^#|^\s*[-*]\s*\[/.test(line)) : undefined;
    const status = this.error || this.refreshError || this.notice || (this.loading ? "Loading tracker…" : checks) || unavailable || (summary ? `Summary: ${summary}` : target?.kind === "ticket" ? `${target.ticket.ref} · ${this.ticketState(target.ticket)}` : target?.kind === "initiative" ? target.initiative.ref : "No selection");
    const keys = compact ? "Esc back  Enter open  Tab focus  R reload" : this.screen === "home" || this.screen === "queues" ? "5 Ready 6 Review 7 Blocked 8 All queues · Enter open · a actions · R refresh · Esc back" : "Esc back · Enter drill · ↑↓ move · Tab/Shift+Tab focus · PgUp/Dn scroll · a actions · h initiatives · R refresh";
    if (compact) {
      if (control) this.controlHits.push({ x: 0, y: 1, width: visibleWidth(control), action: "description" });
      return [breadcrumb, ...(control ? [control] : []), join(headers), ...body, th.fg(this.error || this.refreshError ? "error" : "muted", truncateToWidth(this.clean(status), width)), th.fg("muted", truncateToWidth(keys, width))].map(line => truncateToWidth(line, width));
    }
    const frame = (text: string) => th.fg("border", "│") + this.pad(text, inner) + th.fg("border", "│");
    if (control) this.controlHits.push({ x: 1, y: 2, width: visibleWidth(control), action: "description" });
    return [th.fg("border", `╭${"─".repeat(inner)}╮`), frame(breadcrumb), ...(control ? [frame(control)] : []), frame(join(headers)), th.fg("border", `├${"─".repeat(inner)}┤`), ...body.map(frame), th.fg("border", `├${"─".repeat(inner)}┤`), frame(th.fg(this.error || this.refreshError ? "error" : "muted", ` ${this.clean(status)}`)), frame(th.fg("muted", ` ${keys}`)), th.fg("border", `╰${"─".repeat(inner)}╯`)];
  }

  private descriptionTarget(): ExplorerTarget | undefined {
    if (this.screen === "initiatives") {
      const initiative = this.initiative();
      return initiative && !initiative.group ? { kind: "initiative", initiative } : undefined;
    }
    const ticket = this.ticket();
    return (this.screen === "tickets" || this.screen === "receipts") && ticket ? { kind: "ticket", ticket } : undefined;
  }

  private descriptionRecord(): ExplorerInitiative | ExplorerTicket | undefined {
    if (!this.reader) return;
    return this.reader.kind === "initiative"
      ? this.snapshot?.initiatives.find(item => item.ref === this.reader!.ref)
      : this.snapshot?.tickets.find(item => item.ref === this.reader!.ref);
  }

  private descriptionControl(width: number): string {
    const label = "[d] Full description";
    return this.options.theme.fg("accent", truncateToWidth(this.active && this.focus === "description" ? `>${label}<` : ` ${label} `, Math.max(1, width - 2)));
  }

  private openDescription(): void {
    const target = this.descriptionTarget();
    if (!target) return;
    const record = target.kind === "initiative" ? target.initiative : target.ticket;
    this.reader = { kind: target.kind, ref: record.ref, focus: this.focus };
    this.focus = "detail";
    this.options.requestRender();
  }

  private closeDescription(): void {
    if (!this.reader) return;
    this.focus = this.reader.focus;
    this.reader = undefined;
    this.options.requestRender();
  }

  private scrollDescription(direction: number, page: boolean): void {
    if (!this.reader) return;
    const key = `description:${this.reader.kind}:${this.reader.ref}`;
    const step = page ? Math.max(1, this.options.height() - 4) : 1;
    this.offsets.set(key, Math.max(0, (this.offsets.get(key) ?? 0) + direction * step));
  }

  private renderDescription(width: number): string[] {
    const record = this.descriptionRecord();
    const th = this.options.theme;
    const inner = Math.max(1, width - 2);
    const height = Math.max(5, this.options.height());
    const bodyHeight = height - 4;
    const body = record?.body ?? "";
    const rows: Row[] = [
      ...(this.refreshError ? [{ text: `Description unreadable after refresh. Showing the last readable body. ${this.refreshError}`, tone: "error" as const }] : []),
      ...(body.trim() ? body.split(/\r?\n/).map(text => ({ text })) : [{ text: "No description recorded.", tone: "muted" as const }]),
    ];
    const pane = { id: `description:${this.reader!.kind}:${this.reader!.ref}`, title: "Description", rows };
    const lines = this.renderPane(pane, inner, bodyHeight);
    const back = this.active && this.focus === "return" ? ">[Return]<" : " [Return] ";
    const controls = `${back} [PgUp] [PgDn]`;
    this.controlHits = [
      { x: 1, y: height - 2, width: visibleWidth(back), action: "return" },
      { x: visibleWidth(back) + 2, y: height - 2, width: 6, action: "up" },
      { x: visibleWidth(back) + 9, y: height - 2, width: 6, action: "down" },
    ];
    const breadcrumb = this.renderBreadcrumbs(inner, true);
    for (const hit of this.breadcrumbHits) hit.x++;
    return [
      breadcrumb,
      th.fg("accent", truncateToWidth(this.clean(`${this.active && this.focus === "detail" ? ">" : " "} ${record?.title ?? "Record"} · Description`), inner)),
      ...lines,
      th.fg("accent", truncateToWidth(controls, inner)),
      th.fg(this.refreshError ? "error" : "muted", truncateToWidth(this.refreshError ? "Description unreadable · last readable body" : "↑↓ scroll · PgUp/Dn page · Esc return", inner)),
    ].map(line => th.fg("border", "│") + this.pad(line, inner) + th.fg("border", "│"));
  }

  private renderBreadcrumbs(width: number, compact: boolean): string {
    const crumbs = this.breadcrumbs();
    const labelWidth = Math.max(3, Math.floor((width - (crumbs.length - 1) * 3) / crumbs.length));
    this.breadcrumbHits = [];
    let x = compact ? 0 : 1;
    return crumbs.map((crumb, index) => {
      const focused = this.active && this.focus === "breadcrumb" && index === this.breadcrumbIndex;
      const label = truncateToWidth(this.clean(crumb.label), Math.max(1, labelWidth - 2), "…");
      const text = focused ? `>${label}<` : ` ${label} `;
      if (index < crumbs.length - 1) this.breadcrumbHits.push({ x, y: compact ? 0 : 1, width: visibleWidth(text), index });
      x += visibleWidth(text) + 3;
      return this.options.theme.fg(index < crumbs.length - 1 ? "accent" : "text", text);
    }).join(this.options.theme.fg("muted", " > "));
  }

  private panes(): Pane[] {
    if (this.loading || this.error || !this.snapshot) return [{ id: "state", title: "Shared context", rows: [{ text: this.loading ? "Loading tracker records…" : this.error || "No snapshot loaded.", tone: this.error ? "error" : "muted" }, { text: "R reload · b browse files · q close", tone: "muted" }] }];
    if (this.screen === "actions") return [{ id: "actions", title: "Open a fresh chat · commands are staged, not auto-sent", rows: this.choices().map((choice, index) => ({ text: `[${choice.key}] ${choice.label}${choice.disabledReason ? ` — ${choice.disabledReason}` : ""}`, tone: choice.disabledReason ? "warning" : "text", selected: index === this.actionIndex })) }];
    if (this.screen === "home") return [{ id: "home", title: "Initiatives · title / phase / Items", rows: this.homeRows().map((row, index) => ({ ...row, selected: index === this.homeIndex })) }];
    if (this.screen === "queues") return [{ id: `queue:${this.queue}`, title: `Ticket queues · ${this.queue}`, rows: this.queueRows().map((row, index) => ({ ...row, selected: index === this.queueIndex })) }];
    if (this.screen === "initiatives") return [this.graphPane()];
    if (this.screen === "tickets") return [this.graphPane(), { id: `ticket:${this.ticketId}`, title: this.ticket() && recordKind(this.ticket()!) !== "ticket" ? `${this.ticketType(this.ticket()!)} / recorded details` : "Ticket / dependencies / receipts", rows: this.ticketRows() }];
    const workflow = this.workflow();
    const events = this.history();
    const event = events.find(event => event.id === this.receiptId) ?? events[0];
    const receipt = event && !event.error ? workflow?.receipts.find(receipt => receipt.ref === event.ref) : undefined;
    return [{ id: `neighbors:${this.ticketId}`, title: "Dependency context", rows: this.neighborhoodRows().map((row, index) => ({ ...row, selected: this.focus === "neighborhood" && index === this.neighborhoodIndex })) }, {
      id: `receipts:${this.ticketId}`, title: "Events / newest first",
      rows: events.length ? events.map(item => ({
        text: `${typeof item.fields?.receipt_id === "string" ? item.fields.receipt_id : item.ref.split("/").at(-1)} ${typeof item.fields?.phase === "string" ? item.fields.phase : ""} [${item.error ? "INVALID" : typeof item.fields?.status === "string" ? item.fields.status : "recorded"}]`,
        selected: item.id === event?.id, tone: item.error ? "warning" : "text",
      })) : [{ text: workflow?.error ?? (workflow ? "No receipts yet." : "Loading receipts…"), tone: workflow?.error ? "error" : "muted" }],
    }, {
      id: `receipt:${this.ticketId}:${event?.id ?? "none"}`, title: "Receipt / exact evidence", rows: receipt ? [
        { text: `Ticket: ${this.ticket()?.ref ?? ""}`, tone: "accent" }, { text: `Receipt: ${receipt.id}` }, { text: `Phase: ${receipt.phase} · ${receipt.status}${receipt.verdict ? ` · ${receipt.verdict}` : ""}` }, { text: `Parent: ${receipt.parentReceipt ?? "none"}` }, { text: `Commit: ${receipt.sourceCommit}` }, { text: `Tree: ${receipt.sourceTree}` }, { text: `Current: ${workflow?.sourceCommit ?? "unavailable"}` }, { text: `Current tree: ${workflow?.sourceTree ?? "unavailable"}` }, { text: workflow?.error ?? (receipt.sourceCommit === workflow?.sourceCommit && receipt.sourceTree === workflow?.sourceTree ? "Source: matched" : "Source: stale / unavailable"), tone: workflow?.error || receipt.sourceCommit !== workflow?.sourceCommit || receipt.sourceTree !== workflow?.sourceTree ? "warning" : "accent" }, { text: `Workspace: ${receipt.workspacePath}` }, { text: `Branch: ${receipt.sourceBranch} · base ${receipt.baseBranch}` }, { text: `Session: ${receipt.sessionId ?? "not recorded"}` }, { text: `Created: ${receipt.createdAt}` }, { text: `Reference: ${receipt.ref}` }, { text: "Outputs:", tone: "accent" }, ...receipt.outputs.map(output => ({ text: `  ${output}` })), { text: "Receipt fields:", tone: "accent" }, ...JSON.stringify(receipt.fields, null, 2).split("\n").map(text => ({ text })), ...receipt.body.split(/\r?\n/).map(text => ({ text }))
      ] : event ? [
        { text: `Reference: ${event.ref}`, tone: "accent" },
        { text: event.error ?? workflow?.error ?? "Unvalidated event.", tone: "error" },
        { text: "Not valid workflow evidence. Worktree transitions remain blocked.", tone: "warning" },
        { text: "Recorded fields:", tone: "accent" },
        ...JSON.stringify(event.fields ?? null, null, 2).split("\n").map(text => ({ text })),
        ...(event.body ?? "").split(/\r?\n/).map(text => ({ text })),
      ] : [{ text: workflow?.error ?? (workflow ? "No receipt exists for this ticket." : "Loading workflow…"), tone: workflow?.error ? "error" : "muted" }, { text: "Chat output is not workflow evidence." }]
    }];
  }

  private homeRows(): Row[] {
    if (!this.snapshot) return [];
    return this.snapshot.initiatives.map(initiative => ({
      text: "", target: { kind: "initiative", initiative },
      fields: { title: initiative.title, identity: initiative.group ? "Collection" : initiative.id, state: initiative.phase ?? "unavailable", count: initiative.ticketIds.length },
    }));
  }

  private queueRows(): Row[] {
    if (!this.snapshot) return [];
    const rows: Row[] = [];
    const ticketCount = this.snapshot.tickets.reduce((count, ticket) => count + Number(recordKind(ticket) === "ticket"), 0);
    for (const ticket of this.snapshot.tickets) {
      if (recordKind(ticket) !== "ticket") continue;
      if (this.queue !== "all" && this.receiptChecks < ticketCount) continue;
      const state = this.ticketState(ticket);
      const inQueue = this.queue === "all" || this.queue === "ready" && state === "READY" || this.queue === "review" && ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(state) || this.queue === "blocked" && ["BLOCKED", "ERROR", "UNKNOWN"].includes(state);
      if (inQueue) rows.push(this.childRow(ticket, false));
    }
    if (!rows.length) rows.push({ text: this.receiptChecks < ticketCount ? "Checking workflow receipts before offering work…" : `No tickets in ${this.queue}. Choose 8 for all tickets.`, tone: "muted" });
    return rows;
  }

  private childRow(ticket: ExplorerTicket, selected: boolean): Row {
    const blockers = ticket.blockedBy.filter(id => !this.tickets.has(id) || !isCompleted(this.tickets.get(id)!));
    return {
      text: "", selected, target: { kind: "ticket", ticket },
      fields: {
        title: ticket.title, identity: ticket.id, type: this.ticketType(ticket), state: ticket.status || "unavailable",
        supporting: recordKind(ticket) === "ticket" && blockers.length ? `Waiting for ${blockers.join(", ")}` : this.workflows.get(ticket.id)?.error ? `Workflow unreadable: ${this.workflows.get(ticket.id)!.error}` : ticket.ref
      },
    };
  }

  private graphPane(): Pane {
    const initiative = this.initiative();
    const rows: Row[] = (this.scopes.get(this.initiativeId ?? "") ?? []).flatMap(id => {
      const ticket = this.tickets.get(id);
      return ticket ? [this.childRow(ticket, id === this.ticketId)] : [];
    });
    if (!rows.length) rows.push({ text: "This collection is empty. No child items.", tone: "muted" });
    if (this.screen === "initiatives" && initiative && this.lastWidth >= 70 && this.options.height() >= 16) {
      const summary = initiative.body.split(/\r?\n/).map(line => line.trim()).find(line => line && !/^#|^\s*[-*]\s*\[/.test(line));
      rows.unshift({ text: `${initiative.id} · Phase: ${initiative.phase ?? "unavailable"}`, tone: "accent" }, { text: `Summary: ${summary ?? "No recorded summary."}`, tone: "muted" });
    }
    return { id: `${this.screen === "initiatives" ? "children" : "graph"}:${this.initiativeId}`, title: `${initiative?.id ?? "Collection"} · Items ${initiative?.ticketIds.length ?? 0}`, rows };
  }

  private ticketRows(): Row[] {
    const ticket = this.ticket();
    if (!ticket) return [{ text: "Select a ticket.", tone: "muted" }];
    if (recordKind(ticket) !== "ticket") {
      const fields = Object.entries(ticket.fields ?? {}).filter(([key]) => !["schema", "id", "title", "type", "work_status", "status", "blocked_by", "parent"].includes(key));
      return [
        { text: `ID: ${ticket.id}`, tone: "accent" }, { text: `Title: ${ticket.title}` },
        { text: `Type: ${this.ticketType(ticket)}` }, { text: `State: ${ticket.status || "unavailable"}` },
        { text: `Reference: ${ticket.ref}` },
        ...(ticket.fields?.parent ? [{ text: `Parent: ${String(ticket.fields.parent)}` }] : []),
        ...fields.map(([key, value]) => ({ text: `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}` })),
        { text: `Summary: ${this.descriptionSummary(ticket.body)}`, tone: "muted" },
        { text: "a actions · Esc return", tone: "muted" },
      ];
    }
    const workflow = this.workflow();
    return [
      { text: `${ticket.id} ${ticket.title}`, tone: "accent" },
      { text: `Summary: ${this.descriptionSummary(ticket.body)}`, tone: "muted" },
      { text: `Type: ${this.ticketType(ticket)}` }, { text: `State: ${this.ticketState(ticket)}` },
      { text: `Reference: ${ticket.ref}` }, { text: `Current source: ${workflow?.sourceCommit ?? "not recorded"}` },
      { text: "Dependencies:", tone: "accent" }, ...this.neighborhoodRows(), { text: "Receipts:", tone: "accent" },
      ...(workflow?.receipts.map(receipt => ({ text: `${receipt.id} ${receipt.phase} [${receipt.verdict ?? receipt.status}] @${receipt.sourceCommit}` })) ?? []),
      ...(workflow?.error ? [{ text: workflow.error, tone: "warning" as const }] : []),
      { text: workflow ? "→ inspect receipts · a actions" : "Checking receipts…", tone: "muted" },
    ];
  }

  private descriptionSummary(body: string): string {
    const line = body.split(/\r?\n/).map(line => line.trim()).find(line => line && !/^#|^\s*[-*]\s*\[/.test(line));
    return truncateToWidth(this.clean(line ?? "No description recorded."), 160, "…");
  }

  private neighborhoodRows(): Row[] {
    const ticket = this.ticket();
    if (!ticket) return [];
    const rows: Row[] = [];
    for (const blocker of ticket.blockedBy) {
      const dependency = this.tickets.get(blocker);
      rows.push({ text: `← ${blocker} [${dependency ? this.ticketState(dependency) : "MISSING"}] ${dependency?.title ?? ""}`, ...(dependency ? { target: { kind: "ticket" as const, ticket: dependency } } : {}), tone: dependency ? "text" : "warning" });
    }
    for (const dependent of this.snapshot?.tickets ?? []) if (dependent.blockedBy.includes(ticket.id)) rows.push({ text: `→ ${dependent.id} [${this.ticketState(dependent)}] ${dependent.title}`, target: { kind: "ticket", ticket: dependent } });
    if (!rows.length) rows.push({ text: "No dependency edges.", tone: "muted" });
    return rows;
  }

  private choices(): ExplorerActionChoice[] {
    const target = this.target();
    if (target?.kind === "initiative" && target.initiative.group) return [];
    const choices = target && this.snapshot ? actionChoices(target, this.snapshot, target.kind === "ticket" ? this.workflows.get(target.ticket.id) : undefined, this.options.commands()) : [];
    const reason = this.options.context.checkoutAvailable === false ? "No usable checkout. Open this project from a checkout to run actions." : this.refreshError || (this.refreshing || this.pendingRoutes || this.pendingGraph || this.pendingIds.size ? "Refreshing workflow state; wait before a worktree transition." : "");
    return reason ? choices.map(choice => this.options.context.checkoutAvailable !== false && choice.action === "ask-matt" ? choice : { ...choice, disabledReason: reason }) : choices;
  }

  private chooseAction(choice: ExplorerActionChoice | undefined): void {
    const target = this.target();
    if (!choice || !target || !this.snapshot) return;
    if (choice.disabledReason) { this.notice = choice.disabledReason; this.options.requestRender(); return; }
    this.options.done({ kind: "session", request: { action: choice.action, target, snapshot: this.snapshot, ...(target.kind === "ticket" ? { workflow: this.workflows.get(target.ticket.id) } : {}), prompt: "" }, navigation: this.navigation() });
  }

  private ticketType(ticket: ExplorerTicket): string {
    const type = ticket.documentType;
    return type || "Ticket · type unspecified";
  }

  private ticketState(ticket: ExplorerTicket): string {
    if (recordKind(ticket) !== "ticket") return ticket.status || "unavailable";
    if (isCompleted(ticket)) return "DONE";
    if (ticket.blockedBy.some(id => !this.tickets.has(id) || !isCompleted(this.tickets.get(id)!))) return "BLOCKED";
    const workflow = this.workflows.get(ticket.id);
    if (!workflow) return "CHECKING";
    if (workflow.error) return "ERROR";
    const cached = this.ticketStates.get(ticket.id);
    if (cached) return cached;
    const choices = actionChoices({ kind: "ticket", ticket }, this.snapshot!, workflow, [{ name: "skill:ask-matt" }, { name: "skill:worktree" }]);
    const next = ["start", "fix", "finish", "submit", "review"].find(action => choices.some(choice => choice.action === action && !choice.disabledReason));
    const state = next === "start" ? "READY" : next?.toUpperCase() ?? (workflow.receipts.length ? "ACTIVE" : "UNKNOWN");
    this.ticketStates.set(ticket.id, state);
    return state;
  }

  private target(): ExplorerTarget | undefined {
    if (this.screen === "home" || this.screen === "actions" && this.returnScreen === "home") return this.homeRows()[this.homeIndex]?.target;
    if (this.screen === "queues" || this.screen === "actions" && this.returnScreen === "queues") return this.queueRows()[this.queueIndex]?.target;
    const ticket = this.ticket();
    return ticket ? { kind: "ticket", ticket } : undefined;
  }

  private initiative(): ExplorerInitiative | undefined {
    return this.snapshot?.initiatives.find(initiative => initiative.id === this.initiativeId);
  }

  private ticket(): ExplorerTicket | undefined {
    return this.ticketId ? this.tickets.get(this.ticketId) : undefined;
  }

  private history(): ExplorerEvent[] {
    const workflow = this.workflow();
    return workflow?.events ?? workflow?.receipts ?? [];
  }

  private workflow(): TicketWorkflow | undefined {
    const ticket = this.ticket();
    return ticket && recordKind(ticket) === "ticket" ? this.workflows.get(ticket.id) : undefined;
  }

  private navigation(): ExplorerNavigation {
    return { screen: this.screen === "actions" ? this.returnScreen : this.screen, initiativeId: this.initiativeId, ticketId: this.ticketId, receiptId: this.receiptId, queue: this.queue, focus: this.screen === "actions" ? this.returnFocus : this.focus, offsets: [...this.offsets], homeIndex: this.homeIndex, queueIndex: this.queueIndex, itemOrigin: this.itemOrigin, reader: this.reader };
  }

  private focusedPane(panes: Pane[]): Pane | undefined {
    return this.focus === "neighborhood" ? panes.find(pane => pane.id.startsWith("neighbors:")) : this.focus === "detail" ? panes[panes.length - 1] : this.screen === "receipts" ? panes.find(pane => pane.id.startsWith("receipts:")) ?? panes[0] : panes[0];
  }

  private renderPane(pane: Pane, width: number, height: number): string[] {
    const expanded = pane.rows.flatMap(row => {
      if (row.fields) return this.fieldLines(row.fields, Math.max(1, width - 1)).map(text => ({ ...row, text, styled: true }));
      return wrapTextWithAnsi(this.clean(row.text), Math.max(1, width - 1)).map(text => ({ ...row, text, styled: false }));
    });
    const selected = expanded.findIndex(row => row.selected);
    let offset = this.offsets.get(pane.id) ?? 0;
    const selectedRow = expanded[selected];
    const selection = selectedRow?.target?.kind === "ticket" ? selectedRow.target.ticket.ref : selectedRow?.target?.kind === "initiative" ? selectedRow.target.initiative.ref : String(selected);
    const selectedEnd = expanded.findIndex((row, index) => index > selected && !row.selected);
    const end = selectedEnd < 0 ? expanded.length : selectedEnd;
    const previous = this.renderedLayout.get(pane.id);
    const layoutChanged = !previous || previous.width !== width || previous.height !== height || previous.start !== selected || previous.end !== end;
    // Paging survives unchanged renders; reflow must bring the selected record back into view.
    if (selected >= 0 && (layoutChanged || this.renderedSelection.get(pane.id) !== selection)) {
      if (selected < offset) offset = selected;
      if (selected >= offset + height) offset = selected;
      if (end - selected <= height && end > offset + height) offset = end - height;
    }
    this.renderedSelection.set(pane.id, selection);
    this.renderedLayout.set(pane.id, { width, height, start: selected, end });
    offset = Math.max(0, Math.min(offset, Math.max(0, expanded.length - height)));
    this.offsets.set(pane.id, offset);
    return Array.from({ length: height }, (_, index) => {
      const row = expanded[index + offset];
      if (!row) return " ".repeat(width);
      const focused = this.active && ["list", "detail", "neighborhood"].includes(this.focus) && this.focusedPane(this.panes())?.id === pane.id;
      const text = this.pad(`${row.selected ? focused ? ">" : "◇" : " "}${row.styled ? row.text : this.options.theme.fg(row.tone ?? "text", row.text)}`, width);
      return row.selected ? this.options.theme.bg("selectedBg", text) : text;
    });
  }

  private fieldLines(fields: NonNullable<Row["fields"]>, width: number): string[] {
    const th = this.options.theme;
    const title = this.clean(fields.title);
    const state = this.clean(fields.state);
    const isInitiative = fields.count !== undefined;
    const stateTone: Tone = /^(done|completed|closed)$/i.test(state) ? "success" : /error|failed|blocked/i.test(state) ? "warning" : "accent";
    const secondary = isInitiative ? `Phase: ${state}` : `State: ${state}`;
    const count = isInitiative ? `Items: ${fields.count}` : "";
    const identity = this.clean(fields.identity ?? "");
    const lines: string[] = [];
    if (width >= 65 && isInitiative) {
      const phaseWidth = Math.min(24, Math.max(18, visibleWidth(secondary)));
      const countWidth = 11;
      const titleWidth = Math.max(1, width - phaseWidth - countWidth - 4);
      for (const [index, line] of wrapTextWithAnsi(title, titleWidth).entries()) lines.push(th.fg("text", this.pad(line, titleWidth)) + "  " + th.fg(stateTone, this.pad(index === 0 ? secondary : "", phaseWidth)) + "  " + th.fg("muted", this.pad(index === 0 ? count : "", countWidth)));
    } else if (width >= 85) {
      const typeWidth = 14;
      const idWidth = 16;
      const stateWidth = 18;
      const titleWidth = width - typeWidth - idWidth - stateWidth - 6;
      for (const [index, line] of wrapTextWithAnsi(title, titleWidth).entries()) {
        lines.push(th.fg("accent", this.pad(index === 0 ? this.clean(`[${fields.type}]`) : "", typeWidth)) + "  "
          + th.fg("muted", this.pad(index === 0 ? identity : "", idWidth)) + "  "
          + th.fg("text", this.pad(line, titleWidth)) + "  "
          + th.fg(stateTone, this.pad(index === 0 ? secondary : "", stateWidth)));
      }
      if (visibleWidth(identity) > idWidth) lines.push(...wrapTextWithAnsi(`ID: ${identity}`, width).map(line => th.fg("muted", line)));
      if (visibleWidth(this.clean(`[${fields.type}]`)) > typeWidth) lines.push(...wrapTextWithAnsi(this.clean(`Type: ${fields.type}`), width).map(line => th.fg("accent", line)));
      if (visibleWidth(secondary) > stateWidth) lines.push(...wrapTextWithAnsi(secondary, width).map(line => th.fg(stateTone, line)));
    } else {
      if (!isInitiative) lines.push(...wrapTextWithAnsi(this.clean(`[${fields.type}]`) + `  ID: ${identity}`, width).map(line => th.fg("accent", line)));
      lines.push(...wrapTextWithAnsi(title, width).map(line => th.fg("text", line)));
      lines.push(...wrapTextWithAnsi(secondary, width).map(line => th.fg(stateTone, line)));
      if (count) lines.push(...wrapTextWithAnsi(count, width).map(line => th.fg("muted", line)));
    }
    if (isInitiative) lines.push(...wrapTextWithAnsi(identity, width).map(line => th.fg("muted", line)));
    if (fields.supporting) lines.push(...wrapTextWithAnsi(this.clean(fields.supporting), width).map(line => th.fg("muted", line)));
    return lines;
  }

  private clean(value: string): string {
    return safeTerminalText(value);
  }

  private pad(value: string, width: number): string {
    const text = truncateToWidth(value, Math.max(1, width), "…");
    return text + " ".repeat(Math.max(0, width - visibleWidth(text)));
  }
}

export function focusedTicketIds(snapshot: ExplorerSnapshot | undefined, target: ExplorerTarget | undefined): Set<string> {
  const included = new Set<string>();
  if (!snapshot || !target) return included;
  const tickets = new Map(snapshot.tickets.filter(ticket => recordKind(ticket) === "ticket").map(ticket => [ticket.id, ticket]));
  if (target.kind === "initiative") {
    const visit = (id: string) => {
      if (included.has(id) || !tickets.has(id)) return;
      included.add(id);
      for (const blocker of tickets.get(id)!.blockedBy) visit(blocker);
    };
    for (const id of target.initiative.ticketIds) visit(id);
  } else {
    const dependents = new Map<string, string[]>();
    for (const ticket of tickets.values()) for (const blocker of ticket.blockedBy) {
      const children = dependents.get(blocker) ?? [];
      children.push(ticket.id);
      dependents.set(blocker, children);
    }
    const visit = (id: string) => {
      if (included.has(id) || !tickets.has(id)) return;
      included.add(id);
      for (const child of dependents.get(id) ?? []) visit(child);
    };
    visit(target.ticket.id);
    for (const blocker of target.ticket.blockedBy) if (tickets.has(blocker)) included.add(blocker);
  }
  return included;
}
