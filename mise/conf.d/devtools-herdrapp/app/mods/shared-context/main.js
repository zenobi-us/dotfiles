// Native Context and Tracker panels. The settings select C or C2 without changing data APIs.
import { View, div } from "gpui-kit";
import { h_flex, v_flex, TextView } from "gpui-base";
import { spaces, panes, focused, props, theme, run, layout, openOverlay, nextCommand } from "herdr";
import { request } from "./client.js";
import { loadPreferences, DEFAULTS } from "./preferences.js";
import { dependencyRows, revealPath } from "./tree.js";
import { button, icon, note, select } from "./ui.js";
import { initAction, renderAction } from "./action.js";

function location() {
  const given = props() ?? {}, space = spaces().find(item => item.active), focus = focused();
  const pane = panes().find(item => item.pane === focus?.pane);
  return { cwd: given.cwd ?? pane?.cwd ?? focus?.cwd ?? space?.folder, machine: given.cwd ? null : space?.machine, space: given.space ?? space?.id };
}
function find(node, id) { if (node?.id === id) return node; for (const child of node?.children ?? []) { const found = find(child, id); if (found) return found; } return null; }
function statusColor(value, t) { return value === "READY" || value === "DONE" ? t.ansi2 : ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(value) ? t.ansi3 : ["ERROR", "BLOCKED", "UNKNOWN"].includes(value) ? t.blocked : t.dim; }

export default class SharedContext extends View {
  init(_given, cx) {
    this.mode = props()?.mode ?? "tracker";
    if (this.mode === "action") { initAction(this, cx); return; }
    this.focus = cx.focus_handle();
    this.selectFocus = { "context-store": cx.focus_handle(), "context-preset": cx.focus_handle() };
    this.preferences = DEFAULTS; this.preferencesReady = false;
    this.key = ""; this.revision = 0; this.detailRevision = 0;
    this.viewStorageKey = `shared-context:${this.mode}:views:v1`;
    // Settings reload the mod. Keep view state, but revalidate record IDs against the next snapshot.
    this.saved = new Map(JSON.parse(localStorage.getItem(this.viewStorageKey) ?? "[]").map(([key, value]) => [key, { ...value, collapsed: new Set(value.collapsed), fileFolders: new Set(value.fileFolders) }]));
    this.collapsed = new Set(); this.queue = "initiatives"; this.selected = null; this.drawer = "peek";
    this.fileFolders = new Set(); this.fileEntries = new Map(); this.filePending = new Set(); this.fileSelection = null;
    this.error = ""; this.loading = false; this.store = "repository"; this.preset = ""; this.bodySize = { width: 408, height: 500 };
    cx.spawn(async cx => {
      try { this.preferences = await loadPreferences(); this.preferencesReady = true; this.follow(cx); this.resizePanel(); }
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
    if (this.mode === "action") this.input.release();
  }

  resizePanel() {
    if (this.mode !== "tracker") return;
    const panel = find(layout(), "panel"), body = find(layout(), "panel-body");
    if (panel && body?.active === "tracker") run("layout.resize", { id: "panel", px: this.preferences.layout === "C2" ? 850 : 408 });
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
    this.context = null; this.snapshot = null; this.detail = null; this.filePreview = null; this.viewKey = null;
    this.openSelect = null; this.selectKeyHandlers = null;
    this.revision++; this.detailRevision++; this.loading = false; this.error = "";
    if (next.machine) { this.error = "The selected repository is remote. Its Bun service must run on that machine. Local paths are not a remote fallback."; return; }
    if (!next.cwd) { this.error = "Select a repository folder."; return; }
    this.refresh(cx);
  }

  refresh(cx) {
    if (!this.where?.cwd || this.where.machine || this.loading) return;
    const revision = this.revision, cwd = this.where.cwd;
    this.loading = true; this.error = "";
    cx.spawn(async cx => {
      try {
        const context = await request("context", cwd);
        if (revision !== this.revision) return;
        const viewKey = `${context.identity}:${context.repository}`;
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
          for (const collection of context.collections) if (collection.path && this.fileFolders.has(`${collection.id}:`)) this.loadFolder(collection.id, "", cx);
          if (this.fileSelection) this.openFile(this.fileSelection.collection, this.fileSelection.path, cx);
        } else {
          const snapshot = await request("tracker", cwd);
          if (revision !== this.revision) return;
          this.snapshot = snapshot;
          if (this.selected) {
            const records = this.selected.kind === "initiative" ? snapshot.initiatives : snapshot.tickets;
            const record = records.find(item => item.id === this.selected.id);
            if (record) this.choose(record, this.selected.kind, cx, false); else { this.selected = null; this.detail = null; }
          }
        }
      } catch (error) { if (revision === this.revision) this.error = String(error.message ?? error); }
      finally { if (revision === this.revision) { this.loading = false; cx.notify(); } }
    });
  }

  choose(record, kind, cx, reveal = true) {
    if (this.drawer === "expanded" && this.selected?.id === record.id && reveal) return;
    this.selected = { id: record.id, kind, ref: record.ref };
    if (reveal && this.drawer === "closed") this.drawer = "peek";
    if (kind === "ticket" && this.snapshot) {
      const path = dependencyRows(this.snapshot, this.queue, this.collapsed).canonical.get(record.id);
      if (path) revealPath(this.collapsed, path);
    }
    const serial = ++this.detailRevision, revision = this.revision;
    this.detail = null; this.detailLoading = true; this.event = null;
    cx.spawn(async cx => {
      try {
        const detail = await request("detail", this.where.cwd, { id: record.id, kind });
        if (serial === this.detailRevision && revision === this.revision) this.detail = detail;
      } catch (error) { if (serial === this.detailRevision && revision === this.revision) this.error = String(error.message ?? error); }
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
        const entries = await request("directory", this.where.cwd, { collection, path });
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
    this.fileSelection = { collection, path }; this.filePreview = null;
    const revision = this.revision, selected = `${collection}:${path}`;
    cx.spawn(async cx => {
      try {
        const preview = await request("file", this.where.cwd, { collection, path });
        if (revision === this.revision && `${this.fileSelection?.collection}:${this.fileSelection?.path}` === selected) this.filePreview = preview;
      } catch (error) { if (revision === this.revision) this.error = String(error.message ?? error); }
      cx.notify();
    });
    this.remember(); cx.notify();
  }

  setup(cx) {
    if (this.loading) return;
    this.loading = true; const revision = this.revision;
    cx.spawn(async cx => {
      try {
        const context = await request("setup", this.where.cwd, { store: this.store, preset: this.preset });
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
      .child(button("context-files-back", "← Context files", (_event, cx) => { this.fileSelection = null; this.filePreview = null; cx.notify(); }))
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
      const group = row.type === "initiative", selected = this.selected?.id === row.record.id && this.selected.kind === row.type;
      const expanded = row.expanded, action = (_event, cx) => {
        if (disabled) return;
        if (group && row.record.group) { if (this.collapsed.has(row.path)) this.collapsed.delete(row.path); else this.collapsed.add(row.path); this.remember(); cx.notify(); }
        else if (group) this.choose(row.record, "initiative", cx);
        else { if (row.reference) revealPath(this.collapsed, row.reference); this.choose(row.record, "ticket", cx); }
      };
      return h_flex().id(`tracker-row:${row.path}`).h(28).pl(8 + row.depth * 18).pr(8).gap(7).items_center().rounded(7).bg(selected ? t.selected : t.background)
        .child(row.children && !row.reference ? button(`toggle:${row.path}`, "", (_event, cx) => { cx.stop_propagation(); if (disabled) return; if (this.collapsed.has(row.path)) this.collapsed.delete(row.path); else this.collapsed.add(row.path); this.remember(); cx.notify(); }, { label: `${expanded ? "Collapse" : "Expand"} ${row.record.id}`, disabled }).w(12).px(0).rounded(0).bg(selected ? t.selected : t.background).child(icon(expanded ? "down" : "right", 12)) : div().w(12).flex_none())
        .child(button(`select:${row.path}`, "", action, { label: `${row.record.id}: ${row.record.title}${row.state ? `. ${row.state}.` : ""}${row.context ? " Prerequisite context." : ""}${row.reference ? " Shared prerequisite." : ""}`, disabled }).flex_1().min_w(0).px(0).bg(selected ? t.selected : t.background).text_color(row.context ? t.dim : t.foreground).tooltip(group ? row.record.title : `${row.record.title}\n${row.record.id} · ${row.state}${row.context ? " · Prerequisite context" : ""}`)
          .child(h_flex().gap(7).items_center().min_w(0).flex_1().child(icon(group ? "folder" : "file")).child(div().flex_1().min_w(0).truncate().text_size(13).child(row.record.title)).when(!group, el => el.child(div().text_size(9).text_color(t.dim).child(row.record.id))).when(Boolean(row.reference), el => el.child(div().text_color(t.accent).child("↗"))).when(!group, el => el.child(div().text_size(10).text_color(statusColor(row.state, t)).child(row.state.slice(0, 1))))));
    });
    return v_flex().id("tracker-tree").min_w(0).min_h(0).h(height ?? "100%").overflow_y_scrollbar().p(6).bg(t.background).children(rows.length ? rows : [note(this.loading ? "Read tracker records…" : "No records match this queue.")]);
  }

  recordView() {
    const t = theme();
    if (this.detailLoading || !this.detail) return note(this.detailLoading ? "Read the selected record…" : "Select a record.");
    const { record, workflow, actions } = this.detail;
    const events = workflow?.events ?? workflow?.receipts ?? [];
    return v_flex().id(`record-reader:${record.ref}`).flex_1().min_h(0).overflow_y_scrollbar().p(14).gap(12)
      .child(div().text_size(10).text_color(t.dim).child(record.ref))
      .child(h_flex().justify_between().child(div().text_size(11).text_color(t.muted).child(record.id)).child(button("copy-record-ref", "Copy reference", (_event, cx) => cx.write_to_clipboard(record.ref))))
      .child(div().text_size(18).font_semibold().child(record.title))
      .when(Boolean(record.blockedBy?.length), el => el.child(div().text_size(12).text_color(t.blocked).child(`Direct prerequisites: ${record.blockedBy.join(", ")}`)))
      .child(TextView.markdown(`record-body:${record.ref}`, record.body ?? ""))
      .when(Boolean(workflow?.error), el => el.child(note(workflow.error, true)))
      .child(div().text_size(12).font_semibold().child("Actions"))
      .children(actions.map(choice => button(`action:${choice.action}`, choice.label, () => openOverlay({ mod: "shared-context", kind: "dialog", width: 760, height: 600, props: { mode: "action", cwd: this.context.repository, space: this.where.space, id: record.id, kind: this.detail.kind, action: choice.action } }), { disabled: Boolean(choice.disabledReason) }).tooltip(choice.disabledReason ?? `Prepare ${choice.label}`)))
      .when(this.detail.kind === "ticket", el => el.child(div().text_size(12).font_semibold().child("Workflow events")))
      .children(events.map(event => v_flex().gap(5).child(button(`event:${event.id}`, `${event.fields?.kind ?? event.phase ?? "Event"} · ${event.id}`, (_event, cx) => { this.event = this.event === event.id ? null : event.id; cx.notify(); })).when(this.event === event.id, el => el.child(div().text_size(11).text_color(t.dim).child(event.ref)).child(TextView.markdown(`event-body:${event.id}`, event.body ?? "")).child(div().text_size(11).text_color(t.muted).child(JSON.stringify(event.fields ?? event, null, 2))))));
  }

  trackerView() {
    const t = theme(), columns = this.preferences.layout === "C2" && this.bodySize.width >= 600;
    const bar = h_flex().h(36).flex_none().px(6).gap(3).items_center().border_b(1).border_color(t.border).children(["initiatives", "ready", "review", "blocked", "all"].map(queue => button(`queue:${queue}`, queue[0].toUpperCase() + queue.slice(1), (_event, cx) => { this.queue = queue; this.selected = null; this.detail = null; this.detailRevision++; this.remember(); cx.notify(); }).text_size(11).px(6).bg(this.queue === queue ? t.selected : t.background)));
    const size = this.bodySize, selected = Boolean(this.selected);
    const drawerTop = !selected || this.drawer === "closed" ? size.height : this.drawer === "expanded" ? 0 : Math.round(size.height / 2);
    const body = columns
      ? h_flex().size_full().min_h(0).child(div().w(360).min_w(240).h_full().border_r(1).border_color(t.border).child(this.treeView())).child(v_flex().flex_1().min_w(0).h_full().bg(t.chrome).child(this.recordView()))
      : div().id("tracker-drawer-body").relative().size_full().min_h(0).overflow_hidden()
        .child(this.treeView(selected && this.drawer === "peek" ? "50%" : "100%"))
        .when(selected, el => el.child(v_flex().id("tracker-detail-drawer").absolute().left(0).right(0).top(drawerTop).h(size.height).bg(t.chrome).border_t(1).border_color(t.border).transition("top", { duration: this.preferences.motion ? this.drawer === "closed" ? 240 : 340 : 0, easing: "ease-out" })
          .child(h_flex().h(44).flex_none().px(10).gap(7).items_center().border_b(1).border_color(t.border)
            .child(div().w(24).h(3).rounded(2).bg(t.dim))
            .child(div().flex_1().text_size(10).text_color(t.muted).child(`${this.selected.id} · Details`))
            .child(button("drawer-expand", this.drawer === "expanded" ? "↓ Collapse" : "↑ Expand", (_event, cx) => { this.drawer = this.drawer === "expanded" ? "peek" : "expanded"; this.remember(); cx.notify(); }))
            .child(button("drawer-close", "×", (_event, cx) => { this.drawer = "closed"; this.focus.focus(); this.remember(); cx.notify(); }, { label: "Close details", disabled: this.drawer === "closed" })))
          .child(v_flex().h(this.drawer === "peek" ? Math.max(1, size.height / 2 - 44) : Math.max(1, size.height - 44)).min_h(0).child(this.recordView()))));
    return v_flex().flex_1().min_h(0).child(bar).child(div().id("tracker-body-size").flex_1().min_h(0).on_size_change((next, cx) => { if (Math.abs(next.height - this.bodySize.height) > 1 || Math.abs(next.width - this.bodySize.width) > 1) { this.bodySize = next; cx.notify(); } }).child(body));
  }

  render(cx) {
    if (this.mode === "action") return renderAction(this);
    this.follow(cx);
    const t = theme(), title = this.mode === "context" ? "Context" : "Tracker";
    return v_flex().id(`shared-context:${this.mode}`).track_focus(this.focus).size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(13)
      .on_key_down((event, cx) => { if (this.selectKeyHandlers) for (const id in this.selectKeyHandlers) if (this.selectKeyHandlers[id](event, cx)) return; if (event.key !== "escape" || this.mode !== "tracker" || (this.preferences.layout === "C2" && this.bodySize.width >= 600) || !this.selected || this.drawer === "closed") return; this.drawer = this.drawer === "expanded" ? "peek" : "closed"; this.focus.focus(); this.remember(); cx.stop_propagation(); cx.notify(); })
      .child(h_flex().h(42).flex_none().px(14).gap(7).items_center().border_b(1).border_color(t.border).child(icon(this.mode === "context" ? "context" : "tracker")).child(div().font_semibold().child(title)).child(div().flex_1().min_w(0).truncate().text_right().text_size(10).text_color(t.dim).child(this.context?.identity ?? ""))
        .child(button("context-settings", "⚙", () => run("mod.open", { name: "better-config" }), { label: "Open mod settings" }))
        .child(button("context-refresh", "↻", (_event, cx) => this.refresh(cx), { label: "Refresh shared context", disabled: this.loading })))
      .when(Boolean(this.error), el => el.child(note(this.error, true)))
      .when(!this.preferencesReady && !this.error, el => el.child(note("Read panel settings…")))
      .when(this.preferencesReady && !this.context && this.loading && !this.error, el => el.child(note("Read repository context…")))
      .when(Boolean(this.context) && !this.context.ready, el => el.child(this.onboarding()))
      .when(Boolean(this.context?.ready), el => el.child(this.mode === "context" ? this.filesView() : this.snapshot ? this.trackerView() : note(this.error ? "The tracker is unavailable. Correct the error, then select Refresh." : "Read tracker records and workflow state…")))
      .when(Boolean(this.context?.ready), el => el.child(h_flex().h(25).flex_none().px(10).gap(8).items_center().border_t(1).border_color(t.border).text_size(10).text_color(t.dim).child(this.loading ? "Refresh records…" : `Canonical records · ${this.context.mode}`).when(this.mode === "tracker", el => el.child("Parent → prerequisites · ↗ shared"))));
  }
}
