import { join } from "node:path";
import { resolveContextRecord, resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";
import { copyToClipboard, type Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi, type TuiMouseEvent, type TuiMouseEventResult } from "@earendil-works/pi-tui";
import { actionChoices } from "./actions";
import { loadExplorerSnapshot, loadTicketWorkflow } from "../../../developer/skills/git/worktree/scripts/workflow";
import { isCompleted, isUnstarted, recordKind, type Exec, type ExplorerActionChoice, type ExplorerInitiative, type ExplorerSessionRequest, type ExplorerSnapshot, type ExplorerTarget, type ExplorerTicket, type SharedAgentContext, type TicketWorkflow } from "./model";
import { safeTerminalText } from "./terminal-text";
import type { ExplorerEvent } from "./model";
import { DirectoryMonitor, type WatchTarget } from "./watch";
import { chronologicalReceipts, recoveryDecision } from "../../../developer/skills/git/worktree/scripts/recovery";

type Screen = "home" | "queues" | "initiatives" | "tickets" | "receipts" | "actions";
type Queue = "ready" | "review" | "blocked" | "all";
type Tone = "text" | "muted" | "accent" | "warning" | "error" | "success";
type Row = { text: string; tone?: Tone; selected?: boolean; target?: ExplorerTarget; receiptId?: string; event?: ExplorerEvent; fields?: { title: string; identity?: string; type?: string; state: string; count?: number; supporting?: string; next?: string; activity?: string } };
type Pane = { id: string; title: string; rows: Row[] };

// The reader replaces content, not navigation. Keep its origin intact so returning
// cannot move the selected child, event, or an underlying pane's scroll position.
type DescriptionReader = { kind: "initiative" | "ticket"; ref: string; focus: ExplorerNavigation["focus"] };

export interface ExplorerNavigation {
  screen: Screen;
  initiativeId?: string;
  ticketId?: string;
  receiptId?: string;
  eventDetail?: boolean;
  queue: Queue;
  focus: "list" | "detail" | "neighborhood" | "breadcrumb" | "description" | "return";
  offsets: [string, number][];
  homeIndex?: number;
  itemOrigin?: "initiatives" | "queues";
  queueIndex?: number;
  queueSelections?: [Queue, { identity?: string; index: number }][];
  initiativeMemory?: { initiativeId?: string; ticketId?: string; receiptId?: string };
  childSelections?: [string, string][];
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
  private eventDetail = false;
  private homeIndex = 0;
  private actionIndex = 0;
  private queueIndex = 0;
  private itemOrigin: "initiatives" | "queues" = "initiatives";
  private childSelections = new Map<string, string>();
  private queueSelections = new Map<Queue, { identity?: string; index: number }>();
  private initiativeMemory?: ExplorerNavigation["initiativeMemory"];
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
    this.eventDetail = navigation?.eventDetail ?? false;
    this.focus = navigation?.focus ?? "list";
    this.offsets = new Map(navigation?.offsets ?? []);
    this.homeIndex = navigation?.homeIndex ?? 0;
    this.queueIndex = navigation?.queueIndex ?? 0;
    this.itemOrigin = navigation?.itemOrigin ?? "initiatives";
    this.reader = navigation?.reader;
    this.queueSelections = new Map(navigation?.queueSelections ?? []);
    this.initiativeMemory = navigation?.initiativeMemory;
    this.childSelections = new Map(navigation?.childSelections ?? []);
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
          if ((logicalScreen === "tickets" || logicalScreen === "receipts") && this.itemOrigin === "queues") this.initiativeId = snapshot.initiatives.find(initiative => initiative.ticketIds.includes(this.ticketId ?? ""))?.id;
          else if (!this.initiative() || removedInitiative) this.initiativeId = snapshot.initiatives[0]?.id;
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
          this.receiptChecks = this.workflows.size;
          this.ticketStates.clear();
          this.reconcileQueues();
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
            const previous = this.workflows.get(ticket.id);
            if (workflow.error && !workflow.events?.length && !workflow.receipts.length && previous && (previous.events?.length || previous.receipts.length)) {
              workflow = { ...previous, sourceCommit: workflow.sourceCommit, sourceTree: workflow.sourceTree, inspection: workflow.inspection, error: `History refresh failed; showing last readable history. ${workflow.error}` };
            }
            this.workflows.set(ticket.id, workflow);
            if (ticket.id === this.ticketId && (!this.receiptId || !(workflow.events ?? workflow.receipts).some(event => event.id === this.receiptId))) {
              const removed = Boolean(this.receiptId);
              this.receiptId = (workflow.events ?? workflow.receipts)[0]?.id;
              if (removed) {
                this.eventDetail = false;
                this.focus = "list";
                this.notice = "Selected event was removed. Showing the nearest available history.";
              }
            }
            this.ticketStates.clear();
            this.receiptChecks = this.workflows.size;
            this.reconcileQueues();
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
    if (screen === "queues") { this.reconcileQueues(); return; }
    if (screen !== "home") return;
    const rows = this.homeRows();
    const index = target ? rows.findIndex(row => row.target?.kind === target.kind && (row.target.kind === "ticket" ? row.target.ticket.ref === (target.kind === "ticket" && target.ticket.ref) : row.target.initiative.ref === (target.kind === "initiative" && target.initiative.ref))) : -1;
    const previous = this.homeIndex;
    const next = index >= 0 ? index : Math.max(0, Math.min(previous, rows.length - 1));
    if (target && index < 0) this.notice = "Selected record was removed from this view. Selected a nearby record.";
    this.homeIndex = next;
  }

  private queueIdentity(target: ExplorerTarget | undefined): string | undefined {
    return target?.kind === "ticket" ? JSON.stringify([target.ticket.backend, target.ticket.ref]) : undefined;
  }

  private selectQueue(index: number): void {
    const rows = this.queueRows();
    this.queueIndex = Math.max(0, Math.min(index, rows.length - 1));
    this.queueSelections.set(this.queue, { index: this.queueIndex, identity: this.queueIdentity(rows[this.queueIndex]?.target) });
  }

  private reconcileQueues(): void {
    for (const [queue, saved] of this.queueSelections) {
      if (queue !== "all" && this.snapshot && this.receiptChecks < this.snapshot.tickets.filter(ticket => recordKind(ticket) === "ticket").length) continue;
      const rows = this.queueRows(queue);
      const index = saved.identity ? rows.findIndex(row => this.queueIdentity(row.target) === saved.identity) : -1;
      const next = index >= 0 ? index : Math.max(0, Math.min(saved.index, rows.length - 1));
      if (saved.identity && index < 0 && queue === this.queue) this.notice = "Selected ticket left this queue. Selected a nearby ticket or an empty queue.";
      this.queueSelections.set(queue, { index: next, identity: this.queueIdentity(rows[next]?.target) });
      if (queue === this.queue) this.queueIndex = next;
    }
  }

  private openQueue(queue: Queue): void {
    if (!this.initiativeMemory) this.initiativeMemory = { initiativeId: this.initiativeId, ticketId: this.ticketId, receiptId: this.receiptId };
    this.queue = queue;
    this.screen = "queues";
    this.focus = "list";
    this.reconcileQueues();
    this.selectQueue(this.queueSelections.get(queue)?.index ?? 0);
  }

  private returnHome(): void {
    if (this.initiativeMemory) {
      this.initiativeId = this.initiativeMemory.initiativeId;
      this.ticketId = this.initiativeMemory.ticketId;
      this.receiptId = this.initiativeMemory.receiptId;
      this.initiativeMemory = undefined;
    }
    this.screen = "home";
    this.itemOrigin = "initiatives";
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
        const source = workflow?.inspection?.source;
        if (source && source.state !== "available") continue;
        const workspace = source?.path ?? workflow?.receipts[0]?.workspacePath;
        if (!workspace) continue;
        const [current, branch, changes] = await Promise.all([
          this.options.exec("git", ["-C", workspace, "rev-parse", "--verify", "HEAD"]),
          this.options.exec("git", ["-C", workspace, "branch", "--show-current"]),
          this.options.exec("git", ["--no-optional-locks", "-C", workspace, "status", "--porcelain"]),
        ]);
        if (this.disposed) return;
        if (current.code || branch.code || changes.code || current.stdout.trim() !== (source?.commit ?? workflow?.sourceCommit)
          || source?.branch !== undefined && source.branch !== branch.stdout.trim()
          || source?.dirty !== undefined && source.dirty !== Boolean(changes.stdout.trim())) this.pendingIds.add(id);
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
    if (this.screen === "receipts" && this.eventDetail) return ["breadcrumb", "detail"];
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
    if (screen === "receipts" && this.eventDetail) {
      const identity = this.selectedEvent()?.fields?.receipt_id;
      crumbs.push({ label: typeof identity === "string" ? identity : "Event", screen: "receipts" });
    }
    if (this.reader) crumbs.push({ label: "Description", screen });
    return crumbs;
  }

  private activateBreadcrumb(index: number): void {
    const crumb = this.breadcrumbs()[index];
    if (!crumb || index >= this.breadcrumbs().length - 1) return;
    this.reader = undefined;
    this.eventDetail = false;
    if (crumb.screen === "home") this.returnHome();
    else this.screen = crumb.screen;
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
    if (data === "R" || matchesKey(data, "shift+r")) {
      void this.load();
      return;
    }
    if (matchesKey(data, "home") || matchesKey(data, "h")) {
      this.reader = undefined;
      this.eventDetail = false;
      this.returnHome();
      this.focus = "list";
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "escape") || matchesKey(data, "left") && this.focus !== "breadcrumb" || matchesKey(data, "backspace")) {
      if (this.reader) { this.closeDescription(); return; }
      let focus: ExplorerNavigation["focus"] = "list";
      if (this.screen === "actions") { this.screen = this.returnScreen; focus = this.returnFocus; }
      else if (this.screen === "receipts" && this.eventDetail) {
        this.eventDetail = false;
        this.focus = "list";
        this.options.requestRender();
        return;
      }
      else if (this.screen === "receipts") {
        this.screen = "tickets";
        focus = this.lastWidth < 70 || this.options.height() < 16 ? "detail" : "list";
      }
      else if (this.screen === "tickets") this.screen = this.itemOrigin;
      else if (this.screen === "initiatives" || this.screen === "queues") this.returnHome();
      else { if (matchesKey(data, "escape") && this.options.projects) this.options.projects(); else this.options.done(undefined); return; }
      this.focus = focus;
      if (this.screen !== "queues") this.notice = "";
      this.options.requestRender();
      return;
    }
    if (this.loading || this.error || !this.snapshot) return;
    if (matchesKey(data, "c") && !this.reader && this.screen !== "actions") {
      void this.copyPath();
      return;
    }
    if (this.screen === "home" || this.screen === "queues") {
      const filter = ([["5", "ready"], ["6", "review"], ["7", "blocked"], ["8", "all"]] as const).find(([key]) => matchesKey(data, key))?.[1];
      if (filter) {
        this.openQueue(filter);
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
      const step = pane ? this.renderedLayout.get(pane.id)?.height ?? 1 : Math.max(1, Math.min(30, this.options.height() - (compact ? 4 : 8)));
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
        this.selectQueue(this.queueIndex + delta);
      } else if (this.screen === "initiatives" || this.screen === "tickets") {
        const ids = this.scopes.get(this.initiativeId ?? "") ?? [];
        this.ticketId = ids[Math.max(0, Math.min(ids.length - 1, ids.indexOf(this.ticketId ?? "") + delta))];
        if (this.ticketId && this.initiativeId && this.itemOrigin !== "queues") this.childSelections.set(this.initiativeId, this.ticketId);
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
      if (this.screen === "receipts" && !this.eventDetail && this.selectedEvent()) {
        this.receiptId = this.selectedEvent()!.id;
        this.eventDetail = true;
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
          this.itemOrigin = "initiatives";
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
        this.eventDetail = false;
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
    const attempts = this.workflow()?.recordedAttempts;
    const ticket = this.ticket();
    const eventSummary = this.screen === "receipts" && !this.eventDetail && ticket ? [
      th.fg("accent", truncateToWidth(this.clean(`Ticket: ${ticket.id} · State: ${ticket.status}`), inner)),
      th.fg("muted", `Reviews: ${attempts?.review ?? "?"} · Fixes: ${attempts?.fix ?? "?"} (receipts)`),
    ] : [];
    const bodyHeight = Math.max(1, Math.min(30, height - (compact ? 4 : 9) - Number(control !== undefined) - eventSummary.length));
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
    const status = this.error || this.refreshError || this.notice || this.workflow()?.error || (this.loading ? "Loading tracker…" : checks) || unavailable || (summary ? `Summary: ${summary}` : target?.kind === "ticket" ? `${target.ticket.ref} · ${this.ticketState(target.ticket)}` : target?.kind === "initiative" ? target.initiative.ref : "No selection");
    const copyHint = this.copyTarget() ? "c copy path · " : "";
    const keys = copyHint + (compact ? "Esc back  Enter open  Tab focus  R reload" : this.screen === "home" || this.screen === "queues" ? "5 Ready 6 Review 7 Blocked 8 All queues · Enter open · a actions · R refresh · Esc back" : "Esc back · Enter drill · ↑↓ move · Tab/Shift+Tab focus · PgUp/Dn scroll · a actions · h initiatives · R refresh");
    if (compact) {
      if (control) this.controlHits.push({ x: 0, y: 1, width: visibleWidth(control), action: "description" });
      return [breadcrumb, ...(control ? [control] : []), ...eventSummary, join(headers), ...body, th.fg(this.error || this.refreshError ? "error" : "muted", truncateToWidth(this.clean(status), width)), th.fg("muted", truncateToWidth(keys, width))].map(line => truncateToWidth(line, width));
    }
    const frame = (text: string) => th.fg("border", "│") + this.pad(text, inner) + th.fg("border", "│");
    if (control) this.controlHits.push({ x: 1, y: 2, width: visibleWidth(control), action: "description" });
    return [th.fg("border", `╭${"─".repeat(inner)}╮`), frame(breadcrumb), ...(control ? [frame(control)] : []), ...eventSummary.map(frame), frame(join(headers)), th.fg("border", `├${"─".repeat(inner)}┤`), ...body.map(frame), th.fg("border", `├${"─".repeat(inner)}┤`), frame(th.fg(this.error || this.refreshError ? "error" : "muted", ` ${this.clean(status)}`)), frame(th.fg("muted", ` ${keys}`)), th.fg("border", `╰${"─".repeat(inner)}╯`)];
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
    const padding = inner >= 5 ? 1 : 0;
    const bodyWidth = Math.max(1, inner - padding * 2);
    const blank = th.bg("customMessageBg", " ".repeat(inner));
    const lines = [
      ...(bodyHeight >= 3 ? [blank] : []),
      ...this.renderPane(pane, bodyWidth, Math.max(1, bodyHeight - (bodyHeight >= 3 ? 2 : 0)))
        .map(line => th.bg("customMessageBg", this.pad(" ".repeat(padding) + line, inner))),
      ...(bodyHeight >= 3 ? [blank] : []),
    ];
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
    if (this.screen === "actions") {
      const target = this.target();
      const record = target?.kind === "ticket" ? target.ticket : target?.initiative;
      return [{
        id: "actions", title: "Open a fresh chat · commands are staged, not auto-sent", rows: [
          { text: record ? `Target: ${record.id} · ${record.ref}` : "No selection", tone: "accent" },
          ...this.choices().map((choice, index) => ({ text: `[${choice.key}] ${choice.label}${choice.disabledReason ? ` — ${choice.disabledReason}` : ""}`, tone: choice.disabledReason ? "warning" as const : "text" as const, selected: index === this.actionIndex })),
        ]
      }];
    }
    if (this.screen === "home") return [{ id: "home", title: "Initiatives · title / phase / Items", rows: this.homeRows().map((row, index) => ({ ...row, selected: index === this.homeIndex })) }];
    if (this.screen === "queues") return [{ id: `queue:${this.queue}`, title: `Ticket queues · ${this.queue}`, rows: this.queueRows().map((row, index) => ({ ...row, selected: index === this.queueIndex })) }];
    if (this.screen === "initiatives") return [this.graphPane()];
    if (this.screen === "tickets") return [this.graphPane(), { id: `ticket:${this.ticketId}`, title: this.ticket() && recordKind(this.ticket()!) !== "ticket" ? `${this.ticketType(this.ticket()!)} / recorded details` : "Ticket / dependencies / receipts", rows: this.ticketRows() }];
    if (this.eventDetail) return [{ id: `receipt:${this.ticketId}:${this.selectedEvent()?.id ?? "none"}`, title: "Event detail · outcome / body / exact evidence", rows: this.eventRows() }];
    const workflow = this.workflow();
    const events = this.history();
    const selected = this.selectedEvent();
    return [{
      id: `receipts:${this.ticketId}`, title: "Events / newest first",
      rows: [
        ...(events.length ? events.map(event => ({
          text: "", event, receiptId: event.id,
          selected: event.id === selected?.id, tone: event.error ? "warning" as const : "text" as const,
        })) : [{ text: workflow?.error ? `History unreadable: ${workflow.error}` : workflow ? "No events recorded." : "Loading history…", tone: workflow?.error ? "error" as const : "muted" as const }]),
        ...(workflow?.error && events.length ? [{ text: `History warning: ${workflow.error}`, tone: "warning" as const }] : []),
        { text: "Dependencies / unresolved blockers:", tone: "accent" },
        ...this.neighborhoodRows(),
      ],
    }];
  }

  private selectedEvent(): ExplorerEvent | undefined {
    const events = this.history();
    return events.find(event => event.id === this.receiptId) ?? events[0];
  }

  private eventLines(event: ExplorerEvent, width: number): string[] {
    const fields = event.fields;
    const value = (key: string): string => typeof fields?.[key] === "string" ? fields[key] : "unavailable";
    const parts: { text: string; tone: Tone }[] = [
      { text: `Event: ${typeof fields?.receipt_id === "string" ? fields.receipt_id : event.ref.split("/").at(-1)} · Phase: ${value("phase")}`, tone: "text" },
      { text: `Execution: ${value("status")}${event.error ? " · INVALID" : ""}`, tone: event.error || fields?.status === "failed" ? "error" : "accent" },
      ...(typeof fields?.verdict === "string" ? [{ text: `Verdict: ${fields.verdict}`, tone: fields.verdict === "FAILURE" ? "warning" as const : "success" as const }] : []),
      { text: `Source commit: ${typeof fields?.source_commit === "string" ? fields.source_commit.slice(0, 12) : "unavailable"}`, tone: "muted" },
    ];
    return parts.flatMap(part => wrapTextWithAnsi(this.clean(part.text), width).map(line => this.options.theme.fg(part.tone, line)));
  }

  private eventRows(): Row[] {
    const event = this.selectedEvent();
    if (!event) return [{ text: "No event selected." }];
    const workflow = this.workflow();
    const receipt = !event.error ? workflow?.receipts.find(receipt => receipt.ref === event.ref) : undefined;
    const fields = event.fields ?? {};
    const recorded = (value: unknown): string => typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "unavailable";
    const body = event.body?.trim() || (fields.summary != null ? recorded(fields.summary) : "No readable body recorded.");
    const source = !receipt || !workflow?.sourceCommit || !workflow.sourceTree ? "unavailable"
      : receipt.sourceCommit === workflow.sourceCommit && receipt.sourceTree === workflow.sourceTree ? "matched" : "stale";
    const changed = Array.isArray(fields.changed_files) && fields.changed_files.every(file => typeof file === "string") ? fields.changed_files.length
      : Number.isInteger(fields.changed_file_count) && Number(fields.changed_file_count) >= 0 ? Number(fields.changed_file_count) : undefined;
    return [
      { text: `Execution: ${recorded(fields.status)}`, tone: fields.status === "failed" ? "error" : "accent" },
      ...(fields.verdict != null ? [{ text: `Review verdict: ${recorded(fields.verdict)}`, tone: fields.verdict === "FAILURE" ? "warning" as const : "success" as const }] : []),
      ...(event.error || !receipt || workflow?.error && !workflow.recordedAttempts ? [{ text: `INVALID / unvalidated evidence: ${event.error ?? workflow?.error ?? "Not a validated receipt."}`, tone: "warning" as const }] : []),
      { text: "Recorded body:", tone: "accent" },
      ...body.split(/\r?\n/).map(text => ({ text })),
      { text: "Evidence details:", tone: "accent" },
      { text: `Source: ${source}`, tone: source === "matched" ? "success" : "warning" },
      ...(workflow?.error ? [{ text: `Workflow warning: ${workflow.error}`, tone: "warning" as const }] : []),
      { text: `Ticket action target: ${this.ticket()?.ref}` },
      { text: `Event reference: ${event.ref}` },
      ...(changed !== undefined ? [{ text: `Changed files: ${changed} (recorded)` }] : []),
      { text: `Commit: ${recorded(fields.source_commit)}` },
      { text: `Tree: ${recorded(fields.source_tree)}` },
      { text: `Current commit: ${workflow?.sourceCommit ?? "unavailable"}` },
      { text: `Current tree: ${workflow?.sourceTree ?? "unavailable"}` },
      { text: `Workspace: ${recorded(fields.workspace_path)}` },
      { text: `Branch: ${recorded(fields.source_branch)}` },
      { text: `Session: ${recorded(fields.session_id)}` },
      { text: "Raw recorded fields:", tone: "accent" },
      ...JSON.stringify(fields, null, 2).split("\n").map(text => ({ text })),
    ];
  }

  private homeRows(): Row[] {
    if (!this.snapshot) return [];
    return this.snapshot.initiatives.map(initiative => ({
      text: "", target: { kind: "initiative", initiative },
      fields: { title: initiative.title, identity: initiative.group ? "Collection" : initiative.id, state: initiative.phase ?? "unavailable", count: initiative.ticketIds.length, supporting: `Progress: ${this.initiativeProgress(initiative)}` },
    }));
  }

  private initiativeProgress(initiative: ExplorerInitiative): string {
    const tickets = initiative.ticketIds.map(id => this.tickets.get(id)).filter((ticket): ticket is ExplorerTicket => !!ticket && recordKind(ticket) === "ticket");
    const completed = tickets.filter(isCompleted).length;
    if (tickets.length > 0 && completed === tickets.length) return "completed";
    const started = tickets.some(ticket => !isUnstarted(ticket));
    return started ? `${completed}/${tickets.length} completed` : "todo";
  }

  private copyTarget(): ExplorerTarget | undefined {
    const target = this.target();
    if (target?.kind === "initiative") return this.snapshot?.backend === "local-markdown" && !target.initiative.group ? target : undefined;
    return target?.ticket.backend === "local-markdown" ? target : undefined;
  }

  private async copyPath(): Promise<void> {
    const target = this.copyTarget();
    if (!target) return;
    try {
      const record = await resolveContextRecord(this.options.context, target.kind === "initiative"
        ? { kind: "initiative", id: target.initiative.id }
        : { kind: "ticket", id: target.ticket.id });
      if (!record.path || record.store === "repository" && this.options.context.checkoutAvailable === false) throw new Error("No usable checkout for this path.");
      const path = target.kind === "initiative" ? join(record.path, "index.md") : record.path;
      await copyToClipboard(path);
      this.notice = `Copied path: ${path}`;
    } catch (error) {
      this.notice = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
    }
    if (!this.disposed) this.options.requestRender();
  }

  private queueRows(queue: Queue = this.queue): Row[] {
    if (!this.snapshot) return [];
    const rows: Row[] = [];
    const ticketCount = this.snapshot.tickets.reduce((count, ticket) => count + Number(recordKind(ticket) === "ticket"), 0);
    for (const ticket of this.snapshot.tickets) {
      if (recordKind(ticket) !== "ticket") continue;
      if (queue !== "all" && this.receiptChecks < ticketCount) continue;
      const state = this.ticketState(ticket);
      const inQueue = queue === "all" || queue === "ready" && state === "READY" || queue === "review" && ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(state) || queue === "blocked" && ["BLOCKED", "ERROR", "UNKNOWN"].includes(state);
      if (inQueue) {
        const row = this.childRow(ticket, false);
        const workflow = this.workflows.get(ticket.id);
        const choices = actionChoices({ kind: "ticket", ticket }, this.snapshot, workflow, this.options.commands());
        const reason = this.options.context.checkoutAvailable === false ? "No usable checkout." : this.refreshError || (this.refreshing || this.pendingRoutes || this.pendingGraph || this.pendingIds.size ? "Refreshing workflow state." : "");
        const decision = recoveryDecision(ticket, this.snapshot, workflow);
        const next = choices.find(choice => choice.action === decision.action);
        row.fields!.next = reason ? `Unavailable: ${reason}` : next?.disabledReason ? `Unavailable: ${next.disabledReason}` : decision.label;
        const latest = workflow?.recordedAttempts && !workflow.error && workflow.ticketId === ticket.id ? chronologicalReceipts(workflow.receipts).at(-1) : undefined;
        row.fields!.activity = latest ? `${latest.phase} · ${latest.status} (${latest.id})` : workflow?.error ? "Unavailable; refresh workflow receipts" : workflow ? "No validated activity recorded" : "Checking workflow receipts";
        rows.push(row);
      }
    }
    if (!rows.length) rows.push({ text: this.receiptChecks < ticketCount ? "Checking workflow receipts before offering work…" : queue === "all" ? "No tickets recorded. R refresh · h initiatives · b Files." : `No tickets in ${queue}. Choose 8 for all tickets · R refresh · h initiatives.`, tone: "muted" });
    return rows;
  }

  private childRow(ticket: ExplorerTicket, selected: boolean): Row {
    const blockers = ticket.blockedBy.filter(id => !this.tickets.has(id) || !isCompleted(this.tickets.get(id)!));
    return {
      text: "", selected, target: { kind: "ticket", ticket },
      fields: {
        title: ticket.title, identity: ticket.id, type: this.ticketType(ticket), state: ticket.status || "unavailable",
        supporting: recordKind(ticket) === "ticket" && blockers.length ? `Waiting for ${blockers.join(", ")}` : this.workflows.get(ticket.id)?.error ? "Workflow warning · Enter to inspect details" : ticket.ref
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
    return { id: `${this.screen === "initiatives" ? "children" : "graph"}:${this.initiativeId}`, title: `${initiative?.id ?? "Ungrouped"} · Items ${initiative?.ticketIds.length ?? 0}`, rows };
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
    const decision = recoveryDecision(ticket, this.snapshot!, workflow);
    return [
      { text: `${ticket.id} ${ticket.title}`, tone: "accent" },
      { text: `Summary: ${this.descriptionSummary(ticket.body)}`, tone: "muted" },
      { text: `Type: ${this.ticketType(ticket)}` }, { text: `State: ${this.ticketState(ticket)}` },
      { text: `Reference: ${ticket.ref}` }, { text: `Current source: ${workflow?.sourceCommit ?? "not recorded"}` },
      { text: `Next: ${decision.label}` },
      { text: decision.reason, tone: "muted" },
      ...(decision.requiredApproval ? [{ text: "Takeover requires scoped approval after ownership and agent checks.", tone: "warning" as const }] : []),
      { text: workflow?.recordedAttempts ? `Reviews: ${workflow.recordedAttempts.review} · Fixes: ${workflow.recordedAttempts.fix} (validated phase receipts; recorded attempts, not quality or completion)` : "Review/fix receipt counts unavailable until history validation completes.", tone: "muted" },
      { text: "Dependencies:", tone: "accent" }, ...this.neighborhoodRows(), { text: "Receipts:", tone: "accent" },
      ...this.history().map(event => ({ text: `Event: ${event.fields?.receipt_id ?? event.id} · Execution: ${event.fields?.status ?? "unavailable"}${event.fields?.verdict ? ` · Verdict: ${event.fields.verdict}` : ""}` })),
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
    const workflow = this.workflows.get(ticket.id);
    if (!workflow) return "CHECKING";
    const cached = this.ticketStates.get(ticket.id);
    if (cached) return cached;
    const decision = recoveryDecision(ticket, this.snapshot!, workflow);
    const state = decision.mode === "complete" ? "DONE"
      : decision.action === "start" ? "READY"
        : decision.action?.toUpperCase() ?? (decision.mode === "observe" ? "ACTIVE" : "BLOCKED");
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
    return { screen: this.screen === "actions" ? this.returnScreen : this.screen, initiativeId: this.initiativeId, ticketId: this.ticketId, receiptId: this.receiptId, eventDetail: this.eventDetail, queue: this.queue, focus: this.screen === "actions" ? this.returnFocus : this.focus, offsets: [...this.offsets], homeIndex: this.homeIndex, queueIndex: this.queueIndex, itemOrigin: this.itemOrigin, reader: this.reader, queueSelections: [...this.queueSelections], initiativeMemory: this.initiativeMemory, childSelections: [...this.childSelections] };
  }

  private focusedPane(panes: Pane[]): Pane | undefined {
    return this.focus === "neighborhood" ? panes.find(pane => pane.id.startsWith("neighbors:")) : this.focus === "detail" ? panes[panes.length - 1] : this.screen === "receipts" ? panes.find(pane => pane.id.startsWith("receipts:")) ?? panes[0] : panes[0];
  }

  private renderPane(pane: Pane, width: number, height: number): string[] {
    const expanded = pane.rows.flatMap(row => {
      const lines = row.event ? this.eventLines(row.event, Math.max(1, width - 1))
        : row.fields ? this.fieldLines(row.fields, Math.max(1, width - 1))
        : wrapTextWithAnsi(this.clean(row.text), Math.max(1, width - 1));
      const expanded = lines.map((text, index) => ({ ...row, text, styled: !!(row.event || row.fields), first: index === 0 }));
      const spaced = row.fields || row.event || row.selected || pane.id.startsWith("ticket:") || pane.id.startsWith("receipt:");
      return spaced ? [...expanded, { text: "", styled: false, first: false }] : expanded;
    });
    const selected = expanded.findIndex(row => row.selected);
    let offset = this.offsets.get(pane.id) ?? 0;
    const selectedRow = expanded[selected];
    const selection = selectedRow?.receiptId ?? (selectedRow?.target?.kind === "ticket" ? selectedRow.target.ticket.ref : selectedRow?.target?.kind === "initiative" ? selectedRow.target.initiative.ref : String(selected));
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
      const text = this.pad(`${row.selected && row.first ? focused ? ">" : "◇" : " "}${row.styled ? row.text : this.options.theme.fg(row.tone ?? "text", row.text)}`, width);
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
    if (fields.next) lines.push(...wrapTextWithAnsi(this.clean(`Next: ${fields.next}`), width).map(line => th.fg("accent", line)));
    if (fields.activity) lines.push(...wrapTextWithAnsi(this.clean(`Recorded: ${fields.activity}`), width).map(line => th.fg("muted", line)));
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
