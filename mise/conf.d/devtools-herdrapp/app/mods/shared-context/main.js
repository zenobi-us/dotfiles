// Core runs complete target-side queries; retained UI surfaces own their displayed state.
import { View, div } from "gpui-kit";
import { h_flex, v_flex, TextView, Scrollbar, h_resizable, resizable_panel } from "gpui-base";
import { props, run, nextCommand, theme } from "herdr";
import { createQueryClient } from "./data.js";
import { beginLoading, updateLoading, stopLoading } from "./loading.js";
import { initRetainedViews, notifyQueryStatus, releaseRetainedViews } from "./retained-views.js";
import { currentLocation, initObservation, scheduleObservation, startRefreshResources, stopRefreshResources, updateLocalWatches } from "./refresh.js";
import { targetKey, RefreshQueue } from "./refresh-model.js";
import { loadPreferences, DEFAULTS } from "./preferences.js";
import { dependencyRows, revealPath, itemType } from "./tree.js";
import { button, icon, note, select, typeColor, typeIcon } from "./ui.js";
import { graphView, initGraphMenu, renderGraphMenu } from "./graph-view.js";
import { compactHeader } from "./header.js";
import { initHeaderControls, clearHeaderControls, renderHeaderReason } from "./header-controls.js";
import { initiativeProgress } from "./progress-model.js";
import { initiativeProgressRow } from "./progress.js";
import { workflowActivity } from "./activity-model.js";
import { initActionMenus } from "./action-menu.js";
import { invalidateAction } from "./action.js";
import { observeAgentLaunch } from "./agents.js";
import { DEFAULT_FILTERS } from "./filter-model.js";
import { initTreeFilters, treeFilters, closeTreeFilters } from "./tree-filters.js";
import { agentDots } from "./agent-activity.js";
import { agentActivitySummary } from "./agent-model.js";

import { openMetadata, initMetadata, renderMetadata } from "./metadata.js";
import { openSettings, initSettings, renderSettings } from "./settings.js";
function statusColor(value, t) { return value === "READY" ? t.ansi4 : value === "DONE" ? t.ansi2 : ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(value) ? t.ansi3 : ["ERROR", "BLOCKED", "UNKNOWN"].includes(value) ? t.blocked : t.dim; }
function stateIcon(state) { return state === "READY" ? "▷" : state === "DONE" ? "✓" : ["BLOCKED", "ERROR", "UNKNOWN"].includes(state) ? "⊘" : "◉"; }

export default class SharedContext extends View {
  init(_given, cx) {
    this.closed = false;
    this.revision = 0;
    this.client = createQueryClient(cx);
    this.given = { ...(_given ?? props() ?? {}) };
    this.mode = this.given.mode ?? "tracker";
    if (this.mode === "settings") { initSettings(this, cx); return; }
    if (this.mode === "graph-actions") { initGraphMenu(this, cx); return; }
    this.focus = cx.focus_handle();
    initMetadata(this, cx);
    initHeaderControls(this, cx);
    this.selectFocus = { "context-store": cx.focus_handle(), "context-preset": cx.focus_handle() };
    initTreeFilters(this, cx);
    this.recordTab = "description"; this.detailError = "";
    this.activity = workflowActivity(); this.activityFilter = "all";
    this.recordTabFocus = { description: cx.focus_handle(), activity: cx.focus_handle(), lineage: cx.focus_handle() };
    this.graphInitiative = null;
    this.preferences = DEFAULTS; this.preferencesReady = false;
    this.key = ""; this.revision = 0; this.detailRevision = 0; this.fileRevision = 0;
    this.refreshQueue = new RefreshQueue(); this.stale = false;
    this.pendingQueries = new Set(); this.lastQuery = null;
    this.viewStorageKey = `shared-context:${this.mode}:views:v1`;
    // Settings reload the mod. Keep view state, but revalidate record IDs against the next snapshot.
    this.saved = new Map(JSON.parse(localStorage.getItem(this.viewStorageKey) ?? "[]").map(([key, value]) => [key, { ...value, collapsed: new Set(value.collapsed), fileFolders: new Set(value.fileFolders) }]));
    this.collapsed = new Set(); this.filters = { ...DEFAULT_FILTERS }; this.selected = null; this.drawer = "peek";
    this.progress = new Map();
    this.fileFolders = new Set(); this.fileEntries = new Map(); this.filePending = new Set(); this.fileSelection = null;
    this.error = ""; this.loading = false; this.store = "repository"; this.preset = ""; this.bodySize = { width: 408, height: 500 };
    this.graphViews = new Map();
    initRetainedViews(this, cx);
    if (this.mode === "tracker") initActionMenus(this.retainedModel, cx);
    initObservation(this, cx);
    cx.spawn(async cx => {
      try { this.preferences = await loadPreferences(); this.preferencesReady = true; this.follow(cx); }
      catch (error) { this.error = String(error.message ?? error); }
      this.changed(cx);
    });
    cx.spawn(async cx => {
      while (!this.closed) {
        const command = await nextCommand();
        if (this.closed) return;
        if (command === "refresh") this.refresh(cx);
        if (command === "metadata") openMetadata(this, cx);
        if (command === "focus") this.focus.focus();
        if (command === "expand") { this.drawer = "expanded"; this.changed(cx); }
        if (command === "collapse") { this.drawer = "peek"; this.changed(cx); }
        if (command === "close") { if (this.metadataOpen) { this.metadataOpen = false; this.focus.focus(); } else this.drawer = "closed"; this.changed(cx); }
      }
    });
  }

  async close(cx) {
    this.closed = true;
    stopRefreshResources(this);
    invalidateAction(this);
    stopLoading(this);
    this.revision++; this.detailRevision++; this.fileRevision++;
    this.actionInput?.release();
    releaseRetainedViews(this);
    await this.client?.release();
  }

  changed(_cx) {
    this.requestRender?.();
  }
  current(revision) {
    return !this.closed && revision === this.revision && targetKey(currentLocation(this.given)) === this.key;
  }


  remember() {
    if (!this.viewKey) return;
    this.saved.set(this.viewKey, { selected: this.selected, filters: { ...this.filters }, collapsed: new Set(this.collapsed), drawer: this.drawer, fileSelection: this.fileSelection, fileFolders: new Set(this.fileFolders) });
    if (this.saved.size > 16) this.saved.delete(this.saved.keys().next().value);
    localStorage.setItem(this.viewStorageKey, JSON.stringify([...this.saved].map(([key, value]) => [key, { ...value, collapsed: [...value.collapsed], fileFolders: [...value.fileFolders] }])));
  }

  follow(cx) {
    if (!this.preferencesReady || this.closed) return;
    const next = currentLocation(this.given), key = targetKey(next);
    if (key === this.key) { this.where = next; return; }
    const previous = this.where;
    this.remember();
    stopRefreshResources(this);
    this.revision++; this.detailRevision++; this.fileRevision++;
    if (previous) {
      const cleanup = this.client.release(previous);
      cx.spawn(async () => { await cleanup; });
    }
    this.key = key; this.where = next;
    this.refreshQueue = new RefreshQueue();
    invalidateAction(this);
    clearHeaderControls(this);
    this.context = null; this.snapshot = null; this.detail = null; this.filePreview = null; this.viewKey = null;
    this.selected = null;
    this.fileEntries = new Map(); this.filePending = new Set();
    this.fileFolders = new Set(); this.fileSelection = null;
    this.pendingQueries.clear(); this.lastQuery = null;
    this.metadataOpen = false; this.liveActivity = new Map();
    this.progress = new Map();
    this.recordTab = "description"; this.detailError = "";
    this.activity = workflowActivity(); this.activityFilter = "all";
    this.actionOpen = null; this.recordActionsOpen = null; this.actionError = "";
    this.openSelect = null; this.selectKeyHandlers = null; this.filtersOpen = false; this.graphInitiative = null; this.graphViews = new Map();
    stopLoading(this);
    this.loading = false; this.error = ""; this.stale = false;
    this.changed(cx);
    if (!next.cwd) { this.error = "Select a repository folder."; return; }
    this.context = this.client.peek("context", next);
    if (this.context) this.restoreView(this.context);
    if (this.mode === "context" && this.context?.ready) {
      for (const collection of this.context.collections) {
        if (!collection.path) continue;
        const prefix = `${collection.id}:`;
        for (const folder of this.fileFolders) {
          if (!folder.startsWith(prefix)) continue;
          const entries = this.client.peek("directory", next, { collection: collection.id, path: folder.slice(prefix.length) });
          if (entries) this.fileEntries.set(folder, entries);
        }
      }
      if (this.fileSelection) this.filePreview = this.client.peek("file", next, this.fileSelection);
    }
    this.snapshot = this.client.peek("tracker", next, { tree: true });
    if (this.snapshot) this.progress = initiativeProgress(this.snapshot);
    if (this.mode === "tracker" && this.context?.ready && this.selected && this.snapshot) {
      const records = this.selected.kind === "initiative" ? this.snapshot.initiatives : this.snapshot.tickets;
      if (records.some(record => record.id === this.selected.id)) {
        this.detail = this.client.peek("detail", next, { id: this.selected.id, kind: this.selected.kind });
        this.activity = workflowActivity(this.detail?.workflow);
      } else this.selected = null;
    }
    if (this.context || this.snapshot) this.stale = true;
    this.changed(cx);
    startRefreshResources(this, cx);
    this.targetDirty = true;
  }

  restoreView(context) {
    const viewKey = `${this.where.machine ? `${this.where.machine}:` : ""}${context.identity}:${context.repository}`;
    if (viewKey === this.viewKey) return;
    const saved = this.saved.get(viewKey);
    this.viewKey = viewKey;
    this.detailRevision++; this.fileRevision++;
    this.snapshot = null; this.detail = null; this.filePreview = null;
    this.activity = workflowActivity(); this.event = null;
    this.selected = saved?.selected ?? null; this.filters = { ...DEFAULT_FILTERS, ...saved?.filters }; this.drawer = saved?.drawer ?? "peek";
    this.collapsed = new Set(saved?.collapsed); this.fileFolders = new Set(saved?.fileFolders); this.fileSelection = saved?.fileSelection ?? null;
    this.fileEntries = new Map(); this.filePending = new Set();
  }

  filesAreStale() {
    if (this.context && !this.client.isCurrent("context", this.where)) return true;
    for (const key of this.fileEntries.keys()) {
      const colon = key.indexOf(":");
      if (!this.client.isCurrent("directory", this.where, { collection: key.slice(0, colon), path: key.slice(colon + 1) })) return true;
    }
    return Boolean(this.filePreview && this.fileSelection && !this.client.isCurrent("file", this.where, this.fileSelection));
  }

  trackerIsStale() {
    if (this.context && !this.client.isCurrent("context", this.where)) return true;
    if (this.snapshot && !this.client.isCurrent("tracker", this.where, { tree: true })) return true;
    if (!this.selected || !this.detail) return false;
    const fields = { id: this.selected.id, kind: this.selected.kind };
    return !this.client.isCurrent("detail", this.where, fields) || this.client.peek("detail", this.where, fields) !== this.detail;
  }

  async query(operation, fields, cx, onProgress) {
    const revision = this.revision, where = this.where;
    const request = { operation, target: fields.path ?? fields.id ?? "", startedAt: Date.now(), progress: null, error: "" };
    this.pendingQueries.add(request);
    notifyQueryStatus(this, cx);
    try {
      return await this.client.query(operation, where, fields, progress => {
        if (!this.current(revision)) return;
        request.progress = progress;
        onProgress?.(progress);
        notifyQueryStatus(this, cx);
      });
    } catch (error) {
      request.error = String(error.message ?? error);
      throw error;
    } finally {
      if (this.current(revision)) {
        request.finishedAt = Date.now();
        this.pendingQueries.delete(request);
        this.lastQuery = request;
        notifyQueryStatus(this, cx);
      }
    }
  }

  refresh(cx, automatic = false) {
    if (!this.where?.cwd || this.closed) return;
    if (this.loading && !this.refreshQueue.running) { this.refreshQueue.queued = true; return; }
    if (!this.refreshQueue.request()) return;
    const revision = this.revision, where = this.where, queue = this.refreshQueue;
    this.detailRevision++; this.fileRevision++;
    this.stale = Boolean(this.context || this.snapshot);
    this.loading = true; this.error = "";
    beginLoading(this, cx);
    this.changed(cx);
    cx.spawn(async cx => {
      try {
        const validation = await this.client.validate(where);
        if (!this.current(revision)) return;
        for (const row of validation) {
          if (row.status !== "removed") continue;
          if (row.operation === "file" && this.fileSelection?.collection === row.fields.collection && this.fileSelection?.path === row.fields.path) {
            this.fileRevision++; this.fileSelection = null; this.filePreview = null;
          }
          if (row.operation === "directory") this.forgetFolder(row.fields.collection, row.fields.path);
          if (row.operation === "detail" && this.selected?.id === row.fields.id && this.selected?.kind === row.fields.kind) {
            this.detailRevision++; invalidateAction(this); this.actionOpen = null; this.recordActionsOpen = null;
            this.selected = null; this.detail = null; this.activity = workflowActivity(); this.event = null;
          }
        }
        this.remember();
        const context = await this.query("context", {}, cx);
        if (!this.current(revision)) return;
        this.restoreView(context);
        this.context = context;
        updateLocalWatches(this, cx);
        if (context.ready) { this.openSelect = null; this.selectKeyHandlers = null; }
        this.changed(cx);
        if (!context.ready) { this.stale = false; return; }
        if (this.mode === "context") {
          for (const collection of context.collections) {
            if (!collection.path) continue;
            const prefix = `${collection.id}:`;
            for (const folder of this.fileFolders) if (folder.startsWith(prefix)) this.loadFolder(collection.id, folder.slice(prefix.length), cx);
          }
          if (this.fileSelection) this.openFile(this.fileSelection.collection, this.fileSelection.path, cx);
        } else {
          const snapshot = await this.query("tracker", { tree: true }, cx, progress => {
            if (this.current(revision)) updateLoading(this, progress, cx);
          });
          if (!this.current(revision)) return;
          this.snapshot = { ...snapshot, states: {} };
          this.client.retainDetails(where, snapshot);
          this.progress = initiativeProgress(this.snapshot);
          if (this.selected) {
            const records = this.selected.kind === "initiative" ? snapshot.initiatives : snapshot.tickets;
            const record = records.find(item => item.id === this.selected.id);
            if (record) this.choose(record, this.selected.kind, cx, false);
            else { this.detailRevision++; invalidateAction(this); this.actionOpen = null; this.recordActionsOpen = null; this.selected = null; this.detail = null; this.activity = workflowActivity(); this.event = null; }
          }
          this.stale = this.trackerIsStale();
          this.changed(cx);
          await this.loadDetails(cx, revision, this.snapshot);
        }
        if (!this.current(revision)) return;
        this.stale = this.mode === "context" ? this.filesAreStale() : this.trackerIsStale();
      } catch (error) {
        if (this.current(revision)) {
          this.error = String(error.message ?? error);
          this.stale = this.mode === "tracker" ? Boolean(this.snapshot) : Boolean(this.context);
        }
      } finally {
        if (this.current(revision)) {
          this.loading = false; this.lastRefreshAt = Date.now(); stopLoading(this);
          const again = queue.finish();
          this.changed(cx);
          if (again) this.refresh(cx, automatic);
        }
      }
    });
  }
  async loadDetails(cx, revision, snapshot) {
    const records = [...snapshot.tickets.map(record => ({ record, kind: "ticket" })), ...snapshot.initiatives.filter(record => !record.group).map(record => ({ record, kind: "initiative" }))]
      .map(item => ({ ...item, current: this.client.isCurrent("detail", this.where, { id: item.record.id, kind: item.kind }) }))
      .sort((a, b) => Number(b.current) - Number(a.current));
    this.detailProgress = { completed: 0, total: records.length };
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(4, records.length) }, async () => {
      while (cursor < records.length && this.current(revision) && this.snapshot === snapshot) {
        const { record, kind } = records[cursor++];
        try {
          const detail = await this.query("detail", { id: record.id, kind }, cx);
          if (!this.current(revision) || this.snapshot !== snapshot) return;
          if (kind === "ticket") {
            snapshot.states[record.id] = detail.state;
            this.progress = initiativeProgress(snapshot);
          }
          this.detailProgress.completed++;
          if (this.selected?.id === record.id && this.selected?.kind === kind) {
            this.detail = detail; this.detailLoading = false; this.detailError = "";
            this.activity = workflowActivity(detail.workflow);
          }
        } catch (error) {
          if (!this.current(revision) || this.snapshot !== snapshot) return;
          if (this.selected?.id === record.id && this.selected?.kind === kind) this.detailError = String(error.message ?? error);
        }
        this.changed(cx);
      }
    }));
  }


  choose(record, kind, cx, reveal = true) {
    if (this.drawer === "expanded" && this.selected?.id === record.id && reveal) return;
    const changed = this.selected?.id !== record.id || this.selected?.kind !== kind;
    if (changed) {
      invalidateAction(this);
      clearHeaderControls(this);
      this.recordTab = "description"; this.activityFilter = "all";
      this.actionOpen = null; this.recordActionsOpen = null; this.actionError = "";
    }
    this.selected = { id: record.id, kind, ref: record.ref };
    if (reveal && this.drawer === "closed") this.drawer = "peek";
    if (kind === "ticket" && this.snapshot) {
      const path = dependencyRows(this.snapshot, this.filters, this.collapsed).canonical.get(record.id);
      if (path) revealPath(this.collapsed, path);
    }
    const serial = ++this.detailRevision, revision = this.revision;
    if (changed) { this.detail = null; this.event = null; this.activity = workflowActivity(); }
    this.detailLoading = true; this.detailError = "";
    cx.spawn(async cx => {
      try {
        const detail = await this.query("detail", { id: record.id, kind }, cx);
        if (this.current(revision) && serial === this.detailRevision) {
          this.detail = detail;
          if (kind === "ticket" && this.snapshot) {
            this.snapshot.states ??= {};
            this.snapshot.states[record.id] = detail.state;
            this.progress = initiativeProgress(this.snapshot);
          }
          this.activity = workflowActivity(detail.workflow);
        }
      } catch (error) { if (this.current(revision) && serial === this.detailRevision) this.detailError = String(error.message ?? error); }
      finally { if (this.current(revision) && serial === this.detailRevision) { this.detailLoading = false; this.stale = this.trackerIsStale(); this.changed(cx); } }
    });
    this.remember(); this.changed(cx);
  }

  forgetFolder(collection, path) {
    const key = `${collection}:${path}`, matches = folder => folder === key || folder.startsWith(path ? `${key}/` : key);
    for (const folder of this.fileEntries.keys()) if (matches(folder)) this.fileEntries.delete(folder);
    for (const folder of this.fileFolders) if (matches(folder)) this.fileFolders.delete(folder);
  }

  loadFolder(collection, path, cx) {
    const key = `${collection}:${path}`;
    if (this.filePending.has(key)) return;
    this.filePending.add(key);
    const revision = this.revision;
    cx.spawn(async cx => {
      try {
        const entries = await this.query("directory", { collection, path }, cx);
        if (this.current(revision)) this.fileEntries.set(key, entries);
      } catch (error) {
        if (this.current(revision)) {
          if (error.code === "NOT_FOUND") { this.forgetFolder(collection, path); this.remember(); }
          this.error = String(error.message ?? error);
          this.stale = error.code !== "NOT_FOUND" && this.fileEntries.has(key);
        }
      }
      finally { if (this.current(revision)) { this.filePending.delete(key); this.stale = this.filesAreStale(); this.changed(cx); } }
    });
  }

  toggleFolder(collection, path, cx) {
    const key = `${collection}:${path}`;
    if (this.fileFolders.has(key)) this.fileFolders.delete(key);
    else { this.fileFolders.add(key); this.loadFolder(collection, path, cx); }
    this.remember(); this.changed(cx);
  }

  openFile(collection, path, cx) {
    const changed = this.fileSelection?.collection !== collection || this.fileSelection?.path !== path;
    this.fileSelection = { collection, path }; if (changed) this.filePreview = null;
    this.error = "";
    const revision = this.revision, serial = ++this.fileRevision;
    cx.spawn(async cx => {
      try {
        const preview = await this.query("file", { collection, path }, cx);
        if (this.current(revision) && serial === this.fileRevision) { this.filePreview = preview; this.stale = this.filesAreStale(); }
      } catch (error) {
        if (this.current(revision) && serial === this.fileRevision) {
          if (error.code === "NOT_FOUND") { this.fileSelection = null; this.filePreview = null; this.remember(); }
          this.error = String(error.message ?? error); this.stale = Boolean(this.filePreview);
        }
      }
      if (this.current(revision) && serial === this.fileRevision) this.changed(cx);
    });
    this.remember(); this.changed(cx);
  }

  setup(cx) {
    if (this.loading) return;
    this.loading = true; const revision = this.revision;
    this.changed(cx);
    cx.spawn(async cx => {
      let configured = false;
      try {
        const context = await this.query("setup", { store: this.store, preset: this.preset }, cx);
        if (this.current(revision)) { this.context = context; configured = true; }
      } catch (error) {
        if (this.current(revision)) this.error = String(error.message ?? error);
      } finally {
        if (this.current(revision)) {
          this.loading = false;
          if (configured) this.refresh(cx);
          this.changed(cx);
        }
      }
    });
  }

  onboarding() {
    const t = theme(), configured = Boolean(this.context?.routeSource);
    return v_flex().size_full().items_center().justify_center().p(24).gap(18)
      .child(icon("context", 42).text_color(t.accent))
      .child(div().font_semibold().text_size(19).child(configured ? "Context stores need attention" : "Give this repository context"))
      .child(div().text_size(12).text_color(t.muted).child(configured ? this.context.missing.join("\n") : "Choose where instructions, records, and evidence belong."))
      .child(select(this, "context-store", "Storage", this.store, [{ value: "repository", label: "Repository" }, { value: "shared", label: "Shared store" }], value => { this.store = value; }))
      .child(select(this, "context-preset", "Tracker preset", this.preset, [{ value: "", label: "Keep the configured tracker" }, { value: "hosted-shared", label: "Hosted tracker with shared records" }], value => { this.preset = value; }))
      .child(button("create-context", this.loading ? "Create context…" : "Create context", (_event, cx) => this.setup(cx), { primary: true, disabled: this.loading }))
      .child(div().text_size(11).text_color(t.dim).child("This action creates context files. It does not migrate existing routes."));
  }

  filesView() {
    const t = theme();
    if (this.fileSelection) return v_flex().size_full().min_h(0)
      .child(button("context-files-back", "← Context files", (_event, cx) => { this.fileRevision++; this.fileSelection = null; this.filePreview = null; this.error = ""; this.remember(); cx.notify(); }))
      .child(div().px(14).py(8).text_size(10).text_color(t.dim).child(this.filePreview?.ref ?? this.fileSelection.path))
      .child(div().id("context-file-reader").flex_1().min_h(0).overflow_y_scrollbar().p(14).child(this.filePreview ? TextView.markdown("context-file", this.filePreview.body) : note("Read the file…")));
    const rows = [];
    const folderRows = (collection, path, depth) => {
      for (const entry of this.fileEntries.get(`${collection}:${path}`) ?? []) {
        const open = this.fileFolders.has(`${collection}:${entry.path}`);
        rows.push(button(`context-file:${collection}:${entry.path}`, "", (_event, cx) => entry.directory ? this.toggleFolder(collection, entry.path, cx) : this.openFile(collection, entry.path, cx), { label: entry.name }).w_full().pl(8 + depth * 18).pr(8).rounded(0).bg(t.background).text_color(t.foreground).text_size(13).hover(el => el.bg(t.hover)).child(h_flex().w_full().gap(8).items_center().child(entry.directory ? icon(open ? "down" : "right", 12) : div().w(12)).child(icon(entry.directory ? "folder" : "file")).child(div().flex_1().min_w(0).truncate().child(entry.name))));
        if (entry.directory && open) folderRows(collection, entry.path, depth + 1);
      }
    };
    for (const collection of this.context.collections) {
      const open = this.fileFolders.has(`${collection.id}:`);
      rows.push(button(`context-collection:${collection.id}`, "", (_event, cx) => { if (collection.path) this.toggleFolder(collection.id, "", cx); else { run("layout.select", { stack: "panel-body", child: "tracker" }); run("layout.show", { id: "panel" }); } }, { label: `${collection.label}: ${collection.store ?? collection.adapter}` }).w_full().px(8).rounded(0).bg(t.background).text_color(t.foreground).text_size(13).hover(el => el.bg(t.hover)).child(h_flex().w_full().gap(8).items_center().child(collection.path ? icon(open ? "down" : "right", 12) : div().w(12)).child(icon(collection.path ? "folder" : "tracker")).child(div().flex_1().child(collection.label)).child(div().text_size(10).text_color(t.dim).child(collection.store ?? collection.adapter))));
      if (open && collection.path) folderRows(collection.id, "", 1);
    }
    return v_flex().id("context-files-tree").flex_1().min_h(0).overflow_y_scrollbar().p(6).children(rows);
  }

  treeView(height) {
    const t = theme(), disabled = !(this.preferences.layout === "C2" && this.bodySize.width >= 600) && this.drawer === "expanded" && Boolean(this.selected);
    let forest;
    try { forest = dependencyRows(this.snapshot, this.filters, this.collapsed); }
    catch (error) { return note(String(error.message ?? error), true); }
    const rows = forest.rows.map(row => {
      if (row.type === "section") return div().px(10).pt(16).pb(6).text_size(10).text_color(t.muted).child(row.record.title.toUpperCase());
      const group = row.type === "initiative", type = row.itemType ?? (group ? "initiative" : itemType(row.record));
      const selected = this.selected?.id === row.record.id && this.selected.kind === row.type;
      const liveAgents = this.liveActivity?.get(row.record.ref) ?? [];
      const action = (_event, cx) => {
        if (disabled) return;
        if (row.reference) revealPath(this.collapsed, row.reference);
        this.choose(row.record, group ? "initiative" : "ticket", cx);
      };
      return h_flex().id(`tracker-row:${row.path}`).h(group ? 80 : 60).flex_none().pl(8 + row.depth * 18).pr(8).gap(8).items_center().rounded(0).bg(selected ? t.selected : t.background).hover(el => el.bg(selected ? t.selected : t.hover))
        .child(row.children ? button(`toggle:${row.path}`, "", (_event, cx) => { cx.stop_propagation(); if (disabled) return; if (this.collapsed.has(row.path)) this.collapsed.delete(row.path); else this.collapsed.add(row.path); this.remember(); cx.notify(); }, { label: `${row.expanded ? "Collapse" : "Expand"} ${row.record.title}`, disabled }).w(24).px(0).bg("#00000000").child(icon(row.expanded ? "down" : "right", 12)) : div().w(24).flex_none())
        .child(button(`select:${row.path}`, "", action, { label: `${type}: ${row.record.title}. ${row.record.id}. ${row.state ?? `${row.children} tickets`}${row.stale ? ". Stale mirror record. Sync the Jira mirror." : ""}${row.reference ? ". Shared initiative membership. Open canonical membership." : ""}${liveAgents.length ? `. Live agents: ${agentActivitySummary(liveAgents)}.` : ""}`, disabled, height: group ? 76 : 56 }).flex_1().min_w(0).px(0).bg("#00000000").hover(el => el.bg("#00000000")).text_color(t.foreground).tooltip(`${row.record.title}\n${row.record.id} · ${type}${row.state ? ` · ${row.state}` : ""}${row.stale ? " · stale: not in the last sync" : ""}${liveAgents.length ? `\nLive agents: ${agentActivitySummary(liveAgents)}` : ""}`)
          .child(v_flex().flex_1().min_w(0).gap(5)
            .child(h_flex().gap(7).items_center().min_w(0).child(div().w(16).text_size(16).text_color(typeColor(type, t)).child(typeIcon(type))).child(div().flex_1().min_w(0).truncate().text_size(13).child(row.record.title)))
            .child(h_flex().pl(23).gap(7).items_center().min_w(0).child(div().flex_1().min_w(0).truncate().text_size(10).text_color(t.muted).child(row.record.id))
              .when(liveAgents.length > 0, el => el.child(agentDots(`tree-live-agents:${row.path}`, liveAgents, this.preferences.motion, t)))
              .when(Boolean(row.stale), el => el.child(div().flex_none().text_size(10).text_color(t.ansi3).child("stale")))
              .when(!group, el => el.child(div().flex_none().text_size(10).text_color(row.state ? statusColor(row.state, t) : t.dim).child(row.state ? `${stateIcon(row.state)} ${row.state}` : `${row.children} tickets`)))
              .when(Boolean(row.reference), el => el.child(div().text_color(t.accent).child("↗"))))
            .when(group, el => el.child(v_flex().w_full().min_w(0).pl(23).child(initiativeProgressRow(this.progress.get(row.record.id), t))))))
        .when(group, el => el.child(button(`initiative-graph:${row.record.id}`, "⑂", (_event, cx) => { cx.stop_propagation(); this.openInitiativeGraph(row.record, cx); }, { label: `Open dependency graph for ${row.record.title}`, disabled }).w(28).px(0).text_color(typeColor("initiative", t)).tooltip("Initiative dependency graph")));
    });
    // Resizable panels do not stretch their child to the dragged width.
    return v_flex().id("tracker-tree-frame").w_full().min_w(0).min_h(0).h(height ?? "100%").bg(t.background)
      .child(treeFilters(this))
      .child(v_flex().id("tracker-tree").flex_1().min_w(0).min_h(0).overflow_y_scrollbar().p(8).children(rows.length ? rows : [
        note(this.loading ? "Read tracker records…" : "No records match these filters."),
        button("tracker-empty-reset", "Reset filters", (_event, cx) => this.setFilters({ ...DEFAULT_FILTERS }, cx)),
      ]));
  }

  setFilters(filters, cx) {
    this.filters = filters;
    this.remember();
    this.changed(cx);
  }

  openInitiativeGraph(initiative, cx) {
    this.graphInitiative = initiative.id;
    this.focus.focus(); this.changed(cx);
  }

  initiativeGraphDrawer() {
    const t = theme(), initiative = this.snapshot.initiatives.find(item => item.id === this.graphInitiative);
    if (!initiative) return note("The initiative is unavailable. Close the graph and refresh.", true);
    return v_flex().id("initiative-graph-drawer").absolute().left(0).right(0).bottom(0).h(Math.min(460, this.bodySize.height)).min_h(0).bg(t.chrome).border_t(2).border_color(t.ansi5).p(12).gap(8)
      .child(h_flex().flex_none().gap(8).items_center().child(div().text_color(t.ansi5).child("⑂")).child(div().flex_1().min_w(0).truncate().font_semibold().child(initiative.title)).child(button("initiative-graph-close", "Close · Esc", (_event, cx) => { this.graphInitiative = null; this.focus.focus(); cx.notify(); })))
      .child(graphView(this, `initiative:${initiative.id}`, initiative.rootTicketIds ?? initiative.ticketIds, this.selected?.kind === "ticket" ? this.selected.id : undefined));
  }

  selectRecordTab(tab, cx) {
    this.recordTab = tab;
    this.recordTabFocus[tab].focus();
    this.changed(cx);
  }

  inspectActivity(cx) {
    this.activityFilter = this.activity.invalidEvents.length ? "invalid" : "all";
    this.event = null;
    this.selectRecordTab("activity", cx);
  }

  filterActivity(filter, cx) {
    this.activityFilter = filter;
    this.event = null;
    this.changed(cx);
  }

  recordTabKey(event, cx) {
    const tabs = ["description", "lineage", "activity"];
    const index = tabs.indexOf(this.recordTab);
    let next;
    if (event.key === "right") next = tabs[(index + 1) % tabs.length];
    else if (event.key === "left") next = tabs[(index + tabs.length - 1) % tabs.length];
    else if (event.key === "home") next = tabs[0];
    else if (event.key === "end") next = tabs[tabs.length - 1];
    else if (event.key === "enter" || event.key === "space") next = this.recordTab;
    else return;
    cx.stop_propagation();
    this.selectRecordTab(next, cx);
  }


  recordTabs(events) {
    const t = theme(), tabs = [["description", "Description"], ["lineage", this.selected.kind === "initiative" ? "Initiative DAG" : "Blocking lineage"], ["activity", `Activity · ${events.length}`]];
    // Base Tab is pointer-only. Plain focusable tabs keep the full keyboard path.
    return h_flex().role("tab_list").accessibility_label("Artifact views").flex_none().px(16).gap(18).border_b(1).border_color(t.border)
      .children(tabs.map(([tab, label], index) => {
        const selected = this.recordTab === tab, focus = this.recordTabFocus[tab];
        return div().id(`record-tab:${tab}`).role("tab").accessibility_label(label).aria_selected(selected).set_position(index + 1, tabs.length)
          .track_focus(focus).tab_index(0).tab_stop(selected).cursor_pointer().py(10).text_size(12).text_color(selected ? t.foreground : t.muted)
          .border_b(2).border_color(selected || focus.is_focused() ? t.accent : "#00000000")
          .on_click((_event, cx) => this.selectRecordTab(tab, cx))
          .on_key_down((event, cx) => this.recordTabKey(event, cx)).child(label);
      }));
  }

  recordDescription(record) {
    return v_flex().min_w(0).child(TextView.markdown(`record-body:${record.ref}`, record.body ?? "").scrollable(false));
  }

  recordActivity() {
    const t = theme(), { events, invalidEvents, groups, error } = this.activity;
    const filtered = this.activityFilter === "invalid" ? invalidEvents : events;
    return v_flex().gap(12).min_w(0)
      .child(h_flex().flex_wrap().gap(8).items_center()
        .child(button("activity-all", `All events · ${events.length}`, (_event, cx) => this.filterActivity("all", cx))
          .tab_stop(this.recordTab === "activity").bg(this.activityFilter === "all" ? t.selected : t.raised))
        .child(button("activity-invalid", `Invalid receipts · ${invalidEvents.length}`, (_event, cx) => this.filterActivity("invalid", cx))
          .tab_stop(this.recordTab === "activity").bg(this.activityFilter === "invalid" ? t.selected : t.raised)))
      .children(groups.map(group => v_flex().gap(4).min_w(0)
        .child(div().text_size(12).text_color(t.blocked).child(`${group.events.length} ${group.events.length === 1 ? "receipt" : "receipts"} · shared validation error`))
        .child(div().text_size(12).whitespace_normal().text_color(t.foreground).child(group.message))))
      .when(Boolean(error), el => el.child(note(error, true)))
      .child(div().text_size(11).text_color(t.muted).child(`${filtered.length} of ${events.length} events shown`))
      .when(filtered.length === 0, el => el.child(note(this.activityFilter === "invalid" ? "No receipt validation errors are available in this view." : "No canonical events or receipts are available for this record.")))
      .children(filtered.map(event => {
        const phase = event.fields?.phase ?? event.phase ?? event.fields?.kind ?? "Event";
        const name = event.fields?.receipt_id ?? event.ref?.split("/").pop() ?? event.id;
        const label = `${phase} · ${name}`, expanded = this.event === event.id;
        return v_flex().gap(5).min_w(0)
          .child(button(`event:${event.id}`, "", (_event, cx) => { this.event = expanded ? null : event.id; cx.notify(); }, { label: `${expanded ? "Collapse" : "Expand"} ${label}${event.error ? ". Invalid receipt." : ""}` })
            .tab_stop(this.recordTab === "activity").min_w(0).w_full().tooltip(label)
            .child(div().flex_1().min_w(0).truncate().child(`${expanded ? "▾" : "▸"} ${label}`))
            .when(Boolean(event.error), el => el.child(div().flex_none().text_size(10).text_color(t.blocked).child("Invalid receipt"))))
          .when(expanded, el => el
            .child(div().text_size(11).whitespace_normal().text_color(t.muted).child(event.ref))
            .when(Boolean(event.error), el => el.child(note(event.error, true)))
            .child(TextView.markdown(`event-body:${event.id}`, event.body ?? "").scrollable(false))
            .child(div().text_size(11).whitespace_normal().text_color(t.muted).child(JSON.stringify(event.fields ?? event, null, 2))));
      }));
  }


  recordView() {
    if (!this.selected) return note("Select an initiative or ticket.");
    const records = this.selected.kind === "initiative" ? this.snapshot.initiatives : this.snapshot.tickets;
    const record = this.detail?.record ?? records.find(item => item.id === this.selected.id);
    if (!record) return note("The selected record is unavailable. Refresh the tracker.", true);
    const events = this.detail?.workflow?.events ?? this.detail?.workflow?.receipts ?? [];
    const reader = v_flex().id(`record-reader:${record.ref}`).flex_1().min_w(0).min_h(0)
      .on_size_change((size, cx) => { if (Math.abs(size.height - (this.readerHeight ?? 0)) > 1) { this.readerHeight = size.height; cx.notify(); } })
      .child(compactHeader(this, record));
    if (this.detailError) reader.child(v_flex().p(16).gap(8).child(note(`${this.detail ? "Showing the last successful record. " : ""}${this.detailError}`, true))
      .child(button("retry-record", "Retry read", (_event, cx) => { this.client.invalidate(this.where, ["detail"]); this.choose(record, this.selected.kind, cx, false); })));
    if (!this.detail) return reader.child(note(this.detailError ? "The record could not be read." : "Read the selected record…"));
    if (this.detailLoading) reader.child(note("Refreshing the selected record…"));
    // Keep all readers laid out so their native scroll state survives a tab switch.
    // Inactive readers sit outside the clipped viewport and cannot intercept its wheel events.
    return reader.child(this.recordTabs(events))
      .child(div().relative().flex_1().min_h(0).overflow_hidden()
        .children(["description", "lineage", "activity"].map(tab => {
          const panelId = `record-panel:${this.viewKey}:${record.ref}:${tab}${tab === "activity" ? `:${this.activityFilter}` : ""}`, active = this.recordTab === tab;
          if (tab === "lineage") return div().absolute().top(0).left(active ? 0 : "100%").size_full().when(!active, el => el.invisible())
            .child(v_flex().id(panelId).size_full().min_h(0).p(12).when(active, el => el.role("tab_panel").accessibility_label(`Blocking lineage for ${record.title}`)
              .child(graphView(this, `lineage:${this.selected.kind}:${record.id}`, this.selected.kind === "initiative" ? record.rootTicketIds ?? record.ticketIds : [record.id], this.selected.kind === "ticket" ? record.id : undefined))));
          return div().absolute().top(0).left(active ? 0 : "100%").size_full().when(!active, el => el.invisible())
            .child(v_flex().id(panelId).when(active, el => el.role("tab_panel").accessibility_label(`${tab} for ${record.title}`))
              .tab_index(0).tab_stop(active).size_full().overflow_y_scroll().p(20)
              .child(tab === "description" ? this.recordDescription(record) : this.recordActivity()))
            .child(Scrollbar.vertical(panelId).absolute().inset_0());
        })));
  }

  trackerView() {
    const t = theme(), columns = this.preferences.layout === "C2" && this.bodySize.width >= 600;
    const size = this.bodySize, selected = Boolean(this.selected);
    const drawerTop = !selected || this.drawer === "closed" ? size.height : this.drawer === "expanded" ? 0 : Math.round(size.height / 2);
    const body = columns
      ? h_resizable(`tracker-columns:${this.viewKey}`).size_full().min_h(0)
        .child(resizable_panel().size(360).size_range(220, Math.max(220, size.width - 300)).child(this.parts.tree))
        .child(resizable_panel().size_range(280).child(v_flex().size_full().min_w(0).min_h(0).bg(t.chrome).child(this.parts.detail)))
      : div().id("tracker-drawer-body").relative().size_full().min_h(0).overflow_hidden()
        .child(this.parts.tree)
        .when(selected, el => el.child(v_flex().id("tracker-detail-drawer").absolute().left(0).right(0).top(drawerTop).h(size.height).bg(t.chrome).border_t(1).border_color(t.border).transition("top", { duration: this.preferences.motion ? this.drawer === "closed" ? 240 : 340 : 0, easing: "ease-out" })
          .child(h_flex().h(44).flex_none().px(10).gap(7).items_center().border_b(1).border_color(t.border)
            .child(div().w(24).h(3).rounded(2).bg(t.dim))
            .child(div().flex_1().text_size(10).text_color(t.muted).child(`${this.selected.id} · Details`))
            .child(button("drawer-expand", this.drawer === "expanded" ? "↓ Collapse" : "↑ Expand", (_event, cx) => { this.drawer = this.drawer === "expanded" ? "peek" : "expanded"; this.remember(); this.changed(cx); }))
            .child(button("drawer-close", "×", (_event, cx) => { this.drawer = "closed"; this.focus.focus(); this.remember(); this.changed(cx); }, { label: "Close details", disabled: this.drawer === "closed" })))
          .child(v_flex().h(this.drawer === "peek" ? Math.max(1, size.height / 2 - 44) : Math.max(1, size.height - 44)).min_h(0).child(this.parts.detail))));
    return v_flex().flex_1().min_h(0).child(div().id("tracker-body-size").relative().flex_1().min_h(0).overflow_hidden().on_size_change((next, cx) => { if (Math.abs(next.height - this.bodySize.height) > 1 || Math.abs(next.width - this.bodySize.width) > 1) { this.bodySize = next; this.changed(cx); } }).child(body).when(Boolean(this.graphInitiative), el => el.child(this.initiativeGraphDrawer())));
  }

  render(cx) {
    observeAgentLaunch(this);
    if (this.mode === "settings") return renderSettings(this);
    if (this.mode === "graph-actions") return renderGraphMenu(this);
    scheduleObservation(this);
    const t = theme();
    return v_flex().id(`shared-context:${this.mode}`).relative().track_focus(this.focus).size_full().min_h(0).rounded(0).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(13).font_family("JetBrains Mono")
      .on_key_down((event, cx) => {
        if (this.selectKeyHandlers) for (const id in this.selectKeyHandlers) if (this.selectKeyHandlers[id](event, cx)) return;
        if (event.key === "escape" && this.filtersOpen) { closeTreeFilters(this, cx); this.changed(cx); cx.stop_propagation(); return; }
        if (event.key === "escape" && this.graphInitiative) { this.graphInitiative = null; this.focus.focus(); cx.stop_propagation(); this.changed(cx); return; }
        if (event.key !== "escape" || this.mode !== "tracker" || (this.preferences.layout === "C2" && this.bodySize.width >= 600) || !this.selected || this.drawer === "closed") return;
        this.drawer = this.drawer === "expanded" ? "peek" : "closed"; this.focus.focus(); this.remember(); cx.stop_propagation(); this.changed(cx);
      })
      .child(h_flex().id("shared-context-titlebar").h(48).flex_none().gap(0).items_stretch().border_b(1).border_color(t.border).bg(t.chrome)
        .child(div().w(48).flex_none().flex().items_center().justify_center().border_r(1).border_color(t.border).child(icon("context", 16).text_color(t.accent)))
        .children([["context", "Files"], ["tracker", "Tracker"]].map(([mode, label]) => button(`shared-context-nav:${mode}`, label, () => { run("layout.select", { stack: "panel-body", child: mode }); run("layout.show", { id: "panel" }); }, { label: `${label} view`, height: 48 })
          .rounded(0).px(16).border_r(1).border_color(t.border).bg(this.mode === mode ? t.selected : t.chrome).text_color(this.mode === mode ? t.accent : t.muted)))
        .child(div().flex_1().min_w(0))
        .child(button("context-metadata", "", (_event, cx) => openMetadata(this, cx), { label: `Show agent context metadata for ${this.context?.identity ?? "repository"}`, disabled: !this.context?.metadata, height: 48 }).max_w("45%").min_w(0).px(16).bg(t.chrome).tooltip("Show resolved repository context").child(div().whitespace_normal().child(this.context?.identity ?? "")))
        .child(button("context-settings", "⚙", openSettings, { label: "Open Shared Context settings", height: 48 }).w(40).rounded(0).border_l(1).border_color(t.border).bg(t.chrome))
        .child(button("context-refresh", "↻", (_event, cx) => this.refresh(cx), { label: "Refresh shared context", disabled: this.loading, height: 48 }).w(40).rounded(0).border_l(1).border_color(t.border).bg(t.chrome)))
      .child(v_flex().flex_1().min_h(0).w_full().overflow_hidden()
        .when(Boolean(this.error), el => el.child(note(`${this.stale ? "Showing the last successful snapshot. " : ""}${this.error}`, true)))
        .when(!this.preferencesReady && !this.error, el => el.child(this.parts.loading))
        .when(this.preferencesReady && !this.context && this.loading && !this.error, el => el.child(this.parts.loading))
        .when(Boolean(this.context) && !this.context.ready, el => el.child(this.onboarding()))
        .when(Boolean(this.context?.ready), el => el.child(this.mode === "context" ? this.parts.files : this.snapshot ? this.trackerView() : this.error ? note("The tracker is unavailable. Correct the error, then select Refresh.") : this.parts.loading)))
      .child(this.parts.status)
      .when(Boolean(this.metadataOpen && this.context?.metadata), el => el.child(renderMetadata(this)))
      .when(Boolean(this.headerReason), el => el.child(renderHeaderReason(this)));
  }
}
