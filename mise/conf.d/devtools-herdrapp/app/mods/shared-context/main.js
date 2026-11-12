// Native Context and Tracker panels. The settings select C or C2 without changing data APIs.
import { View, div } from "gpui-kit";
import { h_flex, v_flex, TextView, Scrollbar, h_resizable, resizable_panel } from "gpui-base";
import { spaces, panes, focused, props, theme, run, nextCommand } from "herdr";
import { request } from "./client.js";
import { loadPreferences, DEFAULTS } from "./preferences.js";
import { dependencyRows, revealPath, itemType } from "./tree.js";
import { button, icon, note, select, typeColor, typeIcon } from "./ui.js";
import { graphView, initGraphMenu, renderGraphMenu } from "./graph-view.js";
import { compactHeader } from "./header.js";
import { initiativeProgress } from "./progress-model.js";
import { initiativeProgressRow } from "./progress.js";
import { workflowActivity } from "./activity-model.js";
import { initActionMenus } from "./action-menu.js";
import { invalidateAction } from "./action.js";

function location() {
  const given = props() ?? {}, space = spaces().find(item => item.active), focus = focused();
  const pane = panes().find(item => item.pane === focus?.pane);
  return { cwd: given.cwd ?? pane?.cwd ?? focus?.cwd ?? space?.folder, machine: given.cwd ? given.machine ?? null : space?.machine ?? null, space: given.space ?? space?.id };
}
function statusColor(value, t) { return value === "READY" || value === "DONE" ? t.ansi2 : ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(value) ? t.ansi3 : ["ERROR", "BLOCKED", "UNKNOWN"].includes(value) ? t.blocked : t.dim; }
function stateIcon(state) { return state === "READY" ? "▷" : state === "DONE" ? "✓" : ["BLOCKED", "ERROR", "UNKNOWN"].includes(state) ? "⊘" : "◉"; }

export default class SharedContext extends View {
  init(_given, cx) {
    this.mode = props()?.mode ?? "tracker";
    if (this.mode === "graph-actions") { initGraphMenu(this, cx); return; }
    this.focus = cx.focus_handle();
    this.selectFocus = { "context-store": cx.focus_handle(), "context-preset": cx.focus_handle() };
    this.recordTab = "description"; this.detailError = "";
    this.activity = workflowActivity(); this.activityFilter = "all";
    if (this.mode === "tracker") initActionMenus(this, cx);
    this.recordTabFocus = { description: cx.focus_handle(), activity: cx.focus_handle(), lineage: cx.focus_handle() };
    this.graphInitiative = null;
    this.preferences = DEFAULTS; this.preferencesReady = false;
    this.key = ""; this.revision = 0; this.detailRevision = 0; this.fileRevision = 0;
    this.viewStorageKey = `shared-context:${this.mode}:views:v1`;
    // Settings reload the mod. Keep view state, but revalidate record IDs against the next snapshot.
    this.saved = new Map(JSON.parse(localStorage.getItem(this.viewStorageKey) ?? "[]").map(([key, value]) => [key, { ...value, collapsed: new Set(value.collapsed), fileFolders: new Set(value.fileFolders) }]));
    this.collapsed = new Set(); this.queue = "initiatives"; this.selected = null; this.drawer = "peek";
    this.progress = new Map();
    this.fileFolders = new Set(); this.fileEntries = new Map(); this.filePending = new Set(); this.fileSelection = null;
    this.error = ""; this.loading = false; this.store = "repository"; this.preset = ""; this.bodySize = { width: 408, height: 500 };
    cx.spawn(async cx => {
      try { this.preferences = await loadPreferences(); this.preferencesReady = true; this.follow(cx); }
      catch (error) { this.error = String(error.message ?? error); }
      cx.notify();
    });
    cx.spawn(async cx => {
      for (; ;) {
        const command = await nextCommand();
        if (command === "refresh") this.refresh(cx);
        if (command === "focus") this.focus.focus();
        if (command === "expand") { this.drawer = "expanded"; cx.notify(); }
        if (command === "collapse") { this.drawer = "peek"; cx.notify(); }
        if (command === "close") { this.drawer = "closed"; cx.notify(); }
      }
    });
  }

  close() {
    invalidateAction(this);
    this.revision++; this.fileRevision++;
    this.actionInput?.release();
  }


  remember() {
    if (!this.viewKey) return;
    this.saved.set(this.viewKey, { selected: this.selected, queue: this.queue, collapsed: new Set(this.collapsed), drawer: this.drawer, fileSelection: this.fileSelection, fileFolders: new Set(this.fileFolders) });
    if (this.saved.size > 16) this.saved.delete(this.saved.keys().next().value);
    localStorage.setItem(this.viewStorageKey, JSON.stringify([...this.saved].map(([key, value]) => [key, { ...value, collapsed: [...value.collapsed], fileFolders: [...value.fileFolders] }])));
  }

  follow(cx) {
    if (!this.preferencesReady) return;
    const next = location(), key = JSON.stringify([next.machine, next.cwd]);
    if (key === this.key) return;
    this.remember(); this.key = key; this.where = next;
    invalidateAction(this);
    this.context = null; this.snapshot = null; this.detail = null; this.filePreview = null; this.viewKey = null;
    this.progress = new Map();
    this.recordTab = "description"; this.detailError = "";
    this.activity = workflowActivity(); this.activityFilter = "all";
    this.actionOpen = null; this.actionError = "";
    this.openSelect = null; this.selectKeyHandlers = null; this.graphInitiative = null; this.graphViews = new Map();
    this.revision++; this.detailRevision++; this.fileRevision++; this.loading = false; this.error = "";
    if (!next.cwd) { this.error = "Select a repository folder."; return; }
    this.refresh(cx);
  }

  refresh(cx) {
    if (!this.where?.cwd || this.loading) return;
    const revision = this.revision, where = this.where;
    this.loading = true; this.error = "";
    cx.spawn(async cx => {
      try {
        const context = await request("context", where);
        if (revision !== this.revision) return;
        const viewKey = `${where.machine ? `${where.machine}:` : ""}${context.identity}:${context.repository}`;
        if (viewKey !== this.viewKey) {
          const saved = this.saved.get(viewKey);
          this.viewKey = viewKey;
          this.selected = saved?.selected ?? null; this.queue = saved?.queue ?? "initiatives"; this.drawer = saved?.drawer ?? "peek";
          this.collapsed = new Set(saved?.collapsed); this.fileFolders = new Set(saved?.fileFolders); this.fileSelection = saved?.fileSelection ?? null;
          this.fileEntries = new Map(); this.filePending = new Set();
        }
        this.context = context;
        if (context.ready) { this.openSelect = null; this.selectKeyHandlers = null; }
        cx.notify();
        if (!context.ready) return;
        if (this.mode === "context") {
          for (const collection of context.collections) {
            if (!collection.path) continue;
            const prefix = `${collection.id}:`;
            for (const folder of this.fileFolders) if (folder.startsWith(prefix)) this.loadFolder(collection.id, folder.slice(prefix.length), cx);
          }
          if (this.fileSelection) this.openFile(this.fileSelection.collection, this.fileSelection.path, cx);
        } else {
          const snapshot = await request("tracker", where);
          if (revision !== this.revision) return;
          this.snapshot = snapshot;
          this.progress = initiativeProgress(snapshot);
          if (this.selected) {
            const records = this.selected.kind === "initiative" ? snapshot.initiatives : snapshot.tickets;
            const record = records.find(item => item.id === this.selected.id);
            if (record) this.choose(record, this.selected.kind, cx, false); else { invalidateAction(this); this.actionOpen = null; this.selected = null; this.detail = null; }
          }
        }
      } catch (error) { if (revision === this.revision) this.error = String(error.message ?? error); }
      finally { if (revision === this.revision) { this.loading = false; cx.notify(); } }
    });
  }

  choose(record, kind, cx, reveal = true) {
    if (this.drawer === "expanded" && this.selected?.id === record.id && reveal) return;
    if (this.selected?.id !== record.id || this.selected.kind !== kind) {
      invalidateAction(this);
      this.recordTab = "description"; this.activityFilter = "all";
      this.actionOpen = null; this.actionError = "";
    }
    this.selected = { id: record.id, kind, ref: record.ref };
    if (reveal && this.drawer === "closed") this.drawer = "peek";
    if (kind === "ticket" && this.snapshot) {
      const path = dependencyRows(this.snapshot, this.queue, this.collapsed).canonical.get(record.id);
      if (path) revealPath(this.collapsed, path);
    }
    const serial = ++this.detailRevision, revision = this.revision;
    this.detail = null; this.detailLoading = true; this.detailError = ""; this.event = null;
    this.activity = workflowActivity();
    cx.spawn(async cx => {
      try {
        const detail = await request("detail", this.where, { id: record.id, kind });
        if (serial === this.detailRevision && revision === this.revision) {
          this.detail = detail;
          this.activity = workflowActivity(detail.workflow);
        }
      } catch (error) { if (serial === this.detailRevision && revision === this.revision) this.detailError = String(error.message ?? error); }
      finally { if (serial === this.detailRevision && revision === this.revision) { this.detailLoading = false; cx.notify(); } }
    });
    this.remember(); cx.notify();
  }

  loadFolder(collection, path, cx) {
    const key = `${collection}:${path}`;
    if (this.filePending.has(key)) return;
    this.filePending.add(key);
    const revision = this.revision;
    cx.spawn(async cx => {
      try {
        const entries = await request("directory", this.where, { collection, path });
        if (revision === this.revision) this.fileEntries.set(key, entries);
      } catch (error) { if (revision === this.revision) this.error = String(error.message ?? error); }
      finally { if (revision === this.revision) { this.filePending.delete(key); cx.notify(); } }
    });
  }

  toggleFolder(collection, path, cx) {
    const key = `${collection}:${path}`;
    if (this.fileFolders.has(key)) this.fileFolders.delete(key);
    else { this.fileFolders.add(key); this.loadFolder(collection, path, cx); }
    this.remember(); cx.notify();
  }

  openFile(collection, path, cx) {
    this.fileSelection = { collection, path }; this.filePreview = null; this.error = "";
    const revision = this.revision, serial = ++this.fileRevision;
    cx.spawn(async cx => {
      try {
        const preview = await request("file", this.where, { collection, path });
        if (revision === this.revision && serial === this.fileRevision) this.filePreview = preview;
      } catch (error) { if (revision === this.revision && serial === this.fileRevision) this.error = String(error.message ?? error); }
      if (revision === this.revision && serial === this.fileRevision) cx.notify();
    });
    this.remember(); cx.notify();
  }

  setup(cx) {
    if (this.loading) return;
    this.loading = true; const revision = this.revision;
    cx.spawn(async cx => {
      try {
        const context = await request("setup", this.where, { store: this.store, preset: this.preset });
        if (revision === this.revision) this.context = context;
      } catch (error) { if (revision === this.revision) this.error = String(error.message ?? error); }
      finally { if (revision === this.revision) { this.loading = false; this.refresh(cx); cx.notify(); } }
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
        rows.push(button(`context-file:${collection}:${entry.path}`, "", (_event, cx) => entry.directory ? this.toggleFolder(collection, entry.path, cx) : this.openFile(collection, entry.path, cx), { label: entry.name }).w_full().pl(8 + depth * 18).pr(8).rounded(7).bg(t.background).text_color(t.foreground).text_size(13).hover(el => el.bg(t.hover)).child(h_flex().w_full().gap(7).items_center().child(entry.directory ? icon(open ? "down" : "right", 12) : div().w(12)).child(icon(entry.directory ? "folder" : "file")).child(div().flex_1().min_w(0).truncate().child(entry.name))));
        if (entry.directory && open) folderRows(collection, entry.path, depth + 1);
      }
    };
    for (const collection of this.context.collections) {
      const open = this.fileFolders.has(`${collection.id}:`);
      rows.push(button(`context-collection:${collection.id}`, "", (_event, cx) => { if (collection.path) this.toggleFolder(collection.id, "", cx); else { run("layout.select", { stack: "panel-body", child: "tracker" }); run("layout.show", { id: "panel" }); } }, { label: `${collection.label}: ${collection.store ?? collection.adapter}` }).w_full().px(8).rounded(7).bg(t.background).text_color(t.foreground).text_size(13).hover(el => el.bg(t.hover)).child(h_flex().w_full().gap(7).items_center().child(collection.path ? icon(open ? "down" : "right", 12) : div().w(12)).child(icon(collection.path ? "folder" : "tracker")).child(div().flex_1().child(collection.label)).child(div().text_size(10).text_color(t.dim).child(collection.store ?? collection.adapter))));
      if (open && collection.path) folderRows(collection.id, "", 1);
    }
    return v_flex().id("context-files-tree").flex_1().min_h(0).overflow_y_scrollbar().p(6).children(rows);
  }

  treeView(height) {
    const t = theme(), disabled = !(this.preferences.layout === "C2" && this.bodySize.width >= 600) && this.drawer === "expanded" && Boolean(this.selected);
    let forest;
    try { forest = dependencyRows(this.snapshot, this.queue, this.collapsed); }
    catch (error) { return note(String(error.message ?? error), true); }
    const rows = forest.rows.map(row => {
      if (row.type === "section") return div().px(10).pt(16).pb(6).text_size(10).text_color(t.muted).child(row.record.title.toUpperCase());
      const group = row.type === "initiative", type = row.itemType ?? (group ? "initiative" : itemType(row.record));
      const selected = this.selected?.id === row.record.id && this.selected.kind === row.type;
      const action = (_event, cx) => {
        if (disabled) return;
        if (row.reference) revealPath(this.collapsed, row.reference);
        this.choose(row.record, group ? "initiative" : "ticket", cx);
      };
      return h_flex().id(`tracker-row:${row.path}`).h(group ? 80 : 60).flex_none().pl(8 + row.depth * 18).pr(6).gap(6).items_center().rounded(6).bg(selected ? t.selected : t.background).hover(el => el.bg(selected ? t.selected : t.hover))
        .child(row.children ? button(`toggle:${row.path}`, "", (_event, cx) => { cx.stop_propagation(); if (disabled) return; if (this.collapsed.has(row.path)) this.collapsed.delete(row.path); else this.collapsed.add(row.path); this.remember(); cx.notify(); }, { label: `${row.expanded ? "Collapse" : "Expand"} ${row.record.title}`, disabled }).w(24).px(0).bg("#00000000").child(icon(row.expanded ? "down" : "right", 12)) : div().w(24).flex_none())
        .child(button(`select:${row.path}`, "", action, { label: `${type}: ${row.record.title}. ${row.record.id}. ${row.state ?? `${row.children} tickets`}${row.reference ? ". Shared prerequisite. Open canonical path." : ""}`, disabled, height: group ? 76 : 56 }).flex_1().min_w(0).px(0).bg("#00000000").hover(el => el.bg("#00000000")).text_color(t.foreground).tooltip(`${row.record.title}\n${row.record.id} · ${type}${row.state ? ` · ${row.state}` : ""}`)
          .child(v_flex().flex_1().min_w(0).gap(5)
            .child(h_flex().gap(7).items_center().min_w(0).child(div().w(16).text_size(16).text_color(typeColor(type, t)).child(typeIcon(type))).child(div().flex_1().min_w(0).truncate().text_size(13).child(row.record.title)))
            .child(h_flex().pl(23).gap(7).items_center().min_w(0).child(div().flex_1().min_w(0).truncate().text_size(10).text_color(t.muted).child(row.record.id))
              .when(!group, el => el.child(div().flex_none().text_size(10).text_color(row.state ? statusColor(row.state, t) : t.dim).child(row.state ? `${stateIcon(row.state)} ${row.state}` : `${row.children} tickets`)))
              .when(Boolean(row.reference), el => el.child(div().text_color(t.accent).child("↗"))))
            .when(group, el => el.child(v_flex().w_full().min_w(0).pl(23).child(initiativeProgressRow(this.progress.get(row.record.id), t))))))
        .when(group, el => el.child(button(`initiative-graph:${row.record.id}`, "⑂", (_event, cx) => { cx.stop_propagation(); this.openInitiativeGraph(row.record, cx); }, { label: `Open dependency graph for ${row.record.title}`, disabled }).w(28).px(0).text_color(typeColor("initiative", t)).tooltip("Initiative dependency graph")));
    });
    // Resizable panels do not stretch their child to the dragged width.
    return v_flex().id("tracker-tree-frame").w_full().min_w(0).min_h(0).h(height ?? "100%").bg(t.background)
      .child(v_flex().id("tracker-tree").flex_1().min_w(0).min_h(0).overflow_y_scrollbar().p(6).children(rows.length ? rows : [note(this.loading ? "Read tracker records…" : "No records match this queue.")]))
      .child(this.treeFilters());
  }

  treeFilters() {
    const t = theme();
    return h_flex().id("tracker-tree-footer").role("toolbar").accessibility_label("Tracker filters").flex_none().h(36).p(0).gap(0).items_stretch().border_t(1).border_color(t.border)
      .children(["initiatives", "ready", "review", "blocked", "all"].map((queue, index) => button(`queue:${queue}`, queue[0].toUpperCase() + queue.slice(1), (_event, cx) => { this.queue = queue; this.selected = null; this.detail = null; this.detailRevision++; this.remember(); cx.notify(); }).h_full().flex_1().min_w(0).rounded(0).text_size(10).px(4).border_l(index ? 1 : 0).border_color(t.border).bg(this.queue === queue ? t.selected : t.background)));
  }

  openInitiativeGraph(initiative, cx) {
    this.graphInitiative = initiative.id;
    this.focus.focus(); cx.notify();
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
    cx.notify();
  }

  inspectActivity(cx) {
    this.activityFilter = this.activity.invalidEvents.length ? "invalid" : "all";
    this.event = null;
    this.selectRecordTab("activity", cx);
  }

  filterActivity(filter, cx) {
    this.activityFilter = filter;
    this.event = null;
    cx.notify();
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
    if (this.detailError) return reader.child(v_flex().p(16).gap(8).child(note(this.detailError, true))
      .child(button("retry-record", "Retry read", (_event, cx) => this.choose(record, this.selected.kind, cx, false))));
    if (this.detailLoading || !this.detail) return reader.child(note("Read the selected record…"));
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
        .child(resizable_panel().size(360).size_range(220, Math.max(220, size.width - 300)).child(this.treeView()))
        .child(resizable_panel().size_range(280).child(v_flex().size_full().min_w(0).min_h(0).bg(t.chrome).child(this.recordView())))
      : div().id("tracker-drawer-body").relative().size_full().min_h(0).overflow_hidden()
        .child(this.treeView(selected && this.drawer === "peek" ? "50%" : "100%"))
        .when(selected, el => el.child(v_flex().id("tracker-detail-drawer").absolute().left(0).right(0).top(drawerTop).h(size.height).bg(t.chrome).border_t(1).border_color(t.border).transition("top", { duration: this.preferences.motion ? this.drawer === "closed" ? 240 : 340 : 0, easing: "ease-out" })
          .child(h_flex().h(44).flex_none().px(10).gap(7).items_center().border_b(1).border_color(t.border)
            .child(div().w(24).h(3).rounded(2).bg(t.dim))
            .child(div().flex_1().text_size(10).text_color(t.muted).child(`${this.selected.id} · Details`))
            .child(button("drawer-expand", this.drawer === "expanded" ? "↓ Collapse" : "↑ Expand", (_event, cx) => { this.drawer = this.drawer === "expanded" ? "peek" : "expanded"; this.remember(); cx.notify(); }))
            .child(button("drawer-close", "×", (_event, cx) => { this.drawer = "closed"; this.focus.focus(); this.remember(); cx.notify(); }, { label: "Close details", disabled: this.drawer === "closed" })))
          .child(v_flex().h(this.drawer === "peek" ? Math.max(1, size.height / 2 - 44) : Math.max(1, size.height - 44)).min_h(0).child(this.recordView()))));
    return v_flex().flex_1().min_h(0).child(div().id("tracker-body-size").relative().flex_1().min_h(0).overflow_hidden().on_size_change((next, cx) => { if (Math.abs(next.height - this.bodySize.height) > 1 || Math.abs(next.width - this.bodySize.width) > 1) { this.bodySize = next; cx.notify(); } }).child(body).when(Boolean(this.graphInitiative), el => el.child(this.initiativeGraphDrawer())));
  }

  render(cx) {
    if (this.mode === "graph-actions") return renderGraphMenu(this);
    this.follow(cx);
    const t = theme(), title = this.mode === "context" ? "Context" : "Tracker";
    return v_flex().id(`shared-context:${this.mode}`).track_focus(this.focus).size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(13)
      .on_key_down((event, cx) => { if (this.selectKeyHandlers) for (const id in this.selectKeyHandlers) if (this.selectKeyHandlers[id](event, cx)) return; if (event.key === "escape" && this.graphInitiative) { this.graphInitiative = null; this.focus.focus(); cx.stop_propagation(); cx.notify(); return; } if (event.key !== "escape" || this.mode !== "tracker" || (this.preferences.layout === "C2" && this.bodySize.width >= 600) || !this.selected || this.drawer === "closed") return; this.drawer = this.drawer === "expanded" ? "peek" : "closed"; this.focus.focus(); this.remember(); cx.stop_propagation(); cx.notify(); })
      .child(h_flex().h(42).flex_none().px(14).gap(7).items_center().border_b(1).border_color(t.border).child(icon(this.mode === "context" ? "context" : "tracker")).child(div().font_semibold().child(title)).child(div().flex_1().min_w(0).truncate().text_right().text_size(10).text_color(t.dim).child(this.context?.identity ?? ""))
        .child(button("context-settings", "⚙", () => run("mod.open", { name: "better-config" }), { label: "Open mod settings" }))
        .child(button("context-refresh", "↻", (_event, cx) => this.refresh(cx), { label: "Refresh shared context", disabled: this.loading })))
      .when(Boolean(this.error), el => el.child(note(this.error, true)))
      .when(!this.preferencesReady && !this.error, el => el.child(note("Read panel settings…")))
      .when(this.preferencesReady && !this.context && this.loading && !this.error, el => el.child(note("Read repository context…")))
      .when(Boolean(this.context) && !this.context.ready, el => el.child(this.onboarding()))
      .when(Boolean(this.context?.ready), el => el.child(this.mode === "context" ? this.filesView() : this.snapshot ? this.trackerView() : note(this.error ? "The tracker is unavailable. Correct the error, then select Refresh." : "Read tracker records and workflow state…")))
      .when(Boolean(this.context?.ready) && this.mode === "context", el => el.child(h_flex().h(25).flex_none().px(10).gap(8).items_center().border_t(1).border_color(t.border).text_size(10).text_color(t.dim).child(this.loading ? "Refresh records…" : `Canonical records · ${this.context.mode}`)));
  }
}
