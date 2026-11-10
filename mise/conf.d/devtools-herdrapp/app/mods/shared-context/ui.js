// Native controls share Herdr's file-tree spacing and theme colors.
import { div, svg } from "gpui-kit";
import { Button, h_flex, v_flex, Popup } from "gpui-base";
import { theme } from "herdr";
export function icon(name, size = 14) { return svg(`mods/shared-context/icons/${name}.svg`).size(size).flex_none(); }
export function typeColor(type, t) { return ({ initiative: t.ansi5, ticket: t.ansi4, prototype: t.ansi3, research: t.ansi6, planning: t.ansi13, record: t.ansi14 })[type] ?? t.muted; }
export function typeIcon(type) { return ({ initiative: "◇", ticket: "▤", prototype: "△", research: "⌕", planning: "▱", record: "▧" })[type] ?? "▧"; }
export function button(id, label, action, options = {}) {
  const t = theme(), disabled = Boolean(options.disabled);
  return Button.new(id).h(options.height ?? 28).px(8).rounded(6).bg(options.primary && !disabled ? t.solid : t.raised).text_color(disabled ? t.dim : options.primary ? t.solid_foreground : t.muted).text_size(12).disabled(disabled).accessibility_label(options.label ?? label).on_click(action).child(label);
}
export function note(text, error = false) { return div().p(12).text_size(12).text_color(error ? theme().blocked : theme().muted).child(text); }
export function select(view, id, label, value, choices, change) {
  const t = theme(), open = view.openSelect === id, triggerFocus = view.selectFocus[id];
  const close = (cx, restoreFocus = true) => { view.openSelect = null; if (restoreFocus) triggerFocus.focus(); cx.notify(); };
  const show = cx => { view.openSelect = id; view.selectIndex = choices.findIndex(choice => choice.value === value); view.focus.focus(); cx.notify(); };
  view.selectKeyHandlers ??= {};
  // The retained view root owns keys for both the closed trigger and the open popup.
  view.selectKeyHandlers[id] = (event, cx) => {
    if (view.openSelect !== id) {
      if (view.openSelect || !triggerFocus.is_focused() || (event.key !== "enter" && event.key !== "space" && event.key !== "up" && event.key !== "down")) return false;
      show(cx);
    } else if (event.key === "up" || event.key === "down") {
      view.selectIndex = ((view.selectIndex ?? 0) + (event.key === "down" ? 1 : -1) + choices.length) % choices.length;
      cx.notify();
    } else if (event.key === "enter") { change(choices[view.selectIndex].value, cx); close(cx); }
    else if (event.key === "escape") close(cx);
    else if (event.key === "tab") { close(cx); return false; }
    else return false;
    cx.stop_propagation();
    return true;
  };
  const selectedLabel = choices.find(choice => choice.value === value)?.label ?? value;
  const trigger = h_flex().id(`${id}-trigger`).role("button").accessibility_label(`${label}: ${selectedLabel}. ${open ? "Choices are open." : "Open choices."}`).track_focus(triggerFocus).tab_index(0).h(32).px(9).gap(6).items_center().border_1().border_color(open || triggerFocus.is_focused() ? t.accent : t.border).rounded(6).bg(t.input).text_color(t.foreground).cursor_pointer().on_click((_event, cx) => open ? close(cx) : show(cx)).child(div().flex_1().child(selectedLabel)).child(icon("down", 12));
  const list = v_flex().role("list_box").on_mouse_down_out((_event, cx) => { if (view.openSelect === id) close(cx, false); }).p(4).gap(2).bg(t.popover).children(choices.map((choice, index) =>
    div().id(`${id}-option:${index}`).role("list_box_option").accessibility_label(choice.label).aria_selected(choice.value === value)
      .when(index === view.selectIndex, el => el.aria_active_descendant())
      .child(button(`${id}-${index}`, choice.label, (_event, cx) => { change(choice.value, cx); close(cx); }).tab_stop(false).bg(index === view.selectIndex ? t.selected : t.popover))));
  return v_flex().gap(6).child(div().text_size(12).text_color(t.muted).child(label))
    .child(Popup.new(`${id}-popup`, trigger).when(open, el => el.content(list)));
}
