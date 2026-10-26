import type { Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { actionChoices } from "./actions";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./data";
import { isCompleted, type Exec, type ExplorerActionChoice, type ExplorerInitiative, type ExplorerSessionRequest, type ExplorerSnapshot, type ExplorerTarget, type ExplorerTicket, type SharedAgentContext, type TicketWorkflow } from "./model";
import { safeTerminalText } from "./terminal-text";
import type { ExplorerEvent } from "./model";

type Screen = "home" | "initiatives" | "tickets" | "receipts" | "actions";
type Queue = "ready" | "review" | "blocked" | "all";
type Tone = "text" | "muted" | "accent" | "warning" | "error";
type Row = { text: string; tone?: Tone; selected?: boolean; target?: ExplorerTarget; receiptId?: string };
type Pane = { id: string; title: string; rows: Row[] };

export interface ExplorerNavigation {
  screen: Screen;
  initiativeId?: string;
  ticketId?: string;
  receiptId?: string;
  queue: Queue;
  focus: "list" | "detail" | "neighborhood";
  offsets: [string, number][];
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
  private neighborhoodIndex = 0;
  private focus: "list" | "detail" | "neighborhood" = "list";
  private returnFocus: "list" | "detail" | "neighborhood" = "list";
  private offsets: Map<string, number>;
  private loading = false;
  private error = "";
  private notice = "";
  private generation = 0;
  private disposed = false;
  private receiptChecks = 0;
  private lastWidth = 120;

  constructor(private options: ExplorerOptions) {
    const navigation = options.navigation;
    this.screen = navigation?.screen ?? "home";
    this.queue = navigation?.queue ?? "ready";
    this.initiativeId = navigation?.initiativeId;
    this.ticketId = navigation?.ticketId;
    this.receiptId = navigation?.receiptId;
    this.focus = navigation?.focus ?? "list";
    this.offsets = new Map(navigation?.offsets ?? []);
  }

  async load(): Promise<void> {
    const generation = ++this.generation;
    this.loading = true;
    this.error = "";
    this.notice = "";
    this.workflows.clear();
    this.ticketStates.clear();
    this.scopes.clear();
    this.receiptChecks = 0;
    this.options.requestRender();
    try {
      const snapshot = await (this.options.loadSnapshot ?? loadExplorerSnapshot)(this.options.context, this.options.exec);
      if (this.disposed || generation !== this.generation) return;
      this.snapshot = snapshot;
      this.tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
      for (const initiative of snapshot.initiatives) {
        const visited = new Set<string>();
        const ids: string[] = [];
        const visit = (id: string) => {
          if (visited.has(id)) return;
          visited.add(id);
          for (const blocker of this.tickets.get(id)?.blockedBy ?? []) visit(blocker);
          ids.push(id);
        };
        for (const id of initiative.ticketIds) visit(id);
        this.scopes.set(initiative.id, ids);
      }
      if (!snapshot.initiatives.some(initiative => initiative.id === this.initiativeId)) this.initiativeId = snapshot.initiatives[0]?.id;
      if (!this.ticketId || !this.tickets.has(this.ticketId)) this.ticketId = this.initiative()?.ticketIds[0] ?? snapshot.tickets[0]?.id;
      this.loading = false;
      this.options.requestRender();
      let index = 0;
      const worker = async () => {
        while (index < snapshot.tickets.length && generation === this.generation && !this.disposed) {
          const ticket = snapshot.tickets[index++];
          let workflow: TicketWorkflow;
          try {
            workflow = await (this.options.loadWorkflow ?? loadTicketWorkflow)(this.options.context, ticket, this.options.exec);
          } catch (error) {
            workflow = { ticketId: ticket.id, receipts: [], error: error instanceof Error ? error.message : String(error) };
          }
          if (this.disposed || generation !== this.generation) return;
          this.workflows.set(ticket.id, workflow);
          this.receiptChecks++;
          this.options.requestRender();
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, snapshot.tickets.length) }, worker));
      if (this.disposed || generation !== this.generation) return;
      const home = this.homeRows();
      const saved = home.findIndex(row => row.target?.kind === "ticket" && row.target.ticket.id === this.ticketId);
      this.homeIndex = saved >= 0 ? saved : Math.max(0, Math.min(this.homeIndex, home.length - 1));
    } catch (error) {
      if (this.disposed || generation !== this.generation) return;
      this.snapshot = undefined;
      this.tickets.clear();
      this.error = error instanceof Error ? error.message : String(error);
      this.loading = false;
    }
    if (!this.disposed) this.options.requestRender();
  }

  dispose(): void {
    this.disposed = true;
    ++this.generation;
  }

  handleInput(data: string): void {
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
      this.screen = "home";
      this.focus = "list";
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "escape") || matchesKey(data, "left") || matchesKey(data, "backspace")) {
      const compact = this.lastWidth < 70 || this.options.height() < 16;
      let focus: "list" | "detail" | "neighborhood" = "list";
      if (this.screen === "actions") { this.screen = this.returnScreen; focus = this.returnFocus; }
      else if (compact && this.focus === "detail" && this.screen !== "home") focus = "list";
      else if (this.screen === "receipts") { this.screen = "tickets"; focus = compact ? "detail" : "list"; }
      else if (this.screen === "tickets") this.screen = "initiatives";
      else if (this.screen === "initiatives") this.screen = "home";
      else { this.options.done(undefined); return; }
      this.focus = focus;
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (this.loading || this.error || !this.snapshot) return;
    if (this.screen === "home") {
      const filter = ([["5", "ready"], ["6", "review"], ["7", "blocked"], ["8", "all"]] as const).find(([key]) => matchesKey(data, key))?.[1];
      if (filter) {
        this.queue = filter;
        this.homeIndex = 0;
        this.options.requestRender();
        return;
      }
    }
    if (matchesKey(data, "tab")) {
      if (this.panes().length < 2) this.focus = "list";
      else if (this.focus === "list") this.focus = "detail";
      else if (this.focus === "detail" && this.screen === "receipts" && this.neighborhoodRows().length) this.focus = "neighborhood";
      else this.focus = "list";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "pageUp") || matchesKey(data, "pageDown")) {
      const panes = this.panes();
      const pane = this.focusedPane(panes);
      const up = matchesKey(data, "pageUp");
      const compact = this.lastWidth < 70 || this.options.height() < 16;
      const step = Math.max(1, Math.min(30, this.options.height() - (compact ? 4 : 8)));
      if (compact && this.focus === "list" && pane && (pane.id.startsWith("ticket:") || pane.id.startsWith("receipt:"))) {
        this.offsets.set(pane.id, Math.max(0, (this.offsets.get(pane.id) ?? 0) + (up ? -step : step)));
      } else {
        for (let index = 0; index < step; index++) this.handleInput(up ? "\x1b[A" : "\x1b[B");
      }
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
        const target = this.homeRows()[this.homeIndex]?.target;
        if (target?.kind === "ticket") this.ticketId = target.ticket.id;
      } else if (this.screen === "initiatives") {
        const index = this.snapshot.initiatives.findIndex(initiative => initiative.id === this.initiativeId);
        this.initiativeId = this.snapshot.initiatives[Math.max(0, Math.min(this.snapshot.initiatives.length - 1, index + delta))]?.id;
        if (!this.initiative()?.ticketIds.includes(this.ticketId ?? "")) this.ticketId = this.initiative()?.ticketIds[0];
      } else if (this.screen === "tickets") {
        const ids = this.scopes.get(this.initiativeId ?? "") ?? [];
        this.ticketId = ids[Math.max(0, Math.min(ids.length - 1, ids.indexOf(this.ticketId ?? "") + delta))];
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
      if (compact && this.focus === "list" && (this.screen === "tickets" || this.screen === "receipts")) {
        this.focus = "detail";
        this.options.requestRender();
        return;
      }
      let focus: "list" | "detail" | "neighborhood" = this.focus;
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
        if (target?.kind === "initiative") { this.initiativeId = target.initiative.id; this.screen = "initiatives"; focus = "list"; }
        if (target?.kind === "ticket") {
          this.ticketId = target.ticket.id;
          this.initiativeId = this.snapshot.initiatives.find(initiative => initiative.ticketIds.includes(target.ticket.id))?.id;
          this.screen = "tickets";
          focus = compact ? "detail" : "list";
        }
      } else if (this.screen === "initiatives" && this.ticket()) {
        this.screen = "tickets";
        focus = "list";
      } else if (this.screen === "tickets") {
        this.screen = "receipts";
        focus = "list";
        if (!this.history().some(receipt => receipt.id === this.receiptId)) this.receiptId = this.history()[0]?.id;
      }
      this.focus = focus;
      this.notice = "";
      this.options.requestRender();
      return;
    }
    if (matchesKey(data, "a") && this.screen !== "actions") {
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
    const th = this.options.theme;
    const inner = Math.max(1, width - 2);
    const compact = width < 70 || this.options.height() < 16;
    const height = Math.max(5, this.options.height());
    const bodyHeight = Math.max(1, Math.min(30, height - (compact ? 4 : 8)));
    let panes = this.panes();
    if (compact && panes.length > 1) {
      panes = [this.focusedPane(panes) ?? panes[panes.length - 1]];
    }
    const proportions = panes.length === 3 ? [0.22, 0.27, 0.51] : panes.length === 2 ? [0.34, 0.66] : [1];
    const available = inner - Math.max(0, panes.length - 1);
    const sizes = proportions.map((proportion, index) => index === panes.length - 1 ? available - proportions.slice(0, index).reduce((sum, part) => sum + Math.floor(available * part), 0) : Math.floor(available * proportion));
    const rendered = panes.map((pane, index) => this.renderPane(pane, Math.max(1, sizes[index]), bodyHeight));
    const join = (parts: string[]) => parts.join(th.fg("border", "│"));
    const headers = panes.map((pane, index) => this.pad(`${this.focusedPane(panes)?.id === pane.id ? ">" : " "} ${pane.title}`, sizes[index]));
    const body = Array.from({ length: bodyHeight }, (_, row) => join(rendered.map(lines => lines[row] ?? "")));
    const target = this.target();
    let initiativeId = this.initiativeId;
    let ticketId = this.screen === "initiatives" ? undefined : this.ticketId;
    if (this.screen === "actions") {
      if (target?.kind === "ticket") {
        ticketId = target.ticket.id;
        if (!this.initiative()?.ticketIds.includes(ticketId)) initiativeId = this.snapshot?.initiatives.find(initiative => initiative.ticketIds.includes(target.ticket.id))?.id;
      } else {
        initiativeId = target?.initiative.id;
        ticketId = undefined;
      }
    }
    const breadcrumb = ["Home", ...(this.screen === "home" ? [] : [initiativeId, ticketId, this.screen === "receipts" ? this.receiptId : undefined])].filter(Boolean).join(" > ");
    const checks = this.snapshot && this.receiptChecks < this.snapshot.tickets.length ? `Checking receipts ${this.receiptChecks}/${this.snapshot.tickets.length}` : "";
    const status = this.notice || this.error || (this.loading ? "Loading tracker…" : checks) || (target?.kind === "ticket" ? `${target.ticket.ref} · ${this.ticketState(target.ticket)}` : target?.kind === "initiative" ? target.initiative.ref : "No selection");
    const keys = this.screen === "home" ? "5 ready 6 review 7 blocked 8 all  Enter open  a actions  R refresh  q close" : "← back → drill ↑↓ move Shift+Tab panes PgUp/Dn scroll a actions h home R reload q close";
    if (compact) return [th.fg("accent", truncateToWidth(this.clean(breadcrumb), width)), join(headers), ...body, th.fg(this.error ? "error" : "muted", truncateToWidth(this.clean(status), width)), th.fg("muted", truncateToWidth(keys, width))].map(line => truncateToWidth(line, width));
    const frame = (text: string) => th.fg("border", "│") + this.pad(text, inner) + th.fg("border", "│");
    return [th.fg("border", `╭${"─".repeat(inner)}╮`), frame(th.fg("accent", ` Shared context · ${this.clean(breadcrumb)}`)), frame(join(headers)), th.fg("border", `├${"─".repeat(inner)}┤`), ...body.map(frame), th.fg("border", `├${"─".repeat(inner)}┤`), frame(th.fg(this.error ? "error" : "muted", ` ${this.clean(status)}`)), frame(th.fg("muted", ` ${keys}`)), th.fg("border", `╰${"─".repeat(inner)}╯`)];
  }

  private panes(): Pane[] {
    if (this.loading || this.error || !this.snapshot) return [{ id: "state", title: "Shared context", rows: [{ text: this.loading ? "Loading tracker records…" : this.error || "No snapshot loaded.", tone: this.error ? "error" : "muted" }, { text: "R reload · b browse files · q close", tone: "muted" }] }];
    if (this.screen === "actions") return [{ id: "actions", title: "Open a fresh chat · commands are staged, not auto-sent", rows: this.choices().map((choice, index) => ({ text: `[${choice.key}] ${choice.label}${choice.disabledReason ? ` — ${choice.disabledReason}` : ""}`, tone: choice.disabledReason ? "warning" : "text", selected: index === this.actionIndex })) }];
    if (this.screen === "home") return [{ id: `home:${this.queue}`, title: `Ready-work Home · ${this.queue}`, rows: this.homeRows().map((row, index) => ({ ...row, selected: index === this.homeIndex })) }];
    if (this.screen === "initiatives") return [{ id: "initiatives", title: "Initiatives / collections", rows: this.snapshot.initiatives.map(initiative => ({ text: `[${initiative.group ? "Collection" : "Initiative"}] ${initiative.id} ${initiative.title}`, selected: initiative.id === this.initiativeId })) }, this.graphPane()];
    if (this.screen === "tickets") return [this.graphPane(), { id: `ticket:${this.ticketId}`, title: "Ticket / dependencies / receipts", rows: this.ticketRows() }];
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
    }, { id: `receipt:${this.ticketId}:${event?.id ?? "none"}`, title: "Receipt / exact evidence", rows: receipt ? [
      { text: `Ticket: ${this.ticket()?.ref ?? ""}`, tone: "accent" }, { text: `Receipt: ${receipt.id}` }, { text: `Phase: ${receipt.phase} · ${receipt.status}${receipt.verdict ? ` · ${receipt.verdict}` : ""}` }, { text: `Parent: ${receipt.parentReceipt ?? "none"}` }, { text: `Commit: ${receipt.sourceCommit}` }, { text: `Tree: ${receipt.sourceTree}` }, { text: `Current: ${workflow?.sourceCommit ?? "unavailable"}` }, { text: `Current tree: ${workflow?.sourceTree ?? "unavailable"}` }, { text: workflow?.error ?? (receipt.sourceCommit === workflow?.sourceCommit && receipt.sourceTree === workflow?.sourceTree ? "Source: matched" : "Source: stale / unavailable"), tone: workflow?.error || receipt.sourceCommit !== workflow?.sourceCommit || receipt.sourceTree !== workflow?.sourceTree ? "warning" : "accent" }, { text: `Workspace: ${receipt.workspacePath}` }, { text: `Branch: ${receipt.sourceBranch} · base ${receipt.baseBranch}` }, { text: `Session: ${receipt.sessionId ?? "not recorded"}` }, { text: `Created: ${receipt.createdAt}` }, { text: `Reference: ${receipt.ref}` }, { text: "Outputs:", tone: "accent" }, ...receipt.outputs.map(output => ({ text: `  ${output}` })), { text: "Receipt fields:", tone: "accent" }, ...JSON.stringify(receipt.fields, null, 2).split("\n").map(text => ({ text })), ...receipt.body.split(/\r?\n/).map(text => ({ text }))
    ] : event ? [
      { text: `Reference: ${event.ref}`, tone: "accent" },
      { text: event.error ?? workflow?.error ?? "Unvalidated event.", tone: "error" },
      { text: "Not valid workflow evidence. Worktree transitions remain blocked.", tone: "warning" },
      { text: "Recorded fields:", tone: "accent" },
      ...JSON.stringify(event.fields ?? null, null, 2).split("\n").map(text => ({ text })),
      ...(event.body ?? "").split(/\r?\n/).map(text => ({ text })),
    ] : [{ text: workflow?.error ?? (workflow ? "No receipt exists for this ticket." : "Loading workflow…"), tone: workflow?.error ? "error" : "muted" }, { text: "Chat output is not workflow evidence." }] }];
  }

  private homeRows(): Row[] {
    if (!this.snapshot) return [];
    const rows: Row[] = [];
    for (const ticket of this.snapshot.tickets) {
      if (this.queue !== "all" && this.receiptChecks < this.snapshot.tickets.length) continue;
      const state = this.ticketState(ticket);
      const inQueue = this.queue === "all" || this.queue === "ready" && state === "READY" || this.queue === "review" && ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(state) || this.queue === "blocked" && ["BLOCKED", "ERROR", "UNKNOWN"].includes(state);
      if (!inQueue) continue;
      const blockers = ticket.blockedBy.filter(id => !this.tickets.has(id) || !isCompleted(this.tickets.get(id)!));
      const detail = blockers.length ? ` · waiting for ${blockers.join(" + ")}` : this.workflows.get(ticket.id)?.error ? ` · ${this.workflows.get(ticket.id)!.error}` : "";
      rows.push({ text: `[${this.ticketType(ticket)}] ${ticket.id} [${state}] ${ticket.title}${detail}`, target: { kind: "ticket", ticket }, tone: state === "ERROR" ? "warning" : "text" });
    }
    if (!rows.length) rows.push({ text: this.receiptChecks < this.snapshot.tickets.length ? "Checking workflow receipts before offering work…" : `No tickets in ${this.queue}. Choose 4 for all tickets.`, tone: "muted" });
    for (const initiative of this.snapshot.initiatives) rows.push({ text: `+ [${initiative.group ? "Collection" : "Initiative"}] ${initiative.id} ${initiative.title} (${initiative.ticketIds.length} tickets)`, target: { kind: "initiative", initiative }, tone: "accent" });
    return rows;
  }

  private graphPane(): Pane {
    const rows: Row[] = [{ text: "A → B: B depends on A", tone: "muted" }];
    const ids = this.scopes.get(this.initiativeId ?? "") ?? [];
    for (const id of ids) {
      const ticket = this.tickets.get(id);
      if (!ticket) continue;
      rows.push({ text: `[${this.ticketType(ticket)}] ${id} [${this.ticketState(ticket)}] ${ticket.title}`, selected: this.screen === "tickets" && id === this.ticketId });
      if (ticket.blockedBy.length) rows.push({ text: `  ← ${ticket.blockedBy.join(" + ")}`, tone: "muted" });
      const dependents = ids.filter(other => this.tickets.get(other)?.blockedBy.includes(id));
      if (dependents.length) rows.push({ text: `  → ${dependents.join(", ")}`, tone: "muted" });
    }
    if (rows.length === 1) rows.push({ text: "No tickets in this initiative.", tone: "muted" });
    return { id: `graph:${this.initiativeId}`, title: "Tickets / dependency graph", rows };
  }

  private ticketRows(): Row[] {
    const ticket = this.ticket();
    if (!ticket) return [{ text: "Select a ticket.", tone: "muted" }];
    const workflow = this.workflow();
    return [{ text: `${ticket.id} ${ticket.title}`, tone: "accent" }, { text: `Type: ${this.ticketType(ticket)}` }, { text: `State: ${this.ticketState(ticket)}` }, { text: `Reference: ${ticket.ref}` }, { text: `Current source: ${workflow?.sourceCommit ?? "not recorded"}` }, { text: "Dependencies:", tone: "accent" }, ...this.neighborhoodRows(), { text: "Receipts:", tone: "accent" }, ...(workflow?.receipts.map(receipt => ({ text: `${receipt.id} ${receipt.phase} [${receipt.verdict ?? receipt.status}] @${receipt.sourceCommit}` })) ?? []), ...(workflow?.error ? [{ text: workflow.error, tone: "warning" as const }] : []), { text: workflow ? "→ inspect receipts · a actions" : "Checking receipts…", tone: "muted" }, { text: "Ticket:", tone: "accent" }, ...ticket.body.split(/\r?\n/).map(text => ({ text }))];
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
    return target && this.snapshot ? actionChoices(target, this.snapshot, target.kind === "ticket" ? this.workflows.get(target.ticket.id) : undefined, this.options.commands()) : [];
  }

  private chooseAction(choice: ExplorerActionChoice | undefined): void {
    const target = this.target();
    if (!choice || !target || !this.snapshot) return;
    if (choice.disabledReason) { this.notice = choice.disabledReason; this.options.requestRender(); return; }
    this.options.done({ kind: "session", request: { action: choice.action, target, snapshot: this.snapshot, ...(target.kind === "ticket" ? { workflow: this.workflows.get(target.ticket.id) } : {}), prompt: "" }, navigation: this.navigation() });
  }

  private ticketType(ticket: ExplorerTicket): string {
    const type = ticket.documentType;
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Ticket · type unspecified";
  }

  private ticketState(ticket: ExplorerTicket): string {
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
    if (this.screen === "initiatives" || this.screen === "actions" && this.returnScreen === "initiatives") {
      const initiative = this.initiative();
      return initiative ? { kind: "initiative", initiative } : undefined;
    }
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
    return this.ticketId ? this.workflows.get(this.ticketId) : undefined;
  }

  private navigation(): ExplorerNavigation {
    return { screen: this.screen === "actions" ? this.returnScreen : this.screen, initiativeId: this.initiativeId, ticketId: this.ticketId, receiptId: this.receiptId, queue: this.queue, focus: this.screen === "actions" ? this.returnFocus : this.focus, offsets: [...this.offsets] };
  }

  private focusedPane(panes: Pane[]): Pane | undefined {
    return this.focus === "neighborhood" ? panes.find(pane => pane.id.startsWith("neighbors:")) : this.focus === "detail" ? panes[panes.length - 1] : this.screen === "receipts" ? panes.find(pane => pane.id.startsWith("receipts:")) ?? panes[0] : panes[0];
  }

  private renderPane(pane: Pane, width: number, height: number): string[] {
    const expanded = pane.rows.flatMap(row => {
      const text = this.clean(row.text);
      const contentWidth = Math.max(1, width - 1);
      return (row.selected || pane.id.startsWith("graph:") || pane.id === "initiatives" || pane.id.startsWith("home:") || pane.id === "actions" ? [truncateToWidth(text, contentWidth, "…")] : wrapTextWithAnsi(text, contentWidth)).map(text => ({ ...row, text }));
    });
    const selected = expanded.findIndex(row => row.selected);
    let offset = this.offsets.get(pane.id) ?? 0;
    if (selected >= 0 && this.focus !== "detail") {
      if (selected < offset) offset = selected;
      if (selected >= offset + height) offset = selected - height + 1;
    }
    offset = Math.max(0, Math.min(offset, Math.max(0, expanded.length - height)));
    this.offsets.set(pane.id, offset);
    return Array.from({ length: height }, (_, index) => {
      const row = expanded[index + offset];
      if (!row) return " ".repeat(width);
      const text = this.pad(`${row.selected ? ">" : " "}${row.text}`, width);
      return row.selected ? this.options.theme.bg("selectedBg", this.options.theme.fg("text", text)) : this.options.theme.fg(row.tone ?? "text", text);
    });
  }

  private clean(value: string): string {
    return safeTerminalText(value);
  }

  private pad(value: string, width: number): string {
    const text = truncateToWidth(value, Math.max(1, width), "…");
    return text + " ".repeat(Math.max(0, width - visibleWidth(text)));
  }
}
