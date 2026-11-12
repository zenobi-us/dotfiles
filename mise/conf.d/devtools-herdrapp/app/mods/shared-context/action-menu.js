// Anchored action menus keep one selected preset and an optional detail draft per record.
import { div } from "gpui-kit";
import { h_flex, v_flex, Popup, Input, InputState } from "gpui-base";
import { theme } from "herdr";
import { button, note } from "./ui.js";
import { ACTION_PRESETS, actionPrompt } from "./action-model.js";
import { launchAction, invalidateAction } from "./action.js";

export function initActionMenus(view, cx) {
  invalidateAction(view); view.actionOpen = null;
  view.recordActionsOpen = null;
  view.recordActionsFocus = cx.focus_handle();
  view.actionDrafts = new Map();
  view.actionTriggerFocus = new Map(Object.keys(ACTION_PRESETS).map(action => [action, cx.focus_handle()]));
  view.actionFocus = cx.focus_handle();
  view.actionCancelFocus = cx.focus_handle(); view.actionLaunchFocus = cx.focus_handle();
  view.actionInputFocused = false;
  view.actionInput = InputState.new({ placeholder: "e.g. Focus on the narrow-screen flow" });
  view.actionInput.on("change", (_event, cx) => {
    if (view.actionOpen) view.actionOpen.draft.detail = view.actionInput.value();
    invalidateAction(view);
    view.actionError = ""; cx.notify();
  });
  view.actionInput.on("focus", () => { view.actionInputFocused = true; });
  view.actionInput.on("blur", () => { view.actionInputFocused = false; });
  view.actionInput.on("submit", (_event, cx) => submitActionMenu(view, cx));
}

export function actionDropdown(view, choice, given) {
  const t = theme(), open = view.actionOpen;
  const key = JSON.stringify([given.cwd, given.kind, given.id, choice.action]);
  const shown = open?.key === key;
  const disabled = view.actionBusy || Boolean(choice.disabledReason);
  const trigger = button(`action:${choice.action}`, `${choice.label} ▾`, (_event, cx) => shown ? closeActionMenu(view, cx) : openActionMenu(view, choice, given, cx), {
    disabled, label: `${choice.label}. ${shown ? "Close" : "Open"} preset and detail dropdown.`,
  }).track_focus(view.actionTriggerFocus.get(choice.action)).tab_index(0)
    .border_1().border_color(shown ? t.accent : t.border).bg(shown ? t.selected : t.raised)
    .tooltip(choice.disabledReason ?? `Choose a ${choice.label} prompt`)
    .on_key_down((event, cx) => {
      if (disabled || !["enter", "space", "down", "up"].includes(event.key)) return;
      cx.stop_propagation();
      if (!shown) openActionMenu(view, choice, given, cx);
      else view.actionFocus.focus();
    });
  return Popup.new(`action-popup:${choice.action}`, trigger)
    .when(shown, el => el.content(actionMenuContent(view)));
}

export function recordActionControl(view, choices, primary, given, status, palette) {
  const t = theme(), key = JSON.stringify([given.cwd, given.kind, given.id]);
  const pickerShown = view.recordActionsOpen === key;
  const promptShown = view.actionOpen?.given.id === given.id && view.actionOpen?.given.kind === given.kind;
  const label = primary?.label ?? status?.value ?? "No next action";
  const disabled = view.actionBusy || !primary || Boolean(primary.disabledReason);
  const showPicker = cx => {
    if (view.actionBusy) return;
    if (pickerShown) { view.recordActionsOpen = null; view.recordActionsFocus.focus(); }
    else {
      if (view.actionOpen) closeActionMenu(view, cx, false);
      view.recordActionsOpen = key;
      view.recordActionIndex = Math.max(0, choices.findIndex(choice => !choice.disabledReason));
      view.actionFocus.focus();
    }
    cx.notify();
  };
  const trigger = h_flex().min_w(0).max_w("100%").border_1().border_color(palette.border).bg(palette.value)
    .child(button("record-next-action", "", (_event, cx) => openActionMenu(view, primary, given, cx, view.recordActionsFocus), {
      disabled, label: primary ? `Next action: ${label}${primary.disabledReason ? `. ${primary.disabledReason}` : ". Open action prompt."}` : `No next action. ${label}`,
    }).h("auto").min_h(30).min_w(0).px(0).py(0).items_stretch().bg(palette.value).text_color(palette.valueText)
      .tooltip(primary?.disabledReason ?? (primary ? `Open ${label} prompt` : "No workflow action is recommended"))
      .child(h_flex().min_w(0).min_h(30).items_stretch()
        .child(div().flex_none().flex().items_center().px(8).py(5).bg(palette.label).text_color(palette.labelText).text_size(10).child(primary ? "next" : status?.label ?? "next"))
        .child(div().min_w(0).flex().items_center().px(8).py(5).whitespace_normal().text_size(10).child(label))))
    .child(button("record-other-actions", "▾", (_event, cx) => showPicker(cx), { disabled: view.actionBusy || !choices.length, label: "Other record actions" })
      .track_focus(view.recordActionsFocus).tab_index(0).w(30).px(0).h("auto").min_h(30).border_l(1).border_color(palette.border).bg(palette.label).text_color(palette.labelText)
      .on_key_down((event, cx) => { if (["enter", "space", "down", "up"].includes(event.key)) { cx.stop_propagation(); showPicker(cx); } }));
  const picker = () => v_flex().id("record-actions-menu").w(320).max_w("100%").p(6).gap(2).border_1().border_color(t.border).bg(t.popover)
    .track_focus(view.actionFocus).tab_index(0).accessibility_label("Record actions")
    .on_mouse_down_out((_event, cx) => { view.recordActionsOpen = null; cx.notify(); })
    .on_key_down((event, cx) => {
      if (event.key === "escape" || event.key === "tab") { view.recordActionsOpen = null; view.recordActionsFocus.focus(); cx.stop_propagation(); cx.notify(); return; }
      const enabled = choices.map((choice, index) => choice.disabledReason ? -1 : index).filter(index => index >= 0);
      if (!enabled.length) return;
      if (event.key === "enter" || event.key === "space") { cx.stop_propagation(); openActionMenu(view, choices[view.recordActionIndex], given, cx, view.recordActionsFocus); return; }
      if (!["up", "down", "home", "end"].includes(event.key)) return;
      cx.stop_propagation();
      const position = enabled.indexOf(view.recordActionIndex);
      view.recordActionIndex = enabled[event.key === "home" ? 0 : event.key === "end" ? enabled.length - 1 : (position + (event.key === "down" ? 1 : enabled.length - 1)) % enabled.length];
      cx.notify();
    })
    .children(choices.map((choice, index) => button(`record-action:${choice.action}`, "", (_event, cx) => openActionMenu(view, choice, given, cx, view.recordActionsFocus), { disabled: view.actionBusy || Boolean(choice.disabledReason), label: `${choice.label}${choice.disabledReason ? `. ${choice.disabledReason}` : ""}`, height: "auto" })
      .tab_stop(false).w_full().min_h(34).py(8).bg(index === view.recordActionIndex ? t.selected : t.popover).tooltip(choice.disabledReason ?? `Open ${choice.label} prompt`)
      .child(v_flex().w_full().min_w(0).gap(4)
        .child(div().whitespace_normal().child(`${choice.action === primary?.action ? "Next: " : ""}${choice.label}`))
        .when(Boolean(choice.disabledReason), el => el.child(div().whitespace_normal().text_size(10).text_color(t.muted).child(choice.disabledReason))))));
  return Popup.new("record-action-popup", trigger)
    .when(pickerShown || promptShown, el => el.content(promptShown ? actionMenuContent(view) : picker()));
}

function openActionMenu(view, choice, given, cx, returnFocus) {
  if (view.actionBusy || choice.disabledReason) return;
  view.recordActionsOpen = null;
  const key = JSON.stringify([given.cwd, given.kind, given.id, choice.action]);
  let draft = view.actionDrafts.get(key);
  if (!draft) { draft = { preset: 0, detail: "" }; view.actionDrafts.set(key, draft); }
  view.actionOpen = { key, choice, given, draft, returnFocus };
  invalidateAction(view);
  view.actionError = ""; view.openSelect = null;
  view.actionInput.set_value(draft.detail);
  view.actionFocus.focus(); cx.notify();
}

function closeActionMenu(view, cx, restoreFocus = true) {
  if (view.actionBusy || !view.actionOpen) return;
  const action = view.actionOpen.choice.action, returnFocus = view.actionOpen.returnFocus;
  invalidateAction(view);
  view.actionOpen = null; view.actionError = "";
  if (restoreFocus) (returnFocus ?? view.actionTriggerFocus.get(action)).focus();
  cx.notify();
}

function actionMenuContent(view) {
  const t = theme(), open = view.actionOpen, presets = ACTION_PRESETS[open.choice.action];
  const rows = presets.map((preset, index) => {
    const selected = open.draft.preset === index;
    const row = button(`choose-action-preset:${index}`, "", (_event, cx) => {
      if (view.actionBusy) return;
      invalidateAction(view);
      open.draft.preset = index; view.actionError = ""; view.actionFocus.focus(); cx.notify();
    }, { disabled: view.actionBusy, label: `${preset.label}${selected ? ". Selected" : ""}`, height: "auto" })
      .tab_stop(false).w_full().min_h(34).py(8).bg(selected ? t.selected : t.popover)
      .child(h_flex().w_full().gap(10).items_center()
        .child(div().w(12).text_color(selected ? t.accent : t.muted).child(selected ? "●" : "○"))
        .child(div().flex_1().min_w(0).whitespace_normal().text_color(t.foreground).child(preset.label)))
      .when(!preset.prompt, el => el.tooltip("Run the skill with this record only"));
    return div().id(`action-preset:${index}`).role("list_box_option").aria_selected(selected)
      .when(selected, el => el.aria_active_descendant()).child(row);
  });
  return v_flex().id("action-prompt-menu").role("dialog").accessibility_label(`${open.choice.label}: preset and additional instruction`)
    .w(360).max_w("100%").max_h(500).overflow_y_scrollbar().rounded(0).border_1().border_color(t.border).bg(t.popover).text_color(t.foreground).text_size(13).font_family("JetBrains Mono")
    .on_mouse_down_out((_event, cx) => closeActionMenu(view, cx, false))
    .on_key_down((event, cx) => actionMenuKey(view, event, cx))
    .child(v_flex().p(12).gap(5)
      .child(h_flex().gap(12).items_center().child(div().flex_1().font_semibold().child(open.choice.label)).child(div().text_size(10).text_color(t.muted).child("New pane ↗")))
      .child(div().text_size(11).text_color(t.muted).child("Choose a preset, then add optional detail.")))
    .child(v_flex().role("list_box").accessibility_label(`${open.choice.label} presets`).track_focus(view.actionFocus).tab_index(0).px(6).pb(8).gap(2).children(rows))
    .child(v_flex().p(12).gap(8).border_t(1).border_color(t.border)
      .child(div().text_size(11).text_color(t.muted).child("Additional instruction · optional"))
      .child(Input.new(view.actionInput).h(32).disabled(view.actionBusy).accessibility_label("Additional instruction, optional").bg(t.input).border_1().border_color(t.border).rounded(0))
      .when(Boolean(view.actionError), el => el.child(note(view.actionError, true)))
      .child(h_flex().gap(8).justify_between()
        .child(button("cancel-action-prompt", "Cancel", (_event, cx) => closeActionMenu(view, cx), { disabled: view.actionBusy }).track_focus(view.actionCancelFocus).tab_index(0))
        .child(button("launch-action-prompt", view.actionBusy ? "Starting…" : "Open new pane ↗", (_event, cx) => submitActionMenu(view, cx), { primary: true, disabled: view.actionBusy }).track_focus(view.actionLaunchFocus).tab_index(0))));
}

function submitActionMenu(view, cx) {
  const open = view.actionOpen;
  if (!open || view.actionBusy) return;
  open.draft.detail = view.actionInput.value();
  const prompt = actionPrompt(open.choice.action, open.draft.preset, open.draft.detail);
  launchAction(view, { ...open.given, action: open.choice.action, prompt }, cx, () => {
    if (view.actionOpen === open) view.actionOpen = null;
  });
}

function actionMenuKey(view, event, cx) {
  if (!view.actionOpen) return;
  if (event.key === "escape") { cx.stop_propagation(); closeActionMenu(view, cx); return; }
  if (view.actionBusy) return;
  const draft = view.actionOpen.draft, presets = ACTION_PRESETS[view.actionOpen.choice.action];
  const cancel = view.actionCancelFocus.is_focused(), launch = view.actionLaunchFocus.is_focused();
  if (event.key === "tab") {
    cx.stop_propagation();
    if (view.actionInputFocused) (event.modifiers.shift ? view.actionFocus : view.actionCancelFocus).focus();
    else if (cancel) { if (event.modifiers.shift) view.actionInput.focus(); else view.actionLaunchFocus.focus(); }
    else if (launch) { if (event.modifiers.shift) view.actionCancelFocus.focus(); else closeActionMenu(view, cx); }
    else { if (event.modifiers.shift) view.actionLaunchFocus.focus(); else view.actionInput.focus(); }
    return;
  }
  if (view.actionInputFocused) return;
  if (["enter", "space"].includes(event.key)) {
    cx.stop_propagation();
    if (cancel) closeActionMenu(view, cx);
    else if (launch) submitActionMenu(view, cx);
    return;
  }
  if (cancel || launch || !["up", "down", "home", "end"].includes(event.key)) return;
  cx.stop_propagation();
  invalidateAction(view);
  draft.preset = event.key === "home" ? 0 : event.key === "end" ? presets.length - 1 : (draft.preset + (event.key === "down" ? 1 : presets.length - 1)) % presets.length;
  view.actionError = ""; cx.notify();
}
