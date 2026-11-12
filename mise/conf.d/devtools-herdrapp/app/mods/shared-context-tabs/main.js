// Shared context has its own Files/Tracker navigation inside the panel.
import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, panes, run, openOverlay, theme, window, shared, layout, settings } from "herdr";
function find(node, id) { if (node?.id === id) return node; for (const child of node?.children ?? []) { const found = find(child, id); if (found) return found; } return null; }
export default class ContextTabs extends View {
  init() { this.pressed = null; this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}"); this.contextPanels = JSON.parse(localStorage.getItem("context-panels") ?? "{}"); }
  syncPanel(space, panel, body, enabled) {
    if (!space || !panel) return;
    const now = panel.hidden ? null : body?.active ?? null;
    if (space.id !== this.space) {
      const first = this.space === undefined; this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = this.panels[space.id] ?? null, want = enabled.includes(stored) ? stored : null;
        if (want !== now) {
          this.pending = { want, until: Date.now() + 1000 };
          if (want) { run("layout.select", { stack: "panel-body", child: want }); run("layout.show", { id: "panel" }); }
          else run("layout.hide", { id: "panel" });
          return;
        }
      }
    }
    if (this.pending) { if (this.pending.want !== now && Date.now() < this.pending.until) return; this.pending = null; }
    if (["context", "tracker"].includes(now) && this.contextPanels[space.id] !== now) {
      this.contextPanels[space.id] = now;
      localStorage.setItem("context-panels", JSON.stringify(this.contextPanels));
    }
    if (this.panels[space.id] === now) return;
    this.panels[space.id] = now; localStorage.setItem("panels", JSON.stringify(this.panels));
  }
  render() {
    const t = theme(), space = spaces().find(item => item.active), shown = space?.tabs ?? [];
    const stop = (_event, cx) => cx.stop_propagation();
    const button = (id, label, action) => div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6).text_color(t.dim).hover(el => el.bg(t.hover)).on_mouse_down("left", stop).on_click(action).child(label);
    const item = (tab, index) => {
      const program = panes().find(pane => pane.tab === tab.id && pane.program?.agent)?.program ?? panes().find(pane => pane.tab === tab.id)?.program;
      const name = /^tb\d+$/.test(tab.name) ? program?.name ?? "Terminal" : tab.name;
      return h_flex().id(`tab-${tab.id}`).h(29).px(10).gap(7).rounded(7).items_center().flex_none().text_size(12.8).border_1().border_color(tab.active ? t.border : t.chrome).bg(tab.active ? t.raised : t.chrome).text_color(tab.active ? t.foreground : t.muted).hover(el => el.bg(t.hover))
        .on_mouse_down("left", (event, cx) => { cx.stop_propagation(); this.pressed = index; if (event.click_count === 2) run("tab.rename", { id: tab.id }); })
        .on_mouse_up("left", () => { const from = this.pressed; this.pressed = null; if (from !== null && from !== index) run("tab.move", { id: shown[from].id, index: space.tabs.findIndex(item => item.id === tab.id) + 1 }); else run("tab.select", { id: tab.id }); })
        .on_mouse_down("right", (_event, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: tab.id, space: space.id } } }); })
        .when(Boolean(program?.icon), el => el.child(program.tint ? svg(program.icon).size(14).text_color(t.muted) : image(program.icon).size(14)))
        .child(div().max_w(170).truncate().child(tab.zoomed ? `${name} Z` : name))
        .when(tab.status === "working", el => el.child(svg("mods/workspace-chrome/spinner.svg").size(12).spin(900)))
        .when(["blocked", "done"].includes(tab.status), el => el.child(div().size(6).rounded(3).bg(t[tab.status])))
        .when(tab.active, el => el.child(button(`close-${tab.id}`, "×", (_event, cx) => { cx.stop_propagation(); run("tab.close", { id: tab.id }); })));
    };
    const root = layout(), sidebar = find(root, "sidebar"), w = window();
    const padding = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights ? Math.max(10, (root.traffic_lights[0] + 64) / settings().zoom - (sidebar?.hidden ? 0 : sidebar?.size?.px ?? 0)) : 10;
    const panel = find(root, "panel"), body = find(root, "panel-body"), enabled = [...new Set([...(shared("workspace.panels") ?? ["files", "changes"]), "context", "tracker"])];
    this.syncPanel(space, panel, body, enabled);
    const panelButton = (id, label, icon) => {
      const active = panel && !panel.hidden && (id === "context" ? ["context", "tracker"].includes(body?.active) : body?.active === id);
      return h_flex().id(`panel-${id}`).h(28).px(8).gap(5).flex_none().items_center().rounded(6).text_size(12).bg(active ? t.selected : t.chrome).text_color(active ? t.foreground : t.muted).hover(el => el.bg(t.hover)).on_mouse_down("left", stop).on_click(() => {
        if (active) run("layout.hide", { id: "panel" });
        else { run("layout.select", { stack: "panel-body", child: id === "context" ? this.contextPanels[space.id] ?? "tracker" : id }); run("layout.show", { id: "panel" }); }
      }).child(svg(icon).size(14)).child(label);
    };
    return h_flex().size_full().min_w(0).px(10).pl(padding).gap(3).items_center().bg(t.chrome).border_b(1).border_color(t.border).on_mouse_up("left", () => { this.pressed = null; })
      .child(h_flex().id("tab-scroll").flex_1().min_w(0).h_full().items_center().gap(3).overflow_x_scrollbar().children(shown.map(item)))
      .child(button("tab-new", "+", () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })))
      .when(enabled.includes("files"), el => el.child(panelButton("files", "Files", "mods/files/file.svg")))
      .when(enabled.includes("changes"), el => el.child(panelButton("changes", "Changes", "mods/changes/changes.svg")))
      .child(panelButton("context", "Shared context", "mods/shared-context/icons/context.svg"))
      .when(w?.buttons, el => el.child(button("minimize", "−", () => run("window.minimize"))).child(button("maximize", "□", () => run("window.maximize"))).child(button("close-window", "×", () => run("window.close"))));
  }
}
