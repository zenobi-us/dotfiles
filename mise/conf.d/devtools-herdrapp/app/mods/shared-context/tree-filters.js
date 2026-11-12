import { div } from "gpui-kit";
import { h_flex, v_flex, Popover, Checkbox } from "gpui-base";
import { button } from "./ui.js";
import { theme } from "./design.js";
import { DEFAULT_FILTERS, FILTER_KEYS, filterRestrictions } from "./filter-model.js";

const choices = [["all", "All"], ["initiatives", "Initiatives"], ["ready", "Ready"], ["review", "Review"], ["blocked", "Blocked"]];

export function initTreeFilters(view, cx) {
  view.filterFocus = cx.focus_handle();
  view.filterChoicesFocus = choices.map(() => cx.focus_handle());
  view.filtersOpen = false;
  cx.bind_keys([
    { keystroke: "space", action: "shared-context.toggle-filter", context: "SharedContextFilters" },
    { keystroke: "enter", action: "shared-context.toggle-filter", context: "SharedContextFilters" },
    { keystroke: "tab", action: "shared-context.close-filters", context: "SharedContextFilters" },
    { keystroke: "shift-tab", action: "shared-context.close-filters", context: "SharedContextFilters" },
  ]);
}

export function closeTreeFilters(view, cx, restoreFocus = true) {
  view.filtersOpen = false;
  if (restoreFocus) view.filterFocus.focus();
  cx.notify();
}

export function treeFilters(view) {
  const t = theme(), restrictions = filterRestrictions(view.filters), open = view.filtersOpen;
  const toggle = cx => {
    view.filtersOpen = !open;
    (view.filtersOpen ? view.filterChoicesFocus[0] : view.filterFocus).focus();
    cx.notify();
  };
  const trigger = h_flex().id("tracker-filter-trigger").role("button").accessibility_label(`Filter tracker tree. ${restrictions} active restrictions.`)
    .track_focus(view.filterFocus).tab_index(0).h(32).px(8).items_center().justify_center().rounded(0).bg("#00000000").border_0().text_color(t.accent).cursor_pointer().child("⋮")
    .when(view.filterFocus.is_focused(), el => el.border_2().border_color(t.accent))
    .on_key_down((event, cx) => { if (["enter", "space", "down"].includes(event.key)) { toggle(cx); cx.stop_propagation(); } })
    .when(restrictions > 0, el => el.child(div().ml(4).px(4).border_1().border_color(t.border).text_size(10).child(String(restrictions))));
  const all = restrictions === 0;
  const content = v_flex().id("tracker-filter-menu").w(248).p(12).gap(4).rounded(0).border_1().border_color(t.border).bg(t.popover).text_color(t.foreground).text_size(13).font_family("JetBrains Mono")
    .key_context("SharedContextFilters")
    .on_action("shared-context.close-filters", (_event, cx) => { closeTreeFilters(view, cx); cx.stop_propagation(); })
    .on_key_down((event, cx) => {
      if (event.key === "escape") { closeTreeFilters(view, cx); cx.stop_propagation(); }
      else if (["up", "down", "home", "end"].includes(event.key)) {
        const index = view.filterChoicesFocus.findIndex(focus => focus.is_focused());
        const next = event.key === "home" ? 0 : event.key === "end" ? choices.length - 1 : (index + (event.key === "up" ? choices.length - 1 : 1)) % choices.length;
        view.filterChoicesFocus[next].focus(); cx.stop_propagation(); cx.notify();
      }
    })
    .child(h_flex().items_center().justify_between().child(div().font_weight(500).child("Filter tree"))
      .child(button("tracker-filter-reset", "Reset", (_event, cx) => view.setFilters({ ...DEFAULT_FILTERS }, cx))))
    .children(choices.map(([key, label], index) => {
      const checked = key === "all" ? all : view.filters[key];
      return Checkbox.new(`tracker-filter:${key}`).checked(checked).track_focus(view.filterChoicesFocus[index]).tab_index(0).key_context("SharedContextFilters")
        .accessibility_label(key === "all" && restrictions > 0 && restrictions < FILTER_KEYS.length ? "All. Some filters selected." : label)
        .h(36).w_full().px(8).rounded(0).bg(view.filterChoicesFocus[index].is_focused() ? t.selected : t.popover)
        .on_change((value, cx) => view.setFilters(key === "all" ? Object.fromEntries(FILTER_KEYS.map(key => [key, value])) : { ...view.filters, [key]: value }, cx))
        .on_action("shared-context.toggle-filter", (_event, cx) => {
          view.setFilters(key === "all" ? Object.fromEntries(FILTER_KEYS.map(key => [key, !checked])) : { ...view.filters, [key]: !checked }, cx);
          cx.stop_propagation();
        })
        .child(h_flex().gap(8).items_center()
          .child(div().size(16).border_1().border_color(checked ? t.accent : t.border).text_color(t.accent).text_size(13).child(checked ? "✓" : key === "all" && !all && restrictions < FILTER_KEYS.length ? "−" : ""))
          .child(div().child(label)));
    }))
    .child(div().pt(8).border_t(1).border_color(t.border).text_color(t.muted).whitespace_normal().child("Statuses combine with OR. All includes completed and other records. Prerequisites remain visible for context."));
  return h_flex().id("tracker-tree-header").h(48).flex_none().px(12).items_center().justify_between().border_b(1).border_color(t.border)
    .child(div().text_size(10).font_weight(500).text_color(t.muted).child("TRACKER"))
    .child(Popover.new("tracker-filters-popover").open(view.filtersOpen).anchor("top_right").track_focus(view.filterChoicesFocus[0])
      .on_open_change((open, cx) => { view.filtersOpen = open; cx.notify(); }).trigger(trigger).content(content));
}
