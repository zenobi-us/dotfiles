import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme } from "herdr";
import { button } from "./ui.js";

export function openMetadata(view, cx) {
  if (!view.context?.metadata) return;
  view.metadataOpen = true;
  view.metadataEntered = false;
  view.metadataFocus.focus();
  cx.notify();
}

export function initMetadata(view, cx) {
  view.metadataOpen = false;
  view.metadataFocus = cx.focus_handle();
}

export function renderMetadata(view) {
  const t = theme(), context = view.context.metadata;
  const close = (_event, cx) => { view.metadataOpen = false; view.focus.focus(); cx.notify(); };
  const routes = Object.entries(context.routes).map(([kind, route]) => {
    const inherited = route.inherits ? context.routes[route.inherits] : null;
    return metadataRow(kind, `${inherited?.store ?? route.store ?? "External"} · ${route.adapter}${route.inherits ? ` · inherits ${route.inherits}` : ""}`, t);
  });
  const layoutLabels = { tracker: "Tracker", tickets: "Tickets", initiatives: "Initiatives", sources: "Sources" };
  return v_flex().id("agent-context-modal-backdrop").absolute().inset_0().items_center().overflow_hidden()
    .on_mouse_down("left", (event, cx) => { cx.stop_propagation(); close(event, cx); })
    .child(div().absolute().inset_0().bg(t.background).opacity(.65))
    .child(v_flex().id("agent-context-modal").relative().top(view.metadataEntered ? 16 : -1600).transition("top", { duration: 220, easing: "ease-out" })
      .w("92%").max_w(920).h("85%").min_h(0).flex_none().bg(t.popover).border_1().border_color(t.border).text_color(t.foreground).text_size(13).font_family("JetBrains Mono")
      .role("dialog").accessibility_label("Shared-context agent metadata").track_focus(view.metadataFocus).tab_index(0)
      .on_size_change((_size, cx) => { if (!view.metadataEntered) { view.metadataEntered = true; cx.notify(); } })
      .on_mouse_down("left", (_event, cx) => cx.stop_propagation())
      .on_key_down((event, cx) => { if (event.key === "escape") { cx.stop_propagation(); close(event, cx); } if (event.key === "tab") { cx.stop_propagation(); view.metadataFocus.focus(); } })
      .child(h_flex().flex_none().items_center().gap(12).p(16).border_b(1).border_color(t.border)
        .child(v_flex().flex_1().min_w(0).gap(6)
          .child(div().text_size(16).font_semibold().child("Repository context"))
          .child(div().whitespace_normal().text_size(11).text_color(t.muted).child(context.slug)))
        .child(button("close-agent-metadata", "Close · Esc", close)))
      .child(v_flex().id("agent-context-details").flex_1().min_h(0).overflow_y_scrollbar().p(20).gap(24)
        .child(metadataSection("Repository", [
          metadataRow("Origin", context.origin, t),
          metadataRow("Storage mode", context.mode, t),
          metadataRow("Default store", context.storage, t),
          metadataRow("Route configuration", context.routeSource, t),
        ], t))
        .child(metadataSection("Context roots", [
          metadataRow("Repository", context.repositoryRoot, t),
          metadataRow("Alignment", context.alignmentRoot, t),
          metadataRow("Shared context", context.sharedRoot, t),
        ], t))
        .child(metadataSection("Storage routes", routes, t))
        .when(Boolean(context.layout), el => el.child(metadataSection("Collection paths", Object.entries(context.layout).map(([key, value]) => metadataRow(layoutLabels[key] ?? key, value, t)), t)))
        .child(metadataSection("Agent instructions", [
          metadataRow("Source", context.source, t),
          metadataRow("Delivery", context.storage === "shared" && context.instructions && context.source ? "Included in agent context" : "Loaded separately by the agent", t),
          ...(context.instructions ? [div().flex_none().whitespace_normal().text_color(t.muted).child(context.instructions)] : []),
        ], t))));
}

function metadataSection(title, rows, t) {
  return v_flex().flex_none().min_w(0).gap(8)
    .child(div().pb(8).border_b(1).border_color(t.border).text_size(13).font_semibold().text_color(t.accent).child(title))
    .children(rows);
}

function metadataRow(label, value, t) {
  return h_flex().flex_none().min_w(0).items_start().gap(16).py(4)
    .child(div().w(160).flex_none().text_color(t.muted).child(label))
    .child(div().flex_1().min_w(0).whitespace_normal().child(value ?? "Not configured"));
}
