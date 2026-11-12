// Native graph surfaces share canonical records and direct action launches.
import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { openOverlay, closeOverlay, props, theme } from "herdr";
import { request } from "./client.js";
import { dependencyGraph } from "./graph.js";
import { button, note } from "./ui.js";
import { initActionMenus, actionDropdown } from "./action-menu.js";
import { ticketDisplayState } from "./tree.js";

export function graphView(view, key, roots, focusId) {
  const t = theme();
  let graph;
  try { graph = dependencyGraph(view.snapshot, roots); }
  catch (error) { return note(String(error.message ?? error), true); }
  if (!graph.nodes.length) return note("This initiative has no tickets yet.");
  view.graphViews ??= new Map();
  if (!view.graphViews.has(key)) view.graphViews.set(key, { zoom: 1, x: 0, y: 0, width: 600, height: 320, selected: focusId });
  const state = view.graphViews.get(key), z = state.zoom;
  const point = node => ({ x: node.x * z + state.x, y: node.y * z + state.y });
  const nodes = new Map(graph.nodes.map(node => [node.record.id, node]));
  const fit = cx => { state.zoom = Math.max(.15, Math.min(1, (state.width - 24) / graph.width, (state.height - 24) / graph.height)); state.x = 8; state.y = 8; cx.notify(); };
  const menu = record => openOverlay({ mod: "shared-context", kind: "popup", width: 360, height: 440, props: { mode: "graph-actions", cwd: view.context.repository, space: view.where.space, id: record.id, kind: "ticket" } });
  const edgeElements = [];
  for (const edge of graph.edges) {
    const from = point(nodes.get(edge.from)), to = point(nodes.get(edge.to));
    const x1 = from.x + 230 * z, y1 = from.y + 44 * z, x2 = to.x, y2 = to.y + 44 * z, mid = x1 + 18 * z;
    edgeElements.push(div().absolute().left(x1).top(y1).w(Math.max(1, mid - x1)).h(1).bg(t.muted), div().absolute().left(mid).top(Math.min(y1, y2)).w(1).h(Math.max(1, Math.abs(y2 - y1))).bg(t.muted), div().absolute().left(mid).top(y2).w(Math.max(1, x2 - mid)).h(1).bg(t.muted), div().absolute().left(x2 - 8).top(y2 - 10).text_size(14).text_color(t.muted).child("▸"));
  }
  const surface = div().id(`graph-canvas:${key}`).relative().flex_1().min_h(120).overflow_hidden().bg(t.background).border_1().border_color(t.border)
    .accessibility_label("Dependency graph. Arrows point from prerequisites to blocked tickets. Drag empty space to pan; use zoom controls.")
    .on_size_change((size, cx) => { if (Math.abs(state.width - size.width) > 1 || Math.abs(state.height - size.height) > 1) { state.width = size.width; state.height = size.height; cx.notify(); } })
    .on_mouse_down("left", (event, cx) => { state.drag = { x: event.position.x, y: event.position.y, panX: state.x, panY: state.y }; cx.stop_propagation(); })
    .on_mouse_move((event, cx) => { if (!state.drag) return; state.x = state.drag.panX + event.position.x - state.drag.x; state.y = state.drag.panY + event.position.y - state.drag.y; cx.notify(); })
    .on_mouse_up("left", () => { state.drag = null; })
    .on_mouse_down_out(() => { state.drag = null; })
    .on_hover(hovered => { if (!hovered) state.drag = null; })
    .on_scroll_wheel((event, cx) => { state.x -= event.delta.x; state.y -= event.delta.y; cx.stop_propagation(); cx.notify(); })
    .children(edgeElements)
    .children(graph.nodes.map(node => {
      const record = node.record, p = point(node), status = ticketDisplayState(record, view.snapshot.states?.[record.id]);
      return button(`graph-node:${key}:${record.id}`, "", (_event, cx) => { state.selected = record.id; cx.notify(); }, { label: `${record.title}. ${record.id}. ${status}. Shift F10 opens actions.`, height: 88 * z })
        .absolute().left(p.x).top(p.y).w(230 * z).px(12 * z).rounded(0).border_1().border_color(record.id === focusId ? t.accent : record.id === state.selected ? t.ansi4 : t.border).bg(record.id === focusId ? t.selected : t.raised).text_color(t.foreground)
        .tooltip(`${record.title}\n${record.id} · ${status}\nRight-click for canonical actions`)
        .on_mouse_down("left", (_event, cx) => cx.stop_propagation())
        .on_mouse_down("right", (_event, cx) => { cx.stop_propagation(); menu(record); })
        .on_key_down((event, cx) => { if (event.keystroke === "shift-f10" || event.key === "menu") { cx.stop_propagation(); menu(record); } })
        .child(v_flex().w_full().min_w(0).gap(5 * z).child(div().text_size(Math.max(8, 12 * z)).truncate().child(record.title)).child(div().text_size(Math.max(7, 10 * z)).text_color(t.muted).truncate().child(record.id)).child(div().text_size(Math.max(7, 10 * z)).text_color(status === "READY" || status === "DONE" ? t.ansi2 : status === "BLOCKED" || status === "ERROR" ? t.blocked : t.ansi3).child(status)));
    }));
  const selected = nodes.get(state.selected)?.record;
  return v_flex().size_full().min_h(0).gap(8)
    .child(h_flex().flex_none().gap(6).items_center().child(div().flex_1().text_size(10).text_color(t.muted).child("Prerequisite → blocked ticket · drag to pan"))
      .child(button(`zoom-out:${key}`, "−", (_event, cx) => { state.zoom = Math.max(.15, state.zoom / 1.2); cx.notify(); }, { label: "Zoom out" }))
      .child(div().w(36).text_size(10).text_color(t.muted).child(`${Math.round(z * 100)}%`))
      .child(button(`zoom-in:${key}`, "+", (_event, cx) => { state.zoom = Math.min(2, state.zoom * 1.2); cx.notify(); }, { label: "Zoom in" }))
      .child(button(`graph-fit:${key}`, "Fit", (_event, cx) => fit(cx))))
    .child(surface)
    .child(h_flex().flex_none().gap(8).items_center()
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.muted).child(selected?.title ?? "Select a node. Right-click or Shift+F10 for actions."))
      .when(Boolean(selected), el => el
        .child(button(`graph-details:${key}`, "Open details", (_event, cx) => view.choose(selected, "ticket", cx)))
        .child(button(`graph-actions:${key}`, "Actions…", () => menu(selected)))));
}

export function initGraphMenu(view, cx) {
  view.menuProps = props(); view.menuLoading = true; view.menuError = "";
  initActionMenus(view, cx);
  cx.spawn(async cx => {
    try { view.menuDetail = await request("detail", view.menuProps.cwd, { id: view.menuProps.id, kind: "ticket" }); }
    catch (error) { view.menuError = String(error.message ?? error); }
    finally { view.menuLoading = false; cx.notify(); }
  });
}

export function renderGraphMenu(view) {
  const t = theme(), p = view.menuProps;
  return v_flex().size_full().p(12).gap(8).bg(t.popover).text_color(t.foreground).text_size(13).font_family("JetBrains Mono")
    .child(div().font_semibold().child(view.menuDetail?.record.title ?? p.id))
    .child(div().text_size(10).text_color(t.muted).child(p.id))
    .when(view.menuLoading, el => el.child(note("Inspect canonical actions…")))
    .when(Boolean(view.menuError), el => el.child(note(view.menuError, true)))
    .children((view.menuDetail?.actions ?? []).map(choice => actionDropdown(view, choice, { ...p, kind: "ticket" })))
    .child(button("close-graph-menu", "Close", () => closeOverlay(p.overlay), { disabled: view.actionBusy }));
}
