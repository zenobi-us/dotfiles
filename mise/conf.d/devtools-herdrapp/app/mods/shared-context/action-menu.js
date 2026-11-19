// Action menus retain preset and pane/tab choices in drafts; successful launches clear additional instructions.
import { div } from "gpui-kit";
import { h_flex, v_flex, Popup, Input, InputState } from "gpui-base";
import { theme } from "herdr";
import { button, note } from "./ui.js";
import { ACTION_PRESETS, actionPrompt } from "./action-model.js";
import { launchAction, invalidateAction } from "./action.js";
import { recordReasonButton } from "./header-controls.js";

export function initActionMenus(view, cx) {
  invalidateAction(view); view.actionOpen = null;
  view.recordActionsOpen = null;
  view.recordContextOpen = null;
  view.recordActionsFocus = cx.focus_handle();
  view.recordPrimaryFocus = cx.focus_handle();
  view.actionDrafts = new Map();
  view.actionTriggerFocus = new Map(Object.keys(ACTION_PRESETS).map(action => [action, cx.focus_handle()]));
  view.actionFocus = cx.focus_handle();
  view.actionDestinationFocus = cx.focus_handle();
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

export function recordActionControl(view, choices, primary, given, status, palette, reason) {
  const t = theme(), key = JSON.stringify([given.cwd, given.kind, given.id]);
  const otherChoices = choices.filter(choice => choice.action !== primary?.action);
  const pickerShown = view.recordActionsOpen === key;
  const promptShown = view.actionOpen?.given.id === given.id && view.actionOpen?.given.kind === given.kind;
  const label = primary?.label ?? view.snapshot?.states?.[given.id]?.next ?? status?.value ?? "No next action";
  const disabled = view.actionBusy || !primary || Boolean(primary.disabledReason);
  const showPicker = cx => {
    if (view.actionBusy) return;
    view.referenceOpen = null;
    if (pickerShown) { view.recordActionsOpen = null; view.recordActionsFocus.focus(); }
    else {
      if (view.actionOpen) closeActionMenu(view, cx, false);
      view.recordActionsOpen = key;
      view.recordActionIndex = Math.max(0, otherChoices.findIndex(choice => !choice.disabledReason));
      view.actionFocus.focus();
    }
    cx.notify();
  };
  const trigger = h_flex().min_w(0).max_w("100%").border_1().border_color(palette.border).bg(palette.value)
    .child(recordReasonButton(view, reason, label, palette))
    .child(button("record-next-action", "", (_event, cx) => openActionMenu(view, primary, given, cx, view.recordPrimaryFocus), {
      disabled, label: primary ? `Next action: ${label}${primary.disabledReason ? `. ${primary.disabledReason}` : ". Open action prompt."}` : `No next action. ${label}`,
    }).track_focus(view.recordPrimaryFocus).tab_index(0).h("auto").min_h(34).min_w(0).px(10).py(5).bg(palette.value).text_color(palette.valueText)
      .tooltip(primary?.disabledReason ?? (primary ? `Open ${label} prompt` : "No workflow action is recommended"))
      .child(v_flex().min_w(0).gap(2)
        .child(div().text_size(9).text_color(palette.labelText).child(primary ? "Next action" : "No next action"))
        .child(div().whitespace_normal().text_size(11).child(label))))
    .child(button("record-other-actions", "▾", (_event, cx) => showPicker(cx), { disabled: view.actionBusy || !otherChoices.length, label: "Other record actions" })
      .track_focus(view.recordActionsFocus).tab_index(0).w(30).px(0).h("auto").min_h(34).border_l(1).border_color(palette.border).bg(palette.label).text_color(palette.labelText)
      .on_key_down((event, cx) => { if (["enter", "space", "down", "up"].includes(event.key)) { cx.stop_propagation(); showPicker(cx); } }));
  const picker = () => v_flex().id("record-actions-menu").role("menu").w(320).max_w("100%").max_h(480).overflow_y_scrollbar().p(6).gap(2).border_1().border_color(t.border).bg(t.popover)
    .track_focus(view.actionFocus).tab_index(0).accessibility_label("Other record actions")
    .on_mouse_down_out((_event, cx) => { view.recordActionsOpen = null; cx.notify(); })
    .on_key_down((event, cx) => {
      if (event.key === "escape" || event.key === "tab") { view.recordActionsOpen = null; view.recordActionsFocus.focus(); cx.stop_propagation(); cx.notify(); return; }
      const enabled = otherChoices.map((choice, index) => choice.disabledReason ? -1 : index).filter(index => index >= 0);
      if (!enabled.length) return;
      if (event.key === "enter" || event.key === "space") { cx.stop_propagation(); openActionMenu(view, otherChoices[view.recordActionIndex], given, cx, view.recordActionsFocus); return; }
      if (!["up", "down", "home", "end"].includes(event.key)) return;
      cx.stop_propagation();
      const position = enabled.indexOf(view.recordActionIndex);
      view.recordActionIndex = enabled[event.key === "home" ? 0 : event.key === "end" ? enabled.length - 1 : (position + (event.key === "down" ? 1 : enabled.length - 1)) % enabled.length];
      cx.notify();
    })
    .children(otherChoices.map((choice, index) => button(`record-action:${choice.action}`, "", (_event, cx) => openActionMenu(view, choice, given, cx, view.recordActionsFocus), { disabled: view.actionBusy || Boolean(choice.disabledReason), label: `${choice.label}${choice.disabledReason ? `. ${choice.disabledReason}` : ""}`, height: "auto" })
      .role("menu_item").tab_stop(false).w_full().min_h(34).py(8).bg(index === view.recordActionIndex ? t.selected : t.popover).tooltip(choice.disabledReason ?? `Open ${choice.label} prompt`)
      .child(v_flex().w_full().min_w(0).gap(4)
        .child(div().whitespace_normal().child(choice.label))
        .when(Boolean(choice.disabledReason), el => el.child(div().whitespace_normal().text_size(10).text_color(t.muted).child(choice.disabledReason))))));
  return Popup.new("record-action-popup", trigger)
    .when(pickerShown || promptShown, el => el.content(promptShown ? actionMenuContent(view) : picker()));
}

export function recordContextMenu(view, row, trigger, disabled) {
  const key = row.path, kind = row.type;
  const selected = view.selected?.id === row.record.id && view.selected?.kind === kind;
  const shown = view.recordContextOpen === key;
  const open = cx => {
    if (disabled || view.actionBusy) return;
    view.choose(row.record, kind, cx);
    invalidateAction(view);
    view.actionOpen = null;
    view.recordActionsOpen = null;
    view.recordContextOpen = key;
    view.recordContextIndex = 0;
    view.actionFocus.focus(); cx.notify();
  };
  const close = cx => { view.recordContextOpen = null; view.focus.focus(); cx.notify(); };
  const given = { cwd: view.context.repository, machine: view.where.machine, space: view.where.space, id: row.record.id, kind };
  const choices = selected ? view.detail?.actions ?? [] : [];
  const enabled = choices.filter(choice => !choice.disabledReason);
  const choose = (choice, cx) => {
    view.recordContextOpen = null;
    openActionMenu(view, choice, given, cx);
  };
  const t = theme();
  return Popup.new(`record-context:${key}`, trigger
    .on_mouse_down("right", (_event, cx) => { cx.stop_propagation(); open(cx); })
    .on_key_down((event, cx) => {
      if (event.key === "f10" && event.modifiers.shift || event.key === "contextmenu") { cx.stop_propagation(); open(cx); }
    })).w_full().flex_none()
    .when(shown, el => el.content(v_flex().id(`record-context-menu:${key}`).role("menu")
      .accessibility_label(`Actions for ${row.record.title}`).w(320).max_h(480).overflow_y_scrollbar().p(6).gap(2).border_1().border_color(t.border).bg(t.popover)
      .track_focus(view.actionFocus).tab_index(0)
      .on_mouse_down_out((_event, cx) => close(cx))
      .on_key_down((event, cx) => {
        if (event.key === "escape" || event.key === "tab") { cx.stop_propagation(); close(cx); return; }
        if (!enabled.length) return;
        const index = Math.min(view.recordContextIndex ?? 0, enabled.length - 1);
        if (event.key === "enter" || event.key === "space") { cx.stop_propagation(); choose(enabled[index], cx); return; }
        if (!["up", "down", "home", "end"].includes(event.key)) return;
        cx.stop_propagation();
        view.recordContextIndex = event.key === "home" ? 0 : event.key === "end" ? enabled.length - 1 : (index + (event.key === "down" ? 1 : enabled.length - 1)) % enabled.length;
        cx.notify();
      })
      .children(choices.length ? choices.map(choice => button(`context-action:${key}:${choice.action}`, choice.label, (_event, cx) => choose(choice, cx), {
        disabled: view.actionBusy || Boolean(choice.disabledReason), label: `${choice.label}${choice.disabledReason ? `. ${choice.disabledReason}` : ""}`,
      }).role("menu_item").tab_stop(false).w_full().bg(enabled[view.recordContextIndex ?? 0] === choice ? t.selected : t.popover).tooltip(choice.disabledReason ?? `Open ${choice.label} prompt`))
        : [note(view.detailError || (view.detailLoading || !selected ? "Loading actions…" : "No actions available."), Boolean(view.detailError))])));
}

function openActionMenu(view, choice, given, cx, returnFocus) {
  if (view.actionBusy || !choice || choice.disabledReason) return;
  view.recordActionsOpen = null;
  view.recordContextOpen = null;
  view.referenceOpen = null;
  const key = JSON.stringify([given.cwd, given.kind, given.id, choice.action]);
  let draft = view.actionDrafts.get(key);
  if (!draft) { draft = { preset: 0, detail: "", destination: "pane" }; view.actionDrafts.set(key, draft); }
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
  return v_flex().id("action-prompt-menu").role("dialog").accessibility_label(`${open.choice.label}: preset, launch destination and additional instruction`)
    .w(360).max_w("100%").max_h(500).overflow_y_scrollbar().rounded(0).border_1().border_color(t.border).bg(t.popover).text_color(t.foreground).text_size(13).font_family("JetBrains Mono")
    .on_mouse_down_out((_event, cx) => closeActionMenu(view, cx, false))
    .on_key_down((event, cx) => actionMenuKey(view, event, cx))
    .child(v_flex().p(12).gap(5)
      .child(div().font_semibold().child(open.choice.label))
      .child(div().text_size(11).text_color(t.muted).child("Choose a preset, then add optional detail.")))
    .child(v_flex().role("list_box").accessibility_label(`${open.choice.label} presets`).track_focus(view.actionFocus).tab_index(0).px(6).pb(8).gap(2).children(rows))
    .child(v_flex().px(12).pb(12).gap(6)
      .child(div().text_size(11).text_color(t.muted).child("Open in"))
      .child(h_flex().role("list_box").accessibility_label("Launch destination. Use left and right arrows to choose pane or tab.")
        .track_focus(view.actionDestinationFocus).tab_index(0).gap(4)
        .children(["pane", "tab"].map(destination => {
          const selected = open.draft.destination === destination;
          return div().flex_1().role("list_box_option").aria_selected(selected)
            .when(selected, el => el.aria_active_descendant())
            .child(button(`action-destination:${destination}`, `${selected ? "●" : "○"} New ${destination}`, (_event, cx) => {
              if (view.actionBusy) return;
              invalidateAction(view);
              open.draft.destination = destination; view.actionDestinationFocus.focus(); cx.notify();
            }, { disabled: view.actionBusy, label: `New ${destination}${selected ? ". Selected" : ""}` })
              .tab_stop(false).w_full().bg(selected ? t.selected : t.raised)
              .text_color(selected ? t.foreground : t.muted)
              .border_1().border_color(view.actionDestinationFocus.is_focused() && selected ? t.accent : t.border));
        }))))
    .child(v_flex().p(12).gap(8).border_t(1).border_color(t.border)
      .child(div().text_size(11).text_color(t.muted).child("Additional instruction · optional"))
      .child(Input.new(view.actionInput).h(32).disabled(view.actionBusy).accessibility_label("Additional instruction, optional").bg(t.input).border_1().border_color(t.border).rounded(0))
      .when(Boolean(view.actionError), el => el.child(note(view.actionError, true)))
      .child(h_flex().gap(8).justify_between()
        .child(button("cancel-action-prompt", "Cancel", (_event, cx) => closeActionMenu(view, cx), { disabled: view.actionBusy }).track_focus(view.actionCancelFocus).tab_index(0))
        .child(button("launch-action-prompt", view.actionBusy ? "Starting…" : `Open new ${open.draft.destination} ↗`, (_event, cx) => submitActionMenu(view, cx), { primary: true, disabled: view.actionBusy }).track_focus(view.actionLaunchFocus).tab_index(0))));
}

function submitActionMenu(view, cx) {
  const open = view.actionOpen;
  if (!open || view.actionBusy) return;
  open.draft.detail = view.actionInput.value();
  const prompt = actionPrompt(open.choice.action, open.draft.preset, open.draft.detail);
  launchAction(view, { ...open.given, action: open.choice.action, prompt, destination: open.draft.destination }, cx, () => {
    if (view.actionOpen === open) view.actionOpen = null;
    open.draft.detail = "";
    view.actionInput.set_value("");
  });
}

function actionMenuKey(view, event, cx) {
  if (!view.actionOpen) return;
  if (event.key === "escape") { cx.stop_propagation(); closeActionMenu(view, cx); return; }
  if (view.actionBusy) return;
  const draft = view.actionOpen.draft, presets = ACTION_PRESETS[view.actionOpen.choice.action];
  const cancel = view.actionCancelFocus.is_focused(), launch = view.actionLaunchFocus.is_focused();
  const destination = view.actionDestinationFocus.is_focused();
  if (event.key === "tab") {
    cx.stop_propagation();
    if (view.actionInputFocused) (event.modifiers.shift ? view.actionDestinationFocus : view.actionCancelFocus).focus();
    else if (destination) { if (event.modifiers.shift) view.actionFocus.focus(); else view.actionInput.focus(); }
    else if (cancel) { if (event.modifiers.shift) view.actionInput.focus(); else view.actionLaunchFocus.focus(); }
    else if (launch) { if (event.modifiers.shift) view.actionCancelFocus.focus(); else closeActionMenu(view, cx); }
    else { if (event.modifiers.shift) view.actionLaunchFocus.focus(); else view.actionDestinationFocus.focus(); }
    return;
  }
  if (view.actionInputFocused) return;
  if (destination) {
    if (["left", "right", "up", "down", "home", "end"].includes(event.key)) {
      cx.stop_propagation();
      invalidateAction(view);
      draft.destination = event.key === "home" ? "pane" : event.key === "end" ? "tab" : draft.destination === "pane" ? "tab" : "pane";
      cx.notify();
    } else if (["enter", "space"].includes(event.key)) cx.stop_propagation();
    return;
  }
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
