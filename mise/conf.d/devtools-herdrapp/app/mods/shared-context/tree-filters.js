// Presets select ticket statuses; fine tuning keeps tree structure independent.
import { div } from "gpui-kit";
import { h_flex, v_flex, Popover, Checkbox } from "gpui-base";
import { button } from "./ui.js";
import { theme } from "herdr";
import { DEFAULT_FILTERS, STATUS_FILTERS, FILTER_PRESETS, applyFilterPreset, selectedFilterPreset, filterRestrictions } from "./filter-model.js";

const baseControls = ["reset", ...FILTER_PRESETS.map(preset => preset.id), "fine-tune"];
const fineControls = ["initiatives", "all", ...STATUS_FILTERS.map(([key]) => key)];

export function initTreeFilters(view, cx) {
  view.filterFocus = cx.focus_handle();
  view.filterChoicesFocus = Object.fromEntries([...baseControls, ...fineControls].map(key => [key, cx.focus_handle()]));
  view.filtersOpen = false;
  view.filtersFineTune = false;
  cx.bind_keys([
    { keystroke: "space", action: "shared-context.toggle-filter", context: "SharedContextFilters" },
    { keystroke: "enter", action: "shared-context.toggle-filter", context: "SharedContextFilters" },
  ]);
}

export function closeTreeFilters(view, cx, restoreFocus = true) {
  view.filtersOpen = false;
  if (restoreFocus) view.filterFocus.focus();
  view.changed(cx);
}

export function treeFilters(view) {
  const t = theme(), restrictions = filterRestrictions(view.filters), preset = selectedFilterPreset(view.filters);
  const statusCount = STATUS_FILTERS.filter(([key]) => view.filters[key]).length;
  const controls = view.filtersFineTune ? [...baseControls, ...fineControls] : baseControls;
  const open = (value, cx) => {
    view.filtersOpen = value;
    (value ? view.filterChoicesFocus.everything : view.filterFocus).focus();
    view.changed(cx);
  };
  const activate = (key, cx) => {
    if (key === "reset") view.setFilters({ ...DEFAULT_FILTERS }, cx);
    else if (key === "fine-tune") { view.filtersFineTune = !view.filtersFineTune; view.changed(cx); }
    else if (key === "all") view.setFilters({ ...view.filters, ...Object.fromEntries(STATUS_FILTERS.map(([key]) => [key, statusCount !== STATUS_FILTERS.length])) }, cx);
    else if (fineControls.includes(key)) view.setFilters({ ...view.filters, [key]: !view.filters[key] }, cx);
    else view.setFilters(applyFilterPreset(view.filters, key), cx);
  };
  const trigger = h_flex().id("tracker-filter-trigger").role("button").accessibility_label(`Filter tracker tree. ${restrictions} active restrictions.`)
    .track_focus(view.filterFocus).tab_index(0).h(32).px(8).items_center().justify_center().rounded(0).bg("#00000000").border_0().text_color(t.accent).cursor_pointer().child("⋮")
    .when(view.filterFocus.is_focused(), el => el.border_2().border_color(t.accent))
    .on_key_down((event, cx) => { if (["enter", "space", "down"].includes(event.key)) { open(!view.filtersOpen, cx); cx.stop_propagation(); } })
    .when(restrictions > 0, el => el.child(div().ml(4).px(4).border_1().border_color(t.border).text_size(10).child(String(restrictions))));
  const control = (key, label) => button(`tracker-filter:${key}`, label, (_event, cx) => activate(key, cx))
    .track_focus(view.filterChoicesFocus[key]).tab_index(0).key_context("SharedContextFilters")
    .bg(view.filterChoicesFocus[key].is_focused() ? t.selected : t.popover).text_color(t.foreground)
    .on_action("shared-context.toggle-filter", (_event, cx) => { activate(key, cx); cx.stop_propagation(); });
  const checkbox = (key, label) => {
    const checked = key === "all" ? statusCount === STATUS_FILTERS.length : view.filters[key];
    const mixed = key === "all" && statusCount > 0 && statusCount < STATUS_FILTERS.length;
    return Checkbox.new(`tracker-filter:${key}`).checked(checked).indeterminate(mixed)
      .track_focus(view.filterChoicesFocus[key]).tab_index(0).key_context("SharedContextFilters").accessibility_label(label)
      .h(30).flex_none().w_full().px(6).rounded(0).bg(view.filterChoicesFocus[key].is_focused() ? t.selected : t.popover)
      .on_change((_value, cx) => activate(key, cx))
      .on_action("shared-context.toggle-filter", (_event, cx) => { activate(key, cx); cx.stop_propagation(); })
      .child(h_flex().gap(8).items_center()
        .child(div().size(15).border_1().border_color(checked || mixed ? t.accent : t.border).text_color(t.accent).text_size(12).child(mixed ? "−" : checked ? "✓" : ""))
        .child(div().child(label)));
  };
  const heading = text => div().pt(8).pb(4).text_size(10).text_color(t.muted).child(text);
  const content = v_flex().id("tracker-filter-menu").w(280).max_h(620).overflow_y_scrollbar().p(12).gap(4).rounded(0).border_1().border_color(t.border).bg(t.popover).text_color(t.foreground).text_size(12).font_family("JetBrains Mono")
    .key_context("SharedContextFilters")
    .on_key_down((event, cx) => {
      if (event.key === "escape") { closeTreeFilters(view, cx); cx.stop_propagation(); }
      else if (["up", "down", "home", "end"].includes(event.key)) {
        const index = controls.findIndex(key => view.filterChoicesFocus[key].is_focused());
        const next = event.key === "home" ? 0 : event.key === "end" ? controls.length - 1 : (index + (event.key === "up" ? controls.length - 1 : 1)) % controls.length;
        view.filterChoicesFocus[controls[next]].focus(); cx.stop_propagation(); view.changed(cx);
      }
    })
    .child(h_flex().flex_none().items_center().justify_between().child(div().font_weight(500).child("Filter tree"))
      .child(control("reset", "Reset").text_size(11).text_color(t.accent)))
    .child(heading("START WITH A VIEW"))
    .children(FILTER_PRESETS.map(item => control(item.id, "").h(54).flex_none().w_full().px(10).border_1().border_color(preset === item.id || view.filterChoicesFocus[item.id].is_focused() ? t.accent : t.border)
      .bg(preset === item.id || view.filterChoicesFocus[item.id].is_focused() ? t.selected : t.popover).accessibility_label(`${item.label}. ${item.description}.${preset === item.id ? " Selected." : ""}`)
      .child(v_flex().w_full().gap(3)
        .child(h_flex().items_center().justify_between().child(div().text_size(12).child(item.label)).child(div().text_color(t.accent).child(preset === item.id ? "✓" : "")))
        .child(div().text_size(10).text_color(t.muted).child(item.description)))))
    .child(control("fine-tune", `${view.filtersFineTune ? "▾" : "▸"} Fine tune${preset === "custom" ? " · Custom" : ""}`)
      .mt(8).border_t(1).border_color(t.border).w_full().text_color(t.accent)
      .accessibility_label(`Fine tune. ${view.filtersFineTune ? "Expanded" : "Collapsed"}.${preset === "custom" ? " Custom statuses." : ""}`))
    .when(view.filtersFineTune, el => el
      .child(heading("TREE STRUCTURE"))
      .child(checkbox("initiatives", "Group by initiative"))
      .child(heading("TICKET STATUS · MATCH ANY"))
      .child(checkbox("all", "All statuses"))
      .children(STATUS_FILTERS.map(([key, label]) => checkbox(key, label))))
    .child(div().flex_none().pt(8).text_size(10).text_color(t.muted).whitespace_normal()
      .child(`${statusCount === STATUS_FILTERS.length ? "All statuses" : statusCount ? `${statusCount} statuses selected` : "No statuses selected"} · ${view.filters.initiatives ? "Grouped" : "Flat list"}`));
  return h_flex().id("tracker-tree-header").h(48).flex_none().px(12).items_center().justify_between().border_b(1).border_color(t.border)
    .child(div().text_size(10).font_weight(500).text_color(t.muted).child("TRACKER"))
    .child(Popover.new("tracker-filters-popover").open(view.filtersOpen).anchor("top_right").track_focus(view.filterChoicesFocus.everything)
      .on_open_change((value, cx) => open(value, cx)).trigger(trigger).content(content));
}
